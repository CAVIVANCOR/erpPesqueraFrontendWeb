/**
 * Pantalla CRUD profesional para TiposDocIdentidad
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, codigo, codSunat, nombre, cesado, createdAt, updatedAt
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
import { getTiposDocIdentidad, eliminarTipoDocIdentidad } from '../api/tiposDocIdentidad';
import { useAuthStore } from '../shared/stores/useAuthStore';
import TiposDocIdentidadForm from '../components/tiposDocIdentidad/TiposDocIdentidadForm';

/**
 * Componente TiposDocIdentidad
 * Pantalla principal para gestión de tipos de documentos de identidad
 */
const TiposDocIdentidad = () => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  
  // Estados del componente
  const [tiposDoc, setTiposDoc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoDocSeleccionado, setTipoDocSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  /**
   * Carga los tipos de documentos desde la API
   */
  const cargarTiposDoc = async () => {
    try {
      setLoading(true);
      const data = await getTiposDocIdentidad();
      
      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map(tipo => ({
        ...tipo,
        id: Number(tipo.id)
      }));
      
      setTiposDoc(tiposNormalizados);
    } catch (error) {
      console.error('Error al cargar tipos de documentos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los tipos de documentos de identidad'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTiposDoc();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo de documento
   */
  const abrirDialogoNuevo = () => {
    setTipoDocSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo de documento (clic en fila)
   */
  const editarTipoDoc = (tipoDoc) => {
    setTipoDocSeleccionado(tipoDoc);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoDocSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTiposDoc();
  };

  /**
   * Confirma la eliminación de un tipo de documento
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipoDoc) => {
    // Control de roles según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar tipos de documentos'
      });
      return;
    }

    const confirmar = () => {
      eliminarTipoDocumento(tipoDoc.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar el tipo de documento "${tipoDoc.nombre}"?`,
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
   * Elimina un tipo de documento
   */
  const eliminarTipoDocumento = async (id) => {
    try {
      await eliminarTipoDocIdentidad(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de documento eliminado correctamente'
      });
      await cargarTiposDoc();
    } catch (error) {
      console.error('Error al eliminar tipo de documento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al eliminar el tipo de documento'
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
   * Template para el código del tipo de documento
   */
  const codigoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-id-card mr-2 text-blue-500"></i>
        <span className="font-bold">{rowData.codigo}</span>
      </div>
    );
  };

  /**
   * Template para el código SUNAT
   */
  const codSunatTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-bookmark mr-2 text-green-500"></i>
        <span className="font-medium">{rowData.codSunat}</span>
      </div>
    );
  };

  /**
   * Template para el estado cesado
   */
  const estadoTemplate = (rowData) => {
    return rowData.cesado ? (
      <Tag value="CESADO" severity="danger" />
    ) : (
      <Tag value="ACTIVO" severity="success" />
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
          value={tiposDoc}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de documentos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['codigo', 'codSunat', 'nombre']}
          emptyMessage="No se encontraron tipos de documentos"
          onRowClick={(e) => editarTipoDoc(e.data)}
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
            field="codSunat" 
            header="Código SUNAT" 
            body={codSunatTemplate}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="nombre" 
            header="Nombre" 
            sortable 
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="cesado" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ minWidth: '100px' }}
          />
          
          <Column 
            field="createdAt" 
            header="Fecha Creación" 
            body={(rowData) => fechaTemplate(rowData, 'createdAt')}
            sortable 
            style={{ minWidth: '130px' }}
          />
          
          <Column 
            field="updatedAt" 
            header="Fecha Actualización" 
            body={(rowData) => fechaTemplate(rowData, 'updatedAt')}
            sortable 
            style={{ minWidth: '150px' }}
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
        style={{ width: '600px' }}
        header={tipoDocSeleccionado?.id ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TiposDocIdentidadForm
          tipoDoc={tipoDocSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default TiposDocIdentidad;
