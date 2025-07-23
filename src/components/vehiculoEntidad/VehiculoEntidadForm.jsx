// src/components/vehiculoEntidad/VehiculoEntidadForm.jsx
// Formulario profesional para VehiculoEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function VehiculoEntidadForm({ 
  isEdit, 
  defaultValues, 
  entidadesComerciales, 
  tiposVehiculo, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [placa, setPlaca] = React.useState(defaultValues.placa || '');
  const [marca, setMarca] = React.useState(defaultValues.marca || '');
  const [modelo, setModelo] = React.useState(defaultValues.modelo || '');
  const [color, setColor] = React.useState(defaultValues.color || '');
  const [anio, setAnio] = React.useState(defaultValues.anio || null);
  const [tipoVehiculoId, setTipoVehiculoId] = React.useState(defaultValues.tipoVehiculoId || null);
  const [capacidadTon, setCapacidadTon] = React.useState(defaultValues.capacidadTon || null);
  const [numeroSerie, setNumeroSerie] = React.useState(defaultValues.numeroSerie || '');
  const [numeroMotor, setNumeroMotor] = React.useState(defaultValues.numeroMotor || '');
  const [activoId, setActivoId] = React.useState(defaultValues.activoId || null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [cesado, setCesado] = React.useState(defaultValues.cesado !== undefined ? defaultValues.cesado : false);

  React.useEffect(() => {
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setPlaca(defaultValues.placa || '');
    setMarca(defaultValues.marca || '');
    setModelo(defaultValues.modelo || '');
    setColor(defaultValues.color || '');
    setAnio(defaultValues.anio || null);
    setTipoVehiculoId(defaultValues.tipoVehiculoId ? Number(defaultValues.tipoVehiculoId) : null);
    setCapacidadTon(defaultValues.capacidadTon ? Number(defaultValues.capacidadTon) : null);
    setNumeroSerie(defaultValues.numeroSerie || '');
    setNumeroMotor(defaultValues.numeroMotor || '');
    setActivoId(defaultValues.activoId ? Number(defaultValues.activoId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setCesado(defaultValues.cesado !== undefined ? defaultValues.cesado : false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      placa,
      marca,
      modelo,
      color,
      anio,
      tipoVehiculoId: tipoVehiculoId ? Number(tipoVehiculoId) : null,
      capacidadTon,
      numeroSerie,
      numeroMotor,
      activoId: activoId ? Number(activoId) : null,
      observaciones,
      cesado
    });
  };

  // Normalizar opciones para dropdowns
  const entidadesOptions = entidadesComerciales.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const tiposOptions = tiposVehiculo.map(t => ({ 
    ...t, 
    id: Number(t.id),
    label: t.nombre,
    value: Number(t.id)
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
            <label htmlFor="placa">Placa*</label>
            <InputText 
              id="placa" 
              value={placa} 
              onChange={e => setPlaca(e.target.value)} 
              required 
              disabled={loading}
              maxLength={20}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoVehiculoId">Tipo de Vehículo*</label>
            <Dropdown
              id="tipoVehiculoId"
              value={tipoVehiculoId ? Number(tipoVehiculoId) : null}
              options={tiposOptions}
              onChange={e => setTipoVehiculoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="marca">Marca</label>
            <InputText 
              id="marca" 
              value={marca} 
              onChange={e => setMarca(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="modelo">Modelo</label>
            <InputText 
              id="modelo" 
              value={modelo} 
              onChange={e => setModelo(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="color">Color</label>
            <InputText 
              id="color" 
              value={color} 
              onChange={e => setColor(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="anio">Año</label>
            <InputNumber 
              id="anio" 
              value={anio} 
              onValueChange={e => setAnio(e.value)} 
              disabled={loading}
              useGrouping={false}
              min={1900}
              max={2030}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="capacidadTon">Capacidad (Toneladas)</label>
            <InputNumber 
              id="capacidadTon" 
              value={capacidadTon} 
              onValueChange={e => setCapacidadTon(e.value)} 
              disabled={loading}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numeroSerie">Número de Serie</label>
            <InputText 
              id="numeroSerie" 
              value={numeroSerie} 
              onChange={e => setNumeroSerie(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numeroMotor">Número de Motor</label>
            <InputText 
              id="numeroMotor" 
              value={numeroMotor} 
              onChange={e => setNumeroMotor(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="activoId">ID Activo</label>
            <InputNumber 
              id="activoId" 
              value={activoId} 
              onValueChange={e => setActivoId(e.value)} 
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field-checkbox">
            <Checkbox 
              id="cesado" 
              checked={cesado} 
              onChange={e => setCesado(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="cesado">Cesado</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea 
              id="observaciones" 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)} 
              disabled={loading}
              rows={3}
            />
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
