// src/components/tipoCuentaCorriente/TipoCuentaCorrienteForm.jsx
// Formulario profesional para TipoCuentaCorriente. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import BooleanToggleButton from '../common/BooleanToggleButton';

export default function TipoCuentaCorrienteForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  const [esTarjetaCredito, setEsTarjetaCredito] = React.useState(!!defaultValues.esTarjetaCredito);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
    setEsTarjetaCredito(!!defaultValues.esTarjetaCredito);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion,
      activo,
      esTarjetaCredito
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label>Tipo de cuenta</label>
        <BooleanToggleButton
          value={esTarjetaCredito}
          onChange={setEsTarjetaCredito}
          labelTrue="ES TARJETA DE CRÉDITO"
          labelFalse="CUENTA BANCARIA / CAJA"
          severityTrue="warning"
          severityFalse="secondary"
          icon={esTarjetaCredito ? "pi-credit-card" : "pi-building"}
          disabled={loading}
        />
        <small>Las cuentas de este tipo se manejan como tarjeta: la deuda no cuenta como caja y se controla contra el límite de crédito.</small>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="activo" checked={activo} onChange={e => setActivo(e.checked)} disabled={loading} />
        <label htmlFor="activo">Activo</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
