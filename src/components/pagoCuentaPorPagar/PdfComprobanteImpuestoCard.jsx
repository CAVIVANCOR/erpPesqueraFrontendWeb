/**
 * PdfComprobanteImpuestoCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobante de pago de detracción/impuesto.
 * Guarda el comprobante en DOS lugares:
 * 1. MovimientoCaja.urlComprobanteOperacionMovCaja (movimiento de autodetracción)
 * 2. PagoCuentaPorPagar.urlPagoImpuesto (pago completo)
 *
 * @author ERP Megui
 * @version 3.0.0 - Doble guardado
 */

import React, { useState } from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";
import { Panel } from "primereact/panel";

/**
 * Componente PdfComprobanteImpuestoCard
 * Wrapper que configura PDFDocumentManager para el comprobante de detracción
 *
 * @param {Object} props - Props del componente
 * @param {Number} props.movimientoId - ID del movimiento de autodetracción
 * @param {Number} props.pagoCuentaPorPagarId - ID del pago
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfComprobanteImpuestoCard = ({
  movimientoId,
  pagoCuentaPorPagarId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  return (
    <Panel header="📋 Comprobante de Pago de Detracción" className="mb-3">
      <p className="mb-3 text-sm text-gray-600">
        Opcional: Si el cliente ya realizó el pago de la detracción directamente a SUNAT, 
        puede cargar aquí el comprobante correspondiente. Este documento es opcional y solo 
        aplica cuando el cliente pagó la detracción por su cuenta.
      </p>
      
      {/* ✅ UN SOLO CAMPO - Guarda en MovimientoCaja.urlComprobanteOperacionMovCaja */}
      {/* El backend debe copiar automáticamente a PagoCuentaPorPagar.urlPagoImpuesto */}
      {movimientoId && (
        <PDFDocumentManager
          moduleName="movimiento-caja-comprobante"
          fieldName="urlComprobanteOperacionMovCaja"
          entityId={movimientoId}
          title="Comprobante de Pago de Detracción (Cliente → SUNAT)"
          dialogTitle="Comprobante de Detracción"
          uploadButtonLabel="Subir Comprobante"
          viewButtonLabel="Ver Comprobante"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay comprobante de detracción cargado"
          emptyDescription="El cliente no pagó la detracción directamente a SUNAT"
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={defaultValues}
          readOnly={readOnly}
          allowDelete={true}
        />
      )}
    </Panel>
  );
};

export default PdfComprobanteImpuestoCard;
