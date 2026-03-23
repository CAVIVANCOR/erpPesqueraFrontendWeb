// src/components/ubicacionLetra/UbicacionLetraForm.jsx
// Formulario profesional para UbicacionLetra. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export default function UbicacionLetraForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  bancos = [], 
  personal = [] 
}) {
  const [bancoId, setBancoId] = React.useState(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
  const [personalId, setPersonalId] = React.useState(defaultValues.personalId ? Number(defaultValues.personalId) : null);
  const [ubicacion, setUbicacion] = React.useState(defaultValues.ubicacion || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setBancoId(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
    setPersonalId(defaultValues.personalId ? Number(defaultValues.personalId) : null);
    setUbicacion(defaultValues.ubicacion || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      bancoId: bancoId ? Number(bancoId) : null,
      personalId: personalId ? Number(personalId) : null,
      ubicacion,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="bancoId">Banco*</label>
        <Dropdown
          id="bancoId"
          value={bancoId}
          options={bancos.map((banco) => ({
            label: banco.nombre,
            value: Number(banco.id),
          }))}
          onChange={(e) => setBancoId(e.value)}
          placeholder="Seleccione banco"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="personalId">Personal Responsable*</label>
        <Dropdown
          id="personalId"
          value={personalId}
          options={personal.map((p) => ({
            label: p.nombreCompleto,
            value: Number(p.id),
          }))}
          onChange={(e) => setPersonalId(e.value)}
          placeholder="Seleccione personal"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="ubicacion">Ubicación*</label>
        <InputText 
          id="ubicacion" 
          value={ubicacion} 
          onChange={e => setUbicacion(e.target.value)} 
          required 
          disabled={loading || readOnly} 
          maxLength={200}
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