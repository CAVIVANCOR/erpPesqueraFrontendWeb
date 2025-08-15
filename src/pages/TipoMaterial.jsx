/**
 * Pantalla CRUD profesional para TipoMaterial
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, codigo (VarChar 10), nombre (VarChar 80), productos[]
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
  getTiposMaterial,
  eliminarTipoMaterial,
} from "../api/tipoMaterial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import TipoMaterialForm from "../components/tipoMaterial/TipoMaterialForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente TipoMaterial
 * Pantalla principal para gestión de tipos de material
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const TipoMaterial = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados del componente
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [tipoMaterialSeleccionado, setTipoMaterialSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga los tipos de material desde la API
   */
  const cargarTiposMaterial = async () => {
    try {
      setLoading(true);
      const data = await getTiposMaterial();

      // Normalizar IDs según regla ERP Megui
      const tiposNormalizados = data.map((tipo) => ({
        ...tipo,
        id: Number(tipo.id),
      }));

      setTiposMaterial(tiposNormalizados);
    } catch (error) {
      console.error("Error al cargar tipos de material:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los tipos de material",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarTiposMaterial();
  }, []);

  /**
   * Abre el diálogo para crear nuevo tipo de material
   */
  const abrirDialogoNuevo = () => {
    setTipoMaterialSeleccionado(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar tipo de material (clic en fila)
   */
  const editarTipoMaterial = (tipoMaterial) => {
    setTipoMaterialSeleccionado(tipoMaterial);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setTipoMaterialSeleccionado(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarTiposMaterial();
  };

  /**
   * Confirma la eliminación de un tipo de material
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (tipoMaterial) => {
    setConfirmState({ visible: true, row: tipoMaterial });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarTipoMaterial(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Tipo de material "${confirmState.row.nombre}" eliminado correctamente`,
      });

      await cargarTiposMaterial();
    } catch (error) {
      console.error("Error al eliminar tipo de material:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el tipo de material",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el código del tipo de material
   */
  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#1976d2" }}>
        {rowData.codigo}
      </span>
    );
  };

  /**
   * Template para el nombre del tipo de material
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
            editarTipoMaterial(rowData);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> el tipo de material{" "}
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
        value={tiposMaterial}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de material"
        globalFilter={globalFilter}
        globalFilterFields={["codigo", "nombre"]}
        emptyMessage="No se encontraron tipos de material"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Tipos de Material</h2>
            <Button
              type="button"
              label="Nuevo"
              icon="pi pi-plus"
              className="p-button-success"
              size="small"
              outlined
              raised
              onClick={abrirDialogoNuevo}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar tipos de material..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarTipoMaterial(e.data)}
        className="datatable-responsive"
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "60px" }} />
        <Column
          field="codigo"
          header="Código"
          body={codigoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
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
        style={{ width: "600px" }}
        header={
          tipoMaterialSeleccionado?.id
            ? "Editar Tipo de Material"
            : "Nuevo Tipo de Material"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <TipoMaterialForm
          tipoMaterial={tipoMaterialSeleccionado}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default TipoMaterial;
