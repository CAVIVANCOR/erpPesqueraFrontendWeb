/**
 * PdfComprobanteEntidadFinancieraCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Comprobante opcional que emite el banco o la entidad financiera con el detalle de lo pagado
 * de las cuotas. Aquí se archiva junto al pago. Permite capturar o subir varias imágenes/PDF,
 * que se consolidan en un solo PDF.
 *
 * Una operación genera N PagoCuotaPrestamo: el archivo se guarda en el pago indicado (entityId)
 * y quien use este componente debe copiarlo a los demás pagos de la operación con
 * sincronizarAdjuntosPagoCuotaPrestamo.
 *
 * @author ERP Megui
 */

import React from "react";
import { Panel } from "primereact/panel";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";

/**
 * @param {number|string} props.pagoId - PagoCuotaPrestamo que recibe el archivo (primero de la operación)
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfComprobanteEntidadFinancieraCard = ({
  pagoId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  return (
    <Panel header="📎 Comprobante del Banco / Entidad Financiera" className="mb-3">
      <p className="mb-3 text-sm text-gray-600">
        Opcional: adjunte el comprobante que emitió el banco o la entidad financiera con el
        detalle de lo pagado. Puede capturar o subir varias imágenes y PDF; se consolidan en un
        solo documento.
      </p>

      {pagoId && (
        <PDFDocumentManager
          moduleName="pago-cuota-prestamo-comprobante"
          fieldName="urlComprobanteOperacion"
          entityId={pagoId}
          title="Comprobante del Banco / Entidad Financiera"
          dialogTitle="Comprobante del Banco / Entidad Financiera"
          uploadButtonLabel="Capturar/Subir Comprobante"
          viewButtonLabel="Ver Comprobante"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay comprobante del banco cargado"
          emptyDescription="Es opcional. Puede adjuntarlo ahora."
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      )}
    </Panel>
  );
};

export default PdfComprobanteEntidadFinancieraCard;
