// src/components/letraCambio/LetraCambioForm.jsx
// Formulario profesional para LetraCambio. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function LetraCambioForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  entidades = [], 
  monedas = [], 
  bancos = [] 
}) {
  const [numeroDocumento, setNumeroDocumento] = React.useState(defaultValues.numeroDocumento || '');
  const [fechaEmision, setFechaEmision] = React.useState(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
  const [fechaVencimiento, setFechaVencimiento] = React.useState(defaultValues.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null);
  const [giradoId, setGiradoId] = React.useState(defaultValues.giradoId ? Number(defaultValues.giradoId) : null);
  const [aceptanteId, setAceptanteId] = React.useState(defaultValues.aceptanteId ? Number(defaultValues.aceptanteId) : null);
  const [montoOriginal, setMontoOriginal] = React.useState(defaultValues.montoOriginal ? Number(defaultValues.montoOriginal) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [bancoId, setBancoId] = React.useState(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
  const [lugarGiro, setLugarGiro] = React.useState(defaultValues.lugarGiro || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNumeroDocumento(defaultValues.numeroDocumento || '');
    setFechaEmision(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
    setFechaVencimiento(defaultValues.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null);
    setGiradoId(defaultValues.giradoId ? Number(defaultValues.giradoId) : null);
    setAceptanteId(defaultValues.aceptanteId ? Number(defaultValues.aceptanteId) : null);
    setMontoOriginal(defaultValues.montoOriginal ? Number(defaultValues.montoOriginal) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setBancoId(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
    setLugarGiro(defaultValues.lugarGiro || '');
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      numeroDocumento,
      fechaEmision,
      fechaVencimiento,
      giradoId: giradoId ? Number(giradoId) : null,
      aceptanteId: aceptanteId ? Number(aceptanteId) : null,
      montoOriginal: Number(montoOriginal),
      monedaId: monedaId ? Number(monedaId) : null,
      bancoId: bancoId ? Number(bancoId) : null,
      lugarGiro,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="numeroDocumento">Número de Documento*</label>
        <InputText 
          id="numeroDocumento" 
          value={numeroDocumento} 
          onChange={e => setNumeroDocumento(e.target.value)} 
          required 
          disabled={loading || readOnly} 
          maxLength={50}
          style={{ textTransform: 'uppercase' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaEmision">Fecha de Emisión*</label>
        <Calendar
          id="fechaEmision"
          value={fechaEmision}
          onChange={(e) => setFechaEmision(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaVencimiento">Fecha de Vencimiento*</label>
        <Calendar
          id="fechaVencimiento"
          value={fechaVencimiento}
          onChange={(e) => setFechaVencimiento(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="giradoId">Girado*</label>
        <Dropdown
          id="giradoId"
          value={giradoId}
          options={entidades.map((entidad) => ({
            label: entidad.razonSocial,
            value: Number(entidad.id),
          }))}
          onChange={(e) => setGiradoId(e.value)}
          placeholder="Seleccione girado"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="aceptanteId">Aceptante</label>
        <Dropdown
          id="aceptanteId"
          value={aceptanteId}
          options={entidades.map((entidad) => ({
            label: entidad.razonSocial,
            value: Number(entidad.id),
          }))}
          onChange={(e) => setAceptanteId(e.value)}
          placeholder="Seleccione aceptante"
          disabled={loading || readOnly}
          filter
          showClear
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoOriginal">Monto Original*</label>
        <InputNumber
          id="montoOriginal"
          value={montoOriginal}
          onValueChange={(e) => setMontoOriginal(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          min={0}
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="monedaId">Moneda*</label>
        <Dropdown
          id="monedaId"
          value={monedaId}
          options={monedas.map((moneda) => ({
            label: `${moneda.simbolo} - ${moneda.codigoSunat || ''}`,
            value: Number(moneda.id),
          }))}
          onChange={(e) => setMonedaId(e.value)}
          placeholder="Seleccione moneda"
          disabled={loading || readOnly}
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="bancoId">Banco</label>
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
          showClear
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="lugarGiro">Lugar de Giro</label>
        <InputText 
          id="lugarGiro" 
          value={lugarGiro} 
          onChange={e => setLugarGiro(e.target.value)} 
          disabled={loading || readOnly} 
          maxLength={100}
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