import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFMovimientoAlmacen } from "./MovimientoAlmacenPDF";

const VerImpresionMovimientoPDF = ({
  movimientoId,
  datosMovimiento = {},
  toast,
  onPdfGenerated,
  personalOptions = [],
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosMovimiento?.urlMovAlmacenPdf) {
      setPdfUrl(datosMovimiento.urlMovAlmacenPdf);
    }
  }, [datosMovimiento?.urlMovAlmacenPdf]);

  const generarPdfWrapper = async () => {
    if (!datosMovimiento?.id) {
      throw new Error("Debe guardar el movimiento antes de generar el PDF");
    }

    const { getMovimientoAlmacenPorId } = await import("../../api/movimientoAlmacen");
    const movimientoCompleto = await getMovimientoAlmacenPorId(datosMovimiento.id);
    
    const empresa = movimientoCompleto.empresa || datosMovimiento.empresa;
    const detalles = movimientoCompleto.detalles || [];

    const movimientoEnriquecido = { ...datosMovimiento };
    if (movimientoEnriquecido.conceptoMovAlmacen) {
      if (movimientoEnriquecido.conceptoMovAlmacen.almacenOrigenId && 
          !movimientoEnriquecido.conceptoMovAlmacen.almacenOrigen) {
        const { getAlmacenes } = await import("../../api/almacen");
        try {
          const almacenes = await getAlmacenes();
          const almacenOrigen = almacenes.find(
            (a) => Number(a.id) === Number(movimientoEnriquecido.conceptoMovAlmacen.almacenOrigenId)
          );
          if (almacenOrigen) {
            movimientoEnriquecido.conceptoMovAlmacen.almacenOrigen = almacenOrigen;
          }
        } catch (err) {
          console.warn("No se pudo cargar almacén origen:", err);
        }
      }
      
      if (movimientoEnriquecido.conceptoMovAlmacen.almacenDestinoId && 
          !movimientoEnriquecido.conceptoMovAlmacen.almacenDestino) {
        const { getAlmacenes } = await import("../../api/almacen");
        try {
          const almacenes = await getAlmacenes();
          const almacenDestino = almacenes.find(
            (a) => Number(a.id) === Number(movimientoEnriquecido.conceptoMovAlmacen.almacenDestinoId)
          );
          if (almacenDestino) {
            movimientoEnriquecido.conceptoMovAlmacen.almacenDestino = almacenDestino;
          }
        } catch (err) {
          console.warn("No se pudo cargar almacén destino:", err);
        }
      }
    }

    if (movimientoEnriquecido.personalRespAlmacen && !movimientoEnriquecido.personalRespAlmacen.nombreCompleto) {
      const personalId = typeof movimientoEnriquecido.personalRespAlmacen === 'number' 
        ? movimientoEnriquecido.personalRespAlmacen 
        : Number(movimientoEnriquecido.personalRespAlmacen);
      
      const personal = personalOptions.find(
        (p) => Number(p.id || p.value) === personalId
      );
      
      if (personal) {
        movimientoEnriquecido.personalRespAlmacen = {
          nombreCompleto: personal.nombreCompleto || personal.label,
          numeroDocumento: personal.numeroDocumento,
        };
      }
    }

    const resultado = await generarYSubirPDFMovimientoAlmacen(
      movimientoEnriquecido,
      detalles,
      empresa,
      false
    );

    return resultado;
  };

  return (
    <Card>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosMovimiento}
        moduleName="movimiento-almacen"
        entityId={movimientoId}
        fileName={`movimiento-almacen-${datosMovimiento.numeroDocumento || movimientoId}.pdf`}
        buttonLabel="PDF sin Costos"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!movimientoId}
        warningMessage={
          !movimientoId
            ? "Debe guardar el movimiento antes de generar el PDF"
            : null
        }
        toast={toast}
        viewerHeight="800px"
        onGenerateComplete={(url) => {
          setPdfUrl(url);
          if (datosMovimiento) {
            datosMovimiento.urlMovAlmacenPdf = url;
          }
          if (onPdfGenerated) onPdfGenerated(url);
        }}
        initialPdfUrl={datosMovimiento?.urlMovAlmacenPdf}
      />
    </Card>
  );
};

export default VerImpresionMovimientoPDF;