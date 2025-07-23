// src/components/detalleDescargaFaena/DetalleDescargaFaenaForm.jsx
// Formulario profesional para DetalleDescargaFaena. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function DetalleDescargaFaenaForm({ isEdit, defaultValues, descargas, especies, onSubmit, onCancel, loading }) {
  const [descargaFaenaId, setDescargaFaenaId] = React.useState(defaultValues.descargaFaenaId || null);
  const [especieId, setEspecieId] = React.useState(defaultValues.especieId || null);
  const [toneladas, setToneladas] = React.useState(defaultValues.toneladas || 0);
  const [porcentajeJuveniles, setPorcentajeJuveniles] = React.useState(defaultValues.porcentajeJuveniles || 0);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setDescargaFaenaId(defaultValues.descargaFaenaId ? Number(defaultValues.descargaFaenaId) : null);
    setEspecieId(defaultValues.especieId ? Number(defaultValues.especieId) : null);
    setToneladas(defaultValues.toneladas || 0);
    setPorcentajeJuveniles(defaultValues.porcentajeJuveniles || 0);
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      descargaFaenaId: descargaFaenaId ? Number(descargaFaenaId) : null,
      especieId: especieId ? Number(especieId) : null,
      toneladas,
      porcentajeJuveniles,
      observaciones
    });
  };

  // Normalizar opciones para los dropdowns
  const descargasOptions = descargas.map(d => ({ 
    ...d, 
    id: Number(d.id),
    label: `Descarga ${d.id}`,
    value: Number(d.id)
  }));

  const especiesOptions = especies.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.nombre,
    value: Number(e.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="descargaFaenaId">Descarga Faena*</label>
        <Dropdown
          id="descargaFaenaId"
          value={descargaFaenaId ? Number(descargaFaenaId) : null}
          options={descargasOptions}
          onChange={e => setDescargaFaenaId(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar descarga"
          disabled={loading}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="especieId">Especie*</label>
        <Dropdown
          id="especieId"
          value={especieId ? Number(especieId) : null}
          options={especiesOptions}
          onChange={e => setEspecieId(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar especie"
          disabled={loading}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="toneladas">Toneladas</label>
        <InputNumber 
          id="toneladas" 
          value={toneladas} 
          onValueChange={e => setToneladas(e.value)} 
          mode="decimal" 
          minFractionDigits={2} 
          maxFractionDigits={2} 
          disabled={loading} 
        />
      </div>
      <div className="p-field">
        <label htmlFor="porcentajeJuveniles">Porcentaje Juveniles (%)</label>
        <InputNumber 
          id="porcentajeJuveniles" 
          value={porcentajeJuveniles} 
          onValueChange={e => setPorcentajeJuveniles(e.value)} 
          mode="decimal" 
          minFractionDigits={2} 
          maxFractionDigits={2} 
          min={0}
          max={100}
          disabled={loading} 
        />
      </div>
      <div className="p-field">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea 
          id="observaciones" 
          value={observaciones} 
          onChange={e => setObservaciones(e.target.value)} 
          rows={3} 
          disabled={loading} 
        />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
