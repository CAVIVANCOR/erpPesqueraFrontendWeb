// src/components/motivoOriginoOT/MotivoOriginoOTForm.jsx
// Formulario profesional para MotivoOriginoOT. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";

export default function MotivoOriginoOTForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [activo, setActivo] = React.useState(
    defaultValues.activo !== undefined ? !!defaultValues.activo : true
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setDescripcion(defaultValues.descripcion || "");
    setActivo(
      defaultValues.activo !== undefined ? !!defaultValues.activo : true
    );
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre: nombre.toUpperCase().trim(),
      descripcion: descripcion ? descripcion.toUpperCase().trim() : null,
      activo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="nombre" style={{ fontWeight: "bold" }}>
          Nombre *
        </label>
        <InputText
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={loading}
          maxLength={40}
          style={{ textTransform: "uppercase", fontWeight: "bold" }}
          placeholder="INGRESE EL NOMBRE"
        />
      </div>
      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="descripcion" style={{ fontWeight: "bold" }}>
          Descripción
        </label>
        <InputTextarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={loading}
          rows={3}
          maxLength={200}
          style={{ textTransform: "uppercase" }}
          placeholder="INGRESE LA DESCRIPCIÓN (OPCIONAL)"
        />
      </div>
      <div className="p-field-checkbox" style={{ marginBottom: "1rem" }}>
        <Checkbox
          id="activo"
          checked={activo}
          onChange={(e) => setActivo(e.checked)}
          disabled={loading}
        />
        <label
          htmlFor="activo"
          style={{ fontWeight: "bold", marginLeft: "0.5rem" }}
        >
          Activo
        </label>
      </div>
      <div
        className="p-d-flex p-jc-end"
        style={{ gap: 8, marginTop: "1.5rem" }}
      >
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
        />
      </div>
    </form>
  );
}
