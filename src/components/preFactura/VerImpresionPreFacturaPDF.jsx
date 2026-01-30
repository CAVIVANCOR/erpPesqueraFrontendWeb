import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFPreFactura } from "./PreFacturaPDF";
import { actualizarPreFactura } from "../../api/preFactura";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionPreFacturaPDF = ({
  preFacturaId,
  datosPreFactura = {},
  detalles = [],
  toast,
  onPdfGenerated,
  onRecargarRegistro,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const usuario = useAuthStore((state) => state.usuario);

  useEffect(() => {
    if (datosPreFactura?.urlPreFacturaPdf) {
      setPdfUrl(datosPreFactura.urlPreFacturaPdf);
    }
  }, [datosPreFactura?.urlPreFacturaPdf]);

  const generarPdfWrapper = async () => {
    if (!preFacturaId) {
      throw new Error("Debe guardar la pre-factura antes de generar el PDF");
    }

    const resultado = await generarYSubirPDFPreFactura(
      preFacturaId,
      datosPreFactura,
      detalles,
      usuario
    );

    if (resultado.success && resultado.url) {
      try {
        const dataToUpdate = {
          urlPreFacturaPdf: resultado.url,
        };
        await actualizarPreFactura(preFacturaId, dataToUpdate);
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(resultado.url);
        }

        if (onRecargarRegistro && typeof onRecargarRegistro === "function") {
          await onRecargarRegistro();
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
    return {
      success: resultado.success,
      urlPdf: resultado.url,
      error: resultado.error
    };
  };

  const cardHeader = (
    <div className="flex justify-content-between align-items-center">
      <h3 className="m-0">Vista Previa PDF Pre-Factura</h3>
      {datosPreFactura?.numeroDocumento && (
        <div className="text-600">
          <strong>Doc:</strong> {datosPreFactura.numeroDocumento} | 
          <strong> Código:</strong> {datosPreFactura.codigo}
        </div>
      )}
    </div>
  );

  return (
    <Card header={cardHeader} className="mt-3">
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosPreFactura}
        moduleName="pre-factura"
        entityId={preFacturaId}
        fileName={`PreFactura_${datosPreFactura.numeroDocumento || preFacturaId}.pdf`}
        buttonLabel="Generar PDF Pre-Factura"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-danger"
        disabled={!preFacturaId}
        warningMessage={!preFacturaId ? "Guarde la pre-factura para poder generar el PDF" : null}
        toast={toast}
        viewerHeight="600px"
        onGenerateComplete={(url) => setPdfUrl(url)}
        initialPdfUrl={datosPreFactura?.urlPreFacturaPdf}
      />

      {datosPreFactura?.numeroDocumento && (
        <div className="mt-3 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
          <div className="grid">
            <div className="col-12 md:col-4">
              <strong>Número Documento:</strong>
              <div>{datosPreFactura.numeroDocumento}</div>
            </div>
            <div className="col-12 md:col-4">
              <strong>Código:</strong>
              <div>{datosPreFactura.codigo}</div>
            </div>
            <div className="col-12 md:col-4">
              <strong>Fecha:</strong>
              <div>
                {datosPreFactura.fechaDocumento
                  ? new Date(datosPreFactura.fechaDocumento).toLocaleDateString("es-PE")
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VerImpresionPreFacturaPDF;