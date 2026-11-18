// src/components/categoriaTipoMovEntregaRendir/CategoriaTipoMovEntregaRendirForm.jsx
// Formulario profesional para CategoriaTipoMovEntregaRendir. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import {
  ROLES_CATEGORIA_MOV,
  opcionesRolesPorSentido,
} from "../../utils/tiposMovimientoSistema.constants";

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
  const [tipo, setTipo] = React.useState(
    defaultValues.tipo !== undefined ? !!defaultValues.tipo : false,
  );
  const [codigoSistema, setCodigoSistema] = React.useState(
    defaultValues.codigoSistema || null,
  );

    // El rol solo es válido para el sentido ingreso/egreso que le corresponde (tipo: false = INGRESO, true = EGRESO)
  const opcionesRol = React.useMemo(() => {
    const opciones = opcionesRolesPorSentido(ROLES_CATEGORIA_MOV, !tipo);
    // Si la categoría ya tiene un rol fuera del catálogo actual, se muestra para no perderlo en silencio
    if (codigoSistema && !opciones.some((o) => o.value === codigoSistema)) {
      opciones.push({ label: codigoSistema, value: codigoSistema });
    }
    return opciones;
  }, [tipo, codigoSistema]);

    React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setCesado(
      defaultValues.cesado !== undefined ? !!defaultValues.cesado : false,
    );
    setTipo(
      defaultValues.tipo !== undefined ? !!defaultValues.tipo : false,
    );
    setCodigoSistema(defaultValues.codigoSistema || null);
  }, [defaultValues]);

    const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre: nombre.trim().toUpperCase(),
      cesado,
      tipo,
      codigoSistema: codigoSistema || null,
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
          Tipo de Movimiento
        </label>
        <Button
          label={tipo ? "EGRESO" : "INGRESO"}
          icon={tipo ? "pi pi-arrow-up" : "pi pi-arrow-down"}
          className={tipo ? "p-button-danger" : "p-button-info"}
          onClick={() => {
            setTipo(!tipo);
            // El rol depende del sentido: al cambiarlo se limpia para no dejar un rol de sentido contrario
            setCodigoSistema(null);
          }}
          type="button"
          disabled={loading}
        />
      </div>
      <div className="p-field" style={{ marginTop: "1rem" }}>
        <label htmlFor="codigoSistema">Función en el sistema (opcional)</label>
        <Dropdown
          id="codigoSistema"
          value={codigoSistema}
          options={opcionesRol}
          onChange={(e) => setCodigoSistema(e.value || null)}
          optionLabel="label"
          optionValue="value"
          placeholder="Ninguna"
          disabled={loading}
          showClear
        />
        <small>
          Solo una categoría puede cumplir cada función. Todos los tipos de esa categoría comparten el
          comportamiento (por ejemplo, ser una asignación a rendir).
        </small>
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