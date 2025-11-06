// src/pages/TipoContrato.jsx
// Pantalla profesional de gestión de tipos de contrato para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getTiposContrato,
  crearTipoContrato,
  actualizarTipoContrato,
  eliminarTipoContrato,
} from "../api/tipoContrato";
import TipoContratoForm from "../components/tipoContrato/TipoContratoForm";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

/**
 * Página de gestión de tipos de contrato.
 * - CRUD completo con integración API REST.
 * - Tabla con filtros, búsqueda y paginación avanzada.
 * - Formularios desacoplados con validación profesional.
 * - Feedback visual con Toast y loaders.
 * Documentado en español técnico.
 */
/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin).
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 * - El usuario autenticado se obtiene siempre desde useAuthStore.
 */
export default function TipoContrato({ ruta }) {
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
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoEdit, setTipoEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarTipos();
  }, []);

  async function cargarTipos() {
    setLoading(true);
    try {
      const data = await getTiposContrato();
      setTipos(Array.isArray(data) ? data : data.tipos || []);
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudieron cargar los tipos de contrato"
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
      // Filtrado profesional del payload: solo los campos válidos para el modelo Prisma
      const payload = {
        codigo: data.codigo,
        nombre: data.nombre,
        cesado: !!data.cesado,
      };
      if (modoEdicion && tipoEdit) {
        await actualizarTipoContrato(tipoEdit.id, payload);
        mostrarToast(
          "success",
          "Tipo de Contrato actualizado",
          `El tipo de contrato fue actualizado correctamente.`
        );
      } else {
        await crearTipoContrato(payload);
        mostrarToast(
          "success",
          "Tipo de Contrato creado",
          `El tipo de contrato fue registrado correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarTipos();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo guardar el tipo de contrato."
      );
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(tipo) {
    setTipoEdit(tipo);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(tipo) {
    setConfirmState({ visible: true, row: tipo });
  }

  const handleConfirmDelete = async () => {
    const tipo = confirmState.row;
    if (!tipo) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarTipoContrato(tipo.id);
      mostrarToast(
        "success",
        "Tipo de Contrato eliminado",
        `El tipo de contrato fue eliminado correctamente.`
      );
      cargarTipos();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo eliminar el tipo de contrato."
      );
    } finally {
      setLoading(false);
    }
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      ></div>
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el tipo de
            contrato <b>{confirmState.row ? confirmState.row.nombre : ""}</b>?
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
        value={tipos}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de contrato"
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        onRowClick={permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined}
        globalFilter={globalFilter}
        emptyMessage="No hay tipos de contrato registrados."
        header={
          <div className="flex align-items-center gap-2">
            <h2>Tipos de Contrato</h2>
            <Button
              label="Nuevo"
              size="small"
              raised
              outlined
              tooltip="Nuevo Tipo de Contrato"
              className="p-button-success"
              icon="pi pi-plus"
              disabled={!permisos.puedeCrear}
              onClick={() => {
                setTipoEdit(null);
                setModoEdicion(false);
                setMostrarDialogo(true);
              }}
            />
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar tipos de contrato..."
              style={{ width: 240 }}
            />
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column field="codigo" header="Código" style={{width:100}} />
        <Column field="nombre" header="Nombre" style={{width:500}} />
        <Column
          header="Estado"
          align="center"
          body={cesadoTemplate}
          sortable
          style={{ width: "200px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          align="center"
          body={accionesTemplate}
          style={{ minWidth: 100, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          modoEdicion ? "Editar Tipo de Contrato" : "Nuevo Tipo de Contrato"
        }
        visible={mostrarDialogo}
        style={{ width: 500 }}
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <TipoContratoForm
          isEdit={modoEdicion}
          defaultValues={tipoEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
