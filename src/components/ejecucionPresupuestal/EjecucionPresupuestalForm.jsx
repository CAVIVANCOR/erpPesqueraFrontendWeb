// src/components/ejecucionPresupuestal/EjecucionPresupuestalForm.jsx
// Formulario profesional para EjecucionPresupuestal. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { MESES } from '../../utils/utils';

export default function EjecucionPresupuestalForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  presupuestos = [], 
  monedas = [] 
}) {
  const [presupuestoAnualId, setPresupuestoAnualId] = React.useState(defaultValues.presupuestoAnualId ? Number(defaultValues.presupuestoAnualId) : null);
  const [fechaEjecucion, setFechaEjecucion] = React.useState(defaultValues.fechaEjecucion ? new Date(defaultValues.fechaEjecucion) : new Date());
  const [mes, setMes] = React.useState(defaultValues.mes ? Number(defaultValues.mes) : new Date().getMonth() + 1);
  const [montoEjecutado, setMontoEjecutado] = React.useState(defaultValues.montoEjecutado ? Number(defaultValues.montoEjecutado) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setPresupuestoAnualId(defaultValues.presupuestoAnualId ? Number(defaultValues.presupuestoAnualId) : null);
    setFechaEjecucion(defaultValues.fechaEjecucion ? new Date(defaultValues.fechaEjecucion) : new Date());
    setMes(defaultValues.mes ? Number(defaultValues.mes) : new Date().getMonth() + 1);
    setMontoEjecutado(defaultValues.montoEjecutado ? Number(defaultValues.montoEjecutado) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      presupuestoAnualId: presupuestoAnualId ? Number(presupuestoAnualId) : null,
      fechaEjecucion,
      mes: Number(mes),
      montoEjecutado: Number(montoEjecutado),
      monedaId: monedaId ? Number(monedaId) : null,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="presupuestoAnualId">Presupuesto Anual*</label>
        <Dropdown
          id="presupuestoAnualId"
          value={presupuestoAnualId}
          options={presupuestos.map((presupuesto) => ({
            label: `${presupuesto.anio} - ${presupuesto.empresa?.razonSocial || ''} - ${presupuesto.centroCosto?.nombre || ''}`,
            value: Number(presupuesto.id),
          }))}
          onChange={(e) => setPresupuestoAnualId(e.value)}
          placeholder="Seleccione presupuesto"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaEjecucion">Fecha de Ejecución*</label>
        <Calendar
          id="fechaEjecucion"
          value={fechaEjecucion}
          onChange={(e) => setFechaEjecucion(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="mes">Mes*</label>
        <Dropdown
          id="mes"
          value={mes}
          options={MESES}
          onChange={(e) => setMes(e.value)}
          placeholder="Seleccione mes"
          disabled={loading || readOnly}
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoEjecutado">Monto Ejecutado*</label>
        <InputNumber
          id="montoEjecutado"
          value={montoEjecutado}
          onValueChange={(e) => setMontoEjecutado(e.value)}
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