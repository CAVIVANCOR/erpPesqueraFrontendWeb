/**
 * DescargasTable.jsx
 * Componente para renderizar la tabla de descargas con columnas editables
 */

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { getResponsiveFontSize } from "../../../../utils/utils";

export const DescargasTable = ({
  descargasData,
  loadingDescargas,
  clientes,
  onClienteChange,
  onPrecioChange,
  onActualizarPrecio,
  readOnly,
  header,  // ⭐ NUEVO: Header con botones
  keyValue, // ⭐ NUEVO: Key dinámico para forzar re-render
}) => {
  const clienteBodyTemplate = (rowData) => {
    const clienteIdNumero = rowData.clienteId ? Number(rowData.clienteId) : null;

    if (readOnly) {
      const cliente = clientes.find((c) => Number(c.value) === clienteIdNumero);
      return cliente?.label || "Sin cliente";
    }

    return (
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Dropdown
          value={clienteIdNumero}
          options={clientes}
          onChange={(e) => onClienteChange(rowData.id, e.value)}
          placeholder="Seleccione cliente"
          filter
          showClear
          disabled={readOnly || loadingDescargas}
          style={{ width: "100%", fontWeight: "bold" }}
          optionLabel="label"
          optionValue="value"
        />
        {clienteIdNumero && (
          <Button
            icon="pi pi-refresh"
            size="small"
            severity="info"
            outlined
            onClick={() => onActualizarPrecio(rowData.id)}
            disabled={readOnly || loadingDescargas}
            tooltip="Actualizar precio desde cliente"
            tooltipOptions={{ position: "top" }}
            style={{ flexShrink: 0 }}
          />
        )}
      </div>
    );
  };

  const precioBodyTemplate = (rowData) => {
    if (readOnly) {
      return rowData.precioPorTonComisionFidelizacion
        ? `$${Number(rowData.precioPorTonComisionFidelizacion).toFixed(2)}`
        : "$0.00";
    }

    return (
      <InputNumber
        value={rowData.precioPorTonComisionFidelizacion}
        onValueChange={(e) => onPrecioChange(rowData.id, e.value)}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        prefix="$ "
        disabled={readOnly || loadingDescargas}
        inputStyle={{ fontWeight: "bold", width: "120px" }}
      />
    );
  };

  const puertoDescargaBodyTemplate = (rowData) => {
    return rowData.puertoDescarga?.nombre || "-";
  };

  const especieBodyTemplate = (rowData) => {
    return rowData.especie?.nombre || "-";
  };

  const toneladasBodyTemplate = (rowData) => {
    return Number(rowData.toneladas || 0).toFixed(3);
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaHoraInicioDescarga) return "-";
    return new Date(rowData.fechaHoraInicioDescarga).toLocaleDateString("es-PE");
  };

  return (
    <DataTable
      key={keyValue} // ⭐ CRÍTICO: Key dinámico para forzar re-render
      value={descargasData}
      loading={loadingDescargas}
      header={header} // ⭐ NUEVO: Header con botones
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      emptyMessage="No se encontraron descargas para esta temporada"
      stripedRows
      size="small"
      showGridlines
      style={{ fontSize: getResponsiveFontSize() }}
    >
      <Column
        header="Fecha"
        body={fechaBodyTemplate}
        sortable
        style={{ width: "8%" }}
      />
      <Column
        header="Puerto de Descarga"
        body={puertoDescargaBodyTemplate}
        sortable
        style={{ width: "15%" }}
      />
      <Column
        header="Especie"
        body={especieBodyTemplate}
        sortable
        style={{ width: "12%" }}
      />
      <Column
        header="Toneladas"
        body={toneladasBodyTemplate}
        sortable
        style={{ width: "8%", textAlign:"right" }}
      />
      <Column
        header="Cliente"
        body={clienteBodyTemplate}
        style={{ width: "30%" }}
      />
      <Column
        header="Precio/Ton Comisión (USD)"
        body={precioBodyTemplate}
        style={{ width: "10%", textAlign:"right" }}
      />
    </DataTable>
  );
};