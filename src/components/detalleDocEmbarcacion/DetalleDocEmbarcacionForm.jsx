// src/components/detalleDocEmbarcacion/DetalleDocEmbarcacionForm.jsx
// Formulario profesional para DetalleDocEmbarcacion. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';

export default function DetalleDocEmbarcacionForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faenaPescaId || '');
  const [documentoPescaId, setDocumentoPescaId] = React.useState(defaultValues.documentoPescaId || '');
  const [numeroDocumento, setNumeroDocumento] = React.useState(defaultValues.numeroDocumento || '');
  const [fechaEmision, setFechaEmision] = React.useState(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : null);
  const [fechaVencimiento, setFechaVencimiento] = React.useState(defaultValues.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null);
  const [urlDocEmbarcacio, setUrlDocEmbarcacio] = React.useState(defaultValues.urlDocEmbarcacio || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [verificado, setVerificado] = React.useState(defaultValues.verificado !== undefined ? !!defaultValues.verificado : false);

  React.useEffect(() => {
    setFaenaPescaId(defaultValues.faenaPescaId || '');
    setDocumentoPescaId(defaultValues.documentoPescaId || '');
    setNumeroDocumento(defaultValues.numeroDocumento || '');
    setFechaEmision(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : null);
    setFechaVencimiento(defaultValues.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null);
    setUrlDocEmbarcacio(defaultValues.urlDocEmbarcacio || '');
    setObservaciones(defaultValues.observaciones || '');
    setVerificado(defaultValues.verificado !== undefined ? !!defaultValues.verificado : false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      documentoPescaId: documentoPescaId ? Number(documentoPescaId) : null,
      numeroDocumento,
      fechaEmision,
      fechaVencimiento,
      urlDocEmbarcacio,
      observaciones,
      verificado
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="faenaPescaId">Faena Pesca*</label>
        <InputText id="faenaPescaId" value={faenaPescaId} onChange={e => setFaenaPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="documentoPescaId">Documento Pesca*</label>
        <InputText id="documentoPescaId" value={documentoPescaId} onChange={e => setDocumentoPescaId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="numeroDocumento">Número Documento</label>
        <InputText id="numeroDocumento" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaEmision">Fecha Emisión</label>
        <Calendar id="fechaEmision" value={fechaEmision} onChange={e => setFechaEmision(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="fechaVencimiento">Fecha Vencimiento</label>
        <Calendar id="fechaVencimiento" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="urlDocEmbarcacio">URL Documento</label>
        <InputText id="urlDocEmbarcacio" value={urlDocEmbarcacio} onChange={e => setUrlDocEmbarcacio(e.target.value)} disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea id="observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="verificado" checked={verificado} onChange={e => setVerificado(e.checked)} disabled={loading} />
        <label htmlFor="verificado">Verificado</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
