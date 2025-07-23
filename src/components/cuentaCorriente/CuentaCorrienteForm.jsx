// src/components/cuentaCorriente/CuentaCorrienteForm.jsx
// Formulario profesional para CuentaCorriente. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function CuentaCorrienteForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || '');
  const [bancoId, setBancoId] = React.useState(defaultValues.bancoId || '');
  const [numeroCuenta, setNumeroCuenta] = React.useState(defaultValues.numeroCuenta || '');
  const [tipoCuentaCorrienteId, setTipoCuentaCorrienteId] = React.useState(defaultValues.tipoCuentaCorrienteId || '');
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [activa, setActiva] = React.useState(defaultValues.activa !== undefined ? !!defaultValues.activa : true);

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId || '');
    setBancoId(defaultValues.bancoId || '');
    setNumeroCuenta(defaultValues.numeroCuenta || '');
    setTipoCuentaCorrienteId(defaultValues.tipoCuentaCorrienteId || '');
    setMonedaId(defaultValues.monedaId || '');
    setDescripcion(defaultValues.descripcion || '');
    setActiva(defaultValues.activa !== undefined ? !!defaultValues.activa : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      bancoId: bancoId ? Number(bancoId) : null,
      numeroCuenta,
      tipoCuentaCorrienteId: tipoCuentaCorrienteId ? Number(tipoCuentaCorrienteId) : null,
      monedaId: monedaId ? Number(monedaId) : null,
      descripcion,
      activa
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaId">Empresa*</label>
        <InputText id="empresaId" value={empresaId} onChange={e => setEmpresaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="bancoId">Banco*</label>
        <InputText id="bancoId" value={bancoId} onChange={e => setBancoId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="numeroCuenta">Número de Cuenta*</label>
        <InputText id="numeroCuenta" value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} required disabled={loading} maxLength={30} />
      </div>
      <div className="p-field">
        <label htmlFor="tipoCuentaCorrienteId">Tipo Cuenta*</label>
        <InputText id="tipoCuentaCorrienteId" value={tipoCuentaCorrienteId} onChange={e => setTipoCuentaCorrienteId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="monedaId">Moneda*</label>
        <InputText id="monedaId" value={monedaId} onChange={e => setMonedaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="activa" checked={activa} onChange={e => setActiva(e.checked)} disabled={loading} />
        <label htmlFor="activa">Activa</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
