// src/components/flujoCajaProyectado/FlujoCajaProyectadoForm.jsx
// Formulario profesional para FlujoCajaProyectado. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { MESES } from '../../utils/utils';

export default function FlujoCajaProyectadoForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  empresas = [], 
  monedas = [], 
  centrosCosto = [] 
}) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
  const [fechaProyeccion, setFechaProyeccion] = React.useState(defaultValues.fechaProyeccion ? new Date(defaultValues.fechaProyeccion) : new Date());
  const [anio, setAnio] = React.useState(defaultValues.anio ? Number(defaultValues.anio) : new Date().getFullYear());
  const [mes, setMes] = React.useState(defaultValues.mes ? Number(defaultValues.mes) : new Date().getMonth() + 1);
  const [ingresoProyectado, setIngresoProyectado] = React.useState(defaultValues.ingresoProyectado ? Number(defaultValues.ingresoProyectado) : 0);
  const [egresoProyectado, setEgresoProyectado] = React.useState(defaultValues.egresoProyectado ? Number(defaultValues.egresoProyectado) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [centroCostoId, setCentroCostoId] = React.useState(defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
    setFechaProyeccion(defaultValues.fechaProyeccion ? new Date(defaultValues.fechaProyeccion) : new Date());
    setAnio(defaultValues.anio ? Number(defaultValues.anio) : new Date().getFullYear());
    setMes(defaultValues.mes ? Number(defaultValues.mes) : new Date().getMonth() + 1);
    setIngresoProyectado(defaultValues.ingresoProyectado ? Number(defaultValues.ingresoProyectado) : 0);
    setEgresoProyectado(defaultValues.egresoProyectado ? Number(defaultValues.egresoProyectado) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setCentroCostoId(defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      fechaProyeccion,
      anio: Number(anio),
      mes: Number(mes),
      ingresoProyectado: Number(ingresoProyectado),
      egresoProyectado: Number(egresoProyectado),
      monedaId: monedaId ? Number(monedaId) : null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaId">Empresa*</label>
        <Dropdown
          id="empresaId"
          value={empresaId}
          options={empresas.map((empresa) => ({
            label: empresa.razonSocial,
            value: Number(empresa.id),
          }))}
          onChange={(e) => setEmpresaId(e.value)}
          placeholder="Seleccione empresa"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaProyeccion">Fecha de Proyección*</label>
        <Calendar
          id="fechaProyeccion"
          value={fechaProyeccion}
          onChange={(e) => setFechaProyeccion(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="anio">Año*</label>
        <InputNumber
          id="anio"
          value={anio}
          onValueChange={(e) => setAnio(e.value)}
          useGrouping={false}
          min={2000}
          max={2100}
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
        <label htmlFor="ingresoProyectado">Ingreso Proyectado*</label>
        <InputNumber
          id="ingresoProyectado"
          value={ingresoProyectado}
          onValueChange={(e) => setIngresoProyectado(e.value)}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          min={0}
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="egresoProyectado">Egreso Proyectado*</label>
        <InputNumber
          id="egresoProyectado"
          value={egresoProyectado}
          onValueChange={(e) => setEgresoProyectado(e.value)}
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
        <label htmlFor="centroCostoId">Centro de Costo</label>
        <Dropdown
          id="centroCostoId"
          value={centroCostoId}
          options={centrosCosto.map((cc) => ({
            label: cc.nombre,
            value: Number(cc.id),
          }))}
          onChange={(e) => setCentroCostoId(e.value)}
          placeholder="Seleccione centro de costo"
          disabled={loading || readOnly}
          filter
          showClear
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