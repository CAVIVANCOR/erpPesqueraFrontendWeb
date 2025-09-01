// src/components/detalleCalaEspecie/DetalleCalaEspecieForm.jsx
// Formulario profesional para DetalleCalaEspecie. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { recalcularCascadaDesdeCala } from '../../api/recalcularToneladas';

export default function DetalleCalaEspecieForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [calaId, setCalaId] = React.useState(defaultValues.calaId || '');
  const [especieId, setEspecieId] = React.useState(defaultValues.especieId || '');
  const [toneladas, setToneladas] = React.useState(defaultValues.toneladas || 0);
  const [porcentajeJuveniles, setPorcentajeJuveniles] = React.useState(defaultValues.porcentajeJuveniles || 0);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setCalaId(defaultValues.calaId || '');
    setEspecieId(defaultValues.especieId || '');
    setToneladas(defaultValues.toneladas || 0);
    setPorcentajeJuveniles(defaultValues.porcentajeJuveniles || 0);
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      calaId: calaId ? Number(calaId) : null,
      especieId: especieId ? Number(especieId) : null,
      toneladas,
      porcentajeJuveniles,
      observaciones
    };

    // Llamar onSubmit original
    await onSubmit(formData);

    // RECÁLCULO AUTOMÁTICO: Cuando se modifica DetalleCalaEspecie → recalcular en cascada desde Cala
    if (calaId) {
      try {
        await recalcularCascadaDesdeCala(calaId);
      } catch (error) {
        console.error(' Error en recálculo automático:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="calaId">Cala*</label>
        <InputText id="calaId" value={calaId} onChange={e => setCalaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="especieId">Especie*</label>
        <InputText id="especieId" value={especieId} onChange={e => setEspecieId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="toneladas">Toneladas</label>
        <InputNumber id="toneladas" value={toneladas} onValueChange={e => setToneladas(e.value)} mode="decimal" minFractionDigits={2} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="porcentajeJuveniles">Porcentaje Juveniles</label>
        <InputNumber id="porcentajeJuveniles" value={porcentajeJuveniles} onValueChange={e => setPorcentajeJuveniles(e.value)} mode="decimal" minFractionDigits={2} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea id="observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
