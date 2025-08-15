// src/pages/FamiliaProducto.jsx
// Pantalla CRUD profesional para FamiliaProducto. Cumple la regla transversal ERP Megui.
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import {
  getFamiliasProducto,
  eliminarFamiliaProducto,
} from "../api/familiaProducto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import FamiliaProductoForm from "../components/familiaProducto/FamiliaProductoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla CRUD profesional para FamiliaProducto
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 * Modelo Prisma: id, nombre (VarChar 80), subfamilias[], productos[]
 * Patrón aplicado: Botón eliminar visible solo para superusuario/admin, confirmación visual profesional, búsqueda global por cualquier campo.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

/**
 * Componente FamiliaProducto
 * Pantalla principal para gestión de familias de producto
 * Patrón aplicado: Edición por clic en fila, eliminación profesional con confirmación, búsqueda global.
 */
const FamiliaProducto = () => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados del componente
  const [familiasProducto, setFamiliasProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  /**
   * Carga las familias de producto desde la API
   */
  const cargarFamiliasProducto = async () => {
    try {
      setLoading(true);
      const data = await getFamiliasProducto();

      // Normalizar IDs según regla ERP Megui
      const familiasNormalizadas = data.map((familia) => ({
        ...familia,
        id: Number(familia.id),
      }));

      setFamiliasProducto(familiasNormalizadas);
    } catch (error) {
      console.error("Error al cargar familias de producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las familias de producto",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Efecto para cargar datos al montar el componente
   */
  useEffect(() => {
    cargarFamiliasProducto();
  }, []);

  /**
   * Abre el diálogo para crear nueva familia de producto
   */
  const abrirDialogoNuevo = () => {
    setFamiliaSeleccionada(null);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar familia de producto (clic en fila)
   */
  const editarFamiliaProducto = (familia) => {
    setFamiliaSeleccionada(familia);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setFamiliaSeleccionada(null);
  };

  /**
   * Maneja el guardado exitoso
   */
  const onGuardar = async () => {
    cerrarDialogo();
    await cargarFamiliasProducto();
  };

  /**
   * Confirma la eliminación de una familia de producto
   * Solo visible para superusuario o admin (regla transversal ERP Megui)
   */
  const confirmarEliminacion = (familia) => {
    setConfirmState({ visible: true, row: familia });
  };

  /**
   * Maneja la confirmación de eliminación
   */
  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;

    try {
      setLoading(true);
      await eliminarFamiliaProducto(confirmState.row.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Familia de producto "${confirmState.row.nombre}" eliminada correctamente`,
      });

      await cargarFamiliasProducto();
    } catch (error) {
      console.error("Error al eliminar familia de producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la familia de producto",
      });
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  };

  /**
   * Template para el nombre de la familia de producto
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
            editarFamiliaProducto(rowData);
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la familia de producto{" "}
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
        value={familiasProducto}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} familias de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        emptyMessage="No se encontraron familias de producto"
        header={
          <div className="flex align-items-center gap-2">
            <h2>Gestión de Familias de Producto</h2>
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
              placeholder="Buscar familias de producto..."
              style={{ width: 240 }}
            />
          </div>
        }
        onRowClick={(e) => editarFamiliaProducto(e.data)}
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
          familiaSeleccionada?.id
            ? "Editar Familia de Producto"
            : "Nueva Familia de Producto"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <FamiliaProductoForm
          familiaProducto={familiaSeleccionada}
          onSave={onGuardar}
          onCancel={cerrarDialogo}
          toast={toast}
        />
      </Dialog>
    </div>
  );
};

export default FamiliaProducto;
