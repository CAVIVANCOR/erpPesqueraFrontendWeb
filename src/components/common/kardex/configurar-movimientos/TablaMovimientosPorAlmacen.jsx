// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\configurar-movimientos\TablaMovimientosPorAlmacen.jsx

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";

/**
 * ============================================================================
 * COMPONENTE: TablaMovimientosPorAlmacen
 * ============================================================================
 * 
 * Tabla editable para configurar movimientos por almacén.
 * Permite seleccionar concepto, fechas, direcciones y observaciones.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function TablaMovimientosPorAlmacen({
  almacenesAgrupados,
  configuraciones,
  conceptos,
  direcciones,
  loadingConceptos,
  loadingDirecciones,
  onCambiarConcepto,
  onCambiarFecha,
  onCambiarDireccionOrigen,
  onCambiarDireccionDestino,
  onCambiarObservaciones
}) {
  // ============================================================================
  // HELPERS
  // ============================================================================

  const getConfiguracion = (almacenId) => {
    return configuraciones.find(c => c.almacenId === almacenId) || {};
  };

  // ============================================================================
  // TEMPLATES DE COLUMNAS
  // ============================================================================

  const almacenTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);
    const esCompleto = config.conceptoMovAlmacenId && config.fechaMovimiento;

    return (
      <div>
        <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
          {rowData.almacenNombre}
        </div>
        <div style={{ fontSize: "0.85em", color: "#666" }}>
          {rowData.numLotes} lote(s) · {rowData.totalCantidad.toFixed(2)} unidades
        </div>
        {esCompleto && (
          <Tag
            value="✓ Configurado"
            severity="success"
            style={{ fontSize: "0.75em", marginTop: "0.25rem" }}
          />
        )}
      </div>
    );
  };

  const conceptoTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);

    return (
      <Dropdown
        value={config.conceptoMovAlmacenId}
        options={conceptos}
        onChange={(e) => onCambiarConcepto(rowData.almacenId, e.value)}
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccionar concepto"
        filter
        showClear
        loading={loadingConceptos}
        style={{ width: "100%" }}
        emptyMessage="No hay conceptos disponibles"
      />
    );
  };

  const fechaTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);

    return (
      <Calendar
        value={config.fechaMovimiento}
        onChange={(e) => onCambiarFecha(rowData.almacenId, e.value)}
        dateFormat="dd/mm/yy"
        showIcon
        showButtonBar
        placeholder="Seleccionar fecha"
        style={{ width: "100%" }}
      />
    );
  };

  const direccionOrigenTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);

    if (!config.requiereDireccionOrigen) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <Dropdown
        value={config.direccionOrigenId}
        options={direcciones}
        onChange={(e) => onCambiarDireccionOrigen(rowData.almacenId, e.value)}
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccionar origen"
        filter
        showClear
        loading={loadingDirecciones}
        style={{ width: "100%" }}
        emptyMessage="No hay direcciones disponibles"
      />
    );
  };

  const direccionDestinoTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);

    if (!config.requiereDireccionDestino) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <Dropdown
        value={config.direccionDestinoId}
        options={direcciones}
        onChange={(e) => onCambiarDireccionDestino(rowData.almacenId, e.value)}
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccionar destino"
        filter
        showClear
        loading={loadingDirecciones}
        style={{ width: "100%" }}
        emptyMessage="No hay direcciones disponibles"
      />
    );
  };

  const observacionesTemplate = (rowData) => {
    const config = getConfiguracion(rowData.almacenId);

    return (
      <InputTextarea
        value={config.observaciones || ""}
        onChange={(e) => onCambiarObservaciones(rowData.almacenId, e.target.value)}
        placeholder="Observaciones opcionales"
        rows={2}
        style={{ width: "100%", resize: "none" }}
      />
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DataTable
      value={almacenesAgrupados}
      emptyMessage="No hay almacenes para configurar"
      size="small"
      stripedRows
      scrollable
      scrollHeight="500px"
    >
      <Column
        header="Almacén"
        body={almacenTemplate}
        style={{ width: "200px" }}
        frozen
      />
      <Column
        header="Concepto de Movimiento *"
        body={conceptoTemplate}
        style={{ width: "300px" }}
      />
      <Column
        header="Fecha Movimiento *"
        body={fechaTemplate}
        style={{ width: "180px" }}
      />
      <Column
        header="Dirección Origen"
        body={direccionOrigenTemplate}
        style={{ width: "250px" }}
      />
      <Column
        header="Dirección Destino"
        body={direccionDestinoTemplate}
        style={{ width: "250px" }}
      />
      <Column
        header="Observaciones"
        body={observacionesTemplate}
        style={{ width: "300px" }}
      />
    </DataTable>
  );
}