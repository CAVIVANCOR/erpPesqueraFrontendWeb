// src/pages/DetDescargaFaenaConsumo.jsx
// Pantalla CRUD profesional para DetDescargaFaenaConsumo. Cumple regla transversal ERP Megui:
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
import { getAllDetDescargaFaenaConsumo, deleteDetDescargaFaenaConsumo } from '../api/detDescargaFaenaConsumo';
import DetDescargaFaenaConsumoForm from '../components/detDescargaFaenaConsumo/DetDescargaFaenaConsumoForm';

/**
 * Componente DetDescargaFaenaConsumo
 * Gestión CRUD de detalles de descarga de faenas con patrón profesional ERP Megui
 */
const DetDescargaFaenaConsumo = () => {
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
      const data = await getAllDetDescargaFaenaConsumo();
      setDetalles(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar detalles de descarga'
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
      message: `¿Está seguro de eliminar el detalle ID ${detalle.id}?`,
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
      await deleteDetDescargaFaenaConsumo(id);
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

  const formatearPeso = (peso) => {
    if (!peso) return '0.00 kg';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(peso) + ' kg';
  };

  const formatearPrecio = (precio) => {
    if (!precio) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(precio);
  };

  const descargaTemplate = (rowData) => {
    // Simulación de descarga basado en ID
    const descargas = {
      1: { numero: 'DESC-2024-001', embarcacion: 'Don Lucho I' },
      2: { numero: 'DESC-2024-002', embarcacion: 'María del Carmen' },
      3: { numero: 'DESC-2024-003', embarcacion: 'San Pedro II' },
      4: { numero: 'DESC-2024-004', embarcacion: 'Estrella del Mar' }
    };
    
    const descarga = descargas[rowData.descargaFaenaConsumoId] || { numero: `DESC-${rowData.descargaFaenaConsumoId}`, embarcacion: 'N/A' };
    
    return (
      <div>
        <div className="font-medium text-primary">{descarga.numero}</div>
        <div className="text-sm text-gray-600">{descarga.embarcacion}</div>
      </div>
    );
  };

  const especieTemplate = (rowData) => {
    // Simulación de especies basado en ID
    const especies = {
      1: { nombreComun: 'Anchoveta', nombreCientifico: 'Engraulis ringens' },
      2: { nombreComun: 'Jurel', nombreCientifico: 'Trachurus murphyi' },
      3: { nombreComun: 'Caballa', nombreCientifico: 'Scomber japonicus' },
      4: { nombreComun: 'Sardina', nombreCientifico: 'Sardinops sagax' },
      5: { nombreComun: 'Perico', nombreCientifico: 'Coryphaena hippurus' },
      6: { nombreComun: 'Bonito', nombreCientifico: 'Sarda chiliensis' }
    };
    
    const especie = especies[rowData.especieId] || { nombreComun: `Especie ${rowData.especieId}`, nombreCientifico: 'N/A' };
    
    return (
      <div>
        <div className="font-medium">{especie.nombreComun}</div>
        <div className="text-sm text-gray-600 italic">{especie.nombreCientifico}</div>
      </div>
    );
  };

  const productoTemplate = (rowData) => {
    if (!rowData.productoId) return <span className="text-gray-400">Sin producto</span>;
    
    // Simulación de productos basado en ID
    const productos = {
      1: { codigo: 'PROD001', nombre: 'Filete de Anchoveta Fresco' },
      2: { codigo: 'PROD002', nombre: 'Jurel Entero Congelado' },
      3: { codigo: 'PROD003', nombre: 'Conserva de Caballa' },
      4: { codigo: 'PROD004', nombre: 'Sardina Fresca Entera' },
      5: { codigo: 'PROD005', nombre: 'Perico Fresco Exportación' },
      6: { codigo: 'PROD006', nombre: 'Bonito en Conserva' }
    };
    
    const producto = productos[rowData.productoId] || { codigo: `PROD${rowData.productoId}`, nombre: `Producto ${rowData.productoId}` };
    
    return (
      <div>
        <div className="font-medium">{producto.codigo}</div>
        <div className="text-sm text-gray-600">{producto.nombre}</div>
      </div>
    );
  };

  const cantidadCajasTemplate = (rowData) => {
    if (!rowData.cantidadCajas) return <span className="text-gray-400">N/A</span>;
    
    return (
      <div className="text-center">
        <span className="font-bold text-blue-600">{rowData.cantidadCajas}</span>
        <div className="text-xs text-gray-600">cajas</div>
      </div>
    );
  };

  const pesoBrutoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-green-600">{formatearPeso(rowData.pesoBruto)}</div>
      </div>
    );
  };

  const pesoNetoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-blue-600">{formatearPeso(rowData.pesoNeto)}</div>
      </div>
    );
  };

  const presentacionTemplate = (rowData) => {
    const getSeverity = (presentacion) => {
      switch (presentacion) {
        case 'ENTERO': return 'success';
        case 'FILETE': return 'info';
        case 'TROZO': return 'warning';
        case 'PULPA': return 'primary';
        default: return 'secondary';
      }
    };

    return (
      <Tag 
        value={rowData.presentacion || 'ENTERO'} 
        severity={getSeverity(rowData.presentacion)} 
      />
    );
  };

  const gradoFrescuraTemplate = (rowData) => {
    const getSeverity = (grado) => {
      switch (grado) {
        case 'A': return 'success';
        case 'B': return 'warning';
        case 'C': return 'danger';
        default: return 'secondary';
      }
    };

    const getLabel = (grado) => {
      switch (grado) {
        case 'A': return 'A - Excelente';
        case 'B': return 'B - Bueno';
        case 'C': return 'C - Regular';
        default: return grado || 'A';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.gradoFrescura)} 
        severity={getSeverity(rowData.gradoFrescura)} 
      />
    );
  };

  const tallaTemplate = (rowData) => {
    if (!rowData.talla) return <span className="text-gray-400">N/A</span>;
    
    return (
      <div className="text-center">
        <span className="font-medium">{rowData.talla}</span>
        {rowData.calibre && (
          <div className="text-xs text-gray-600">Cal: {rowData.calibre}</div>
        )}
      </div>
    );
  };

  const porcentajeHieloTemplate = (rowData) => {
    if (!rowData.porcentajeHielo) return <span className="text-gray-400">0%</span>;
    
    const color = rowData.porcentajeHielo > 20 ? 'text-red-600' : 
                  rowData.porcentajeHielo > 10 ? 'text-orange-600' : 'text-green-600';
    
    return (
      <div className="text-center">
        <span className={`font-bold ${color}`}>
          {rowData.porcentajeHielo.toFixed(1)}%
        </span>
      </div>
    );
  };

  const precioUnitarioTemplate = (rowData) => {
    if (!rowData.precioUnitario) return <span className="text-gray-400">Sin precio</span>;
    
    return (
      <div className="text-right">
        <div className="font-medium text-orange-600">{formatearPrecio(rowData.precioUnitario)}</div>
      </div>
    );
  };

  const valorTotalTemplate = (rowData) => {
    if (!rowData.valorTotal) return <span className="text-gray-400">Sin valor</span>;
    
    return (
      <div className="text-right">
        <div className="font-bold text-green-600">{formatearPrecio(rowData.valorTotal)}</div>
      </div>
    );
  };

  const trazabilidadTemplate = (rowData) => {
    const items = [];
    if (rowData.loteProduccion) items.push(`Lote: ${rowData.loteProduccion}`);
    if (rowData.codigoTrazabilidad) items.push(`Trz: ${rowData.codigoTrazabilidad}`);
    if (rowData.zonaCaptura) items.push(`Zona: ${rowData.zonaCaptura}`);
    
    if (items.length === 0) return <span className="text-gray-400">Sin datos</span>;
    
    return (
      <div className="text-sm">
        {items.map((item, index) => (
          <div key={index} className="text-gray-700">{item}</div>
        ))}
      </div>
    );
  };

  const destinoProductoTemplate = (rowData) => {
    const getSeverity = (destino) => {
      switch (destino) {
        case 'EXPORTACION': return 'success';
        case 'MERCADO_NACIONAL': return 'info';
        case 'INDUSTRIAL': return 'warning';
        default: return 'secondary';
      }
    };

    const getLabel = (destino) => {
      switch (destino) {
        case 'EXPORTACION': return 'Exportación';
        case 'MERCADO_NACIONAL': return 'Nacional';
        case 'INDUSTRIAL': return 'Industrial';
        default: return destino || 'Nacional';
      }
    };

    return (
      <Tag 
        value={getLabel(rowData.destinoProducto)} 
        severity={getSeverity(rowData.destinoProducto)} 
      />
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
    <div className="det-descarga-faena-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Detalles de Descarga - Pesca Consumo</h2>
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
          emptyMessage="No se encontraron detalles de descarga"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column 
            field="descargaFaenaConsumoId" 
            header="Descarga" 
            body={descargaTemplate}
            sortable 
            style={{ width: '150px' }}
          />
          <Column 
            field="especieId" 
            header="Especie" 
            body={especieTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="productoId" 
            header="Producto" 
            body={productoTemplate}
            sortable 
            style={{ width: '180px' }}
          />
          <Column 
            field="cantidadCajas" 
            header="Cajas" 
            body={cantidadCajasTemplate}
            sortable 
            style={{ width: '80px' }}
            className="text-center"
          />
          <Column 
            field="pesoBruto" 
            header="Peso Bruto" 
            body={pesoBrutoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="pesoNeto" 
            header="Peso Neto" 
            body={pesoNetoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="presentacion" 
            header="Presentación" 
            body={presentacionTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="gradoFrescura" 
            header="Frescura" 
            body={gradoFrescuraTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column 
            field="talla" 
            header="Talla/Calibre" 
            body={tallaTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="porcentajeHielo" 
            header="% Hielo" 
            body={porcentajeHieloTemplate}
            sortable 
            style={{ width: '80px' }}
            className="text-center"
          />
          <Column 
            field="precioUnitario" 
            header="Precio Unit." 
            body={precioUnitarioTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="valorTotal" 
            header="Valor Total" 
            body={valorTotalTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            header="Trazabilidad" 
            body={trazabilidadTemplate}
            style={{ width: '150px' }}
          />
          <Column 
            field="destinoProducto" 
            header="Destino" 
            body={destinoProductoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
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
        style={{ width: '900px' }}
        header={isEditing ? 'Editar Detalle de Descarga' : 'Nuevo Detalle de Descarga'}
        modal
        onHide={cerrarDialogo}
      >
        <DetDescargaFaenaConsumoForm
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

export default DetDescargaFaenaConsumo;
