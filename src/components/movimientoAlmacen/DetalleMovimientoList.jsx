// Componente modular para mostrar y gestionar detalles de movimiento
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";

export default function DetalleMovimientoList({
  detalles = [],
  onEdit,
  onDelete,
  onVerKardex,
  readOnly = false,
  permisos = {},
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
    return rowData.peso ? `${formatearNumero(rowData.peso)} kg` : "-";
  };

  const loteContenedorSerieTemplate = (rowData) => {
    const items = [];
    
    if (rowData.lote) {
      items.push(
        <div 
          key="lote" 
          style={{ 
            marginBottom: "4px",
            backgroundColor: "#fff9c4",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          {rowData.lote}
        </div>
      );
    }
    
    if (rowData.nroContenedor) {
      items.push(
        <div 
          key="contenedor" 
          style={{ 
            marginBottom: "4px",
            backgroundColor: "#e3f2fd",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          Cont: {rowData.nroContenedor}
        </div>
      );
    }
    
    if (rowData.nroSerie) {
      items.push(
        <div 
          key="serie" 
          style={{ 
            backgroundColor: "#fff3cd",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          Serie: {rowData.nroSerie}
        </div>
      );
    }
    
    return items.length > 0 ? <div>{items}</div> : "-";
  };

  const fechasTemplate = (rowData) => {
    const items = [];
    
    if (rowData.fechaIngreso) {
      const fechaFormateada = new Date(rowData.fechaIngreso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      items.push(
        <div 
          key="ingreso" 
          style={{ 
            marginBottom: "4px",
            backgroundColor: "#fff9c4",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          Ingreso: {fechaFormateada}
        </div>
      );
    }
    
    if (rowData.fechaProduccion) {
      const fechaFormateada = new Date(rowData.fechaProduccion).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      items.push(
        <div 
          key="produccion" 
          style={{ 
            marginBottom: "4px",
            backgroundColor: "#e3f2fd",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          Producción: {fechaFormateada}
        </div>
      );
    }
    
    if (rowData.fechaVencimiento) {
      const fechaVencimiento = new Date(rowData.fechaVencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaVencimiento.setHours(0, 0, 0, 0);
      const estaVencido = fechaVencimiento < hoy;
      
      const fechaFormateada = fechaVencimiento.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      
      items.push(
        <div 
          key="vencimiento"
          style={{
            backgroundColor: "#fff3cd",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em"
          }}
        >
          Vencimiento: {fechaFormateada}
        </div>
      );
    }
    
    return items.length > 0 ? <div>{items}</div> : "-";
  };

  const estadosTemplate = (rowData) => {
    const items = [];
    
    if (rowData.estadoMercaderia?.descripcion) {
      items.push(
        <div key="mercaderia" style={{ marginBottom: "4px" }}>
          <span style={{
            backgroundColor: "#ff9800",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em",
            fontWeight: "600",
            display: "inline-block",
            width: "100%",
            textAlign: "center"
          }}>
            {rowData.estadoMercaderia.descripcion}
          </span>
        </div>
      );
    }
    
    if (rowData.estadoCalidad?.descripcion) {
      items.push(
        <div key="calidad">
          <span style={{
            backgroundColor: "#2196F3",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.85em",
            fontWeight: "600",
            display: "inline-block",
            width: "100%",
            textAlign: "center"
          }}>
            {rowData.estadoCalidad.descripcion}
          </span>
        </div>
      );
    }
    
    return items.length > 0 ? <div>{items}</div> : "-";
  };

  const nroItemTemplate = (rowData, options) => {
    return <span style={{ fontWeight: "bold" }}>{options.rowIndex + 1}</span>;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        <Button
          type="button"
          icon="pi pi-chart-line"
          className="p-button-text p-button-sm p-button-success"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onVerKardex && onVerKardex(rowData);
          }}
          tooltip="Ver Kardex"
          tooltipOptions={{ position: "top" }}
        />
        {!readOnly && permisos.puedeEditar && (
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
        )}
        {!readOnly && permisos.puedeEliminar && (
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
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
      >
        <Column
          header="#"
          align="center"
          body={nroItemTemplate}
          style={{ width: "40px", textAlign: "center", fontWeight: "bold" }}
        />
        <Column
          field="productoId"
          header="Producto"
          body={productoTemplate}
          style={{ minWidth: "250px", fontWeight: "bold" }}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          body={cantidadTemplate}
          style={{ width: "80px", textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          field="unidadMedida"
          header="Unidad/Empaque"
          body={unidadMedidaTemplate}
          style={{ width: "180px", textAlign: "center", fontWeight: "bold" }}
        />

        <Column
          field="peso"
          align="center"
          header="Peso"
          body={pesoTemplate}
          style={{ width: "100px", textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          header="Lote / Contenedor / Serie"
          body={loteContenedorSerieTemplate}
          style={{ width: "180px", fontWeight: "bold" }}
        />
        <Column
          header="Fechas"
          body={fechasTemplate}
          style={{ width: "170px", fontWeight: "bold" }}
        />
        <Column
          header="Estados"
          body={estadosTemplate}
          style={{ width: "150px", textAlign: "center", fontWeight: "bold" }}
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
