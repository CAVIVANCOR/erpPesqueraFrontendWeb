// src/pages/PreFactura.jsx
// Pantalla CRUD profesional para PreFactura. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { Badge } from "primereact/badge";
import {
  getAllPreFactura,
  deletePreFactura,
  crearPreFactura,
  actualizarPreFactura,
} from "../api/preFactura";
import PreFacturaForm from "../components/preFactura/PreFacturaForm";
import { getResponsiveFontSize, formatearFecha, formatearNumero, getSeverityColors } from "../utils/utils";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getFormasPago } from "../api/formaPago";
import { getProductos } from "../api/producto";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getMonedas } from "../api/moneda";
import { getIncoterms } from "../api/incoterm";
import { getTiposContenedor } from "../api/tipoContenedor";
import { usePermissions } from "../hooks/usePermissions";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import ColorTag from "../components/shared/ColorTag";

/**
 * Componente PreFactura
 * Gestión CRUD de pre-facturas con patrón profesional ERP Megui
 */
const PreFactura = ({ ruta }) => {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [incoterms, setIncoterms] = useState([]);
  const [tiposContenedor, setTiposContenedor] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPreFactura, setSelectedPreFactura] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useRef(null);

  useEffect(() => {
    cargarPreFacturas();
    cargarDatos();
  }, []);

  const cargarPreFacturas = async () => {
    try {
      setLoading(true);
      const data = await getAllPreFactura();
      setPreFacturas(data);
    } catch (error) {
      console.error("Error detallado al cargar pre-facturas:", error);
      console.error("Response:", error.response);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al cargar pre-facturas: ${
          error.response?.data?.message || error.message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Extraer clientes únicos de las pre-facturas
  useEffect(() => {
    const clientesMap = new Map();
    preFacturas.forEach((preFactura) => {
      if (preFactura.clienteId && preFactura.cliente) {
        clientesMap.set(preFactura.clienteId, preFactura.cliente);
      }
    });
    const clientesArray = Array.from(clientesMap.values());
    setClientesUnicos(clientesArray);
  }, [preFacturas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        empresasData,
        tiposDocData,
        clientesData,
        formasPagoData,
        productosData,
        estadosData,
        centrosCostoData,
        monedasData,
        incotermsData,
        tiposContenedorData,
      ] = await Promise.all([
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getFormasPago(),
        getProductos(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getMonedas(),
        getIncoterms(),
        getTiposContenedor(),
      ]);
      setEmpresas(empresasData);
      setTiposDocumento(tiposDocData);
      setClientes(clientesData);
      setFormasPago(formasPagoData);
      setProductos(productosData);

      // Filtrar estados de documentos (tipoProvieneDeId = 14 para PRE FACTURA)
      const estadosDocFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 14 && !e.cesado
      );
      setEstadosDoc(estadosDocFiltrados);

      // Normalizar pre-facturas agregando estadoDoc manualmente
      const preFacturasNormalizadas = preFacturas.map((req) => ({
        ...req,
        estadoDoc: estadosDocFiltrados.find(
          (e) => Number(e.id) === Number(req.estadoId)
        ),
      }));
      setItems(preFacturasNormalizadas);
      setCentrosCosto(centrosCostoData);
      setMonedas(monedasData);
      setIncoterms(incotermsData);
      setTiposContenedor(tiposContenedorData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  // Filtrar items cuando cambien los filtros
  useEffect(() => {
    let filtrados = items;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    // Filtro por cliente
    if (clienteSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.clienteId) === Number(clienteSeleccionado)
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
    clienteSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    items,
  ]);

  const abrirDialogoNuevo = async () => {
    try {
      // Crear objeto inicial
      const preFacturaInicial = {};

      setSelectedPreFactura(preFacturaInicial);
      setIsEditing(false);
      setDialogVisible(true);
    } catch (error) {
      console.error("Error al abrir diálogo:", error);
      setSelectedPreFactura(null);
      setIsEditing(false);
      setDialogVisible(true);
    }
  };

  const abrirDialogoEdicion = (preFactura) => {
    setSelectedPreFactura(preFactura);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const handleGuardarPreFactura = async (datos) => {
    const esEdicion =
      selectedPreFactura &&
      selectedPreFactura.id &&
      selectedPreFactura.numeroDocumento;

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
        await actualizarPreFactura(selectedPreFactura.id, datos);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Pre-factura actualizada. Puedes seguir agregando detalles.",
        });

        // Recargar la pre-factura actualizada
        const { getPreFacturaPorId } = await import(
          "../api/preFactura"
        );
        const preFacturaActualizada = await getPreFacturaPorId(
          selectedPreFactura.id
        );
        setSelectedPreFactura(preFacturaActualizada);
        setRefreshKey(prev => prev + 1);
      } else {
        const resultado = await crearPreFactura(datos);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Pre-factura creada con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar la pre-factura recién creada
        const { getPreFacturaPorId } = await import(
          "../api/preFactura"
        );
        const preFacturaCompleta = await getPreFacturaPorId(resultado.id);
        setSelectedPreFactura(preFacturaCompleta);
        setRefreshKey(prev => prev + 1);
      }

      cargarPreFacturas();
    } catch (err) {
      // Si el backend devuelve campos faltantes, mostrar lista
      if (
        err.response?.data?.camposFaltantes &&
        Array.isArray(err.response.data.camposFaltantes)
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Campos Obligatorios Faltantes",
          detail: (
            <div>
              <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Los siguientes campos son obligatorios:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {err.response.data.camposFaltantes.map((campo, index) => (
                  <li key={index}>{campo}</li>
                ))}
              </ul>
            </div>
          ),
          life: 6000,
        });
      } else {
        // Error genérico
        const errorMsg =
          err.response?.data?.mensaje ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          "No se pudo guardar.";
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: errorMsg,
          life: 5000,
        });
      }
    }
    setLoading(false);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedPreFactura(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (preFactura) => {
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
    confirmDialog({
      message: `¿Está seguro de eliminar la pre-factura ${preFactura.id}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarPreFactura(preFactura.id),
    });
  };

  const eliminarPreFactura = async (id) => {
    try {
      await deletePreFactura(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pre-factura eliminada correctamente",
      });
      cargarPreFacturas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la pre-factura",
      });
    }
  };

  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor) return "S/ 0.00";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const fechaRegistroTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">
          {rowData.codigo || `ID: ${rowData.id}`}
        </div>
        <div className="text-sm text-gray-600">
          {formatearFecha(rowData.fechaDocumento || rowData.fechaRegistro)}
        </div>
      </div>
    );
  };

  const empresaTemplate = (rowData) => {
    if (!rowData.empresa) return "N/A";

    return (
      <div>
        <div className="font-medium text-blue-600">
          {rowData.empresa.razonSocial || "Sin nombre"}
        </div>
        <div className="text-sm text-gray-600">
          RUC: {rowData.empresa.ruc || "N/A"}
        </div>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    if (!rowData.cliente) return "N/A";

    const severity = rowData.estadoDoc?.severityColor || "success";

    return (
      <ColorTag 
        value={rowData.cliente.razonSocial || "Sin nombre"}
        severity={severity}
        size="normal"
      />
    );
  };

  const estadoTemplate = (rowData) => {
    if (!rowData.estadoDoc) return "N/A";
    // Usar el severityColor del estado o 'secondary' por defecto
    const severity = rowData.estadoDoc.severityColor || "secondary";
    return (
      <Badge
        value={rowData.estadoDoc.descripcion}
        severity={severity}
        size="small"
      />
    );
  };

  const montosTemplate = (rowData) => {
    // Calcular subtotal desde detalles
    const subtotal = (rowData.detalles || []).reduce((sum, det) => {
      const cantidad = Number(det.cantidad) || 0;
      const precio = Number(det.precioUnitario) || 0;
      return sum + cantidad * precio;
    }, 0);

    // Calcular IGV
    const porcentajeIGV = Number(rowData.porcentajeIGV) || 0;
    const igv = rowData.esExoneradoAlIGV ? 0 : subtotal * (porcentajeIGV / 100);

    // Total
    const total = subtotal + igv;

    // Símbolo de moneda
    const simboloMoneda = rowData.moneda?.codigoSunat === "USD" ? "$" : "S/";

    return (
      <div className="text-right">
        <Tag
          value={`${simboloMoneda} ${formatearNumero(total)}`}
          severity="info"
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            padding: "6px 10px",
          }}
        />
        {rowData.tipoCambio && (
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
            T/C: {formatearNumero(rowData.tipoCambio)}
          </div>
        )}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            confirmarEliminacion(rowData);
          }}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const limpiarFiltros = () => {
    setClienteSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
  };

  return (
    <div className="pre-factura-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Pre-Facturas</h2>
        </div>

        <DataTable
          value={preFacturas}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={5}
          rowsPerPageOptions={[5, 10, 15, 20]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pre-facturas"
          style={{
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
            fontSize: getResponsiveFontSize(),
          }}
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
          }
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron pre-facturas"
          scrollable
          scrollHeight="600px"
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
                  <h2>Pre-Facturas</h2>
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
                    onClick={abrirDialogoNuevo}
                    className="p-button-primary"
                    disabled={!permisos.puedeCrear || loading || !empresaSeleccionada}
                    tooltip={
                      !permisos.puedeCrear
                        ? "No tiene permisos para crear"
                        : !empresaSeleccionada
                        ? "Seleccione una empresa primero"
                        : "Nueva Pre-Factura"
                    }
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
                  <label htmlFor="clienteFiltro" style={{ fontWeight: "bold" }}>
                    Cliente
                  </label>
                  <Dropdown
                    id="clienteFiltro"
                    value={clienteSeleccionado}
                    options={clientesUnicos.map((p) => ({
                      label: p.razonSocial,
                      value: Number(p.id),
                    }))}
                    onChange={(e) => setClienteSeleccionado(e.value)}
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
                <div style={{ flex: 2 }}>
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
          <Column
            field="id"
            header="ID"
            sortable
            style={{ width: "80px", verticalAlign: "top" }}
            frozen
          />
          <Column
            field="fechaRegistro"
            header="N° Pre-Factura"
            body={fechaRegistroTemplate}
            sortable
            style={{ width: "160px", verticalAlign: "top", fontWeight: "bold" }}
          />
          <Column
            field="empresaId"
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ width: "100px", verticalAlign: "top" }}
          />
          <Column
            field="clienteId"
            header="Cliente"
            body={clienteTemplate}
            sortable
            style={{ width: "200px", verticalAlign: "top" }}
          />
          <Column
            field="estadoId"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ width: "120px", verticalAlign: "top" }}
            className="text-center"
          />
          <Column
            header="Montos"
            body={montosTemplate}
            style={{ width: "120px", verticalAlign: "top" }}
            className="text-right"
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "100px" }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={
          isEditing
            ? `Editar Pre-Factura: ${selectedPreFactura?.codigo || ""}`
            : "Nueva Pre-Factura"
        }
        modal
        onHide={cerrarDialogo}
      >
        <PreFacturaForm
          key={`${selectedPreFactura?.id || 'new'}-${refreshKey}`}
          isEdit={isEditing}
          defaultValues={selectedPreFactura}
          onSubmit={handleGuardarPreFactura}
          onCancel={cerrarDialogo}
          loading={loading}
          toast={toast}
          permisos={permisos}
          readOnly={!!selectedPreFactura && !!selectedPreFactura.numeroDocumento && !permisos.puedeEditar}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          clientes={clientes}
          formasPago={formasPago}
          productos={productos}
          estadosDoc={estadosDoc}
          centrosCosto={centrosCosto}
          monedas={monedas}
          incoterms={incoterms}
          tiposContenedor={tiposContenedor}
          empresaFija={empresaSeleccionada}
        />
      </Dialog>
    </div>
  );
};

export default PreFactura;
