// src/pages/EntidadPension.jsx
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import EntidadPensionForm from "../components/entidadPension/EntidadPensionForm";
import TarifaEntidadPensionForm from "../components/entidadPension/TarifaEntidadPensionForm";
import {
  getEntidadesPension,
  getEntidadPensionById,
  createEntidadPension,
  updateEntidadPension,
  deleteEntidadPension,
  getTarifasEntidadPension,
  createTarifaEntidadPension,
  updateTarifaEntidadPension,
  deleteTarifaEntidadPension,
} from "../api/recursosHumanos/entidadPension";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { mensajeDeError } from "../utils/mensajeError";

const formatearPorcentaje = (valor) =>
  valor === null || valor === undefined ? "-" : `${Number(valor).toFixed(2)} %`;

export default function EntidadPension({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [entidades, setEntidades] = useState([]);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [entidadDialog, setEntidadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [formData, setFormData] = useState({});

  // Tarifas con vigencia de la entidad seleccionada
  const [tarifasDialog, setTarifasDialog] = useState(false);
  const [tarifas, setTarifas] = useState([]);
  const [tarifaFormDialog, setTarifaFormDialog] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState(null);
  const [tarifaFormData, setTarifaFormData] = useState({});
  const [isEditTarifa, setIsEditTarifa] = useState(false);
  const [deleteTarifaDialog, setDeleteTarifaDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

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

  const loadData = async () => {
    try {
      setLoading(true);
      setEntidades((await getEntidadesPension()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las entidades de pensión");
    } finally {
      setLoading(false);
    }
  };

  // ── Entidades ──────────────────────────────────────────────

  const openNew = () => {
    setFormData({});
    setEntidadSeleccionada(null);
    setIsEdit(false);
    setEntidadDialog(true);
  };

  const hideDialog = () => {
    setEntidadDialog(false);
    setFormData({});
    setEntidadSeleccionada(null);
  };

  const editEntidad = async (entidad) => {
    try {
      setLoading(true);
      setFormData(await getEntidadPensionById(entidad.id));
      setEntidadSeleccionada(entidad);
      setIsEdit(true);
      setEntidadDialog(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar la entidad de pensión");
    } finally {
      setLoading(false);
    }
  };

  const saveEntidad = async (data) => {
    const esEdicion = isEdit && entidadSeleccionada;
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");

    try {
      setLoading(true);
      const dataConAuditoria = {
        ...data,
        creadoPor: esEdicion ? undefined : personalId,
        actualizadoPor: esEdicion ? personalId : undefined,
      };
      if (esEdicion) {
        await updateEntidadPension(entidadSeleccionada.id, dataConAuditoria);
      } else {
        await createEntidadPension(dataConAuditoria);
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Entidad de pensión actualizada correctamente" : "Entidad de pensión creada correctamente",
        life: 3000,
      });
      hideDialog();
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo guardar la entidad de pensión");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (entidad) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    setEntidadSeleccionada(entidad);
    setDeleteDialog(true);
  };

  const deleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteEntidadPension(entidadSeleccionada.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Entidad de pensión eliminada correctamente", life: 3000 });
      setDeleteDialog(false);
      setEntidadSeleccionada(null);
      loadData();
    } catch (error) {
      mostrarError(error, "No se pudo eliminar la entidad de pensión");
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
    setEntidadSeleccionada(null);
  };

  // ── Tarifas ────────────────────────────────────────────────

  const cargarTarifas = async (entidadId) => {
    try {
      setLoading(true);
      setTarifas((await getTarifasEntidadPension(entidadId)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las tarifas de la entidad");
    } finally {
      setLoading(false);
    }
  };

  const abrirTarifas = async (entidad) => {
    setEntidadSeleccionada(entidad);
    setTarifasDialog(true);
    await cargarTarifas(entidad.id);
  };

  const cerrarTarifas = () => {
    setTarifasDialog(false);
    setTarifas([]);
    setEntidadSeleccionada(null);
    loadData();
  };

  const nuevaTarifa = () => {
    setTarifaFormData({});
    setTarifaSeleccionada(null);
    setIsEditTarifa(false);
    setTarifaFormDialog(true);
  };

  const editarTarifa = (tarifa) => {
    setTarifaFormData(tarifa);
    setTarifaSeleccionada(tarifa);
    setIsEditTarifa(true);
    setTarifaFormDialog(true);
  };

  const hideTarifaForm = () => {
    setTarifaFormDialog(false);
    setTarifaFormData({});
    setTarifaSeleccionada(null);
  };

  const saveTarifa = async (data) => {
    if (isEditTarifa && !permisos.puedeEditar) return denegar("editar");
    if (!isEditTarifa && !permisos.puedeCrear) return denegar("crear");

    try {
      setLoading(true);
      if (isEditTarifa) {
        await updateTarifaEntidadPension(tarifaSeleccionada.id, { ...data, actualizadoPor: personalId });
      } else {
        await createTarifaEntidadPension({ ...data, entidadPensionId: Number(entidadSeleccionada.id), creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: isEditTarifa ? "Tarifa actualizada correctamente" : "Tarifa registrada correctamente",
        life: 3000,
      });
      hideTarifaForm();
      cargarTarifas(entidadSeleccionada.id);
    } catch (error) {
      mostrarError(error, "No se pudo guardar la tarifa");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTarifa = (tarifa) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    setTarifaSeleccionada(tarifa);
    setDeleteTarifaDialog(true);
  };

  const deleteTarifaConfirmed = async () => {
    try {
      setLoading(true);
      await deleteTarifaEntidadPension(tarifaSeleccionada.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Tarifa eliminada correctamente", life: 3000 });
      setDeleteTarifaDialog(false);
      setTarifaSeleccionada(null);
      cargarTarifas(entidadSeleccionada.id);
    } catch (error) {
      mostrarError(error, "No se pudo eliminar la tarifa");
    } finally {
      setLoading(false);
    }
  };

  // ── Plantillas de celdas ───────────────────────────────────

  const sistemaBodyTemplate = (rowData) => (
    <Tag value={rowData.esOnp ? "ONP" : "AFP"} severity={rowData.esOnp ? "warning" : "info"} />
  );

  const activoBodyTemplate = (rowData) => (
    <Tag value={rowData.activo ? "ACTIVO" : "INACTIVO"} severity={rowData.activo ? "success" : "danger"} />
  );

  const ultimaTarifaBodyTemplate = (rowData) => {
    const tarifa = rowData.tarifas?.[0];
    if (!tarifa) return <Tag value="SIN TARIFA" severity="danger" />;
    return `${formatearPorcentaje(tarifa.porcentajeAporte)} aporte desde ${formatearFecha(tarifa.vigenteDesde)}`;
  };

  const cuentaBodyTemplate = (cuenta) => (cuenta ? `${cuenta.codigoCuenta} - ${cuenta.nombreCuenta}` : "-");

  const vigenciaBodyTemplate = (rowData) =>
    rowData.vigenteHasta ? (
      formatearFecha(rowData.vigenteHasta)
    ) : (
      <Tag value="VIGENTE" severity="success" />
    );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-percentage"
        rounded
        outlined
        severity="info"
        onClick={() => abrirTarifas(rowData)}
        tooltip="Tarifas con vigencia"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-button-warning"
        onClick={() => editEntidad(rowData)}
        disabled={!permisos.puedeEditar}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => confirmDelete(rowData)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const tarifaActionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-button-warning"
        onClick={() => editarTarifa(rowData)}
        disabled={!permisos.puedeEditar}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => confirmDeleteTarifa(rowData)}
        disabled={!permisos.puedeEliminar}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const leftToolbarTemplate = () => (
    <div className="flex flex-wrap gap-2">
      <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} disabled={!permisos.puedeCrear} />
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
      <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteConfirmed} />
    </>
  );

  const deleteTarifaFooter = (
    <>
      <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteTarifaDialog(false)} />
      <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteTarifaConfirmed} />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <h2 style={{ fontSize: getResponsiveFontSize() }}>Entidades de Pensión (AFP / ONP)</h2>

      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <DataTable
        value={entidades}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron entidades de pensión"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        size="small"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ width: "70px" }} />
        <Column field="descripcion" header="Descripción" sortable filter filterPlaceholder="Buscar por descripción" />
        <Column field="esOnp" header="Sistema" body={sistemaBodyTemplate} sortable style={{ width: "100px" }} />
        <Column header="Última tarifa" body={ultimaTarifaBodyTemplate} />
        <Column header="Cuenta Empleados" body={(rowData) => cuentaBodyTemplate(rowData.cuentaPasivoEmpleado)} />
        <Column header="Cuenta Obreros" body={(rowData) => cuentaBodyTemplate(rowData.cuentaPasivoObrero)} />
        <Column field="activo" header="Estado" body={activoBodyTemplate} sortable style={{ width: "110px" }} />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: "170px" }} header="Acciones" />
      </DataTable>

      <Dialog
        visible={entidadDialog}
        style={{ width: "650px" }}
        header={isEdit ? "Editar Entidad de Pensión" : "Nueva Entidad de Pensión"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <EntidadPensionForm
          isEdit={isEdit}
          defaultValues={formData}
          onSubmit={saveEntidad}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {entidadSeleccionada && (
            <span>
              ¿Está seguro de eliminar la entidad de pensión <b>{entidadSeleccionada.descripcion}</b>?
            </span>
          )}
        </div>
      </Dialog>

      {/* Tarifas con vigencia de la entidad */}
      <Dialog
        visible={tarifasDialog}
        style={{ width: "1000px" }}
        header={`Tarifas con vigencia - ${entidadSeleccionada?.descripcion || ""}`}
        modal
        onHide={cerrarTarifas}
      >
        <Toolbar
          className="mb-3"
          left={() => (
            <Button label="Nueva tarifa" icon="pi pi-plus" severity="success" onClick={nuevaTarifa} disabled={!permisos.puedeCrear} />
          )}
        />
        <DataTable
          value={tarifas}
          loading={loading}
          emptyMessage="Esta entidad aún no tiene tarifas registradas"
          size="small"
          stripedRows
          showGridlines
        >
          <Column field="vigenteDesde" header="Desde" body={(rowData) => formatearFecha(rowData.vigenteDesde)} sortable />
          <Column header="Hasta" body={vigenciaBodyTemplate} />
          <Column header="Aporte" body={(rowData) => formatearPorcentaje(rowData.porcentajeAporte)} />
          <Column header="Seguro" body={(rowData) => formatearPorcentaje(rowData.porcentajeSeguro)} />
          <Column header="Comisión flujo" body={(rowData) => formatearPorcentaje(rowData.porcentajeComisionFlujo)} />
          <Column header="Comisión mixta" body={(rowData) => formatearPorcentaje(rowData.porcentajeComisionMixta)} />
          <Column
            header="Rem. máx. asegurable"
            body={(rowData) =>
              rowData.remuneracionMaximaAsegurable === null || rowData.remuneracionMaximaAsegurable === undefined
                ? "-"
                : `S/ ${Number(rowData.remuneracionMaximaAsegurable).toFixed(2)}`
            }
          />
          <Column body={tarifaActionBodyTemplate} exportable={false} style={{ width: "120px" }} header="Acciones" />
        </DataTable>
      </Dialog>

      <Dialog
        visible={tarifaFormDialog}
        style={{ width: "550px" }}
        header={isEditTarifa ? "Editar Tarifa" : "Nueva Tarifa"}
        modal
        className="p-fluid"
        onHide={hideTarifaForm}
      >
        <TarifaEntidadPensionForm
          isEdit={isEditTarifa}
          defaultValues={tarifaFormData}
          onSubmit={saveTarifa}
          onCancel={hideTarifaForm}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deleteTarifaDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteTarifaFooter}
        onHide={() => setDeleteTarifaDialog(false)}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {tarifaSeleccionada && (
            <span>
              ¿Está seguro de eliminar la tarifa vigente desde <b>{formatearFecha(tarifaSeleccionada.vigenteDesde)}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
