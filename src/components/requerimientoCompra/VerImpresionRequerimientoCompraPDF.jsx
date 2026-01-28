import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFRequerimientoCompra } from "./RequerimientoCompraPDF";
import { actualizarRequerimientoCompra } from "../../api/requerimientoCompra";

const VerImpresionRequerimientoCompraPDF = ({
  requerimientoId,
  datosRequerimiento = {},
  toast,
  onPdfGenerated,
  personalOptions = [],
  onRecargarRegistro,
}) => {
  const [mostrarProveedor, setMostrarProveedor] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosRequerimiento?.urlReqCompraPdf) {
      setPdfUrl(datosRequerimiento.urlReqCompraPdf);
    }
  }, [datosRequerimiento?.urlReqCompraPdf]);

  const generarPdfWrapper = async () => {
    if (!datosRequerimiento?.id) {
      throw new Error("Debe guardar el requerimiento antes de generar el PDF");
    }

    const empresa = datosRequerimiento.empresa;
    const detalles = datosRequerimiento.detalles || [];

    const requerimientoConPersonal = { ...datosRequerimiento };

    if (datosRequerimiento.solicitanteId && !datosRequerimiento.solicitante) {
      const solicitante = personalOptions.find(
        (p) =>
          Number(p.id || p.value) === Number(datosRequerimiento.solicitanteId),
      );
      if (solicitante) {
        requerimientoConPersonal.solicitante = {
          nombreCompleto: solicitante.nombreCompleto || solicitante.label,
          numeroDocumento: solicitante.numeroDocumento,
        };
      }
    }

    if (datosRequerimiento.respComprasId && !datosRequerimiento.respCompras) {
      const respCompras = personalOptions.find(
        (p) =>
          Number(p.id || p.value) === Number(datosRequerimiento.respComprasId),
      );
      if (respCompras) {
        requerimientoConPersonal.respCompras = {
          nombreCompleto: respCompras.nombreCompleto || respCompras.label,
          numeroDocumento: respCompras.numeroDocumento,
        };
      }
    }

    // 1. PRIMERO: Generar el PDF
    console.log("🔄 [VerImpresionRequerimientoCompraPDF] Generando PDF...");
    const resultado = await generarYSubirPDFRequerimientoCompra(
      requerimientoConPersonal,
      detalles,
      empresa,
      mostrarProveedor,
    );

    if (resultado.success && resultado.urlPdf) {
      try {
        // 2. DESPUÉS: Guardar automáticamente SOLO el campo urlReqCompraPdf
        console.log(
          "💾 [VerImpresionRequerimientoCompraPDF] Guardando URL del PDF en BD...",
        );

        // ✅ ENVIAR SOLO EL CAMPO urlReqCompraPdf
        const dataToUpdate = {
          urlReqCompraPdf: resultado.urlPdf,
        };

        console.log(
          "📤 [VerImpresionRequerimientoCompraPDF] Datos a enviar:",
          dataToUpdate,
        );

        await actualizarRequerimientoCompra(
          datosRequerimiento.id,
          dataToUpdate,
        );

        console.log(
          "✅ [VerImpresionRequerimientoCompraPDF] Datos guardados correctamente en BD",
        );

        // Notificar al componente padre para actualizar estado local
        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          onPdfGenerated(resultado.urlPdf);
        }

        // ✅ RECARGAR el registro completo desde el servidor para actualizar el estado del padre
        if (onRecargarRegistro && typeof onRecargarRegistro === "function") {
          console.log(
            "🔄 [VerImpresionRequerimientoCompraPDF] Recargando registro desde el servidor...",
          );
          await onRecargarRegistro();
          console.log(
            "✅ [VerImpresionRequerimientoCompraPDF] Registro recargado exitosamente",
          );
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
          "❌ [VerImpresionRequerimientoCompraPDF] Error al guardar:",
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

  const customControls = (
    <>
      <label
        htmlFor="toggleProveedor"
        style={{ display: "block", marginBottom: "0.5rem" }}
      >
        Opciones
      </label>
      <Button
        id="toggleProveedor"
        icon={mostrarProveedor ? "pi pi-eye" : "pi pi-eye-slash"}
        label={mostrarProveedor ? "CON PROVEEDOR" : "SIN PROVEEDOR"}
        className={mostrarProveedor ? "p-button-primary" : "p-button-secondary"}
        onClick={() => setMostrarProveedor(!mostrarProveedor)}
        tooltip={
          mostrarProveedor
            ? "El PDF incluirá el proveedor"
            : "El PDF NO incluirá el proveedor"
        }
        tooltipOptions={{ position: "top" }}
        style={{ width: "100%" }}
      />
    </>
  );

  return (
    <Card>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosRequerimiento}
        moduleName="requerimiento-compra"
        entityId={requerimientoId}
        fileName={`requerimiento-compra-${datosRequerimiento.numeroDocumento || requerimientoId}.pdf`}
        buttonLabel="Generar Requerimiento PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!requerimientoId}
        warningMessage={
          !requerimientoId
            ? "Debe guardar el requerimiento antes de generar el PDF"
            : null
        }
        toast={toast}
        customControls={customControls}
        viewerHeight="800px"
        onGenerateComplete={(url) => setPdfUrl(url)}
        initialPdfUrl={datosRequerimiento?.urlReqCompraPdf}
      />
    </Card>
  );
};

export default VerImpresionRequerimientoCompraPDF;
