// src/components/banco/BancoForm.jsx
// Formulario profesional para Banco. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

export default function BancoForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [codigoSwift, setCodigoSwift] = React.useState(defaultValues.codigoSwift || '');
  const [codigoBcrp, setCodigoBcrp] = React.useState(defaultValues.codigoBcrp || '');
  const [paisId, setPaisId] = React.useState(defaultValues.paisId || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setCodigoSwift(defaultValues.codigoSwift || '');
    setCodigoBcrp(defaultValues.codigoBcrp || '');
    setPaisId(defaultValues.paisId || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      codigoSwift,
      codigoBcrp,
      paisId: paisId ? Number(paisId) : null,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} maxLength={100} />
      </div>
      <div className="p-field">
        <label htmlFor="codigoSwift">Código SWIFT</label>
        <InputText id="codigoSwift" value={codigoSwift} onChange={e => setCodigoSwift(e.target.value)} disabled={loading} maxLength={20} />
      </div>
      <div className="p-field">
        <label htmlFor="codigoBcrp">Código BCRP</label>
        <InputText id="codigoBcrp" value={codigoBcrp} onChange={e => setCodigoBcrp(e.target.value)} disabled={loading} maxLength={20} />
      </div>
      <div className="p-field">
        <label htmlFor="paisId">País (ID)</label>
        <InputText id="paisId" value={paisId} onChange={e => setPaisId(e.target.value)} disabled={loading} />
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
