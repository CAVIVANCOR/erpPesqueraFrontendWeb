// src/components/movLiquidacionFaenaPesca/MovLiquidacionFaenaPescaForm.jsx
// Formulario profesional para MovLiquidacionFaenaPesca. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function MovLiquidacionFaenaPescaForm({ isEdit, defaultValues, liquidaciones, onSubmit, onCancel, loading }) {
  const [liquidacionFaenaId, setLiquidacionFaenaId] = React.useState(defaultValues.liquidacionFaenaId || null);
  const [refDetMovsEntregaRendirId, setRefDetMovsEntregaRendirId] = React.useState(defaultValues.refDetMovsEntregaRendirId || '');
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(defaultValues.tipoMovimientoId || '');
  const [monto, setMonto] = React.useState(defaultValues.monto || 0);
  const [centroCostoId, setCentroCostoId] = React.useState(defaultValues.centroCostoId || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [fechaMovimiento, setFechaMovimiento] = React.useState(defaultValues.fechaMovimiento ? new Date(defaultValues.fechaMovimiento) : new Date());

  React.useEffect(() => {
    setLiquidacionFaenaId(defaultValues.liquidacionFaenaId ? Number(defaultValues.liquidacionFaenaId) : null);
    setRefDetMovsEntregaRendirId(defaultValues.refDetMovsEntregaRendirId || '');
    setTipoMovimientoId(defaultValues.tipoMovimientoId || '');
    setMonto(defaultValues.monto || 0);
    setCentroCostoId(defaultValues.centroCostoId || '');
    setObservaciones(defaultValues.observaciones || '');
    setFechaMovimiento(defaultValues.fechaMovimiento ? new Date(defaultValues.fechaMovimiento) : new Date());
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      liquidacionFaenaId: liquidacionFaenaId ? Number(liquidacionFaenaId) : null,
      refDetMovsEntregaRendirId: refDetMovsEntregaRendirId ? Number(refDetMovsEntregaRendirId) : null,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      monto,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      observaciones,
      fechaMovimiento
    });
  };

  // Normalizar opciones para el dropdown de liquidaciones
  const liquidacionesOptions = liquidaciones.map(l => ({ 
    ...l, 
    id: Number(l.id),
    label: `Liquidación ${l.id}`,
    value: Number(l.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="liquidacionFaenaId">Liquidación Faena*</label>
            <Dropdown
              id="liquidacionFaenaId"
              value={liquidacionFaenaId ? Number(liquidacionFaenaId) : null}
              options={liquidacionesOptions}
              onChange={e => setLiquidacionFaenaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar liquidación"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="refDetMovsEntregaRendirId">Ref Det Movs Entrega Rendir*</label>
            <InputText 
              id="refDetMovsEntregaRendirId" 
              value={refDetMovsEntregaRendirId} 
              onChange={e => setRefDetMovsEntregaRendirId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoMovimientoId">Tipo Movimiento ID*</label>
            <InputText 
              id="tipoMovimientoId" 
              value={tipoMovimientoId} 
              onChange={e => setTipoMovimientoId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="monto">Monto*</label>
            <InputNumber 
              id="monto" 
              value={monto} 
              onValueChange={e => setMonto(e.value)} 
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
            <label htmlFor="centroCostoId">Centro Costo ID</label>
            <InputText 
              id="centroCostoId" 
              value={centroCostoId} 
              onChange={e => setCentroCostoId(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaMovimiento">Fecha Movimiento*</label>
            <Calendar 
              id="fechaMovimiento" 
              value={fechaMovimiento} 
              onChange={e => setFechaMovimiento(e.value)} 
              showIcon 
              showTime 
              hourFormat="24" 
              disabled={loading} 
              required 
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
