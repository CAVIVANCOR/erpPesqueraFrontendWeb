// src/pages/OrdenCompra.jsx
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
import OrdenCompraForm from "../components/ordenCompra/OrdenCompraForm";
import RequerimientoCompraForm from "../components/requerimientoCompra/RequerimientoCompraForm";
import {
  getOrdenesCompra,
  crearOrdenCompra,
  actualizarOrdenCompra,
  eliminarOrdenCompra,
  aprobarOrdenCompra,
  anularOrdenCompra,
  generarOrdenDesdeRequerimiento,
} from "../api/ordenCompra";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getRequerimientosCompra } from "../api/requerimientoCompra";
import { getMonedas } from "../api/moneda";
import { getCentrosCosto } from "../api/centroCosto";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getSeriesDoc } from "../api/serieDoc";
import { getTiposProducto } from "../api/tipoProducto";
import { getAllTipoEstadoProducto } from "../api/tipoEstadoProducto";
import { getAllDestinoProducto } from "../api/destinoProducto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";

export default function OrdenCompra({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequerimientoDialog, setShowRequerimientoDialog] = useState(false);
  const [requerimientoOrigen, setRequerimientoOrigen] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar items cuando cambien los filtros
  useEffect(() => {
    let filtrados = items;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    // Filtro por proveedor
    if (proveedorSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.proveedorId) === Number(proveedorSeleccionado)
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaDocumento);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaDoc >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaDocumento);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaDoc <= fechaFinDia;
      });
    }

    // Filtro por estado
    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado)
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    proveedorSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    items,
  ]);

  // Extraer proveedores únicos de las órdenes
  useEffect(() => {
    const proveedoresMap = new Map();
    items.forEach((item) => {
      if (item.proveedorId && item.proveedor) {
        proveedoresMap.set(item.proveedorId, item.proveedor);
      }
    });
    const proveedoresArray = Array.from(proveedoresMap.values());
    setProveedoresUnicos(proveedoresArray);
  }, [items]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        ordenesData,
        empresasData,
        proveedoresData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        requerimientosData,
        monedasData,
        centrosCostoData,
        tiposDocumentoData,
        seriesDocData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData,
        tiposMovimientoData,
      ] = await Promise.all([
        getOrdenesCompra(),
        getEmpresas(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getRequerimientosCompra(),
        getMonedas(),
        getCentrosCosto(),
        getTiposDocumento(),
        getSeriesDoc(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getAllDestinoProducto(),
        getAllTipoMovEntregaRendir(),
      ]);

      setEmpresas(empresasData);
      setProveedores(proveedoresData);
      setFormasPago(formasPagoData);
      setProductos(productosData);
      setMonedas(monedasData);
      setCentrosCosto(centrosCostoData);
      setTiposDocumento(tiposDocumentoData);
      setSeriesDoc(seriesDocData);
      setTiposProducto(tiposProductoData);
      setTiposEstadoProducto(tiposEstadoProductoData);
      setDestinosProducto(destinosProductoData);
      setTiposMovimiento(tiposMovimientoData);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de documentos de ORDEN DE COMPRA (tipoProvieneDeId = 12)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 12 && !e.cesado
      );
      setEstadosDoc(estadosDocFiltrados);

      // Normalizar órdenes agregando estadoDoc manualmente
      const ordenesNormalizadas = ordenesData.map((orden) => ({
        ...orden,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(orden.estadoId)
        ),
      }));
      setItems(ordenesNormalizadas);

      // Filtrar solo requerimientos aprobados
      const requerimientosAprobados = requerimientosData.filter(
        (r) => r.estadoDocId === 33
      );
      setRequerimientos(requerimientosAprobados);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleEdit = async (rowData) => {
    try {
      // Cargar la orden completa con todos los campos y relaciones
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenCompleta = await getOrdenCompraPorId(rowData.id);

      setEditing(ordenCompleta);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar orden:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la orden para edición",
      });
    }
  };

  const handleDelete = (rowData) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarOrdenCompra(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Orden de compra eliminada correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    const esEdicion = editing && editing.id;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (esEdicion) {
        await actualizarOrdenCompra(editing.id, data);

        // Recargar la orden actualizada con subtotales recalculados
        const { getOrdenCompraPorId } = await import("../api/ordenCompra");
        const ordenActualizada = await getOrdenCompraPorId(editing.id);
        setEditing(ordenActualizada);

        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Orden actualizada. Puedes seguir agregando detalles.",
        });
      } else {
        const resultado = await crearOrdenCompra(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Orden creada exitosamente. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        const { getOrdenCompraPorId } = await import("../api/ordenCompra");
        const ordenCompleta = await getOrdenCompraPorId(resultado.id);
        setEditing(ordenCompleta);
      }

      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing({ empresaId: empresaSeleccionada });
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setProveedorSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      const ordenAprobada = await aprobarOrdenCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Orden Aprobada",
        detail: "La orden se aprobó exitosamente.",
        life: 3000,
      });

      // Recargar la orden completa con todas las relaciones para actualizar el formulario
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenActualizada = await getOrdenCompraPorId(id);
      
      // Actualizar el estado del formulario con la orden aprobada
      setEditing(ordenActualizada);
      
      // Recargar la lista de órdenes
      cargarDatos();
    } catch (err) {
      console.error("Error al aprobar:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "No se pudo aprobar la orden.";
      toast.current.show({
        severity: "error",
        summary: "Error al Aprobar",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id) => {
    setLoading(true);
    try {
      await anularOrdenCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Orden Anulada",
        detail: "La orden se anuló exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo anular.";
      toast.current.show({
        severity: "error",
        summary: "Error al Anular",
        detail: errorMsg,
        life: 5000,
      });
    }
    setLoading(false);
  };

  const handleIrAlOrigen = async (requerimientoId) => {
    try {
      // Cargar el requerimiento completo con todos los campos
      const { getRequerimientoCompraPorId } = await import(
        "../api/requerimientoCompra"
      );
      const requerimientoCompleto = await getRequerimientoCompraPorId(
        requerimientoId
      );

      setRequerimientoOrigen(requerimientoCompleto);
      setShowRequerimientoDialog(true);
    } catch (error) {
      console.error("Error al cargar requerimiento origen:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el requerimiento origen",
        life: 3000,
      });
    }
  };

  const handleGenerarDesdeRequerimiento = async (requerimientoId) => {
    setLoading(true);
    try {
      const resultado = await generarOrdenDesdeRequerimiento(requerimientoId);
      toast.current.show({
        severity: "success",
        summary: "Orden Generada",
        detail: `Orden generada exitosamente desde requerimiento.`,
        life: 5000,
      });
      cargarDatos();

      // Abrir la orden recién creada
      const { getOrdenCompraPorId } = await import("../api/ordenCompra");
      const ordenCompleta = await getOrdenCompraPorId(resultado.id);
      setEditing(ordenCompleta);
      setShowDialog(true);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo generar la orden.",
      });
    }
    setLoading(false);
  };

  const empresaNombre = (rowData) => {
    return rowData.empresa?.razonSocial || "";
  };

  const proveedorNombre = (rowData) => {
    return rowData.proveedor?.razonSocial || "";
  };

  const requerimientoTemplate = (rowData) => {
    return (
      rowData.requerimientoCompra?.numeroDocumento ||
      rowData.requerimientoCompra?.nroDocumento ||
      ""
    );
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoDoc?.descripcion || "";
    let severity = "info";

    if (estado.includes("PENDIENTE")) severity = "warning";
    if (estado.includes("APROBAD")) severity = "success";
    if (estado.includes("ANULAD")) severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const fechaTemplate = (rowData, field) => {
    return formatearFecha(rowData[field], "");
  };

  const monedaTemplate = (rowData) => {
    return rowData.moneda?.codigoSunat || "";
  };

  const tipoCambioTemplate = (rowData) => {
    return rowData.tipoCambio
      ? Number(rowData.tipoCambio).toLocaleString("es-PE", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })
      : "";
  };

  const igvTemplate = (rowData) => {
    return rowData.esExoneradoAlIGV ? (
      <Tag value="EXONERADO" severity="danger" />
    ) : (
      <Tag value="AFECTO" severity="success" />
    );
  };

  const actionBody = (rowData) => (
    <div style={{ display: "flex", flexDirection: "row", gap: "4px", justifyContent: "center", alignItems: "center" }}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        aria-label={permisos.puedeEditar ? "Editar" : "Ver"}
        style={{ padding: "0.25rem" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        aria-label="Eliminar"
        tooltip="Eliminar"
        disabled={!permisos.puedeEliminar}
        style={{ padding: "0.25rem" }}
      />
    </div>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar esta orden de compra?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
        size="small"
        showGridlines
        stripedRows
        sortField="id"
        sortOrder={-1}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Órdenes de Compra</h2>
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                  Empresa*
                </label>
                <Dropdown
                  id="empresaFiltro"
                  value={empresaSeleccionada}
                  options={empresas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEmpresaSeleccionada(e.value)}
                  placeholder="Seleccionar empresa para filtrar"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="proveedorFiltro" style={{ fontWeight: "bold" }}>
                  Proveedor
                </label>
                <Dropdown
                  id="proveedorFiltro"
                  value={proveedorSeleccionado}
                  options={proveedoresUnicos.map((p) => ({
                    label: p.razonSocial,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setProveedorSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
                  Desde
                </label>
                <Calendar
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.value)}
                  placeholder="Fecha inicio"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
                  Hasta
                </label>
                <Calendar
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.value)}
                  placeholder="Fecha fin"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
                  Estado
                </label>
                <Dropdown
                  id="estadoFiltro"
                  value={estadoSeleccionado}
                  options={estadosDoc.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column
          field="numeroDocumento"
          header="N° Documento"
          style={{ width: 140, textAlign: "center" }}
          sortable
        />
        <Column
          field="fechaDocumento"
          header="Fecha Documento"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
          style={{ width: 110, textAlign: "center" }}
          sortable
        />
        <Column
          field="proveedorId"
          header="Proveedor"
          body={proveedorNombre}
          sortable
        />

        <Column
          field="monedaId"
          header="Moneda"
          body={monedaTemplate}
          style={{ width: 80, textAlign: "center" }}
          sortable
        />
        <Column
          field="tipoCambio"
          header="T/C"
          body={tipoCambioTemplate}
          style={{ width: 90, textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          sortable
        />
        <Column
          field="estadoId"
          header="Estado"
          body={estadoTemplate}
          style={{ width: 150, textAlign: "center" }}
          sortable
        />
        <Column
          field="esExoneradoAlIGV"
          header="IGV"
          body={igvTemplate}
          style={{ width: 110, textAlign: "center" }}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 100, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing?.id ? "Editar Orden de Compra" : "Nueva Orden de Compra"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <OrdenCompraForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          proveedores={proveedores}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          tiposDocumento={tiposDocumento}
          seriesDoc={seriesDoc}
          estadosOrden={estadosDoc}
          requerimientos={requerimientos}
          monedas={monedas}
          centrosCosto={centrosCosto}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          onGenerarDesdeRequerimiento={handleGenerarDesdeRequerimiento}
          onIrAlOrigen={handleIrAlOrigen}
          loading={loading}
          toast={toast}
          permisos={permisos}
          readOnly={!!editing && !!editing.id && !permisos.puedeEditar}
        />
      </Dialog>

      {/* Diálogo para ver el Requerimiento de Compra origen */}
      <Dialog
        header="Requerimiento de Compra Origen"
        visible={showRequerimientoDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowRequerimientoDialog(false)}
        modal
        maximizable
        maximized={true}
      >
        <RequerimientoCompraForm
          isEdit={true}
          defaultValues={requerimientoOrigen || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          proveedores={proveedores}
          tiposProducto={tiposProducto}
          tiposEstadoProducto={tiposEstadoProducto}
          destinosProducto={destinosProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          onSubmit={() => {}}
          onCancel={() => setShowRequerimientoDialog(false)}
          onAprobar={() => {}}
          onAnular={() => {}}
          onAutorizarCompra={() => {}}
          loading={false}
          toast={toast}
          permisos={{ puedeVer: true, puedeEditar: false }}
          readOnly={true}
        />
      </Dialog>
    </div>
  );
}
