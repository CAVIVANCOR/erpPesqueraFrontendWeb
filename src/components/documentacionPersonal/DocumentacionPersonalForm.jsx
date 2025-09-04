// src/components/documentacionPersonal/DocumentacionPersonalForm.jsx
// Formulario profesional para DocumentacionPersonal. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { ToggleButton } from "primereact/togglebutton";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { getPersonal } from "../../api/personal";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getEmpresas } from "../../api/empresa";
import DocumentoCapture from "../shared/DocumentoCapture";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  personalId: Yup.number().required("El personal es obligatorio"),
  documentoPescaId: Yup.number().required(
    "El documento de pesca es obligatorio"
  ),
  numeroDocumento: Yup.string()
    .nullable()
    .max(50, "El número de documento no puede exceder 50 caracteres"),
  fechaEmision: Yup.date().nullable(),
  fechaVencimiento: Yup.date()
    .nullable()
    .min(
      Yup.ref("fechaEmision"),
      "La fecha de vencimiento debe ser posterior a la fecha de emisión"
    ),
  urlDocPdf: Yup.string()
    .nullable()
    .matches(/^\/.*$/, "Debe ser una ruta relativa válida")
    .max(500, "La URL no puede exceder 500 caracteres"),
  docVencido: Yup.boolean(),
  observaciones: Yup.string()
    .nullable()
    .max(500, "Las observaciones no pueden exceder 500 caracteres"),
});

/**
 * Formulario profesional para DocumentacionPersonal.
 * Sigue el patrón estándar ERP Megui con React Hook Form + Yup.
 * @param {boolean} isEdit - Modo edición
 * @param {object} defaultValues - Valores por defecto
 * @param {function} onSubmit - Callback de envío
 * @param {function} onCancel - Callback de cancelación
 * @param {boolean} loading - Estado de carga
 */
export default function DocumentacionPersonalForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  // Normalización profesional de valores por defecto
  const normalizedDefaults = {
    ...defaultValues,
    personalId: defaultValues.personalId
      ? Number(defaultValues.personalId)
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
  const [personal, setPersonal] = useState([]);
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
      const [personalRes, documentosPescaRes, empresasRes] =
        await Promise.allSettled([
          getPersonal(),
          getDocumentosPesca(),
          getEmpresas(),
        ]);

      // Normalización de personal
      if (personalRes.status === "fulfilled") {
        const empresasData =
          empresasRes.status === "fulfilled" ? empresasRes.value : [];
        const personalData = personalRes.value.map((p) => {
          const empresa = empresasData.find(
            (e) => Number(e.id) === Number(p.empresaId)
          );
          return {
            ...p,
            id: Number(p.id),
            label: `${p.nombres} ${p.apellidos} - ${
              empresa?.nombreComercial || "Sin empresa"
            }`,
          };
        });
        setPersonal(personalData);
      } else {
        console.error("Error al cargar personal:", personalRes.reason);
      }

      // Normalización de documentos de pesca
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value
          .filter((d) => d.paraTripulantes === true)
          .map((d) => ({
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
    const normalizedData = {
      personalId: Number(data.personalId),
      documentoPescaId: Number(data.documentoPescaId),
      numeroDocumento: data.numeroDocumento?.trim().toUpperCase() || null,
      fechaEmision: data.fechaEmision || null,
      fechaVencimiento: data.fechaVencimiento || null,
      urlDocPdf: data.urlDocPdf?.trim() || null,
      docVencido: data.docVencido || false,
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
    setValue("urlDocPdf", urlDocumento);
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
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "end",
            marginBottom: "0.5rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Personal */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="personalId"
              className="block text-900 font-medium mb-2"
            >
              Personal *
            </label>
            <Controller
              name="personalId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="personalId"
                  {...field}
                  options={personal}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Seleccione una persona"
                  className={getFieldClass("personalId")}
                  disabled={loading || loadingCombos}
                  showClear
                  filter
                  filterBy="label"
                  emptyMessage="No hay personal disponible"
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.personalId && (
              <small className="p-error">{errors.personalId.message}</small>
            )}
          </div>
          {/* Documento de Pesca */}
          <div style={{ flex: 1 }}>
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
          {/* Número de Documento */}
          <div style={{ flex: 1 }}>
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
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Fecha de Emisión */}
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
          {/* Fecha de Vencimiento */}
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
          {/* Documento Vencido Boton Booleano Colores Rojo y Verde */}
          <div style={{ flex: 1 }}>
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
                  className={field.value ? "p-button-danger" : "p-button-success"}
                  onClick={() => field.onChange(!field.value)}
                  size="small"
                />
              )}
            />
            {errors.docVencido && (
              <small className="p-error">{errors.docVencido.message}</small>
            )}
          </div>

          {/* Observaciones */}
          <div style={{ flex: 2 }}>
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
                  rows={1}
                  placeholder="Ingrese observaciones (opcional)"
                  className={getFieldClass("observaciones")}
                  disabled={loading}
                  style={{ textTransform: "uppercase", fontWeight: "bold" }}
                  maxLength={500}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
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
                        disabled={loading}
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
                  Use el botón "Capturar/Subir" para agregar el documento
                  personal
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
      </form>

      {/* Modal de captura de documento - TEMPORAL: sin condición de ID para diagnóstico */}
      {mostrarCaptura && (
        <DocumentoCapture
          visible={mostrarCaptura}
          onHide={() => setMostrarCaptura(false)}
          onDocumentoSubido={handleDocumentoSubido}
          endpoint="/api/documentacion-personal/upload"
          titulo="Capturar Documento Personal"
          toast={toast}
        />
      )}
    </div>
  );
}
