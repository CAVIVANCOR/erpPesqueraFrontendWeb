// src/components/oTMantenimiento/OTMantenimientoPDF.js
// Generador de PDF para órdenes de trabajo de mantenimiento
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useAuthStore } from "../../shared/stores/useAuthStore";

/**
 * Genera un PDF de la orden de trabajo y lo sube al servidor
 * @param {Object} ot - Datos de la OT
 * @param {Array} tareas - Tareas de la OT
 * @param {Object} empresa - Datos de la empresa
 * @returns {Promise<Object>} - {success: boolean, urlPdf: string, error?: string}
 */
export async function generarYSubirPDFOTMantenimiento(ot, tareas, empresa) {
  try {
    // 1. Generar el PDF
    const pdfBytes = await generarPDFOTMantenimiento(ot, tareas, empresa);

    // 2. Crear un blob del PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    // 3. Crear FormData para subir
    const formData = new FormData();
    const nombreArchivo = `ot-mantenimiento-${ot.numeroCompleto || ot.id}.pdf`;
    formData.append("file", blob, nombreArchivo);
    formData.append("moduleName", "ot-mantenimiento-documento");
    formData.append("entityId", ot.id);

    // 4. Subir al servidor usando Sistema PDF V2
    const token = useAuthStore.getState().token;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al subir el PDF");
    }

    const resultado = await response.json();

    return {
      success: true,
      urlPdf: resultado.url,
    };
  } catch (error) {
    console.error("Error al generar y subir PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el PDF de la orden de trabajo
 */
async function generarPDFOTMantenimiento(ot, tareas, empresa) {
  // Funciones de formateo
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const formatearNumero = (num) => {
    if (!num) return "0.00";
    return Number(num).toFixed(2);
  };

  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();

  // Cargar fuentes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPosition = height - 50;
  const margin = 50;
  const lineHeight = 15;

  // ENCABEZADO
  page.drawText(empresa?.razonSocial || "EMPRESA", {
    x: margin,
    y: yPosition,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText("ORDEN DE TRABAJO DE MANTENIMIENTO", {
    x: margin,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.8),
  });

  yPosition -= 30;

  // DATOS PRINCIPALES
  const datos = [
    [
      `Código OT: ${ot.codigo || "-"}`,
      `Fecha: ${formatearFecha(ot.fechaDocumento)}`,
    ],
    [
      `Tipo: ${ot.tipoMantenimiento?.nombre || "-"}`,
      `Prioridad: ${ot.prioridadAlta ? "ALTA" : "Normal"}`,
    ],
    [
      `Activo: ${ot.activo?.nombre || "-"}`,
      `Estado: ${ot.estado?.nombre || "-"}`,
    ],
    [
      `Sede: ${ot.sede?.nombre || "-"}`,
      `Motivo: ${ot.motivoOrigino?.nombre || "-"}`,
    ],
  ];

  datos.forEach(([izq, der]) => {
    page.drawText(izq, {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontNormal,
    });
    page.drawText(der, {
      x: width / 2 + 20,
      y: yPosition,
      size: 10,
      font: fontNormal,
    });
    yPosition -= lineHeight;
  });

  yPosition -= 10;

  // DESCRIPCIÓN DEL PROBLEMA
  if (ot.descripcionProblema) {
    page.drawText("Descripción del Problema:", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });
    yPosition -= lineHeight;

    const descripcion = ot.descripcionProblema.substring(0, 200);
    page.drawText(descripcion, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontNormal,
      maxWidth: width - 2 * margin,
    });
    yPosition -= lineHeight * 2;
  }

  // SOLUCIÓN APLICADA
  if (ot.solucionAplicada) {
    page.drawText("Solución Aplicada:", {
      x: margin,
      y: yPosition,
      size: 11,
      font: fontBold,
    });
    yPosition -= lineHeight;

    const solucion = ot.solucionAplicada.substring(0, 200);
    page.drawText(solucion, {
      x: margin,
      y: yPosition,
      size: 9,
      font: fontNormal,
      maxWidth: width - 2 * margin,
    });
    yPosition -= lineHeight * 2;
  }

  // TAREAS
  if (tareas && tareas.length > 0) {
    yPosition -= 10;
    page.drawText("TAREAS REALIZADAS", {
      x: margin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.8),
    });
    yPosition -= 20;

    // Encabezados de tabla
    page.drawText("#", { x: margin, y: yPosition, size: 9, font: fontBold });
    page.drawText("Descripción", {
      x: margin + 30,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText("Responsable", {
      x: margin + 250,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    page.drawText("Estado", {
      x: margin + 400,
      y: yPosition,
      size: 9,
      font: fontBold,
    });
    yPosition -= 15;

    // Línea separadora
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPosition -= 10;

    tareas.forEach((tarea, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }

      page.drawText(`${index + 1}`, {
        x: margin,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });

      const desc = (tarea.descripcion || "").substring(0, 40);
      page.drawText(desc, {
        x: margin + 30,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });

      const resp =
        tarea.responsable?.nombreCompleto ||
        tarea.contratista?.razonSocial ||
        "-";
      page.drawText(resp.substring(0, 25), {
        x: margin + 250,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });

      page.drawText(tarea.estadoTarea?.nombre || "-", {
        x: margin + 400,
        y: yPosition,
        size: 8,
        font: fontNormal,
      });

      yPosition -= 12;
    });
  }

  // FIRMAS
  yPosition -= 40;
  if (yPosition < 150) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 50;
  }

  const firmaY = 100;

  // Solicitante
  page.drawLine({
    start: { x: margin, y: firmaY },
    end: { x: margin + 150, y: firmaY },
    thickness: 1,
  });
  page.drawText("Solicitante", {
    x: margin + 40,
    y: firmaY - 15,
    size: 9,
    font: fontBold,
  });

  // Responsable
  page.drawLine({
    start: { x: width - margin - 150, y: firmaY },
    end: { x: width - margin, y: firmaY },
    thickness: 1,
  });
  page.drawText("Responsable", {
    x: width - margin - 110,
    y: firmaY - 15,
    size: 9,
    font: fontBold,
  });

  // Serializar el PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
