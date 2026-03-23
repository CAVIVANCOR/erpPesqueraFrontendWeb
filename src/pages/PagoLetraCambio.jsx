// src/pages/PagoLetraCambio.jsx
// Pantalla CRUD profesional para PagoLetraCambio. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import PagoLetraCambioForm from "../components/pagoLetraCambio/PagoLetraCambioForm";
import {
  getAllPagoLetraCambio,
  crearPagoLetraCambio,
  actualizarPagoLetraCambio,
  eliminarPagoLetraCambio,
} from "../api/pagoLetraCambio";
import { getAllLetraCambio } from "../api/letraCambio";
import { getMonedas } from "../api/moneda";
import { getMediosPago } from "../api/medioPago";
import { getBancos } from "../api/banco";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { Navigate } from "react-router-dom";

/**
 * Pantalla profesional para gestión de Pagos de Letra de Cambio.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function PagoLetraCambio({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const readOnly = !permisos.puedeEditar && !permisos.puedeCrear;
  const [items, setItems] = useState([]);
  const [letras, setLetras] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    cargarItems();
    cargarLetras();
    cargarMonedas();
    cargarMediosPago();
    cargarBancos();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllPagoLetraCambio();
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

  const cargarLetras = async () => {
    try {
      const data = await getAllLetraCambio();
      setLetras(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de letras.",
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

  const cargarMediosPago = async () => {
    try {
      const data = await getMediosPago();
      setMediosPago(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de medios de pago.",
      });
    }
  };

  const cargarBancos = async () => {
    try {
      const data = await getBancos();
      setBancos(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de bancos.",
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
      await eliminarPagoLetraCambio(toDelete.id);
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
        await actualizarPagoLetraCambio(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearPagoLetraCambio(data);
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

  const letraBody = (rowData) => {
    return rowData.letraCambio ? rowData.letraCambio.numeroDocumento : '-';
  };

  const fechaPagoBody = (rowData) => {
    return formatearFecha(rowData.fechaPago, '-');
  };

  const montoBody = (rowData) => {
    const moneda = rowData.moneda?.simbolo || '';
    const monto = Number(rowData.montoPagado || 0).toFixed(2);
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
              <h2>Gestión de Pagos de Letra de Cambio</h2>
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
        <Column field="letraCambio.numeroDocumento" header="Letra" body={letraBody} sortable style={{ width: 150 }} />
        <Column field="fechaPago" header="Fecha Pago" body={fechaPagoBody} sortable style={{ width: 130 }} />
        <Column field="montoPagado" header="Monto" body={montoBody} sortable style={{ width: 130 }} />
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
        header={editing ? "Editar Pago de Letra de Cambio" : "Nuevo Pago de Letra de Cambio"}
        visible={showDialog}
        style={{ width: 700 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <PagoLetraCambioForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          readOnly={readOnly}
          letras={letras}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
        />
      </Dialog>
    </div>
  );
}