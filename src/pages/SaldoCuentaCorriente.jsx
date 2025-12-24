// src/pages/SaldoCuentaCorriente.jsx
// Pantalla CRUD profesional para SaldoCuentaCorriente. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import SaldoCuentaCorrienteForm from "../components/saldoCuentaCorriente/SaldoCuentaCorrienteForm";
import {
  getAllSaldoCuentaCorriente,
  getHistorialSaldos,
  calcularSaldoActual,
  crearSaldoCuentaCorriente,
  actualizarSaldoCuentaCorriente,
  eliminarSaldoCuentaCorriente,
} from "../api/saldoCuentaCorriente";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEmpresas } from "../api/empresa";
import { getCentrosCosto } from "../api/centroCosto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Saldos de Cuentas Corrientes.
 */
export default function SaldoCuentaCorriente({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroCuenta, setFiltroCuenta] = useState(null);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(null);
  const [filtroFechaFin, setFiltroFechaFin] = useState(null);
  const [filtroConciliado, setFiltroConciliado] = useState(null);

  // Saldo actual
  const [showSaldoActual, setShowSaldoActual] = useState(false);
  const [saldoActualData, setSaldoActualData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [saldos, cuentas, emps, centros] = await Promise.all([
        getAllSaldoCuentaCorriente(),
        getAllCuentaCorriente(),
        getEmpresas(),
        getCentrosCosto(),
      ]);
      setItems(saldos);
      setCuentasCorrientes(cuentas);
      setEmpresas(emps);
      setCentrosCosto(centros);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const getItemsFiltrados = () => {
    return items.filter((item) => {
      const cumpleFiltroEmpresa =
        !filtroEmpresa || Number(item.empresaId) === Number(filtroEmpresa);
      const cumpleFiltroCuenta =
        !filtroCuenta ||
        Number(item.cuentaCorrienteId) === Number(filtroCuenta);

      let cumpleFiltroFecha = true;
      if (filtroFechaInicio) {
        const fechaItem = new Date(item.fecha);
        const fechaIni = new Date(filtroFechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        cumpleFiltroFecha = cumpleFiltroFecha && fechaItem >= fechaIni;
      }
      if (filtroFechaFin) {
        const fechaItem = new Date(item.fecha);
        const fechaFinDia = new Date(filtroFechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        cumpleFiltroFecha = cumpleFiltroFecha && fechaItem <= fechaFinDia;
      }

      const cumpleFiltroConciliado =
        filtroConciliado === null || item.conciliado === filtroConciliado;

      return (
        cumpleFiltroEmpresa &&
        cumpleFiltroCuenta &&
        cumpleFiltroFecha &&
        cumpleFiltroConciliado
      );
    });
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroCuenta(null);
    setFiltroFechaInicio(null);
    setFiltroFechaFin(null);
    setFiltroConciliado(null);
  };

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
      await eliminarSaldoCuentaCorriente(toDelete.id);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Registro eliminado correctamente.",
      });
      cargarDatos();
    } catch (err) {
      const mensajeError = obtenerMensajeError(err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
    setLoading(false);
    setToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      if (editing && editing.id) {
        await actualizarSaldoCuentaCorriente(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado.",
        });
      } else {
        await crearSaldoCuentaCorriente(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado.",
        });
      }
      setShowDialog(false);
      setEditing(null);
      cargarDatos();
    } catch (err) {
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

  const handleVerSaldoActual = async () => {
    if (!filtroCuenta) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Seleccione una cuenta corriente primero",
      });
      return;
    }

    setLoading(true);
    try {
      const resultado = await calcularSaldoActual(filtroCuenta);
      setSaldoActualData(resultado);
      setShowSaldoActual(true);
    } catch (err) {
      const mensajeError = obtenerMensajeError(err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    }
    setLoading(false);
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
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Saldos de Cuentas Corrientes</h2>
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
                  disabled={loading || !permisos.puedeCrear}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Ver Saldo Actual"
                  icon="pi pi-chart-line"
                  className="p-button-info"
                  size="small"
                  severity="info"
                  raised
                  onClick={handleVerSaldoActual}
                  disabled={loading || !filtroCuenta}
                  tooltip="Seleccione una cuenta para ver su saldo actual"
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1.5 }}>
                <label>Filtrar por Empresa:</label>
                <Dropdown
                  value={filtroEmpresa}
                  options={empresas.map((emp) => ({
                    label: emp.razonSocial,
                    value: Number(emp.id),
                  }))}
                  onChange={(e) => setFiltroEmpresa(e.value)}
                  placeholder="Todas"
                  showClear
                  className="w-full"
                />
              </div>
              <div style={{ flex: 2 }}>
                <label>Filtrar por Cuenta:</label>
                <Dropdown
                  value={filtroCuenta}
                  options={cuentasCorrientes.map((cuenta) => ({
                    label: `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`,
                    value: Number(cuenta.id),
                  }))}
                  onChange={(e) => setFiltroCuenta(e.value)}
                  placeholder="Todas"
                  showClear
                  filter
                  className="w-full"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Desde:</label>
                <Calendar
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Fecha inicio"
                  showButtonBar
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Hasta:</label>
                <Calendar
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  placeholder="Fecha fin"
                  showButtonBar
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Conciliado:</label>
                <Dropdown
                  value={filtroConciliado}
                  options={[
                    { label: "Sí", value: true },
                    { label: "No", value: false },
                  ]}
                  onChange={(e) => setFiltroConciliado(e.value)}
                  placeholder="Todos"
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
                  disabled={
                    !filtroEmpresa &&
                    !filtroCuenta &&
                    !filtroFechaInicio &&
                    !filtroFechaFin &&
                    filtroConciliado === null
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <Column field="id" header="ID" style={{ width: 80 }} sortable />
        <Column
          field="fecha"
          header="Fecha"
          sortable
          body={(rowData) =>
            new Date(rowData.fecha).toLocaleDateString("es-PE")
          }
          style={{ width: 110 }}
        />
        <Column
          field="cuentaCorrienteId"
          header="Cuenta Corriente"
          sortable
          body={(rowData) => {
            const cuenta = rowData.cuentaCorriente;
            return cuenta
              ? `${cuenta.numeroCuenta} - ${cuenta.banco?.nombre || ""}`
              : rowData.cuentaCorrienteId;
          }}
        />
        <Column
          field="empresaId"
          header="Empresa"
          sortable
          body={(rowData) => {
            const empresa = rowData.empresa;
            return empresa ? empresa.razonSocial : rowData.empresaId;
          }}
        />
        <Column
          field="saldoAnterior"
          header="Saldo Anterior"
          sortable
          body={(rowData) => {
            const moneda = rowData.cuentaCorriente?.moneda;
            const simbolo = moneda?.simbolo || "";
            return `${simbolo} ${Number(rowData.saldoAnterior).toFixed(2)}`;
          }}
          style={{ width: 130, textAlign: "right" }}
        />
        <Column
          field="ingresos"
          header="Ingresos"
          sortable
          body={(rowData) => {
            const moneda = rowData.cuentaCorriente?.moneda;
            const simbolo = moneda?.simbolo || "";
            return `${simbolo} ${Number(rowData.ingresos).toFixed(2)}`;
          }}
          style={{ width: 120, textAlign: "right", color: "green" }}
        />
        <Column
          field="egresos"
          header="Egresos"
          sortable
          body={(rowData) => {
            const moneda = rowData.cuentaCorriente?.moneda;
            const simbolo = moneda?.simbolo || "";
            return `${simbolo} ${Number(rowData.egresos).toFixed(2)}`;
          }}
          style={{ width: 120, textAlign: "right", color: "red" }}
        />
        <Column
          field="saldoActual"
          header="Saldo Actual"
          sortable
          body={(rowData) => {
            const moneda = rowData.cuentaCorriente?.moneda;
            const simbolo = moneda?.simbolo || "";
            return `${simbolo} ${Number(rowData.saldoActual).toFixed(2)}`;
          }}
          style={{ width: 130, textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          field="diferencia"
          header="Diferencia"
          sortable
          body={(rowData) => {
            if (!rowData.diferencia && rowData.diferencia !== 0) return "-";
            const moneda = rowData.cuentaCorriente?.moneda;
            const simbolo = moneda?.simbolo || "";
            const valor = Number(rowData.diferencia);
            return (
              <span style={{ color: Math.abs(valor) > 0.01 ? "red" : "green" }}>
                {simbolo} {valor.toFixed(2)}
              </span>
            );
          }}
          style={{ width: 110, textAlign: "right" }}
        />
        <Column
          field="conciliado"
          header="Conciliado"
          sortable
          body={(rowData) =>
            rowData.conciliado ? (
              <Tag value="SÍ" severity="success" />
            ) : (
              <Tag value="NO" severity="warning" />
            )
          }
          style={{ width: 100 }}
        />
        <Column
          body={actionBody}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={editing ? "Editar Saldo" : "Nuevo Saldo"}
        visible={showDialog}
        style={{ width: 1300 }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <SaldoCuentaCorrienteForm
          isEdit={!!editing}
          defaultValues={editing || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDialog(false)}
          loading={loading}
          cuentasCorrientes={cuentasCorrientes}
          empresas={empresas}
          movimientosCaja={[]}
          centrosCosto={centrosCosto}
        />
      </Dialog>

      <Dialog
        header="Saldo Actual de la Cuenta"
        visible={showSaldoActual}
        style={{ width: 600 }}
        onHide={() => setShowSaldoActual(false)}
        modal
      >
        {saldoActualData && (
          <div style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {saldoActualData.ultimoRegistro?.cuentaCorriente?.numeroCuenta ||
                ""}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span>Saldo Actual:</span>
              <span style={{ fontWeight: "bold", fontSize: 20, color: "blue" }}>
                {saldoActualData.ultimoRegistro?.cuentaCorriente?.moneda
                  ?.simbolo || ""}{" "}
                {Number(saldoActualData.saldoActual).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span>Última actualización:</span>
              <span>
                {saldoActualData.ultimoRegistro
                  ? new Date(
                      saldoActualData.ultimoRegistro.fecha
                    ).toLocaleDateString("es-PE")
                  : "-"}
              </span>
            </div>
            <div style={{ marginTop: 20, color: "#666" }}>
              {saldoActualData.mensaje}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
