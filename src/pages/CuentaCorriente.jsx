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
import { Dropdown } from "primereact/dropdown";

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
  // Estados para filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroBanco, setFiltroBanco] = useState(null);

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

  // Función para obtener datos filtrados
  const getItemsFiltrados = () => {
    return items.filter((item) => {
      const cumpleFiltroEmpresa =
        !filtroEmpresa || Number(item.empresaId) === Number(filtroEmpresa);
      const cumpleFiltroBanco =
        !filtroBanco || Number(item.bancoId) === Number(filtroBanco);

      return cumpleFiltroEmpresa && cumpleFiltroBanco;
    });
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroBanco(null);
  };

  // Función para extraer mensaje de error del backend
  const obtenerMensajeError = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }
    if (error.message) {
      return error.message;
    }
    return "Error desconocido";
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
      console.error("Error al guardar cuenta corriente:", err);
      const mensajeError = obtenerMensajeError(err);

      toast.current.show({
        severity: "error",
        summary: "Error al Guardar",
        detail: mensajeError,
        life: 5000,
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
        value={getItemsFiltrados()}
        loading={loading}
        dataKey="id"
        paginator
        rows={10}
        onRowClick={(e) => handleEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2>Cuentas Corrientes</h2>
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                severity="success"
                raised
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label>Filtrar por Empresa:</label>
              <Dropdown
                value={filtroEmpresa}
                options={empresas.map((emp) => ({
                  label: emp.razonSocial,
                  value: Number(emp.id),
                }))}
                onChange={(e) => setFiltroEmpresa(e.value)}
                placeholder="Seleccionar empresa"
                showClear
                className="w-full"
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <label>Filtrar por Banco:</label>
              <Dropdown
                value={filtroBanco}
                options={bancos.map((banco) => ({
                  label: banco.nombre,
                  value: Number(banco.id),
                }))}
                onChange={(e) => setFiltroBanco(e.value)}
                placeholder="Seleccionar banco"
                showClear
                className="w-full"
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <Button
                label="Limpiar"
                icon="pi pi-filter-slash"
                className="p-button-secondary"
                size="small"
                severity="secondary"
                raised
                onClick={limpiarFiltros}
                disabled={!filtroEmpresa && !filtroBanco}
                tooltip="Limpiar filtros"
              />
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="empresaId"
          header="Empresa"
          sortable
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
          sortable
          body={(rowData) => {
            const banco = bancos.find(
              (b) => Number(b.id) === Number(rowData.bancoId)
            );
            return banco ? banco.nombre : rowData.bancoId;
          }}
        />
        <Column field="descripcion" header="Descripción" sortable />
        <Column
          field="monedaId"
          header="Moneda"
          sortable
          body={(rowData) => {
            // Usar la relación directa si está disponible
            if (rowData.moneda) {
              return `${rowData.moneda.simbolo} - ${rowData.moneda.nombre}`;
            }
            // Fallback al método anterior si no hay relación
            const moneda = monedas.find(
              (m) => Number(m.id) === Number(rowData.monedaId)
            );
            return moneda
              ? `${moneda.simbolo} - ${moneda.nombre}`
              : rowData.monedaId;
          }}
        />
        <Column field="numeroCuenta" header="Número Cuenta" sortable />
        <Column field="numeroCuentaCCI" header="Número CCI" sortable />
        <Column
          field="tipoCuentaCorrienteId"
          header="Tipo Cuenta"
          sortable
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
          sortable
          body={(rowData) => (rowData.activa ? "Sí" : "No")}
        />
        <Column
          body={actionBody}
          header="Acciones"
          sortable
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
