/**
 * Pantalla de gestión de Embarcaciones
 * 
 * Características:
 * - DataTable con scroll horizontal para múltiples columnas técnicas
 * - Edición por clic en fila (regla transversal ERP Megui)
 * - Eliminación solo para superusuario/admin con ConfirmDialog
 * - Filtros por tipo, estado, capacidad y año de fabricación
 * - Templates especializados para medidas técnicas, motor y equipos
 * - Indicadores visuales de estado activo/inactivo
 * - Validación de unicidad en matrícula y activoId
 * - Información técnica detallada de embarcaciones pesqueras
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Tooltip } from 'primereact/tooltip';
import { FilterMatchMode } from 'primereact/api';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getEmbarcaciones, crearEmbarcacion, actualizarEmbarcacion, eliminarEmbarcacion } from '../api/embarcacion';
import { getTiposEmbarcacion } from '../api/tipoEmbarcacion';
import { getEstadosMultiFuncion } from '../api/estadoMultiFuncion';
import { getActivos } from '../api/activo';
import EmbarcacionForm from '../components/embarcacion/EmbarcacionForm';

/**
 * Componente principal para gestión de embarcaciones
 * Implementa las reglas transversales del ERP Megui
 */
const Embarcacion = () => {
  // Estados principales
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para combos de filtro
  const [tiposEmbarcacion, setTiposEmbarcacion] = useState([]);
  const [estadosActivo, setEstadosActivo] = useState([]);
  const [activos, setActivos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  // Referencias
  const toast = useRef(null);
  const dt = useRef(null);

  // Store de autenticación
  const { usuario } = useAuthStore();

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
    cargarCombos();
  }, []);

  /**
   * Aplicar filtros cuando cambien
   */
  useEffect(() => {
    aplicarFiltros();
  }, [filtroTipo, filtroEstado]);

  /**
   * Cargar embarcaciones
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getEmbarcaciones();
      setEmbarcaciones(data);
    } catch (error) {
      console.error('Error al cargar embarcaciones:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las embarcaciones',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar datos para combos de filtro
   */
  const cargarCombos = async () => {
    try {
      const [tiposData, estadosData, activosData] = await Promise.all([
        getTiposEmbarcacion(),
        getEstadosMultiFuncion(),
        getActivos()
      ]);
      
      setTiposEmbarcacion(tiposData);
      setEstadosActivo(estadosData);
      setActivos(activosData);
    } catch (error) {
      console.error('Error al cargar combos:', error);
    }
  };

  /**
   * Aplicar filtros a los datos
   */
  const aplicarFiltros = async () => {
    try {
      const filtros = {};
      
      if (filtroTipo) filtros.tipoEmbarcacionId = filtroTipo;
      if (filtroEstado) filtros.estadoActivoId = filtroEstado;

      const data = await getEmbarcaciones(filtros);
      setEmbarcaciones(data);
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
    }
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    setFiltroTipo(null);
    setFiltroEstado(null);
    setGlobalFilterValue('');
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    cargarDatos();
  };

  /**
   * Manejar filtro global
   */
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  /**
   * Abrir formulario para nueva embarcación
   */
  const openNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Editar embarcación (clic en fila - regla transversal ERP Megui)
   */
  const editItem = (embarcacion) => {
    setEditingItem(embarcacion);
    setShowForm(true);
  };

  /**
   * Confirmar eliminación de embarcación
   */
  const confirmDelete = (embarcacion) => {
    // Solo superusuario o admin pueden eliminar (regla transversal ERP Megui)
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar registros',
        life: 3000
      });
      return;
    }

    // ConfirmDialog profesional con estilo rojo
    const confirmDialog = document.createElement('div');
    confirmDialog.innerHTML = `
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro de que desea eliminar la embarcación "${embarcacion.matricula}"?</p>
        <p><strong>Esta acción no se puede deshacer.</strong></p>
      </div>
    `;

    import('primereact/api').then(({ confirmDialog: confirm }) => {
      confirm({
        message: confirmDialog.innerHTML,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        acceptLabel: 'Sí, Eliminar',
        rejectLabel: 'Cancelar',
        accept: () => deleteItem(embarcacion.id)
      });
    });
  };

  /**
   * Eliminar embarcación
   */
  const deleteItem = async (id) => {
    try {
      await eliminarEmbarcacion(id);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Embarcación eliminada correctamente',
        life: 3000
      });
      
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar embarcación:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo eliminar la embarcación',
        life: 3000
      });
    }
  };

  /**
   * Guardar embarcación (crear o actualizar)
   */
  const saveItem = async (data) => {
    try {
      if (editingItem) {
        await actualizarEmbarcacion(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Embarcación actualizada correctamente',
          life: 3000
        });
      } else {
        await crearEmbarcacion(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Embarcación creada correctamente',
          life: 3000
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar embarcación:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo guardar la embarcación',
        life: 3000
      });
    }
  };

  /**
   * Template para matrícula con formato destacado
   */
  const matriculaTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-anchor text-primary"></i>
        <span className="font-bold text-primary">{rowData.matricula}</span>
      </div>
    );
  };

  /**
   * Template para tipo de embarcación
   */
  const tipoEmbarcacionTemplate = (rowData) => {
    const tipo = tiposEmbarcacion.find(t => t.id === rowData.tipoEmbarcacionId);
    return tipo?.nombre || 'Sin tipo';
  };

  /**
   * Template para estado activo
   */
  const estadoActivoTemplate = (rowData) => {
    const estado = estadosActivo.find(e => e.id === rowData.estadoActivoId);
    const esActivo = estado?.nombre?.toLowerCase().includes('activo');
    
    return (
      <Tag
        value={estado?.nombre || 'Sin estado'}
        severity={esActivo ? 'success' : 'secondary'}
        icon={esActivo ? 'pi pi-check-circle' : 'pi pi-times-circle'}
      />
    );
  };

  /**
   * Template para capacidad de bodega
   */
  const capacidadTemplate = (rowData) => {
    if (!rowData.capacidadBodegaTon) return '-';
    
    return (
      <div className="text-center">
        <Badge
          value={`${Number(rowData.capacidadBodegaTon).toFixed(2)} Ton`}
          severity="info"
        />
      </div>
    );
  };

  /**
   * Template para medidas técnicas (eslora, manga, puntal)
   */
  const medidaTemplate = (rowData, field) => {
    const valor = rowData[field];
    if (!valor) return '-';
    
    return `${Number(valor).toFixed(2)} m`;
  };

  /**
   * Template para motor
   */
  const motorTemplate = (rowData) => {
    const marca = rowData.motorMarca;
    const potencia = rowData.motorPotenciaHp;
    
    if (!marca && !potencia) return '-';
    
    return (
      <div className="text-sm">
        {marca && <div className="font-semibold">{marca}</div>}
        {potencia && <div className="text-500">{potencia} HP</div>}
      </div>
    );
  };

  /**
   * Template para año de fabricación
   */
  const anioFabricacionTemplate = (rowData) => {
    if (!rowData.anioFabricacion) return '-';
    
    const anioActual = new Date().getFullYear();
    const antiguedad = anioActual - rowData.anioFabricacion;
    
    return (
      <div className="text-center">
        <div className="font-semibold">{rowData.anioFabricacion}</div>
        <small className="text-500">({antiguedad} años)</small>
      </div>
    );
  };

  /**
   * Template para equipos (GPS y tablet)
   */
  const equiposTemplate = (rowData) => {
    const tieneGps = rowData.proveedorGpsId;
    const tieneTablet = rowData.tabletMarca || rowData.tabletModelo;
    
    return (
      <div className="flex gap-1">
        {tieneGps && (
          <Tag
            value="GPS"
            severity="success"
            icon="pi pi-map-marker"
            className="text-xs"
          />
        )}
        {tieneTablet && (
          <Tag
            value="Tablet"
            severity="info"
            icon="pi pi-tablet"
            className="text-xs"
          />
        )}
        {!tieneGps && !tieneTablet && <span className="text-500">-</span>}
      </div>
    );
  };

  /**
   * Template para activo
   */
  const activoTemplate = (rowData) => {
    const activo = activos.find(a => a.id === rowData.activoId);
    return activo?.nombre || 'Sin activo';
  };

  /**
   * Template para acciones (solo eliminar, edición por clic en fila)
   */
  const actionTemplate = (rowData) => {
    // Solo mostrar botón eliminar para superusuario o admin (regla transversal ERP Megui)
    if (!usuario?.esSuperUsuario && !usuario?.esAdmin) {
      return null;
    }

    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          tooltip="Eliminar embarcación"
          tooltipOptions={{ position: 'top' }}
          onClick={() => confirmDelete(rowData)}
        />
      </div>
    );
  };

  /**
   * Opciones para filtro de tipos de embarcación
   */
  const tipoOptions = [
    { label: 'Todos los tipos', value: null },
    ...tiposEmbarcacion.map(tipo => ({
      label: tipo.nombre,
      value: Number(tipo.id)
    }))
  ];

  /**
   * Opciones para filtro de estados
   */
  const estadoOptions = [
    { label: 'Todos los estados', value: null },
    ...estadosActivo.map(estado => ({
      label: estado.nombre,
      value: Number(estado.id)
    }))
  ];

  /**
   * Toolbar con controles de filtro y acciones
   */
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nueva Embarcación"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={filtroTipo}
          options={tipoOptions}
          onChange={(e) => setFiltroTipo(e.value)}
          placeholder="Filtrar por tipo"
          className="w-12rem"
          showClear
        />
        <Dropdown
          value={filtroEstado}
          options={estadoOptions}
          onChange={(e) => setFiltroEstado(e.value)}
          placeholder="Filtrar por estado"
          className="w-12rem"
          showClear
        />
        <Button
          icon="pi pi-filter-slash"
          className="p-button-outlined"
          tooltip="Limpiar filtros"
          onClick={limpiarFiltros}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Búsqueda global..."
            className="w-15rem"
          />
        </span>
      </div>
    );
  };

  return (
    <div className="embarcacion-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Tooltip target=".custom-tooltip" />

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-primary">
          <i className="pi pi-anchor mr-2"></i>
          Gestión de Embarcaciones
        </h2>

        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        <DataTable
          ref={dt}
          value={embarcaciones}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} embarcaciones"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['matricula', 'motorMarca', 'tabletMarca']}
          emptyMessage="No se encontraron embarcaciones"
          scrollable
          scrollHeight="600px"
          onRowClick={(e) => editItem(e.data)}
          rowClassName={() => 'cursor-pointer hover:bg-primary-50'}
        >
          <Column
            field="matricula"
            header="Matrícula"
            body={matriculaTemplate}
            sortable
            filter
            filterPlaceholder="Buscar por matrícula"
            style={{ minWidth: '150px' }}
            className="font-semibold"
          />
          
          <Column
            header="Tipo"
            body={tipoEmbarcacionTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          
          <Column
            header="Estado"
            body={estadoActivoTemplate}
            sortable
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            header="Activo"
            body={activoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          
          <Column
            field="capacidadBodegaTon"
            header="Capacidad"
            body={capacidadTemplate}
            sortable
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            field="esloraM"
            header="Eslora"
            body={(rowData) => medidaTemplate(rowData, 'esloraM')}
            sortable
            style={{ minWidth: '100px' }}
            className="text-center"
          />
          
          <Column
            field="mangaM"
            header="Manga"
            body={(rowData) => medidaTemplate(rowData, 'mangaM')}
            sortable
            style={{ minWidth: '100px' }}
            className="text-center"
          />
          
          <Column
            field="puntalM"
            header="Puntal"
            body={(rowData) => medidaTemplate(rowData, 'puntalM')}
            sortable
            style={{ minWidth: '100px' }}
            className="text-center"
          />
          
          <Column
            header="Motor"
            body={motorTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          
          <Column
            field="anioFabricacion"
            header="Año Fab."
            body={anioFabricacionTemplate}
            sortable
            style={{ minWidth: '100px' }}
            className="text-center"
          />
          
          <Column
            header="Equipos"
            body={equiposTemplate}
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            header="Acciones"
            body={actionTemplate}
            exportable={false}
            style={{ minWidth: '100px', maxWidth: '100px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      {/* Formulario de embarcación */}
      <EmbarcacionForm
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
        editingItem={editingItem}
        tiposEmbarcacion={tiposEmbarcacion}
        estadosActivo={estadosActivo}
        activos={activos}
      />
    </div>
  );
};

export default Embarcacion;
