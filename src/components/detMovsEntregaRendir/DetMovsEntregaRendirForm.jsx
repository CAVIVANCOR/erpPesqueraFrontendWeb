// src/components/detMovsEntregaRendir/DetMovsEntregaRendirForm.jsx
// Formulario profesional para DetMovsEntregaRendir. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';

export default function DetMovsEntregaRendirForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [entregaARendirId, setEntregaARendirId] = React.useState(defaultValues.entregaARendirId || '');
  const [responsableId, setResponsableId] = React.useState(defaultValues.responsableId || '');
  const [fechaMovimiento, setFechaMovimiento] = React.useState(defaultValues.fechaMovimiento ? new Date(defaultValues.fechaMovimiento) : new Date());
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(defaultValues.tipoMovimientoId || '');
  const [centroCostoId, setCentroCostoId] = React.useState(defaultValues.centroCostoId || '');
  const [monto, setMonto] = React.useState(defaultValues.monto || 0);
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');

  React.useEffect(() => {
    setEntregaARendirId(defaultValues.entregaARendirId || '');
    setResponsableId(defaultValues.responsableId || '');
    setFechaMovimiento(defaultValues.fechaMovimiento ? new Date(defaultValues.fechaMovimiento) : new Date());
    setTipoMovimientoId(defaultValues.tipoMovimientoId || '');
    setCentroCostoId(defaultValues.centroCostoId || '');
    setMonto(defaultValues.monto || 0);
    setDescripcion(defaultValues.descripcion || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entregaARendirId: entregaARendirId ? Number(entregaARendirId) : null,
      responsableId: responsableId ? Number(responsableId) : null,
      fechaMovimiento,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      monto,
      descripcion
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="entregaARendirId">Entrega a Rendir*</label>
        <InputText id="entregaARendirId" value={entregaARendirId} onChange={e => setEntregaARendirId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="responsableId">Responsable*</label>
        <InputText id="responsableId" value={responsableId} onChange={e => setResponsableId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaMovimiento">Fecha Movimiento*</label>
        <Calendar id="fechaMovimiento" value={fechaMovimiento} onChange={e => setFechaMovimiento(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="tipoMovimientoId">Tipo Movimiento*</label>
        <InputText id="tipoMovimientoId" value={tipoMovimientoId} onChange={e => setTipoMovimientoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="centroCostoId">Centro Costo*</label>
        <InputText id="centroCostoId" value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="monto">Monto*</label>
        <InputNumber id="monto" value={monto} onValueChange={e => setMonto(e.value)} mode="decimal" minFractionDigits={2} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputTextarea id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
