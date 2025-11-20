// src/pages/FamiliaProducto.jsx
// Pantalla CRUD profesional para FamiliaProducto. Cumple la regla transversal ERP Megui.
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
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
import { usePermissions } from "../hooks/usePermissions";
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
const FamiliaProducto = ({ ruta }) => {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Estados del componente
  const [familiasProducto, setFamiliasProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
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
    if (!permisos.puedeCrear) return;
    setFamiliaSeleccionada(null);
    setModoEdicion(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar familia de producto (clic en fila)
   */
  const editarFamiliaProducto = (familia) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) return;
    setFamiliaSeleccionada(familia);
    setModoEdicion(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setModoEdicion(false);
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
   * Solo permitido si tiene permisos de eliminación
   */
  const confirmarEliminacion = (familia) => {
    if (!permisos.puedeEliminar) return;
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
   * Template para acciones
   * Incluye botón de editar y eliminar (deshabilitados según permisos)
   * Estilo idéntico a Empresas.jsx: botones siempre visibles, deshabilitados según permisos
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={(e) => {
            e.stopPropagation();
            if (permisos.puedeVer || permisos.puedeEditar) {
              editarFamiliaProducto(rowData);
            }
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeEliminar}
          onClick={(e) => {
            e.stopPropagation();
            if (permisos.puedeEliminar) {
              confirmarEliminacion(rowData);
            }
          }}
        />
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la familia de
            producto{" "}
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
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} familias de producto"
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        emptyMessage="No se encontraron familias de producto"
        header={
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Familias de Producto</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                outlined
                raised
                disabled={!permisos.puedeCrear}
                onClick={abrirDialogoNuevo}
              />
            </div>
            <div style={{ flex: 2 }}>
              <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar familias de producto..."
                style={{ width: "100%" }}
              />
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => editarFamiliaProducto(e.data)
            : undefined
        }
        scrollable
        scrollHeight="600px"
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
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
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Familia de Producto"
              : "Ver Familia de Producto"
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
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default FamiliaProducto;
