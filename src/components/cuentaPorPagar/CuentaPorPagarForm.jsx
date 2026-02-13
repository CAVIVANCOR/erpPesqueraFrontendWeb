// src/components/cuentaPorPagar/CuentaPorPagarForm.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { getResponsiveFontSize } from "../../utils/utils";

export default function CuentaPorPagarForm({
  isEdit,
  defaultValues,
  empresas,
  proveedores,
  monedas,
  estados,
  ordenesCompra,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
  permisos = {},
}) {
  // Estados del formulario
  const [ordenCompraId, setOrdenCompraId] = useState(
    defaultValues?.ordenCompraId || null
  );
  const [empresaId, setEmpresaId] = useState(
    defaultValues?.empresaId || null
  );
  const [proveedorId, setProveedorId] = useState(
    defaultValues?.proveedorId || null
  );
  const [numeroOrdenCompra, setNumeroOrdenCompra] = useState(
    defaultValues?.numeroOrdenCompra || ""
  );
  const [fechaEmision, setFechaEmision] = useState(
    defaultValues?.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date()
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(
    defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : new Date()
  );
  const [numeroFacturaProveedor, setNumeroFacturaProveedor] = useState(
    defaultValues?.numeroFacturaProveedor || ""
  );
  const [fechaFacturaProveedor, setFechaFacturaProveedor] = useState(
    defaultValues?.fechaFacturaProveedor
      ? new Date(defaultValues.fechaFacturaProveedor)
      : null
  );
  const [montoTotal, setMontoTotal] = useState(
    defaultValues?.montoTotal || 0
  );
  const [montoPagado, setMontoPagado] = useState(
    defaultValues?.montoPagado || 0
  );
  const [saldoPendiente, setSaldoPendiente] = useState(
    defaultValues?.saldoPendiente || 0
  );
  const [esSaldoInicial, setEsSaldoInicial] = useState(
    defaultValues?.esSaldoInicial || false
  );
  const [esGerencial, setEsGerencial] = useState(
    defaultValues?.esGerencial || false
  );
  const [monedaId, setMonedaId] = useState(
    defaultValues?.monedaId || null
  );
  const [esContado, setEsContado] = useState(
    defaultValues?.esContado || false
  );
  const [estadoId, setEstadoId] = useState(
    defaultValues?.estadoId || null
  );
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || ""
  );
    // Nuevos estados para detracción, retención y percepción
  const [tieneDetraccion, setTieneDetraccion] = useState(
    defaultValues?.tieneDetraccion || false
  );
  const [montoDetraccion, setMontoDetraccion] = useState(
    defaultValues?.montoDetraccion || 0
  );
  const [porcentajeDetraccion, setPorcentajeDetraccion] = useState(
    defaultValues?.porcentajeDetraccion || 0
  );
  const [numeroConstanciaDetraccion, setNumeroConstanciaDetraccion] = useState(
    defaultValues?.numeroConstanciaDetraccion || ""
  );
  const [fechaDetraccion, setFechaDetraccion] = useState(
    defaultValues?.fechaDetraccion ? new Date(defaultValues.fechaDetraccion) : null
  );

  const [tieneRetencion, setTieneRetencion] = useState(
    defaultValues?.tieneRetencion || false
  );
  const [montoRetencion, setMontoRetencion] = useState(
    defaultValues?.montoRetencion || 0
  );
  const [numeroComprobanteRetencion, setNumeroComprobanteRetencion] = useState(
    defaultValues?.numeroComprobanteRetencion || ""
  );
  const [fechaRetencion, setFechaRetencion] = useState(
    defaultValues?.fechaRetencion ? new Date(defaultValues.fechaRetencion) : null
  );

  const [tienePercepcion, setTienePercepcion] = useState(
    defaultValues?.tienePercepcion || false
  );
  const [montoPercepcion, setMontoPercepcion] = useState(
    defaultValues?.montoPercepcion || 0
  );
  const [porcentajePercepcion, setPorcentajePercepcion] = useState(
    defaultValues?.porcentajePercepcion || 0
  );
  const [numeroComprobantePercepcion, setNumeroComprobantePercepcion] = useState(
    defaultValues?.numeroComprobantePercepcion || ""
  );
  const [fechaPercepcion, setFechaPercepcion] = useState(
    defaultValues?.fechaPercepcion ? new Date(defaultValues.fechaPercepcion) : null
  );

  // Filtrar proveedores por empresa
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);

  useEffect(() => {
    if (proveedores && proveedores.length > 0 && empresaId) {
      const proveedoresPorEmpresa = proveedores.filter(
        (p) => Number(p.empresaId) === Number(empresaId)
      );
      setProveedoresFiltrados(proveedoresPorEmpresa);
    } else {
      setProveedoresFiltrados([]);
    }
  }, [proveedores, empresaId]);

  // Actualizar estados cuando cambian los defaultValues
    useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setOrdenCompraId(
        defaultValues.ordenCompraId ? Number(defaultValues.ordenCompraId) : null
      );
      setEmpresaId(
        defaultValues.empresaId ? Number(defaultValues.empresaId) : null
      );
      setProveedorId(
        defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null
      );
      setNumeroOrdenCompra(defaultValues.numeroOrdenCompra || "");
      setFechaEmision(
        defaultValues.fechaEmision
          ? new Date(defaultValues.fechaEmision)
          : new Date()
      );
      setFechaVencimiento(
        defaultValues.fechaVencimiento
          ? new Date(defaultValues.fechaVencimiento)
          : new Date()
      );
      setNumeroFacturaProveedor(defaultValues.numeroFacturaProveedor || "");
      setFechaFacturaProveedor(
        defaultValues.fechaFacturaProveedor
          ? new Date(defaultValues.fechaFacturaProveedor)
          : null
      );
      setMontoTotal(defaultValues.montoTotal || 0);
      setMontoPagado(defaultValues.montoPagado || 0);
      setSaldoPendiente(defaultValues.saldoPendiente || 0);
      setEsSaldoInicial(defaultValues.esSaldoInicial || false);
      setEsGerencial(defaultValues.esGerencial || false);
      setMonedaId(
        defaultValues.monedaId ? Number(defaultValues.monedaId) : null
      );
      setEsContado(defaultValues.esContado || false);
      setEstadoId(
        defaultValues.estadoId ? Number(defaultValues.estadoId) : null
      );
      setObservaciones(defaultValues.observaciones || "");
      
      // Nuevos campos
      setTieneDetraccion(defaultValues.tieneDetraccion || false);
      setMontoDetraccion(defaultValues.montoDetraccion || 0);
      setPorcentajeDetraccion(defaultValues.porcentajeDetraccion || 0);
      setNumeroConstanciaDetraccion(defaultValues.numeroConstanciaDetraccion || "");
      setFechaDetraccion(
        defaultValues.fechaDetraccion ? new Date(defaultValues.fechaDetraccion) : null
      );
      
      setTieneRetencion(defaultValues.tieneRetencion || false);
      setMontoRetencion(defaultValues.montoRetencion || 0);
      setNumeroComprobanteRetencion(defaultValues.numeroComprobanteRetencion || "");
      setFechaRetencion(
        defaultValues.fechaRetencion ? new Date(defaultValues.fechaRetencion) : null
      );
      
      setTienePercepcion(defaultValues.tienePercepcion || false);
      setMontoPercepcion(defaultValues.montoPercepcion || 0);
      setPorcentajePercepcion(defaultValues.porcentajePercepcion || 0);
      setNumeroComprobantePercepcion(defaultValues.numeroComprobantePercepcion || "");
      setFechaPercepcion(
        defaultValues.fechaPercepcion ? new Date(defaultValues.fechaPercepcion) : null
      );
    }
  }, [defaultValues]);

  // Calcular saldo pendiente automáticamente
  useEffect(() => {
    const saldo = Number(montoTotal) - Number(montoPagado);
    setSaldoPendiente(saldo);
  }, [montoTotal, montoPagado]);

    const handleSubmit = () => {
    const dataParaGrabacion = {
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : null,
      empresaId: empresaId ? Number(empresaId) : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      numeroOrdenCompra,
      fechaEmision,
      fechaVencimiento,
      numeroFacturaProveedor,
      fechaFacturaProveedor,
      montoTotal: Number(montoTotal),
      montoPagado: Number(montoPagado),
      saldoPendiente: Number(saldoPendiente),
      esSaldoInicial,
      esGerencial,
      monedaId: monedaId ? Number(monedaId) : null,
      esContado,
      estadoId: estadoId ? Number(estadoId) : null,
      observaciones,
      
      // Nuevos campos
      tieneDetraccion,
      montoDetraccion: Number(montoDetraccion),
      porcentajeDetraccion: porcentajeDetraccion ? Number(porcentajeDetraccion) : null,
      numeroConstanciaDetraccion,
      fechaDetraccion,
      
      tieneRetencion,
      montoRetencion: Number(montoRetencion),
      numeroComprobanteRetencion,
      fechaRetencion,
      
      tienePercepcion,
      montoPercepcion: Number(montoPercepcion),
      porcentajePercepcion: porcentajePercepcion ? Number(porcentajePercepcion) : null,
      numeroComprobantePercepcion,
      fechaPercepcion,
    };

    if (!dataParaGrabacion.empresaId || !dataParaGrabacion.proveedorId) {
      alert("Complete los campos obligatorios (Empresa, Proveedor)");
      return;
    }

    if (!dataParaGrabacion.monedaId || !dataParaGrabacion.estadoId) {
      alert("Complete los campos obligatorios (Moneda, Estado)");
      return;
    }

    onSubmit(dataParaGrabacion);
  };

  const puedeEditar = !readOnly && !loading;

  return (
    <div className="p-fluid">
      <Panel header="Datos de la Cuenta por Pagar" className="mb-3">
        {/* FILA 1: Empresa, Proveedor, Moneda */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="empresaId"
            >
              Empresa*
            </label>
            <Dropdown
              id="empresaId"
              value={empresaId}
              options={empresas.map((e) => ({
                label: e.razonSocial,
                value: Number(e.id),
              }))}
              onChange={(e) => setEmpresaId(e.value)}
              placeholder="Seleccionar empresa"
              disabled={isEdit || !puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="proveedorId"
            >
              Proveedor*
            </label>
            <Dropdown
              id="proveedorId"
              value={proveedorId}
              options={proveedoresFiltrados.map((p) => ({
                label: p.razonSocial,
                value: Number(p.id),
              }))}
              onChange={(e) => setProveedorId(e.value)}
              placeholder="Seleccionar proveedor"
              filter
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 0.75 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="monedaId"
            >
              Moneda*
            </label>
            <Dropdown
              id="monedaId"
              value={monedaId}
              options={
                monedas?.map((m) => ({
                  label: m.codigoSunat,
                  value: Number(m.id),
                })) || []
              }
              onChange={(e) => setMonedaId(e.value)}
              placeholder="Moneda"
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* FILA 2: Número OC, Número Factura, Orden Compra */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroOrdenCompra"
            >
              Número Orden Compra*
            </label>
            <InputText
              id="numeroOrdenCompra"
              value={numeroOrdenCompra}
              onChange={(e) => setNumeroOrdenCompra(e.target.value)}
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroFacturaProveedor"
            >
              Número Factura Proveedor
            </label>
            <InputText
              id="numeroFacturaProveedor"
              value={numeroFacturaProveedor}
              onChange={(e) => setNumeroFacturaProveedor(e.target.value)}
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="ordenCompraId"
            >
              Orden de Compra (Opcional)
            </label>
            <Dropdown
              id="ordenCompraId"
              value={ordenCompraId}
              options={
                ordenesCompra?.map((oc) => ({
                  label: oc.numeroDocumento,
                  value: Number(oc.id),
                })) || []
              }
              onChange={(e) => setOrdenCompraId(e.value)}
              placeholder="Seleccionar OC"
              showClear
              filter
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* FILA 3: Fechas */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaEmision"
            >
              Fecha Emisión*
            </label>
            <Calendar
              id="fechaEmision"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditar}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaVencimiento"
            >
              Fecha Vencimiento*
            </label>
            <Calendar
              id="fechaVencimiento"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={!puedeEditar}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaFacturaProveedor"
            >
              Fecha Factura Proveedor
            </label>
            <Calendar
              id="fechaFacturaProveedor"
              value={fechaFacturaProveedor}
              onChange={(e) => setFechaFacturaProveedor(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              showButtonBar
              disabled={!puedeEditar}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>

        {/* FILA 4: Montos */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="montoTotal"
            >
              Monto Total*
            </label>
            <InputNumber
              id="montoTotal"
              value={montoTotal}
              onValueChange={(e) => setMontoTotal(e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={!puedeEditar}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="montoPagado"
            >
              Monto Pagado
            </label>
            <InputNumber
              id="montoPagado"
              value={montoPagado}
              onValueChange={(e) => setMontoPagado(e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={!puedeEditar}
              inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="saldoPendiente"
            >
              Saldo Pendiente
            </label>
            <InputNumber
              id="saldoPendiente"
              value={saldoPendiente}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                textTransform: "uppercase",
                backgroundColor: "#f0f0f0",
              }}
            />
          </div>
        </div>

        {/* FILA 5: Checkboxes y Estado */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esGerencial"
            >
              Es Gerencial (Negra)
            </label>
            <Button
              id="esGerencial"
              label={esGerencial ? "SÍ" : "NO"}
              icon={esGerencial ? "pi pi-check-circle" : "pi pi-times-circle"}
              severity={esGerencial ? "success" : "danger"}
              onClick={() => setEsGerencial(!esGerencial)}
              disabled={!puedeEditar}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>

          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esContado"
            >
              Es Contado
            </label>
            <Button
              id="esContado"
              label={esContado ? "SÍ" : "NO"}
              icon={esContado ? "pi pi-check-circle" : "pi pi-times-circle"}
              severity={esContado ? "info" : "secondary"}
              onClick={() => setEsContado(!esContado)}
              disabled={!puedeEditar}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>

          <div style={{ flex: 0.5 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="esSaldoInicial"
            >
              Es Saldo Inicial
            </label>
            <Button
              id="esSaldoInicial"
              label={esSaldoInicial ? "SÍ" : "NO"}
              icon={
                esSaldoInicial ? "pi pi-check-circle" : "pi pi-times-circle"
              }
              severity={esSaldoInicial ? "warning" : "secondary"}
              onClick={() => setEsSaldoInicial(!esSaldoInicial)}
              disabled={!puedeEditar}
              outlined
              style={{
                width: "100%",
                fontWeight: "bold",
                justifyContent: "center",
                color: "#000",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="estadoId"
            >
              Estado*
            </label>
                        <Dropdown
              id="estadoId"
              value={estadoId}
              options={
                estados
                  ?.filter((e) => Number(e.tipoProvieneDeId) === 25)
                  .map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  })) || []
              }
              onChange={(e) => setEstadoId(e.value)}
              placeholder="Seleccionar estado"
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
        </div>
        {/* PANEL DE IMPUESTOS SUNAT */}
        <Panel header="Impuestos SUNAT" className="mb-3" toggleable collapsed={true}>
          {/* DETRACCIÓN */}
          <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f9f9f9", borderRadius: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Checkbox
                inputId="tieneDetraccion"
                checked={tieneDetraccion}
                onChange={(e) => setTieneDetraccion(e.checked)}
                disabled={!puedeEditar}
              />
              <label htmlFor="tieneDetraccion" style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                Tiene Detracción SPOT (Yo detraigo al proveedor)
              </label>
            </div>
            
            {tieneDetraccion && (
              <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Monto Detracción
                  </label>
                  <InputNumber
                    value={montoDetraccion}
                    onValueChange={(e) => setMontoDetraccion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    % Detracción
                  </label>
                  <InputNumber
                    value={porcentajeDetraccion}
                    onValueChange={(e) => setPorcentajeDetraccion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix="%"
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    N° Constancia
                  </label>
                  <InputText
                    value={numeroConstanciaDetraccion}
                    onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                    disabled={!puedeEditar}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>
                <div style={{ flex: 0.7 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Fecha Detracción
                  </label>
                  <Calendar
                    value={fechaDetraccion}
                    onChange={(e) => setFechaDetraccion(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RETENCIÓN */}
          <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f9f9f9", borderRadius: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Checkbox
                inputId="tieneRetencion"
                checked={tieneRetencion}
                onChange={(e) => setTieneRetencion(e.checked)}
                disabled={!puedeEditar}
              />
              <label htmlFor="tieneRetencion" style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                Tiene Retención (Yo retengo al proveedor 3% IGV)
              </label>
            </div>
            
            {tieneRetencion && (
              <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Monto Retención
                  </label>
                  <InputNumber
                    value={montoRetencion}
                    onValueChange={(e) => setMontoRetencion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    N° Comprobante
                  </label>
                  <InputText
                    value={numeroComprobanteRetencion}
                    onChange={(e) => setNumeroComprobanteRetencion(e.target.value)}
                    disabled={!puedeEditar}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>
                <div style={{ flex: 0.7 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Fecha Retención
                  </label>
                  <Calendar
                    value={fechaRetencion}
                    onChange={(e) => setFechaRetencion(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* PERCEPCIÓN */}
          <div style={{ marginBottom: 15, padding: 10, backgroundColor: "#f9f9f9", borderRadius: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Checkbox
                inputId="tienePercepcion"
                checked={tienePercepcion}
                onChange={(e) => setTienePercepcion(e.checked)}
                disabled={!puedeEditar}
              />
              <label htmlFor="tienePercepcion" style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                Tiene Percepción (Proveedor me cobra adicional)
              </label>
            </div>
            
            {tienePercepcion && (
              <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Monto Percepción
                  </label>
                  <InputNumber
                    value={montoPercepcion}
                    onValueChange={(e) => setMontoPercepcion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    % Percepción
                  </label>
                  <InputNumber
                    value={porcentajePercepcion}
                    onValueChange={(e) => setPorcentajePercepcion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix="%"
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    N° Comprobante
                  </label>
                  <InputText
                    value={numeroComprobantePercepcion}
                    onChange={(e) => setNumeroComprobantePercepcion(e.target.value)}
                    disabled={!puedeEditar}
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>
                <div style={{ flex: 0.7 }}>
                  <label style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}>
                    Fecha Percepción
                  </label>
                  <Calendar
                    value={fechaPercepcion}
                    onChange={(e) => setFechaPercepcion(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                    disabled={!puedeEditar}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                </div>
              </div>
            )}
          </div>
        </Panel>
        {/* FILA 6: Observaciones */}
        <div style={{ marginBottom: 15 }}>
          <label
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            htmlFor="observaciones"
          >
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            disabled={!puedeEditar}
            style={{
              color: "red",
              fontStyle: "italic",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
      </Panel>

      {/* BOTONES */}
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
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-save"
          onClick={handleSubmit}
          disabled={readOnly || loading || !puedeEditar}
          tooltip={
            readOnly
              ? "Modo solo lectura"
              : !puedeEditar
              ? "No se puede editar"
              : ""
          }
        />
      </div>
    </div>
  );
}
