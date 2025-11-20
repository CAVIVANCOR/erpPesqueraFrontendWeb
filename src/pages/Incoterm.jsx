// src/pages/Incoterm.jsx
// Pantalla profesional de gestión de Incoterms para el ERP Megui.
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
import { InputText } from "primereact/inputtext";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import {
  getIncoterms,
  crearIncoterm,
  actualizarIncoterm,
  eliminarIncoterm,
} from "../api/incoterm";
import IncotermForm from "../components/incoterm/IncotermForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de Incoterms.
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
export default function Incoterm({ ruta }) {
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
  // Referencia para Toast de notificaciones
  const toast = useRef(null);

  // Estado para la lista de incoterms
  const [incoterms, setIncoterms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [incotermEdit, setIncotermEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de incoterms
  useEffect(() => {
    cargarIncoterms();
  }, []);

  // Función para cargar incoterms del backend
  async function cargarIncoterms() {
    setLoading(true);
    try {
      const data = await getIncoterms();
      setIncoterms(Array.isArray(data) ? data : []);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar los incoterms");
    } finally {
      setLoading(false);
    }
  }

  // Muestra notificación Toast
  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  // Maneja el submit del formulario (alta o edición)
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
      // Filtrado profesional del payload: solo los campos válidos para el modelo Prisma
      const payload = {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        activo: !!data.activo,
      };
      if (modoEdicion && incotermEdit) {
        await actualizarIncoterm(incotermEdit.id, payload);
        mostrarToast(
          "success",
          "Incoterm actualizado",
          `El incoterm fue actualizado correctamente.`
        );
      } else {
        await crearIncoterm(payload);
        mostrarToast(
          "success",
          "Incoterm creado",
          `El incoterm fue registrado correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarIncoterms();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar el incoterm.");
    } finally {
      setFormLoading(false);
    }
  }

  // Maneja la edición
  function handleEditar(incoterm) {
    setIncotermEdit(incoterm);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Maneja el alta
  function handleNuevo() {
    setIncotermEdit(null);
    setModoEdicion(false);
    setMostrarDialogo(true);
  }

  // Maneja la eliminación
  function handleEliminar(incoterm) {
    setConfirmState({ visible: true, row: incoterm });
  }

  async function confirmarEliminar() {
    if (!confirmState.row) return;
    setLoading(true);
    try {
      await eliminarIncoterm(confirmState.row.id);
      mostrarToast(
        "success",
        "Incoterm eliminado",
        "El incoterm fue eliminado correctamente."
      );
      cargarIncoterms();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar el incoterm.");
    } finally {
      setLoading(false);
      setConfirmState({ visible: false, row: null });
    }
  }

  // Renderiza las acciones de cada fila
  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEditar(rowData);
        }}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEliminar(rowData);
          }}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message="¿Está seguro que desea eliminar este incoterm?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={confirmarEliminar}
        reject={() => setConfirmState({ visible: false, row: null })}
      />
      <DataTable
        value={incoterms}
        loading={loading}
        dataKey="id"
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => handleEditar(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} incoterms"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron incoterms."
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
              <h2>Gestión de Incoterms</h2>
            </div>
            <div style={{ flex: 2 }}>
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar..."
                />
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo Incoterm"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleNuevo}
                disabled={loading || !permisos.puedeCrear}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="codigo"
          header="Código"
          style={{ width: 120 }}
          sortable
        />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => (rowData.activo ? "Sí" : "No")}
          style={{ width: 100 }}
          sortable
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={modoEdicion ? "Editar Incoterm" : "Nuevo Incoterm"}
        visible={mostrarDialogo}
        style={{ width: "1300px" }}
        onHide={() => setMostrarDialogo(false)}
        modal
      >
        <IncotermForm
          isEdit={modoEdicion}
          defaultValues={incotermEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
        />
      </Dialog>
    </div>
  );
}
