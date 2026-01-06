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
import { getLineaCreditoVigentes } from "../../api/tesoreria/lineaCredito";
import { getResponsiveFontSize } from "../../utils/utils";
import CuotaPrestamoList from "./CuotaPrestamoList";
import DesembolsoPrestamoCard from "./DesembolsoPrestamoCard";
import GarantiaPrestamoCard from "./GarantiaPrestamoCard";
import DocPrestamoPrincipal from "./DocPrestamoPrincipal";
import DocPrestamoAdicional from "./DocPrestamoAdicional";
import { redirect } from "react-router-dom";

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
    fechaEmision: defaultValues?.fechaEmision
      ? new Date(defaultValues.fechaEmision)
      : null,
    fechaExpiracion: defaultValues?.fechaExpiracion
      ? new Date(defaultValues.fechaExpiracion)
      : null,
    tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
    montoAprobado: defaultValues?.montoAprobado || 0,
    montoDesembolsado: defaultValues?.montoDesembolsado || 0,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    tasaInteresAnual:
      defaultValues?.tasaInteresAnual || defaultValues?.tasaInteres || 0,
    tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || 0,
    tasaMoratoria: defaultValues?.tasaMoratoria || 0,
    comisionInicial: defaultValues?.comisionInicial || 0,
    comisionMantenimiento: defaultValues?.comisionMantenimiento || 0,
    seguroDesgravamen: defaultValues?.seguroDesgravamen || 0,
    tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
    plazoMeses: defaultValues?.plazoMeses || 0,
    numeroCuotas: defaultValues?.numeroCuotas || 0,
    frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
    numeroDias: defaultValues?.numeroDias || null,
    diaPago: defaultValues?.diaPago || 1,
    periodoGracia: defaultValues?.periodoGracia || 0,
    tipoGarantia: defaultValues?.tipoGarantia || null,
    valorGarantia: defaultValues?.valorGarantia || 0,
    numeroGarantia: defaultValues?.numeroGarantia || "",
    numeroCartaCredito: defaultValues?.numeroCartaCredito || "",
    beneficiario: defaultValues?.beneficiario || "",
    saldoCapital: defaultValues?.saldoCapital || 0,
    saldoInteres: defaultValues?.saldoInteres || 0,
    capitalPagado: defaultValues?.capitalPagado || 0,
    interesPagado: defaultValues?.interesPagado || 0,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
    destinoFondos: defaultValues?.destinoFondos || "",
    descripcionGarantia: defaultValues?.descripcionGarantia || "",
    observaciones: defaultValues?.observaciones || "",
    esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
    prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId
      ? Number(defaultValues.prestamoRefinanciadoId)
      : null,
    esRevolvente: defaultValues?.esRevolvente || false,
    permitePagoParcial: defaultValues?.permitePagoParcial || false,
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
    tiposGarantia: [],
  });
  const [lineasCredito, setLineasCredito] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamosParaRefinanciar, setPrestamosParaRefinanciar] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (formData.empresaId) {
      cargarPrestamosParaRefinanciar();
    }
  }, [formData.empresaId]);

  const cargarDatos = async () => {
    try {
      const [
        empresasData,
        bancosData,
        monedasData,
        cuentasData,
        estadosData,
        enumsData,
        prestamosData,
      ] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncionPorTipoProviene(21),
        getEnumsTesoreria(),
        getAllPrestamoBancario(),
      ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setCuentasCorrientes(cuentasData);
      setEstados(estadosData);
      setEnums(enumsData);
      setPrestamos(prestamosData);
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

  const cargarPrestamosParaRefinanciar = async () => {
    try {
      const response = await getAllPrestamoBancario();
      const prestamosFiltrados = response.filter(
        (p) =>
          Number(p.empresaId) === Number(formData.empresaId) &&
          (Number(p.estadoId) === 81 || Number(p.estadoId) === 83 || Number(p.estadoId) === 84)
      );
      setPrestamosParaRefinanciar(prestamosFiltrados);
    } catch (error) {
      console.error("Error al cargar préstamos para refinanciar:", error);
    }
  };

  const cargarLineasCredito = async () => {
    try {
      const lineas = await getLineaCreditoVigentes();
      const lineasFiltradas = lineas.filter(
        (linea) =>
          Number(linea.empresaId) === Number(formData.empresaId) &&
          Number(linea.bancoId) === Number(formData.bancoId)
      );
      setLineasCredito(lineasFiltradas);
    } catch (error) {}
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      if (field === "empresaId" || field === "bancoId" || field === "monedaId") {
        newData.lineaCreditoId = null;
        newData.cuentaCorrienteId = null;
      }

      return newData;
    });
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
        fechaEmision: defaultValues?.fechaEmision
          ? new Date(defaultValues.fechaEmision)
          : null,
        fechaExpiracion: defaultValues?.fechaExpiracion
          ? new Date(defaultValues.fechaExpiracion)
          : null,
        tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoDesembolsado: defaultValues?.montoDesembolsado || 0,
        monedaId: defaultValues?.monedaId
          ? Number(defaultValues.monedaId)
          : null,
        tasaInteresAnual:
          defaultValues?.tasaInteresAnual || defaultValues?.tasaInteres || 0,
        tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || 0,
        tasaMoratoria: defaultValues?.tasaMoratoria || 0,
        comisionInicial: defaultValues?.comisionInicial || 0,
        comisionMantenimiento: defaultValues?.comisionMantenimiento || 0,
        seguroDesgravamen: defaultValues?.seguroDesgravamen || 0,
        tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
        plazoMeses: defaultValues?.plazoMeses || 0,
        numeroCuotas: defaultValues?.numeroCuotas || 0,
        frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
        numeroDias: defaultValues?.numeroDias || null,
        diaPago: defaultValues?.diaPago || 1,
        periodoGracia: defaultValues?.periodoGracia || 0,
        tipoGarantia: defaultValues?.tipoGarantia || null,
        valorGarantia: defaultValues?.valorGarantia || 0,
        numeroGarantia: defaultValues?.numeroGarantia || "",
        numeroCartaCredito: defaultValues?.numeroCartaCredito || "",
        beneficiario: defaultValues?.beneficiario || "",
        saldoCapital: defaultValues?.saldoCapital || 0,
        saldoInteres: defaultValues?.saldoInteres || 0,
        capitalPagado: defaultValues?.capitalPagado || 0,
        interesPagado: defaultValues?.interesPagado || 0,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
        destinoFondos: defaultValues?.destinoFondos || "",
        descripcionGarantia: defaultValues?.descripcionGarantia || "",
        observaciones: defaultValues?.observaciones || "",
        esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
        prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId
          ? Number(defaultValues.prestamoRefinanciadoId)
          : null,
        esRevolvente: defaultValues?.esRevolvente || false,
        permitePagoParcial: defaultValues?.permitePagoParcial || false,
      });
      setUrlDocumentoPDF(defaultValues?.urlDocumentoPDF || "");
      setUrlDocAdicionalPDF(defaultValues?.urlDocAdicionalPDF || "");

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
        fechaContrato: formData.fechaContrato?.toISOString
          ? formData.fechaContrato.toISOString()
          : formData.fechaContrato,
        fechaDesembolso: formData.fechaDesembolso?.toISOString
          ? formData.fechaDesembolso.toISOString()
          : formData.fechaDesembolso,
        fechaVencimiento: formData.fechaVencimiento?.toISOString
          ? formData.fechaVencimiento.toISOString()
          : formData.fechaVencimiento,
        fechaEmision: formData.fechaEmision?.toISOString
          ? formData.fechaEmision.toISOString()
          : formData.fechaEmision,
        fechaExpiracion: formData.fechaExpiracion?.toISOString
          ? formData.fechaExpiracion.toISOString()
          : formData.fechaExpiracion,
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
      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al guardar préstamo bancario";

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
  };

  const monedaSeleccionada = useMemo(() => {
    return monedas.find((m) => Number(m.id) === Number(formData.monedaId));
  }, [monedas, formData.monedaId]);

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

  const cuentasCorrientesOptions = useMemo(() => {
    if (!formData.empresaId || !formData.bancoId || !formData.monedaId) {
      return [];
    }

    return cuentasCorrientes
      .filter(
        (c) =>
          Number(c.empresaId) === Number(formData.empresaId) &&
          Number(c.bancoId) === Number(formData.bancoId) &&
          Number(c.monedaId) === Number(formData.monedaId)
      )
      .map((c) => ({
        ...c,
        id: Number(c.id),
        label: `${c.numeroCuenta} - ${c.banco?.nombre || ""} - ${
          c.moneda?.codigoSunat || ""
        }`,
        value: Number(c.id),
      }));
  }, [cuentasCorrientes, formData.empresaId, formData.bancoId, formData.monedaId]);

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

  const prestamosRefinanciarOptions = useMemo(() => {
    return prestamosParaRefinanciar
      .filter((p) => Number(p.id) !== Number(defaultValues?.id))
      .map((p) => ({
        ...p,
        id: Number(p.id),
        label: `${p.numeroPrestamo} - ${p.banco?.nombre || ""} - ${p.moneda?.codigoSunat || ""} ${Number(p.saldoCapital || 0).toFixed(2)}`,
        value: Number(p.id),
      }));
  }, [prestamosParaRefinanciar, defaultValues?.id]);

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
        <TabPanel header="Datos Generales" leftIcon="pi pi-info-circle">
          {/* Fila 1: Empresa, Banco, Línea de Crédito, Estado */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
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
            <div style={{ flex: 0.5 }}>
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
            <div style={{ flex: 0.5 }}>
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
                showClear
                disabled={readOnly || !formData.empresaId || !formData.bancoId}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
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
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 2: Número Préstamo, Número Contrato, Cuenta Corriente,Tipo Préstamo, Tipo Amortización, Fechas Principales */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <div style={{ flex: 0.75 }}>
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.75 }}>
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
                style={{ width: "100%" }}
              />
            </div>
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
                style={{ width: "100%" }}
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="fechaDesembolso"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                  color: "#22940E",
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="fechaVencimiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                  color: "#BF001E",
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
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 3: Montos Principales,Plazo y Cuotas, Días y Período de Gracia */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
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
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
                inputStyle={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="montoDesembolsado"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                  color: "#22940E",
                }}
              >
                Monto Desembolsado *
              </label>
              <InputNumber
                id="montoDesembolsado"
                value={formData.montoDesembolsado}
                onValueChange={(e) =>
                  handleChange("montoDesembolsado", e.value)
                }
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
                inputStyle={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 0.25 }}>
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.25 }}>
              <label
                htmlFor="numeroCuotas"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                N° Cuotas *
              </label>
              <InputNumber
                id="numeroCuotas"
                value={formData.numeroCuotas}
                onValueChange={(e) => handleChange("numeroCuotas", e.value)}
                disabled={readOnly}
                style={{ width: "100%" }}
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
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.25 }}>
              <label
                htmlFor="numeroDias"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                N°Días
              </label>
              <InputNumber
                id="numeroDias"
                value={formData.numeroDias}
                onValueChange={(e) => handleChange("numeroDias", e.value)}
                disabled={readOnly || formData.frecuenciaPago !== "DIAS"}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="diaPago"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Día de Pago (1-31)
              </label>
              <InputNumber
                id="diaPago"
                value={formData.diaPago}
                onValueChange={(e) => handleChange("diaPago", e.value)}
                min={1}
                max={31}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.25 }}>
              <label
                htmlFor="periodoGracia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Periodo Gracia (meses)
              </label>
              <InputNumber
                id="periodoGracia"
                value={formData.periodoGracia}
                onValueChange={(e) => handleChange("periodoGracia", e.value)}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 4: Tasas de Interés, Comisiones y Seguros */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="tasaInteresAnual"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Interés Anual (%) *
              </label>
              <InputNumber
                id="tasaInteresAnual"
                value={formData.tasaInteresAnual}
                onValueChange={(e) => handleChange("tasaInteresAnual", e.value)}
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="tasaInteresEfectiva"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                TEA (%)
              </label>
              <InputNumber
                id="tasaInteresEfectiva"
                value={formData.tasaInteresEfectiva}
                onValueChange={(e) =>
                  handleChange("tasaInteresEfectiva", e.value)
                }
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="tasaMoratoria"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tasa Moratoria (%)
              </label>
              <InputNumber
                id="tasaMoratoria"
                value={formData.tasaMoratoria}
                onValueChange={(e) => handleChange("tasaMoratoria", e.value)}
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="comisionInicial"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Comisión Inicial
              </label>
              <InputNumber
                id="comisionInicial"
                value={formData.comisionInicial}
                onValueChange={(e) => handleChange("comisionInicial", e.value)}
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="comisionMantenimiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                C. Mantenimiento (mensual)
              </label>
              <InputNumber
                id="comisionMantenimiento"
                value={formData.comisionMantenimiento}
                onValueChange={(e) =>
                  handleChange("comisionMantenimiento", e.value)
                }
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="seguroDesgravamen"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Seguro Desgravamen (mensual)
              </label>
              <InputNumber
                id="seguroDesgravamen"
                value={formData.seguroDesgravamen}
                onValueChange={(e) =>
                  handleChange("seguroDesgravamen", e.value)
                }
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tipoGarantia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tipo de Garantía
              </label>
              <Dropdown
                id="tipoGarantia"
                value={formData.tipoGarantia}
                options={enums.tiposGarantia}
                onChange={(e) => handleChange("tipoGarantia", e.value)}
                placeholder="Seleccione tipo"
                showClear
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="valorGarantia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Valor de Garantía
              </label>
              <InputNumber
                id="valorGarantia"
                value={formData.valorGarantia}
                onValueChange={(e) => handleChange("valorGarantia", e.value)}
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 5: Garantías, Campos para Garantías/Cartas de Crédito, Fechas para Garantías/Cartas */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="beneficiario"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Beneficiario (para Garantías/Cartas)
              </label>
              <InputText
                id="beneficiario"
                value={formData.beneficiario}
                onChange={(e) =>
                  handleChange("beneficiario", e.target.value.toUpperCase())
                }
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroGarantia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Garantía
              </label>
              <InputText
                id="numeroGarantia"
                value={formData.numeroGarantia}
                onChange={(e) =>
                  handleChange("numeroGarantia", e.target.value.toUpperCase())
                }
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="numeroCartaCredito"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Carta de Crédito
              </label>
              <InputText
                id="numeroCartaCredito"
                value={formData.numeroCartaCredito}
                onChange={(e) =>
                  handleChange(
                    "numeroCartaCredito",
                    e.target.value.toUpperCase()
                  )
                }
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaEmision"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Fecha de Emisión (Garantías/Cartas)
              </label>
              <Calendar
                id="fechaEmision"
                value={formData.fechaEmision}
                onChange={(e) => handleChange("fechaEmision", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaExpiracion"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Fecha de Expiración (Garantías/Cartas)
              </label>
              <Calendar
                id="fechaExpiracion"
                value={formData.fechaExpiracion}
                onChange={(e) => handleChange("fechaExpiracion", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={readOnly}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 6: Características Especiales, Refinanciamiento */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="esRevolvente"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Línea Revolvente
              </label>
              <Button
                id="esRevolvente"
                label={formData.esRevolvente ? "SÍ REVOLVENTE" : "NO REVOLVENTE"}
                icon={formData.esRevolvente ? "pi pi-check-circle" : "pi pi-times-circle"}
                severity={formData.esRevolvente ? "success" : "secondary"}
                onClick={() => handleChange("esRevolvente", !formData.esRevolvente)}
                disabled={readOnly}
                outlined
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="permitePagoParcial"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Pago Parcial
              </label>
              <Button
                id="permitePagoParcial"
                label={formData.permitePagoParcial ? "PERMITE PARCIAL" : "NO PERMITE PARCIAL"}
                icon={formData.permitePagoParcial ? "pi pi-check-circle" : "pi pi-times-circle"}
                severity={formData.permitePagoParcial ? "info" : "secondary"}
                onClick={() => handleChange("permitePagoParcial", !formData.permitePagoParcial)}
                disabled={readOnly}
                outlined
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="esRefinanciamiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Refinanciamiento
              </label>
              <Button
                id="esRefinanciamiento"
                label={formData.esRefinanciamiento ? "ES REFINANCIAMIENTO" : "NO ES REFINANCIAMIENTO"}
                icon={formData.esRefinanciamiento ? "pi pi-refresh" : "pi pi-times-circle"}
                severity={formData.esRefinanciamiento ? "warning" : "secondary"}
                onClick={() => handleChange("esRefinanciamiento", !formData.esRefinanciamiento)}
                disabled={readOnly}
                outlined
                style={{ width: "100%", fontSize: getResponsiveFontSize() }}
              />
            </div>
            {formData.esRefinanciamiento && (
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="prestamoRefinanciadoId"
                  style={{
                    fontWeight: "bold",
                    fontSize: getResponsiveFontSize(),
                  }}
                >
                  Préstamo Refinanciado *
                </label>
                <Dropdown
                  id="prestamoRefinanciadoId"
                  value={formData.prestamoRefinanciadoId}
                  options={prestamosRefinanciarOptions}
                  onChange={(e) =>
                    handleChange("prestamoRefinanciadoId", e.value)
                  }
                  placeholder="Seleccione préstamo a refinanciar"
                  disabled={readOnly || !formData.empresaId}
                  style={{ width: "100%", fontSize: getResponsiveFontSize() }}
                  filter
                  showClear
                  emptyMessage="No hay préstamos vigentes o vencidos para refinanciar"
                />
              </div>
            )}
          </div>

          {/* Fila 7: Destino de Fondos, Descripción Garantía y Observaciones */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
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
                style={{ width: "100%" }}
              />
            </div>
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
                style={{ width: "100%" }}
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
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Fila 8: Saldos, Pagos Realizados */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
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
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={true}
                style={{ width: "100%" }}
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
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={true}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="capitalPagado"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Capital Pagado
              </label>
              <InputNumber
                id="capitalPagado"
                value={formData.capitalPagado}
                onValueChange={(e) => handleChange("capitalPagado", e.value)}
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={true}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="interesPagado"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Interés Pagado
              </label>
              <InputNumber
                id="interesPagado"
                value={formData.interesPagado}
                onValueChange={(e) => handleChange("interesPagado", e.value)}
                mode="currency"
                currency={monedaSeleccionada?.codigoSunat || "PEN"}
                locale="es-PE"
                minFractionDigits={2}
                disabled={true}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </TabPanel>

        {isEdit && defaultValues?.id && (
          <TabPanel header="Cuotas" leftIcon="pi pi-list">
            <CuotaPrestamoList
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

        {isEdit && defaultValues?.id && (
          <TabPanel header="Desembolsos" leftIcon="pi pi-money-bill">
            <DesembolsoPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

        {isEdit && defaultValues?.id && (
          <TabPanel header="Garantías" leftIcon="pi pi-shield">
            <GarantiaPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          </TabPanel>
        )}

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
