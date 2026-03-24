// src/components/categoriaTipoMovEntregaRendir/CategoriaTipoMovEntregaRendirForm.jsx
// Formulario profesional para CategoriaTipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

export default function CategoriaTipoMovEntregaRendirForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [cesado, setCesado] = React.useState(
    defaultValues.cesado !== undefined ? !!defaultValues.cesado : false,
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setCesado(
      defaultValues.cesado !== undefined ? !!defaultValues.cesado : false,
    );
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre: nombre.trim().toUpperCase(),
      cesado,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={loading}
          style={{ fontWeight: "bold", textTransform: "uppercase" }}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label
          style={{
            fontWeight: "bold",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          Estado
        </label>
        <Button
          label={cesado ? "INACTIVO" : "ACTIVO"}
          icon={cesado ? "pi pi-times-circle" : "pi pi-check-circle"}
          className={cesado ? "p-button-danger" : "p-button-success"}
          onClick={() => setCesado(!cesado)}
          type="button"
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          severity="warning"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          severity="success"
        />
      </div>
    </form>
  );
}