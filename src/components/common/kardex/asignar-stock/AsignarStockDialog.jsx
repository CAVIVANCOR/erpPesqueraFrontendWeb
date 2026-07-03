// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\AsignarStockDialog.jsx

import React, { useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Pantalla1StockPorAlmacen from "./Pantalla1StockPorAlmacen";
import useAsignarStock from "./useAsignarStock";

/**
 * ============================================================================
 * DIÁLOGO: Asignar Stock (SIMPLIFICADO - 1 SOLA PANTALLA)
 * ============================================================================
 * 
 * Diálogo para asignar stock a un detalle de PreFactura.
 * Muestra todos los lotes disponibles y permite asignar cantidades.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function AsignarStockDialog({
  visible,
  onHide,
  empresaId,
  productoId,
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  detallePreFacturaId,
  onConfirmar
}) {
  const toast = useRef(null);

  // ============================================================================
  // HOOK DE ASIGNACIÓN
  // ============================================================================
  const {
    loading,
    lotesDisponibles,
    asignaciones,
    handleAplicarAsignacion,
    handleQuitarAsignacion,
    handleLimpiar,
    validarAsignaciones
  } = useAsignarStock({
    visible,
    empresaId,
    productoId,
    cantidadRequerida,
    detallePreFacturaId
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleConfirmar = async () => {
    // Validar asignaciones
    const validacion = await validarAsignaciones();

    if (!validacion.valido) {
      if (validacion.conflictos) {
        // Mostrar conflictos
        toast.current?.show({
          severity: "error",
          summary: "Conflictos Detectados",
          detail: validacion.conflictos.map(c => c.mensaje).join("\n"),
          life: 8000
        });
      } else {
        toast.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: validacion.mensaje,
          life: 3000
        });
      }
      return;
    }

    // Calcular totales
    const cantidadTotal = asignaciones.reduce((sum, a) => sum + Number(a.cantidadAsignada), 0);
    const pesoTotal = asignaciones.reduce((sum, a) => sum + Number(a.pesoAsignado), 0);

    // Preparar resultado
    const resultado = {
      detallePreFacturaId: detallePreFacturaId,
      asignaciones: asignaciones,
      cantidadTotal: cantidadTotal,
      pesoTotal: pesoTotal
    };

    // Confirmar
    onConfirmar(resultado);

    // Limpiar y cerrar
    handleLimpiar();
    onHide();

    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: `Se asignaron ${asignaciones.length} lote(s) correctamente`,
      life: 3000
    });
  };

  const handleCancelar = () => {
    handleLimpiar();
    onHide();
  };

  // ============================================================================
  // FOOTER
  // ============================================================================
  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: "0.9em", color: "#666" }}>
        {asignaciones.length > 0 && (
          <span>
            <strong>{asignaciones.length}</strong> lote(s) seleccionado(s)
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={handleCancelar}
        />
        <Button
          label="Confirmar Asignación"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleConfirmar}
          disabled={asignaciones.length === 0 || loading}
        />
      </div>
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
        onHide={handleCancelar}
        header="Asignar Stock"
        style={{ width: "95vw", maxWidth: "1800px" }}
        maximizable
        modal
        footer={footer}
      >
        <Pantalla1StockPorAlmacen
          productoNombre={productoNombre}
          cantidadRequerida={cantidadRequerida}
          unidadMedida={unidadMedida}
          lotesDisponibles={lotesDisponibles}
          asignaciones={asignaciones}
          loading={loading}
          onAplicarAsignacion={handleAplicarAsignacion}
          onQuitarAsignacion={handleQuitarAsignacion}
        />
      </Dialog>
    </>
  );
}