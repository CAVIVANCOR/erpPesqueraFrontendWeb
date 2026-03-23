// src/pages/EjecucionPresupuestal.jsx
// Pantalla CRUD profesional para EjecucionPresupuestal. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import EjecucionPresupuestalForm from "../components/ejecucionPresupuestal/EjecucionPresupuestalForm";
import {
  getAllEjecucionPresupuestal,
  crearEjecucionPresupuestal,
  actualizarEjecucionPresupuestal,
  eliminarEjecucionPresupuestal,
} from "../api/ejecucionPresupuestal";
import { getAllPresupuestoAnual } from "../api/presupuestoAnual";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
import { Navigate } from "react-router-dom";

/**
 * Pantalla profesional para gestión de Ejecución Presupuestal.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function EjecucionPresupuestal({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    cargarItems();
    cargarPresupuestos();
    cargarMonedas();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllEjecucionPresupuestal();
      setItems(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista.",
      });
    }
    setLoading(false);
  };

  const cargarPresupuestos = async () => {
    try {
      const data = await getAllPresupuestoAnual();
      setPresupuestos(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de presupuestos.",
      });
    }
  };

  const cargarMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de monedas.",
      });
    }
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    setToDelete(rowData);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirm(false);
    if (!toDelete) return;
    setLoading(true);
    try {
      await eliminarEjecucionPresupuestal(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar.",
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarEjecucionPresupuestal(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearEjecucionPresupuestal(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarItems();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar.",
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const actionBody = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        aria-label="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          aria-label="Eliminar"
        />
      )}
    </>
  );

  const presupuestoBody = (rowData) => {
    return rowData.presupuestoAnual ? `${rowData.presupuestoAnual.anio} - ${rowData.presupuestoAnual.centroCosto?.nombre || ''}` : '-';
  };

  const periodoBody = (rowData) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[rowData.mes - 1] || '-';
  };

  const montoBody = (rowData) => {
    const moneda = rowData.moneda?.simbolo || '';
    const monto = Number(rowData.montoEjecutado || 0).toFixed(2);
    return `${moneda} ${monto}`;
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        message="¿Está seguro que desea eliminar este registro?"
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        accept={handleDeleteConfirm}
        reject={() => setShowConfirm(false)}
      />
      <DataTable
        value={items}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Ejecución Presupuestal</h2>
            </div>
            <div style={{ flex: 2 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading || !permisos.puedeCrear}
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" sortable style={{ width: 80 }} />
        <Column field="presupuestoAnual" header="Presupuesto" body={presupuestoBody} sortable />
        <Column field="mes" header="Mes" body={periodoBody} sortable style={{ width: 100 }} />
        <Column field="montoEjecutado" header="Monto Ejecutado" body={montoBody} sortable style={{ width: 150 }} />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => (rowData.activo ? "Sí" : "No")}
          sortable
          style={{ width: 100 }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Ejecución Presupuestal" : "Nueva Ejecución Presupuestal"}
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <EjecucionPresupuestalForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
          presupuestos={presupuestos}
          monedas={monedas}
        />
      </Dialog>
    </div>
  );
}