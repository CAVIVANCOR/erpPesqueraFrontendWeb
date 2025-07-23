/**
 * Pantalla CRUD para gestión de Tipos de Movimiento
 * 
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { getTiposMovimiento, eliminarTipoMovimiento } from '../api/tipoMovimiento';
import { useAuthStore } from '../shared/stores/useAuthStore';
import TipoMovimientoForm from '../components/tipoMovimiento/TipoMovimientoForm';

const TipoMovimiento = () => {
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoMovimientoSeleccionado, setTipoMovimientoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoMovimientoAEliminar, setTipoMovimientoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTiposMovimiento();
  }, []);

  const cargarTiposMovimiento = async () => {
    try {
      setLoading(true);
      const data = await getTiposMovimiento();
      setTiposMovimiento(data);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar tipos de movimiento',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoMovimientoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipoMovimiento) => {
    setTipoMovimientoSeleccionado(tipoMovimiento);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoMovimientoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarTiposMovimiento();
    cerrarDialogo();
    toast.current.show({
      severity: 'success',
      summary: 'Éxito',
      detail: tipoMovimientoSeleccionado ? 'Tipo de movimiento actualizado correctamente' : 'Tipo de movimiento creado correctamente',
      life: 3000
    });
  };

  const confirmarEliminacion = (tipoMovimiento) => {
    setTipoMovimientoAEliminar(tipoMovimiento);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoMovimiento(tipoMovimientoAEliminar.id);
      setTiposMovimiento(tiposMovimiento.filter(t => t.id !== tipoMovimientoAEliminar.id));
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de movimiento eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar tipo de movimiento',
        life: 3000
      });
    } finally {
      setConfirmVisible(false);
      setTipoMovimientoAEliminar(null);
    }
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.activo ? 'Activo' : 'Inactivo'} 
        severity={rowData.activo ? 'success' : 'danger'} 
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Tipos de Movimiento</h2>
        <Button
          label="Nuevo Tipo de Movimiento"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
        />
      </div>

      <DataTable
        value={tiposMovimiento}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de movimiento"
        scrollable
        scrollHeight="600px"
      >
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column body={accionesTemplate} header="Acciones" style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        header={tipoMovimientoSeleccionado ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: '600px' }}
        modal
      >
        <TipoMovimientoForm
          tipoMovimiento={tipoMovimientoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de movimiento "${tipoMovimientoAEliminar?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="p-button-danger"
      />
    </div>
  );
};

export default TipoMovimiento;
