// src/components/movimientoCaja/tabs/DatosGeneralesTab.jsx
import React, { useState } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../../../utils/utils";
import { getMovimientosPorCorrelativo } from "../../../api/movimientoCaja";

export default function DatosGeneralesTab({ movimiento, empresas, toast }) {
  const [showOperacionCompleta, setShowOperacionCompleta] = useState(false);
  const [movimientosOperacion, setMovimientosOperacion] = useState([]);
  const [loadingOperacion, setLoadingOperacion] = useState(false);

  const handleVerOperacionCompleta = async () => {
    if (!movimiento.refOperacionEspecializadaMovCaja) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Este movimiento no tiene correlativo de operación",
        life: 3000
      });
      return;
    }

    try {
      setLoadingOperacion(true);
      const movimientos = await getMovimientosPorCorrelativo(
        movimiento.refOperacionEspecializadaMovCaja
      );
      setMovimientosOperacion(movimientos);
      setShowOperacionCompleta(true);
    } catch (error) {
      console.error("Error al cargar operación completa:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar la operación completa",
        life: 3000
      });
    } finally {
      setLoadingOperacion(false);
    }
  };

  return (
    <div className="fluid">
      {/* ============================================ */}
      {/* SECCIÓN 1: INFORMACIÓN DEL MOVIMIENTO */}
      {/* ============================================ */}
      <Panel header="📄 Información del Movimiento" toggleable>
        {/* FILA 1 */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row"
          }}
        >
          <div style={{ flex: 2 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="empresa"
            >
              Empresa
            </label>
            <div
              id="empresa"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {movimiento.empresaOrigen?.razonSocial || "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="fechaOperacion"
            >
              Fecha Operación
            </label>
            <div
              id="fechaOperacion"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {formatearFecha(movimiento.fechaOperacionMovCaja, "")}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoMovimiento"
            >
              Tipo de Movimiento
            </label>
            <div
              id="tipoMovimiento"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {movimiento.tipoMovimiento?.nombre || "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="estado"
            >
              Estado
            </label>
            <div
              id="estado"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Badge
                value={movimiento.estadoMovimientoCaja?.nombre || "N/A"}
                severity={movimiento.estadoMovimientoCaja?.severityColor || "secondary"}
                size="large"
              />
            </div>
          </div>
        </div>

        {/* FILA 2 */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem"
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="monto"
            >
              Monto
            </label>
            <div
              id="monto"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#e3f2fd",
                fontWeight: "bold",
                fontSize: "1.2rem",
                color: "#1976d2",
                textAlign: "right"
              }}
            >
              {formatearNumero(movimiento.monto, 2)} {movimiento.moneda?.simbolo || ""}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="moneda"
            >
              Moneda
            </label>
            <div
              id="moneda"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {movimiento.moneda?.nombre || "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="tipoCambio"
            >
              Tipo de Cambio
            </label>
            <div
              id="tipoCambio"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textAlign: "right"
              }}
            >
              {movimiento.tipoCambio || "-"}
            </div>
          </div>
        </div>

        {/* FILA 3 */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem"
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="descripcion"
            >
              Descripción
            </label>
            <div
              id="descripcion"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                minHeight: "3rem"
              }}
            >
              {movimiento.descripcion || "-"}
            </div>
          </div>
        </div>
      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 2: CUENTAS BANCARIAS */}
      {/* ============================================ */}
      <Panel header="🏦 Cuentas Bancarias" toggleable style={{ marginTop: "1rem" }}>
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row"
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="cuentaOrigen"
            >
              Cuenta Origen
            </label>
            <div
              id="cuentaOrigen"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold"
              }}
            >
              {movimiento.cuentaCorrienteOrigen
                ? `${movimiento.cuentaCorrienteOrigen.banco?.nombre || ""} - ${
                    movimiento.cuentaCorrienteOrigen.numeroCuenta || ""
                  }`
                : "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="cuentaDestino"
            >
              Cuenta Destino
            </label>
            <div
              id="cuentaDestino"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold"
              }}
            >
              {movimiento.cuentaCorrienteDestino
                ? `${movimiento.cuentaCorrienteDestino.banco?.nombre || ""} - ${
                    movimiento.cuentaCorrienteDestino.numeroCuenta || ""
                  }`
                : "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="medioPago"
            >
              Medio de Pago
            </label>
            <div
              id="medioPago"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {movimiento.medioPago?.nombre || "-"}
            </div>
          </div>
        </div>
      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 3: ORIGEN DE LA OPERACIÓN */}
      {/* ============================================ */}
      <Panel header="📋 Origen de la Operación" toggleable style={{ marginTop: "1rem" }}>
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row"
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="correlativo"
            >
              Correlativo Operación
            </label>
            <div
              id="correlativo"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              {movimiento.refOperacionEspecializadaMovCaja ? (
                <>
                  <Tag
                    value={`#${movimiento.refOperacionEspecializadaMovCaja}`}
                    severity="info"
                    style={{ fontSize: "1rem" }}
                  />
                  <Button
                    label="Ver Operación Completa"
                    icon="pi pi-eye"
                    onClick={handleVerOperacionCompleta}
                    loading={loadingOperacion}
                    className="p-button-sm p-button-outlined p-button-info"
                  />
                </>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="documentoOrigen"
            >
              Documento Origen
            </label>
            <div
              id="documentoOrigen"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              {movimiento.origenMotivoOperacionId ? (
                <>
                  <span style={{ fontWeight: "bold" }}>
                    ID: {movimiento.origenMotivoOperacionId}
                  </span>
                  <Button
                    label="Ver Documento"
                    icon="pi pi-external-link"
                    className="p-button-sm p-button-outlined"
                    disabled
                    tooltip="Funcionalidad en desarrollo"
                  />
                </>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginTop: "1rem"
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              htmlFor="entidadComercial"
            >
              Entidad Comercial
            </label>
            <div
              id="entidadComercial"
              style={{
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {movimiento.entidadComercial?.razonSocial || "-"}
            </div>
          </div>
        </div>
      </Panel>

      {/* Dialog Operación Completa */}
      <Dialog
        visible={showOperacionCompleta}
        onHide={() => setShowOperacionCompleta(false)}
        header={`Operación Completa - Correlativo #${movimiento.refOperacionEspecializadaMovCaja}`}
        style={{ width: "80vw" }}
        modal
      >
        <DataTable
          value={movimientosOperacion}
          loading={loadingOperacion}
          size="small"
          showGridlines
          stripedRows
        >
          <Column field="id" header="ID" style={{ width: "80px" }} sortable />
          <Column
            field="tipoMovimiento.nombre"
            header="Tipo"
            style={{ minWidth: "200px" }}
            sortable
          />
          <Column field="descripcion" header="Descripción" sortable />
          <Column
            field="monto"
            header="Monto"
            body={(rowData) => (
              <div style={{ textAlign: "right" }}>
                {formatearNumero(rowData.monto, 2)} {rowData.moneda?.simbolo || ""}
              </div>
            )}
            style={{ width: "150px", textAlign: "right" }}
            sortable
          />
          <Column
            field="urlOperacionIndividualOperacionCaja"
            header="Voucher"
            body={(rowData) =>
              rowData.urlOperacionIndividualOperacionCaja ? (
                <Tag value="Disponible" severity="success" icon="pi pi-check" />
              ) : (
                <Tag value="No disponible" severity="secondary" />
              )
            }
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
      </Dialog>
    </div>
  );
}