// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\Pantalla1StockPorAlmacen.jsx

import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressBar } from "primereact/progressbar";
import { formatearNumero, formatearFecha } from "../../../../utils/utils";

/**
 * ============================================================================
 * PANTALLA ÚNICA: Asignación de Stock por Lote
 * ============================================================================
 * 
 * Muestra todos los lotes disponibles con input para asignar cantidad.
 * El usuario ingresa la cantidad y hace click en "Aplicar" por fila.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function Pantalla1StockPorAlmacen({
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  lotesDisponibles,
  asignaciones,
  loading,
  onAplicarAsignacion,
  onQuitarAsignacion
}) {
  // ============================================================================
  // ESTADO LOCAL PARA INPUTS
  // ============================================================================
  const [cantidadesInput, setCantidadesInput] = useState({});

  // ============================================================================
  // CALCULAR TOTALES
  // ============================================================================
  const cantidadAsignada = asignaciones.reduce((sum, a) => sum + Number(a.cantidadAsignada), 0);
  const porcentajeAsignado = cantidadRequerida > 0 ? (cantidadAsignada / cantidadRequerida) * 100 : 0;
  const cantidadRestante = cantidadRequerida - cantidadAsignada;

  // ============================================================================
  // VERIFICAR SI UN LOTE YA ESTÁ ASIGNADO
  // ============================================================================
  const getLoteAsignado = (saldoDetalladoId) => {
    return asignaciones.find(a => a.saldoDetalladoId === saldoDetalladoId);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAplicar = (saldoDetallado) => {
    const cantidad = cantidadesInput[saldoDetallado.id] || 0;
    if (cantidad <= 0) {
      return;
    }

    if (cantidad > Number(saldoDetallado.saldoCantidad)) {
      alert(`La cantidad no puede ser mayor al saldo disponible (${saldoDetallado.saldoCantidad})`);
      return;
    }

    onAplicarAsignacion(saldoDetallado, cantidad);

    // Limpiar input
    setCantidadesInput(prev => ({
      ...prev,
      [saldoDetallado.id]: 0
    }));
  };

  const handleQuitar = (asignacion) => {
    onQuitarAsignacion(asignacion);
  };

  // ============================================================================
  // TEMPLATES DE COLUMNAS
  // ============================================================================
  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || rowData.empresaId || "-";
  };

  const clienteTemplate = (rowData) => {
    return rowData.cliente?.razonSocial || rowData.clienteId || "-";
  };

  const almacenTemplate = (rowData) => {
    return rowData.almacen?.nombre || rowData.almacenId || "-";
  };

  const ubicacionFisicaTemplate = (rowData) => {
    return rowData.ubicacionFisica?.nombre ||
      rowData.ubicacionFisica?.descripcion ||
      (rowData.ubicacionFisicaId ? `Ubicación ${rowData.ubicacionFisicaId}` : "-");
  };

  const productoTemplate = (rowData) => {
    return rowData.producto?.descripcionArmada ||
      rowData.producto?.descripcion ||
      rowData.producto?.nombre ||
      rowData.productoId || "-";
  };

  const unidadMedidaTemplate = (rowData) => {
    return rowData.producto?.unidadMedida?.abreviatura ||
      rowData.producto?.unidadMedida?.simbolo || "-";
  };

  const fechaTemplate = (rowData, field) => {
    return formatearFecha(rowData[field], "-");
  };

  const estadoTemplate = (rowData) => {
    return rowData.estadoMercaderia?.descripcion ||
      rowData.estado?.descripcion || "-";
  };

  const estadoCalidadTemplate = (rowData) => {
    return rowData.estadoCalidad?.descripcion || "-";
  };

  const decimalTemplate = (rowData, field) => {
    return formatearNumero(rowData[field], 2);
  };

  const inputAsignarTemplate = (rowData) => {
    const asignado = getLoteAsignado(rowData.id);

    if (asignado) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Tag
            value={`${formatearNumero(asignado.cantidadAsignada, 2)} ${unidadMedida}`}
            severity="success"
            style={{ fontWeight: "bold" }}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => handleQuitar(asignado)}
            tooltip="Quitar asignación"
          />
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <InputNumber
          value={cantidadesInput[rowData.id]}
          onValueChange={(e) => {
            const valor = e.value === null ? undefined : e.value;
            setCantidadesInput(prev => ({
              ...prev,
              [rowData.id]: valor
            }));
          }}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          min={0}
          max={Number(rowData.saldoCantidad)}
          placeholder="0.00"
          style={{ width: "120px" }}
          disabled={loading}
        />
        <Button
          icon="pi pi-check"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => handleAplicar(rowData)}
          disabled={false}
          tooltip="Aplicar asignación"
        />
      </div>
    );
  };

  const getResponsiveFontSize = () => {
    return window.innerWidth < 768 ? "0.75rem" : "0.875rem";
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <Divider align="left">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="pi pi-box" style={{ fontSize: "1.3em", color: "#667eea" }}></i>
            <b style={{ fontSize: "1.1em", color: "#333" }}>Asignación de Stock</b>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="pi pi-box" style={{ fontSize: "1em", color: "#764ba2" }}></i>
            <span style={{ fontSize: "1em", fontWeight: "600", color: "#555" }}>{productoNombre}</span>
          </div>
          <Tag
            value={`Requerido: ${formatearNumero(cantidadRequerida, 2)} ${unidadMedida}`}
            severity="warning"
            style={{ fontSize: "0.9em", fontWeight: "600" }}
          />
          <Tag
            value={`${lotesDisponibles.length} lote(s)`}
            severity="info"
            style={{ fontSize: "0.9em", fontWeight: "600" }}
          />
        </div>
      </Divider>

      {/* Progreso de asignación */}
      <div style={{
        marginBottom: "1.5rem",
        backgroundColor: "#f8f9fa",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid #e0e0e0"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="pi pi-chart-line" style={{ color: "#2196F3" }}></i>
            <span style={{ fontWeight: "600", fontSize: "0.95em" }}>Progreso de asignación</span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Tag
              value={`${formatearNumero(cantidadAsignada, 2)} / ${formatearNumero(cantidadRequerida, 2)} ${unidadMedida}`}
              severity={porcentajeAsignado >= 100 ? "success" : "info"}
              style={{ fontSize: "0.9em", fontWeight: "bold" }}
            />
            <Tag
              value={`${porcentajeAsignado.toFixed(1)}%`}
              severity={
                porcentajeAsignado >= 100 ? "success" :
                  porcentajeAsignado >= 50 ? "warning" : "danger"
              }
              style={{ fontSize: "1em", fontWeight: "bold", minWidth: "60px", textAlign: "center" }}
            />
          </div>
        </div>
        <ProgressBar
          value={porcentajeAsignado}
          showValue={false}
          color={
            porcentajeAsignado >= 100 ? "#22C55E" :
              porcentajeAsignado >= 50 ? "#F97316" : "#EF4444"
          }
          style={{ height: "12px", borderRadius: "6px" }}
        />
        {cantidadRestante > 0 && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.9em", color: "#666" }}>
            Restante por asignar: <strong>{formatearNumero(cantidadRestante, 2)} {unidadMedida}</strong>
          </div>
        )}
      </div>

      {/* Asignaciones actuales */}
      {asignaciones.length > 0 && (
        <div style={{
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <i className="pi pi-check-circle" style={{ fontSize: "1.5em", color: "#28a745" }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", color: "#155724", marginBottom: "0.25rem" }}>
              Asignaciones realizadas
            </div>
            <div style={{ fontSize: "0.9em", color: "#155724" }}>
              {asignaciones.length} lote(s) seleccionado(s)
            </div>
          </div>
          <Tag
            value={`${asignaciones.length} lotes`}
            severity="success"
            style={{ fontSize: "1em", fontWeight: "bold" }}
          />
        </div>
      )}

      {/* Tabla de Saldos Detallados */}
      <DataTable
        value={lotesDisponibles}
        loading={loading}
        paginator
        rows={20}
        dataKey="id"
        stripedRows
        showGridlines
        style={{ fontSize: getResponsiveFontSize() }}
        emptyMessage="No hay stock disponible"
        scrollable
        scrollHeight="500px"
      >
        <Column
          field="empresa"
          header="Empresa"
          body={empresaTemplate}
          sortable
          frozen
          style={{ minWidth: "150px" }}
        />
        <Column
          field="almacen"
          header="Almacén"
          body={almacenTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="ubicacionFisica"
          header="Ubicación"
          body={ubicacionFisicaTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="lote"
          header="Lote"
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="fechaVencimiento"
          header="F. Vence"
          body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="fechaProduccion"
          header="F. Prod."
          body={(rowData) => fechaTemplate(rowData, "fechaProduccion")}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="estado"
          header="Estado"
          body={estadoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="estadoCalidad"
          header="Calidad"
          body={estadoCalidadTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="saldoCantidad"
          header="Disponible"
          body={(rowData) => decimalTemplate(rowData, "saldoCantidad")}
          sortable
          style={{ textAlign: "right", minWidth: "100px" }}
        />
        <Column
          field="saldoPeso"
          header="Peso (kg)"
          body={(rowData) => decimalTemplate(rowData, "saldoPeso")}
          sortable
          style={{ textAlign: "right", minWidth: "100px" }}
        />
        <Column
          header="Asignar"
          body={inputAsignarTemplate}
          style={{ minWidth: "200px" }}
        />
      </DataTable>
    </>
  );
}