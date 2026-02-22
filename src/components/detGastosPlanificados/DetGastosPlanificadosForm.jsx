/**
 * Formulario para crear/editar Gastos Planificados
 * Implementa el patrón estándar de formularios ERP Megui con validación y feedback visual.
 * Maneja gastos planificados para diferentes tipos de entregas a rendir.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import { useForm, Controller } from "react-hook-form";
import { crearGastoPlanificado, actualizarGastoPlanificado } from "../../api/detGastosPlanificados";

/**
 * Componente DetGastosPlanificadosForm
 * Formulario para crear o editar un gasto planificado
 * @param {Object} props - Propiedades del componente
 * @param {Object} [props.gastoPlanificado] - Datos del gasto planificado a editar (opcional)
 * @param {Array} props.productos - Lista de productos (gastos) disponibles
 * @param {Array} props.monedas - Lista de monedas disponibles
 * @param {Object} props.entregaRendirData - Datos de la entrega a rendir (contiene el tipo y ID)
 * @param {Function} props.onSave - Función a ejecutar al guardar el formulario
 * @param {Function} props.onCancel - Función a ejecutar al cancelar
 * @param {Object} props.toast - Referencia al componente Toast para mostrar mensajes
 */
const DetGastosPlanificadosForm = ({ 
  gastoPlanificado, 
  productos, 
  monedas, 
  entregaRendirData,
  onSave, 
  onCancel, 
  toast, 
  readOnly = false 
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!gastoPlanificado?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      productoId: null,
      monedaId: null,
      montoPlanificado: 0,
      descripcion: "",
    },
    mode: "onChange",
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (gastoPlanificado) {
      setValue("productoId", gastoPlanificado.productoId ? Number(gastoPlanificado.productoId) : null);
      setValue("monedaId", gastoPlanificado.monedaId ? Number(gastoPlanificado.monedaId) : null);
      setValue("montoPlanificado", gastoPlanificado.montoPlanificado || 0);
      setValue("descripcion", gastoPlanificado.descripcion || "");
    } else {
      reset({
        productoId: null,
        monedaId: null,
        montoPlanificado: 0,
        descripcion: "",
      });
    }
  }, [gastoPlanificado, setValue, reset]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Construir datos normalizados con el FK correspondiente según el tipo de entrega
      const datosNormalizados = {
        productoId: Number(data.productoId),
        monedaId: Number(data.monedaId),
        montoPlanificado: Number(data.montoPlanificado),
        descripcion: data.descripcion?.trim() || null,
        // Agregar el FK correspondiente según el tipo de entrega
        ...entregaRendirData,
      };

      let resultado;
      if (gastoPlanificado?.id) {
        // Actualizar gasto planificado existente
        resultado = await actualizarGastoPlanificado(gastoPlanificado.id, datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Gasto planificado actualizado correctamente",
        });
      } else {
        // Crear nuevo gasto planificado
        resultado = await crearGastoPlanificado(datosNormalizados);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Gasto planificado creado correctamente",
        });
      }
      // Llamar callback de éxito
      if (onSave) {
        onSave(resultado);
      }
    } catch (error) {
      console.error("Error al guardar el gasto planificado:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar el gasto planificado",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra mensajes de error de validación
   */
  const getFormErrorMessage = (name) => {
    return (
      errors[name] && <small className="p-error">{errors[name].message}</small>
    );
  };

  // Preparar opciones de productos
  const productosOptions = productos.map((p) => ({
    label: p.descripcionArmada || p.nombre,
    value: Number(p.id),
  }));

  // Preparar opciones de monedas
  const monedasOptions = monedas.map((m) => ({
    label: `${m.simbolo} - ${m.nombreLargo || m.codigoSunat}`,
    value: Number(m.id),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="field">
        <label
          htmlFor="productoId"
          className={classNames("font-medium", {
            "p-error": errors.productoId,
          })}
        >
          Producto (Gasto) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="productoId"
          control={control}
          rules={{
            required: "El producto es requerido",
          }}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={productosOptions}
              className={classNames({ "p-invalid": fieldState.error })}
              disabled={readOnly || loading}
              placeholder="Seleccione un producto"
              filter
              showClear
            />
          )}
        />
        {getFormErrorMessage("productoId")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="monedaId"
          className={classNames("font-medium", {
            "p-error": errors.monedaId,
          })}
        >
          Moneda <span className="text-red-500">*</span>
        </label>
        <Controller
          name="monedaId"
          control={control}
          rules={{
            required: "La moneda es requerida",
          }}
          render={({ field, fieldState }) => (
            <Dropdown
              id={field.name}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={monedasOptions}
              className={classNames({ "p-invalid": fieldState.error })}
              disabled={readOnly || loading}
              placeholder="Seleccione una moneda"
              filter
              showClear
            />
          )}
        />
        {getFormErrorMessage("monedaId")}
      </div>

      <div className="field mt-4">
        <label
          htmlFor="montoPlanificado"
          className={classNames("font-medium", {
            "p-error": errors.montoPlanificado,
          })}
        >
          Monto Planificado <span className="text-red-500">*</span>
        </label>
        <Controller
          name="montoPlanificado"
          control={control}
          rules={{
            required: "El monto planificado es requerido",
            min: {
              value: 0.01,
              message: "El monto debe ser mayor a 0",
            },
          }}
          render={({ field, fieldState }) => (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-dollar" />
              </span>
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                className={classNames({ "p-invalid": fieldState.error })}
                disabled={readOnly || loading}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                placeholder="0.00"
              />
            </div>
          )}
        />
        {getFormErrorMessage("montoPlanificado")}
      </div>

      <div className="field mt-4">
        <label htmlFor="descripcion" className="font-medium">
          Descripción (Opcional)
        </label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id={field.name}
              value={field.value || ""}
              onChange={field.onChange}
              disabled={readOnly || loading}
              rows={3}
              placeholder="Descripción adicional del gasto planificado"
            />
          )}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
          outlined
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
          outlined
        />
      </div>
    </form>
  );
};

export default DetGastosPlanificadosForm;
