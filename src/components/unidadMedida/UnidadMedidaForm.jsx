// src/components/unidadMedida/UnidadMedidaForm.jsx
// Formulario profesional para UnidadMedida. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';

export default function UnidadMedidaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [simbolo, setSimbolo] = React.useState(defaultValues.simbolo || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [unidadBaseId, setUnidadBaseId] = React.useState(defaultValues.unidad_base_id || null);
  const [factorConversion, setFactorConversion] = React.useState(defaultValues.factor_conversion || null);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setSimbolo(defaultValues.simbolo || '');
    setDescripcion(defaultValues.descripcion || '');
    setUnidadBaseId(defaultValues.unidad_base_id || null);
    setFactorConversion(defaultValues.factor_conversion || null);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      simbolo,
      descripcion,
      unidad_base_id: unidadBaseId,
      factor_conversion: factorConversion
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText 
              id="nombre" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              disabled={loading}
              maxLength={60}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="simbolo">Símbolo*</label>
            <InputText 
              id="simbolo" 
              value={simbolo} 
              onChange={e => setSimbolo(e.target.value)} 
              required 
              disabled={loading}
              maxLength={20}
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
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="unidadBaseId">ID Unidad Base</label>
            <InputNumber 
              id="unidadBaseId" 
              value={unidadBaseId} 
              onValueChange={e => setUnidadBaseId(e.value)} 
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="factorConversion">Factor de Conversión</label>
            <InputNumber 
              id="factorConversion" 
              value={factorConversion} 
              onValueChange={e => setFactorConversion(e.value)} 
              disabled={loading}
              minFractionDigits={2}
              maxFractionDigits={2}
              step={0.01}
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
