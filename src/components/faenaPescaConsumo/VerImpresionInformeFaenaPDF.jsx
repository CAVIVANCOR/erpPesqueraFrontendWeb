/**
 * VerImpresionInformeFaenaPDF.jsx
 * Componente wrapper para generación de PDF de Informe de Faena
 * Sigue el patrón de VerImpresionRequerimientoCompraPDF
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFInformeFaena } from "./InformeFaenaPDF";
import { actualizarFaenaPescaConsumo, getFaenaPescaConsumoPorId } from "../../api/faenaPescaConsumo";

const VerImpresionInformeFaenaPDF = ({
  faenaId,
  datosFaena = {},
  toast,
  onPdfGenerated,
  onRecargarRegistro,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosFaena?.urlInformeFaena) {
      setPdfUrl(datosFaena.urlInformeFaena);
    }
  }, [datosFaena?.urlInformeFaena]);

    const generarPdfWrapper = async () => {
    if (!datosFaena?.id) {
      throw new Error("Debe guardar la faena antes de generar el PDF");
    }

    // IMPORTANTE: Cargar datos completos desde el backend con todas las relaciones
    const faenaCompleta = await getFaenaPescaConsumoPorId(datosFaena.id);
    
    const embarcacion = faenaCompleta.embarcacion;
    const novedadPescaConsumo = faenaCompleta.novedadPescaConsumo;
    const calas = faenaCompleta.calas || [];

    console.log("✅ [VERIFICACIÓN] Datos cargados desde backend:", {
      faenaId: faenaCompleta.id,
      tieneEmbarcacion: !!embarcacion,
      tieneNovedad: !!novedadPescaConsumo,
      cantidadCalas: calas.length,
      calaConEspecies: calas[0]?.especiesPescadas?.length || 0
    });

    // Generar el PDF
    const resultado = await generarYSubirPDFInformeFaena(
      faenaCompleta,
      calas,
      embarcacion,
      novedadPescaConsumo,
    );

    if (resultado.success && resultado.urlPdf) {
      try {
        // Guardar automáticamente SOLO el campo urlInformeFaena
        const dataToUpdate = {
          urlInformeFaena: resultado.urlPdf,
        };
        await actualizarFaenaPescaConsumo(
          datosFaena.id,
          dataToUpdate,
        );
        
        // Notificar al componente padre para actualizar estado local
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(resultado.urlPdf);
        }

        // Recargar el registro completo desde el servidor
        if (onRecargarRegistro && typeof onRecargarRegistro === "function") {
          await onRecargarRegistro();
        }

        // Mostrar mensaje de éxito
        if (toast?.current) {
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "PDF generado y guardado correctamente",
            life: 3000,
          });
        }
      } catch (error) {
        console.error(
          "❌ [VerImpresionInformeFaenaPDF] Error al guardar:",
          error,
        );
        console.error(
          "❌ Detalles del error:",
          error.response?.data || error.message,
        );

        // Mostrar error pero el PDF ya fue generado
        if (toast?.current) {
          toast.current.show({
            severity: "warn",
            summary: "Advertencia",
            detail: `PDF generado correctamente pero hubo un error al guardar: ${error.response?.data?.message || error.message}`,
            life: 5000,
          });
        }
      }
    }

    return resultado;
  };

  return (
    <Card>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosFaena}
        moduleName="faena-pesca-consumo"
        entityId={faenaId}
        fileName={`informe-faena-${datosFaena.id || faenaId}.pdf`}
        buttonLabel="Generar Informe Descarga"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!faenaId}
        warningMessage={
          !faenaId
            ? "Debe guardar la faena antes de generar el PDF"
            : null
        }
        toast={toast}
        viewerHeight="800px"
        onGenerateComplete={(url) => setPdfUrl(url)}
        initialPdfUrl={datosFaena?.urlInformeFaena}
      />
    </Card>
  );
};

export default VerImpresionInformeFaenaPDF;