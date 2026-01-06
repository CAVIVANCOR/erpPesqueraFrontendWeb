// src/pages/tesoreria/PrestamoBancario.jsx
import React, { useRef, useState, useEffect } from "react";
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
import PrestamoBancarioForm from "../../components/tesoreria/PrestamoBancarioForm";
import {
  getPrestamoBancario,
  deletePrestamoBancario,
  getPrestamoBancarioById,
} from "../../api/tesoreria/prestamoBancarios";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getAllLineaCredito } from "../../api/tesoreria/lineaCredito";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getMonedas } from "../../api/moneda";
import { getEnumsTesoreria } from "../../api/tesoreria/enumsTesoreria";
import { getTipoPrestamo } from "../../api/tesoreria/tipoPrestamo";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";

export default function PrestamoBancario({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [lineasCredito, setLineasCredito] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposPrestamo, setTiposPrestamo] = useState([]);
  const [enums, setEnums] = useState({
    tiposAmortizacion: [],
    frecuenciasPago: [],
    tiposGarantia: [],
  });
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [bancoSeleccionado, setBancoSeleccionado] = useState(null);
  const [lineaCreditoSeleccionada, setLineaCreditoSeleccionada] = useState(null);
  const [tipoPrestamoSeleccionado, setTipoPrestamoSeleccionado] = useState(null);
  const [tipoAmortizacionSeleccionado, setTipoAmortizacionSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [cuentaCorrienteSeleccionada, setCuentaCorrienteSeleccionada] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [fechaContratoInicio, setFechaContratoInicio] = useState(null);
  const [fechaContratoFin, setFechaContratoFin] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtrados = items;

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    if (bancoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.bancoId) === Number(bancoSeleccionado)
      );
    }

    if (lineaCreditoSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.lineaCreditoId) === Number(lineaCreditoSeleccionada)
      );
    }

    if (tipoPrestamoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.tipoPrestamoId) === Number(tipoPrestamoSeleccionado)
      );
    }

    if (tipoAmortizacionSeleccionado) {
      filtrados = filtrados.filter(
        (item) => item.tipoAmortizacion === tipoAmortizacionSeleccionado
      );
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado)
      );
    }

    if (cuentaCorrienteSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.cuentaCorrienteId) === Number(cuentaCorrienteSeleccionada)
      );
    }

    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.monedaId) === Number(monedaSeleccionada)
      );
    }

    if (fechaContratoInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaContrato = new Date(item.fechaContrato);
        const fechaIni = new Date(fechaContratoInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaContrato >= fechaIni;
      });
    }

    if (fechaContratoFin) {
      filtrados = filtrados.filter((item) => {
        const fechaContrato = new Date(item.fechaContrato);
        const fechaFinDia = new Date(fechaContratoFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaContrato <= fechaFinDia;
      });
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    bancoSeleccionado,
    lineaCreditoSeleccionada,
    tipoPrestamoSeleccionado,
    tipoAmortizacionSeleccionado,
    estadoSeleccionado,
    cuentaCorrienteSeleccionada,
    monedaSeleccionada,
    fechaContratoInicio,
    fechaContratoFin,
    items,
  ]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        prestamosData,
        empresasData,
        bancosData,
        lineasData,
        estadosData,
        cuentasData,
        monedasData,
        enumsData,
        tiposPrestamoData,
      ] = await Promise.all([
        getPrestamoBancario(),
        getEmpresas(),
        getBancos(),
        getAllLineaCredito(),
        getEstadosMultiFuncion(),
        getAllCuentaCorriente(),
        getMonedas(),
        getEnumsTesoreria(),
        getTipoPrestamo(),
      ]);

      setItems(prestamosData);
      setEmpresas(empresasData);
      setBancos(bancosData);
      setLineasCredito(lineasData);

      const estadosFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 23 && !e.cesado
      );
      setEstados(estadosFiltrados);

      setCuentasCorrientes(cuentasData);
      setMonedas(monedasData);
      setEnums(enumsData);
      setTiposPrestamo(tiposPrestamoData);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
        life: 3000,
      });
    }
    setLoading(false);
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }

    try {
      const prestamoCompleto = await getPrestamoBancarioById(rowData.id);
      setSelected(prestamoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar préstamo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el préstamo bancario",
        life: 3000,
      });
    }
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
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
      await deletePrestamoBancario(row.id);
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
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo eliminar el préstamo bancario.",
        life: 3000,
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

  const onSubmit = async (resultado) => {
    const esEdicion = isEdit && selected && selected.id;

    if (esEdicion && !permisos.puedeEditar) {
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      toast.current?.show({
        severity: "success",
        summary: esEdicion ? "Préstamo actualizado" : "Préstamo creado",
        detail: esEdicion
          ? "El préstamo bancario fue actualizado correctamente."
          : `Préstamo creado con número: ${resultado.numeroPrestamo}. Ahora puedes agregar documentos.`,
        life: 3000,
      });

      if (esEdicion) {
        const prestamoActualizado = await getPrestamoBancarioById(selected.id);
        setSelected(prestamoActualizado);
      } else {
        const prestamoCompleto = await getPrestamoBancarioById(resultado.id);
        setSelected(prestamoCompleto);
        setIsEdit(true);
      }

      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el préstamo bancario.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setBancoSeleccionado(null);
    setLineaCreditoSeleccionada(null);
    setTipoPrestamoSeleccionado(null);
    setTipoAmortizacionSeleccionado(null);
    setEstadoSeleccionado(null);
    setCuentaCorrienteSeleccionada(null);
    setMonedaSeleccionada(null);
    setFechaContratoInicio(null);
    setFechaContratoFin(null);
    setGlobalFilter("");
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado?.descripcion || "N/A"}
        severity={rowData.estado?.severityColor}
      />
    );
  };

  const tipoPrestamoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.tipoPrestamo?.descripcion || "N/A"}
        severity={rowData.tipoPrestamo?.severityColor || "info"}
      />
    );
  };

  const montoTemplate = (rowData) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
      minimumFractionDigits: 2,
    }).format(rowData.montoAprobado || 0);
  };

  const fechaTemplate = (rowData, field) => {
    if (!rowData[field]) return "N/A";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const actionBodyTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-mr-2"
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            onEdit(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            onDelete(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea <span style={{ color: "#b71c1c" }}>eliminar</span> el préstamo{" "}
            <b>{confirmState.row ? `${confirmState.row.numeroPrestamo}` : ""}</b>?<br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
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
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} préstamos"
        sortField="fechaContrato"
        sortOrder={-1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar ? (e) => onEdit(e.data) : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={[
          "numeroPrestamo",
          "descripcion",
          "empresa.razonSocial",
          "banco.nombre",
          "lineaCredito.numeroLinea",
        ]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor: permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            {/* Fila 1: Título y botones de acción */}
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
                <h2>Préstamos Bancarios</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length} de {items.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear || !empresaSeleccionada}
                  tooltip={
                    !empresaSeleccionada
                      ? "Seleccione una empresa primero"
                      : "Nuevo Préstamo Bancario"
                  }
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail: "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Fila 2: Filtros principales */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="empresaFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Empresa *
                </label>
                <Dropdown
                  id="empresaFiltro"
                  value={empresaSeleccionada}
                  options={empresas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEmpresaSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="bancoFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Banco
                </label>
                <Dropdown
                  id="bancoFiltro"
                  value={bancoSeleccionado}
                  options={bancos.map((b) => ({
                    label: b.nombre,
                    value: Number(b.id),
                  }))}
                  onChange={(e) => setBancoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="lineaCreditoFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Línea Crédito
                </label>
                <Dropdown
                  id="lineaCreditoFiltro"
                  value={lineaCreditoSeleccionada}
                  options={lineasCredito.map((l) => ({
                    label: l.numeroLinea,
                    value: Number(l.id),
                  }))}
                  onChange={(e) => setLineaCreditoSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoPrestamoFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Tipo Préstamo
                </label>
                <Dropdown
                  id="tipoPrestamoFiltro"
                  value={tipoPrestamoSeleccionado}
                  options={tiposPrestamo.map((t) => ({
                    label: t.descripcion,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTipoPrestamoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                  filter
                />
              </div>
            </div>

            {/* Fila 3: Más filtros */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoAmortizacionFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Tipo Amortización
                </label>
                <Dropdown
                  id="tipoAmortizacionFiltro"
                  value={tipoAmortizacionSeleccionado}
                  options={enums.tiposAmortizacion}
                  onChange={(e) => setTipoAmortizacionSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="estadoFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Estado
                </label>
                <Dropdown
                  id="estadoFiltro"
                  value={estadoSeleccionado}
                  options={estados.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="cuentaCorrienteFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Cuenta Corriente
                </label>
                <Dropdown
                  id="cuentaCorrienteFiltro"
                  value={cuentaCorrienteSeleccionada}
                  options={cuentasCorrientes.map((c) => ({
                    label: c.numeroCuenta,
                    value: Number(c.id),
                  }))}
                  onChange={(e) => setCuentaCorrienteSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="monedaFiltro"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Moneda
                </label>
                <Dropdown
                  id="monedaFiltro"
                  value={monedaSeleccionada}
                  options={monedas.map((m) => ({
                    label: m.codigoSunat,
                    value: Number(m.id),
                  }))}
                  onChange={(e) => setMonedaSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Fila 4: Rango de fechas y búsqueda */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="fechaContratoInicio"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Fecha Contrato Desde
                </label>
                <Calendar
                  id="fechaContratoInicio"
                  value={fechaContratoInicio}
                  onChange={(e) => setFechaContratoInicio(e.value)}
                  placeholder="Desde"
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="fechaContratoFin"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Fecha Contrato Hasta
                </label>
                <Calendar
                  id="fechaContratoFin"
                  value={fechaContratoFin}
                  onChange={(e) => setFechaContratoFin(e.value)}
                  placeholder="Hasta"
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="globalFilter"
                  style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}
                >
                  Búsqueda Global
                </label>
                <span className="p-input-icon-left" style={{ width: "100%" }}>
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar por número, descripción..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column field="numeroPrestamo" header="Número" sortable style={{ width: 150 }} />
        <Column field="empresa.razonSocial" header="Empresa" sortable style={{ width: 200 }} />
        <Column field="banco.nombre" header="Banco" sortable style={{ width: 150 }} />
        <Column
          field="moneda.codigoSunat"
          header="Moneda"
          sortable
          style={{ width: 100 }}
          body={(rowData) => rowData.moneda?.codigoSunat || "N/A"}
        />
        <Column
          field="lineaCredito.numeroLinea"
          header="Línea Crédito"
          sortable
          style={{ width: 150 }}
          body={(rowData) => rowData.lineaCredito?.numeroLinea || "N/A"}
        />
        <Column
          field="cuentaCorriente.numeroCuenta"
          header="Cuenta Corriente"
          sortable
          style={{ width: 150 }}
          body={(rowData) => rowData.cuentaCorriente?.numeroCuenta || "N/A"}
        />
        <Column
          field="tipoPrestamo.descripcion"
          header="Tipo"
          body={tipoPrestamoTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="montoAprobado"
          header="Monto Aprobado"
          body={montoTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column
          field="fechaContrato"
          header="Fecha Contrato"
          body={(rowData) => fechaTemplate(rowData, "fechaContrato")}
          style={{ width: 130 }}
          sortable
        />
        <Column
          field="fechaVencimiento"
          header="Vencimiento"
          body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
          style={{ width: 130 }}
          sortable
        />
        <Column
          field="estadoId"
          header="Estado"
          body={estadoTemplate}
          style={{ width: 150 }}
          sortable
        />
        <Column header="Acciones" body={actionBodyTemplate} style={{ width: 120 }} />
      </DataTable>

      <Dialog
        visible={showDialog}
        onHide={onCancel}
        header={isEdit ? "Editar Préstamo Bancario" : "Nuevo Préstamo Bancario"}
      style={{ width: "1300px" }}
        modal
        maximizable
        maximized={true}
      >
        <PrestamoBancarioForm
          isEdit={isEdit}
          defaultValues={selected}
          empresaFija={empresaSeleccionada}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}