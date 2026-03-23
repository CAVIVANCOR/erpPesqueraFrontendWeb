// src/components/presupuestoAnual/PresupuestoAnualForm.jsx
// Formulario profesional para PresupuestoAnual. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function PresupuestoAnualForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  empresas = [], 
  centrosCosto = [], 
  monedas = [] 
}) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
  const [anio, setAnio] = React.useState(defaultValues.anio ? Number(defaultValues.anio) : new Date().getFullYear());
  const [centroCostoId, setCentroCostoId] = React.useState(defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : null);
  const [montoPresupuestado, setMontoPresupuestado] = React.useState(defaultValues.montoPresupuestado ? Number(defaultValues.montoPresupuestado) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
    setAnio(defaultValues.anio ? Number(defaultValues.anio) : new Date().getFullYear());
    setCentroCostoId(defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : null);
    setMontoPresupuestado(defaultValues.montoPresupuestado ? Number(defaultValues.montoPresupuestado) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      anio: Number(anio),
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      montoPresupuestado: Number(montoPresupuestado),
      monedaId: monedaId ? Number(monedaId) : null,
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
        <label htmlFor="centroCostoId">Centro de Costo*</label>
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
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoPresupuestado">Monto Presupuestado*</label>
        <InputNumber
          id="montoPresupuestado"
          value={montoPresupuestado}
          onValueChange={(e) => setMontoPresupuestado(e.value)}
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