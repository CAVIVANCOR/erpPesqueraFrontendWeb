/**
 * Pantalla CRUD para gestión de Provincias
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global con filtro en tiempo real
 * - Cumple regla transversal ERP Megui completa
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
import { InputText } from "primereact/inputtext";
import { getProvincias, eliminarProvincia } from "../api/provincia";
import { useAuthStore } from "../shared/stores/useAuthStore";
import ProvinciaForm from "../components/provincia/ProvinciaForm";
import { getResponsiveFontSize } from "../utils/utils";

const Provincia = () => {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [provinciaAEliminar, setProvinciaAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarProvincias();
  }, []);

  const cargarProvincias = async () => {
    try {
      setLoading(true);
      const data = await getProvincias();
      setProvincias(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar provincias",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setProvinciaSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (provincia) => {
    setProvinciaSeleccionada(provincia);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setProvinciaSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarProvincias();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: provinciaSeleccionada
        ? "Provincia actualizada correctamente"
        : "Provincia creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (provincia) => {
    setProvinciaAEliminar(provincia);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarProvincia(provinciaAEliminar.id);
      setProvincias(
        provincias.filter((p) => p.id !== provinciaAEliminar.id)
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Provincia eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar provincia",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setProvinciaAEliminar(null);
    }
  };

  const departamentoTemplate = (rowData) => {
    return rowData.departamento?.nombre || "N/A";
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
        value={provincias}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron provincias"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Provincias</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Provincia"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar provincias..."
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
        <Column field="codSUNAT" header="Código SUNAT" sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="departamento.nombre" header="Departamento" body={departamentoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          provinciaSeleccionada
            ? "Editar Provincia"
            : "Nueva Provincia"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <ProvinciaForm
          provincia={provinciaSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la provincia "${provinciaAEliminar?.nombre}"?`}
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

export default Provincia;
