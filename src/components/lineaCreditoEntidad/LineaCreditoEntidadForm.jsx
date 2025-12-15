// src/components/lineaCreditoEntidad/LineaCreditoEntidadForm.jsx
// Formulario profesional para LineaCreditoEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';

export default function LineaCreditoEntidadForm({ 
  isEdit, 
  defaultValues, 
  entidadesComerciales, 
  monedas, 
  onSubmit, 
  onCancel, 
  loading,
  readOnly = false
}) {
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [montoMaximo, setMontoMaximo] = React.useState(defaultValues.montoMaximo || null);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || null);
  const [diasCredito, setDiasCredito] = React.useState(defaultValues.diasCredito || null);
  const [vigenteDesde, setVigenteDesde] = React.useState(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : null);
  const [vigenteHasta, setVigenteHasta] = React.useState(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
  const [condiciones, setCondiciones] = React.useState(defaultValues.condiciones || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setMontoMaximo(defaultValues.montoMaximo ? Number(defaultValues.montoMaximo) : null);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setDiasCredito(defaultValues.diasCredito || null);
    setVigenteDesde(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : null);
    setVigenteHasta(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
    setCondiciones(defaultValues.condiciones || '');
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      montoMaximo,
      monedaId: monedaId ? Number(monedaId) : null,
      diasCredito,
      vigenteDesde,
      vigenteHasta,
      condiciones,
      observaciones,
      activo
    });
  };

  // Normalizar opciones para dropdowns
  const entidadesOptions = entidadesComerciales.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const monedasOptions = monedas.map(m => ({ 
    ...m, 
    id: Number(m.id),
    label: m.nombre,
    value: Number(m.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="entidadComercialId">Entidad Comercial*</label>
            <Dropdown
              id="entidadComercialId"
              value={entidadComercialId ? Number(entidadComercialId) : null}
              options={entidadesOptions}
              onChange={e => setEntidadComercialId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar entidad"
              disabled={loading || readOnly}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="monedaId">Moneda*</label>
            <Dropdown
              id="monedaId"
              value={monedaId ? Number(monedaId) : null}
              options={monedasOptions}
              onChange={e => setMonedaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar moneda"
              disabled={loading || readOnly}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="montoMaximo">Monto Máximo*</label>
            <InputNumber 
              id="montoMaximo" 
              value={montoMaximo} 
              onValueChange={e => setMontoMaximo(e.value)} 
              required 
              disabled={loading || readOnly}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="diasCredito">Días de Crédito*</label>
            <InputNumber 
              id="diasCredito" 
              value={diasCredito} 
              onValueChange={e => setDiasCredito(e.value)} 
              required 
              disabled={loading || readOnly}
              useGrouping={false}
              min={0}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="vigenteDesde">Vigente Desde*</label>
            <Calendar
              id="vigenteDesde"
              value={vigenteDesde}
              onChange={e => setVigenteDesde(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              required
              disabled={loading || readOnly}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="vigenteHasta">Vigente Hasta</label>
            <Calendar
              id="vigenteHasta"
              value={vigenteHasta}
              onChange={e => setVigenteHasta(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={loading || readOnly}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="condiciones">Condiciones</label>
            <InputTextarea 
              id="condiciones" 
              value={condiciones} 
              onChange={e => setCondiciones(e.target.value)} 
              disabled={loading || readOnly}
              rows={3}
              style={{ textTransform: 'uppercase' }}
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
              disabled={loading || readOnly}
              rows={3}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.checked)} 
              disabled={loading || readOnly} 
            />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} disabled={readOnly} />
      </div>
    </form>
  );
}
