// src/components/personal/PersonalForm.jsx
// Formulario modular para alta y edición de personal en el ERP Megui.
// Utiliza PrimeReact, react-hook-form y Yup. Documentado en español técnico.

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { ButtonGroup } from "primereact/buttongroup";

import { getEmpresas } from "../../api/empresa"; // API profesional de empresas
import { getTiposDocIdentidad } from "../../api/tiposDocIdentidad"; // API profesional de tipos de documento
import { getCargosPersonal } from "../../api/cargosPersonal"; // API profesional de cargos de personal
import { getTiposContrato } from "../../api/tiposContrato"; // API profesional de tipos de contrato
import { getSedes } from "../../api/sedes"; // API profesional de sedes
import { getAreasFisicas } from "../../api/areasFisicas"; // API profesional de áreas físicas
import { subirFotoPersonal } from "../../api/personal"; // API profesional de subida de foto personal

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  empresaId: Yup.number().required("La empresa es obligatoria"),
  nombres: Yup.string().required("Los nombres son obligatorios"),
  apellidos: Yup.string().required("Los apellidos son obligatorios"),
  tipoDocumentoId: Yup.number().required("El tipo de documento es obligatorio"),
  numeroDocumento: Yup.string().required(
    "El número de documento es obligatorio"
  ),
  //fechaNacimiento: Yup.date().required("La fecha de nacimiento es obligatoria"),
  //sexo: Yup.boolean().required("El sexo es obligatorio"), // Campo obligatorio según modelo Prisma
  fechaIngreso: Yup.date(),
  telefono: Yup.string().nullable(),
  correo: Yup.string().nullable(),
  tipoContratoId: Yup.number(),
  cargoId: Yup.number(),
  areaFisicaId: Yup.number(),
  sedeEmpresaId: Yup.number(),
});

/**
 * Formulario modular para alta/edición de personal.
 * @param {object} props
 * @param {boolean} props.isEdit Modo edición
 * @param {object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback de grabado
 * @param {function} props.onCancel Callback de cancelación
 * @param {boolean} props.loading Estado de loading
 * @param {Array} props.empresas Opciones de empresa
 * @param {Array} props.tiposDocumento Opciones de tipo de documento
 * @param {Array} props.cargos Opciones de cargo
 */

export default function PersonalForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  // Normalización profesional: forzar empresaId y combos a number para evitar errores de tipo
  const normalizedDefaults = {
    ...defaultValues,
    empresaId: defaultValues.empresaId ? Number(defaultValues.empresaId) : null,
    tipoDocumentoId: defaultValues.tipoDocumentoId
      ? Number(defaultValues.tipoDocumentoId)
      : null,
    tipoContratoId: defaultValues.tipoContratoId
      ? Number(defaultValues.tipoContratoId)
      : null,
    cargoId: defaultValues.cargoId ? Number(defaultValues.cargoId) : null,
    areaFisicaId: defaultValues.areaFisicaId
      ? Number(defaultValues.areaFisicaId)
      : null,
    sedeEmpresaId: defaultValues.sedeEmpresaId
      ? Number(defaultValues.sedeEmpresaId)
      : null,
    sexo: typeof defaultValues.sexo === "boolean" ? defaultValues.sexo : null,
    paraTemporadaPesca: typeof defaultValues.paraTemporadaPesca === "boolean" ? defaultValues.paraTemporadaPesca : false,
    paraPescaConsumo: typeof defaultValues.paraPescaConsumo === "boolean" ? defaultValues.paraPescaConsumo : false,

    // Agrega aquí cualquier otro id de combo que uses
  };

  const {
    register,
    control,
    setValue,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: normalizedDefaults,
    mode: "onTouched",
  });

  const [fotoPreview, setFotoPreview] = useState(
    defaultValues.urlFotoPersona
      ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${
          defaultValues.urlFotoPersona
        }`
      : null
  );

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const toastFoto = React.useRef(null);
  // --- Fin gestión foto de persona ---

  // Estados locales para combos dinámicos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [tiposContrato, setTiposContrato] = useState([]);

  const [areasFisicas, setAreasFisicas] = useState([]);
  const [sedesEmpresa, setSedesEmpresa] = useState([]);

  // Reset profesional y actualización de preview de foto al abrir en modo edición o alta
  useEffect(() => {
    reset({
      ...defaultValues,
      sexo: typeof defaultValues.sexo === "boolean" ? defaultValues.sexo : null,
    });
    // Actualiza el preview de la foto si cambia el registro
    /**
     * Construye la URL profesional de la foto usando la variable de entorno general para uploads.
     */
    const urlFoto = defaultValues.urlFotoPersona
      ? defaultValues.urlFotoPersona.startsWith("http")
        ? defaultValues.urlFotoPersona
        : `${import.meta.env.VITE_UPLOADS_URL}/personal/${
            defaultValues.urlFotoPersona
          }`
      : null;
    setFotoPreview(urlFoto);
  }, [defaultValues, isEdit, reset]);

  /**
   * Maneja la subida profesional de la foto de persona.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo urlFotoPersona.
   * Muestra mensajes de éxito/error profesional.
   * Muestra el preview inmediatamente usando URL.createObjectURL(file),
   * luego sube el archivo y actualiza el preview con la URL definitiva del backend.
   * Documentado en español técnico.
   */
  const handleFotoUpload = async ({ files }) => {
    const file = files[0];
    if (!file) return;
    // Validación profesional: solo imágenes y máx 2MB
    if (!file.type.startsWith("image/")) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos de imagen",
        life: 4000,
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo supera el tamaño máximo de 2MB",
        life: 4000,
      });
      return;
    }
    // Muestra el preview inmediato usando URL local
    const localUrl = URL.createObjectURL(file);
    setFotoPreview(localUrl);
    setUploadingFoto(true);
    try {
      // Sube la foto usando el endpoint profesional
      const res = await subirFotoPersonal(defaultValues.id, file);
      setValue("urlFotoPersona", res.foto, { shouldValidate: true });
      // Construye la URL profesional de la foto subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/personal/${
        res.foto
      }`;
      setFotoPreview(urlBackend);
      toastFoto.current?.show({
        severity: "success",
        summary: "Foto actualizada",
        detail: "La foto se subió correctamente",
        life: 3000,
      });
    } catch (err) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error || "Error al subir la foto",
        life: 4000,
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  // Carga profesional de combos al montar el formulario
  useEffect(() => {
    async function cargarCombos() {
      try {
        const empresasPromise = getEmpresas();
        const tiposDocPromise = getTiposDocIdentidad();
        // Carga profesional de cargos desde /cargos-personal para el combo de PersonalForm
        const cargosPromise = getCargosPersonal();
        const tiposContratoPromise = getTiposContrato();
        const areasFisicasPromise = getAreasFisicas();
        const sedesPromise = getSedes();
        /**
         * Refactor profesional: Promise.allSettled para que los errores de un combo no bloqueen el resto.
         * Así garantizamos máxima robustez y experiencia de usuario, incluso si un endpoint falla.
         */
        const resultados = await Promise.allSettled([
          empresasPromise,
          tiposDocPromise,
          cargosPromise,
          tiposContratoPromise,
          areasFisicasPromise,
          sedesPromise,
        ]);
        const [
          empresasRes,
          tiposDocRes,
          cargosRes,
          tiposContratoRes,
          areasFisicasRes,
          sedesRes,
        ] = resultados;

        // Normalización profesional: ids de empresa como number para evitar bugs de selección en PrimeReact Dropdown
        const empresasData =
          empresasRes.status === "fulfilled"
            ? empresasRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.razonSocial,
              }))
            : [];
        setEmpresas(empresasData);
        // Normalización profesional: todos los ids de combos a number para evitar bugs de selección
        const tiposDocumentoData =
          tiposDocRes.status === "fulfilled"
            ? tiposDocRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.codigo,
              }))
            : [];
        setTiposDocumento(tiposDocumentoData);
        // Normalización profesional para combo: id numérico y label descriptivo
        const cargosData =
          cargosRes.status === "fulfilled"
            ? cargosRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.descripcion,
              }))
            : [];
        setCargos(cargosData);
        const tiposContratoData =
          tiposContratoRes.status === "fulfilled"
            ? tiposContratoRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.nombre,
              }))
            : [];
        setTiposContrato(tiposContratoData);
        const areasFisicasData =
          areasFisicasRes.status === "fulfilled"
            ? areasFisicasRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.descripcion,
              }))
            : [];
        setAreasFisicas(areasFisicasData);
        const sedesEmpresaData =
          sedesRes.status === "fulfilled"
            ? sedesRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.nombre,
              }))
            : [];
        setSedesEmpresa(sedesEmpresaData);

        reset({ ...defaultValues });
      } catch (err) {
        setEmpresas([]);
        setTiposDocumento([]);
        setCargos([]);
        setTiposContrato([]);
        setAreasFisicas([]);
        setSedesEmpresa([]);
      }
    }
    cargarCombos();
  }, []);

  // Estado local para las sedes filtradas según empresa seleccionada
  const [sedesFiltradas, setSedesFiltradas] = useState([]);
  // Efecto: Filtrar sedes por empresa seleccionada (combo dependiente)
  // Cuando cambia la empresa, se filtran las sedes y se limpia la selección previa de sede
  useEffect(() => {
    // Solo filtra si hay empresa seleccionada y sedes cargadas
    const empresaId = watch("empresaId");
    if (empresaId && sedesEmpresa.length > 0) {
      const empresaIdNum = Number(empresaId);
      const filtradas = sedesEmpresa.filter(
        (s) => Number(s.empresaId) === empresaIdNum
      );
      setSedesFiltradas(filtradas);

      // Si la sede seleccionada no pertenece a la empresa, límpiala
      if (
        watch("sedeEmpresaId") &&
        !filtradas.some((s) => Number(s.id) === Number(watch("sedeEmpresaId")))
      ) {
        setValue("sedeEmpresaId", null);
      }
    } else {
      setSedesFiltradas([]);
      setValue("sedeEmpresaId", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("empresaId"), sedesEmpresa]);

  // Estado local para las áreas físicas filtradas según sede seleccionada
  const [areasFisicasFiltradas, setAreasFisicasFiltradas] = useState([]);
  useEffect(() => {
    // Solo filtra si hay sede seleccionada y áreas físicas cargadas
    const sedeId = watch("sedeEmpresaId");
    if (sedeId && areasFisicas.length > 0) {
      const sedeIdNum = Number(sedeId);
      const filtradas = areasFisicas.filter(
        (a) => Number(a.sedeId) === sedeIdNum
      );
      setAreasFisicasFiltradas(filtradas);

      // Si el área seleccionada no pertenece a la sede, límpiala
      if (
        watch("areaFisicaId") &&
        !filtradas.some((a) => Number(a.id) === Number(watch("areaFisicaId")))
      ) {
        setValue("areaFisicaId", null);
      }
    } else {
      setAreasFisicasFiltradas([]);
      setValue("areaFisicaId", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("sedeEmpresaId"), areasFisicas]);
  // --- Normalización profesional de opciones de combos para evitar errores de tipo ---
  // Se fuerza que todos los id de las opciones sean numéricos, para que coincidan con los valores del formulario (también numéricos).
  const empresasNorm = (typeof empresas !== "undefined" ? empresas : []).map(
    (e) => ({ ...e, id: Number(e.id) })
  );
  const tiposDocumentoNorm = (
    typeof tiposDocumento !== "undefined" ? tiposDocumento : []
  ).map((e) => ({ ...e, id: Number(e.id) }));
  const tiposContratoNorm = (
    typeof tiposContrato !== "undefined" ? tiposContrato : []
  ).map((e) => ({ ...e, id: Number(e.id) }));
  const cargosNorm = (typeof cargos !== "undefined" ? cargos : []).map((e) => ({
    ...e,
    id: Number(e.id),
  }));
  const areasFisicasNorm = (
    typeof areasFisicas !== "undefined" ? areasFisicas : []
  ).map((e) => ({ ...e, id: Number(e.id) }));
  const sedesEmpresaNorm = (
    typeof sedesEmpresa !== "undefined" ? sedesEmpresa : []
  ).map((e) => ({ ...e, id: Number(e.id) }));
  // Transforma IDs a number y fechas a string ISO antes de enviar el payload
  const onSubmitWithLog = (data) => {
    // Construcción profesional del payload: sedeId eliminado, solo se envía sedeEmpresaId
    const payload = {
      ...data,
      empresaId: data.empresaId ? Number(data.empresaId) : null,
      tipoDocumentoId: data.tipoDocumentoId
        ? Number(data.tipoDocumentoId)
        : null,
      tipoContratoId: data.tipoContratoId
        ? Number(data.tipoContratoId)
        : null,
      cargoId: data.cargoId ? Number(data.cargoId) : null,
      areaFisicaId: data.areaFisicaId ? Number(data.areaFisicaId) : null,
      sedeEmpresaId: data.sedeEmpresaId ? Number(data.sedeEmpresaId) : null,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento).toISOString()
        : null,
      fechaIngreso: data.fechaIngreso
        ? new Date(data.fechaIngreso).toISOString()
        : null,
      telefono: data.telefono || null,
      correo: data.correo || null,
      urlFotoPersona: data.urlFotoPersona || null,
      // Campo obligatorio según modelo Prisma: siempre enviar sexo booleano
      sexo: typeof data.sexo === "boolean" ? data.sexo : false,
      esVendedor:
        typeof data.esVendedor === "boolean" ? data.esVendedor : false,
      cesado: typeof data.cesado === "boolean" ? data.cesado : false,
      paraTemporadaPesca: typeof data.paraTemporadaPesca === "boolean" ? data.paraTemporadaPesca : false,
      paraPescaConsumo: typeof data.paraPescaConsumo === "boolean" ? data.paraPescaConsumo : false,
    };
    // Fin construcción payload profesional
    onSubmit(payload);
  };

  return (
    <>
      {/* Toast profesional para mensajes de usuario sobre la foto */}
      <Toast ref={toastFoto} position="top-right" />
      <form onSubmit={handleSubmit(onSubmitWithLog)}>
        <div className="p-fluid">
          {/* Gestión profesional de foto de persona */}
          <div className="p-field">
            {/* Layout profesional: imagen a la izquierda, controles a la derecha */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginTop: 8,
              }}
            >
              {/* Bloque izquierdo: título y preview de la foto */}
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
                  htmlFor="foto"
                  style={{ marginBottom: 6, fontWeight: 500 }}
                >
                  Foto de la persona
                </label>
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Foto actual"
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
                    Sin foto
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
                  name="foto"
                  accept="image/*"
                  maxFileSize={2 * 1024 * 1024}
                  chooseLabel="Elegir foto"
                  uploadLabel="Subir"
                  cancelLabel="Cancelar"
                  customUpload
                  uploadHandler={handleFotoUpload}
                  disabled={readOnly || !defaultValues.id || uploadingFoto}
                  auto
                  mode="basic"
                  className="p-mb-2"
                />
                <small className="p-d-block" style={{ color: "#888" }}>
                  Solo PNG/JPG. Máx 2MB.
                </small>
                {/* Input profesional para URL de la foto (solo input text, editable/deshabilitado según lógica) */}
                <InputText
                  {...register("urlFotoPersona")}
                  className={errors.urlFotoPersona ? "p-invalid" : ""}
                  placeholder="URL de la foto (opcional)"
                  disabled={readOnly || loading}
                />
                <small className="p-error">
                  {errors.urlFotoPersona?.message}
                </small>
                {/* Mensaje profesional si no hay id disponible */}
                {!defaultValues.id && (
                  <small className="p-error p-d-block">
                    Guarda primero el registro para habilitar la subida de foto.
                  </small>
                )}
              </div>
            </div>
          </div>
          {/* Empresa */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label>Empresa</label>
              <Controller
                name="empresaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="empresaId"
                    value={field.value ? Number(field.value) : null}
                    options={empresasNorm}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione una empresa"
                    className={errors.empresaId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">{errors.empresaId?.message}</small>
            </div>
            {/* Sede Empresa */}
            <div style={{ flex: 1 }}>
              <label>Sede Empresa</label>
              <Controller
                name="sedeEmpresaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="sedeEmpresaId"
                    value={field.value ? Number(field.value) : null}
                    //options={sedesEmpresaNorm}
                    options={sedesFiltradas.map((e) => ({
                      ...e,
                      id: Number(e.id),
                    }))}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione una sede empresa"
                    className={errors.sedeEmpresaId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">{errors.sedeEmpresaId?.message}</small>
            </div>
            {/* Área Física */}
            <div style={{ flex: 1 }}>
              <label>Área Física</label>
              <Controller
                name="areaFisicaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="areaFisicaId"
                    value={field.value ? Number(field.value) : null}
                    options={areasFisicasFiltradas.map((e) => ({
                      ...e,
                      id: Number(e.id),
                    }))}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un área física"
                    className={errors.areaFisicaId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">{errors.areaFisicaId?.message}</small>
            </div>
          </div>
          {/* Nombres y Apellidos en una sola línea */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Nombres</label>
              <Controller
                name="nombres"
                control={control}
                render={({ field }) => <InputText style={{ fontWeight: "bold" }} {...field} autoFocus disabled={readOnly || loading} />}
              />
              <small className="p-error">{errors.nombres?.message}</small>
            </div>
            <div style={{ flex: 1 }}>
              <label>Apellidos</label>
              <Controller
                name="apellidos"
                control={control}
                render={({ field }) => <InputText style={{ fontWeight: "bold" }} {...field} disabled={readOnly || loading} />}
              />
              <small className="p-error">{errors.apellidos?.message}</small>
            </div>
          </div>
          {/* Tipo de documento y Número de documento en una sola línea */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Tipo documento</label>
              <Controller
                name="tipoDocumentoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoDocumentoId"
                    value={field.value ? Number(field.value) : null}
                    options={tiposDocumentoNorm}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un tipo de documento"
                    className={errors.tipoDocumentoId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">
                {errors.tipoDocumentoId?.message}
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <label>N° Documento</label>
              <Controller
                name="numeroDocumento"
                control={control}
                render={({ field }) => <InputText style={{ fontWeight: "bold" }} {...field} disabled={readOnly || loading} />}
              />
              <small className="p-error">
                {errors.numeroDocumento?.message}
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <label>Nacimiento</label>
              <Controller
                name="fechaNacimiento"
                control={control}
                render={({ field }) => (
                  <Calendar
                    {...field}
                    showIcon
                    dateFormat="dd/mm/yy"
                    disabled={readOnly || loading}
                    style={{ width: "100%"}}
                  />
                )}
              />
              <small className="p-error">
                {errors.fechaNacimiento?.message}
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <label>Ingreso</label>
              <Controller
                name="fechaIngreso"
                control={control}
                render={({ field }) => (
                  <Calendar
                    {...field}
                    showIcon
                    dateFormat="dd/mm/yy"
                    disabled={readOnly || loading}
                    style={{ width: "100%"}}
                  />
                )}
              />
              <small className="p-error">{errors.fechaIngreso?.message}</small>
            </div>
          </div>

          {/* Teléfono yCorreo Electronico en una sola línea, con proporción 1:2 */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Teléfono</label>
              <InputText
                {...register("telefono")}
                maxLength={20}
                className={errors.telefono ? "p-invalid" : ""}
                style={{ fontWeight: "bold" }}
                disabled={readOnly || loading}
              />
              <small className="p-error">{errors.telefono?.message}</small>
            </div>
            {/* Correo electrónico */}
            <div style={{ flex: 2 }}>
              <label>Correo electrónico</label>
              <InputText
                {...register("correo")}
                className={errors.correo ? "p-invalid" : ""}
                style={{ fontWeight: "bold" }}
                disabled={readOnly || loading}
              />
              <small className="p-error">{errors.correo?.message}</small>
            </div>
          </div>

          {/* Tipo de Contrato */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label>Tipo de Contrato</label>
              <Controller
                name="tipoContratoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipoContratoId"
                    value={field.value ? Number(field.value) : null}
                    options={tiposContratoNorm}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un tipo de contrato"
                    className={errors.tipoContratoId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">
                {errors.tipoContratoId?.message}
              </small>
            </div>
            {/* Cargo */}
            <div style={{ flex: 1 }}>
              <label>Cargo</label>
              <Controller
                name="cargoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="cargoId"
                    value={field.value ? Number(field.value) : null}
                    options={cargosNorm}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un cargo"
                    className={errors.cargoId ? "p-invalid" : ""}
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">{errors.cargoId?.message}</small>
            </div>
          </div>

          {/* Botones de Cesado y Sexo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 10,
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <ButtonGroup>
              <div style={{ flex: 1 }}>
                <Controller
                  name="cesado"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="cesado"
                      onLabel="CESADO"
                      offLabel="ACTIVO"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="sexo"
                      onLabel="Masculino"
                      offLabel="Femenino"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                <Controller
                  name="esVendedor"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="esVendedor"
                      onLabel="Vendedor"
                      offLabel="Vendedor"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                <Controller
                  name="paraTemporadaPesca"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="paraTemporadaPesca"
                      onLabel="Temporada Pesca"
                      offLabel="Temporada Pesca"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly || loading}
                    />
                  )}
                />
                <Controller
                  name="paraPescaConsumo"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="paraPescaConsumo"
                      onLabel="Pesca Consumo"
                      offLabel="Pesca Consumo"
                      onIcon="pi pi-check"
                      offIcon="pi pi-times"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly || loading}
                    />
                  )}
                />
              </div>
            </ButtonGroup>
          </div>
          {/* Botones de acción */}
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
        </div>
      </form>
    </>
  );
}
