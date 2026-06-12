import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { formatearNumero } from "../../../utils/utils";
import { getResponsiveFontSize } from "../../../utils/utils";

const PendientesHeader = ({
  filtros,
  onFiltroChange,
  onLimpiarFiltros,
  resumen,
  loading,
  permisos,
}) => {
  // Función para obtener el estilo de tag según la moneda
  const getMonedaTagStyle = (codigoMoneda) => {
    const styles = {
      PEN: {
        backgroundColor: "#FFF9C4", // Amarillo muy claro
        color: "#000000",
        border: "1px solid #F9A825",
      },
      USD: {
        backgroundColor: "#C8E6C9", // Verde muy claro
        color: "#000000",
        border: "1px solid #66BB6A",
      },
      EUR: {
        backgroundColor: "#BBDEFB", // Azul muy claro
        color: "#000000",
        border: "1px solid #42A5F5",
      },
    };
    return styles[codigoMoneda] || styles.PEN;
  };

  // Función para renderizar tags de moneda
  const renderMonedaTags = (items) => {
    if (!items || items.length === 0) return null;

    return items.map((item, idx) => {
      const style = getMonedaTagStyle(item.moneda?.codigoSunat);
      return (
        <Tag
          key={idx}
          value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
          style={{
            ...style,
            fontSize: "0.85rem",
            fontWeight: "600",
            padding: "0.4rem 0.75rem",
            borderRadius: "6px",
            marginBottom: "0.25rem",
            display: "block",
            textAlign: "center",
          }}
        />
      );
    });
  };

  // Función para obtener el label con datos del resumen para TIPO
  const getTipoLabel = (tipo) => {
    if (!resumen || loading) {
      return (
        <div className="text-center">
          <div className="font-bold">{tipo.label}</div>
        </div>
      );
    }

    if (tipo.value === null) {
      // Todos - mostrar total combinado
      const totalCobrar =
        resumen.porCobrar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
      const totalPagar =
        resumen.porPagar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

      // Combinar todas las monedas
      const monedasCombinadas = {};

      resumen.porCobrar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      resumen.porPagar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold mb-2" style={{ fontSize: "0.85rem" }}>
            {tipo.label}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {Object.values(monedasCombinadas).map((item, idx) => {
              const style = getMonedaTagStyle(item.moneda?.codigoSunat);
              return (
                <Tag
                  key={idx}
                  value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                  style={{
                    ...style,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.7rem" }}
          >
            ({totalCobrar + totalPagar} docs)
          </div>
        </div>
      );
    } else if (tipo.value === "COBRAR") {
      // Por Cobrar
      const totalDocs =
        resumen.porCobrar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold mb-2" style={{ fontSize: "0.85rem" }}>
            {tipo.label}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {resumen.porCobrar?.map((item, idx) => {
              const style = getMonedaTagStyle(item.moneda?.codigoSunat);
              return (
                <Tag
                  key={idx}
                  value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                  style={{
                    ...style,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.7rem" }}
          >
            ({totalDocs} docs)
          </div>
        </div>
      );
    } else if (tipo.value === "PAGAR") {
      // Por Pagar
      const totalDocs =
        resumen.porPagar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold mb-2" style={{ fontSize: "0.85rem" }}>
            {tipo.label}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {resumen.porPagar?.map((item, idx) => {
              const style = getMonedaTagStyle(item.moneda?.codigoSunat);
              return (
                <Tag
                  key={idx}
                  value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                  style={{
                    ...style,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.7rem" }}
          >
            ({totalDocs} docs)
          </div>
        </div>
      );
    }
  };

  // Función para obtener el label con datos del resumen para VENCIMIENTO
  const getVencimientoLabel = (venc) => {
    if (!resumen || loading) {
      return (
        <div className="text-center">
          <div className="font-bold">{venc.label}</div>
        </div>
      );
    }

    if (venc.value === null) {
      // Todos
      const totalCobrar =
        resumen.porCobrar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
      const totalPagar =
        resumen.porPagar?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

      // Combinar todas las monedas
      const monedasCombinadas = {};

      resumen.porCobrar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      resumen.porPagar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold mb-2" style={{ fontSize: "0.85rem" }}>
            {venc.label}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {Object.values(monedasCombinadas).map((item, idx) => {
              const style = getMonedaTagStyle(item.moneda?.codigoSunat);
              return (
                <Tag
                  key={idx}
                  value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                  style={{
                    ...style,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.7rem" }}
          >
            ({totalCobrar + totalPagar} docs)
          </div>
        </div>
      );
    } else if (venc.value === "VENCIDOS") {
      // Vencidos - mostrar por cobrar y por pagar
      const totalCobrar =
        resumen.vencidos?.cobrar?.reduce(
          (sum, item) => sum + item.cantidad,
          0,
        ) || 0;
      const totalPagar =
        resumen.vencidos?.pagar?.reduce(
          (sum, item) => sum + item.cantidad,
          0,
        ) || 0;

      // Combinar monedas de vencidos
      const monedasCombinadas = {};

      resumen.vencidos?.cobrar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      resumen.vencidos?.pagar?.forEach((item) => {
        const codigo = item.moneda?.codigoSunat;
        if (!monedasCombinadas[codigo]) {
          monedasCombinadas[codigo] = {
            moneda: item.moneda,
            total: 0,
          };
        }
        monedasCombinadas[codigo].total += Number(item.total);
      });

      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold mb-2" style={{ fontSize: "0.85rem" }}>
            {venc.label}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {Object.values(monedasCombinadas).map((item, idx) => {
              const style = getMonedaTagStyle(item.moneda?.codigoSunat);
              return (
                <Tag
                  key={idx}
                  value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                  style={{
                    ...style,
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.7rem" }}
          >
            ({totalCobrar + totalPagar} docs)
          </div>
        </div>
      );
    } else if (venc.value === "HOY" || venc.value === "SEMANA") {
      // Estos no tienen datos específicos en el resumen actual
      return (
        <div className="text-center" style={{ padding: "0.25rem 0" }}>
          <div className="font-bold" style={{ fontSize: "0.85rem" }}>
            {venc.label}
          </div>
          <div
            className="text-xs mt-2"
            style={{ color: "#6c757d", fontStyle: "italic", fontSize: "0.7rem" }}
          >
            (Filtrar para ver)
          </div>
        </div>
      );
    }
  };

  // 🆕 Función para obtener el label con datos del resumen para ENTREGAS
  const getEntregasLabel = (tipo) => {
    if (!resumen || loading) {
      return (
        <div className="text-center">
          <div className="font-bold text-xs">{tipo.label}</div>
        </div>
      );
    }

    const datos =
      tipo.value === "ASIGNACIONES"
        ? resumen.asignaciones
        : resumen.gastosDirectos;

    if (!datos || datos.length === 0) {
      return (
        <div className="text-center" style={{ padding: "0.15rem 0" }}>
          <div className="font-bold mb-1" style={{ fontSize: "0.75rem" }}>
            {tipo.label}
          </div>
          <div className="text-xs" style={{ color: "#6c757d", fontSize: "0.65rem" }}>
            (0 docs)
          </div>
        </div>
      );
    }

    const totalDocs = datos.reduce((sum, item) => sum + item.cantidad, 0);

    return (
      <div className="text-center" style={{ padding: "0.15rem 0" }}>
        <div className="font-bold mb-1" style={{ fontSize: "0.75rem" }}>
          {tipo.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {datos.map((item, idx) => {
            const style = getMonedaTagStyle(item.moneda?.codigoSunat);
            return (
              <Tag
                key={idx}
                value={`${item.moneda?.simbolo} ${formatearNumero(item.total)}`}
                style={{
                  ...style,
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              />
            );
          })}
        </div>
        <div
          className="text-xs mt-1"
          style={{ color: "#6c757d", fontWeight: "500", fontSize: "0.65rem" }}
        >
          ({totalDocs} {tipo.value === "ASIGNACIONES" ? "asig" : "gastos"})
        </div>
      </div>
    );
  };

  // Opciones de tipo con configuración de color
  const tipoOptions = [
    { label: "Todos", value: null, severity: "secondary", icon: "pi pi-list" },
    {
      label: "Por Cobrar",
      value: "COBRAR",
      severity: "success",
      icon: "pi pi-arrow-down",
    },
    {
      label: "Por Pagar",
      value: "PAGAR",
      severity: "danger",
      icon: "pi pi-arrow-up",
    },
  ];

  // 🆕 Opciones de Entregas a Rendir (Asignaciones y Gastos Directos)
  const entregasOptions = [
    {
      label: "Asignaciones",
      value: "ASIGNACIONES",
      severity: "info",
      icon: "pi pi-money-bill",
    },
    {
      label: "Gastos Directos",
      value: "GASTOS_DIRECTOS",
      severity: "warning",
      icon: "pi pi-shopping-cart",
    },
  ];

  // Opciones de vencimiento con configuración de color
  const vencimientoOptions = [
    {
      label: "Todos",
      value: null,
      severity: "secondary",
      icon: "pi pi-calendar",
    },
    {
      label: "Vencidos",
      value: "VENCIDOS",
      severity: "danger",
      icon: "pi pi-exclamation-triangle",
    },
    {
      label: "Vencen Hoy",
      value: "HOY",
      severity: "warning",
      icon: "pi pi-clock",
    },
    {
      label: "Vencen esta Semana",
      value: "SEMANA",
      severity: "info",
      icon: "pi pi-calendar-plus",
    },
  ];

  return (
    <Card title="💰 Tesorería - Documentos Pendientes" className="mb-3">
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 6,
          fontSize: getResponsiveFontSize(),
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Filtro Tipo - Botones de 3 estados + 2 Entregas */}
          <label className="block mb-2 font-bold text-sm">Tipo de Documento</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
            {tipoOptions.map((option) => (
              <Button
                key={option.value || "todos"}
                icon={option.icon}
                severity={option.severity}
                outlined={filtros.tipo !== option.value}
                raised={filtros.tipo === option.value}
                onClick={() => onFiltroChange("tipo", option.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: "90px",
                  minHeight: "85px",
                  padding: "0.4rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                }}
              >
                {getTipoLabel(option)}
              </Button>
            ))}
            {/* 🆕 AGREGAR: Asignaciones y Gastos Directos */}
            {entregasOptions.map((option) => (
              <Button
                key={option.value}
                icon={option.icon}
                severity={option.severity}
                outlined
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: "90px",
                  minHeight: "85px",
                  padding: "0.4rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                }}
              >
                {getEntregasLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {/* Filtro Vencimiento - Botones de 4 estados */}
          <label className="block mb-2 font-bold text-sm">Estado de Vencimiento</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
            {vencimientoOptions.map((option) => (
              <Button
                key={option.value || "todos"}
                icon={option.icon}
                severity={option.severity}
                outlined={filtros.vencimiento !== option.value}
                raised={filtros.vencimiento === option.value}
                onClick={() => onFiltroChange("vencimiento", option.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: "80px",
                  minHeight: "85px",
                  padding: "0.4rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                }}
              >
                {getVencimientoLabel(option)}
              </Button>
            ))}
          </div>
        </div>
        <div style={{ flex: 0.2 }}>
          <label className="block mb-2 font-bold text-sm">Limpiar</label>
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              severity="secondary"
              icon="pi pi-filter-slash"
              label="Limpiar"
              outlined
              onClick={onLimpiarFiltros}
              disabled={loading}
              style={{
                flex: 1,
                minWidth: "75px",
                minHeight: "85px",
                padding: "0.4rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
              }}
            ></Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PendientesHeader;