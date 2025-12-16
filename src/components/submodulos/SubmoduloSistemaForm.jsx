// src/components/submodulos/SubmoduloSistemaForm.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';

export default function SubmoduloSistemaForm({ initialValues, modulosOptions, onSubmit, onCancel, loading, readOnly }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      moduloId: initialValues?.moduloId || null,
      nombre: initialValues?.nombre || '',
      descripcion: initialValues?.descripcion || '',
      ruta: initialValues?.ruta || '',
      icono: initialValues?.icono || '',
      orden: initialValues?.orden || 0,
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
          <label htmlFor="moduloId">Módulo *</label>
          <Dropdown
            id="moduloId"
            options={modulosOptions}
            optionLabel="nombre"
            optionValue="id"
            value={watch('moduloId')}
            onChange={e => setValue('moduloId', e.value)}
            placeholder="Seleccione módulo"
            disabled={readOnly}
          />
          {errors.moduloId && <small className="p-error">El módulo es obligatorio</small>}
        </div>
        <div className="p-field">
          <label htmlFor="nombre">Nombre *</label>
          <InputText id="nombre" {...register('nombre', { required: 'El nombre es obligatorio' })} disabled={readOnly} />
          {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
        </div>
        <div className="p-field">
          <label htmlFor="descripcion">Descripción</label>
          <InputText id="descripcion" {...register('descripcion')} disabled={readOnly} />
        </div>
        <div className="p-field">
          <label htmlFor="ruta">Ruta</label>
          <InputText 
            id="ruta" 
            {...register('ruta')} 
            placeholder="/modulo/submodulo" 
            disabled={readOnly} 
          />
          <small className="p-text-secondary">Ejemplo: /compras/orden-compra</small>
        </div>
        <div className="p-field">
          <label htmlFor="icono">Icono</label>
          <InputText 
            id="icono" 
            {...register('icono')} 
            placeholder="pi pi-shopping-cart" 
            disabled={readOnly} 
          />
          <small className="p-text-secondary">Ejemplo: pi pi-shopping-cart (PrimeIcons)</small>
        </div>
        <div className="p-field">
          <label htmlFor="orden">Orden</label>
          <InputText 
            id="orden" 
            type="number" 
            {...register('orden', { valueAsNumber: true })} 
            disabled={readOnly} 
          />
          <small className="p-text-secondary">Orden de aparición en el menú</small>
        </div>
        <div className="p-field-checkbox">
          <label htmlFor="activo">Activo</label>
          <InputSwitch id="activo" {...register('activo')} checked={watch('activo')} onChange={e => setValue('activo', e.value)} disabled={readOnly} />
        </div>
      </div>
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button label="Cancelar" className="p-button-text p-mr-2" type="button" onClick={onCancel} disabled={loading} />
        <Button label="Guardar" icon="pi pi-save" type="submit" loading={loading} disabled={readOnly} />
      </div>
    </form>
  );
}
