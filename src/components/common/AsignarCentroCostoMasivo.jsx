import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import CentroCostoSelector from "./CentroCostoSelector";

export default function AsignarCentroCostoMasivo({
  visible,
  onHide,
  registrosSeleccionados = [],
  onAsignar,
  nombreModulo = "registros",
}) {
  const [centroCostoId, setCentroCostoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsignar = async () => {
    if (!centroCostoId) {
      return;
    }

    setLoading(true);
    try {
      await onAsignar(centroCostoId, registrosSeleccionados);
      setCentroCostoId(null);
      onHide();
    } catch (error) {
      console.error("Error al asignar centro de costo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    setCentroCostoId(null);
    onHide();
  };

  return (
    <Dialog
      header="Asignar Centro de Costo"
      visible={visible}
      style={{ width: "600px" }}
      onHide={handleHide}
      modal
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            <strong>Registros seleccionados:</strong> {registrosSeleccionados.length} {nombreModulo}
          </p>
        </div>

        <div>
          <CentroCostoSelector
            value={centroCostoId}
            onChange={(value) => setCentroCostoId(value)}
            label="Centro de Costo"
            placeholder="Seleccionar centro de costo"
            showClearButton={true}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={handleHide}
            className="p-button-text"
            disabled={loading}
          />
          <Button
            label={`Asignar a ${registrosSeleccionados.length} ${nombreModulo}`}
            icon="pi pi-check"
            onClick={handleAsignar}
            disabled={!centroCostoId || loading}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  );
}