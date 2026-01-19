import { useAuthStore } from "../shared/stores/useAuthStore";

/**
 * Función genérica para abrir archivos PDF en una nueva pestaña
 * @param {string} urlPdf - URL del archivo PDF
 * @param {Object} toast - Referencia al componente Toast para mostrar mensajes
 * @param {string} mensajeError - Mensaje personalizado de error (opcional)
 */
export const abrirPdfEnNuevaPestana = async (
  urlPdf,
  toast,
  mensajeError = "No hay PDF disponible"
) => {
  if (!urlPdf) {
    toast?.show({
      severity: "warn",
      summary: "Advertencia",
      detail: mensajeError,
      life: 3000,
    });
    return;
  }

  try {
    let urlCompleta;

    // Construcción de URL siguiendo el patrón funcional
    if (urlPdf.startsWith("/uploads/resoluciones-temporada/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/resoluciones-temporada/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/temporada-pesca-resolucion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/resoluciones-novedad/")) {
      // Soporte para resoluciones de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace("/uploads/resoluciones-novedad/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/novedad-pesca-consumo-resolucion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/confirmaciones-acciones-previas/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/confirmaciones-acciones-previas/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/confirmaciones-acciones-previas/archivo/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/confirmaciones-acciones-previas-consumo/")
    ) {
      // Soporte para confirmaciones de acciones previas de Faena Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/confirmaciones-acciones-previas-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/confirmaciones-acciones-previas-consumo/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentacion-personal/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentacion-personal/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/documentacion-personal/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentacion-embarcacion/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentacion-embarcacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/documentaciones-embarcacion/archivo/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/comprobantes-det-movs-entrega-rendir/")
    ) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/comprobantes-det-movs-entrega-rendir/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir/archivo/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/comprobantes-det-movs-pesca-consumo/")
    ) {
      // Soporte para comprobantes de movimientos de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/comprobantes-det-movs-pesca-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/movs-entregarendir-pesca-consumo/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/fichas-tecnicas-boliches/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/fichas-tecnicas-boliches/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ficha-tecnica-boliches/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/certificados-embarcacion/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/certificados-embarcacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/certificados-embarcacion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/fichas-tecnicas/")) {
      const rutaArchivo = urlPdf.replace("/uploads/fichas-tecnicas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/producto-ficha-tecnica/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/reportes-faena-calas/")) {
      // Soporte para reportes de faena calas (ruta protegida con JWT)
      const rutaArchivo = urlPdf.replace("/uploads/reportes-faena-calas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/faenas-pesca/archivo-reporte-calas/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/reportes-faena-calas-consumo/")) {
      // Soporte para reportes de faena calas de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/reportes-faena-calas-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/faenas-pesca-consumo/archivo-reporte-calas/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/declaraciones-desembarque/")) {
      // Soporte para declaraciones de desembarque del armador (ruta protegida con JWT)
      const rutaArchivo = urlPdf.replace(
        "/uploads/declaraciones-desembarque/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/faenas-pesca/archivo-declaracion-desembarque/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/declaraciones-desembarque-consumo/")
    ) {
      // Soporte para declaraciones de desembarque de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/declaraciones-desembarque-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/faenas-pesca-consumo/archivo-declaracion-desembarque/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/informes-faena-consumo/")) {
      // ✅ NUEVO: Soporte para informes de faena consumo (ruta protegida con JWT)
      const rutaArchivo = urlPdf.replace(
        "/uploads/informes-faena-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/faenas-pesca-consumo/archivo-informe-faena/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/comprobantes-movimiento-caja/")) {
      // ✅ NUEVO: Soporte para comprobantes de operación de movimiento de caja
      const rutaArchivo = urlPdf.replace(
        "/uploads/comprobantes-movimiento-caja/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimientos-caja/archivo-comprobante/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentos-movimiento-caja/")) {
      // ✅ NUEVO: Soporte para documentos afectos de movimiento de caja
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentos-movimiento-caja/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimientos-caja/archivo-documento/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/requerimientos-compra/")) {
      // ✅ NUEVO: Soporte para PDFs de requerimientos de compra
      const rutaArchivo = urlPdf.replace("/uploads/requerimientos-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/requerimiento-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ordenes-compra/")) {
      // ✅ NUEVO: Soporte para PDFs de órdenes de compra
      const rutaArchivo = urlPdf.replace("/uploads/ordenes-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/orden-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/cotizaciones-ventas/")) {
      // ✅ NUEVO: Soporte para PDFs de cotizaciones de ventas
      const rutaArchivo = urlPdf.replace("/uploads/cotizaciones-ventas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/cotizacion-ventas/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/datos-adicionales-orden-compra/")) {
      // ✅ NUEVO: Soporte para documentos adjuntos de datos adicionales de OC
      const rutaArchivo = urlPdf.replace("/uploads/datos-adicionales-orden-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-datos-adicionales-orden-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentos-requeridos-ventas/")) {
      // ✅ NUEVO: Soporte para documentos requeridos de cotización de ventas
      const rutaArchivo = urlPdf.replace("/uploads/documentos-requeridos-ventas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-docs-req-cotiza-ventas/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/movimientos-almacen/")) {
      // ✅ NUEVO: Soporte para PDFs de movimientos de almacén
      const rutaArchivo = urlPdf.replace("/uploads/movimientos-almacen/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimiento-almacen/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/prestamos-bancarios/")) {
      // ✅ NUEVO: Soporte para documentos de préstamos bancarios
      const rutaArchivo = urlPdf.replace("/uploads/prestamos-bancarios/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/tesoreria/prestamos-bancarios/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/entregas-rendir/")) {
      // ✅ NUEVO: Soporte para PDFs de liquidaciones de entregas a rendir
      const rutaArchivo = urlPdf.replace("/uploads/entregas-rendir/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/entregas-a-rendir/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ot-mantenimiento/fotos-antes/")) {
      // ✅ NUEVO: Soporte para PDFs de fotos antes de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/ot-mantenimiento/fotos-antes/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ot-mantenimiento/archivo-fotos-antes/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ot-mantenimiento/fotos-despues/")) {
      // ✅ NUEVO: Soporte para PDFs de fotos después de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/ot-mantenimiento/fotos-despues/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ot-mantenimiento/archivo-fotos-despues/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ot-mantenimiento/orden-trabajo/")) {
      // ✅ NUEVO: Soporte para PDFs de orden de trabajo de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/ot-mantenimiento/orden-trabajo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ot-mantenimiento/archivo-orden-trabajo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/contratos-servicio/")) {
      // ✅ NUEVO: Soporte para PDFs de contratos de servicio
      const rutaArchivo = urlPdf.replace("/uploads/contratos-servicio/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/contrato-servicio-pdf/archivo-contrato/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de contratos
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-contrato-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de contratos
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-contrato-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de movimientos de almacén
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de movimientos de almacén
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/")) {
      // Para otros tipos de uploads (archivos de confirmación, etc.)
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else if (urlPdf.startsWith("/api/")) {
      const rutaSinApi = urlPdf.substring(4);
      urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
    } else if (urlPdf.startsWith("/")) {
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else {
      urlCompleta = urlPdf;
    }

    // Obtener token y hacer fetch con autenticación
    const token = useAuthStore.getState().token;
    const response = await fetch(urlCompleta, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Crear blob y abrir en nueva ventana
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      // Limpiar blob después de 10 segundos
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000);

      if (!newWindow) {
        toast?.show({
          severity: "warn",
          summary: "Aviso",
          detail:
            "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.",
          life: 4000,
        });
      }
    } else {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: `No se pudo abrir el documento (${response.status})`,
        life: 3000,
      });
    }
  } catch (error) {
    toast?.show({
      severity: "error",
      summary: "Error",
      detail: `Error al abrir el documento: ${error.message}`,
      life: 3000,
    });
  }
};

/**
 * Función genérica para descargar archivos PDF
 * @param {string} urlPdf - URL del archivo PDF
 * @param {Object} toast - Referencia al componente Toast
 * @param {string} nombreArchivo - Nombre del archivo para descarga
 * @param {string} tipoUpload - Tipo de upload para construcción de URL
 */
export const descargarPdf = async (
  urlPdf,
  toast,
  nombreArchivo = "documento.pdf",
  tipoUpload = "documentos-visitantes"
) => {
  if (!urlPdf) {
    toast?.show({
      severity: "warn",
      summary: "Advertencia",
      detail: "No hay PDF disponible para descargar",
      life: 3000,
    });
    return;
  }

  try {
    let urlCompleta;

    // Construcción de URL basada en el tipo específico de archivo
    if (urlPdf.startsWith("/uploads/resoluciones-temporada/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/resoluciones-temporada/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/temporada-pesca-resolucion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/resoluciones-novedad/")) {
      // Soporte para resoluciones de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace("/uploads/resoluciones-novedad/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/novedad-pesca-consumo-resolucion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/confirmaciones-acciones-previas/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/confirmaciones-acciones-previas/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/confirmaciones-acciones-previas/archivo/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/confirmaciones-acciones-previas-consumo/")
    ) {
      // Soporte para confirmaciones de acciones previas de Faena Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/confirmaciones-acciones-previas-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/confirmaciones-acciones-previas-consumo/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentacion-personal/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentacion-personal/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/documentacion-personal/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentacion-embarcacion/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentacion-embarcacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/documentaciones-embarcacion/archivo/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith("/uploads/comprobantes-det-movs-pesca-consumo/")
    ) {
      // Soporte para comprobantes de movimientos de Novedad Pesca Consumo
      const rutaArchivo = urlPdf.replace(
        "/uploads/comprobantes-det-movs-pesca-consumo/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/pesca/movs-entregarendir-pesca-consumo/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/fichas-tecnicas-boliches/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/fichas-tecnicas-boliches/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ficha-tecnica-boliches/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/certificados-embarcacion/")) {
      const rutaArchivo = urlPdf.replace(
        "/uploads/certificados-embarcacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/certificados-embarcacion/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/fichas-tecnicas/")) {
      const rutaArchivo = urlPdf.replace("/uploads/fichas-tecnicas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/producto-ficha-tecnica/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/comprobantes-movimiento-caja/")) {
      // ✅ NUEVO: Soporte para comprobantes de operación de movimiento de caja
      const rutaArchivo = urlPdf.replace(
        "/uploads/comprobantes-movimiento-caja/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimientos-caja/archivo-comprobante/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentos-movimiento-caja/")) {
      // ✅ NUEVO: Soporte para documentos afectos de movimiento de caja
      const rutaArchivo = urlPdf.replace(
        "/uploads/documentos-movimiento-caja/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimientos-caja/archivo-documento/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/requerimientos-compra/")) {
      // ✅ NUEVO: Soporte para PDFs de requerimientos de compra
      const rutaArchivo = urlPdf.replace("/uploads/requerimientos-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/requerimiento-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/entregas-rendir/")) {
      // ✅ NUEVO: Soporte para PDFs de liquidaciones de entregas a rendir
      const rutaArchivo = urlPdf.replace("/uploads/entregas-rendir/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/entregas-a-rendir/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/contratos-servicio/")) {
      // ✅ NUEVO: Soporte para PDFs de contratos de servicio
      const rutaArchivo = urlPdf.replace("/uploads/contratos-servicio/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/contrato-servicio-pdf/archivo-contrato/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de contratos
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-contrato-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de contratos
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-contrato/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-contrato-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de movimientos de almacén
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de movimientos de almacén
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-mov-almacen/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-mov-almacen-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de movimiento de entrega a rendir de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-movimiento/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-comprobante/${rutaArchivo}`;
    } else if (
      urlPdf.startsWith(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/"
      )
    ) {
      // ✅ NUEVO: Soporte para comprobantes de operación MovCaja de entrega a rendir de OT Mantenimiento
      const rutaArchivo = urlPdf.replace(
        "/uploads/det-movs-entrega-rendir-ot-mantenimiento/comprobantes-operacion/",
        ""
      );
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-movs-entrega-rendir-ot-mantenimiento-pdf/archivo-operacion/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ordenes-compra/")) {
      // ✅ NUEVO: Soporte para PDFs de órdenes de compra
      const rutaArchivo = urlPdf.replace("/uploads/ordenes-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/orden-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/cotizaciones-ventas/")) {
      // ✅ NUEVO: Soporte para PDFs de cotizaciones de ventas
      const rutaArchivo = urlPdf.replace("/uploads/cotizaciones-ventas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/cotizacion-ventas/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/datos-adicionales-orden-compra/")) {
      // ✅ NUEVO: Soporte para documentos adjuntos de datos adicionales de OC
      const rutaArchivo = urlPdf.replace("/uploads/datos-adicionales-orden-compra/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-datos-adicionales-orden-compra/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/documentos-requeridos-ventas/")) {
      // ✅ NUEVO: Soporte para documentos requeridos de cotización de ventas
      const rutaArchivo = urlPdf.replace("/uploads/documentos-requeridos-ventas/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/det-docs-req-cotiza-ventas/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/movimientos-almacen/")) {
      // ✅ NUEVO: Soporte para PDFs de movimientos de almacén
      const rutaArchivo = urlPdf.replace("/uploads/movimientos-almacen/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/movimiento-almacen/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/uploads/ot-mantenimiento/")) {
      // ✅ NUEVO: Soporte para PDFs de OT Mantenimiento
      const rutaArchivo = urlPdf.replace("/uploads/ot-mantenimiento/", "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/ot-mantenimiento/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith(`/uploads/${tipoUpload}/`)) {
      const rutaArchivo = urlPdf.replace(`/uploads/${tipoUpload}/`, "");
      urlCompleta = `${
        import.meta.env.VITE_API_URL
      }/${tipoUpload}/archivo/${rutaArchivo}`;
    } else if (urlPdf.startsWith("/api/")) {
      const rutaSinApi = urlPdf.substring(4);
      urlCompleta = `${import.meta.env.VITE_API_URL}${rutaSinApi}`;
    } else if (urlPdf.startsWith("/")) {
      urlCompleta = `${import.meta.env.VITE_API_URL}${urlPdf}`;
    } else {
      urlCompleta = urlPdf;
    }

    const token = useAuthStore.getState().token;
    const response = await fetch(urlCompleta, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo descargar el documento",
        life: 3000,
      });
    }
  } catch (error) {
    toast?.show({
      severity: "error",
      summary: "Error",
      detail: `Error al descargar el documento: ${error.message}`,
      life: 3000,
    });
  }
};

/**
 * Función genérica para cargar jsPDF dinámicamente desde CDN
 */
export const cargarJsPDF = () => {
  return new Promise((resolve, reject) => {
    if (window.jsPDF) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      // jsPDF se carga en window.jspdf, necesitamos moverlo a window.jsPDF
      if (window.jspdf && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("Error al cargar jsPDF"));
    document.head.appendChild(script);
  });
};

/**
 * Función auxiliar para cargar una imagen
 * @param {File} archivo - Archivo de imagen
 */
export const cargarImagen = (archivo) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Error al cargar imagen"));
    img.src = URL.createObjectURL(archivo);
  });
};

/**
 * Función genérica para generar un PDF desde múltiples imágenes
 * @param {Array} imagenes - Array de archivos de imagen
 * @param {string} prefijo - Prefijo para el nombre del archivo
 * @param {string} identificador - Identificador único para el archivo
 */
export const generarPdfDesdeImagenes = async (
  imagenes,
  prefijo = "documento",
  identificador = "sin-id"
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Cargar jsPDF dinámicamente desde CDN
      if (!window.jsPDF) {
        await cargarJsPDF();
      }

      const { jsPDF } = window;
      const pdf = new jsPDF("p", "mm", "a4");

      // Procesar cada imagen
      for (let i = 0; i < imagenes.length; i++) {
        const img = await cargarImagen(imagenes[i]);

        // Agregar nueva página si no es la primera imagen
        if (i > 0) {
          pdf.addPage();
        }

        // Configuración de página A4 (210 x 297 mm)
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        // Calcular dimensiones manteniendo aspecto
        const aspectRatio = img.width / img.height;
        let imgWidth = maxWidth;
        let imgHeight = maxWidth / aspectRatio;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = maxHeight * aspectRatio;
        }

        // Centrar la imagen en la página
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        // Convertir imagen a base64 para jsPDF
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        // Agregar la imagen al PDF
        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        // Agregar información de página
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Página ${i + 1} de ${imagenes.length}`,
          pageWidth - 30,
          pageHeight - 5
        );

        // Agregar fecha
        pdf.text(
          `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
          margin,
          pageHeight - 5
        );
      }

      // Generar el PDF como blob
      const pdfBlob = pdf.output("blob");
      const timestamp = Date.now();

      // Crear archivo PDF con nombre descriptivo
      const fileName = `${prefijo}-${timestamp}-${identificador}-${imagenes.length}imgs.pdf`;
      const archivo = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      resolve(archivo);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      reject(error);
    }
  });
};

/**
 * Función genérica para subir documento PDF
 * @param {File} archivo - Archivo PDF a subir
 * @param {string} endpoint - Endpoint de la API para subir
 * @param {Object} datosAdicionales - Datos adicionales para el FormData
 * @param {Object} toast - Referencia al componente Toast
 */
export const subirDocumentoPdf = async (
  archivo,
  endpoint,
  datosAdicionales = {},
  toast
) => {
  try {
    const formData = new FormData();
    formData.append("documento", archivo);

    // Agregar datos adicionales al FormData
    Object.keys(datosAdicionales).forEach((key) => {
      formData.append(key, datosAdicionales[key] || "");
    });

    // Obtener token JWT desde Zustand siguiendo patrón ERP Megui
    const token = useAuthStore.getState().token;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Error al subir el documento: ${response.status} - ${errorText}`
      );
    }

    const resultado = await response.json();

    toast?.show({
      severity: "success",
      summary: "Documento Subido",
      detail: "Archivo guardado exitosamente",
      life: 4000,
    });

    return resultado;
  } catch (error) {
    console.error("=== ERROR EN UPLOAD ===");
    console.error("Error completo:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    toast?.show({
      severity: "error",
      summary: "Error",
      detail: `No se pudo subir el documento: ${error.message}`,
      life: 5000,
    });
    throw error;
  }
};

/**
 * Función genérica mejorada para procesar y subir documentos (imágenes o PDFs)
 * @param {Array} archivos - Array de archivos (imágenes o PDFs)
 * @param {string} endpoint - Endpoint de la API para subir
 * @param {Object} datosAdicionales - Datos adicionales para el FormData
 * @param {Object} toast - Referencia al componente Toast
 * @param {string} prefijo - Prefijo para el nombre del archivo (solo para imágenes)
 * @param {string} identificador - Identificador único para el archivo (solo para imágenes)
 */
export const procesarYSubirDocumentos = async (
  archivos,
  endpoint,
  datosAdicionales = {},
  toast,
  prefijo = "documento",
  identificador = "sin-id"
) => {
  if (!archivos || archivos.length === 0) {
    toast?.show({
      severity: "warn",
      summary: "Advertencia",
      detail: "Debe seleccionar al menos un archivo",
      life: 3000,
    });
    throw new Error("No hay archivos seleccionados");
  }

  try {
    // Separar archivos por tipo
    const imagenes = [];
    const pdfs = [];

    archivos.forEach((archivo) => {
      if (archivo.type.startsWith("image/")) {
        imagenes.push(archivo);
      } else if (archivo.type === "application/pdf") {
        pdfs.push(archivo);
      }
    });

    // Validar que no se mezclen tipos
    if (imagenes.length > 0 && pdfs.length > 0) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail:
          "No se pueden subir imágenes y PDFs al mismo tiempo. Seleccione solo un tipo de archivo.",
        life: 4000,
      });
      throw new Error("Tipos de archivo mixtos no permitidos");
    }

    // Validar que solo haya un PDF si se selecciona PDF
    if (pdfs.length > 1) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "Solo se puede subir un archivo PDF a la vez.",
        life: 4000,
      });
      throw new Error("Solo un PDF permitido");
    }

    let archivoParaSubir;

    if (imagenes.length > 0) {
      // Procesar imágenes: generar PDF desde las imágenes
      toast?.show({
        severity: "info",
        summary: "Procesando",
        detail: `Generando PDF desde ${imagenes.length} imagen(es)...`,
        life: 3000,
      });

      archivoParaSubir = await generarPdfDesdeImagenes(
        imagenes,
        prefijo,
        identificador
      );
    } else if (pdfs.length === 1) {
      // Procesar PDF: renombrar con timestamp y estructura estándar
      const pdfOriginal = pdfs[0];
      const timestamp = Date.now();
      const extension = ".pdf";

      // Generar nombre siguiendo el patrón del sistema
      const nuevoNombre = `${prefijo}-${timestamp}-${identificador}${extension}`;

      // Crear nuevo archivo con el nombre estandarizado
      archivoParaSubir = new File([pdfOriginal], nuevoNombre, {
        type: "application/pdf",
      });

      toast?.show({
        severity: "info",
        summary: "Procesando",
        detail: "Preparando archivo PDF para subir...",
        life: 2000,
      });
    } else {
      throw new Error("No se encontraron archivos válidos para procesar");
    }

    // Subir documento usando función genérica existente
    const resultado = await subirDocumentoPdf(
      archivoParaSubir,
      endpoint,
      datosAdicionales,
      toast
    );

    return resultado;
  } catch (error) {
    console.error("Error al procesar documentos:", error);

    // Solo mostrar toast de error si no es un error de upload (que ya maneja subirDocumentoPdf)
    if (
      !error.message.includes("Error al subir") &&
      !error.message.includes("No se pudo subir")
    ) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al procesar documentos: ${error.message}`,
        life: 5000,
      });
    }

    throw error;
  }
};

/**
 * Función auxiliar para validar tipos de archivo permitidos
 * @param {Array} archivos - Array de archivos a validar
 * @returns {Object} - Objeto con información de validación
 */
export const validarTiposArchivo = (archivos) => {
  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  const archivosValidos = [];
  const archivosInvalidos = [];

  archivos.forEach((archivo) => {
    if (tiposPermitidos.includes(archivo.type)) {
      archivosValidos.push(archivo);
    } else {
      archivosInvalidos.push(archivo);
    }
  });

  return {
    validos: archivosValidos,
    invalidos: archivosInvalidos,
    esValido: archivosInvalidos.length === 0,
  };
};
