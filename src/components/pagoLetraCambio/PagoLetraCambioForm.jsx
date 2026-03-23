// src/components/pagoLetraCambio/PagoLetraCambioForm.jsx
// Formulario profesional para PagoLetraCambio. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function PagoLetraCambioForm({ 
  isEdit, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false, 
  letras = [], 
  monedas = [], 
  mediosPago = [], 
  bancos = [] 
}) {
  const [letraCambioId, setLetraCambioId] = React.useState(defaultValues.letraCambioId ? Number(defaultValues.letraCambioId) : null);
  const [fechaPago, setFechaPago] = React.useState(defaultValues.fechaPago ? new Date(defaultValues.fechaPago) : new Date());
  const [montoPagado, setMontoPagado] = React.useState(defaultValues.montoPagado ? Number(defaultValues.montoPagado) : 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
  const [medioPagoId, setMedioPagoId] = React.useState(defaultValues.medioPagoId ? Number(defaultValues.medioPagoId) : null);
  const [bancoId, setBancoId] = React.useState(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
  const [numeroOperacion, setNumeroOperacion] = React.useState(defaultValues.numeroOperacion || '');
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);

  React.useEffect(() => {
    setLetraCambioId(defaultValues.letraCambioId ? Number(defaultValues.letraCambioId) : null);
    setFechaPago(defaultValues.fechaPago ? new Date(defaultValues.fechaPago) : new Date());
    setMontoPagado(defaultValues.montoPagado ? Number(defaultValues.montoPagado) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : null);
    setMedioPagoId(defaultValues.medioPagoId ? Number(defaultValues.medioPagoId) : null);
    setBancoId(defaultValues.bancoId ? Number(defaultValues.bancoId) : null);
    setNumeroOperacion(defaultValues.numeroOperacion || '');
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      letraCambioId: letraCambioId ? Number(letraCambioId) : null,
      fechaPago,
      montoPagado: Number(montoPagado),
      monedaId: monedaId ? Number(monedaId) : null,
      medioPagoId: medioPagoId ? Number(medioPagoId) : null,
      bancoId: bancoId ? Number(bancoId) : null,
      numeroOperacion,
      observaciones,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="letraCambioId">Letra de Cambio*</label>
        <Dropdown
          id="letraCambioId"
          value={letraCambioId}
          options={letras.map((letra) => ({
            label: `${letra.numeroDocumento} - ${letra.girado?.razonSocial || 'Sin girado'}`,
            value: Number(letra.id),
          }))}
          onChange={(e) => setLetraCambioId(e.value)}
          placeholder="Seleccione letra"
          disabled={loading || readOnly}
          filter
          required
          style={{ fontWeight: 'bold' }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="fechaPago">Fecha de Pago*</label>
        <Calendar
          id="fechaPago"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          disabled={loading || readOnly}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="montoPagado">Monto Pagado*</label>
        <InputNumber
          id="montoPagado"
          value={montoPagado}
          onValueChange={(e) => setMontoPagado(e.value)}
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
        <label htmlFor="medioPagoId">Medio de Pago*</label>
        <Dropdown
          id="medioPagoId"
          value={medioPagoId}
          options={mediosPago.map((medio) => ({
            label: medio.nombre,
            value: Number(medio.id),
          }))}
          onChange={(e) => setMedioPagoId(e.value)}
          placeholder="Seleccione medio de pago"
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
        <label htmlFor="numeroOperacion">Número de Operación</label>
        <InputTextarea 
          id="numeroOperacion" 
          value={numeroOperacion} 
          onChange={e => setNumeroOperacion(e.target.value)} 
          disabled={loading || readOnly}
          rows={2}
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