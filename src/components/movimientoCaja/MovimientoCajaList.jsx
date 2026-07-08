// src/components/movimientoCaja/MovimientoCajaList.jsx
import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { formatearFecha, formatearNumero } from "../../utils/utils";

export default function MovimientoCajaList({
  movimientos,
  loading,
  empresas,
  tiposMovimiento,
  estados,
  filtros,
  onRowSelect,
  onFilterChange
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  // Aplicar filtros
  const aplicarFiltros = () => {
    const nuevosFiltros = {
      empresaId: empresaSeleccionada?.id || null,
      fechaDesde: rangoFechas?.[0] || null,
      fechaHasta: rangoFechas?.[1] || null,
      tipoMovimientoId: tipoSeleccionado?.id || null,
      estadoId: estadoSeleccionado?.id || null
    };
    onFilterChange(nuevosFiltros);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setRangoFechas(null);
    setTipoSeleccionado(null);
    setEstadoSeleccionado(null);
    onFilterChange({});
  };

  // Templates de columnas
  const fechaTemplate = (rowData) => {
    return formatearFecha(rowData.fechaOperacionMovCaja);
  };

  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        {formatearNumero(rowData.monto)} {rowData.moneda?.simbolo || ""}
      </div>
    );
  };

  const correlativoTemplate = (rowData) => {
    if (!rowData.refOperacionEspecializadaMovCaja) return "-";
    return (
      <Tag value={`#${rowData.refOperacionEspecializadaMovCaja}`} severity="info" />
    );
  };

  const estadoTemplate = (rowData) => {
    const severityMap = {
      20: "warning", // Pendiente
      21: "success", // Validado
      22: "info"     // Asiento Generado
    };
    return (
      <Tag
        value={rowData.estadoMovimientoCaja?.nombre || "N/A"}
        severity={severityMap[rowData.estadoId] || "secondary"}
      />
    );
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h5 className="m-0">Movimientos de Caja</h5>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
          />
        </span>
      </div>
    );
  };

  // Header con filtros
  const header = (
    <div className="grid">
      <div className="col-12 md:col-3">
        <Dropdown
          value={empresaSeleccionada}
          options={empresas}
          onChange={(e) => setEmpresaSeleccionada(e.value)}
          optionLabel="razonSocial"
          placeholder="Empresa"
          filter
          showClear
          className="w-full"
        />
      </div>
      <div className="col-12 md:col-3">
        <Calendar
          value={rangoFechas}
          onChange={(e) => setRangoFechas(e.value)}
          selectionMode="range"
          placeholder="Rango de fechas"
          dateFormat="dd/mm/yy"
          showIcon
          className="w-full"
        />
      </div>
      <div className="col-12 md:col-2">
        <Dropdown
          value={tipoSeleccionado}
          options={tiposMovimiento}
          onChange={(e) => setTipoSeleccionado(e.value)}
          optionLabel="nombre"
          placeholder="Tipo"
          showClear
          className="w-full"
        />
      </div>
      <div className="col-12 md:col-2">
        <Dropdown
          value={estadoSeleccionado}
          options={estados}
          onChange={(e) => setEstadoSeleccionado(e.value)}
          optionLabel="nombre"
          placeholder="Estado"
          showClear
          className="w-full"
        />
      </div>
      <div className="col-12 md:col-2">
        <div className="flex gap-2">
          <Button
            label="Filtrar"
            icon="pi pi-filter"
            onClick={aplicarFiltros}
            className="p-button-primary"
          />
          <Button
            icon="pi pi-filter-slash"
            onClick={limpiarFiltros}
            className="p-button-outlined"
            tooltip="Limpiar filtros"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} />
      
      <DataTable
        value={movimientos}
        loading={loading}
        paginator
        rows={20}
        rowsPerPageOptions={[10, 20, 50, 100]}
        dataKey="id"
        globalFilter={globalFilter}
        header={header}
        emptyMessage="No se encontraron movimientos"
        onRowClick={(e) => onRowSelect(e.data)}
        selectionMode="single"
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          field="fechaOperacionMovCaja"
          header="Fecha"
          body={fechaTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="tipoMovimiento.nombre"
          header="Tipo"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "250px" }}
        />
        <Column
          field="monto"
          header="Monto"
          body={montoTemplate}
          sortable
          style={{ width: "150px" }}
        />
        <Column
          field="refOperacionEspecializadaMovCaja"
          header="Correlativo"
          body={correlativoTemplate}
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="estadoId"
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}