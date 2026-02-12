// src/pages/CuentaPorCobrar.jsx
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
import CuentaPorCobrarForm from "../components/cuentaPorCobrar/CuentaPorCobrarForm";
import { TabView, TabPanel } from "primereact/tabview";
import PagosTab from "../components/cuentaPorCobrar/PagosTab";
import { getMediosPago } from "../api/medioPago";
import { getBancos } from "../api/banco";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import {
  getCuentaPorCobrar,
  getCuentaPorCobrarById,
  createCuentaPorCobrar,
  updateCuentaPorCobrar,
  deleteCuentaPorCobrar,
  getCuentasPorCobrarByEmpresa,
  getCuentasPorCobrarPendientes,
  getCuentasPorCobrarVencidas,
} from "../api/cuentasPorCobrarPagar/cuentaPorCobrar";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPreFacturas } from "../api/preFactura";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";

export default function CuentaPorCobrar({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [cuentas, setCuentas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);

  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);

  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [cuentaDialog, setCuentaDialog] = useState(false);
  const [deleteCuentaDialog, setDeleteCuentaDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const [formData, setFormData] = useState({});
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        cuentasData,
        empresasData,
        clientesData,
        monedasData,
        estadosData,
        preFacturasData,
        mediosPagoData,
        bancosData,
        cuentasCorrientesData,
      ] = await Promise.all([
        getCuentaPorCobrar(),
        getEmpresas(),
        getEntidadesComerciales(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getPreFacturas(),
        getMediosPago(),
        getBancos(),
        getAllCuentaCorriente(),
      ]);

      setCuentas(cuentasData || []);
      setEmpresas(empresasData || []);
      setClientes(clientesData?.filter((c) => c.esCliente === true) || []);
      setMonedas(monedasData || []);
      setEstados(estadosData || []);
      setPreFacturas(preFacturasData || []);
      setMediosPago(mediosPagoData || []);
      setBancos(bancosData || []);
      setCuentasCorrientes(cuentasCorrientesData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
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

  const openNew = () => {
    setFormData({});
    setSelectedCuenta(null);
    setIsEdit(false);
    setCuentaDialog(true);
  };

  const hideDialog = () => {
    setCuentaDialog(false);
    setFormData({});
    setSelectedCuenta(null);
  };

  const editCuenta = async (cuenta) => {
    try {
      setLoading(true);
      const cuentaCompleta = await getCuentaPorCobrarById(cuenta.id);

      const dataParaEdicion = {
        ...cuentaCompleta,
        preFacturaId: cuentaCompleta.preFacturaId
          ? Number(cuentaCompleta.preFacturaId)
          : null,
        empresaId: Number(cuentaCompleta.empresaId),
        clienteId: Number(cuentaCompleta.clienteId),
        monedaId: Number(cuentaCompleta.monedaId),
        estadoId: Number(cuentaCompleta.estadoId),
      };

      setFormData(dataParaEdicion);
      setSelectedCuenta(cuenta);
      setIsEdit(true);
      setCuentaDialog(true);
    } catch (error) {
      console.error("Error al cargar cuenta por cobrar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar cuenta por cobrar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  const saveCuenta = async (data) => {
    const esEdicion = isEdit && selectedCuenta;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      if (esEdicion) {
        await updateCuentaPorCobrar(selectedCuenta.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por cobrar actualizada correctamente",
          life: 3000,
        });
      } else {
        await createCuentaPorCobrar(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por cobrar creada correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar cuenta por cobrar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar cuenta por cobrar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteCuenta = (cuenta) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar",
        life: 3000,
      });
      return;
    }
    setSelectedCuenta(cuenta);
    setDeleteCuentaDialog(true);
  };

  const deleteCuentaConfirmed = async () => {
    try {
      setLoading(true);
      await deleteCuentaPorCobrar(selectedCuenta.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuenta por cobrar eliminada correctamente",
        life: 3000,
      });

      setDeleteCuentaDialog(false);
      setSelectedCuenta(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar cuenta por cobrar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar cuenta por cobrar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeleteCuentaDialog = () => {
    setDeleteCuentaDialog(false);
    setSelectedCuenta(null);
  };
  const empresaBodyTemplate = (rowData) => {
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(rowData.empresaId),
    );
    return empresa?.razonSocial || "-";
  };

  const clienteBodyTemplate = (rowData) => {
    const cliente = clientes.find(
      (c) => Number(c.id) === Number(rowData.clienteId),
    );
    return cliente?.razonSocial || "-";
  };

  const monedaBodyTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    return moneda?.codigoSunat || "-";
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = estados.find(
      (e) => Number(e.id) === Number(rowData.estadoId),
    );

    const getSeverity = (estadoNombre) => {
      const nombre = estadoNombre?.toUpperCase() || "";
      if (nombre.includes("PAGADA") || nombre.includes("COBRADA"))
        return "success";
      if (nombre.includes("PENDIENTE")) return "warning";
      if (nombre.includes("VENCIDA")) return "danger";
      if (nombre.includes("PARCIAL")) return "info";
      if (nombre.includes("ANULADA")) return "secondary";
      return "info";
    };

    return (
      <Tag
        value={estado?.nombre || "-"}
        severity={getSeverity(estado?.nombre)}
      />
    );
  };

  const fechaBodyTemplate = (rowData, field) => {
    if (!rowData[field]) return "-";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field] || 0;
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const booleanBodyTemplate = (rowData, field) => {
    return rowData[field] ? (
      <i className="pi pi-check" style={{ color: "green" }}></i>
    ) : (
      <i className="pi pi-times" style={{ color: "red" }}></i>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editCuenta(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeleteCuenta(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };
  const leftToolbarTemplate = () => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
          disabled={!permisos.puedeCrear || loading}
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : ""}
        />
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          className="p-button-info"
          onClick={loadData}
          loading={loading}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    );
  };

  const deleteCuentaDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteCuentaDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deleteCuentaConfirmed}
        loading={loading}
      />
    </>
  );
  return (
    <div className="card">
      <Toast ref={toast} />

      <h2>Gestión de Cuentas por Cobrar</h2>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={cuentas}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron cuentas por cobrar"
        stripedRows
        showGridlines
        paginator
        rows={50}
        rowsPerPageOptions={[50, 100, 200, 500]}
        size="small"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => editCuenta(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Cliente"
          body={clienteBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="numeroPreFactura"
          header="Nro. PreFactura"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Fecha Emisión"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaEmision")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Fecha Venc."
          body={(rowData) => fechaBodyTemplate(rowData, "fechaVencimiento")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Monto Total"
          body={(rowData) => montoBodyTemplate(rowData, "montoTotal")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Saldo Pend."
          body={(rowData) => montoBodyTemplate(rowData, "saldoPendiente")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Saldo Inicial"
          body={(rowData) => booleanBodyTemplate(rowData, "esSaldoInicial")}
          sortable
          style={{ minWidth: "120px", textAlign: "center" }}
        />
        <Column
          header="Gerencial"
          body={(rowData) => booleanBodyTemplate(rowData, "esGerencial")}
          sortable
          style={{ minWidth: "100px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={cuentaDialog}
        style={{ width: "1300px" }}
        maximizable
        maximized={true}
        header={isEdit ? "Editar Cuenta por Cobrar" : "Nueva Cuenta por Cobrar"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <TabView>
          <TabPanel header="Datos Generales">
            <CuentaPorCobrarForm
              isEdit={isEdit}
              defaultValues={formData}
              empresas={empresas}
              clientes={clientes}
              monedas={monedas}
              estados={estados}
              preFacturas={preFacturas}
              onSubmit={saveCuenta}
              onCancel={hideDialog}
              loading={loading}
              readOnly={!!isEdit && !permisos.puedeEditar}
            />
          </TabPanel>

          <TabPanel
            header="Pagos / Cobros"
            disabled={!isEdit || !selectedCuenta}
          >
            <PagosTab
              cuentaPorCobrarId={selectedCuenta?.id}
              saldoPendiente={selectedCuenta?.saldoPendiente}
              monedaId={selectedCuenta?.monedaId}
              empresaId={selectedCuenta?.empresaId}
              monedas={monedas}
              mediosPago={mediosPago}
              bancos={bancos}
              cuentasCorrientes={cuentasCorrientes}
              estados={estados}
              puedeEditar={permisos.puedeEditar}
              toast={toast}
              onPagoRegistrado={loadData}
            />
          </TabPanel>
        </TabView>
      </Dialog>

      <Dialog
        visible={deleteCuentaDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteCuentaDialogFooter}
        onHide={hideDeleteCuentaDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedCuenta && (
            <span>
              ¿Está seguro de eliminar la cuenta por cobrar{" "}
              <b>{selectedCuenta.numeroPreFactura}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
