// src/components/entregaARendir/EntregaARendirForm.jsx
// Formulario profesional para EntregaARendir. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';

export default function EntregaARendirForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [temporadaPescaId, setTemporadaPescaId] = React.useState(defaultValues.temporadaPescaId || '');
  const [respEntregaRendirId, setRespEntregaRendirId] = React.useState(defaultValues.respEntregaRendirId || '');
  const [entregaLiquidada, setEntregaLiquidada] = React.useState(defaultValues.entregaLiquidada !== undefined ? !!defaultValues.entregaLiquidada : false);
  const [fechaLiquidacion, setFechaLiquidacion] = React.useState(defaultValues.fechaLiquidacion ? new Date(defaultValues.fechaLiquidacion) : null);
  const [centroCostoId, setCentroCostoId] = React.useState(defaultValues.centroCostoId || '');

  React.useEffect(() => {
    setTemporadaPescaId(defaultValues.temporadaPescaId || '');
    setRespEntregaRendirId(defaultValues.respEntregaRendirId || '');
    setEntregaLiquidada(defaultValues.entregaLiquidada !== undefined ? !!defaultValues.entregaLiquidada : false);
    setFechaLiquidacion(defaultValues.fechaLiquidacion ? new Date(defaultValues.fechaLiquidacion) : null);
    setCentroCostoId(defaultValues.centroCostoId || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      temporadaPescaId: temporadaPescaId ? Number(temporadaPescaId) : null,
      respEntregaRendirId: respEntregaRendirId ? Number(respEntregaRendirId) : null,
      entregaLiquidada,
      fechaLiquidacion,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="temporadaPescaId">Temporada Pesca*</label>
        <InputText id="temporadaPescaId" value={temporadaPescaId} onChange={e => setTemporadaPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="respEntregaRendirId">Responsable*</label>
        <InputText id="respEntregaRendirId" value={respEntregaRendirId} onChange={e => setRespEntregaRendirId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="centroCostoId">Centro de Costo*</label>
        <InputText id="centroCostoId" value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="entregaLiquidada" checked={entregaLiquidada} onChange={e => setEntregaLiquidada(e.checked)} disabled={loading} />
        <label htmlFor="entregaLiquidada">Entrega Liquidada</label>
      </div>
      <div className="p-field">
        <label htmlFor="fechaLiquidacion">Fecha Liquidación</label>
        <Calendar id="fechaLiquidacion" value={fechaLiquidacion} onChange={e => setFechaLiquidacion(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
