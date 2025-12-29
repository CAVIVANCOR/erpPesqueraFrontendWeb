// src/components/tesoreria/PrestamoBancarioForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import {
  createPrestamoBancario,
  updatePrestamoBancario,
} from "../../api/tesoreria/prestamoBancarios";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getEnumsTesoreria } from "../../api/tesoreria/enumsTesoreria";
import { getAllPrestamoBancario } from "../../api/tesoreria/prestamoBancarios";

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
    cuentaCorrienteId: defaultValues?.cuentaCorrienteId ? Number(defaultValues.cuentaCorrienteId) : null,
    numeroPrestamo: defaultValues?.numeroPrestamo || "",
    numeroContrato: defaultValues?.numeroContrato || "",
    fechaContrato: defaultValues?.fechaContrato ? new Date(defaultValues.fechaContrato) : null,
    fechaDesembolso: defaultValues?.fechaDesembolso ? new Date(defaultValues.fechaDesembolso) : null,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    montoAprobado: defaultValues?.montoAprobado || 0,
    montoDesembolsado: defaultValues?.montoDesembolsado || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaInteresAnual: defaultValues?.tasaInteresAnual || 0,
    tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || null,
    tasaMoratoria: defaultValues?.tasaMoratoria || null,
    comisionInicial: defaultValues?.comisionInicial || null,
    comisionMantenimiento: defaultValues?.comisionMantenimiento || null,
    seguroDesgravamen: defaultValues?.seguroDesgravamen || null,
    plazoMeses: defaultValues?.plazoMeses || 12,
    numeroCuotas: defaultValues?.numeroCuotas || 12,
    frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
    diaPago: defaultValues?.diaPago || null,
    periodoGracia: defaultValues?.periodoGracia || null,
    tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
    tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
    destinoFondos: defaultValues?.destinoFondos || "",
    tipoGarantia: defaultValues?.tipoGarantia || null,
    descripcionGarantia: defaultValues?.descripcionGarantia || "",
    valorGarantia: defaultValues?.valorGarantia || null,
    esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
    prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId ? Number(defaultValues.prestamoRefinanciadoId) : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [todasLasCuentas, setTodasLasCuentas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enums, setEnums] = useState({
    tiposPrestamo: [],
    tiposAmortizacion: [],
    frecuenciasPago: [],
    tiposGarantia: [],
  });
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [
        empresasData,
        bancosData,
        monedasData,
        cuentasData,
        prestamosData,
        estadosData,
        enumsData,
      ] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getAllCuentaCorriente(),
        getAllPrestamoBancario(),
        getEstadosMultiFuncionPorTipoProviene(21),
        getEnumsTesoreria(),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setTodasLasCuentas(cuentasData);
      setPrestamos(prestamosData);
      setEstados(estadosData);
      setEnums(enumsData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (formData.empresaId) {
      const cuentasFiltradas = todasLasCuentas.filter((c) => {
        return Number(c.empresaId) === Number(formData.empresaId);
      });
      setCuentasCorrientes(cuentasFiltradas);
    } else {
      setCuentasCorrientes([]);
    }
  }, [formData.empresaId, todasLasCuentas]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "empresaId") {
        newData.bancoId = null;
        newData.monedaId = null;
        newData.cuentaCorrienteId = null;
      }

      if (field === "bancoId" || field === "monedaId") {
        newData.cuentaCorrienteId = null;
      }

      return newData;
    });
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        cuentaCorrienteId: defaultValues?.cuentaCorrienteId ? Number(defaultValues.cuentaCorrienteId) : null,
        numeroPrestamo: defaultValues?.numeroPrestamo || "",
        numeroContrato: defaultValues?.numeroContrato || "",
        fechaContrato: defaultValues?.fechaContrato ? new Date(defaultValues.fechaContrato) : null,
        fechaDesembolso: defaultValues?.fechaDesembolso ? new Date(defaultValues.fechaDesembolso) : null,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoDesembolsado: defaultValues?.montoDesembolsado || 0,
        monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
        tasaInteresAnual: defaultValues?.tasaInteresAnual || 0,
        tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || null,
        tasaMoratoria: defaultValues?.tasaMoratoria || null,
        comisionInicial: defaultValues?.comisionInicial || null,
        comisionMantenimiento: defaultValues?.comisionMantenimiento || null,
        seguroDesgravamen: defaultValues?.seguroDesgravamen || null,
        plazoMeses: defaultValues?.plazoMeses || 12,
        numeroCuotas: defaultValues?.numeroCuotas || 12,
        frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
        diaPago: defaultValues?.diaPago || null,
        periodoGracia: defaultValues?.periodoGracia || null,
        tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
        tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
        destinoFondos: defaultValues?.destinoFondos || "",
        tipoGarantia: defaultValues?.tipoGarantia || null,
        descripcionGarantia: defaultValues?.descripcionGarantia || "",
        valorGarantia: defaultValues?.valorGarantia || null,
        esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
        prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId ? Number(defaultValues.prestamoRefinanciadoId) : null,
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
      cuentaCorrienteId: formData.cuentaCorrienteId ? Number(formData.cuentaCorrienteId) : null,
      numeroPrestamo: formData.numeroPrestamo.trim().toUpperCase(),
      numeroContrato: formData.numeroContrato?.trim().toUpperCase() || null,
      fechaContrato: formData.fechaContrato,
      fechaDesembolso: formData.fechaDesembolso,
      fechaVencimiento: formData.fechaVencimiento,
      montoAprobado: Number(formData.montoAprobado),
      montoDesembolsado: Number(formData.montoDesembolsado),
      monedaId: Number(formData.monedaId),
      tasaInteresAnual: Number(formData.tasaInteresAnual),
      tasaInteresEfectiva: formData.tasaInteresEfectiva ? Number(formData.tasaInteresEfectiva) : null,
      tasaMoratoria: formData.tasaMoratoria ? Number(formData.tasaMoratoria) : null,
      comisionInicial: formData.comisionInicial ? Number(formData.comisionInicial) : null,
      comisionMantenimiento: formData.comisionMantenimiento ? Number(formData.comisionMantenimiento) : null,
      seguroDesgravamen: formData.seguroDesgravamen ? Number(formData.seguroDesgravamen) : null,
      plazoMeses: Number(formData.plazoMeses),
      numeroCuotas: Number(formData.numeroCuotas),
      frecuenciaPago: formData.frecuenciaPago,
      diaPago: formData.diaPago ? Number(formData.diaPago) : null,
      periodoGracia: formData.periodoGracia ? Number(formData.periodoGracia) : null,
      tipoPrestamo: formData.tipoPrestamo,
      tipoAmortizacion: formData.tipoAmortizacion,
      destinoFondos: formData.destinoFondos?.trim().toUpperCase() || null,
      tipoGarantia: formData.tipoGarantia || null,
      descripcionGarantia: formData.descripcionGarantia?.trim().toUpperCase() || null,
      valorGarantia: formData.valorGarantia ? Number(formData.valorGarantia) : null,
      esRefinanciamiento: formData.esRefinanciamiento,
      prestamoRefinanciadoId: formData.prestamoRefinanciadoId ? Number(formData.prestamoRefinanciadoId) : null,
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
    label: b.nombre,
    value: Number(b.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const cuentasFiltradas = cuentasCorrientes.filter((c) => {
    const coincideBanco = !formData.bancoId || Number(c.bancoId) === Number(formData.bancoId);
    const coincideMoneda = !formData.monedaId || Number(c.monedaId) === Number(formData.monedaId);
    return coincideBanco && coincideMoneda;
  });

  const cuentasOptions = cuentasFiltradas.map((c) => ({
    label: `${c.numeroCuenta} - ${c.banco?.nombre || "N/A"} - ${c.moneda?.codigoSunat || "N/A"}`,
    value: Number(c.id),
  }));

  const prestamosOptions = prestamos
    .filter((p) => Number(p.empresaId) === Number(formData.empresaId))
    .map((p) => ({
      label: `${p.numeroPrestamo} - ${p.banco?.nombre || "N/A"}`,
      value: Number(p.id),
    }));

  const estadosOptions = estados.map((e) => ({
    label: e.descripcion,
    value: Number(e.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      {/* FILA 1: Empresa, Banco, Moneda, Cuenta Corriente, Estado */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>Empresa *</label>
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
        <div style={{ flex: 0.5 }}>
          <label htmlFor="bancoId" style={{ fontWeight: "bold" }}>Banco *</label>
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
        <div style={{ flex: 0.5 }}>
          <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>Moneda *</label>
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
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaCorrienteId" style={{ fontWeight: "bold" }}>
            Cuenta Corriente {formData.empresaId && formData.bancoId && formData.monedaId && `(${cuentasFiltradas.length})`}
          </label>
          <Dropdown
            id="cuentaCorrienteId"
            value={formData.cuentaCorrienteId}
            options={cuentasOptions}
            onChange={(e) => handleChange("cuentaCorrienteId", e.value)}
            placeholder={
              !formData.empresaId
                ? "Seleccione empresa"
                : !formData.bancoId || !formData.monedaId
                ? "Seleccione banco y moneda"
                : "Seleccionar cuenta"
            }
            disabled={readOnly || !formData.empresaId || !formData.bancoId || !formData.monedaId}
            filter
            filterBy="label"
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>Estado *</label>
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

      {/* FILA 2: Número Préstamo, Número Contrato, Tipo Préstamo, Tipo Amortización, Frecuencia Pago */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroPrestamo" style={{ fontWeight: "bold" }}>Número de Préstamo *</label>
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
          <label htmlFor="numeroContrato" style={{ fontWeight: "bold" }}>Número de Contrato</label>
          <InputText
            id="numeroContrato"
            value={formData.numeroContrato}
            onChange={(e) => handleChange("numeroContrato", e.target.value.toUpperCase())}
            placeholder="Número del banco"
            disabled={readOnly}
            maxLength={50}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoPrestamo" style={{ fontWeight: "bold" }}>Tipo de Préstamo *</label>
          <Dropdown
            id="tipoPrestamo"
            value={formData.tipoPrestamo}
            options={enums.tiposPrestamo}
            onChange={(e) => handleChange("tipoPrestamo", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoAmortizacion" style={{ fontWeight: "bold" }}>Tipo de Amortización *</label>
          <Dropdown
            id="tipoAmortizacion"
            value={formData.tipoAmortizacion}
            options={enums.tiposAmortizacion}
            onChange={(e) => handleChange("tipoAmortizacion", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="frecuenciaPago" style={{ fontWeight: "bold" }}>Frecuencia de Pago *</label>
          <Dropdown
            id="frecuenciaPago"
            value={formData.frecuenciaPago}
            options={enums.frecuenciasPago}
            onChange={(e) => handleChange("frecuenciaPago", e.value)}
            placeholder="Seleccionar frecuencia"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* FILA 3: Destino de Fondos */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="destinoFondos" style={{ fontWeight: "bold" }}>Destino de Fondos</label>
          <InputTextarea
            id="destinoFondos"
            value={formData.destinoFondos}
            onChange={(e) => handleChange("destinoFondos", e.target.value.toUpperCase())}
            placeholder="Descripción del destino de los fondos"
            disabled={readOnly}
            rows={2}
          />
        </div>
      </div>

      {/* FILA 4: Fechas y Montos */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaContrato" style={{ fontWeight: "bold" }}>Fecha de Contrato *</label>
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
          <label htmlFor="fechaDesembolso" style={{ fontWeight: "bold" }}>Fecha de Desembolso *</label>
          <Calendar
            id="fechaDesembolso"
            value={formData.fechaDesembolso}
            onChange={(e) => handleChange("fechaDesembolso", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            required
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>Fecha de Vencimiento *</label>
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
        <div style={{ flex: 1 }}>
          <label htmlFor="montoAprobado" style={{ fontWeight: "bold" }}>Monto Aprobado *</label>
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
          <label htmlFor="montoDesembolsado" style={{ fontWeight: "bold" }}>Monto Desembolsado *</label>
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
      </div>

      {/* FILA 5: Tasas */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaInteresAnual" style={{ fontWeight: "bold" }}>Tasa de Interés Anual (%) *</label>
          <InputNumber
            id="tasaInteresAnual"
            value={formData.tasaInteresAnual}
            onValueChange={(e) => handleChange("tasaInteresAnual", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaInteresEfectiva" style={{ fontWeight: "bold" }}>TEA (%)</label>
          <InputNumber
            id="tasaInteresEfectiva"
            value={formData.tasaInteresEfectiva}
            onValueChange={(e) => handleChange("tasaInteresEfectiva", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaMoratoria" style={{ fontWeight: "bold" }}>Tasa Moratoria (%)</label>
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
        <div style={{ flex: 1 }}>
          <label htmlFor="plazoMeses" style={{ fontWeight: "bold" }}>Plazo (Meses) *</label>
          <InputNumber
            id="plazoMeses"
            value={formData.plazoMeses}
            onValueChange={(e) => handleChange("plazoMeses", e.value)}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuotas" style={{ fontWeight: "bold" }}>Número de Cuotas *</label>
          <InputNumber
            id="numeroCuotas"
            value={formData.numeroCuotas}
            onValueChange={(e) => handleChange("numeroCuotas", e.value)}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="diaPago" style={{ fontWeight: "bold" }}>Día de Pago (1-31)</label>
          <InputNumber
            id="diaPago"
            value={formData.diaPago}
            onValueChange={(e) => handleChange("diaPago", e.value)}
            min={1}
            max={31}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="periodoGracia" style={{ fontWeight: "bold" }}>Periodo de Gracia (Meses)</label>
          <InputNumber
            id="periodoGracia"
            value={formData.periodoGracia}
            onValueChange={(e) => handleChange("periodoGracia", e.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 6: Comisiones y Seguros */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="comisionInicial" style={{ fontWeight: "bold" }}>Comisión Inicial</label>
          <InputNumber
            id="comisionInicial"
            value={formData.comisionInicial}
            onValueChange={(e) => handleChange("comisionInicial", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="comisionMantenimiento" style={{ fontWeight: "bold" }}>Comisión Mantenimiento</label>
          <InputNumber
            id="comisionMantenimiento"
            value={formData.comisionMantenimiento}
            onValueChange={(e) => handleChange("comisionMantenimiento", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="seguroDesgravamen" style={{ fontWeight: "bold" }}>Seguro de Desgravamen</label>
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

      {/* FILA 7: Garantías */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoGarantia" style={{ fontWeight: "bold" }}>Tipo de Garantía</label>
          <Dropdown
            id="tipoGarantia"
            value={formData.tipoGarantia}
            options={enums.tiposGarantia}
            onChange={(e) => handleChange("tipoGarantia", e.value)}
            placeholder="Seleccionar tipo"
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="valorGarantia" style={{ fontWeight: "bold" }}>Valor de Garantía</label>
          <InputNumber
            id="valorGarantia"
            value={formData.valorGarantia}
            onValueChange={(e) => handleChange("valorGarantia", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 8: Descripción de Garantía */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcionGarantia" style={{ fontWeight: "bold" }}>Descripción de Garantía</label>
          <InputTextarea
            id="descripcionGarantia"
            value={formData.descripcionGarantia}
            onChange={(e) => handleChange("descripcionGarantia", e.target.value.toUpperCase())}
            placeholder="Descripción detallada de la garantía"
            disabled={readOnly}
            rows={2}
          />
        </div>
      </div>

      {/* FILA 9: Refinanciamiento */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 0.3, display: "flex", alignItems: "center", gap: 10 }}>
          <Checkbox
            inputId="esRefinanciamiento"
            checked={formData.esRefinanciamiento}
            onChange={(e) => handleChange("esRefinanciamiento", e.checked)}
            disabled={readOnly}
          />
          <label htmlFor="esRefinanciamiento" style={{ fontWeight: "bold", margin: 0 }}>
            ¿Es Refinanciamiento?
          </label>
        </div>
        {formData.esRefinanciamiento && (
          <div style={{ flex: 1 }}>
            <label htmlFor="prestamoRefinanciadoId" style={{ fontWeight: "bold" }}>Préstamo Refinanciado</label>
            <Dropdown
              id="prestamoRefinanciadoId"
              value={formData.prestamoRefinanciadoId}
              options={prestamosOptions}
              onChange={(e) => handleChange("prestamoRefinanciadoId", e.value)}
              placeholder="Seleccionar préstamo"
              disabled={readOnly}
              filter
              filterBy="label"
            />
          </div>
        )}
      </div>

      {/* FILA 10: Observaciones */}
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>Observaciones</label>
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

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          className="p-button-text"
          type="button"
          disabled={loading}
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          type="submit"
          disabled={loading || readOnly}
          loading={loading}
        />
      </div>
    </form>
  );
}