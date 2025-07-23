// src/components/bolicheRed/BolicheRedForm.jsx
// Formulario profesional para BolicheRed. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function BolicheRedForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [activoId, setActivoId] = React.useState(defaultValues.activoId || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [cesado, setCesado] = React.useState(defaultValues.cesado !== undefined ? !!defaultValues.cesado : false);

  React.useEffect(() => {
    setActivoId(defaultValues.activoId || '');
    setDescripcion(defaultValues.descripcion || '');
    setCesado(defaultValues.cesado !== undefined ? !!defaultValues.cesado : false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      activoId: activoId ? Number(activoId) : null,
      descripcion,
      cesado
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="activoId">Activo*</label>
        <InputText id="activoId" value={activoId} onChange={e => setActivoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="cesado" checked={cesado} onChange={e => setCesado(e.checked)} disabled={loading} />
        <label htmlFor="cesado">Cesado</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
