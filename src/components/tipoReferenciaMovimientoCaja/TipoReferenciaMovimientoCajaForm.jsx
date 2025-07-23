// src/components/tipoReferenciaMovimientoCaja/TipoReferenciaMovimientoCajaForm.jsx
// Formulario profesional para TipoReferenciaMovimientoCaja. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function TipoReferenciaMovimientoCajaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [codigo, setCodigo] = React.useState(defaultValues.codigo || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setCodigo(defaultValues.codigo || '');
    setDescripcion(defaultValues.descripcion || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codigo,
      descripcion,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="codigo">Código*</label>
        <InputText id="codigo" value={codigo} onChange={e => setCodigo(e.target.value)} required disabled={loading} maxLength={30} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="activo" checked={activo} onChange={e => setActivo(e.checked)} disabled={loading} />
        <label htmlFor="activo">Activo</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
