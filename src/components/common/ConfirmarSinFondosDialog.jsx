// src/components/common/ConfirmarSinFondosDialog.jsx
// Confirmación previa a procesar una operación cuando la cuenta de origen no tiene fondos suficientes.
// La operación NO se bloquea: el usuario decide si la realiza de todas formas.
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function ConfirmarSinFondosDialog({ mensaje, onConfirmar, onCancelar }) {
  return (
    <Dialog
      header="Cuenta sin fondos"
      visible={Boolean(mensaje)}
      onHide={onCancelar}
      style={{ width: "34rem" }}
      modal
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onCancelar} />
          <Button
            label="Procesar de todas formas"
            icon="pi pi-exclamation-triangle"
            severity="danger"
            onClick={onConfirmar}
          />
        </div>
      }
    >
      <p style={{ color: "#c62828", fontWeight: "bold", marginTop: 0, whiteSpace: "pre-line" }}>{mensaje}</p>
      <p style={{ marginBottom: 0 }}>
        ¿Desea realizar la operación de todas formas? La cuenta de origen quedará con saldo negativo.
      </p>
    </Dialog>
  );
}
