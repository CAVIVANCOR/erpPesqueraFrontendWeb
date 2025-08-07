/**
 * Pantalla CRUD para gestión de Formas de Pago
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Cumple regla transversal ERP Megui completa
 * - REGLA CRÍTICA: Solo el formulario graba, el componente padre solo maneja UI
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getFormasPago, eliminarFormaPago } from "../api/formaPago";
import { useAuthStore } from "../shared/stores/useAuthStore";
import FormaPagoForm from "../components/formaPago/FormaPagoForm";
import { getResponsiveFontSize } from "../utils/utils";

const FormaPago = () => {
  const [formasPago, setFormasPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formaPagoAEliminar, setFormaPagoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarFormasPago();
  }, []);

  const cargarFormasPago = async () => {
    try {
      setLoading(true);
      const data = await getFormasPago();
      setFormasPago(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las formas de pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setFormaPagoSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (formaPago) => {
    setFormaPagoSeleccionada(formaPago);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setFormaPagoSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: formaPagoSeleccionada 
        ? "Forma de pago actualizada correctamente"
        : "Forma de pago creada correctamente",
      life: 3000,
    });
    
    cargarFormasPago();
    cerrarDialogo();
  };

  const confirmarEliminacion = (formaPago) => {
    setFormaPagoAEliminar(formaPago);
    setConfirmVisible(true);
  };

  const eliminarFormaPagoConfirmado = async () => {
    try {
      setLoading(true);
      await eliminarFormaPago(formaPagoAEliminar.id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Forma de pago eliminada correctamente",
        life: 3000,
      });
      cargarFormasPago();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la forma de pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
      setConfirmVisible(false);
      setFormaPagoAEliminar(null);
    }
  };

  // Template para mostrar estado activo/inactivo
  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
      />
    );
  };

  // Template para mostrar si aplica para clientes
  const clienteTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esCliente ? "Sí" : "No"}
        severity={rowData.esCliente ? "info" : "secondary"}
      />
    );
  };

  // Template para mostrar si aplica para proveedores
  const proveedorTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esProveedor ? "Sí" : "No"}
        severity={rowData.esProveedor ? "warning" : "secondary"}
      />
    );
  };

  // Template para acciones (editar/eliminar)
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
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
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={formasPago}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron formas de pago"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Formas de Pago</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Forma de Pago"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar formas de pago..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="esCliente" header="Para Clientes" body={clienteTemplate} sortable />
        <Column field="esProveedor" header="Para Proveedores" body={proveedorTemplate} sortable />
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      {/* Dialog para crear/editar forma de pago */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header={formaPagoSeleccionada ? "Editar Forma de Pago" : "Nueva Forma de Pago"}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <FormaPagoForm
          formaPago={formaPagoSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      {/* ConfirmDialog para eliminación */}
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la forma de pago "${formaPagoAEliminar?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={eliminarFormaPagoConfirmado}
        reject={() => {
          setConfirmVisible(false);
          setFormaPagoAEliminar(null);
        }}
      />
    </div>
  );
};

export default FormaPago;
