/**
 * ComisionesTable.jsx
 * Componente para renderizar la tabla de comisiones generadas con subtotales por cliente
 */
import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import {
  getResponsiveFontSize,
  formatearNumero,
} from "../../../../utils/utils";

export const ComisionesTable = ({ comisionesGeneradas, loadingComisiones }) => {
  
  const personalBodyTemplate = (rowData) => {
    const personal = rowData.personal;
    if (!personal) return "Sin personal";
    return `${personal.nombres} ${personal.apellidos}`;
  };

  const toneladasBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        {formatearNumero(rowData.toneladasCapturadas || 0, 3)} Ton
      </div>
    );
  };

  const precioBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        $ {formatearNumero(rowData.precioPorTonComisionFidelizacion || 0, 2)}
      </div>
    );
  };

  const montoBodyTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", color: "#2196F3" }}>
        $ {formatearNumero(rowData.montoPagarFidelizacionDolares || 0, 2)}
      </div>
    );
  };

  // Template para el header de grupo (subtotal por cliente)
  const rowGroupHeaderTemplate = (data) => {
    const clienteNombre = data.entidadComercial?.razonSocial || "Sin cliente";

    // Calcular subtotal del cliente
    const subtotal = comisionesGeneradas
      .filter((c) => c.entidadComercial?.razonSocial === clienteNombre)
      .reduce(
        (sum, c) => sum + Number(c.montoPagarFidelizacionDolares || 0),
        0,
      );

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem",
          backgroundColor: "#f8f9fa",
          fontWeight: "bold",
        }}
      >
        <span style={{ fontSize: "1.1rem", color: "#495057" }}>
          {clienteNombre}
        </span>
        <span style={{ fontSize: "1.1rem", color: "#2196F3" }}>
          Subtotal: $ {formatearNumero(subtotal, 2)}
        </span>
      </div>
    );
  };

  // Footer con total general usando ColumnGroup
  const totalGeneral = comisionesGeneradas.reduce(
    (sum, c) => sum + Number(c.montoPagarFidelizacionDolares || 0),
    0,
  );

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="TOTAL GENERAL:"
          colSpan={3}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        />
        <Column
          footer={`$ ${formatearNumero(totalGeneral, 2)}`}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "1.1rem",
            color: "#2196F3",
          }}
        />
      </Row>
    </ColumnGroup>
  );

  // Header con título
  const header = (
    <div style={{ padding: "0.5rem" }}>
      <h3 style={{ margin: 0 }}>Comisiones de Fidelización</h3>
    </div>
  );

  return (
    <DataTable
      value={comisionesGeneradas}
      loading={loadingComisiones}
      header={header}
      emptyMessage="No hay comisiones generadas"
      stripedRows
      size="small"
      showGridlines
      footerColumnGroup={footerGroup}
      style={{ fontSize: getResponsiveFontSize() }}
      rowGroupMode="subheader"
      groupRowsBy="entidadComercial.razonSocial"
      sortField="entidadComercial.razonSocial"
      sortOrder={1}
      rowGroupHeaderTemplate={rowGroupHeaderTemplate}
    >
      <Column
        header="Personal"
        body={personalBodyTemplate}
        sortable
        style={{ width: "35%" }}
      />
      <Column
        header="Toneladas"
        body={toneladasBodyTemplate}
        sortable
        style={{ width: "20%" }}
      />
      <Column
        header="Precio/Ton (USD)"
        body={precioBodyTemplate}
        sortable
        style={{ width: "20%" }}
      />
      <Column
        header="Monto Comisión (USD)"
        body={montoBodyTemplate}
        sortable
        style={{ width: "25%" }}
      />
    </DataTable>
  );
};