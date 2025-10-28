// src/pages/RequerimientoCompra.jsx
// Pantalla CRUD profesional para RequerimientoCompra. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import RequerimientoCompraForm from "../components/requerimientoCompra/RequerimientoCompraForm";
import {
  getRequerimientosCompra,
  crearRequerimientoCompra,
  actualizarRequerimientoCompra,
  eliminarRequerimientoCompra,
  aprobarRequerimientoCompra,
  anularRequerimientoCompra,
  autorizarCompraRequerimientoCompra,
} from "../api/requerimientoCompra";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getTiposProducto } from "../api/tipoProducto";
import { getAllTipoEstadoProducto } from "../api/tipoEstadoProducto";
import { getAllDestinoProducto } from "../api/destinoProducto";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { Calendar } from "primereact/calendar";

/**
 * Pantalla profesional para gestión de Requerimientos de Compra.
 */
export default function RequerimientoCompra() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState([]);
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const usuario = useAuthStore((state) => state.usuario);

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

    // Filtro por tipo (Con Cotización / Compra Directa)
    if (tipoSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.esConCotizacion === tipoSeleccionado
      );
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
    tipoSeleccionado,
    estadoSeleccionado,
    items,
  ]);

  // Extraer proveedores únicos de los requerimientos
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
        requerimientosData,
        empresasData,
        tiposDocData,
        proveedoresData,
        tiposProductoData,
        tiposEstadoProductoData,
        destinosProductoData,
        formasPagoData,
        productosData,
        personalData,
        estadosData,
        centrosCostoData,
        tiposMovimientoData,
        monedasData,
      ] = await Promise.all([
        getRequerimientosCompra(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getTiposProducto(),
        getAllTipoEstadoProducto(),
        getAllDestinoProducto(),
        getFormasPago(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getMonedas(),
      ]);

      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setProveedores(proveedoresData);
      setTiposProducto(tiposProductoData);
      setTiposEstadoProducto(tiposEstadoProductoData);
      setDestinosProducto(destinosProductoData);
      setFormasPago(formasPagoData);
      setProductos(productosData);

      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de documentos (tipoProvieneDeId = 11 para REQUERIMIENTO COMPRA)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 11 && !e.cesado
      );
      setEstadosDoc(estadosDocFiltrados);

      // Normalizar requerimientos agregando estadoDoc manualmente
      const requerimientosNormalizados = requerimientosData.map((req) => ({
        ...req,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(req.estadoId)
        ),
      }));
      setItems(requerimientosNormalizados);
      setCentrosCosto(centrosCostoData);
      setTiposMovimiento(tiposMovimientoData);
      setMonedas(monedasData);
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
      // Cargar el requerimiento completo con todos los campos
      const { getRequerimientoCompraPorId } = await import(
        "../api/requerimientoCompra"
      );
      const requerimientoCompleto = await getRequerimientoCompraPorId(
        rowData.id
      );

      setEditing(requerimientoCompleto);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar requerimiento:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el requerimiento",
        life: 3000,
      });
    }
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarRequerimientoCompra(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Requerimiento de compra eliminado correctamente.",
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
    setLoading(true);
    try {
      const esEdicion = editing && editing.id && editing.numeroDocumento;

      if (esEdicion) {
        await actualizarRequerimientoCompra(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail:
            "Requerimiento actualizado. Puedes seguir agregando detalles.",
        });

        // Recargar el requerimiento actualizado para obtener campos actualizados
        const { getRequerimientoCompraPorId } = await import(
          "../api/requerimientoCompra"
        );
        const requerimientoActualizado = await getRequerimientoCompraPorId(
          editing.id
        );
        setEditing(requerimientoActualizado);
      } else {
        const resultado = await crearRequerimientoCompra(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Requerimiento creado con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar el requerimiento recién creado
        const { getRequerimientoCompraPorId } = await import(
          "../api/requerimientoCompra"
        );
        const requerimientoCompleto = await getRequerimientoCompraPorId(
          resultado.id
        );
        setEditing(requerimientoCompleto);
      }

      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
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
    setEditing(null); // null para indicar que es creación, no edición
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setProveedorSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setTipoSeleccionado(null);
    setEstadoSeleccionado(null);
  };

  const handleAprobar = async (id) => {
    setLoading(true);
    try {
      await aprobarRequerimientoCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Requerimiento Aprobado",
        detail:
          "El requerimiento se aprobó exitosamente y se creó la Entrega a Rendir.",
        life: 3000,
      });

      // setShowDialog(false); // No cerrar el diálogo para que el usuario pueda seguir viendo el requerimiento
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo aprobar.";
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
      await anularRequerimientoCompra(id);

      toast.current.show({
        severity: "success",
        summary: "Requerimiento Anulado",
        detail: "El requerimiento se anuló exitosamente.",
        life: 3000,
      });

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
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

  const handleAutorizarCompra = async (id) => {
    setLoading(true);
    try {
      const resultado = await autorizarCompraRequerimientoCompra(
        id,
        usuario?.id
      );

      const cantidadOCs = resultado.ordenesGeneradas?.length || 0;

      toast.current.show({
        severity: "success",
        summary: "Compra Autorizada",
        detail: `Se generaron ${cantidadOCs} órdenes de compra exitosamente.`,
        life: 5000,
      });

      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo autorizar la compra.";
      toast.current.show({
        severity: "error",
        summary: "Error al Autorizar Compra",
        detail: errorMsg,
        life: 5000,
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

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoDoc?.descripcion || "";
    let severity = "info";

    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "APROBADO") severity = "success";
    if (estado === "ANULADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const tipoTemplate = (rowData) => {
    return rowData.esConCotizacion ? (
      <Tag
        value="Con Cotización"
        severity="warning"
        icon="pi pi-shopping-cart"
      />
    ) : (
      <Tag
        value="Compra Directa"
        severity="success"
        icon="pi pi-check-circle"
      />
    );
  };

  const fechaTemplate = (rowData, field) => {
    return formatearFecha(rowData[field], "");
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este requerimiento de compra?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      {/* ConfirmDialog global para confirmDialog() de componentes hijos */}
      <ConfirmDialog />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        dataKey="id"
        paginator
        size="small"
        showGridlines
        stripedRows
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} requerimientos"
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
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
                <h2>Requerimientos de Compra</h2>
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
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  severity="success"
                  raised
                  onClick={handleAdd}
                  disabled={loading || !empresaSeleccionada}
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
                <label htmlFor="tipoFiltro" style={{ fontWeight: "bold" }}>
                  Tipo
                </label>
                <Dropdown
                  id="tipoFiltro"
                  value={tipoSeleccionado}
                  options={[
                    { label: "Compra Directa", value: false },
                    { label: "Con Cotización", value: true },
                  ]}
                  onChange={(e) => setTipoSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
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
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="numeroDocumento" header="Nº Documento" />
        <Column field="empresaId" header="Empresa" body={empresaNombre} />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
        />
        <Column field="proveedorId" header="Proveedor" body={proveedorNombre} />
        <Column field="esConCotizacion" header="Tipo" body={tipoTemplate} />
        <Column field="estadoId" header="Estado" body={estadoTemplate} />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          editing?.id
            ? "Editar Requerimiento de Compra"
            : "Nuevo Requerimiento de Compra"
        }
        visible={showDialog}
        style={{ width: "1350px", maxWidth: "95vw" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
      >
        <RequerimientoCompraForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          proveedores={proveedores}
          tiposProducto={tiposProducto}
          tiposEstadoProducto={tiposEstadoProducto}
          destinosProducto={destinosProducto}
          formasPago={formasPago}
          productos={productos}
          personalOptions={personalOptions}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          empresaFija={empresaSeleccionada}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          onAutorizarCompra={handleAutorizarCompra}
          loading={loading}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}
