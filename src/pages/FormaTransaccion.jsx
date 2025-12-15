// src/pages/FormaTransaccion.jsx
// Pantalla profesional de gestión de formas de transacción para el ERP Megui.
// Utiliza PrimeReact para tabla, diálogos y UX. Integración con API REST y JWT.
// Documentado en español técnico.

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import {
  getAllFormaTransaccion,
  deleteFormaTransaccion,
} from "../api/formaTransaccion";
import FormaTransaccionForm from "../components/formaTransaccion/FormaTransaccionForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de formas de transacción.
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
export default function FormaTransaccion({ ruta }) {
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
  const [formas, setFormas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formaEdit, setFormaEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarFormas();
  }, []);

  async function cargarFormas() {
    setLoading(true);
    try {
      const data = await getAllFormaTransaccion();
      setFormas(Array.isArray(data) ? data : []);
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudieron cargar las formas de transacción"
      );
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  function handleEditar(forma) {
    setFormaEdit(forma);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(forma) {
    setConfirmState({ visible: true, row: forma });
  }

  const handleConfirmDelete = async () => {
    const forma = confirmState.row;
    if (!forma) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deleteFormaTransaccion(forma.id);
      mostrarToast(
        "success",
        "Forma eliminada",
        "La forma de transacción fue eliminada correctamente."
      );
      cargarFormas();
    } catch (err) {
      mostrarToast(
        "error",
        "Error",
        "No se pudo eliminar la forma de transacción."
      );
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
            <span style={{ color: "#b71c1c" }}>eliminar</span> la forma de
            transacción <b>{confirmState.row ? confirmState.row.nombre : ""}</b>
            ?<br />
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
        value={formas}
        loading={loading}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} formas de transacción"
        size="small"
        showGridlines
        stripedRows
        globalFilter={globalFilter}
        emptyMessage="No hay formas de transacción registradas."
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
              <h2>Formas de Transacción</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nueva Forma"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                raised
                disabled={!permisos.puedeCrear}
                onClick={() => {
                  setFormaEdit(null);
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
        <Column field="id" header="ID" sortable />
        <Column
          field="nombre"
          header="Nombre"
          sortable
          style={{ fontWeight: "bold" }}
        />
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
          modoEdicion
            ? "Editar Forma de Transacción"
            : "Nueva Forma de Transacción"
        }
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <FormaTransaccionForm
          forma={formaEdit}
          onSave={() => {
            setMostrarDialogo(false);
            cargarFormas();
          }}
          onCancel={() => setMostrarDialogo(false)}
          readOnly={formaEdit && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
