/**
 * Pantalla CRUD profesional para Color
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
import { Tag } from "primereact/tag";
import {
  getColores,
  eliminarColor,
} from "../api/color";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import ColorForm from "../components/color/ColorForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente Color
 * Pantalla principal para gestión de colores
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const Color = ({ ruta }) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <div className="p-4"><h2>Sin Acceso</h2><p>No tiene permisos para acceder a este módulo.</p></div>;
  }
  const [globalFilter, setGlobalFilter] = useState("");

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;

  // Estados del componente
  const [colores, setColores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los colores desde la API
   */
  const cargarColores = async () => {
    try {
      setLoading(true);
      const data = await getColores();

      // Normalizar IDs según regla ERP Megui
      const coloresNormalizados = data.map((color) => ({
        ...color,
        id: Number(color.id),
      }));

      setColores(coloresNormalizados);
    } catch (error) {
      console.error("Error al cargar colores:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los colores",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarColores();
  }, []);

  /**
   * Abre el diálogo para crear nuevo color
   */
  const abrirDialogoNuevo = () => {
    setColorSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar color (clic en fila)
   */
  const editarColor = (color) => {
    setColorSeleccionado(color);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setColorSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarColores();
  };

  /**
   * Confirma la eliminación de un color
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (color) => {
    setConfirmState({ visible: true, row: color });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarColor(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Color "${confirmState.row.nombre}" eliminado correctamente`,
      });

      await cargarColores();
    } catch (error) {
      console.error("Error al eliminar color:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el color",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el nombre del color
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
            editarColor(rowData);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> el color{" "}
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
        value={colores}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} colores"
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        emptyMessage="No se encontraron colores"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Colores</h2>
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
              placeholder="Buscar colores..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarColor(e.data)}
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
          colorSeleccionado?.id
            ? "Editar Color"
            : "Nuevo Color"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <ColorForm
          color={colorSeleccionado}
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

export default Color;
