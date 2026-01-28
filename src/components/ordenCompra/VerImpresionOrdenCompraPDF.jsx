import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFOrdenCompra } from "./OrdenCompraPDF";
import { actualizarOrdenCompra } from "../../api/ordenCompra";

const VerImpresionOrdenCompraPDF = ({
  ordenCompraId,
  datosOrdenCompra = {},
  toast,
  onPdfGenerated,
  personalOptions = [],
  onRecargarRegistro,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosOrdenCompra?.urlOrdenCompraPdf) {
      setPdfUrl(datosOrdenCompra.urlOrdenCompraPdf);
    }
  }, [datosOrdenCompra?.urlOrdenCompraPdf]);

  const generarPdfWrapper = async () => {
    if (!datosOrdenCompra?.id) {
      throw new Error("Debe guardar la orden de compra antes de generar el PDF");
    }

    const empresa = datosOrdenCompra.empresa;
    const detalles = datosOrdenCompra.detalles || [];
    
    const ordenConPersonal = { ...datosOrdenCompra };
    
    if (datosOrdenCompra.solicitanteId && !datosOrdenCompra.solicitante) {
      const solicitante = personalOptions.find(
        (p) => Number(p.id || p.value) === Number(datosOrdenCompra.solicitanteId)
      );
      if (solicitante) {
        ordenConPersonal.solicitante = {
          nombreCompleto: solicitante.nombreCompleto || solicitante.label,
          numeroDocumento: solicitante.numeroDocumento,
          cargo: solicitante.cargo,
        };
      }
    }
    
    if (datosOrdenCompra.aprobadoPorId && !datosOrdenCompra.aprobadoPor) {
      const aprobadoPor = personalOptions.find(
        (p) => Number(p.id || p.value) === Number(datosOrdenCompra.aprobadoPorId)
      );
      if (aprobadoPor) {
        ordenConPersonal.aprobadoPor = {
          nombreCompleto: aprobadoPor.nombreCompleto || aprobadoPor.label,
          numeroDocumento: aprobadoPor.numeroDocumento,
          cargo: aprobadoPor.cargo,
        };
      }
    }

    console.log("🔄 [VerImpresionOrdenCompraPDF] Generando PDF...");
    const resultado = await generarYSubirPDFOrdenCompra(
      ordenConPersonal,
      detalles,
      empresa
    );

    if (resultado.success && resultado.urlPdf) {
      try {
        console.log("💾 [VerImpresionOrdenCompraPDF] Guardando URL del PDF en BD...");
        
        const dataToUpdate = {
          urlOrdenCompraPdf: resultado.urlPdf,
        };

        console.log("📤 [VerImpresionOrdenCompraPDF] Datos a enviar:", dataToUpdate);

        await actualizarOrdenCompra(datosOrdenCompra.id, dataToUpdate);

        console.log("✅ [VerImpresionOrdenCompraPDF] Datos guardados correctamente en BD");

        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(resultado.urlPdf);
        }

        if (onRecargarRegistro && typeof onRecargarRegistro === "function") {
          console.log("🔄 [VerImpresionOrdenCompraPDF] Recargando registro desde el servidor...");
          await onRecargarRegistro();
          console.log("✅ [VerImpresionOrdenCompraPDF] Registro recargado exitosamente");
        }

        if (toast?.current) {
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "PDF generado y guardado correctamente",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("❌ [VerImpresionOrdenCompraPDF] Error al guardar:", error);
        console.error("❌ Detalles del error:", error.response?.data || error.message);
        
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
        pdfData={datosOrdenCompra}
        moduleName="orden-compra"
        entityId={ordenCompraId}
        fileName={`orden-compra-${datosOrdenCompra.numeroDocumento || ordenCompraId}.pdf`}
        buttonLabel="Generar Orden de Compra PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!ordenCompraId}
        warningMessage={!ordenCompraId ? "Debe guardar la orden de compra antes de generar el PDF" : null}
        toast={toast}
        viewerHeight="800px"
        onGenerateComplete={(url) => setPdfUrl(url)}
        initialPdfUrl={datosOrdenCompra?.urlOrdenCompraPdf}
      />
    </Card>
  );
};

export default VerImpresionOrdenCompraPDF;