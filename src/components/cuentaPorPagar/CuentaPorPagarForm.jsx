// src/components/cuentaPorPagar/CuentaPorPagarForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Panel } from "primereact/panel";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getResponsiveFontSize,
  formatearNumero,
  formatearFecha,
} from "../../utils/utils";
import CardAsientoContable from "../common/CardAsientoContable";
import PagoCuentaPorPagarForm from "../pagoCuentaPorPagar/PagoCuentaPorPagarForm";
import {
  getPagosByCuentaPorPagar,
  deletePagoCuentaPorPagar,
  createPagoCuentaPorPagar,
  updatePagoCuentaPorPagar,
} from "../../api/cuentasPorCobrarPagar/pago";
import { getCuentaPorPagarById } from "../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const CuentaPorPagarForm = forwardRef(({
  isEdit,
  defaultValues,
  empresas,
  proveedores,
  monedas,
  estados,
  ordenesCompra,
  periodosContables,
  mediosPago,
  bancos,
  cuentasCorrientes,
  onSubmit,
  onCancel,
  onGenerarAsiento,
  loading,
  readOnly = false,
  permisos = {},
  toast,
}, ref) => {
  const usuario = useAuthStore((state) => state.usuario);
  const [activeTab, setActiveTab] = useState(0);

  // Estados principales
  const [ordenCompraId, setOrdenCompraId] = useState(
    defaultValues?.ordenCompraId || null,
  );
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId || null);
  const [proveedorId, setProveedorId] = useState(defaultValues?.proveedorId || null);
  const [numeroOrdenCompra, setNumeroOrdenCompra] = useState(
    defaultValues?.numeroOrdenCompra || "",
  );
  const [fechaEmision, setFechaEmision] = useState(
    defaultValues?.fechaEmision
      ? new Date(defaultValues.fechaEmision)
      : new Date(),
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : new Date(),
  );
  const [montoTotal, setMontoTotal] = useState(defaultValues?.montoTotal || 0);
  const [montoPagado, setMontoPagado] = useState(
    defaultValues?.montoPagado || 0,
  );
  const [saldoPendiente, setSaldoPendiente] = useState(
    defaultValues?.saldoPendiente || 0,
  );
  const [esSaldoInicial, setEsSaldoInicial] = useState(
    defaultValues?.esSaldoInicial || false,
  );
  const [esGerencial, setEsGerencial] = useState(
    defaultValues?.esGerencial || false,
  );
  const [monedaId, setMonedaId] = useState(defaultValues?.monedaId || null);
  const [esContado, setEsContado] = useState(defaultValues?.esContado || false);
  const [estadoId, setEstadoId] = useState(defaultValues?.estadoId || 100);
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || "",
  );

  // Estados impuestos SUNAT - TOTALES (calculados desde pagos)
  const [tieneDetraccion, setTieneDetraccion] = useState(
    defaultValues?.tieneDetraccion || false,
  );
  const [montoDetraccionTotal, setMontoDetraccionTotal] = useState(
    defaultValues?.montoDetraccionTotal || 0,
  );
  const [tieneRetencion, setTieneRetencion] = useState(
    defaultValues?.tieneRetencion || false,
  );
  const [montoRetencionTotal, setMontoRetencionTotal] = useState(
    defaultValues?.montoRetencionTotal || 0,
  );
  const [porcentajeRetencion, setPorcentajeRetencion] = useState(
    defaultValues?.porcentajeRetencion || null,
  );
  const [tienePercepcion, setTienePercepcion] = useState(
    defaultValues?.tienePercepcion || false,
  );
  const [montoPercepcionTotal, setMontoPercepcionTotal] = useState(
    defaultValues?.montoPercepcionTotal || 0,
  );

  // Estados contabilidad y auditoría
  const [fechaContable, setFechaContable] = useState(
    defaultValues?.fechaContable
      ? new Date(defaultValues.fechaContable)
      : new Date(),
  );
  const [periodoContableId, setPeriodoContableId] = useState(
    defaultValues?.periodoContableId
      ? Number(defaultValues.periodoContableId)
      : null,
  );
  const [creadoPor, setCreadoPor] = useState(defaultValues?.creadoPor || null);
  const [actualizadoPor, setActualizadoPor] = useState(
    defaultValues?.actualizadoPor || null,
  );
  const [fechaCreacion, setFechaCreacion] = useState(
    defaultValues?.fechaCreacion ? new Date(defaultValues.fechaCreacion) : null,
  );
  const [fechaActualizacion, setFechaActualizacion] = useState(
    defaultValues?.fechaActualizacion
      ? new Date(defaultValues.fechaActualizacion)
      : null,
  );

  // Estados para CRUD de pagos
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isEditPago, setIsEditPago] = useState(false);

  // Cargar pagos si es edición
  useEffect(() => {
    if (isEdit && defaultValues?.id) {
      cargarPagos();
    }
  }, [isEdit, defaultValues?.id]);

  // Helper para obtener color de fondo según moneda
  const getColorPorMoneda = () => {
    if (!monedaId) return "#fff3cd";
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaId));
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    switch (codigoMoneda) {
      case "USD":
        return "#d4edda";
      case "PEN":
        return "#fff3cd";
      case "EUR":
        return "#e3f2fd";
      default:
        return "#f8f9fa";
    }
  };

  const getColorPorMonedaPago = (monedaPagoId) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaPagoId));
    const codigoMoneda = moneda?.codigoSunat || "PEN";

    switch (codigoMoneda) {
      case "USD":
        return "#d4edda";
      case "PEN":
        return "#fff3cd";
      case "EUR":
        return "#e3f2fd";
      default:
        return "#f8f9fa";
    }
  };

  // Recalcular montoPagado, saldoPendiente y totales de impuestos cuando cambien los pagos
  useEffect(() => {
    const totalPagado = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoAplicadoDeuda || 0),
      0,
    );
    const totalDetraccion = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoDetraccion || 0),
      0,
    );
    const totalRetencion = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoRetencion || 0),
      0,
    );
    const totalPercepcion = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoPercepcion || 0),
      0,
    );

    setMontoPagado(totalPagado);
    setSaldoPendiente(Number(montoTotal) - totalPagado);
    setMontoDetraccionTotal(totalDetraccion);
    setMontoRetencionTotal(totalRetencion);
    setMontoPercepcionTotal(totalPercepcion);

    setTieneDetraccion(totalDetraccion > 0);
    setTieneRetencion(totalRetencion > 0);
    setTienePercepcion(totalPercepcion > 0);
  }, [pagos, montoTotal]);

  const cargarPagos = async () => {
    try {
      setLoadingPagos(true);
      const data = await getPagosByCuentaPorPagar(defaultValues.id);
      setPagos(data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los pagos",
        life: 3000,
      });
    } finally {
      setLoadingPagos(false);
    }
  };


  /**
   * Recarga la cuenta por pagar completa desde el backend
   * Esto asegura que los valores mostrados estén sincronizados
   */
  const recargarCuentaDesdeBackend = async () => {
    if (!isEdit || !defaultValues?.id) return;

    try {
      const cuentaActualizada = await getCuentaPorPagarById(defaultValues.id);

      // Actualizar todos los campos con los valores del backend
      setMontoTotal(cuentaActualizada.montoTotal || 0);
      setMontoPagado(cuentaActualizada.montoPagado || 0);
      setSaldoPendiente(cuentaActualizada.saldoPendiente || 0);
      setMontoDetraccionTotal(cuentaActualizada.montoDetraccionTotal || 0);
      setMontoRetencionTotal(cuentaActualizada.montoRetencionTotal || 0);
      setMontoPercepcionTotal(cuentaActualizada.montoPercepcionTotal || 0);
      setTieneDetraccion(cuentaActualizada.tieneDetraccion || false);
      setTieneRetencion(cuentaActualizada.tieneRetencion || false);
      setTienePercepcion(cuentaActualizada.tienePercepcion || false);
      setEstadoId(cuentaActualizada.estadoId || 100);

      console.log("✅ Cuenta recargada desde backend:", {
        montoPagado: cuentaActualizada.montoPagado,
        saldoPendiente: cuentaActualizada.saldoPendiente,
      });
    } catch (error) {
      console.error("❌ Error al recargar cuenta desde backend:", error);
    }
  };

  // Exponer funciones al componente padre mediante ref
  useImperativeHandle(ref, () => ({
    recargarCuentaDesdeBackend
  }));

  const handleSubmit = () => {
    const data = {
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : null,
      empresaId: Number(empresaId),
      proveedorId: Number(proveedorId),
      numeroOrdenCompra,
      fechaEmision,
      fechaVencimiento,
      montoTotal: Number(montoTotal),
      montoPagado: Number(montoPagado),
      saldoPendiente: Number(saldoPendiente),
      esSaldoInicial,
      esGerencial,
      monedaId: Number(monedaId),
      esContado,
      estadoId: Number(estadoId),
      observaciones,
      tieneDetraccion,
      montoDetraccionTotal: Number(montoDetraccionTotal),
      tieneRetencion,
      montoRetencionTotal: Number(montoRetencionTotal),
      porcentajeRetencion: porcentajeRetencion
        ? Number(porcentajeRetencion)
        : null,
      tienePercepcion,
      montoPercepcionTotal: Number(montoPercepcionTotal),
      fechaContable,
      periodoContableId: periodoContableId ? Number(periodoContableId) : null,
      creadoPor: isEdit
        ? creadoPor
        : usuario?.personalId
          ? Number(usuario.personalId)
          : null,
      actualizadoPor:
        isEdit && usuario?.personalId ? Number(usuario.personalId) : null,
    };
    onSubmit(data);
  };

  const handleRegistrarPago = () => {
    setPagoSeleccionado(null);
    setIsEditPago(false);
    setShowPagoDialog(true);
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    setIsEditPago(true);
    setShowPagoDialog(true);
  };

  const handleEliminarPago = (pago) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPagado, 2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deletePagoCuentaPorPagar(pago.id);
          toast?.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pago eliminado correctamente",
            life: 3000,
          });
          await cargarPagos();
          await recargarCuentaDesdeBackend();
        } catch (error) {
          console.error("Error al eliminar pago:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.mensaje || "No se pudo eliminar el pago",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSubmitPago = async (dataPago) => {
    try {
      if (isEditPago) {
        await updatePagoCuentaPorPagar(pagoSeleccionado.id, dataPago);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorPagar({
          ...dataPago,
          cuentaPorPagarId: Number(defaultValues.id),
        });
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }
      setShowPagoDialog(false);
      await cargarPagos();
      await recargarCuentaDesdeBackend();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "No se pudo guardar el pago",
        life: 3000,
      });
    }
  };

  // Templates para DataTable
  const montoTemplate = (rowData) => {
    const moneda = monedas?.find(
      (m) => Number(m.id) === Number(rowData.monedaPagoId),
    );
    const codigo = moneda?.codigoSunat || "PEN";
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {formatearNumero(rowData.montoPagado, 2)}
      </span>
    );
  };

  const monedaPagoTemplate = (rowData) => {
    const moneda = monedas?.find(
      (m) => Number(m.id) === Number(rowData.monedaPagoId),
    );
    const codigo = moneda?.codigoSunat || "-";
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {codigo}
      </span>
    );
  };

  const monedaDeudaTemplate = (rowData) => {
    const moneda = monedas?.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );
    const codigo = moneda?.codigoSunat || "-";
    return (
      <span
        style={{
          backgroundColor: getColorPorMoneda(),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {codigo}
      </span>
    );
  };

  const cuentaCorrienteTemplate = (rowData) => {
    if (!rowData.cuentaBancariaId) return "-";
    const cuenta = cuentasCorrientes?.find(
      (c) => Number(c.id) === Number(rowData.cuentaBancariaId),
    );
    return cuenta?.numeroCuenta || "-";
  };

  const montoAplicadoTemplate = (rowData) => {
    return (
      <span
        style={{
          backgroundColor: getColorPorMoneda(),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {formatearNumero(rowData.montoAplicadoDeuda || rowData.montoPagado, 2)}
      </span>
    );
  };

  const fechaTemplate = (rowData) => {
    return formatearFecha(rowData.fechaPago);
  };

  const medioPagoTemplate = (rowData) => {
    const medio = mediosPago?.find(
      (m) => Number(m.id) === Number(rowData.medioPagoId),
    );
    return medio?.descripcion || "-";
  };

  const bancoTemplate = (rowData) => {
    if (!rowData.bancoId) return "-";
    const banco = bancos?.find((b) => Number(b.id) === Number(rowData.bancoId));
    return banco?.nombre || "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => handleEditarPago(rowData)}
          tooltip="Ver detalle"
          disabled={readOnly || !permisos.puedeEditar}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleEliminarPago(rowData)}
          tooltip="Eliminar"
          disabled={readOnly || !permisos.puedeEliminar}
        />
      </div>
    );
  };

  // Preparar options
  const empresasOptions =
    empresas?.map((e) => ({
      label: e.razonSocial,
      value: Number(e.id),
    })) || [];

  const proveedoresOptions =
    proveedores?.map((p) => ({
      label: p.razonSocial,
      value: Number(p.id),
    })) || [];

  const monedasOptions =
    monedas?.map((m) => ({
      label: m.codigoSunat,
      value: Number(m.id),
    })) || [];

  const estadosOptions =
    estados?.map((e) => ({
      label: e.descripcion,
      value: Number(e.id),
    })) || [];

  const puedeEditar = !readOnly && !loading;

  return (
    <div className="p-fluid">
      <ConfirmDialog />

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <div className="p-fluid">
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaId">Empresa *</label>
                <Dropdown
                  id="empresaId"
                  value={empresaId}
                  options={empresasOptions}
                  onChange={(e) => setEmpresaId(e.value)}
                  placeholder="Seleccione empresa"
                  disabled={!puedeEditar || isEdit}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="proveedorId">Proveedor *</label>
                <Dropdown
                  id="proveedorId"
                  value={proveedorId}
                  options={proveedoresOptions}
                  onChange={(e) => setProveedorId(e.value)}
                  placeholder="Seleccione proveedor"
                  disabled={!puedeEditar || isEdit}
                  filter
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="tipoDoc">Tipo Documento</label>
                <InputText
                  id="tipoDoc"
                  value={esSaldoInicial ? "SI-CXP" : "ORDEN COMPRA"}
                  disabled
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="numeroOrdenCompra">Documento *</label>
                <InputText
                  id="numeroOrdenCompra"
                  value={numeroOrdenCompra}
                  onChange={(e) => setNumeroOrdenCompra(e.target.value)}
                  disabled={!puedeEditar}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label htmlFor="origen">Origen Orden Compra</label>
                <InputText
                  id="origen"
                  value={ordenCompraId ? `OC-${ordenCompraId}` : "Sin Orden Compra"}
                  disabled
                />
              </div>
            </div>





            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 0.7, color: "blue" }}>
                <label htmlFor="fechaEmision">Fecha Emisión *</label>
                <Calendar
                  id="fechaEmision"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>

              <div style={{ flex: 0.7, color: "red" }}>
                <label htmlFor="fechaVencimiento">Fecha Vence *</label>
                <Calendar
                  id="fechaVencimiento"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 0.7, color: "green" }}>
                <label htmlFor="fechaContable">Fecha Contable *</label>
                <Calendar
                  id="fechaContable"
                  value={fechaContable}
                  onChange={(e) => setFechaContable(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 1, color: "green" }}>
                <label htmlFor="periodoContableId">Periodo Contable</label>
                <Dropdown
                  id="periodoContableId"
                  value={periodoContableId}
                  options={
                    periodosContables
                      ?.filter((p) => {
                        return Number(p.empresaId) === Number(empresaId);
                      })
                      .sort((a, b) => {
                        return (
                          new Date(b.fechaInicio) - new Date(a.fechaInicio)
                        );
                      })
                      .map((p) => {
                        let estadoLabel = "";
                        const estadoId = Number(p.estadoId);

                        if (estadoId === 73) {
                          estadoLabel = "🟢 ABIERTO";
                        } else if (estadoId === 74) {
                          estadoLabel = "🔴 CERRADO";
                        } else if (estadoId === 75) {
                          estadoLabel = "🔒 BLOQUEADO";
                        } else {
                          estadoLabel =
                            p.estado?.descripcion || "⚪ SIN ESTADO";
                        }

                        return {
                          label: `${p.nombrePeriodo} - ${estadoLabel}`,
                          value: Number(p.id),
                          estadoId: estadoId,
                          disabled: estadoId !== 73 && !isEdit,
                        };
                      }) || []
                  }
                  onChange={(e) => setPeriodoContableId(e.value)}
                  placeholder="Seleccione periodo contable"
                  showClear
                  filter
                  optionDisabled="disabled"
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId">Moneda *</label>
                <Dropdown
                  id="monedaId"
                  value={monedaId}
                  options={monedasOptions}
                  onChange={(e) => setMonedaId(e.value)}
                  placeholder="Seleccione moneda"
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="estadoId">Estado *</label>
                <Dropdown
                  id="estadoId"
                  value={estadoId}
                  options={estadosOptions}
                  onChange={(e) => setEstadoId(e.value)}
                  placeholder="Seleccione estado"
                  disabled
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          {/* PAGOS REALIZADOS */}
          {isEdit && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginTop: 10,
                  padding: 5,
                  alignItems: "end",
                  backgroundColor: "#f0f8ff",
                  borderRadius: 8,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 0.5 }}>
                  <label style={{ opacity: 0 }}>.</label>
                  <Button
                    label="Pago"
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={handleRegistrarPago}
                    disabled={readOnly || !permisos.puedeEditar || loadingPagos}
                    style={{ width: "100%", fontWeight: "bold" }}
                    tooltip={"Registrar un Nuevo Pago"}
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label>Detracción</label>
                  <InputNumber
                    value={montoDetraccionTotal}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontSize: getResponsiveFontSize(),
                      width: "100%",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label>% Retención</label>
                  <InputNumber
                    value={porcentajeRetencion}
                    onValueChange={(e) => setPorcentajeRetencion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    suffix="%"
                    inputStyle={{
                      fontSize: getResponsiveFontSize(),
                      width: "100%",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label>Retención</label>
                  <InputNumber
                    value={montoRetencionTotal}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontSize: getResponsiveFontSize(),
                      width: "100%",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>

                <div style={{ flex: 0.5 }}>
                  <label>Percepción</label>
                  <InputNumber
                    value={montoPercepcionTotal}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontSize: getResponsiveFontSize(),
                      width: "100%",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
                <div style={{ flex: 1, color: "blue" }}>
                  <label htmlFor="montoTotal">Monto Total *</label>
                  <InputNumber
                    id="montoTotal"
                    value={montoTotal}
                    onValueChange={(e) => setMontoTotal(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontWeight: "bold",
                      width: "100%",
                      textAlign: "right",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
                <div style={{ flex: 1, color: "blue" }}>
                  <label htmlFor="montoPagado">Monto Pagado</label>
                  <InputNumber
                    id="montoPagado"
                    value={montoPagado}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontWeight: "bold",
                      width: "100%",
                      textAlign: "right",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
                <div style={{ flex: 1, color: "blue" }}>
                  <label htmlFor="saldoPendiente">Saldo Pendiente</label>
                  <InputNumber
                    id="saldoPendiente"
                    value={saldoPendiente}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    inputStyle={{
                      fontWeight: "bold",
                      width: "100%",
                      textAlign: "right",
                      backgroundColor: getColorPorMoneda(),
                    }}
                  />
                </div>
              </div>
              <DataTable
                value={pagos}
                showGridlines
                stripedRows
                loading={loadingPagos}
                emptyMessage="No hay pagos registrados"
                size="small"
                style={{ fontSize: getResponsiveFontSize() }}
              >
                <Column
                  field="fechaPago"
                  header="Fecha Pago"
                  body={fechaTemplate}
                  style={{ width: "120px" }}
                />
                <Column
                  header="Monto Pagado"
                  body={montoTemplate}
                  style={{ width: "120px", textAlign: "right" }}
                />
                <Column
                  header="Moneda Pago"
                  body={monedaPagoTemplate}
                  style={{ width: "100px" }}
                />
                <Column
                  header="Moneda Deuda"
                  body={monedaDeudaTemplate}
                  style={{ width: "100px" }}
                />
                <Column
                  header="Medio Pago"
                  body={medioPagoTemplate}
                  style={{ width: "150px" }}
                />
                <Column
                  header="Cuenta Corriente"
                  body={cuentaCorrienteTemplate}
                  style={{ width: "150px" }}
                />
                <Column
                  header="Monto Aplicado"
                  body={montoAplicadoTemplate}
                  style={{ width: "120px", textAlign: "right" }}
                />
                <Column
                  field="numeroOperacion"
                  header="N° Operación"
                  style={{ width: "150px" }}
                />
                <Column
                  header="Banco"
                  body={bancoTemplate}
                  style={{ width: "150px" }}
                />
                <Column
                  header="Acciones"
                  body={accionesTemplate}
                  style={{ width: "100px" }}
                />
              </DataTable>
            </div>
          )}
          <Panel header="Información Adicional" toggleable collapsed>
            {isEdit && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  padding: 15,
                  backgroundColor: "#e9ecef",
                  borderRadius: 8,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label>Creado Por</label>
                  <InputText
                    value={creadoPor ? `Usuario ID: ${creadoPor}` : "N/A"}
                    disabled
                    style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Fecha Creación</label>
                  <Calendar
                    value={fechaCreacion}
                    disabled
                    showTime
                    dateFormat="dd/mm/yy"
                    style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Actualizado Por</label>
                  <InputText
                    value={
                      actualizadoPor ? `Usuario ID: ${actualizadoPor}` : "N/A"
                    }
                    disabled
                    style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Fecha Actualización</label>
                  <Calendar
                    value={fechaActualizacion}
                    disabled
                    showTime
                    dateFormat="dd/mm/yy"
                    style={{ fontSize: getResponsiveFontSize(), width: "100%" }}
                  />
                </div>
              </div>
            )}

            <div className="grid mb-3">
              <div className="col-12">
                <label htmlFor="observaciones">Observaciones</label>
                <InputTextarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  disabled={!puedeEditar}
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </Panel>
        </TabPanel>

        {/* TAB 2: ASIENTO CONTABLE */}
        {isEdit && (
          <TabPanel header="Asiento Contable" leftIcon="pi pi-book">
            <CardAsientoContable
              asientoContableId={defaultValues?.asientoContableId}
              onGenerarAsiento={() => onGenerarAsiento(defaultValues)}
              permisos={permisos}
              loading={loading}
              tituloCard="Asiento Contable"
            />
          </TabPanel>
        )}
      </TabView>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          type="submit"
          loading={loading}
          disabled={!puedeEditar}
          onClick={handleSubmit}
          className="p-button-success"
          severity="success"
          raised
        />
      </div>

      {/* DIALOG PARA REGISTRAR/EDITAR PAGO */}
      <Dialog
        header={isEditPago ? "Editar Pago" : "Registrar Pago"}
        visible={showPagoDialog}
        style={{ width: "1300px" }}
        onHide={() => setShowPagoDialog(false)}
        modal
      >
        <PagoCuentaPorPagarForm
          isEdit={isEditPago}
          defaultValues={{
            ...pagoSeleccionado,
            cuentaPorPagarId: defaultValues.id,
          }}
          cuentasPorPagar={[defaultValues]}
          empresaIdCuenta={defaultValues.empresaId}
          proveedorIdCuenta={defaultValues.proveedorId}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          estados={estados}
          periodosContables={periodosContables}
          toast={toast}
          onSubmit={handleSubmitPago}
          onCancel={() => setShowPagoDialog(false)}
          loading={false}
          readOnly={false}
          hideCuentaField={true}
        />
      </Dialog>
    </div>
  );
});

export default CuentaPorPagarForm;