import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../../utils/utils";
import { getResponsiveFontSize } from "../../../utils/utils";

const PendientesTable = ({
  pendientes,
  loading,
  onRegistrarPago,
  permisos,
  tipo,
}) => {
  // Templates
  const tipoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.tipo}
        severity={rowData.tipo === "INGRESO" ? "success" : "danger"}
        icon={
          rowData.tipo === "INGRESO" ? "pi pi-arrow-down" : "pi pi-arrow-up"
        }
      />
    );
  };

  const documentoTemplate = (rowData) => {
    return (
      <div>
        <div className="text-sm text-gray-600">{rowData.documentoTipo} {rowData.documentoNumero}</div>
      </div>
    );
  };

  const entidadTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold">{rowData.entidadComercial?.razonSocial}</div>
      </div>
    );
  };

  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-lg">
          {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoPendiente)}
        </div>
      </div>
    );
  };

  const fechaEmisionTemplate = (rowData) => {
    return (
      <div style={{ fontSize: "0.875rem" }}>
        {formatearFecha(rowData.fechaEmision)}
      </div>
    );
  };

  const fechaVencimientoTemplate = (rowData) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(rowData.fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const vencido = vencimiento < hoy;

    return (
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: vencido ? "bold" : "normal",
          color: vencido ? "#dc2626" : "inherit",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {formatearFecha(rowData.fechaVencimiento)}
        {vencido && (
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "0.875rem", color: "#dc2626" }}
          />
        )}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const severityColor = rowData.estado?.severityColor || "secondary";
    return (
      <Tag
        value={rowData.estado?.descripcion}
        severity={severityColor}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    if (!permisos.puedeCrear) return null;

    return (
      <Button
        label="Registrar Pago"
        icon="pi pi-dollar"
        className="p-button-sm p-button-success"
        onClick={() => onRegistrarPago(rowData)}
        tooltip={tipo === "COBRAR" ? "Registrar Cobro" : "Registrar Pago"}
        tooltipOptions={{ position: "left" }}
      />
    );
  };

  return (
    <DataTable
      value={pendientes}
      loading={loading}
      paginator
      rows={20}
      rowsPerPageOptions={[10, 20, 50, 100]}
      emptyMessage="No hay documentos pendientes"
      stripedRows
      showGridlines
      size="small"
      style={{ fontSize: getResponsiveFontSize() }}
    >
      <Column
        field="tipo"
        header="Tipo"
        body={tipoTemplate}
        style={{ width: "100px" }}
      />
      <Column field="origen" header="Origen" style={{ width: "150px" }} />
      <Column
        header="Documento"
        body={documentoTemplate}
        style={{ width: "200px" }}
      />
      <Column
        header="Entidad Comercial"
        body={entidadTemplate}
        style={{ width: "250px" }}
      />
      <Column
        header="F. Emisión"
        body={fechaEmisionTemplate}
        style={{ width: "110px", textAlign: "center" }}
        sortable
        field="fechaEmision"
      />
      <Column
        header="F. Vencimiento"
        body={fechaVencimientoTemplate}
        style={{ width: "130px", textAlign: "center" }}
        sortable
        field="fechaVencimiento"
      />
      <Column
        header="Saldo Pendiente"
        body={montoTemplate}
        style={{ width: "180px" }}
      />
      <Column
        header="Estado"
        body={estadoTemplate}
        style={{ width: "120px" }}
      />
      <Column
        header="Acciones"
        body={accionesTemplate}
        style={{ width: "180px" }}
        frozen
        alignFrozen="right"
      />
    </DataTable>
  );
};

export default PendientesTable;
