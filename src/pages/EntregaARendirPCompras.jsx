/**
 * Componente para gestión de Entregas a Rendir de Compras
 * 
 * Características:
 * - CRUD completo con DataTable
 * - Edición por clic en fila
 * - Eliminación con confirmación (solo superusuario/admin)
 * - Gestión de estados (pendiente/liquidada)
 * - Relación con cotizaciones de compras y responsables
 * - Control de fechas de liquidación
 * - Toast para feedback visual
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { getEntregasARendirPCompras, crearEntregaARendirPCompras, actualizarEntregaARendirPCompras, eliminarEntregaARendirPCompras } from '../api/entregaARendirPCompras';
import { getCotizacionesCompras } from '../api/cotizacionCompras';
import { getPersonal } from '../api/personal';
import { getCentrosCosto } from '../api/centroCosto';
import { useAuthStore } from '../shared/stores/useAuthStore';
import EntregaARendirPComprasForm from '../components/entregaARendirPCompras/EntregaARendirPComprasForm';

/**
 * Componente principal para gestión de entregas a rendir de compras
 * Implementa las reglas transversales del ERP Megui
 */
const EntregaARendirPCompras = () => {
  // Estados principales
  const [entregas, setEntregas] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Referencias y stores
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Función para cargar todos los datos necesarios
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [entregasData, cotizacionesData, personalData, centrosCostoData] = await Promise.all([
        getEntregasARendirPCompras(),
        getCotizacionesCompras(),
        getPersonal(),
        getCentrosCosto()
      ]);
      
      setEntregas(entregasData);
      setCotizaciones(cotizacionesData);
      setPersonal(personalData);
      setCentrosCosto(centrosCostoData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar creación de nueva entrega
   */
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Manejar edición de entrega (clic en fila)
   */
  const handleEdit = (rowData) => {
    setEditingItem(rowData);
    setShowForm(true);
  };

  /**
   * Manejar eliminación de entrega
   * Solo visible para superusuario o admin
   */
  const handleDelete = (rowData) => {
    const cotizacion = cotizaciones.find(c => Number(c.id) === Number(rowData.cotizacionComprasId));
    confirmDialog({
      message: `¿Está seguro de eliminar la entrega a rendir de la cotización "${cotizacion?.numeroReferencia || 'Sin referencia'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await eliminarEntregaARendirPCompras(rowData.id);
          await cargarDatos();
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Entrega a rendir eliminada correctamente',
            life: 3000
          });
        } catch (error) {
          console.error('Error al eliminar:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al eliminar la entrega a rendir',
            life: 3000
          });
        }
      }
    });
  };

  /**
   * Manejar guardado desde el formulario
   */
  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await actualizarEntregaARendirPCompras(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega a rendir actualizada correctamente',
          life: 3000
        });
      } else {
        await crearEntregaARendirPCompras(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Entrega a rendir creada correctamente',
          life: 3000
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al guardar la entrega a rendir',
        life: 3000
      });
    }
  };

  /**
   * Template para mostrar cotización
   */
  const cotizacionTemplate = (rowData) => {
    const cotizacion = cotizaciones.find(c => Number(c.id) === Number(rowData.cotizacionComprasId));
    return cotizacion ? (
      <div>
        <div className="font-semibold">{cotizacion.numeroReferencia || 'Sin referencia'}</div>
        <div className="text-sm text-gray-600">{cotizacion.empresa?.nombre || 'Sin empresa'}</div>
      </div>
    ) : 'No encontrada';
  };

  /**
   * Template para mostrar responsable
   */
  const responsableTemplate = (rowData) => {
    const responsable = personal.find(p => Number(p.id) === Number(rowData.respEntregaRendirId));
    return responsable ? (
      <div>
        <div className="font-semibold">{responsable.nombres} {responsable.apellidos}</div>
        <div className="text-sm text-gray-600">{responsable.numeroDocumento || 'Sin documento'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar centro de costo
   */
  const centroCostoTemplate = (rowData) => {
    const centroCosto = centrosCosto.find(cc => Number(cc.id) === Number(rowData.centroCostoId));
    return centroCosto ? (
      <div>
        <div className="font-semibold">{centroCosto.nombre}</div>
        <div className="text-sm text-gray-600">{centroCosto.codigo || 'Sin código'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar estado de liquidación
   */
  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.entregaLiquidada ? 'Liquidada' : 'Pendiente'}
        severity={rowData.entregaLiquidada ? 'success' : 'warning'}
        icon={rowData.entregaLiquidada ? 'pi pi-check' : 'pi pi-clock'}
      />
    );
  };

  /**
   * Template para mostrar fecha de liquidación
   */
  const fechaLiquidacionTemplate = (rowData) => {
    if (!rowData.fechaLiquidacion) {
      return <Tag value="Sin liquidar" severity="warning" />;
    }
    
    const fecha = new Date(rowData.fechaLiquidacion);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para mostrar fecha de creación
   */
  const fechaCreacionTemplate = (rowData) => {
    const fecha = new Date(rowData.fechaCreacion);
    return (
      <div>
        <div className="font-semibold">{fecha.toLocaleDateString('es-PE')}</div>
        <div className="text-sm text-gray-600">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    );
  };

  /**
   * Template para acciones
   * Solo muestra eliminar para superusuario o admin
   */
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            size="small"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  /**
   * Toolbar del componente
   */
  const toolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <h4 className="m-0">Entregas a Rendir - Compras</h4>
        <Button
          label="Nueva Entrega"
          icon="pi pi-plus"
          onClick={handleCreate}
          className="p-button-primary"
        />
      </div>
    );
  };

  /**
   * Header del DataTable con filtro global
   */
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Entregas a Rendir</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <input
          type="search"
          placeholder="Buscar..."
          className="p-inputtext p-component"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </span>
    </div>
  );

  return (
    <div className="entregaarendirpcompras-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <Card>
        <Toolbar className="mb-4" template={toolbarTemplate} />
        
        <DataTable
          value={entregas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron entregas a rendir"
          onRowClick={(e) => handleEdit(e.data)}
          selectionMode="single"
          className="datatable-responsive"
          scrollable
          scrollHeight="600px"
        >
          <Column 
            field="cotizacionCompras" 
            header="Cotización" 
            body={cotizacionTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="responsable" 
            header="Responsable" 
            body={responsableTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="centroCosto" 
            header="Centro de Costo" 
            body={centroCostoTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="entregaLiquidada" 
            header="Estado" 
            body={estadoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="fechaLiquidacion" 
            header="Fecha Liquidación" 
            body={fechaLiquidacionTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="fechaCreacion" 
            header="Fecha Creación" 
            body={fechaCreacionTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: '100px' }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </Card>

      {showForm && (
        <EntregaARendirPComprasForm
          visible={showForm}
          onHide={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          editingItem={editingItem}
          cotizaciones={cotizaciones}
          personal={personal}
          centrosCosto={centrosCosto}
        />
      )}
    </div>
  );
};

export default EntregaARendirPCompras;
