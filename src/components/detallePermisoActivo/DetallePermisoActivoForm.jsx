// src/components/detallePermisoActivo/DetallePermisoActivoForm.jsx
// Formulario profesional para DetallePermisoActivo. Cumple regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

export default function DetallePermisoActivoForm({ isEdit, defaultValues, onSubmit, onCancel, loading, permisoOptions, activoOptions }) {
  const [permisoId, setPermisoId] = React.useState(defaultValues.permisoId || '');
  const [activoId, setActivoId] = React.useState(defaultValues.activoId || '');
  const [detalle, setDetalle] = React.useState(defaultValues.detalle || '');

  React.useEffect(() => {
    setPermisoId(defaultValues.permisoId || '');
    setActivoId(defaultValues.activoId || '');
    setDetalle(defaultValues.detalle || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ permisoId: Number(permisoId), activoId: Number(activoId), detalle });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="permisoId">Permiso</label>
        <select id="permisoId" value={permisoId} onChange={e => setPermisoId(e.target.value)} required disabled={loading}>
          <option value="">Seleccione...</option>
          {permisoOptions && permisoOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.nombre}</option>
          ))}
        </select>
      </div>
      <div className="p-field">
        <label htmlFor="activoId">Activo</label>
        <select id="activoId" value={activoId} onChange={e => setActivoId(e.target.value)} required disabled={loading}>
          <option value="">Seleccione...</option>
          {activoOptions && activoOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.nombre}</option>
          ))}
        </select>
      </div>
      <div className="p-field">
        <label htmlFor="detalle">Detalle</label>
        <InputText id="detalle" value={detalle} onChange={e => setDetalle(e.target.value)} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button label="Cancelar" className="p-button-text p-mr-2" type="button" onClick={onCancel} disabled={loading} />
        <Button label={isEdit ? 'Actualizar' : 'Crear'} icon="pi pi-save" type="submit" loading={loading} />
      </div>
    </form>
  );
}
