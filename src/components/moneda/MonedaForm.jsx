// src/components/moneda/MonedaForm.jsx
// Formulario profesional para Moneda. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function MonedaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [codigoSunat, setCodigoSunat] = React.useState(defaultValues.codigoSunat || '');
  const [nombreLargo, setNombreLargo] = React.useState(defaultValues.nombreLargo || '');
  const [simbolo, setSimbolo] = React.useState(defaultValues.simbolo || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setCodigoSunat(defaultValues.codigoSunat || '');
    setNombreLargo(defaultValues.nombreLargo || '');
    setSimbolo(defaultValues.simbolo || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ codigoSunat, nombreLargo, simbolo, activo });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="codigoSunat">Código Sunat*</label>
        <InputText id="codigoSunat" value={codigoSunat} onChange={e => setCodigoSunat(e.target.value)} required disabled={loading} maxLength={10} />
      </div>
      <div className="p-field">
        <label htmlFor="nombreLargo">Nombre Largo</label>
        <InputText id="nombreLargo" value={nombreLargo} onChange={e => setNombreLargo(e.target.value)} disabled={loading} maxLength={80} />
      </div>
      <div className="p-field">
        <label htmlFor="simbolo">Símbolo</label>
        <InputText id="simbolo" value={simbolo} onChange={e => setSimbolo(e.target.value)} disabled={loading} maxLength={10} />
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
