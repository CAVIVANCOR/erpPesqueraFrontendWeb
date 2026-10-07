/**
 * Reglas compartidas para generar documentos financieros (OC, CxP, Pago y Asientos)
 * desde un gasto de DetMovsEntregaRendir. Las usan el formulario de rendición (1 gasto)
 * y la lista (lote), de modo que haya una sola fuente de verdad en el frontend.
 * El backend vuelve a validar todo antes de generar.
 */

// Solo los gastos de una entrega a rendir (con asignación origen) generan documentos
export const puedeGenerarDocumentos = (gasto) =>
  Number(gasto?.asignacionOrigenId) > 0;

// Sin factura = gasto gerencial; con factura = gasto fiscal
export const esGastoGerencial = (gasto) => gasto?.operacionSinFactura === true;

export const validarRequisitosGeneracion = (gasto) => {
  const errores = [];

  if (!gasto?.entidadComercialId) {
    errores.push("Debe especificar un proveedor");
  }

  // El comprobante solo se exige en gastos fiscales
  if (!esGastoGerencial(gasto)) {
    if (!gasto?.tipoDocumentoId) {
      errores.push("Debe especificar el tipo de comprobante");
    }

    if (!gasto?.numeroSerieComprobante || !gasto?.numeroCorrelativoComprobante) {
      errores.push("Debe ingresar serie y correlativo del comprobante");
    }
  }

  if (!gasto?.monto || gasto.monto <= 0) {
    errores.push("El monto debe ser mayor a cero");
  }

  if (!gasto?.productoId) {
    errores.push("Debe especificar un producto/servicio");
  }

  if (!gasto?.centroCostoId) {
    errores.push("Debe especificar un centro de costo");
  }

  return { valido: errores.length === 0, errores };
};
