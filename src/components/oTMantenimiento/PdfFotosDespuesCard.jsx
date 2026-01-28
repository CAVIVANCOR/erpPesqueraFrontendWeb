/**
 * PdfFotosDespuesCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para fotos después del mantenimiento en OT.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfFotosDespuesCard
 * Wrapper que configura PDFDocumentManager para fotos después del mantenimiento
 *
 * @param {Object} props - Props del componente
 * @param {number|string} props.otMantenimientoId - ID de la OT (OBLIGATORIO)
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfFotosDespuesCard = ({
  otMantenimientoId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  // DEBUG: Ver qué entityId recibimos
  console.log('[PdfFotosDespuesCard] Props recibidas:');
  console.log('  - otMantenimientoId:', otMantenimientoId);
  console.log('  - defaultValues:', defaultValues);
  console.log('  - readOnly:', readOnly);
  console.log('  - control:', control);
  console.log('  - watch:', watch);
  
  return (
    <PDFDocumentManager
      moduleName="ot-mantenimiento-fotos-despues"
      fieldName="urlFotosDespuesPdf"
      entityId={otMantenimientoId}
      title="📸 Fotos Después del Mantenimiento"
      dialogTitle="Subir Fotos Después"
      uploadButtonLabel="Capturar/Subir Fotos"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay fotos después cargadas"
      emptyDescription="Use el botón 'Capturar/Subir Fotos' para agregar imágenes del estado final. Puede subir múltiples archivos (fotos + anexos) y se consolidarán automáticamente."
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

export default PdfFotosDespuesCard;