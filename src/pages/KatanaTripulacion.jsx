/**
 * Pantalla profesional de gestión de Katanas Tripulación para el ERP Megui.
 * Sigue el patrón establecido en Empresas.jsx
 * CRUD completo con integración API REST y JWT.
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import {
  getKatanasTripulacion,
  eliminarKatanaTripulacion,
} from "../api/katanaTripulacion";
import KatanaTripulacionForm from "../components/katanaTripulacion/KatanaTripulacionForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * REGLA TRANSVERSAL ERP MEGUI:
 * - Edición profesional con un solo clic en la fila.
 * - Botón de eliminar solo visible para superusuario o admin.
 * - Confirmación de borrado con modal visual (ConfirmDialog) en color rojo.
 */
export default function KatanaTripulacion({ ruta }) {
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

  const [katanas, setKatanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [katanaEdit, setKatanaEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    cargarKatanas();
  }, []);

  async function cargarKatanas() {
    setLoading(true);
    try {
      const data = await getKatanasTripulacion();
      setKatanas(Array.isArray(data) ? data : data.katanasTripulacion || []);
    } catch (err) {
      mostrarToast("error", "Error", "No se pudieron cargar las katanas tripulación");
    } finally {
      setLoading(false);
    }
  }

  function mostrarToast(severity, summary, detail) {
    toast.current?.show({ severity, summary, detail, life: 3500 });
  }

  async function onSubmitForm() {
    setMostrarDialogo(false);
    cargarKatanas();
    mostrarToast(
      "success",
      modoEdicion ? "Katana actualizada" : "Katana creada",
      `La katana tripulación fue ${modoEdicion ? "actualizada" : "creada"} correctamente.`
    );
  }

  function abrirDialogoNuevo() {
    if (!permisos.puedeCrear) {
      mostrarToast("warn", "Sin permisos", "No tiene permisos para crear");
      return;
    }
    setModoEdicion(false);
    setKatanaEdit(null);
    setMostrarDialogo(true);
  }

  function abrirDialogoEdicion(katana) {
    if (!permisos.puedeEditar) {
      mostrarToast("warn", "Sin permisos", "No tiene permisos para editar");
      return;
    }
    setModoEdicion(true);
    setKatanaEdit(katana);
    setMostrarDialogo(true);
  }

  function cerrarDialogo() {
    setMostrarDialogo(false);
    setKatanaEdit(null);
  }

  function confirmarEliminacion(katana) {
    if (!permisos.puedeEliminar && !usuario?.esSuperUsuario && !usuario?.esAdmin) {
      mostrarToast("warn", "Sin permisos", "No tiene permisos para eliminar");
      return;
    }
    setConfirmState({ visible: true, row: katana });
  }

  async function eliminarConfirmado() {
    try {
      await eliminarKatanaTripulacion(confirmState.row.id);
      mostrarToast("success", "Eliminada", "Katana tripulación eliminada correctamente");
      cargarKatanas();
    } catch (err) {
      mostrarToast("error", "Error", err.response?.data?.message || "No se pudo eliminar la katana tripulación");
    } finally {
      setConfirmState({ visible: false, row: null });
    }
  }

  // Templates para columnas
  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "N/A";
  };

  const rangoTemplate = (rowData) => {
    const inicial = Number(rowData.rangoInicialTn || 0).toFixed(3);
    const final = Number(rowData.rangoFinaTn || 0).toFixed(3);
    return `${inicial} - ${final} Tn`;
  };

  const kgTemplate = (rowData) => {
    return Number(rowData.kgOtorgadoCalculo || 0).toFixed(3);
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  // Header de la tabla
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <h2 style={{ margin: 0 }}>Gestión de Katanas Tripulación</h2>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button
          label="Nueva Katana"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
          disabled={!permisos.puedeCrear}
          size="small"
          raised
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ width: "300px" }}
          />
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      <DataTable
        value={katanas}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        className="p-datatable-hover cursor-pointer"
        emptyMessage="No se encontraron katanas tripulación"
        globalFilter={globalFilter}
        header={header}
        scrollable
        scrollHeight="600px"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column header="Empresa" body={empresaTemplate} sortable />
        <Column header="Rango (Tn)" body={rangoTemplate} sortable style={{ width: "180px" }} />
        <Column header="Kg Otorgado" body={kgTemplate} sortable style={{ width: "140px" }} />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>

      {/* Dialog para crear/editar */}
      <Dialog
        visible={mostrarDialogo}
        style={{ width: "600px" }}
        header={modoEdicion ? "Editar Katana Tripulación" : "Nueva Katana Tripulación"}
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <KatanaTripulacionForm
          katanaTripulacion={katanaEdit}
          onGuardar={onSubmitForm}
          onCancelar={cerrarDialogo}
          readOnly={!permisos.puedeEditar && !permisos.puedeCrear}
        />
      </Dialog>

      {/* ConfirmDialog para eliminación */}
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={`¿Está seguro de eliminar la katana tripulación "${confirmState.row?.nombre}"?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={eliminarConfirmado}
        reject={() => setConfirmState({ visible: false, row: null })}
        acceptLabel="Sí, eliminar"
        rejectLabel="Cancelar"
      />
    </div>
  );
}
