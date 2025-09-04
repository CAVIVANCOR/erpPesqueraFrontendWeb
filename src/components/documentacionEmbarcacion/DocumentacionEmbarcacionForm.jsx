// src/components/documentacionEmbarcacion/DocumentacionEmbarcacionForm.jsx
// Formulario profesional para DocumentacionEmbarcacion. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { getEmbarcaciones } from "../../api/embarcacion";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getActivos } from "../../api/activo";

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  embarcacionId: Yup.number().required("La embarcación es obligatoria"),
  documentoPescaId: Yup.number().required("El documento de pesca es obligatorio"),
  numeroDocumento: Yup.string().nullable().max(50, "El número de documento no puede exceder 50 caracteres"),
  fechaEmision: Yup.date().nullable(),
  fechaVencimiento: Yup.date().nullable().min(Yup.ref('fechaEmision'), 'La fecha de vencimiento debe ser posterior a la fecha de emisión'),
  urlDocPdf: Yup.string().nullable().url("Debe ser una URL válida").max(500, "La URL no puede exceder 500 caracteres"),
  docVencido: Yup.boolean(),
  observaciones: Yup.string().nullable().max(500, "Las observaciones no pueden exceder 500 caracteres"),
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
    embarcacionId: defaultValues.embarcacionId ? Number(defaultValues.embarcacionId) : null,
    documentoPescaId: defaultValues.documentoPescaId ? Number(defaultValues.documentoPescaId) : null,
    numeroDocumento: defaultValues.numeroDocumento || "",
    fechaEmision: defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : null,
    fechaVencimiento: defaultValues.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
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
      const [embarcacionesRes, documentosPescaRes, activosRes] = await Promise.allSettled([
        getEmbarcaciones(),
        getDocumentosPesca(),
        getActivos(),
      ]);
      // Normalización de embarcaciones
      if (embarcacionesRes.status === "fulfilled") {
        const activosData = activosRes.status === "fulfilled" ? activosRes.value : [];
        const embarcacionesData = embarcacionesRes.value.map((e) => {
          const activo = activosData.find(a => Number(a.id) === Number(e.activoId));
          return {
            ...e,
            id: Number(e.id),
            label: activo ? activo.descripcion : `Embarcación ${e.id}`,
          };
        });
        setEmbarcaciones(embarcacionesData);
      } else {
        console.error("Error al cargar embarcaciones:", embarcacionesRes.reason);
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
        console.error("Error al cargar documentos de pesca:", documentosPescaRes.reason);
      }
    } catch (error) {
      console.error("Error al cargar combos:", error);
      setErrorMessage("Error al cargar los datos necesarios para el formulario");
    } finally {
      setLoadingCombos(false);
    }
  };

  // Función de envío con normalización
  const onSubmitForm = (data) => {
    const normalizedData = {
      embarcacionId: Number(data.embarcacionId),
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

  return (
    <div className="p-fluid">
      {errorMessage && (
        <Message severity="error" text={errorMessage} className="mb-3" />
      )}
      
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="grid">
          {/* Embarcación */}
          <div className="col-12 md:col-6">
            <label htmlFor="embarcacionId" className="block text-900 font-medium mb-2">
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
              <small className="p-error">{errors.embarcacionId.message}</small>
            )}
          </div>

          {/* Documento de Pesca */}
          <div className="col-12 md:col-6">
            <label htmlFor="documentoPescaId" className="block text-900 font-medium mb-2">
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
              <small className="p-error">{errors.documentoPescaId.message}</small>
            )}
          </div>

          {/* Número de Documento */}
          <div className="col-12 md:col-6">
            <label htmlFor="numeroDocumento" className="block text-900 font-medium mb-2">
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
                  style={{ textTransform: 'uppercase', fontWeight: "bold" }}
                  maxLength={50}
                />
              )}
            />
            {errors.numeroDocumento && (
              <small className="p-error">{errors.numeroDocumento.message}</small>
            )}
          </div>

          {/* Fecha de Emisión */}
          <div className="col-12 md:col-6">
            <label htmlFor="fechaEmision" className="block text-900 font-medium mb-2">
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
          <div className="col-12 md:col-6">
            <label htmlFor="fechaVencimiento" className="block text-900 font-medium mb-2">
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
              <small className="p-error">{errors.fechaVencimiento.message}</small>
            )}
          </div>

          {/* URL del Documento PDF */}
          <div className="col-12 md:col-8">
            <label htmlFor="urlDocPdf" className="block text-900 font-medium mb-2">
              URL del Documento PDF
            </label>
            <Controller
              name="urlDocPdf"
              control={control}
              render={({ field }) => (
                <InputText
                  id="urlDocPdf"
                  {...field}
                  placeholder="Ingrese la URL del documento PDF"
                  className={getFieldClass("urlDocPdf")}
                  disabled={loading}
                  style={{ fontWeight: "bold" }}
                  maxLength={500}
                />
              )}
            />
            {errors.urlDocPdf && (
              <small className="p-error">{errors.urlDocPdf.message}</small>
            )}
          </div>

          {/* Documento Vencido */}
          <div className="col-12 md:col-4">
            <label htmlFor="docVencido" className="block text-900 font-medium mb-2">
              Estado del Documento
            </label>
            <div className="field-checkbox mt-2">
              <Controller
                name="docVencido"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="docVencido"
                    {...field}
                    checked={field.value}
                    className={getFieldClass("docVencido")}
                    disabled={loading}
                  />
                )}
              />
              <label htmlFor="docVencido" className="ml-2">
                Documento Vencido
              </label>
            </div>
            {errors.docVencido && (
              <small className="p-error">{errors.docVencido.message}</small>
            )}
          </div>

          {/* Observaciones */}
          <div className="col-12">
            <label htmlFor="observaciones" className="block text-900 font-medium mb-2">
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
                  style={{ textTransform: 'uppercase', fontWeight: "bold" }}
                  maxLength={500}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
            )}
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
    </div>
  );
}
