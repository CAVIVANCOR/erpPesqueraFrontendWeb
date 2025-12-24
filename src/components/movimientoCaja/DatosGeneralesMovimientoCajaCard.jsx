// src/components/movimientoCaja/DatosGeneralesMovimientoCajaCard.jsx
import React from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";

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
  cuentaDestinoEntidadComercialId,
  setCuentaDestinoEntidadComercialId,
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
  // Nuevos campos de workflow
  generarAsientoContable,
  setGenerarAsientoContable,
  incluirEnReporteFiscal,
  setIncluirEnReporteFiscal,
  motivoSinFactura,
  setMotivoSinFactura,
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
  cuentasEntidadComercial,
  estadosMultiFuncion,
  cuentasOrigenFiltradas,
  cuentasDestinoFiltradas,
  productos,
  productoId,
  setProductoId,
  familiaFiltroId,
  setFamiliaFiltroId,
  readOnly = false,
}) => {
  // IDs de familias de gastos (igual que en DetMovsEntregaRendirForm)
  const familiasGastosIds = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];

  // Filtrar productos por familias de gastos
  const productosGastos = (productos || []).filter((p) => 
    familiasGastosIds.includes(Number(p.familiaId))
  );

  // Obtener familias únicas de los productos filtrados
  const familiasMap = new Map();
  productosGastos.forEach(p => {
    if (p.familia && p.familia.id && p.familia.nombre) {
      const familiaId = Number(p.familia.id);
      if (familiasGastosIds.includes(familiaId) && !familiasMap.has(familiaId)) {
        familiasMap.set(familiaId, {
          label: p.familia.nombre,
          value: familiaId,
        });
      }
    }
  });
  
  const familiasUnicas = Array.from(familiasMap.values())
    .sort((a, b) => a.label.localeCompare(b.label));

  // Filtrar productos por familia seleccionada
  const productosFiltrados = familiaFiltroId
    ? productosGastos.filter(p => Number(p.familiaId) === Number(familiaFiltroId))
    : productosGastos;

  // Opciones de productos para el dropdown
  const productoOptions = productosFiltrados.map((p) => ({
    label: p.descripcionArmada || p.descripcionBase || p.codigo,
    value: Number(p.id),
  }));
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
              disabled={readOnly}
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
              disabled={readOnly || !empresaOrigenId}
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
            <label htmlFor="empresaDestinoId">Empresa Destino (Opcional)</label>
            <Dropdown
              id="empresaDestinoId"
              value={empresaDestinoId}
              options={empresas.map((empresa) => ({
                label: empresa.razonSocial,
                value: Number(empresa.id),
              }))}
              onChange={(e) => setEmpresaDestinoId(e.value)}
              placeholder="Solo para transferencias entre empresas"
              disabled={readOnly}
              filter
              showClear
              style={{ fontWeight: "normal" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="cuentaCorrienteDestinoId">Cuenta Destino (Opcional)</label>
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
              placeholder="Solo para transferencias/reembolsos"
              disabled={readOnly || !empresaDestinoId}
              filter
              showClear
              style={{ fontWeight: "normal" }}
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
              disabled={readOnly}
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
              disabled={readOnly}
              filter
              showClear
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="entidadComercialId">Entidad Comercial (Opcional)</label>
            <Dropdown
              id="entidadComercialId"
              value={entidadComercialId}
              options={entidadesComerciales.map((entidad) => ({
                label: entidad.razonSocial,
                value: Number(entidad.id),
              }))}
              onChange={(e) => setEntidadComercialId(e.value)}
              placeholder="Solo cuando hay proveedor/cliente"
              disabled={readOnly}
              filter
              showClear
              style={{ fontWeight: "normal" }}
            />
          </div>
        </div>

        {/* Cuenta Destino Entidad Comercial */}
        {entidadComercialId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="cuentaDestinoEntidadComercialId">
                Cuenta Bancaria del Proveedor/Cliente (Opcional)
              </label>
              <Dropdown
                id="cuentaDestinoEntidadComercialId"
                value={cuentaDestinoEntidadComercialId}
                options={cuentasEntidadComercial
                  .filter((cta) => cta.entidadComercialId === entidadComercialId)
                  .map((cta) => ({
                    label: `${cta.banco?.nombre || 'N/A'} - ${cta.numeroCuenta || cta.numeroTelefonoBilletera || 'Sin número'} ${cta.BilleteraDigital ? '(Billetera Digital)' : ''} - ${cta.moneda?.simbolo || 'N/A'}`,
                    value: Number(cta.id),
                  }))}
                onChange={(e) => setCuentaDestinoEntidadComercialId(e.value)}
                placeholder="Seleccione cuenta bancaria del proveedor/cliente"
                disabled={readOnly || !entidadComercialId}
                filter
                showClear
                style={{ fontWeight: "normal" }}
              />
            </div>
            <div style={{ flex: 1 }}></div>
          </div>
        )}

        {/* Filtro de Familia y Producto (Gasto) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="familiaFiltro">Filtrar Gastos por Familia (Opcional)</label>
            <Dropdown
              id="familiaFiltro"
              value={familiaFiltroId}
              options={familiasUnicas}
              optionLabel="label"
              optionValue="value"
              placeholder="Todas las familias"
              onChange={(e) => setFamiliaFiltroId(e.value)}
              showClear
              filter
              style={{ fontWeight: "normal" }}
              disabled={readOnly || loading}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="productoId">Gasto Asociado (Opcional)</label>
            <Dropdown
              id="productoId"
              value={productoId}
              options={productoOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione producto/gasto"
              onChange={(e) => setProductoId(e.value)}
              filter
              showClear
              style={{ fontWeight: "normal" }}
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
              inputStyle={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="referenciaExtId">Referencia Ext</label>
            <InputText
              id="referenciaExtId"
              value={referenciaExtId}
              onChange={(e) => setReferenciaExtId(e.target.value)}
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
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
              disabled={readOnly || loading}
            />
          </div>
        </div>

        {/* Sección de Configuración Contable/Fiscal */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="p-field-checkbox" style={{ marginBottom: "0.5rem" }}>
              <Checkbox
                inputId="generarAsientoContable"
                checked={generarAsientoContable}
                onChange={(e) => setGenerarAsientoContable(e.checked)}
                disabled={readOnly || loading}
              />
              <label htmlFor="generarAsientoContable" style={{ marginLeft: "0.5rem" }}>
                Generar Asiento Contable
              </label>
            </div>
            <div className="p-field-checkbox">
              <Checkbox
                inputId="incluirEnReporteFiscal"
                checked={incluirEnReporteFiscal}
                onChange={(e) => setIncluirEnReporteFiscal(e.checked)}
                disabled={readOnly || loading}
              />
              <label htmlFor="incluirEnReporteFiscal" style={{ marginLeft: "0.5rem" }}>
                Incluir en Reporte Fiscal
              </label>
            </div>
          </div>
          {operacionSinFactura && (
            <div style={{ flex: 2 }}>
              <label htmlFor="motivoSinFactura">Motivo Sin Factura</label>
              <InputTextarea
                id="motivoSinFactura"
                value={motivoSinFactura || ""}
                onChange={(e) => setMotivoSinFactura(e.target.value)}
                rows={3}
                placeholder="Indique el motivo por el cual la operación no tiene factura..."
                disabled={readOnly || loading}
                className="p-inputtext-sm"
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DatosGeneralesMovimientoCajaCard;
