// src/components/accionesPreviasFaena/AccionesPreviasFaenaForm.jsx
// Formulario profesional para AccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';

export default function AccionesPreviasFaenaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText 
          id="nombre" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
          disabled={loading}
          maxLength={100}
        />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputTextarea 
          id="descripcion" 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          rows={3} 
          disabled={loading} 
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox 
          id="activo" 
          checked={activo} 
          onChange={e => setActivo(e.checked)} 
          disabled={loading} 
        />
        <label htmlFor="activo">Activo</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
