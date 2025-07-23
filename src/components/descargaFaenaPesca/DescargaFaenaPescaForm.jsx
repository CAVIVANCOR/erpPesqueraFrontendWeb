// src/components/descargaFaenaPesca/DescargaFaenaPescaForm.jsx
// Formulario profesional para DescargaFaenaPesca. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function DescargaFaenaPescaForm({ isEdit, defaultValues, faenas, puertos, onSubmit, onCancel, loading }) {
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faenaPescaId || null);
  const [temporadaPescaId, setTemporadaPescaId] = React.useState(defaultValues.temporadaPescaId || '');
  const [puertoDescargaId, setPuertoDescargaId] = React.useState(defaultValues.puertoDescargaId || null);
  const [fechaHoraArriboPuerto, setFechaHoraArriboPuerto] = React.useState(defaultValues.fechaHoraArriboPuerto ? new Date(defaultValues.fechaHoraArriboPuerto) : new Date());
  const [fechaHoraLlegadaPuerto, setFechaHoraLlegadaPuerto] = React.useState(defaultValues.fechaHoraLlegadaPuerto ? new Date(defaultValues.fechaHoraLlegadaPuerto) : new Date());
  const [clienteId, setClienteId] = React.useState(defaultValues.clienteId || '');
  const [numPlataformaDescarga, setNumPlataformaDescarga] = React.useState(defaultValues.numPlataformaDescarga || '');
  const [turnoPlataformaDescarga, setTurnoPlataformaDescarga] = React.useState(defaultValues.turnoPlataformaDescarga || '');
  const [fechaHoraInicioDescarga, setFechaHoraInicioDescarga] = React.useState(defaultValues.fechaHoraInicioDescarga ? new Date(defaultValues.fechaHoraInicioDescarga) : new Date());
  const [fechaHoraFinDescarga, setFechaHoraFinDescarga] = React.useState(defaultValues.fechaHoraFinDescarga ? new Date(defaultValues.fechaHoraFinDescarga) : new Date());
  const [numWinchaPesaje, setNumWinchaPesaje] = React.useState(defaultValues.numWinchaPesaje || '');
  const [urlComprobanteWincha, setUrlComprobanteWincha] = React.useState(defaultValues.urlComprobanteWincha || '');
  const [patroId, setPatroId] = React.useState(defaultValues.patroId || '');
  const [motoristaId, setMotoristaId] = React.useState(defaultValues.motoristaId || '');
  const [bahiaId, setBahiaId] = React.useState(defaultValues.bahiaId || '');
  const [latitud, setLatitud] = React.useState(defaultValues.latitud || 0);
  const [longitud, setLongitud] = React.useState(defaultValues.longitud || 0);
  const [fechaDescarga, setFechaDescarga] = React.useState(defaultValues.fechaDescarga ? new Date(defaultValues.fechaDescarga) : new Date());
  const [combustibleAbastecidoGalones, setCombustibleAbastecidoGalones] = React.useState(defaultValues.combustibleAbastecidoGalones || 0);
  const [urlValeAbastecimiento, setUrlValeAbastecimiento] = React.useState(defaultValues.urlValeAbastecimiento || '');
  const [urlInformeDescargaProduce, setUrlInformeDescargaProduce] = React.useState(defaultValues.urlInformeDescargaProduce || '');
  const [movIngresoAlmacenId, setMovIngresoAlmacenId] = React.useState(defaultValues.movIngresoAlmacenId || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setFaenaPescaId(defaultValues.faenaPescaId ? Number(defaultValues.faenaPescaId) : null);
    setTemporadaPescaId(defaultValues.temporadaPescaId || '');
    setPuertoDescargaId(defaultValues.puertoDescargaId ? Number(defaultValues.puertoDescargaId) : null);
    setFechaHoraArriboPuerto(defaultValues.fechaHoraArriboPuerto ? new Date(defaultValues.fechaHoraArriboPuerto) : new Date());
    setFechaHoraLlegadaPuerto(defaultValues.fechaHoraLlegadaPuerto ? new Date(defaultValues.fechaHoraLlegadaPuerto) : new Date());
    setClienteId(defaultValues.clienteId || '');
    setNumPlataformaDescarga(defaultValues.numPlataformaDescarga || '');
    setTurnoPlataformaDescarga(defaultValues.turnoPlataformaDescarga || '');
    setFechaHoraInicioDescarga(defaultValues.fechaHoraInicioDescarga ? new Date(defaultValues.fechaHoraInicioDescarga) : new Date());
    setFechaHoraFinDescarga(defaultValues.fechaHoraFinDescarga ? new Date(defaultValues.fechaHoraFinDescarga) : new Date());
    setNumWinchaPesaje(defaultValues.numWinchaPesaje || '');
    setUrlComprobanteWincha(defaultValues.urlComprobanteWincha || '');
    setPatroId(defaultValues.patroId || '');
    setMotoristaId(defaultValues.motoristaId || '');
    setBahiaId(defaultValues.bahiaId || '');
    setLatitud(defaultValues.latitud || 0);
    setLongitud(defaultValues.longitud || 0);
    setFechaDescarga(defaultValues.fechaDescarga ? new Date(defaultValues.fechaDescarga) : new Date());
    setCombustibleAbastecidoGalones(defaultValues.combustibleAbastecidoGalones || 0);
    setUrlValeAbastecimiento(defaultValues.urlValeAbastecimiento || '');
    setUrlInformeDescargaProduce(defaultValues.urlInformeDescargaProduce || '');
    setMovIngresoAlmacenId(defaultValues.movIngresoAlmacenId || '');
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      temporadaPescaId: temporadaPescaId ? Number(temporadaPescaId) : null,
      puertoDescargaId: puertoDescargaId ? Number(puertoDescargaId) : null,
      fechaHoraArriboPuerto,
      fechaHoraLlegadaPuerto,
      clienteId: clienteId ? Number(clienteId) : null,
      numPlataformaDescarga,
      turnoPlataformaDescarga,
      fechaHoraInicioDescarga,
      fechaHoraFinDescarga,
      numWinchaPesaje,
      urlComprobanteWincha,
      patroId: patroId ? Number(patroId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      bahiaId: bahiaId ? Number(bahiaId) : null,
      latitud,
      longitud,
      fechaDescarga,
      combustibleAbastecidoGalones,
      urlValeAbastecimiento,
      urlInformeDescargaProduce,
      movIngresoAlmacenId: movIngresoAlmacenId ? Number(movIngresoAlmacenId) : null,
      observaciones
    });
  };

  // Normalizar opciones para los dropdowns
  const faenasOptions = faenas.map(f => ({ 
    ...f, 
    id: Number(f.id),
    label: `Faena ${f.id}`,
    value: Number(f.id)
  }));

  const puertosOptions = puertos.map(p => ({ 
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
            <label htmlFor="faenaPescaId">Faena Pesca*</label>
            <Dropdown
              id="faenaPescaId"
              value={faenaPescaId ? Number(faenaPescaId) : null}
              options={faenasOptions}
              onChange={e => setFaenaPescaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar faena"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="puertoDescargaId">Puerto Descarga*</label>
            <Dropdown
              id="puertoDescargaId"
              value={puertoDescargaId ? Number(puertoDescargaId) : null}
              options={puertosOptions}
              onChange={e => setPuertoDescargaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar puerto"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="temporadaPescaId">Temporada Pesca ID*</label>
            <InputText id="temporadaPescaId" value={temporadaPescaId} onChange={e => setTemporadaPescaId(e.target.value)} required disabled={loading} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="clienteId">Cliente ID*</label>
            <InputText id="clienteId" value={clienteId} onChange={e => setClienteId(e.target.value)} required disabled={loading} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaHoraArriboPuerto">Fecha Arribo Puerto*</label>
            <Calendar id="fechaHoraArriboPuerto" value={fechaHoraArriboPuerto} onChange={e => setFechaHoraArriboPuerto(e.value)} showIcon showTime hourFormat="24" disabled={loading} required />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaHoraLlegadaPuerto">Fecha Llegada Puerto*</label>
            <Calendar id="fechaHoraLlegadaPuerto" value={fechaHoraLlegadaPuerto} onChange={e => setFechaHoraLlegadaPuerto(e.value)} showIcon showTime hourFormat="24" disabled={loading} required />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numPlataformaDescarga">Plataforma Descarga</label>
            <InputText id="numPlataformaDescarga" value={numPlataformaDescarga} onChange={e => setNumPlataformaDescarga(e.target.value)} disabled={loading} maxLength={20} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="turnoPlataformaDescarga">Turno Plataforma</label>
            <InputText id="turnoPlataformaDescarga" value={turnoPlataformaDescarga} onChange={e => setTurnoPlataformaDescarga(e.target.value)} disabled={loading} maxLength={20} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaHoraInicioDescarga">Inicio Descarga*</label>
            <Calendar id="fechaHoraInicioDescarga" value={fechaHoraInicioDescarga} onChange={e => setFechaHoraInicioDescarga(e.value)} showIcon showTime hourFormat="24" disabled={loading} required />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaHoraFinDescarga">Fin Descarga*</label>
            <Calendar id="fechaHoraFinDescarga" value={fechaHoraFinDescarga} onChange={e => setFechaHoraFinDescarga(e.value)} showIcon showTime hourFormat="24" disabled={loading} required />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="combustibleAbastecidoGalones">Combustible (Galones)*</label>
            <InputNumber id="combustibleAbastecidoGalones" value={combustibleAbastecidoGalones} onValueChange={e => setCombustibleAbastecidoGalones(e.value)} mode="decimal" minFractionDigits={2} maxFractionDigits={2} required disabled={loading} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaDescarga">Fecha Descarga*</label>
            <Calendar id="fechaDescarga" value={fechaDescarga} onChange={e => setFechaDescarga(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="latitud">Latitud</label>
            <InputNumber id="latitud" value={latitud} onValueChange={e => setLatitud(e.value)} mode="decimal" minFractionDigits={6} maxFractionDigits={6} disabled={loading} />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="longitud">Longitud</label>
            <InputNumber id="longitud" value={longitud} onValueChange={e => setLongitud(e.value)} mode="decimal" minFractionDigits={6} maxFractionDigits={6} disabled={loading} />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea id="observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} disabled={loading} />
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
