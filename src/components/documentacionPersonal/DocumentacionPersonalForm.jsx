// src/components/documentacionPersonal/DocumentacionPersonalForm.jsx
// Formulario profesional para DocumentacionPersonal. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

export default function DocumentacionPersonalForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [personalId, setPersonalId] = React.useState(defaultValues.personalId || '');
  const [documentoPescaId, setDocumentoPescaId] = React.useState(defaultValues.documentoPescaId || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setPersonalId(defaultValues.personalId || '');
    setDocumentoPescaId(defaultValues.documentoPescaId || '');
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      personalId: personalId ? Number(personalId) : null,
      documentoPescaId: documentoPescaId ? Number(documentoPescaId) : null,
      observaciones
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="personalId">Personal*</label>
        <InputText id="personalId" value={personalId} onChange={e => setPersonalId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="documentoPescaId">Documento Pesca*</label>
        <InputText id="documentoPescaId" value={documentoPescaId} onChange={e => setDocumentoPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea id="observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
