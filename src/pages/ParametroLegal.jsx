// src/pages/ParametroLegal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import ParametroLegalForm from "../components/parametroLegal/ParametroLegalForm";
import {
  getParametrosLegales,
  getParametroLegalById,
  createParametroLegal,
  updateParametroLegal,
  activarParametroLegal,
  deleteParametroLegal,
} from "../api/recursosHumanos/parametroLegal";
import { getRegimenesLaboralesActivos } from "../api/recursosHumanos/regimenLaboral";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { mensajeDeError } from "../utils/mensajeError";

// Valor especial del filtro de régimen para los parámetros generales (sin régimen)
const FILTRO_GENERAL = "general";

const OPCIONES_ESTADO = [
  { label: "Borradores", value: "false" },
  { label: "Activos", value: "true" },
];

export default function ParametroLegal({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [parametros, setParametros] = useState([]);
  const [regimenes, setRegimenes] = useState([]);
  const [regimenFiltro, setRegimenFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [parametroSeleccionado, setParametroSeleccionado] = useState(null);
  const [parametroDialog, setParametroDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [activarDialog, setActivarDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    cargarRegimenes();
  }, []);

  // Recarga al cambiar los filtros del servidor
  useEffect(() => {
    loadData();
  }, [regimenFiltro, estadoFiltro]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: mensajeDeError(error, accionFallida),
      life: 5000,
    });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarRegimenes = async () => {
    try {
      setRegimenes((await getRegimenesLaboralesActivos()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los regímenes laborales");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (regimenFiltro) filtros.regimenLaboralId = regimenFiltro;
      if (estadoFiltro) filtros.activo = estadoFiltro;
      setParametros((await getParametrosLegales(filtros)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar los parámetros legales");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setFormData({});
    setParametroSeleccionado(null);
    setIsEdit(false);
    setParametroDialog(true);
  };

  const hideDialog = () => {
    setParametroDialog(false);
    setFormData({});
    setParametroSeleccionado(null);
  };

  const editParametro = async (parametro) => {
    try {
      setLoading(true);
      setFormData(await getParametroLegalById(parametro.id));
      setParametroSeleccionado(parametro);
      setIsEdit(true);
      setParametroDialog(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar el parámetro legal");
    } finally {
      setLoading(false);
    }
  };

  const saveParametro = async (data) => {
    const esEdicion = isEdit && parametroSeleccionado;
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");

    try {
      setLoading(true);
      if (esEdicion) {
        await updateParametroLegal(parametroSeleccionado.id, { ...data, actualizadoPor: personalId });
      } else {
        await createParametroLegal({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Parámetro legal actualizado correctamente" : "Parámetro legal registrado como borrador",
        life: 3000,
      });
      hideDialog();
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo guardar el parámetro legal");
    } finally {
      setLoading(false);
    }
  };

  const confirmActivar = (parametro) => {
    if (!permisos.puedeEditar) return denegar("activar parámetros");
    setParametroSeleccionado(parametro);
    setActivarDialog(true);
  };

  const activarConfirmado = async () => {
    try {
      setLoading(true);
      const { advertencias } = await activarParametroLegal(parametroSeleccionado.id, { actualizadoPor: personalId });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Parámetro legal activado correctamente", life: 3000 });
      // La validación del contador es informativa: se avisa pero no se bloquea
      (advertencias || []).forEach((mensaje) =>
        toast.current?.show({ severity: "warn", summary: "Aviso", detail: mensaje, life: 6000 }),
      );
      setActivarDialog(false);
      setParametroSeleccionado(null);
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo activar el parámetro legal");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (parametro) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    setParametroSeleccionado(parametro);
    setDeleteDialog(true);
  };

  const deleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteParametroLegal(parametroSeleccionado.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Parámetro legal eliminado correctamente", life: 3000 });
      setDeleteDialog(false);
      setParametroSeleccionado(null);
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo eliminar el parámetro legal");
    } finally {
      setLoading(false);
    }
  };

  const cerrarDialogosConfirmacion = () => {
    setDeleteDialog(false);
    setActivarDialog(false);
    setParametroSeleccionado(null);
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const regimenBodyTemplate = (rowData) =>
    rowData.regimenLaboral ? (
      `${rowData.regimenLaboral.codigoSunat} - ${rowData.regimenLaboral.descripcion}`
    ) : (
      <Tag value="GENERAL" severity="info" />
    );

  const valorBodyTemplate = (rowData) => Number(rowData.valor).toLocaleString("es-PE", { maximumFractionDigits: 6 });

  const vigenciaBodyTemplate = (rowData) =>
    rowData.vigenteHasta ? formatearFecha(rowData.vigenteHasta) : <Tag value="SIN FIN" severity="secondary" />;

  const validadoBodyTemplate = (rowData) => (
    <Tag
      value={rowData.validadoPorContador ? "VALIDADO" : "SIN VALIDAR"}
      severity={rowData.validadoPorContador ? "success" : "warning"}
    />
  );

  const estadoBodyTemplate = (rowData) => (
    <Tag value={rowData.activo ? "ACTIVO" : "BORRADOR"} severity={rowData.activo ? "success" : "secondary"} />
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      {!rowData.activo && (
        <Button
          icon="pi pi-check-circle"
          rounded
          outlined
          severity="success"
          onClick={() => confirmActivar(rowData)}
          disabled={!permisos.puedeEditar}
          tooltip="Activar"
          tooltipOptions={{ position: "top" }}
        />
      )}
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-button-warning"
        onClick={() => editParametro(rowData)}
        disabled={!permisos.puedeEditar}
        tooltip={rowData.activo ? "Marcar validación del contador" : "Editar"}
        tooltipOptions={{ position: "top" }}
      />
      {!rowData.activo && (
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar borrador"
          tooltipOptions={{ position: "top" }}
        />
      )}
    </div>
  );

  const opcionesRegimen = [
    { label: "General (sin régimen)", value: FILTRO_GENERAL },
    ...regimenes.map((regimen) => ({
      label: `${regimen.codigoSunat} - ${regimen.descripcion}`,
      value: String(regimen.id),
    })),
  ];

  const leftToolbarTemplate = () => (
    <div className="flex flex-wrap gap-2 align-items-center">
      <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} disabled={!permisos.puedeCrear} />
      <Dropdown
        value={regimenFiltro}
        options={opcionesRegimen}
        onChange={(e) => setRegimenFiltro(e.value)}
        placeholder="Todos los regímenes"
        showClear
        style={{ width: "260px" }}
      />
      <Dropdown
        value={estadoFiltro}
        options={OPCIONES_ESTADO}
        onChange={(e) => setEstadoFiltro(e.value)}
        placeholder="Todos los estados"
        showClear
        style={{ width: "180px" }}
      />
    </div>
  );

  const rightToolbarTemplate = () => (
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText
        type="search"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar..."
        style={{ width: "300px" }}
      />
    </span>
  );

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" outlined onClick={cerrarDialogosConfirmacion} />
      <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteConfirmed} />
    </>
  );

  const activarDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" outlined onClick={cerrarDialogosConfirmacion} />
      <Button label="Sí, activar" icon="pi pi-check" severity="success" onClick={activarConfirmado} />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <h2 style={{ fontSize: getResponsiveFontSize() }}>Parámetros Legales y Reglas por Régimen</h2>

      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <DataTable
        value={parametros}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron parámetros legales"
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        size="small"
        stripedRows
        showGridlines
      >
        <Column field="clave" header="Clave" sortable filter filterPlaceholder="Buscar por clave" style={{ width: "200px" }} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column header="Régimen" body={regimenBodyTemplate} style={{ width: "200px" }} />
        <Column header="Valor" body={valorBodyTemplate} style={{ width: "120px", textAlign: "right" }} />
        <Column field="vigenteDesde" header="Desde" body={(rowData) => formatearFecha(rowData.vigenteDesde)} sortable style={{ width: "110px" }} />
        <Column header="Hasta" body={vigenciaBodyTemplate} style={{ width: "110px" }} />
        <Column header="Contador" body={validadoBodyTemplate} style={{ width: "120px" }} />
        <Column field="activo" header="Estado" body={estadoBodyTemplate} sortable style={{ width: "110px" }} />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: "150px" }} header="Acciones" />
      </DataTable>

      <Dialog
        visible={parametroDialog}
        style={{ width: "650px" }}
        header={isEdit ? "Editar Parámetro Legal" : "Nuevo Parámetro Legal"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <ParametroLegalForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveParametro}
          onCancel={hideDialog}
          loading={loading}
          soloValidacion={Boolean(isEdit && parametroSeleccionado?.activo)}
        />
      </Dialog>

      <Dialog
        visible={activarDialog}
        style={{ width: "500px" }}
        header="Activar parámetro"
        modal
        footer={activarDialogFooter}
        onHide={cerrarDialogosConfirmacion}
      >
        <div className="confirmation-content">
          <i className="pi pi-question-circle mr-3" style={{ fontSize: "2rem" }} />
          {parametroSeleccionado && (
            <span>
              ¿Activar <b>{parametroSeleccionado.clave}</b> con valor <b>{valorBodyTemplate(parametroSeleccionado)}</b> desde{" "}
              <b>{formatearFecha(parametroSeleccionado.vigenteDesde)}</b>? El parámetro activo anterior de la misma clave se
              cerrará el día previo.
            </span>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={cerrarDialogosConfirmacion}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {parametroSeleccionado && (
            <span>
              ¿Está seguro de eliminar el borrador del parámetro <b>{parametroSeleccionado.clave}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
