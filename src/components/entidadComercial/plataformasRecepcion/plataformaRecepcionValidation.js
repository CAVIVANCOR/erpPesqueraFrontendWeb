/**
 * plataformaRecepcionValidation.js
 * 
 * Esquema de validación Yup para plataformas de recepción de pesca.
 * Define reglas de validación para nombre, puerto, coordenadas y estado.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import * as yup from "yup";

export const esquemaValidacionPlataforma = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es requerido")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .trim(),
  puertoPescaId: yup
    .number()
    .required("El puerto es requerido")
    .integer("Debe ser un número entero")
    .positive("Debe seleccionar un puerto válido"),
  latitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90"),
  longitud: yup
    .number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180"),
  activo: yup.boolean(),
});