// src/components/tesoreria/InversionFinancieraForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import {
  createInversionFinanciera,
  updateInversionFinanciera,
} from "../../api/tesoreria/inversionFinanciera";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getEnumsTesoreria } from "../../api/tesoreria/enumsTesoreria";

export default function InversionFinancieraForm({
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
    numeroInversion: defaultValues?.numeroInversion || "",
    tipoInversion: defaultValues?.tipoInversion || "PLAZO_FIJO",
    descripcion: defaultValues?.descripcion || "",
    fechaInicio: defaultValues?.fechaInicio ? new Date(defaultValues.fechaInicio) : null,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    montoInicial: defaultValues?.montoInicial || 0,
    montoActual: defaultValues?.montoActual || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaRendimiento: defaultValues?.tasaRendimiento || 0,
    periodicidadPago: defaultValues?.periodicidadPago || "VENCIMIENTO",
    renovacionAutomatica: defaultValues?.renovacionAutomatica || false,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 91,
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enums, setEnums] = useState({
    tiposInversion: [],
    periodicidadesRendimiento: [],
    opcionesRenovacion: [],
  });
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [empresasData, bancosData, monedasData, estadosData, enumsData] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getEstadosMultiFuncionPorTipoProviene(23),
        getEnumsTesoreria(),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setEstados(estadosData);
      setEnums(enumsData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        numeroInversion: defaultValues?.numeroInversion || "",
        tipoInversion: defaultValues?.tipoInversion || "PLAZO_FIJO",
        descripcion: defaultValues?.descripcion || "",
        fechaInicio: defaultValues?.fechaInicio ? new Date(defaultValues.fechaInicio) : null,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
        montoInicial: defaultValues?.montoInicial || 0,
        montoActual: defaultValues?.montoActual || 0,
        monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
        tasaRendimiento: defaultValues?.tasaRendimiento || 0,
        periodicidadPago: defaultValues?.periodicidadPago || "VENCIMIENTO",
        renovacionAutomatica: defaultValues?.renovacionAutomatica || false,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 91,
        observaciones: defaultValues?.observaciones || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      bancoId: Number(formData.bancoId),
      numeroInversion: formData.numeroInversion.trim().toUpperCase(),
      tipoInversion: formData.tipoInversion,
      descripcion: formData.descripcion?.trim().toUpperCase() || null,
      fechaInicio: formData.fechaInicio,
      fechaVencimiento: formData.fechaVencimiento,
      montoInicial: Number(formData.montoInicial),
      montoActual: Number(formData.montoActual),
      monedaId: Number(formData.monedaId),
      tasaRendimiento: Number(formData.tasaRendimiento),
      periodicidadPago: formData.periodicidadPago,
      renovacionAutomatica: Boolean(formData.renovacionAutomatica),
      estadoId: Number(formData.estadoId),
      observaciones: formData.observaciones?.trim().toUpperCase() || null,
    };

    if (isEdit && defaultValues) {
      await updateInversionFinanciera(defaultValues.id, dataToSend);
    } else {
      await createInversionFinanciera(dataToSend);
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

  const estadosOptions = estados.map((e) => ({
    label: e.estado,
    value: Number(e.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      {/* FILA 1: Empresa, Banco, Número Inversión, Estado */}
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
            Banco/Institucion Financiera *
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
          <label htmlFor="numeroInversion" style={{ fontWeight: "bold" }}>
            Número de Inversión *
          </label>
          <InputText
            id="numeroInversion"
            value={formData.numeroInversion}
            onChange={(e) => handleChange("numeroInversion", e.target.value.toUpperCase())}
            placeholder="Ej: INV-2025-001"
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

      {/* FILA 2: Tipo Inversión, Moneda, Periodicidad Pago */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoInversion" style={{ fontWeight: "bold" }}>
            Tipo de Inversión *
          </label>
          <Dropdown
            id="tipoInversion"
            value={formData.tipoInversion}
            options={enums.tiposInversion}
            onChange={(e) => handleChange("tipoInversion", e.value)}
            placeholder="Seleccionar tipo"
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
        <div style={{ flex: 1 }}>
          <label htmlFor="periodicidadPago" style={{ fontWeight: "bold" }}>
            Periodicidad de Pago *
          </label>
          <Dropdown
            id="periodicidadPago"
            value={formData.periodicidadPago}
            options={enums.periodicidadesRendimiento}
            onChange={(e) => handleChange("periodicidadPago", e.value)}
            placeholder="Seleccionar periodicidad"
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
            placeholder="Descripción de la inversión"
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
          <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
            Fecha de Inicio *
          </label>
          <Calendar
            id="fechaInicio"
            value={formData.fechaInicio}
            onChange={(e) => handleChange("fechaInicio", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            required
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha de Vencimiento
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => handleChange("fechaVencimiento", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
      </div>

      {/* FILA 5: Montos */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="montoInicial" style={{ fontWeight: "bold" }}>
            Monto Inicial *
          </label>
          <InputNumber
            id="montoInicial"
            value={formData.montoInicial}
            onValueChange={(e) => handleChange("montoInicial", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoActual" style={{ fontWeight: "bold" }}>
            Monto Actual *
          </label>
          <InputNumber
            id="montoActual"
            value={formData.montoActual}
            onValueChange={(e) => handleChange("montoActual", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* FILA 6: Tasa y Renovación */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tasaRendimiento" style={{ fontWeight: "bold" }}>
            Tasa de Rendimiento (%)
          </label>
          <InputNumber
            id="tasaRendimiento"
            value={formData.tasaRendimiento}
            onValueChange={(e) => handleChange("tasaRendimiento", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="renovacionAutomatica" style={{ fontWeight: "bold" }}>
            Renovación Automática *
          </label>
          <Dropdown
            id="renovacionAutomatica"
            value={formData.renovacionAutomatica}
            options={enums.opcionesRenovacion}
            onChange={(e) => handleChange("renovacionAutomatica", e.value)}
            placeholder="Seleccionar opción"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* FILA 7: Observaciones */}
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

      {/* Botones */}
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