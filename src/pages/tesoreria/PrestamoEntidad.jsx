// src/pages/tesoreria/PrestamoEntidad.jsx
// Préstamos con accionistas y terceros (recibidos y otorgados, solo capital).
// Los préstamos nuevos y sus pagos/cobros se registran en Tesorería; aquí se consultan y se cargan saldos iniciales.
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import { MultiSelect } from "primereact/multiselect";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import PrestamoEntidadForm from "../../components/tesoreria/PrestamoEntidadForm";
import { getPrestamosEntidad, getPrestamoEntidadById, deletePrestamoEntidad } from "../../api/tesoreria/prestamosEntidad";
import ReportFormatSelector from "../../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarPrestamosEntidadPDF } from "../../components/tesoreria/reports/generarPrestamosEntidadPDF";
import { generarPrestamosEntidadExcel } from "../../components/tesoreria/reports/generarPrestamosEntidadExcel";
import { esPendiente } from "../../components/tesoreria/reports/prestamosEntidadReporteUtils";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };
const fechaCorta = (f) => (f ? new Date(f).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "-");
const SENTIDOS = [
  { label: "Recibidos", value: "RECIBIDO" },
  { label: "Otorgados", value: "OTORGADO" },
];

export default function PrestamoEntidad({ ruta }) {
  const permisos = usePermissions(ruta);
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({ visible: false, row: null });
  const [globalFilter, setGlobalFilter] = useState("");

  const [empresaId, setEmpresaId] = useState(null);
  const [sentido, setSentido] = useState(null);
  const [entidadesIds, setEntidadesIds] = useState([]);
  const [tipoContraparte, setTipoContraparte] = useState("TODOS"); // TODOS | ACCIONISTAS | TERCEROS
  const [estadoId, setEstadoId] = useState(null);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [rangoFechas, setRangoFechas] = useState(null);

  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      setItems(await getPrestamosEntidad());
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar los préstamos", detail: mensajeDeError(err, "Error al consultar los préstamos con accionistas y terceros"), life: 8000 });
    }
    setLoading(false);
  };

  const opciones = useMemo(() => {
    const unicos = (lista) => [...new Map(lista.filter((x) => x?.id).map((x) => [Number(x.id), x])).values()];
    const entidades = unicos(items.map((i) => i.entidadComercial))
      .map((e) => ({ label: e.numeroDocumento ? `${e.razonSocial} (${e.numeroDocumento})` : e.razonSocial, value: Number(e.id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return {
      entidades,
      estados: unicos(items.map((i) => i.estado)).map((e) => ({ label: e.descripcion, value: Number(e.id) })),
    };
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    const desde = rangoFechas?.[0] ? new Date(rangoFechas[0]) : null;
    const hasta = rangoFechas?.[0] ? new Date(rangoFechas[1] || rangoFechas[0]) : null;
    desde?.setHours(0, 0, 0, 0);
    hasta?.setHours(23, 59, 59, 999);
    const enRango = (fecha) => !desde || (new Date(fecha) >= desde && new Date(fecha) <= hasta);
    return items.filter(
        (i) =>
          (!empresaId || Number(i.empresaId) === empresaId) &&
          (!sentido || i.sentido === sentido) &&
          (entidadesIds.length === 0 || entidadesIds.includes(Number(i.entidadComercialId))) &&
          (tipoContraparte === "TODOS" || (tipoContraparte === "ACCIONISTAS") === Boolean(i.esAccionista)) &&
          (!estadoId || Number(i.estadoId) === estadoId) &&
          (!soloPendientes || Number(i.saldoCapital) > 0) &&
          enRango(i.fechaDesembolso),
    );
  }, [items, empresaId, sentido, entidadesIds, tipoContraparte, estadoId, soloPendientes, rangoFechas]);

  // Saldo pendiente por sentido y moneda de lo que se está viendo
  const saldos = useMemo(() => {
    const mapa = new Map();
    for (const i of itemsFiltrados.filter((x) => Number(x.saldoCapital) > 0)) {
      const clave = `${i.sentido}-${i.moneda?.simbolo}`;
      mapa.set(clave, { sentido: i.sentido, simbolo: i.moneda?.simbolo, total: (mapa.get(clave)?.total || 0) + Number(i.saldoCapital) });
    }
    return [...mapa.values()];
  }, [itemsFiltrados]);

  const handleGenerarReporte = () => {
    setReportData({
      items: itemsFiltrados.filter(esPendiente),
      fechaGeneracion: new Date(),
      titulo: "PRÉSTAMOS CON ACCIONISTAS Y TERCEROS - SALDOS PENDIENTES",
    });
    setShowFormatSelector(true);
  };

  const abrir = async (row, editar) => {
    try {
      setSelected(await getPrestamoEntidadById(Number(row.id)));
      setIsEdit(editar);
      setShowDialog(true);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudo cargar el préstamo", detail: mensajeDeError(err, "Error al cargar el préstamo"), life: 8000 });
    }
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para crear registros.", life: 3000 });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onDelete = (row) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para eliminar registros.", life: 3000 });
      return;
    }
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deletePrestamoEntidad(row.id);
      toast.current?.show({ severity: "success", summary: "Préstamo eliminado", detail: `El préstamo ${row.numeroPrestamo} fue eliminado correctamente.`, life: 3000 });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "No se pudo eliminar el préstamo", detail: mensajeDeError(err, "Error al eliminar el préstamo"), life: 12000 });
    }
    setLoading(false);
  };

  const cerrar = async (recargar) => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
    if (recargar) await cargarDatos();
  };

  const limpiarFiltros = () => {
    setEmpresaId(null);
    setSentido(null);
    setEntidadesIds([]);
    setTipoContraparte("TODOS");
    setEstadoId(null);
    setSoloPendientes(true);
    setRangoFechas(null);
    setGlobalFilter("");
  };

  if (!permisos.tieneAcceso || !permisos.puedeVer) return <Navigate to="/sin-acceso" replace />;

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={`¿Eliminar el préstamo ${confirmState.row?.numeroPrestamo || ""}? Solo se pueden eliminar préstamos de saldo inicial sin pagos.`}
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 10 }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={etiqueta}>Empresa</label>
          <EmpresaSelector empresaId={empresaId} onEmpresaChange={setEmpresaId} permitirLimpiar />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={etiqueta}>Sentido</label>
          <Dropdown value={sentido} options={SENTIDOS} onChange={(e) => setSentido(e.value)} showClear placeholder="Todos" style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 2, minWidth: 260 }}>
          <label style={etiqueta}>Accionista / Tercero</label>
          <MultiSelect
            value={entidadesIds}
            options={opciones.entidades}
            onChange={(e) => setEntidadesIds(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            display="chip"
            filter
            showSelectAll
            selectAllLabel="Seleccionar Todos"
            maxSelectedLabels={3}
            emptyMessage="No hay accionistas ni terceros con préstamos"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={etiqueta}>Contraparte</label>
          <Button
            type="button"
            label={tipoContraparte === "TODOS" ? "TODOS" : tipoContraparte === "ACCIONISTAS" ? "ACCIONISTAS" : "TERCEROS"}
            icon={tipoContraparte === "TODOS" ? "pi pi-users" : tipoContraparte === "ACCIONISTAS" ? "pi pi-briefcase" : "pi pi-user"}
            severity={tipoContraparte === "TODOS" ? "secondary" : tipoContraparte === "ACCIONISTAS" ? "success" : "info"}
            onClick={() => setTipoContraparte(tipoContraparte === "TODOS" ? "ACCIONISTAS" : tipoContraparte === "ACCIONISTAS" ? "TERCEROS" : "TODOS")}
            style={{ width: "100%", fontWeight: "bold" }}
            tooltip="Clic para cambiar: Todos, Accionistas, Terceros"
            tooltipOptions={{ position: "top" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={etiqueta}>Estado</label>
          <Dropdown value={estadoId} options={opciones.estados} onChange={(e) => setEstadoId(e.value)} showClear placeholder="Todos" style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1.5, minWidth: 220 }}>
          <label style={etiqueta}>Rango F. Desembolso</label>
          <Calendar value={rangoFechas} onChange={(ev) => setRangoFechas(ev.value)} selectionMode="range" placeholder="Seleccione rango" dateFormat="dd/mm/yy" showIcon showButtonBar style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={etiqueta}>Mostrar</label>
          <BooleanToggleButton value={soloPendientes} onChange={setSoloPendientes} labelTrue="SOLO PENDIENTES" labelFalse="TODOS" severityTrue="warning" severityFalse="secondary" icon="pi-filter" />
        </div>
        <Button label="Limpiar" icon="pi pi-filter-slash" className="p-button-text" onClick={limpiarFiltros} style={{ width: "auto" }} />
        <Button label="Reporte" icon="pi pi-file-pdf" severity="info" onClick={handleGenerarReporte} disabled={!itemsFiltrados.some(esPendiente)} tooltip="Reporte de saldos pendientes (PDF / Excel) según los filtros aplicados" style={{ width: "auto" }} />
        <Button label="Nuevo saldo inicial" icon="pi pi-plus" onClick={onNew} disabled={!permisos.puedeCrear} style={{ width: "auto" }} />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 10, fontWeight: "bold" }}>
        {saldos.length === 0 ? <span>Sin saldos pendientes en la vista actual</span> : saldos.map((s) => (
          <span key={`${s.sentido}-${s.simbolo}`}>
            {s.sentido === "RECIBIDO" ? "Por pagar" : "Por cobrar"}: {s.simbolo} {formatearNumero(s.total, 2)}
          </span>
        ))}
      </div>

      <DataTable
        value={itemsFiltrados}
        loading={loading}
        paginator
        rows={15}
        rowsPerPageOptions={[15, 30, 60]}
        stripedRows
        size="small"
        globalFilter={globalFilter}
        globalFilterFields={["numeroPrestamo", "entidadComercial.razonSocial", "empresa.razonSocial"]}
        header={
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar por número, empresa o contraparte" style={{ width: 360 }} />
          </span>
        }
        onRowClick={(e) => abrir(e.data, false)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        emptyMessage="No hay préstamos con los filtros actuales."
        sortField="fechaDesembolso"
        sortOrder={-1}
      >
        <Column field="numeroPrestamo" header="N°" sortable />
        <Column header="Empresa" body={(r) => r.empresa?.razonSocial} sortable sortField="empresa.razonSocial" />
        <Column header="Sentido" body={(r) => <Tag value={r.sentido === "RECIBIDO" ? "Recibido" : "Otorgado"} severity={r.sentido === "RECIBIDO" ? "warning" : "info"} />} sortable sortField="sentido" />
        <Column header="Contraparte" body={(r) => `${r.esAccionista ? "Accionista" : "Tercero"}: ${r.entidadComercial?.razonSocial || ""}`} />
        <Column header="Desembolso" body={(r) => fechaCorta(r.fechaDesembolso)} sortable sortField="fechaDesembolso" />
        <Column header="Vence" body={(r) => fechaCorta(r.fechaVencimiento)} />
        <Column header="Monto" body={(r) => `${r.moneda?.simbolo || ""} ${formatearNumero(r.montoDesembolsado, 2)}`} />
        <Column header="Saldo" body={(r) => `${r.moneda?.simbolo || ""} ${formatearNumero(r.saldoCapital, 2)}`} />
        <Column header="Origen" body={(r) => (r.esSaldoInicial ? "Saldo inicial" : "Tesorería")} />
        <Column header="Estado" body={(r) => <Tag value={r.estado?.descripcion || "N/A"} severity={r.estado?.severityColor} />} />
        <Column
          header="Acciones"
          body={(r) => (
            <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => abrir(r, true)} disabled={!permisos.puedeEditar} tooltip="Editar" />
              <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => onDelete(r)} disabled={!permisos.puedeEliminar} tooltip="Eliminar" />
            </div>
          )}
        />
      </DataTable>

      <ReportFormatSelector
        visible={showFormatSelector}
        onHide={() => setShowFormatSelector(false)}
        onSelectPDF={() => {
          setShowFormatSelector(false);
          setShowPDFViewer(true);
        }}
        onSelectExcel={() => {
          setShowFormatSelector(false);
          setShowExcelViewer(true);
        }}
        title="Préstamos con Accionistas y Terceros - Saldos Pendientes"
      />

      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generatePDF={generarPrestamosEntidadPDF}
        fileName="prestamos_accionistas_terceros_saldos.pdf"
      />

      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generateExcel={generarPrestamosEntidadExcel}
        fileName="prestamos_accionistas_terceros_saldos.xlsx"
      />

      <Dialog
        header={isEdit ? `Préstamo ${selected?.numeroPrestamo || ""}` : selected ? `Préstamo ${selected.numeroPrestamo}` : "Nuevo préstamo (saldo inicial)"}
        visible={showDialog}
        onHide={() => cerrar(false)}
        style={{ width: "90vw", maxWidth: 1000 }}
        modal
      >
        {showDialog && (
          <>
            <PrestamoEntidadForm
              key={selected?.id || "nuevo"}
              prestamo={selected}
              isEdit={isEdit}
              readOnly={Boolean(selected) && !isEdit}
              onSave={() => cerrar(true)}
              onCancel={() => cerrar(false)}
              puedeCrear={permisos.puedeCrear}
              puedeEliminar={permisos.puedeEliminar}
            />
            {selected?.pagos?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>{selected.sentido === "RECIBIDO" ? "Pagos realizados" : "Cobros recibidos"}</h4>
                <DataTable value={selected.pagos} size="small" stripedRows>
                  <Column header="Fecha" body={(p) => fechaCorta(p.fechaPago)} />
                  <Column header="Capital" body={(p) => `${p.moneda?.simbolo || ""} ${formatearNumero(p.montoAplicado, 2)}`} />
                  <Column header="Medio de pago" body={(p) => p.medioPago?.nombre || "-"} />
                  <Column field="numeroOperacion" header="N° operación" />
                  <Column header="Operación Tesorería" body={(p) => (p.refOperacionEspecializadaMovCaja ? `#${p.refOperacionEspecializadaMovCaja}` : "-")} />
                </DataTable>
              </div>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
