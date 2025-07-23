// src/components/subfamiliaProducto/SubfamiliaProductoForm.jsx
// Formulario profesional para SubfamiliaProducto. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';

export default function SubfamiliaProductoForm({ isEdit, defaultValues, familias, onSubmit, onCancel, loading }) {
  const [familiaId, setFamiliaId] = React.useState(defaultValues.familiaId || null);
  const [descripcionBase, setDescripcionBase] = React.useState(defaultValues.descripcionBase || '');
  const [descripcionExtendida, setDescripcionExtendida] = React.useState(defaultValues.descripcionExtendida || '');
  const [descripcionArmada, setDescripcionArmada] = React.useState(defaultValues.descripcionArmada || '');
  const [estado, setEstado] = React.useState(defaultValues.estado || 'ACTIVO');

  React.useEffect(() => {
    setFamiliaId(defaultValues.familiaId || null);
    setDescripcionBase(defaultValues.descripcionBase || '');
    setDescripcionExtendida(defaultValues.descripcionExtendida || '');
    setDescripcionArmada(defaultValues.descripcionArmada || '');
    setEstado(defaultValues.estado || 'ACTIVO');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      familiaId: familiaId ? Number(familiaId) : null,
      descripcionBase,
      descripcionExtendida,
      descripcionArmada,
      estado
    });
  };

  const familiasOptions = familias.map(f => ({ ...f, id: Number(f.id) }));
  
  const estadoOptions = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'Pendiente', value: 'PENDIENTE' }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="familiaId">Familia*</label>
            <Dropdown 
              id="familiaId"
              value={familiaId ? Number(familiaId) : null}
              options={familiasOptions}
              optionLabel="descripcionBase"
              optionValue="id"
              onChange={e => setFamiliaId(e.value)}
              placeholder="Seleccione familia"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcionBase">Descripción Base*</label>
            <InputText 
              id="descripcionBase" 
              value={descripcionBase} 
              onChange={e => setDescripcionBase(e.target.value)} 
              required 
              disabled={loading}
              maxLength={120}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcionExtendida">Descripción Extendida</label>
            <InputTextarea 
              id="descripcionExtendida" 
              value={descripcionExtendida} 
              onChange={e => setDescripcionExtendida(e.target.value)} 
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcionArmada">Descripción Armada</label>
            <InputTextarea 
              id="descripcionArmada" 
              value={descripcionArmada} 
              onChange={e => setDescripcionArmada(e.target.value)} 
              disabled={loading}
              rows={2}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="estado">Estado*</label>
            <Dropdown 
              id="estado"
              value={estado}
              options={estadoOptions}
              optionLabel="label"
              optionValue="value"
              onChange={e => setEstado(e.value)}
              placeholder="Seleccione estado"
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
