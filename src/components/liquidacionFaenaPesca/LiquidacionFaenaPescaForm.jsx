// src/components/liquidacionFaenaPesca/LiquidacionFaenaPescaForm.jsx
// Formulario profesional para LiquidacionFaenaPesca. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function LiquidacionFaenaPescaForm({ isEdit, defaultValues, faenas, onSubmit, onCancel, loading }) {
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faena_pesca_id || null);
  const [temporadaPescaId, setTemporadaPescaId] = React.useState(defaultValues.temporada_pesca_id || '');
  const [fechaLiquidacion, setFechaLiquidacion] = React.useState(defaultValues.fecha_liquidacion ? new Date(defaultValues.fecha_liquidacion) : new Date());
  const [responsableId, setResponsableId] = React.useState(defaultValues.responsable_id || '');
  const [verificadorId, setVerificadorId] = React.useState(defaultValues.verificadorId || '');
  const [fechaVerificacion, setFechaVerificacion] = React.useState(defaultValues.fechaVerificacion ? new Date(defaultValues.fechaVerificacion) : null);
  const [urlPdfLiquidacion, setUrlPdfLiquidacion] = React.useState(defaultValues.urlPdfLiquidacion || '');
  const [saldoInicial, setSaldoInicial] = React.useState(defaultValues.saldo_inicial || 0);
  const [saldoFinal, setSaldoFinal] = React.useState(defaultValues.saldo_final || 0);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setFaenaPescaId(defaultValues.faena_pesca_id ? Number(defaultValues.faena_pesca_id) : null);
    setTemporadaPescaId(defaultValues.temporada_pesca_id || '');
    setFechaLiquidacion(defaultValues.fecha_liquidacion ? new Date(defaultValues.fecha_liquidacion) : new Date());
    setResponsableId(defaultValues.responsable_id || '');
    setVerificadorId(defaultValues.verificadorId || '');
    setFechaVerificacion(defaultValues.fechaVerificacion ? new Date(defaultValues.fechaVerificacion) : null);
    setUrlPdfLiquidacion(defaultValues.urlPdfLiquidacion || '');
    setSaldoInicial(defaultValues.saldo_inicial || 0);
    setSaldoFinal(defaultValues.saldo_final || 0);
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      faena_pesca_id: faenaPescaId ? Number(faenaPescaId) : null,
      temporada_pesca_id: temporadaPescaId ? Number(temporadaPescaId) : null,
      fecha_liquidacion: fechaLiquidacion,
      responsable_id: responsableId ? Number(responsableId) : null,
      verificadorId: verificadorId ? Number(verificadorId) : null,
      fechaVerificacion,
      urlPdfLiquidacion,
      saldo_inicial: saldoInicial,
      saldo_final: saldoFinal,
      observaciones
    });
  };

  // Normalizar opciones para el dropdown de faenas
  const faenasOptions = faenas.map(f => ({ 
    ...f, 
    id: Number(f.id),
    label: `Faena ${f.id}`,
    value: Number(f.id)
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
            <label htmlFor="temporadaPescaId">Temporada Pesca ID*</label>
            <InputText 
              id="temporadaPescaId" 
              value={temporadaPescaId} 
              onChange={e => setTemporadaPescaId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaLiquidacion">Fecha Liquidación*</label>
            <Calendar 
              id="fechaLiquidacion" 
              value={fechaLiquidacion} 
              onChange={e => setFechaLiquidacion(e.value)} 
              showIcon 
              dateFormat="yy-mm-dd" 
              disabled={loading} 
              required 
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="responsableId">Responsable ID*</label>
            <InputText 
              id="responsableId" 
              value={responsableId} 
              onChange={e => setResponsableId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="verificadorId">Verificador ID</label>
            <InputText 
              id="verificadorId" 
              value={verificadorId} 
              onChange={e => setVerificadorId(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaVerificacion">Fecha Verificación</label>
            <Calendar 
              id="fechaVerificacion" 
              value={fechaVerificacion} 
              onChange={e => setFechaVerificacion(e.value)} 
              showIcon 
              showTime 
              hourFormat="24" 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="saldoInicial">Saldo Inicial*</label>
            <InputNumber 
              id="saldoInicial" 
              value={saldoInicial} 
              onValueChange={e => setSaldoInicial(e.value)} 
              mode="decimal" 
              minFractionDigits={2} 
              maxFractionDigits={2} 
              required 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="saldoFinal">Saldo Final*</label>
            <InputNumber 
              id="saldoFinal" 
              value={saldoFinal} 
              onValueChange={e => setSaldoFinal(e.value)} 
              mode="decimal" 
              minFractionDigits={2} 
              maxFractionDigits={2} 
              required 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="urlPdfLiquidacion">URL PDF Liquidación</label>
            <InputText 
              id="urlPdfLiquidacion" 
              value={urlPdfLiquidacion} 
              onChange={e => setUrlPdfLiquidacion(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12">
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
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
