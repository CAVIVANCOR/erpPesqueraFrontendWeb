// src/components/precioEntidad/PrecioEntidadForm.jsx
// Formulario profesional para PrecioEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function PrecioEntidadForm({ isEdit, defaultValues, entidades, monedas, onSubmit, onCancel, loading }) {
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [productoId, setProductoId] = React.useState(defaultValues.productoId || '');
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || null);
  const [precioUnitario, setPrecioUnitario] = React.useState(defaultValues.precioUnitario || 0);
  const [vigenteDesde, setVigenteDesde] = React.useState(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : new Date());
  const [vigenteHasta, setVigenteHasta] = React.useState(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setProductoId(defaultValues.productoId || '');
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setPrecioUnitario(defaultValues.precioUnitario || 0);
    setVigenteDesde(defaultValues.vigenteDesde ? new Date(defaultValues.vigenteDesde) : new Date());
    setVigenteHasta(defaultValues.vigenteHasta ? new Date(defaultValues.vigenteHasta) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      productoId: productoId ? Number(productoId) : null,
      monedaId: monedaId ? Number(monedaId) : null,
      precioUnitario,
      vigenteDesde,
      vigenteHasta,
      observaciones,
      activo
    });
  };

  // Normalizar opciones para dropdowns
  const entidadesOptions = entidades.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const monedasOptions = monedas.map(m => ({ 
    ...m, 
    id: Number(m.id),
    label: `${m.simbolo} - ${m.codigoSunat}`,
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
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="productoId">Producto ID*</label>
            <InputText 
              id="productoId" 
              value={productoId} 
              onChange={e => setProductoId(e.target.value)} 
              required 
              disabled={loading}
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
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="precioUnitario">Precio Unitario*</label>
            <InputNumber 
              id="precioUnitario" 
              value={precioUnitario} 
              onValueChange={e => setPrecioUnitario(e.value)} 
              mode="decimal" 
              minFractionDigits={2} 
              maxFractionDigits={2} 
              required 
              disabled={loading} 
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
              showIcon 
              dateFormat="yy-mm-dd" 
              disabled={loading} 
              required 
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
              showIcon 
              dateFormat="yy-mm-dd" 
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
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="activo">Activo</label>
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
