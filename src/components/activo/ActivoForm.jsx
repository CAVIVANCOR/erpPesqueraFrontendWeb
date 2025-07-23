// src/components/activo/ActivoForm.jsx
// Formulario profesional para Activo. Cumple regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function ActivoForm({ isEdit, defaultValues, onSubmit, onCancel, loading, tiposOptions, empresaOptions }) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || '');
  const [tipoId, setTipoId] = React.useState(defaultValues.tipoId || '');
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [cesado, setCesado] = React.useState(!!defaultValues.cesado);

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId || '');
    setTipoId(defaultValues.tipoId || '');
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setCesado(!!defaultValues.cesado);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ empresaId: Number(empresaId), tipoId: Number(tipoId), nombre, descripcion, cesado });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaId">Empresa</label>
        <select id="empresaId" value={empresaId} onChange={e => setEmpresaId(e.target.value)} required disabled={loading}>
          <option value="">Seleccione...</option>
          {empresaOptions && empresaOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.nombre}</option>
          ))}
        </select>
      </div>
      <div className="p-field">
        <label htmlFor="tipoId">Tipo de Activo</label>
        <select id="tipoId" value={tipoId} onChange={e => setTipoId(e.target.value)} required disabled={loading}>
          <option value="">Seleccione...</option>
          {tiposOptions && tiposOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.nombre}</option>
          ))}
        </select>
      </div>
      <div className="p-field">
        <label htmlFor="nombre">Nombre</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox inputId="cesado" checked={cesado} onChange={e => setCesado(e.checked)} disabled={loading} />
        <label htmlFor="cesado">¿Cesado?</label>
      </div>
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button label="Cancelar" className="p-button-text p-mr-2" type="button" onClick={onCancel} disabled={loading} />
        <Button label={isEdit ? 'Actualizar' : 'Crear'} icon="pi pi-save" type="submit" loading={loading} />
      </div>
    </form>
  );
}
