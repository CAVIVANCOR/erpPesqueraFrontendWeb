/**
 * Pantalla CRUD profesional para OTMantenimiento (Órdenes de Trabajo de Mantenimiento)
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { getOrdenesTrabajoMantenimiento, crearOrdenTrabajo, actualizarOrdenTrabajo, eliminarOrdenTrabajo, getOrdenTrabajoPorId } from '../api/oTMantenimiento';
import { getEmpresas } from '../api/empresa';
import { getSedes } from '../api/sedes';
import { getActivos } from '../api/activo';
import { getTiposMantenimiento } from '../api/tipoMantenimiento';
import { getMotivosOrigenOT } from '../api/motivoOriginoOT';
import { getEstadosMultiFuncionPorTipoProviene } from '../api/estadoMultiFuncion';
import { getPersonal } from '../api/personal';
import { getContratistas } from '../api/contratista';
import { getProductos } from '../api/producto';
import { getAlmacenes } from '../api/almacen';
import { getTiposDocumento } from '../api/tipoDocumento';
import { getSeriesDoc } from '../api/serieDoc';
import { getMonedas } from '../api/moneda';
import { getCentrosCosto } from '../api/centroCosto';
import { getAllTipoMovEntregaRendir } from '../api/tipoMovEntregaRendir';
import { getEntidadesComerciales } from '../api/entidadComercial';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import OTMantenimientoForm from '../components/oTMantenimiento/OTMantenimientoForm';
import { formatearFecha } from '../utils/utils';
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente OTMantenimiento
 * Pantalla principal para gestión de órdenes de trabajo de mantenimiento
 */
const OTMantenimiento = ({ ruta }) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  
  // Estados del componente
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros específicos
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [tipoMantenimientoFiltro, setTipoMantenimientoFiltro] = useState(null);
  const [motivoFiltro, setMotivoFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [motivosOrigen, setMotivosOrigen] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [estadosTarea, setEstadosTarea] = useState([]);
  const [estadosInsumo, setEstadosInsumo] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [contratistas, setContratistas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [seriesDocs, setSeriesDocs] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  /**
   * Carga las órdenes de trabajo desde la API
   */
  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (empresaSeleccionada) filtros.empresaId = empresaSeleccionada;
      if (tipoMantenimientoFiltro) filtros.tipoMantenimientoId = tipoMantenimientoFiltro;
      if (motivoFiltro) filtros.motivoOriginoId = motivoFiltro;
      if (estadoFiltro) filtros.estadoId = estadoFiltro;
      
      const data = await getOrdenesTrabajoMantenimiento(filtros);      
      // Normalizar IDs según regla ERP Megui
      const ordenesNormalizadas = data.map(orden => ({
        ...orden,
        id: Number(orden.id),
        empresaId: Number(orden.empresaId),
        sedeId: orden.sedeId ? Number(orden.sedeId) : null,
        activoId: orden.activoId ? Number(orden.activoId) : null,
        tipoMantenimientoId: Number(orden.tipoMantenimientoId),
        motivoOriginoId: Number(orden.motivoOriginoId),
        solicitanteId: orden.solicitanteId ? Number(orden.solicitanteId) : null,
        responsableId: orden.responsableId ? Number(orden.responsableId) : null,
        autorizadoPorId: orden.autorizadoPorId ? Number(orden.autorizadoPorId) : null
      }));

      // Aplicar filtros de fecha en frontend
      let ordenesFiltradas = ordenesNormalizadas;

      if (fechaInicio) {
        ordenesFiltradas = ordenesFiltradas.filter((item) => {
          const fechaDoc = new Date(item.fechaProgramada || item.fechaCreacion);
          const fechaIni = new Date(fechaInicio);
          fechaIni.setHours(0, 0, 0, 0);
          return fechaDoc >= fechaIni;
        });
      }

      if (fechaFin) {
        ordenesFiltradas = ordenesFiltradas.filter((item) => {
          const fechaDoc = new Date(item.fechaProgramada || item.fechaCreacion);
          const fechaFinDia = new Date(fechaFin);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaDoc <= fechaFinDia;
        });
      }
      
      setOrdenesTrabajo(ordenesFiltradas);
    } catch (error) {
      console.error('Error al cargar órdenes de trabajo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar las órdenes de trabajo'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga los catálogos necesarios para el formulario
   */
  const cargarCatalogos = async () => {
    try {
      const [
        empresasData,
        sedesData,
        almacenesData,
        activosData,
        tiposData,
        motivosData,
        estadosDocData,
        estadosTareaData,
        estadosInsumoData,
        personalData,
        contratistasData,
        productosData,
        tiposDocumentoData,
        seriesDocsData,
        monedasData,
        centrosCostoData,
        tiposMovimientoData,
        entidadesComercialesData
      ] = await Promise.all([
        getEmpresas(),
        getSedes(),
        getAlmacenes(),
        getActivos(),
        getTiposMantenimiento(),
        getMotivosOrigenOT(),
        getEstadosMultiFuncionPorTipoProviene(15), // Orden Trabajo Mantenimiento
        getEstadosMultiFuncionPorTipoProviene(16), // Tarea OT Mantenimiento
        getEstadosMultiFuncionPorTipoProviene(17), // Insumo Tarea OT Mantenimiento
        getPersonal(),
        getContratistas(),
        getProductos(),
        getTiposDocumento(),
        getSeriesDoc(),
        getMonedas(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getEntidadesComerciales()
      ]);

      // Normalizar IDs
      setEmpresas(empresasData.map(e => ({ ...e, id: Number(e.id) })));
      setSedes(sedesData.map(s => ({ ...s, id: Number(s.id) })));
      setAlmacenes(almacenesData.map(a => ({ ...a, id: Number(a.id) })));
      setActivos(activosData.map(a => ({ ...a, id: Number(a.id) })));
      setTiposMantenimiento(tiposData.map(t => ({ ...t, id: Number(t.id) })));
      setMotivosOrigen(motivosData.map(m => ({ ...m, id: Number(m.id) })));
      const estadosDocNormalizados = estadosDocData.map(e => ({ ...e, id: Number(e.id) }));
      setEstadosDoc(estadosDocNormalizados);
      setEstadosTarea(estadosTareaData.map(e => ({ ...e, id: Number(e.id) })));
      setEstadosInsumo(estadosInsumoData.map(e => ({ ...e, id: Number(e.id) })));
      setPersonalOptions(personalData.map(p => ({ ...p, id: Number(p.id) })));
      setContratistas(contratistasData.map(c => ({ ...c, id: Number(c.id) })));
      setProductos(productosData.map(p => ({ ...p, id: Number(p.id) })));
      setTiposDocumento(tiposDocumentoData.map(t => ({ ...t, id: Number(t.id) })));
      setSeriesDocs(seriesDocsData.map(s => ({ ...s, id: Number(s.id) })));
      setMonedas(monedasData.map(m => ({ ...m, id: Number(m.id) })));
      setCentrosCosto(centrosCostoData.map(c => ({ ...c, id: Number(c.id) })));
      setTiposMovimiento(tiposMovimientoData.map(t => ({ ...t, id: Number(t.id) })));
      setEntidadesComerciales(entidadesComercialesData.map(e => ({ ...e, id: Number(e.id) })));
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los catálogos'
      });
    }
  };

  /**
   * Efecto para cargar catálogos al montar el componente
   */
  useEffect(() => {
    cargarCatalogos();
  }, []);

  /**
   * Efecto para recargar órdenes cuando cambian los filtros
   */
  useEffect(() => {
    cargarOrdenes();
  }, [empresaSeleccionada, tipoMantenimientoFiltro, motivoFiltro, estadoFiltro, fechaInicio, fechaFin]);

  /**
   * Abre el diálogo para crear nueva orden de trabajo
   */
  const abrirDialogoNuevo = () => {
    if (!empresaSeleccionada) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar una empresa primero'
      });
      return;
    }
    setOrdenSeleccionada(null);
    setIsEditing(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar orden de trabajo (clic en fila)
   */
  const abrirDialogoEdicion = (orden) => {
    setOrdenSeleccionada(orden);
    setIsEditing(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setOrdenSeleccionada(null);
    setIsEditing(false);
  };

  /**
   * Maneja el guardado de la orden de trabajo
   */
  const handleGuardarOrden = async (datos) => {
    const esEdicion = ordenSeleccionada && ordenSeleccionada.id;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para editar registros.',
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para crear registros.',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {

      if (esEdicion) {
        await actualizarOrdenTrabajo(ordenSeleccionada.id, datos);
        toast.current.show({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Orden de trabajo actualizada. Puedes seguir agregando detalles.',
        });

        // Recargar la orden actualizada
        const ordenActualizada = await getOrdenTrabajoPorId(ordenSeleccionada.id);
        setOrdenSeleccionada(ordenActualizada);
        setRefreshKey(prev => prev + 1);
      } else {
        const resultado = await crearOrdenTrabajo(datos);
        toast.current.show({
          severity: 'success',
          summary: 'Creado',
          detail: `Orden de trabajo creada con código: ${resultado.codigo}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar la orden recién creada
        const ordenCompleta = await getOrdenTrabajoPorId(resultado.id);
        setOrdenSeleccionada(ordenCompleta);
        setIsEditing(true);
        setRefreshKey(prev => prev + 1);
      }

      cargarOrdenes();
    } catch (err) {
      console.error('Error al guardar orden de trabajo:', err);
      
      // Si el backend devuelve campos faltantes, mostrar lista
      if (err.response?.data?.camposFaltantes && Array.isArray(err.response.data.camposFaltantes)) {
        toast.current.show({
          severity: 'warn',
          summary: 'Campos Obligatorios Faltantes',
          detail: (
            <div>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                Los siguientes campos son obligatorios:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {err.response.data.camposFaltantes.map((campo, index) => (
                  <li key={index}>{campo}</li>
                ))}
              </ul>
            </div>
          ),
          life: 8000,
        });
      } else {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error al guardar la orden de trabajo',
          life: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirma la eliminación de una orden de trabajo
   */
  const confirmarEliminacion = (orden) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar registros.'
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar la orden de trabajo "${orden.codigo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarOrden(orden.id)
    });
  };

  /**
   * Elimina una orden de trabajo
   */
  const eliminarOrden = async (id) => {
    try {
      await eliminarOrdenTrabajo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Orden de trabajo eliminada correctamente'
      });
      await cargarOrdenes();
    } catch (error) {
      console.error('Error al eliminar orden de trabajo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al eliminar la orden de trabajo'
      });
    }
  };

  /**
   * Maneja el clic en fila
   */
  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    setTipoMantenimientoFiltro(null);
    setMotivoFiltro(null);
    setEstadoFiltro(null);
    setFechaInicio(null);
    setFechaFin(null);
  };

  /**
   * Template para el código de la orden
   */
  const codigoTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">
          {rowData.codigo || `ID: ${rowData.id}`}
        </div>
        <div className="text-sm text-gray-600">
          {formatearFecha(rowData.fechaCreacion)}
        </div>
      </div>
    );
  };

  /**
   * Template para prioridad
   */
  const prioridadTemplate = (rowData) => {
    return rowData.prioridadAlta ? (
      <Tag value="ALTA" severity="danger" />
    ) : (
      <Tag value="NORMAL" severity="info" />
    );
  };

  /**
   * Template para tipo de mantenimiento
   */
  const tipoMantenimientoTemplate = (rowData) => {
    return rowData.tipoMantenimiento?.nombre || '-';
  };

  /**
   * Template para motivo de origen
   */
  const motivoOrigenTemplate = (rowData) => {
    return rowData.motivoOrigino?.nombre || '-';
  };

  /**
   * Template para responsable
   */
  const responsableTemplate = (rowData) => {
    return rowData.responsable?.nombres || '-';
  };

  /**
   * Template para estado
   */
  const estadoTemplate = (rowData) => {
    if (!rowData.estadoDoc) return 'N/A';
    const severity = rowData.estadoDoc.severityColor || 'secondary';
    return (
      <Tag value={rowData.estadoDoc.descripcion} severity={severity} />
    );
  };

  /**
   * Template para acciones
   */
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
          tooltip={permisos.puedeEditar ? 'Editar' : 'Ver'}
          tooltipOptions={{ position: 'top' }}
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
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Órdenes de Trabajo de Mantenimiento</h2>
        </div>

        <DataTable
          value={ordenesTrabajo}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={10}
          rowsPerPageOptions={[10, 20, 40, 80]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
          emptyMessage="No se encontraron órdenes de trabajo"
          onRowClick={permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined}
          selectionMode="single"
          scrollable
          scrollHeight="600px"
          sortField="id"
          sortOrder={-1}
          style={{
            fontSize: getResponsiveFontSize(),
            cursor: permisos.puedeVer || permisos.puedeEditar ? 'pointer' : 'default',
          }}
                  header={
            <div>
              <div style={{ alignItems: "end", display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{ flex: 2 }}>
                  <h2>Órdenes de Trabajo</h2>
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="empresaFiltro" style={{ fontWeight: "bold" }}>
                    Empresa*
                  </label>
                  <Dropdown
                    id="empresaFiltro"
                    value={empresaSeleccionada}
                    options={empresas.map((e) => ({ label: e.razonSocial, value: Number(e.id) }))}
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
                        ? 'No tiene permisos para crear'
                        : !empresaSeleccionada
                        ? 'Seleccione una empresa primero'
                        : 'Nueva Orden de Trabajo'
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-outlined p-button-info"
                    onClick={async () => {
                      await cargarOrdenes();
                      toast.current?.show({
                        severity: "success",
                        summary: "Actualizado",
                        detail: "Datos actualizados correctamente desde el servidor",
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
              <div style={{ alignItems: "end", display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{ flex: 2 }}>
                  <label htmlFor="tipoMantenimientoFiltro" style={{ fontWeight: "bold" }}>
                    Tipo Mantenimiento
                  </label>
                  <Dropdown
                    id="tipoMantenimientoFiltro"
                    value={tipoMantenimientoFiltro}
                    options={tiposMantenimiento.map((t) => ({ label: t.nombre, value: Number(t.id) }))}
                    onChange={(e) => setTipoMantenimientoFiltro(e.value)}
                    placeholder="Todos"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="motivoFiltro" style={{ fontWeight: "bold" }}>
                    Motivo
                  </label>
                  <Dropdown
                    id="motivoFiltro"
                    value={motivoFiltro}
                    options={motivosOrigen.map((m) => ({ label: m.nombre, value: Number(m.id) }))}
                    onChange={(e) => setMotivoFiltro(e.value)}
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
                    value={estadoFiltro}
                    options={estadosDoc.map((e) => ({ label: e.descripcion, value: Number(e.id) }))}
                    onChange={(e) => setEstadoFiltro(e.value)}
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
            frozen
            style={{ width: '80px', verticalAlign: 'top' }}
          />
          
          <Column 
            field="numeroCompleto" 
            header="Número OT" 
            sortable 
            style={{ width: '160px', verticalAlign: 'top', fontWeight: 'bold' }}
          />
          
          <Column 
            field="tipoMantenimiento.nombre" 
            header="Tipo Mantenimiento" 
            body={tipoMantenimientoTemplate}
            sortable 
            style={{ width: '180px', verticalAlign: 'top' }}
          />
          
          <Column 
            field="motivoOrigino.nombre" 
            header="Motivo Origen" 
            body={motivoOrigenTemplate}
            sortable 
            style={{ width: '150px', verticalAlign: 'top' }}
          />
          
          <Column 
            field="prioridadAlta" 
            header="Prioridad" 
            body={prioridadTemplate}
            sortable 
            style={{ width: '100px', verticalAlign: 'top' }}
            className="text-center"
          />
          
          <Column 
            field="responsable.nombres" 
            header="Responsable" 
            body={responsableTemplate}
            sortable 
            style={{ width: '150px', verticalAlign: 'top' }}
          />

          <Column 
            field="estadoDoc.descripcion" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px', verticalAlign: 'top' }}
            className="text-center"
          />
          
          <Column 
            field="descripcion" 
            header="Descripción" 
            sortable 
            style={{ width: '200px', verticalAlign: 'top' }}
          />
          
          <Column 
            body={accionesTemplate} 
            header="Acciones" 
            frozen 
            alignFrozen="right"
            style={{ width: '100px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: '90vw', maxWidth: '1200px' }}
        header={isEditing ? `Editar Orden de Trabajo: ${ordenSeleccionada?.codigo || ''}` : 'Nueva Orden de Trabajo'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <OTMantenimientoForm
          key={refreshKey}
          isEdit={isEditing}
          defaultValues={ordenSeleccionada}
          onSubmit={handleGuardarOrden}
          onCancel={cerrarDialogo}
          empresas={empresas}
          tiposMantenimiento={tiposMantenimiento}
          motivosOrigen={motivosOrigen}
          estadosDoc={estadosDoc}
          estadosTarea={estadosTarea}
          estadosInsumo={estadosInsumo}
          activos={activos}
          sedes={sedes}
          almacenes={almacenes}
          personalOptions={personalOptions}
          contratistas={contratistas}
          productos={productos}
          tiposDocumento={tiposDocumento}
          seriesDocs={seriesDocs}
          monedas={monedas}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales}
          permisos={permisos}
          readOnly={!!ordenSeleccionada && !!ordenSeleccionada.codigo && !permisos.puedeEditar}
          loading={loading}
          toast={toast}
          empresaFija={empresaSeleccionada}
        />
      </Dialog>
    </div>
  );
};

export default OTMantenimiento;