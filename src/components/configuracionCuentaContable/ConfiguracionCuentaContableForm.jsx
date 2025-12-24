// src/components/configuracionCuentaContable/ConfiguracionCuentaContableForm.jsx
// Formulario profesional para ConfiguracionCuentaContable. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { formatearFecha } from "../../utils/utils";

export default function ConfiguracionCuentaContableForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  empresas = [],
  tiposMovimiento = [],
  tiposReferencia = [],
}) {
  const [empresaId, setEmpresaId] = React.useState(
    defaultValues.empresaId || ""
  );
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(
    defaultValues.tipoMovimientoId || ""
  );
  const [tipoReferenciaId, setTipoReferenciaId] = React.useState(
    defaultValues.tipoReferenciaId || null
  );
  const [cuentaContableDebe, setCuentaContableDebe] = React.useState(
    defaultValues.cuentaContableDebe || ""
  );
  const [cuentaContableHaber, setCuentaContableHaber] = React.useState(
    defaultValues.cuentaContableHaber || ""
  );
  const [descripcionPlantilla, setDescripcionPlantilla] = React.useState(
    defaultValues.descripcionPlantilla || ""
  );
  const [activo, setActivo] = React.useState(
    defaultValues.activo !== undefined ? !!defaultValues.activo : true
  );

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId || "");
    setTipoMovimientoId(defaultValues.tipoMovimientoId || "");
    setTipoReferenciaId(defaultValues.tipoReferenciaId || null);
    setCuentaContableDebe(defaultValues.cuentaContableDebe || "");
    setCuentaContableHaber(defaultValues.cuentaContableHaber || "");
    setDescripcionPlantilla(defaultValues.descripcionPlantilla || "");
    setActivo(
      defaultValues.activo !== undefined ? !!defaultValues.activo : true
    );
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones básicas en frontend
    if (
      !empresaId ||
      !tipoMovimientoId ||
      !cuentaContableDebe ||
      !cuentaContableHaber
    ) {
      return;
    }

    onSubmit({
      empresaId: Number(empresaId),
      tipoMovimientoId: Number(tipoMovimientoId),
      tipoReferenciaId: tipoReferenciaId ? Number(tipoReferenciaId) : null,
      cuentaContableDebe: cuentaContableDebe.trim().toUpperCase(),
      cuentaContableHaber: cuentaContableHaber.trim().toUpperCase(),
      descripcionPlantilla: descripcionPlantilla.trim(),
      activo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa*</label>
          <Dropdown
            id="empresaId"
            value={empresaId}
            options={empresas.map((empresa) => ({
              label: empresa.razonSocial,
              value: empresa.id,
            }))}
            onChange={(e) => setEmpresaId(e.value)}
            placeholder="Seleccione empresa"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoMovimientoId">Tipo de Movimiento*</label>
          <Dropdown
            id="tipoMovimientoId"
            value={tipoMovimientoId}
            options={tiposMovimiento.map((tipo) => ({
              label: tipo.nombre,
              value: tipo.id,
            }))}
            onChange={(e) => setTipoMovimientoId(e.value)}
            placeholder="Seleccione tipo"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoReferenciaId">Tipo de Referencia</label>
          <Dropdown
            id="tipoReferenciaId"
            value={tipoReferenciaId}
            options={tiposReferencia.map((tipo) => ({
              label: tipo.nombre,
              value: tipo.id,
            }))}
            onChange={(e) => setTipoReferenciaId(e.value)}
            placeholder="Seleccione tipo (opcional)"
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginTop: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaContableDebe">Cuenta Contable DEBE*</label>
          <InputText
            id="cuentaContableDebe"
            value={cuentaContableDebe}
            onChange={(e) => setCuentaContableDebe(e.target.value.toUpperCase())}
            required
            disabled={loading}
            maxLength={20}
            placeholder="Ej: 10411001"
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="cuentaContableHaber">Cuenta Contable HABER*</label>
          <InputText
            id="cuentaContableHaber"
            value={cuentaContableHaber}
            onChange={(e) =>
              setCuentaContableHaber(e.target.value.toUpperCase())
            }
            required
            disabled={loading}
            maxLength={20}
            placeholder="Ej: 42111001"
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div
          style={{
            flex: 0.5,
            display: "flex",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Checkbox
            inputId="activo"
            checked={activo}
            onChange={(e) => setActivo(e.checked)}
            disabled={loading}
          />
          <label
            htmlFor="activo"
            style={{ marginLeft: 8, fontWeight: "bold" }}
          >
            Activo
          </label>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
        }}
      >
        <label htmlFor="descripcionPlantilla">
          Plantilla de Descripción (Opcional)
        </label>
        <InputTextarea
          id="descripcionPlantilla"
          value={descripcionPlantilla}
          onChange={(e) => setDescripcionPlantilla(e.target.value)}
          disabled={loading}
          rows={3}
          maxLength={200}
          placeholder="Ej: Movimiento de {tipo} - {concepto}"
          style={{ fontWeight: "bold" }}
        />
        <small style={{ color: "#666" }}>
          Puede usar variables como {"{tipo}"}, {"{concepto}"}, {"{monto}"}, etc.
        </small>
      </div>

      {isEdit && defaultValues.creadoEn && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#495057" }}>Auditoría</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <strong>Creado:</strong>{" "}
              {formatearFecha(defaultValues.creadoEn)}
              {defaultValues.personalCreador && (
                <span>
                  {" "}
                  - {defaultValues.personalCreador.nombres}{" "}
                  {defaultValues.personalCreador.apellidoPaterno}
                </span>
              )}
            </div>
            {defaultValues.actualizadoEn && (
              <div>
                <strong>Actualizado:</strong>{" "}
                {formatearFecha(defaultValues.actualizadoEn)}
                {defaultValues.personalActualizador && (
                  <span>
                    {" "}
                    - {defaultValues.personalActualizador.nombres}{" "}
                    {defaultValues.personalActualizador.apellidoPaterno}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
