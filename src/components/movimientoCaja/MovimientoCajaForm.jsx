// src/components/movimientoCaja/MovimientoCajaForm.jsx
// Formulario profesional para MovimientoCaja. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

export default function MovimientoCajaForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  centrosCosto = [],
  modulos = [],
  personal = [],
  empresas = [],
  tipoMovEntregaRendir = [],
  monedas = [],
  tipoReferenciaMovimientoCaja = [],
  cuentasCorrientes = [],
  entidadesComerciales = [],
  selectedDetMovsIds = [], // Prop existente
  detEntregasRendirSelect = [], // Nueva prop
}) {

  // Debug: mostrar datos recibidos de DetEntregaRendir
React.useEffect(() => {
  if (detEntregasRendirSelect.length > 0) {
    console.log("detEntregasRendirSelect:", detEntregasRendirSelect);
    console.log("Monto total precargado:", defaultValues.monto);
    console.log("Entidad comercial precargada:", defaultValues.entidadComercialId);
    console.log("Módulo origen precargado:", defaultValues.moduloOrigenMovCajaId);
  }
}, [detEntregasRendirSelect, defaultValues]);

  const [empresaOrigenId, setEmpresaOrigenId] = React.useState(
    defaultValues.empresaOrigenId || ""
  );
  const [cuentaCorrienteOrigenId, setCuentaCorrienteOrigenId] = React.useState(
    defaultValues.cuentaCorrienteOrigenId || ""
  );
  const [empresaDestinoId, setEmpresaDestinoId] = React.useState(
    defaultValues.empresaDestinoId || ""
  );
  const [cuentaCorrienteDestinoId, setCuentaCorrienteDestinoId] = React.useState(
    defaultValues.cuentaCorrienteDestinoId || ""
  );
  const [fecha, setFecha] = React.useState(
    defaultValues.fecha ? new Date(defaultValues.fecha) : new Date()
  );
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(
    defaultValues.tipoMovimientoId || ""
  );
  const [entidadComercialId, setEntidadComercialId] = React.useState(
    defaultValues.entidadComercialId || ""
  );
  const [monto, setMonto] = React.useState(defaultValues.monto || 0);
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [referenciaExtId, setReferenciaExtId] = React.useState(
    defaultValues.referenciaExtId || ""
  );
  const [tipoReferenciaId, setTipoReferenciaId] = React.useState(
    defaultValues.tipoReferenciaId || ""
  );
  const [usuarioId, setUsuarioId] = React.useState(
    defaultValues.usuarioId || ""
  );
  const [estadoId, setEstadoId] = React.useState(defaultValues.estadoId || "");

  // Estados para los 9 nuevos campos
  const [fechaCreacion, setFechaCreacion] = React.useState(
    defaultValues.fechaCreacion ? new Date(defaultValues.fechaCreacion) : new Date()
  );
  const [fechaActualizacion, setFechaActualizacion] = React.useState(
    defaultValues.fechaActualizacion ? new Date(defaultValues.fechaActualizacion) : new Date()
  );
  const [centroCostoId, setCentroCostoId] = React.useState(
    defaultValues.centroCostoId || ""
  );
  const [moduloOrigenMotivoOperacionId, setModuloOrigenMotivoOperacionId] = React.useState(
    defaultValues.moduloOrigenMovCajaId || defaultValues.moduloOrigenMotivoOperacionId || ""
  );
  const [origenMotivoOperacionId, setOrigenMotivoOperacionId] = React.useState(
    defaultValues.origenMotivoOperacionId || ""
  );
  const [fechaMotivoOperacion, setFechaMotivoOperacion] = React.useState(
    defaultValues.fechaMotivoOperacion ? new Date(defaultValues.fechaMotivoOperacion) : null
  );
  const [usuarioMotivoOperacionId, setUsuarioMotivoOperacionId] = React.useState(
    defaultValues.usuarioMotivoOperacionId || ""
  );
  const [fechaOperacionMovCaja, setFechaOperacionMovCaja] = React.useState(
    defaultValues.fechaOperacionMovCaja ? new Date(defaultValues.fechaOperacionMovCaja) : new Date()
  );
  const [operacionSinFactura, setOperacionSinFactura] = React.useState(
    defaultValues.operacionSinFactura || false
  );

  React.useEffect(() => {
    setEmpresaOrigenId(defaultValues.empresaOrigenId || "");
    setCuentaCorrienteOrigenId(defaultValues.cuentaCorrienteOrigenId || "");
    setEmpresaDestinoId(defaultValues.empresaDestinoId || "");
    setCuentaCorrienteDestinoId(defaultValues.cuentaCorrienteDestinoId || "");
    setFecha(defaultValues.fecha ? new Date(defaultValues.fecha) : new Date());
    setTipoMovimientoId(defaultValues.tipoMovimientoId || "");
    setEntidadComercialId(defaultValues.entidadComercialId || "");
    setMonto(defaultValues.monto || 0);
    setMonedaId(defaultValues.monedaId || "");
    setDescripcion(defaultValues.descripcion || "");
    setReferenciaExtId(defaultValues.referenciaExtId || "");
    setTipoReferenciaId(defaultValues.tipoReferenciaId || "");
    setUsuarioId(defaultValues.usuarioId || "");
    setEstadoId(defaultValues.estadoId || "");

    setFechaCreacion(defaultValues.fechaCreacion ? new Date(defaultValues.fechaCreacion) : new Date());
    setFechaActualizacion(defaultValues.fechaActualizacion ? new Date(defaultValues.fechaActualizacion) : new Date());
    setCentroCostoId(defaultValues.centroCostoId || "");
    setModuloOrigenMotivoOperacionId(defaultValues.moduloOrigenMotivoOperacionId || "");
    setOrigenMotivoOperacionId(defaultValues.origenMotivoOperacionId || "");
    setFechaMotivoOperacion(defaultValues.fechaMotivoOperacion ? new Date(defaultValues.fechaMotivoOperacion) : null);
    setUsuarioMotivoOperacionId(defaultValues.usuarioMotivoOperacionId || "");
    setFechaOperacionMovCaja(defaultValues.fechaOperacionMovCaja ? new Date(defaultValues.fechaOperacionMovCaja) : new Date());
    setOperacionSinFactura(defaultValues.operacionSinFactura || false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Actualizar fechaActualizacion automáticamente
    const fechaActual = new Date();
    
    onSubmit({
      empresaOrigenId: empresaOrigenId ? Number(empresaOrigenId) : null,
      cuentaCorrienteOrigenId: cuentaCorrienteOrigenId
        ? Number(cuentaCorrienteOrigenId)
        : null,
      empresaDestinoId: empresaDestinoId ? Number(empresaDestinoId) : null,
      cuentaCorrienteDestinoId: cuentaCorrienteDestinoId
        ? Number(cuentaCorrienteDestinoId)
        : null,
      fecha,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      monto,
      monedaId: monedaId ? Number(monedaId) : null,
      descripcion,
      referenciaExtId,
      tipoReferenciaId: tipoReferenciaId ? Number(tipoReferenciaId) : null,
      usuarioId: usuarioId ? Number(usuarioId) : null,
      estadoId: estadoId ? Number(estadoId) : null,
      // Nuevos campos
      fechaCreacion: isEdit ? fechaCreacion : new Date(),
      fechaActualizacion: fechaActual,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      moduloOrigenMotivoOperacionId: moduloOrigenMotivoOperacionId
        ? Number(moduloOrigenMotivoOperacionId)
        : null,
      origenMotivoOperacionId: origenMotivoOperacionId ? Number(origenMotivoOperacionId) : null,
      fechaMotivoOperacion,
      usuarioMotivoOperacionId: usuarioMotivoOperacionId
        ? Number(usuarioMotivoOperacionId)
        : null,
      fechaOperacionMovCaja: new Date(),
      operacionSinFactura,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaOrigenId">Empresa Origen*</label>
          <Dropdown
            id="empresaOrigenId"
            value={empresaOrigenId}
            options={empresas.map((empresa) => ({
              label: empresa.razonSocial,
              value: empresa.id,
            }))}
            onChange={(e) => setEmpresaOrigenId(e.value)}
            placeholder="Seleccione empresa origen"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaCorrienteOrigenId">Cuenta Origen*</label>
          <Dropdown
            id="cuentaCorrienteOrigenId"
            value={cuentaCorrienteOrigenId}
            options={cuentasCorrientes.map((cuenta) => ({
              label: cuenta.numero,
              value: cuenta.id,
            }))}
            onChange={(e) => setCuentaCorrienteOrigenId(e.value)}
            placeholder="Seleccione cuenta origen"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaDestinoId">Empresa Destino*</label>
          <Dropdown
            id="empresaDestinoId"
            value={empresaDestinoId}
            options={empresas.map((empresa) => ({
              label: empresa.razonSocial,
              value: empresa.id,
            }))}
            onChange={(e) => setEmpresaDestinoId(e.value)}
            placeholder="Seleccione empresa destino"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaCorrienteDestinoId">Cuenta Destino*</label>
          <Dropdown
            id="cuentaCorrienteDestinoId"
            value={cuentaCorrienteDestinoId}
            options={cuentasCorrientes.map((cuenta) => ({
              label: cuenta.numero,
              value: cuenta.id,
            }))}
            onChange={(e) => setCuentaCorrienteDestinoId(e.value)}
            placeholder="Seleccione cuenta destino"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fecha">Fecha*</label>
          <Calendar
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.value)}
            showIcon
            dateFormat="yy-mm-dd"
            disabled={loading}
            required
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoMovimientoId">Tipo Movimiento*</label>
          <Dropdown
            id="tipoMovimientoId"
            value={tipoMovimientoId}
            options={tipoMovEntregaRendir.map((tipo) => ({
              label: tipo.nombre,
              value: tipo.id,
            }))}
            onChange={(e) => setTipoMovimientoId(e.value)}
            placeholder="Seleccione tipo de movimiento"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="entidadComercialId">Entidad Comercial*</label>
          <Dropdown
            id="entidadComercialId"
            value={entidadComercialId}
            options={entidadesComerciales.map((entidad) => ({
              label: entidad.razonSocial,
              value: entidad.id,
            }))}
            onChange={(e) => setEntidadComercialId(e.value)}
            placeholder="Seleccione entidad comercial"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="monto">Monto*</label>
          <InputNumber
            id="monto"
            value={monto}
            onValueChange={(e) => setMonto(e.value)}
            mode="decimal"
            minFractionDigits={2}
            required
            disabled={loading}
            inputStyle={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="monedaId">Moneda*</label>
          <Dropdown
            id="monedaId"
            value={monedaId}
            options={monedas.map((moneda) => ({
              label: moneda.simbolo,
              value: moneda.id,
            }))}
            onChange={(e) => setMonedaId(e.value)}
            placeholder="Seleccione moneda"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcion">Descripción</label>
          <InputText
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="referenciaExtId">Referencia Ext</label>
          <InputText
            id="referenciaExtId"
            value={referenciaExtId}
            onChange={(e) => setReferenciaExtId(e.target.value)}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoReferenciaId">Tipo Referencia</label>
          <Dropdown
            id="tipoReferenciaId"
            value={tipoReferenciaId}
            options={tipoReferenciaMovimientoCaja.map((tipo) => ({
              label: tipo.descripcion,
              value: tipo.id,
            }))}
            onChange={(e) => setTipoReferenciaId(e.value)}
            placeholder="Seleccione tipo de referencia"
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="usuarioId">Usuario</label>
          <InputText
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoId">Estado*</label>
          <InputText
            id="estadoId"
            value={estadoId}
            onChange={(e) => setEstadoId(e.target.value)}
            required
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>

      {/* Sección de Nuevos Campos - MovimientoCaja */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaCreacion">Fecha Creación</label>
          <InputText
            id="fechaCreacion"
            value={fechaCreacion.toLocaleString("es-PE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaActualizacion">Fecha Actualización</label>
          <InputText
            id="fechaActualizacion"
            value={fechaActualizacion.toLocaleString("es-PE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="centroCostoId">Centro de Costo</label>
          <Dropdown
            id="centroCostoId"
            value={centroCostoId}
            options={centrosCosto.map((cc) => ({
              label: `${cc.Codigo} - ${cc.Nombre}`,
              value: cc.id,
            }))}
            onChange={(e) => setCentroCostoId(e.value)}
            placeholder="Seleccione centro de costo"
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="moduloOrigenMotivoOperacionId">Módulo Origen</label>
          <InputText
            id="moduloOrigenMotivoOperacionId"
            value={
              moduloOrigenMotivoOperacionId
                ? `${moduloOrigenMotivoOperacionId} - ${
                    modulos.find((m) => m.id === Number(moduloOrigenMotivoOperacionId))?.nombre || ""
                  }`
                : ""
            }
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="origenMotivoOperacionId">ID Origen Motivo</label>
          <InputText
            id="origenMotivoOperacionId"
            value={origenMotivoOperacionId}
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaMotivoOperacion">Fecha Motivo Operación</label>
          <InputText
            id="fechaMotivoOperacion"
            value={
              fechaMotivoOperacion
                ? fechaMotivoOperacion.toLocaleString("es-PE", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : ""
            }
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="usuarioMotivoOperacionId">Usuario Motivo Operación</label>
          <InputText
            id="usuarioMotivoOperacionId"
            value={
              usuarioMotivoOperacionId
                ? `${usuarioMotivoOperacionId} - ${
                    personal.find((p) => p.id === Number(usuarioMotivoOperacionId))
                      ? `${personal.find((p) => p.id === Number(usuarioMotivoOperacionId)).nombres} ${personal.find((p) => p.id === Number(usuarioMotivoOperacionId)).apellidos}`
                      : ""
                  }`
                : ""
            }
            readOnly
            disabled
            className="p-inputtext-sm"
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="operacionSinFactura">Estado Facturación</label>
          <Button
            type="button"
            label={operacionSinFactura ? "S/FACTURA" : "C/FACTURA"}
            icon={operacionSinFactura ? "pi pi-exclamation-triangle" : "pi pi-check-circle"}
            className={operacionSinFactura ? "p-button-warning" : "p-button-primary"}
            severity={operacionSinFactura ? "warning" : "primary"}
            onClick={() => setOperacionSinFactura(!operacionSinFactura)}
            size="small"
            style={{ width: "100%" }}
            disabled={loading}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
