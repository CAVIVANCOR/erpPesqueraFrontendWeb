// src/pages/AsientoContableInterfaz.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";
import AsientoContableInterfazForm from "../components/asientoContableInterfaz/AsientoContableInterfazForm";
import {
  getAllAsientoContableInterfaz,
  eliminarAsientoContableInterfaz,
  enviarAsientoContable,
  registrarErrorAsientoContable,
} from "../api/asientoContableInterfaz";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

export default function AsientoContableInterfaz({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para workflow
  const [showEnviarDialog, setShowEnviarDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [asientoWorkflow, setAsientoWorkflow] = useState(null);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setItemsFiltrados(items);
  }, [items]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getAllAsientoContableInterfaz();
      setItems(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }
    setSelected(rowData);
    setIsEdit(true);
    setShowDialog(true);
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarAsientoContableInterfaz(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Asiento eliminado",
        detail: `El asiento fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message || "No se pudo eliminar el asiento.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    // Validar permisos antes de guardar
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data; // El formulario ya maneja la llamada a la API
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Asiento actualizado" : "Asiento creado",
        detail: isEdit
          ? "El asiento fue actualizado correctamente."
          : "El asiento fue creado correctamente.",
        life: 3000,
      });
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el asiento.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers para workflow
  const handleEnviar = (asiento) => {
    setAsientoWorkflow(asiento);
    setShowEnviarDialog(true);
  };

  const handleRegistrarError = (asiento) => {
    setAsientoWorkflow(asiento);
    setMensajeError("");
    setShowErrorDialog(true);
  };

  const handleEnviarConfirm = async () => {
    if (!asientoWorkflow) return;
    setLoading(true);
    try {
      await enviarAsientoContable(asientoWorkflow.id, usuario.personalId);
      toast.current?.show({
        severity: "success",
        summary: "Enviado",
        detail: "Asiento contable enviado correctamente",
        life: 3000,
      });
      cargarDatos();
      setShowEnviarDialog(false);
      setAsientoWorkflow(null);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error || "No se pudo enviar el asiento",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarErrorConfirm = async () => {
    if (!asientoWorkflow || !mensajeError.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar el mensaje de error",
        life: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      await registrarErrorAsientoContable(asientoWorkflow.id, mensajeError);
      toast.current?.show({
        severity: "success",
        summary: "Error Registrado",
        detail: "Error registrado correctamente",
        life: 3000,
      });
      cargarDatos();
      setShowErrorDialog(false);
      setAsientoWorkflow(null);
      setMensajeError("");
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.error || "No se pudo registrar el error",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setGlobalFilter("");
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado || "PENDIENTE";
    let severity = "warning";
    let icon = "pi-clock";

    if (estado === "ENVIADO") {
      severity = "success";
      icon = "pi-check";
    } else if (estado === "ERROR") {
      severity = "danger";
      icon = "pi-times";
    }

    return <Tag severity={severity} value={estado} icon={`pi ${icon}`} />;
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaContable) return "-";
    return new Date(rowData.fechaContable).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    return Number(rowData[field] || 0).toFixed(2);
  };

  const enviadoPorBodyTemplate = (rowData) => {
    if (!rowData.personalEnviador) return "-";
    return `${rowData.personalEnviador.nombres} ${rowData.personalEnviador.apellidos}`;
  };

  const fechaEnvioBodyTemplate = (rowData) => {
    if (!rowData.fechaEnvio) return "-";
    return new Date(rowData.fechaEnvio).toLocaleString("es-PE");
  };

  const accionesWorkflowBodyTemplate = (rowData) => {
    const estado = rowData.estado || "PENDIENTE";

    return (
      <div onClick={(e) => e.stopPropagation()}>
        {estado === "PENDIENTE" && (
          <>
            <Button
              icon="pi pi-send"
              className="p-button-rounded p-button-success p-button-sm p-mr-1"
              onClick={() => handleEnviar(rowData)}
              tooltip="Enviar a Contabilidad"
            />
            <Button
              icon="pi pi-exclamation-triangle"
              className="p-button-rounded p-button-danger p-button-sm"
              onClick={() => handleRegistrarError(rowData)}
              tooltip="Registrar Error"
            />
          </>
        )}
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={() => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              onEdit(rowData);
            }
          }}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> este asiento?
            <br />
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
        value={itemsFiltrados}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asientos"
        sortField="id"
        sortOrder={-1}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={[
          "cuentaContable",
          "descripcion",
          "referenciaExtId",
        ]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Asientos Contables Interfaz</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  size="small"
                  raised
                  disabled={!permisos.puedeCrear}
                  tooltip="Nuevo Asiento"
                  outlined
                  onClick={onNew}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  size="small"
                  onClick={async () => {
                    await cargarDatos();
                    toast.current?.show({
                      severity: "success",
                      summary: "Actualizado",
                      detail:
                        "Datos actualizados correctamente desde el servidor",
                      life: 3000,
                    });
                  }}
                  loading={loading}
                  tooltip="Actualizar todos los datos desde el servidor"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  size="small"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    id="globalFilter"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "100%" }}
                  />
                </span>
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable />
        <Column
          field="movimientoCajaId"
          header="Movimiento Caja"
          sortable
          body={(rowData) => rowData.movimientoCajaId || "-"}
        />
        <Column
          field="fechaContable"
          header="Fecha Contable"
          body={fechaBodyTemplate}
          sortable
        />
        <Column field="cuentaContable" header="Cuenta Contable" sortable />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="debe"
          header="Debe"
          body={(rowData) => montoBodyTemplate(rowData, "debe")}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="haber"
          header="Haber"
          body={(rowData) => montoBodyTemplate(rowData, "haber")}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          field="monedaId"
          header="Moneda"
          sortable
          body={(rowData) => rowData.monedaId || "-"}
        />
        <Column
          field="empresaId"
          header="Empresa"
          sortable
          body={(rowData) => rowData.empresaId || "-"}
        />
        <Column
          field="referenciaExtId"
          header="Referencia Ext"
          sortable
          body={(rowData) => rowData.referenciaExtId || "-"}
        />
        <Column
          field="tipoReferenciaId"
          header="Tipo Referencia"
          sortable
          body={(rowData) => rowData.tipoReferenciaId || "-"}
        />
        <Column
          field="estado"
          header="Estado"
          body={estadoBodyTemplate}
          sortable
        />
        <Column
          field="fechaEnvio"
          header="Fecha Envío"
          body={fechaEnvioBodyTemplate}
          sortable
        />
        <Column header="Enviado Por" body={enviadoPorBodyTemplate} sortable />
        <Column header="Workflow" body={accionesWorkflowBodyTemplate} />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Asiento"
              : "Ver Asiento"
            : "Nuevo Asiento"
        }
        visible={showDialog}
        style={{ width: "700px" }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <AsientoContableInterfazForm
          isEdit={isEdit}
          defaultValues={selected || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
        />
      </Dialog>

      {/* Diálogo de Enviar */}
      <Dialog
        header="Enviar Asiento Contable"
        visible={showEnviarDialog}
        style={{ width: "450px" }}
        onHide={() => setShowEnviarDialog(false)}
        modal
      >
        <div style={{ padding: "1rem" }}>
          <p>¿Está seguro de enviar este asiento contable a contabilidad?</p>
          {asientoWorkflow && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <strong>ID:</strong> {asientoWorkflow.id}
              <br />
              <strong>Cuenta:</strong> {asientoWorkflow.cuentaContable}
              <br />
              <strong>Debe:</strong> {asientoWorkflow.debe}
              <br />
              <strong>Haber:</strong> {asientoWorkflow.haber}
            </div>
          )}
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowEnviarDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Enviar"
              icon="pi pi-send"
              onClick={handleEnviarConfirm}
              loading={loading}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      {/* Diálogo de Registrar Error */}
      <Dialog
        header="Registrar Error de Asiento Contable"
        visible={showErrorDialog}
        style={{ width: "500px" }}
        onHide={() => setShowErrorDialog(false)}
        modal
      >
        <div style={{ padding: "1rem" }}>
          <p>Registre el error encontrado en este asiento contable:</p>
          {asientoWorkflow && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <strong>ID:</strong> {asientoWorkflow.id}
              <br />
              <strong>Cuenta:</strong> {asientoWorkflow.cuentaContable}
              <br />
              <strong>Debe:</strong> {asientoWorkflow.debe}
              <br />
              <strong>Haber:</strong> {asientoWorkflow.haber}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="mensajeError">
              Mensaje de Error <span style={{ color: "red" }}>*</span>
            </label>
            <InputTextarea
              id="mensajeError"
              value={mensajeError}
              onChange={(e) => setMensajeError(e.target.value)}
              rows={4}
              placeholder="Describa el error encontrado..."
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowErrorDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Registrar Error"
              icon="pi pi-exclamation-triangle"
              onClick={handleRegistrarErrorConfirm}
              loading={loading}
              severity="danger"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}