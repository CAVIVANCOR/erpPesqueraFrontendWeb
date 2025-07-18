// src/components/tipoDocumento/TipoDocumentoForm.jsx
// Formulario modular para alta y edición de tipos de documento en el ERP Megui.
// Utiliza PrimeReact, react-hook-form y Yup. Documentado en español técnico.

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Esquema de validación profesional con Yup
const schema = Yup.object().shape({
  codigo: Yup.string().required('El código es obligatorio'),
  codigoSunat: Yup.string(),
  descripcion: Yup.string(),
  moduloId: Yup.number().nullable(),
  activo: Yup.boolean()
});

/**
 * Formulario modular para alta/edición de tipo de documento.
 * @param {object} props
 * @param {boolean} props.isEdit Modo edición
 * @param {object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback de grabado
 * @param {function} props.onCancel Callback de cancelación
 * @param {boolean} props.loading Estado de loading
 */
export default function TipoDocumentoForm({ isEdit = false, defaultValues = {}, onSubmit, onCancel, loading }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  // Log de depuración profesional del payload antes de grabar
  const onSubmitWithLog = (data) => {
    console.log('[TipoDocumentoForm] Payload a enviar:', data);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitWithLog)}>
      <div className="p-fluid">
        <div className="p-field">
          <label>Código *</label>
          <Controller
            name="codigo"
            control={control}
            render={({ field }) => <InputText {...field} autoFocus className={errors.codigo ? 'p-invalid' : ''} />}
          />
          <small className="p-error">{errors.codigo?.message}</small>
        </div>
        <div className="p-field">
          <label>Código Sunat</label>
          <Controller
            name="codigoSunat"
            control={control}
            render={({ field }) => <InputText {...field} />}
          />
        </div>
        <div className="p-field">
          <label>Descripción</label>
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => <InputText {...field} />}
          />
        </div>
        {/* Campo: Activo */}
        <div className="p-field-checkbox">
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <>
                <InputSwitch checked={field.value} onChange={e => field.onChange(e.value)} />
                <label style={{ marginLeft: 8 }}>Activo</label>
              </>
            )}
          />
        </div>
        {/* Botones de acción alineados a la derecha, compactos y con íconos */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" type="button" onClick={onCancel} disabled={loading} />
          <Button label={isEdit ? 'Actualizar' : 'Guardar'} icon="pi pi-check" className="p-button-success" type="submit" loading={loading} />
        </div>
      </div>
    </form>
  );
}
