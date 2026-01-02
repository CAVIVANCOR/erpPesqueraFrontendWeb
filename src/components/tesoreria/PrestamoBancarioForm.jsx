// src/components/tesoreria/PrestamoBancarioForm.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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
import { getResponsiveFontSize } from "../../utils/utils";
import DocumentoCapture from "../shared/DocumentoCapture";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import CuotaPrestamoList from "./CuotaPrestamoList";
import DocPrestamoPrincipal from "./DocPrestamoPrincipal";
import DocPrestamoAdicional from "./DocPrestamoAdicional";

const PrestamoBancarioForm = forwardRef(function PrestamoBancarioForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}, ref) {
  const toast = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [urlDocumentoPDF, setUrlDocumentoPDF] = useState(defaultValues?.urlDocumentoPDF || "");
  const [urlDocAdicionalPDF, setUrlDocAdicionalPDF] = useState(defaultValues?.urlDocAdicionalPDF || "");
  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
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
    numeroDias: defaultValues?.numeroDias || null,
    diaPago: defaultValues?.diaPago || null,
    periodoGracia: defaultValues?.periodoGracia || null,
    tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
    tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
    destinoFondos: defaultValues?.destinoFondos || "",
    tipoGarantia: defaultValues?.tipoGarantia || null,
    descripcionGarantia: defaultValues?.descripcionGarantia || "",
    valorGarantia: defaultValues?.valorGarantia || null,
    esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
    prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId
      ? Number(defaultValues.prestamoRefinanciadoId)
      : null,
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
  const [estadoRefinanciado, setEstadoRefinanciado] = useState(null);
  const [mostrarCapturaDoc, setMostrarCapturaDoc] = useState(false);

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

      const estadoRef = estadosData.find((e) =>
        e.descripcion?.toUpperCase().includes("REFINANCIADO")
      );
      if (estadoRef) {
        setEstadoRefinanciado(Number(estadoRef.id));
      }
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

  useEffect(() => {
    if (
      estadoRefinanciado &&
      Number(formData.estadoId) === estadoRefinanciado
    ) {
      setFormData((prev) => ({ ...prev, esRefinanciamiento: true }));
    }
  }, [formData.estadoId, estadoRefinanciado]);

  const handleDocumentoSubido = (urlDocumento) => {
    setFormData((prev) => ({ ...prev, urlDocumentoPDF: urlDocumento }));
    setMostrarCapturaDoc(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento PDF se ha subido correctamente",
      life: 3000,
    });
  };

  const handleVerDocumentoPDF = () => {
    if (formData.urlDocumentoPDF) {
      abrirPdfEnNuevaPestana(
        formData.urlDocumentoPDF,
        toast,
        "No hay documento PDF disponible"
      );
    }
  };

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

      if (field === "frecuenciaPago" && value !== "DIAS") {
        newData.numeroDias = null;
      }

      if (
        field === "estadoId" &&
        estadoRefinanciado &&
        Number(value) === estadoRefinanciado
      ) {
        newData.esRefinanciamiento = true;
      }

      if (field === "esRefinanciamiento" && !value) {
        newData.prestamoRefinanciadoId = null;
      }

      return newData;
    });
  };

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setFormData({
        empresaId: defaultValues?.empresaId
          ? Number(defaultValues.empresaId)
          : null,
        bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
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
        montoAprobado: defaultValues?.montoAprobado || 0,
        montoDesembolsado: defaultValues?.montoDesembolsado || 0,
        monedaId: defaultValues?.monedaId
          ? Number(defaultValues.monedaId)
          : null,
        tasaInteresAnual: defaultValues?.tasaInteresAnual || 0,
        tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || null,
        tasaMoratoria: defaultValues?.tasaMoratoria || null,
        comisionInicial: defaultValues?.comisionInicial || null,
        comisionMantenimiento: defaultValues?.comisionMantenimiento || null,
        seguroDesgravamen: defaultValues?.seguroDesgravamen || null,
        plazoMeses: defaultValues?.plazoMeses || 12,
        numeroCuotas: defaultValues?.numeroCuotas || 12,
        frecuenciaPago: defaultValues?.frecuenciaPago || "MENSUAL",
        numeroDias: defaultValues?.numeroDias || null,
        diaPago: defaultValues?.diaPago || null,
        periodoGracia: defaultValues?.periodoGracia || null,
        tipoPrestamo: defaultValues?.tipoPrestamo || "CAPITAL_TRABAJO",
        tipoAmortizacion: defaultValues?.tipoAmortizacion || "FRANCES",
        destinoFondos: defaultValues?.destinoFondos || "",
        tipoGarantia: defaultValues?.tipoGarantia || null,
        descripcionGarantia: defaultValues?.descripcionGarantia || "",
        valorGarantia: defaultValues?.valorGarantia || null,
        esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
        prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId
          ? Number(defaultValues.prestamoRefinanciadoId)
          : null,
        estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 79,
        observaciones: defaultValues?.observaciones || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        empresaId: Number(formData.empresaId),
        bancoId: Number(formData.bancoId),
        cuentaCorrienteId: formData.cuentaCorrienteId
          ? Number(formData.cuentaCorrienteId)
          : null,
        numeroPrestamo: formData.numeroPrestamo.trim().toUpperCase(),
        numeroContrato: formData.numeroContrato?.trim().toUpperCase() || null,
        fechaContrato: formData.fechaContrato,
        fechaDesembolso: formData.fechaDesembolso,
        fechaVencimiento: formData.fechaVencimiento,
        montoAprobado: Number(formData.montoAprobado),
        montoDesembolsado: Number(formData.montoDesembolsado),
        monedaId: Number(formData.monedaId),
        tasaInteresAnual: Number(formData.tasaInteresAnual),
        tasaInteresEfectiva: formData.tasaInteresEfectiva
          ? Number(formData.tasaInteresEfectiva)
          : null,
        tasaMoratoria: formData.tasaMoratoria
          ? Number(formData.tasaMoratoria)
          : null,
        comisionInicial: formData.comisionInicial
          ? Number(formData.comisionInicial)
          : null,
        comisionMantenimiento: formData.comisionMantenimiento
          ? Number(formData.comisionMantenimiento)
          : null,
        seguroDesgravamen: formData.seguroDesgravamen
          ? Number(formData.seguroDesgravamen)
          : null,
        plazoMeses: Number(formData.plazoMeses),
        numeroCuotas: Number(formData.numeroCuotas),
        frecuenciaPago: formData.frecuenciaPago,
        numeroDias: formData.numeroDias ? Number(formData.numeroDias) : null,
        diaPago: formData.diaPago ? Number(formData.diaPago) : null,
        periodoGracia: formData.periodoGracia
          ? Number(formData.periodoGracia)
          : null,
        tipoPrestamo: formData.tipoPrestamo,
        tipoAmortizacion: formData.tipoAmortizacion,
        destinoFondos: formData.destinoFondos?.trim().toUpperCase() || null,
        tipoGarantia: formData.tipoGarantia || null,
        descripcionGarantia:
          formData.descripcionGarantia?.trim().toUpperCase() || null,
        valorGarantia: formData.valorGarantia
          ? Number(formData.valorGarantia)
          : null,
        esRefinanciamiento: formData.esRefinanciamiento,
        prestamoRefinanciadoId: formData.prestamoRefinanciadoId
          ? Number(formData.prestamoRefinanciadoId)
          : null,
        estadoId: Number(formData.estadoId),
        observaciones: formData.observaciones?.trim().toUpperCase() || null,
      };

      let resultado;
      if (isEdit && defaultValues) {
        resultado = await updatePrestamoBancario(defaultValues.id, dataToSend);
      } else {
        resultado = await createPrestamoBancario(dataToSend);
      }

      await onSubmit(resultado);
    } catch (error) {
      console.error("Error al guardar préstamo:", error);

      // Extraer mensaje de error detallado
      const errorMsg =
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "No se pudo guardar el préstamo bancario.";

      toast.current?.show({
        severity: "error",
        summary: "Error al guardar",
        detail: errorMsg,
        life: 5000,
      });
    }
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
    const coincideBanco =
      !formData.bancoId || Number(c.bancoId) === Number(formData.bancoId);
    const coincideMoneda =
      !formData.monedaId || Number(c.monedaId) === Number(formData.monedaId);
    return coincideBanco && coincideMoneda;
  });

  const cuentasOptions = cuentasFiltradas.map((c) => ({
    label: `${c.numeroCuenta} - ${c.banco?.nombre || "N/A"} - ${
      c.moneda?.codigoSunat || "N/A"
    }`,
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

  const esEstadoRefinanciado =
    estadoRefinanciado && Number(formData.estadoId) === estadoRefinanciado;

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <TabView>
        <TabPanel header="Datos Generales">
      {/* FILA 1: Empresa, Banco, Moneda, Cuenta Corriente, Estado */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="empresaId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
        <div style={{ flex: 0.5 }}>
          <label
            htmlFor="bancoId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
        <div style={{ flex: 0.5 }}>
          <label
            htmlFor="monedaId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
          <label
            htmlFor="cuentaCorrienteId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Cuenta Corriente{" "}
            {formData.empresaId &&
              formData.bancoId &&
              formData.monedaId &&
              `(${cuentasFiltradas.length})`}
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
            disabled={
              readOnly ||
              !formData.empresaId ||
              !formData.bancoId ||
              !formData.monedaId
            }
            filter
            filterBy="label"
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <label
            htmlFor="estadoId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
        <div style={{ flex: 0.3 }}>
          <Button
            type="button"
            label={
              formData.esRefinanciamiento ? "REFINANCIADO" : "REFINANCIADO"
            }
            icon={
              formData.esRefinanciamiento
                ? "pi pi-check-circle"
                : "pi pi-times-circle"
            }
            severity={formData.esRefinanciamiento ? "info" : "secondary"}
            onClick={() =>
              !esEstadoRefinanciado &&
              handleChange("esRefinanciamiento", !formData.esRefinanciamiento)
            }
            disabled={readOnly || esEstadoRefinanciado}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* FILA 2: Número Préstamo, Número Contrato, Tipo Préstamo, Tipo Amortización, Frecuencia Pago */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="numeroPrestamo"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Número de Préstamo *
          </label>
          <InputText
            id="numeroPrestamo"
            value={formData.numeroPrestamo}
            onChange={(e) =>
              handleChange("numeroPrestamo", e.target.value.toUpperCase())
            }
            placeholder="Ej: PREST-2025-001"
            disabled={readOnly}
            required
            maxLength={50}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="numeroContrato"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Número de Contrato
          </label>
          <InputText
            id="numeroContrato"
            value={formData.numeroContrato}
            onChange={(e) =>
              handleChange("numeroContrato", e.target.value.toUpperCase())
            }
            placeholder="Número del banco"
            disabled={readOnly}
            maxLength={50}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="tipoPrestamo"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Tipo de Préstamo *
          </label>
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
          <label
            htmlFor="tipoAmortizacion"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Tipo de Amortización *
          </label>
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
          <label
            htmlFor="frecuenciaPago"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Frecuencia de Pago *
          </label>
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
        {formData.frecuenciaPago === "DIAS" && (
          <div style={{ flex: 1 }}>
            <label
              htmlFor="numeroDias"
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            >
              Número de Días *
            </label>
            <InputNumber
              id="numeroDias"
              value={formData.numeroDias}
              onValueChange={(e) => handleChange("numeroDias", e.value)}
              min={1}
              disabled={readOnly}
              required={formData.frecuenciaPago === "DIAS"}
            />
          </div>
        )}
      </div>

      {/* FILA 3: Préstamo Refinanciado (si aplica) */}
      {formData.esRefinanciamiento && (
        <div style={{ marginTop: 10 }}>
          <label
            htmlFor="prestamoRefinanciadoId"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Préstamo que Refinancia *
          </label>
          <Dropdown
            id="prestamoRefinanciadoId"
            value={formData.prestamoRefinanciadoId}
            options={prestamosOptions}
            onChange={(e) => handleChange("prestamoRefinanciadoId", e.value)}
            placeholder="Seleccionar préstamo"
            disabled={readOnly || !formData.empresaId}
            required={formData.esRefinanciamiento}
            filter
            filterBy="label"
          />
        </div>
      )}

      {/* FILA 4: Fechas y Montos */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="fechaContrato"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
          <label
            htmlFor="fechaDesembolso"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Fecha de Desembolso *
          </label>
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
          <label
            htmlFor="fechaVencimiento"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
        <div style={{ flex: 1 }}>
          <label
            htmlFor="montoAprobado"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
          <label
            htmlFor="montoDesembolsado"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
      </div>

      {/* FILA 5: Tasas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="tasaInteresAnual"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Tasa Interés Anual (%) *
          </label>
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
          <label
            htmlFor="tasaInteresEfectiva"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            TEA (%)
          </label>
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
          <label
            htmlFor="tasaMoratoria"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
        <div style={{ flex: 1 }}>
          <label
            htmlFor="plazoMeses"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
          <label
            htmlFor="numeroCuotas"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
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
          <label
            htmlFor="diaPago"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
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
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="periodoGracia"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Periodo Gracia (Meses)
          </label>
          <InputNumber
            id="periodoGracia"
            value={formData.periodoGracia}
            onValueChange={(e) => handleChange("periodoGracia", e.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* FILA 6: Comisiones y Seguros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="comisionInicial"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Comisión Inicial
          </label>
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
          <label
            htmlFor="comisionMantenimiento"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Comisión Mantenimiento
          </label>
          <InputNumber
            id="comisionMantenimiento"
            value={formData.comisionMantenimiento}
            onValueChange={(e) =>
              handleChange("comisionMantenimiento", e.value)
            }
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            disabled={readOnly}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="seguroDesgravamen"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Seguro Desgravamen
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
        <div style={{ flex: 1 }}>
          <label
            htmlFor="tipoGarantia"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Tipo de Garantía
          </label>
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
          <label
            htmlFor="valorGarantia"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Valor de Garantía
          </label>
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

      {/* FILA 7: Descripciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="destinoFondos"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Destino de Fondos
          </label>
          <InputTextarea
            id="destinoFondos"
            value={formData.destinoFondos}
            onChange={(e) =>
              handleChange("destinoFondos", e.target.value.toUpperCase())
            }
            placeholder="Descripción del destino de los fondos"
            disabled={readOnly}
            rows={2}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="descripcionGarantia"
            style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
          >
            Descripción de Garantía
          </label>
          <InputTextarea
            id="descripcionGarantia"
            value={formData.descripcionGarantia}
            onChange={(e) =>
              handleChange("descripcionGarantia", e.target.value.toUpperCase())
            }
            placeholder="Descripción detallada de la garantía"
            disabled={readOnly}
            rows={2}
          />
        </div>
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
