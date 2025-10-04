/**
 * EntregaARendirNovedadForm.jsx
 *
 * Formulario para crear y editar registros de EntregaARendirPescaConsumo.
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
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";

const EntregaARendirNovedadForm = ({
  entregaARendir = null,
  personal = [],
  centrosCosto = [],
  onSave,
  onCancel,
}) => {
  const toast = useRef(null);
  const isEditing = !!entregaARendir;

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
      respEntregaRendirId: null,
      centroCostoId: null,
      montoAsignado: 0,
      entregaLiquidada: false,
      fechaLiquidacion: null,
      estado: "ACTIVO",
    },
  });

  // Cargar datos del registro en edición
  useEffect(() => {
    if (isEditing && entregaARendir) {
      reset({
        respEntregaRendirId: entregaARendir.respEntregaRendirId ? Number(entregaARendir.respEntregaRendirId) : null,
        centroCostoId: entregaARendir.centroCostoId ? Number(entregaARendir.centroCostoId) : null,
        montoAsignado: entregaARendir.montoAsignado || 0,
        entregaLiquidada: entregaARendir.entregaLiquidada || false,
        fechaLiquidacion: entregaARendir.fechaLiquidacion ? new Date(entregaARendir.fechaLiquidacion) : null,
        estado: entregaARendir.estado || "ACTIVO",
      });
    }
  }, [entregaARendir, isEditing, reset]);

  // Preparar opciones para dropdowns aplicando regla Number()
  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: `${cc.Codigo} - ${cc.Nombre}` || cc.descripcion || cc.nombre,
    value: Number(cc.id),
  }));

  const estadoOptions = [
    { label: "ACTIVO", value: "ACTIVO" },
    { label: "INACTIVO", value: "INACTIVO" },
    { label: "LIQUIDADO", value: "LIQUIDADO" },
  ];

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    try {
      // Normalizar datos aplicando regla Number() para IDs
      const datosNormalizados = {
        ...data,
        respEntregaRendirId: data.respEntregaRendirId ? Number(data.respEntregaRendirId) : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        montoAsignado: Number(data.montoAsignado) || 0,
        fechaLiquidacion: data.fechaLiquidacion || null,
        fechaActualizacion: new Date().toISOString(),
      };

      if (!isEditing) {
        datosNormalizados.fechaCreacion = new Date().toISOString();
      }

      await onSave(datosNormalizados);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Entrega a rendir ${isEditing ? "actualizada" : "creada"} correctamente`,
        life: 3000,
      });
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

          {/* Monto Asignado */}
          <div className="col-12">
            <label htmlFor="montoAsignado" className="block text-900 font-medium mb-2">
              Monto Asignado *
            </label>
            <Controller
              name="montoAsignado"
              control={control}
              rules={{ 
                required: "El monto asignado es obligatorio",
                min: { value: 0, message: "El monto debe ser mayor o igual a 0" }
              }}
              render={({ field }) => (
                <InputNumber
                  id="montoAsignado"
                  {...field}
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  placeholder="0.00"
                  className={classNames({
                    "p-invalid": errors.montoAsignado,
                  })}
                />
              )}
            />
            {errors.montoAsignado && (
              <Message severity="error" text={errors.montoAsignado.message} />
            )}
          </div>

          {/* Estado */}
          <div className="col-12">
            <label htmlFor="estado" className="block text-900 font-medium mb-2">
              Estado
            </label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="estado"
                  {...field}
                  value={field.value}
                  options={estadoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione estado"
                  className={classNames({
                    "p-invalid": errors.estado,
                  })}
                />
              )}
            />
            {errors.estado && (
              <Message severity="error" text={errors.estado.message} />
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
          {isEditing && entregaARendir && (
            <>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={entregaARendir.fechaCreacion ? new Date(entregaARendir.fechaCreacion).toLocaleString("es-PE") : ""}
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div className="col-6">
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={entregaARendir.fechaActualizacion ? new Date(entregaARendir.fechaActualizacion).toLocaleString("es-PE") : ""}
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
            onClick={onCancel}
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

export default EntregaARendirNovedadForm;
