/**
 * Pantalla CRUD para gestión de Tipos de Equipo
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
import { getTiposEquipo, eliminarTipoEquipo } from '../api/tipoEquipo';
import { useAuthStore } from '../shared/stores/useAuthStore';
import TipoEquipoForm from '../components/tipoEquipo/TipoEquipoForm';

const TipoEquipo = () => {
  const [tiposEquipo, setTiposEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoEquipoSeleccionado, setTipoEquipoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoEquipoAEliminar, setTipoEquipoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarTiposEquipo();
  }, []);

  const cargarTiposEquipo = async () => {
    try {
      setLoading(true);
      const data = await getTiposEquipo();
      setTiposEquipo(data);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar tipos de equipo',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoEquipoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipoEquipo) => {
    setTipoEquipoSeleccionado(tipoEquipo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoEquipoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarTiposEquipo();
    cerrarDialogo();
    toast.current.show({
      severity: 'success',
      summary: 'Éxito',
      detail: tipoEquipoSeleccionado ? 'Tipo de equipo actualizado correctamente' : 'Tipo de equipo creado correctamente',
      life: 3000
    });
  };

  const confirmarEliminacion = (tipoEquipo) => {
    setTipoEquipoAEliminar(tipoEquipo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoEquipo(tipoEquipoAEliminar.id);
      setTiposEquipo(tiposEquipo.filter(t => t.id !== tipoEquipoAEliminar.id));
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de equipo eliminado correctamente',
        life: 3000
      });
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar tipo de equipo',
        life: 3000
      });
    } finally {
      setConfirmVisible(false);
      setTipoEquipoAEliminar(null);
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
        <h2>Gestión de Tipos de Equipo</h2>
        <Button
          label="Nuevo Tipo de Equipo"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
        />
      </div>

      <DataTable
        value={tiposEquipo}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de equipo"
        scrollable
        scrollHeight="600px"
      >
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column body={accionesTemplate} header="Acciones" style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        header={tipoEquipoSeleccionado ? 'Editar Tipo de Equipo' : 'Nuevo Tipo de Equipo'}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: '600px' }}
        modal
      >
        <TipoEquipoForm
          tipoEquipo={tipoEquipoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de equipo "${tipoEquipoAEliminar?.nombre}"?`}
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

export default TipoEquipo;
