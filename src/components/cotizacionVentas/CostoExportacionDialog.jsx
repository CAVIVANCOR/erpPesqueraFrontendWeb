// src/components/cotizacionVentas/CostoExportacionDialog.jsx
/**
 * Diálogo para agregar/editar Costos de Exportación
 * Incluye TODOS los campos del modelo CostosExportacionCotizacion
 * Modularizado profesionalmente para mantener el código limpio
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { Badge } from "primereact/badge";
import { formatearNumero } from "../../utils/utils";

const CostoExportacionDialog = ({
  visible,
  costo,
  onHide,
  onSave,
  onCampoChange,
  productosOptions = [],
  monedasOptions = [],
  proveedoresOptions = [],
  saving = false,
}) => {
  if (!costo) return null;

  // Calcular variación si hay monto real
  const calcularVariacion = () => {
    if (costo.montoReal && costo.montoEstimado) {
      const variacion = Number(costo.montoReal) - Number(costo.montoEstimado);
      const porcentaje =
        Number(costo.montoEstimado) > 0
          ? (variacion / Number(costo.montoEstimado)) * 100
          : 0;
      return { variacion, porcentaje };
    }
    return null;
  };

  const variacion = calcularVariacion();

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={onHide}
        disabled={saving}
      />
      <Button
        label="Guardar"
        icon="pi pi-save"
        onClick={onSave}
        loading={saving}
      />
    </div>
  );

  return (
    <Dialog
      header={
        costo.id
          ? "Editar Costo de Exportación"
          : "Agregar Costo de Exportación"
      }
      visible={visible}
      style={{ width: "900px" }}
      onHide={onHide}
      footer={footer}
      modal
      maximizable
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* SECCIÓN 1: DATOS BÁSICOS */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Producto */}
            <div>
              <label
                htmlFor="productoId"
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Producto (Gasto Exportación) *
              </label>
              <Dropdown
                id="productoId"
                value={costo.productoId}
                options={productosOptions}
                onChange={(e) => onCampoChange("productoId", e.value)}
                placeholder="Seleccionar producto"
                filter
                disabled={!!costo.id}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          {/* Proveedor */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="proveedorId"
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Proveedor
            </label>
            <Dropdown
              id="proveedorId"
              value={costo.proveedorId}
              options={proveedoresOptions}
              onChange={(e) => onCampoChange("proveedorId", e.value)}
              placeholder="Seleccionar proveedor"
              filter
              showClear
              style={{ width: "100%" }}
            />
          </div>

          {/* Orden */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="orden"
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Orden
            </label>
            <InputNumber
              id="orden"
              value={costo.orden}
              onValueChange={(e) => onCampoChange("orden", e.value)}
              min={1}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* SECCIÓN 2: MONTO ESTIMADO */}
        <div>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="pi pi-dollar" style={{ fontSize: "1rem" }} />
            Monto Estimado (al cotizar)
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Moneda */}
            <div>
              <label
                htmlFor="monedaId"
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Moneda *
              </label>
              <Dropdown
                id="monedaId"
                value={costo.monedaId}
                options={monedasOptions}
                onChange={(e) => onCampoChange("monedaId", e.value)}
                placeholder="Seleccionar"
                style={{ width: "100%" }}
              />
            </div>

            {/* Tipo Cambio */}
            <div>
              <label
                htmlFor="tipoCambio"
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Tipo Cambio
              </label>
              <InputNumber
                id="tipoCambio"
                value={costo.tipoCambioAplicado}
                onValueChange={(e) =>
                  onCampoChange("tipoCambioAplicado", e.value)
                }
                minFractionDigits={2}
                maxFractionDigits={6}
                style={{ width: "100%" }}
              />
            </div>

            {/* Monto Estimado */}
            <div>
              <label
                htmlFor="montoEstimado"
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Monto Estimado *
              </label>
              <InputNumber
                id="montoEstimado"
                value={costo.montoEstimado}
                onValueChange={(e) => onCampoChange("montoEstimado", e.value)}
                mode="decimal"
                minFractionDigits={2}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Monto en Moneda Base (calculado) */}
          {costo.montoEstimadoMonedaBase > 0 && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                backgroundColor: "#e3f2fd",
                borderRadius: "6px",
                borderLeft: "4px solid #2196F3",
              }}
            >
              <strong style={{ color: "#1976d2" }}>
                Monto en Moneda Base (USD):
              </strong>{" "}
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                $ {formatearNumero(costo.montoEstimadoMonedaBase)}
              </span>
            </div>
          )}
        </div>


        {/* SECCIÓN 3: MONTO REAL (solo si existe o es edición) */}
        {costo.id && (
          <>
            <div>
              <h4
                style={{
                  margin: "0 0 1rem 0",
                  color: "#495057",
                  fontSize: "1rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <i className="pi pi-chart-line" style={{ fontSize: "1rem" }} />
                Monto Real (después de exportar)
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {/* Monto Real */}
                <div>
                  <label
                    htmlFor="montoReal"
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monto Real
                  </label>
                  <InputNumber
                    id="montoReal"
                    value={costo.montoReal}
                    onValueChange={(e) => onCampoChange("montoReal", e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Monto Real en Moneda Base */}
                <div>
                  <label
                    htmlFor="montoRealMonedaBase"
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Monto Real (Moneda Base)
                  </label>
                  <InputNumber
                    id="montoRealMonedaBase"
                    value={costo.montoRealMonedaBase}
                    onValueChange={(e) =>
                      onCampoChange("montoRealMonedaBase", e.value)
                    }
                    mode="decimal"
                    minFractionDigits={2}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Variación (calculada) */}
              {variacion && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor:
                      variacion.variacion >= 0 ? "#ffebee" : "#e8f5e9",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${
                      variacion.variacion >= 0 ? "#dc3545" : "#28a745"
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        Variación Monto:
                      </span>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color:
                            variacion.variacion >= 0 ? "#dc3545" : "#28a745",
                        }}
                      >
                        {variacion.variacion >= 0 ? "+" : "-"}$
                        {formatearNumero(Math.abs(variacion.variacion))}
                        {variacion.variacion >= 0 ? " ↑" : " ↓"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        Variación %:
                      </span>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color:
                            variacion.porcentaje >= 0 ? "#dc3545" : "#28a745",
                        }}
                      >
                        {variacion.porcentaje >= 0 ? "+" : ""}
                        {formatearNumero(variacion.porcentaje, 2)}%
                        {variacion.porcentaje >= 0 ? " ↑" : " ↓"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Divider />
          </>
        )}

        {/* SECCIÓN 4: CONFIGURACIÓN */}
        <div>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: "1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="pi pi-cog" style={{ fontSize: "1rem" }} />
            Configuración
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Checkboxes */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
              >
                <Checkbox
                  inputId="aplicaSegunIncoterm"
                  checked={costo.aplicaSegunIncoterm}
                  onChange={(e) =>
                    onCampoChange("aplicaSegunIncoterm", e.checked)
                  }
                />
                <label
                  htmlFor="aplicaSegunIncoterm"
                  style={{ cursor: "pointer", fontWeight: "500" }}
                >
                  Aplica según Incoterm
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
              >
                <Checkbox
                  inputId="esObligatorio"
                  checked={costo.esObligatorio}
                  onChange={(e) => onCampoChange("esObligatorio", e.checked)}
                />
                <label
                  htmlFor="esObligatorio"
                  style={{ cursor: "pointer", fontWeight: "500" }}
                >
                  Es Obligatorio
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                }}
              >
                <Checkbox
                  inputId="requiereDocumento"
                  checked={costo.requiereDocumento}
                  onChange={(e) =>
                    onCampoChange("requiereDocumento", e.checked)
                  }
                />
                <label
                  htmlFor="requiereDocumento"
                  style={{ cursor: "pointer", fontWeight: "500" }}
                >
                  Requiere Documento
                </label>
              </div>
            </div>

            {/* Badges informativos */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                justifyContent: "center",
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                Estado:
              </div>
              {costo.aplicaSegunIncoterm && (
                <Badge value="Aplica Incoterm" severity="success" />
              )}
              {costo.esObligatorio && (
                <Badge value="Obligatorio" severity="warning" />
              )}
              {costo.requiereDocumento && (
                <Badge value="Requiere Documento" severity="info" />
              )}
              {costo.movimientoEntregaRendirId && (
                <Badge value="Vinculado a Gasto Real" severity="secondary" />
              )}
              {!costo.aplicaSegunIncoterm &&
                !costo.esObligatorio &&
                !costo.requiereDocumento &&
                !costo.movimientoEntregaRendirId && (
                  <span style={{ color: "#999", fontSize: "0.9rem" }}>
                    Sin configuraciones especiales
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* Información de auditoría (solo en modo edición) */}
        {costo.id && (costo.fechaCreacion || costo.fechaActualizacion) && (
          <>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#999",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              {costo.fechaCreacion && (
                <div>
                  <i
                    className="pi pi-calendar-plus"
                    style={{ marginRight: "0.5rem" }}
                  />
                  <strong>Creado:</strong>{" "}
                  {new Date(costo.fechaCreacion).toLocaleString("es-PE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              )}
              {costo.fechaActualizacion && (
                <div>
                  <i
                    className="pi pi-calendar"
                    style={{ marginRight: "0.5rem" }}
                  />
                  <strong>Actualizado:</strong>{" "}
                  {new Date(costo.fechaActualizacion).toLocaleString("es-PE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default CostoExportacionDialog;
