// src/components/asientoContableInterfaz/AsientoContableInterfazForm.jsx
// Formulario profesional para AsientoContableInterfaz. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';

export default function AsientoContableInterfazForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [movimientoCajaId, setMovimientoCajaId] = React.useState(defaultValues.movimientoCajaId || '');
  const [fechaContable, setFechaContable] = React.useState(defaultValues.fechaContable ? new Date(defaultValues.fechaContable) : new Date());
  const [cuentaContable, setCuentaContable] = React.useState(defaultValues.cuentaContable || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [debe, setDebe] = React.useState(defaultValues.debe || 0);
  const [haber, setHaber] = React.useState(defaultValues.haber || 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || '');
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || '');
  const [referenciaExtId, setReferenciaExtId] = React.useState(defaultValues.referenciaExtId || '');
  const [tipoReferenciaId, setTipoReferenciaId] = React.useState(defaultValues.tipoReferenciaId || '');
  const [estado, setEstado] = React.useState(defaultValues.estado || '');
  const [fechaEnvio, setFechaEnvio] = React.useState(defaultValues.fechaEnvio ? new Date(defaultValues.fechaEnvio) : null);

  React.useEffect(() => {
    setMovimientoCajaId(defaultValues.movimientoCajaId || '');
    setFechaContable(defaultValues.fechaContable ? new Date(defaultValues.fechaContable) : new Date());
    setCuentaContable(defaultValues.cuentaContable || '');
    setDescripcion(defaultValues.descripcion || '');
    setDebe(defaultValues.debe || 0);
    setHaber(defaultValues.haber || 0);
    setMonedaId(defaultValues.monedaId || '');
    setEmpresaId(defaultValues.empresaId || '');
    setReferenciaExtId(defaultValues.referenciaExtId || '');
    setTipoReferenciaId(defaultValues.tipoReferenciaId || '');
    setEstado(defaultValues.estado || '');
    setFechaEnvio(defaultValues.fechaEnvio ? new Date(defaultValues.fechaEnvio) : null);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      movimientoCajaId: movimientoCajaId ? Number(movimientoCajaId) : null,
      fechaContable,
      cuentaContable,
      descripcion,
      debe,
      haber,
      monedaId: monedaId ? Number(monedaId) : null,
      empresaId: empresaId ? Number(empresaId) : null,
      referenciaExtId,
      tipoReferenciaId: tipoReferenciaId ? Number(tipoReferenciaId) : null,
      estado,
      fechaEnvio
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="movimientoCajaId">Movimiento Caja*</label>
        <InputText id="movimientoCajaId" value={movimientoCajaId} onChange={e => setMovimientoCajaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaContable">Fecha Contable*</label>
        <Calendar id="fechaContable" value={fechaContable} onChange={e => setFechaContable(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-field">
        <label htmlFor="cuentaContable">Cuenta Contable*</label>
        <InputText id="cuentaContable" value={cuentaContable} onChange={e => setCuentaContable(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="debe">Debe*</label>
        <InputNumber id="debe" value={debe} onValueChange={e => setDebe(e.value)} mode="decimal" minFractionDigits={2} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="haber">Haber*</label>
        <InputNumber id="haber" value={haber} onValueChange={e => setHaber(e.value)} mode="decimal" minFractionDigits={2} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="monedaId">Moneda*</label>
        <InputText id="monedaId" value={monedaId} onChange={e => setMonedaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="empresaId">Empresa*</label>
        <InputText id="empresaId" value={empresaId} onChange={e => setEmpresaId(e.target.value)} required disabled={loading} />
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
        <label htmlFor="estado">Estado*</label>
        <InputText id="estado" value={estado} onChange={e => setEstado(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaEnvio">Fecha Envío</label>
        <Calendar id="fechaEnvio" value={fechaEnvio} onChange={e => setFechaEnvio(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
