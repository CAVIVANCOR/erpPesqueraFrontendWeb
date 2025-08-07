/**
 * Pantalla CRUD para gestión de Países
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
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { getPaises, eliminarPais } from "../api/pais";
import { useAuthStore } from "../shared/stores/useAuthStore";
import PaisForm from "../components/pais/PaisForm";
import { getResponsiveFontSize } from "../utils/utils";

const Pais = () => {
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [paisAEliminar, setPaisAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarPaises();
  }, []);

  const cargarPaises = async () => {
    try {
      setLoading(true);
      const data = await getPaises();
      setPaises(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar países",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setPaisSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (pais) => {
    setPaisSeleccionado(pais);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setPaisSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    cargarPaises();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: paisSeleccionado
        ? "País actualizado correctamente"
        : "País creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (pais) => {
    setPaisAEliminar(pais);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarPais(paisAEliminar.id);
      setPaises(
        paises.filter((p) => p.id !== paisAEliminar.id)
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "País eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar país",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setPaisAEliminar(null);
    }
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
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
        value={paises}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron países"
        globalFilter={globalFilter}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Países</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nuevo País"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar países..."
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
        <Column field="activo" header="Estado" body={estadoTemplate} sortable />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          paisSeleccionado
            ? "Editar País"
            : "Nuevo País"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <PaisForm
          pais={paisSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el país "${paisAEliminar?.nombre}"?`}
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

export default Pais;
