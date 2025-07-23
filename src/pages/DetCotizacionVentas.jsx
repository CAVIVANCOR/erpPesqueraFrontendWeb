// src/pages/DetCotizacionVentas.jsx
// Pantalla CRUD profesional para DetCotizacionVentas. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getAllDetCotizacionVentas, deleteDetCotizacionVentas } from '../api/detCotizacionVentas';
import DetCotizacionVentasForm from '../components/detCotizacionVentas/DetCotizacionVentasForm';

/**
 * Componente DetCotizacionVentas
 * Gestión CRUD de detalles de cotizaciones de ventas con patrón profesional ERP Megui
 */
const DetCotizacionVentas = () => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarDetalles();
  }, []);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getAllDetCotizacionVentas();
      setDetalles(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar detalles de cotización'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedDetalle(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (detalle) => {
    setSelectedDetalle(detalle);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedDetalle(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el detalle ${detalle.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarDetalle(detalle.id)
    });
  };

  const eliminarDetalle = async (id) => {
    try {
      await deleteDetCotizacionVentas(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Detalle eliminado correctamente'
      });
      cargarDetalles();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el detalle'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const cotizacionTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold text-primary">COT-{String(rowData.cotizacionVentasId).padStart(6, '0')}</div>
        <div className="text-sm text-gray-600">Empresa: {rowData.empresaId}</div>
      </div>
    );
  };

  const productoTemplate = (rowData) => {
    // Simulación de productos basado en ID
    const productos = {
      1: { codigo: 'HPRIME001', nombre: 'Harina Prime', categoria: 'Harina' },
      2: { codigo: 'ACEITE001', nombre: 'Aceite Crudo', categoria: 'Aceite' },
      3: { codigo: 'CONS001', nombre: 'Atún en Aceite', categoria: 'Conservas' },
      4: { codigo: 'CONG001', nombre: 'Filete Congelado', categoria: 'Congelado' }
    };
    
    const producto = productos[rowData.productoId] || { 
      codigo: `PROD${rowData.productoId}`, 
      nombre: `Producto ${rowData.productoId}`,
      categoria: 'General'
    };
    
    return (
      <div>
        <div className="font-medium text-blue-600">{producto.codigo}</div>
        <div className="text-sm text-gray-600">{producto.nombre}</div>
        <Tag value={producto.categoria} severity="info" className="text-xs mt-1" />
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    // Simulación de clientes
    const clientes = {
      1: { razonSocial: 'Distribuidora Internacional SAC', pais: 'Perú' },
      2: { razonSocial: 'Global Fish Trading Ltd', pais: 'China' },
      3: { razonSocial: 'European Seafood Import', pais: 'España' },
      4: { razonSocial: 'Asian Marine Products', pais: 'Japón' }
    };
    
    const cliente = clientes[rowData.clienteId] || { 
      razonSocial: `Cliente ${rowData.clienteId}`, 
      pais: 'N/A'
    };
    
    return (
      <div>
        <div className="font-medium text-green-600">{cliente.razonSocial}</div>
        <div className="text-sm text-gray-600">{cliente.pais}</div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-blue-600">
          {Number(rowData.cantidad).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
        <div className="text-sm text-gray-600">TM</div>
      </div>
    );
  };

  const precioTemplate = (rowData) => {
    const precioUnitario = Number(rowData.precioUnitario || 0);
    const cantidad = Number(rowData.cantidad || 0);
    const total = precioUnitario * cantidad;
    
    return (
      <div className="text-right">
        <div className="font-medium">
          {formatearMoneda(precioUnitario)}
        </div>
        <div className="text-sm text-gray-600">por TM</div>
        <div className="font-bold text-green-600 mt-1">
          Total: {formatearMoneda(total)}
        </div>
      </div>
    );
  };

  const monedaTemplate = (rowData) => {
    // Simulación de monedas
    const monedas = {
      1: { codigo: 'PEN', nombre: 'Soles', simbolo: 'S/' },
      2: { codigo: 'USD', nombre: 'Dólares', simbolo: '$' },
      3: { codigo: 'EUR', nombre: 'Euros', simbolo: '€' },
      4: { codigo: 'CNY', nombre: 'Yuan', simbolo: '¥' }
    };
    
    const moneda = monedas[rowData.monedaId] || { 
      codigo: 'PEN', 
      nombre: 'Soles',
      simbolo: 'S/'
    };
    
    return (
      <div className="text-center">
        <div className="font-bold text-purple-600">{moneda.codigo}</div>
        <div className="text-sm text-gray-600">{moneda.simbolo}</div>
      </div>
    );
  };

  const almacenTemplate = (rowData) => {
    return (
      <div className="text-center">
        <div className="font-medium">MOV-{String(rowData.movSalidaAlmacenId).padStart(6, '0')}</div>
        <div className="text-sm text-gray-600">Salida Almacén</div>
      </div>
    );
  };

  const prefacturaTemplate = (rowData) => {
    if (!rowData.prefacturaVentaId) {
      return <span className="text-gray-400">Sin prefactura</span>;
    }
    
    return (
      <div className="text-center">
        <div className="font-medium text-orange-600">
          PRE-{String(rowData.prefacturaVentaId).padStart(6, '0')}
        </div>
        <div className="text-sm text-gray-600">Prefactura</div>
      </div>
    );
  };

  const centroCostoTemplate = (rowData) => {
    // Simulación de centros de costo
    const centrosCosto = {
      1: { codigo: 'CC001', nombre: 'Operaciones Pesca', tipo: 'Operativo' },
      2: { codigo: 'CC002', nombre: 'Administración', tipo: 'Administrativo' },
      3: { codigo: 'CC003', nombre: 'Ventas', tipo: 'Comercial' },
      4: { codigo: 'CC004', nombre: 'Producción', tipo: 'Productivo' }
    };
    
    const centroCosto = centrosCosto[rowData.centroCostoId] || { 
      codigo: `CC${rowData.centroCostoId}`, 
      nombre: `Centro ${rowData.centroCostoId}`,
      tipo: 'General'
    };
    
    return (
      <div>
        <div className="font-medium">{centroCosto.codigo}</div>
        <div className="text-sm text-gray-600">{centroCosto.nombre}</div>
        <div className="text-xs text-gray-500">{centroCosto.tipo}</div>
      </div>
    );
  };

  const observacionesTemplate = (rowData) => {
    if (!rowData.observaciones) return '';
    return (
      <span title={rowData.observaciones}>
        {rowData.observaciones.length > 30 ? 
          `${rowData.observaciones.substring(0, 30)}...` : 
          rowData.observaciones}
      </span>
    );
  };

  const fechasTemplate = (rowData) => {
    const formatearFecha = (fecha) => {
      if (!fecha) return '';
      return new Date(fecha).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    return (
      <div className="text-sm">
        <div>
          <span className="font-medium">Creado:</span> {formatearFecha(rowData.creadoEn)}
        </div>
        {rowData.actualizadoEn && (
          <div>
            <span className="font-medium">Actualizado:</span> {formatearFecha(rowData.actualizadoEn)}
          </div>
        )}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    // Solo mostrar botón eliminar para superusuario o admin
    const puedeEliminar = usuario?.esSuperUsuario || usuario?.esAdmin;
    
    return (
      <div className="flex gap-2">
        {puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="det-cotizacion-ventas-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Detalles de Cotizaciones de Ventas</h2>
          <Button
            label="Nuevo Detalle"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={detalles}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron detalles de cotización"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="cotizacionVentasId" 
            header="Cotización" 
            body={cotizacionTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="productoId" 
            header="Producto" 
            body={productoTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="clienteId" 
            header="Cliente" 
            body={clienteTemplate}
            sortable 
            style={{ width: '200px' }}
          />
          <Column 
            field="cantidad" 
            header="Cantidad" 
            body={cantidadTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="precioUnitario" 
            header="Precio" 
            body={precioTemplate}
            sortable 
            style={{ width: '150px' }}
            className="text-right"
          />
          <Column 
            field="monedaId" 
            header="Moneda" 
            body={monedaTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="movSalidaAlmacenId" 
            header="Mov. Almacén" 
            body={almacenTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="prefacturaVentaId" 
            header="Prefactura" 
            body={prefacturaTemplate}
            sortable 
            style={{ width: '130px' }}
            className="text-center"
          />
          <Column 
            field="centroCostoId" 
            header="Centro de Costo" 
            body={centroCostoTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            header="Fechas" 
            body={fechasTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            body={observacionesTemplate}
            sortable 
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: '100px' }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '800px' }}
        header={isEditing ? 'Editar Detalle de Cotización' : 'Nuevo Detalle de Cotización'}
        modal
        onHide={cerrarDialogo}
      >
        <DetCotizacionVentasForm
          detalle={selectedDetalle}
          onSave={() => {
            cargarDetalles();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default DetCotizacionVentas;
