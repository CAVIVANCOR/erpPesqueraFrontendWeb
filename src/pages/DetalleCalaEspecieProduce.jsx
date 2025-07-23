// src/pages/DetalleCalaEspecieProduce.jsx
// CRUD profesional para DetalleCalaEspecieProduce - ERP Megui
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

import { useAuthStore } from "../shared/stores/useAuthStore";
import { getAllDetalleCalaEspecieProduce, deleteDetalleCalaEspecieProduce } from '../api/detalleCalaEspecieProduce';
import DetalleCalaEspecieProduceForm from './DetalleCalaEspecieProduceForm';

/**
 * Componente DetalleCalaEspecieProduce
 * 
 * CRUD profesional para gestión de detalles de especies en calas de producción.
 * Implementa las reglas transversales del ERP Megui:
 * - Edición con un clic en la fila
 * - Borrado solo visible para superusuario o admin
 * - ConfirmDialog para confirmaciones
 * - Toast para feedback al usuario
 * - Filtros y paginación profesional
 * - Manejo de errores robusto
 */
export default function DetalleCalaEspecieProduce() {
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
      const data = await getAllDetalleCalaEspecieProduce();
      setDetalles(data || []);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los detalles de especies',
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
      detail: `Detalle ${isEditing ? 'actualizado' : 'creado'} correctamente`,
      life: 3000
    });
  };

  /**
   * Confirma y ejecuta la eliminación de un detalle
   * Regla transversal: solo superusuario o admin pueden eliminar
   */
  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el detalle de la especie ID ${detalle.especieId}?`,
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
      await deleteDetalleCalaEspecieProduce(id);
      await cargarDetalles();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el detalle',
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
              label="Nuevo Detalle"
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
                placeholder="Buscar detalles..."
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
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-danger p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar detalle"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Formatea los valores decimales
   */
  const decimalTemplate = (rowData, field) => {
    if (rowData[field] == null) return '-';
    return Number(rowData[field]).toFixed(2);
  };

  /**
   * Formatea el porcentaje de juveniles
   */
  const porcentajeTemplate = (rowData) => {
    if (rowData.porcentajeJuveniles == null) return '-';
    return `${Number(rowData.porcentajeJuveniles).toFixed(2)}%`;
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <h2>Gestión de Detalles de Especies en Calas</h2>
        <p className="text-600 mb-4">
          Administre los detalles de especies capturadas en las calas de producción
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['observaciones', 'especieId']}
          emptyMessage="No se encontraron detalles de especies"
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
            field="calaProduceId"
            header="ID Cala"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="especieId"
            header="ID Especie"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="toneladas"
            header="Toneladas"
            body={(rowData) => decimalTemplate(rowData, 'toneladas')}
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="porcentajeJuveniles"
            header="% Juveniles"
            body={porcentajeTemplate}
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
            style={{ minWidth: '8rem' }}
            header="Acciones"
          />
        </DataTable>
      </div>

      {/* Formulario Modal */}
      <Dialog
        visible={showForm}
        style={{ width: '90vw', maxWidth: '600px' }}
        header={isEditing ? 'Editar Detalle de Especie' : 'Nuevo Detalle de Especie'}
        modal
        className="p-fluid"
        onHide={() => setShowForm(false)}
      >
        <DetalleCalaEspecieProduceForm
          detalle={editingDetalle}
          onGuardadoExitoso={handleGuardadoExitoso}
          onCancelar={() => setShowForm(false)}
        />
      </Dialog>
    </div>
  );
}
