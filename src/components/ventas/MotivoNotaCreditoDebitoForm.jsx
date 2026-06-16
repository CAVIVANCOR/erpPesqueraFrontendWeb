// src/components/ventas/MotivoNotaCreditoDebitoForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import {
  createMotivoNotaCreditoDebito,
  updateMotivoNotaCreditoDebito,
} from "../../api/ventas/motivoNotaCreditoDebito";
import BooleanToggleButton from "../common/BooleanToggleButton"
export default function MotivoNotaCreditoDebitoForm({
  initialData,
  onSuccess,
  onCancel,
  isEdit,
  usuario,
}) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigoSunat: "",
    descripcion: "",
    esNCND: false,
    activo: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigoSunat: initialData.codigoSunat || "",
        descripcion: initialData.descripcion || "",
        esNCND: initialData.esNCND || false,
        activo: initialData.activo ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigoSunat?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "El código SUNAT es obligatorio.",
        life: 3000,
      });
      return;
    }

    if (!formData.descripcion?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La descripción es obligatoria.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
      };

      if (isEdit) {
        await updateMotivoNotaCreditoDebito(initialData.id, dataToSend);
      } else {
        await createMotivoNotaCreditoDebito(dataToSend);
      }

      onSuccess();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          `No se pudo ${isEdit ? "actualizar" : "crear"} el motivo de NC/ND.`,
        life: 3000,
      });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Toast ref={toast} />

      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Código SUNAT */}
        <div>
          <label
            htmlFor="codigoSunat"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Código SUNAT <span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="codigoSunat"
            value={formData.codigoSunat}
            onChange={(e) => handleChange("codigoSunat", e.target.value)}
            style={{ width: "100%", textTransform: "uppercase" }}
            maxLength={10}
            placeholder="01"
          />
          <small style={{ color: "#666", fontSize: "0.85rem" }}>
            Código oficial SUNAT (máx. 10 caracteres)
          </small>
        </div>

        {/* Descripción */}
        <div>
          <label
            htmlFor="descripcion"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Descripción <span style={{ color: "red" }}>*</span>
          </label>
          <InputText
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            style={{ width: "100%", textTransform: "uppercase" }}
            maxLength={255}
            placeholder="ANULACIÓN DE LA OPERACIÓN"
          />
        </div>

        {/* Características - Grid de Checkboxes */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>
            CARACTERÍSTICAS
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BooleanToggleButton
                value={formData.esNCND}
                onChange={(val) => handleChange("esNCND", val)}
                labelTrue="NOTA DEBITO"
                labelFalse="NOTA CREDITO"
                severityTrue="info"
                severityFalse="success"
                size="large"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BooleanToggleButton
                value={formData.activo}
                onChange={(val) => handleChange("activo", val)}
                labelTrue="ACTIVO"
                labelFalse="INACTIVO"
                severityTrue="primary"
                severityFalse="danger"
                size="large"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            className="p-button-success"
            loading={loading}
          />
        </div>
      </div>
    </form>
  );
}