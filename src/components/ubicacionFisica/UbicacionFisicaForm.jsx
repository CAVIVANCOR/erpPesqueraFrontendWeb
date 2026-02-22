// src/components/ubicacionFisica/UbicacionFisicaForm.jsx
// Formulario profesional para UbicacionFisica. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

export default function UbicacionFisicaForm({
  isEdit,
  defaultValues,
  almacenes,
  almacenId,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || "");
  const [almacenIdLocal, setAlmacenIdLocal] = React.useState(defaultValues.almacenId || almacenId || null);

  React.useEffect(() => {
    setDescripcion(defaultValues.descripcion || "");
    setAlmacenIdLocal(defaultValues.almacenId || almacenId || null);
  }, [defaultValues, almacenId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      descripcion: descripcion.trim().toUpperCase(),
      almacenId: almacenIdLocal ? Number(almacenIdLocal) : null,
    });
  };

  const almacenesOptions = almacenes.map((a) => ({ ...a, id: Number(a.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="almacenId">Almacén*</label>
            <Dropdown
              id="almacenId"
              value={almacenIdLocal ? Number(almacenIdLocal) : null}
              options={almacenesOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setAlmacenIdLocal(e.value)}
              placeholder={almacenId ? "Seleccione almacén" : "Primero seleccione un almacén en el filtro"}
              disabled={loading || readOnly || !almacenId}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcion">Descripción*</label>
            <InputText
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
              disabled={loading || readOnly}
              required
              maxLength={100}
              placeholder="Ingrese la descripción"
            />
          </div>
        </div>
      </div>
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={readOnly}
        />
      </div>
    </form>
  );
}
