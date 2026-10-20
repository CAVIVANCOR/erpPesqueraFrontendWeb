// src/pages/tesoreria/PrestamoRelacionado.jsx
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
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import PrestamoRelacionadoForm from "../../components/tesoreria/PrestamoRelacionadoForm";
import {
  getPrestamosRelacionados,
  getPrestamoRelacionadoById,
  deletePrestamoRelacionado,
} from "../../api/tesoreria/prestamosRelacionados";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";
import ReportFormatSelector from "../../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarPrestamosRelacionadosPDF } from "../../components/tesoreria/reports/generarPrestamosRelacionadosPDF";
import { generarPrestamosRelacionadosExcel } from "../../components/tesoreria/reports/generarPrestamosRelacionadosExcel";
import { esPendiente, agruparPorMoneda, formatoMonto } from "../../components/tesoreria/reports/prestamosRelacionadosReporteUtils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };

export default function PrestamoRelacionado({ ruta }) {
  const permisos = usePermissions(ruta);

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({ visible: false, row: null });
  const [globalFilter, setGlobalFilter] = useState("");

  // Filtros
  const [prestamistaSeleccionada, setPrestamistaSeleccionada] = useState(null);
  const [prestatariaSeleccionada, setPrestatariaSeleccionada] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState("TODOS"); // TODOS | SI | NO
  const [filtroPendientes, setFiltroPendientes] = useState("PENDIENTES"); // PENDIENTES | TODOS

  // Reporte (PDF / Excel)
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
      setItems(await getPrestamosRelacionados());
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudieron cargar los préstamos",
        detail: mensajeDeError(err, "Error al consultar los préstamos entre relacionadas"),
        life: 8000,
      });
    }
    setLoading(false);
  };

  const itemsFiltrados = useMemo(() => {
    let filtrados = items;
    if (prestamistaSeleccionada) filtrados = filtrados.filter((i) => Number(i.empresaPrestamistaId) === Number(prestamistaSeleccionada));
    if (prestatariaSeleccionada) filtrados = filtrados.filter((i) => Number(i.empresaPrestatariaId) === Number(prestatariaSeleccionada));
    if (estadoSeleccionado) filtrados = filtrados.filter((i) => Number(i.estadoId) === Number(estadoSeleccionado));
    if (monedaSeleccionada) filtrados = filtrados.filter((i) => Number(i.monedaId) === Number(monedaSeleccionada));
    if (fechaInicio) {
      const desde = new Date(fechaInicio);
      desde.setHours(0, 0, 0, 0);
      filtrados = filtrados.filter((i) => new Date(i.fechaDesembolso) >= desde);
    }
    if (fechaFin) {
      const hasta = new Date(fechaFin);
      hasta.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter((i) => new Date(i.fechaDesembolso) <= hasta);
    }
    if (filtroSaldoInicial === "SI") filtrados = filtrados.filter((i) => i.esSaldoInicial === true);
    if (filtroSaldoInicial === "NO") filtrados = filtrados.filter((i) => i.esSaldoInicial === false);
    if (filtroPendientes === "PENDIENTES") filtrados = filtrados.filter(esPendiente);
    return filtrados;
  }, [items, prestamistaSeleccionada, prestatariaSeleccionada, estadoSeleccionado, monedaSeleccionada, fechaInicio, fechaFin, filtroSaldoInicial, filtroPendientes]);

  // Saldo pendiente de lo que se está viendo, por moneda
  const saldosPendientes = useMemo(() => agruparPorMoneda(itemsFiltrados.filter(esPendiente)), [itemsFiltrados]);

  const handleGenerarReporte = () => {
    setReportData({
      items: itemsFiltrados.filter(esPendiente),
      fechaGeneracion: new Date(),
      titulo: "PRÉSTAMOS ENTRE EMPRESAS RELACIONADAS - SALDOS PENDIENTES",
    });
    setShowFormatSelector(true);
  };

  // Opciones de los filtros: solo lo que existe en los préstamos
  const opciones = useMemo(() => {
    const unicos = (lista) => [...new Map(lista.filter((x) => x?.id).map((x) => [Number(x.id), x])).values()];
    return {
      prestamistas: unicos(items.map((i) => i.empresaPrestamista)).map((e) => ({ label: e.razonSocial, value: Number(e.id) })),
      prestatarias: unicos(items.map((i) => i.empresaPrestataria)).map((e) => ({ label: e.razonSocial, value: Number(e.id) })),
      estados: unicos(items.map((i) => i.estado)).map((e) => ({ label: e.descripcion, value: Number(e.id) })),
      monedas: unicos(items.map((i) => i.moneda)).map((m) => ({ label: m.codigoSunat, value: Number(m.id) })),
    };
  }, [items]);

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para crear registros.", life: 3000 });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para ver o editar registros.", life: 3000 });
      return;
    }
    try {
      const prestamoCompleto = await getPrestamoRelacionadoById(Number(rowData.id));
      setSelected(prestamoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudo cargar el préstamo",
        detail: mensajeDeError(error, "Error al cargar el préstamo entre relacionadas"),
        life: 8000,
      });
    }
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: "No tiene permisos para eliminar registros.", life: 3000 });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deletePrestamoRelacionado(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Préstamo eliminado",
        detail: `El préstamo ${row.numeroPrestamo} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudo eliminar el préstamo",
        detail: mensajeDeError(err, "Error al eliminar el préstamo entre relacionadas"),
        life: 12000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
    await cargarDatos();
  };

  const limpiarFiltros = () => {
    setPrestamistaSeleccionada(null);
    setPrestatariaSeleccionada(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setFechaInicio(null);
    setFechaFin(null);
    setFiltroSaldoInicial("TODOS");
    setFiltroPendientes("PENDIENTES");
    setGlobalFilter("");
  };

  const estadoTemplate = (rowData) => (
    <Tag value={rowData.estado?.descripcion || "N/A"} severity={rowData.estado?.severityColor} />
  );

  const montoTemplate = (campo) => (rowData) =>
    `${rowData.moneda?.simbolo || ""} ${formatearNumero(Number(rowData[campo] || 0), 2)}`;

  const fechaTemplate = (campo) => (rowData) =>
    rowData[campo] ? new Date(rowData[campo]).toLocaleDateString("es-PE") : "-";

  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => onEdit(rowData)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => onDelete(rowData)}
        tooltip="Eliminar"
      />
    </div>
  );

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const filaFlex = { alignItems: "end", display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row", marginBottom: 10 };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea <span style={{ color: "#b71c1c" }}>eliminar</span> el préstamo{" "}
            <b>{confirmState.row ? confirmState.row.numeroPrestamo : ""}</b>?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>Esta acción no se puede deshacer.</span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 320]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} préstamos"
        sortField="fechaDesembolso"
        sortOrder={-1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={permisos.puedeVer || permisos.puedeEditar ? (e) => onEdit(e.data) : undefined}
        globalFilter={globalFilter}
        globalFilterFields={["numeroPrestamo", "observaciones", "empresaPrestamista.razonSocial", "empresaPrestataria.razonSocial"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{ cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default", fontSize: getResponsiveFontSize() }}
        header={
          <div>
            <div style={{ ...filaFlex, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <h2>Préstamos entre Empresas Relacionadas</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length} de {items.length}
                </small>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {saldosPendientes.length === 0 ? (
                    <Tag value="Sin saldos pendientes" severity="success" />
                  ) : (
                    saldosPendientes.map((g) => (
                      <Tag
                        key={g.codigo}
                        severity="warning"
                        style={{ fontWeight: "bold" }}
                        value={`Saldo pendiente ${g.codigo}: ${g.simbolo} ${formatoMonto(g.totales.saldo)} (${g.totales.cantidad})`}
                      />
                    ))
                  )}
                </div>
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="filtroPendientes" style={etiqueta}>Mostrar</label>
                <Button
                  id="filtroPendientes"
                  label={filtroPendientes === "PENDIENTES" ? "PENDIENTES" : "TODOS"}
                  severity={filtroPendientes === "PENDIENTES" ? "warning" : "secondary"}
                  onClick={() => setFiltroPendientes(filtroPendientes === "PENDIENTES" ? "TODOS" : "PENDIENTES")}
                  disabled={loading}
                  style={{ width: "100%", fontWeight: "bold" }}
                  tooltip="Pendientes: préstamos vigentes con saldo por devolver. Clic para ver también los pagados y anulados."
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Reporte"
                  icon="pi pi-file-pdf"
                  severity="info"
                  onClick={handleGenerarReporte}
                  disabled={saldosPendientes.length === 0}
                  tooltip="Reporte de saldos pendientes (PDF / Excel) según los filtros aplicados"
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo (Saldo Inicial)"
                  icon="pi pi-plus"
                  className="p-button-success"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Registrar un préstamo anterior al sistema. Los préstamos nuevos se registran en Tesorería Pendientes."
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter" style={etiqueta}>Búsqueda Global</label>
                <InputText
                  id="globalFilter"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar por número, empresa, observaciones..."
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button
                  icon="pi pi-refresh"
                  severity="info"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({ severity: "success", summary: "Actualizado", detail: "Datos actualizados correctamente desde el servidor", life: 3000 });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.25 }}>
                <Button icon="pi pi-filter-slash" severity="secondary" onClick={limpiarFiltros} disabled={loading} tooltip="Limpiar Filtros" />
              </div>
            </div>

            <div style={filaFlex}>
              <div style={{ flex: 1 }}>
                <label htmlFor="prestamistaFiltro" style={etiqueta}>Empresa Prestamista</label>
                <Dropdown id="prestamistaFiltro" value={prestamistaSeleccionada} options={opciones.prestamistas} onChange={(e) => setPrestamistaSeleccionada(e.value)} placeholder="Todas" showClear filter disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="prestatariaFiltro" style={etiqueta}>Empresa Prestataria</label>
                <Dropdown id="prestatariaFiltro" value={prestatariaSeleccionada} options={opciones.prestatarias} onChange={(e) => setPrestatariaSeleccionada(e.value)} placeholder="Todas" showClear filter disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="estadoFiltro" style={etiqueta}>Estado</label>
                <Dropdown id="estadoFiltro" value={estadoSeleccionado} options={opciones.estados} onChange={(e) => { setEstadoSeleccionado(e.value); if (e.value) setFiltroPendientes("TODOS"); }} placeholder="Todos" showClear disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="monedaFiltro" style={etiqueta}>Moneda</label>
                <Dropdown id="monedaFiltro" value={monedaSeleccionada} options={opciones.monedas} onChange={(e) => setMonedaSeleccionada(e.value)} placeholder="Todas" showClear disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.75 }}>
                <label htmlFor="fechaInicio" style={etiqueta}>F.Desembolso Desde</label>
                <Calendar id="fechaInicio" value={fechaInicio} onChange={(e) => setFechaInicio(e.value)} placeholder="Desde" dateFormat="dd/mm/yy" showIcon disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.75 }}>
                <label htmlFor="fechaFin" style={etiqueta}>F.Desembolso Hasta</label>
                <Calendar id="fechaFin" value={fechaFin} onChange={(e) => setFechaFin(e.value)} placeholder="Hasta" dateFormat="dd/mm/yy" showIcon disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.75 }}>
                <label htmlFor="filtroSaldoInicial" style={etiqueta}>Saldos Iniciales</label>
                <Button
                  id="filtroSaldoInicial"
                  label={filtroSaldoInicial === "TODOS" ? "TODOS" : filtroSaldoInicial === "SI" ? "SALDOS INICIALES" : "NUEVOS"}
                  severity={filtroSaldoInicial === "TODOS" ? "secondary" : filtroSaldoInicial === "SI" ? "warning" : "info"}
                  onClick={() => setFiltroSaldoInicial(filtroSaldoInicial === "TODOS" ? "SI" : filtroSaldoInicial === "SI" ? "NO" : "TODOS")}
                  disabled={loading}
                  style={{ width: "100%", fontWeight: "bold" }}
                  tooltip="Clic para cambiar filtro"
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 70 }} />
        <Column field="numeroPrestamo" header="N° Préstamo" sortable style={{ width: 130 }} />
        <Column field="empresaPrestamista.razonSocial" header="Prestamista" sortable style={{ width: 200 }} />
        <Column field="empresaPrestataria.razonSocial" header="Prestataria" sortable style={{ width: 200 }} />
        <Column field="moneda.codigoSunat" header="Moneda" sortable style={{ width: 90 }} body={(r) => r.moneda?.codigoSunat || "N/A"} />
        <Column field="montoDesembolsado" header="Monto Desembolsado" body={montoTemplate("montoDesembolsado")} style={{ width: 150, textAlign: "right" }} sortable />
        <Column field="capitalDevuelto" header="Capital Devuelto" body={montoTemplate("capitalDevuelto")} style={{ width: 140, textAlign: "right" }} sortable />
        <Column field="saldoCapital" header="Saldo Capital" body={montoTemplate("saldoCapital")} style={{ width: 150, textAlign: "right", fontWeight: "bold" }} sortable />
        <Column field="fechaDesembolso" header="Fecha Desembolso" body={fechaTemplate("fechaDesembolso")} style={{ width: 130, textAlign: "center" }} sortable />
        <Column field="fechaVencimiento" header="Vencimiento" body={fechaTemplate("fechaVencimiento")} style={{ width: 120, textAlign: "center" }} sortable />
        <Column
          field="refOperacionEspecializadaMovCaja"
          header="Operación"
          body={(r) => (r.refOperacionEspecializadaMovCaja ? `#${r.refOperacionEspecializadaMovCaja}` : "-")}
          style={{ width: 100, textAlign: "center" }}
          sortable
        />
        <Column field="estadoId" header="Estado" body={estadoTemplate} style={{ width: 110 }} sortable />
        <Column
          field="esSaldoInicial"
          header="S.I."
          body={(r) =>
            r.esSaldoInicial ? (
              <Tag value="SI" severity="warning" style={{ fontWeight: "bold" }} />
            ) : (
              <Tag value="NO" severity="info" style={{ fontWeight: "bold" }} />
            )
          }
          style={{ width: 80, textAlign: "center" }}
          sortable
        />
        <Column header="Acciones" body={actionBodyTemplate} style={{ width: 120 }} />
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
        title="Préstamos entre Relacionadas - Saldos Pendientes"
      />

      <TemporaryPDFViewer
        visible={showPDFViewer}
        onHide={() => {
          setShowPDFViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generatePDF={generarPrestamosRelacionadosPDF}
        fileName="prestamos_relacionados_saldos.pdf"
      />

      <TemporaryExcelViewer
        visible={showExcelViewer}
        onHide={() => {
          setShowExcelViewer(false);
          setShowFormatSelector(false);
        }}
        data={reportData}
        generateExcel={generarPrestamosRelacionadosExcel}
        fileName="prestamos_relacionados_saldos.xlsx"
      />

      <Dialog
        visible={showDialog}
        onHide={onCancel}
        header={isEdit ? "Editar Préstamo entre Relacionadas" : "Nuevo Préstamo entre Relacionadas (Saldo Inicial)"}
        style={{ width: "1100px" }}
        modal
        maximizable
      >
        <PrestamoRelacionadoForm
          isEdit={isEdit}
          defaultValues={selected}
          onSubmit={onSubmit}
          onCancel={onCancel}
          readOnly={isEdit ? !permisos.puedeEditar : !permisos.puedeCrear}
          puedeCrear={permisos.puedeCrear}
          puedeEliminar={permisos.puedeEliminar}
        />
      </Dialog>
    </div>
  );
}
