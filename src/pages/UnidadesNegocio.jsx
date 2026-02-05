// src/pages/UnidadesNegocio.jsx
// Pantalla profesional de gestión de Unidades de Negocio para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getUnidadesNegocio,
  crearUnidadNegocio,
  actualizarUnidadNegocio,
  eliminarUnidadNegocio,
} from "../api/unidadNegocio";
import UnidadNegocioForm from "../components/unidadNegocio/UnidadNegocioForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de Unidades de Negocio.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */
export default function UnidadesNegocio({ ruta }) {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const toast = useRef(null);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [unidadEdit, setUnidadEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarUnidades();
  }, []);

  async function cargarUnidades() {
    setLoading(true);
    try {
      const data = await getUnidadesNegocio();
      setUnidades(Array.isArray(data) ? data : []);
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudieron cargar las unidades de negocio"
      );
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  async function onSubmitForm(data) {
    if (modoEdicion && !permisos.puedeEditar) return;
    if (!modoEdicion && !permisos.puedeCrear) return;

    setFormLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        icono: data.icono || null,
        color: data.color || null,
        orden: Number(data.orden) || 0,
        activo: !!data.activo,
      };
      if (modoEdicion && unidadEdit) {
        await actualizarUnidadNegocio(unidadEdit.id, payload);
        mostrarToast(
          "success",
          "Unidad actualizada",
          `La unidad de negocio fue actualizada correctamente.`
        );
      } else {
        await crearUnidadNegocio(payload);
        mostrarToast(
          "success",
          "Unidad creada",
          `La unidad de negocio fue registrada correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarUnidades();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo guardar la unidad de negocio."
      );
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(unidad) {
    setUnidadEdit(unidad);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(unidad) {
    setConfirmState({ visible: true, row: unidad });
  }

  const handleConfirmDelete = async () => {
    const unidad = confirmState.row;
    if (!unidad) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarUnidadNegocio(unidad.id);
      mostrarToast(
        "success",
        "Unidad eliminada",
        `La unidad de negocio fue eliminada correctamente.`
      );
      cargarUnidades();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo eliminar la unidad de negocio."
      );
    } finally {
      setLoading(false);
    }
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
        severity={rowData.activo ? "success" : "danger"}
        style={{ fontSize: "10px", padding: "2px 8px" }}
      />
    );
  };

  const colorTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            backgroundColor: rowData.color || "#3B82F6",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <span>{rowData.color || "-"}</span>
      </div>
    );
  };

  const iconoTemplate = (rowData) => {
    return rowData.icono ? (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <i className={rowData.icono} style={{ fontSize: "1.2rem" }} />
        <span>{rowData.icono}</span>
      </div>
    ) : (
      "-"
    );
  };

  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            handleEditar(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            handleEliminar(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div className="p-m-4">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la unidad de negocio{" "}
            <b>{confirmState.row ? confirmState.row.nombre : ""}</b>?<br />
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
        value={unidades}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} unidades"
        globalFilter={globalFilter}
        emptyMessage="No hay unidades de negocio registradas."
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
              <h2>Unidades de Negocio</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                raised
                tooltip="Nueva Unidad de Negocio"
                disabled={!permisos.puedeCrear}
                onClick={() => {
                  setUnidadEdit(null);
                  setModoEdicion(false);
                  setMostrarDialogo(true);
                }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar unidades..."
                style={{ width: 240 }}
              />
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="icono" header="Icono" body={iconoTemplate} sortable />
        <Column field="color" header="Color" body={colorTemplate} sortable />
        <Column field="orden" header="Orden" style={{ width: 100 }} sortable />
        <Column
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          header="Acciones"
          align="center"
          body={accionesTemplate}
          style={{ minWidth: 150, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Unidad de Negocio"
              : "Ver Unidad de Negocio"
            : "Nueva Unidad de Negocio"
        }
        visible={mostrarDialogo}
        style={{ width: 600 }}
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <UnidadNegocioForm
          isEdit={modoEdicion}
          defaultValues={unidadEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}