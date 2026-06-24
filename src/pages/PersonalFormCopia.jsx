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
import { subirFotoPersonal, subirFirmaPersonal } from "../../api/personal"; // API profesional de subida de foto personal
import { getEntidadesComerciales } from "../../api/entidadComercial"; // API profesional de entidades comerciales
// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  empresaId: Yup.number().required("La empresa es obligatoria"),
  nombres: Yup.string().required("Los nombres son obligatorios"),
  apellidos: Yup.string().required("Los apellidos son obligatorios"),
  tipoDocumentoId: Yup.number().required("El tipo de documento es obligatorio"),
  numeroDocumento: Yup.string().required(
    "El número de documento es obligatorio",
  ),
  //fechaNacimiento: Yup.date().required("La fecha de nacimiento es obligatoria"),
  //sexo: Yup.boolean().required("El sexo es obligatorio"), // Campo obligatorio según modelo Prisma
  fechaIngreso: Yup.date(),
  fechaCese: Yup.date().when("cesado", {
    is: true,
    then: (schema) =>
      schema.required("La fecha de cese es obligatoria cuando está cesado"),
    otherwise: (schema) => schema.nullable(),
  }),
  telefono: Yup.string().nullable(),
  correo: Yup.string().nullable(),
  tipoContratoId: Yup.number(),
  cargoId: Yup.number(),
  areaFisicaId: Yup.number(),
  sedeEmpresaId: Yup.number(),
  enlaceEntidadComercialId: Yup.number().nullable(),
  // ⭐ NUEVOS CAMPOS - Marca Asistencia y Es Administrativo
  marcaAsistencia: Yup.boolean(),
  esAdministrativo: Yup.boolean(),
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
    enlaceEntidadComercialId: defaultValues.enlaceEntidadComercialId
      ? Number(defaultValues.enlaceEntidadComercialId)
      : null,
    sexo: typeof defaultValues.sexo === "boolean" ? defaultValues.sexo : null,
    paraTemporadaPesca:
      typeof defaultValues.paraTemporadaPesca === "boolean"
        ? defaultValues.paraTemporadaPesca
        : false,
    paraPescaConsumo:
      typeof defaultValues.paraPescaConsumo === "boolean"
        ? defaultValues.paraPescaConsumo
        : false,
    // ⭐ NUEVOS CAMPOS - Marca Asistencia y Es Administrativo
    marcaAsistencia:
      typeof defaultValues.marcaAsistencia === "boolean"
        ? defaultValues.marcaAsistencia
        : true, // Por defecto true según schema
    esAdministrativo:
      typeof defaultValues.esAdministrativo === "boolean"
        ? defaultValues.esAdministrativo
        : true, // Por defecto true según schema
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
      ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${defaultValues.urlFotoPersona}`
      : null,
  );
  // ⭐ AGREGAR ESTADO PARA FIRMA
  const [firmaPreview, setFirmaPreview] = useState(() => {
    if (!defaultValues.urlFirma) return null;
    // Si ya es una URL completa, usarla directamente
    if (defaultValues.urlFirma.startsWith('http')) {
      return defaultValues.urlFirma;
    }
    // Si es solo el nombre del archivo, construir la URL
    return `${import.meta.env.VITE_UPLOADS_URL}/personal-firmas/${defaultValues.urlFirma}`;
  });
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingFirma, setUploadingFirma] = useState(false);
  const toastFoto = React.useRef(null);
  const fileUploadFotoRef = React.useRef(null);
  const fileUploadFirmaRef = React.useRef(null);
  // --- Fin gestión foto de persona ---

  // Estados locales para combos dinámicos
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [tiposContrato, setTiposContrato] = useState([]);

  const [areasFisicas, setAreasFisicas] = useState([]);
  const [sedesEmpresa, setSedesEmpresa] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  // Reset profesional y actualización de preview de foto al abrir en modo edición o alta
  useEffect(() => {
    reset({
      ...defaultValues,
      sexo: typeof defaultValues.sexo === "boolean" ? defaultValues.sexo : null,
      marcaAsistencia:
        typeof defaultValues.marcaAsistencia === "boolean"
          ? defaultValues.marcaAsistencia
          : true,
      esAdministrativo:
        typeof defaultValues.esAdministrativo === "boolean"
          ? defaultValues.esAdministrativo
          : true,
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
    // ⭐ AGREGAR ACTUALIZACIÓN DE FIRMA
    const urlFirma = defaultValues.urlFirma
      ? defaultValues.urlFirma.startsWith("http")
        ? defaultValues.urlFirma
        : `${import.meta.env.VITE_UPLOADS_URL}/personal-firmas/${
            defaultValues.urlFirma
          }`
      : null;
    setFirmaPreview(urlFirma);
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

      // Construye la URL profesional de la foto subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/personal/${
        res.foto
      }`;

      // Actualizar el preview con la URL del backend y agregar timestamp para forzar recarga
      const urlConTimestamp = `${urlBackend}?t=${new Date().getTime()}`;
      setFotoPreview(urlConTimestamp);

      // Actualizar el campo del formulario con la ruta completa
      setValue("urlFotoPersona", urlBackend, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Liberar la URL local para evitar memory leaks
      URL.revokeObjectURL(localUrl);

      toastFoto.current?.show({
        severity: "success",
        summary: "Foto actualizada",
        detail: "La foto se subió correctamente",
        life: 3000,
      });
    } catch (err) {
      // Restaurar el preview anterior en caso de error
      const urlAnterior = defaultValues.urlFotoPersona
        ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${defaultValues.urlFotoPersona}`
        : null;
      setFotoPreview(urlAnterior);

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
  /**
   * Maneja la subida de foto desde input file normal (no FileUpload).
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo urlFotoPersona.
   */
  const handleSubirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación profesional de tipo y tamaño
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos JPG o PNG.",
        life: 3000,
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo no debe superar 2MB.",
        life: 3000,
      });
      return;
    }

    // Mostrar preview inmediato usando URL.createObjectURL
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);

    try {
      setUploadingFoto(true);
      const res = await subirFotoPersonal(defaultValues.id, file);

      // Actualizar el campo del formulario con el NOMBRE del archivo
      setValue("urlFotoPersona", res.foto, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Construye la URL profesional de la foto subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/personal/${res.foto}`;

      // Actualizar el preview con la URL del backend y agregar timestamp para forzar recarga
      const urlConTimestamp = `${urlBackend}?t=${new Date().getTime()}`;
      setFotoPreview(urlConTimestamp);

      // Liberar el objeto URL temporal
      URL.revokeObjectURL(previewUrl);

      toastFoto.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Foto subida correctamente.",
        life: 3000,
      });
    } catch (err) {
      // Restaurar el preview anterior en caso de error
      const urlAnterior = defaultValues.urlFotoPersona
        ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${defaultValues.urlFotoPersona}`
        : null;
      setFotoPreview(urlAnterior);

      // Liberar el objeto URL temporal
      URL.revokeObjectURL(previewUrl);

      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "Error al subir foto.",
        life: 3000,
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  /**
   * Adaptador para FileUpload de PrimeReact - Foto
   * Convierte el formato de FileUpload ({ files }) al formato de handleSubirFoto
   */
  const handleFotoUploadAdapter = async ({ files }) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    // Simular evento para reutilizar la lógica existente
    const fakeEvent = { target: { files: [file] } };
    await handleSubirFoto(fakeEvent);
    // Limpiar el FileUpload para permitir seleccionar otro archivo
    if (fileUploadFotoRef.current) {
      fileUploadFotoRef.current.clear();
    }
  };

  /**
   * Maneja la subida profesional de la firma de persona.
   * Valida tipo/tamaño, sube vía API, actualiza preview y campo urlFirma.
   * Muestra mensajes de éxito/error profesional.
   * Replica el patrón de handleSubirFoto.
   */
  const handleSubirFirma = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación profesional de tipo y tamaño
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se permiten archivos JPG o PNG.",
        life: 3000,
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El archivo no debe superar 2MB.",
        life: 3000,
      });
      return;
    }

    // Mostrar preview inmediato usando URL.createObjectURL
    const previewUrl = URL.createObjectURL(file);
    setFirmaPreview(previewUrl);

    try {
      setUploadingFirma(true);
      const res = await subirFirmaPersonal(defaultValues.id, file);

      // Actualizar el campo del formulario con el NOMBRE del archivo
      setValue("urlFirma", res.firma, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Construye la URL profesional de la firma subida usando la variable general de uploads.
      const urlBackend = `${import.meta.env.VITE_UPLOADS_URL}/personal-firmas/${res.firma}`;

      // Actualizar el preview con la URL del backend y agregar timestamp para forzar recarga
      const urlConTimestamp = `${urlBackend}?t=${new Date().getTime()}`;
      setFirmaPreview(urlConTimestamp);

      // Liberar el objeto URL temporal
      URL.revokeObjectURL(previewUrl);

      toastFoto.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Firma subida correctamente.",
        life: 3000,
      });
    } catch (err) {
      // Restaurar el preview anterior en caso de error
      const urlAnterior = defaultValues.urlFirma
        ? `${import.meta.env.VITE_UPLOADS_URL}/personal-firmas/${defaultValues.urlFirma}`
        : null;
      setFirmaPreview(urlAnterior);

      // Liberar el objeto URL temporal
      URL.revokeObjectURL(previewUrl);

      toastFoto.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "Error al subir firma.",
        life: 3000,
      });
    } finally {
      setUploadingFirma(false);
    }
  };

  /**
   * Adaptador para FileUpload de PrimeReact - Firma
   * Convierte el formato de FileUpload ({ files }) al formato de handleSubirFirma
   */
  const handleFirmaUploadAdapter = async ({ files }) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    // Simular evento para reutilizar la lógica existente
    const fakeEvent = { target: { files: [file] } };
    await handleSubirFirma(fakeEvent);
    // Limpiar el FileUpload para permitir seleccionar otro archivo
    if (fileUploadFirmaRef.current) {
      fileUploadFirmaRef.current.clear();
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
        const entidadesComercialesPromise = getEntidadesComerciales();
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
          entidadesComercialesPromise,
        ]);
        const [
          empresasRes,
          tiposDocRes,
          cargosRes,
          tiposContratoRes,
          areasFisicasRes,
          sedesRes,
          entidadesComercialesRes,
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
        const entidadesComercialesData =
          entidadesComercialesRes.status === "fulfilled"
            ? entidadesComercialesRes.value.map((e) => ({
                ...e,
                id: Number(e.id),
                label: e.razonSocial || e.nombreComercial,
              }))
            : [];
        setEntidadesComerciales(entidadesComercialesData);

        reset({ ...defaultValues });
      } catch (err) {
        setEmpresas([]);
        setTiposDocumento([]);
        setCargos([]);
        setTiposContrato([]);
        setAreasFisicas([]);
        setSedesEmpresa([]);
        setEntidadesComerciales([]);
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
        (s) => Number(s.empresaId) === empresaIdNum,
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
  // Estado local para las entidades comerciales filtradas según empresa seleccionada
  const [entidadesComercialesFiltradas, setEntidadesComercialesFiltradas] =
    useState([]);
  useEffect(() => {
    // Solo filtra si hay sede seleccionada y áreas físicas cargadas
    const sedeId = watch("sedeEmpresaId");
    if (sedeId && areasFisicas.length > 0) {
      const sedeIdNum = Number(sedeId);
      const filtradas = areasFisicas.filter(
        (a) => Number(a.sedeId) === sedeIdNum,
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
  // Efecto: Filtrar entidades comerciales por empresa seleccionada
  useEffect(() => {
    const empresaId = watch("empresaId");
    if (empresaId && entidadesComerciales.length > 0) {
      const empresaIdNum = Number(empresaId);
      const filtradas = entidadesComerciales.filter(
        (e) => Number(e.empresaId) === empresaIdNum,
      );
      setEntidadesComercialesFiltradas(filtradas);

      // Si la entidad seleccionada no pertenece a la empresa, límpiala
      if (
        watch("enlaceEntidadComercialId") &&
        !filtradas.some(
          (e) => Number(e.id) === Number(watch("enlaceEntidadComercialId")),
        )
      ) {
        setValue("enlaceEntidadComercialId", null);
      }
    } else {
      setEntidadesComercialesFiltradas([]);
      setValue("enlaceEntidadComercialId", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("empresaId"), entidadesComerciales]);
  // --- Normalización profesional de opciones de combos para evitar errores de tipo ---
  // Se fuerza que todos los id de las opciones sean numéricos, para que coincidan con los valores del formulario (también numéricos).
  const empresasNorm = (typeof empresas !== "undefined" ? empresas : []).map(
    (e) => ({ ...e, id: Number(e.id) }),
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
    // Construcción profesional del payload: solo IDs y campos primitivos, sin objetos de relaciones
    const payload = {
      id: data.id,
      empresaId: data.empresaId ? Number(data.empresaId) : null,
      tipoDocumentoId: data.tipoDocumentoId
        ? Number(data.tipoDocumentoId)
        : null,
      numeroDocumento: data.numeroDocumento || null,
      nombres: data.nombres || null,
      apellidos: data.apellidos || null,
      direccion: data.direccion || null,
      ubigeoId: data.ubigeoId ? Number(data.ubigeoId) : null,
      telefono: data.telefono || null,
      correo: data.correo || null,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento).toISOString()
        : null,
      fechaIngreso: data.fechaIngreso
        ? new Date(data.fechaIngreso).toISOString()
        : null,
      fechaCese: data.fechaCese ? new Date(data.fechaCese).toISOString() : null,
      sexo: typeof data.sexo === "boolean" ? data.sexo : false,
      tipoContratoId: data.tipoContratoId ? Number(data.tipoContratoId) : null,
      cargoId: data.cargoId ? Number(data.cargoId) : null,
      areaFisicaId: data.areaFisicaId ? Number(data.areaFisicaId) : null,
      sedeEmpresaId: data.sedeEmpresaId ? Number(data.sedeEmpresaId) : null,
      enlaceEntidadComercialId: data.enlaceEntidadComercialId
        ? Number(data.enlaceEntidadComercialId)
        : null,
      urlFotoPersona: data.urlFotoPersona || null,
      urlFirma: data.urlFirma || null, // ⭐ AGREGAR ESTA LÍNEA
      esVendedor:
        typeof data.esVendedor === "boolean" ? data.esVendedor : false,
      cesado: typeof data.cesado === "boolean" ? data.cesado : false,
      paraTemporadaPesca:
        typeof data.paraTemporadaPesca === "boolean"
          ? data.paraTemporadaPesca
          : false,
      paraPescaConsumo:
        typeof data.paraPescaConsumo === "boolean"
          ? data.paraPescaConsumo
          : false,
      // ⭐ NUEVOS CAMPOS - Marca Asistencia y Es Administrativo
      marcaAsistencia:
        typeof data.marcaAsistencia === "boolean" ? data.marcaAsistencia : true,
      esAdministrativo:
        typeof data.esAdministrativo === "boolean"
          ? data.esAdministrativo
          : true,
    };
    onSubmit(payload);
  };

  return (
    <>
      {/* Toast profesional para mensajes de usuario sobre la foto */}
      <Toast ref={toastFoto} position="top-right" />
      <form onSubmit={handleSubmit(onSubmitWithLog)}>
        <div className="p-fluid">
          {/* ==================== SECCIÓN FOTO Y FIRMA - LAYOUT COMPACTO RESPONSIVE ==================== */}
          <div className="p-field" style={{ marginBottom: 24 }}>
            {/* Contenedor principal: 2 columnas en desktop, 1 columna en mobile */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: window.innerWidth >= 768 ? "1fr 1fr" : "1fr",
                gap: 24,
              }}
            >
              {/* ========== COLUMNA 1: FOTO ========== */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                {/* Sub-columna A: Imagen */}
                <div style={{ flexShrink: 0 }}>
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Foto"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "2px solid #4caf50",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 6,
                        border: "2px dashed #ccc",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Sin foto
                    </div>
                  )}
                </div>

                {/* Sub-columna B: Controles (URL + Botón) */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontWeight: "bold", fontSize: 13, color: "#4caf50" }}>
                    FOTO DE LA PERSONA
                  </label>
                  
                  {/* Fila 1: Input URL */}
                  <InputText
                    {...register("urlFotoPersona")}
                    className={errors.urlFotoPersona ? "p-invalid" : ""}
                    placeholder="URL de la foto"
                    disabled={readOnly || loading}
                    style={{ fontSize: 12 }}
                  />
                  {errors.urlFotoPersona && (
                    <small className="p-error" style={{ fontSize: 11 }}>
                      {errors.urlFotoPersona.message}
                    </small>
                  )}

                  {/* Fila 2: Botón FileUpload */}
                  {!defaultValues.id ? (
                    <small style={{ color: "#d32f2f", fontSize: 11 }}>
                      Guarde el registro primero
                    </small>
                  ) : (
                    <FileUpload
                      ref={fileUploadFotoRef}
                      name="foto"
                      accept="image/jpeg,image/png"
                      maxFileSize={2 * 1024 * 1024}
                      chooseLabel="Elegir foto"
                      customUpload
                      uploadHandler={handleFotoUploadAdapter}
                      disabled={readOnly || loading || uploadingFoto}
                      auto
                      mode="basic"
                      chooseOptions={{
                        icon: "pi pi-image",
                        className: "p-button-success p-button-sm",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* ========== COLUMNA 2: FIRMA ========== */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                {/* Sub-columna A: Imagen */}
                <div style={{ flexShrink: 0 }}>
                  {firmaPreview ? (
                    <img
                      src={firmaPreview}
                      alt="Firma"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "contain",
                        borderRadius: 6,
                        border: "2px solid #2196f3",
                        background: "#fff",
                        padding: 4,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 6,
                        border: "2px dashed #ccc",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Sin firma
                    </div>
                  )}
                </div>

                {/* Sub-columna B: Controles (URL + Botón) */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontWeight: "bold", fontSize: 13, color: "#2196f3" }}>
                    FIRMA DIGITAL
                  </label>
                  
                  {/* Fila 1: Input URL */}
                  <InputText
                    {...register("urlFirma")}
                    className={errors.urlFirma ? "p-invalid" : ""}
                    placeholder="URL de la firma"
                    disabled={readOnly || loading}
                    style={{ fontSize: 12 }}
                  />
                  {errors.urlFirma && (
                    <small className="p-error" style={{ fontSize: 11 }}>
                      {errors.urlFirma.message}
                    </small>
                  )}

                  {/* Fila 2: Botón FileUpload */}
                  {!defaultValues.id ? (
                    <small style={{ color: "#d32f2f", fontSize: 11 }}>
                      Guarde el registro primero
                    </small>
                  ) : (
                    <FileUpload
                      ref={fileUploadFirmaRef}
                      name="firma"
                      accept="image/jpeg,image/png"
                      maxFileSize={2 * 1024 * 1024}
                      chooseLabel="Elegir firma"
                      customUpload
                      uploadHandler={handleFirmaUploadAdapter}
                      disabled={readOnly || loading || uploadingFirma}
                      auto
                      mode="basic"
                      chooseOptions={{
                        icon: "pi pi-file-edit",
                        className: "p-button-info p-button-sm",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== MARCA ASISTENCIA Y TIPO PERSONAL ==================== */}
          <div className="p-field">
            
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
                render={({ field }) => (
                  <InputText
                    style={{ fontWeight: "bold" }}
                    {...field}
                    autoFocus
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">{errors.nombres?.message}</small>
            </div>
            <div style={{ flex: 1 }}>
              <label>Apellidos</label>
              <Controller
                name="apellidos"
                control={control}
                render={({ field }) => (
                  <InputText
                    style={{ fontWeight: "bold" }}
                    {...field}
                    disabled={readOnly || loading}
                  />
                )}
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
                render={({ field }) => (
                  <InputText
                    style={{ fontWeight: "bold" }}
                    {...field}
                    disabled={readOnly || loading}
                  />
                )}
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
                    style={{ width: "100%" }}
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
                    style={{ width: "100%" }}
                  />
                )}
              />
              <small className="p-error">{errors.fechaIngreso?.message}</small>
            </div>
                      {/* Campo condicional: Fecha de Cese (solo visible cuando cesado = true) */}
          {watch("cesado") && (
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaCese"
                style={{ fontWeight: 500, color: "#d32f2f" }}
              >
                Fecha Cese *
              </label>
              <Controller
                name="fechaCese"
                control={control}
                render={({ field }) => (
                  <Calendar
                    {...field}
                    id="fechaCese"
                    showIcon
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione la fecha de cese"
                    className={errors.fechaCese ? "p-invalid" : ""}
                    disabled={readOnly || loading}
                    style={{ width: "100%" }}
                  />
                )}
              />
              <small className="p-error">{errors.fechaCese?.message}</small>
            </div>
          )}
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
            {/* Entidad Comercial Enlazada */}
            <div style={{ flex: 1 }}>
              <label>Facturar a (Comisiones Pesca Industrial)</label>
              <Controller
                name="enlaceEntidadComercialId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="enlaceEntidadComercialId"
                    value={field.value ? Number(field.value) : null}
                    options={entidadesComercialesFiltradas.map((e) => ({
                      ...e,
                      id: Number(e.id),
                    }))}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione una entidad comercial"
                    className={
                      errors.enlaceEntidadComercialId ? "p-invalid" : ""
                    }
                    style={{ fontWeight: "bold" }}
                    filter
                    showClear
                    onChange={(e) => field.onChange(e.value)}
                    disabled={readOnly || loading}
                  />
                )}
              />
              <small className="p-error">
                {errors.enlaceEntidadComercialId?.message}
              </small>
            </div>
          </div>

          {/* Botones de Cesado y Sexo */}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "center",
              marginTop: 10,
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <ButtonGroup>
              <Controller
                name="cesado"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    id="cesado"
                    label={field.value ? "CESADO" : "ACTIVO"}
                    icon={field.value ? "pi pi-times" : "pi pi-check"}
                    severity={field.value ? "danger" : "primary"}
                    onClick={(e) => {
                      e.preventDefault();
                      const nuevoValor = !field.value;
                      field.onChange(nuevoValor);
                      if (!nuevoValor) {
                        setValue("fechaCese", null);
                      }
                    }}
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
            </ButtonGroup>
            <div
              style={{
                display: "flex",
                gap: 5,
                marginLeft: "1rem"
              }}
            >
              {/* ⭐ NUEVO - Marca Asistencia */}
                <Controller
                  name="marcaAsistencia"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="marcaAsistencia"
                      onLabel="Marca Asistencia"
                      offLabel="No Marca Asistencia"
                      onIcon="pi pi-check-circle"
                      offIcon="pi pi-times-circle"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly}
                      className={
                        field.value ? "p-button-success" : "p-button-secondary"
                      }
                      tooltip="Indica si el personal debe marcar asistencia"
                      tooltipOptions={{ position: "top" }}
                    />
                  )}
                />
                {/* ⭐ NUEVO - Es Administrativo */}
                <Controller
                  name="esAdministrativo"
                  control={control}
                  render={({ field }) => (
                    <ToggleButton
                      id="esAdministrativo"
                      onLabel="Horario Rígido (Administrativo)"
                      offLabel="Horario Flexible (Operativo)"
                      onIcon="pi pi-clock"
                      offIcon="pi pi-users"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={readOnly}
                      className={
                        field.value ? "p-button-info" : "p-button-warning"
                      }
                      tooltip={
                        field.value
                          ? "Personal administrativo con horario rígido"
                          : "Personal operativo con horario flexible"
                      }
                      tooltipOptions={{ position: "top" }}
                    />
                  )}
                />
              </div>
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
            />
          </div>
        </div>
      </form>
    </>
  );
}