/**
 * Pantalla CRUD para gestión de Estados Multifunción
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por descripción, tipo proviene de
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
import {
  getEstadosMultiFuncion,
  eliminarEstadoMultiFuncion,
} from "../api/estadoMultiFuncion";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EstadoMultiFuncionForm from "../components/estadoMultiFuncion/EstadoMultiFuncionForm";
import { getResponsiveFontSize } from "../utils/utils";
import { getTiposProvieneDe } from "../api/tipoProvieneDe"; // Agregar esta línea
import { Dropdown } from "primereact/dropdown"; // Agregar esta línea

const EstadoMultiFuncion = () => {
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [estadoAEliminar, setEstadoAEliminar] = useState(null);
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const [globalFilter, setGlobalFilter] = useState("");
  const [tiposProvieneDe, setTiposProvieneDe] = useState([]); // Agregar
  const [filtroTipoProvieneDe, setFiltroTipoProvieneDe] = useState(null); // Agregar

  const cargarTiposProvieneDe = async () => {
    try {
      const data = await getTiposProvieneDe();
      setTiposProvieneDe(data);
    } catch (error) {
      console.error("Error al cargar tipos proviene de:", error);
    }
  };

  useEffect(() => {
    cargarEstadosMultiFuncion();
    cargarTiposProvieneDe(); // Agregar esta línea
  }, []);

  const cargarEstadosMultiFuncion = async () => {
    try {
      setLoading(true);
      const data = await getEstadosMultiFuncion();
      setEstadosMultiFuncion(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar estados multifunción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
    setFiltroTipoProvieneDe(null);
  };

  const abrirDialogoNuevo = () => {
    setEstadoSeleccionado(null);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (estado) => {
    setEstadoSeleccionado(estado);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEstadoSeleccionado(null);
  };

  const onGuardarExitoso = () => {
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: "Estado multifunción guardado correctamente",
      life: 3000,
    });
    cargarEstadosMultiFuncion();
    cerrarDialogo();
  };

  const confirmarEliminacion = (estado) => {
    setEstadoAEliminar(estado);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarEstadoMultiFuncion(estadoAEliminar.id);
      setEstadosMultiFuncion(
        estadosMultiFuncion.filter(
          (e) => Number(e.id) !== Number(estadoAEliminar.id)
        )
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Estado multifunción eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar estado multifunción",
        life: 3000,
      });
    } finally {
      setConfirmVisible(false);
      setEstadoAEliminar(null);
    }
  };

  const idTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976d2" }}>{rowData.id}</span>
    );
  };

  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.descripcion || (
          <em style={{ color: "#999" }}>Sin descripción</em>
        )}
      </span>
    );
  };

  const tipoProvieneDeTemplate = (rowData) => {
    return (
      <span>
        {rowData.tipoProvieneDe?.nombre ||
          rowData.tipoProvieneDe?.descripcion || (
            <em style={{ color: "#999" }}>No especificado</em>
          )}
      </span>
    );
  };

  const cesadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        severity={rowData.cesado ? "danger" : "success"}
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
        value={estadosMultiFuncion}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer p-datatable-sm"
        emptyMessage="No se encontraron estados multifunción"
        globalFilter={globalFilter}
        globalFilterFields={[
          "descripcion",
          "tipoProvieneDe.nombre",
          "tipoProvieneDe.descripcion",
        ]}
        filters={{
          "tipoProvieneDe.id": {
            value: filtroTipoProvieneDe ? Number(filtroTipoProvieneDe) : null,
            matchMode: "equals",
          },
        }}
        header={
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Estados Multifunción</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                size="small"
                raised
                tooltip="Nuevo Estado Multifunción"
                className="p-button-success"
                severity="success"
                onClick={abrirDialogoNuevo}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Dropdown
                value={filtroTipoProvieneDe}
                options={tiposProvieneDe.map((tipo) => ({
                  label: tipo.descripcion || `ID: ${tipo.id}`,
                  value: Number(tipo.id),
                }))}
                onChange={(e) => setFiltroTipoProvieneDe(e.value)}
                placeholder="Filtrar por Tipo Proviene"
                showClear
                style={{ width: "200px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar estados multifunción..."
                style={{ width: "300px" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Button
                label="Limpiar"
                icon="pi pi-filter-slash"
                className="p-button-secondary"
                size="small"
                onClick={limpiarFiltros}
                disabled={!globalFilter && !filtroTipoProvieneDe}
              />
            </div>
          </div>
        }
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="id"
          header="ID"
          body={idTemplate}
          sortable
          style={{ width: "80px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          body={descripcionTemplate}
          sortable
        />
        <Column
          field="tipoProvieneDe"
          header="Tipo Proviene De"
          body={tipoProvieneDeTemplate}
          sortable
        />
        <Column
          header="Estado"
          body={cesadoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          estadoSeleccionado
            ? "Editar Estado Multifunción"
            : "Nuevo Estado Multifunción"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "600px" }}
        modal
      >
        <EstadoMultiFuncionForm
          estadoMultiFuncion={estadoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
        />
      </Dialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el estado multifunción "${
          estadoAEliminar?.descripcion || `ID: ${estadoAEliminar?.id}`
        }"?`}
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

export default EstadoMultiFuncion;
