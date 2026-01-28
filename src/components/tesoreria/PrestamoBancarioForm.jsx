// src/components/tesoreria/PrestamoBancarioForm.jsx
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { useForm, Controller } from "react-hook-form";
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
  recalcularCuotasPrestamo,
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
import { getTipoPrestamoActivos } from "../../api/tesoreria/tipoPrestamo";

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
  ref,
) {
  const toast = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [enums, setEnums] = useState({
    tiposAmortizacion: [],
    frecuenciasPago: [],
    tiposGarantia: [],
  });
  const [prestamos, setPrestamos] = useState([]);
  const [tiposPrestamo, setTiposPrestamo] = useState([]);
  const [lineasCredito, setLineasCredito] = useState([]);
  const [prestamosParaRefinanciar, setPrestamosParaRefinanciar] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: defaultValues?.id ? Number(defaultValues.id) : null,
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
      montoAprobado: defaultValues?.montoAprobado || 0,
      montoDesembolsado: defaultValues?.montoDesembolsado || 0,
      monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
      tasaInteresAnual: defaultValues?.tasaInteresAnual || 0,
      tasaInteresEfectiva: defaultValues?.tasaInteresEfectiva || 0,
      tasaMoratoria: defaultValues?.tasaMoratoria || 0,
      comisionInicial: defaultValues?.comisionInicial || 0,
      comisionMantenimiento: defaultValues?.comisionMantenimiento || 0,
      seguroDesgravamen: defaultValues?.seguroDesgravamen || 0,
      tipoAmortizacion: defaultValues?.tipoAmortizacion || "",
      plazoMeses: defaultValues?.plazoMeses || 0,
      numeroCuotas: defaultValues?.numeroCuotas || 0,
      frecuenciaPago: defaultValues?.frecuenciaPago || "",
      numeroDias: defaultValues?.numeroDias || 0,
      diaPago: defaultValues?.diaPago || 1,
      periodoGracia: defaultValues?.periodoGracia || 0,
      tipoGarantia: defaultValues?.tipoGarantia || "",
      valorGarantia: defaultValues?.valorGarantia || 0,
      numeroGarantia: defaultValues?.numeroGarantia || "",
      numeroCartaCredito: defaultValues?.numeroCartaCredito || "",
      beneficiario: defaultValues?.beneficiario || "",
      saldoCapital: defaultValues?.saldoCapital || 0,
      saldoInteres: defaultValues?.saldoInteres || 0,
      capitalPagado: defaultValues?.capitalPagado || 0,
      interesPagado: defaultValues?.interesPagado || 0,
      estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : null,
      destinoFondos: defaultValues?.destinoFondos || "",
      descripcionGarantia: defaultValues?.descripcionGarantia || "",
      observaciones: defaultValues?.observaciones || "",
      esRefinanciamiento: defaultValues?.esRefinanciamiento || false,
      prestamoRefinanciadoId: defaultValues?.prestamoRefinanciadoId
        ? Number(defaultValues.prestamoRefinanciadoId)
        : null,
      esRevolvente: defaultValues?.esRevolvente || false,
      permitePagoParcial: defaultValues?.permitePagoParcial || false,
      tipoPrestamoId: defaultValues?.tipoPrestamoId
        ? Number(defaultValues.tipoPrestamoId)
        : null,
      refNroProformaVentaExportacion:
        defaultValues?.refNroProformaVentaExportacion || "",
      urlDocumentoPrincipal: defaultValues?.urlDocumentoPDF || "",
      urlDocumentoAdicional: defaultValues?.urlDocAdicionalPDF || "",
    },
  });

  const empresaIdWatch = watch("empresaId");
  const bancoIdWatch = watch("bancoId");
  const monedaIdWatch = watch("monedaId");

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (empresaIdWatch && bancoIdWatch) {
      cargarLineasCredito();
    }
  }, [empresaIdWatch, bancoIdWatch]);

  useEffect(() => {
    if (empresaIdWatch) {
      cargarPrestamosParaRefinanciar();
    }
  }, [empresaIdWatch]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (
        name === "urlDocumentoPrincipal" ||
        name === "urlDocumentoAdicional"
      ) {
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const cargarDatosIniciales = async () => {
    try {
      setCargandoDatos(true);
      const [
        empresasData,
        bancosData,
        monedasData,
        cuentasData,
        estadosData,
        enumsData,
        prestamosData,
        tiposPrestamoData,
      ] = await Promise.all([
        getEmpresas(),
        getBancos(),
        getMonedas(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncionPorTipoProviene(21),
        getEnumsTesoreria(),
        getAllPrestamoBancario(),
        getTipoPrestamoActivos(),
      ]);
      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setCuentasCorrientes(cuentasData);
      setEstados(estadosData);
      setEnums(enumsData);
      setPrestamos(prestamosData);
      setTiposPrestamo(tiposPrestamoData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const cargarPrestamosParaRefinanciar = async () => {
    try {
      const response = await getAllPrestamoBancario();
      const prestamosFiltrados = response.filter(
        (p) =>
          Number(p.empresaId) === Number(empresaIdWatch) &&
          (Number(p.estadoId) === 81 ||
            Number(p.estadoId) === 83 ||
            Number(p.estadoId) === 84),
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
          Number(linea.empresaId) === Number(empresaIdWatch) &&
          Number(linea.bancoId) === Number(bancoIdWatch),
      );
      setLineasCredito(lineasFiltradas);
    } catch (error) {
      console.error("Error al cargar líneas de crédito:", error);
    }
  };

  useEffect(() => {
    const currentEmpresa = getValues("empresaId");
    const currentBanco = getValues("bancoId");
    const currentMoneda = getValues("monedaId");

    if (
      empresaIdWatch !== currentEmpresa ||
      bancoIdWatch !== currentBanco ||
      monedaIdWatch !== currentMoneda
    ) {
      setValue("lineaCreditoId", null);
      setValue("cuentaCorrienteId", null);
    }
  }, [empresaIdWatch, bancoIdWatch, monedaIdWatch, setValue, getValues]);

  useImperativeHandle(ref, () => ({
    getFormData: () => getValues(),
    setFormData: (data) => {
      Object.keys(data).forEach((key) => {
        setValue(key, data[key]);
      });
    },
  }));

  const onSubmitForm = async (data) => {
    try {
      const dataToSend = {
        empresaId: data.empresaId,
        bancoId: data.bancoId,
        lineaCreditoId: data.lineaCreditoId,
        cuentaCorrienteId: data.cuentaCorrienteId,
        numeroPrestamo: data.numeroPrestamo,
        numeroContrato: data.numeroContrato,
        fechaContrato: data.fechaContrato?.toISOString
          ? data.fechaContrato.toISOString()
          : data.fechaContrato,
        fechaDesembolso: data.fechaDesembolso?.toISOString
          ? data.fechaDesembolso.toISOString()
          : data.fechaDesembolso,
        fechaVencimiento: data.fechaVencimiento?.toISOString
          ? data.fechaVencimiento.toISOString()
          : data.fechaVencimiento,
        fechaEmision: data.fechaEmision?.toISOString
          ? data.fechaEmision.toISOString()
          : data.fechaEmision,
        fechaExpiracion: data.fechaExpiracion?.toISOString
          ? data.fechaExpiracion.toISOString()
          : data.fechaExpiracion,
        montoAprobado: data.montoAprobado,
        montoDesembolsado: data.montoDesembolsado,
        monedaId: data.monedaId,
        tasaInteresAnual: data.tasaInteresAnual,
        tasaInteresEfectiva: data.tasaInteresEfectiva,
        tasaMoratoria: data.tasaMoratoria,
        comisionInicial: data.comisionInicial,
        comisionMantenimiento: data.comisionMantenimiento,
        seguroDesgravamen: data.seguroDesgravamen,
        tipoAmortizacion: data.tipoAmortizacion,
        plazoMeses: data.plazoMeses,
        numeroCuotas: data.numeroCuotas,
        frecuenciaPago: data.frecuenciaPago,
        numeroDias: data.numeroDias,
        diaPago: data.diaPago,
        periodoGracia: data.periodoGracia,
        tipoGarantia: data.tipoGarantia,
        valorGarantia: data.valorGarantia,
        numeroGarantia: data.numeroGarantia,
        numeroCartaCredito: data.numeroCartaCredito,
        beneficiario: data.beneficiario,
        saldoCapital: data.saldoCapital,
        saldoInteres: data.saldoInteres,
        capitalPagado: data.capitalPagado,
        interesPagado: data.interesPagado,
        estadoId: data.estadoId,
        destinoFondos: data.destinoFondos,
        descripcionGarantia: data.descripcionGarantia,
        observaciones: data.observaciones,
        esRefinanciamiento: data.esRefinanciamiento,
        prestamoRefinanciadoId: data.prestamoRefinanciadoId,
        esRevolvente: data.esRevolvente,
        permitePagoParcial: data.permitePagoParcial,
        tipoPrestamoId: data.tipoPrestamoId,
        refNroProformaVentaExportacion: data.refNroProformaVentaExportacion,
        urlDocumentoPDF: data.urlDocumentoPrincipal || null,
        urlDocAdicionalPDF: data.urlDocumentoAdicional || null,
      };

      let resultado;
      if (isEdit) {
        resultado = await updatePrestamoBancario(defaultValues.id, dataToSend);

        try {
          const recalculoResultado = await recalcularCuotasPrestamo(
            defaultValues.id,
          );

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Préstamo actualizado. ${recalculoResultado.mensaje}. Cuotas recalculadas: ${recalculoResultado.cuotasRecalculadas}`,
            life: 5000,
          });
        } catch (recalculoError) {
          toast.current?.show({
            severity: "warn",
            summary: "Advertencia",
            detail:
              "Préstamo actualizado pero hubo un error al recalcular las cuotas: " +
              (recalculoError.response?.data?.mensaje ||
                recalculoError.message),
            life: 5000,
          });
        }
      } else {
        resultado = await createPrestamoBancario(dataToSend);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Préstamo creado correctamente",
          life: 3000,
        });
      }

      onSubmit(resultado);
    } catch (error) {
      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al guardar el préstamo";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
    }
  };

  const monedaSeleccionada = useMemo(() => {
    return monedas.find((m) => Number(m.id) === Number(monedaIdWatch));
  }, [monedas, monedaIdWatch]);

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
    if (!empresaIdWatch || !bancoIdWatch || !monedaIdWatch) {
      return [];
    }

    return cuentasCorrientes
      .filter(
        (c) =>
          Number(c.empresaId) === Number(empresaIdWatch) &&
          Number(c.bancoId) === Number(bancoIdWatch) &&
          Number(c.monedaId) === Number(monedaIdWatch),
      )
      .map((c) => ({
        ...c,
        id: Number(c.id),
        label: `${c.numeroCuenta} - ${c.banco?.nombre || ""} - ${
          c.moneda?.codigoSunat || ""
        }`,
        value: Number(c.id),
      }));
  }, [cuentasCorrientes, empresaIdWatch, bancoIdWatch, monedaIdWatch]);

  const estadosOptions = estados.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const tiposPrestamoOptions = tiposPrestamo.map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion,
    value: Number(t.id),
  }));

  const lineasCreditoOptions = useMemo(() => {
    return lineasCredito.map((l) => ({
      ...l,
      id: Number(l.id),
      bancoId: Number(l.bancoId),
      empresaId: Number(l.empresaId),
      label: `${l.numeroLinea} - ${l.moneda?.codigoSunat || ""} ${Number(
        l.montoDisponible,
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
        label: `${p.numeroPrestamo} - ${p.banco?.nombre || ""} - ${
          p.moneda?.codigoSunat || ""
        } ${Number(p.saldoCapital || 0).toFixed(2)}`,
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
              <Controller
                name="empresaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="empresaId"
                    value={field.value}
                    options={empresasOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione empresa"
                    filter
                    disabled={readOnly || empresaFija}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="bancoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="bancoId"
                    value={field.value}
                    options={bancosOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione banco"
                    filter
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="monedaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="monedaId"
                    value={field.value}
                    options={monedasOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione moneda"
                    filter
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="lineaCreditoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="lineaCreditoId"
                    value={field.value}
                    options={lineasCreditoOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione línea"
                    optionLabel="label"
                    optionValue="value"
                    filter
                    showClear
                    disabled={readOnly || !empresaIdWatch || !bancoIdWatch}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="cuentaCorrienteId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="cuentaCorrienteId"
                    value={field.value}
                    options={cuentasCorrientesOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione cuenta"
                    filter
                    showClear
                    disabled={readOnly || !empresaIdWatch || !bancoIdWatch}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="estadoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estadoId"
                    value={field.value}
                    options={estadosOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione estado"
                    optionLabel="label"
                    optionValue="value"
                    filter
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

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
              <Controller
                name="numeroPrestamo"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroPrestamo"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Ej: PRES-2024-001"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="numeroContrato"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroContrato"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Ej: CONT-2024-001"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="tipoPrestamoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoPrestamoId"
                    value={field.value}
                    options={tiposPrestamoOptions}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione tipo"
                    optionLabel="label"
                    optionValue="value"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                    filter
                    showClear
                  />
                )}
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
              <Controller
                name="tipoAmortizacion"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoAmortizacion"
                    value={field.value}
                    options={enums.tiposAmortizacion}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione tipo"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="fechaContrato"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaContrato"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="fechaDesembolso"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaDesembolso"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVencimiento"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

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
              <Controller
                name="montoAprobado"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="montoAprobado"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="montoDesembolsado"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Monto Desembolsado *
              </label>
              <Controller
                name="montoDesembolsado"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="montoDesembolsado"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="plazoMeses"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Plazo (Meses) *
              </label>
              <Controller
                name="plazoMeses"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="plazoMeses"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="numeroCuotas"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Cuotas *
              </label>
              <Controller
                name="numeroCuotas"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="numeroCuotas"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.75 }}>
              <label
                htmlFor="frecuenciaPago"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Frecuencia de Pago *
              </label>
              <Controller
                name="frecuenciaPago"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="frecuenciaPago"
                    value={field.value}
                    options={enums.frecuenciasPago}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione frecuencia"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="numeroDias"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Número de Días
              </label>
              <Controller
                name="numeroDias"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="numeroDias"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
                Día de Pago *
              </label>
              <Controller
                name="diaPago"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="diaPago"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={1}
                    max={31}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="periodoGracia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Período de Gracia
              </label>
              <Controller
                name="periodoGracia"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="periodoGracia"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tasaInteresAnual"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tasa de Interés Anual (%) *
              </label>
              <Controller
                name="tasaInteresAnual"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="tasaInteresAnual"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tasaInteresEfectiva"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tasa de Interés Efectiva (%)
              </label>
              <Controller
                name="tasaInteresEfectiva"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="tasaInteresEfectiva"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="tasaMoratoria"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Tasa Moratoria (%)
              </label>
              <Controller
                name="tasaMoratoria"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="tasaMoratoria"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    min={0}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="comisionInicial"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Comisión Inicial
              </label>
              <Controller
                name="comisionInicial"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="comisionInicial"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="comisionMantenimiento"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Comisión Mantenimiento
              </label>
              <Controller
                name="comisionMantenimiento"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="comisionMantenimiento"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="seguroDesgravamen"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Seguro Desgravamen
              </label>
              <Controller
                name="seguroDesgravamen"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="seguroDesgravamen"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
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
              <Controller
                name="tipoGarantia"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoGarantia"
                    value={field.value}
                    options={enums.tiposGarantia}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione tipo"
                    disabled={readOnly}
                    style={{ width: "100%" }}
                    showClear
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="valorGarantia"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                Valor de Garantía
              </label>
              <Controller
                name="valorGarantia"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="valorGarantia"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
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
              <Controller
                name="beneficiario"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="beneficiario"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="numeroGarantia"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroGarantia"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="numeroCartaCredito"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroCartaCredito"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="refNroProformaVentaExportacion"
                style={{
                  fontWeight: "bold",
                  fontSize: getResponsiveFontSize(),
                }}
              >
                N° Proforma Venta Exportacion
              </label>
              <Controller
                name="refNroProformaVentaExportacion"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="refNroProformaVentaExportacion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Ej: PF-EXP-2024-001"
                    disabled={readOnly}
                    style={{ width: "100%", textTransform: "uppercase" }}
                    maxLength={100}
                  />
                )}
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
              <Controller
                name="fechaEmision"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEmision"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="fechaExpiracion"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaExpiracion"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

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
              <Controller
                name="esRevolvente"
                control={control}
                render={({ field }) => (
                  <Button
                    id="esRevolvente"
                    label={field.value ? "SÍ REVOLVENTE" : "NO REVOLVENTE"}
                    icon={
                      field.value ? "pi pi-check-circle" : "pi pi-times-circle"
                    }
                    severity={field.value ? "success" : "secondary"}
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    outlined
                    style={{ width: "100%", fontSize: getResponsiveFontSize() }}
                  />
                )}
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
              <Controller
                name="permitePagoParcial"
                control={control}
                render={({ field }) => (
                  <Button
                    id="permitePagoParcial"
                    label={
                      field.value ? "PERMITE PARCIAL" : "NO PERMITE PARCIAL"
                    }
                    icon={
                      field.value ? "pi pi-check-circle" : "pi pi-times-circle"
                    }
                    severity={field.value ? "info" : "secondary"}
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    outlined
                    style={{ width: "100%", fontSize: getResponsiveFontSize() }}
                  />
                )}
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
              <Controller
                name="esRefinanciamiento"
                control={control}
                render={({ field }) => (
                  <Button
                    id="esRefinanciamiento"
                    label={
                      field.value
                        ? "ES REFINANCIAMIENTO"
                        : "NO ES REFINANCIAMIENTO"
                    }
                    icon={field.value ? "pi pi-refresh" : "pi pi-times-circle"}
                    severity={field.value ? "warning" : "secondary"}
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    outlined
                    style={{ width: "100%", fontSize: getResponsiveFontSize() }}
                  />
                )}
              />
            </div>
            {watch("esRefinanciamiento") && (
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
                <Controller
                  name="prestamoRefinanciadoId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="prestamoRefinanciadoId"
                      value={field.value}
                      options={prestamosRefinanciarOptions}
                      onChange={(e) => field.onChange(e.value)}
                      placeholder="Seleccione préstamo a refinanciar"
                      disabled={readOnly || !empresaIdWatch}
                      style={{
                        width: "100%",
                        fontSize: getResponsiveFontSize(),
                      }}
                      filter
                      showClear
                      emptyMessage="No hay préstamos vigentes o vencidos para refinanciar"
                    />
                  )}
                />
              </div>
            )}
          </div>

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
              <Controller
                name="destinoFondos"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="destinoFondos"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Descripción del destino de los fondos del préstamo"
                    disabled={readOnly}
                    rows={2}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="descripcionGarantia"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="descripcionGarantia"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Descripción detallada de la garantía"
                    disabled={readOnly}
                    rows={2}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    placeholder="Observaciones adicionales"
                    disabled={readOnly}
                    rows={2}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

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
              <Controller
                name="saldoCapital"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="saldoCapital"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={true}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="saldoInteres"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="saldoInteres"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={true}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="capitalPagado"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="capitalPagado"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={true}
                    style={{ width: "100%" }}
                  />
                )}
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
              <Controller
                name="interesPagado"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="interesPagado"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency={monedaSeleccionada?.codigoSunat || "PEN"}
                    locale="es-PE"
                    minFractionDigits={2}
                    disabled={true}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Cuotas" leftIcon="pi pi-list">
          {isEdit && defaultValues?.id ? (
            <CuotaPrestamoList
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "2em", marginBottom: "10px" }}
              ></i>
              <p>
                Las cuotas se generarán automáticamente después de guardar el
                préstamo.
              </p>
            </div>
          )}
        </TabPanel>

        <TabPanel header="Desembolsos" leftIcon="pi pi-money-bill">
          {isEdit && defaultValues?.id ? (
            <DesembolsoPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "2em", marginBottom: "10px" }}
              ></i>
              <p>
                Los desembolsos se podrán registrar después de guardar el
                préstamo.
              </p>
            </div>
          )}
        </TabPanel>

        <TabPanel header="Garantías" leftIcon="pi pi-shield">
          {isEdit && defaultValues?.id ? (
            <GarantiaPrestamoCard
              prestamoBancarioId={defaultValues.id}
              readOnly={readOnly}
            />
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "2em", marginBottom: "10px" }}
              ></i>
              <p>
                Las garantías se podrán registrar después de guardar el
                préstamo.
              </p>
            </div>
          )}
        </TabPanel>

        <TabPanel header="Documento Principal" leftIcon="pi pi-file-pdf">
          <DocPrestamoPrincipal
            prestamoId={defaultValues?.id}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={defaultValues}
            readOnly={readOnly}
          />
        </TabPanel>

        <TabPanel header="Documento Adicional" leftIcon="pi pi-file-pdf">
          <DocPrestamoAdicional
            prestamoId={defaultValues?.id}
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={defaultValues}
            readOnly={readOnly}
          />
        </TabPanel>
      </TabView>

      {!readOnly && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onCancel}
            outlined
          />
          <Button
            label={isEdit ? "Actualizar Préstamo" : "Crear Préstamo"}
            icon="pi pi-save"
            severity="success"
            onClick={handleSubmit(onSubmitForm)}
          />
        </div>
      )}
    </div>
  );
});

export default PrestamoBancarioForm;
