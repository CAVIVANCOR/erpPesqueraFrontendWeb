/**
 * PdfFotosAntesCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para fotos antes del mantenimiento en OT.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfFotosAntesCard
 * Wrapper que configura PDFDocumentManager para fotos antes del mantenimiento
 *
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfFotosAntesCard = ({
  otMantenimientoId, // ← DEBE ESTAR AQUÍ
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  // DEBUG: Ver qué entityId recibimos
  console.log("[PdfFotosAntesCard] Props recibidas:");
  console.log("  - otMantenimientoId:", otMantenimientoId);
  console.log("  - defaultValues:", defaultValues);
  console.log("  - readOnly:", readOnly);
  console.log("  - control:", control);
  console.log("  - watch:", watch);
  return (
    <PDFDocumentManager
      moduleName="ot-mantenimiento-fotos-antes"
      fieldName="urlFotosAntesPdf"
      entityId={otMantenimientoId} // ← AGREGAR ESTA LÍNEA
      title="📸 Fotos Antes del Mantenimiento"
      dialogTitle="Subir Fotos Antes"
      uploadButtonLabel="Capturar/Subir Fotos"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay fotos antes cargadas"
      emptyDescription="Use el botón 'Capturar/Subir Fotos' para agregar imágenes del estado inicial. Puede subir múltiples archivos (fotos + documentos) y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
    />
  );
};

export default PdfFotosAntesCard;
