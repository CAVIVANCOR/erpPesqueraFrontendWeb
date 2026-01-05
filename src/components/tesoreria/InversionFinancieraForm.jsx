// src/components/tesoreria/InversionFinancieraForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { TabView, TabPanel } from "primereact/tabview";
import {
  createInversionFinanciera,
  updateInversionFinanciera,
} from "../../api/tesoreria/inversionFinanciera";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getEnumsTesoreria } from "../../api/tesoreria/enumsTesoreria";
import { getResponsiveFontSize } from "../../utils/utils";
import MovimientoInversionCard from "./MovimientoInversionCard";

export default function InversionFinancieraForm({
  isEdit = false,
  defaultValues = {},
  empresaFija = null,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : (empresaFija || null),
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    numeroInversion: defaultValues?.numeroInversion || "",
    tipoInversion: defaultValues?.tipoInversion || "PLAZO_FIJO",
    descripcion: defaultValues?.descripcion || "",
    fechaInversion: defaultValues?.fechaInversion ? new Date(defaultValues.fechaInversion) : null,
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
    montoInvertido: defaultValues?.montoInvertido || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaRendimiento: defaultValues?.tasaRendimiento || 0,
    valorActual: defaultValues?.valorActual || 0,
    rendimientoAcumulado: defaultValues?.rendimientoAcumulado || 0,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 90,
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enums, setEnums] = useState({
    tiposInversion: [],
  });
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (empresaFija && !defaultValues?.empresaId) {
      setFormData((prev) => ({
        ...prev,
        empresaId: empresaFija
      }));
    }
  }, [empresaFija, defaultValues]);

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
        empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : (empresaFija || null),
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        numeroInversion: defaultValues?.numeroInversion || "",
        tipoInversion: defaultValues?.tipoInversion || "PLAZO_FIJO",
        descripcion: defaultValues?.descripcion || "",
        fechaInversion: defaultValues?.fechaInversion ? new Date(defaultValues.fechaInversion) : null,
        fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
        montoInvertido: defaultValues?.montoInvertido || 0,
        monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
        tasaRendimiento: defaultValues?.tasaRendimiento || 0,
        valorActual: defaultValues?.valorActual || 0,
        rendimientoAcumulado: defaultValues?.rendimientoAcumulado || 0,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 90,
        observaciones: defaultValues?.observaciones || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar data siguiendo patrón RequerimientoCompraForm
    const data = {
      empresaId: formData.empresaId ? Number(formData.empresaId) : null,
      bancoId: formData.bancoId ? Number(formData.bancoId) : null,
      numeroInversion: formData.numeroInversion,
      tipoInversion: formData.tipoInversion,
      descripcion: formData.descripcion,
      fechaInversion: formData.fechaInversion,
      fechaVencimiento: formData.fechaVencimiento,
      montoInvertido: formData.montoInvertido,
      monedaId: formData.monedaId ? Number(formData.monedaId) : null,
      tasaRendimiento: formData.tasaRendimiento,
      valorActual: formData.valorActual,
      rendimientoAcumulado: formData.rendimientoAcumulado,
      estadoId: formData.estadoId ? Number(formData.estadoId) : null,
      observaciones: formData.observaciones,
    };

    // Validaciones básicas
    if (!data.empresaId) {
      console.error("Empresa es requerida");
      return;
    }
    if (!data.numeroInversion) {
      console.error("Número de inversión es requerido");
      return;
    }

    // Enviar data al componente padre (patrón RequerimientoCompraForm)
    onSubmit(data);
  };

  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const bancosOptions = bancos.map((b) => ({
    ...b,
    id: Number(b.id),
    label: b.nombre,
    value: Number(b.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    ...m,
    id: Number(m.id),
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const estadosOptions = estados.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion || e.estado,
    value: Number(e.id),
  }));

  if (cargandoDatos) {
    return <div>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
        {/* Tab de Datos Generales */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-info-circle">
          {/* Fila 1: Empresa, Banco, Número Inversión */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="empresaId"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Empresa *
              </label>
              <Dropdown
                id="empresaId"
                value={formData.empresaId ? Number(formData.empresaId) : null}
                options={empresasOptions}
                onChange={(e) => handleChange("empresaId", e.value)}
                placeholder="Seleccione empresa"
                filter
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="bancoId"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Banco
              </label>
              <Dropdown
                id="bancoId"
                value={formData.bancoId ? Number(formData.bancoId) : null}
                options={bancosOptions}
                onChange={(e) => handleChange("bancoId", e.value)}
                placeholder="Seleccione banco"
                filter
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroInversion"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Número de Inversión *
              </label>
              <InputText
                id="numeroInversion"
                value={formData.numeroInversion}
                onChange={(e) =>
                  handleChange("numeroInversion", e.target.value.toUpperCase())
                }
                placeholder="Ej: INV-2024-001"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 2: Tipo Inversión, Estado, Moneda */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tipoInversion"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Tipo de Inversión *
              </label>
              <Dropdown
                id="tipoInversion"
                value={formData.tipoInversion}
                options={enums.tiposInversion}
                onChange={(e) => handleChange("tipoInversion", e.value)}
                placeholder="Seleccione tipo"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="estadoId"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Estado *
              </label>
              <Dropdown
                id="estadoId"
                value={formData.estadoId ? Number(formData.estadoId) : null}
                options={estadosOptions}
                onChange={(e) => handleChange("estadoId", e.value)}
                placeholder="Seleccione estado"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="monedaId"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Moneda *
              </label>
              <Dropdown
                id="monedaId"
                value={formData.monedaId ? Number(formData.monedaId) : null}
                options={monedasOptions}
                onChange={(e) => handleChange("monedaId", e.value)}
                placeholder="Seleccione moneda"
                filter
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 3: Descripción */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="descripcion"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Descripción *
              </label>
              <InputText
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  handleChange("descripcion", e.target.value.toUpperCase())
                }
                placeholder="Descripción de la inversión"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 4: Fechas */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaInversion"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Fecha de Inversión *
              </label>
              <Calendar
                id="fechaInversion"
                value={formData.fechaInversion}
                onChange={(e) => handleChange("fechaInversion", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaVencimiento"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Fecha de Vencimiento
              </label>
              <Calendar
                id="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={(e) => handleChange("fechaVencimiento", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 5: Montos */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="montoInvertido"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Monto Invertido *
              </label>
              <InputNumber
                id="montoInvertido"
                value={formData.montoInvertido}
                onValueChange={(e) => handleChange("montoInvertido", e.value)}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="valorActual"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Valor Actual
              </label>
              <InputNumber
                id="valorActual"
                value={formData.valorActual}
                onValueChange={(e) => handleChange("valorActual", e.value)}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="rendimientoAcumulado"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Rendimiento Acumulado
              </label>
              <InputNumber
                id="rendimientoAcumulado"
                value={formData.rendimientoAcumulado}
                onValueChange={(e) => handleChange("rendimientoAcumulado", e.value)}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 6: Tasa Rendimiento */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tasaRendimiento"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
                Tasa de Rendimiento (%)
              </label>
              <InputNumber
                id="tasaRendimiento"
                value={formData.tasaRendimiento}
                onValueChange={(e) => handleChange("tasaRendimiento", e.value)}
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 7: Observaciones */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="observaciones"
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              >
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
        </TabPanel>

        {/* Tab de Movimientos */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Movimientos" leftIcon="pi pi-arrows-h">
            <MovimientoInversionCard
              inversionFinancieraId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}
      </TabView>

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