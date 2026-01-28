// src/components/oTMantenimiento/OTMantenimientoForm.jsx
// Formulario profesional para OTMantenimiento siguiendo patrón CotizacionVentasForm
// Incluye TabView, campos booleanos como botones, validaciones y estilos profesionales
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Panel } from "primereact/panel";
import { getSeriesDoc } from "../../api/oTMantenimiento";
import DetTareasOTCard from "./DetTareasOTCard";
import PdfFotosAntesCard from "./PdfFotosAntesCard";
import PdfFotosDespuesCard from "./PdfFotosDespuesCard";
import VerImpresionOTMantenimientoPDF from "./VerImpresionOTMantenimientoPDF";
import EntregaARendirOTMantenimientoCard from "./EntregaARendirOTMantenimientoCard";

const OTMantenimientoForm = ({
  isEdit,
  defaultValues = null,
  onSubmit,
  onCancel,
  empresas = [],
  tiposMantenimiento = [],
  motivosOrigen = [],
  estadosDoc = [],
  estadosTarea = [],
  estadosInsumo = [],
  activos = [],
  sedes = [],
  personalOptions = [],
  contratistas = [],
  productos = [],
  tiposDocumento = [],
  seriesDocs = [],
  monedas = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  empresaFija = null,
  permisos = {},
  readOnly = false,
  loading: loadingProp = false,
  toast: toastProp,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useRef(toastProp || null);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [countEntregasRendir, setCountEntregasRendir] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Agregar react-hook-form SOLO para campos PDF
  const {
    control,
    watch,
    setValue: setValuePdf,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      urlFotosAntesPdf: defaultValues?.urlFotosAntesPdf || "",
      urlFotosDespuesPdf: defaultValues?.urlFotosDespuesPdf || "",
    },
  });

  const [formData, setFormData] = useState({
    id: defaultValues?.id || null,
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
        ? Number(empresaFija)
        : null,
    tipoDocumentoId: defaultValues?.tipoDocumentoId
      ? Number(defaultValues.tipoDocumentoId)
      : tiposDocumento.find((t) => Number(t.id) === 21)?.id || null,
    serieDocId: defaultValues?.serieDocId
      ? Number(defaultValues.serieDocId)
      : null,
    numeroSerie: defaultValues?.numeroSerie || "",
    numeroCorrelativo: defaultValues?.numeroCorrelativo || 0,
    numeroCompleto: defaultValues?.numeroCompleto || "",
    fechaDocumento: defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
    sedeId: defaultValues?.sedeId ? Number(defaultValues.sedeId) : null,
    activoId: defaultValues?.activoId ? Number(defaultValues.activoId) : null,
    tipoMantenimientoId: defaultValues?.tipoMantenimientoId
      ? Number(defaultValues.tipoMantenimientoId)
      : null,
    motivoOriginoId: defaultValues?.motivoOriginoId
      ? Number(defaultValues.motivoOriginoId)
      : null,
    prioridadAlta:
      defaultValues?.prioridadAlta !== undefined
        ? defaultValues.prioridadAlta
        : false,
    estadoId: defaultValues?.estadoId
      ? Number(defaultValues.estadoId)
      : estadosDoc.find((e) => e.descripcion === "PENDIENTE")?.id ||
        estadosDoc[0]?.id ||
        null,
    fechaProgramada: defaultValues?.fechaProgramada
      ? new Date(defaultValues.fechaProgramada)
      : null,
    fechaInicio: defaultValues?.fechaInicio
      ? new Date(defaultValues.fechaInicio)
      : null,
    fechaFin: defaultValues?.fechaFin ? new Date(defaultValues.fechaFin) : null,
    monedaId: defaultValues?.monedaId
      ? Number(defaultValues.monedaId)
      : monedas.find((m) => m.codigoSunat === "PEN")?.id ||
        monedas[0]?.id ||
        null,
    solicitanteId: defaultValues?.solicitanteId
      ? Number(defaultValues.solicitanteId)
      : null,
    responsableId: defaultValues?.responsableId
      ? Number(defaultValues.responsableId)
      : null,
    autorizadoPorId: defaultValues?.autorizadoPorId
      ? Number(defaultValues.autorizadoPorId)
      : null,
    validadoPorId: defaultValues?.validadoPorId
      ? Number(defaultValues.validadoPorId)
      : null,
    descripcionProblema: defaultValues?.descripcionProblema || "",
    solucionAplicada: defaultValues?.solucionAplicada || "",
    observaciones: defaultValues?.observaciones || "",
    urlFotosAntesPdf: defaultValues?.urlFotosAntesPdf || null,
    urlFotosDespuesPdf: defaultValues?.urlFotosDespuesPdf || null,
    urlOrdenTrabajoPdf: defaultValues?.urlOrdenTrabajoPdf || null,
    planMantenimientoId: defaultValues?.planMantenimientoId
      ? Number(defaultValues.planMantenimientoId)
      : null,
  });

  // Filtrar sedes y activos según empresa seleccionada
  const sedesFiltradas = sedes.filter(
    (s) =>
      !formData.empresaId || Number(s.empresaId) === Number(formData.empresaId),
  );

  const activosFiltrados = activos.filter(
    (a) =>
      !formData.empresaId || Number(a.empresaId) === Number(formData.empresaId),
  );

  const handleChange = (field, value) => {
    // Si cambia la empresa, limpiar sede y activo
    if (field === "empresaId") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        sedeId: null,
        activoId: null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Incrementar refreshTrigger cuando cambien defaultValues (orden actualizada)
  useEffect(() => {
    if (defaultValues?.id) {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [defaultValues]);

  // Cargar series de documentos cuando cambie empresa (tipoDocumentoId siempre es 21)
  useEffect(() => {
    if (formData.empresaId && !isEdit) {
      cargarSeriesDoc();
    }
  }, [formData.empresaId, isEdit]);

  const cargarSeriesDoc = async () => {
    try {
      // Siempre usar tipoDocumentoId = 21 (Orden de Trabajo)
      const series = await getSeriesDoc(formData.empresaId, 21);
      setSeriesDoc(series);
    } catch (error) {
      console.error("Error al cargar series:", error);
    }
  };

  const handleSerieDocChange = (serieId) => {
    setFormData((prev) => ({ ...prev, serieDocId: Number(serieId) }));
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const proximoCorrelativo = Number(serie.correlativo) + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0",
        );
        const numCorre = String(proximoCorrelativo).padStart(
          serie.numCerosIzqCorre,
          "0",
        );
        const numeroCompleto = `${numSerie}-${numCorre}`;

        setFormData((prev) => ({
          ...prev,
          numeroSerie: numSerie,
          numeroCorrelativo: proximoCorrelativo,
          numeroCompleto: numeroCompleto,
        }));
      }
    }
  };

  const validarFormulario = () => {
    const camposFaltantes = [];

    if (!formData.empresaId) camposFaltantes.push("Empresa");
    if (!formData.tipoDocumentoId) camposFaltantes.push("Tipo de Documento");
    if (!formData.serieDocId) camposFaltantes.push("Serie de Documento");
    if (!formData.activoId) camposFaltantes.push("Activo");
    if (!formData.tipoMantenimientoId)
      camposFaltantes.push("Tipo de Mantenimiento");
    if (!formData.motivoOriginoId) camposFaltantes.push("Motivo de Origen");
    if (!formData.estadoId) camposFaltantes.push("Estado");
    if (!formData.monedaId) camposFaltantes.push("Moneda");
    if (!formData.responsableId || Number(formData.responsableId) <= 0) {
      camposFaltantes.push("Responsable (necesario para Entrega a Rendir)");
    }

    if (camposFaltantes.length > 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Campos Obligatorios Faltantes",
        detail: (
          <div>
            <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Los siguientes campos son obligatorios:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {camposFaltantes.map((campo, index) => (
                <li key={index}>{campo}</li>
              ))}
            </ul>
          </div>
        ),
        life: 6000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Sincronizar campos PDF de react-hook-form con formData
      const datosPDF = getValues();
      const datosCompletos = {
        ...formData,
        urlFotosAntesPdf:
          datosPDF.urlFotosAntesPdf || formData.urlFotosAntesPdf,
        urlFotosDespuesPdf:
          datosPDF.urlFotosDespuesPdf || formData.urlFotosDespuesPdf,
      };

      await onSubmit(datosCompletos);
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || loadingProp;

  return (
    <div className="ot-mantenimiento-form">
      <Toast ref={toast} />

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales">
          <Panel header="Información Principal" className="mb-3">
            {/* FILA: Empresa, Sede */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
                  Empresa *
                </label>
                <Dropdown
                  id="empresaId"
                  value={formData.empresaId}
                  options={empresas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => handleChange("empresaId", e.value)}
                  placeholder="Seleccionar empresa"
                  filter
                  disabled={disabled || empresaFija}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="sedeId" style={{ fontWeight: "bold" }}>
                  Sede
                </label>
                <Dropdown
                  id="sedeId"
                  value={formData.sedeId}
                  options={sedesFiltradas.map((s) => ({
                    label: s.nombre,
                    value: Number(s.id),
                  }))}
                  onChange={(e) => handleChange("sedeId", e.value)}
                  placeholder="Seleccionar sede"
                  filter
                  showClear
                  disabled={disabled || !formData.empresaId}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* FILA: Tipo Documento, Serie, Número Documento, Moneda */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoDocumentoId" style={{ fontWeight: "bold" }}>
                  Tipo Documento *
                </label>
                <Dropdown
                  id="tipoDocumentoId"
                  value={formData.tipoDocumentoId}
                  options={tiposDocumento
                    .filter((t) => Number(t.id) === 21)
                    .map((t) => ({
                      label: t.descripcion,
                      value: Number(t.id),
                    }))}
                  onChange={(e) => handleChange("tipoDocumentoId", e.value)}
                  placeholder="Orden de Trabajo"
                  disabled={true}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="serieDocId" style={{ fontWeight: "bold" }}>
                  Serie de Dcmto <span style={{ color: "red" }}>*</span>
                </label>
                <Dropdown
                  id="serieDocId"
                  value={formData.serieDocId}
                  options={seriesDoc.map((s) => ({
                    label: `${s.serie} (Correlativo: ${Number(s.correlativo)})`,
                    value: Number(s.id),
                  }))}
                  onChange={(e) => handleSerieDocChange(e.value)}
                  placeholder="Seleccionar serie"
                  disabled={!formData.empresaId || !!formData.serieDocId}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroCompleto" style={{ fontWeight: "bold" }}>
                  Número Completo
                </label>
                <InputText
                  id="numeroCompleto"
                  value={formData.numeroCompleto}
                  readOnly
                  style={{
                    width: "100%",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
                  Moneda *
                </label>
                <Dropdown
                  id="monedaId"
                  value={formData.monedaId}
                  options={monedas.map((m) => ({
                    label: `${m.codigoSunat}`,
                    value: Number(m.id),
                  }))}
                  onChange={(e) => handleChange("monedaId", e.value)}
                  placeholder="Seleccionar moneda"
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* FILA: Activo, Tipo Mantenimiento, Motivo Origen */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="activoId" style={{ fontWeight: "bold" }}>
                  Activo *
                </label>
                <Dropdown
                  id="activoId"
                  value={formData.activoId}
                  options={activosFiltrados.map((a) => ({
                    label: `${a.descripcion}`,
                    value: Number(a.id),
                  }))}
                  onChange={(e) => handleChange("activoId", e.value)}
                  placeholder="Seleccionar activo"
                  filter
                  disabled={disabled || !formData.empresaId}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="tipoMantenimientoId"
                  style={{ fontWeight: "bold" }}
                >
                  Tipo Mantenimiento *
                </label>
                <Dropdown
                  id="tipoMantenimientoId"
                  value={formData.tipoMantenimientoId}
                  options={tiposMantenimiento.map((t) => ({
                    label: t.nombre,
                    value: Number(t.id),
                  }))}
                  onChange={(e) => handleChange("tipoMantenimientoId", e.value)}
                  placeholder="Seleccionar tipo"
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="motivoOriginoId" style={{ fontWeight: "bold" }}>
                  Motivo Origen *
                </label>
                <Dropdown
                  id="motivoOriginoId"
                  value={formData.motivoOriginoId}
                  options={motivosOrigen.map((m) => ({
                    label: m.nombre,
                    value: Number(m.id),
                  }))}
                  onChange={(e) => handleChange("motivoOriginoId", e.value)}
                  placeholder="Seleccionar motivo"
                  filter
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* FILA: Estado, Prioridad, Fecha Documento */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>
                  Estado *
                </label>
                <Dropdown
                  id="estadoId"
                  value={formData.estadoId}
                  options={(() => {
                    return estadosDoc.map((e) => ({
                      label: e.descripcion,
                      value: Number(e.id),
                    }));
                  })()}
                  onChange={(e) => handleChange("estadoId", e.value)}
                  placeholder="Seleccionar estado"
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold" }}>Prioridad</label>
                <Button
                  type="button"
                  label={formData.prioridadAlta ? "ALTA" : "NORMAL"}
                  severity={formData.prioridadAlta ? "danger" : "secondary"}
                  onClick={() =>
                    handleChange("prioridadAlta", !formData.prioridadAlta)
                  }
                  disabled={disabled}
                  style={{
                    width: "100%",
                    fontWeight: "bold",
                    marginTop: "0.25rem",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaDocumento" style={{ fontWeight: "bold" }}>
                  Fecha Documento
                </label>
                <Calendar
                  id="fechaDocumento"
                  value={formData.fechaDocumento}
                  onChange={(e) => handleChange("fechaDocumento", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </Panel>

          <Panel header="Fechas de Ejecución" className="mb-3">
            {/* FILA: Fecha Programada, Fecha Inicio, Fecha Fin */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaProgramada" style={{ fontWeight: "bold" }}>
                  Fecha Programada
                </label>
                <Calendar
                  id="fechaProgramada"
                  value={formData.fechaProgramada}
                  onChange={(e) => handleChange("fechaProgramada", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaInicio" style={{ fontWeight: "bold" }}>
                  Fecha Inicio
                </label>
                <Calendar
                  id="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange("fechaInicio", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  showTime
                  hourFormat="24"
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaFin" style={{ fontWeight: "bold" }}>
                  Fecha Fin
                </label>
                <Calendar
                  id="fechaFin"
                  value={formData.fechaFin}
                  onChange={(e) => handleChange("fechaFin", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  showTime
                  hourFormat="24"
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </Panel>

          <Panel header="Responsables" className="mb-3">
            {/* FILA: Solicitante, Responsable */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="solicitanteId" style={{ fontWeight: "bold" }}>
                  Solicitante
                </label>
                <Dropdown
                  id="solicitanteId"
                  value={formData.solicitanteId}
                  options={personalOptions.map((p) => ({
                    label: `${p.nombres} ${p.apellidos}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => handleChange("solicitanteId", e.value)}
                  placeholder="Seleccionar solicitante"
                  filter
                  showClear
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="responsableId" style={{ fontWeight: "bold" }}>
                  Responsable
                </label>
                <Dropdown
                  id="responsableId"
                  value={formData.responsableId}
                  options={personalOptions.map((p) => ({
                    label: `${p.nombres} ${p.apellidos}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => handleChange("responsableId", e.value)}
                  placeholder="Seleccionar responsable"
                  filter
                  showClear
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* FILA: Autorizado Por, Validado Por */}
            <div
              style={{
                marginTop: "0.5rem",
                alignItems: "end",
                display: "flex",
                gap: 3,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="autorizadoPorId" style={{ fontWeight: "bold" }}>
                  Autorizado Por
                </label>
                <Dropdown
                  id="autorizadoPorId"
                  value={formData.autorizadoPorId}
                  options={personalOptions.map((p) => ({
                    label: `${p.nombres} ${p.apellidos}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => handleChange("autorizadoPorId", e.value)}
                  placeholder="Seleccionar autorizador"
                  filter
                  showClear
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="validadoPorId" style={{ fontWeight: "bold" }}>
                  Validado Por
                </label>
                <Dropdown
                  id="validadoPorId"
                  value={formData.validadoPorId}
                  options={personalOptions.map((p) => ({
                    label: `${p.nombres} ${p.apellidos}`,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => handleChange("validadoPorId", e.value)}
                  placeholder="Seleccionar validador"
                  filter
                  showClear
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </Panel>

          <Panel header="Descripción y Observaciones" className="mb-3">
            {/* FILA: Descripción del Problema */}
            <div style={{ marginTop: "0.5rem" }}>
              <label
                htmlFor="descripcionProblema"
                style={{ fontWeight: "bold" }}
              >
                Descripción del Problema
              </label>
              <InputTextarea
                id="descripcionProblema"
                value={formData.descripcionProblema}
                onChange={(e) =>
                  handleChange("descripcionProblema", e.target.value)
                }
                rows={3}
                placeholder="Describa el problema o necesidad de mantenimiento"
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>

            {/* FILA: Solución Aplicada */}
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="solucionAplicada" style={{ fontWeight: "bold" }}>
                Solución Aplicada
              </label>
              <InputTextarea
                id="solucionAplicada"
                value={formData.solucionAplicada}
                onChange={(e) =>
                  handleChange("solucionAplicada", e.target.value)
                }
                rows={3}
                placeholder="Describa la solución aplicada"
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>

            {/* FILA: Observaciones */}
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
                Observaciones
              </label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales"
                disabled={disabled}
                style={{ width: "100%" }}
              />
            </div>
          </Panel>

          {/* TAREAS OT */}
          <Panel
            header="Tareas de la Orden de Trabajo"
            className="mb-3"
            style={{ marginTop: "1rem" }}
          >
            <DetTareasOTCard
              otMantenimientoId={formData.id}
              estadosTarea={estadosTarea}
              estadosInsumo={estadosInsumo}
              personalOptions={personalOptions}
              contratistas={contratistas}
              productos={productos}
              empresaId={formData.empresaId}
              almacenId={formData.almacenId}
              permisos={permisos}
              disabled={!formData.id || loading || loadingProp}
              readOnly={readOnly}
              refreshTrigger={refreshTrigger}
            />
            {!formData.id && (
              <div
                style={{ padding: "1rem", textAlign: "center", color: "#666" }}
              >
                <i
                  className="pi pi-info-circle"
                  style={{ fontSize: "1.5rem" }}
                ></i>
                <p style={{ marginTop: "0.5rem" }}>
                  Guarde primero la orden de trabajo para poder agregar tareas.
                </p>
              </div>
            )}
          </Panel>
        </TabPanel>

        {/* TAB 3: DOCUMENTOS PDF */}
        <TabPanel header="Documentos">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* DEBUG: Ver qué IDs tenemos disponibles */}
            {console.log(
              "[OTMantenimientoForm - TAB DOCUMENTOS] defaultValues:",
              defaultValues,
            )}
            {console.log(
              "[OTMantenimientoForm - TAB DOCUMENTOS] defaultValues?.id:",
              defaultValues?.id,
            )}
            {console.log(
              "[OTMantenimientoForm - TAB DOCUMENTOS] formData.id:",
              formData.id,
            )}
            {console.log(
              "[OTMantenimientoForm - TAB DOCUMENTOS] isEdit:",
              isEdit,
            )}
            <PdfFotosAntesCard
              control={control}
              errors={errors}
              setValue={setValuePdf}
              watch={watch}
              getValues={getValues}
              defaultValues={defaultValues}
              otMantenimientoId={defaultValues?.id}
              readOnly={readOnly}
            />

            <PdfFotosDespuesCard
              control={control}
              errors={errors}
              setValue={setValuePdf}
              watch={watch}
              getValues={getValues}
              defaultValues={defaultValues}
              otMantenimientoId={defaultValues?.id}
              readOnly={readOnly}
            />

            <VerImpresionOTMantenimientoPDF
              otMantenimientoId={defaultValues?.id}
              datosOT={formData}
              tareas={[]} // Se cargará dinámicamente
              toast={toast}
              onPdfGenerated={(url) => handleChange("urlOrdenTrabajoPdf", url)}
            />
          </div>

          {!formData.id && (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "#666",
                marginTop: "1rem",
              }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "1.5rem" }}
              ></i>
              <p style={{ marginTop: "0.5rem" }}>
                Guarde primero la orden de trabajo para poder gestionar
                documentos.
              </p>
            </div>
          )}
        </TabPanel>

        {/* TAB 4: ENTREGAS A RENDIR */}
        <TabPanel
          header={`Entrega a Rendir ${countEntregasRendir > 0 ? `(${countEntregasRendir})` : ""}`}
          leftIcon="pi pi-money-bill"
        >
          <EntregaARendirOTMantenimientoCard
            otMantenimiento={formData}
            personal={personalOptions}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            puedeEditar={isEdit}
            onCountChange={setCountEntregasRendir}
            readOnly={readOnly}
            permisos={permisos}
          />

          {!formData.id && (
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: "1.5rem" }}
              ></i>
              <p style={{ marginTop: "0.5rem" }}>
                Guarde primero la orden de trabajo para poder gestionar entregas
                a rendir.
              </p>
            </div>
          )}
        </TabPanel>
      </TabView>

      {/* BOTONES DE ACCIÓN */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="button"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={readOnly || !permisos.puedeEditar}
          tooltip={
            readOnly
              ? "Modo solo lectura"
              : !permisos.puedeEditar
                ? "No tiene permisos para editar"
                : ""
          }
        />
      </div>
    </div>
  );
};

export default OTMantenimientoForm;
