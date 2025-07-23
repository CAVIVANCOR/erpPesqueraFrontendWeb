/**
 * Pantalla CRUD profesional para AccesoInstalacionDetalle
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Gestiona detalles de accesos a instalaciones con equipos y movimientos.
 * 
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal)
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo
 * - Feedback visual con Toast
 * - Documentación de la regla en el encabezado
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
import { obtenerDetallesAccesoInstalacion, eliminarDetalleAccesoInstalacion } from '../api/accesoInstalacionDetalle';
import { useAuthStore } from '../shared/stores/useAuthStore';
import AccesoInstalacionDetalleForm from '../components/accesoInstalacionDetalle/AccesoInstalacionDetalleForm';

/**
 * Componente AccesoInstalacionDetalle
 * Pantalla principal para gestión de detalles de accesos a instalaciones
 */
const AccesoInstalacionDetalle = () => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  
  // Estados del componente
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  /**
   * Carga los detalles de accesos desde la API
   */
  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await obtenerDetallesAccesoInstalacion();
      
      // Normalizar IDs según regla ERP Megui
      const detallesNormalizados = data.map(detalle => ({
        ...detalle,
        id: Number(detalle.id),
        accesoInstalacionId: Number(detalle.accesoInstalacionId),
        tipoEquipoId: detalle.tipoEquipoId ? Number(detalle.tipoEquipoId) : null,
        tipoMovimientoId: detalle.tipoMovimientoId ? Number(detalle.tipoMovimientoId) : null,
        personalId: detalle.personalId ? Number(detalle.personalId) : null
      }));
      
      setDetalles(detallesNormalizados);
    } catch (error) {
      console.error('Error al cargar detalles de accesos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los detalles de accesos a instalaciones'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarDetalles();
  }, []);

  /**
   * Abre el diálogo para crear nuevo detalle
   */
  const abrirDialogoNuevo = () => {
    setDetalleSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar detalle (clic en fila)
   */
  const editarDetalle = (detalle) => {
    setDetalleSeleccionado(detalle);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setDetalleSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarDetalles();
  };

  /**
   * Confirma la eliminación de un detalle
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (detalle) => {
    // Control de roles según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar detalles de accesos'
      });
      return;
    }

    const confirmar = () => {
      eliminarDetalleAcceso(detalle.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar el detalle de acceso "${detalle.numeroEquipo || 'N/A'}" del equipo "${detalle.tipoEquipo?.nombre || 'N/A'}"?`,
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
   * Elimina un detalle de acceso
   */
  const eliminarDetalleAcceso = async (id) => {
    try {
      await eliminarDetalleAccesoInstalacion(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle de acceso eliminado correctamente'
      });
      await cargarDetalles();
    } catch (error) {
      console.error('Error al eliminar detalle de acceso:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al eliminar el detalle de acceso'
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
   * Template para el acceso a instalación
   */
  const accesoInstalacionTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-shield mr-2 text-blue-500"></i>
        <span className="font-medium">
          {rowData.accesoInstalacion?.codigo || `ID: ${rowData.accesoInstalacionId}`}
        </span>
      </div>
    );
  };

  /**
   * Template para el tipo de equipo
   */
  const tipoEquipoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-cog mr-2 text-green-500"></i>
        <span className="font-medium">{rowData.tipoEquipo?.nombre || 'N/A'}</span>
      </div>
    );
  };

  /**
   * Template para el número de equipo
   */
  const numeroEquipoTemplate = (rowData) => {
    return rowData.numeroEquipo ? (
      <div className="flex align-items-center">
        <i className="pi pi-tag mr-2 text-orange-500"></i>
        <span className="font-medium">{rowData.numeroEquipo}</span>
      </div>
    ) : (
      <span className="text-500">-</span>
    );
  };

  /**
   * Template para el tipo de movimiento
   */
  const tipoMovimientoTemplate = (rowData) => {
    if (!rowData.tipoMovimiento) {
      return <span className="text-500">-</span>;
    }

    const esIngreso = rowData.tipoMovimiento.nombre?.toLowerCase().includes('ingreso') || 
                      rowData.tipoMovimiento.nombre?.toLowerCase().includes('entrada');
    
    return (
      <Tag 
        value={rowData.tipoMovimiento.nombre} 
        severity={esIngreso ? 'success' : 'info'}
        icon={esIngreso ? 'pi pi-arrow-down' : 'pi pi-arrow-up'}
      />
    );
  };

  /**
   * Template para el personal
   */
  const personalTemplate = (rowData) => {
    return rowData.personal ? (
      <div className="flex align-items-center">
        <i className="pi pi-user mr-2 text-purple-500"></i>
        <span>{`${rowData.personal.nombres} ${rowData.personal.apellidos}`}</span>
      </div>
    ) : (
      <span className="text-500">-</span>
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
   * Template para observaciones
   */
  const observacionesTemplate = (rowData) => {
    if (!rowData.observaciones) {
      return <span className="text-500">-</span>;
    }
    
    const texto = rowData.observaciones.length > 50 
      ? `${rowData.observaciones.substring(0, 50)}...` 
      : rowData.observaciones;
    
    return (
      <span 
        title={rowData.observaciones}
        className="text-sm"
      >
        {texto}
      </span>
    );
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
          label="Nuevo Detalle"
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
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['numeroEquipo', 'tipoEquipo.nombre', 'tipoMovimiento.nombre', 'personal.nombres', 'observaciones']}
          emptyMessage="No se encontraron detalles de accesos"
          onRowClick={(e) => editarDetalle(e.data)}
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="accesoInstalacion.codigo" 
            header="Acceso Instalación" 
            body={accesoInstalacionTemplate}
            sortable 
            frozen
            style={{ minWidth: '180px' }}
          />
          
          <Column 
            field="tipoEquipo.nombre" 
            header="Tipo Equipo" 
            body={tipoEquipoTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="numeroEquipo" 
            header="Número Equipo" 
            body={numeroEquipoTemplate}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="tipoMovimiento.nombre" 
            header="Tipo Movimiento" 
            body={tipoMovimientoTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="personal.nombres" 
            header="Personal" 
            body={personalTemplate}
            sortable 
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="fechaMovimiento" 
            header="Fecha Movimiento" 
            body={(rowData) => fechaTemplate(rowData, 'fechaMovimiento')}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="observaciones" 
            header="Observaciones" 
            body={observacionesTemplate}
            sortable 
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="createdAt" 
            header="Fecha Creación" 
            body={(rowData) => fechaTemplate(rowData, 'createdAt')}
            sortable 
            style={{ minWidth: '140px' }}
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
        style={{ width: '90vw', maxWidth: '800px' }}
        header={detalleSeleccionado?.id ? 'Editar Detalle de Acceso' : 'Nuevo Detalle de Acceso'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <AccesoInstalacionDetalleForm
          detalle={detalleSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default AccesoInstalacionDetalle;
