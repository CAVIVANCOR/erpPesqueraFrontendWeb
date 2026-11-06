// src/pages/EntidadPension.jsx
// Entidades de pensión (AFP / ONP) y sus tarifas con vigencia.
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
import EntidadPensionForm from "../components/entidadPension/EntidadPensionForm";
import {
  getEntidadesPension,
  getEntidadPensionById,
  createEntidadPension,
  updateEntidadPension,
  deleteEntidadPension,
} from "../api/recursosHumanos/entidadPension";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const OPCIONES_SISTEMA = [
  { label: "AFP", value: false },
  { label: "ONP", value: true },
];

const OPCIONES_ESTADO = [
  { label: "Activas", value: true },
  { label: "Inactivas", value: false },
];

const formatearPorcentaje = (valor) => (valor === null || valor === undefined ? "-" : `${Number(valor).toFixed(2)} %`);

const cuentaTexto = (cuenta) => (cuenta ? `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}` : "-");

const EntidadPension = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [sistemaFiltro, setSistemaFiltro] = useState(null);
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
      setEntidades((await getEntidadesPension()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las entidades de pensión");
    } finally {
      setLoading(false);
    }
  };

  const entidadesFiltradas = entidades.filter((entidad) => {
    if (sistemaFiltro !== null && entidad.esOnp !== sistemaFiltro) return false;
    if (estadoFiltro !== null && entidad.activo !== estadoFiltro) return false;
    const texto = globalFilter.trim().toLowerCase();
    return !texto || (entidad.descripcion || "").toLowerCase().includes(texto);
  });

  // ── Entidades ──────────────────────────────────────────────

  const handleNew = () => {
    setEntidadSeleccionada(null);
    setVisible(true);
  };

  const handleEdit = async (entidad) => {
    try {
      setLoading(true);
      setEntidadSeleccionada(await getEntidadPensionById(entidad.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar la entidad de pensión");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setEntidadSeleccionada(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(entidadSeleccionada);
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateEntidadPension(entidadSeleccionada.id, { ...data, actualizadoPor: personalId });
      } else {
        await createEntidadPension({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Entidad de pensión actualizada correctamente" : "Entidad de pensión creada correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar la entidad de pensión");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (entidad) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmDialog({
      message: `¿Está seguro de eliminar la entidad de pensión ${entidad.descripcion}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deleteEntidadPension(entidad.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Entidad de pensión eliminada correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar la entidad de pensión");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const ultimaTarifaBodyTemplate = (entidad) => {
    const tarifa = entidad.tarifas?.[0];
    if (!tarifa) return <Tag value="SIN TARIFA" severity="danger" />;
    return `${formatearPorcentaje(tarifa.porcentajeAporte)} aporte desde ${formatearFecha(tarifa.vigenteDesde)}`;
  };

  const accionesBodyTemplate = (entidad) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(entidad)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => handleDelete(entidad)}
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
        <h3 style={{ margin: 0 }}>Entidades de Pensión (AFP / ONP)</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {entidadesFiltradas.length}</small>
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Sistema</label>
        <Dropdown value={sistemaFiltro} options={OPCIONES_SISTEMA} onChange={(e) => setSistemaFiltro(e.value)} placeholder="Todos" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 1.2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Estado</label>
        <Dropdown value={estadoFiltro} options={OPCIONES_ESTADO} onChange={(e) => setEstadoFiltro(e.value)} placeholder="Todos" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Descripción" style={{ width: "100%" }} />
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
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nueva entidad de pensión"}
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
        value={entidadesFiltradas}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron entidades de pensión"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: 70 }} />
        <Column field="descripcion" header="Descripción" sortable body={(entidad) => <strong>{entidad.descripcion}</strong>} />
        <Column
          header="Sistema"
          body={(entidad) => <Tag value={entidad.esOnp ? "ONP" : "AFP"} severity={entidad.esOnp ? "warning" : "info"} />}
          style={{ width: 100 }}
        />
        <Column header="Última tarifa" body={ultimaTarifaBodyTemplate} />
        <Column header="Cuenta Empleados" body={(entidad) => cuentaTexto(entidad.cuentaPasivoEmpleado)} />
        <Column header="Cuenta Obreros" body={(entidad) => cuentaTexto(entidad.cuentaPasivoObrero)} />
        <Column
          header="Estado"
          body={(entidad) => <Tag value={entidad.activo ? "ACTIVO" : "INACTIVO"} severity={entidad.activo ? "success" : "danger"} />}
          style={{ width: 110 }}
        />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 120 }} />
      </DataTable>

      <Dialog
        header={
          entidadSeleccionada
            ? permisos.puedeEditar
              ? "Editar Entidad de Pensión"
              : "Ver Entidad de Pensión"
            : "Nueva Entidad de Pensión"
        }
        visible={visible}
        style={{ width: "1000px" }}
        onHide={handleCancel}
        modal
        className="p-fluid"
        key={`entidad-${entidadSeleccionada?.id || "nueva"}`}
      >
        <EntidadPensionForm
          isEdit={Boolean(entidadSeleccionada)}
          defaultValues={entidadSeleccionada || {}}
          personalAuditoria={personalAuditoria}
          permisos={permisos}
          onSubmit={handleSave}
          onCancel={handleCancel}
          loading={guardando}
        />
      </Dialog>

    </div>
  );
};

export default EntidadPension;
