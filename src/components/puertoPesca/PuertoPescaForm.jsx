// src/components/puertoPesca/PuertoPescaForm.jsx
// Formulario profesional para PuertoPesca. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';

export default function PuertoPescaForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [zona, setZona] = React.useState(defaultValues.zona || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [provincia, setProvincia] = React.useState(defaultValues.provincia || '');
  const [departamento, setDepartamento] = React.useState(defaultValues.departamento || '');
  const [latitud, setLatitud] = React.useState(defaultValues.latitud || '');
  const [longitud, setLongitud] = React.useState(defaultValues.longitud || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setZona(defaultValues.zona || '');
    setNombre(defaultValues.nombre || '');
    setProvincia(defaultValues.provincia || '');
    setDepartamento(defaultValues.departamento || '');
    setLatitud(defaultValues.latitud || '');
    setLongitud(defaultValues.longitud || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      zona,
      nombre,
      provincia,
      departamento,
      latitud: latitud !== '' ? parseFloat(latitud) : null,
      longitud: longitud !== '' ? parseFloat(longitud) : null,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="zona">Zona*</label>
        <InputText id="zona" value={zona} onChange={e => setZona(e.target.value)} required disabled={loading} maxLength={20} />
      </div>
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} maxLength={100} />
      </div>
      <div className="p-field">
        <label htmlFor="provincia">Provincia</label>
        <InputText id="provincia" value={provincia} onChange={e => setProvincia(e.target.value)} disabled={loading} maxLength={100} />
      </div>
      <div className="p-field">
        <label htmlFor="departamento">Departamento</label>
        <InputText id="departamento" value={departamento} onChange={e => setDepartamento(e.target.value)} disabled={loading} maxLength={100} />
      </div>
      <div className="p-field">
        <label htmlFor="latitud">Latitud</label>
        <InputNumber id="latitud" value={latitud} onValueChange={e => setLatitud(e.value)} disabled={loading} mode="decimal" minFractionDigits={6} maxFractionDigits={8} />
      </div>
      <div className="p-field">
        <label htmlFor="longitud">Longitud</label>
        <InputNumber id="longitud" value={longitud} onValueChange={e => setLongitud(e.value)} disabled={loading} mode="decimal" minFractionDigits={6} maxFractionDigits={8} />
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
