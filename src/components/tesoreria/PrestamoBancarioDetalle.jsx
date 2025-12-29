// src/components/tesoreria/PrestamoBancarioDetalle.jsx
import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import PrestamoBancarioForm from "./PrestamoBancarioForm";
import CuotaPrestamoList from "./CuotaPrestamoList";

export default function PrestamoBancarioDetalle({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prestamoData, setPrestamoData] = useState(defaultValues);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    setPrestamoData(data);
  };

  return (
    <div>
      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <PrestamoBancarioForm
            isEdit={isEdit}
            defaultValues={prestamoData}
            onSubmit={handleFormSubmit}
            onCancel={onCancel}
            loading={loading}
            readOnly={readOnly}
          />

          {isEdit && prestamoData?.id && (
            <div style={{ marginTop: 30, borderTop: "2px solid #ddd", paddingTop: 20 }}>
              <h3 style={{ marginBottom: 15 }}>Cuotas del Préstamo</h3>
              <CuotaPrestamoList
                prestamoBancarioId={prestamoData.id}
                readOnly={readOnly}
              />
            </div>
          )}
        </TabPanel>
      </TabView>
    </div>
  );
}