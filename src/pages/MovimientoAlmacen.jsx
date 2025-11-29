// src/pages/MovimientoAlmacen.jsx
// Pantalla CRUD profesional para MovimientoAlmacen. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import MovimientoAlmacenForm from "../components/movimientoAlmacen/MovimientoAlmacenForm";
import ConsultaStockForm from "../components/common/ConsultaStockForm";
import {
  getMovimientosAlmacen,
  getMovimientoAlmacenPorId,
  crearMovimientoAlmacen,
  actualizarMovimientoAlmacen,
  eliminarMovimientoAlmacen,
  cerrarMovimientoAlmacen,
  anularMovimientoAlmacen,
} from "../api/movimientoAlmacen";
import { generarKardex } from "../api/generarKardex";
import { getEmpresas } from "../api/empresa";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getConceptosMovAlmacen } from "../api/conceptoMovAlmacen";
import { getProductos } from "../api/producto";
import { getPersonal } from "../api/personal";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getCentrosCosto } from "../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Movimientos de Almacén.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function MovimientoAlmacen() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [conceptosMovAlmacen, setConceptosMovAlmacen] = useState([]);
  const [productos, setProductos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [estadosMercaderia, setEstadosMercaderia] = useState([]);
  const [estadosCalidad, setEstadosCalidad] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [entidadComercialSeleccionada, setEntidadComercialSeleccionada] = useState(null);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [esCustodiaSeleccionado, setEsCustodiaSeleccionado] = useState(null);
  const [conceptoMovAlmacenSeleccionado, setConceptoMovAlmacenSeleccionado] = useState(null);
  const [almacenOrigenSeleccionado, setAlmacenOrigenSeleccionado] = useState(null);
  const [almacenDestinoSeleccionado, setAlmacenDestinoSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [entidadesComercialesUnicas, setEntidadesComercialesUnicas] = useState([]);
  const [tiposDocumentoUnicos, setTiposDocumentoUnicos] = useState([]);
  const [almacenesOrigen, setAlmacenesOrigen] = useState([]);
  const [almacenesDestino, setAlmacenesDestino] = useState([]);
  const [showConsultaStock, setShowConsultaStock] = useState(false);
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
        (item) => String(item.empresaId) === String(empresaSeleccionada)
      );
    }

    // Filtro por entidad comercial
    if (entidadComercialSeleccionada) {
      filtrados = filtrados.filter(
        (item) => String(item.entidadComercialId) === String(entidadComercialSeleccionada)
      );
    }

    // Filtro por tipo documento
    if (tipoDocumentoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => String(item.tipoDocumentoId) === String(tipoDocumentoSeleccionado)
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

    // Filtro por custodia/mercadería propia
    if (esCustodiaSeleccionado !== null) {
      filtrados = filtrados.filter(
        (item) => item.esCustodia === esCustodiaSeleccionado
      );
    }

    // Filtro por concepto de almacén
    if (conceptoMovAlmacenSeleccionado) {
      filtrados = filtrados.filter(
        (item) => String(item.conceptoMovAlmacenId) === String(conceptoMovAlmacenSeleccionado)
      );
    }

    // Filtro por almacén origen
    if (almacenOrigenSeleccionado) {
      filtrados = filtrados.filter(
        (item) => String(item.almacenOrigenId) === String(almacenOrigenSeleccionado)
      );
    }

    // Filtro por almacén destino
    if (almacenDestinoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => String(item.almacenDestinoId) === String(almacenDestinoSeleccionado)
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    entidadComercialSeleccionada,
    tipoDocumentoSeleccionado,
    fechaInicio,
    fechaFin,
    esCustodiaSeleccionado,
    conceptoMovAlmacenSeleccionado,
    almacenOrigenSeleccionado,
    almacenDestinoSeleccionado,
    items,
  ]);

  // Extraer entidades comerciales únicas de los movimientos
  useEffect(() => {
    const entidadesMap = new Map();
    items.forEach((item) => {
      if (item.entidadComercialId && item.entidadComercial) {
        entidadesMap.set(item.entidadComercialId, item.entidadComercial);
      }
    });
    const entidadesArray = Array.from(entidadesMap.values());
    setEntidadesComercialesUnicas(entidadesArray);
  }, [items]);

  // Extraer tipos de documento únicos de los movimientos
  useEffect(() => {
    const tiposDocMap = new Map();
    items.forEach((item) => {
      if (item.tipoDocumentoId && item.tipoDocumento) {
        tiposDocMap.set(item.tipoDocumentoId, item.tipoDocumento);
      }
    });
    const tiposDocArray = Array.from(tiposDocMap.values());
    setTiposDocumentoUnicos(tiposDocArray);
  }, [items]);

  // Extraer almacenes únicos de los movimientos
  useEffect(() => {
    const almacenesOrigenMap = new Map();
    const almacenesDestinoMap = new Map();
    items.forEach((item) => {
      if (item.almacenOrigenId && item.almacenOrigen) {
        almacenesOrigenMap.set(item.almacenOrigenId, item.almacenOrigen);
      }
      if (item.almacenDestinoId && item.almacenDestino) {
        almacenesDestinoMap.set(item.almacenDestinoId, item.almacenDestino);
      }
    });
    setAlmacenesOrigen(Array.from(almacenesOrigenMap.values()));
    setAlmacenesDestino(Array.from(almacenesDestinoMap.values()));
  }, [items]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        movimientosData,
        empresasData,
        tiposData,
        entidadesData,
        conceptosData,
        productosData,
        personalData,
        estadosData,
        centrosCostoData,
        tiposMovimientoData,
        monedasData,
      ] = await Promise.all([
        getMovimientosAlmacen(),
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
        getConceptosMovAlmacen(),
        getProductos(),
        getPersonal(),
        getEstadosMultiFuncion(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getMonedas(),
      ]);
      setItems(movimientosData);
      setEmpresas(empresasData);
      setTiposDocumento(tiposData);
      setEntidadesComerciales(entidadesData);
      setConceptosMovAlmacen(conceptosData);
      setProductos(productosData);
      
      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map(p => ({
        ...p,
        nombreCompleto: `${p.nombres || ''} ${p.apellidos || ''}`.trim()
      }));
      setPersonalOptions(personalConNombres);

      // Filtrar estados de mercadería (tipoProvieneDeId = 2 para PRODUCTOS)
      const estadosMercaderiaFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado
      );
      setEstadosMercaderia(estadosMercaderiaFiltrados);

      // Filtrar estados de calidad (tipoProvieneDeId = 10 para PRODUCTOS CALIDAD)
      const estadosCalidadFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 10 && !e.cesado
      );
      setEstadosCalidad(estadosCalidadFiltrados);

      // Establecer datos para entregas a rendir
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

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
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
      await eliminarMovimientoAlmacen(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Movimiento de almacén eliminado correctamente.",
      });
      cargarDatos();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {

    setLoading(true);
    try {
      // Verificar si es edición: editing tiene numeroDocumento (viene del backend)
      // Si editing solo tiene { empresaId }, entonces es creación
      const esEdicion = editing && editing.id && editing.numeroDocumento;
      
      if (esEdicion) {
        const resultado = await actualizarMovimientoAlmacen(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Movimiento de almacén actualizado. Puedes seguir agregando detalles.",
        });
        // NO cerrar el diálogo - permitir seguir agregando detalles
        // El usuario cerrará manualmente cuando termine
      } else {
        const resultado = await crearMovimientoAlmacen(data);        
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Movimiento creado con número: ${resultado.numeroDocumento}. Ahora puedes agregar detalles.`,
          life: 5000
        });
        
        // Cargar el movimiento recién creado para permitir agregar detalles
        try {
          const movimientoCompleto = await getMovimientoAlmacenPorId(resultado.id);
          setEditing(movimientoCompleto);
        } catch (reloadErr) {
          console.error("Error al recargar movimiento:", reloadErr);
          // Si falla la recarga, usar el resultado directo
          setEditing(resultado);
        }
        // NO cerrar el diálogo - mantenerlo abierto para agregar detalles
      }
      
      // Refresca la lista para mostrar el nuevo movimiento
      cargarDatos();
    } catch (err) {
      console.error("Error en handleFormSubmit:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing({ empresaId: empresaSeleccionada });
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setEntidadComercialSeleccionada(null);
    setTipoDocumentoSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEsCustodiaSeleccionado(null);
    setConceptoMovAlmacenSeleccionado(null);
    setAlmacenOrigenSeleccionado(null);
    setAlmacenDestinoSeleccionado(null);
  };

  const handleCerrar = async (id) => {
    setLoading(true);
    try {
      // Cerrar movimiento (cambiar estado a CERRADO id=31)
      await cerrarMovimientoAlmacen(id);
      
      toast.current.show({
        severity: "success",
        summary: "Documento Cerrado",
        detail: "El documento se cerró exitosamente (Estado: CERRADO).",
        life: 3000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo cerrar el documento.";
      toast.current.show({
        severity: "error",
        summary: "Error al Cerrar",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const handleGenerarKardex = async (id) => {
    setLoading(true);
    try {
      // 1. Generar Kardex (crea registros, calcula saldos, actualiza tablas)
      const resultado = await generarKardex(id);
      
      // Mostrar resumen de la generación
      const mensajeDetalle = `
        Kardex generado exitosamente:
        - Registros creados: ${resultado.kardexCreados}
        - Registros actualizados: ${resultado.kardexActualizados}
        - Saldos detallados: ${resultado.saldosDetActualizados}
        - Saldos generales: ${resultado.saldosGenActualizados}
      `;
      
      // Mostrar errores si los hay
      if (resultado.errores && resultado.errores.length > 0) {
        toast.current.show({
          severity: "warn",
          summary: "Kardex generado con advertencias",
          detail: `Se encontraron ${resultado.errores.length} advertencias. Revise el kardex.`,
          life: 5000
        });
      }
      
      toast.current.show({
        severity: "success",
        summary: "Kardex Generado",
        detail: mensajeDetalle,
        life: 5000
      });
      
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo generar el kardex.";
      toast.current.show({
        severity: "error",
        summary: "Error al Generar Kardex",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const handleAnular = async (id, empresaId) => {
    setLoading(true);
    try {
      const resultado = await anularMovimientoAlmacen(id, empresaId);
      
      // Mostrar resumen detallado de la anulación
      const mensajeDetalle = `
        Movimiento anulado exitosamente:
        - Kardex eliminados: ${resultado.kardexEliminados || 0}
        - Productos afectados: ${resultado.productosAfectados || 0}
        - SaldoAlmacenDetallado: ${resultado.saldosDetActualizados || 0}
        - SaldoAlmacenGeneral: ${resultado.saldosGenActualizados || 0}
        - SaldosDetProductoCliente: ${resultado.saldosDetProductoClienteActualizados || 0}
        - SaldosProductoCliente: ${resultado.saldosProductoClienteActualizados || 0}
      `;
      
      toast.current.show({
        severity: "success",
        summary: "Movimiento Anulado",
        detail: mensajeDetalle,
        life: 5000
      });
      setShowDialog(false);
      cargarDatos();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "No se pudo anular el movimiento.";
      toast.current.show({
        severity: "error",
        summary: "Error al Anular",
        detail: errorMsg,
        life: 5000
      });
    }
    setLoading(false);
  };

  const empresaNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.empresa?.razonSocial || "";
  };

  const tipoDocumentoNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.tipoDocumento?.descripcion || "";
  };

  const conceptoNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.conceptoMovAlmacen?.descripcionArmada || "";
  };

  const entidadNombre = (rowData) => {
    // Usar la relación incluida del backend
    return rowData.entidadComercial?.razonSocial || "";
  };

  const fechaTemplate = (rowData, field) => {
    return formatearFecha(rowData[field], "");
  };

  const booleanTemplate = (rowData, field) => (
    <span className={rowData[field] ? "text-blue-600" : "text-gray-600"}>
      {rowData[field] ? "Sí" : "No"}
    </span>
  );

  const mercaderiaTemplate = (rowData) => {
    const esCustodia = rowData.esCustodia;
    return (
      <Tag
        value={esCustodia ? "CUSTODIA" : "PROPIA"}
        severity={esCustodia ? "danger" : "success"}
        style={{ fontWeight: "bold" }}
      />
    );
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
        message="¿Está seguro que desea eliminar este movimiento de almacén?"
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
        size="small"
        showGridlines
        stripedRows
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div>
            {/* Primera fila */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Movimientos de Almacén</h2>
              </div>
              <div style={{ flex: 1.5 }}>
                <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                  Empresa
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
                />
              </div>
                            <div style={{ flex: 0.5 }}>
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
                  label="Consulta Stock"
                  icon="pi pi-chart-bar"
                  className="p-button-warning"
                  severity="warning"
                  raised
                  onClick={() => setShowConsultaStock(true)}
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
            {/* Segunda fila */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="entidadFiltro" style={{ fontWeight: "bold" }}>
                  Entidad Comercial
                </label>
                <Dropdown
                  id="entidadFiltro"
                  value={entidadComercialSeleccionada}
                  options={entidadesComercialesUnicas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEntidadComercialSeleccionada(e.value)}
                  placeholder="Todas"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 1.5 }}>
                <label htmlFor="tipoDocFiltro" style={{ fontWeight: "bold" }}>
                  Tipo Documento
                </label>
                <Dropdown
                  id="tipoDocFiltro"
                  value={tipoDocumentoSeleccionado}
                  options={tiposDocumentoUnicos.map((t) => ({
                    label: t.descripcion || t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => setTipoDocumentoSeleccionado(e.value)}
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
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                  Tipo Mercadería
                </label>
                <Button
                  label={
                    esCustodiaSeleccionado === null
                      ? "TODAS"
                      : esCustodiaSeleccionado
                      ? "CUSTODIA"
                      : "PROPIA"
                  }
                  icon={
                    esCustodiaSeleccionado === null
                      ? "pi pi-filter"
                      : esCustodiaSeleccionado
                      ? "pi pi-exclamation-circle"
                      : "pi pi-check-circle"
                  }
                  severity={
                    esCustodiaSeleccionado === null
                      ? "secondary"
                      : esCustodiaSeleccionado
                      ? "danger"
                      : "success"
                  }
                  onClick={() => {
                    if (esCustodiaSeleccionado === null) {
                      setEsCustodiaSeleccionado(false); // TODAS -> PROPIA
                    } else if (esCustodiaSeleccionado === false) {
                      setEsCustodiaSeleccionado(true); // PROPIA -> CUSTODIA
                    } else {
                      setEsCustodiaSeleccionado(null); // CUSTODIA -> TODAS
                    }
                  }}
                  disabled={loading}
                  style={{ width: "100%", fontWeight: "bold" }}
                />
              </div>
            </div>
            {/* Tercera fila */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="conceptoFiltro" style={{ fontWeight: "bold" }}>
                  Concepto Movimiento
                </label>
                <Dropdown
                  id="conceptoFiltro"
                  value={conceptoMovAlmacenSeleccionado}
                  options={conceptosMovAlmacen.map((c) => ({
                    label: c.descripcionArmada,
                    value: Number(c.id),
                  }))}
                  onChange={(e) => setConceptoMovAlmacenSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="almacenOrigenFiltro" style={{ fontWeight: "bold" }}>
                  Almacén Origen
                </label>
                <Dropdown
                  id="almacenOrigenFiltro"
                  value={almacenOrigenSeleccionado}
                  options={almacenesOrigen.map((a) => ({
                    label: a.nombre || a.descripcion,
                    value: Number(a.id),
                  }))}
                  onChange={(e) => setAlmacenOrigenSeleccionado(e.value)}
                  placeholder="Todos"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  disabled={loading}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="almacenDestinoFiltro" style={{ fontWeight: "bold" }}>
                  Almacén Destino
                </label>
                <Dropdown
                  id="almacenDestinoFiltro"
                  value={almacenDestinoSeleccionado}
                  options={almacenesDestino.map((a) => ({
                    label: a.nombre || a.descripcion,
                    value: Number(a.id),
                  }))}
                  onChange={(e) => setAlmacenDestinoSeleccionado(e.value)}
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
        <Column field="id" header="ID" style={{ width: 80 }} sortable/>
        <Column field="numeroDocumento" header="Nº Documento" sortable />
        <Column field="empresaId" header="Empresa" body={empresaNombre} sortable/>
        <Column
          field="tipoDocumentoId"
          header="Tipo Doc."
          body={tipoDocumentoNombre}
          sortable
        />
        <Column
          field="conceptoMovAlmacenId"
          header="Concepto"
          body={conceptoNombre}
          sortable
        />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={(rowData) => fechaTemplate(rowData, "fechaDocumento")}
          sortable
        />
        <Column
          field="entidadComercialId"
          header="Entidad"
          body={entidadNombre}
          sortable
        />
        <Column
          field="esCustodia"
          header="Tipo Mercadería"
          body={mercaderiaTemplate}
          style={{ width: 80, textAlign: "center" }}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
          sortable
        />
      </DataTable>
      <Dialog
        header={
          editing
            ? "Editar Movimiento de Almacén"
            : "Nuevo Movimiento de Almacén"
        }
        visible={showDialog}
        style={{ width: "1350px", maxWidth: "95vw" }}
        onHide={() => setShowDialog(false)}
        modal
        maximizable
      >
        <MovimientoAlmacenForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          empresas={empresas}
          tiposDocumento={tiposDocumento}
          entidadesComerciales={entidadesComerciales}
          conceptosMovAlmacen={conceptosMovAlmacen}
          productos={productos}
          personalOptions={personalOptions}
          estadosMercaderia={estadosMercaderia}
          estadosCalidad={estadosCalidad}
          empresaFija={empresaSeleccionada}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          monedas={monedas}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          onCerrar={handleCerrar}
          onAnular={handleAnular}
          onGenerarKardex={handleGenerarKardex}
          loading={loading}
          toast={toast}
        />
      </Dialog>

      {/* Diálogo de Consulta de Stock */}
      <ConsultaStockForm
        visible={showConsultaStock}
        onHide={() => setShowConsultaStock(false)}
        empresaIdInicial={empresaSeleccionada}
      />
    </div>
  );
}
