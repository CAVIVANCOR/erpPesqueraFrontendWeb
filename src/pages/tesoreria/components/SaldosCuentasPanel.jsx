import React from "react";
import { Card } from "primereact/card";
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

  // Template: Saldo con colores de fondo
  const saldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoActual || 0);
    const codigoMoneda = rowData.moneda?.codigoSunat;
    const simbolo = rowData.moneda?.simbolo || "";

    // ✅ OPTIMIZADO: Usar colorFondo dinámico desde base de datos
    const colorFondo = rowData.moneda?.colorFondo || "#e2e3e5";
    const estilo = {
      backgroundColor: colorFondo,
      color: "#000",
      border: `1px solid ${colorFondo}`,
    };

    return (
      <span
        style={{
          ...estilo,
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "0.875rem",
          fontWeight: "600",
          display: "inline-block",
          whiteSpace: "nowrap",
          textAlign: "right",
          minWidth: "100px",
        }}
      >
        {simbolo} {formatearNumero(saldo, 2)}
      </span>
    );
  };

  return (
    <Card title="💳 Saldos de Cuentas Corrientes">
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
    </Card>
  );
};

export default SaldosCuentasPanel;
