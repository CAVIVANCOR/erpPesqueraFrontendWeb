// src/components/tipoRetencionPercepcion/TipoRetencionPercepcionForm.jsx
// Formulario profesional para TipoRetencionPercepcion. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';

export default function TipoRetencionPercepcionForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false 
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [porcentaje, setPorcentaje] = React.useState(defaultValues.porcentaje ? Number(defaultValues.porcentaje) : 0);
  const [tipoOperacion, setTipoOperacion] = React.useState(defaultValues.tipoOperacion || 'RETENCION');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setPorcentaje(defaultValues.porcentaje ? Number(defaultValues.porcentaje) : 0);
    setTipoOperacion(defaultValues.tipoOperacion || 'RETENCION');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      porcentaje: Number(porcentaje),
      tipoOperacion,
      activo
    });
  };

  const tiposOperacion = [
    { label: 'Retención', value: 'RETENCION' },
    { label: 'Percepción', value: 'PERCEPCION' }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText 
          id="nombre" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
          disabled={loading || readOnly} 
          maxLength={100}
          style={{ textTransform: 'uppercase' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="porcentaje">Porcentaje (%)*</label>
        <InputNumber
          id="porcentaje"
          value={porcentaje}
          onValueChange={(e) => setPorcentaje(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          min={0}
          max={100}
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="tipoOperacion">Tipo de Operación*</label>
        <Dropdown
          id="tipoOperacion"
          value={tipoOperacion}
          options={tiposOperacion}
          onChange={(e) => setTipoOperacion(e.value)}
          placeholder="Seleccione tipo"
          disabled={loading || readOnly}
          required
          style={{ fontWeight: 'bold' }}
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