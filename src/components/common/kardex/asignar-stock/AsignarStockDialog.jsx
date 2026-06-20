// C:\Proyectos\megui\erp\erp-pesquera-frontend-web\src\components\common\kardex\asignar-stock\AsignarStockDialog.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useAsignarStock } from "./useAsignarStock";
import Pantalla1StockPorAlmacen from "./Pantalla1StockPorAlmacen";
import Pantalla2StockDetallado from "./Pantalla2StockDetallado";
import Pantalla3Confirmacion from "./Pantalla3Confirmacion";

/**
 * ============================================================================
 * COMPONENTE GENÉRICO: AsignarStockDialog
 * ============================================================================
 * 
 * Contenedor principal del diálogo de asignación de stock.
 * Maneja la navegación entre pantallas y delega la lógica al hook.
 * 
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 * 
 * @author ERP Megui - Sistema Profesional
 * @version 1.0.0
 */
export default function AsignarStockDialog({
  visible,
  onHide,
  empresaId,
  productoId,
  productoNombre,
  cantidadRequerida,
  unidadMedida,
  onConfirmar,
  asignacionPrevia = null
}) {
  // ============================================================================
  // HOOK PERSONALIZADO
  // ============================================================================

  const {
    toast,
    loading,
    pantalla,
    stockPorAlmacen,
    stockDetallado,
    almacenSeleccionado,
    asignaciones,
    lotesSeleccionados,
    cantidadAsignada,
    porcentajeAsignado,
    handleSeleccionarAlmacen,
    handleVolverAPantalla1,
    handleIrAConfirmacion,
    handleVolverDesdePantalla3,
    handleAgregarSeleccion,
    handleEliminarAsignacion,
    handleToggleLote,
    handleCambiarCantidad,
    handleAsignarAutomaticoFIFO,
    handleConfirmarAsignacion,
    handleCerrar
  } = useAsignarStock({
    visible,
    empresaId,
    productoId,
    productoNombre,
    cantidadRequerida,
    unidadMedida,
    asignacionPrevia,
    onConfirmar,
    onHide
  });

  // ============================================================================
  // FOOTER DINÁMICO
  // ============================================================================

  const renderFooter = () => {
    if (pantalla === 1) {
      return (
        <div>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={handleCerrar}
            className="p-button-text"
          />
          <Button
            label="Finalizar"
            icon="pi pi-check"
            onClick={handleIrAConfirmacion}
            disabled={cantidadAsignada < cantidadRequerida}
            autoFocus
          />
        </div>
      );
    }

    if (pantalla === 2) {
      return (
        <div>
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            onClick={handleVolverAPantalla1}
            className="p-button-text"
          />
          <Button
            label="Agregar Selección"
            icon="pi pi-plus"
            onClick={handleAgregarSeleccion}
            disabled={lotesSeleccionados.length === 0}
            autoFocus
          />
        </div>
      );
    }

    if (pantalla === 3) {
      return (
        <div>
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            onClick={handleVolverDesdePantalla3}
            className="p-button-text"
          />
          <Button
            label="Confirmar Asignación"
            icon="pi pi-check-circle"
            onClick={handleConfirmarAsignacion}
            className="p-button-success"
            disabled={cantidadAsignada < cantidadRequerida}
            autoFocus
          />
        </div>
      );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={handleCerrar}
        header="Asignar Stock de Producto"
        style={{ width: "90vw", maxWidth: "1200px" }}
        footer={renderFooter()}
        modal
        closable={false}
      >
        {pantalla === 1 && (
          <Pantalla1StockPorAlmacen
            productoNombre={productoNombre}
            cantidadRequerida={cantidadRequerida}
            unidadMedida={unidadMedida}
            cantidadAsignada={cantidadAsignada}
            porcentajeAsignado={porcentajeAsignado}
            asignaciones={asignaciones}
            stockPorAlmacen={stockPorAlmacen}
            loading={loading}
            onSeleccionarAlmacen={handleSeleccionarAlmacen}
          />
        )}

        {pantalla === 2 && (
          <Pantalla2StockDetallado
            productoNombre={productoNombre}
            cantidadRequerida={cantidadRequerida}
            unidadMedida={unidadMedida}
            cantidadAsignada={cantidadAsignada}
            almacenSeleccionado={almacenSeleccionado}
            stockDetallado={stockDetallado}
            lotesSeleccionados={lotesSeleccionados}
            loading={loading}
            onToggleLote={handleToggleLote}
            onCambiarCantidad={handleCambiarCantidad}
            onAsignarAutomaticoFIFO={handleAsignarAutomaticoFIFO}
          />
        )}

        {pantalla === 3 && (
          <Pantalla3Confirmacion
            productoNombre={productoNombre}
            cantidadRequerida={cantidadRequerida}
            unidadMedida={unidadMedida}
            cantidadAsignada={cantidadAsignada}
            porcentajeAsignado={porcentajeAsignado}
            asignaciones={asignaciones}
            onEliminarAsignacion={handleEliminarAsignacion}
          />
        )}
      </Dialog>
    </>
  );
}