// src/components/percepcion/PercepcionForm.jsx
// Formulario profesional para Percepcion. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function PercepcionForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  clientes = [], 
  tiposPercepcion = [], 
  monedas = [] 
}) {
  const [numeroComprobante, setNumeroComprobante] = React.useState(defaultValues.numeroComprobante || '');
  const [fechaEmision, setFechaEmision] = React.useState(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
  const [clienteId, setClienteId] = React.useState(defaultValues.clienteId ? Number(defaultValues.clienteId) : null);
  const [tipoPercepcionId, setTipoPercepcionId] = React.useState(defaultValues.tipoPercepcionId ? Number(defaultValues.tipoPercepcionId) : null);
  const [montoBase, setMontoBase] = React.useState(defaultValues.montoBase ? Number(defaultValues.montoBase) : 0);
  const [montoPercepcion, setMontoPercepcion] = React.useState(defaultValues.montoPercepcion ? Number(defaultValues.montoPercepcion) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setNumeroComprobante(defaultValues.numeroComprobante || '');
    setFechaEmision(defaultValues.fechaEmision ? new Date(defaultValues.fechaEmision) : new Date());
    setClienteId(defaultValues.clienteId ? Number(defaultValues.clienteId) : null);
    setTipoPercepcionId(defaultValues.tipoPercepcionId ? Number(defaultValues.tipoPercepcionId) : null);
    setMontoBase(defaultValues.montoBase ? Number(defaultValues.montoBase) : 0);
    setMontoPercepcion(defaultValues.montoPercepcion ? Number(defaultValues.montoPercepcion) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      numeroComprobante,
      fechaEmision,
      clienteId: clienteId ? Number(clienteId) : null,
      tipoPercepcionId: tipoPercepcionId ? Number(tipoPercepcionId) : null,
      montoBase: Number(montoBase),
      montoPercepcion: Number(montoPercepcion),
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
        <label htmlFor="clienteId">Cliente*</label>
        <Dropdown
          id="clienteId"
          value={clienteId}
          options={clientes.map((cliente) => ({
            label: cliente.razonSocial,
            value: Number(cliente.id),
          }))}
          onChange={(e) => setClienteId(e.value)}
          placeholder="Seleccione cliente"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="tipoPercepcionId">Tipo de Percepción*</label>
        <Dropdown
          id="tipoPercepcionId"
          value={tipoPercepcionId}
          options={tiposPercepcion.map((tipo) => ({
            label: `${tipo.nombre} (${tipo.porcentaje}%)`,
            value: Number(tipo.id),
          }))}
          onChange={(e) => setTipoPercepcionId(e.value)}
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
        <label htmlFor="montoPercepcion">Monto Percepción*</label>
        <InputNumber
          id="montoPercepcion"
          value={montoPercepcion}
          onValueChange={(e) => setMontoPercepcion(e.value)}
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