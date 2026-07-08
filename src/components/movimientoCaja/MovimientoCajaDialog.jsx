// src/components/movimientoCaja/MovimientoCajaDialog.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import DatosGeneralesTab from "./tabs/DatosGeneralesTab";
import VoucherIndividualTab from "./tabs/VoucherIndividualTab";
import VoucherConsolidadoTab from "./tabs/VoucherConsolidadoTab";
import AsientoContableTab from "./tabs/AsientoContableTab";
import ComprobanteGastoTab from "./tabs/ComprobanteGastoTab";

export default function MovimientoCajaDialog({
  visible,
  movimiento,
  empresas,
  onHide,
  toast
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (!movimiento) return null;

  const dialogFooter = (
    <div className="flex justify-content-end">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-secondary"
      />
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
          />
        </TabPanel>

        <TabPanel header="📄 Voucher Individual">
          <VoucherIndividualTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>

        <TabPanel header="📄 Voucher Consolidado">
          <VoucherConsolidadoTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>

        <TabPanel header="📊 Asiento Contable">
          <AsientoContableTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>

        <TabPanel header="📄 Comprobante Gasto">
          <ComprobanteGastoTab
            movimiento={movimiento}
            toast={toast}
          />
        </TabPanel>
      </TabView>
    </Dialog>
  );
}