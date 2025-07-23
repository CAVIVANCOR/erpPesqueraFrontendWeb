// src/components/tipoEmbarcacion/TipoEmbarcacionForm.jsx
// Formulario profesional para TipoEmbarcacion. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function TipoEmbarcacionForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [codigo, setCodigo] = React.useState(defaultValues.codigo || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [cesado, setCesado] = React.useState(defaultValues.cesado !== undefined ? !!defaultValues.cesado : false);

  React.useEffect(() => {
    setCodigo(defaultValues.codigo || '');
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setCesado(defaultValues.cesado !== undefined ? !!defaultValues.cesado : false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codigo,
      nombre,
      descripcion,
      cesado
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="codigo">Código*</label>
        <InputText id="codigo" value={codigo} onChange={e => setCodigo(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} />
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
