// src/pages/PreFactura.jsx
// Pantalla CRUD profesional para PreFactura. Cumple regla transversal ERP Megui:
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
import { getAllPreFactura, deletePreFactura } from '../api/preFactura';
import PreFacturaForm from '../components/preFactura/PreFacturaForm';

/**
 * Componente PreFactura
 * Gestión CRUD de pre-facturas con patrón profesional ERP Megui
 */
const PreFactura = () => {
  const [preFacturas, setPreFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPreFactura, setSelectedPreFactura] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarPreFacturas();
  }, []);

  const cargarPreFacturas = async () => {
    try {
      setLoading(true);
      const data = await getAllPreFactura();
      setPreFacturas(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar pre-facturas'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedPreFactura(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (preFactura) => {
    setSelectedPreFactura(preFactura);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedPreFactura(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (preFactura) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la pre-factura "${preFactura.numero}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarPreFactura(preFactura.id)
    });
  };

  const eliminarPreFactura = async (id) => {
    try {
      await deletePreFactura(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pre-factura eliminada correctamente'
      });
      cargarPreFacturas();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la pre-factura'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  const formatearMoneda = (valor) => {
    if (!valor) return 'S/ 0.00';
    return `S/ ${Number(valor).toFixed(2)}`;
  };

  const estadoTemplate = (rowData) => {
    const estadoMap = {
      'BORRADOR': { severity: 'secondary', value: 'BORRADOR' },
      'PENDIENTE': { severity: 'warning', value: 'PENDIENTE' },
      'APROBADA': { severity: 'success', value: 'APROBADA' },
      'FACTURADA': { severity: 'info', value: 'FACTURADA' },
      'CANCELADA': { severity: 'danger', value: 'CANCELADA' }
    };
    
    const estado = estadoMap[rowData.estado] || { severity: 'secondary', value: rowData.estado };
    return <Tag value={estado.value} severity={estado.severity} />;
  };

  const tipoDocumentoTemplate = (rowData) => {
    const tipoMap = {
      'FACTURA': { severity: 'info', value: 'FACTURA' },
      'BOLETA': { severity: 'success', value: 'BOLETA' },
      'NOTA_CREDITO': { severity: 'warning', value: 'N. CRÉDITO' },
      'NOTA_DEBITO': { severity: 'danger', value: 'N. DÉBITO' }
    };
    
    const tipo = tipoMap[rowData.tipoDocumento] || { severity: 'secondary', value: rowData.tipoDocumento };
    return <Tag value={tipo.value} severity={tipo.severity} />;
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
    <div className="pre-factura-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Pre-Facturas</h2>
          <Button
            label="Nueva Pre-Factura"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={preFacturas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron pre-facturas"
          scrollable
          scrollHeight="600px"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} frozen />
          <Column field="numero" header="Número" sortable style={{ width: '120px' }} />
          <Column 
            field="fechaEmision" 
            header="F. Emisión" 
            body={(rowData) => formatearFecha(rowData.fechaEmision)}
            sortable 
            style={{ width: '120px' }}
          />
          <Column 
            field="fechaVencimiento" 
            header="F. Vencimiento" 
            body={(rowData) => formatearFecha(rowData.fechaVencimiento)}
            sortable 
            style={{ width: '130px' }}
          />
          <Column 
            field="tipoDocumento" 
            header="Tipo Doc." 
            body={tipoDocumentoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column field="clienteId" header="Cliente ID" sortable style={{ width: '120px' }} />
          <Column 
            field="estado" 
            header="Estado" 
            body={estadoTemplate}
            sortable 
            style={{ width: '120px' }}
            className="text-center"
          />
          <Column field="monedaId" header="Moneda ID" sortable style={{ width: '100px' }} />
          <Column 
            field="tipoCambio" 
            header="T.C." 
            body={(rowData) => Number(rowData.tipoCambio || 1).toFixed(4)}
            sortable 
            style={{ width: '100px' }}
            className="text-right"
          />
          <Column 
            field="subtotal" 
            header="Subtotal" 
            body={(rowData) => formatearMoneda(rowData.subtotal)}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="impuestos" 
            header="Impuestos" 
            body={(rowData) => formatearMoneda(rowData.impuestos)}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column 
            field="total" 
            header="Total" 
            body={(rowData) => formatearMoneda(rowData.total)}
            sortable 
            style={{ width: '120px' }}
            className="text-right"
          />
          <Column field="vendedorId" header="Vendedor ID" sortable style={{ width: '120px' }} />
          <Column 
            field="observaciones" 
            header="Observaciones" 
            sortable 
            style={{ minWidth: '200px' }}
            body={(rowData) => (
              <span title={rowData.observaciones}>
                {rowData.observaciones && rowData.observaciones.length > 50 ? 
                  `${rowData.observaciones.substring(0, 50)}...` : 
                  rowData.observaciones || ''}
              </span>
            )}
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
        style={{ width: '1100px' }}
        header={isEditing ? 'Editar Pre-Factura' : 'Nueva Pre-Factura'}
        modal
        onHide={cerrarDialogo}
      >
        <PreFacturaForm
          preFactura={selectedPreFactura}
          onSave={() => {
            cargarPreFacturas();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default PreFactura;
