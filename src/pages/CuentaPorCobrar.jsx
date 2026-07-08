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
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import CuentaPorCobrarForm from "../components/cuentaPorCobrar/CuentaPorCobrarForm";
import EmpresaSelector from "../components/common/EmpresaSelector";
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
import { getResponsiveFontSize, formatearFecha, formatearNumero } from "../utils/utils";
import { usePermissions } from "../hooks/usePermissions";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";

export default function CuentaPorCobrar({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const formRef = useRef(null);
  const [cuentas, setCuentas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
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

  // ═══════════════════════════════════════════════════════════
  // ESTADOS DE FILTROS
  // ═══════════════════════════════════════════════════════════
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [rangoFechasVencimiento, setRangoFechasVencimiento] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [nroDocumentoBusqueda, setNroDocumentoBusqueda] = useState("");
  const [cuentasFiltradas, setCuentasFiltradas] = useState([]);
  const [clientesUnicos, setClientesUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [monedasUnicas, setMonedasUnicas] = useState([]);
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
        periodosContablesData,
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
        getPeriodosContables(),
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
      setPeriodosContables(periodosContablesData || []);
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

  // ═══════════════════════════════════════════════════════════
  // EFECTO: GENERAR OPCIONES ÚNICAS PARA FILTROS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const datosParaOpciones = empresaSeleccionada
      ? cuentasFiltradas.filter(c => Number(c.empresaId) === Number(empresaSeleccionada))
      : cuentasFiltradas;

    // Clientes únicos
    const clientesUnicos = [...new Map(
      datosParaOpciones
        .filter(c => c.cliente)
        .map(c => [c.cliente.id, c.cliente])
    ).values()];

    // Estados únicos
    const estadosUnicos = [...new Map(
      datosParaOpciones
        .filter(c => c.estado)
        .map(c => [c.estado.id, c.estado])
    ).values()];

    // Monedas únicas
    const monedasUnicas = [...new Map(
      datosParaOpciones
        .filter(c => c.moneda)
        .map(c => [c.moneda.id, c.moneda])
    ).values()];

    setClientesUnicos(clientesUnicos);
    setEstadosUnicos(estadosUnicos);
    setMonedasUnicas(monedasUnicas);

    // Limpiar selecciones que ya no existen
    if (clienteSeleccionado && !clientesUnicos.find(c => Number(c.id) === Number(clienteSeleccionado))) {
      setClienteSeleccionado(null);
    }
    if (estadoSeleccionado && !estadosUnicos.find(e => Number(e.id) === Number(estadoSeleccionado))) {
      setEstadoSeleccionado(null);
    }
    if (monedaSeleccionada && !monedasUnicas.find(m => Number(m.id) === Number(monedaSeleccionada))) {
      setMonedaSeleccionada(null);
    }
  }, [cuentasFiltradas, empresaSeleccionada, clienteSeleccionado, estadoSeleccionado, monedaSeleccionada]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO: APLICAR FILTROS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let filtrados = cuentas;

    // Filtro por empresa
    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    // Filtro por cliente
    if (clienteSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.clienteId) === Number(clienteSeleccionado)
      );
    }

    // Filtro por rango de fechas (fechaEmision)
    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaEmision = new Date(item.fechaEmision);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        // Si hay fecha fin
        if (rangoFechas[1]) {
          const fechaFinDia = new Date(rangoFechas[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaEmision >= fechaIni && fechaEmision <= fechaFinDia;
        }
        // Solo fecha inicio
        return fechaEmision >= fechaIni;
      });
    }

    // Filtro por rango de fechas de vencimiento
    if (rangoFechasVencimiento && rangoFechasVencimiento[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaVencimiento = new Date(item.fechaVencimiento);
        const fechaIni = new Date(rangoFechasVencimiento[0]);
        fechaIni.setHours(0, 0, 0, 0);

        // Si hay fecha fin
        if (rangoFechasVencimiento[1]) {
          const fechaFinDia = new Date(rangoFechasVencimiento[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaVencimiento >= fechaIni && fechaVencimiento <= fechaFinDia;
        }
        // Solo fecha inicio
        return fechaVencimiento >= fechaIni;
      });
    }

    // Filtro por estado
    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoSeleccionado)
      );
    }

    // Filtro por moneda
    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.monedaId) === Number(monedaSeleccionada)
      );
    }

    // Filtro por número de documento
    if (nroDocumentoBusqueda && nroDocumentoBusqueda.trim() !== "") {
      const busqueda = nroDocumentoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter((item) => {
        const nroDocumento = item.numeroPreFactura || "";
        return nroDocumento.toLowerCase().includes(busqueda);
      });
    }

    setCuentasFiltradas(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    rangoFechas,
    rangoFechasVencimiento,
    estadoSeleccionado,
    monedaSeleccionada,
    nroDocumentoBusqueda,
    cuentas,
  ]);

  const handleGenerarAsiento = async (cuenta) => {
    try {
      // TODO: Implementar generación de asiento contable
      toast.current.show({
        severity: "info",
        summary: "Información",
        detail: "Función de generar asiento contable pendiente de implementar",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al generar asiento:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo generar el asiento contable",
        life: 3000,
      });
    }
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

      // ✅ AGREGAR DATOS DE AUDITORÍA
      const dataConAuditoria = {
        ...data, // ← Todos los datos del formulario
        creadoPor: esEdicion
          ? data.creadoPor // ← Si es edición, mantener el creador original
          : usuario?.personalId
            ? Number(usuario.personalId)
            : null, // ← Si es nuevo, usar usuario actual
        actualizadoPor:
          esEdicion && usuario?.personalId
            ? Number(usuario.personalId) // ← Si es edición, registrar quién actualiza
            : null, // ← Si es nuevo, no hay actualizador aún
      };

      if (esEdicion) {
        // ✅ USAR dataConAuditoria EN VEZ DE data
        await updateCuentaPorCobrar(selectedCuenta.id, dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por cobrar actualizada correctamente",
          life: 3000,
        });

        // 🆕 Recargar la cuenta actualizada para el formulario
        if (formRef.current?.recargarCuentaDesdeBackend) {
          await formRef.current.recargarCuentaDesdeBackend();
        }
      } else {
        // ✅ USAR dataConAuditoria EN VEZ DE data
        await createCuentaPorCobrar(dataConAuditoria);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta por cobrar creada correctamente",
          life: 3000,
        });
      }

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

    // ✅ OPTIMIZADO: Usar colorFondo dinámico desde base de datos
    const colorFondo = moneda?.colorFondo || "#e2e3e5";

    return (
      <span
        style={{
          backgroundColor: colorFondo,
          color: "#000",
          fontSize: "0.9rem",
          fontWeight: "bold",
          padding: "4px 8px",
          borderRadius: "4px",
          border: `1px solid ${colorFondo}`,
          display: "inline-block",
          minWidth: "50px",
          textAlign: "center",
        }}
      >
        {moneda?.codigoSunat || "-"}
      </span>
    );
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = estados.find(
      (e) => Number(e.id) === Number(rowData.estadoId),
    );
    return (
      <Tag
        value={estado?.descripcion || "-"}
        severity={estado?.severityColor || "info"}
      />
    );
  };

  const fechaBodyTemplate = (rowData, field) => {
    if (!rowData[field]) return "-";
    return new Date(rowData[field]).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    const monto = rowData[field] || 0;
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    // ✅ OPTIMIZADO: Usar colorFondo dinámico desde base de datos
    const colorFondo = moneda?.colorFondo || "#ffffff";

    return (
      <div
        style={{
          backgroundColor: colorFondo,
          padding: "0.5rem",
          borderRadius: "4px",
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {new Intl.NumberFormat("es-PE", {
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(monto)}
      </div>
    );
  };

  const tipoDocumentoBodyTemplate = (rowData) => {
    return rowData.preFactura?.tipoDocumento?.codigo || "-";
  };

  const referenciaBodyTemplate = (rowData) => {
    return rowData.preFactura?.nroLiquidacionFacturacion || "-";
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

  // ═══════════════════════════════════════════════════════════
  // FUNCIÓN: LIMPIAR FILTROS
  // ═══════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════
  // FUNCIÓN: LIMPIAR FILTROS
  // ═══════════════════════════════════════════════════════════
  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setClienteSeleccionado(null);
    setRangoFechas(null);
    setRangoFechasVencimiento(null);
    setEstadoSeleccionado(null);
    setMonedaSeleccionada(null);
    setNroDocumentoBusqueda("");
  };

  const calcularTotalesPorMoneda = () => {
    let totalSoles = 0;
    let totalDolares = 0;
    let pagadoSoles = 0;
    let pagadoDolares = 0;
    let saldoSoles = 0;
    let saldoDolares = 0;
    let colorFondoSoles = "#FFE5B4";
    let colorFondoDolares = "#C8E6C9";
    let simboloSoles = "S/";
    let simboloDolares = "$";

    cuentasFiltradas.forEach((cuenta) => {
      const montoTotal = Number(cuenta.montoTotal) || 0;
      const montoPagado = Number(cuenta.montoPagado) || 0;
      const saldoPendiente = Number(cuenta.saldoPendiente) || 0;

      if (Number(cuenta.monedaId) === 1) {
        totalSoles += montoTotal;
        pagadoSoles += montoPagado;
        saldoSoles += saldoPendiente;
        if (cuenta.moneda?.colorFondo) colorFondoSoles = cuenta.moneda.colorFondo;
        if (cuenta.moneda?.simbolo) simboloSoles = cuenta.moneda.simbolo;
      } else if (Number(cuenta.monedaId) === 2) {
        totalDolares += montoTotal;
        pagadoDolares += montoPagado;
        saldoDolares += saldoPendiente;
        if (cuenta.moneda?.colorFondo) colorFondoDolares = cuenta.moneda.colorFondo;
        if (cuenta.moneda?.simbolo) simboloDolares = cuenta.moneda.simbolo;
      }
    });

    return {
      totalSoles, totalDolares,
      pagadoSoles, pagadoDolares,
      saldoSoles, saldoDolares,
      colorFondoSoles, colorFondoDolares,
      simboloSoles, simboloDolares,
      cantidadDocs: cuentasFiltradas.length
    };
  };

  const footerTemplate = () => {
    const {
      totalSoles, totalDolares,
      pagadoSoles, pagadoDolares,
      saldoSoles, saldoDolares,
      colorFondoSoles, colorFondoDolares,
      simboloSoles, simboloDolares,
      cantidadDocs
    } = calcularTotalesPorMoneda();

    return (
      <div style={{ padding: "15px", backgroundColor: "#f8f9fa" }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "16px" }}>
          💰 TOTALES: {cantidadDocs} documento{cantidadDocs !== 1 ? 's' : ''}
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {(totalSoles > 0 || saldoSoles > 0) && (
            <div style={{ flex: 1, minWidth: "250px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}>SOLES</div>
              <div style={{ marginBottom: "5px" }}>Total: <span style={{ fontWeight: "bold" }}>{simboloSoles} {formatearNumero(totalSoles)}</span></div>
              <div style={{ marginBottom: "5px" }}>Pagado: <span style={{ fontWeight: "bold" }}>{simboloSoles} {formatearNumero(pagadoSoles)}</span></div>
              <div style={{ backgroundColor: colorFondoSoles, padding: "8px", borderRadius: "4px", fontWeight: "bold", fontSize: "16px" }}>
                ⭐ Saldo: {simboloSoles} {formatearNumero(saldoSoles)}
              </div>
            </div>
          )}
          {(totalDolares > 0 || saldoDolares > 0) && (
            <div style={{ flex: 1, minWidth: "250px", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}>DÓLARES</div>
              <div style={{ marginBottom: "5px" }}>Total: <span style={{ fontWeight: "bold" }}>{simboloDolares} {formatearNumero(totalDolares)}</span></div>
              <div style={{ marginBottom: "5px" }}>Pagado: <span style={{ fontWeight: "bold" }}>{simboloDolares} {formatearNumero(pagadoDolares)}</span></div>
              <div style={{ backgroundColor: colorFondoDolares, padding: "8px", borderRadius: "4px", fontWeight: "bold", fontSize: "16px" }}>
                ⭐ Saldo: {simboloDolares} {formatearNumero(saldoDolares)}
              </div>
            </div>
          )}
        </div>
      </div>
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECCIÓN DE FILTROS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            <h2>Cuentas por Cobrar</h2>
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontWeight: "bold" }}>Empresa</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaSeleccionada(id)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label="Actualizar"
              icon="pi pi-refresh"
              className="p-button-info"
              onClick={loadData}
              loading={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label="Limpiar Filtros"
              icon="pi pi-filter-slash"
              className="p-button-secondary"
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
          <div style={{ flex: 2 }}>
            <label htmlFor="clienteFiltro" style={{ fontWeight: "bold" }}>
              Cliente
            </label>
            <Dropdown
              id="clienteFiltro"
              value={clienteSeleccionado}
              options={clientesUnicos.map((c) => ({
                label: c.razonSocial,
                value: Number(c.id),
              }))}
              onChange={(e) => setClienteSeleccionado(e.value)}
              placeholder="Todos"
              optionLabel="label"
              optionValue="value"
              showClear
              filter
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
              Rango de Fechas (Emisión)
            </label>
            <Calendar
              id="rangoFechas"
              value={rangoFechas}
              onChange={(e) => setRangoFechas(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Seleccionar rango..."
              style={{ width: "100%" }}
              disabled={loading}
              readOnlyInput
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="rangoFechasVencimiento" style={{ fontWeight: "bold" }}>
              Rango de Fechas (Vencimiento)
            </label>
            <Calendar
              id="rangoFechasVencimiento"
              value={rangoFechasVencimiento}
              onChange={(e) => setRangoFechasVencimiento(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Seleccionar rango..."
              style={{ width: "100%" }}
              disabled={loading}
              readOnlyInput
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="estadoFiltro" style={{ fontWeight: "bold" }}>
              Estado
            </label>
            <Dropdown
              id="estadoFiltro"
              value={estadoSeleccionado}
              options={estadosUnicos.map((e) => ({
                label: e.descripcion,
                value: Number(e.id),
              }))}
              onChange={(e) => setEstadoSeleccionado(e.value)}
              placeholder="Todos"
              optionLabel="label"
              optionValue="value"
              showClear
              filter
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="monedaFiltro" style={{ fontWeight: "bold" }}>
              Moneda
            </label>
            <Dropdown
              id="monedaFiltro"
              value={monedaSeleccionada}
              options={monedasUnicas.map((m) => ({
                label: m.simbolo,
                value: Number(m.id),
              }))}
              onChange={(e) => setMonedaSeleccionada(e.value)}
              placeholder="Todas"
              optionLabel="label"
              optionValue="value"
              showClear
              filter
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="nroDocumentoInput" style={{ fontWeight: "bold" }}>
              N° Documento
            </label>
            <InputText
              id="nroDocumentoInput"
              value={nroDocumentoBusqueda}
              onChange={(e) => setNroDocumentoBusqueda(e.target.value)}
              placeholder="Buscar por N° Documento..."
              style={{ width: "100%" }}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <DataTable
        value={cuentasFiltradas}
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron cuentas por cobrar"
        stripedRows
        showGridlines
        paginator
        rows={25}
        rowsPerPageOptions={[25, 50, 100, 150]}
        size="small"
        footer={footerTemplate}
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
          header="Tipo Doc."
          body={tipoDocumentoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="numeroPreFactura"
          header="N° Dcmto Origen"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Referencia"
          body={referenciaBodyTemplate}
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
        <CuentaPorCobrarForm
          isEdit={isEdit}
          defaultValues={formData}
          empresas={empresas}
          clientes={clientes}
          monedas={monedas}
          estados={estados}
          periodosContables={periodosContables}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          onSubmit={saveCuenta}
          onCancel={hideDialog}
          onGenerarAsiento={handleGenerarAsiento}
          loading={loading}
          readOnly={!!isEdit && !permisos.puedeEditar}
          permisos={permisos}
          toast={toast}
          ref={formRef}
        />
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
