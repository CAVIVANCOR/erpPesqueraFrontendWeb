// src/pages/Planilla.jsx
// Planillas: se genera (calcula las boletas), se regenera si está mal y, cuando todo está OK, la aprueban la jefa de
// personal y el gerente general; recién con la aprobación de gerencia se crean las deudas con el personal y el asiento.
// Layout: patrón de LineaCredito.jsx (header con empresa y filtros, DataTable con expansión, Dialog).
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import {
  getPlanillas,
  getPlanillaById,
  generarPlanilla,
  regenerarPlanilla,
  corregirConceptoPlanilla,
  aprobarPlanillaJefePersonal,
  aprobarPlanillaGerencia,
  reabrirPlanilla,
  revertirAprobacionPlanilla,
  getDatosAfpnetMensual,
  getDatosPlameMensual,
  deletePlanilla,
} from "../api/recursosHumanos/planilla";
import PlanillaForm from "../components/planilla/PlanillaForm";
import TemporaryPDFViewer from "../components/reports/TemporaryPDFViewer";
import Plame4taDialog from "../components/planilla/Plame4taDialog";
import { generarBoletaPlanillaPDF } from "../components/planilla/reports/generarBoletaPlanillaPDF";
import { generarAfpnetExcel } from "../components/planilla/reports/generarAfpnetExcel";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

/**
 * Estados de la planilla (EstadoMultiFuncion, tipo "RECURSOS HUMANOS")
 * - 147: PENDIENTE (se puede regenerar y corregir)
 * - 148: APROBADO JEFE PERSONAL
 * - 149: APROBADO GERENCIA (con deudas y asiento contable)
 */
const ESTADO_PLANILLA = { PENDIENTE: 147, APROBADO_JEFE_PERSONAL: 148, APROBADO_GERENCIA: 149 };

const formatearMonto = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

const periodicidadTexto = (planilla) => (planilla.periodicidadDias ? `Cada ${planilla.periodicidadDias} días` : "Por temporada");

const Planilla = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [planillas, setPlanillas] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [empresaId, setEmpresaId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedTrabajadores, setExpandedTrabajadores] = useState({});
  // Corrección manual de un concepto
  const [conceptoCorregir, setConceptoCorregir] = useState(null);
  const [montoCorregido, setMontoCorregido] = useState(null);
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  // Archivo mensual de AFPnet
  const [afpnetVisible, setAfpnetVisible] = useState(false);
  const [afpnetMes, setAfpnetMes] = useState(new Date());
  const [plame4taVisible, setPlame4taVisible] = useState(false);
  // Boleta en PDF de un trabajador
  const [boletaPdf, setBoletaPdf] = useState(null);

  const usuarioId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    cargarDatos();
  }, [empresaId, estadoFiltro]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 6000 });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (empresaId) filtros.empresaId = empresaId;
      if (estadoFiltro) filtros.estadoId = estadoFiltro;
      setPlanillas((await getPlanillas(filtros)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las planillas");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (id) => {
    try {
      const detalle = await getPlanillaById(id);
      setDetalles((actuales) => ({ ...actuales, [id]: detalle }));
    } catch (error) {
      mostrarError(error, "No se pudo cargar el detalle de la planilla");
    }
  };

  // Después de una acción: refresca la lista y el detalle de la planilla afectada
  const refrescar = async (id) => {
    await cargarDatos();
    if (id && expandedRows[id]) await cargarDetalle(id);
  };

  const onRowToggle = async (e) => {
    setExpandedRows(e.data);
    const abiertas = Object.keys(e.data).filter((id) => !detalles[id]);
    await Promise.all(abiertas.map((id) => cargarDetalle(id)));
  };

  const opcionesEstado = [
    ...new Map(planillas.map((p) => [Number(p.estadoId), { label: p.estado?.descripcion, value: Number(p.estadoId) }])).values(),
  ];

  // ── Acciones ───────────────────────────────────────────────

  const handleGenerar = async (data) => {
    if (!permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      const planilla = await generarPlanilla({ ...data, usuarioId });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Planilla generada correctamente", life: 3000 });
      setVisible(false);
      await cargarDatos();
      setDetalles((actuales) => ({ ...actuales, [planilla.id]: planilla }));
      setExpandedRows((actuales) => ({ ...actuales, [planilla.id]: true }));
    } catch (error) {
      mostrarError(error, "No se pudo generar la planilla");
    } finally {
      setGuardando(false);
    }
  };

  // Ejecuta una acción sobre la planilla con confirmación, mensaje de éxito y refresco
  const confirmarAccion = ({ planilla, mensaje, header, icon = "pi pi-question-circle", acceptClassName = "p-button-success", acceptLabel, exito, accion, fallo }) => {
    confirmDialog({
      message: mensaje,
      header,
      icon,
      acceptClassName,
      acceptLabel,
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await accion();
          toast.current?.show({ severity: "success", summary: "Éxito", detail: exito, life: 3000 });
          await refrescar(planilla.id);
        } catch (error) {
          mostrarError(error, fallo);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleRegenerar = (planilla) => {
    if (!permisos.puedeEditar) return denegar("regenerar planillas");
    confirmarAccion({
      planilla,
      header: "Regenerar planilla",
      mensaje: `¿Regenerar "${planilla.descripcion}"? Se borran y recalculan todas las boletas; las correcciones manuales se pierden y la planilla vuelve a PENDIENTE.`,
      acceptLabel: "Sí, regenerar",
      acceptClassName: "p-button-warning",
      exito: "Planilla regenerada correctamente",
      fallo: "No se pudo regenerar la planilla",
      accion: () => regenerarPlanilla(planilla.id, usuarioId),
    });
  };

  const handleAprobarJefe = (planilla) => {
    if (!permisos.puedeEditar) return denegar("aprobar planillas");
    confirmarAccion({
      planilla,
      header: "Aprobar como jefa de personal",
      mensaje: `¿Aprobar "${planilla.descripcion}" como jefa de personal? Luego solo falta la aprobación del gerente general.`,
      acceptLabel: "Sí, aprobar",
      exito: "Planilla aprobada por la jefa de personal",
      fallo: "No se pudo aprobar la planilla",
      accion: () => aprobarPlanillaJefePersonal(planilla.id, usuarioId),
    });
  };

  const handleAprobarGerencia = (planilla) => {
    if (!permisos.puedeEditar) return denegar("aprobar planillas");
    confirmarAccion({
      planilla,
      header: "Aprobar como gerente general",
      mensaje: `¿Aprobar "${planilla.descripcion}" como gerente general? Se crean las deudas con el personal y el asiento contable, y la planilla ya no se podrá regenerar.`,
      acceptLabel: "Sí, aprobar y contabilizar",
      exito: "Planilla aprobada: deudas y asiento contable creados",
      fallo: "No se pudo aprobar la planilla",
      accion: () => aprobarPlanillaGerencia(planilla.id, usuarioId),
    });
  };

  const handleReabrir = (planilla) => {
    if (!permisos.puedeEditar) return denegar("reabrir planillas");
    confirmarAccion({
      planilla,
      header: "Reabrir planilla",
      mensaje: `¿Reabrir "${planilla.descripcion}"? Vuelve a PENDIENTE y se pierde la aprobación de la jefa de personal.`,
      acceptLabel: "Sí, reabrir",
      acceptClassName: "p-button-warning",
      exito: "Planilla reabierta correctamente",
      fallo: "No se pudo reabrir la planilla",
      accion: () => reabrirPlanilla(planilla.id, usuarioId),
    });
  };

  const handleRevertir = (planilla) => {
    if (!permisos.puedeEditar) return denegar("revertir planillas");
    confirmarAccion({
      planilla,
      header: "Revertir aprobación de gerencia",
      icon: "pi pi-exclamation-triangle",
      mensaje: `¿Revertir la aprobación de "${planilla.descripcion}"? Se eliminan las deudas con el personal y el asiento contable que creó. Solo es posible si ninguna deuda tiene pagos.`,
      acceptLabel: "Sí, revertir",
      acceptClassName: "p-button-danger",
      exito: "Aprobación revertida: deudas y asiento eliminados",
      fallo: "No se pudo revertir la aprobación de la planilla",
      accion: () => revertirAprobacionPlanilla(planilla.id, usuarioId),
    });
  };

  // AFPnet se declara una vez al mes (hasta el 5.º día del mes siguiente): consolida todas las planillas del mes de la empresa
  const handleAfpnet = async () => {
    if (!empresaId) {
      toast.current?.show({ severity: "warn", summary: "Atención", detail: "Seleccione la empresa del archivo de AFPnet", life: 4000 });
      return;
    }
    try {
      setLoading(true);
      const anio = afpnetMes.getFullYear();
      const mes = afpnetMes.getMonth() + 1;
      const { filas } = await getDatosAfpnetMensual(empresaId, anio, mes);
      const blob = await generarAfpnetExcel(filas);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `AFPnet_${anio}${String(mes).padStart(2, "0")}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      setAfpnetVisible(false);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: `Archivo de AFPnet generado (${filas.length} trabajadores)`, life: 3000 });
    } catch (error) {
      mostrarError(error, "No se pudo generar el archivo de AFPnet");
    } finally {
      setLoading(false);
    }
  };
  // PLAME: archivo de remuneraciones (.rem) del mes, con el nombre oficial 0601AAAAMMRUC.rem
  const handlePlame = async () => {
    if (!empresaId) {
      toast.current?.show({ severity: "warn", summary: "Atención", detail: "Seleccione la empresa del archivo de PLAME", life: 4000 });
      return;
    }
    try {
      setLoading(true);
      const { nombreArchivo, lineas } = await getDatosPlameMensual(empresaId, afpnetMes.getFullYear(), afpnetMes.getMonth() + 1);
      const blob = new Blob([lineas.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      setAfpnetVisible(false);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: `Archivo ${nombreArchivo} generado (${lineas.length} líneas)`, life: 3000 });
    } catch (error) {
      mostrarError(error, "No se pudo generar el archivo de PLAME");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = (planilla) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmarAccion({
      planilla,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      mensaje: `¿Está seguro de eliminar la planilla "${planilla.descripcion}" con todas sus boletas?`,
      acceptLabel: "Sí, eliminar",
      acceptClassName: "p-button-danger",
      exito: "Planilla eliminada correctamente",
      fallo: "No se pudo eliminar la planilla",
      accion: () => deletePlanilla(planilla.id),
    });
  };

  const abrirCorreccion = (concepto, planillaId) => {
    setConceptoCorregir({ ...concepto, planillaId });
    setMontoCorregido(Number(concepto.monto));
    setMotivoCorreccion("");
  };

  const guardarCorreccion = async () => {
    try {
      setGuardando(true);
      await corregirConceptoPlanilla(conceptoCorregir.id, { monto: montoCorregido, motivoCorreccion, usuarioId });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Concepto corregido correctamente", life: 3000 });
      const planillaId = conceptoCorregir.planillaId;
      setConceptoCorregir(null);
      await refrescar(planillaId);
    } catch (error) {
      mostrarError(error, "No se pudo corregir el concepto");
    } finally {
      setGuardando(false);
    }
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const estadoBodyTemplate = (planilla) => (
    <Tag value={planilla.estado?.descripcion} severity={(planilla.estado?.severityColor || "secondary").toLowerCase()} style={{ fontWeight: "bold" }} />
  );

  const accionesBodyTemplate = (planilla) => {
    const estado = Number(planilla.estadoId);
    return (
      <div className="flex gap-2">
        {estado === ESTADO_PLANILLA.PENDIENTE && (
          <Button icon="pi pi-check" rounded outlined severity="info" onClick={() => handleAprobarJefe(planilla)} disabled={!permisos.puedeEditar} tooltip="Aprobar (jefa de personal)" tooltipOptions={{ position: "top" }} />
        )}
        {estado === ESTADO_PLANILLA.APROBADO_JEFE_PERSONAL && (
          <Button icon="pi pi-verified" rounded outlined severity="success" onClick={() => handleAprobarGerencia(planilla)} disabled={!permisos.puedeEditar} tooltip="Aprobar (gerente general) y contabilizar" tooltipOptions={{ position: "top" }} />
        )}
        {estado !== ESTADO_PLANILLA.APROBADO_GERENCIA && (
          <Button icon="pi pi-refresh" rounded outlined className="p-button-warning" onClick={() => handleRegenerar(planilla)} disabled={!permisos.puedeEditar} tooltip="Regenerar" tooltipOptions={{ position: "top" }} />
        )}
        {estado === ESTADO_PLANILLA.APROBADO_JEFE_PERSONAL && (
          <Button icon="pi pi-undo" rounded outlined severity="secondary" onClick={() => handleReabrir(planilla)} disabled={!permisos.puedeEditar} tooltip="Reabrir" tooltipOptions={{ position: "top" }} />
        )}
        {estado === ESTADO_PLANILLA.APROBADO_GERENCIA && (
          <>
            <Button icon="pi pi-undo" rounded outlined severity="danger" onClick={() => handleRevertir(planilla)} disabled={!permisos.puedeEditar} tooltip="Revertir aprobación (elimina deudas y asiento)" tooltipOptions={{ position: "top" }} />
          </>
        )}
        {estado === ESTADO_PLANILLA.PENDIENTE && (
          <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => handleEliminar(planilla)} disabled={!permisos.puedeEliminar} tooltip="Eliminar" tooltipOptions={{ position: "top" }} />
        )}
      </div>
    );
  };

  const categoriaBodyTemplate = (trabajador) => (
    <Tag
      value={trabajador.esPescador ? "PESCADOR" : trabajador.esObrero ? "OBRERO" : "EMPLEADO"}
      severity={trabajador.esPescador ? "info" : trabajador.esObrero ? "warning" : "success"}
    />
  );

  const naturalezaBodyTemplate = (concepto) => {
    const severidad = { INGRESO: "success", DESCUENTO: "danger", APORTE: "warning", PROVISION: "help" }[concepto.naturaleza];
    return <Tag value={concepto.naturaleza} severity={severidad} />;
  };

  // Conceptos de la boleta de un trabajador (se pueden corregir solo en una planilla PENDIENTE)
  const conceptosExpansionTemplate = (planilla) => (trabajador) => (
    <div style={{ padding: "0.5rem 1rem" }}>
      <DataTable value={trabajador.conceptos || []} size="small" showGridlines emptyMessage="Esta boleta no tiene conceptos">
        <Column field="descripcion" header="Concepto" />
        <Column header="Naturaleza" body={naturalezaBodyTemplate} style={{ width: 140 }} />
        <Column header="Monto" body={(c) => formatearMonto(c.monto)} style={{ width: 130, textAlign: "right" }} />
        <Column
          header="Corrección manual"
          body={(c) =>
            c.corregidoManual ? (
              <span>
                <Tag value="CORREGIDO" severity="warning" /> <small>{c.motivoCorreccion}</small>
              </span>
            ) : null
          }
        />
        <Column
          body={(c) =>
            Number(planilla.estadoId) === ESTADO_PLANILLA.PENDIENTE && (
              <Button icon="pi pi-pencil" rounded outlined className="p-button-warning" onClick={() => abrirCorreccion(c, planilla.id)} disabled={!permisos.puedeEditar} tooltip="Corregir monto" tooltipOptions={{ position: "top" }} />
            )
          }
          style={{ width: 70 }}
        />
      </DataTable>
    </div>
  );

  // Boletas de la planilla (una por trabajador y contrato)
  const rowExpansionTemplate = (planilla) => {
    const detalle = detalles[planilla.id];
    if (!detalle) {
      return (
        <div style={{ padding: "1rem" }}>
          <i className="pi pi-spin pi-spinner" /> Cargando boletas...
        </div>
      );
    }
    return (
      <div style={{ padding: "0.5rem 1rem" }}>
        <h5 style={{ marginTop: 0 }}>Boletas de la planilla</h5>
        <DataTable
          value={detalle.trabajadores || []}
          size="small"
          showGridlines
          dataKey="id"
          expandedRows={expandedTrabajadores}
          onRowToggle={(e) => setExpandedTrabajadores(e.data)}
          rowExpansionTemplate={conceptosExpansionTemplate(detalle)}
          emptyMessage="La planilla no tiene boletas"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Trabajador"
            body={(t) => (
              <div>
                <strong>
                  {t.personal?.apellidos} {t.personal?.nombres}
                </strong>
                <br />
                <small style={{ color: "#666" }}>
                  {t.personal?.numeroDocumento} {t.contratoPersonal?.esLocacionServicios ? "· LOCACIÓN" : ""}
                </small>
              </div>
            )}
          />
          <Column header="Categoría" body={categoriaBodyTemplate} style={{ width: 110 }} />
          <Column header="Días" body={(t) => Number(t.diasTrabajados)} style={{ width: 70, textAlign: "center" }} />
          <Column header="Remuneración" body={(t) => formatearMonto(t.remuneracionBasica)} style={{ width: 130, textAlign: "right" }} />
          <Column header="Ingresos" body={(t) => formatearMonto(t.totalIngresos)} style={{ width: 130, textAlign: "right" }} />
          <Column header="Descuentos" body={(t) => formatearMonto(t.totalDescuentos)} style={{ width: 130, textAlign: "right" }} />
          <Column header="Aportes empleador" body={(t) => formatearMonto(t.totalAportesEmpleador)} style={{ width: 140, textAlign: "right" }} />
          <Column header="Neto a pagar" body={(t) => <strong>{formatearMonto(t.totalNeto)}</strong>} style={{ width: 130, textAlign: "right" }} />
          <Column
            body={(t) => (
              <Button icon="pi pi-file-pdf" rounded outlined severity="danger" onClick={() => setBoletaPdf({ planilla: detalle, trabajador: t })} tooltip="Boleta de pago (PDF)" tooltipOptions={{ position: "top" }} />
            )}
            style={{ width: 70 }}
          />
        </DataTable>
        <small style={{ color: "#666" }}>
          {detalle.aprobadorJefePersonal && `Jefa de personal: ${detalle.aprobadorJefePersonal.apellidos} ${detalle.aprobadorJefePersonal.nombres} (${formatearFecha(detalle.aprobadaJefePersonalEn)}). `}
          {detalle.aprobadorGerente && `Gerente general: ${detalle.aprobadorGerente.apellidos} ${detalle.aprobadorGerente.nombres} (${formatearFecha(detalle.aprobadaGerenteEn)}).`}
        </small>
      </div>
    );
  };

  const header = (
    <div
      style={{
        alignItems: "end",
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
        marginBottom: 15,
      }}
    >
      <div style={{ flex: 2 }}>
        <h3 style={{ margin: 0 }}>Planillas</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {planillas.length}</small>
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Empresa</label>
        <EmpresaSelector permitirLimpiar onEmpresaChange={(id) => setEmpresaId(id)} />
      </div>
      <div style={{ flex: 1.5 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Estado</label>
        <Dropdown value={estadoFiltro} options={opcionesEstado} onChange={(e) => setEstadoFiltro(e.value)} placeholder="Todos" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Generar"
          icon="pi pi-cog"
          className="p-button-success"
          severity="success"
          raised
          onClick={() => setVisible(true)}
          disabled={!permisos.puedeCrear || loading}
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Generar una planilla"}
          style={{ width: "100%" }}
          size="small"
        />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="AFPnet / PLAME"
          icon="pi pi-file-export"
          className="p-button-outlined"
          severity="success"
          onClick={() => setAfpnetVisible(true)}
          disabled={loading}
          tooltip="Archivo mensual de AFPnet"
          tooltipOptions={{ position: "top" }}
          style={{ width: "100%" }}
          size="small"
        />
      </div>
      <div style={{ flex: 0.6 }}>
        <Button icon="pi pi-refresh" className="p-button-outlined p-button-info" onClick={cargarDatos} loading={loading} tooltip="Actualizar" tooltipOptions={{ position: "top" }} style={{ width: "100%" }} size="small" />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={planillas}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron planillas"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        expandedRows={expandedRows}
        onRowToggle={onRowToggle}
        rowExpansionTemplate={rowExpansionTemplate}
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="descripcion" header="Planilla" sortable body={(p) => <strong>{p.descripcion}</strong>} />
        <Column header="Empresa" body={(p) => p.empresa?.razonSocial} />
        <Column header="Periodo" body={(p) => `${formatearFecha(p.fechaInicio)} - ${formatearFecha(p.fechaFin)}`} style={{ width: 190 }} />
        <Column header="Pago" body={periodicidadTexto} style={{ width: 120 }} />
        <Column header="Boletas" body={(p) => p._count?.trabajadores} style={{ width: 80, textAlign: "center" }} />
        <Column header="Ingresos" body={(p) => formatearMonto(p.totalIngresos)} style={{ width: 130, textAlign: "right" }} />
        <Column header="Descuentos" body={(p) => formatearMonto(p.totalDescuentos)} style={{ width: 130, textAlign: "right" }} />
        <Column header="Neto" body={(p) => <strong>{formatearMonto(p.totalNeto)}</strong>} style={{ width: 130, textAlign: "right" }} />
        <Column header="Estado" body={estadoBodyTemplate} style={{ width: 200 }} />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 190 }} />
      </DataTable>

      <TemporaryPDFViewer
        visible={Boolean(boletaPdf)}
        onHide={() => setBoletaPdf(null)}
        data={boletaPdf}
        generatePDF={generarBoletaPlanillaPDF}
        fileName={`boleta_${boletaPdf?.trabajador?.personal?.numeroDocumento || "trabajador"}.pdf`}
        title="Boleta de Pago"
      />

      <Dialog header="Archivos mensuales (AFPnet y PLAME)" visible={afpnetVisible} style={{ width: "460px" }} onHide={() => setAfpnetVisible(false)} modal className="p-fluid">
        <p style={{ marginTop: 0 }}>
          AFPnet y PLAME se declaran una vez al mes (AFPnet, hasta el 5.º día del mes siguiente). Cada archivo reúne todas las planillas de la empresa que terminan en el mes elegido (semanales o quincenales incluidas) y todas deben estar aprobadas por gerencia.
        </p>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Mes de devengue</label>
        <Calendar value={afpnetMes} onChange={(e) => setAfpnetMes(e.value)} view="month" dateFormat="mm/yy" showIcon style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => setAfpnetVisible(false)} />
          <Button type="button" label="PLAME 4ta (.ps4 y .4ta)" icon="pi pi-list-check" severity="info" outlined onClick={() => { setAfpnetVisible(false); setPlame4taVisible(true); }} disabled={!afpnetMes} />
          <Button type="button" label="PLAME (.rem)" icon="pi pi-file" severity="info" outlined onClick={handlePlame} loading={loading} disabled={!afpnetMes} />
          <Button type="button" label="AFPnet (Excel)" icon="pi pi-file-excel" severity="success" onClick={handleAfpnet} loading={loading} disabled={!afpnetMes} />
        </div>
      </Dialog>

      <Plame4taDialog visible={plame4taVisible} onHide={() => setPlame4taVisible(false)} empresaId={empresaId} mes={afpnetMes || new Date()} toast={toast} />

      <Dialog header="Generar Planilla" visible={visible} style={{ width: "800px" }} onHide={() => setVisible(false)} modal className="p-fluid">
        <PlanillaForm empresaFija={empresaId} onSave={handleGenerar} onCancel={() => setVisible(false)} loading={guardando} />
      </Dialog>

      <Dialog
        header={`Corregir concepto - ${conceptoCorregir?.descripcion || ""}`}
        visible={Boolean(conceptoCorregir)}
        style={{ width: "500px" }}
        onHide={() => setConceptoCorregir(null)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label>Nuevo monto (S/) *</label>
          <InputNumber value={montoCorregido} onValueChange={(e) => setMontoCorregido(e.value)} mode="currency" currency="PEN" locale="es-PE" min={0} disabled={guardando} />
          <small style={{ color: "#666" }}>Monto calculado por el sistema: {formatearMonto(conceptoCorregir?.corregidoManual ? conceptoCorregir?.montoCalculado : conceptoCorregir?.monto)}</small>
        </div>
        <div className="field mt-3">
          <label>Motivo de la corrección *</label>
          <InputTextarea value={motivoCorreccion} onChange={(e) => setMotivoCorreccion(e.target.value)} rows={3} maxLength={300} disabled={guardando} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button type="button" label="Cancelar" icon="pi pi-times" onClick={() => setConceptoCorregir(null)} disabled={guardando} className="p-button-warning" severity="warning" raised size="small" />
          <Button type="button" label="Guardar corrección" icon="pi pi-check" onClick={guardarCorreccion} loading={guardando} disabled={guardando} className="p-button-success" severity="success" raised size="small" />
        </div>
      </Dialog>
    </div>
  );
};

export default Planilla;
