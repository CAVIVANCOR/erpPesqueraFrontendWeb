// src/components/documentacionEmbarcacion/DocumentacionEmbarcacionForm.jsx
// Formulario profesional para DocumentacionEmbarcacion. Cumple la regla transversal ERP Megui.
// Utiliza React Hook Form, Yup y PrimeReact. Documentado en español técnico.

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const schema = Yup.object().shape({
  embarcacionId: Yup.number().required("La embarcación es obligatoria"),
  documentoPescaId: Yup.number().required(
    "El documento de pesca es obligatorio",
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
          "La fecha de vencimiento debe ser posterior a la fecha de emisión",
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
 * @param {object} documentacion - Documentación a editar (null para nuevo)
 * @param {array} embarcaciones - Array de embarcaciones
 * @param {array} documentosPesca - Array de documentos de pesca
 * @param {function} onSave - Callback de guardado
 * @param {function} onCancel - Callback de cancelación
 */
export default function DocumentacionEmbarcacionForm({
  documentacion = null,
  embarcaciones = [],
  documentosPesca = [],
  onSave,
  onCancel,
  loading = false,
  readOnly = false,
}) {
  const isEdit = !!documentacion;

  const documentosPescaFiltrados = documentosPesca.filter(
    (doc) => doc.paraEmbarcacion === true,
  );

   const normalizedDefaults = documentacion
    ? {
        id: documentacion.id,
        embarcacionId: documentacion.embarcacionId
          ? Number(documentacion.embarcacionId)
          : null,
        documentoPescaId: documentacion.documentoPescaId
          ? Number(documentacion.documentoPescaId)
          : null,
        numeroDocumento: documentacion.numeroDocumento || "",
        fechaEmision: documentacion.fechaEmision
          ? new Date(documentacion.fechaEmision)
          : null,
        fechaVencimiento: documentacion.fechaVencimiento
          ? new Date(documentacion.fechaVencimiento)
          : null,
        urlDocPdf: documentacion.urlDocPdf || "",
        docVencido: documentacion.docVencido || false,
        cesado: documentacion.cesado || false,
        observaciones: documentacion.observaciones || "",
      }
    : {
        embarcacionId: null,
        documentoPescaId: null,
        numeroDocumento: "",
        fechaEmision: null,
        fechaVencimiento: null,
        urlDocPdf: "",
        docVencido: false,
        cesado: false,
        observaciones: "",
      };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: normalizedDefaults,
    mode: "onTouched",
  });

  const [loadingInterno, setLoadingInterno] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    reset(normalizedDefaults);
  }, [documentacion]);

  const onSubmitForm = async (data) => {
    setLoadingInterno(true);
    try {
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      let docVencidoCalculado = true;

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
        urlDocPdf: data.urlDocPdf?.trim() || null,
        docVencido: docVencidoCalculado,
        cesado: data.cesado,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
      };

      await onSave(normalizedData);
    } finally {
      setLoadingInterno(false);
    }
  };

  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

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
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={embarcaciones}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione una embarcación"
                    className={getFieldClass("embarcacionId")}
                    disabled={readOnly || loading || loadingInterno}
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
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={documentosPescaFiltrados}
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Seleccione un documento"
                    className={getFieldClass("documentoPescaId")}
                    disabled={readOnly || loading || loadingInterno}
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
                    value={field.value || ""}
                    placeholder="Ingrese el número del documento"
                    className={getFieldClass("numeroDocumento")}
                    disabled={readOnly || loading || loadingInterno}
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
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione fecha de emisión"
                    className={getFieldClass("fechaEmision")}
                    disabled={readOnly || loading || loadingInterno}
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
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Seleccione fecha de vencimiento"
                    className={getFieldClass("fechaVencimiento")}
                    disabled={readOnly || loading || loadingInterno}
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
                    disabled={readOnly || loading || loadingInterno}
                  />
                )}
              />
              {errors.docVencido && (
                <small className="p-error">{errors.docVencido.message}</small>
              )}
            </div>
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
                    disabled={readOnly || loading || loadingInterno}
                  />
                )}
              />
              {errors.cesado && (
                <small className="p-error">{errors.cesado.message}</small>
              )}
            </div>
            <div style={{ flex: 1 }}>
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
                    value={field.value || ""}
                    rows={3}
                    placeholder="Ingrese observaciones (opcional)"
                    className={getFieldClass("observaciones")}
                    disabled={readOnly || loading || loadingInterno}
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

          {isEdit && (
            <div style={{ marginTop: "1rem" }}>
              <PDFDocumentManager
                moduleName="documentacion-embarcacion"
                fieldName="urlDocPdf"
                entityId={normalizedDefaults.id}
                title="Documento PDF Embarcación"
                dialogTitle="Subir Documento Embarcación"
                uploadButtonLabel="Capturar/Subir"
                viewButtonLabel="Abrir"
                downloadButtonLabel="Descargar"
                emptyMessage="No hay documento PDF cargado"
                emptyDescription='Use el botón "Capturar/Subir" para agregar el documento de embarcación'
                control={control}
                errors={errors}
                setValue={setValue}
                watch={watch}
                getValues={getValues}
                defaultValues={normalizedDefaults}
                readOnly={false}
              />
            </div>
          )}

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
              disabled={loading || loadingInterno}
              raised
              outlined
              size="small"
            />
            <Button
              label={isEdit ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              className="p-button-success"
              type="submit"
              loading={loading || loadingInterno}
              disabled={readOnly || loading || loadingInterno}
              raised
              outlined
              size="small"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
