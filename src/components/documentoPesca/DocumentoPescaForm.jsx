// src/components/documentoPesca/DocumentoPescaForm.jsx
// Formulario profesional para DocumentoPesca. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";

export default function DocumentoPescaForm({
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
  const [obligatorio, setObligatorio] = React.useState(
    defaultValues.obligatorio !== undefined
      ? !!defaultValues.obligatorio
      : false
  );
  const [cesado, setCesado] = React.useState(
    defaultValues.cesado !== undefined ? !!defaultValues.cesado : false
  );
  const [paraEmbarcacion, setParaEmbarcacion] = React.useState(
    defaultValues.paraEmbarcacion !== undefined ? !!defaultValues.paraEmbarcacion : false
  );
  const [paraTripulantes, setParaTripulantes] = React.useState(
    defaultValues.paraTripulantes !== undefined ? !!defaultValues.paraTripulantes : false
  );
  const [paraOperacionFaena, setParaOperacionFaena] = React.useState(
    defaultValues.paraOperacionFaena !== undefined ? !!defaultValues.paraOperacionFaena : false
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setDescripcion(defaultValues.descripcion || "");
    setObligatorio(
      defaultValues.obligatorio !== undefined
        ? !!defaultValues.obligatorio
        : false
    );
    setCesado(
      defaultValues.cesado !== undefined ? !!defaultValues.cesado : false
    );
    setParaEmbarcacion(
      defaultValues.paraEmbarcacion !== undefined ? !!defaultValues.paraEmbarcacion : false
    );
    setParaTripulantes(
      defaultValues.paraTripulantes !== undefined ? !!defaultValues.paraTripulantes : false
    );
    setParaOperacionFaena(
      defaultValues.paraOperacionFaena !== undefined ? !!defaultValues.paraOperacionFaena : false
    );
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion,
      obligatorio,
      cesado,
      paraEmbarcacion,
      paraTripulantes,
      paraOperacionFaena,
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
        />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox
          id="obligatorio"
          checked={obligatorio}
          onChange={(e) => setObligatorio(e.checked)}
          disabled={loading}
        />
        <label htmlFor="obligatorio">Obligatorio</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox
          id="cesado"
          checked={cesado}
          onChange={(e) => setCesado(e.checked)}
          disabled={loading}
        />
        <label htmlFor="cesado">Cesado</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox
          id="paraEmbarcacion"
          checked={paraEmbarcacion}
          onChange={(e) => setParaEmbarcacion(e.checked)}
          disabled={loading}
        />
        <label htmlFor="paraEmbarcacion">Para Embarcación</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox
          id="paraTripulantes"
          checked={paraTripulantes}
          onChange={(e) => setParaTripulantes(e.checked)}
          disabled={loading}
        />
        <label htmlFor="paraTripulantes">Para Tripulantes</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox
          id="paraOperacionFaena"
          checked={paraOperacionFaena}
          onChange={(e) => setParaOperacionFaena(e.checked)}
          disabled={loading}
        />
        <label htmlFor="paraOperacionFaena">Para Operación Faena</label>
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
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
          outlined
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          className="p-button-success"
          outlined
          raised
          size="small"
          icon="pi pi-save"
          loading={loading}
        />
      </div>
    </form>
  );
}
