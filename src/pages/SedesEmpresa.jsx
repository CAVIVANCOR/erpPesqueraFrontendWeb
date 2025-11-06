// src/pages/SedesEmpresa.jsx
// Pantalla profesional de gestión de sedes de empresa para el ERP Megui.
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
import {
  getSedes,
  crearSede,
  actualizarSede,
  eliminarSede,
} from "../api/sedes";
import { getEmpresas } from "../api/empresa";
import SedeForm from "../components/sedes/SedeForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de sedes de empresa.
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
export default function SedesEmpresa({ ruta }) {
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
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sedeEdit, setSedeEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Carga inicial de sedes y empresas
  useEffect(() => {
    cargarSedes();
    cargarEmpresas();
  }, []);

  async function cargarSedes() {
    setLoading(true);
    try {
      const data = await getSedes();
      setSedes(Array.isArray(data) ? data : data.sedes || []);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las sedes");
    } finally {
      setLoading(false);
    }
  }

  async function cargarEmpresas() {
    try {
      const data = await getEmpresas();
      setEmpresas(Array.isArray(data) ? data : data.empresas || []);
    } catch (err) {
      setEmpresas([]);
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
        empresaId:
          typeof data.empresaId === "string"
            ? Number(data.empresaId)
            : data.empresaId,
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        cesado: !!data.cesado,
      };
      if (modoEdicion && sedeEdit) {
        await actualizarSede(sedeEdit.id, payload);
        mostrarToast(
          "success",
          "Sede actualizada",
          `La sede fue actualizada correctamente.`
        );
      } else {
        await crearSede(payload);
        mostrarToast(
          "success",
          "Sede creada",
          `La sede fue registrada correctamente.`
        );
      }
      setMostrarDialogo(false);
      cargarSedes();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo guardar la sede.");
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditar(sede) {
    setSedeEdit(sede);
    setModoEdicion(true);
    setMostrarDialogo(true);
  }

  // Edición con un solo clic en la fila
  const onRowClick = (e) => {
    handleEditar(e.data);
  };

  function handleEliminar(sede) {
    setConfirmState({ visible: true, row: sede });
  }

  const handleConfirmDelete = async () => {
    const sede = confirmState.row;
    if (!sede) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarSede(sede.id);
      mostrarToast(
        "success",
        "Sede eliminada",
        `La sede fue eliminada correctamente.`
      );
      cargarSedes();
    } catch (err) {
      mostrarToast("error", "Error", "No se pudo eliminar la sede.");
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 0" }}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> la sede{" "}
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
        value={sedes}
        loading={loading}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} sedes"
        size="small"
        showGridlines
        stripedRows
        globalFilter={globalFilter}
        emptyMessage="No hay sedes registradas."
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
              <h2>Sedes de Empresa</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nueva Sede"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                raised
                disabled={!permisos.puedeCrear}
                onClick={() => {
                  setSedeEdit(null);
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
                  placeholder="Buscar sedes..."
                  style={{ width: 240 }}
                />
              </span>
            </div>
          </div>
        }
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
        }
        style={{
          fontSize: getResponsiveFontSize(),
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
        }}
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable/>
        <Column field="nombre" header="Nombre" sortable/>
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          body={(rowData) => rowData.empresa?.razonSocial}
          sortable
        />
        <Column field="direccion" header="Dirección" sortable/>
        <Column field="telefono" header="Teléfono" sortable/>
        <Column field="email" header="Email" sortable/>
        <Column
          field="cesado"
          header="¿Cesada?"
          body={(rowData) => (rowData.cesado ? "Sí" : "No")}
          sortable
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: 150, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={
          modoEdicion
            ? permisos.puedeEditar
              ? "Editar Sede"
              : "Ver Sede"
            : "Nueva Sede"
        }
        visible={mostrarDialogo}
        style={{ width: 600 }}
        modal
        onHide={() => setMostrarDialogo(false)}
      >
        <SedeForm
          isEdit={modoEdicion}
          defaultValues={sedeEdit || {}}
          onSubmit={onSubmitForm}
          onCancel={() => setMostrarDialogo(false)}
          loading={formLoading}
          empresas={empresas}
          readOnly={modoEdicion && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
}
