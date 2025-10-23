// src/components/requerimientoCompra/PdfDetMovEntregaRendirComprasCard.jsx
// Card para visualizar el PDF del detalle del movimiento de entrega a rendir de compras
import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

export default function PdfDetMovEntregaRendirComprasCard({ movimiento }) {
  if (!movimiento) {
    return (
      <Card title="Detalle Movimiento">
        <Message severity="info" text="No hay movimiento seleccionado" />
      </Card>
    );
  }

  const handleGenerarPDF = () => {
    // Implementar lógica de generación de PDF
    console.log("Generar PDF para movimiento:", movimiento.id);
  };

  const handleDescargar = () => {
    if (movimiento.urlPdfDetMovimiento) {
      window.open(movimiento.urlPdfDetMovimiento, "_blank");
    }
  };

  return (
    <Card
      title="Detalle del Movimiento"
      subTitle={`Movimiento #${movimiento.id} - ${new Date(
        movimiento.fechaMovimiento
      ).toLocaleDateString("es-PE")}`}
    >
      {movimiento.urlPdfDetMovimiento ? (
        <div>
          <iframe
            src={movimiento.urlPdfDetMovimiento}
            style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
            title="Detalle Movimiento PDF"
          />
          <div className="flex gap-2 mt-3">
            <Button
              label="Descargar"
              icon="pi pi-download"
              onClick={handleDescargar}
              className="p-button-sm"
            />
            <Button
              label="Regenerar"
              icon="pi pi-refresh"
              onClick={handleGenerarPDF}
              className="p-button-sm p-button-secondary"
            />
          </div>
        </div>
      ) : (
        <div>
          <Message
            severity="warn"
            text="No hay PDF generado para este movimiento"
            className="mb-3"
          />
          <Button
            label="Generar PDF"
            icon="pi pi-file-pdf"
            onClick={handleGenerarPDF}
            className="p-button-sm"
          />
        </div>
      )}
    </Card>
  );
}