// src/components/cuentaPorCobrar/CuentaPorCobrarForm.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getResponsiveFontSize } from "../../utils/utils";

export default function CuentaPorCobrarForm({
  isEdit,
  defaultValues,
  empresas,
  clientes,
  monedas,
  estados,
  preFacturas,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
  permisos = {},
}) {
  const [preFacturaId, setPreFacturaId] = useState(
    defaultValues?.preFacturaId || null,
  );
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId || null);
  const [clienteId, setClienteId] = useState(defaultValues?.clienteId || null);
  const [numeroPreFactura, setNumeroPreFactura] = useState(
    defaultValues?.numeroPreFactura || "",
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
  const [estadoId, setEstadoId] = useState(defaultValues?.estadoId || null);
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || "",
  );

  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [preFacturasFiltradas, setPreFacturasFiltradas] = useState([]);
  const [selectedPreFactura, setSelectedPreFactura] = useState(null);

  useEffect(() => {
    if (preFacturas && preFacturas.length > 0 && empresaId) {
      const preFacturasPendientes = preFacturas.filter((pf) => {
        const tieneSaldoPendiente =
          pf.saldoPendiente && Number(pf.saldoPendiente) > 0;
        const perteneceEmpresa = Number(pf.empresaId) === Number(empresaId);
        return tieneSaldoPendiente && perteneceEmpresa;
      });

      const clientesConDocumentosPendientes = clientes.filter((c) => {
        const tieneDocumentosPendientes = preFacturasPendientes.some(
          (pf) => Number(pf.clienteId) === Number(c.id),
        );
        const perteneceEmpresa = Number(c.empresaId) === Number(empresaId);
        return tieneDocumentosPendientes && perteneceEmpresa;
      });

      setClientesFiltrados(clientesConDocumentosPendientes);
    } else {
      setClientesFiltrados([]);
    }
  }, [clientes, preFacturas, empresaId]);

  useEffect(() => {
    if (preFacturas && preFacturas.length > 0 && clienteId && empresaId) {
      const preFacturasPorCliente = preFacturas.filter((pf) => {
        const perteneceCliente = Number(pf.clienteId) === Number(clienteId);
        const perteneceEmpresa = Number(pf.empresaId) === Number(empresaId);
        const tieneSaldoPendiente =
          pf.saldoPendiente && Number(pf.saldoPendiente) > 0;
        return perteneceCliente && perteneceEmpresa && tieneSaldoPendiente;
      });
      setPreFacturasFiltradas(preFacturasPorCliente);
    } else {
      setPreFacturasFiltradas([]);
    }
  }, [preFacturas, clienteId, empresaId]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setPreFacturaId(
        defaultValues.preFacturaId ? Number(defaultValues.preFacturaId) : null,
      );
      setEmpresaId(
        defaultValues.empresaId ? Number(defaultValues.empresaId) : null,
      );
      setClienteId(
        defaultValues.clienteId ? Number(defaultValues.clienteId) : null,
      );
      setNumeroPreFactura(defaultValues.numeroPreFactura || "");
      setFechaEmision(
        defaultValues.fechaEmision
          ? new Date(defaultValues.fechaEmision)
          : new Date(),
      );
      setFechaVencimiento(
        defaultValues.fechaVencimiento
          ? new Date(defaultValues.fechaVencimiento)
          : new Date(),
      );
      setMontoTotal(defaultValues.montoTotal || 0);
      setMontoPagado(defaultValues.montoPagado || 0);
      setSaldoPendiente(defaultValues.saldoPendiente || 0);
      setEsSaldoInicial(defaultValues.esSaldoInicial || false);
      setEsGerencial(defaultValues.esGerencial || false);
      setMonedaId(
        defaultValues.monedaId ? Number(defaultValues.monedaId) : null,
      );
      setEsContado(defaultValues.esContado || false);
      setEstadoId(
        defaultValues.estadoId ? Number(defaultValues.estadoId) : null,
      );
      setObservaciones(defaultValues.observaciones || "");
    }
  }, [defaultValues]);

  useEffect(() => {
    const saldo = Number(montoTotal) - Number(montoPagado);
    setSaldoPendiente(saldo);
  }, [montoTotal, montoPagado]);

  const handleEmpresaChange = (value) => {
    setEmpresaId(value);
    setClienteId(null);
    setPreFacturaId(null);
    setSelectedPreFactura(null);
    setPreFacturasFiltradas([]);
  };

  const handleClienteChange = (value) => {
    setClienteId(value);
    setPreFacturaId(null);
    setSelectedPreFactura(null);
  };

  const handleSeleccionarPreFactura = (preFactura) => {
    setSelectedPreFactura(preFactura);
    setPreFacturaId(Number(preFactura.id));
    setNumeroPreFactura(
      preFactura.numeroDocumento || preFactura.codigo || `PF-${preFactura.id}`,
    );
    setFechaEmision(
      preFactura.fechaEmision ? new Date(preFactura.fechaEmision) : new Date(),
    );
    setFechaVencimiento(
      preFactura.fechaVencimiento
        ? new Date(preFactura.fechaVencimiento)
        : new Date(),
    );
    setMontoTotal(Number(preFactura.montoTotal || 0));
    setMontoPagado(Number(preFactura.montoPagado || 0));
    setSaldoPendiente(Number(preFactura.saldoPendiente || 0));
    setMonedaId(
      preFactura.monedaId ? Number(preFactura.monedaId) : monedaId,
    );
  };

  const handleSubmit = () => {
    const dataParaGrabacion = {
      preFacturaId: preFacturaId ? Number(preFacturaId) : null,
      empresaId: empresaId ? Number(empresaId) : null,
      clienteId: clienteId ? Number(clienteId) : null,
      numeroPreFactura,
      fechaEmision,
      fechaVencimiento,
      montoTotal: Number(montoTotal),
      montoPagado: Number(montoPagado),
      saldoPendiente: Number(saldoPendiente),
      esSaldoInicial,
      esGerencial,
      monedaId: monedaId ? Number(monedaId) : null,
      esContado,
      estadoId: estadoId ? Number(estadoId) : null,
      observaciones,
    };

    if (!dataParaGrabacion.empresaId || !dataParaGrabacion.clienteId) {
      alert("Complete los campos obligatorios (Empresa, Cliente)");
      return;
    }

    if (!dataParaGrabacion.monedaId || !dataParaGrabacion.estadoId) {
      alert("Complete los campos obligatorios (Moneda, Estado)");
      return;
    }

    onSubmit(dataParaGrabacion);
  };

  const formatCurrency = (value, monedaId) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaId));
    const simbolo = moneda?.simbolo || "";
    return `${simbolo} ${Number(value || 0).toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleDateString("es-PE");
  };

  const puedeEditar = !readOnly && !loading;
  return (
    <div className="p-fluid">
      <Panel header="Datos de la Cuenta por Cobrar" className="mb-3">
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            alignItems: "end",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
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
              onChange={(e) => handleEmpresaChange(e.value)}
              placeholder="Seleccionar empresa"
              disabled={isEdit || !puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="clienteId"
            >
              Cliente* (Solo clientes con documentos pendientes)
            </label>
            <Dropdown
              id="clienteId"
              value={clienteId}
              options={clientesFiltrados.map((c) => ({
                label: c.razonSocial,
                value: Number(c.id),
              }))}
              onChange={(e) => handleClienteChange(e.value)}
              placeholder="Seleccionar cliente"
              filter
              disabled={!empresaId || !puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
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
                estados?.map((e) => ({
                  label: e.nombre,
                  value: Number(e.id),
                })) || []
              }
              onChange={(e) => setEstadoId(e.value)}
              placeholder="Estado"
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <Button
              id="esGerencial"
              label={esGerencial ? "GERENCIAL" : "GERENCIAL"}
              icon={esGerencial ? "pi pi-check-circle" : "pi pi-times-circle"}
              severity={esGerencial ? "success" : "secondary"}
              onClick={() => setEsGerencial(!esGerencial)}
              disabled={!puedeEditar}
            />
          </div>
        </div>

        {clienteId && preFacturasFiltradas.length > 0 && (
          <Panel
            header="PreFacturas Pendientes de Pago"
            className="mb-3"
            toggleable
            collapsed={false}
          >
            <DataTable
              value={preFacturasFiltradas}
              selection={selectedPreFactura}
              onSelectionChange={(e) => handleSeleccionarPreFactura(e.value)}
              selectionMode="single"
              dataKey="id"
              paginator
              rows={5}
              style={{ fontSize: "12px" }}
              emptyMessage="No hay prefacturas pendientes"
            >
              <Column
                selectionMode="single"
                headerStyle={{ width: "3rem" }}
              ></Column>
              <Column
                field="numeroDocumento"
                header="Número"
                body={(rowData) =>
                  rowData.numeroDocumento ||
                  rowData.codigo ||
                  `PF-${rowData.id}`
                }
                style={{ fontWeight: "bold" }}
              ></Column>
              <Column
                field="fechaEmision"
                header="Fecha Emisión"
                body={(rowData) => formatDate(rowData.fechaEmision)}
              ></Column>
              <Column
                field="monedaId"
                header="Moneda"
                body={(rowData) => {
                  const moneda = monedas?.find(
                    (m) => Number(m.id) === Number(rowData.monedaId),
                  );
                  return moneda?.codigoSunat || "";
                }}
              ></Column>
              <Column
                field="montoTotal"
                header="Monto Total"
                body={(rowData) =>
                  formatCurrency(rowData.montoTotal, rowData.monedaId)
                }
                style={{ textAlign: "right", fontWeight: "bold" }}
              ></Column>
              <Column
                field="saldoPendiente"
                header="Saldo Pendiente"
                body={(rowData) =>
                  formatCurrency(rowData.saldoPendiente, rowData.monedaId)
                }
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  color: "#d32f2f",
                }}
              ></Column>
            </DataTable>
          </Panel>
        )}

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
            <Button
              id="esSaldoInicial"
              label={esSaldoInicial ? "SALDO INICIAL" : "SALDO INICIAL"}
              icon={
                esSaldoInicial ? "pi pi-check-circle" : "pi pi-times-circle"
              }
              severity={esSaldoInicial ? "warning" : "secondary"}
              onClick={() => setEsSaldoInicial(!esSaldoInicial)}
              disabled={!puedeEditar}
              style={{
                whiteSpace: "nowrap",
                fontWeight: "bold",
                justifyContent: "center",
              }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="preFacturaId"
            >
              PreFactura (Opcional)
            </label>
            <Dropdown
              id="preFacturaId"
              value={preFacturaId}
              options={preFacturas.map((pf) => ({
                label: pf.codigo || pf.numeroDocumento || `PF-${pf.id}`,
                value: Number(pf.id),
              }))}
              onChange={(e) => setPreFacturaId(e.value)}
              placeholder="Seleccionar PreFactura"
              filter
              showClear
              disabled={isEdit || !puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="numeroPreFactura"
            >
              Número PreFactura*
            </label>
            <InputText
              id="numeroPreFactura"
              value={numeroPreFactura}
              onChange={(e) => setNumeroPreFactura(e.target.value)}
              placeholder="Ej: PF-2024-000001"
              disabled={!puedeEditar}
              style={{ fontWeight: "bold", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ flex: 0.7 }}>
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
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 0.7 }}>
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
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <Button
              id="esContado"
              label={esContado ? "CONTADO" : "CRÉDITO"}
              icon={esContado ? "pi pi-check-circle" : "pi pi-times-circle"}
              severity={esContado ? "info" : "secondary"}
              onClick={() => setEsContado(!esContado)}
              disabled={!puedeEditar}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
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
              style={{ fontWeight: "bold" }}
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
              style={{ fontWeight: "bold" }}
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
              style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        ></div>

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
            placeholder="Observaciones adicionales..."
            disabled={!puedeEditar}
            style={{ fontWeight: "normal" }}
          />
        </div>
      </Panel>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
          type="button"
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={loading}
          disabled={!puedeEditar}
          type="button"
        />
      </div>
    </div>
  );
}