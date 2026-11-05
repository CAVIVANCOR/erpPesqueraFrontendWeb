// src/pages/ConceptoPlanilla.jsx
// Conceptos de planilla (ingresos, descuentos, aportes y provisiones). Todo concepto es una fila con vigencia.
// Layout: patrón de LineaCredito.jsx (header con filtros, DataTable con expansión, Dialog maximizado).
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getConceptosPlanilla,
  getConceptoPlanillaById,
  createConceptoPlanilla,
  updateConceptoPlanilla,
  deleteConceptoPlanilla,
} from "../api/recursosHumanos/conceptoPlanilla";
import ConceptoPlanillaForm from "../components/conceptoPlanilla/ConceptoPlanillaForm";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const OPCIONES_NATURALEZA = [
  { label: "Ingresos", value: "ingreso" },
  { label: "Descuentos", value: "descuento" },
  { label: "Aportes del empleador", value: "aporte" },
  { label: "Provisiones", value: "provision" },
];

const AFECTACIONES = [
  ["afectaAfpOnp", "AFP/ONP"],
  ["afectaEssalud", "EsSalud"],
  ["afectaQuintaCategoria", "5ta"],
  ["afectaSctr", "SCTR"],
  ["cuentaParaGratificacion", "Grat."],
  ["cuentaParaCts", "CTS"],
  ["cuentaParaVacaciones", "Vac."],
];

const ConceptoPlanilla = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState(null);
  const [naturalezaFiltro, setNaturalezaFiltro] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  // Personal para mostrar quién creó o modificó cada registro (AuditoriaDialog)
  const [personalAuditoria, setPersonalAuditoria] = useState([]);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    getPersonal()
      .then((data) => setPersonalAuditoria(data || []))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal para la auditoría"));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [naturalezaFiltro]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (naturalezaFiltro) filtros.naturaleza = naturalezaFiltro;
      setConceptos((await getConceptosPlanilla(filtros)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los conceptos de planilla");
    } finally {
      setLoading(false);
    }
  };

  const conceptosFiltrados = conceptos.filter((concepto) => {
    const texto = globalFilter.trim().toLowerCase();
    if (!texto) return true;
    return [concepto.codigo, concepto.descripcion, concepto.codigoPlame].filter(Boolean).join(" ").toLowerCase().includes(texto);
  });

  const handleNew = () => {
    setConceptoSeleccionado(null);
    setVisible(true);
  };

  const handleEdit = async (concepto) => {
    try {
      setLoading(true);
      setConceptoSeleccionado(await getConceptoPlanillaById(concepto.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el concepto de planilla");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setConceptoSeleccionado(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(conceptoSeleccionado);
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateConceptoPlanilla(conceptoSeleccionado.id, { ...data, actualizadoPor: personalId });
      } else {
        await createConceptoPlanilla({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Concepto actualizado correctamente" : "Concepto registrado correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el concepto de planilla");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (concepto) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmDialog({
      message: `¿Está seguro de eliminar el concepto ${concepto.codigo}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deleteConceptoPlanilla(concepto.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Concepto eliminado correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar el concepto de planilla");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const naturalezaBodyTemplate = (concepto) => {
    if (concepto.esDescuento) return <Tag value="DESCUENTO" severity="danger" />;
    if (concepto.esAporteEmpleador) return <Tag value="APORTE EMPLEADOR" severity="warning" />;
    if (concepto.esProvision) return <Tag value="PROVISIÓN" severity="help" />;
    return <Tag value="INGRESO" severity="success" />;
  };

  const calculoBodyTemplate = (concepto) => {
    if (concepto.claveMotor) return <Tag value={`RUTINA: ${concepto.claveMotor}`} severity="info" />;
    if (concepto.formula) return <code style={{ fontSize: "0.85em" }}>{concepto.formula}</code>;
    return <Tag value="MANUAL" severity="secondary" />;
  };

  const afectacionesBodyTemplate = (concepto) => (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {AFECTACIONES.filter(([campo]) => concepto[campo]).map(([campo, etiqueta]) => (
        <Tag key={campo} value={etiqueta} severity="secondary" />
      ))}
    </div>
  );

  const vigenciaBodyTemplate = (concepto) => (
    <span>
      {formatearFecha(concepto.vigenteDesde)} - {concepto.vigenteHasta ? formatearFecha(concepto.vigenteHasta) : "sin fin"}
    </span>
  );

  const accionesBodyTemplate = (concepto) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(concepto)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      {!concepto.esDelSistema && (
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => handleDelete(concepto)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      )}
    </div>
  );

  const cuentaTexto = (cuenta) => (cuenta ? `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}` : "-");

  const rowExpansionTemplate = (concepto) => (
    <div style={{ padding: "0.5rem 1rem" }}>
      <h5 style={{ marginTop: 0 }}>Cuentas contables por categoría del trabajador</h5>
      <DataTable value={concepto.cuentas || []} size="small" showGridlines emptyMessage="Este concepto no tiene cuentas contables asignadas">
        <Column header="Categoría" body={(cuenta) => (cuenta.esPescador ? "Pescador" : cuenta.esObrero ? "Obrero" : "Empleado")} style={{ width: 140 }} />
        <Column header="Cuenta de gasto" body={(cuenta) => cuentaTexto(cuenta.cuentaGasto)} />
        <Column header="Cuenta por pagar" body={(cuenta) => cuentaTexto(cuenta.cuentaPasivo)} />
      </DataTable>
    </div>
  );

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
        <h3 style={{ margin: 0 }}>Conceptos de Planilla</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {conceptosFiltrados.length}</small>
      </div>
      <div style={{ flex: 1.5 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Naturaleza</label>
        <Dropdown value={naturalezaFiltro} options={OPCIONES_NATURALEZA} onChange={(e) => setNaturalezaFiltro(e.value)} placeholder="Todas" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Código, descripción o PLAME" style={{ width: "100%" }} />
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          severity="success"
          raised
          onClick={handleNew}
          disabled={!permisos.puedeCrear || loading}
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nuevo concepto"}
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
        value={conceptosFiltrados}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron conceptos de planilla"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="codigo" header="Código" sortable style={{ width: 170 }} body={(concepto) => <strong>{concepto.codigo}</strong>} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Naturaleza" body={naturalezaBodyTemplate} style={{ width: 160 }} />
        <Column header="Cálculo" body={calculoBodyTemplate} />
        <Column header="Afectaciones" body={afectacionesBodyTemplate} />
        <Column field="codigoPlame" header="PLAME" style={{ width: 80 }} />
        <Column header="Vigencia" body={vigenciaBodyTemplate} style={{ width: 200 }} />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 150 }} />
      </DataTable>

      <Dialog
        header={
          conceptoSeleccionado
            ? permisos.puedeEditar
              ? "Editar Concepto de Planilla"
              : "Ver Concepto de Planilla"
            : "Nuevo Concepto de Planilla"
        }
        visible={visible}
        style={{ width: "1300px" }}
        maximizable
        maximized={true}
        onHide={handleCancel}
        modal
        key={`concepto-${conceptoSeleccionado?.id || "nuevo"}`}
      >
        <ConceptoPlanillaForm
          concepto={conceptoSeleccionado}
          personalAuditoria={personalAuditoria}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={Boolean(conceptoSeleccionado) && !permisos.puedeEditar}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default ConceptoPlanilla;
