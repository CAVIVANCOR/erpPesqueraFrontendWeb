// src/components/detAccionesPreviasFaena/ConfirmacionAccionPreviaPDFCard.jsx
// Card para confirmación PDF de DetAccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Controller } from "react-hook-form";
import PDFViewer from "../shared/PDFViewer";
import DocumentoCapture from "../shared/DocumentoCapture";
import { abrirPdfEnNuevaPestana, descargarPdf } from "../../utils/pdfUtils";
import { actualizarDetAccionesPreviasFaena } from "../../api/detAccionesPreviasFaena";

export default function ConfirmacionAccionPreviaPDFCard({
  control,
  loading,
  setValue,
  watch,
  toast,
  accionPreviaId,
  faenaPescaId,
  detAccionesPreviasFaenaId, // ID del registro para actualizar
}) {
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const urlConfirmaAccionPdf = watch("urlConfirmaAccionPdf");
  const verificado = watch("verificado");
  const fechaVerificacion = watch("fechaVerificacion");

  // useEffect para actualizar verificación automáticamente cuando se carga PDF
  useEffect(() => {
    const actualizarVerificacion = async () => {
      console.log('🔍 [DEBUG] Verificando condiciones para actualización automática:', {
        urlConfirmaAccionPdf: urlConfirmaAccionPdf,
        detAccionesPreviasFaenaId: detAccionesPreviasFaenaId,
        verificado: verificado,
        loading: loading,
        urlValida: urlConfirmaAccionPdf && urlConfirmaAccionPdf.trim() !== "",
        tieneId: !!detAccionesPreviasFaenaId,
        noVerificado: !verificado,
        noCargando: !loading
      });

      // Solo actualizar si:
      // 1. Hay una URL de PDF válida
      // 2. Existe el ID del registro
      // 3. No está ya verificado (para evitar actualizaciones innecesarias)
      // 4. No está en proceso de carga
      if (
        urlConfirmaAccionPdf && 
        urlConfirmaAccionPdf.trim() !== "" && 
        detAccionesPreviasFaenaId && 
        !verificado && 
        !loading
      ) {
        console.log('✅ [DEBUG] Todas las condiciones cumplidas, procediendo a actualizar verificación...');
        
        try {
          const ahora = new Date();
          
          console.log('🚀 [DEBUG] Llamando a API actualizarDetAccionesPreviasFaena con:', {
            id: detAccionesPreviasFaenaId,
            datos: {
              fechaVerificacion: ahora,
              verificado: true,
              urlConfirmaAccionPdf: urlConfirmaAccionPdf
            }
          });
          
          // Actualizar en la base de datos
          const resultado = await actualizarDetAccionesPreviasFaena(detAccionesPreviasFaenaId, {
            fechaVerificacion: ahora,
            verificado: true,
            urlConfirmaAccionPdf: urlConfirmaAccionPdf // Asegurar que la URL se mantiene
          });

          console.log('✅ [DEBUG] Respuesta de API:', resultado);

          // Actualizar los valores del formulario
          setValue("fechaVerificacion", ahora);
          setValue("verificado", true);

          console.log('✅ [DEBUG] Valores del formulario actualizados');

          // Mostrar mensaje de éxito
          toast?.show({
            severity: "success",
            summary: "Verificación Actualizada",
            detail: "La verificación de la acción previa se ha completado automáticamente",
            life: 4000,
          });

        } catch (error) {
          console.error('❌ [DEBUG] Error al actualizar verificación:', error);
          toast?.show({
            severity: "error",
            summary: "Error de Verificación",
            detail: "No se pudo actualizar la verificación automáticamente",
            life: 4000,
          });
        }
      } else {
        console.log('❌ [DEBUG] Condiciones no cumplidas, no se actualiza verificación');
      }
    };

    actualizarVerificacion();
  }, [urlConfirmaAccionPdf, detAccionesPreviasFaenaId, verificado, loading, setValue, toast]);

  // Manejar cuando se sube un documento exitosamente
  const handleDocumentoSubido = (urlDocumento) => {
    setValue("urlConfirmaAccionPdf", urlDocumento);
    setMostrarCaptura(false);
    toast?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "El PDF de confirmación se ha subido correctamente",
      life: 3000,
    });
  };

  return (
    <>
      <Card className="p-mb-3">
        <div className="p-grid">
          {/* Botón para capturar/subir documento */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Capturar Fotos"
                icon="pi pi-camera"
                className="p-button-outlined"
                onClick={() => setMostrarCaptura(true)}
                disabled={loading}
                tooltip="Capturar fotos o subir archivos para generar el PDF de confirmación"
                tooltipOptions={{ position: "left" }}
              />
            </div>
            {/* Campo URL Documento */}
            <div style={{ flex: 3 }}>
              <label htmlFor="urlConfirmaAccionPdf">URL Confirmación PDF</label>
              <Controller
                name="urlConfirmaAccionPdf"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlConfirmaAccionPdf"
                    {...field}
                    placeholder="URL del PDF de confirmación"
                    className="w-full"
                    style={{ fontWeight: "bold" }}
                    readOnly
                    disabled={loading}
                  />
                )}
              />
            </div>
            {/* Botones de acción para el PDF */}
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Abrir"
                icon="pi pi-external-link"
                className="p-button-outlined p-button-sm"
                style={{ minWidth: "80px" }}
                onClick={() =>
                  abrirPdfEnNuevaPestana(
                    urlConfirmaAccionPdf,
                    toast,
                    "No hay PDF de confirmación disponible"
                  )
                }
                tooltip="Abrir PDF en nueva pestaña"
                tooltipOptions={{ position: "top" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                type="button"
                label="Descargar"
                icon="pi pi-download"
                className="p-button-outlined p-button-sm"
                style={{ minWidth: "80px" }}
                onClick={() =>
                  descargarPdf(
                    urlConfirmaAccionPdf,
                    toast,
                    `confirmacion-accion-previa-${
                      accionPreviaId || "sin-id"
                    }-faena-${faenaPescaId || "sin-faena"}.pdf`,
                    "confirmaciones-acciones-previas"
                  )
                }
                tooltip="Descargar PDF de confirmación"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
          {/* Visor de PDF */}
          {urlConfirmaAccionPdf && (
            <div className="field col-12">
              <PDFViewer urlDocumento={urlConfirmaAccionPdf} />
            </div>
          )}

          {/* Mensaje cuando no hay documento */}
          {!urlConfirmaAccionPdf && (
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
                  No hay PDF de confirmación cargado
                </p>
                <small className="text-500">
                  Use el botón "Capturar/Subir Confirmación PDF" para agregar
                  fotos o archivos de confirmación de la acción previa
                </small>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de captura de documento */}
      <DocumentoCapture
        visible={mostrarCaptura}
        onHide={() => setMostrarCaptura(false)}
        onDocumentoSubido={handleDocumentoSubido}
        endpoint="/api/confirmaciones-acciones-previas/upload"
        datosAdicionales={{
          accionPreviaId: accionPreviaId || "",
          faenaPescaId: faenaPescaId || "",
        }}
        titulo="Subir Confirmación de Acción Previa"
        prefijo="confirmacion-accion-previa"
        identificador={`${accionPreviaId || "sin-id"}-${
          faenaPescaId || "sin-faena"
        }`}
        mensajeInfo={`Acción Previa ID: ${
          accionPreviaId || "No definido"
        } - Faena ID: ${faenaPescaId || "No definido"}`}
      />
    </>
  );
}
