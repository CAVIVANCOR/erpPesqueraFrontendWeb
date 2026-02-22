// src/components/detalleMovimientoAlmacen/DetalleMovimientoAlmacenForm.jsx
// Formulario profesional para DetalleMovimientoAlmacen. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";

export default function DetalleMovimientoAlmacenForm({
  isEdit,
  defaultValues,
  movimientosAlmacen,
  empresas,
  ubicacionesFisicas, // ← AGREGAR AQUÍ
  onSubmit,
  onCancel,
  loading,
}) {
  const [movimientoAlmacenId, setMovimientoAlmacenId] = React.useState(
    defaultValues.movimientoAlmacenId || null,
  );
  const [productoId, setProductoId] = React.useState(
    defaultValues.productoId || null,
  );
  const [cantidad, setCantidad] = React.useState(
    defaultValues.cantidad || null,
  );
  const [pesoNeto, setPesoNeto] = React.useState(
    defaultValues.pesoNeto || null,
  );
  const [lote, setLote] = React.useState(defaultValues.lote || "");
  const [ubicacionFisicaId, setUbicacionFisicaId] = React.useState(
    defaultValues.ubicacionFisicaId || null,
  ); // ← AGREGAR AQUÍ
  const [fechaProduccion, setFechaProduccion] = React.useState(
    defaultValues.fechaProduccion
      ? new Date(defaultValues.fechaProduccion)
      : null,
  );
  const [fechaVencimiento, setFechaVencimiento] = React.useState(
    defaultValues.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
  );
  const [fechaIngreso, setFechaIngreso] = React.useState(
    defaultValues.fechaIngreso ? new Date(defaultValues.fechaIngreso) : null,
  );
  const [nroSerie, setNroSerie] = React.useState(defaultValues.nroSerie || "");
  const [nroContenedor, setNroContenedor] = React.useState(
    defaultValues.nroContenedor || "",
  );
  const [ubicacionOrigenId, setUbicacionOrigenId] = React.useState(
    defaultValues.ubicacionOrigenId || null,
  );
  const [ubicacionDestinoId, setUbicacionDestinoId] = React.useState(
    defaultValues.ubicacionDestinoId || null,
  );
  const [paletaAlmacenId, setPaletaAlmacenId] = React.useState(
    defaultValues.paletaAlmacenId || null,
  );
  const [estadoMercaderiaId, setEstadoMercaderiaId] = React.useState(
    defaultValues.estadoMercaderiaId || null,
  );
  const [estadoCalidadId, setEstadoCalidadId] = React.useState(
    defaultValues.estadoCalidadId || null,
  );
  const [entidadComercialId, setEntidadComercialId] = React.useState(
    defaultValues.entidadComercialId || null,
  );
  const [custodia, setCustodia] = React.useState(
    defaultValues.custodia !== undefined ? defaultValues.custodia : false,
  );
  const [empresaId, setEmpresaId] = React.useState(
    defaultValues.empresaId || null,
  );
  const [observaciones, setObservaciones] = React.useState(
    defaultValues.observaciones || "",
  );
  const [detalleReqCompraId, setDetalleReqCompraId] = React.useState(
    defaultValues.detalleReqCompraId || null,
  );

  React.useEffect(() => {
    setMovimientoAlmacenId(
      defaultValues.movimientoAlmacenId
        ? Number(defaultValues.movimientoAlmacenId)
        : null,
    );
    setProductoId(
      defaultValues.productoId ? Number(defaultValues.productoId) : null,
    );
    setCantidad(defaultValues.cantidad ? Number(defaultValues.cantidad) : null);
    setPesoNeto(defaultValues.pesoNeto ? Number(defaultValues.pesoNeto) : null);
    setLote(defaultValues.lote || "");
    setUbicacionFisicaId(
      defaultValues.ubicacionFisicaId
        ? Number(defaultValues.ubicacionFisicaId)
        : null,
    ); // ← AGREGAR AQUÍ
    setFechaProduccion(
      defaultValues.fechaProduccion
        ? new Date(defaultValues.fechaProduccion)
        : null,
    );
    setFechaVencimiento(
      defaultValues.fechaVencimiento
        ? new Date(defaultValues.fechaVencimiento)
        : null,
    );
    setFechaIngreso(
      defaultValues.fechaIngreso ? new Date(defaultValues.fechaIngreso) : null,
    );
    setNroSerie(defaultValues.nroSerie || "");
    setNroContenedor(defaultValues.nroContenedor || "");
    setUbicacionOrigenId(
      defaultValues.ubicacionOrigenId
        ? Number(defaultValues.ubicacionOrigenId)
        : null,
    );
    setUbicacionDestinoId(
      defaultValues.ubicacionDestinoId
        ? Number(defaultValues.ubicacionDestinoId)
        : null,
    );
    setPaletaAlmacenId(
      defaultValues.paletaAlmacenId
        ? Number(defaultValues.paletaAlmacenId)
        : null,
    );
    setEstadoMercaderiaId(
      defaultValues.estadoMercaderiaId
        ? Number(defaultValues.estadoMercaderiaId)
        : null,
    );
    setEstadoCalidadId(
      defaultValues.estadoCalidadId
        ? Number(defaultValues.estadoCalidadId)
        : null,
    );
    setEntidadComercialId(
      defaultValues.entidadComercialId
        ? Number(defaultValues.entidadComercialId)
        : null,
    );
    setCustodia(
      defaultValues.custodia !== undefined ? defaultValues.custodia : false,
    );
    setEmpresaId(
      defaultValues.empresaId ? Number(defaultValues.empresaId) : null,
    );
    setObservaciones(defaultValues.observaciones || "");
    setDetalleReqCompraId(
      defaultValues.detalleReqCompraId
        ? Number(defaultValues.detalleReqCompraId)
        : null,
    );
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      movimientoAlmacenId: movimientoAlmacenId
        ? Number(movimientoAlmacenId)
        : null,
      productoId: productoId ? Number(productoId) : null,
      cantidad,
      pesoNeto,
      lote,
      ubicacionFisicaId: ubicacionFisicaId ? Number(ubicacionFisicaId) : null, // ← AGREGAR AQUÍ
      fechaProduccion,
      fechaVencimiento,
      fechaIngreso,
      nroSerie,
      nroContenedor,
      ubicacionOrigenId: ubicacionOrigenId ? Number(ubicacionOrigenId) : null,
      ubicacionDestinoId: ubicacionDestinoId
        ? Number(ubicacionDestinoId)
        : null,
      paletaAlmacenId: paletaAlmacenId ? Number(paletaAlmacenId) : null,
      estadoMercaderiaId: estadoMercaderiaId
        ? Number(estadoMercaderiaId)
        : null,
      estadoCalidadId: estadoCalidadId ? Number(estadoCalidadId) : null,
      entidadComercialId: entidadComercialId
        ? Number(entidadComercialId)
        : null,
      custodia,
      empresaId: empresaId ? Number(empresaId) : null,
      observaciones,
      detalleReqCompraId: detalleReqCompraId
        ? Number(detalleReqCompraId)
        : null,
    });
  };

  // Normalizar opciones para dropdowns
  const movimientosOptions = movimientosAlmacen.map((m) => ({
    ...m,
    id: Number(m.id),
    label: m.numeroDocumento || `ID: ${m.id}`,
    value: Number(m.id),
  }));

  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const ubicacionesFisicasOptions = ubicacionesFisicas.map((u) => ({
    // ← AGREGAR AQUÍ
    ...u,
    id: Number(u.id),
    label: u.descripcion,
    value: Number(u.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="movimientoAlmacenId">Movimiento de Almacén*</label>
            <Dropdown
              id="movimientoAlmacenId"
              value={movimientoAlmacenId ? Number(movimientoAlmacenId) : null}
              options={movimientosOptions}
              onChange={(e) => setMovimientoAlmacenId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar movimiento"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="empresaId">Empresa*</label>
            <Dropdown
              id="empresaId"
              value={empresaId ? Number(empresaId) : null}
              options={empresasOptions}
              onChange={(e) => setEmpresaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar empresa"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="productoId">Producto ID*</label>
            <InputNumber
              id="productoId"
              value={productoId}
              onValueChange={(e) => setProductoId(e.value)}
              required
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="cantidad">Cantidad*</label>
            <InputNumber
              id="cantidad"
              value={cantidad}
              onValueChange={(e) => setCantidad(e.value)}
              required
              disabled={loading}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="pesoNeto">Peso Neto (kg)</label>
            <InputNumber
              id="pesoNeto"
              value={pesoNeto}
              onValueChange={(e) => setPesoNeto(e.value)}
              disabled={loading}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="lote">Lote</label>
            <InputText
              id="lote"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="ubicacionFisicaId">Ubicación Física</label>
            <Dropdown
              id="ubicacionFisicaId"
              value={ubicacionFisicaId ? Number(ubicacionFisicaId) : null}
              options={ubicacionesFisicasOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => setUbicacionFisicaId(e.value)}
              placeholder="Seleccione ubicación física"
              disabled={loading}
              filter
              showClear
            />
          </div>
        </div>
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
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="nroSerie">Número de Serie</label>
            <InputText
              id="nroSerie"
              value={nroSerie}
              onChange={(e) => setNroSerie(e.target.value)}
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="nroContenedor">Número de Contenedor</label>
            <InputText
              id="nroContenedor"
              value={nroContenedor}
              onChange={(e) => setNroContenedor(e.target.value)}
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="ubicacionOrigenId">Ubicación Origen ID</label>
            <InputNumber
              id="ubicacionOrigenId"
              value={ubicacionOrigenId}
              onValueChange={(e) => setUbicacionOrigenId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="ubicacionDestinoId">Ubicación Destino ID</label>
            <InputNumber
              id="ubicacionDestinoId"
              value={ubicacionDestinoId}
              onValueChange={(e) => setUbicacionDestinoId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="paletaAlmacenId">Paleta Almacén ID</label>
            <InputNumber
              id="paletaAlmacenId"
              value={paletaAlmacenId}
              onValueChange={(e) => setPaletaAlmacenId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="estadoMercaderiaId">Estado Mercadería ID</label>
            <InputNumber
              id="estadoMercaderiaId"
              value={estadoMercaderiaId}
              onValueChange={(e) => setEstadoMercaderiaId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="estadoCalidadId">Estado Calidad ID</label>
            <InputNumber
              id="estadoCalidadId"
              value={estadoCalidadId}
              onValueChange={(e) => setEstadoCalidadId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="entidadComercialId">Entidad Comercial ID</label>
            <InputNumber
              id="entidadComercialId"
              value={entidadComercialId}
              onValueChange={(e) => setEntidadComercialId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="detalleReqCompraId">Detalle Req. Compra ID</label>
            <InputNumber
              id="detalleReqCompraId"
              value={detalleReqCompraId}
              onValueChange={(e) => setDetalleReqCompraId(e.value)}
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="custodia"
              checked={custodia}
              onChange={(e) => setCustodia(e.checked)}
              disabled={loading}
            />
            <label htmlFor="custodia">Custodia</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
        />
      </div>
    </form>
  );
}
