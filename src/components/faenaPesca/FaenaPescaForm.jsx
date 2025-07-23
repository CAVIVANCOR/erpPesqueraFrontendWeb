// src/components/faenaPesca/FaenaPescaForm.jsx
// Formulario profesional para FaenaPesca. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';

export default function FaenaPescaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [temporadaId, setTemporadaId] = React.useState(defaultValues.temporadaId || '');
  const [bahiaId, setBahiaId] = React.useState(defaultValues.bahiaId || '');
  const [motoristaId, setMotoristaId] = React.useState(defaultValues.motoristaId || '');
  const [patronId, setPatronId] = React.useState(defaultValues.patronId || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [fechaSalida, setFechaSalida] = React.useState(defaultValues.fechaSalida ? new Date(defaultValues.fechaSalida) : new Date());
  const [fechaRetorno, setFechaRetorno] = React.useState(defaultValues.fechaRetorno ? new Date(defaultValues.fechaRetorno) : new Date());
  const [puertoSalidaId, setPuertoSalidaId] = React.useState(defaultValues.puertoSalidaId || '');
  const [puertoRetornoId, setPuertoRetornoId] = React.useState(defaultValues.puertoRetornoId || '');
  const [puertoDescargaId, setPuertoDescargaId] = React.useState(defaultValues.puertoDescargaId || '');
  const [embarcacionId, setEmbarcacionId] = React.useState(defaultValues.embarcacionId || '');
  const [bolicheRedId, setBolicheRedId] = React.useState(defaultValues.bolicheRedId || '');
  const [urlInformeFaena, setUrlInformeFaena] = React.useState(defaultValues.urlInformeFaena || '');

  React.useEffect(() => {
    setTemporadaId(defaultValues.temporadaId || '');
    setBahiaId(defaultValues.bahiaId || '');
    setMotoristaId(defaultValues.motoristaId || '');
    setPatronId(defaultValues.patronId || '');
    setDescripcion(defaultValues.descripcion || '');
    setFechaSalida(defaultValues.fechaSalida ? new Date(defaultValues.fechaSalida) : new Date());
    setFechaRetorno(defaultValues.fechaRetorno ? new Date(defaultValues.fechaRetorno) : new Date());
    setPuertoSalidaId(defaultValues.puertoSalidaId || '');
    setPuertoRetornoId(defaultValues.puertoRetornoId || '');
    setPuertoDescargaId(defaultValues.puertoDescargaId || '');
    setEmbarcacionId(defaultValues.embarcacionId || '');
    setBolicheRedId(defaultValues.bolicheRedId || '');
    setUrlInformeFaena(defaultValues.urlInformeFaena || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      temporadaId: temporadaId ? Number(temporadaId) : null,
      bahiaId: bahiaId ? Number(bahiaId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      patronId: patronId ? Number(patronId) : null,
      descripcion,
      fechaSalida,
      fechaRetorno,
      puertoSalidaId: puertoSalidaId ? Number(puertoSalidaId) : null,
      puertoRetornoId: puertoRetornoId ? Number(puertoRetornoId) : null,
      puertoDescargaId: puertoDescargaId ? Number(puertoDescargaId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      bolicheRedId: bolicheRedId ? Number(bolicheRedId) : null,
      urlInformeFaena
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="temporadaId">Temporada*</label>
        <InputText id="temporadaId" value={temporadaId} onChange={e => setTemporadaId(e.target.value)} required disabled={loading} />
      </div>
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
        <label htmlFor="descripcion">Descripción</label>
        <InputTextarea id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaSalida">Fecha Salida*</label>
        <Calendar id="fechaSalida" value={fechaSalida} onChange={e => setFechaSalida(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="fechaRetorno">Fecha Retorno*</label>
        <Calendar id="fechaRetorno" value={fechaRetorno} onChange={e => setFechaRetorno(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="puertoSalidaId">Puerto Salida*</label>
        <InputText id="puertoSalidaId" value={puertoSalidaId} onChange={e => setPuertoSalidaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="puertoRetornoId">Puerto Retorno*</label>
        <InputText id="puertoRetornoId" value={puertoRetornoId} onChange={e => setPuertoRetornoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="puertoDescargaId">Puerto Descarga*</label>
        <InputText id="puertoDescargaId" value={puertoDescargaId} onChange={e => setPuertoDescargaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="embarcacionId">Embarcación</label>
        <InputText id="embarcacionId" value={embarcacionId} onChange={e => setEmbarcacionId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="bolicheRedId">Boliche Red</label>
        <InputText id="bolicheRedId" value={bolicheRedId} onChange={e => setBolicheRedId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="urlInformeFaena">URL Informe Faena</label>
        <InputText id="urlInformeFaena" value={urlInformeFaena} onChange={e => setUrlInformeFaena(e.target.value)} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
