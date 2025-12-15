/**
 * Pantalla CRUD profesional para TipoAlmacenamiento
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, nombre (VarChar 80), productos[]
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global por cualquier campo.
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
import {
  getTiposAlmacenamiento,
  eliminarTipoAlmacenamiento,
} from "../api/tipoAlmacenamiento";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import TipoAlmacenamientoForm from "../components/tipoAlmacenamiento/TipoAlmacenamientoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente TipoAlmacenamiento
 * Pantalla principal para gestión de tipos de almacenamiento
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const TipoAlmacenamiento = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions("TipoAlmacenamiento");
  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Estados del componente
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoAlmacenamientoSeleccionado, setTipoAlmacenamientoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los tipos de almacenamiento desde la API
   */
  const cargarTiposAlmacenamiento = async () => {
    try {
      setLoading(true);
      const data = await getTiposAlmacenamiento();

      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map((tipo) => ({
        ...tipo,
        id: Number(tipo.id),
      }));

      setTiposAlmacenamiento(tiposNormalizados);
    } catch (error) {
      console.error("Error al cargar tipos de almacenamiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los tipos de almacenamiento",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTiposAlmacenamiento();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo de almacenamiento
   */
  const abrirDialogoNuevo = () => {
    setTipoAlmacenamientoSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo de almacenamiento (clic en fila)
   */
  const editarTipoAlmacenamiento = (tipoAlmacenamiento) => {
    setTipoAlmacenamientoSeleccionado(tipoAlmacenamiento);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoAlmacenamientoSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTiposAlmacenamiento();
  };

  /**
   * Confirma la eliminación de un tipo de almacenamiento
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipoAlmacenamiento) => {
    setConfirmState({ visible: true, row: tipoAlmacenamiento });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarTipoAlmacenamiento(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Tipo de almacenamiento "${confirmState.row.nombre}" eliminado correctamente`,
      });

      await cargarTiposAlmacenamiento();
    } catch (error) {
      console.error("Error al eliminar tipo de almacenamiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el tipo de almacenamiento",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Elimina un tipo de almacenamiento
   */
  const eliminarTipoAlmacenamientoLocal = async (id) => {
    try {
      await eliminarTipoAlmacenamiento(id);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Maneja el filtro global - búsqueda por cualquier campo
   */
  const onGlobalFilterChange = (e) => {
    setGlobalFilter(e.target.value);
  };

  /**
   * Template para el nombre del tipo de almacenamiento
   */
  const nombreTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.nombre}
      </span>
    );
  };

  /**
   * Template para fechas
   */
  const fechaTemplate = (rowData, field) => {
    const fecha = new Date(rowData[field]);
    return fecha.toLocaleDateString("es-PE");
  };

  /**
   * Template para acciones
   * Incluye botón de editar y eliminar (eliminar solo para superusuario/admin)
   * Estilo idéntico a TiposDocIdentidad.jsx: p-button-text, iconos pequeños
   */
  const accionesTemplate = (rowData) => {
    const esAdmin = usuario?.rol === "superusuario" || usuario?.rol === "admin";

    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={(e) => {
            e.stopPropagation();
            editarTipoAlmacenamiento(rowData);
          }}
        />
        {esAdmin && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger p-button-sm"
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />

      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span>
            ¿Está seguro de que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el tipo de
            almacenamiento{" "}
            <b>{confirmState.row ? `"${confirmState.row.nombre}"` : ""}</b>?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />

      <DataTable
        value={tiposAlmacenamiento}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de almacenamiento"
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        emptyMessage="No se encontraron tipos de almacenamiento"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Almacenamiento</h2>
            <Button
              type="button"
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
              disabled={!permisos.puedeCrear}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar tipos de almacenamiento..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarTipoAlmacenamiento(e.data)}
        className="datatable-responsive"
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          field="nombre"
          header="Nombre"
          body={nombreTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          frozen
          alignFrozen="right"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "500px" }}
        header={
          tipoAlmacenamientoSeleccionado?.id
            ? "Editar Tipo de Almacenamiento"
            : "Nuevo Tipo de Almacenamiento"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TipoAlmacenamientoForm
          tipoAlmacenamiento={tipoAlmacenamientoSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
          loading={loading}
          readOnly={readOnly}
        />
      </Dialog>
    </div>
  );
};

export default TipoAlmacenamiento;
