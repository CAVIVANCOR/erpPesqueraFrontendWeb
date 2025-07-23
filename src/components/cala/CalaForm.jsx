// src/components/cala/CalaForm.jsx
// Formulario profesional para Cala. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';

export default function CalaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [bahiaId, setBahiaId] = React.useState(defaultValues.bahiaId || '');
  const [motoristaId, setMotoristaId] = React.useState(defaultValues.motoristaId || '');
  const [patronId, setPatronId] = React.useState(defaultValues.patronId || '');
  const [embarcacionId, setEmbarcacionId] = React.useState(defaultValues.embarcacionId || '');
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faenaPescaId || '');
  const [temporadaPescaId, setTemporadaPescaId] = React.useState(defaultValues.temporadaPescaId || '');
  const [fechaHoraInicio, setFechaHoraInicio] = React.useState(defaultValues.fechaHoraInicio ? new Date(defaultValues.fechaHoraInicio) : new Date());
  const [fechaHoraFin, setFechaHoraFin] = React.useState(defaultValues.fechaHoraFin ? new Date(defaultValues.fechaHoraFin) : new Date());
  const [latitud, setLatitud] = React.useState(defaultValues.latitud || 0);
  const [longitud, setLongitud] = React.useState(defaultValues.longitud || 0);
  const [profundidadM, setProfundidadM] = React.useState(defaultValues.profundidadM || 0);
  const [toneladasCapturadas, setToneladasCapturadas] = React.useState(defaultValues.toneladasCapturadas || 0);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setBahiaId(defaultValues.bahiaId || '');
    setMotoristaId(defaultValues.motoristaId || '');
    setPatronId(defaultValues.patronId || '');
    setEmbarcacionId(defaultValues.embarcacionId || '');
    setFaenaPescaId(defaultValues.faenaPescaId || '');
    setTemporadaPescaId(defaultValues.temporadaPescaId || '');
    setFechaHoraInicio(defaultValues.fechaHoraInicio ? new Date(defaultValues.fechaHoraInicio) : new Date());
    setFechaHoraFin(defaultValues.fechaHoraFin ? new Date(defaultValues.fechaHoraFin) : new Date());
    setLatitud(defaultValues.latitud || 0);
    setLongitud(defaultValues.longitud || 0);
    setProfundidadM(defaultValues.profundidadM || 0);
    setToneladasCapturadas(defaultValues.toneladasCapturadas || 0);
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      bahiaId: bahiaId ? Number(bahiaId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      patronId: patronId ? Number(patronId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      temporadaPescaId: temporadaPescaId ? Number(temporadaPescaId) : null,
      fechaHoraInicio,
      fechaHoraFin,
      latitud,
      longitud,
      profundidadM,
      toneladasCapturadas,
      observaciones
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="bahiaId">Bahía*</label>
        <InputText id="bahiaId" value={bahiaId} onChange={e => setBahiaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="motoristaId">Motorista*</label>
        <InputText id="motoristaId" value={motoristaId} onChange={e => setMotoristaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="patronId">Patrón*</label>
        <InputText id="patronId" value={patronId} onChange={e => setPatronId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="embarcacionId">Embarcación*</label>
        <InputText id="embarcacionId" value={embarcacionId} onChange={e => setEmbarcacionId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="faenaPescaId">Faena Pesca*</label>
        <InputText id="faenaPescaId" value={faenaPescaId} onChange={e => setFaenaPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="temporadaPescaId">Temporada*</label>
        <InputText id="temporadaPescaId" value={temporadaPescaId} onChange={e => setTemporadaPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaHoraInicio">Fecha Hora Inicio*</label>
        <Calendar id="fechaHoraInicio" value={fechaHoraInicio} onChange={e => setFechaHoraInicio(e.value)} showIcon showTime dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="fechaHoraFin">Fecha Hora Fin*</label>
        <Calendar id="fechaHoraFin" value={fechaHoraFin} onChange={e => setFechaHoraFin(e.value)} showIcon showTime dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="latitud">Latitud</label>
        <InputNumber id="latitud" value={latitud} onValueChange={e => setLatitud(e.value)} mode="decimal" minFractionDigits={6} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="longitud">Longitud</label>
        <InputNumber id="longitud" value={longitud} onValueChange={e => setLongitud(e.value)} mode="decimal" minFractionDigits={6} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="profundidadM">Profundidad (m)</label>
        <InputNumber id="profundidadM" value={profundidadM} onValueChange={e => setProfundidadM(e.value)} mode="decimal" minFractionDigits={2} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="toneladasCapturadas">Toneladas Capturadas</label>
        <InputNumber id="toneladasCapturadas" value={toneladasCapturadas} onValueChange={e => setToneladasCapturadas(e.value)} mode="decimal" minFractionDigits={2} disabled={loading} />
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
