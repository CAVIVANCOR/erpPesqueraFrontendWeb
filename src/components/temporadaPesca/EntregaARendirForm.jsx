/**
 * EntregaARendirForm.jsx
 *
 * Formulario para crear y editar registros de EntregaARendir.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import {
  crearEntregaARendir,
  actualizarEntregaARendir,
} from "../../api/entregaARendir";

const EntregaARendirForm = ({
  entrega = null,
  temporadaPescaId,
  personal = [],
  centrosCosto = [],
  onGuardadoExitoso,
  onCancelar,
}) => {
  const toast = useRef(null);
  const isEditing = !!entrega;

  // Configuración del formulario con react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      temporadaPescaId: temporadaPescaId || null,
      entregaLiquidada: false,
      fechaLiquidacion: null,
      respEntregaRendirId: null,
      centroCostoId: null,
    },
  });

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && entrega) {
      reset({
        temporadaPescaId: Number(entrega.temporadaPescaId),
        entregaLiquidada: entrega.entregaLiquidada || false,
        fechaLiquidacion: entrega.fechaLiquidacion ? new Date(entrega.fechaLiquidacion) : null,
        respEntregaRendirId: entrega.respEntregaRendirId ? Number(entrega.respEntregaRendirId) : null,
        centroCostoId: entrega.centroCostoId ? Number(entrega.centroCostoId) : null,
      });
    } else {
      // Para nuevo registro, establecer temporadaPescaId
      setValue("temporadaPescaId", Number(temporadaPescaId));
    }
  }, [entrega, isEditing, temporadaPescaId, reset, setValue]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.descripcion || cc.nombre,
    value: Number(cc.id),
  }));

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        temporadaPescaId: Number(data.temporadaPescaId),
        respEntregaRendirId: data.respEntregaRendirId ? Number(data.respEntregaRendirId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        fechaLiquidacion: data.fechaLiquidacion || null,
        fechaActualizacion: new Date(),
      };

      let resultado;
      if (isEditing) {
        resultado = await actualizarEntregaARendir(entrega.id, datosNormalizados);
      } else {
        datosNormalizados.fechaCreacion = new Date();
        resultado = await crearEntregaARendir(datosNormalizados);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Entrega a rendir ${isEditing ? "actualizada" : "creada"} correctamente`,
        life: 3000,
      });

      onGuardadoExitoso?.(resultado);
    } catch (error) {
      console.error("Error al guardar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al ${isEditing ? "actualizar" : "crear"} la entrega a rendir`,
        life: 3000,
      });
    }
  };

  return (
    <div className="p-fluid">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid">
          {/* Responsable de Entrega */}
          <div className="col-12">
            <label htmlFor="respEntregaRendirId" className="block text-900 font-medium mb-2">
              Responsable de Entrega *
            </label>
            <Controller
              name="respEntregaRendirId"
              control={control}
              rules={{ required: "El responsable es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="respEntregaRendirId"
                  {...field}
                  value={field.value}
                  options={personalOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione responsable"
                  className={classNames({
                    "p-invalid": errors.respEntregaRendirId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.respEntregaRendirId && (
              <Message severity="error" text={errors.respEntregaRendirId.message} />
            )}
          </div>

          {/* Centro de Costo */}
          <div className="col-12">
            <label htmlFor="centroCostoId" className="block text-900 font-medium mb-2">
              Centro de Costo *
            </label>
            <Controller
              name="centroCostoId"
              control={control}
              rules={{ required: "El centro de costo es obligatorio" }}
              render={({ field }) => (
                <Dropdown
                  id="centroCostoId"
                  {...field}
                  value={field.value}
                  options={centroCostoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione centro de costo"
                  className={classNames({
                    "p-invalid": errors.centroCostoId,
                  })}
                  filter
                  showClear
                />
              )}
            />
            {errors.centroCostoId && (
              <Message severity="error" text={errors.centroCostoId.message} />
            )}
          </div>

          {/* Estado de Liquidación */}
          <div className="col-12">
            <div className="field-checkbox">
              <Controller
                name="entregaLiquidada"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    inputId="entregaLiquidada"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                )}
              />
              <label htmlFor="entregaLiquidada" className="ml-2">
                Entrega Liquidada
              </label>
            </div>
          </div>

          {/* Fecha de Liquidación - Solo si está marcada como liquidada */}
          <Controller
            name="entregaLiquidada"
            control={control}
            render={({ field: entregaLiquidadaField }) => (
              entregaLiquidadaField.value && (
                <div className="col-12">
                  <label htmlFor="fechaLiquidacion" className="block text-900 font-medium mb-2">
                    Fecha de Liquidación
                  </label>
                  <Controller
                    name="fechaLiquidacion"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="fechaLiquidacion"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        showIcon
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccione fecha"
                        className={classNames({
                          "p-invalid": errors.fechaLiquidacion,
                        })}
                      />
                    )}
                  />
                  {errors.fechaLiquidacion && (
                    <Message severity="error" text={errors.fechaLiquidacion.message} />
                  )}
                </div>
              )
            )}
          />

          {/* Información de solo lectura para edición */}
          {isEditing && (
            <>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={entrega.fechaCreacion ? new Date(entrega.fechaCreacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={entrega.fechaActualizacion ? new Date(entrega.fechaActualizacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancelar}
          />
          <Button
            type="submit"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-primary"
          />
        </div>
      </form>

      <Toast ref={toast} />
    </div>
  );
};

export default EntregaARendirForm;
