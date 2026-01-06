// src/components/tesoreria/TipoPrestamoForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import {
  createTipoPrestamo,
  updateTipoPrestamo,
} from "../../api/tesoreria/tipoPrestamo";

// Opciones de colores para el Badge (igual que EstadoMultiFuncionForm)
const opcionesSeverityColor = [
  { label: "Éxito (Verde)", value: "success" },
  { label: "Información (Azul)", value: "info" },
  { label: "Advertencia (Anaranjado)", value: "warning" },
  { label: "Peligro (Rojo)", value: "danger" },
  { label: "Secundario (Gris Claro)", value: "secondary" },
  { label: "Contraste (Azul Claro)", value: "contrast" },
  { label: "Ayuda (Morado)", value: "help" },
  { label: "Primario (Azul Oscuro)", value: "primary" },
];

export default function TipoPrestamoForm({
  initialData,
  onSuccess,
  onCancel,
  isEdit,
  usuario,
}) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: "",
    descripcionCorta: "",
    requiereGarantia: false,
    esComercioExterior: false,
    esLeasing: false,
    esFactoring: false,
    permiteRefinanciar: true,
    severityColor: null,
    activo: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        descripcion: initialData.descripcion || "",
        descripcionCorta: initialData.descripcionCorta || "",
        requiereGarantia: initialData.requiereGarantia || false,
        esComercioExterior: initialData.esComercioExterior || false,
        esLeasing: initialData.esLeasing || false,
        esFactoring: initialData.esFactoring || false,
        permiteRefinanciar: initialData.permiteRefinanciar ?? true,
        severityColor: initialData.severityColor || null,
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
        creadoPor: isEdit ? undefined : usuario?.id,
        actualizadoPor: isEdit ? usuario?.id : undefined,
      };

      if (isEdit) {
        await updateTipoPrestamo(initialData.id, dataToSend);
      } else {
        await createTipoPrestamo(dataToSend);
      }

      onSuccess();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          `No se pudo ${isEdit ? "actualizar" : "crear"} el tipo de préstamo.`,
        life: 3000,
      });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Toast ref={toast} />

      <div style={{ display: "grid", gap: "1rem" }}>
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
            maxLength={200}
            placeholder="CAPITAL DE TRABAJO"
          />
        </div>

        {/* Descripción Corta */}
        <div>
          <label
            htmlFor="descripcionCorta"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Descripción Corta
          </label>
          <InputText
            id="descripcionCorta"
            value={formData.descripcionCorta}
            onChange={(e) => handleChange("descripcionCorta", e.target.value)}
            style={{ width: "100%", textTransform: "uppercase" }}
            maxLength={100}
            placeholder="CAP. TRABAJO"
          />
        </div>

        {/* Color del Badge - Siguiendo patrón de EstadoMultiFuncionForm */}
        <div>
          <label
            htmlFor="severityColor"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Color del Badge (Interfaz)
          </label>
          <Dropdown
            id="severityColor"
            value={formData.severityColor}
            onChange={(e) => handleChange("severityColor", e.value)}
            options={opcionesSeverityColor}
            placeholder="Seleccionar color..."
            showClear
            style={{ width: "100%" }}
            itemTemplate={(option) => (
              <Badge value={option.label} severity={option.value} size="large" />
            )}
            valueTemplate={(option) => {
              if (!formData.severityColor) return "Seleccionar color...";
              const selected = opcionesSeverityColor.find(
                (o) => o.value === formData.severityColor
              );
              return selected ? (
                <Badge value={selected.label} severity={selected.value} size="large" />
              ) : (
                "Seleccionar color..."
              );
            }}
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
              <Checkbox
                inputId="requiereGarantia"
                checked={formData.requiereGarantia}
                onChange={(e) => handleChange("requiereGarantia", e.checked)}
              />
              <label htmlFor="requiereGarantia" style={{ fontWeight: "500" }}>
                Requiere Garantía Obligatoria
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox
                inputId="esComercioExterior"
                checked={formData.esComercioExterior}
                onChange={(e) => handleChange("esComercioExterior", e.checked)}
              />
              <label htmlFor="esComercioExterior" style={{ fontWeight: "500" }}>
                Es para Comercio Exterior (COMEX)
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox
                inputId="esLeasing"
                checked={formData.esLeasing}
                onChange={(e) => handleChange("esLeasing", e.checked)}
              />
              <label htmlFor="esLeasing" style={{ fontWeight: "500" }}>
                Es Tipo Leasing
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox
                inputId="esFactoring"
                checked={formData.esFactoring}
                onChange={(e) => handleChange("esFactoring", e.checked)}
              />
              <label htmlFor="esFactoring" style={{ fontWeight: "500" }}>
                Es Factoring
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox
                inputId="permiteRefinanciar"
                checked={formData.permiteRefinanciar}
                onChange={(e) => handleChange("permiteRefinanciar", e.checked)}
              />
              <label htmlFor="permiteRefinanciar" style={{ fontWeight: "500" }}>
                Permite Ser Refinanciado
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Checkbox
                inputId="activo"
                checked={formData.activo}
                onChange={(e) => handleChange("activo", e.checked)}
              />
              <label htmlFor="activo" style={{ fontWeight: "500" }}>
                Activo
              </label>
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