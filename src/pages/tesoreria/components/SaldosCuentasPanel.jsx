import React, { useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { formatearNumero } from "../../../utils/utils";
import { getResponsiveFontSize } from "../../../utils/utils";

const DIAS_ALERTA_TARJETA = 5;
const diasHastaDiaDelMes = (dia, hoy = new Date()) => {
  if (!dia) return null;
  const objetivo = (anio, mes) => new Date(anio, mes, Math.min(dia, new Date(anio, mes + 1, 0).getDate()));
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let fecha = objetivo(hoy.getFullYear(), hoy.getMonth());
  if (fecha < inicioHoy) fecha = objetivo(hoy.getFullYear(), hoy.getMonth() + 1);
  return Math.round((fecha - inicioHoy) / 86400000);
};
const textoDias = (dias) => (dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`);

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

  // Tarjetas de crédito: su deuda no es caja y se muestra aparte con su línea y sus fechas de cierre y pago
  const tarjetas = React.useMemo(
    () =>
      (saldoConsolidado?.tarjetasCredito || []).map((t) => ({
        ...t,
        diasCierre: diasHastaDiaDelMes(t.diaCierre),
        diasPago: diasHastaDiaDelMes(t.diaPago),
      })),
    [saldoConsolidado],
  );
  const alertasTarjetas = tarjetas.filter(
    (t) => (t.deuda > 0 && t.diasPago !== null && t.diasPago <= DIAS_ALERTA_TARJETA) || (t.diasCierre !== null && t.diasCierre <= DIAS_ALERTA_TARJETA),
  ).length;

  const fechaTarjetaTemplate = (dia, dias, conAlerta) => {
    if (!dia) return <span style={{ color: "#6c757d" }}>-</span>;
    return (
      <span>
        Día {dia}{" "}
        <Tag value={textoDias(dias)} severity={conAlerta && dias <= DIAS_ALERTA_TARJETA ? "danger" : "info"} style={{ fontSize: "0.7rem" }} />
      </span>
    );
  };

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
      header={
        <span>
          💳 Saldos de Cuentas Corrientes
          {alertasTarjetas > 0 && (
            <Tag
              icon="pi pi-exclamation-triangle"
              severity="danger"
              value={`${alertasTarjetas} tarjeta(s) con cierre o pago próximo`}
              style={{ marginLeft: 10, fontSize: "0.75rem" }}
            />
          )}
        </span>
      }
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

      {!loading && tarjetas.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>💳 Tarjetas de Crédito (la deuda no se suma como caja)</h4>
          <DataTable value={tarjetas} stripedRows showGridlines size="small" style={{ fontSize: getResponsiveFontSize() }}>
            <Column header="Tarjeta" body={(t) => `${t.descripcion || t.numeroCuenta}${t.banco ? " - " + t.banco : ""}`} />
            <Column header="Línea" body={(t) => `${t.moneda?.simbolo} ${formatearNumero(t.limiteCredito)}`} style={{ textAlign: "right" }} />
            <Column header="Deuda" body={(t) => <span style={{ color: t.deuda > 0 ? "#c62828" : undefined, fontWeight: "bold" }}>{t.moneda?.simbolo} {formatearNumero(t.deuda)}</span>} style={{ textAlign: "right" }} />
            <Column header="Disponible" body={(t) => <span style={{ color: t.disponible <= 0 ? "#c62828" : "#2e7d32", fontWeight: "bold" }}>{t.moneda?.simbolo} {formatearNumero(t.disponible)}</span>} style={{ textAlign: "right" }} />
            <Column header="Cierra" body={(t) => fechaTarjetaTemplate(t.diaCierre, t.diasCierre, false)} />
            <Column header="Vence el pago" body={(t) => fechaTarjetaTemplate(t.diaPago, t.diasPago, t.deuda > 0)} />
          </DataTable>
        </div>
      )}
    </Panel>
  );
};

export default SaldosCuentasPanel;