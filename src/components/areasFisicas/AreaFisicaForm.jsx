// src/components/areasFisicas/AreaFisicaForm.jsx
// Formulario modular y reutilizable para alta y edición de áreas físicas de sede en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
// Documentado en español técnico.

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

// Esquema de validación profesional con Yup alineado al modelo AreaFisicaSede de Prisma
const schema = Yup.object().shape({
  empresaId: Yup.number().typeError('La empresa es obligatoria').required('La empresa es obligatoria'),
  sedeId: Yup.number().typeError('La sede es obligatoria').required('La sede es obligatoria'),
  nombre: Yup.string().required('El nombre del área es obligatorio'),
  descripcion: Yup.string(),
  cesado: Yup.boolean(),
});

/**
 * Formulario modular de área física de sede.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {Array} props.sedes Lista de sedes para el combo
 */
/**
 * Formulario modular de área física de sede con combos dependientes de empresa y sede.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {Array} props.empresas Lista de empresas para el combo
 * @param {Array} props.sedes Lista completa de sedes para el combo dependiente
 */
export default function AreaFisicaForm({ isEdit = false, defaultValues = {}, onSubmit, onCancel, loading, empresas = [], sedes = [] }) {
  // Asegura que empresaId y sedeId sean null si no hay valor inicial (para evitar problemas visuales en alta)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...defaultValues,
      empresaId: defaultValues.empresaId ?? null,
      sedeId: defaultValues.sedeId ?? null,
      cesado: defaultValues.cesado ?? false,
    },
  });

  // Estado local para combos dependientes
  const empresaId = watch('empresaId');
  const sedeId = watch('sedeId');

  // LOG de depuración: muestra el valor actual de empresaId y el array de empresas
  console.log('[AreaFisicaForm] Valor actual empresaId:', empresaId);
  console.log('[AreaFisicaForm] Array de empresas:', empresas);
  console.log('[AreaFisicaForm] defaultValues:', defaultValues);


  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, cesado: defaultValues.cesado ?? false });
  }, [defaultValues, isEdit, reset]);

  // Determina la empresa asociada a la sede seleccionada (modo edición)
  useEffect(() => {
    if (isEdit && defaultValues.sedeId && sedes.length > 0) {
      const sede = sedes.find(s => s.id === defaultValues.sedeId);
      if (sede && sede.empresaId) {
        setValue('empresaId', sede.empresaId);
      }
    }
  }, [isEdit, defaultValues.sedeId, sedes, setValue]);

  // Limpia el combo sede si cambia la empresa
  useEffect(() => {
    if (empresaId && sedes.length > 0) {
      const sedeSeleccionada = sedes.find(s => s.id === sedeId);
      if (!sedeSeleccionada || sedeSeleccionada.empresaId !== empresaId) {
        setValue('sedeId', '');
      }
    }
  }, [empresaId, sedes, sedeId, setValue]);

  // Filtra las sedes según la empresa seleccionada y memoriza el array para evitar bugs de referencia en PrimeReact
  const sedesFiltradas = React.useMemo(() => (
    empresaId ? sedes.filter(s => s.empresaId === empresaId) : []
  ), [empresaId, sedes]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="empresaId">Empresa*</label>
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="empresaId"
                value={field.value}
                options={empresas}
                optionLabel="razonSocial"
                optionValue="id"
                placeholder="Seleccione una empresa"
                className={errors.empresaId ? 'p-invalid' : ''}
                onChange={e => {
                  field.onChange(e.value);
                }}
                disabled={loading || isSubmitting}
              />
            )}
          />
          {errors.empresaId && <small className="p-error">{errors.empresaId.message}</small>}
        </div>
        <div className="field">
          <label htmlFor="sedeId">Sede*</label>
          <Controller
            name="sedeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="sedeId"
                value={field.value}
                options={sedesFiltradas}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione una sede"
                className={errors.sedeId ? 'p-invalid' : ''}
                onChange={e => field.onChange(e.value)}
                disabled={loading || isSubmitting || !empresaId}
              />
            )}
          />
          {errors.sedeId && <small className="p-error">{errors.sedeId.message}</small>}
        </div>
        <div className="field">
          <label htmlFor="nombre">Nombre*</label>
          <InputText id="nombre" {...register('nombre')} className={errors.nombre ? 'p-invalid' : ''} autoFocus />
          {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
        </div>
        <div className="field">
          <label htmlFor="descripcion">Descripción</label>
          <InputText id="descripcion" {...register('descripcion')} className={errors.descripcion ? 'p-invalid' : ''} />
        </div>
        <div className="field-checkbox">
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <Checkbox inputId="cesado" checked={!!field.value} onChange={e => field.onChange(e.checked)} disabled={loading || isSubmitting} />
            )}
          />
          <label htmlFor="cesado">Área cesada</label>
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading || isSubmitting} />
          <Button type="submit" label={isEdit ? "Actualizar" : "Registrar"} icon="pi pi-save" loading={loading || isSubmitting} />
        </div>
      </div>
    </form>
  );
}
