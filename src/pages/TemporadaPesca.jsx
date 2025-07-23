/**
 * Pantalla de gestión de Temporadas de Pesca
 * 
 * Características:
 * - DataTable con scroll horizontal para múltiples columnas
 * - Edición por clic en fila (regla transversal ERP Megui)
 * - Eliminación solo para superusuario/admin con ConfirmDialog
 * - Filtros por empresa, especie, bahía y estado
 * - Templates especializados para fechas, cuotas y resoluciones
 * - Indicadores visuales de temporadas activas
 * - Upload de archivos PDF para resoluciones
 * - Validación de períodos no superpuestos
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
import { getTemporadasPesca, getTemporadaPescaPorId, crearTemporadaPesca, actualizarTemporadaPesca, eliminarTemporadaPesca, subirDocumentoTemporada } from '../api/temporadaPesca';
import { getEmpresas } from '../api/empresa';
import { getEspecies } from '../api/especie';
import TemporadaPescaForm from '../components/temporadaPesca/TemporadaPescaForm';

/**
 * Componente principal para gestión de temporadas de pesca
 * Implementa las reglas transversales del ERP Megui
 */
const TemporadaPesca = () => {
  // Estados principales
  const [temporadas, setTemporadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para combos de filtro
  const [empresas, setEmpresas] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroEspecie, setFiltroEspecie] = useState(null);
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
  }, [filtroEmpresa, filtroEspecie, filtroEstado]);

  /**
   * Cargar temporadas de pesca
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getTemporadasPesca();
      setTemporadas(data);
    } catch (error) {
      console.error('Error al cargar temporadas:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las temporadas de pesca',
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
      const [empresasData, especiesData] = await Promise.all([
        getEmpresas(),
        getEspecies()
      ]);
      
      setEmpresas(empresasData);
      setEspecies(especiesData);
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
      
      if (filtroEmpresa) filtros.empresaId = filtroEmpresa;
      if (filtroEspecie) filtros.especieId = filtroEspecie;
      if (filtroEstado !== null) filtros.activa = filtroEstado;

      const data = await getTemporadasPesca(filtros);
      setTemporadas(data);
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
    }
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroEspecie(null);
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
   * Abrir formulario para nueva temporada
   */
  const openNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Editar temporada (clic en fila - regla transversal ERP Megui)
   */
  const editItem = (temporada) => {
    setEditingItem(temporada);
    setShowForm(true);
  };

  /**
   * Confirmar eliminación de temporada
   */
  const confirmDelete = (temporada) => {
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
        <p>¿Está seguro de que desea eliminar la temporada "${temporada.nombre}"?</p>
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
        accept: () => deleteItem(temporada.id)
      });
    });
  };

  /**
   * Eliminar temporada
   */
  const deleteItem = async (id) => {
    try {
      await eliminarTemporadaPesca(id);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Temporada eliminada correctamente',
        life: 3000
      });
      
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar temporada:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo eliminar la temporada',
        life: 3000
      });
    }
  };

  /**
   * Guardar temporada (crear o actualizar)
   */
  const saveItem = async (data) => {
    try {
      if (editingItem) {
        await actualizarTemporadaPesca(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Temporada actualizada correctamente',
          life: 3000
        });
      } else {
        await crearTemporadaPesca(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Temporada creada correctamente',
          life: 3000
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar temporada:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo guardar la temporada',
        life: 3000
      });
    }
  };

  /**
   * Template para estado de temporada (activa/inactiva)
   */
  const estadoTemplate = (rowData) => {
    const ahora = new Date();
    const inicio = new Date(rowData.fechaInicio);
    const fin = new Date(rowData.fechaFin);
    
    const esActiva = ahora >= inicio && ahora <= fin;
    
    return (
      <Tag
        value={esActiva ? 'ACTIVA' : 'INACTIVA'}
        severity={esActiva ? 'success' : 'secondary'}
        icon={esActiva ? 'pi pi-check-circle' : 'pi pi-clock'}
      />
    );
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = new Date(rowData[field]);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Template para cuotas en toneladas
   */
  const cuotaTemplate = (rowData, field) => {
    const valor = rowData[field];
    if (!valor) return '-';
    
    return (
      <div className="text-right">
        <Badge
          value={`${Number(valor).toFixed(2)} Ton`}
          severity="info"
        />
      </div>
    );
  };

  /**
   * Template para resolución con enlace al PDF
   */
  const resolucionTemplate = (rowData) => {
    if (!rowData.numeroResolucion) return '-';
    
    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.numeroResolucion}</span>
        {rowData.urlResolucionPdf && (
          <Button
            icon="pi pi-file-pdf"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Ver PDF"
            tooltipOptions={{ position: 'top' }}
            onClick={() => window.open(rowData.urlResolucionPdf, '_blank')}
          />
        )}
      </div>
    );
  };

  /**
   * Template para empresa
   */
  const empresaTemplate = (rowData) => {
    const empresa = empresas.find(e => e.id === rowData.empresaId);
    return empresa?.nombre || 'Sin empresa';
  };

  /**
   * Template para especie
   */
  const especieTemplate = (rowData) => {
    const especie = especies.find(e => e.id === rowData.especieId);
    return especie?.nombre || 'Sin especie';
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
          tooltip="Eliminar temporada"
          tooltipOptions={{ position: 'top' }}
          onClick={() => confirmDelete(rowData)}
        />
      </div>
    );
  };

  /**
   * Opciones para filtro de estado
   */
  const estadoOptions = [
    { label: 'Todas', value: null },
    { label: 'Activas', value: true },
    { label: 'Inactivas', value: false }
  ];

  /**
   * Opciones para filtro de empresas
   */
  const empresaOptions = [
    { label: 'Todas las empresas', value: null },
    ...empresas.map(empresa => ({
      label: empresa.nombre,
      value: Number(empresa.id)
    }))
  ];

  /**
   * Opciones para filtro de especies
   */
  const especieOptions = [
    { label: 'Todas las especies', value: null },
    ...especies.map(especie => ({
      label: especie.nombre,
      value: Number(especie.id)
    }))
  ];

  /**
   * Toolbar con controles de filtro y acciones
   */
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nueva Temporada"
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
          value={filtroEmpresa}
          options={empresaOptions}
          onChange={(e) => setFiltroEmpresa(e.value)}
          placeholder="Filtrar por empresa"
          className="w-12rem"
          showClear
        />
        <Dropdown
          value={filtroEspecie}
          options={especieOptions}
          onChange={(e) => setFiltroEspecie(e.value)}
          placeholder="Filtrar por especie"
          className="w-12rem"
          showClear
        />
        <Dropdown
          value={filtroEstado}
          options={estadoOptions}
          onChange={(e) => setFiltroEstado(e.value)}
          placeholder="Filtrar por estado"
          className="w-10rem"
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
    <div className="temporada-pesca-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Tooltip target=".custom-tooltip" />

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-primary">
          <i className="pi pi-calendar-times mr-2"></i>
          Gestión de Temporadas de Pesca
        </h2>

        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        <DataTable
          ref={dt}
          value={temporadas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} temporadas"
          filters={filters}
          filterDisplay="menu"
          globalFilterFields={['nombre', 'numeroResolucion']}
          emptyMessage="No se encontraron temporadas de pesca"
          scrollable
          scrollHeight="600px"
          onRowClick={(e) => editItem(e.data)}
          rowClassName={() => 'cursor-pointer hover:bg-primary-50'}
        >
          <Column
            field="nombre"
            header="Nombre de Temporada"
            sortable
            filter
            filterPlaceholder="Buscar por nombre"
            style={{ minWidth: '200px' }}
            className="font-semibold"
          />
          
          <Column
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ minWidth: '180px' }}
          />
          
          <Column
            header="Especie"
            body={especieTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          
          <Column
            field="fechaInicio"
            header="Fecha Inicio"
            body={(rowData) => fechaTemplate(rowData, 'fechaInicio')}
            sortable
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            field="fechaFin"
            header="Fecha Fin"
            body={(rowData) => fechaTemplate(rowData, 'fechaFin')}
            sortable
            style={{ minWidth: '120px' }}
            className="text-center"
          />
          
          <Column
            field="cuotaPropiaTon"
            header="Cuota Propia"
            body={(rowData) => cuotaTemplate(rowData, 'cuotaPropiaTon')}
            sortable
            style={{ minWidth: '130px' }}
            className="text-center"
          />
          
          <Column
            field="cuotaAlquiladaTon"
            header="Cuota Alquilada"
            body={(rowData) => cuotaTemplate(rowData, 'cuotaAlquiladaTon')}
            sortable
            style={{ minWidth: '140px' }}
            className="text-center"
          />
          
          <Column
            field="numeroResolucion"
            header="Resolución"
            body={resolucionTemplate}
            sortable
            style={{ minWidth: '180px' }}
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

      {/* Formulario de temporada */}
      <TemporadaPescaForm
        visible={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
        editingItem={editingItem}
        empresas={empresas}
        especies={especies}
      />
    </div>
  );
};

export default TemporadaPesca;
