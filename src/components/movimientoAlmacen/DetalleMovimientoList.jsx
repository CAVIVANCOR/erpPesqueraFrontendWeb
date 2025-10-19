// Componente modular para mostrar y gestionar detalles de movimiento
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { getResponsiveFontSize } from "../../utils/utils";

export default function DetalleMovimientoList({
  detalles = [],
  onEdit,
  onDelete,
  onVerKardex,
  readOnly = false,
}) {
  const productoTemplate = (rowData) => {
    return rowData.producto?.descripcionArmada || `ID: ${rowData.productoId}`;
  };

  const unidadMedidaTemplate = (rowData) => {
    return rowData.producto?.unidadMedida?.nombre || "-";
  };

  const cantidadTemplate = (rowData) => {
    return rowData.cantidad?.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const pesoTemplate = (rowData) => {
    return rowData.peso
      ? rowData.peso.toLocaleString("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " kg"
      : "-";
  };

  const fechaProduccionTemplate = (rowData) => {
    const fecha = rowData.fechaProduccion;
    if (!fecha) return "-";
    const fechaFormateada = new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return (
      <span
        style={{
          backgroundColor: "#d4edda",
          color: "#155724",
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "500",
        }}
      >
        {fechaFormateada}
      </span>
    );
  };

  const fechaVencimientoTemplate = (rowData) => {
    const fecha = rowData.fechaVencimiento;
    if (!fecha) return "-";

    const fechaVencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);

    const estaVencido = fechaVencimiento < hoy;

    const fechaFormateada = fechaVencimiento.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <span
        style={{
          backgroundColor: estaVencido ? "#f8d7da" : "#fff3cd",
          color: estaVencido ? "#721c24" : "#856404",
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "500",
        }}
      >
        {fechaFormateada}
      </span>
    );
  };

  const estadoMercaderiaTemplate = (rowData) => {
    return rowData.estadoMercaderia?.descripcion || "-";
  };

  const estadoCalidadTemplate = (rowData) => {
    return rowData.estadoCalidad?.descripcion || "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        <Button
          icon="pi pi-chart-line"
          className="p-button-text p-button-sm p-button-success"
          onClick={(e) => {
            e.stopPropagation();
            onVerKardex && onVerKardex(rowData);
          }}
          tooltip="Ver Kardex"
          tooltipOptions={{ position: "top" }}
        />
        {!readOnly && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-text p-button-sm p-button-info"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(rowData);
              }}
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger p-button-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(rowData);
              }}
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <DataTable
        value={detalles}
        emptyMessage="No hay detalles agregados. Haga clic en 'Agregar Detalle' para comenzar."
        size="small"
        stripedRows
        showGridlines
        selectionMode="single"
        onRowClick={(e) => onEdit(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="productoId"
          header="Producto"
          body={productoTemplate}
          style={{ minWidth: "250px" }}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          body={cantidadTemplate}
          style={{ width: "80px", textAlign: "right" }}
        />
        <Column
          field="unidadMedida"
          header="Unidad"
          body={unidadMedidaTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />

        <Column
          field="peso"
          header="Peso"
          body={pesoTemplate}
          style={{ width: "100px", textAlign: "right" }}
        />
        <Column field="lote" header="Lote" style={{ width: "120px" }} />
        <Column
          field="nroContenedor"
          header="N° Contenedor"
          style={{ width: "120px", textAlign: "center" }}
        />
        <Column
          field="estadoMercaderia"
          header="Estado Mercaderia"
          body={estadoMercaderiaTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
        <Column
          field="estadoCalidad"
          header="Estado Calidad"
          body={estadoCalidadTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
        <Column
          field="fechaProduccion"
          header="Fecha Producción"
          body={fechaProduccionTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />
        <Column
          field="fechaVencimiento"
          header="Fecha Vencimiento"
          body={fechaVencimientoTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
