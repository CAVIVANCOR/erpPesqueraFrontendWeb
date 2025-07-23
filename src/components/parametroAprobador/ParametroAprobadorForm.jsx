// src/components/parametroAprobador/ParametroAprobadorForm.jsx
// Formulario profesional para ParametroAprobador. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';

export default function ParametroAprobadorForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [personalRespId, setPersonalRespId] = React.useState(defaultValues.personalRespId || '');
  const [moduloSistemaId, setModuloSistemaId] = React.useState(defaultValues.moduloSistemaId || '');
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || '');
  const [embarcacionId, setEmbarcacionId] = React.useState(defaultValues.embarcacionId || '');
  const [sedeId, setSedeId] = React.useState(defaultValues.sedeId || '');
  const [vigenteDesde, setVigenteDesde] = React.useState(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : null);
  const [vigenteHasta, setVigenteHasta] = React.useState(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
  const [cesado, setCesado] = React.useState(!!defaultValues.cesado);

  React.useEffect(() => {
    setPersonalRespId(defaultValues.personalRespId || '');
    setModuloSistemaId(defaultValues.moduloSistemaId || '');
    setEmpresaId(defaultValues.empresaId || '');
    setEmbarcacionId(defaultValues.embarcacionId || '');
    setSedeId(defaultValues.sedeId || '');
    setVigenteDesde(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : null);
    setVigenteHasta(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
    setCesado(!!defaultValues.cesado);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      personalRespId: Number(personalRespId),
      moduloSistemaId: Number(moduloSistemaId),
      empresaId: Number(empresaId),
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      sedeId: sedeId ? Number(sedeId) : null,
      vigenteDesde,
      vigenteHasta,
      cesado
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="personalRespId">Personal Responsable*</label>
        <InputText id="personalRespId" value={personalRespId} onChange={e => setPersonalRespId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="moduloSistemaId">Módulo Sistema*</label>
        <InputText id="moduloSistemaId" value={moduloSistemaId} onChange={e => setModuloSistemaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="empresaId">Empresa*</label>
        <InputText id="empresaId" value={empresaId} onChange={e => setEmpresaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="embarcacionId">Embarcación</label>
        <InputText id="embarcacionId" value={embarcacionId} onChange={e => setEmbarcacionId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="sedeId">Sede</label>
        <InputText id="sedeId" value={sedeId} onChange={e => setSedeId(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="vigenteDesde">Vigente Desde*</label>
        <Calendar id="vigenteDesde" value={vigenteDesde} onChange={e => setVigenteDesde(e.value)} required showIcon disabled={loading} dateFormat="yy-mm-dd" />
      </div>
      <div className="p-field">
        <label htmlFor="vigenteHasta">Vigente Hasta</label>
        <Calendar id="vigenteHasta" value={vigenteHasta} onChange={e => setVigenteHasta(e.value)} showIcon disabled={loading} dateFormat="yy-mm-dd" />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="cesado" checked={cesado} onChange={e => setCesado(e.checked)} disabled={loading} />
        <label htmlFor="cesado">Cesado</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
