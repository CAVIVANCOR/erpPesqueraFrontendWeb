// src/components/tesoreria/PrestamoBancarioForm.jsx
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";
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
import { getLineaCreditoVigentes } from "../../api/tesoreria/lineaCredito";
import { getResponsiveFontSize } from "../../utils/utils";
import DocumentoCapture from "../shared/DocumentoCapture";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import CuotaPrestamoList from "./CuotaPrestamoList";
import DesembolsoPrestamoCard from "./DesembolsoPrestamoCard";
import GarantiaPrestamoCard from "./GarantiaPrestamoCard";
import DocPrestamoPrincipal from "./DocPrestamoPrincipal";
import DocPrestamoAdicional from "./DocPrestamoAdicional";

const PrestamoBancarioForm = forwardRef(function PrestamoBancarioForm(
  {
    isEdit = false,
    defaultValues = {},
    empresaFija = null,
    onSubmit,
    onCancel,
    loading,
    readOnly = false,
  },
  ref
) {
  const toast = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [urlDocumentoPDF, setUrlDocumentoPDF] = useState(
    defaultValues?.urlDocumentoPDF || ""
  );
  const [urlDocAdicionalPDF, setUrlDocAdicionalPDF] = useState(
    defaultValues?.urlDocAdicionalPDF || ""
  );

  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
      ? Number(empresaFija)
      : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    lineaCreditoId: defaultValues?.lineaCreditoId
      ? Number(defaultValues.lineaCreditoId)
      : null,
    cuentaCorrienteId: defaultValues?.cuentaCorrienteId
      ? Number(defaultValues.cuentaCorrienteId)
      : null,
    numeroPrestamo: defaultValues?.numeroPrestamo || "",
    numeroContrato: defaultValues?.numeroContrato || "",
    fechaContrato: defaultValues?.fechaContrato
      ? new Date(defaultValues.fechaContrato)
      : null,
    fechaDesembolso: defaultValues?.fechaDesembolso
      ? new Date(defaultValues.fechaDesembolso)
      : null,
    fechaVencimiento: defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
    tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
    montoAprobado: defaultValues?.montoAprobado || 0,
    montoDesembolsado: defaultValues?.montoDesembolsado || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaInteres: defaultValues?.tasaInteres || 0,
    tipoTasa: defaultValues?.tipoTasa || "EFECTIVA_ANUAL",
    tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
    plazoMeses: defaultValues?.plazoMeses || 0,
    frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
    diaVencimiento: defaultValues?.diaVencimiento || 1,
    saldoCapital: defaultValues?.saldoCapital || 0,
    saldoInteres: defaultValues?.saldoInteres || 0,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
    destinoFondos: defaultValues?.destinoFondos || "",
    descripcionGarantia: defaultValues?.descripcionGarantia || "",
    observaciones: defaultValues?.observaciones || "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enums, setEnums] = useState({
    tiposPrestamo: [],
    tiposAmortizacion: [],
    frecuenciasPago: [],
    tiposTasa: [],
  });
  const [lineasCredito, setLineasCredito] = useState([]);
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
        estadosData,
        enumsData,
      ] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncionPorTipoProviene(21),
        getEnumsTesoreria(),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setCuentasCorrientes(cuentasData);
      setEstados(estadosData);
      setEnums(enumsData);
    } catch (error) {
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (formData.empresaId && formData.bancoId) {
      cargarLineasCredito();
    } else {
      setLineasCredito([]);
    }
  }, [formData.empresaId, formData.bancoId]);

  const cargarLineasCredito = async () => {
    try {
      const lineas = await getLineaCreditoVigentes();

      const lineasFiltradas = lineas.filter(
        (linea) =>
          Number(linea.empresaId) === Number(formData.empresaId) &&
          Number(linea.bancoId) === Number(formData.bancoId)
      );

      setLineasCredito(lineasFiltradas);
    } catch (error) {
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
        empresaId: defaultValues?.empresaId
          ? Number(defaultValues.empresaId)
          : empresaFija
          ? Number(empresaFija)
          : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
        lineaCreditoId: defaultValues?.lineaCreditoId
          ? Number(defaultValues.lineaCreditoId)
          : null,
        cuentaCorrienteId: defaultValues?.cuentaCorrienteId
          ? Number(defaultValues.cuentaCorrienteId)
          : null,
        numeroPrestamo: defaultValues?.numeroPrestamo || "",
        numeroContrato: defaultValues?.numeroContrato || "",
        fechaContrato: defaultValues?.fechaContrato
          ? new Date(defaultValues.fechaContrato)
          : null,
        fechaDesembolso: defaultValues?.fechaDesembolso
          ? new Date(defaultValues.fechaDesembolso)
          : null,
        fechaVencimiento: defaultValues?.fechaVencimiento
          ? new Date(defaultValues.fechaVencimiento)
          : null,
        tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoDesembolsado: defaultValues?.montoDesembolsado || 0,
        monedaId: defaultValues?.monedaId
          ? Number(defaultValues.monedaId)
          : null,
        tasaInteres: defaultValues?.tasaInteres || 0,
        tipoTasa: defaultValues?.tipoTasa || "EFECTIVA_ANUAL",
        tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
        plazoMeses: defaultValues?.plazoMeses || 0,
        frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
        diaVencimiento: defaultValues?.diaVencimiento || 1,
        saldoCapital: defaultValues?.saldoCapital || 0,
        saldoInteres: defaultValues?.saldoInteres || 0,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
        destinoFondos: defaultValues?.destinoFondos || "",
        descripcionGarantia: defaultValues?.descripcionGarantia || "",
        observaciones: defaultValues?.observaciones || "",
      });
      setUrlDocumentoPDF(defaultValues?.urlDocumentoPDF || "");
      setUrlDocAdicionalPDF(defaultValues?.urlDocAdicionalPDF || "");
      
      // Cargar líneas de crédito si hay empresaId y bancoId
      if (defaultValues?.empresaId && defaultValues?.bancoId) {
        cargarLineasCredito();
      }
    }
  }, [defaultValues, empresaFija]);

  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
    setFormData: (data) => setFormData(data),
  }));

  const handleSubmit = async () => {
    try {
      const dataToSend = {
        ...formData,
        tasaInteresAnual: formData.tasaInteres,
        numeroCuotas: formData.plazoMeses,
        fechaContrato: formData.fechaContrato?.toISOString ? formData.fechaContrato.toISOString() : formData.fechaContrato,
        fechaDesembolso: formData.fechaDesembolso?.toISOString ? formData.fechaDesembolso.toISOString() : formData.fechaDesembolso,
        fechaVencimiento: formData.fechaVencimiento?.toISOString ? formData.fechaVencimiento.toISOString() : formData.fechaVencimiento,
        urlDocumentoPDF: urlDocumentoPDF || null,
        urlDocAdicionalPDF: urlDocAdicionalPDF || null,
      };

      let resultado;
      if (isEdit) {
        resultado = await updatePrestamoBancario(defaultValues.id, dataToSend);
      } else {
        resultado = await createPrestamoBancario(dataToSend);
      }

      onSubmit(resultado);
    } catch (error) {
      const mensajeError = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Error al guardar préstamo bancario";
      
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
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

  const cuentasCorrientesOptions = cuentasCorrientes.map((c) => ({
    ...c,
    id: Number(c.id),
    label: `${c.numeroCuenta} - ${c.banco?.nombre || ""}`,
    value: Number(c.id),
  }));

  const estadosOptions = estados.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const lineasCreditoOptions = useMemo(() => {
  return lineasCredito.map((l) => ({
    ...l,
    id: Number(l.id),
    bancoId: Number(l.bancoId),
    empresaId: Number(l.empresaId),
    label: `${l.numeroLinea} - ${l.moneda?.codigoSunat || ""} ${Number(
      l.montoDisponible
    ).toFixed(2)}`,
    value: Number(l.id),
  }));
}, [lineasCredito]);

  if (cargandoDatos) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <Toast ref={toast} />
      <TabView
        activeIndex={activeTabIndex}
        onTabChange={(e) => setActiveTabIndex(e.index)}
      >
        {/* Tab de Datos Generales */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-info-circle">
          {/* Fila 1: Empresa, Banco, Línea de Crédito */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="empresaId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="bancoId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Banco *
              </label>
              <Dropdown
                id="bancoId"
                value={formData.bancoId ? Number(formData.bancoId) : null}
                options={bancosOptions}
                onChange={(e) => handleChange("bancoId", e.value)}
                placeholder="Seleccione banco"
                filter
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="lineaCreditoId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Línea de Crédito
              </label>
              <Dropdown
                id="lineaCreditoId"
                value={formData.lineaCreditoId}
                options={lineasCreditoOptions}
                onChange={(e) => handleChange("lineaCreditoId", e.value)}
                placeholder="Seleccione línea"
                optionLabel="label"
                optionValue="value"
                filter
                showClear
                disabled={readOnly || !formData.empresaId || !formData.bancoId}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 2: Número Préstamo, Número Contrato, Cuenta Corriente */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroPrestamo"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Préstamo *
              </label>
              <InputText
                id="numeroPrestamo"
                value={formData.numeroPrestamo}
                onChange={(e) =>
                  handleChange("numeroPrestamo", e.target.value.toUpperCase())
                }
                placeholder="Ej: PRES-2024-001"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroContrato"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Contrato *
              </label>
              <InputText
                id="numeroContrato"
                value={formData.numeroContrato}
                onChange={(e) =>
                  handleChange("numeroContrato", e.target.value.toUpperCase())
                }
                placeholder="Ej: CONT-2024-001"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="cuentaCorrienteId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Cuenta Corriente
              </label>
              <Dropdown
                id="cuentaCorrienteId"
                value={
                  formData.cuentaCorrienteId
                    ? Number(formData.cuentaCorrienteId)
                    : null
                }
                options={cuentasCorrientesOptions}
                onChange={(e) => handleChange("cuentaCorrienteId", e.value)}
                placeholder="Seleccione cuenta"
                filter
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 3: Tipo Préstamo, Tipo Amortización, Estado */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tipoPrestamo"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tipo de Préstamo *
              </label>
              <Dropdown
                id="tipoPrestamo"
                value={formData.tipoPrestamo}
                options={enums.tiposPrestamo}
                onChange={(e) => handleChange("tipoPrestamo", e.value)}
                placeholder="Seleccione tipo"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tipoAmortizacion"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tipo de Amortización *
              </label>
              <Dropdown
                id="tipoAmortizacion"
                value={formData.tipoAmortizacion}
                options={enums.tiposAmortizacion}
                onChange={(e) => handleChange("tipoAmortizacion", e.value)}
                placeholder="Seleccione tipo"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="estadoId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Estado *
              </label>
              <Dropdown
                id="estadoId"
                value={formData.estadoId}
                options={estadosOptions}
                onChange={(e) => handleChange("estadoId", e.value)}
                placeholder="Seleccione estado"
                optionLabel="label"
                optionValue="value"
                filter
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 4: Fechas */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaContrato"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Fecha de Contrato *
              </label>
              <Calendar
                id="fechaContrato"
                value={formData.fechaContrato}
                onChange={(e) => handleChange("fechaContrato", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaDesembolso"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Fecha de Desembolso *
              </label>
              <Calendar
                id="fechaDesembolso"
                value={formData.fechaDesembolso}
                onChange={(e) => handleChange("fechaDesembolso", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaVencimiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Fecha de Vencimiento *
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
                htmlFor="montoAprobado"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Monto Aprobado *
              </label>
              <InputNumber
                id="montoAprobado"
                value={formData.montoAprobado}
                onValueChange={(e) => handleChange("montoAprobado", e.value)}
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
                htmlFor="monedaId"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
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
            <div style={{ flex: 1 }}>
              <label
                htmlFor="plazoMeses"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Plazo (Meses) *
              </label>
              <InputNumber
                id="plazoMeses"
                value={formData.plazoMeses}
                onValueChange={(e) => handleChange("plazoMeses", e.value)}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 6: Tasa de Interés */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tasaInteres"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tasa de Interés (%) *
              </label>
              <InputNumber
                id="tasaInteres"
                value={formData.tasaInteres}
                onValueChange={(e) => handleChange("tasaInteres", e.value)}
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tipoTasa"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tipo de Tasa *
              </label>
              <Dropdown
                id="tipoTasa"
                value={formData.tipoTasa}
                options={enums.tiposTasa}
                onChange={(e) => handleChange("tipoTasa", e.value)}
                placeholder="Seleccione tipo"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="frecuenciaPago"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Frecuencia de Pago *
              </label>
              <Dropdown
                id="frecuenciaPago"
                value={formData.frecuenciaPago}
                options={enums.frecuenciasPago}
                onChange={(e) => handleChange("frecuenciaPago", e.value)}
                placeholder="Seleccione frecuencia"
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 7: Saldos y Día Vencimiento */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="saldoCapital"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Saldo Capital
              </label>
              <InputNumber
                id="saldoCapital"
                value={formData.saldoCapital}
                onValueChange={(e) => handleChange("saldoCapital", e.value)}
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
                htmlFor="saldoInteres"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Saldo Interés
              </label>
              <InputNumber
                id="saldoInteres"
                value={formData.saldoInteres}
                onValueChange={(e) => handleChange("saldoInteres", e.value)}
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
                htmlFor="diaVencimiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Día de Vencimiento *
              </label>
              <InputNumber
                id="diaVencimiento"
                value={formData.diaVencimiento}
                onValueChange={(e) => handleChange("diaVencimiento", e.value)}
                min={1}
                max={31}
                disabled={readOnly}
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
          </div>

          {/* Fila 8: Destino de Fondos */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="destinoFondos"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Destino de Fondos
              </label>
              <InputTextarea
                id="destinoFondos"
                value={formData.destinoFondos}
                onChange={(e) =>
                  handleChange("destinoFondos", e.target.value.toUpperCase())
                }
                placeholder="Descripción del destino de los fondos del préstamo"
                disabled={readOnly}
                rows={2}
              />
            </div>
          </div>

          {/* Fila 9: Descripción Garantía y Observaciones */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="descripcionGarantia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Descripción de Garantía
              </label>
              <InputTextarea
                id="descripcionGarantia"
                value={formData.descripcionGarantia}
                onChange={(e) =>
                  handleChange(
                    "descripcionGarantia",
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="Descripción detallada de la garantía"
                disabled={readOnly}
                rows={2}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="observaciones"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Observaciones
              </label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  handleChange("observaciones", e.target.value.toUpperCase())
                }
                placeholder="Observaciones adicionales"
                disabled={readOnly}
                rows={2}
              />
            </div>
          </div>
        </TabPanel>

        {/* Tab de Cuotas */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Cuotas" leftIcon="pi pi-list">
            <CuotaPrestamoList
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

        {/* Tab de Desembolsos */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Desembolsos" leftIcon="pi pi-money-bill">
            <DesembolsoPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

        {/* Tab de Garantías */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Garantías" leftIcon="pi pi-shield">
            <GarantiaPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

        {/* Tab de Documento Principal */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Documento Principal" leftIcon="pi pi-file-pdf">
            <DocPrestamoPrincipal
              prestamoId={defaultValues.id}
              documentoActual={urlDocumentoPDF}
              readOnly={readOnly}
              onDocumentoActualizado={(url) => setUrlDocumentoPDF(url)}
            />
          </TabPanel>
        )}

        {/* Tab de Documentación Adicional */}
        {isEdit && defaultValues?.id && (
          <TabPanel header="Documentación Adicional" leftIcon="pi pi-paperclip">
            <DocPrestamoAdicional
              prestamoId={defaultValues.id}
              documentoActual={urlDocAdicionalPDF}
              readOnly={readOnly}
              onDocumentoActualizado={(url) => setUrlDocAdicionalPDF(url)}
            />
          </TabPanel>
        )}
      </TabView>

      {/* Botones de acción - Visibles en todos los tabs */}
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
          className="p-button-secondary"
          disabled={loading}
        />
        <Button
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          onClick={handleSubmit}
          disabled={loading || readOnly}
          loading={loading}
        />
      </div>
    </div>
  );
});

export default PrestamoBancarioForm;
