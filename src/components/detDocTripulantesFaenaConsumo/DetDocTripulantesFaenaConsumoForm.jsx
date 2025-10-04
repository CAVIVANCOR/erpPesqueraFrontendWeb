// src/components/detDocTripulantesFaenaConsumo/DetDocTripulantesFaenaConsumoForm.jsx
// Formulario profesional para DetDocTripulantesFaenaConsumo - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { Toast } from "primereact/toast";

import {
  crearDetDocTripulantesFaenaConsumo,
  actualizarDetDocTripulantesFaenaConsumo,
} from "../../api/detDocTripulantesFaenaConsumo";

/**
 * Formulario DetDocTripulantesFaenaConsumoForm
 *
 * Formulario profesional para gestión de documentos de tripulantes de faenas de consumo.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Upload de documentos PDF
 * - Estado de verificación
 * - Validaciones de fechas (vencimiento > emisión)
 */
export default function DetDocTripulantesFaenaConsumoForm({
  documento,
  tripulantes = [],
  documentos = [],
  onGuardadoExitoso,
  onCancelar,
}) {
  // Estados para loading
  const [loading, setLoading] = useState(false);

  // Configuración del formulario
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      faenaPescaConsumoId: null,
      tripulanteId: null,
      documentoId: null,
      numeroDocumento: "",
      fechaEmision: null,
      fechaVencimiento: null,
      urlDocTripulantePdf: "",
      observaciones: "",
      verificado: false,
      docVencido: false,
    },
  });

  // Observar fechas para validaciones
  const fechaEmision = watch("fechaEmision");

  // Observar cambios en urlDocTripulantePdf
  const urlDocTripulantePdf = watch("urlDocTripulantePdf");

  // Cargar datos del registro a editar cuando cambie documento
  useEffect(() => {
    if (documento) {
      reset({
        faenaPescaConsumoId: documento.faenaPescaConsumoId
          ? Number(documento.faenaPescaConsumoId)
          : null,
        tripulanteId: documento.tripulanteId
          ? Number(documento.tripulanteId)
          : null,
        documentoId: documento.documentoId ? Number(documento.documentoId) : null,
        numeroDocumento: documento.numeroDocumento || "",
        fechaEmision: documento.fechaEmision
          ? new Date(documento.fechaEmision)
          : null,
        fechaVencimiento: documento.fechaVencimiento
          ? new Date(documento.fechaVencimiento)
          : null,
        urlDocTripulantePdf: documento.urlDocTripulantePdf || "",
        observaciones: documento.observaciones || "",
        verificado: documento.verificado || false,
        docVencido: documento.docVencido || false,
      });
    } else {
      // Resetear para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        tripulanteId: null,
        documentoId: null,
        numeroDocumento: "",
        fechaEmision: null,
        fechaVencimiento: null,
        urlDocTripulantePdf: "",
        observaciones: "",
        verificado: false,
        docVencido: false,
      });
    }
  }, [documento, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        faenaPescaConsumoId: data.faenaPescaConsumoId ? Number(data.faenaPescaConsumoId) : null,
        tripulanteId: data.tripulanteId ? Number(data.tripulanteId) : null,
        documentoId: data.documentoId ? Number(data.documentoId) : null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaEmision: data.fechaEmision
          ? data.fechaEmision.toISOString()
          : null,
        fechaVencimiento: data.fechaVencimiento
          ? data.fechaVencimiento.toISOString()
          : null,
        urlDocTripulantePdf: data.urlDocTripulantePdf?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        verificado: Boolean(data.verificado),
        docVencido: Boolean(data.docVencido),
      };

      if (documento?.id) {
        await actualizarDetDocTripulantesFaenaConsumo(documento.id, payload);
      } else {
        await crearDetDocTripulantesFaenaConsumo(payload);
      }

      onGuardadoExitoso?.();
    } catch (error) {
      console.error("Error al guardar documento:", error);
      // Aquí podrías mostrar un toast de error si tienes acceso
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el mensaje de error para un campo
   */
  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  /**
   * Función para obtener clases de error
   */
  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  const handleVerPDF = () => {
    if (urlDocTripulantePdf) {
      abrirPdfEnNuevaPestana(urlDocTripulantePdf);
    }
  };

  const toast = useRef(null);

  const handleDescargarPDF = () => {
    if (urlDocTripulantePdf) {
      descargarPdf(
        urlDocTripulantePdf,
        toast,
        `documento-tripulante-${documento?.tripulanteId || "sin-id"}-${
          documento?.documentoId || "sin-doc"
        }.pdf`,
        "documentacion-personal"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <Toast ref={toast} />
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Tripulante */}
          <label
            htmlFor="tripulanteId"
            className="block text-900 font-medium mb-2"
          >
            Tripulante
          </label>
          <Controller
            name="tripulanteId"
            control={control}
            rules={{ required: "El tripulante es obligatorio" }}
            render={({ field }) => (
              <Dropdown
                id="tripulanteId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={tripulantes}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un tripulante"
                filter
                showClear
                disabled
                style={{ fontWeight: "bold" }}
                className={classNames({ "p-invalid": errors.tripulanteId })}
              />
            )}
          />
          {getFormErrorMessage("tripulanteId")}
        </div>
        <div style={{ flex: 1 }}>
          {/* Tipo de Documento */}
          <label
            htmlFor="documentoId"
            className="block text-900 font-medium mb-2"
          >
            Tipo de Documento
          </label>
          <Controller
            name="documentoId"
            control={control}
            rules={{ required: "El tipo de documento es obligatorio" }}
            render={({ field }) => (
              <Dropdown
                id="documentoId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={documentos}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione tipo de documento"
                filter
                showClear
                disabled
                style={{ fontWeight: "bold" }}
                className={classNames({ "p-invalid": errors.documentoId })}
              />
            )}
          />
          {getFormErrorMessage("documentoId")}
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
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Ej: DOC-2024-001"
                disabled
                style={{ fontWeight: "bold" }}
              />
            )}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Fecha de Emisión */}
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
                onChange={field.onChange}
                placeholder="dd/mm/aaaa"
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                inputStyle={{ fontWeight: "bold" }}
              />
            )}
          />
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
            rules={{
              validate: (value) => {
                if (value && fechaEmision && value <= fechaEmision) {
                  return "La fecha de vencimiento debe ser posterior a la fecha de emisión";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <Calendar
                id="fechaVencimiento"
                value={field.value}
                onChange={field.onChange}
                placeholder="dd/mm/aaaa"
                dateFormat="dd/mm/yy"
                showIcon
                disabled
                inputStyle={{ fontWeight: "bold" }}
                className={classNames({ "p-invalid": errors.fechaVencimiento })}
              />
            )}
          />
          {getFormErrorMessage("fechaVencimiento")}
        </div>
        <div style={{ flex: 1 }}>
          <Controller
            name="verificado"
            control={control}
            render={({ field }) => (
              <Button
                id="verificado"
                label={field.value ? "VERIFICADO" : "VERIFICAR"}
                icon={field.value ? "pi pi-check" : "pi pi-times"}
                disabled
                className={field.value ? "p-button-success" : "p-button-danger"}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Controller
            name="docVencido"
            control={control}
            render={({ field }) => (
              <Button
                id="docVencido"
                label={field.value ? "VENCIDO" : "VIGENTE"}
                icon={field.value ? "pi pi-times" : "pi pi-check"}
                disabled
                className={field.value ? "p-button-danger" : "p-button-success"}
              />
            )}
          />
        </div>
        <div style={{ flex: 2 }}>
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
                value={field.value || ""}
                onChange={field.onChange}
                rows={1}
                placeholder="Observaciones adicionales"
                style={{
                  fontWeight: "bold",
                  color: "red",
                  fontStyle: "italic",
                  textTransform: "uppercase",
                }}
              />
            )}
          />
        </div>
      </div>

      <div className="grid">
        {/* URL del Documento PDF */}
        <div className="col-12">
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "end",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <label
                htmlFor="urlDocTripulantePdf"
                className="block text-900 font-medium mb-2"
              >
                Documento PDF
              </label>
              <div className="grid">
                <div className="col-12 md:col-8">
                  <Controller
                    name="urlDocTripulantePdf"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="urlDocTripulantePdf"
                        {...field}
                        placeholder="URL del documento PDF"
                        className={getFieldClass("urlDocTripulantePdf")}
                        disabled
                        style={{ fontWeight: "bold" }}
                        maxLength={500}
                        readOnly
                      />
                    )}
                  />
                  {errors.urlDocTripulantePdf && (
                    <small className="p-error">
                      {errors.urlDocTripulantePdf.message}
                    </small>
                  )}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {urlDocTripulantePdf && (
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
            <div style={{ flex: 1 }}>
              {urlDocTripulantePdf && (
                <Button
                  type="button"
                  label="Descargar"
                  icon="pi pi-download"
                  className="p-button-outlined p-button-sm"
                  style={{ minWidth: "80px" }}
                  onClick={() =>
                    descargarPdf(
                      urlDocTripulantePdf,
                      toast,
                      `documento-tripulante-${
                        documento?.tripulanteId || "sin-id"
                      }-${documento?.documentoId || "sin-doc"}.pdf`,
                      "documentacion-personal"
                    )
                  }
                  tooltip="Descargar PDF del documento"
                  tooltipOptions={{ position: "top" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: "0.5rem",
        }}
      >
        {/* Visor de PDF */}
        {urlDocTripulantePdf && (
          <div style={{ flex: 1 }}>
            <PDFViewer urlDocumento={urlDocTripulantePdf} />
          </div>
        )}

        {/* Mensaje cuando no hay documento */}
        {!urlDocTripulantePdf && documento?.id && (
          <div className="field col-12">
            <div
              className="text-center p-4"
              style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}
            >
              <i
                className="pi pi-file-pdf text-gray-400"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-600 mt-3 mb-2">No hay documento PDF cargado</p>
              <small className="text-500">
                Use el botón "Capturar/Subir" para agregar el documento del
                tripulante
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-warning"
          onClick={onCancelar}
          disabled={loading}
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={documento?.id ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}