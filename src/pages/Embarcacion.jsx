/**
 * Pantalla CRUD para gestión de Embarcaciones
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por matrícula, motor, tablet
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
import { getEmbarcaciones, eliminarEmbarcacion } from "../api/embarcacion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EmbarcacionForm from "../components/embarcacion/EmbarcacionForm";
import { getResponsiveFontSize } from "../utils/utils";

const Embarcacion = () => {
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [embarcacionSeleccionada, setEmbarcacionSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [embarcacionAEliminar, setEmbarcacionAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarEmbarcaciones();
  }, []);

  const cargarEmbarcaciones = async () => {
    try {
      setLoading(true);
      const data = await getEmbarcaciones();
      setEmbarcaciones(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar embarcaciones",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setEmbarcacionSeleccionada(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (embarcacion) => {
    setEmbarcacionSeleccionada(embarcacion);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEmbarcacionSeleccionada(null);
  };

  const onGuardarExitoso = () => {
    cargarEmbarcaciones();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: embarcacionSeleccionada
        ? "Embarcación actualizada correctamente"
        : "Embarcación creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (embarcacion) => {
    setEmbarcacionAEliminar(embarcacion);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarEmbarcacion(embarcacionAEliminar.id);
      setEmbarcaciones(
        embarcaciones.filter((e) => Number(e.id) !== Number(embarcacionAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Embarcación eliminada correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar embarcación",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setEmbarcacionAEliminar(null);
    }
  };

  const matriculaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.matricula}
      </span>
    );
  };

  const tipoEmbarcacionTemplate = (rowData) => {
    return rowData.tipoEmbarcacion?.nombre || "N/A";
  };

  const capacidadTemplate = (rowData) => {
    return rowData.capacidadBodegaTon 
      ? `${rowData.capacidadBodegaTon} Ton`
      : "N/A";
  };

  const medidaTemplate = (rowData, field) => {
    return rowData[field] 
      ? `${rowData[field]} m`
      : "N/A";
  };

  const motorTemplate = (rowData) => {
    if (rowData.motorMarca && rowData.motorPotenciaHp) {
      return `${rowData.motorMarca} (${rowData.motorPotenciaHp} HP)`;
    } else if (rowData.motorMarca) {
      return rowData.motorMarca;
    } else if (rowData.motorPotenciaHp) {
      return `${rowData.motorPotenciaHp} HP`;
    }
    return "N/A";
  };

  const estadoTemplate = (rowData) => {
    // Aquí puedes mapear el estadoActivoId a un estado legible
    // Por ahora mostramos el ID, pero idealmente debería mostrar el nombre del estado
    return (
      <Tag
        value={rowData.estadoActivoId ? `Estado ${rowData.estadoActivoId}` : "Sin Estado"}
        severity="info"
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
        value={embarcaciones}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron embarcaciones"
        globalFilter={globalFilter}
        globalFilterFields={['matricula', 'motorMarca', 'tabletMarca']}
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Embarcaciones</h2>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              size="small"
              raised
              tooltip="Nueva Embarcación"
              outlined
              className="p-button-success"
              onClick={abrirDialogoNuevo}
            />
            <span className="p-input-icon-left">
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar embarcaciones..."
                style={{ width: "300px" }}
              />
            </span>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column 
          field="matricula" 
          header="Matrícula" 
          body={matriculaTemplate}
          sortable 
        />
        <Column 
          header="Tipo" 
          body={tipoEmbarcacionTemplate}
          sortable 
        />
        <Column 
          field="capacidadBodegaTon" 
          header="Capacidad" 
          body={capacidadTemplate}
          sortable 
        />
        <Column 
          field="esloraM" 
          header="Eslora" 
          body={(rowData) => medidaTemplate(rowData, 'esloraM')}
          sortable 
        />
        <Column 
          header="Motor" 
          body={motorTemplate}
          sortable 
        />
        <Column 
          field="anioFabricacion" 
          header="Año Fab." 
          sortable 
        />
        <Column 
          header="Estado" 
          body={estadoTemplate}
          sortable 
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          embarcacionSeleccionada
            ? "Editar Embarcación"
            : "Nueva Embarcación"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "800px" }}
        modal
      >
        <EmbarcacionForm
          embarcacion={embarcacionSeleccionada}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la embarcación "${embarcacionAEliminar?.matricula}"?`}
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

export default Embarcacion;
