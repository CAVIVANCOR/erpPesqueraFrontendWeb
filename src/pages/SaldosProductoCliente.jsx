// src/pages/SaldosProductoCliente.jsx
// Pantalla CRUD profesional para SaldosProductoCliente. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { getSaldosProductoCliente, eliminarSaldosProductoCliente } from '../api/saldosProductoCliente';
import SaldosProductoClienteForm from '../components/saldosProductoCliente/SaldosProductoClienteForm';

/**
 * Componente SaldosProductoCliente
 * Gestión CRUD de saldos de productos por cliente con patrón profesional ERP Megui
 */
const SaldosProductoCliente = () => {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedSaldo, setSelectedSaldo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarSaldos();
  }, []);

  const cargarSaldos = async () => {
    try {
      setLoading(true);
      const data = await getSaldosProductoCliente();
      setSaldos(data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar saldos de productos'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setSelectedSaldo(null);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (saldo) => {
    setSelectedSaldo(saldo);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedSaldo(null);
    setIsEditing(false);
  };

  const confirmarEliminacion = (saldo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el saldo ${saldo.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarSaldo(saldo.id)
    });
  };

  const eliminarSaldo = async (id) => {
    try {
      await eliminarSaldosProductoCliente(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Saldo eliminado correctamente'
      });
      cargarSaldos();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el saldo'
      });
    }
  };

  const onRowClick = (event) => {
    abrirDialogoEdicion(event.data);
  };

  const formatearDecimal = (valor) => {
    if (valor === null || valor === undefined) return '';
    return Number(valor).toFixed(2);
  };

  const custodiaTemplate = (rowData) => {
    return rowData.custodia ? 
      <i className="pi pi-check text-green-500" /> : 
      <i className="pi pi-times text-red-500" />;
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
    <div className="saldos-producto-cliente-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Saldos de Productos por Cliente</h2>
          <Button
            label="Nuevo Saldo"
            icon="pi pi-plus"
            onClick={abrirDialogoNuevo}
            className="p-button-primary"
          />
        </div>

        <DataTable
          value={saldos}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          onRowClick={onRowClick}
          selectionMode="single"
          className="datatable-responsive"
          emptyMessage="No se encontraron saldos"
        >
          <Column field="id" header="ID" sortable style={{ width: '80px' }} />
          <Column field="empresaId" header="Empresa ID" sortable />
          <Column field="almacenId" header="Almacén ID" sortable />
          <Column field="productoId" header="Producto ID" sortable />
          <Column field="clienteId" header="Cliente ID" sortable />
          <Column 
            field="custodia" 
            header="Custodia" 
            body={custodiaTemplate}
            sortable 
            style={{ width: '100px' }}
            className="text-center"
          />
          <Column 
            field="saldoCantidad" 
            header="Saldo Cantidad" 
            body={(rowData) => formatearDecimal(rowData.saldoCantidad)}
            sortable 
            className="text-right"
          />
          <Column 
            field="saldoPeso" 
            header="Saldo Peso" 
            body={(rowData) => formatearDecimal(rowData.saldoPeso)}
            sortable 
            className="text-right"
          />
          <Column 
            field="costoUnitarioPromedio" 
            header="Costo Unit. Promedio" 
            body={(rowData) => formatearDecimal(rowData.costoUnitarioPromedio)}
            sortable 
            className="text-right"
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: '100px' }}
            className="text-center"
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogVisible}
        style={{ width: '700px' }}
        header={isEditing ? 'Editar Saldo' : 'Nuevo Saldo'}
        modal
        onHide={cerrarDialogo}
      >
        <SaldosProductoClienteForm
          saldo={selectedSaldo}
          onSave={() => {
            cargarSaldos();
            cerrarDialogo();
          }}
          onCancel={cerrarDialogo}
        />
      </Dialog>
    </div>
  );
};

export default SaldosProductoCliente;
