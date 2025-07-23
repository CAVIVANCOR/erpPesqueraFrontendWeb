/**
 * Componente para gestión de Productos Finales de Cotización de Compras
 * 
 * Características:
 * - CRUD completo con DataTable
 * - Edición por clic en fila
 * - Eliminación con confirmación (solo superusuario/admin)
 * - Gestión de costos detallados (materia prima, proceso, unitario)
 * - Relación con cotizaciones de compras y productos
 * - Scroll horizontal para campos múltiples
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
import { getDetProductosFinalCotizacionCompras, crearDetProductoFinalCotizacionCompras, actualizarDetProductoFinalCotizacionCompras, eliminarDetProductoFinalCotizacionCompras } from '../api/detProductoFinalCotizacionCompras';
import { getCotizacionesCompras } from '../api/cotizacionCompras';
import { getProductos } from '../api/producto';
import { useAuthStore } from '../shared/stores/useAuthStore';
import DetProductoFinalCotizacionComprasForm from '../components/detProductoFinalCotizacionCompras/DetProductoFinalCotizacionComprasForm';

/**
 * Componente principal para gestión de productos finales de cotización de compras
 * Implementa las reglas transversales del ERP Megui
 */
const DetProductoFinalCotizacionCompras = () => {
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [productosFinales, setProductosFinales] = useState([]);
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
      const [productosData, cotizacionesData, productosFinalesData] = await Promise.all([
        getDetProductosFinalCotizacionCompras(),
        getCotizacionesCompras(),
        getProductos()
      ]);
      
      setProductos(productosData);
      setCotizaciones(cotizacionesData);
      setProductosFinales(productosFinalesData);
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
   * Manejar creación de nuevo producto final
   */
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  /**
   * Manejar edición de producto final (clic en fila)
   */
  const handleEdit = (rowData) => {
    setEditingItem(rowData);
    setShowForm(true);
  };

  /**
   * Manejar eliminación de producto final
   * Solo visible para superusuario o admin
   */
  const handleDelete = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el producto final "${rowData.productoFinal?.nombre || 'Sin nombre'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await eliminarDetProductoFinalCotizacionCompras(rowData.id);
          await cargarDatos();
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto final eliminado correctamente',
            life: 3000
          });
        } catch (error) {
          console.error('Error al eliminar:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al eliminar el producto final',
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
        await actualizarDetProductoFinalCotizacionCompras(editingItem.id, data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto final actualizado correctamente',
          life: 3000
        });
      } else {
        await crearDetProductoFinalCotizacionCompras(data);
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto final creado correctamente',
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
        detail: error.message || 'Error al guardar el producto final',
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
   * Template para mostrar producto final
   */
  const productoFinalTemplate = (rowData) => {
    const producto = productosFinales.find(p => Number(p.id) === Number(rowData.productoFinalId));
    return producto ? (
      <div>
        <div className="font-semibold">{producto.nombre}</div>
        <div className="text-sm text-gray-600">{producto.codigo || 'Sin código'}</div>
      </div>
    ) : 'No encontrado';
  };

  /**
   * Template para mostrar cantidad
   */
  const cantidadTemplate = (rowData) => {
    return (
      <div className="text-right">
        <Tag value={Number(rowData.cantidad).toFixed(2)} severity="info" />
      </div>
    );
  };

  /**
   * Template para mostrar peso
   */
  const pesoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <Tag value={`${Number(rowData.peso).toFixed(2)} kg`} severity="success" />
      </div>
    );
  };

  /**
   * Template para mostrar costo unitario materia prima
   */
  const costoMateriaPrimaTemplate = (rowData) => {
    return (
      <div className="text-right font-semibold">
        S/ {Number(rowData.costoUnitMateriaPrima).toFixed(2)}
      </div>
    );
  };

  /**
   * Template para mostrar costo unitario proceso
   */
  const costoProcesoTemplate = (rowData) => {
    return (
      <div className="text-right font-semibold">
        S/ {Number(rowData.costoUnitProceso).toFixed(2)}
      </div>
    );
  };

  /**
   * Template para mostrar costo unitario total
   */
  const costoUnitarioTemplate = (rowData) => {
    return (
      <div className="text-right font-semibold text-primary">
        S/ {Number(rowData.costoUnitario).toFixed(2)}
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
        <h4 className="m-0">Productos Finales de Cotización</h4>
        <Button
          label="Nuevo Producto Final"
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
      <h4 className="m-0">Gestión de Productos Finales</h4>
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
    <div className="detproductofinalcotizacioncompras-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <Card>
        <Toolbar className="mb-4" template={toolbarTemplate} />
        
        <DataTable
          value={productos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron productos finales"
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
            field="productoFinal" 
            header="Producto Final" 
            body={productoFinalTemplate}
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column 
            field="cantidad" 
            header="Cantidad" 
            body={cantidadTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="peso" 
            header="Peso" 
            body={pesoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column 
            field="costoUnitMateriaPrima" 
            header="Costo Mat. Prima" 
            body={costoMateriaPrimaTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="costoUnitProceso" 
            header="Costo Proceso" 
            body={costoProcesoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column 
            field="costoUnitario" 
            header="Costo Total" 
            body={costoUnitarioTemplate}
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
        <DetProductoFinalCotizacionComprasForm
          visible={showForm}
          onHide={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          editingItem={editingItem}
          cotizaciones={cotizaciones}
          productosFinales={productosFinales}
        />
      )}
    </div>
  );
};

export default DetProductoFinalCotizacionCompras;
