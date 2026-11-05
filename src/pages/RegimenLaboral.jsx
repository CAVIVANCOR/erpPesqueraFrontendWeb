// src/pages/RegimenLaboral.jsx
// Catálogo de regímenes laborales (General, Microempresa, Pequeña empresa).
// Layout: patrón de LineaCredito.jsx (header con filtros dentro del DataTable, ConfirmDialog, Dialog del formulario).
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import RegimenLaboralForm from "../components/regimenLaboral/RegimenLaboralForm";
import {
  getRegimenesLaborales,
  getRegimenLaboralById,
  createRegimenLaboral,
  updateRegimenLaboral,
  deleteRegimenLaboral,
} from "../api/recursosHumanos/regimenLaboral";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const OPCIONES_ESTADO = [
  { label: "Activos", value: true },
  { label: "Inactivos", value: false },
];

const RegimenLaboral = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [regimenes, setRegimenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [regimenSeleccionado, setRegimenSeleccionado] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  // Personal para mostrar quién creó o modificó cada registro (AuditoriaDialog)
  const [personalAuditoria, setPersonalAuditoria] = useState([]);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    cargarDatos();
    getPersonal()
      .then((data) => setPersonalAuditoria(data || []))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal para la auditoría"));
  }, []);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setRegimenes((await getRegimenesLaborales()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los regímenes laborales");
    } finally {
      setLoading(false);
    }
  };

  const regimenesFiltrados = regimenes.filter((regimen) => {
    if (estadoFiltro !== null && regimen.activo !== estadoFiltro) return false;
    const texto = globalFilter.trim().toLowerCase();
    return !texto || [regimen.codigoSunat, regimen.descripcion].filter(Boolean).join(" ").toLowerCase().includes(texto);
  });

  const handleNew = () => {
    setRegimenSeleccionado(null);
    setVisible(true);
  };

  const handleEdit = async (regimen) => {
    try {
      setLoading(true);
      setRegimenSeleccionado(await getRegimenLaboralById(regimen.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el régimen laboral");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setRegimenSeleccionado(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(regimenSeleccionado);
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateRegimenLaboral(regimenSeleccionado.id, { ...data, actualizadoPor: personalId });
      } else {
        await createRegimenLaboral({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Régimen laboral actualizado correctamente" : "Régimen laboral creado correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el régimen laboral");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (regimen) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmDialog({
      message: `¿Está seguro de eliminar el régimen laboral ${regimen.descripcion}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deleteRegimenLaboral(regimen.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Régimen laboral eliminado correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar el régimen laboral");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const accionesBodyTemplate = (regimen) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(regimen)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => handleDelete(regimen)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const header = (
    <div
      style={{
        alignItems: "end",
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
        marginBottom: 15,
      }}
    >
      <div style={{ flex: 2 }}>
        <h3 style={{ margin: 0 }}>Regímenes Laborales</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {regimenesFiltrados.length}</small>
      </div>
      <div style={{ flex: 1.2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Estado</label>
        <Dropdown value={estadoFiltro} options={OPCIONES_ESTADO} onChange={(e) => setEstadoFiltro(e.value)} placeholder="Todos" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Código o descripción" style={{ width: "100%" }} />
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          severity="success"
          raised
          onClick={handleNew}
          disabled={!permisos.puedeCrear || loading}
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nuevo régimen laboral"}
          style={{ width: "100%" }}
          size="small"
        />
      </div>
      <div style={{ flex: 0.6 }}>
        <Button icon="pi pi-refresh" className="p-button-outlined p-button-info" onClick={cargarDatos} loading={loading} tooltip="Actualizar" tooltipOptions={{ position: "top" }} style={{ width: "100%" }} size="small" />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={regimenesFiltrados}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron regímenes laborales"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column field="codigoSunat" header="Código SUNAT" sortable style={{ width: 140 }} body={(regimen) => <strong>{regimen.codigoSunat}</strong>} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          header="Requiere REMYPE"
          body={(regimen) => <Tag value={regimen.requiereRemype ? "SÍ" : "NO"} severity={regimen.requiereRemype ? "warning" : "secondary"} />}
          style={{ width: 160 }}
        />
        <Column
          header="Estado"
          body={(regimen) => <Tag value={regimen.activo ? "ACTIVO" : "INACTIVO"} severity={regimen.activo ? "success" : "danger"} />}
          style={{ width: 110 }}
        />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 120 }} />
      </DataTable>

      <Dialog
        header={
          regimenSeleccionado
            ? permisos.puedeEditar
              ? "Editar Régimen Laboral"
              : "Ver Régimen Laboral"
            : "Nuevo Régimen Laboral"
        }
        visible={visible}
        style={{ width: "600px" }}
        onHide={handleCancel}
        modal
        className="p-fluid"
        key={`regimen-${regimenSeleccionado?.id || "nuevo"}`}
      >
        <RegimenLaboralForm
          isEdit={Boolean(regimenSeleccionado)}
          defaultValues={regimenSeleccionado || {}}
          personalAuditoria={personalAuditoria}
          onSubmit={handleSave}
          onCancel={handleCancel}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default RegimenLaboral;
