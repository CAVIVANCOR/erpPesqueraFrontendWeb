// src/pages/tesoreria/PrestamoEntidad.jsx
// Préstamos con accionistas y terceros (recibidos y otorgados). Misma pantalla que PrestamoRelacionado.jsx.
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import PrestamoEntidadForm from "../../components/tesoreria/PrestamoEntidadForm";
import { getPrestamosEntidad, getPrestamoEntidadById, deletePrestamoEntidad } from "../../api/tesoreria/prestamosEntidad";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";
import ReportFormatSelector from "../../components/reports/ReportFormatSelector";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarPrestamosEntidadPDF } from "../../components/tesoreria/reports/generarPrestamosEntidadPDF";
import { generarPrestamosEntidadExcel } from "../../components/tesoreria/reports/generarPrestamosEntidadExcel";
import { esPendiente, saldosPorSentido, formatoMonto, partesDelPrestamo, rolEmpresa } from "../../components/tesoreria/reports/prestamosEntidadReporteUtils";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };

// Valores internos: OTORGADO = la empresa es el Prestamista; RECIBIDO = la empresa es el Deudor
const ROLES_EMPRESA = [
  { label: "Prestamista", value: "OTORGADO" },
  { label: "Deudor", value: "RECIBIDO" },
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

  // Filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sentidoSeleccionado, setSentidoSeleccionado] = useState(null);
  const [entidadesIds, setEntidadesIds] = useState([]);
  const [tipoContraparte, setTipoContraparte] = useState("TODOS"); // TODOS | ACCIONISTAS | TERCEROS
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [soloSaldosIniciales, setSoloSaldosIniciales] = useState(false);
  const [soloPendientes, setSoloPendientes] = useState(true);

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
      setItems(await getPrestamosEntidad());
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudieron cargar los préstamos",
        detail: mensajeDeError(err, "Error al consultar los préstamos con accionistas y terceros"),
        life: 8000,
      });
    }
    setLoading(false);
  };

  const itemsFiltrados = useMemo(() => {
    let filtrados = items;
    if (empresaSeleccionada) filtrados = filtrados.filter((i) => Number(i.empresaId) === Number(empresaSeleccionada));
    if (sentidoSeleccionado) filtrados = filtrados.filter((i) => i.sentido === sentidoSeleccionado);
    if (entidadesIds.length > 0) filtrados = filtrados.filter((i) => entidadesIds.includes(Number(i.entidadComercialId)));
    if (tipoContraparte !== "TODOS") filtrados = filtrados.filter((i) => Boolean(i.esAccionista) === (tipoContraparte === "ACCIONISTAS"));
    if (estadoSeleccionado) filtrados = filtrados.filter((i) => Number(i.estadoId) === Number(estadoSeleccionado));
    if (monedaSeleccionada) filtrados = filtrados.filter((i) => Number(i.monedaId) === Number(monedaSeleccionada));
    if (rangoFechas?.[0]) {
      const desde = new Date(rangoFechas[0]);
      desde.setHours(0, 0, 0, 0);
      const hasta = new Date(rangoFechas[1] || rangoFechas[0]);
      hasta.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter((i) => {
        const f = new Date(i.fechaDesembolso);
        return f >= desde && f <= hasta;
      });
    }
    if (soloSaldosIniciales) filtrados = filtrados.filter((i) => i.esSaldoInicial === true);
    if (soloPendientes) filtrados = filtrados.filter(esPendiente);
    return filtrados;
  }, [items, empresaSeleccionada, sentidoSeleccionado, entidadesIds, tipoContraparte, estadoSeleccionado, monedaSeleccionada, rangoFechas, soloSaldosIniciales, soloPendientes]);

  // Saldo pendiente de lo que se está viendo, por sentido y moneda
  const saldosPendientes = useMemo(() => saldosPorSentido(itemsFiltrados.filter(esPendiente)), [itemsFiltrados]);

  // Totales por moneda de los préstamos que se ven en la tabla (nunca se suman soles con dólares) y, dentro de cada
  // moneda, por rol de la empresa: lo que presta (Prestamista) y lo que debe (Deudor) no se mezclan.
  // Cada importe va bajo su columna: Monto Desembolsado, Capital Devuelto y Saldo Capital (columnas 7 a 9 de 15).
  const footerTotales = useMemo(() => {
    const monedas = {};
    itemsFiltrados.forEach((prestamo) => {
      const codigo = prestamo.moneda?.codigoSunat;
      if (!codigo) return;
      if (!monedas[codigo]) {
        monedas[codigo] = {
          codigo,
          simbolo: prestamo.moneda?.simbolo || "",
          colorFondo: prestamo.moneda?.colorFondo || undefined,
          sentidos: {},
        };
      }
      const sentidos = monedas[codigo].sentidos;
      if (!sentidos[prestamo.sentido]) {
        sentidos[prestamo.sentido] = { sentido: prestamo.sentido, cantidad: 0, desembolsado: 0, devuelto: 0, saldo: 0 };
      }
      sentidos[prestamo.sentido].cantidad += 1;
      sentidos[prestamo.sentido].desembolsado += Number(prestamo.montoDesembolsado || 0);
      sentidos[prestamo.sentido].devuelto += Number(prestamo.capitalPagado || 0);
      sentidos[prestamo.sentido].saldo += Number(prestamo.saldoCapital || 0);
    });
    const totales = Object.values(monedas).sort((a, b) => a.codigo.localeCompare(b.codigo));
    if (totales.length === 0) return null;

    return (
      <ColumnGroup>
        {totales.flatMap((total) => {
          const importe = (valor) => `${total.simbolo} ${formatearNumero(valor, 2)}`;
          const fondo = total.colorFondo;
          const estiloTitulo = { textAlign: "left", fontWeight: "bold", backgroundColor: fondo, color: "#000" };
          const estiloRotulo = {
            textAlign: "right",
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            backgroundColor: fondo,
            color: "#000",
          };
          const estiloImporte = { textAlign: "right", fontWeight: "bold", backgroundColor: fondo, color: "#000" };
          const estiloVacio = { backgroundColor: fondo };
          // Deudor (RECIBIDO) primero, igual que en los reportes
          const porRol = Object.values(total.sentidos).sort((a, b) => (a.sentido === "RECIBIDO" ? -1 : b.sentido === "RECIBIDO" ? 1 : 0));
          return [
            <Row key={`${total.codigo}-rotulos`}>
              <Column footer={`TOTALES EN ${total.codigo}`} colSpan={6} footerStyle={estiloTitulo} />
              <Column footer="Monto desembolsado" footerStyle={estiloRotulo} />
              <Column footer="Capital devuelto" footerStyle={estiloRotulo} />
              <Column footer="Saldo capital" footerStyle={estiloRotulo} />
              <Column footer="" colSpan={6} footerStyle={estiloVacio} />
            </Row>,
            ...porRol.map((grupo) => (
              <Row key={`${total.codigo}-${grupo.sentido}`}>
                <Column
                  footer={`Empresa como ${rolEmpresa(grupo.sentido)}: ${grupo.cantidad} préstamo${grupo.cantidad === 1 ? "" : "s"} en ${total.codigo}`}
                  colSpan={6}
                  footerStyle={{ ...estiloTitulo, fontWeight: "normal" }}
                />
                <Column footer={importe(grupo.desembolsado)} footerStyle={estiloImporte} />
                <Column footer={importe(grupo.devuelto)} footerStyle={estiloImporte} />
                <Column footer={importe(grupo.saldo)} footerStyle={estiloImporte} />
                <Column footer="" colSpan={6} footerStyle={estiloVacio} />
              </Row>
            )),
          ];
        })}
      </ColumnGroup>
    );
  }, [itemsFiltrados]);

  const handleGenerarReporte = () => {
    setReportData({
      items: itemsFiltrados.filter(esPendiente),
      fechaGeneracion: new Date(),
      titulo: "PRÉSTAMOS CON ACCIONISTAS Y TERCEROS - SALDOS PENDIENTES",
    });
    setShowFormatSelector(true);
  };

  // Opciones de los filtros: solo lo que existe en los préstamos
  const opciones = useMemo(() => {
    const unicos = (lista) => [...new Map(lista.filter((x) => x?.id).map((x) => [Number(x.id), x])).values()];
    return {
      entidades: unicos(items.map((i) => i.entidadComercial))
        .map((e) => ({ label: e.numeroDocumento ? `${e.razonSocial} (${e.numeroDocumento})` : e.razonSocial, value: Number(e.id) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
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
      const prestamoCompleto = await getPrestamoEntidadById(Number(rowData.id));
      setSelected(prestamoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudo cargar el préstamo",
        detail: mensajeDeError(error, "Error al cargar el préstamo con accionista o tercero"),
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
      await deletePrestamoEntidad(row.id);
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
        detail: mensajeDeError(err, "Error al eliminar el préstamo con accionista o tercero"),
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
    setEmpresaSeleccionada(null);
    setSentidoSeleccionado(null);
    setEntidadesIds([]);
    setTipoContraparte("TODOS");
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setRangoFechas(null);
    setSoloSaldosIniciales(false);
    setSoloPendientes(true);
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
        footerColumnGroup={footerTotales}
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
        globalFilterFields={["numeroPrestamo", "observaciones", "empresa.razonSocial", "entidadComercial.razonSocial"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{ cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default", fontSize: getResponsiveFontSize() }}
        header={
          <div>
            <div style={{ ...filaFlex, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <h2>Préstamos con Accionistas y Terceros</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length} de {items.length}
                </small>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {saldosPendientes.length === 0 ? (
                    <Tag value="Sin saldos pendientes" severity="success" />
                  ) : (
                    saldosPendientes.map((g) => (
                      <Tag
                        key={`${g.sentido}-${g.codigo}`}
                        severity={g.sentido === "RECIBIDO" ? "warning" : "success"}
                        style={{ fontWeight: "bold" }}
                        value={`Empresa como ${rolEmpresa(g.sentido)} ${g.codigo}: ${g.simbolo} ${formatoMonto(g.total)}`}
                      />
                    ))
                  )}
                </div>
              </div>
              <div style={{ flex: 0.5 }}>
                <label style={etiqueta}>Mostrar</label>
                <BooleanToggleButton value={soloPendientes} onChange={setSoloPendientes} labelTrue="PENDIENTES" labelFalse="TODOS" severityTrue="warning" severityFalse="secondary" disabled={loading} />
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
                  placeholder="Buscar por número, prestamista, deudor, observaciones..."
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
                <label style={etiqueta}>Empresa</label>
                <EmpresaSelector empresaId={empresaSeleccionada} onEmpresaChange={setEmpresaSeleccionada} permitirLimpiar disabled={loading} />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="sentidoFiltro" style={etiqueta}>La empresa es</label>
                <Dropdown id="sentidoFiltro" value={sentidoSeleccionado} options={ROLES_EMPRESA} onChange={(e) => setSentidoSeleccionado(e.value)} placeholder="Todos" showClear disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="entidadesFiltro" style={etiqueta}>Accionista / Tercero</label>
                <MultiSelect
                  id="entidadesFiltro"
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
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label style={etiqueta}>Tipo</label>
                <Button
                  type="button"
                  label={tipoContraparte}
                  icon={tipoContraparte === "TODOS" ? "pi pi-users" : tipoContraparte === "ACCIONISTAS" ? "pi pi-briefcase" : "pi pi-user"}
                  severity={tipoContraparte === "TODOS" ? "secondary" : tipoContraparte === "ACCIONISTAS" ? "success" : "info"}
                  onClick={() => setTipoContraparte(tipoContraparte === "TODOS" ? "ACCIONISTAS" : tipoContraparte === "ACCIONISTAS" ? "TERCEROS" : "TODOS")}
                  disabled={loading}
                  style={{ width: "100%", fontWeight: "bold" }}
                  tooltip="Clic para cambiar: Todos, Accionistas, Terceros (el Prestamista o el Deudor que no es la empresa)"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="estadoFiltro" style={etiqueta}>Estado</label>
                <Dropdown id="estadoFiltro" value={estadoSeleccionado} options={opciones.estados} onChange={(e) => { setEstadoSeleccionado(e.value); if (e.value) setSoloPendientes(false); }} placeholder="Todos" showClear disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="monedaFiltro" style={etiqueta}>Moneda</label>
                <Dropdown id="monedaFiltro" value={monedaSeleccionada} options={opciones.monedas} onChange={(e) => setMonedaSeleccionada(e.value)} placeholder="Todas" showClear disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1.5 }}>
                <label htmlFor="rangoFechas" style={etiqueta}>Rango F. Desembolso</label>
                <Calendar id="rangoFechas" value={rangoFechas} onChange={(e) => setRangoFechas(e.value)} selectionMode="range" placeholder="Seleccione rango" dateFormat="dd/mm/yy" showIcon showButtonBar disabled={loading} style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 0.75 }}>
                <label style={etiqueta}>Saldos Iniciales</label>
                <BooleanToggleButton value={soloSaldosIniciales} onChange={setSoloSaldosIniciales} labelTrue="SOLO SALDOS INICIALES" labelFalse="TODOS" severityTrue="warning" severityFalse="secondary" disabled={loading} />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 70 }} />
        <Column field="numeroPrestamo" header="N° Préstamo" sortable style={{ width: 130 }} />
        <Column field="empresa.razonSocial" header="Prestamista" body={(r) => partesDelPrestamo(r).prestamista} sortable style={{ width: 240 }} />
        <Column field="entidadComercial.razonSocial" header="Deudor" body={(r) => partesDelPrestamo(r).deudor} sortable style={{ width: 240 }} />
        <Column
          field="sentido"
          header="La empresa es"
          body={(r) => <Tag value={rolEmpresa(r.sentido)} severity={r.sentido === "RECIBIDO" ? "warning" : "success"} style={{ fontWeight: "bold" }} />}
          style={{ width: 130 }}
          sortable
        />
        <Column field="moneda.codigoSunat" header="Moneda" sortable style={{ width: 90 }} body={(r) => r.moneda?.codigoSunat || "N/A"} />
        <Column field="montoDesembolsado" header="Monto Desembolsado" body={montoTemplate("montoDesembolsado")} style={{ width: 150, textAlign: "right" }} sortable />
        <Column field="capitalPagado" header="Capital Devuelto" body={montoTemplate("capitalPagado")} style={{ width: 140, textAlign: "right" }} sortable />
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
        visible={showDialog}
        onHide={onCancel}
        header={isEdit ? "Editar Préstamo con Accionista o Tercero" : "Nuevo Préstamo con Accionista o Tercero (Saldo Inicial)"}
        style={{ width: "1100px" }}
        modal
        maximizable
      >
        <PrestamoEntidadForm
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
