// src/pages/ParametroLegal.jsx
// Parámetros legales (UIT, RMV, % EsSalud...) y reglas por régimen, con vigencia.
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
import ParametroLegalForm from "../components/parametroLegal/ParametroLegalForm";
import {
  getParametrosLegales,
  getParametroLegalById,
  createParametroLegal,
  updateParametroLegal,
  deleteParametroLegal,
} from "../api/recursosHumanos/parametroLegal";
import { getRegimenesLaboralesActivos } from "../api/recursosHumanos/regimenLaboral";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

// Valor especial del filtro de régimen para los parámetros generales (sin régimen)
const FILTRO_GENERAL = "general";

const ParametroLegal = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [parametros, setParametros] = useState([]);
  const [regimenes, setRegimenes] = useState([]);
  const [regimenFiltro, setRegimenFiltro] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [parametroSeleccionado, setParametroSeleccionado] = useState(null);
  // Personal para mostrar quién creó o modificó cada registro (AuditoriaDialog)
  const [personalAuditoria, setPersonalAuditoria] = useState([]);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    getRegimenesLaboralesActivos()
      .then((data) => setRegimenes(data || []))
      .catch((error) => mostrarError(error, "No se pudieron cargar los regímenes laborales"));
    getPersonal()
      .then((data) => setPersonalAuditoria(data || []))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal para la auditoría"));
  }, []);

  // Recarga al cambiar el filtro de régimen
  useEffect(() => {
    cargarDatos();
  }, [regimenFiltro]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (regimenFiltro) filtros.regimenLaboralId = regimenFiltro;
      setParametros((await getParametrosLegales(filtros)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los parámetros legales");
    } finally {
      setLoading(false);
    }
  };

  const parametrosFiltrados = parametros.filter((parametro) => {
    const texto = globalFilter.trim().toLowerCase();
    return !texto || [parametro.clave, parametro.descripcion].filter(Boolean).join(" ").toLowerCase().includes(texto);
  });

  const handleNew = () => {
    setParametroSeleccionado(null);
    setVisible(true);
  };

  const handleEdit = async (parametro) => {
    try {
      setLoading(true);
      setParametroSeleccionado(await getParametroLegalById(parametro.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el parámetro legal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setParametroSeleccionado(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(parametroSeleccionado);
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateParametroLegal(parametroSeleccionado.id, { ...data, actualizadoPor: personalId });
      } else {
        await createParametroLegal({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Parámetro legal actualizado correctamente" : "Parámetro legal registrado correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el parámetro legal");
    } finally {
      setGuardando(false);
    }
  };

  const valorTexto = (parametro) => Number(parametro.valor).toLocaleString("es-PE", { maximumFractionDigits: 6 });

  const handleDelete = (parametro) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmDialog({
      message: `¿Está seguro de eliminar el parámetro ${parametro.clave}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deleteParametroLegal(parametro.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Parámetro legal eliminado correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar el parámetro legal");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const regimenBodyTemplate = (parametro) =>
    parametro.regimenLaboral ? (
      `${parametro.regimenLaboral.codigoSunat} - ${parametro.regimenLaboral.descripcion}`
    ) : (
      <Tag value="GENERAL" severity="info" />
    );

  const accionesBodyTemplate = (parametro) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(parametro)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => handleDelete(parametro)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const opcionesRegimen = [
    { label: "General (sin régimen)", value: FILTRO_GENERAL },
    ...regimenes.map((regimen) => ({ label: `${regimen.codigoSunat} - ${regimen.descripcion}`, value: String(regimen.id) })),
  ];

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
        <h3 style={{ margin: 0 }}>Parámetros Legales y Reglas por Régimen</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {parametrosFiltrados.length}</small>
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Régimen</label>
        <Dropdown value={regimenFiltro} options={opcionesRegimen} onChange={(e) => setRegimenFiltro(e.value)} placeholder="Todos los regímenes" showClear style={{ width: "100%" }} />
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Clave o descripción" style={{ width: "100%" }} />
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
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nuevo parámetro legal"}
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
        value={parametrosFiltrados}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron parámetros legales"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="clave" header="Clave" sortable style={{ width: 230 }} body={(parametro) => <strong>{parametro.clave}</strong>} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Régimen" body={regimenBodyTemplate} style={{ width: 200 }} />
        <Column header="Valor" body={valorTexto} style={{ width: 120, textAlign: "right" }} />
        <Column field="vigenteDesde" header="Desde" body={(parametro) => formatearFecha(parametro.vigenteDesde)} sortable style={{ width: 110 }} />
        <Column
          header="Hasta"
          body={(parametro) => (parametro.vigenteHasta ? formatearFecha(parametro.vigenteHasta) : <Tag value="SIN FIN" severity="secondary" />)}
          style={{ width: 110 }}
        />
        <Column
          header="Contador"
          body={(parametro) => <Tag value={parametro.validadoPorContador ? "VALIDADO" : "SIN VALIDAR"} severity={parametro.validadoPorContador ? "success" : "warning"} />}
          style={{ width: 120 }}
        />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 120 }} />
      </DataTable>

      <Dialog
        header={
          parametroSeleccionado
            ? permisos.puedeEditar
              ? "Editar Parámetro Legal"
              : "Ver Parámetro Legal"
            : "Nuevo Parámetro Legal"
        }
        visible={visible}
        style={{ width: "650px" }}
        onHide={handleCancel}
        modal
        className="p-fluid"
        key={`parametro-${parametroSeleccionado?.id || "nuevo"}`}
      >
        <ParametroLegalForm
          isEdit={Boolean(parametroSeleccionado)}
          defaultValues={parametroSeleccionado || {}}
          personalAuditoria={personalAuditoria}
          onSubmit={handleSave}
          onCancel={handleCancel}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default ParametroLegal;
