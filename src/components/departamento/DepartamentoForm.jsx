// src/components/departamento/DepartamentoForm.jsx
// Formulario profesional para Departamento. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export default function DepartamentoForm({ isEdit, defaultValues, paises, onSubmit, onCancel, loading }) {
  const [codSUNAT, setCodSUNAT] = React.useState(defaultValues.codSUNAT || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [paisId, setPaisId] = React.useState(defaultValues.paisId || null);

  React.useEffect(() => {
    setCodSUNAT(defaultValues.codSUNAT || '');
    setNombre(defaultValues.nombre || '');
    setPaisId(defaultValues.paisId ? Number(defaultValues.paisId) : null);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codSUNAT,
      nombre,
      paisId: paisId ? Number(paisId) : null
    });
  };

  // Normalizar opciones para el dropdown de países
  const paisesOptions = paises.map(p => ({ 
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
            <label htmlFor="paisId">País*</label>
            <Dropdown
              id="paisId"
              value={paisId ? Number(paisId) : null}
              options={paisesOptions}
              onChange={e => setPaisId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar país"
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
