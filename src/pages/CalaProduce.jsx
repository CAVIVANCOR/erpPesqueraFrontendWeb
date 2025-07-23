// src/pages/CalaProduce.jsx
// CRUD profesional para CalaProduce - ERP Megui
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useAuthStore } from "../shared/stores/useAuthStore";
import { getAllCalaProduce, deleteCalaProduce } from '../api/calaProduce';
import CalaProduceForm from './CalaProduceForm';

/**
 * Componente CalaProduce
 * 
 * CRUD profesional para gestión de calas de producción pesquera.
 * Implementa las reglas transversales del ERP Megui:
 * - Edición con un clic en la fila
 * - Borrado solo visible para superusuario o admin
 * - ConfirmDialog para confirmaciones
 * - Toast para feedback al usuario
 * - Filtros y paginación profesional
 * - Manejo de errores robusto
 */
export default function CalaProduce() {
  // Estados principales
  const [calas, setCalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [editingCala, setEditingCala] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Referencias y store
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarCalas();
  }, []);

  /**
   * Carga la lista de calas desde la API
   */
  const cargarCalas = async () => {
    try {
      setLoading(true);
      const data = await getAllCalaProduce();
      setCalas(data || []);
    } catch (error) {
      console.error('Error al cargar calas:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las calas de producción',
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
   * Abre el formulario para crear una nueva cala
   */
  const abrirFormularioNuevo = () => {
    setEditingCala(null);
    setIsEditing(false);
    setShowForm(true);
  };

  /**
   * Abre el formulario para editar una cala existente
   * Regla transversal: edición con un clic en la fila
   */
  const abrirFormularioEditar = (cala) => {
    setEditingCala(cala);
    setIsEditing(true);
    setShowForm(true);
  };

  /**
   * Maneja el guardado exitoso desde el formulario
   */
  const handleGuardadoExitoso = () => {
    setShowForm(false);
    setEditingCala(null);
    setIsEditing(false);
    cargarCalas();
    
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `Cala ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      life: 3000
    });
  };

  /**
   * Confirma y ejecuta la eliminación de una cala
   * Regla transversal: solo superusuario o admin pueden eliminar
   */
  const confirmarEliminacion = (cala) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cala de producción del ${format(new Date(cala.fechaHoraInicio), 'dd/MM/yyyy HH:mm', { locale: es })}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarCala(cala.id)
    });
  };

  /**
   * Elimina una cala de la base de datos
   */
  const eliminarCala = async (id) => {
    try {
      await deleteCalaProduce(id);
      await cargarCalas();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cala eliminada correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al eliminar cala:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la cala',
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
              label="Nueva Cala"
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
                placeholder="Buscar calas..."
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
            tooltip="Eliminar cala"
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
    return format(new Date(rowData[field]), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  /**
   * Formatea los valores decimales
   */
  const decimalTemplate = (rowData, field) => {
    if (rowData[field] == null) return '-';
    return Number(rowData[field]).toFixed(2);
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <h2>Gestión de Calas de Producción</h2>
        <p className="text-600 mb-4">
          Administre las calas de producción pesquera del sistema
        </p>

        {renderHeader()}

        <DataTable
          value={calas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} calas"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['observaciones', 'faenaPesca.codigo']}
          emptyMessage="No se encontraron calas de producción"
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
            field="fechaHoraInicio"
            header="Fecha Inicio"
            body={(rowData) => fechaTemplate(rowData, 'fechaHoraInicio')}
            sortable
            style={{ minWidth: '10rem' }}
          />
          
          <Column
            field="fechaHoraFin"
            header="Fecha Fin"
            body={(rowData) => fechaTemplate(rowData, 'fechaHoraFin')}
            sortable
            style={{ minWidth: '10rem' }}
          />
          
          <Column
            field="toneladasCapturadas"
            header="Toneladas"
            body={(rowData) => decimalTemplate(rowData, 'toneladasCapturadas')}
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="profundidadM"
            header="Profundidad (m)"
            body={(rowData) => decimalTemplate(rowData, 'profundidadM')}
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
        style={{ width: '90vw', maxWidth: '800px' }}
        header={isEditing ? 'Editar Cala de Producción' : 'Nueva Cala de Producción'}
        modal
        className="p-fluid"
        onHide={() => setShowForm(false)}
      >
        <CalaProduceForm
          cala={editingCala}
          onGuardadoExitoso={handleGuardadoExitoso}
          onCancelar={() => setShowForm(false)}
        />
      </Dialog>
    </div>
  );
}
