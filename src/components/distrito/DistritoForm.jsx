// src/components/distrito/DistritoForm.jsx
// Formulario profesional para Distrito. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export default function DistritoForm({ isEdit, defaultValues, provincias, onSubmit, onCancel, loading }) {
  const [codSUNAT, setCodSUNAT] = React.useState(defaultValues.codSUNAT || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [provinciaId, setProvinciaId] = React.useState(defaultValues.provinciaId || null);

  React.useEffect(() => {
    setCodSUNAT(defaultValues.codSUNAT || '');
    setNombre(defaultValues.nombre || '');
    setProvinciaId(defaultValues.provinciaId ? Number(defaultValues.provinciaId) : null);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codSUNAT,
      nombre,
      provinciaId: provinciaId ? Number(provinciaId) : null
    });
  };

  // Normalizar opciones para el dropdown de provincias
  const provinciasOptions = provincias.map(p => ({ 
    ...p, 
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id)
  }));

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
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="provinciaId">Provincia*</label>
            <Dropdown
              id="provinciaId"
              value={provinciaId ? Number(provinciaId) : null}
              options={provinciasOptions}
              onChange={e => setProvinciaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar provincia"
              disabled={loading}
              required
            />
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
