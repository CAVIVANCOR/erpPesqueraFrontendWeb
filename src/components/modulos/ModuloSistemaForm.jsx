// src/components/modulos/ModuloSistemaForm.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';

export default function ModuloSistemaForm({ initialValues, onSubmit, onCancel, loading, readOnly }) {
  // Hook de formulario react-hook-form. Asegura que 'activo' sea true por defecto SOLO en alta.
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      nombre: initialValues?.nombre || '',
      descripcion: initialValues?.descripcion || '',
      // Si initialValues no tiene 'activo', forzar true (alta). Si lo tiene, respetar valor (edición).
      activo: typeof initialValues?.activo === 'boolean' ? initialValues.activo : true,
    }
  });

  useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => setValue(key, value));
    }
  }, [initialValues, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="nombre">Nombre *</label>
          <InputText id="nombre" {...register('nombre', { required: 'El nombre es obligatorio' })} autoFocus disabled={readOnly} />
          {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="descripcion">Descripción</label>
          <InputText id="descripcion" {...register('descripcion')} disabled={readOnly} />
        </div>
        <div className="p-field-checkbox">
          <label htmlFor="activo">Activo</label>
          <InputSwitch id="activo" {...register('activo')} checked={watch('activo')} onChange={e => setValue('activo', e.value)} disabled={readOnly} />
        </div>
      </div>
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button label="Cancelar" className="p-button-text p-mr-2" type="button" onClick={onCancel} disabled={loading} />
        {!readOnly && <Button label="Guardar" icon="pi pi-save" type="submit" loading={loading} />}
      </div>
    </form>
  );
}
