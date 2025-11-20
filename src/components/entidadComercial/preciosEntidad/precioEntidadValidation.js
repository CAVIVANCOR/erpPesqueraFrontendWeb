/**
 * precioEntidadValidation.js
 * 
 * Schema de validación Yup para precios especiales de entidad comercial.
 * Alineado al modelo Prisma PrecioEntidad.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import * as yup from "yup";

export const esquemaValidacionPrecio = yup.object().shape({
  productoId: yup
    .number()
    .required("El producto es requerido")
    .integer("Debe ser un número entero"),
  monedaId: yup
    .number()
    .required("La moneda es requerida")
    .integer("Debe ser un número entero"),
  precioUnitario: yup
    .number()
    .required("El precio unitario es requerido")
    .min(0.01, "El precio debe ser mayor a 0"),
  vigenteDesde: yup.date().required("La fecha de vigencia desde es requerida"),
  vigenteHasta: yup
    .date()
    .nullable()
    .test(
      "fecha-vigencia-mayor",
      "La fecha vigente hasta debe ser mayor a la fecha vigente desde",
      function (value) {
        const { vigenteDesde } = this.parent;
        if (!value || !vigenteDesde) return true;
        return new Date(value) > new Date(vigenteDesde);
      }
    ),
  observaciones: yup
    .string()
    .nullable()
    .max(500, "Máximo 500 caracteres")
    .trim(),
  activo: yup.boolean(),
});