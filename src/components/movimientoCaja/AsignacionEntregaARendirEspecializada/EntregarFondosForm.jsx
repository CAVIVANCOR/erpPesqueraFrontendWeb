import React, { useState, useEffect, useMemo, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { formatearNumero } from "../../../utils/utils";
import { getGastosPlanificados } from "../../../api/detGastosPlanificados";
import { consultarTipoCambioSunat } from "../../../api/consultaExterna";
import { actualizarUrlVoucherIndividual } from "../../../api/tesoreria/transferencias";
import { actualizarUrlComprobanteAsignacion } from "../../../api/tesoreria/entregaFondos";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import ModuloDocumentoSelector from "../../common/ModuloDocumentoSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import ActivoSelector from "../../common/ActivoSelector";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import { generarYSubirVoucherIndividual } from "../utils/VoucherIndividualMovimientoPDF";
import ConfirmacionTransferenciaDialog from "../transferenciaEspecializada/ConfirmacionTransferenciaDialog";

const EntregarFondosForm = ({
  asignacion,
  cuentasCorrientes = [],
  mediosPago = [],
  tiposMovimiento = [],
  monedas = [],
  empresas = [],
  onSubmit,
  onCancel,
  loading = false,
  toast,
}) => {
  const usuario = useAuthStore((state) => state.usuario);
  const ultimaConsultaTC = useRef(null);

  // Solo identifica módulo/documento de origen para el selector de solo lectura
  const [formData, setFormData] = useState({
    moduloOrigenId: null,
    documentoOrigenId: null,
  });
  const [errors] = useState({});
  const [gastosPlanificados, setGastosPlanificados] = useState([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  // Datos de la entrega (mismos nombres y semántica que TransferenciaInternaDialog, lado EGRESO)
  const [fechaEntrega, setFechaEntrega] = useState(new Date());
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esGerencial, setEsGerencial] = useState(false);
  const [cuentaOrigenId, setCuentaOrigenId] = useState(null);
  const [monedaOrigenSelector, setMonedaOrigenSelector] = useState(null);
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [numeroCheque, setNumeroCheque] = useState("");
  const [itfOrigen, setItfOrigen] = useState(0);
  const [comisionOrigen, setComisionOrigen] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(1);

  const [procesando, setProcesando] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoEntrega, setResultadoEntrega] = useState(null);

  // La entrega es siempre por el monto total asignado (el backend lo exige)
  const montoAsignado = Number(asignacion?.montoTotal || asignacion?.monto || 0);
  const esMonedaNacional = asignacion?.moneda?.codigoSunat === "PEN";
  const simbolo = asignacion?.moneda?.simbolo || "";
  const cargando = loading || procesando;

  const cuentaOrigen =
    cuentasCorrientes.find((c) => Number(c.id) === Number(cuentaOrigenId)) || null;

  const esCheque = useMemo(() => {
    if (!medioPagoId || !mediosPago.length) return false;
    const medioPago = mediosPago.find((m) => Number(m.id) === Number(medioPagoId));
    return medioPago?.nombre?.toUpperCase().includes("CHEQUE") || false;
  }, [medioPagoId, mediosPago]);

  const totalDebitado =
    Number(montoAsignado) + Number(itfOrigen || 0) + Number(comisionOrigen || 0);

  // Inicializar datos de la asignación y cargar gastos planificados
  useEffect(() => {
    if (!asignacion) return;

    const moduloOrigenId = asignacion.moduloOrigen?.id
      ? Number(asignacion.moduloOrigen.id)
      : asignacion.moduloOrigenId
        ? Number(asignacion.moduloOrigenId)
        : null;

    const documentoOrigenId = asignacion.documentoOrigenId
      ? Number(asignacion.documentoOrigenId)
      : null;

    setFormData({ moduloOrigenId, documentoOrigenId });
    setDescripcion(
      `ENTREGA A RENDIR ER-${asignacion.origenId} - ${asignacion.entidadComercial?.razonSocial || ""}`.trim(),
    );
    cargarGastosPlanificados(asignacion.origenId);
  }, [asignacion]);

  // Cargar gastos planificados
  const cargarGastosPlanificados = async (detMovsEntregaRendirId) => {
    if (detMovsEntregaRendirId && detMovsEntregaRendirId > 0) {
      try {
        setLoadingGastos(true);
        const gastos = await getGastosPlanificados({
          detMovEntregaRendirTemporadaPescaId: detMovsEntregaRendirId,
        });
        setGastosPlanificados(gastos);
      } catch (error) {
        console.error("Error al cargar gastos planificados:", error);
        setGastosPlanificados([]);
      } finally {
        setLoadingGastos(false);
      }
    } else {
      setGastosPlanificados([]);
    }
  };

  // Tipo de cambio SUNAT: solo aplica si la asignación no es en soles.
  // Se usa TC de venta (sell_price), igual que la transferencia, porque alimenta el asiento.
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaEntrega || esMonedaNacional) return;

      const year = fechaEntrega.getFullYear();
      const month = String(fechaEntrega.getMonth() + 1).padStart(2, "0");
      const day = String(fechaEntrega.getDate()).padStart(2, "0");
      const fechaISO = `${year}-${month}-${day}`;

      if (ultimaConsultaTC.current === fechaISO) return;

      try {
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });
        if (tipoCambioData && tipoCambioData.sell_price) {
          const tc = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tc);
          ultimaConsultaTC.current = fechaISO;
          toast?.current?.show({
            severity: "success",
            summary: "✅ Tipo de Cambio Actualizado",
            detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta)`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error al consultar tipo de cambio:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo obtener el tipo de cambio de SUNAT",
          life: 4000,
        });
      }
    };

    consultarTipoCambio();
  }, [fechaEntrega, esMonedaNacional]);

  // Validaciones (mismos criterios y mensajes que TransferenciaInternaDialog, lado EGRESO)
  const validarFormulario = () => {
    const mostrarError = (detail) => {
      toast?.current?.show({ severity: "error", summary: "Error", detail, life: 3000 });
      return false;
    };

    if (!fechaEntrega) return mostrarError("Debe ingresar la fecha de la operación");
    if (!descripcion || descripcion.trim() === "") {
      return mostrarError("Debe ingresar la glosa de la operación");
    }
    if (!numeroOperacion || numeroOperacion.trim() === "") {
      return mostrarError("Debe ingresar el número de operación");
    }
    if (!cuentaOrigenId) return mostrarError("Debe seleccionar la cuenta de origen");
    if (!montoAsignado || montoAsignado <= 0) {
      return mostrarError("El monto a entregar debe ser mayor a cero");
    }
    if (!medioPagoId) return mostrarError("Debe seleccionar el medio de pago");
    if (esCheque && (!numeroCheque || numeroCheque.trim() === "")) {
      return mostrarError("Debe ingresar el número de cheque");
    }
    if (
      monedaOrigenSelector &&
      Number(monedaOrigenSelector.id) !== Number(asignacion?.moneda?.id)
    ) {
      return mostrarError("La moneda de la cuenta no coincide con la de la asignación");
    }
    if (!esMonedaNacional && !(Number(tipoCambio) > 0)) {
      return mostrarError("Debe ingresar un tipo de cambio válido");
    }

    const saldo = Number(cuentaOrigen?.saldoActual ?? cuentaOrigen?.saldo);
    if (cuentaOrigen && !Number.isNaN(saldo) && saldo < totalDebitado) {
      toast?.current?.show({
        severity: "error",
        summary: "Saldo Insuficiente",
        detail: `Saldo disponible: ${simbolo} ${formatearNumero(saldo)}. Requerido: ${simbolo} ${formatearNumero(totalDebitado)}`,
        life: 5000,
      });
      return false;
    }

    return true;
  };

  // Vouchers individuales (egreso, ITF y comisión), mismo mecanismo que la transferencia.
  // Un fallo aquí no interrumpe el flujo: la operación ya está registrada.
  const generarVouchers = async (resultado) => {
    try {
      const movimientos = resultado.movimientos;

      for (const clave of ["egreso", "itfOrigen", "comisionOrigen"]) {
        const movimiento = movimientos[clave];
        if (!movimiento) continue;

        try {
          const empresaMovimiento = empresas.find(
            (e) => Number(e.id) === Number(movimiento.empresaId),
          );
          const voucher = await generarYSubirVoucherIndividual(
            movimiento,
            null,
            empresaMovimiento,
            null,
            usuario,
          );

          if (voucher.success && voucher.urlPdf && voucher.urlPdf.trim() !== "") {
            await actualizarUrlVoucherIndividual(movimiento.id, voucher.urlPdf);
            movimientos[clave].urlOperacionIndividualOperacionCaja = voucher.urlPdf;

            // El comprobante de la asignación es el voucher del egreso principal
            if (clave === "egreso") {
              await actualizarUrlComprobanteAsignacion(asignacion.origenId, voucher.urlPdf);
            }
          }
        } catch (error) {
          console.error(`❌ Error voucher ${clave}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error al generar vouchers:", error);
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La entrega se procesó pero hubo un error al generar algunos vouchers",
        life: 5000,
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setProcesando(true);
    try {
      // El hook useEntregarFondos ejecuta el servicio y ya muestra los errores
      const resultado = await onSubmit({
        detMovsEntregaRendirId: Number(asignacion.origenId),
        cuentaCorrienteOrigenId: Number(cuentaOrigenId),
        medioPagoId: Number(medioPagoId),
        numeroCheque: numeroCheque || null,
        numeroOperacion,
        fechaEntrega: fechaEntrega.toISOString(),
        descripcion,
        itfOrigen: Number(itfOrigen || 0),
        comisionOrigen: Number(comisionOrigen || 0),
        esGerencial: Boolean(esGerencial),
        tipoCambio: esMonedaNacional ? 1 : Number(tipoCambio),
      });

      if (resultado?.data) {
        await generarVouchers(resultado.data);
        setResultadoEntrega(resultado.data);
        setShowConfirmacion(true);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    } finally {
      setProcesando(false);
    }
  };

  // Construir nombre completo del responsable
  const nombreResponsable =
    asignacion?.entidadComercial?.razonSocial || "N/A";

  // Template para monto en tabla de gastos
  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        {rowData.moneda?.simbolo} {formatearNumero(rowData.montoPlanificado)}
      </div>
    );
  };

  // Calcular total de gastos planificados
  const totalGastosPlanificados = gastosPlanificados.reduce(
    (sum, gasto) => sum + Number(gasto.montoPlanificado || 0),
    0
  );

  // Obtener monto solicitado
  const montoSolicitado = Number(asignacion?.montoTotal || asignacion?.monto || 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-fluid">
        {/* SECCIÓN 1: Información de la Asignación */}
        <Panel header="📋 Información de la Asignación" className="mb-3">
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Empresa</label>
              <InputText
                value={asignacion?.empresa?.razonSocial || "N/A"}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">N° Asignación</label>
              <InputText
                value={`ER-${asignacion?.origenId || "N/A"}`}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Fecha Asignación</label>
              <InputText
                value={
                  asignacion?.fechaEmision
                    ? new Date(asignacion.fechaEmision).toLocaleDateString("es-PE")
                    : "N/A"
                }
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
          </div>

          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 3 }}>
              <ModuloDocumentoSelector
                key={`md-${Number(formData.moduloOrigenId || 0)}-${Number(formData.documentoOrigenId || 0)}`}
                value={useMemo(
                  () => ({
                    moduloOrigenId: Number(formData.moduloOrigenId || 0),
                    documentoOrigenId: Number(formData.documentoOrigenId || 0),
                  }),
                  [formData.moduloOrigenId, formData.documentoOrigenId],
                )}
                onChange={() => {}}
                disabled={loading}
                soloLectura={true}
                moduloLabel="Módulo Origen"
                documentoLabel="Documento Origen"
                allowSinModulo={false}
              />
              {(errors.moduloOrigenId || errors.documentoOrigenId) && (
                <small className="p-error">
                  {errors.moduloOrigenId || errors.documentoOrigenId}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Responsable</label>
              <InputText
                value={nombreResponsable}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <TipoMovimientoSelector
                value={Number(asignacion?.tipoMovimiento?.id || 0)}
                tiposMovimiento={tiposMovimiento}
                onChange={() => {}}
                disabled={loading}
                soloLectura={true}
              />
            </div>
          </div>
          <div
            style={{
              alignItems: "start",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {/* Descripción */}
            <div style={{ flex: 3 }}>
              <label className="block mb-2 font-bold">Descripción</label>
              <InputTextarea
                value={asignacion?.descripcion || "N/A"}
                disabled
                rows={1}
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block mb-2 font-bold">Monto Asignado</label>
              <InputText
                value={`${asignacion?.moneda?.simbolo || ""} ${formatearNumero(montoSolicitado)}`}
                disabled
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#f8f9fa",
                  fontSize: "1.1rem",
                  color: "#2196F3",
                }}
              />
            </div>
          </div>
          {asignacion?.embarcacion && (
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div className="col-12" style={{ flex: 1 }}>
                <ActivoSelector
                  value={Number(asignacion.embarcacion.activo?.id || asignacion.embarcacion.id || 0)}
                  onChange={() => {}}
                  disabled={loading}
                  soloLectura={true}
                />
              </div>
            </div>
          )}
        </Panel>

        {/* SECCIÓN 2: Detalle de Gastos Planificados */}
        {gastosPlanificados.length > 0 && (
          <Panel header="📊 Gastos Planificados" className="mb-3">
            <DataTable
              value={gastosPlanificados}
              loading={loadingGastos}
              emptyMessage="No hay gastos planificados registrados"
              size="small"
              stripedRows
              showGridlines
            >
              <Column
                header="#"
                body={(data, options) => options.rowIndex + 1}
                style={{ width: "50px", textAlign: "center" }}
              />
              <Column
                field="producto.descripcionBase"
                header="Concepto (Producto)"
                style={{ minWidth: "250px" }}
              />
              <Column
                field="moneda.codigoSunat"
                header="Moneda"
                style={{ width: "100px", textAlign: "center" }}
              />
              <Column
                header="Monto Planificado"
                body={montoTemplate}
                style={{ width: "150px" }}
              />
              <Column
                field="descripcion"
                header="Descripción"
                style={{ minWidth: "200px" }}
              />
            </DataTable>

            {/* Total */}
            <div className="flex justify-content-end mt-3">
              <div
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                TOTAL: {asignacion?.moneda?.simbolo}{" "}
                {formatearNumero(totalGastosPlanificados)}
              </div>
            </div>
          </Panel>
        )}

        <Divider />

        {/* SECCIÓN 3: Datos de la Entrega (egreso, mismo layout que la transferencia) */}
        <Panel header="💳 Datos de la Entrega">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* DATOS GENERALES */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">Fecha de Entrega *</label>
                <Calendar
                  id="fecha"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación *</label>
                <InputText
                  id="numeroOperacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="Ingrese número de operación"
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="descripcion" className="font-bold">Glosa *</label>
                <InputText
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese glosa de la operación"
                  disabled={cargando}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="font-bold block mb-2">Operación</label>
                <BooleanToggleButton
                  value={esGerencial}
                  onChange={setEsGerencial}
                  labelTrue="GERENCIAL"
                  labelFalse="FISCAL"
                  severityTrue="help"
                  severityFalse="success"
                  icon={esGerencial ? "pi-eye-slash" : "pi-eye"}
                  disabled={cargando}
                />
              </div>
            </div>

            {/* CUENTA ORIGEN */}
            <Panel
              header={
                <div className="flex align-items-center gap-2">
                  <span>📤 Cuenta de Origen (EGRESO)</span>
                </div>
              }
              toggleable
            >
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 5,
                  marginBottom: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="cuentaOrigen" className="font-bold">Cuenta Corriente *</label>
                  <CuentaCorrienteSelector
                    empresaIdPreseleccionada={asignacion?.empresa?.id}
                    value={cuentaOrigenId}
                    onChange={({ cuentaCorrienteId, moneda }) => {
                      setCuentaOrigenId(cuentaCorrienteId);
                      setMonedaOrigenSelector(moneda);
                    }}
                    label=""
                    placeholder="Seleccione cuenta de origen"
                    mostrarSaldo={true}
                    disabled={cargando}
                  />
                </div>
              </div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  marginBottom: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <label htmlFor="medioPagoOrigen" className="font-bold">Medio de Pago *</label>
                  <Dropdown
                    id="medioPagoOrigen"
                    value={medioPagoId}
                    options={mediosPago}
                    onChange={(e) => setMedioPagoId(e.value)}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione medio de pago"
                    disabled={cargando}
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                {esCheque && (
                  <div style={{ flex: 2 }}>
                    <label htmlFor="numeroChequeOrigen" className="font-bold">Nº Cheque *</label>
                    <InputText
                      id="numeroChequeOrigen"
                      value={numeroCheque}
                      onChange={(e) => setNumeroCheque(e.target.value)}
                      placeholder="Ingrese número de cheque"
                      disabled={cargando}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
                <div style={{ flex: 2 }}>
                  <TipoMovimientoSelector
                    tiposMovimiento={tiposMovimiento}
                    value={Number(asignacion?.tipoMovimiento?.id || 0)}
                    onChange={() => {}}
                    esIngreso={false}
                    required={true}
                    soloLectura={true}
                    disabled={cargando}
                  />
                </div>
              </div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="montoOrigen" className="font-bold">
                    Monto ({simbolo}) *
                  </label>
                  <InputNumber
                    id="montoOrigen"
                    value={montoAsignado}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="itfOrigen" className="font-bold">ITF</label>
                  <InputNumber
                    id="itfOrigen"
                    value={itfOrigen}
                    onValueChange={(e) => setItfOrigen(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={cargando}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="comisionOrigen" className="font-bold">Comisión</label>
                  <InputNumber
                    id="comisionOrigen"
                    value={comisionOrigen}
                    onValueChange={(e) => setComisionOrigen(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={cargando}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-bold">Total a Debitar:</span>
                    <Tag severity="danger" style={{ fontSize: "1.2rem", padding: "0.5rem 1rem" }}>
                      {simbolo} {formatearNumero(totalDebitado)}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* TIPO DE CAMBIO: solo si la asignación no es en soles */}
              {!esMonedaNacional && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="tipoCambio" className="font-bold">Tipo de Cambio *</label>
                  <InputNumber
                    id="tipoCambio"
                    value={tipoCambio}
                    onValueChange={(e) => setTipoCambio(e.value)}
                    mode="decimal"
                    minFractionDigits={4}
                    maxFractionDigits={4}
                    disabled={cargando}
                    style={{ width: "100%" }}
                    placeholder="Tipo de cambio SUNAT"
                  />
                  <small className="p-text-secondary">
                    Se aplicará para registrar el asiento en soles
                  </small>
                </div>
              )}
            </Panel>
          </div>
        </Panel>

        {/* Botones */}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            onClick={onCancel}
            type="button"
            disabled={cargando}
          />
          <Button
            label="Entregar Fondos"
            icon="pi pi-check"
            severity="success"
            type="submit"
            loading={cargando}
          />
        </div>
      </form>

      {/* Confirmación de la operación (reutiliza el diálogo de la transferencia) */}
      <ConfirmacionTransferenciaDialog
        visible={showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultadoEntrega(null);
          onCancel(); // Cierra el formulario principal
        }}
        resultadoTransferencia={resultadoEntrega}
        monedas={monedas}
        toast={toast}
      />
    </>
  );
};

export default EntregarFondosForm;