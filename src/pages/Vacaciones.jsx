// src/pages/Vacaciones.jsx
// Vacaciones y suspensiones de labores (RRHH): saldos y control vacacional, registro de suspensiones, calendario anual, proyección,
// estadísticas y catálogo de tipos de suspensión (PLAME tabla 21). Los reportes se pueden exportar a Excel.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Navigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import EmpresaSelector from "../components/common/EmpresaSelector";
import { getPersonal } from "../api/personal";
import {
  getTiposSuspension,
  crearTipoSuspension,
  actualizarTipoSuspension,
  eliminarTipoSuspension,
  generarPeriodosVacacionales,
  actualizarPeriodoVacacional,
  getSuspensiones,
  crearSuspension,
  actualizarSuspension,
  ejecutarSuspension,
  anularSuspension,
  eliminarSuspension,
  getSaldosVacaciones,
  getResumenVacaciones,
  getCalendarioVacaciones,
  getProyeccionVacaciones,
  getVacacionesPorMes,
} from "../api/recursosHumanos/vacaciones";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
const SITUACION = {
  AL_DIA: { etiqueta: "Al día", severidad: "success" },
  PENDIENTE: { etiqueta: "Con pendientes", severidad: "warning" },
  VENCIDA: { etiqueta: "Vencida", severidad: "danger" },
  SIN_PERIODOS: { etiqueta: "Sin periodos", severidad: "info" },
};
const ESTADO_PERIODO = { COMPLETO: "success", PARCIAL: "info", PENDIENTE: "warning", VENCIDO: "danger" };
const ESTADO_SUSPENSION = { PROGRAMADA: "info", EJECUTADA: "success", ANULADA: "danger" };
const moneda = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

const exportarExcel = (nombre, hojas) => {
  const libro = XLSX.utils.book_new();
  for (const [titulo, filas] of Object.entries(hojas)) XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filas), titulo.slice(0, 31));
  XLSX.writeFile(libro, `${nombre}.xlsx`);
};

const Vacaciones = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);
  if (!permisos.tieneAcceso || !permisos.puedeVer) return <Navigate to="/sin-acceso" replace />;

  const toast = useRef(null);
  const usuarioId = usuario?.personalId ? Number(usuario.personalId) : null;
  const [empresaId, setEmpresaId] = useState(null);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [fechaCorte, setFechaCorte] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [tipos, setTipos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [saldos, setSaldos] = useState([]);
  const [filasExpandidas, setFilasExpandidas] = useState(null);
  const [suspensiones, setSuspensiones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [calendario, setCalendario] = useState({ trabajadores: [] });
  const [proyeccion, setProyeccion] = useState({ trabajadores: [] });
  const [resumen, setResumen] = useState(null);
  const [porMes, setPorMes] = useState({ meses: [] });
  const [dialogoSusp, setDialogoSusp] = useState(null); // suspensión en edición o nueva
  const [dialogoTipo, setDialogoTipo] = useState(null);
  const [dialogoVenta, setDialogoVenta] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState("");

  const mostrarError = (error, accionFallida) =>
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 7000 });
  const mostrarOk = (detalle) => toast.current?.show({ severity: "success", summary: "Listo", detail: detalle, life: 4000 });

  const filtros = () => ({ ...(empresaId ? { empresaId } : {}) });

  const cargar = async (cual) => {
    try {
      setCargando(true);
      if (cual === "saldos") setSaldos((await getSaldosVacaciones(filtros())) || []);
      if (cual === "suspensiones") setSuspensiones((await getSuspensiones({ ...filtros(), anio, ...(filtroEstado ? { estado: filtroEstado } : {}) })) || []);
      if (cual === "calendario") setCalendario(await getCalendarioVacaciones({ ...filtros(), anio }));
      if (cual === "proyeccion") setProyeccion(await getProyeccionVacaciones({ ...filtros(), fechaCorte: fechaCorte.toISOString() }));
      if (cual === "estadisticas") {
        setResumen(await getResumenVacaciones(filtros()));
        setPorMes(await getVacacionesPorMes({ ...filtros(), anio }));
      }
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los datos de vacaciones");
    } finally {
      setCargando(false);
    }
  };

  const cargarTipos = async () => {
    try {
      setTipos((await getTiposSuspension()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los tipos de suspensión");
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  useEffect(() => {
    if (!empresaId) return setPersonal([]);
    getPersonal(empresaId)
      .then((data) => setPersonal((data || []).filter((p) => !p.cesado)))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal"));
    cargar("saldos");
    cargar("suspensiones");
  }, [empresaId, anio, filtroEstado]);

  const filtrarTexto = (lista, campo = "trabajador") =>
    lista.filter((x) => !filtroTexto.trim() || String(x[campo] || "").toLowerCase().includes(filtroTexto.trim().toLowerCase()));

  // ── Periodos ──────────────────────────────────────────────
  const generarPeriodos = async () => {
    try {
      setCargando(true);
      const r = await generarPeriodosVacacionales({ empresaId, creadoPor: usuarioId });
      const omitidos = r.omitidos?.length ? ` No se pudieron generar ${r.omitidos.length}: ${r.omitidos.map((o) => `${o.trabajador} (${o.motivo})`).join("; ")}` : "";
      toast.current?.show({
        severity: r.omitidos?.length ? "warn" : "success",
        summary: "Periodos vacacionales",
        detail: `Se crearon ${r.creados} periodo(s) para ${r.trabajadores} trabajador(es).${omitidos}`,
        life: 12000,
      });
      cargar("saldos");
    } catch (error) {
      mostrarError(error, "No se pudieron generar los periodos vacacionales");
    } finally {
      setCargando(false);
    }
  };

  const guardarVenta = async () => {
    try {
      await actualizarPeriodoVacacional(dialogoVenta.id, { diasVendidos: dialogoVenta.diasVendidos ?? 0, actualizadoPor: usuarioId });
      setDialogoVenta(null);
      mostrarOk("Días vendidos actualizados");
      cargar("saldos");
    } catch (error) {
      mostrarError(error, "No se pudieron actualizar los días vendidos");
    }
  };

  // ── Suspensiones ──────────────────────────────────────────
  const nuevaSuspension = (personalId = null, periodoVacacionalId = null) =>
    setDialogoSusp({ personalId, tipoSuspensionLaboralId: tipos.find((t) => t.esDescansoVacacional && t.activo)?.id ?? null, periodoVacacionalId, fechaInicio: null, fechaFin: null, observaciones: "", estado: "PROGRAMADA" });

  const guardarSuspension = async () => {
    const s = dialogoSusp;
    if (!s.personalId) return mostrarError(new Error("Seleccione el trabajador."), "Falta el trabajador");
    if (!s.tipoSuspensionLaboralId) return mostrarError(new Error("Seleccione el tipo de suspensión."), "Falta el tipo de suspensión");
    if (!s.fechaInicio || !s.fechaFin) return mostrarError(new Error("Indique la fecha de inicio y la de fin."), "Faltan las fechas");
    const datos = {
      personalId: Number(s.personalId),
      tipoSuspensionLaboralId: Number(s.tipoSuspensionLaboralId),
      periodoVacacionalId: s.periodoVacacionalId ? Number(s.periodoVacacionalId) : null,
      // Fechas persistidas: ISO de la medianoche local (nunca texto YYYY-MM-DD)
      fechaInicio: new Date(s.fechaInicio).toISOString(),
      fechaFin: new Date(s.fechaFin).toISOString(),
      observaciones: s.observaciones || null,
      estado: s.estado,
    };
    try {
      if (s.id) await actualizarSuspension(s.id, { ...datos, actualizadoPor: usuarioId });
      else await crearSuspension({ ...datos, creadoPor: usuarioId });
      setDialogoSusp(null);
      mostrarOk("Suspensión guardada");
      cargar("suspensiones");
      cargar("saldos");
    } catch (error) {
      mostrarError(error, "No se pudo guardar la suspensión");
    }
  };

  const accionSuspension = (fila, accion) => {
    const ejecutar = async (extra = {}) => {
      try {
        if (accion === "ejecutar") await ejecutarSuspension(fila.id, { actualizadoPor: usuarioId });
        if (accion === "anular") await anularSuspension(fila.id, { ...extra, actualizadoPor: usuarioId });
        if (accion === "eliminar") await eliminarSuspension(fila.id);
        mostrarOk("Hecho");
        cargar("suspensiones");
        cargar("saldos");
      } catch (error) {
        mostrarError(error, "No se pudo completar la acción");
      }
    };
    if (accion === "anular") {
      const motivo = window.prompt("Motivo de la anulación:");
      if (motivo) ejecutar({ motivoAnulacion: motivo });
      return;
    }
    confirmDialog({
      message: accion === "eliminar" ? "¿Eliminar esta suspensión programada?" : "¿Marcar la suspensión como EJECUTADA?",
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => ejecutar(),
    });
  };

  // ── Tipos ─────────────────────────────────────────────────
  const guardarTipo = async () => {
    try {
      const { id, ...datos } = dialogoTipo;
      if (id) await actualizarTipoSuspension(id, { ...datos, actualizadoPor: usuarioId });
      else await crearTipoSuspension({ ...datos, creadoPor: usuarioId });
      setDialogoTipo(null);
      mostrarOk("Tipo de suspensión guardado");
      cargarTipos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el tipo de suspensión");
    }
  };
  const borrarTipo = (tipo) =>
    confirmDialog({
      message: `¿Eliminar el tipo "${tipo.descripcion}"?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarTipoSuspension(tipo.id);
          cargarTipos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar el tipo de suspensión");
        }
      },
    });

  // ── Excel ─────────────────────────────────────────────────
  const excelSaldos = () =>
    exportarExcel("control_vacacional", {
      Resumen: saldos.map((s) => ({
        Trabajador: s.trabajador, Cargo: s.cargo, Ingreso: formatearFecha(s.fechaIngreso), "Rem. mensual": s.remuneracionMensual, "Rem. diaria": s.remuneracionDiaria,
        Derecho: s.totales.derecho, Vendidos: s.totales.vendidos, Gozados: s.totales.gozados, Programados: s.totales.programados, Pendientes: s.totales.pendientes,
        "Monetización gozada": s.totales.monetizacionGozada, "Monetización pendiente": s.totales.monetizacionPendiente, Situación: SITUACION[s.situacion]?.etiqueta,
      })),
      "Control por periodo": saldos.flatMap((s) =>
        s.periodos.flatMap((p) =>
          (p.tramos.length ? p.tramos : [null]).map((t) => ({
            Trabajador: s.trabajador, Periodo: `${formatearFecha(p.fechaInicio)} - ${formatearFecha(p.fechaFin)}`, Derecho: p.diasDerecho, Vendidos: p.diasVendidos,
            Inicio: t ? formatearFecha(t.fechaInicio) : "", Término: t ? formatearFecha(t.fechaFin) : "", Días: t?.dias ?? "", Estado: t?.estado ?? "",
            "Gozados del periodo": p.gozados, "Pendientes del periodo": p.pendientes, "Estado del periodo": p.estado, "Límite de goce": formatearFecha(p.fechaLimiteGoce),
          })),
        ),
      ),
    });
  const excelCalendario = () =>
    exportarExcel(`vacaciones_${calendario.anio}`, {
      Calendario: calendario.trabajadores.map((t) => ({
        Trabajador: t.trabajador, Cargo: t.cargo, "Rem. diaria": t.remuneracionDiaria,
        ...Object.fromEntries(MESES.map((m, i) => [m, t.tramos.reduce((a, x) => a + diasEnMes(x, calendario.anio, i), 0)])),
        "Días gozados": t.diasGozados, "Monetización gozadas": t.monetizacionGozadas, "Días pendientes": t.diasPendientes, "Monetización pendientes": t.monetizacionPendientes,
      })),
    });
  const excelProyeccion = () =>
    exportarExcel("proyeccion_vacaciones", {
      Proyección: proyeccion.trabajadores.map((t) => ({
        Trabajador: t.trabajador, Cargo: t.cargo, "Rem. diaria": t.remuneracionDiaria, "Pendientes al corte": t.pendientesAlCorte,
        "Programados después": t.programadosDespues, "Pendientes finales": t.pendientesFinales, Monetización: t.monetizacion,
      })),
    });

  // Días de un tramo que caen en un mes del año (solo vacaciones y suspensiones del calendario)
  const diasEnMes = (tramo, anioX, mes) => {
    const dia = 86400000;
    const a = Math.max(Math.floor(new Date(tramo.fechaInicio).getTime() / dia), Math.floor(Date.UTC(anioX, mes, 1) / dia));
    const b = Math.min(Math.floor(new Date(tramo.fechaFin).getTime() / dia), Math.floor(Date.UTC(anioX, mes + 1, 0) / dia));
    return Math.max(0, b - a + 1);
  };

  const saldosFiltrados = useMemo(() => filtrarTexto(saldos), [saldos, filtroTexto]);
  const periodosDelPersonal = (id) => saldos.find((s) => s.personalId === Number(id))?.periodos.filter((p) => p.estado !== "COMPLETO") || [];
  const tipoSeleccionado = tipos.find((t) => Number(t.id) === Number(dialogoSusp?.tipoSuspensionLaboralId));
  const barra = (
    <div className="flex flex-wrap gap-2 align-items-end mb-3">
      <div style={{ minWidth: 280 }}>
        <label>Empresa</label>
        <EmpresaSelector empresaId={empresaId} onEmpresaChange={setEmpresaId} />
      </div>
      <div>
        <label>Buscar trabajador</label>
        <InputText value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Nombre" />
      </div>
    </div>
  );
  const aviso = !empresaId && <div className="p-3">Seleccione la empresa para ver las vacaciones y suspensiones de su personal.</div>;

  return (
    <div className="p-fluid" style={{ fontSize: getResponsiveFontSize() }}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <h3>Vacaciones y Suspensiones de Labores</h3>
      {barra}
      {aviso}
      <TabView>
        <TabPanel header="Saldos y control vacacional">
          <div className="flex gap-2 mb-2">
            {permisos.puedeCrear && <Button label="Generar periodos" icon="pi pi-refresh" onClick={generarPeriodos} disabled={!empresaId || cargando} size="small" />}
            <Button label="Excel" icon="pi pi-file-excel" severity="success" outlined size="small" onClick={excelSaldos} disabled={!saldos.length} />
          </div>
          <DataTable
            value={saldosFiltrados}
            loading={cargando}
            dataKey="personalId"
            expandedRows={filasExpandidas}
            onRowToggle={(e) => setFilasExpandidas(e.data)}
            rowExpansionTemplate={(s) => (
              <DataTable value={s.periodos} size="small" emptyMessage="Sin periodos: use Generar periodos (el trabajador necesita fecha de ingreso).">
                <Column header="Periodo" body={(p) => `${p.numeroPeriodo}: ${formatearFecha(p.fechaInicio)} al ${formatearFecha(p.fechaFin)}`} />
                <Column field="diasDerecho" header="Derecho" />
                <Column header="Vendidos" body={(p) => (
                  <span>{p.diasVendidos} {permisos.puedeEditar && <Button icon="pi pi-pencil" text size="small" onClick={() => setDialogoVenta({ id: p.id, diasVendidos: p.diasVendidos })} />}</span>
                )} />
                <Column field="gozados" header="Gozados" />
                <Column field="programados" header="Programados" />
                <Column field="pendientes" header="Pendientes" />
                <Column header="Tramos" body={(p) => p.tramos.map((t) => `${formatearFecha(t.fechaInicio)}-${formatearFecha(t.fechaFin)} (${t.dias}d ${t.estado[0]})`).join(" | ") || "-"} />
                <Column header="Límite de goce" body={(p) => formatearFecha(p.fechaLimiteGoce)} />
                <Column header="Estado" body={(p) => <Tag value={p.estado} severity={ESTADO_PERIODO[p.estado]} />} />
                <Column header="" body={(p) => p.estado !== "COMPLETO" && permisos.puedeCrear && <Button label="Registrar" icon="pi pi-plus" text size="small" onClick={() => nuevaSuspension(s.personalId, p.id)} />} />
              </DataTable>
            )}
            emptyMessage="Sin datos"
          >
            <Column expander style={{ width: "3rem" }} />
            <Column field="trabajador" header="Trabajador" sortable />
            <Column field="cargo" header="Cargo" />
            <Column header="Ingreso" body={(s) => formatearFecha(s.fechaIngreso)} />
            <Column header="Rem. diaria" body={(s) => moneda(s.remuneracionDiaria)} style={{ textAlign: "right" }} />
            <Column header="Gozados" body={(s) => s.totales.gozados} />
            <Column header="Programados" body={(s) => s.totales.programados} />
            <Column header="Pendientes" body={(s) => s.totales.pendientes} sortable sortField="totales.pendientes" />
            <Column header="Monetización pendiente" body={(s) => moneda(s.totales.monetizacionPendiente)} style={{ textAlign: "right" }} />
            <Column header="Situación" body={(s) => <Tag value={SITUACION[s.situacion]?.etiqueta} severity={SITUACION[s.situacion]?.severidad} />} />
          </DataTable>
        </TabPanel>

        <TabPanel header="Suspensiones y vacaciones">
          <div className="flex flex-wrap gap-2 mb-2 align-items-end">
            <div>
              <label>Año</label>
              <InputNumber value={anio} onValueChange={(e) => setAnio(e.value)} useGrouping={false} min={2000} max={2100} />
            </div>
            <div>
              <label>Estado</label>
              <Dropdown value={filtroEstado} onChange={(e) => setFiltroEstado(e.value)} showClear placeholder="Todos" options={["PROGRAMADA", "EJECUTADA", "ANULADA"]} />
            </div>
            {permisos.puedeCrear && <Button label="Nueva" icon="pi pi-plus" onClick={() => nuevaSuspension()} disabled={!empresaId} size="small" />}
          </div>
          <DataTable value={suspensiones.filter((s) => !filtroTexto.trim() || `${s.personal.apellidos} ${s.personal.nombres}`.toLowerCase().includes(filtroTexto.trim().toLowerCase()))} loading={cargando} emptyMessage="Sin suspensiones">
            <Column header="Trabajador" body={(s) => `${s.personal.apellidos} ${s.personal.nombres}`} />
            <Column header="Tipo" body={(s) => `${s.tipoSuspensionLaboral.codigoPlame} ${s.tipoSuspensionLaboral.descripcion}`} />
            <Column header="Periodo" body={(s) => (s.periodoVacacional ? `Periodo ${s.periodoVacacional.numeroPeriodo}` : "-")} />
            <Column header="Desde" body={(s) => formatearFecha(s.fechaInicio)} />
            <Column header="Hasta" body={(s) => formatearFecha(s.fechaFin)} />
            <Column field="dias" header="Días" />
            <Column header="Estado" body={(s) => <Tag value={s.estado} severity={ESTADO_SUSPENSION[s.estado]} />} />
            <Column
              header="Acciones"
              body={(s) => (
                <div className="flex gap-1">
                  {permisos.puedeEditar && s.estado !== "ANULADA" && <Button icon="pi pi-pencil" text size="small" onClick={() => setDialogoSusp({ ...s, tipoSuspensionLaboralId: Number(s.tipoSuspensionLaboralId), personalId: Number(s.personalId), periodoVacacionalId: s.periodoVacacionalId ? Number(s.periodoVacacionalId) : null, fechaInicio: new Date(s.fechaInicio), fechaFin: new Date(s.fechaFin) })} />}
                  {permisos.puedeEditar && s.estado === "PROGRAMADA" && <Button icon="pi pi-check" text size="small" severity="success" tooltip="Marcar como ejecutada" onClick={() => accionSuspension(s, "ejecutar")} />}
                  {permisos.puedeEditar && s.estado !== "ANULADA" && <Button icon="pi pi-ban" text size="small" severity="warning" tooltip="Anular" onClick={() => accionSuspension(s, "anular")} />}
                  {permisos.puedeEliminar && s.estado === "PROGRAMADA" && <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => accionSuspension(s, "eliminar")} />}
                </div>
              )}
            />
          </DataTable>
        </TabPanel>

        <TabPanel header="Calendario anual">
          <div className="flex gap-2 mb-2 align-items-end">
            <div><label>Año</label><InputNumber value={anio} onValueChange={(e) => setAnio(e.value)} useGrouping={false} min={2000} max={2100} /></div>
            <Button label="Ver" icon="pi pi-search" onClick={() => cargar("calendario")} disabled={!empresaId} size="small" />
            <Button label="Excel" icon="pi pi-file-excel" severity="success" outlined size="small" onClick={excelCalendario} disabled={!calendario.trabajadores.length} />
          </div>
          <DataTable value={filtrarTexto(calendario.trabajadores)} loading={cargando} emptyMessage="Pulse Ver para cargar el calendario">
            <Column field="trabajador" header="Trabajador" />
            <Column field="cargo" header="Cargo" />
            {MESES.map((m, i) => (
              <Column key={m} header={m} body={(t) => { const d = t.tramos.reduce((a, x) => a + diasEnMes(x, calendario.anio, i), 0); return d ? <b>{d}</b> : ""; }} style={{ textAlign: "center", width: "3.5rem" }} />
            ))}
            <Column field="diasGozados" header="Gozados" />
            <Column header="Monetiz. gozadas" body={(t) => moneda(t.monetizacionGozadas)} style={{ textAlign: "right" }} />
            <Column field="diasPendientes" header="Pendientes" />
            <Column header="Monetiz. pendientes" body={(t) => moneda(t.monetizacionPendientes)} style={{ textAlign: "right" }} />
          </DataTable>
        </TabPanel>

        <TabPanel header="Proyección">
          <div className="flex gap-2 mb-2 align-items-end">
            <div><label>Fecha de corte</label><Calendar value={fechaCorte} onChange={(e) => setFechaCorte(e.value)} dateFormat="dd/mm/yy" showIcon /></div>
            <Button label="Calcular" icon="pi pi-search" onClick={() => cargar("proyeccion")} disabled={!empresaId} size="small" />
            <Button label="Excel" icon="pi pi-file-excel" severity="success" outlined size="small" onClick={excelProyeccion} disabled={!proyeccion.trabajadores.length} />
          </div>
          <DataTable value={filtrarTexto(proyeccion.trabajadores)} loading={cargando} emptyMessage="Pulse Calcular">
            <Column field="trabajador" header="Trabajador" />
            <Column field="cargo" header="Cargo" />
            <Column header="Rem. diaria" body={(t) => moneda(t.remuneracionDiaria)} style={{ textAlign: "right" }} />
            <Column field="pendientesAlCorte" header="Pendientes al corte" />
            <Column field="programadosDespues" header="Programados después" />
            <Column header="Pendientes finales" body={(t) => <span style={{ color: t.pendientesFinales < 0 ? "#c0392b" : undefined }}>{t.pendientesFinales}</span>} />
            <Column header="Monetización" body={(t) => moneda(t.monetizacion)} style={{ textAlign: "right" }} />
          </DataTable>
        </TabPanel>

        <TabPanel header="Estadísticas">
          <Button label="Actualizar" icon="pi pi-refresh" onClick={() => cargar("estadisticas")} disabled={!empresaId} size="small" className="mb-2" style={{ width: "auto" }} />
          {resumen && (
            <>
              <div className="grid">
                {[
                  ["Trabajadores", resumen.trabajadores], ["Al día", resumen.alDia], ["Con pendientes", resumen.conPendientes], ["Con vacaciones vencidas", resumen.vencidas],
                  ["Sin periodos", resumen.sinPeriodos], ["Días pendientes", resumen.diasPendientes], ["Días programados", resumen.diasProgramados], ["Costo pendiente", moneda(resumen.costoPendiente)],
                  ["Periodos completos", resumen.periodosCompletos], ["Completos en un solo tramo", resumen.periodosCompletosEnUnSoloTramo], ["Periodos fraccionados", resumen.periodosFraccionados], ["Periodos vencidos", resumen.periodosVencidos],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="col-6 md:col-3"><div className="surface-card p-3 border-round shadow-1"><div className="text-500">{etiqueta}</div><div className="text-2xl font-bold">{valor}</div></div></div>
                ))}
              </div>
              <h4>Con más días pendientes</h4>
              <DataTable value={resumen.trabajadoresConMasPendientes} size="small">
                <Column field="trabajador" header="Trabajador" /><Column field="pendientes" header="Pendientes" />
                <Column header="Situación" body={(t) => <Tag value={SITUACION[t.situacion]?.etiqueta} severity={SITUACION[t.situacion]?.severidad} />} />
              </DataTable>
              <h4>Vacaciones por mes ({porMes.anio})</h4>
              <DataTable value={porMes.meses} size="small">
                <Column header="Mes" body={(m) => MESES[m.mes - 1]} /><Column field="diasEjecutados" header="Días ejecutados" /><Column field="diasProgramados" header="Días programados" /><Column field="trabajadores" header="Trabajadores" />
              </DataTable>
            </>
          )}
        </TabPanel>

        <TabPanel header="Tipos de suspensión">
          {permisos.puedeCrear && <Button label="Nuevo tipo" icon="pi pi-plus" size="small" className="mb-2" style={{ width: "auto" }} onClick={() => setDialogoTipo({ codigoPlame: "", descripcion: "", esDescansoVacacional: false, esSubsidio: false, conGoceRemuneracion: false, pagaMovilidad: false, activo: true })} />}
          <DataTable value={tipos} emptyMessage="Cree el tipo 23 (S.I. descanso vacacional) y los demás de la tabla 21 de PLAME">
            <Column field="codigoPlame" header="Código PLAME" /><Column field="descripcion" header="Descripción" />
            {[["esDescansoVacacional", "Vacaciones"], ["esSubsidio", "Subsidio"], ["conGoceRemuneracion", "Con goce"], ["pagaMovilidad", "Paga movilidad"], ["activo", "Activo"]].map(([campo, titulo]) => (
              <Column key={campo} header={titulo} body={(t) => (t[campo] ? <i className="pi pi-check text-green-500" /> : <i className="pi pi-minus text-400" />)} />
            ))}
            <Column header="" body={(t) => (
              <div className="flex gap-1">
                {permisos.puedeEditar && <Button icon="pi pi-pencil" text size="small" onClick={() => setDialogoTipo({ ...t })} />}
                {permisos.puedeEliminar && <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => borrarTipo(t)} />}
              </div>
            )} />
          </DataTable>
        </TabPanel>
      </TabView>

      <Dialog header={dialogoSusp?.id ? "Editar suspensión" : "Nueva suspensión"} visible={Boolean(dialogoSusp)} style={{ width: "560px" }} onHide={() => setDialogoSusp(null)} modal>
        {dialogoSusp && (
          <div className="flex flex-column gap-3">
            <div><label>Trabajador *</label>
              <Dropdown value={dialogoSusp.personalId} onChange={(e) => setDialogoSusp({ ...dialogoSusp, personalId: e.value, periodoVacacionalId: null })} options={personal.map((p) => ({ label: `${p.apellidos} ${p.nombres}`, value: Number(p.id) }))} filter placeholder="Seleccione" disabled={Boolean(dialogoSusp.id)} />
            </div>
            <div><label>Tipo *</label>
              <Dropdown value={dialogoSusp.tipoSuspensionLaboralId} onChange={(e) => setDialogoSusp({ ...dialogoSusp, tipoSuspensionLaboralId: e.value, periodoVacacionalId: null })} options={tipos.filter((t) => t.activo || Number(t.id) === Number(dialogoSusp.tipoSuspensionLaboralId)).map((t) => ({ label: `${t.codigoPlame} - ${t.descripcion}`, value: Number(t.id) }))} filter placeholder="Seleccione" />
            </div>
            {tipoSeleccionado?.esDescansoVacacional && (
              <div><label>Periodo vacacional *</label>
                <Dropdown value={dialogoSusp.periodoVacacionalId} onChange={(e) => setDialogoSusp({ ...dialogoSusp, periodoVacacionalId: e.value })} options={periodosDelPersonal(dialogoSusp.personalId).map((p) => ({ label: `Periodo ${p.numeroPeriodo} (${formatearFecha(p.fechaInicio)} - ${formatearFecha(p.fechaFin)}) - ${p.sinProgramar} días libres`, value: p.id }))} placeholder="Seleccione el periodo del que se descuentan los días" emptyMessage="El trabajador no tiene periodos con días libres: use Generar periodos" />
              </div>
            )}
            <div className="flex gap-2">
              <div style={{ flex: 1 }}><label>Desde *</label><Calendar value={dialogoSusp.fechaInicio} onChange={(e) => setDialogoSusp({ ...dialogoSusp, fechaInicio: e.value })} dateFormat="dd/mm/yy" showIcon /></div>
              <div style={{ flex: 1 }}><label>Hasta *</label><Calendar value={dialogoSusp.fechaFin} onChange={(e) => setDialogoSusp({ ...dialogoSusp, fechaFin: e.value })} dateFormat="dd/mm/yy" showIcon /></div>
            </div>
            <div><label>Estado</label><Dropdown value={dialogoSusp.estado} onChange={(e) => setDialogoSusp({ ...dialogoSusp, estado: e.value })} options={["PROGRAMADA", "EJECUTADA"]} /></div>
            <div><label>Observaciones</label><InputTextarea value={dialogoSusp.observaciones || ""} onChange={(e) => setDialogoSusp({ ...dialogoSusp, observaciones: e.target.value })} rows={2} /></div>
            <Button label="Guardar" icon="pi pi-check" onClick={guardarSuspension} />
          </div>
        )}
      </Dialog>

      <Dialog header={dialogoTipo?.id ? "Editar tipo de suspensión" : "Nuevo tipo de suspensión"} visible={Boolean(dialogoTipo)} style={{ width: "520px" }} onHide={() => setDialogoTipo(null)} modal>
        {dialogoTipo && (
          <div className="flex flex-column gap-3">
            <div><label>Código PLAME *</label><InputText value={dialogoTipo.codigoPlame} maxLength={5} onChange={(e) => setDialogoTipo({ ...dialogoTipo, codigoPlame: e.target.value })} /></div>
            <div><label>Descripción *</label><InputText value={dialogoTipo.descripcion} maxLength={150} onChange={(e) => setDialogoTipo({ ...dialogoTipo, descripcion: e.target.value })} /></div>
            {[["esDescansoVacacional", "Es descanso vacacional (consume días del periodo vacacional)"], ["esSubsidio", "Es subsidio (descanso médico, maternidad): lo paga EsSalud"], ["conGoceRemuneracion", "Con goce de remuneración (se paga)"], ["pagaMovilidad", "Se paga la movilidad esos días"], ["activo", "Activo"]].map(([campo, texto]) => (
              <div key={campo} className="flex align-items-center gap-2"><Checkbox inputId={campo} checked={Boolean(dialogoTipo[campo])} onChange={(e) => setDialogoTipo({ ...dialogoTipo, [campo]: e.checked })} /><label htmlFor={campo}>{texto}</label></div>
            ))}
            <Button label="Guardar" icon="pi pi-check" onClick={guardarTipo} />
          </div>
        )}
      </Dialog>

      <Dialog header="Días vendidos del periodo" visible={Boolean(dialogoVenta)} style={{ width: "360px" }} onHide={() => setDialogoVenta(null)} modal>
        {dialogoVenta && (
          <div className="flex flex-column gap-3">
            <label>Días compensados en dinero (no se gozan)</label>
            <InputNumber value={dialogoVenta.diasVendidos} onValueChange={(e) => setDialogoVenta({ ...dialogoVenta, diasVendidos: e.value })} min={0} />
            <Button label="Guardar" icon="pi pi-check" onClick={guardarVenta} />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Vacaciones;
