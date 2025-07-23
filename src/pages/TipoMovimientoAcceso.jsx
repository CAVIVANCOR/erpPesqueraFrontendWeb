/**
 * Pantalla CRUD profesional para TipoMovimientoAcceso
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Gestiona tipos de movimientos de acceso (ingreso, salida, transferencia, etc.).
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
import { obtenerTiposMovimientoAcceso, eliminarTipoMovimientoAcceso, cambiarEstadoTipoMovimiento } from '../api/tipoMovimientoAcceso';
import { useAuthStore } from '../shared/stores/useAuthStore';
import TipoMovimientoAccesoForm from '../components/tipoMovimientoAcceso/TipoMovimientoAccesoForm';

/**
 * Componente TipoMovimientoAcceso
 * Pantalla principal para gestión de tipos de movimientos de acceso
 */
const TipoMovimientoAcceso = () => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  
  // Estados del componente
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  /**
   * Carga los tipos de movimientos desde la API
   */
  const cargarTipos = async () => {
    try {
      setLoading(true);
      const data = await obtenerTiposMovimientoAcceso();
      
      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map(tipo => ({
        ...tipo,
        id: Number(tipo.id),
        codigo: tipo.codigo?.trim().toUpperCase() || '',
        nombre: tipo.nombre?.trim() || '',
        activo: Boolean(tipo.activo)
      }));
      
      setTipos(tiposNormalizados);
    } catch (error) {
      console.error('Error al cargar tipos de movimientos de acceso:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los tipos de movimientos de acceso'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTipos();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo
   */
  const abrirDialogoNuevo = () => {
    setTipoSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo (clic en fila)
   */
  const editarTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTipos();
  };

  /**
   * Confirma la eliminación de un tipo
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipo) => {
    // Control de roles según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar tipos de movimientos'
      });
      return;
    }

    const confirmar = () => {
      eliminarTipoMovimiento(tipo.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar el tipo de movimiento "${tipo.nombre}" (${tipo.codigo})?`,
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
   * Elimina un tipo de movimiento
   */
  const eliminarTipoMovimiento = async (id) => {
    try {
      await eliminarTipoMovimientoAcceso(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de movimiento eliminado correctamente'
      });
      await cargarTipos();
    } catch (error) {
      console.error('Error al eliminar tipo de movimiento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al eliminar el tipo de movimiento'
      });
    }
  };

  /**
   * Cambia el estado activo/inactivo de un tipo
   */
  const cambiarEstado = async (tipo) => {
    try {
      const nuevoEstado = !tipo.activo;
      await cambiarEstadoTipoMovimiento(tipo.id, nuevoEstado);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Tipo de movimiento ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`
      });
      
      await cargarTipos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cambiar el estado del tipo de movimiento'
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
   * Template para el código
   */
  const codigoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-tag mr-2 text-blue-500"></i>
        <span className="font-bold">{rowData.codigo}</span>
      </div>
    );
  };

  /**
   * Template para el nombre
   */
  const nombreTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-arrow-right-arrow-left mr-2 text-green-500"></i>
        <span className="font-medium">{rowData.nombre}</span>
      </div>
    );
  };

  /**
   * Template para el estado activo
   */
  const estadoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.activo ? 'ACTIVO' : 'INACTIVO'} 
          severity={rowData.activo ? 'success' : 'danger'}
        />
        <Button
          icon={rowData.activo ? 'pi pi-eye-slash' : 'pi pi-eye'}
          className={`p-button-rounded p-button-text p-button-sm ${
            rowData.activo ? 'p-button-warning' : 'p-button-success'
          }`}
          onClick={() => cambiarEstado(rowData)}
          tooltip={rowData.activo ? 'Desactivar' : 'Activar'}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
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
   * Template para descripción
   */
  const descripcionTemplate = (rowData) => {
    if (!rowData.descripcion) {
      return <span className="text-500">-</span>;
    }
    
    const texto = rowData.descripcion.length > 60 
      ? `${rowData.descripcion.substring(0, 60)}...` 
      : rowData.descripcion;
    
    return (
      <span 
        title={rowData.descripcion}
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
          label="Nuevo Tipo"
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
          value={tipos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['codigo', 'nombre', 'descripcion']}
          emptyMessage="No se encontraron tipos de movimientos de acceso"
          onRowClick={(e) => editarTipo(e.data)}
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
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="nombre" 
            header="Nombre" 
            body={nombreTemplate}
            sortable 
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="descripcion" 
            header="Descripción" 
            body={descripcionTemplate}
            sortable 
            style={{ minWidth: '250px' }}
          />
          
          <Column 
            field="activo" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="createdAt" 
            header="Fecha Creación" 
            body={(rowData) => fechaTemplate(rowData, 'createdAt')}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="updatedAt" 
            header="Última Actualización" 
            body={(rowData) => fechaTemplate(rowData, 'updatedAt')}
            sortable 
            style={{ minWidth: '160px' }}
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
        style={{ width: '90vw', maxWidth: '600px' }}
        header={tipoSeleccionado?.id ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <TipoMovimientoAccesoForm
          tipo={tipoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TipoMovimientoAcceso;
