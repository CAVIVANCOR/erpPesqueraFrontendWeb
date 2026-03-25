// src/components/tipoMovEntregaRendir/TipoMovEntregaRendirForm.jsx
// Formulario profesional para TipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";

export default function TipoMovEntregaRendirForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  categorias = [], // AGREGAR ESTA LÍNEA
}) {
  const prevEsIngreso = React.useRef(
    defaultValues.esIngreso !== undefined ? !!defaultValues.esIngreso : false,
  );
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || "",
  );
  const [esIngreso, setEsIngreso] = React.useState(
    defaultValues.esIngreso !== undefined ? !!defaultValues.esIngreso : false,
  );
  const [esTransferencia, setEsTransferencia] = React.useState(
    defaultValues.esTransferencia !== undefined
      ? !!defaultValues.esTransferencia
      : false,
  );
  const [categoriaId, setCategoriaId] = React.useState(
    defaultValues.categoriaId ? Number(defaultValues.categoriaId) : null,
  );
  const [activo, setActivo] = React.useState(
    defaultValues.activo !== undefined ? !!defaultValues.activo : true,
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setDescripcion(defaultValues.descripcion || "");
    setEsIngreso(
      defaultValues.esIngreso !== undefined ? !!defaultValues.esIngreso : false,
    );
    setEsTransferencia(
      defaultValues.esTransferencia !== undefined
        ? !!defaultValues.esTransferencia
        : false,
    );
    setCategoriaId(
      defaultValues.categoriaId ? Number(defaultValues.categoriaId) : null,
    );
    setActivo(
      defaultValues.activo !== undefined ? !!defaultValues.activo : true,
    );
  }, [defaultValues]);

  // Limpiar categoriaId cuando el usuario cambia esIngreso manualmente
  React.useEffect(() => {
    if (prevEsIngreso.current !== esIngreso) {
      prevEsIngreso.current = esIngreso;
      setCategoriaId(null);
    }
  }, [esIngreso]);

  const opcionesCategoria = React.useMemo(() => {
    const resultado = categorias
      .filter((c) => c.tipo !== esIngreso)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((c) => ({
        label: `${c.nombre} - ${c.tipo ? "EGRESO" : "INGRESO"}`,
        value: Number(c.id),
      }));
    return resultado;
  }, [categorias, esIngreso]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      categoriaId: categoriaId ? Number(categoriaId) : null,
      nombre,
      descripcion,
      esIngreso,
      esTransferencia,
      activo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div style={{ marginTop: "1rem" }}>
        <label
          style={{
            fontWeight: "bold",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          Configuración
        </label>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <Button
            label={esIngreso ? "INGRESO" : "EGRESO"}
            icon={esIngreso ? "pi pi-arrow-down" : "pi pi-arrow-up"}
            className={esIngreso ? "p-button-primary" : "p-button-danger"}
            onClick={() => setEsIngreso(!esIngreso)}
            type="button"
            disabled={loading}
          />
          <Button
            label={esTransferencia ? "TRANSFERENCIA" : "TRANSFERENCIA"}
            icon={esTransferencia ? "pi pi-arrows-h" : "pi pi-times"}
            className={
              esTransferencia ? "p-button-primary" : "p-button-secondary"
            }
            onClick={() => setEsTransferencia(!esTransferencia)}
            type="button"
            disabled={loading}
          />
          <Button
            label={activo ? "ACTIVO" : "INACTIVO"}
            icon={activo ? "pi pi-check-circle" : "pi pi-times-circle"}
            className={activo ? "p-button-primary" : "p-button-danger"}
            onClick={() => setActivo(!activo)}
            type="button"
            disabled={loading}
          />
        </div>
      </div>

      <div className="p-field">
        <label htmlFor="categoriaId">Categoría</label>
        <Dropdown
          id="categoriaId"
          value={categoriaId ? Number(categoriaId) : null}
          options={opcionesCategoria}
          onChange={(e) => setCategoriaId(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar categoría"
          disabled={loading}
          showClear
          filter
          style={{ fontWeight: "bold", textTransform: "uppercase" }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={loading}
          style={{ fontWeight: "bold" }}
        />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputTextarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          disabled={loading}
          style={{ fontWeight: "bold" }}
        />
      </div>

      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}
      >
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
