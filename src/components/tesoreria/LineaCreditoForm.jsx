// src/components/tesoreria/LineaCreditoForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import {
  createLineaCredito,
  updateLineaCredito,
} from "../../api/tesoreria/lineaCredito";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { TIPOS_LINEA_CREDITO } from "../../utils/tesoreriaConstants";

export default function LineaCreditoForm({
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
    numeroLinea: defaultValues?.numeroLinea || "",
    tipoLinea: defaultValues?.tipoLinea || "REVOLVENTE",
    descripcion: defaultValues?.descripcion || "",
    fechaAprobacion: defaultValues?.fechaAprobacion ? new Date(defaultValues.fechaAprobacion) : null,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    montoAprobado: defaultValues?.montoAprobado || 0,
    montoUtilizado: defaultValues?.montoUtilizado || 0,
    montoDisponible: defaultValues?.montoDisponible || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaInteres: defaultValues?.tasaInteres || 0,
    comisionManejo: defaultValues?.comisionManejo || null,
    comisionNoUtilizacion: defaultValues?.comisionNoUtilizacion || null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 86,
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [empresasData, bancosData, monedasData, estadosData] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getEstadosMultiFuncionPorTipoProviene(22),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setEstados(estadosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      if (field === "montoAprobado" || field === "montoUtilizado") {
        const aprobado = field === "montoAprobado" ? value : newData.montoAprobado;
        const utilizado = field === "montoUtilizado" ? value : newData.montoUtilizado;
        newData.montoDisponible = (aprobado || 0) - (utilizado || 0);
      }
      
      return newData;
    });
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        numeroLinea: defaultValues?.numeroLinea || "",
        tipoLinea: defaultValues?.tipoLinea || "REVOLVENTE",
        descripcion: defaultValues?.descripcion || "",
        fechaAprobacion: defaultValues?.fechaAprobacion ? new Date(defaultValues.fechaAprobacion) : null,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoUtilizado: defaultValues?.montoUtilizado || 0,
        montoDisponible: defaultValues?.montoDisponible || 0,
        monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
        tasaInteres: defaultValues?.tasaInteres || 0,
        comisionManejo: defaultValues?.comisionManejo || null,
        comisionNoUtilizacion: defaultValues?.comisionNoUtilizacion || null,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 86,
        observaciones: defaultValues?.observaciones || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      empresaId: Number(formData.empresaId),
      bancoId: Number(formData.bancoId),
      numeroLinea: formData.numeroLinea.trim().toUpperCase(),
      tipoLinea: formData.tipoLinea,
      descripcion: formData.descripcion?.trim().toUpperCase() || null,
      fechaAprobacion: formData.fechaAprobacion,
      fechaVencimiento: formData.fechaVencimiento,
      montoAprobado: Number(formData.montoAprobado),
      montoUtilizado: Number(formData.montoUtilizado),
      montoDisponible: Number(formData.montoDisponible),
      monedaId: Number(formData.monedaId),
      tasaInteres: Number(formData.tasaInteres),
      comisionManejo: formData.comisionManejo ? Number(formData.comisionManejo) : null,
      comisionNoUtilizacion: formData.comisionNoUtilizacion ? Number(formData.comisionNoUtilizacion) : null,
      estadoId: Number(formData.estadoId),
      observaciones: formData.observaciones?.trim().toUpperCase() || null,
    };

    if (isEdit && defaultValues) {
      await updateLineaCredito(defaultValues.id, dataToSend);
    } else {
      await createLineaCredito(dataToSend);
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
      {/* FILA 1: Empresa, Banco, Número Línea, Estado */}
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
          <label htmlFor="numeroLinea" style={{ fontWeight: "bold" }}>
            Número de Línea *
          </label>
          <InputText
            id="numeroLinea"
            value={formData.numeroLinea}
            onChange={(e) => handleChange("numeroLinea", e.target.value.toUpperCase())}
            placeholder="Ej: LC-2025-001"
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

      {/* FILA 2: Tipo Línea, Moneda */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoLinea" style={{ fontWeight: "bold" }}>
            Tipo de Línea *
          </label>
          <Dropdown
            id="tipoLinea"
            value={formData.tipoLinea}
            options={TIPOS_LINEA_CREDITO}
            onChange={(e) => handleChange("tipoLinea", e.value)}
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
            placeholder="Descripción de la línea de crédito"
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
          <label htmlFor="fechaAprobacion" style={{ fontWeight: "bold" }}>
            Fecha de Aprobación *
          </label>
          <Calendar
            id="fechaAprobacion"
            value={formData.fechaAprobacion}
            onChange={(e) => handleChange("fechaAprobacion", e.value)}
            placeholder="Seleccionar fecha"
            disabled={readOnly}
            required
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

      {/* FILA 5: Montos */}
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
          <label htmlFor="montoUtilizado" style={{ fontWeight: "bold" }}>
            Monto Utilizado *
          </label>
          <InputNumber
            id="montoUtilizado"
            value={formData.montoUtilizado}
            onValueChange={(e) => handleChange("montoUtilizado", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoDisponible" style={{ fontWeight: "bold" }}>
            Monto Disponible
          </label>
          <InputNumber
            id="montoDisponible"
            value={formData.montoDisponible}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled
            style={{ backgroundColor: "#f0f0f0" }}
          />
        </div>
      </div>

      {/* FILA 6: Tasas y Comisiones */}
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
          <label htmlFor="comisionManejo" style={{ fontWeight: "bold" }}>
            Comisión de Manejo (%)
          </label>
          <InputNumber
            id="comisionManejo"
            value={formData.comisionManejo}
            onValueChange={(e) => handleChange("comisionManejo", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="comisionNoUtilizacion" style={{ fontWeight: "bold" }}>
            Comisión No Utilización (%)
          </label>
          <InputNumber
            id="comisionNoUtilizacion"
            value={formData.comisionNoUtilizacion}
            onValueChange={(e) => handleChange("comisionNoUtilizacion", e.value)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            disabled={readOnly}
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