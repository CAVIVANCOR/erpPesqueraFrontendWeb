// src/utils/documentacionPersonalUtils.js
// Utilidades para manejo de documentación personal

import { actualizarDocumentacionPersonal, getAllDocumentacionPersonal } from "../api/documentacionPersonal";

/**
 * Recalcula y actualiza en base de datos el estado de vencimiento de documentos personales
 * Función completamente independiente que obtiene los datos internamente
 * @param {Object} toast - Referencia al toast para mostrar mensajes (opcional)
 * @returns {Promise<Array>} - Array de documentaciones actualizadas
 */
export const recalcularDocPersonalVencidos = async (toast = null) => {
  try {
    // Obtener todas las documentaciones desde la API
    const documentaciones = await getAllDocumentacionPersonal();
    
    if (!documentaciones || documentaciones.length === 0) {
      if (toast?.current) {
        toast.current.show({
          severity: "warn",
          summary: "Sin datos",
          detail: "No hay documentaciones para recalcular",
        });
      }
      return [];
    }

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    const documentacionesActualizadas = documentaciones.map((doc) => {
      let docVencidoCalculado = true;

      if (doc.fechaVencimiento) {
        const fechaVenc = new Date(doc.fechaVencimiento);
        fechaVenc.setHours(0, 0, 0, 0);
        docVencidoCalculado = fechaVenc < fechaActual;
      }

      return {
        ...doc,
        docVencido: docVencidoCalculado,
      };
    });

    // Guardar cada documento actualizado en la base de datos
    const updatePromises = documentacionesActualizadas.map(doc => 
      actualizarDocumentacionPersonal(doc.id, {
        personalId: doc.personalId,
        documentoPescaId: doc.documentoPescaId,
        numeroDocumento: doc.numeroDocumento,
        fechaEmision: doc.fechaEmision,
        fechaVencimiento: doc.fechaVencimiento,
        urlDocPdf: doc.urlDocPdf,
        docVencido: doc.docVencido,
        observaciones: doc.observaciones
      })
    );

    await Promise.all(updatePromises);

    if (toast?.current) {
      toast.current.show({
        severity: "success",
        summary: "Estados Guardados",
        detail: `Se recalcularon y guardaron ${documentacionesActualizadas.length} documentos en la base de datos`,
      });
    }

    return documentacionesActualizadas;
  } catch (error) {
    console.error("Error al recalcular estados de documentación:", error);
    if (toast?.current) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar los estados recalculados en la base de datos",
      });
    }
    throw error;
  }
};
