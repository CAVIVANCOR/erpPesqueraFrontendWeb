/**
 * Pantalla CRUD profesional para OTMantenimiento (Órdenes de Trabajo de Mantenimiento)
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { getOrdenesTrabajoMantenimiento, eliminarOrdenTrabajo } from '../api/oTMantenimiento';
import { getEmpresas } from '../api/empresa';
import { getSedes } from '../api/sedes';
import { getActivos } from '../api/activo';
import { getTiposMantenimiento } from '../api/tipoMantenimiento';
import { getMotivosOrigenOT } from '../api/motivoOriginoOT';
import { getEstadosMultiFuncion } from '../api/estadoMultiFuncion';
import { getPersonal } from '../api/personal';
import { getContratistas } from '../api/contratista';
import { getProductos } from '../api/producto';
import { getAlmacenes } from '../api/almacen';
import { useAuthStore } from '../shared/stores/useAuthStore';
import OTMantenimientoForm from '../components/oTMantenimiento/OTMantenimientoForm';

/**
 * Componente OTMantenimiento
 * Pantalla principal para gestión de órdenes de trabajo de mantenimiento
 */
const OTMantenimiento = () => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  
  // Estados del componente
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

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

  /**
   * Carga las órdenes de trabajo desde la API
   */
  const cargarOrdenesTrabajo = async () => {
    try {
      setLoading(true);
      const data = await getOrdenesTrabajoMantenimiento();
      
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
      
      setOrdenesTrabajo(ordenesNormalizadas);
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
        productosData
      ] = await Promise.all([
        getEmpresas(),
        getSedes(),
        getAlmacenes(),
        getActivos(),
        getTiposMantenimiento(),
        getMotivosOrigenOT(),
        getEstadosMultiFuncion(7), // Estados de OT (tipoProvieneDe = 7)
        getEstadosMultiFuncion(8), // Estados de Tareas (tipoProvieneDe = 8)
        getEstadosMultiFuncion(9), // Estados de Insumos (tipoProvieneDe = 9)
        getPersonal(),
        getContratistas(),
        getProductos()
      ]);

      // Normalizar IDs
      setEmpresas(empresasData.map(e => ({ ...e, id: Number(e.id) })));
      setSedes(sedesData.map(s => ({ ...s, id: Number(s.id) })));
      setAlmacenes(almacenesData.map(a => ({ ...a, id: Number(a.id) })));
      setActivos(activosData.map(a => ({ ...a, id: Number(a.id) })));
      setTiposMantenimiento(tiposData.map(t => ({ ...t, id: Number(t.id) })));
      setMotivosOrigen(motivosData.map(m => ({ ...m, id: Number(m.id) })));
      setEstadosDoc(estadosDocData.map(e => ({ ...e, id: Number(e.id) })));
      setEstadosTarea(estadosTareaData.map(e => ({ ...e, id: Number(e.id) })));
      setEstadosInsumo(estadosInsumoData.map(e => ({ ...e, id: Number(e.id) })));
      setPersonalOptions(personalData.map(p => ({ ...p, id: Number(p.id) })));
      setContratistas(contratistasData.map(c => ({ ...c, id: Number(c.id) })));
      setProductos(productosData.map(p => ({ ...p, id: Number(p.id) })));
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
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarOrdenesTrabajo();
    cargarCatalogos();
  }, []);

  /**
   * Abre el diálogo para crear nueva orden de trabajo
   */
  const abrirDialogoNuevo = () => {
    setOrdenSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar orden de trabajo (clic en fila)
   */
  const editarOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setOrdenSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarOrdenesTrabajo();
  };

  /**
   * Confirma la eliminación de una orden de trabajo
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (orden) => {
    // Control de roles según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar órdenes de trabajo'
      });
      return;
    }

    const confirmar = () => {
      eliminarOrdenTrabajo(orden.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar la orden de trabajo "${orden.codigo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: confirmar,
      reject: rechazar
    });
  };

  /**
   * Elimina una orden de trabajo
   */
  const eliminarOrdenTrabajo = async (id) => {
    try {
      await eliminarOrdenTrabajo(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Orden de trabajo eliminada correctamente'
      });
      await cargarOrdenesTrabajo();
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
   * Maneja el filtro global
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilter(value);
  };

  /**
   * Template para el código de la orden
   */
  const codigoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-wrench mr-2 text-blue-500"></i>
        <span className="font-bold">{rowData.codigo}</span>
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
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    return fecha ? new Date(fecha).toLocaleDateString('es-PE') : '-';
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
   * Template para acciones
   * Solo muestra eliminar para superusuario o admin
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Header del toolbar
   */
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nueva Orden"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
        />
      </div>
    );
  };

  /**
   * Filtro global del toolbar
   */
  const rightToolbarTemplate = () => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
            className="w-full sm:w-auto"
          />
        </span>
      </div>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={ordenesTrabajo}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['codigo', 'descripcion', 'tipoMantenimiento.nombre', 'motivoOrigino.nombre']}
          emptyMessage="No se encontraron órdenes de trabajo"
          onRowClick={(e) => editarOrden(e.data)}
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="codigo" 
            header="Código" 
            body={codigoTemplate}
            sortable 
            frozen
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="tipoMantenimiento.nombre" 
            header="Tipo Mantenimiento" 
            body={tipoMantenimientoTemplate}
            sortable 
            style={{ minWidth: '180px' }}
          />
          
          <Column 
            field="motivoOrigino.nombre" 
            header="Motivo Origen" 
            body={motivoOrigenTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="prioridadAlta" 
            header="Prioridad" 
            body={prioridadTemplate}
            sortable 
            style={{ minWidth: '100px' }}
          />
          
          <Column 
            field="fechaProgramada" 
            header="Fecha Programada" 
            body={(rowData) => fechaTemplate(rowData, 'fechaProgramada')}
            sortable 
            style={{ minWidth: '130px' }}
          />
          
          <Column 
            field="fechaInicio" 
            header="Fecha Inicio" 
            body={(rowData) => fechaTemplate(rowData, 'fechaInicio')}
            sortable 
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="fechaFin" 
            header="Fecha Fin" 
            body={(rowData) => fechaTemplate(rowData, 'fechaFin')}
            sortable 
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="responsable.nombres" 
            header="Responsable" 
            body={responsableTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="descripcion" 
            header="Descripción" 
            sortable 
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            body={accionesTemplate} 
            header="Acciones" 
            frozen 
            alignFrozen="right"
            style={{ minWidth: '100px' }}
          />
        </DataTable>
      </div>

      {/* Diálogo del formulario */}
      <Dialog
        visible={dialogoVisible}
        style={{ width: '90vw', maxWidth: '1200px' }}
        header={ordenSeleccionada?.id ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <OTMantenimientoForm
          isEdit={!!ordenSeleccionada?.id}
          defaultValues={ordenSeleccionada}
          onSubmit={onGuardar}
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
          permisos={{ eliminar: usuario?.rol === 'superusuario' || usuario?.rol === 'admin' }}
          loading={loading}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default OTMantenimiento;
