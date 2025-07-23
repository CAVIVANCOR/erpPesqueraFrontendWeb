// src/components/tipoMaterial/TipoMaterialForm.jsx
// Formulario profesional para TipoMaterial. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

export default function TipoMaterialForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [descripcionBase, setDescripcionBase] = React.useState(defaultValues.descripcionBase || '');
  const [descripcionExtendida, setDescripcionExtendida] = React.useState(defaultValues.descripcionExtendida || '');
  const [descripcionArmada, setDescripcionArmada] = React.useState(defaultValues.descripcionArmada || '');

  React.useEffect(() => {
    setDescripcionBase(defaultValues.descripcionBase || '');
    setDescripcionExtendida(defaultValues.descripcionExtendida || '');
    setDescripcionArmada(defaultValues.descripcionArmada || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      descripcionBase,
      descripcionExtendida,
      descripcionArmada
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcionBase">Descripción Base*</label>
            <InputText 
              id="descripcionBase" 
              value={descripcionBase} 
              onChange={e => setDescripcionBase(e.target.value)} 
              required 
              disabled={loading}
              maxLength={80}
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
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
