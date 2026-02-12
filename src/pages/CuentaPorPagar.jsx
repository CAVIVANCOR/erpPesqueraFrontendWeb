// src/pages/CuentaPorPagar.jsx
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useRef } from "react";
import CuentaPorPagarForm from "../components/cuentaPorPagar/CuentaPorPagarForm";
import { TabView, TabPanel } from "primereact/tabview";
import PagosTab from "../components/cuentaPorPagar/PagosTab";
import { getMediosPago } from "../api/medioPago";
import { getBancos } from "../api/banco";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import {
  getCuentaPorPagar,
  getCuentaPorPagarById,
  createCuentaPorPagar,
  updateCuentaPorPagar,
  deleteCuentaPorPagar,
  getCuentasPorPagarByEmpresa,
  getCuentasPorPagarPendientes,
  getCuentasPorPagarVencidas,
} from "../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getOrdenesCompra } from "../api/ordenCompra";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";

export default function CuentaPorPagar({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const toast = useRef(null);
  // Estados principales
  const [cuentas, setCuentas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroProveedor, setFiltroProveedor] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("TODAS"); // TODAS, PENDIENTES, VENCIDAS
  const [filtroEsGerencial, setFiltroEsGerencial] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [
        cuentasData,
        empresasData,
        proveedoresData,
        monedasData,
        estadosData,
        ordenesData,
        mediosPagoData,
        bancosData,
        cuentasCorrientesData,
      ] = await Promise.all([
        getCuentaPorPagar(),
        getEmpresas(),
        getEntidadesComerciales(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getOrdenesCompra(),
        getMediosPago(),
        getBancos(),
        getAllCuentaCorriente(),
      ]);

      setCuentas(cuentasData || []);
      setEmpresas(empresasData || []);
      setProveedores(
        proveedoresData?.filter((p) => p.esProveedor === true) || [],
      );
      setMonedas(monedasData || []);
      setEstados(
        estadosData?.filter((e) => e.modulo === "CUENTA_POR_PAGAR") || [],
      );
      setOrdenesCompra(ordenesData || []);
      setMediosPago(mediosPagoData || []);
      setBancos(bancosData || []);
      setCuentasCorrientes(cuentasCorrientesData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      let cuentasData = [];

      if (filtroTipo === "PENDIENTES" && filtroEmpresa) {
        cuentasData = await getCuentasPorPagarPendientes(filtroEmpresa);
      } else if (filtroTipo === "VENCIDAS" && filtroEmpresa) {
        cuentasData = await getCuentasPorPagarVencidas(filtroEmpresa);
      } else if (filtroEmpresa) {
        cuentasData = await getCuentasPorPagarByEmpresa(filtroEmpresa);
      } else {
        cuentasData = await getCuentaPorPagar();
      }

      // Aplicar filtros adicionales
      let cuentasFiltradas = cuentasData || [];

      if (filtroProveedor) {
        cuentasFiltradas = cuentasFiltradas.filter(
          (c) => Number(c.proveedorId) === Number(filtroProveedor),
        );
      }

      if (filtroEstado) {
        cuentasFiltradas = cuentasFiltradas.filter(
          (c) => Number(c.estadoId) === Number(filtroEstado),
        );
      }

      if (filtroEsGerencial !== null) {
        cuentasFiltradas = cuentasFiltradas.filter(
          (c) => c.esGerencial === filtroEsGerencial,
        );
      }

      if (filtroFechaDesde) {
        cuentasFiltradas = cuentasFiltradas.filter(
          (c) => new Date(c.fechaEmision) >= filtroFechaDesde,
        );
      }

      if (filtroFechaHasta) {
        cuentasFiltradas = cuentasFiltradas.filter(
          (c) => new Date(c.fechaEmision) <= filtroFechaHasta,
        );
      }

      setCuentas(cuentasFiltradas);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al aplicar filtros",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarCuenta = async (data) => {
    try {
      setLoading(true);

      if (isEdit && selectedCuenta) {
        await updateCuentaPorPagar(selectedCuenta.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por pagar actualizada correctamente",
          life: 3000,
        });
      } else {
        await createCuentaPorPagar(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por pagar creada correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar cuenta por pagar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar cuenta por pagar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroProveedor(null);
    setFiltroEstado(null);
    setFiltroFechaDesde(null);
    setFiltroFechaHasta(null);
    setFiltroTipo("TODAS");
    setFiltroEsGerencial(null);
    setGlobalFilter("");
    cargarDatos();
  };

  const handleAdd = () => {
    setSelectedCuenta(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const handleEdit = async (cuenta) => {
    try {
      setLoading(true);
      const cuentaCompleta = await getCuentaPorPagarById(cuenta.id);
      setSelectedCuenta(cuentaCompleta);
      setIsEdit(true);
      setDialogVisible(true);
    } catch (error) {
      console.error("Error al cargar cuenta:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la cuenta por pagar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cuenta) => {
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

    confirmDialog({
      message: `¿Está seguro de eliminar la cuenta por pagar ${cuenta.numeroOrdenCompra}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setLoading(true);
          await deleteCuentaPorPagar(cuenta.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Cuenta por pagar eliminada correctamente",
            life: 3000,
          });
          cargarDatos();
        } catch (error) {
          console.error("Error al eliminar:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.message || "Error al eliminar la cuenta por pagar",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleFormSubmit = async (data) => {
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

      // Objeto para grabación (SIN relaciones)
      const dataParaGrabacion = {
        ordenCompraId: data.ordenCompraId ? Number(data.ordenCompraId) : null,
        empresaId: data.empresaId ? Number(data.empresaId) : null,
        proveedorId: data.proveedorId ? Number(data.proveedorId) : null,
        numeroOrdenCompra: data.numeroOrdenCompra,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        numeroFacturaProveedor: data.numeroFacturaProveedor || null,
        fechaFacturaProveedor: data.fechaFacturaProveedor || null,
        montoTotal: Number(data.montoTotal),
        montoPagado: Number(data.montoPagado),
        saldoPendiente: Number(data.saldoPendiente),
        esSaldoInicial: data.esSaldoInicial || false,
        esGerencial: data.esGerencial || false,
        monedaId: data.monedaId ? Number(data.monedaId) : null,
        esContado: data.esContado || false,
        estadoId: data.estadoId ? Number(data.estadoId) : null,
        observaciones: data.observaciones || null,
      };

      if (isEdit) {
        await updateCuentaPorPagar(selectedCuenta.id, dataParaGrabacion);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por pagar actualizada correctamente",
          life: 3000,
        });
      } else {
        await createCuentaPorPagar(dataParaGrabacion);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por pagar creada correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar la cuenta por pagar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates para las columnas
  const fechaTemplate = (rowData, field) => {
    const fecha = rowData[field];
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  const montoTemplate = (rowData, field) => {
    const monto = rowData[field];
    if (monto === null || monto === undefined) return "-";
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estado?.descripcion || rowData.estado?.nombre || "-";
    const severity =
      rowData.saldoPendiente > 0
        ? "warning"
        : rowData.saldoPendiente === 0
          ? "success"
          : "info";
    return <Tag value={estado} severity={severity} />;
  };

  const tipoTemplate = (rowData) => {
    if (rowData.esGerencial) {
      return <Tag value="GERENCIAL (NEGRA)" severity="danger" />;
    }
    return <Tag value="FORMAL (BLANCA)" severity="success" />;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => handleEdit(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const header = (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Cuentas por Pagar</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            className="p-button-secondary"
            onClick={limpiarFiltros}
          />
          {permisos.crear && (
            <Button
              label="Nueva Cuenta por Pagar"
              icon="pi pi-plus"
              onClick={handleAdd}
              disabled={!permisos.puedeCrear || loading}
            />
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>
            Empresa
          </label>
          <Dropdown
            value={filtroEmpresa}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => setFiltroEmpresa(e.value)}
            placeholder="Todas las empresas"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>
            Proveedor
          </label>
          <Dropdown
            value={filtroProveedor}
            options={proveedores.map((p) => ({
              label: p.razonSocial,
              value: Number(p.id),
            }))}
            onChange={(e) => setFiltroProveedor(e.value)}
            placeholder="Todos los proveedores"
            filter
            showClear
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>Estado</label>
          <Dropdown
            value={filtroEstado}
            options={estados.map((e) => ({
              label: e.descripcion || e.nombre,
              value: Number(e.id),
            }))}
            onChange={(e) => setFiltroEstado(e.value)}
            placeholder="Todos los estados"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>Tipo</label>
          <Dropdown
            value={filtroTipo}
            options={[
              { label: "Todas", value: "TODAS" },
              { label: "Pendientes", value: "PENDIENTES" },
              { label: "Vencidas", value: "VENCIDAS" },
            ]}
            onChange={(e) => setFiltroTipo(e.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>
            Facturación
          </label>
          <Dropdown
            value={filtroEsGerencial}
            options={[
              { label: "Todas", value: null },
              { label: "Gerencial (Negra)", value: true },
              { label: "Formal (Blanca)", value: false },
            ]}
            onChange={(e) => setFiltroEsGerencial(e.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>Desde</label>
          <Calendar
            value={filtroFechaDesde}
            onChange={(e) => setFiltroFechaDesde(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>Hasta</label>
          <Calendar
            value={filtroFechaHasta}
            onChange={(e) => setFiltroFechaHasta(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            style={{ width: "100%" }}
          />
        </div>

        <Button
          label="Aplicar Filtros"
          icon="pi pi-search"
          onClick={aplicarFiltros}
          style={{ height: "40px" }}
        />
      </div>

      {/* BÚSQUEDA GLOBAL */}
      <div style={{ marginTop: 10 }}>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar en todas las columnas..."
            style={{ width: "100%" }}
          />
        </span>
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={cuentas}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron cuentas por pagar"
        stripedRows
        showGridlines
        paginator
        rows={50}
        rowsPerPageOptions={[50, 100, 200, 500]}
        size="small"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
        }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="proveedor.razonSocial"
          header="Proveedor"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="numeroOrdenCompra"
          header="Nro. OC"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="numeroFacturaProveedor"
          header="Nro. Factura"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="fechaEmision"
          header="F. Emisión"
          body={(rowData) => fechaTemplate(rowData, "fechaEmision")}
          sortable
          style={{ minWidth: "110px" }}
        />
        <Column
          field="fechaVencimiento"
          header="F. Vencimiento"
          body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="montoTotal"
          header="Monto Total"
          body={(rowData) => montoTemplate(rowData, "montoTotal")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          field="montoPagado"
          header="Pagado"
          body={(rowData) => montoTemplate(rowData, "montoPagado")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          field="saldoPendiente"
          header="Saldo"
          body={(rowData) => montoTemplate(rowData, "saldoPendiente")}
          sortable
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          field="moneda.codigoSunat"
          header="Moneda"
          sortable
          style={{ minWidth: "80px" }}
        />
        <Column
          header="Tipo"
          body={tipoTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={isEdit ? "Editar Cuenta por Pagar" : "Nueva Cuenta por Pagar"}
        modal
        className="p-fluid"
        onHide={() => setDialogVisible(false)}
        maximizable
      >
        <TabView>
          <TabPanel header="Datos Generales">
            <CuentaPorPagarForm
              isEdit={isEdit}
              defaultValues={selectedCuenta}
              empresas={empresas}
              proveedores={proveedores}
              monedas={monedas}
              estados={estados}
              ordenesCompra={ordenesCompra}
              onSubmit={handleFormSubmit}
              onCancel={() => setDialogVisible(false)}
              loading={loading}
              readOnly={!!isEdit && !permisos.puedeEditar}
            />
          </TabPanel>

          <TabPanel
            header="Pagos Realizados"
            disabled={!isEdit || !selectedCuenta}
          >
            <PagosTab
              cuentaPorPagarId={selectedCuenta?.id}
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
              onPagoRegistrado={cargarDatos}
            />
          </TabPanel>
        </TabView>
      </Dialog>
    </div>
  );
}
