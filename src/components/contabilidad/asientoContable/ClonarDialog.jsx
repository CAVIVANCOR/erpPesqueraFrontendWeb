// src/components/contabilidad/asientoContable/ClonarDialog.jsx
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

export default function ClonarDialog({
  visible,
  onHide,
  cantidadClones,
  setCantidadClones,
  detallesSeleccionados,
  onClonar,
}) {
  const footer = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        type="button"
      />
      <Button
        label="Clonar"
        icon="pi pi-clone"
        onClick={onClonar}
        disabled={cantidadClones < 1}
        type="button"
      />
    </div>
  );

  return (
    <Dialog
      header="🔄 Clonar Detalle(s)"
      visible={visible}
      style={{ width: "450px" }}
      onHide={onHide}
      footer={footer}
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="cantidadClones">
            ¿Cuántas veces desea clonar? <span style={{ color: "red" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button
              icon="pi pi-minus"
              className="p-button-rounded p-button-outlined"
              onClick={() => setCantidadClones((prev) => Math.max(1, prev - 1))}
              disabled={cantidadClones <= 1}
              type="button"
            />
            <InputText
              id="cantidadClones"
              value={cantidadClones}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setCantidadClones(Math.min(100, Math.max(1, val)));
              }}
              style={{
                textAlign: "center",
                width: "80px",
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            />
            <Button
              icon="pi pi-plus"
              className="p-button-rounded p-button-outlined"
              onClick={() => setCantidadClones((prev) => Math.min(100, prev + 1))}
              disabled={cantidadClones >= 100}
              type="button"
            />
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: "#f0f9ff",
            borderRadius: 6,
            border: "1px solid #bae6fd",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#0369a1" }}>
            <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
            Se crearán <strong>{cantidadClones}</strong>{" "}
            {cantidadClones === 1 ? "copia" : "copias"} de{" "}
            <strong>{detallesSeleccionados.length}</strong>{" "}
            {detallesSeleccionados.length === 1 ? "detalle" : "detalles"} seleccionado(s).
          </p>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Total de nuevos detalles:{" "}
            <strong>{detallesSeleccionados.length * cantidadClones}</strong>
          </p>
        </div>
      </div>
    </Dialog>
  );
}