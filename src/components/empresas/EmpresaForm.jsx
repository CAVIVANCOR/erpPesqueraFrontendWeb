// src/components/empresas/EmpresaForm.jsx
// Formulario modular y reutilizable para alta y edición de empresas en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
// Documentado en español técnico.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { getPersonal } from "../../api/personal";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { subirLogoEmpresa, propagarMargenes } from "../../api/empresa";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

// Esquema de validación profesional con Yup alineado al modelo Empresa de Prisma
const schema = Yup.object().shape({
  razonSocial: Yup.string().required("La razón social es obligatoria"),
  nombreComercial: Yup.string(),
  ruc: Yup.string()
    .required("El RUC es obligatorio")
    .length(11, "El RUC debe tener 11 dígitos"),
  direccion: Yup.string(),
  telefono: Yup.string(),
  email: Yup.string().email("Debe ser un email válido"),
  cesado: Yup.boolean(),
  representantelegalId: Yup.number().nullable(),
  entidadComercialId: Yup.number().nullable(),
  logo: Yup.string(),
  porcentajeIgv: Yup.number().nullable(),
  porcentajeRetencion: Yup.number().nullable(),
  montoMinimoRetencion: Yup.number().nullable(),
  cuentaDetraccion: Yup.string(),
  soyAgenteRetencion: Yup.boolean(),
  soyAgentePercepcion: Yup.boolean(),
  // Márgenes de utilidad
  margenMinimoPermitido: Yup.number()
    .nullable()
    .min(0, "El margen mínimo no puede ser negativo")
    .max(100, "El margen mínimo no puede ser mayor a 100%")
    .test(
      'margen-minimo-menor-objetivo',
      'El margen mínimo debe ser menor o igual al margen objetivo',
      function(value) {
        const { margenUtilidadObjetivo } = this.parent;
        if (value == null || margenUtilidadObjetivo == null) return true;
        return value <= margenUtilidadObjetivo;
      }
    ),
  margenUtilidadObjetivo: Yup.number()
    .nullable()
    .min(0, "El margen objetivo no puede ser negativo")
    .max(100, "El margen objetivo no puede ser mayor a 100%"),
});

/**
 * Formulario modular de empresa.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 */
/**
 * Formulario modular de empresa con gestión profesional de logo.
 * Permite mostrar, subir y actualizar el logo de la empresa usando PrimeReact y API JWT.
 * Documentado profesionalmente en español técnico.
 */
export default function EmpresaForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  // Extrae 'control' para uso con Controller
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, cesado: defaultValues.cesado ?? false },
  });

  // Estado profesional para manejo del logo
  /**
   * Estado profesional para el preview del logo.
   * Usa la variable de entorno VITE_UPLOADS_URL para flexibilidad en otros uploads.
   */
  const [logoPreview, setLogoPreview] = useState(
    defaultValues.logo
      ? `${import.meta.env.VITE_UPLOADS_URL}/logos/${defaultValues.logo}`
      : null
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [propagandoMargenes, setPropagandoMargenes] = useState(false);
  const toast = useRef(null);

  // Estado profesional para lista de personal
  const [personal, setPersonal] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // Estado profesional para lista de entidades comerciales
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [loadingEntidades, setLoadingEntidades] = useState(false);

  const listarPersonalEmpresa = async (empresaId) => {
    // Devuelve un array [{ id, nombreCompleto }]
    const data = await getPersonal(empresaId);
    // Mapea a formato profesional para combos
    return data.map((p) => ({
      id: p.id,
      nombreCompleto: `${p.nombres} ${p.apellidos}${
        p.cargo?.nombre || "" ? " (" + p.cargo?.nombre + ")" : ""
      }`.trim(),
    }));
  };

  // Carga el personal de la empresa al montar o cambiar empresaId
  useEffect(() => {
    async function cargarPersonal() {
      setLoadingPersonal(true);
      try {
        // Si tienes empresaId en defaultValues, úsalo. Si no, deja el combo vacío/deshabilitado.
        if (defaultValues.empresaId) {
          const lista = await listarPersonalEmpresa(defaultValues.empresaId);
          setPersonal(lista);
        } else {
          setPersonal([]);
        }
      } catch (err) {
        setPersonal([]);
      } finally {
        setLoadingPersonal(false);
      }
    }
    cargarPersonal();
  }, [defaultValues.empresaId]);

  // Carga las entidades comerciales filtradas por empresaId
  useEffect(() => {
    async function cargarEntidades() {
      setLoadingEntidades(true);
      try {
        if (defaultValues.id) {
          // Obtener todas las entidades comerciales y filtrar por empresaId
          const todasEntidades = await getEntidadesComerciales();
          const entidadesFiltradas = todasEntidades.filter(
            (e) => Number(e.empresaId) === Number(defaultValues.id)
          );
          setEntidadesComerciales(entidadesFiltradas);
        } else {
          setEntidadesComerciales([]);
        }
      } catch (err) {
        console.error("Error al cargar entidades comerciales:", err);
        setEntidadesComerciales([]);
      } finally {
        setLoadingEntidades(false);
      }
    }
    cargarEntidades();
  }, [defaultValues.id]);

  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, cesado: defaultValues.cesado ?? false });
    // Actualiza el preview del logo si cambia la empresa
    /**
     * Construye la URL profesional del logo usando la nueva variable de entorno general para uploads.
     */
    const urlLogo = defaultValues.logo
      ? `${import.meta.env.VITE_UPLOADS_URL}/logos/${defaultValues.logo}`
      : null;
    setLogoPreview(urlLogo);
  }, [defaultValues, isEdit, reset]);

  /**
   * Maneja la subida profesional del logo de empresa.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo logo.
   * Muestra mensajes de éxito/error profesional.
   */
  /**
   * Maneja la subida profesional del logo de empresa.
   * Muestra el preview inmediatamente usando URL.createObjectURL(file),
   * luego sube el archivo y actualiza el preview con la URL definitiva del backend.
   * Documentado en español técnico.
   */
  const handleLogoUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;
    // Validación profesional: solo imágenes y máx 2MB
    if (!file.type.startsWith("image/")) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos de imagen",
        life: 4000,
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo supera el tamaño máximo de 2MB",
        life: 4000,
      });
      return;
    }
    // Muestra el preview inmediato usando URL local
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setUploadingLogo(true);
    try {
      // Sube el logo usando el endpoint profesional
      const res = await subirLogoEmpresa(defaultValues.id, file);
      // Actualiza el campo logo en el formulario y preview con la URL definitiva
      setValue("logo", res.logo, { shouldValidate: true });
      /**
       * Construye la URL profesional del logo subido usando la variable general de uploads.
       */
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/logos/${
        res.logo
      }`;
      setLogoPreview(urlBackend);
      toast.current?.show({
        severity: "success",
        summary: "Logo actualizado",
        detail: "El logo se subió correctamente",
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error || "Error al subir el logo",
        life: 4000,
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  /**
   * Maneja la propagación de márgenes de la empresa a todos sus productos.
   * Muestra un diálogo de confirmación antes de ejecutar la acción.
   */
  const handlePropagarMargenes = () => {
    const margenMinimo = control._formValues.margenMinimoPermitido;
    const margenObjetivo = control._formValues.margenUtilidadObjetivo;

    if (!margenMinimo && !margenObjetivo) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe configurar los márgenes antes de propagar",
        life: 4000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de aplicar estos márgenes a todos los productos de la empresa?\n\nMargen Mínimo: ${margenMinimo || 0}%\nMargen Objetivo: ${margenObjetivo || 0}%\n\n⚠️ IMPORTANTE:\n• Se sobrescribirán los márgenes personalizados de cada producto\n• Esta acción NO se puede deshacer\n• Las cotizaciones existentes NO se afectarán`,
      header: "Confirmar Propagación de Márgenes",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Aplicar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setPropagandoMargenes(true);
        try {
          const resultado = await propagarMargenes(defaultValues.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `${resultado.mensaje}. Productos actualizados: ${resultado.productosActualizados}`,
            life: 5000,
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.error || "Error al propagar márgenes",
            life: 4000,
          });
        } finally {
          setPropagandoMargenes(false);
        }
      },
    });
  };

  return (
    <>
      {/* Toast profesional para mensajes de usuario */}
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-fluid">
          {/* Gestión profesional de logo de empresa */}
          {/* Layout profesional: imagen a la izquierda, controles a la derecha */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            {/* Bloque izquierdo: título y imagen del logo */}
            <div
              style={{
                minWidth: 180,
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              {/* Título pegado a la imagen */}
              <label
                htmlFor="logo"
                style={{ marginBottom: 6, fontWeight: 500 }}
              >
                Logo de la empresa
              </label>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo actual"
                  style={{
                    maxWidth: 180,
                    maxHeight: 120,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#fff",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 180,
                    height: 120,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bbb",
                    fontSize: 14,
                  }}
                >
                  Sin logo
                </div>
              )}
            </div>
            {/* Controles de carga y mensaje */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <FileUpload
                name="logo"
                accept="image/*"
                maxFileSize={2 * 1024 * 1024}
                chooseLabel="Seleccionar logo"
                uploadLabel="Subir"
                cancelLabel="Cancelar"
                customUpload
                uploadHandler={handleLogoUpload}
                disabled={readOnly || !defaultValues.id || uploadingLogo}
                auto
                mode="basic"
                className="p-mb-2"
              />
              <small className="p-d-block" style={{ color: "#888" }}>
                Solo PNG/JPG. Máx 2MB.
              </small>
              {/* Mensaje profesional si no hay id disponible */}
              {!defaultValues.id && (
                <small className="p-error p-d-block">
                  Guarda primero la empresa para habilitar la subida de logo.
                </small>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="razonSocial">Razón Social*</label>
              <InputText
                id="razonSocial"
                {...register("razonSocial")}
                className={errors.razonSocial ? "p-invalid" : ""}
                autoFocus
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
              {errors.razonSocial && (
                <small className="p-error">{errors.razonSocial.message}</small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="nombreComercial">Nombre Comercial</label>
              <InputText
                id="nombreComercial"
                {...register("nombreComercial")}
                className={errors.nombreComercial ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="ruc">RUC*</label>
              <InputText
                id="ruc"
                {...register("ruc")}
                className={errors.ruc ? "p-invalid" : ""}
                maxLength={11}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
              {errors.ruc && (
                <small className="p-error">{errors.ruc.message}</small>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 2 }}>
              <label htmlFor="direccion">Dirección</label>
              <InputText
                id="direccion"
                {...register("direccion")}
                className={errors.direccion ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="email">Email</label>
              <InputText
                id="email"
                {...register("email")}
                className={errors.email ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
              {errors.email && (
                <small className="p-error">{errors.email.message}</small>
              )}
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="telefono">Teléfono</label>
              <InputText
                id="telefono"
                {...register("telefono")}
                className={errors.telefono ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="representantelegalId">Representante Legal</label>
              <Controller
                name="representantelegalId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="representantelegalId"
                    value={field.value ?? null}
                    options={personal}
                    optionLabel="nombreCompleto"
                    optionValue="id"
                    placeholder={
                      loadingPersonal
                        ? "Cargando..."
                        : "Seleccione representante legal"
                    }
                    className={errors.representantelegalId ? "p-invalid" : ""}
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loadingPersonal || !defaultValues.empresaId}
                    filter
                    showClear
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.representantelegalId && (
                <small className="p-error">
                  {errors.representantelegalId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="entidadComercialId">Entidad Comercial</label>
              {/* Combo profesional de entidad comercial filtrada por empresaId */}
              <Controller
                name="entidadComercialId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="entidadComercialId"
                    value={field.value ?? null}
                    options={entidadesComerciales}
                    optionLabel="razonSocial"
                    optionValue="id"
                    placeholder={
                      loadingEntidades
                        ? "Cargando..."
                        : "Seleccione entidad comercial"
                    }
                    className={errors.entidadComercialId ? "p-invalid" : ""}
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loadingEntidades || !defaultValues.id}
                    filter
                    showClear
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.entidadComercialId && (
                <small className="p-error">
                  {errors.entidadComercialId.message}
                </small>
              )}
              {!defaultValues.id && (
                <small
                  className="p-d-block"
                  style={{ color: "#888", marginTop: 4 }}
                >
                  Guarda primero la empresa para seleccionar una entidad
                  comercial.
                </small>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 0.5 }}>
              <label htmlFor="porcentajeIgv">Porcentaje IGV (%)</label>
              {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
              <Controller
                name="porcentajeIgv"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="porcentajeIgv"
                    value={
                      field.value === undefined || field.value === null
                        ? null
                        : Number(field.value)
                    }
                    onValueChange={(e) =>
                      field.onChange(e.value === undefined ? null : e.value)
                    }
                    min={0}
                    max={100}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    placeholder="0.00 %"
                    className={errors.porcentajeIgv ? "p-invalid" : ""}
                    disabled={readOnly}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="porcentajeRetencion">
                Porcentaje Retención (%)
              </label>
              {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
              <Controller
                name="porcentajeRetencion"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="porcentajeRetencion"
                    value={
                      field.value === undefined || field.value === null
                        ? null
                        : Number(field.value)
                    }
                    onValueChange={(e) =>
                      field.onChange(e.value === undefined ? null : e.value)
                    }
                    min={0}
                    max={100}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    placeholder="0.00 %"
                    className={errors.porcentajeRetencion ? "p-invalid" : ""}
                    disabled={readOnly}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label htmlFor="montoMinimoRetencion">
                Monto Mínimo Retención
              </label>
              {/* Campo numérico profesional con 2 decimales fijos usando PrimeReact InputNumber */}
              <Controller
                name="montoMinimoRetencion"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="montoMinimoRetencion"
                    value={
                      field.value === undefined || field.value === null
                        ? null
                        : Number(field.value)
                    }
                    onValueChange={(e) =>
                      field.onChange(e.value === undefined ? null : e.value)
                    }
                    min={0}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    prefix="S/ "
                    placeholder="0.00"
                    className={errors.montoMinimoRetencion ? "p-invalid" : ""}
                    disabled={readOnly}
                    inputStyle={{ fontWeight: "bold" }}
                  />
                )}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="cuentaDetraccion">Cuenta Detracción</label>
              <InputText
                id="cuentaDetraccion"
                {...register("cuentaDetraccion")}
                className={errors.cuentaDetraccion ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ fontWeight: "bold" }}
              />
            </div>
          </div>

          {/* Sección de Márgenes de Utilidad */}
          <div
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
              border: "2px solid #dee2e6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <i className="pi pi-percentage" style={{ fontSize: "1.5em", color: "#495057" }}></i>
              <h3 style={{ margin: 0, color: "#495057" }}>Márgenes de Utilidad</h3>
            </div>
            <small style={{ display: "block", color: "#6c757d", marginBottom: 12 }}>
              Estos márgenes se heredan automáticamente a nuevos productos creados en esta empresa.
            </small>

            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 24,
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="margenMinimoPermitido">
                  Margen Mínimo Permitido (%)
                </label>
                <Controller
                  name="margenMinimoPermitido"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="margenMinimoPermitido"
                      value={
                        field.value === undefined || field.value === null
                          ? null
                          : Number(field.value)
                      }
                      onValueChange={(e) =>
                        field.onChange(e.value === undefined ? null : e.value)
                      }
                      min={0}
                      max={100}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      suffix=" %"
                      placeholder="0.00 %"
                      className={errors.margenMinimoPermitido ? "p-invalid" : ""}
                      disabled={readOnly}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {errors.margenMinimoPermitido && (
                  <small className="p-error">
                    {errors.margenMinimoPermitido.message}
                  </small>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="margenUtilidadObjetivo">
                  Margen Utilidad Objetivo (%)
                </label>
                <Controller
                  name="margenUtilidadObjetivo"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="margenUtilidadObjetivo"
                      value={
                        field.value === undefined || field.value === null
                          ? null
                          : Number(field.value)
                      }
                      onValueChange={(e) =>
                        field.onChange(e.value === undefined ? null : e.value)
                      }
                      min={0}
                      max={100}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      suffix=" %"
                      placeholder="0.00 %"
                      className={errors.margenUtilidadObjetivo ? "p-invalid" : ""}
                      disabled={readOnly}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {errors.margenUtilidadObjetivo && (
                  <small className="p-error">
                    {errors.margenUtilidadObjetivo.message}
                  </small>
                )}
              </div>

              {isEdit && defaultValues.id && (
                <div style={{ flex: 1 }}>
                  <label style={{ visibility: "hidden" }}>Acción</label>
                  <Button
                    type="button"
                    label="Propagar a Productos"
                    icon="pi pi-sync"
                    onClick={handlePropagarMargenes}
                    disabled={readOnly || propagandoMargenes}
                    loading={propagandoMargenes}
                    className="p-button-info"
                    style={{ width: "100%" }}
                    tooltip="Aplicar estos márgenes a todos los productos de la empresa"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Botón toggle para Agente de Retención */}
              <Controller
                name="soyAgenteRetencion"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    label={
                      field.value
                        ? "AGENTE RETENCION"
                        : "AGENTE RETENCION"
                    }
                    className={
                      field.value ? "p-button-primary" : "p-button-secondary"
                    }
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 1 }}>
              {/* Botón toggle para Agente de Percepción */}
              <Controller
                name="soyAgentePercepcion"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    label={
                      field.value
                        ? "AGENTE PERCEPCIÓN"
                        : "AGENTE PERCEPCIÓN"
                    }
                    className={
                      field.value ? "p-button-primary" : "p-button-secondary"
                    }
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              {/* Botón toggle para Cesado */}
              <Controller
                name="cesado"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    label={field.value ? "CESADO" : "ACTIVO"}
                    className={
                      field.value ? "p-button-danger" : "p-button-primary"
                    }
                    onClick={() => field.onChange(!field.value)}
                    disabled={readOnly}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button
              type="button"
              label="Cancelar"
              onClick={onCancel}
              disabled={loading || isSubmitting}
              className="p-button-warning"
              severity="warning"
              raised
              outlined
              size="small"
            />
            <Button
              type="submit"
              label={isEdit ? "Actualizar" : "Registrar"}
              icon="pi pi-save"
              loading={loading || isSubmitting}
              disabled={readOnly || loading || isSubmitting}
              className="p-button-success"
              severity="success"
              raised
              outlined
              size="small"
            />
          </div>
        </div>
      </form>
    </>
  );
}
