// src/components/detDocEmbarcacionPescaConsumo/DetalleDocEmbarcacionConsumoForm.jsx
// Formulario profesional para DetDocEmbarcacionPescaConsumo - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import PDFViewer from "../shared/PDFViewer";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { Toast } from "primereact/toast";

import {
  crearDetDocEmbarcacionPescaConsumo,
  actualizarDetDocEmbarcacionPescaConsumo,
} from "../../api/detDocEmbarcacionPescaConsumo";
import { getFaenasPescaConsumo } from "../../api/faenaPescaConsumo";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Formulario DetalleDocEmbarcacionConsumoForm
 *
 * Formulario profesional para gestión de documentos de embarcación consumo.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Upload de documentos PDF
 * - Estado de verificación
 * - Validaciones de fechas (vencimiento > emisión)
 */
export default function DetalleDocEmbarcacionConsumoForm({
  detalle,
  documentosPesca = [],
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
      documentoPescaId: null,
      numeroDocumento: "",
      fechaEmision: null,
      fechaVencimiento: null,
      urlDocEmbarcacion: "",
      observaciones: "",
      verificado: false,
      docVencido: false,
    },
  });

  // Observar fechas para validaciones
  const fechaEmision = watch("fechaEmision");

  // Observar cambios en urlDocEmbarcacion
  const urlDocEmbarcacion = watch("urlDocEmbarcacion");

  // Cargar datos del registro a editar cuando cambie detalle
  useEffect(() => {
    if (detalle) {
      reset({
        faenaPescaConsumoId: detalle.faenaPescaConsumoId
          ? Number(detalle.faenaPescaConsumoId)
          : null,
        documentoPescaId: detalle.documentoPescaId
          ? Number(detalle.documentoPescaId)
          : null,
        numeroDocumento: detalle.numeroDocumento || "",
        fechaEmision: detalle.fechaEmision
          ? new Date(detalle.fechaEmision)
          : null,
        fechaVencimiento: detalle.fechaVencimiento
          ? new Date(detalle.fechaVencimiento)
          : null,
        urlDocEmbarcacion: detalle.urlDocEmbarcacion || "",
        observaciones: detalle.observaciones || "",
        verificado: detalle.verificado || false,
        docVencido: detalle.docVencido || false,
      });
    } else {
      // Resetear para nuevo registro
      reset({
        faenaPescaConsumoId: null,
        documentoPescaId: null,
        numeroDocumento: "",
        fechaEmision: null,
        fechaVencimiento: null,
        urlDocEmbarcacion: "",
        observaciones: "",
        verificado: false,
        docVencido: false,
      });
    }
  }, [detalle, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        faenaPescaConsumoId: data.faenaPescaConsumoId ? Number(data.faenaPescaConsumoId) : null,
        documentoPescaId: data.documentoPescaId ? Number(data.documentoPescaId) : null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaEmision: data.fechaEmision
          ? data.fechaEmision.toISOString()
          : null,
        fechaVencimiento: data.fechaVencimiento
          ? data.fechaVencimiento.toISOString()
          : null,
        urlDocEmbarcacion: data.urlDocEmbarcacion?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
        verificado: Boolean(data.verificado),
        docVencido: Boolean(data.docVencido),
      };

      if (detalle?.id) {
        await actualizarDetDocEmbarcacionPescaConsumo(detalle.id, payload);
      } else {
        await crearDetDocEmbarcacionPescaConsumo(payload);
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
    if (urlDocEmbarcacion) {
      abrirPdfEnNuevaPestana(urlDocEmbarcacion);
    }
  };

  const toast = useRef(null);

  const handleDescargarPDF = () => {
    if (urlDocEmbarcacion) {
      descargarPdf(
        urlDocEmbarcacion,
        toast,
        `documento-embarcacion-consumo-${detalle?.documentoPescaId || "sin-id"}-${
          detalle?.numeroDocumento || "sin-doc"
        }.pdf`,
        "documentacion-embarcacion-consumo"
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
          {/* Documento de Pesca */}
          <label
            htmlFor="documentoPescaId"
            className="block text-900 font-medium mb-2"
          >
            Documento de Pesca
          </label>
          <Controller
            name="documentoPescaId"
            control={control}
            rules={{ required: "El documento de pesca es obligatorio" }}
            render={({ field }) => (
              <Dropdown
                id="documentoPescaId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={documentosPesca}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un documento"
                filter
                showClear
                disabled
                style={{ fontWeight: "bold" }}
                className={classNames({ "p-invalid": errors.documentoPescaId })}
              />
            )}
          />
          {getFormErrorMessage("documentoPescaId")}
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
                htmlFor="urlDocEmbarcacion"
                className="block text-900 font-medium mb-2"
              >
                Documento PDF
              </label>
              <div className="grid">
                <div className="col-12 md:col-8">
                  <Controller
                    name="urlDocEmbarcacion"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="urlDocEmbarcacion"
                        {...field}
                        placeholder="URL del documento PDF"
                        className={getFieldClass("urlDocEmbarcacion")}
                        disabled
                        style={{ fontWeight: "bold" }}
                        maxLength={500}
                        readOnly
                      />
                    )}
                  />
                  {errors.urlDocEmbarcacion && (
                    <small className="p-error">
                      {errors.urlDocEmbarcacion.message}
                    </small>
                  )}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {urlDocEmbarcacion && (
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
              {urlDocEmbarcacion && (
                <Button
                  type="button"
                  label="Descargar"
                  icon="pi pi-download"
                  className="p-button-outlined p-button-sm"
                  style={{ minWidth: "80px" }}
                  onClick={() =>
                    descargarPdf(
                      urlDocEmbarcacion,
                      toast,
                      `documento-embarcacion-consumo-${
                        detalle?.documentoPescaId || "sin-id"
                      }-${detalle?.numeroDocumento || "sin-doc"}.pdf`,
                      "documentacion-embarcacion-consumo"
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
        {urlDocEmbarcacion && (
          <div style={{ flex: 1 }}>
            <PDFViewer urlDocumento={urlDocEmbarcacion} />
          </div>
        )}

        {/* Mensaje cuando no hay documento */}
        {!urlDocEmbarcacion && detalle?.id && (
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
                Use el botón "Capturar/Subir" para agregar el documento de embarcación
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
          label={detalle?.id ? "Actualizar" : "Guardar"}
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