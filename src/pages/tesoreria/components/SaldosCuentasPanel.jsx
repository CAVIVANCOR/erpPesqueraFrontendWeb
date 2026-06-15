import React, { useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { formatearNumero } from "../../../utils/utils";
import { getResponsiveFontSize } from "../../../utils/utils";

const SaldosCuentasPanel = ({
  saldosCuentas,
  saldoConsolidado,
  loading,
  empresaId,
}) => {
  // Estado para controlar si el panel está colapsado
  const [collapsed, setCollapsed] = useState(true);

  // Filtrar solo cuentas con saldo > 0
  const cuentasConSaldo = React.useMemo(() => {
    if (!saldosCuentas) return [];
    return saldosCuentas.filter((cuenta) => Number(cuenta.saldoActual) > 0);
  }, [saldosCuentas]);

  // Template: Banco
  const bancoTemplate = (rowData) => {
    const nombreBanco = rowData.banco?.nombre || "Sin banco";
    return (
      <span
        style={{
          fontSize: "0.875rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <i
          className="pi pi-building"
          style={{ fontSize: "0.75rem", color: "#6c757d" }}
        />
        {nombreBanco}
      </span>
    );
  };

  // Template: Número de Cuenta
  const cuentaTemplate = (rowData) => {
    return (
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: "500",
        }}
      >
        {rowData.numeroCuenta || "S/N"}
      </span>
    );
  };

  // Template: Moneda
  const monedaTemplate = (rowData) => {
    return (
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          textAlign: "center",
          display: "block",
        }}
      >
        {rowData.moneda?.codigoSunat || ""}
      </span>
    );
  };

  // Template: Saldo con fondo de color según moneda
  const saldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoActual || 0);
    const simbolo = rowData.moneda?.simbolo || "";
    const colorFondo = rowData.moneda?.colorFondo;

    return (
      <span
        style={{
          backgroundColor: colorFondo || "#FF0000", // ✅ ROJO si no hay color (para debug)
          color: "#000",
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "0.875rem",
          fontWeight: "700",
          display: "inline-block",
          whiteSpace: "nowrap",
          textAlign: "right",
          minWidth: "120px",
          border: colorFondo ? `2px solid ${colorFondo}` : "2px solid #FF0000",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {simbolo} {formatearNumero(saldo, 2)}
      </span>
    );
  };

  return (
    <Panel
      header="💳 Saldos de Cuentas Corrientes"
      toggleable
      collapsed={collapsed}
      onToggle={(e) => setCollapsed(e.value)}
      style={{ marginBottom: "1rem" }}
    >
      {loading ? (
        <Skeleton height="200px" />
      ) : (
        <DataTable
          value={cuentasConSaldo}
          emptyMessage="No hay cuentas corrientes con saldo"
          stripedRows
          showGridlines
          size="small"
          style={{
            fontSize: getResponsiveFontSize(),
          }}
        >
          <Column
            field="empresa.razonSocial"
            header="Empresa"
            style={{ width: "120px" }}
            sortable
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ width: "180px" }}
            sortable
          />
          <Column
            header="Banco"
            body={bancoTemplate}
            style={{ width: "140px" }}
            sortable
            field="banco.nombre"
          />
          <Column
            header="N° Cuenta"
            body={cuentaTemplate}
            style={{ width: "130px", textAlign: "center" }}
            sortable
            field="numeroCuenta"
          />
          <Column
            header="Moneda"
            body={monedaTemplate}
            style={{ width: "80px", textAlign: "center" }}
            sortable
            field="moneda.codigoSunat"
          />
          <Column
            header="Saldo"
            body={saldoTemplate}
            style={{ width: "140px", textAlign: "right" }}
            sortable
            field="saldoActual"
          />
        </DataTable>
      )}
    </Panel>
  );
};

export default SaldosCuentasPanel;