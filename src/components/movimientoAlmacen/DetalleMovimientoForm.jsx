// Componente modular para agregar/editar detalles de movimiento
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';

export default function DetalleMovimientoForm({
  visible,
  onHide,
  onSave,
  detalle = null,
  productos = [],
  entidadesComerciales = [],
  loading = false
}) {
  const [productoId, setProductoId] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [peso, setPeso] = useState(null);
  const [lote, setLote] = useState('');
  const [fechaProduccion, setFechaProduccion] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState(null);
  const [fechaIngreso, setFechaIngreso] = useState(null);
  const [nroSerie, setNroSerie] = useState('');
  const [nroContenedor, setNroContenedor] = useState('');
  const [estadoMercaderiaId, setEstadoMercaderiaId] = useState(null);
  const [estadoCalidadId, setEstadoCalidadId] = useState(null);
  const [entidadComercialId, setEntidadComercialId] = useState(null);
  const [esCustodia, setEsCustodia] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (detalle) {
      setProductoId(detalle.productoId);
      setCantidad(detalle.cantidad || 0);
      setPeso(detalle.peso);
      setLote(detalle.lote || '');
      setFechaProduccion(detalle.fechaProduccion ? new Date(detalle.fechaProduccion) : null);
      setFechaVencimiento(detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento) : null);
      setFechaIngreso(detalle.fechaIngreso ? new Date(detalle.fechaIngreso) : null);
      setNroSerie(detalle.nroSerie || '');
      setNroContenedor(detalle.nroContenedor || '');
      setEstadoMercaderiaId(detalle.estadoMercaderiaId);
      setEstadoCalidadId(detalle.estadoCalidadId);
      setEntidadComercialId(detalle.entidadComercialId);
      setEsCustodia(detalle.esCustodia || false);
      setObservaciones(detalle.observaciones || '');
    } else {
      limpiarFormulario();
    }
  }, [detalle, visible]);

  const limpiarFormulario = () => {
    setProductoId(null);
    setCantidad(0);
    setPeso(null);
    setLote('');
    setFechaProduccion(null);
    setFechaVencimiento(null);
    setFechaIngreso(null);
    setNroSerie('');
    setNroContenedor('');
    setEstadoMercaderiaId(null);
    setEstadoCalidadId(null);
    setEntidadComercialId(null);
    setEsCustodia(false);
    setObservaciones('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const detalleData = {
      ...(detalle?.id && { id: detalle.id }),
      productoId: Number(productoId),
      cantidad,
      peso,
      lote,
      fechaProduccion,
      fechaVencimiento,
      fechaIngreso,
      nroSerie,
      nroContenedor,
      estadoMercaderiaId: estadoMercaderiaId ? Number(estadoMercaderiaId) : null,
      estadoCalidadId: estadoCalidadId ? Number(estadoCalidadId) : null,
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      esCustodia,
      observaciones
    };

    onSave(detalleData);
    limpiarFormulario();
  };

  const productosOptions = productos.map(p => ({
    label: p.descripcionArmada || p.descripcionBase,
    value: Number(p.id)
  }));

  const entidadesOptions = entidadesComerciales.map(e => ({
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const dialogFooter = (
    <div>
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
      <Button label="Guardar" icon="pi pi-check" onClick={handleSubmit} disabled={loading || !productoId || cantidad <= 0} />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '800px' }}
      header={detalle ? 'Editar Detalle' : 'Agregar Detalle'}
      modal
      footer={dialogFooter}
      onHide={onHide}
    >
      <form onSubmit={handleSubmit} className="p-fluid">
        <div className="p-grid">
          {/* Producto */}
          <div className="p-col-12">
            <div className="p-field">
              <label htmlFor="productoId">Producto*</label>
              <Dropdown
                id="productoId"
                value={productoId}
                options={productosOptions}
                onChange={(e) => setProductoId(e.value)}
                placeholder="Seleccionar producto"
                filter
                filterBy="label"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Cantidad y Peso */}
          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="cantidad">Cantidad*</label>
              <InputNumber
                id="cantidad"
                value={cantidad}
                onValueChange={(e) => setCantidad(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="peso">Peso (kg)</label>
              <InputNumber
                id="peso"
                value={peso}
                onValueChange={(e) => setPeso(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                disabled={loading}
              />
            </div>
          </div>

          {/* Lote y Entidad Comercial */}
          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="lote">Lote</label>
              <InputText
                id="lote"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                maxLength={40}
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="entidadComercialId">Cliente/Proveedor</label>
              <Dropdown
                id="entidadComercialId"
                value={entidadComercialId}
                options={entidadesOptions}
                onChange={(e) => setEntidadComercialId(e.value)}
                placeholder="Seleccionar entidad"
                filter
                filterBy="label"
                showClear
                disabled={loading}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="p-col-12 p-md-4">
            <div className="p-field">
              <label htmlFor="fechaProduccion">Fecha Producción</label>
              <Calendar
                id="fechaProduccion"
                value={fechaProduccion}
                onChange={(e) => setFechaProduccion(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-col-12 p-md-4">
            <div className="p-field">
              <label htmlFor="fechaVencimiento">Fecha Vencimiento</label>
              <Calendar
                id="fechaVencimiento"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-col-12 p-md-4">
            <div className="p-field">
              <label htmlFor="fechaIngreso">Fecha Ingreso</label>
              <Calendar
                id="fechaIngreso"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={loading}
              />
            </div>
          </div>

          {/* Nro Serie y Contenedor */}
          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="nroSerie">Nro. Serie</label>
              <InputText
                id="nroSerie"
                value={nroSerie}
                onChange={(e) => setNroSerie(e.target.value)}
                maxLength={40}
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-col-12 p-md-6">
            <div className="p-field">
              <label htmlFor="nroContenedor">Nro. Contenedor</label>
              <InputText
                id="nroContenedor"
                value={nroContenedor}
                onChange={(e) => setNroContenedor(e.target.value)}
                maxLength={40}
                disabled={loading}
              />
            </div>
          </div>

          {/* Custodia */}
          <div className="p-col-12">
            <div className="p-field-checkbox">
              <Checkbox
                id="esCustodia"
                checked={esCustodia}
                onChange={(e) => setEsCustodia(e.checked)}
                disabled={loading}
              />
              <label htmlFor="esCustodia">Es Custodia</label>
            </div>
          </div>

          {/* Observaciones */}
          <div className="p-col-12">
            <div className="p-field">
              <label htmlFor="observaciones">Observaciones</label>
              <InputText
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
}