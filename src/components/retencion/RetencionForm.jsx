// src/components/retencion/RetencionForm.jsx
// Formulario profesional para Retencion. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function RetencionForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  proveedores = [], 
  tiposRetencion = [], 
  monedas = [] 
}) {
  const [numeroComprobante, setNumeroComprobante] = React.useState(defaultValues.numeroComprobante || '');
  const [fechaEmision, setFechaEmision] = React.useState(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
  const [proveedorId, setProveedorId] = React.useState(defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null);
  const [tipoRetencionId, setTipoRetencionId] = React.useState(defaultValues.tipoRetencionId ? Number(defaultValues.tipoRetencionId) : null);
  const [montoBase, setMontoBase] = React.useState(defaultValues.montoBase ? Number(defaultValues.montoBase) : 0);
  const [montoRetencion, setMontoRetencion] = React.useState(defaultValues.montoRetencion ? Number(defaultValues.montoRetencion) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNumeroComprobante(defaultValues.numeroComprobante || '');
    setFechaEmision(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
    setProveedorId(defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null);
    setTipoRetencionId(defaultValues.tipoRetencionId ? Number(defaultValues.tipoRetencionId) : null);
    setMontoBase(defaultValues.montoBase ? Number(defaultValues.montoBase) : 0);
    setMontoRetencion(defaultValues.montoRetencion ? Number(defaultValues.montoRetencion) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      numeroComprobante,
      fechaEmision,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      tipoRetencionId: tipoRetencionId ? Number(tipoRetencionId) : null,
      montoBase: Number(montoBase),
      montoRetencion: Number(montoRetencion),
      monedaId: monedaId ? Number(monedaId) : null,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="numeroComprobante">Número de Comprobante*</label>
        <InputText 
          id="numeroComprobante" 
          value={numeroComprobante} 
          onChange={e => setNumeroComprobante(e.target.value)} 
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
        <label htmlFor="proveedorId">Proveedor*</label>
        <Dropdown
          id="proveedorId"
          value={proveedorId}
          options={proveedores.map((proveedor) => ({
            label: proveedor.razonSocial,
            value: Number(proveedor.id),
          }))}
          onChange={(e) => setProveedorId(e.value)}
          placeholder="Seleccione proveedor"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="tipoRetencionId">Tipo de Retención*</label>
        <Dropdown
          id="tipoRetencionId"
          value={tipoRetencionId}
          options={tiposRetencion.map((tipo) => ({
            label: `${tipo.nombre} (${tipo.porcentaje}%)`,
            value: Number(tipo.id),
          }))}
          onChange={(e) => setTipoRetencionId(e.value)}
          placeholder="Seleccione tipo"
          disabled={loading || readOnly}
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoBase">Monto Base*</label>
        <InputNumber
          id="montoBase"
          value={montoBase}
          onValueChange={(e) => setMontoBase(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          min={0}
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoRetencion">Monto Retención*</label>
        <InputNumber
          id="montoRetencion"
          value={montoRetencion}
          onValueChange={(e) => setMontoRetencion(e.value)}
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