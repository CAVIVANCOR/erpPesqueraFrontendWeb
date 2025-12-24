// src/components/movimientoCaja/WorkflowMovimientoCajaCard.jsx
import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

const WorkflowMovimientoCajaCard = ({
  movimiento,
  onAprobar,
  onRechazar,
  onRevertir,
  loading,
  permisos,
}) => {
  // Determinar si el movimiento está aprobado, rechazado o es reversión
  const estaAprobado = movimiento?.aprobadoPorId != null;
  const estaRechazado = movimiento?.rechazadoPorId != null;
  const esReversion = movimiento?.esReversion === true;
  const tieneAsientosGenerados = movimiento?.asientosGenerados === true;

  // Obtener información del aprobador/rechazador
  const aprobador = movimiento?.personalAprobador;
  const rechazador = movimiento?.personalRechazador;
  const movimientoOriginal = movimiento?.movimientoOriginal;

  return (
    <Card
      title="🔄 Workflow y Estado del Movimiento"
      style={{ marginBottom: "1rem" }}
    >
      <div style={{ padding: "1rem" }}>
        {/* Estado Actual */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ marginBottom: "0.5rem", color: "#495057" }}>
            Estado Actual
          </h4>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {estaAprobado && (
              <Tag
                severity="success"
                icon="pi pi-check-circle"
                value="APROBADO"
                style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
              />
            )}
            {estaRechazado && (
              <Tag
                severity="danger"
                icon="pi pi-times-circle"
                value="RECHAZADO"
                style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
              />
            )}
            {!estaAprobado && !estaRechazado && (
              <Tag
                severity="warning"
                icon="pi pi-clock"
                value="PENDIENTE"
                style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
              />
            )}
            {esReversion && (
              <Tag
                severity="info"
                icon="pi pi-replay"
                value="REVERSIÓN"
                style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
              />
            )}
            {tieneAsientosGenerados && (
              <Tag
                severity="success"
                icon="pi pi-book"
                value="ASIENTOS GENERADOS"
                style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
              />
            )}
          </div>
        </div>

        {/* Información de Aprobación */}
        {estaAprobado && aprobador && (
          <>
            <Divider />
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#22c55e" }}>
                ✓ Información de Aprobación
              </h4>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <div>
                  <strong>Aprobado por:</strong>{" "}
                  {aprobador.nombres} {aprobador.apellidos}
                </div>
                <div>
                  <strong>Fecha:</strong>{" "}
                  {movimiento.fechaAprobacion
                    ? new Date(movimiento.fechaAprobacion).toLocaleString(
                        "es-PE"
                      )
                    : "-"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Información de Rechazo */}
        {estaRechazado && rechazador && (
          <>
            <Divider />
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#ef4444" }}>
                ✗ Información de Rechazo
              </h4>
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>Rechazado por:</strong>{" "}
                    {rechazador.nombres} {rechazador.apellidos}
                  </div>
                  <div>
                    <strong>Fecha:</strong>{" "}
                    {movimiento.fechaRechazo
                      ? new Date(movimiento.fechaRechazo).toLocaleString(
                          "es-PE"
                        )
                      : "-"}
                  </div>
                </div>
              </div>
              {movimiento.motivoRechazo && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#fee2e2",
                    borderRadius: "6px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <strong>Motivo:</strong> {movimiento.motivoRechazo}
                </div>
              )}
            </div>
          </>
        )}

        {/* Información de Reversión */}
        {esReversion && movimientoOriginal && (
          <>
            <Divider />
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#3b82f6" }}>
                ↺ Información de Reversión
              </h4>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Movimiento Original ID:</strong> {movimientoOriginal.id}
              </div>
              {movimiento.motivoReversion && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#dbeafe",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <strong>Motivo:</strong> {movimiento.motivoReversion}
                </div>
              )}
            </div>
          </>
        )}

        {/* Botones de Acción */}
        {!esReversion && permisos?.puedeEditar && (
          <>
            <Divider />
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {!estaAprobado && !estaRechazado && (
                <>
                  <Button
                    label="Aprobar Movimiento"
                    icon="pi pi-check"
                    severity="success"
                    onClick={onAprobar}
                    loading={loading}
                    tooltip="Aprobar este movimiento de caja"
                  />
                  <Button
                    label="Rechazar Movimiento"
                    icon="pi pi-times"
                    severity="danger"
                    onClick={onRechazar}
                    loading={loading}
                    tooltip="Rechazar este movimiento de caja"
                  />
                </>
              )}
              {estaAprobado && (
                <Button
                  label="Revertir Movimiento"
                  icon="pi pi-replay"
                  severity="warning"
                  onClick={onRevertir}
                  loading={loading}
                  tooltip="Crear movimiento de reversión"
                />
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default WorkflowMovimientoCajaCard;
