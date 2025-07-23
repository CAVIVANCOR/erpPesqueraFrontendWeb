// src/components/pais/PaisForm.jsx
// Formulario profesional para Pais. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function PaisForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [codSUNAT, setCodSUNAT] = React.useState(defaultValues.codSUNAT || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [gentilicio, setGentilicio] = React.useState(defaultValues.gentilicio || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setCodSUNAT(defaultValues.codSUNAT || '');
    setNombre(defaultValues.nombre || '');
    setGentilicio(defaultValues.gentilicio || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codSUNAT,
      nombre,
      gentilicio,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="codSUNAT">Código SUNAT*</label>
            <InputText 
              id="codSUNAT" 
              value={codSUNAT} 
              onChange={e => setCodSUNAT(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText 
              id="nombre" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="gentilicio">Gentilicio</label>
            <InputText 
              id="gentilicio" 
              value={gentilicio} 
              onChange={e => setGentilicio(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
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
