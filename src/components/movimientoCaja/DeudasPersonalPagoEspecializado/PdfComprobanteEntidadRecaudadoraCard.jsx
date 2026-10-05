/**
 * PdfComprobanteEntidadRecaudadoraCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Comprobante opcional que emite la entidad recaudadora (p. ej. AFP, SUNAT) con el detalle
 * de lo que se debe pagar. Se presenta al banco al realizar la operación y aquí se archiva
 * junto al pago. Permite capturar o subir varias imágenes/PDF, que se consolidan en un solo PDF.
 *
 * Una operación genera N PagoDeudaPersonal: el archivo se guarda en el pago indicado
 * (entityId) y quien use este componente debe copiarlo a los demás pagos de la operación
 * con sincronizarAdjuntosPagoDeudaPersonal.
 *
 * @author ERP Megui
 */

import React from "react";
import { Panel } from "primereact/panel";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";

/**
 * @param {number|string} props.pagoId - PagoDeudaPersonal que recibe el archivo (primero de la operación)
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfComprobanteEntidadRecaudadoraCard = ({
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
    <Panel header="📎 Comprobante de la Entidad Recaudadora" className="mb-3">
      <p className="mb-3 text-sm text-gray-600">
        Opcional: adjunte el comprobante que emitió la entidad recaudadora (por ejemplo, la AFP)
        con el detalle de lo pagado. Puede capturar o subir varias imágenes y PDF; se consolidan
        en un solo documento.
      </p>

      {pagoId && (
        <PDFDocumentManager
          moduleName="pago-deuda-personal-comprobante"
          fieldName="urlComprobanteOperacion"
          entityId={pagoId}
          title="Comprobante de la Entidad Recaudadora"
          dialogTitle="Comprobante de la Entidad Recaudadora"
          uploadButtonLabel="Capturar/Subir Comprobante"
          viewButtonLabel="Ver Comprobante"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay comprobante de la entidad recaudadora cargado"
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

export default PdfComprobanteEntidadRecaudadoraCard;
