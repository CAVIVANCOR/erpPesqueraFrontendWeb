// src/components/requerimientoCompra/PdfComprobanteOperacionDetMovComprasCard.jsx
// Card para visualizar el PDF del comprobante de operación del movimiento de compras
import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

export default function PdfComprobanteOperacionDetMovComprasCard({ movimiento }) {
  if (!movimiento) {
    return (
      <Card title="Comprobante de Operación">
        <Message severity="info" text="No hay movimiento seleccionado" />
      </Card>
    );
  }

  const handleDescargar = () => {
    if (movimiento.urlComprobanteMovimiento) {
      window.open(movimiento.urlComprobanteMovimiento, "_blank");
    }
  };

  const handleSubir = () => {
    // Implementar lógica de subida de archivo
    console.log("Subir comprobante para movimiento:", movimiento.id);
  };

  return (
    <Card
      title="Comprobante de Operación"
      subTitle={`Movimiento #${movimiento.id}`}
    >
      {movimiento.urlComprobanteMovimiento ? (
        <div>
          <iframe
            src={movimiento.urlComprobanteMovimiento}
            style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
            title="Comprobante de Operación"
          />
          <div className="flex gap-2 mt-3">
            <Button
              label="Descargar"
              icon="pi pi-download"
              onClick={handleDescargar}
              className="p-button-sm"
            />
            <Button
              label="Actualizar"
              icon="pi pi-upload"
              onClick={handleSubir}
              className="p-button-sm p-button-secondary"
            />
          </div>
        </div>
      ) : (
        <div>
          <Message
            severity="warn"
            text="No hay comprobante de operación cargado"
            className="mb-3"
          />
          <Button
            label="Subir Comprobante"
            icon="pi pi-upload"
            onClick={handleSubir}
            className="p-button-sm"
          />
        </div>
      )}
    </Card>
  );
}