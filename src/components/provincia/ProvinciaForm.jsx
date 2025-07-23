// src/components/provincia/ProvinciaForm.jsx
// Formulario profesional para Provincia. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export default function ProvinciaForm({ isEdit, defaultValues, departamentos, onSubmit, onCancel, loading }) {
  const [codSUNAT, setCodSUNAT] = React.useState(defaultValues.codSUNAT || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [departamentoId, setDepartamentoId] = React.useState(defaultValues.departamentoId || null);

  React.useEffect(() => {
    setCodSUNAT(defaultValues.codSUNAT || '');
    setNombre(defaultValues.nombre || '');
    setDepartamentoId(defaultValues.departamentoId ? Number(defaultValues.departamentoId) : null);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codSUNAT,
      nombre,
      departamentoId: departamentoId ? Number(departamentoId) : null
    });
  };

  // Normalizar opciones para el dropdown de departamentos
  const departamentosOptions = departamentos.map(d => ({ 
    ...d, 
    id: Number(d.id),
    label: d.nombre,
    value: Number(d.id)
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
            <label htmlFor="departamentoId">Departamento*</label>
            <Dropdown
              id="departamentoId"
              value={departamentoId ? Number(departamentoId) : null}
              options={departamentosOptions}
              onChange={e => setDepartamentoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar departamento"
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
