// src/pages/DetalleDocTripulantes.jsx
// CRUD profesional para DetalleDocTripulantes - ERP Megui
// Pantalla principal con DataTable, filtros, paginación y acciones CRUD
// Regla transversal: edición por clic en fila, borrado solo para superusuario/admin con ConfirmDialog
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useAuthStore } from "../shared/stores/useAuthStore";
import { getDetallesDocTripulantes, eliminarDetalleDocTripulantes } from '../api/detalleDocTripulantes';
import DetalleDocTripulantesForm from '../components/detalleDocTripulantes/DetalleDocTripulantesForm';

/**
 * Componente DetalleDocTripulantes
 * 
 * CRUD profesional para gestión de documentos de tripulantes en faenas de pesca.
 * Implementa las reglas transversales del ERP Megui:
 * - Edición con un clic en la fila
 * - Borrado solo visible para superusuario o admin
 * - ConfirmDialog para confirmaciones
 * - Toast para feedback al usuario
 * - Filtros y paginación profesional
 * - Manejo de errores robusto
 */
export default function DetalleDocTripulantes() {
  // Estados principales
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Referencias y store
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDetalles();
  }, []);

  /**
   * Carga la lista de detalles desde la API
   */
  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getDetallesDocTripulantes();
      setDetalles(data || []);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los documentos de tripulantes',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el filtro global de la tabla
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  /**
   * Abre el formulario para crear un nuevo detalle
   */
  const abrirFormularioNuevo = () => {
    setEditingDetalle(null);
    setIsEditing(false);
    setShowForm(true);
  };

  /**
   * Abre el formulario para editar un detalle existente
   * Regla transversal: edición con un clic en la fila
   */
  const abrirFormularioEditar = (detalle) => {
    setEditingDetalle(detalle);
    setIsEditing(true);
    setShowForm(true);
  };

  /**
   * Maneja el guardado exitoso desde el formulario
   */
  const handleGuardadoExitoso = () => {
    setShowForm(false);
    setEditingDetalle(null);
    setIsEditing(false);
    cargarDetalles();
    
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `Documento ${isEditing ? 'actualizado' : 'creado'} correctamente`,
      life: 3000
    });
  };

  /**
   * Confirma y ejecuta la eliminación de un detalle
   * Regla transversal: solo superusuario o admin pueden eliminar
   */
  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el documento ${detalle.numeroDocumento || 'sin número'}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle.id)
    });
  };

  /**
   * Elimina un detalle de la base de datos
   */
  const eliminarDetalle = async (id) => {
    try {
      await eliminarDetalleDocTripulantes(id);
      await cargarDetalles();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Documento eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el documento',
        life: 3000
      });
    }
  };

  /**
   * Renderiza la barra de herramientas superior
   */
  const renderHeader = () => {
    return (
      <Toolbar
        className="mb-4"
        start={
          <div className="flex flex-wrap gap-2">
            <Button
              label="Nuevo Documento"
              icon="pi pi-plus"
              className="p-button-success"
              onClick={abrirFormularioNuevo}
            />
          </div>
        }
        end={
          <div className="flex flex-wrap gap-2">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Buscar documentos..."
                className="w-20rem"
              />
            </span>
          </div>
        }
      />
    );
  };

  /**
   * Renderiza las acciones de cada fila
   * Regla transversal: botón eliminar solo visible para superusuario o admin
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.urlDocTripulantePdf && (
          <Button
            icon="pi pi-file-pdf"
            className="p-button-info p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(rowData.urlDocTripulantePdf, '_blank');
            }}
            tooltip="Ver PDF"
            tooltipOptions={{ position: 'top' }}
          />
        )}
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-danger p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar documento"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Formatea las fechas para mostrar en la tabla
   */
  const fechaTemplate = (rowData, field) => {
    if (!rowData[field]) return '-';
    return format(new Date(rowData[field]), 'dd/MM/yyyy', { locale: es });
  };

  /**
   * Renderiza el estado de verificación
   */
  const verificadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.verificado ? 'Verificado' : 'Pendiente'}
        severity={rowData.verificado ? 'success' : 'warning'}
      />
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <h2>Gestión de Documentos de Tripulantes</h2>
        <p className="text-600 mb-4">
          Administre los documentos de tripulantes en las faenas de pesca
        </p>

        {renderHeader()}

        <DataTable
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['numeroDocumento', 'observaciones']}
          emptyMessage="No se encontraron documentos de tripulantes"
          onRowClick={(e) => abrirFormularioEditar(e.data)}
          className="datatable-responsive"
          stripedRows
          size="small"
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: '6rem' }}
          />
          
          <Column
            field="faenaPescaId"
            header="ID Faena"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="tripulanteId"
            header="ID Tripulante"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="numeroDocumento"
            header="Número Documento"
            sortable
            style={{ minWidth: '10rem' }}
          />
          
          <Column
            field="fechaEmision"
            header="Fecha Emisión"
            body={(rowData) => fechaTemplate(rowData, 'fechaEmision')}
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="fechaVencimiento"
            header="Fecha Vencimiento"
            body={(rowData) => fechaTemplate(rowData, 'fechaVencimiento')}
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="verificado"
            header="Estado"
            body={verificadoTemplate}
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="observaciones"
            header="Observaciones"
            style={{ minWidth: '12rem' }}
          />

          <Column
            body={accionesTemplate}
            exportable={false}
            style={{ minWidth: '10rem' }}
            header="Acciones"
          />
        </DataTable>
      </div>

      {/* Formulario Modal */}
      <Dialog
        visible={showForm}
        style={{ width: '90vw', maxWidth: '800px' }}
        header={isEditing ? 'Editar Documento de Tripulante' : 'Nuevo Documento de Tripulante'}
        modal
        className="p-fluid"
        onHide={() => setShowForm(false)}
      >
        <DetalleDocTripulantesForm
          detalle={editingDetalle}
          onGuardadoExitoso={handleGuardadoExitoso}
          onCancelar={() => setShowForm(false)}
        />
      </Dialog>
    </div>
  );
}
