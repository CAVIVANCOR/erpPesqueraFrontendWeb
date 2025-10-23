/**
 * Pantalla CRUD para gestión de Tipos de Producto
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
import {
  getTiposProducto,
  eliminarTipoProducto,
  crearTipoProducto,
  actualizarTipoProducto,
} from "../api/tipoProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoProductoForm from "../components/tipoProducto/TipoProductoForm";
import { getResponsiveFontSize } from "../utils/utils";

const TipoProducto = () => {
  const [tiposProducto, setTiposProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarTiposProducto();
  }, []);

  const cargarTiposProducto = async () => {
    try {
      setLoading(true);
      const data = await getTiposProducto();
      setTiposProducto(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tipos de producto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setTipoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (tipo) => {
    setTipoSeleccionado(tipo);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setTipoSeleccionado(null);
  };

  const onGuardarExitoso = async (data) => {
    if (tipoSeleccionado) {
      try {
        await actualizarTipoProducto(tipoSeleccionado.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de producto actualizado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar tipo de producto",
          life: 3000,
        });
      }
    } else {
      try {
        await crearTipoProducto(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de producto creado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al crear tipo de producto",
          life: 3000,
        });
      }
    }
    cargarTiposProducto();
    cerrarDialogo();
  };

  const confirmarEliminacion = (tipo) => {
    setTipoAEliminar(tipo);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarTipoProducto(tipoAEliminar.id);
      setTiposProducto(
        tiposProducto.filter(
          (t) => Number(t.id) !== Number(tipoAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Tipo de producto eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar tipo de producto",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setTipoAEliminar(null);
    }
  };

  const nombreTemplate = (rowData) => {
    return <span style={{ fontWeight: "500" }}>{rowData.nombre}</span>;
  };

  const activoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const paraComprasTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraCompras ? "SÍ" : "NO"}
        severity={rowData.paraCompras ? "info" : "secondary"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const paraVentasTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.paraVentas ? "SÍ" : "NO"}
        severity={rowData.paraVentas ? "info" : "secondary"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
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
      <DataTable
        value={tiposProducto}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron tipos de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "descripcion"]}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Producto</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Tipo de Producto"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar tipos de producto..."
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
        <Column field="nombre" header="Nombre" body={nombreTemplate} sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Estado" body={activoTemplate} sortable />
        <Column header="Para Compras" body={paraComprasTemplate} sortable />
        <Column header="Para Ventas" body={paraVentasTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          tipoSeleccionado
            ? "Editar Tipo de Producto"
            : "Nuevo Tipo de Producto"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <TipoProductoForm
          tipoProducto={tipoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el tipo de producto "${tipoAEliminar?.nombre}"?`}
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

export default TipoProducto;