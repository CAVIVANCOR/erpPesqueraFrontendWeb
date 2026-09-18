// src/components/movimientoCaja/MovimientoCajaDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import DatosGeneralesTab from "./tabs/DatosGeneralesTab";
import VoucherIndividualTab from "./tabs/VoucherIndividualTab";
import VoucherConsolidadoTab from "./tabs/VoucherConsolidadoTab";
import ComprobanteGastoTab from "./tabs/ComprobanteGastoTab";
import AsientoContableManager from "../common/AsientoContableManager";
import { obtenerPeriodoActivo } from "../../api/contabilidad/periodoContable";

export default function MovimientoCajaDialog({
  visible,
  movimiento,
  empresas,
  onHide,
  toast,
  onFieldChange,
  onSave,
  readOnly = true
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [periodoContableId, setPeriodoContableId] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ PATRÓN: Obtener período contable desde la fecha del movimiento
  useEffect(() => {
    const cargarPeriodoContable = async () => {
      if (!movimiento?.empresaId) return;

      try {
        // Si el movimiento ya tiene periodoContableId, usarlo
        if (movimiento.periodoContableId) {
          setPeriodoContableId(Number(movimiento.periodoContableId));
          return;
        }

        // Si no, obtener el período activo de la empresa
        const periodoActivo = await obtenerPeriodoActivo(movimiento.empresaId);
        if (periodoActivo?.id) {
          setPeriodoContableId(Number(periodoActivo.id));
        }
      } catch (error) {
        console.error("Error al cargar período contable:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar el período contable",
          life: 3000,
        });
      }
    };

    if (visible && movimiento) {
      cargarPeriodoContable();
    }
  }, [visible, movimiento, toast]);

  if (!movimiento) return null;

  // ⭐ CALLBACK para AsientoContableManager (siguiendo patrón de PreFacturaForm)
  const handleBeforeGenerateAsiento = async () => {
    // El movimiento de caja ya debe tener monto válido
    // No hay validaciones adicionales necesarias
    return true;
  };

  // ⭐ HANDLER para guardar/actualizar
  const handleSave = async () => {
    if (!onSave) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No se ha configurado la función de guardado",
        life: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      await onSave(movimiento);
      
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento de caja actualizado correctamente",
        life: 3000,
      });
      
      onHide();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudo guardar el movimiento de caja",
        life: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-between align-items-center">
      <div>
        {!readOnly && (
          <span className="text-sm text-500">
            <i className="pi pi-info-circle mr-2"></i>
            Recuerde guardar los cambios antes de cerrar
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-secondary"
          disabled={saving}
        />
        {!readOnly && onSave && (
          <Button
            label="Guardar"
            icon="pi pi-save"
            onClick={handleSave}
            className="p-button-success"
            loading={saving}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Detalle de Movimiento de Caja"
      style={{ width: "90vw", maxHeight: "90vh" }}
      modal
      footer={dialogFooter}
      maximizable
    >
      <TabView
        activeIndex={activeTabIndex}
        onTabChange={(e) => setActiveTabIndex(e.index)}
      >
        <TabPanel header="📋 Datos Generales">
          <DatosGeneralesTab
            movimiento={movimiento}
            empresas={empresas}
            toast={toast}
            onFieldChange={onFieldChange}
            readOnly={readOnly}
          />
        </TabPanel>

        <TabPanel header="📄 Voucher Individual">
          <VoucherIndividualTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>

        <TabPanel header="📄 Voucher Contable">
          <VoucherConsolidadoTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>

        <TabPanel header=" Comprobante Gasto">
          <ComprobanteGastoTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>
      </TabView>

      {/* Componente genérico de asientos contables */}
      {movimiento?.id && movimiento?.empresaId && periodoContableId && (
        <div className="mt-3">
          <AsientoContableManager
            documentoId={movimiento.id}
            documentoTipo="MovimientoCaja"
            empresaId={movimiento.empresaId}
            periodoContableId={periodoContableId}
            showAsButton={true}
            onBeforeGenerate={handleBeforeGenerateAsiento}
          />
        </div>
      )}
    </Dialog>
  );
}