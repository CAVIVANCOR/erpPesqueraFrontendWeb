// src/components/especie/EspecieForm.jsx
// Formulario profesional para Especie. Cumple regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

export default function EspecieForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [nombreCientifico, setNombreCientifico] = React.useState(
    defaultValues.nombreCientifico || ""
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setNombreCientifico(defaultValues.nombreCientifico || "");
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convertir a mayúsculas antes de enviar
    onSubmit({
      nombre: nombre.toUpperCase(),
      nombreCientifico: nombreCientifico.toUpperCase(),
    });
  };

  const handleNombreChange = (e) => {
    setNombre(e.target.value.toUpperCase());
  };

  const handleNombreCientificoChange = (e) => {
    setNombreCientifico(e.target.value.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre</label>
        <InputText
          id="nombre"
          value={nombre}
          onChange={handleNombreChange}
          required
          autoFocus
          disabled={loading}
          style={{ textTransform: "uppercase" }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="nombreCientifico">Nombre Científico</label>
        <InputText
          id="nombreCientifico"
          value={nombreCientifico}
          onChange={handleNombreCientificoChange}
          required
          disabled={loading}
          style={{ textTransform: "uppercase" }}
        />
      </div>
      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          label="Cancelar"
          className="p-button-text p-mr-2"
          type="button"
          onClick={onCancel}
          disabled={loading}
          severity="danger"
          raised
          outlined
          size="small"
        />
        <Button
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          type="submit"
          loading={loading}
          severity="success"
          raised
          outlined
          size="small"
        />
      </div>
    </form>
  );
}
