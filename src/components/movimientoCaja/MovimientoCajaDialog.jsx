// src/components/movimientoCaja/MovimientoCajaDialog.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import DatosGeneralesTab from "./tabs/DatosGeneralesTab";
import VoucherIndividualTab from "./tabs/VoucherIndividualTab";
import VoucherAsientoContableTab from "./tabs/VoucherAsientoContableTab";
import ComprobanteGastoTab from "./tabs/ComprobanteGastoTab";
import AsientoContableManager from "../common/AsientoContableManager";

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
  const [saving, setSaving] = useState(false);

  if (!movimiento) return null;

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
    <div
      style={{
        display: "flex",
        justifyContent: "end",
        gap: 8,
        marginTop: 18,
      }}
    >
      {/* Componente genérico de asientos contables en modo solo lectura */}
      <div style={{ flex: 1 }}>
        {movimiento?.id && movimiento?.empresaId && (
          <AsientoContableManager
            documentoId={movimiento.id}
            documentoTipo="MovimientoCaja"
            empresaId={movimiento.empresaId}
            periodoContableId={null}
            showAsButton={true}
            soloVer={true}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
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
    <>
      <ConfirmDialog />
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
            <VoucherAsientoContableTab
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


      </Dialog>
    </>
  );
}