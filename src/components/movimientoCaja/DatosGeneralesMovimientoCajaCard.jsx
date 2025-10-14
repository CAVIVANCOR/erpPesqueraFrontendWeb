// src/components/movimientoCaja/DatosGeneralesMovimientoCajaCard.jsx
import React from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const DatosGeneralesMovimientoCajaCard = ({
  // Estados
  empresaOrigenId,
  setEmpresaOrigenId,
  cuentaCorrienteOrigenId,
  setCuentaCorrienteOrigenId,
  empresaDestinoId,
  setEmpresaDestinoId,
  cuentaCorrienteDestinoId,
  setCuentaCorrienteDestinoId,
  fecha,
  setFecha,
  tipoMovimientoId,
  setTipoMovimientoId,
  entidadComercialId,
  setEntidadComercialId,
  monto,
  setMonto,
  monedaId,
  setMonedaId,
  descripcion,
  setDescripcion,
  referenciaExtId,
  setReferenciaExtId,
  tipoReferenciaId,
  setTipoReferenciaId,
  usuarioId,
  setUsuarioId,
  estadoId,
  setEstadoId,
  fechaCreacion,
  fechaActualizacion,
  centroCostoId,
  setCentroCostoId,
  moduloOrigenMotivoOperacionId,
  origenMotivoOperacionId,
  fechaMotivoOperacion,
  usuarioMotivoOperacionId,
  operacionSinFactura,
  setOperacionSinFactura,
  // Props
  loading,
  centrosCosto,
  modulos,
  personal,
  empresas,
  tipoMovEntregaRendir,
  monedas,
  tipoReferenciaMovimientoCaja,
  cuentasCorrientes,
  entidadesComerciales,
  estadosMultiFuncion,
  cuentasOrigenFiltradas,
  cuentasDestinoFiltradas,
}) => {
  return (
    <Card
      title="Datos Generales del Movimiento de Caja"
      className="mb-4"
      pt={{
        header: { className: "pb-0" },
        content: { className: "pt-2" },
      }}
    >
      <div className="p-fluid">
        {/* Empresa Origen y Cuenta Origen */}
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
                value: Number(empresa.id),
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
              options={cuentasOrigenFiltradas.map((cuenta) => ({
                label: `${cuenta.banco.nombre} - ${cuenta.numeroCuenta} - ${
                  cuenta.tipoCuentaCorriente.nombre
                } - ${cuenta.moneda?.simbolo || "N/A"}`,
                value: Number(cuenta.id),
              }))}
              onChange={(e) => setCuentaCorrienteOrigenId(e.value)}
              placeholder="Seleccione cuenta origen"
              required
              disabled={loading || !empresaOrigenId}
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        {/* Empresa Destino y Cuenta Destino */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaDestinoId">Empresa Destino*</label>
            <Dropdown
              id="empresaDestinoId"
              value={empresaDestinoId}
              options={empresas.map((empresa) => ({
                label: empresa.razonSocial,
                value: Number(empresa.id),
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
              options={cuentasDestinoFiltradas.map((cuenta) => ({
                label: `${cuenta.banco.nombre} - ${cuenta.numeroCuenta} - ${
                  cuenta.tipoCuentaCorriente.nombre
                } - ${cuenta.moneda?.simbolo || "N/A"}`,
                value: Number(cuenta.id),
              }))}
              onChange={(e) => setCuentaCorrienteDestinoId(e.value)}
              placeholder="Seleccione cuenta destino"
              required
              disabled={loading || !empresaDestinoId}
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        {/* Fecha, Tipo Movimiento, Entidad Comercial */}
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
                value: Number(tipo.id),
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
                value: Number(entidad.id),
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
        </div>

        {/* Moneda, Monto, Referencia, Tipo Referencia */}
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
                value: Number(moneda.id),
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
                value: Number(tipo.id),
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

        {/* Descripción y Estado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 8,
          }}
        >
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
            <label htmlFor="estadoId">Estado*</label>
            <Dropdown
              id="estadoId"
              value={estadoId}
              options={estadosMultiFuncion.map((estado) => ({
                label: estado.descripcion || `ID: ${estado.id}`,
                value: Number(estado.id),
              }))}
              onChange={(e) => setEstadoId(e.value)}
              placeholder="Seleccione estado"
              required
              disabled={loading}
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        {/* Fechas de Creación y Actualización */}
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
          <div style={{ flex: 3 }}>
            <label htmlFor="centroCostoId">Centro de Costo</label>
            <Dropdown
              id="centroCostoId"
              value={centroCostoId}
              options={centrosCosto.map((cc) => ({
                label: `${cc.Codigo} - ${cc.Nombre}`,
                value: Number(cc.id),
              }))}
              onChange={(e) => setCentroCostoId(e.value)}
              placeholder="Seleccione centro de costo"
              disabled={loading}
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>

        {/* Información de Motivo de Operación */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="moduloOrigenMotivoOperacionId">Módulo Origen</label>
            <InputText
              id="moduloOrigenMotivoOperacionId"
              value={
                moduloOrigenMotivoOperacionId
                  ? `${moduloOrigenMotivoOperacionId} - ${
                      modulos.find(
                        (m) =>
                          Number(m.id) === Number(moduloOrigenMotivoOperacionId)
                      )?.nombre || ""
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
            <label htmlFor="usuarioMotivoOperacionId">
              Usuario Motivo Operación
            </label>
            <InputText
              id="usuarioMotivoOperacionId"
              value={
                usuarioMotivoOperacionId
                  ? `${usuarioMotivoOperacionId} - ${
                      personal.find(
                        (p) => Number(p.id) === Number(usuarioMotivoOperacionId)
                      )
                        ? `${
                            personal.find(
                              (p) =>
                                Number(p.id) ===
                                Number(usuarioMotivoOperacionId)
                            ).nombres
                          } ${
                            personal.find(
                              (p) =>
                                Number(p.id) ===
                                Number(usuarioMotivoOperacionId)
                            ).apellidos
                          }`
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
              icon={
                operacionSinFactura
                  ? "pi pi-exclamation-triangle"
                  : "pi pi-check-circle"
              }
              className={
                operacionSinFactura ? "p-button-warning" : "p-button-primary"
              }
              severity={operacionSinFactura ? "warning" : "primary"}
              onClick={() => setOperacionSinFactura(!operacionSinFactura)}
              size="small"
              style={{ width: "100%" }}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DatosGeneralesMovimientoCajaCard;
