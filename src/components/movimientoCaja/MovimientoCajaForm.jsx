// src/components/movimientoCaja/MovimientoCajaForm.jsx
// Formulario profesional para MovimientoCaja. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';

export default function MovimientoCajaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [empresaOrigenId, setEmpresaOrigenId] = React.useState(defaultValues.empresaOrigenId || '');
  const [cuentaCorrienteOrigenId, setCuentaCorrienteOrigenId] = React.useState(defaultValues.cuentaCorrienteOrigenId || '');
  const [empresaDestinoId, setEmpresaDestinoId] = React.useState(defaultValues.empresaDestinoId || '');
  const [cuentaCorrienteDestinoId, setCuentaCorrienteDestinoId] = React.useState(defaultValues.cuentaCorrienteDestinoId || '');
  const [fecha, setFecha] = React.useState(defaultValues.fecha ? new Date(defaultValues.fecha) : new Date());
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(defaultValues.tipoMovimientoId || '');
  const [monto, setMonto] = React.useState(defaultValues.monto || 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [referenciaExtId, setReferenciaExtId] = React.useState(defaultValues.referenciaExtId || '');
  const [tipoReferenciaId, setTipoReferenciaId] = React.useState(defaultValues.tipoReferenciaId || '');
  const [usuarioId, setUsuarioId] = React.useState(defaultValues.usuarioId || '');
  const [estadoId, setEstadoId] = React.useState(defaultValues.estadoId || '');

  React.useEffect(() => {
    setEmpresaOrigenId(defaultValues.empresaOrigenId || '');
    setCuentaCorrienteOrigenId(defaultValues.cuentaCorrienteOrigenId || '');
    setEmpresaDestinoId(defaultValues.empresaDestinoId || '');
    setCuentaCorrienteDestinoId(defaultValues.cuentaCorrienteDestinoId || '');
    setFecha(defaultValues.fecha ? new Date(defaultValues.fecha) : new Date());
    setTipoMovimientoId(defaultValues.tipoMovimientoId || '');
    setMonto(defaultValues.monto || 0);
    setMonedaId(defaultValues.monedaId || '');
    setDescripcion(defaultValues.descripcion || '');
    setReferenciaExtId(defaultValues.referenciaExtId || '');
    setTipoReferenciaId(defaultValues.tipoReferenciaId || '');
    setUsuarioId(defaultValues.usuarioId || '');
    setEstadoId(defaultValues.estadoId || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaOrigenId: empresaOrigenId ? Number(empresaOrigenId) : null,
      cuentaCorrienteOrigenId: cuentaCorrienteOrigenId ? Number(cuentaCorrienteOrigenId) : null,
      empresaDestinoId: empresaDestinoId ? Number(empresaDestinoId) : null,
      cuentaCorrienteDestinoId: cuentaCorrienteDestinoId ? Number(cuentaCorrienteDestinoId) : null,
      fecha,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      monto,
      monedaId: monedaId ? Number(monedaId) : null,
      descripcion,
      referenciaExtId,
      tipoReferenciaId: tipoReferenciaId ? Number(tipoReferenciaId) : null,
      usuarioId: usuarioId ? Number(usuarioId) : null,
      estadoId: estadoId ? Number(estadoId) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaOrigenId">Empresa Origen*</label>
        <InputText id="empresaOrigenId" value={empresaOrigenId} onChange={e => setEmpresaOrigenId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="cuentaCorrienteOrigenId">Cuenta Origen*</label>
        <InputText id="cuentaCorrienteOrigenId" value={cuentaCorrienteOrigenId} onChange={e => setCuentaCorrienteOrigenId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="empresaDestinoId">Empresa Destino*</label>
        <InputText id="empresaDestinoId" value={empresaDestinoId} onChange={e => setEmpresaDestinoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="cuentaCorrienteDestinoId">Cuenta Destino*</label>
        <InputText id="cuentaCorrienteDestinoId" value={cuentaCorrienteDestinoId} onChange={e => setCuentaCorrienteDestinoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fecha">Fecha*</label>
        <Calendar id="fecha" value={fecha} onChange={e => setFecha(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="tipoMovimientoId">Tipo Movimiento*</label>
        <InputText id="tipoMovimientoId" value={tipoMovimientoId} onChange={e => setTipoMovimientoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="monto">Monto*</label>
        <InputNumber id="monto" value={monto} onValueChange={e => setMonto(e.value)} mode="decimal" minFractionDigits={2} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="monedaId">Moneda*</label>
        <InputText id="monedaId" value={monedaId} onChange={e => setMonedaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="referenciaExtId">Referencia Ext</label>
        <InputText id="referenciaExtId" value={referenciaExtId} onChange={e => setReferenciaExtId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="tipoReferenciaId">Tipo Referencia</label>
        <InputText id="tipoReferenciaId" value={tipoReferenciaId} onChange={e => setTipoReferenciaId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="usuarioId">Usuario</label>
        <InputText id="usuarioId" value={usuarioId} onChange={e => setUsuarioId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="estadoId">Estado*</label>
        <InputText id="estadoId" value={estadoId} onChange={e => setEstadoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
