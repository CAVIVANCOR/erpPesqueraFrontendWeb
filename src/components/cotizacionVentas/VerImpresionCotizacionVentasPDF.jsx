import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFCotizacionVentas } from "./CotizacionVentasPDF";
import { actualizarCotizacionVentas } from "../../api/cotizacionVentas";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const VerImpresionCotizacionVentasPDF = ({
  cotizacionId,
  datosCotizacion = {},
  detalles = [],
  toast,
  onPdfGenerated,
  onRecargarRegistro,
}) => {
  const [idioma, setIdioma] = useState("en");
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (datosCotizacion?.urlCotizacionPdf) {
      setPdfUrl(datosCotizacion.urlCotizacionPdf);
    }
  }, [datosCotizacion?.urlCotizacionPdf]);

  const generarPdfWrapper = async () => {
    if (!datosCotizacion?.id) {
      throw new Error("Debe guardar la cotización antes de generar el PDF");
    }

    if (detalles.length === 0) {
      throw new Error("Debe agregar al menos un producto para generar el PDF");
    }

    const token = useAuthStore.getState().token;
    const headers = { Authorization: `Bearer ${token}` };

    let cotizacionCompleta;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cotizaciones-ventas/${datosCotizacion.id}`,
        { headers }
      );
      if (response.ok) {
        cotizacionCompleta = await response.json();
      } else {
        throw new Error("No se pudo cargar la cotización completa");
      }
    } catch (error) {
      console.error("Error cargando cotización completa:", error);
      throw new Error("No se pudo cargar la cotización completa desde el servidor");
    }

    let empresa = cotizacionCompleta.empresa;

    if (!empresa && datosCotizacion.empresaId) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/empresas/${datosCotizacion.empresaId}`,
          { headers }
        );
        if (response.ok) {
          empresa = await response.json();
        }
      } catch (error) {
        console.error("Error cargando empresa:", error);
      }
    }

    if (!empresa) {
      throw new Error("No se pudo cargar la información de la empresa");
    }

    const promesas = [];

    if (cotizacionCompleta.puertoCargaId && !cotizacionCompleta.puertoCarga) {
      promesas.push(
        fetch(`${import.meta.env.VITE_API_URL}/pesca/puertos-pesca/${cotizacionCompleta.puertoCargaId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) cotizacionCompleta.puertoCarga = data; })
          .catch(e => console.error("Error cargando puerto carga:", e))
      );
    }

    if (cotizacionCompleta.puertoDescargaId && !cotizacionCompleta.puertoDescarga) {
      promesas.push(
        fetch(`${import.meta.env.VITE_API_URL}/pesca/puertos-pesca/${cotizacionCompleta.puertoDescargaId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) cotizacionCompleta.puertoDescarga = data; })
          .catch(e => console.error("Error cargando puerto descarga:", e))
      );
    }

    if (cotizacionCompleta.paisDestinoId && !cotizacionCompleta.paisDestino) {
      promesas.push(
        fetch(`${import.meta.env.VITE_API_URL}/paises/${cotizacionCompleta.paisDestinoId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) cotizacionCompleta.paisDestino = data; })
          .catch(e => console.error("Error cargando país destino:", e))
      );
    }

    if (cotizacionCompleta.respVentasId && !cotizacionCompleta.respVentas) {
      promesas.push(
        fetch(`${import.meta.env.VITE_API_URL}/personal/${cotizacionCompleta.respVentasId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) cotizacionCompleta.respVentas = data; })
          .catch(e => console.error("Error cargando resp ventas:", e))
      );
    }

    if (cotizacionCompleta.autorizaVentaId && !cotizacionCompleta.autorizaVenta) {
      promesas.push(
        fetch(`${import.meta.env.VITE_API_URL}/personal/${cotizacionCompleta.autorizaVentaId}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) cotizacionCompleta.autorizaVenta = data; })
          .catch(e => console.error("Error cargando autoriza venta:", e))
      );
    }

    await Promise.all(promesas);

    const detallesCompletos = cotizacionCompleta.detallesProductos || detalles;

    console.log("🔄 [VerImpresionCotizacionVentasPDF] Generando PDF con idioma:", idioma);
    const resultado = await generarYSubirPDFCotizacionVentas(
      cotizacionCompleta,
      detallesCompletos,
      empresa,
      idioma
    );

    console.log("📦 [VerImpresionCotizacionVentasPDF] Resultado de generación:", resultado);

    if (resultado.success && resultado.urlPdf) {
      try {
        console.log("💾 [VerImpresionCotizacionVentasPDF] Guardando URL del PDF en BD...");
        console.log("🆔 [VerImpresionCotizacionVentasPDF] ID de cotización:", datosCotizacion.id);
        console.log("🔗 [VerImpresionCotizacionVentasPDF] URL a guardar:", resultado.urlPdf);
        
        const dataToUpdate = {
          urlCotizacionPdf: resultado.urlPdf,
        };

        console.log("📤 [VerImpresionCotizacionVentasPDF] Datos a enviar:", dataToUpdate);

        const respuestaActualizacion = await actualizarCotizacionVentas(datosCotizacion.id, dataToUpdate);

        console.log("✅ [VerImpresionCotizacionVentasPDF] Respuesta de actualización:", respuestaActualizacion);
        console.log("✅ [VerImpresionCotizacionVentasPDF] Datos guardados correctamente en BD");

        if (onPdfGenerated && typeof onPdfGenerated === "function") {
          console.log("📢 [VerImpresionCotizacionVentasPDF] Llamando onPdfGenerated...");
          onPdfGenerated(resultado.urlPdf);
        }

        if (onRecargarRegistro && typeof onRecargarRegistro === "function") {
          console.log("🔄 [VerImpresionCotizacionVentasPDF] Llamando onRecargarRegistro...");
          await onRecargarRegistro();
          console.log("✅ [VerImpresionCotizacionVentasPDF] Registro recargado exitosamente");
        } else {
          console.warn("⚠️ [VerImpresionCotizacionVentasPDF] onRecargarRegistro NO está definido o no es función");
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
        console.error("❌ [VerImpresionCotizacionVentasPDF] Error al guardar:", error);
        console.error("❌ Detalles del error:", error.response?.data || error.message);
        console.error("❌ Stack trace:", error.stack);
        
        if (toast?.current) {
          toast.current.show({
            severity: "warn",
            summary: "Advertencia",
            detail: `PDF generado correctamente pero hubo un error al guardar: ${error.response?.data?.message || error.message}`,
            life: 5000,
          });
        }
      }
    } else {
      console.error("❌ [VerImpresionCotizacionVentasPDF] No se pudo generar el PDF:", resultado.error);
    }

    return resultado;
  };

  const customControls = (
    <>
      <label htmlFor="idiomaBtn" style={{ display: 'block', marginBottom: '0.5rem' }}>
        Idioma
      </label>
      <Button
        type="button"
        id="idiomaBtn"
        icon={idioma === "en" ? "pi pi-flag" : "pi pi-flag-fill"}
        label={idioma === "en" ? "English" : "Español"}
        className={idioma === "en" ? "p-button-info" : "p-button-warning"}
        onClick={() => setIdioma(idioma === "en" ? "es" : "en")}
        tooltip={idioma === "en" ? "Cambiar a Español" : "Switch to English"}
        tooltipOptions={{ position: "top" }}
        style={{ width: "100%" }}
      />
    </>
  );

  return (
    <Card>
      <PDFGeneratedUploader
        generatePdfFunction={generarPdfWrapper}
        pdfData={datosCotizacion}
        moduleName="cotizacion-ventas"
        entityId={cotizacionId}
        fileName={`cotizacion-ventas-${datosCotizacion.numeroDocumento || cotizacionId}.pdf`}
        buttonLabel="Generar Cotización PDF"
        buttonIcon="pi pi-file-pdf"
        buttonClassName="p-button-success"
        disabled={!cotizacionId || detalles.length === 0}
        warningMessage={!cotizacionId ? "Debe guardar la cotización antes de generar el PDF" : null}
        infoMessage={detalles.length === 0 ? "Debe agregar al menos un producto en el detalle para poder generar el PDF." : null}
        toast={toast}
        customControls={customControls}
        viewerHeight="800px"
        onGenerateComplete={(url) => setPdfUrl(url)}
        initialPdfUrl={datosCotizacion?.urlCotizacionPdf}
      />
    </Card>
  );
};

export default VerImpresionCotizacionVentasPDF;