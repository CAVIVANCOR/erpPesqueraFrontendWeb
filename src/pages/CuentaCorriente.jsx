// src/pages/CuentaCorriente.jsx
// Pantalla CRUD profesional para CuentaCorriente. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import CuentaCorrienteForm from "../components/cuentaCorriente/CuentaCorrienteForm";
import {
  getAllCuentaCorriente,
  crearCuentaCorriente,
  actualizarCuentaCorriente,
  eliminarCuentaCorriente,
} from "../api/cuentaCorriente";
import { getEmpresas } from "../api/empresa";
import { getBancos } from "../api/banco";
import { getAllTipoCuentaCorriente } from "../api/tipoCuentaCorriente";
import { getMonedas } from "../api/moneda";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Cuentas Corrientes.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function CuentaCorriente() {
  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [tiposCuentaCorriente, setTiposCuentaCorriente] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    cargarItems();
    cargarEmpresas();
    cargarBancos();
    cargarTiposCuentaCorriente();
    cargarMonedas();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    try {
      const data = await getAllCuentaCorriente();
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

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las empresas.",
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
        detail: "No se pudo cargar los bancos.",
      });
    }
  };

  const cargarTiposCuentaCorriente = async () => {
    try {
      const data = await getAllTipoCuentaCorriente();
      setTiposCuentaCorriente(data);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los tipos de cuenta corriente.",
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
        detail: "No se pudo cargar las monedas.",
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
      await eliminarCuentaCorriente(toDelete.id);
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
        await actualizarCuentaCorriente(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearCuentaCorriente(data);
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
            <div style={{ flex: 1 }}>
              <h2>Gestión de Cuentas Corrientes</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                outlined
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}></div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} />
        <Column
          field="empresaId"
          header="Empresa"
          body={(rowData) => {
            const empresa = empresas.find(
              (e) => Number(e.id) === Number(rowData.empresaId)
            );
            return empresa ? empresa.razonSocial : rowData.empresaId;
          }}
        />
        <Column
          field="bancoId"
          header="Banco"
          body={(rowData) => {
            const banco = bancos.find(
              (b) => Number(b.id) === Number(rowData.bancoId)
            );
            return banco ? banco.nombre : rowData.bancoId;
          }}
        />
        <Column field="descripcion" header="Descripción" />
        <Column
          field="monedaId"
          header="Moneda"
          body={(rowData) => {
            const moneda = monedas.find(
              (m) => Number(m.id) === Number(rowData.monedaId)
            );
            return moneda ? moneda.simbolo : rowData.monedaId;
          }}
        />
        <Column field="numeroCuenta" header="Número Cuenta" />
        <Column field="numeroCuentaCCI" header="Número CCI" />
        <Column
          field="tipoCuentaCorrienteId"
          header="Tipo Cuenta"
          body={(rowData) => {
            const tipo = tiposCuentaCorriente.find(
              (t) => Number(t.id) === Number(rowData.tipoCuentaCorrienteId)
            );
            return tipo ? tipo.nombre : rowData.tipoCuentaCorrienteId;
          }}
        />

        <Column
          field="activa"
          header="Activa"
          body={(rowData) => (rowData.activa ? "Sí" : "No")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>
      <Dialog
        header={editing ? "Editar Cuenta Corriente" : "Nueva Cuenta Corriente"}
        visible={showDialog}
        style={{ width: 1300 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <CuentaCorrienteForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          empresas={empresas}
          bancos={bancos}
          tiposCuentaCorriente={tiposCuentaCorriente}
          monedas={monedas}
        />
      </Dialog>
    </div>
  );
}
