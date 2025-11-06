// src/pages/CargosPersonal.jsx
// Pantalla profesional de gestión de cargos del personal para el ERP Megui.
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
  getCargosPersonal,
  crearCargoPersonal,
  actualizarCargoPersonal,
  eliminarCargoPersonal,
} from "../api/cargosPersonal";
import CargosPersonalForm from "../components/cargosPersonal/CargosPersonalForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de cargos del personal.
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
export default function CargosPersonal({ ruta }) {
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
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargoEdit, setCargoEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarCargos();
  }, []);

  async function cargarCargos() {
    setLoading(true);
    try {
      const data = await getCargosPersonal();
      setCargos(Array.isArray(data) ? data : data.cargos || []);
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudieron cargar los cargos del personal"
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
        descripcion: data.descripcion,
        cesado: !!data.cesado,
      };
      if (modoEdicion && cargoEdit) {
        await actualizarCargoPersonal(cargoEdit.id, payload);
        mostrarToast(
          "success",
          "Cargo actualizado",
          `El cargo fue actualizado correctamente.`
        );
      } else {
        await crearCargoPersonal(payload);
        mostrarToast(
          "success",
          "Cargo creado",
          `El cargo fue registrado correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarCargos();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo guardar el cargo."
      );
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(cargo) {
    setCargoEdit(cargo);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(cargo) {
    setConfirmState({ visible: true, row: cargo });
  }

  const handleConfirmDelete = async () => {
    const cargo = confirmState.row;
    if (!cargo) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarCargoPersonal(cargo.id);
      mostrarToast(
        "success",
        "Cargo eliminado",
        `El cargo fue eliminado correctamente.`
      );
      cargarCargos();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        err?.response?.data?.error || "No se pudo eliminar el cargo."
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
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el cargo{" "}
            <b>{confirmState.row ? confirmState.row.descripcion : ""}</b>?<br />
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
        value={cargos}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} personal"
        globalFilter={globalFilter}
        emptyMessage="No hay cargos registrados."
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
              <h2>Cargos del Personal</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                raised
                tooltip="Nuevo Cargo del Personal"
                disabled={!permisos.puedeCrear}
                onClick={() => {
                  setCargoEdit(null);
                  setModoEdicion(false);
                  setMostrarDialogo(true);
                }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar cargos..."
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
        <Column field="descripcion" header="Descripción" style={{ width: 540 }} sortable />
        <Column
          header="Estado"
          body={cesadoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          header="Acciones"
          align="center"
          body={accionesTemplate}
          style={{ minWidth: 150, textAlign: "center" }}
          sortable
        />
      </DataTable>
      <Dialog
        header={
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Cargo"
              : "Ver Cargo"
            : "Nuevo Cargo"
        }
        visible={mostrarDialogo}
        style={{ width: 500 }}
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <CargosPersonalForm
          isEdit={modoEdicion}
          defaultValues={cargoEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
