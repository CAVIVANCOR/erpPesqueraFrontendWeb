// src/components/tesoreria/PrestamoBancarioForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import {
  createPrestamoBancario,
  updatePrestamoBancario,
} from "../../api/tesoreria/prestamoBancarios";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import {
  TIPOS_PRESTAMO,
  TIPOS_TASA,
  FRECUENCIAS_PAGO,
  TIPOS_AMORTIZACION,
} from "../../utils/tesoreriaConstants";

export default function PrestamoBancarioForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    numeroPrestamo: defaultValues?.numeroPrestamo || "",
    tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
    descripcion: defaultValues?.descripcion || "",
    fechaContrato: defaultValues?.fechaContrato ? new Date(defaultValues.fechaContrato) : null,
    fechaDesembolso: defaultValues?.fechaDesembolso ? new Date(defaultValues.fechaDesembolso) : null,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    montoAprobado: defaultValues?.montoAprobado || 0,
    montoDesembolsado: defaultValues?.montoDesembolsado || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaInteres: defaultValues?.tasaInteres || 0,
    tasaMoratoria: defaultValues?.tasaMoratoria || null,
    tipoTasa: defaultValues?.tipoTasa || "EFECTIVA_ANUAL",
    frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
    tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
    plazoMeses: defaultValues?.plazoMeses || 12,
    numeroCuotas: defaultValues?.numeroCuotas || 12,
    periodoGracia: defaultValues?.periodoGracia || null,
    comisionApertura: defaultValues?.comisionApertura || null,
    comisionPeriodica: defaultValues?.comisionPeriodica || null,
    seguroDesgravamen: defaultValues?.seguroDesgravamen || null,
    cuentaCorrienteId: defaultValues?.cuentaCorrienteId ? Number(defaultValues.cuentaCorrienteId) : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [empresasData, bancosData, monedasData, cuentasData, estadosData] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncionPorTipoProviene(21),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setCuentasCorrientes(cuentasData);
      setEstados(estadosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        numeroPrestamo: defaultValues?.numeroPrestamo || "",
        tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
        descripcion: defaultValues?.descripcion || "",
        fechaContrato: defaultValues?.fechaContrato ? new Date(defaultValues.fechaContrato) : null,
        fechaDesembolso: defaultValues?.fechaDesembolso ? new Date(defaultValues.fechaDesembolso) : null,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoDesembolsado: defaultValues?.montoDesembolsado || 0,
        monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
        tasaInteres: defaultValues?.tasaInteres || 0,
        tasaMoratoria: defaultValues?.tasaMoratoria || null,
        tipoTasa: defaultValues?.tipoTasa || "EFECTIVA_ANUAL",
        frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
        tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
        plazoMeses: defaultValues?.plazoMeses || 12,
        numeroCuotas: defaultValues?.numeroCuotas || 12,
        periodoGracia: defaultValues?.periodoGracia || null,
        comisionApertura: defaultValues?.comisionApertura || null,
        comisionPeriodica: defaultValues?.comisionPeriodica || null,
        seguroDesgravamen: defaultValues?.seguroDesgravamen || null,
        cuentaCorrienteId: defaultValues?.cuentaCorrienteId ? Number(defaultValues.cuentaCorrienteId) : null,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
        observaciones: defaultValues?.observaciones || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      bancoId: Number(formData.bancoId),
      numeroPrestamo: formData.numeroPrestamo.trim().toUpperCase(),
      tipoPrestamo: formData.tipoPrestamo,
      descripcion: formData.descripcion?.trim().toUpperCase() || null,
      fechaContrato: formData.fechaContrato,
      fechaDesembolso: formData.fechaDesembolso || null,
      fechaVencimiento: formData.fechaVencimiento,
      montoAprobado: Number(formData.montoAprobado),
      montoDesembolsado: Number(formData.montoDesembolsado),
      monedaId: Number(formData.monedaId),
      tasaInteres: Number(formData.tasaInteres),
      tasaMoratoria: formData.tasaMoratoria ? Number(formData.tasaMoratoria) : null,
      tipoTasa: formData.tipoTasa,
      frecuenciaPago: formData.frecuenciaPago,
      tipoAmortizacion: formData.tipoAmortizacion,
      plazoMeses: Number(formData.plazoMeses),
      numeroCuotas: Number(formData.numeroCuotas),
      periodoGracia: formData.periodoGracia ? Number(formData.periodoGracia) : null,
      comisionApertura: formData.comisionApertura ? Number(formData.comisionApertura) : null,
      comisionPeriodica: formData.comisionPeriodica ? Number(formData.comisionPeriodica) : null,
      seguroDesgravamen: formData.seguroDesgravamen ? Number(formData.seguroDesgravamen) : null,
      cuentaCorrienteId: formData.cuentaCorrienteId ? Number(formData.cuentaCorrienteId) : null,
      estadoId: Number(formData.estadoId),
      observaciones: formData.observaciones?.trim().toUpperCase() || null,
    };

    if (isEdit && defaultValues) {
      await updatePrestamoBancario(defaultValues.id, dataToSend);
    } else {
      await createPrestamoBancario(dataToSend);
    }

    await onSubmit(dataToSend);
  };

  if (cargandoDatos) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const bancosOptions = bancos.map((b) => ({
    label: b.nombreBanco,
    value: Number(b.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: `${m.codigoSunat} - ${m.nombreLargo || m.simbolo}`,
    value: Number(m.id),
  }));

  const cuentasOptions = cuentasCorrientes.map((c) => ({
    label: `${c.numeroCuenta} - ${c.banco?.nombreBanco || 'N/A'} - ${c.moneda?.codigoSunat || 'N/A'}`,
    value: Number(c.id),
  }));

  const estadosOptions = estados.map((e) => ({
    label: e.estado,
    value: Number(e.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      {/* FILA 1: Empresa, Banco, Número Préstamo, Estado */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
            Empresa *
          </label>
          <Dropdown
            id="empresaId"
            value={formData.empresaId}
            options={empresasOptions}
            onChange={(e) => handleChange("empresaId", e.value)}
            placeholder="Seleccionar empresa"
            disabled={readOnly}
            required
            filter
            filterBy="label"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="bancoId" style={{ fontWeight: "bold" }}>
            Banco *
          </label>
          <Dropdown
            id="bancoId"
            value={formData.bancoId}
            options={bancosOptions}
            onChange={(e) => handleChange("bancoId", e.value)}
            placeholder="Seleccionar banco"
            disabled={readOnly}
            required
            filter
            filterBy="label"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroPrestamo" style={{ fontWeight: "bold" }}>
            Número de Préstamo *
          </label>
          <InputText
            id="numeroPrestamo"
            value={formData.numeroPrestamo}
            onChange={(e) => handleChange("numeroPrestamo", e.target.value.toUpperCase())}
            placeholder="Ej: PREST-2025-001"
            disabled={readOnly}
            required
            maxLength={50}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId}
            options={estadosOptions}
            onChange={(e) => handleChange("estadoId", e.value)}
            placeholder="Seleccionar estado"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* FILA 2: Tipo Préstamo, Tipo Amortización, Frecuencia Pago */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoPrestamo" style={{ fontWeight: "bold" }}>
            Tipo de Préstamo *
          </label>
          <Dropdown
            id="tipoPrestamo"
            value={formData.tipoPrestamo}
            options={TIPOS_PRESTAMO}
            onChange={(e) => handleChange("tipoPrestamo", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoAmortizacion" style={{ fontWeight: "bold" }}>
            Tipo de Amortización *
          </label>
          <Dropdown
            id="tipoAmortizacion"
            value={formData.tipoAmortizacion}
            options={TIPOS_AMORTIZACION}
            onChange={(e) => handleChange("tipoAmortizacion", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="frecuenciaPago" style={{ fontWeight: "bold" }}>
            Frecuencia de Pago *
          </label>
          <Dropdown
            id="frecuenciaPago"
            value={formData.frecuenciaPago}
            options={FRECUENCIAS_PAGO}
            onChange={(e) => handleChange("frecuenciaPago", e.value)}
            placeholder="Seleccionar frecuencia"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* FILA 3: Descripción */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcion" style={{ fontWeight: "bold" }}>
            Descripción *
          </label>
          <InputTextarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value.toUpperCase())}
            placeholder="Descripción del préstamo"
            disabled={readOnly}
            required
            rows={2}
          />
        </div>
      </div>

      {/* FILA 4: Fechas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaContrato" style={{ fontWeight: "bold" }}>
            Fecha de Contrato *
          </label>
          <Calendar
            id="fechaContrato"
            value={formData.fechaContrato}
            onChange={(e) => handleChange("fechaContrato", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            required
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDesembolso" style={{ fontWeight: "bold" }}>
            Fecha de Desembolso
          </label>
          <Calendar
            id="fechaDesembolso"
            value={formData.fechaDesembolso}
            onChange={(e) => handleChange("fechaDesembolso", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha de Vencimiento *
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            required
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
      </div>

      {/* FILA 5: Montos y Moneda */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="montoAprobado" style={{ fontWeight: "bold" }}>
            Monto Aprobado *
          </label>
          <InputNumber
            id="montoAprobado"
            value={formData.montoAprobado}
            onValueChange={(e) => handleChange("montoAprobado", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoDesembolsado" style={{ fontWeight: "bold" }}>
            Monto Desembolsado *
          </label>
          <InputNumber
            id="montoDesembolsado"
            value={formData.montoDesembolsado}
            onValueChange={(e) => handleChange("montoDesembolsado", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
            Moneda *
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId}
            options={monedasOptions}
            onChange={(e) => handleChange("monedaId", e.value)}
            placeholder="Seleccionar moneda"
            disabled={readOnly}
            required
            filter
            filterBy="label"
          />
        </div>
      </div>

      {/* FILA 6: Tasas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaInteres" style={{ fontWeight: "bold" }}>
            Tasa de Interés (%) *
          </label>
          <InputNumber
            id="tasaInteres"
            value={formData.tasaInteres}
            onValueChange={(e) => handleChange("tasaInteres", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoTasa" style={{ fontWeight: "bold" }}>
            Tipo de Tasa *
          </label>
          <Dropdown
            id="tipoTasa"
            value={formData.tipoTasa}
            options={TIPOS_TASA}
            onChange={(e) => handleChange("tipoTasa", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaMoratoria" style={{ fontWeight: "bold" }}>
            Tasa Moratoria (%)
          </label>
          <InputNumber
            id="tasaMoratoria"
            value={formData.tasaMoratoria}
            onValueChange={(e) => handleChange("tasaMoratoria", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 7: Plazo y Cuotas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="plazoMeses" style={{ fontWeight: "bold" }}>
            Plazo (Meses) *
          </label>
          <InputNumber
            id="plazoMeses"
            value={formData.plazoMeses}
            onValueChange={(e) => handleChange("plazoMeses", e.value)}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuotas" style={{ fontWeight: "bold" }}>
            Número de Cuotas *
          </label>
          <InputNumber
            id="numeroCuotas"
            value={formData.numeroCuotas}
            onValueChange={(e) => handleChange("numeroCuotas", e.value)}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="periodoGracia" style={{ fontWeight: "bold" }}>
            Período de Gracia (Meses)
          </label>
          <InputNumber
            id="periodoGracia"
            value={formData.periodoGracia}
            onValueChange={(e) => handleChange("periodoGracia", e.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 8: Comisiones y Seguros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="comisionApertura" style={{ fontWeight: "bold" }}>
            Comisión de Apertura
          </label>
          <InputNumber
            id="comisionApertura"
            value={formData.comisionApertura}
            onValueChange={(e) => handleChange("comisionApertura", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="comisionPeriodica" style={{ fontWeight: "bold" }}>
            Comisión Periódica
          </label>
          <InputNumber
            id="comisionPeriodica"
            value={formData.comisionPeriodica}
            onValueChange={(e) => handleChange("comisionPeriodica", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="seguroDesgravamen" style={{ fontWeight: "bold" }}>
            Seguro de Desgravamen
          </label>
          <InputNumber
            id="seguroDesgravamen"
            value={formData.seguroDesgravamen}
            onValueChange={(e) => handleChange("seguroDesgravamen", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 9: Cuenta Corriente */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaCorrienteId" style={{ fontWeight: "bold" }}>
            Cuenta Corriente
          </label>
          <Dropdown
            id="cuentaCorrienteId"
            value={formData.cuentaCorrienteId}
            options={cuentasOptions}
            onChange={(e) => handleChange("cuentaCorrienteId", e.value)}
            placeholder="Seleccionar cuenta"
            disabled={readOnly}
            showClear
            filter
            filterBy="label"
          />
        </div>
      </div>

      {/* FILA 10: Observaciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value.toUpperCase())}
            placeholder="Observaciones adicionales"
            disabled={readOnly}
            rows={3}
          />
        </div>
      </div>

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
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          type="submit"
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
}