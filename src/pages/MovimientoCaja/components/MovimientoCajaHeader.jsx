import React from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";

const MovimientoCajaHeader = ({
  filtros,
  onFiltroChange,
  onLimpiarFiltros,
  onNuevo,
  loading,
  permisos,
  filterStats,
  // DATOS PARA FILTROS:
  empresas = [],
  cuentasCorrientes = [],
  monedas = [],
  centrosCosto = [],
  personal = [],
  modulos = [],
  estadosMultiFuncion = [],
  tipoMovEntregaRendir = []
}) => {
  // Opciones para los dropdowns
  const empresaOptions = empresas.map(emp => ({
    label: emp.razonSocial,
    value: emp.id
  }));

  const cuentaOptions = cuentasCorrientes.map(cuenta => ({
    label: cuenta.numeroCuenta || `${cuenta.id}`,
    value: cuenta.id
  }));

  const monedaOptions = monedas.map(moneda => ({
    label: moneda.codigoSunat,
    value: moneda.id
  }));

  const centroCostoOptions = centrosCosto.map(centro => ({
    label: centro.Codigo || `${centro.id}`,
    value: centro.id
  }));

  const personalOptions = personal.map(persona => ({
    label: `${persona.nombres} ${persona.apellidos}`,
    value: persona.id
  }));

  const moduloOptions = modulos.map(modulo => ({
    label: modulo.nombre || `${modulo.id}`,
    value: modulo.id
  }));

  const estadoOptions = estadosMultiFuncion.map(estado => ({
    label: estado.descripcion || `ID: ${estado.id}`,
    value: estado.id
  }));

  const tipoMovOptions = tipoMovEntregaRendir.map(tipo => ({
    label: tipo.nombre || `ID: ${tipo.id}`,
    value: tipo.id
  }));

  return (
    <Card className="mb-4">
      <div className="p-fluid">
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: "1rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <h2>
              Movimientos de Caja
            </h2>
             <Badge
              value={`Total: ${filterStats?.total || 0}`}
              severity="info"
            />
            <Badge
              value={`Filtrados: ${filterStats?.filtrados || 0}`}
              severity="success"
            />
            {filterStats?.activos > 0 && (
              <Badge
                value={`${filterStats?.porcentajeFiltrado || 0}% filtrado`}
                severity="warning"
              />
            )}
          </div>

          <div style={{ flex: 0.5 }}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              onClick={onNuevo}
              loading={loading}
              className="p-button-success"
              disabled={!permisos?.puedeCrear}
              tooltip={!permisos?.puedeCrear ? "No tiene permiso para crear" : ""}
              tooltipOptions={{ position: 'top' }}
            />
          </div>
          <div style={{ flex: 0.2 }}>
            <Button
              icon="pi pi-filter-slash"
              onClick={onLimpiarFiltros}
              disabled={filterStats.activos === 0}
              severity="secondary"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Búsqueda Global
            </label>
            <InputText
              value={filtros.global || ""}
              onChange={(e) => onFiltroChange("global", e.target.value)}
              placeholder="Buscar por ID, descripción..."
              className="w-full"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Tipo</label>
            <Dropdown
              value={filtros.tipoMovimientoId}
              options={tipoMovOptions}
              onChange={(e) => onFiltroChange("tipoMovimientoId", e.value)}
              placeholder="Tipo"
              className="w-full"
              showClear
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <label>
              Empresa Origen
            </label>
            <Dropdown
              value={filtros.empresaOrigenId}
              options={empresaOptions}
              onChange={(e) => onFiltroChange("empresaOrigenId", e.value)}
              placeholder="Seleccione"
              className="w-full"
              showClear
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Empresa Destino
            </label>
            <Dropdown
              value={filtros.empresaDestinoId}
              options={empresaOptions}
              onChange={(e) => onFiltroChange("empresaDestinoId", e.value)}
              placeholder="Seleccione"
              className="w-full"
              showClear
              filter
            />
          </div>
          
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label>
              Fecha Desde
            </label>
            <Calendar
              value={filtros.fechaInicio}
              onChange={(e) => onFiltroChange("fechaInicio", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
              placeholder="Desde"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Fecha Hasta
            </label>
            <Calendar
              value={filtros.fechaFin}
              onChange={(e) => onFiltroChange("fechaFin", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
              placeholder="Hasta"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Moneda</label>
            <Dropdown
              value={filtros.monedaId}
              options={monedaOptions}
              onChange={(e) => onFiltroChange("monedaId", e.value)}
              placeholder="Moneda"
              className="w-full"
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Estado</label>
            <Dropdown
              value={filtros.estadoId}
              options={estadoOptions}
              onChange={(e) => onFiltroChange("estadoId", e.value)}
              placeholder="Estado"
              className="w-full"
              showClear
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Monto Mínimo
            </label>
            <InputNumber
              value={filtros.montoMin}
              onValueChange={(e) => onFiltroChange("montoMin", e.value)}
              mode="decimal"
              minFractionDigits={2}
              placeholder="Min"
              className="w-full"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              Monto Máximo
            </label>
            <InputNumber
              value={filtros.montoMax}
              onValueChange={(e) => onFiltroChange("montoMax", e.value)}
              mode="decimal"
              minFractionDigits={2}
              placeholder="Max"
              className="w-full"
            />
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {filterStats.activos > 0 && (
          <div className="mt-3 p-2 bg-blue-50 border-round">
            <span className="text-blue-700 font-medium">
              <i className="pi pi-filter-slash mr-2"></i>
              {filterStats.activos} filtros activos - Mostrando{" "}
              {filterStats.filtrados} de {filterStats.total} registros
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MovimientoCajaHeader;