// src/components/endosoLetraCambio/EndosoLetraCambioForm.jsx
// Formulario profesional para EndosoLetraCambio. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function EndosoLetraCambioForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  letras = [], 
  entidades = [] 
}) {
  const [letraCambioId, setLetraCambioId] = React.useState(defaultValues.letraCambioId ? Number(defaultValues.letraCambioId) : null);
  const [fechaEndoso, setFechaEndoso] = React.useState(defaultValues.fechaEndoso ? new Date(defaultValues.fechaEndoso) : new Date());
  const [endosanteId, setEndosanteId] = React.useState(defaultValues.endosanteId ? Number(defaultValues.endosanteId) : null);
  const [endosatarioId, setEndosatarioId] = React.useState(defaultValues.endosatarioId ? Number(defaultValues.endosatarioId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setLetraCambioId(defaultValues.letraCambioId ? Number(defaultValues.letraCambioId) : null);
    setFechaEndoso(defaultValues.fechaEndoso ? new Date(defaultValues.fechaEndoso) : new Date());
    setEndosanteId(defaultValues.endosanteId ? Number(defaultValues.endosanteId) : null);
    setEndosatarioId(defaultValues.endosatarioId ? Number(defaultValues.endosatarioId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      letraCambioId: letraCambioId ? Number(letraCambioId) : null,
      fechaEndoso,
      endosanteId: endosanteId ? Number(endosanteId) : null,
      endosatarioId: endosatarioId ? Number(endosatarioId) : null,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="letraCambioId">Letra de Cambio*</label>
        <Dropdown
          id="letraCambioId"
          value={letraCambioId}
          options={letras.map((letra) => ({
            label: `${letra.numeroDocumento} - ${letra.girado?.razonSocial || 'Sin girado'}`,
            value: Number(letra.id),
          }))}
          onChange={(e) => setLetraCambioId(e.value)}
          placeholder="Seleccione letra"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaEndoso">Fecha de Endoso*</label>
        <Calendar
          id="fechaEndoso"
          value={fechaEndoso}
          onChange={(e) => setFechaEndoso(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="endosanteId">Endosante*</label>
        <Dropdown
          id="endosanteId"
          value={endosanteId}
          options={entidades.map((entidad) => ({
            label: entidad.razonSocial,
            value: Number(entidad.id),
          }))}
          onChange={(e) => setEndosanteId(e.value)}
          placeholder="Seleccione endosante"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="endosatarioId">Endosatario*</label>
        <Dropdown
          id="endosatarioId"
          value={endosatarioId}
          options={entidades.map((entidad) => ({
            label: entidad.razonSocial,
            value: Number(entidad.id),
          }))}
          onChange={(e) => setEndosatarioId(e.value)}
          placeholder="Seleccione endosatario"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="observaciones">Observaciones</label>
        <InputTextarea 
          id="observaciones" 
          value={observaciones} 
          onChange={e => setObservaciones(e.target.value)} 
          disabled={loading || readOnly}
          rows={3}
        />
      </div>
      <div className="p-field">
        <label style={{ fontWeight: "bold", color: "#374151" }}>
          Estado del Registro
        </label>
        <Button
          type="button"
          label={activo ? "REGISTRO ACTIVO" : "REGISTRO INACTIVO"}
          icon={activo ? "pi pi-check-circle" : "pi pi-times-circle"}
          onClick={() => setActivo(!activo)}
          className={activo ? "p-button-success" : "p-button-danger"}
          disabled={loading || readOnly}
          style={{
            width: "100%",
            fontWeight: "bold",
          }}
          tooltip={
            activo
              ? "Clic para desactivar el registro"
              : "Clic para activar el registro"
          }
          tooltipOptions={{ position: "top" }}
        />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} disabled={readOnly} />
      </div>
    </form>
  );
}