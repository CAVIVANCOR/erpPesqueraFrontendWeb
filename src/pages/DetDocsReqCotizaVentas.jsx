/**
 * Pantalla CRUD profesional para DetDocsReqCotizaVentas
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Gestiona documentos requeridos para cotizaciones de ventas.
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
import { getDetallesDocsReqCotizaVentas, eliminarDetalleDocReqCotizaVentas } from '../api/detDocsReqCotizaVentas';
import { useAuthStore } from '../shared/stores/useAuthStore';
import DetDocsReqCotizaVentasForm from '../components/detDocsReqCotizaVentas/DetDocsReqCotizaVentasForm';

/**
 * Componente DetDocsReqCotizaVentas
 * Pantalla principal para gestión de documentos requeridos para cotizaciones de ventas
 */
const DetDocsReqCotizaVentas = () => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  
  // Estados del componente
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  /**
   * Carga los documentos requeridos desde la API
   */
  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const data = await getDetallesDocsReqCotizaVentas();
      
      // Normalizar IDs según regla ERP Megui
      const documentosNormalizados = data.map(doc => ({
        ...doc,
        id: Number(doc.id),
        cotizacionVentaId: Number(doc.cotizacionVentaId),
        tipoDocumentoId: Number(doc.tipoDocumentoId),
        validadoPorId: doc.validadoPorId ? Number(doc.validadoPorId) : null
      }));
      
      setDocumentos(documentosNormalizados);
    } catch (error) {
      console.error('Error al cargar documentos requeridos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los documentos requeridos'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarDocumentos();
  }, []);

  /**
   * Abre el diálogo para crear nuevo documento requerido
   */
  const abrirDialogoNuevo = () => {
    setDocumentoSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar documento requerido (clic en fila)
   */
  const editarDocumento = (documento) => {
    setDocumentoSeleccionado(documento);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setDocumentoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarDocumentos();
  };

  /**
   * Confirma la eliminación de un documento requerido
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (documento) => {
    // Control de roles según regla transversal ERP Megui
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar documentos requeridos'
      });
      return;
    }

    const confirmar = () => {
      eliminarDocumentoRequerido(documento.id);
    };

    const rechazar = () => {
      // No hacer nada
    };

    confirmDialog({
      message: `¿Está seguro de eliminar el documento requerido "${documento.tipoDocumento?.nombre || 'N/A'}"?`,
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
   * Elimina un documento requerido
   */
  const eliminarDocumentoRequerido = async (id) => {
    try {
      await eliminarDetalleDocReqCotizaVentas(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Documento requerido eliminado correctamente'
      });
      await cargarDocumentos();
    } catch (error) {
      console.error('Error al eliminar documento requerido:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al eliminar el documento requerido'
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
   * Template para el tipo de documento
   */
  const tipoDocumentoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-file mr-2 text-blue-500"></i>
        <span className="font-medium">{rowData.tipoDocumento?.nombre || 'N/A'}</span>
      </div>
    );
  };

  /**
   * Template para la cotización de venta
   */
  const cotizacionTemplate = (rowData) => {
    return (
      <div className="flex align-items-center">
        <i className="pi pi-shopping-cart mr-2 text-green-500"></i>
        <span className="font-medium">{rowData.cotizacionVenta?.codigo || rowData.cotizacionVentaId}</span>
      </div>
    );
  };

  /**
   * Template para documento obligatorio
   */
  const obligatorioTemplate = (rowData) => {
    return rowData.obligatorio ? (
      <Tag value="OBLIGATORIO" severity="danger" />
    ) : (
      <Tag value="OPCIONAL" severity="info" />
    );
  };

  /**
   * Template para estado de entrega
   */
  const entregadoTemplate = (rowData) => {
    return rowData.entregado ? (
      <Tag value="ENTREGADO" severity="success" />
    ) : (
      <Tag value="PENDIENTE" severity="warning" />
    );
  };

  /**
   * Template para estado de validación
   */
  const validadoTemplate = (rowData) => {
    if (!rowData.entregado) {
      return <Tag value="N/A" severity="secondary" />;
    }
    return rowData.validado ? (
      <Tag value="VALIDADO" severity="success" />
    ) : (
      <Tag value="POR VALIDAR" severity="warning" />
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
   * Template para número de documento
   */
  const numeroDocumentoTemplate = (rowData) => {
    return rowData.numeroDocumento ? (
      <span className="font-medium">{rowData.numeroDocumento}</span>
    ) : (
      <span className="text-500">-</span>
    );
  };

  /**
   * Template para archivo
   */
  const archivoTemplate = (rowData) => {
    return rowData.urlArchivo ? (
      <Button
        icon="pi pi-download"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => window.open(rowData.urlArchivo, '_blank')}
        tooltip="Descargar archivo"
        tooltipOptions={{ position: 'top' }}
      />
    ) : (
      <span className="text-500">-</span>
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
          label="Nuevo Documento"
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
          value={documentos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['tipoDocumento.nombre', 'numeroDocumento', 'observaciones']}
          emptyMessage="No se encontraron documentos requeridos"
          onRowClick={(e) => editarDocumento(e.data)}
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="tipoDocumento.nombre" 
            header="Tipo Documento" 
            body={tipoDocumentoTemplate}
            sortable 
            frozen
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="cotizacionVenta.codigo" 
            header="Cotización" 
            body={cotizacionTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="obligatorio" 
            header="Prioridad" 
            body={obligatorioTemplate}
            sortable 
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="numeroDocumento" 
            header="Número Documento" 
            body={numeroDocumentoTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="entregado" 
            header="Estado Entrega" 
            body={entregadoTemplate}
            sortable 
            style={{ minWidth: '130px' }}
          />
          
          <Column 
            field="validado" 
            header="Estado Validación" 
            body={validadoTemplate}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="fechaVencimiento" 
            header="Fecha Vencimiento" 
            body={(rowData) => fechaTemplate(rowData, 'fechaVencimiento')}
            sortable 
            style={{ minWidth: '140px' }}
          />
          
          <Column 
            field="fechaEntrega" 
            header="Fecha Entrega" 
            body={(rowData) => fechaTemplate(rowData, 'fechaEntrega')}
            sortable 
            style={{ minWidth: '130px' }}
          />
          
          <Column 
            field="urlArchivo" 
            header="Archivo" 
            body={archivoTemplate}
            style={{ minWidth: '80px' }}
          />
          
          <Column 
            field="observaciones" 
            header="Observaciones" 
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
        style={{ width: '90vw', maxWidth: '1000px' }}
        header={documentoSeleccionado?.id ? 'Editar Documento Requerido' : 'Nuevo Documento Requerido'}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
      >
        <DetDocsReqCotizaVentasForm
          documento={documentoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetDocsReqCotizaVentas;
