// src/components/sedes/SedeForm.jsx
// Formulario modular y reutilizable para alta y edición de sedes de empresa en el ERP Megui.
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

// Esquema de validación profesional con Yup alineado al modelo SedesEmpresa de Prisma
const schema = Yup.object().shape({
  empresaId: Yup.number().typeError('La empresa es obligatoria').required('La empresa es obligatoria'),
  nombre: Yup.string().required('El nombre de la sede es obligatorio'),
  direccion: Yup.string(),
  telefono: Yup.string(),
  email: Yup.string().email('Debe ser un email válido'),
  cesado: Yup.boolean(),
});

/**
 * Formulario modular de sede de empresa.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 * @param {Array} props.empresas Lista de empresas para el combo
 */
export default function SedeForm({ isEdit = false, defaultValues = {}, onSubmit, onCancel, loading, empresas = [] }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...defaultValues, cesado: defaultValues.cesado ?? false },
  });

  // Reset al abrir en modo edición o alta
  useEffect(() => {
    reset({ ...defaultValues, cesado: defaultValues.cesado ?? false });
  }, [defaultValues, isEdit, reset]);

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
                // Corrige bug de selección: si el valor es vacío, asigna null; si no, convierte a número
                onChange={e => field.onChange(e.value === '' ? null : Number(e.value))}
                disabled={loading || isSubmitting}
              />
            )}
          />
          {errors.empresaId && <small className="p-error">{errors.empresaId.message}</small>}
        </div>
        <div className="field">
          <label htmlFor="nombre">Nombre*</label>
          <InputText id="nombre" {...register('nombre')} className={errors.nombre ? 'p-invalid' : ''} autoFocus />
          {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
        </div>
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <InputText id="direccion" {...register('direccion')} className={errors.direccion ? 'p-invalid' : ''} />
        </div>
        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          <InputText id="telefono" {...register('telefono')} className={errors.telefono ? 'p-invalid' : ''} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <InputText id="email" {...register('email')} className={errors.email ? 'p-invalid' : ''} />
          {errors.email && <small className="p-error">{errors.email.message}</small>}
        </div>
        <div className="field-checkbox">
          <Controller
            name="cesado"
            control={control}
            render={({ field }) => (
              <Checkbox inputId="cesado" checked={!!field.value} onChange={e => field.onChange(e.checked)} disabled={loading || isSubmitting} />
            )}
          />
          <label htmlFor="cesado">Sede cesada</label>
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading || isSubmitting} />
          <Button type="submit" label={isEdit ? "Actualizar" : "Registrar"} icon="pi pi-save" loading={loading || isSubmitting} />
        </div>
      </div>
    </form>
  );
}
