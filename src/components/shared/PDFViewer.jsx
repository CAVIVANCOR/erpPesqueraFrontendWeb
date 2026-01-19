/**
 * PDFViewer.jsx
 *
 * Componente para visualizar documentos PDF en línea.
 * Soporta múltiples rutas de archivos protegidas con JWT.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const PDFViewer = ({ urlDocumento, altura = "600px" }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!urlDocumento) {
      setLoading(false);
      setError("No se proporcionó URL del documento");
      return;
    }

    const cargarPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        let urlCompleta = "";

        // Determinar la URL completa según el tipo de documento
        if (urlDocumento.startsWith("/uploads/documentos-visitante/")) {
          // Soporte para documentos de visitante
          const rutaArchivo = urlDocumento.replace(
            "/uploads/documentos-visitante/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/acceso-instalaciones/documentos-visitante/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/confirmaciones-acciones-previas-consumo/"
          )
        ) {
          // Soporte para confirmaciones de acciones previas CONSUMO
          const rutaArchivo = urlDocumento.replace(
            "/uploads/confirmaciones-acciones-previas-consumo/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/confirmaciones-acciones-previas-consumo/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/confirmaciones-acciones-previas/")
        ) {
          // Soporte para confirmaciones de acciones previas
          const rutaArchivo = urlDocumento.replace(
            "/uploads/confirmaciones-acciones-previas/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/confirmaciones-acciones-previas/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/documentacion-personal/")
        ) {
          // Soporte para documentación personal
          const rutaArchivo = urlDocumento.replace(
            "/uploads/documentacion-personal/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/documentacion-personal/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/documentacion-embarcacion/")
        ) {
          // Soporte para documentación de embarcación
          const rutaArchivo = urlDocumento.replace(
            "/uploads/documentacion-embarcacion/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/documentaciones-embarcacion/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/comprobantes-mov-temporada/")
        ) {
          // Soporte para comprobantes de movimientos de liquidación de temporada
          const rutaArchivo = urlDocumento.replace(
            "/uploads/comprobantes-mov-temporada/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/movs-liquidacion-temporada/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/comprobantes-det-movs-entrega-rendir/"
          )
        ) {
          // Soporte para comprobantes de movimientos de entrega a rendir
          const rutaArchivo = urlDocumento.replace(
            "/uploads/comprobantes-det-movs-entrega-rendir/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir/archivo/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/comprobantes-det-movs-pesca-consumo/"
          )
        ) {
          // Soporte para comprobantes de movimientos de Novedad Pesca Consumo
          const rutaArchivo = urlDocumento.replace(
            "/uploads/comprobantes-det-movs-pesca-consumo/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/movs-entregarendir-pesca-consumo/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/reportes-faena-calas/")) {
          // Soporte para reportes de faena calas (ruta protegida con JWT)
          const rutaArchivo = urlDocumento.replace(
            "/uploads/reportes-faena-calas/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/faenas-pesca/archivo-reporte-calas/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/declaraciones-desembarque/")
        ) {
          // Soporte para declaraciones de desembarque del armador (ruta protegida con JWT)
          const rutaArchivo = urlDocumento.replace(
            "/uploads/declaraciones-desembarque/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/faenas-pesca/archivo-declaracion-desembarque/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/informes-faena-consumo/")
        ) {
          // ✅ NUEVO: Soporte para informes de faena consumo (ruta protegida con JWT)
          const rutaArchivo = urlDocumento.replace(
            "/uploads/informes-faena-consumo/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/pesca/faenas-pesca-consumo/archivo-informe-faena/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/comprobantes-movimiento-caja/")
        ) {
          // ✅ NUEVO: Soporte para comprobantes de operación de movimiento de caja
          const rutaArchivo = urlDocumento.replace(
            "/uploads/comprobantes-movimiento-caja/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/movimientos-caja/archivo-comprobante/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith("/uploads/documentos-movimiento-caja/")
        ) {
          // ✅ NUEVO: Soporte para documentos afectos de movimiento de caja
          const rutaArchivo = urlDocumento.replace(
            "/uploads/documentos-movimiento-caja/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/movimientos-caja/archivo-documento/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/requerimientos-compra/")) {
          // ✅ NUEVO: Soporte para PDFs de requerimientos de compra
          const rutaArchivo = urlDocumento.replace(
            "/uploads/requerimientos-compra/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/requerimiento-compra/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/ordenes-compra/")) {
          // ✅ NUEVO: Soporte para PDFs de órdenes de compra
          const rutaArchivo = urlDocumento.replace(
            "/uploads/ordenes-compra/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/orden-compra/archivo/${rutaArchivo}`;

        } else if (
          urlDocumento.startsWith("/uploads/datos-adicionales-orden-compra/")
        ) {
          // Soporte para documentos adjuntos de datos adicionales de OC
          const rutaArchivo = urlDocumento.replace(
            "/uploads/datos-adicionales-orden-compra/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-datos-adicionales-orden-compra/archivo/${rutaArchivo}`;

        } else if (
          urlDocumento.startsWith("/uploads/documentos-requeridos-ventas/")
        ) {
          // Soporte para documentos requeridos de cotización de ventas
          const rutaArchivo = urlDocumento.replace(
            "/uploads/documentos-requeridos-ventas/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-docs-req-cotiza-ventas/archivo/${rutaArchivo}`;

        } else if (urlDocumento.startsWith("/uploads/movimientos-almacen/")) {
          // ✅ NUEVO: Soporte para PDFs de movimientos de almacén
          const rutaArchivo = urlDocumento.replace(
            "/uploads/movimientos-almacen/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/movimiento-almacen/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/cotizaciones-ventas/")) {
          // ✅ NUEVO: Soporte para PDFs de cotizaciones de ventas
          const rutaArchivo = urlDocumento.replace(
            "/uploads/cotizaciones-ventas/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/cotizacion-ventas/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/entregas-rendir/")) {
          // ✅ NUEVO: Soporte para PDFs de liquidaciones de entregas a rendir
          const rutaArchivo = urlDocumento.replace(
            "/uploads/entregas-rendir/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/entregas-a-rendir/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/contratos-servicio/")) {
          // ✅ NUEVO: Soporte para PDFs de contratos de servicio
          const rutaArchivo = urlDocumento.replace(
            "/uploads/contratos-servicio/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/contrato-servicio-pdf/archivo-contrato/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de contratos
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-contrato-pdf/archivo-comprobante/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de contratos
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-contrato-pdf/archivo-operacion/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de movimientos de almacén
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-comprobante/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de movimientos de almacén
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-operacion/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de OT Mantenimiento
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-comprobante/${rutaArchivo}`;
        } else if (
          urlDocumento.startsWith(
            "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/"
          )
        ) {
          // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de OT Mantenimiento
          const rutaArchivo = urlDocumento.replace(
            "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-operacion/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/uploads/prestamos-bancarios/")) {
          // ✅ NUEVO: Soporte para documentos de préstamos bancarios (principal y adicional)
          const rutaArchivo = urlDocumento.replace(
            "/uploads/prestamos-bancarios/",
            ""
          );
          urlCompleta = `${
            import.meta.env.VITE_API_URL
          }/tesoreria/prestamos-bancarios/archivo/${rutaArchivo}`;
        } else if (urlDocumento.startsWith("/api/")) {
          // Remover /api/ del inicio porque VITE_API_URL ya lo incluye
          const rutaSinApi = urlDocumento.substring(4);
          urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
        } else if (urlDocumento.startsWith("/")) {
          // Ruta relativa sin /api/
          urlCompleta = `${import.meta.env.VITE_API_URL}${urlDocumento}`;
        } else {
          // URL absoluta
          urlCompleta = urlDocumento;
        }

        // Obtener token JWT
        const token = useAuthStore.getState().token;

        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }

        // Realizar petición con autenticación
        const response = await fetch(urlCompleta, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Convertir respuesta a blob
        const blob = await response.blob();

        // Crear URL del blob para el iframe
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
      } catch (error) {
        console.error("Error cargando PDF:", error);
        setError(error.message || "Error al cargar el documento");
      } finally {
        setLoading(false);
      }
    };

    cargarPDF();

    // Cleanup: liberar URL del blob cuando el componente se desmonte
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [urlDocumento]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: altura,
          border: "1px solid #dee2e6",
          borderRadius: "6px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p style={{ marginTop: "1rem", color: "#6c757d" }}>
            Cargando documento...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem" }}>
        <Message severity="error" text={error} style={{ width: "100%" }} />
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={{ padding: "1rem" }}>
        <Message
          severity="warn"
          text="No hay documento para mostrar"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "6px",
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      <iframe
        src={pdfUrl}
        style={{
          width: "100%",
          height: altura,
          border: "none",
        }}
        title="Visor de PDF"
      />
    </div>
  );
};

export default PDFViewer;
