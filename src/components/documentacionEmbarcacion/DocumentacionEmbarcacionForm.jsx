// src/components/documentacionEmbarcacion/DocumentacionEmbarcacionForm.jsx
// Formulario profesional para DocumentacionEmbarcacion. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { getEmbarcaciones } from "../../api/embarcacion";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getActivos } from "../../api/activo";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  embarcacionId: Yup.number().required("La embarcación es obligatoria"),
  documentoPescaId: Yup.number().required(
    "El documento de pesca es obligatorio"
  ),
  numeroDocumento: Yup.string().nullable(),
  fechaEmision: Yup.date().nullable(),
  fechaVencimiento: Yup.date()
    .nullable()
    .when("fechaEmision", {
      is: (fechaEmision) => fechaEmision != null,
      then: (schema) =>
        schema.min(
          Yup.ref("fechaEmision"),
          "La fecha de vencimiento debe ser posterior a la fecha de emisión"
        ),
      otherwise: (schema) => schema,
    }),
  urlDocPdf: Yup.string().nullable(),
  docVencido: Yup.boolean(),
  cesado: Yup.boolean(),
  observaciones: Yup.string().nullable(),
});

/**
 * Formulario profesional para DocumentacionEmbarcacion.
 * Sigue el patrón estándar ERP Megui con React Hook Form + Yup.
 * @param {boolean} isEdit - Modo edición
 * @param {object} defaultValues - Valores por defecto
 * @param {function} onSubmit - Callback de envío
 * @param {function} onCancel - Callback de cancelación
 * @param {boolean} loading - Estado de carga
 */
export default function DocumentacionEmbarcacionForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  // Normalización profesional de valores por defecto
  const normalizedDefaults = {
    ...defaultValues,
    embarcacionId: defaultValues.embarcacionId
      ? Number(defaultValues.embarcacionId)
      : null,
    documentoPescaId: defaultValues.documentoPescaId
      ? Number(defaultValues.documentoPescaId)
      : null,
    numeroDocumento: defaultValues.numeroDocumento || "",
    fechaEmision: defaultValues.fechaEmision
      ? new Date(defaultValues.fechaEmision)
      : null,
    fechaVencimiento: defaultValues.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
    urlDocPdf: defaultValues.urlDocPdf || "",
    docVencido: defaultValues.docVencido || false,
    cesado: defaultValues.cesado || false,
    observaciones: defaultValues.observaciones || "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: normalizedDefaults,
    mode: "onTouched",
  });

  // Estados para combos
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Estados para captura de documento
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const toast = useRef(null);

  // Observar cambios en urlDocPdf
  const urlDocPdf = watch("urlDocPdf");

  // Reset cuando cambian los valores por defecto
  useEffect(() => {
    reset(normalizedDefaults);
  }, [defaultValues, reset]);

  // Carga de combos al montar el componente
  useEffect(() => {
    cargarCombos();
  }, []);

  const cargarCombos = async () => {
    setLoadingCombos(true);
    setErrorMessage("");
    try {
      const [embarcacionesRes, documentosPescaRes, activosRes] =
        await Promise.allSettled([
          getEmbarcaciones(),
          getDocumentosPesca(),
          getActivos(),
        ]);
      // Normalización de embarcaciones
      if (embarcacionesRes.status === "fulfilled") {
        const activosData =
          activosRes.status === "fulfilled" ? activosRes.value : [];
        const embarcacionesData = embarcacionesRes.value.map((e) => {
          const activo = activosData.find(
            (a) => Number(a.id) === Number(e.activoId)
          );
          return {
            ...e,
            id: Number(e.id),
            label: activo ? activo.descripcion : `Embarcación ${e.id}`,
          };
        });
        setEmbarcaciones(embarcacionesData);
      } else {
        console.error(
          "Error al cargar embarcaciones:",
          embarcacionesRes.reason
        );
      }

      // Normalización de documentos de pesca
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value.map((d) => ({
          ...d,
          id: Number(d.id),
          label: d.descripcion,
        }));
        setDocumentosPesca(documentosData);
      } else {
        console.error(
          "Error al cargar documentos de pesca:",
          documentosPescaRes.reason
        );
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      setErrorMessage(
        "Error al cargar los datos necesarios para el formulario"
      );
    } finally {
      setLoadingCombos(false);
    }
  };

  // Función de envío con normalización
  const onSubmitForm = (data) => {
    // Recalcular docVencido antes de enviar (por seguridad)
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    let docVencidoCalculado = true; // Por defecto vencido si no hay fecha

    if (data.fechaVencimiento) {
      const fechaVenc = new Date(data.fechaVencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      docVencidoCalculado = fechaVenc < fechaActual;
    }

    const normalizedData = {
      embarcacionId: Number(data.embarcacionId),
      documentoPescaId: Number(data.documentoPescaId),
      numeroDocumento: data.numeroDocumento?.trim().toUpperCase() || null,
      fechaEmision: data.fechaEmision || null,
      fechaVencimiento: data.fechaVencimiento || null,
      urlDocPdf: urlDocPdf?.trim() || null,
      docVencido: docVencidoCalculado, // Usar el valor recalculado
      cesado: data.cesado,
      observaciones: data.observaciones?.trim().toUpperCase() || null,
    };

    onSubmit(normalizedData);
  };

  // Función para obtener clases de error
  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  // Función para manejar documento subido
  const handleDocumentoSubido = (urlDocumento) => {
    setValue("urlDocPdf", urlDocumento, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setMostrarCaptura(false);
    toast.current?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El documento PDF se ha subido correctamente",
      life: 3000,
    });
  };

  // Función para ver PDF
  const handleVerPDF = () => {
    if (urlDocPdf) {
      abrirPdfEnNuevaPestana(
        urlDocPdf,
        toast,
        "No hay documento PDF disponible"
      );
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      {errorMessage && (
        <Message severity="error" text={errorMessage} className="mb-3" />
      )}

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="p-field">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Embarcación */}
              <label
                htmlFor="embarcacionId"
                className="block text-900 font-medium mb-2"
              >
                Embarcación *
              </label>
              <Controller
                name="embarcacionId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="embarcacionId"
                    {...field}
                    options={embarcaciones}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione una embarcación"
                    className={getFieldClass("embarcacionId")}
                    disabled={loading || loadingCombos}
                    showClear
                    filter
                    filterBy="label"
                    emptyMessage="No hay embarcaciones disponibles"
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.embarcacionId && (
                <small className="p-error">
                  {errors.embarcacionId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {/* Documento de Pesca */}
              <label
                htmlFor="documentoPescaId"
                className="block text-900 font-medium mb-2"
              >
                Documento de Pesca *
              </label>
              <Controller
                name="documentoPescaId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="documentoPescaId"
                    {...field}
                    options={documentosPesca}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un documento"
                    className={getFieldClass("documentoPescaId")}
                    disabled={loading || loadingCombos}
                    showClear
                    filter
                    filterBy="label"
                    emptyMessage="No hay documentos disponibles"
                    style={{ fontWeight: "bold" }}
                  />
                )}
              />
              {errors.documentoPescaId && (
                <small className="p-error">
                  {errors.documentoPescaId.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {/* Número de Documento */}
              <label
                htmlFor="numeroDocumento"
                className="block text-900 font-medium mb-2"
              >
                Número de Documento
              </label>
              <Controller
                name="numeroDocumento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroDocumento"
                    {...field}
                    placeholder="Ingrese el número del documento"
                    className={getFieldClass("numeroDocumento")}
                    disabled={loading}
                    style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    maxLength={50}
                  />
                )}
              />
              {errors.numeroDocumento && (
                <small className="p-error">
                  {errors.numeroDocumento.message}
                </small>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaEmision"
                className="block text-900 font-medium mb-2"
              >
                Fecha de Emisión
              </label>
              <Controller
                name="fechaEmision"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEmision"
                    {...field}
                    placeholder="Seleccione fecha de emisión"
                    className={getFieldClass("fechaEmision")}
                    disabled={loading}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                  />
                )}
              />
              {errors.fechaEmision && (
                <small className="p-error">{errors.fechaEmision.message}</small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="fechaVencimiento"
                className="block text-900 font-medium mb-2"
              >
                Fecha de Vencimiento
              </label>
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVencimiento"
                    {...field}
                    placeholder="Seleccione fecha de vencimiento"
                    className={getFieldClass("fechaVencimiento")}
                    disabled={loading}
                    dateFormat="dd/mm/yy"
                    showIcon
                    showButtonBar
                  />
                )}
              />
              {errors.fechaVencimiento && (
                <small className="p-error">
                  {errors.fechaVencimiento.message}
                </small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {/* Documento Vencido */}
              <label
                htmlFor="docVencido"
                className="block text-900 font-medium mb-2"
              >
                Estado Documento
              </label>
              <Controller
                name="docVencido"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    label={field.value ? "VENCIDO" : "VIGENTE"}
                    icon={field.value ? "pi pi-times" : "pi pi-check"}
                    className={
                      field.value ? "p-button-danger" : "p-button-success"
                    }
                    onClick={() => field.onChange(!field.value)}
                    size="small"
                    disabled
                  />
                )}
              />
              {errors.docVencido && (
                <small className="p-error">{errors.docVencido.message}</small>
              )}
            </div>
            {/* Cesado */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="cesado"
                className="block text-900 font-medium mb-2"
              >
                Cesado
              </label>
              <Controller
                name="cesado"
                control={control}
                render={({ field }) => (
                  <Button
                    type="button"
                    label={field.value ? "SI" : "NO"}
                    icon={field.value ? "pi pi-check" : "pi pi-times"}
                    className={
                      !field.value ? "p-button-success" : "p-button-danger"
                    }
                    onClick={() => field.onChange(!field.value)}
                    size="small"
                  />
                )}
              />
              {errors.cesado && (
                <small className="p-error">{errors.cesado.message}</small>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {/* Observaciones */}
              <label
                htmlFor="observaciones"
                className="block text-900 font-medium mb-2"
              >
                Observaciones
              </label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    {...field}
                    rows={3}
                    placeholder="Ingrese observaciones (opcional)"
                    className={getFieldClass("observaciones")}
                    disabled={loading}
                    style={{
                      textTransform: "uppercase",
                      fontStyle: "italic",
                      color: "red",
                    }}
                    maxLength={500}
                  />
                )}
              />
              {errors.observaciones && (
                <small className="p-error">
                  {errors.observaciones.message}
                </small>
              )}
            </div>
          </div>

          {/* Botones solo disponibles cuando hay ID (modo edición) */}
          {(isEdit || defaultValues.id) && (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* URL del Documento PDF con botones de captura */}
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="urlDocPdf"
                  className="block text-900 font-medium mb-2"
                >
                  Documento PDF
                </label>
                <div className="grid">
                  <div className="col-12 md:col-8">
                    <Controller
                      name="urlDocPdf"
                      control={control}
                      render={({ field }) => (
                        <InputText
                          id="urlDocPdf"
                          {...field}
                          placeholder="URL del documento PDF"
                          className={getFieldClass("urlDocPdf")}
                          disabled
                          style={{ fontWeight: "bold" }}
                          maxLength={500}
                          readOnly
                        />
                      )}
                    />
                    {errors.urlDocPdf && (
                      <small className="p-error">
                        {errors.urlDocPdf.message}
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    label="Capturar/Subir"
                    icon="pi pi-camera"
                    className="p-button-info"
                    onClick={() => setMostrarCaptura(true)}
                    disabled={loading}
                    size="small"
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {urlDocPdf && (
                  <Button
                    type="button"
                    label="Ver PDF"
                    icon="pi pi-eye"
                    className="p-button-secondary"
                    onClick={handleVerPDF}
                    disabled={loading}
                    size="small"
                  />
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: "0.5rem",
            }}
          >
            {/* Visor de PDF */}
            {urlDocPdf && (
              <div style={{ flex: 1 }}>
                <PDFViewer urlDocumento={urlDocPdf} />
              </div>
            )}

            {/* Mensaje cuando no hay documento */}
            {!urlDocPdf && defaultValues.id && (
              <div className="field col-12">
                <div
                  className="text-center p-4"
                  style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}
                >
                  <i
                    className="pi pi-file-pdf text-gray-400"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-600 mt-3 mb-2">
                    No hay documento PDF cargado
                  </p>
                  <small className="text-500">
                    Use el botón "Capturar/Subir" para agregar el documento de
                    embarcación
                  </small>
                </div>
              </div>
            )}
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
              className="p-button-text"
              type="button"
              onClick={onCancel}
              disabled={loading}
              raised
              outlined
              size="small"
            />
            <Button
              label={isEdit ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              className="p-button-success"
              type="submit"
              loading={loading}
              disabled={loadingCombos}
              raised
              outlined
              size="small"
            />
          </div>
        </div>
      </form>

      {/* Modal de captura de documento */}
      {mostrarCaptura && (
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint="/api/pesca/documentaciones-embarcacion/upload"
          titulo="Capturar Documento Embarcación"
          toast={toast}
        />
      )}
    </div>
  );
}
