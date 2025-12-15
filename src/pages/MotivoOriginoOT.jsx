// src/pages/MotivoOriginoOT.jsx
// Pantalla profesional de gestión de motivos de origen de OT para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import {
  getMotivosOrigenOT,
  crearMotivoOrigenOT,
  actualizarMotivoOrigenOT,
  eliminarMotivoOrigenOT,
} from "../api/motivoOriginoOT";
import MotivoOriginoOTForm from "../components/motivoOriginoOT/MotivoOriginoOTForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de motivos de origen de OT.
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
export default function MotivoOriginoOT({ ruta }) {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [itemEdit, setItemEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarItems();
  }, []);

  async function cargarItems() {
    setLoading(true);
    try {
      const data = await getMotivosOrigenOT();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar los motivos de origen");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  async function onSubmitForm(data) {
    // Validar permisos antes de guardar
    if (modoEdicion && !permisos.puedeEditar) {
      return;
    }
    if (!modoEdicion && !permisos.puedeCrear) {
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: !!data.activo,
      };
      if (modoEdicion && itemEdit) {
        await actualizarMotivoOrigenOT(itemEdit.id, payload);
        mostrarToast(
          "success",
          "Motivo actualizado",
          "El motivo de origen fue actualizado correctamente."
        );
      } else {
        await crearMotivoOrigenOT(payload);
        mostrarToast(
          "success",
          "Motivo creado",
          "El motivo de origen fue registrado correctamente."
        );
      }
      setMostrarDialogo(false);
      cargarItems();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar el motivo de origen.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(item) {
    setItemEdit(item);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(item) {
    setConfirmState({ visible: true, row: item });
  }

  const handleConfirmDelete = async () => {
    const item = confirmState.row;
    if (!item) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarMotivoOrigenOT(item.id);
      mostrarToast(
        "success",
        "Motivo eliminado",
        "El motivo de origen fue eliminado correctamente."
      );
      cargarItems();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar el motivo de origen.");
    } finally {
      setLoading(false);
    }
  };

  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={(e) => {
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
        onClick={(e) => {
          if (permisos.puedeEliminar) {
            handleEliminar(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> el motivo de origen{" "}
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
        value={items}
        loading={loading}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} motivos de origen"
        size="small"
        showGridlines
        stripedRows
        globalFilter={globalFilter}
        emptyMessage="No hay motivos de origen registrados."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Motivos de Origen de OT</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo Motivo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                raised
                disabled={!permisos.puedeCrear}
                onClick={() => {
                  setItemEdit(null);
                  setModoEdicion(false);
                  setMostrarDialogo(true);
                }}
              />
            </div>
            <div style={{ flex: 3 }}>
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  onInput={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar nombre, descripción..."
                  style={{ width: 300 }}
                />
              </span>
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
        }
        globalFilterFields={["nombre", "descripcion"]}
      >
        <Column field="id" header="ID" sortable/>
        <Column field="nombre" header="Nombre" sortable style={{ fontWeight: "bold" }} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="activo"
          header="Activo"
          sortable
          body={(rowData) => (rowData.activo ? "Sí" : "No")}
          style={{ width: 100 }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        visible={mostrarDialogo}
        style={{ width: 600 }}
        header={
          modoEdicion ? "Editar Motivo de Origen" : "Nuevo Motivo de Origen"
        }
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <MotivoOriginoOTForm
          isEdit={modoEdicion}
          defaultValues={itemEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
