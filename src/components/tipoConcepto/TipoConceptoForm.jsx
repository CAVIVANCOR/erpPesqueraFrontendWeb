// src/components/tipoConcepto/TipoConceptoForm.jsx
// Formulario profesional para TipoConcepto. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';

export default function TipoConceptoForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
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
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText 
              id="nombre" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              disabled={loading}
              maxLength={50}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcion">Descripción</label>
            <InputTextarea 
              id="descripcion" 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
