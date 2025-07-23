// src/components/detAccionesPreviasFaena/DetAccionesPreviasFaenaForm.jsx
// Formulario profesional para DetAccionesPreviasFaena. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';

export default function DetAccionesPreviasFaenaForm({ isEdit, defaultValues, faenas, acciones, onSubmit, onCancel, loading }) {
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faenaPescaId || null);
  const [accionPreviaId, setAccionPreviaId] = React.useState(defaultValues.accionPreviaId || null);
  const [responsableId, setResponsableId] = React.useState(defaultValues.responsableId || '');
  const [verificadorId, setVerificadorId] = React.useState(defaultValues.verificadorId || '');
  const [fechaVerificacion, setFechaVerificacion] = React.useState(defaultValues.fechaVerificacion ? new Date(defaultValues.fechaVerificacion) : null);
  const [cumplida, setCumplida] = React.useState(defaultValues.cumplida !== undefined ? !!defaultValues.cumplida : false);
  const [fechaCumplida, setFechaCumplida] = React.useState(defaultValues.fechaCumplida ? new Date(defaultValues.fechaCumplida) : null);
  const [urlConfirmaAccionPdf, setUrlConfirmaAccionPdf] = React.useState(defaultValues.urlConfirmaAccionPdf || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [verificado, setVerificado] = React.useState(defaultValues.verificado !== undefined ? !!defaultValues.verificado : false);

  React.useEffect(() => {
    setFaenaPescaId(defaultValues.faenaPescaId ? Number(defaultValues.faenaPescaId) : null);
    setAccionPreviaId(defaultValues.accionPreviaId ? Number(defaultValues.accionPreviaId) : null);
    setResponsableId(defaultValues.responsableId || '');
    setVerificadorId(defaultValues.verificadorId || '');
    setFechaVerificacion(defaultValues.fechaVerificacion ? new Date(defaultValues.fechaVerificacion) : null);
    setCumplida(defaultValues.cumplida !== undefined ? !!defaultValues.cumplida : false);
    setFechaCumplida(defaultValues.fechaCumplida ? new Date(defaultValues.fechaCumplida) : null);
    setUrlConfirmaAccionPdf(defaultValues.urlConfirmaAccionPdf || '');
    setObservaciones(defaultValues.observaciones || '');
    setVerificado(defaultValues.verificado !== undefined ? !!defaultValues.verificado : false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      accionPreviaId: accionPreviaId ? Number(accionPreviaId) : null,
      responsableId: responsableId ? Number(responsableId) : null,
      verificadorId: verificadorId ? Number(verificadorId) : null,
      fechaVerificacion,
      cumplida,
      fechaCumplida,
      urlConfirmaAccionPdf,
      observaciones,
      verificado
    });
  };

  // Normalizar opciones para los dropdowns
  const faenasOptions = faenas.map(f => ({ 
    ...f, 
    id: Number(f.id),
    label: `Faena ${f.id}`,
    value: Number(f.id)
  }));

  const accionesOptions = acciones.map(a => ({ 
    ...a, 
    id: Number(a.id),
    label: a.nombre,
    value: Number(a.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="faenaPescaId">Faena Pesca*</label>
            <Dropdown
              id="faenaPescaId"
              value={faenaPescaId ? Number(faenaPescaId) : null}
              options={faenasOptions}
              onChange={e => setFaenaPescaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar faena"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="accionPreviaId">Acción Previa*</label>
            <Dropdown
              id="accionPreviaId"
              value={accionPreviaId ? Number(accionPreviaId) : null}
              options={accionesOptions}
              onChange={e => setAccionPreviaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar acción"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="responsableId">Responsable ID</label>
            <InputText 
              id="responsableId" 
              value={responsableId} 
              onChange={e => setResponsableId(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="verificadorId">Verificador ID</label>
            <InputText 
              id="verificadorId" 
              value={verificadorId} 
              onChange={e => setVerificadorId(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaVerificacion">Fecha Verificación</label>
            <Calendar 
              id="fechaVerificacion" 
              value={fechaVerificacion} 
              onChange={e => setFechaVerificacion(e.value)} 
              showIcon 
              showTime 
              hourFormat="24" 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaCumplida">Fecha Cumplida</label>
            <Calendar 
              id="fechaCumplida" 
              value={fechaCumplida} 
              onChange={e => setFechaCumplida(e.value)} 
              showIcon 
              showTime 
              hourFormat="24" 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="urlConfirmaAccionPdf">URL Confirmación PDF</label>
            <InputText 
              id="urlConfirmaAccionPdf" 
              value={urlConfirmaAccionPdf} 
              onChange={e => setUrlConfirmaAccionPdf(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea 
              id="observaciones" 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)} 
              rows={3} 
              disabled={loading} 
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field-checkbox">
            <Checkbox 
              id="cumplida" 
              checked={cumplida} 
              onChange={e => setCumplida(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="cumplida">Cumplida</label>
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field-checkbox">
            <Checkbox 
              id="verificado" 
              checked={verificado} 
              onChange={e => setVerificado(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="verificado">Verificado</label>
          </div>
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
