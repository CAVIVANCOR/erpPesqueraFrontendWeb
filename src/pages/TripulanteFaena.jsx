// src/pages/TripulanteFaena.jsx
// CRUD profesional para TripulanteFaena - ERP Megui
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
import { getAllTripulanteFaena, deleteTripulanteFaena } from '../api/tripulanteFaena';
import TripulanteFaenaForm from '../components/tripulanteFaena/TripulanteFaenaForm';

/**
 * Componente TripulanteFaena
 * 
 * CRUD profesional para gestión de tripulantes en faenas de pesca.
 * Implementa las reglas transversales del ERP Megui:
 * - Edición con un clic en la fila
 * - Borrado solo visible para superusuario o admin
 * - ConfirmDialog para confirmaciones
 * - Toast para feedback al usuario
 * - Filtros y paginación profesional
 * - Manejo de errores robusto
 */
export default function TripulanteFaena() {
  // Estados principales
  const [tripulantes, setTripulantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [editingTripulante, setEditingTripulante] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Referencias y store
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarTripulantes();
  }, []);

  /**
   * Carga la lista de tripulantes desde la API
   */
  const cargarTripulantes = async () => {
    try {
      setLoading(true);
      const data = await getAllTripulanteFaena();
      setTripulantes(data || []);
    } catch (error) {
      console.error('Error al cargar tripulantes:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los tripulantes de faena',
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
   * Abre el formulario para crear un nuevo tripulante
   */
  const abrirFormularioNuevo = () => {
    setEditingTripulante(null);
    setIsEditing(false);
    setShowForm(true);
  };

  /**
   * Abre el formulario para editar un tripulante existente
   * Regla transversal: edición con un clic en la fila
   */
  const abrirFormularioEditar = (tripulante) => {
    setEditingTripulante(tripulante);
    setIsEditing(true);
    setShowForm(true);
  };

  /**
   * Maneja el guardado exitoso desde el formulario
   */
  const handleGuardadoExitoso = () => {
    setShowForm(false);
    setEditingTripulante(null);
    setIsEditing(false);
    cargarTripulantes();
    
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `Tripulante ${isEditing ? 'actualizado' : 'creado'} correctamente`,
      life: 3000
    });
  };

  /**
   * Confirma y ejecuta la eliminación de un tripulante
   * Regla transversal: solo superusuario o admin pueden eliminar
   */
  const confirmarEliminacion = (tripulante) => {
    const nombre = tripulante.nombres && tripulante.apellidos 
      ? `${tripulante.nombres} ${tripulante.apellidos}`
      : `Tripulante ID ${tripulante.id}`;
      
    confirmDialog({
      message: `¿Está seguro de eliminar al tripulante ${nombre}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarTripulante(tripulante.id)
    });
  };

  /**
   * Elimina un tripulante de la base de datos
   */
  const eliminarTripulante = async (id) => {
    try {
      await deleteTripulanteFaena(id);
      await cargarTripulantes();
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tripulante eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al eliminar tripulante:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el tripulante',
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
              label="Nuevo Tripulante"
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
                placeholder="Buscar tripulantes..."
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
            tooltip="Eliminar tripulante"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Renderiza el nombre completo del tripulante
   */
  const nombreCompletoTemplate = (rowData) => {
    if (rowData.nombres && rowData.apellidos) {
      return `${rowData.nombres} ${rowData.apellidos}`;
    }
    return '-';
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <h2>Gestión de Tripulantes de Faena</h2>
        <p className="text-600 mb-4">
          Administre los tripulantes asignados a las faenas de pesca
        </p>

        {renderHeader()}

        <DataTable
          value={tripulantes}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tripulantes"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['nombres', 'apellidos', 'observaciones']}
          emptyMessage="No se encontraron tripulantes de faena"
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
            field="personalId"
            header="ID Personal"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            field="cargoId"
            header="ID Cargo"
            sortable
            style={{ minWidth: '8rem' }}
          />
          
          <Column
            header="Nombre Completo"
            body={nombreCompletoTemplate}
            sortable
            style={{ minWidth: '12rem' }}
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
        style={{ width: '90vw', maxWidth: '700px' }}
        header={isEditing ? 'Editar Tripulante de Faena' : 'Nuevo Tripulante de Faena'}
        modal
        className="p-fluid"
        onHide={() => setShowForm(false)}
      >
        <TripulanteFaenaForm
          tripulante={editingTripulante}
          onGuardadoExitoso={handleGuardadoExitoso}
          onCancelar={() => setShowForm(false)}
        />
      </Dialog>
    </div>
  );
}
