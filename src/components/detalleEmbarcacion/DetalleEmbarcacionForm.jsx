// src/components/detalleEmbarcacion/DetalleEmbarcacionForm.jsx
// Formulario profesional para DetalleEmbarcacion. Cumple estándar ERP Megui.
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { getEmbarcaciones } from '../../api/embarcacion';

// Esquema de validación con Yup
const schema = yup.object().shape({
  embarcacionId: yup.number().required('La embarcación es obligatoria').typeError('Debe seleccionar una embarcación'),
  descripcion: yup.string().required('La descripción es obligatoria').max(500, 'Máximo 500 caracteres'),
  valor: yup.number().nullable().typeError('El valor debe ser numérico'),
  activo: yup.boolean().required()
});

/**
 * Formulario profesional para gestión de Detalles de Embarcaciones.
 * Implementa validaciones con react-hook-form + Yup.
 * Cumple estándar ERP Megui: combos normalizados, validaciones, documentación.
 */
export default function DetalleEmbarcacionForm({ item, onSave, onCancel }) {
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      embarcacionId: null,
      descripcion: '',
      valor: null,
      activo: true
    }
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (item) {
      // Cargar datos del item para edición
      setValue('embarcacionId', item.embarcacionId ? Number(item.embarcacionId) : null);
      setValue('descripcion', item.descripcion || '');
      setValue('valor', item.valor || null);
      setValue('activo', item.activo !== undefined ? item.activo : true);
    } else {
      // Resetear formulario para nuevo registro
      reset({
        embarcacionId: null,
        descripcion: '',
        valor: null,
        activo: true
      });
    }
  }, [item, setValue, reset]);

  const cargarDatos = async () => {
    try {
      const embarcacionesData = await getEmbarcaciones();
      // Normalizar IDs a numéricos según regla ERP Megui
      setEmbarcaciones(embarcacionesData.map(e => ({ ...e, id: Number(e.id) })));
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Normalizar datos antes de enviar
      const payload = {
        ...data,
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        valor: data.valor || null
      };
      
      await onSave(payload);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name]?.message}</small>;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="formgrid grid">
        {/* Embarcación */}
        <div className="field col-12">
          <label htmlFor="embarcacionId" className={classNames({ 'p-error': errors.embarcacionId })}>
            Embarcación *
          </label>
          <Controller
            name="embarcacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value ? Number(field.value) : null}
                onChange={(e) => field.onChange(e.value)}
                options={embarcaciones}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione una embarcación"
                filter
                showClear
                className={classNames({ 'p-invalid': errors.embarcacionId })}
              />
            )}
          />
          {getFormErrorMessage('embarcacionId')}
        </div>

        {/* Descripción */}
        <div className="field col-12">
          <label htmlFor="descripcion" className={classNames({ 'p-error': errors.descripcion })}>
            Descripción *
          </label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id={field.name}
                {...field}
                rows={3}
                placeholder="Ingrese la descripción del detalle"
                className={classNames({ 'p-invalid': errors.descripcion })}
                maxLength={500}
              />
            )}
          />
          {getFormErrorMessage('descripcion')}
        </div>

        {/* Valor */}
        <div className="field col-12 md:col-6">
          <label htmlFor="valor">Valor</label>
          <Controller
            name="valor"
            control={control}
            render={({ field }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                placeholder="0.00"
                className={classNames({ 'p-invalid': errors.valor })}
              />
            )}
          />
          {getFormErrorMessage('valor')}
        </div>

        {/* Estado Activo */}
        <div className="field col-12 md:col-6">
          <label htmlFor="activo">Estado</label>
          <div className="flex align-items-center mt-2">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId={field.name}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                  className="mr-2"
                />
              )}
            />
            <label htmlFor="activo" className="ml-2">Activo</label>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={item ? "Actualizar" : "Crear"}
          icon={item ? "pi pi-check" : "pi pi-plus"}
          className="p-button-primary"
          loading={loading}
        />
      </div>
    </form>
  );
}
