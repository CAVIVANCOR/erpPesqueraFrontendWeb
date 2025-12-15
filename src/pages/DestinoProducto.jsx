/**
 * Pantalla CRUD para gestión de Destinos de Producto
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
  getAllDestinoProducto,
  deleteDestinoProducto,
  crearDestinoProducto,
  actualizarDestinoProducto,
} from "../api/destinoProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import DestinoProductoForm from "../components/destinoProducto/DestinoProductoForm";
import { getResponsiveFontSize } from "../utils/utils";

const DestinoProducto = () => {
  const [destinosProducto, setDestinosProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [destinoAEliminar, setDestinoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions("DestinoProducto");
  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  useEffect(() => {
    cargarDestinosProducto();
  }, []);

  const cargarDestinosProducto = async () => {
    try {
      setLoading(true);
      const data = await getAllDestinoProducto();
      setDestinosProducto(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar destinos de producto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setDestinoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (destino) => {
    setDestinoSeleccionado(destino);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setDestinoSeleccionado(null);
  };

  const onGuardarExitoso = async (data) => {
    if (destinoSeleccionado) {
      try {
        await actualizarDestinoProducto(destinoSeleccionado.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Destino de producto actualizado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar destino de producto",
          life: 3000,
        });
      }
    } else {
      try {
        await crearDestinoProducto(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Destino de producto creado correctamente",
          life: 3000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al crear destino de producto",
          life: 3000,
        });
      }
    }
    cargarDestinosProducto();
    cerrarDialogo();
  };

  const confirmarEliminacion = (destino) => {
    setDestinoAEliminar(destino);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await deleteDestinoProducto(destinoAEliminar.id);
      setDestinosProducto(
        destinosProducto.filter(
          (d) => Number(d.id) !== Number(destinoAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Destino de producto eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar destino de producto",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setDestinoAEliminar(null);
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
        value={destinosProducto}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron destinos de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "descripcion"]}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Destinos de Producto</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo Destino de Producto"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar destinos de producto..."
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
          destinoSeleccionado
            ? "Editar Destino de Producto"
            : "Nuevo Destino de Producto"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <DestinoProductoForm
          destinoProducto={destinoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          readOnly={readOnly}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el destino de producto "${destinoAEliminar?.nombre}"?`}
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

export default DestinoProducto;