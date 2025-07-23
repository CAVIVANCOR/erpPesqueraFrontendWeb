/**
 * Pantalla CRUD profesional para DetDocsReqCotizaCompras
 * Gestiona los documentos requeridos para cotizaciones de compras del sistema ERP Megui.
 * 
 * Funcionalidades implementadas:
 * - DataTable con filtros globales y por columna
 * - Edición por clic en fila (regla transversal ERP Megui)
 * - Eliminación con confirmación y control de roles (solo superusuario/admin)
 * - Formulario modal para crear/editar
 * - Templates especializados para fechas, estados y archivos
 * - Filtros por cotización, tipo documento, estados de entrega y validación
 * - Gestión de archivos adjuntos con URLs públicas
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { 
  obtenerDetallesDocsReqCotizaCompras, 
  eliminarDetalleDocReqCotizaCompra,
  obtenerDetallesPorCotizacionCompra,
  obtenerDetallesPorTipoDocumento,
  obtenerDetallesPorEstadoEntrega,
  obtenerDetallesPorEstadoValidacion
} from '../api/detDocsReqCotizaCompras';
import DetDocsReqCotizaComprasForm from '../components/detDocsReqCotizaCompras/DetDocsReqCotizaComprasForm';

/**
 * Componente principal DetDocsReqCotizaCompras
 * Implementa el patrón CRUD profesional del ERP Megui
 */
const DetDocsReqCotizaCompras = () => {
  const toast = useRef(null);
  const dt = useRef(null);
  const { usuario } = useAuthStore();

  // Estados principales
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState('');

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'cotizacionCompra.codigo': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'tipoDocumento.nombre': { value: null, matchMode: FilterMatchMode.CONTAINS },
    numeroDocumento: { value: null, matchMode: FilterMatchMode.CONTAINS },
    obligatorio: { value: null, matchMode: FilterMatchMode.EQUALS },
    entregado: { value: null, matchMode: FilterMatchMode.EQUALS },
    validado: { value: null, matchMode: FilterMatchMode.EQUALS },
    fechaVencimiento: { value: null, matchMode: FilterMatchMode.DATE_IS },
    fechaEntrega: { value: null, matchMode: FilterMatchMode.DATE_IS }
  });

  // Opciones para filtros de estado
  const opcionesEstado = [
    { label: 'Sí', value: true },
    { label: 'No', value: false }
  ];

  /**
   * Carga inicial de datos
   */
  useEffect(() => {
    cargarDetalles();
  }, []);

  /**
   * Carga todos los detalles de documentos desde la API
   */
  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const datos = await obtenerDetallesDocsReqCotizaCompras();
      setDetalles(datos);
    } catch (error) {
      console.error('Error al cargar detalles de documentos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los detalles de documentos requeridos'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el filtro global
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filtros = { ...filtros };
    _filtros['global'].value = value;
    setFiltros(_filtros);
    setGlobalFilterValue(value);
  };

  /**
   * Abre el diálogo para crear un nuevo detalle
   */
  const abrirNuevo = () => {
    setDetalleSeleccionado(null);
    setDialogVisible(true);
  };

  /**
   * Abre el diálogo para editar un detalle existente
   * Implementa edición por clic en fila (regla transversal ERP Megui)
   */
  const editarDetalle = (detalle) => {
    setDetalleSeleccionado({ ...detalle });
    setDialogVisible(true);
  };

  /**
   * Confirma y ejecuta la eliminación de un detalle
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el documento "${detalle.tipoDocumento?.nombre}" de la cotización "${detalle.cotizacionCompra?.codigo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle)
    });
  };

  /**
   * Elimina un detalle de documento
   */
  const eliminarDetalle = async (detalle) => {
    try {
      await eliminarDetalleDocReqCotizaCompra(detalle.id);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle de documento eliminado correctamente'
      });
      
      await cargarDetalles();
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el detalle de documento'
      });
    }
  };

  /**
   * Maneja el guardado exitoso desde el formulario
   */
  const onDetalleGuardado = async () => {
    setDialogVisible(false);
    await cargarDetalles();
  };

  /**
   * Exporta los datos a Excel
   */
  const exportarExcel = () => {
    dt.current?.exportCSV();
  };

  /**
   * Template para mostrar el código de cotización con icono
   */
  const cotizacionTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-shopping-cart text-blue-500"></i>
        <span className="font-medium">{rowData.cotizacionCompra?.codigo || 'N/A'}</span>
      </div>
    );
  };

  /**
   * Template para mostrar el tipo de documento con icono
   */
  const tipoDocumentoTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-file text-orange-500"></i>
        <span>{rowData.tipoDocumento?.nombre || 'N/A'}</span>
      </div>
    );
  };

  /**
   * Template para mostrar el número de documento
   */
  const numeroDocumentoTemplate = (rowData) => {
    return rowData.numeroDocumento ? (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-hashtag text-gray-500"></i>
        <span className="font-mono">{rowData.numeroDocumento}</span>
      </div>
    ) : (
      <span className="text-gray-400">Sin número</span>
    );
  };

  /**
   * Template para mostrar estado obligatorio
   */
  const obligatorioTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'} 
        severity={rowData.obligatorio ? 'danger' : 'info'}
        icon={rowData.obligatorio ? 'pi pi-exclamation-circle' : 'pi pi-info-circle'}
      />
    );
  };

  /**
   * Template para mostrar estado de entrega
   */
  const entregadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.entregado ? 'ENTREGADO' : 'PENDIENTE'} 
        severity={rowData.entregado ? 'success' : 'warning'}
        icon={rowData.entregado ? 'pi pi-check-circle' : 'pi pi-clock'}
      />
    );
  };

  /**
   * Template para mostrar estado de validación
   */
  const validadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.validado ? 'VALIDADO' : 'SIN VALIDAR'} 
        severity={rowData.validado ? 'success' : 'secondary'}
        icon={rowData.validado ? 'pi pi-verified' : 'pi pi-times-circle'}
      />
    );
  };

  /**
   * Template para mostrar fechas formateadas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    if (!fecha) return <span className="text-gray-400">Sin fecha</span>;
    
    return (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-calendar text-blue-500"></i>
        <span>{new Date(fecha).toLocaleDateString('es-ES')}</span>
      </div>
    );
  };

  /**
   * Template para mostrar archivo adjunto
   */
  const archivoTemplate = (rowData) => {
    return rowData.urlArchivo ? (
      <Button
        icon="pi pi-download"
        label="Descargar"
        className="p-button-text p-button-sm"
        onClick={() => window.open(rowData.urlArchivo, '_blank')}
      />
    ) : (
      <span className="text-gray-400">Sin archivo</span>
    );
  };

  /**
   * Template para mostrar validador
   */
  const validadorTemplate = (rowData) => {
    return rowData.validadoPor ? (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-user text-green-500"></i>
        <span>{rowData.validadoPor.nombre}</span>
      </div>
    ) : (
      <span className="text-gray-400">Sin validar</span>
    );
  };

  /**
   * Template para acciones (botón eliminar solo para superusuario/admin)
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-text"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar detalle"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Header del DataTable con filtro global
   */
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Documentos Requeridos - Cotizaciones de Compras</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar documentos..."
        />
      </span>
    </div>
  );

  /**
   * Toolbar con botones de acción
   */
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirNuevo}
        />
        <Button
          label="Exportar"
          icon="pi pi-upload"
          className="p-button-help"
          onClick={exportarExcel}
        />
      </div>
    );
  };

  return (
    <div className="datatable-crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <Toolbar className="mb-4" left={leftToolbarTemplate} />

        <DataTable
          ref={dt}
          value={detalles}
          selection={detalleSeleccionado}
          onSelectionChange={(e) => setDetalleSeleccionado(e.value)}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
          globalFilterFields={['cotizacionCompra.codigo', 'tipoDocumento.nombre', 'numeroDocumento', 'observaciones']}
          filters={filtros}
          filterDisplay="row"
          loading={loading}
          emptyMessage="No se encontraron documentos requeridos."
          header={header}
          onRowClick={(e) => editarDetalle(e.data)}
          rowHover
          stripedRows
          showGridlines
          size="small"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="cotizacionCompra.codigo" 
            header="Cotización" 
            body={cotizacionTemplate}
            sortable 
            filter 
            filterPlaceholder="Buscar por cotización"
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="tipoDocumento.nombre" 
            header="Tipo Documento" 
            body={tipoDocumentoTemplate}
            sortable 
            filter 
            filterPlaceholder="Buscar por tipo"
            style={{ minWidth: '200px' }}
          />
          
          <Column 
            field="numeroDocumento" 
            header="Número" 
            body={numeroDocumentoTemplate}
            sortable 
            filter 
            filterPlaceholder="Buscar por número"
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="obligatorio" 
            header="Obligatorio" 
            body={obligatorioTemplate}
            sortable 
            filter 
            filterElement={
              <Dropdown 
                value={filtros.obligatorio.value} 
                options={opcionesEstado} 
                onChange={(e) => {
                  let _filtros = { ...filtros };
                  _filtros.obligatorio.value = e.value;
                  setFiltros(_filtros);
                }} 
                placeholder="Todos"
                className="p-column-filter"
                showClear
              />
            }
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="entregado" 
            header="Entregado" 
            body={entregadoTemplate}
            sortable 
            filter 
            filterElement={
              <Dropdown 
                value={filtros.entregado.value} 
                options={opcionesEstado} 
                onChange={(e) => {
                  let _filtros = { ...filtros };
                  _filtros.entregado.value = e.value;
                  setFiltros(_filtros);
                }} 
                placeholder="Todos"
                className="p-column-filter"
                showClear
              />
            }
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="validado" 
            header="Validado" 
            body={validadoTemplate}
            sortable 
            filter 
            filterElement={
              <Dropdown 
                value={filtros.validado.value} 
                options={opcionesEstado} 
                onChange={(e) => {
                  let _filtros = { ...filtros };
                  _filtros.validado.value = e.value;
                  setFiltros(_filtros);
                }} 
                placeholder="Todos"
                className="p-column-filter"
                showClear
              />
            }
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="fechaVencimiento" 
            header="F. Vencimiento" 
            body={(rowData) => fechaTemplate(rowData, 'fechaVencimiento')}
            sortable 
            filter 
            filterElement={
              <Calendar 
                value={filtros.fechaVencimiento.value} 
                onChange={(e) => {
                  let _filtros = { ...filtros };
                  _filtros.fechaVencimiento.value = e.value;
                  setFiltros(_filtros);
                }} 
                placeholder="Filtrar por fecha"
                className="p-column-filter"
                showIcon
              />
            }
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="fechaEntrega" 
            header="F. Entrega" 
            body={(rowData) => fechaTemplate(rowData, 'fechaEntrega')}
            sortable 
            filter 
            filterElement={
              <Calendar 
                value={filtros.fechaEntrega.value} 
                onChange={(e) => {
                  let _filtros = { ...filtros };
                  _filtros.fechaEntrega.value = e.value;
                  setFiltros(_filtros);
                }} 
                placeholder="Filtrar por fecha"
                className="p-column-filter"
                showIcon
              />
            }
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            field="urlArchivo" 
            header="Archivo" 
            body={archivoTemplate}
            style={{ minWidth: '120px' }}
          />
          
          <Column 
            field="validadoPor" 
            header="Validado Por" 
            body={validadorTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          
          <Column 
            body={accionesTemplate} 
            exportable={false} 
            style={{ minWidth: '100px' }}
          />
        </DataTable>
      </div>

      {/* Diálogo del formulario */}
      <Dialog
        visible={dialogVisible}
        style={{ width: '800px' }}
        header={detalleSeleccionado ? 'Editar Documento Requerido' : 'Nuevo Documento Requerido'}
        modal
        className="p-fluid"
        onHide={() => setDialogVisible(false)}
      >
        <DetDocsReqCotizaComprasForm
          detalle={detalleSeleccionado}
          onSave={onDetalleGuardado}
          onCancel={() => setDialogVisible(false)}
        />
      </Dialog>
    </div>
  );
};

export default DetDocsReqCotizaCompras;
