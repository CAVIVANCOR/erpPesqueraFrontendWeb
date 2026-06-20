// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\configurar-movimientos\ConfigurarMovimientosDialog.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { useConfigurarMovimientos } from "./useConfigurarMovimientos";
import TablaMovimientosPorAlmacen from "./TablaMovimientosPorAlmacen";

/**
 * ============================================================================
 * COMPONENTE GENÉRICO: ConfigurarMovimientosDialog
 * ============================================================================
 * 
 * Diálogo para configurar movimientos de almacén por cada almacén involucrado.
 * Permite seleccionar concepto, fechas, direcciones y observaciones.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */
export default function ConfigurarMovimientosDialog({
  visible,
  onHide,
  empresaId,
  asignacionesStock,
  tipoMovimientoId,
  fechaPorDefecto,
  onConfirmar
}) {
  // ============================================================================
  // HOOK PERSONALIZADO
  // ============================================================================

  const {
    toast,
    loading,
    loadingConceptos,
    loadingDirecciones,
    conceptos,
    direcciones,
    almacenesAgrupados,
    configuraciones,
    handleCambiarConcepto,
    handleCambiarFecha,
    handleCambiarDireccionOrigen,
    handleCambiarDireccionDestino,
    handleCambiarObservaciones,
    handleConfirmar,
    handleCerrar,
    almacenesConfigurados,
    totalAlmacenes
  } = useConfigurarMovimientos({
    visible,
    empresaId,
    asignacionesStock,
    tipoMovimientoId,
    fechaPorDefecto,
    onConfirmar,
    onHide
  });

  // ============================================================================
  // CÁLCULOS
  // ============================================================================

  const porcentajeConfiguracion = totalAlmacenes > 0
    ? (almacenesConfigurados / totalAlmacenes) * 100
    : 0;

  // ============================================================================
  // FOOTER
  // ============================================================================

  const renderFooter = () => (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleCerrar}
        className="p-button-text"
      />
      <Button
        label="Confirmar Configuración"
        icon="pi pi-check-circle"
        onClick={handleConfirmar}
        className="p-button-success"
        disabled={almacenesConfigurados < totalAlmacenes}
        loading={loading}
        autoFocus
      />
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={handleCerrar}
        header="Configurar Movimientos de Almacén"
        style={{ width: "95vw", maxWidth: "1400px" }}
        footer={renderFooter()}
        modal
        closable={false}
      >
        <Divider align="left">
          <div className="inline-flex align-items-center">
            <i className="pi pi-cog mr-2"></i>
            <b>Configuración por Almacén</b>
          </div>
        </Divider>

        {/* Información general */}
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Total de almacenes:</strong> {totalAlmacenes}
          </div>
          <div>
            <strong>Productos totales:</strong>{" "}
            {asignacionesStock?.length || 0} producto(s) con stock asignado
          </div>
        </div>

        {/* Progreso de configuración */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem"
          }}>
            <span>Progreso de configuración:</span>
            <span style={{ fontWeight: "bold" }}>
              {almacenesConfigurados} / {totalAlmacenes} almacenes ({porcentajeConfiguracion.toFixed(0)}%)
            </span>
          </div>
          <ProgressBar
            value={porcentajeConfiguracion}
            showValue={false}
            color={porcentajeConfiguracion >= 100 ? "#4CAF50" : "#2196F3"}
          />
        </div>

        {/* Mensaje de ayuda */}
        <Message
          severity="info"
          text="Configure el concepto de movimiento, fecha y direcciones (si aplica) para cada almacén. Los campos marcados con * son obligatorios."
          style={{ marginBottom: "1rem", width: "100%" }}
        />

        {/* Tabla de configuración */}
        <TablaMovimientosPorAlmacen
          almacenesAgrupados={almacenesAgrupados}
          configuraciones={configuraciones}
          conceptos={conceptos}
          direcciones={direcciones}
          loadingConceptos={loadingConceptos}
          loadingDirecciones={loadingDirecciones}
          onCambiarConcepto={handleCambiarConcepto}
          onCambiarFecha={handleCambiarFecha}
          onCambiarDireccionOrigen={handleCambiarDireccionOrigen}
          onCambiarDireccionDestino={handleCambiarDireccionDestino}
          onCambiarObservaciones={handleCambiarObservaciones}
        />

        {/* Resumen final */}
        {almacenesConfigurados === totalAlmacenes && totalAlmacenes > 0 && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
            border: "2px solid #4CAF50"
          }}>
            <div style={{ fontWeight: "bold", color: "#2e7d32" }}>
              ✅ Todos los almacenes están configurados correctamente
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}