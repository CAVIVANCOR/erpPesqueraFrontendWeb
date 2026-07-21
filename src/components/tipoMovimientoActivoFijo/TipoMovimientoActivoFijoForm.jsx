/**
 * Formulario profesional para TipoMovimientoActivoFijo
 * Implementa el patrón estándar ERP Megui con validaciones, normalización y feedback.
 * Gestiona tipos de movimientos de activos fijos.
 *
 * Funcionalidades:
 * - Validaciones con Yup y react-hook-form
 * - Normalización de campos según regla ERP Megui
 * - Feedback visual con Toast para éxito y error
 * - Manejo profesional de estados de carga
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import {
  crearTipoMovimientoActivoFijo,
  actualizarTipoMovimientoActivoFijo,
} from "../../api/tipoMovimientoActivoFijo";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";
import BooleanToggleButton from "../common/BooleanToggleButton";

/**
 * Esquema de validación con Yup
 * Define las reglas de validación para el formulario
 */
const esquemaValidacion = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),

  descripcion: yup
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres"),

  activo: yup.boolean(),
  
  // Campos booleanos de configuración
  afectaValorActivo: yup.boolean(),
  afectaDepreciacion: yup.boolean(),
  generaAsientoAutomatico: yup.boolean(),
  requiereProducto: yup.boolean(),
  dasDeBajaActivo: yup.boolean(),
  usaCuentasActivo: yup.boolean(),
  usaCuentasProducto: yup.boolean(),
  
  // Cuentas contables opcionales
  cuentaDebeId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cuentaHaberId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
});

/**
 * Componente TipoMovimientoActivoFijoForm
 * Formulario para crear y editar tipos de movimientos de activos fijos
 */
const TipoMovimientoActivoFijoForm = ({
  tipo,
  onSave,
  onCancel,
  permisos = {},
  readOnly = false,
}) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);

  // Configuración del formulario con react-hook-form y Yup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
      afectaValorActivo: false,
      afectaDepreciacion: false,
      generaAsientoAutomatico: true,
      requiereProducto: false,
      dasDeBajaActivo: false,
      cuentaDebeId: null,
      cuentaHaberId: null,
      usaCuentasActivo: true,
      usaCuentasProducto: false,
    },
  });

  /**
   * Efecto para cargar datos cuando se edita un tipo existente
   */
  useEffect(() => {
    if (tipo) {
      // Cargar datos para edición, normalizando según regla ERP Megui
      reset({
        nombre: tipo.nombre?.trim() || "",
        descripcion: tipo.descripcion?.trim() || "",
        activo: Boolean(tipo.activo),
        afectaValorActivo: Boolean(tipo.afectaValorActivo),
        afectaDepreciacion: Boolean(tipo.afectaDepreciacion),
        generaAsientoAutomatico: Boolean(tipo.generaAsientoAutomatico),
        requiereProducto: Boolean(tipo.requiereProducto),
        dasDeBajaActivo: Boolean(tipo.dasDeBajaActivo),
        cuentaDebeId: tipo.cuentaDebeId ? Number(tipo.cuentaDebeId) : null,
        cuentaHaberId: tipo.cuentaHaberId ? Number(tipo.cuentaHaberId) : null,
        usaCuentasActivo: Boolean(tipo.usaCuentasActivo),
        usaCuentasProducto: Boolean(tipo.usaCuentasProducto),
      });
    } else {
      // Reset para nuevo registro
      reset({
        nombre: "",
        descripcion: "",
        activo: true,
        afectaValorActivo: false,
        afectaDepreciacion: false,
        generaAsientoAutomatico: true,
        requiereProducto: false,
        dasDeBajaActivo: false,
        cuentaDebeId: null,
        cuentaHaberId: null,
        usaCuentasActivo: true,
        usaCuentasProducto: false,
      });
    }
  }, [tipo, reset]);

  /**
   * Maneja el envío del formulario
   * Crea o actualiza el tipo según corresponda
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Normalización final de datos según regla ERP Megui
      const datosNormalizados = {
        nombre: data.nombre?.trim() || "",
        descripcion: data.descripcion?.trim() || null,
        activo: Boolean(data.activo),
        afectaValorActivo: Boolean(data.afectaValorActivo),
        afectaDepreciacion: Boolean(data.afectaDepreciacion),
        generaAsientoAutomatico: Boolean(data.generaAsientoAutomatico),
        requiereProducto: Boolean(data.requiereProducto),
        dasDeBajaActivo: Boolean(data.dasDeBajaActivo),
        cuentaDebeId: data.cuentaDebeId ? Number(data.cuentaDebeId) : null,
        cuentaHaberId: data.cuentaHaberId ? Number(data.cuentaHaberId) : null,
        usaCuentasActivo: Boolean(data.usaCuentasActivo),
        usaCuentasProducto: Boolean(data.usaCuentasProducto),
      };
      let resultado;
      if (tipo?.id) {
        // Actualizar tipo existente
        resultado = await actualizarTipoMovimientoActivoFijo(
          tipo.id,
          datosNormalizados
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de movimiento actualizado correctamente",
        });
      } else {
        // Crear nuevo tipo
        resultado = await crearTipoMovimientoActivoFijo(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tipo de movimiento creado correctamente",
        });
      }
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }
    } catch (error) {
      console.error("Error al guardar tipo de movimiento:", error);

      // Mostrar error específico del servidor o error genérico
      const mensajeError =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al guardar el tipo de movimiento";

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="formgrid grid">
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        {/* Nombre */}
        <div className="field col-12 md:col-6">
          <label htmlFor="nombre" className="font-bold">
            Nombre *
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                placeholder="Nombre del tipo de movimiento"
                className={errors.nombre ? "p-invalid" : ""}
                maxLength={50}
                disabled={readOnly}
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>
        {/* Descripción */}
        <div className="field col-12">
          <label htmlFor="descripcion" className="font-bold">
            Descripción
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="descripcion"
                {...field}
                placeholder="Descripción detallada del tipo de movimiento..."
                className={errors.descripcion ? "p-invalid" : ""}
                rows={4}
                maxLength={500}
                disabled={readOnly}
              />
            )}
          />
          {errors.descripcion && (
            <small className="p-error">{errors.descripcion.message}</small>
          )}
          <small className="text-600">Máximo 500 caracteres</small>
        </div>
        {/* Estado Activo */}
        <div className="field col-12">
          <div className="flex align-items-center">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                  disabled={readOnly}
                />
              )}
            />
            <label htmlFor="activo" className="font-bold">
              Tipo de movimiento activo
            </label>
          </div>
          <small className="text-600">
            Los tipos inactivos no aparecerán en las listas de selección
          </small>
        </div>

        {/* ========================================
            🎯 CONFIGURACIÓN DE COMPORTAMIENTO
            ======================================== */}
        <div className="field col-12">
          <hr style={{ margin: "20px 0", borderTop: "2px solid #dee2e6" }} />
          <h4 style={{ marginBottom: "15px", color: "#495057" }}>
            🎯 Configuración de Comportamiento
          </h4>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Afecta Valor Activo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="afectaValorActivo" className="p-d-block">
              Afecta Valor del Activo
            </label>
            <Controller
              name="afectaValorActivo"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="SÍ AFECTA VALOR"
                  labelFalse="NO AFECTA VALOR"
                  severityTrue="success"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Incrementa o reduce el valor del activo
            </small>
          </div>

          {/* Afecta Depreciación */}
          <div style={{ flex: 1 }}>
            <label htmlFor="afectaDepreciacion" className="p-d-block">
              Afecta Depreciación
            </label>
            <Controller
              name="afectaDepreciacion"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="SÍ GENERA DEPRECIACIÓN"
                  labelFalse="NO GENERA DEPRECIACIÓN"
                  severityTrue="success"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Genera cálculo de depreciación
            </small>
          </div>

          {/* Genera Asiento Automático */}
          <div style={{ flex: 1 }}>
            <label htmlFor="generaAsientoAutomatico" className="p-d-block">
              Genera Asiento Automático
            </label>
            <Controller
              name="generaAsientoAutomatico"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="SÍ GENERA ASIENTO"
                  labelFalse="NO GENERA ASIENTO"
                  severityTrue="success"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Crea asiento contable automático
            </small>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Requiere Producto */}
          <div style={{ flex: 1 }}>
            <label htmlFor="requiereProducto" className="p-d-block">
              Requiere Producto
            </label>
            <Controller
              name="requiereProducto"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="SÍ REQUIERE"
                  labelFalse="NO REQUIERE"
                  severityTrue="warning"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Necesita producto enlazado
            </small>
          </div>

          {/* Das de Baja Activo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="dasDeBajaActivo" className="p-d-block">
              Das de Baja Activo
            </label>
            <Controller
              name="dasDeBajaActivo"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="SÍ DA DE BAJA"
                  labelFalse="NO DA DE BAJA"
                  severityTrue="danger"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Marca el activo como cesado
            </small>
          </div>
        </div>

        {/* ========================================
            💰 CUENTAS CONTABLES ESPECÍFICAS
            ======================================== */}
        <div className="field col-12">
          <hr style={{ margin: "20px 0", borderTop: "2px solid #dee2e6" }} />
          <h4 style={{ marginBottom: "15px", color: "#495057" }}>
            💰 Cuentas Contables Específicas
          </h4>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Cuenta Debe */}
          <div style={{ flex: 1 }}>
            <Controller
              name="cuentaDebeId"
              control={control}
              render={({ field }) => (
                <PlanCuentaContableSelector
                  value={field.value ? Number(field.value) : null}
                  onChange={(id) => field.onChange(id)}
                  label="Cuenta DEBE Principal"
                  placeholder="Seleccionar Cuenta DEBE"
                  disabled={readOnly}
                  required={false}
                  error={!!errors.cuentaDebeId}
                  errorMessage={errors.cuentaDebeId?.message}
                  showClearButton={true}
                />
              )}
            />
            <small className="text-600">
              Cuenta contable para el DEBE
            </small>
          </div>

          {/* Cuenta Haber */}
          <div style={{ flex: 1 }}>
            <Controller
              name="cuentaHaberId"
              control={control}
              render={({ field }) => (
                <PlanCuentaContableSelector
                  value={field.value ? Number(field.value) : null}
                  onChange={(id) => field.onChange(id)}
                  label="Cuenta HABER Principal"
                  placeholder="Seleccionar Cuenta HABER"
                  disabled={readOnly}
                  required={false}
                  error={!!errors.cuentaHaberId}
                  errorMessage={errors.cuentaHaberId?.message}
                  showClearButton={true}
                />
              )}
            />
            <small className="text-600">
              Cuenta contable para el HABER
            </small>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Usa Cuentas Activo */}
          <div style={{ flex: 1 }}>
            <label htmlFor="usaCuentasActivo" className="p-d-block">
              Usa Cuentas del Activo
            </label>
            <Controller
              name="usaCuentasActivo"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="USA CUENTAS ACTIVO"
                  labelFalse="NO USA"
                  severityTrue="info"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Usa cuentas del activo (33, 39, 68)
            </small>
          </div>

          {/* Usa Cuentas Producto */}
          <div style={{ flex: 1 }}>
            <label htmlFor="usaCuentasProducto" className="p-d-block">
              Usa Cuentas del Producto
            </label>
            <Controller
              name="usaCuentasProducto"
              control={control}
              render={({ field }) => (
                <BooleanToggleButton
                  value={field.value}
                  onChange={field.onChange}
                  labelTrue="USA CUENTAS PRODUCTO"
                  labelFalse="NO USA"
                  severityTrue="info"
                  severityFalse="secondary"
                  disabled={readOnly}
                />
              )}
            />
            <small className="text-600">
              Usa cuentas del producto (60, 20, 70, 69, 61)
            </small>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button
            type="button"
            label="Cancelar"
            className="p-button-text"
            onClick={handleCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={tipo?.id ? "Actualizar" : "Crear"}
            icon={tipo?.id ? "pi pi-check" : "pi pi-plus"}
            loading={loading}
            disabled={
              readOnly ||
              (tipo?.id && !permisos.puedeEditar) ||
              (!tipo?.id && !permisos.puedeCrear)
            }
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEditar && tipo?.id
                  ? "No tiene permisos para editar"
                  : !permisos.puedeCrear && !tipo?.id
                    ? "No tiene permisos para crear"
                    : ""
            }
          />
        </div>
      </form>
    </div>
  );
};

export default TipoMovimientoActivoFijoForm;