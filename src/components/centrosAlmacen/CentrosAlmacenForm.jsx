// src/components/centrosAlmacen/CentrosAlmacenForm.jsx
// Formulario profesional para CentrosAlmacen. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

export default function CentrosAlmacenForm({
  isEdit,
  defaultValues,
  proveedores = [],
  empresas = [],
  empresaId,
  onSubmit,
  onCancel,
  loading,
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [proveedorId, setProveedorId] = React.useState(
    defaultValues.proveedorId || ""
  );
  const [empresaIdLocal, setEmpresaIdLocal] = React.useState(
    defaultValues.empresaId || empresaId || ""
  );
  const [esCentroExterno, setEsCentroExterno] = React.useState(
    defaultValues.esCentroExterno || false
  );
  const [esCentroPropioSede, setEsCentroPropioSede] = React.useState(
    defaultValues.esCentroPropioSede || false
  );
  const [esCentroProduccion, setEsCentroProduccion] = React.useState(
    defaultValues.esCentroProduccion || false
  );
  const [activo, setActivo] = React.useState(
    defaultValues.activo !== undefined ? defaultValues.activo : true
  );

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setDescripcion(defaultValues.descripcion || "");
    setProveedorId(defaultValues.proveedorId || "");
    setEmpresaIdLocal(defaultValues.empresaId || empresaId || "");
    setEsCentroExterno(defaultValues.esCentroExterno || false);
    setEsCentroPropioSede(defaultValues.esCentroPropioSede || false);
    setEsCentroProduccion(defaultValues.esCentroProduccion || false);
    setActivo(
      defaultValues.activo !== undefined ? defaultValues.activo : true
    );
  }, [defaultValues, empresaId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      empresaId: empresaIdLocal ? Number(empresaIdLocal) : null,
      esCentroExterno,
      esCentroPropioSede,
      esCentroProduccion,
      activo,
    });
  };

  // Filtrar proveedores por empresa seleccionada
  const proveedoresFiltrados = React.useMemo(() => {
    if (!empresaIdLocal) return [];
    return proveedores.filter(p => Number(p.empresaId) === Number(empresaIdLocal));
  }, [proveedores, empresaIdLocal]);

  const proveedoresOptions = proveedoresFiltrados.map((p) => ({ ...p, id: Number(p.id) }));
  const empresasOptions = empresas.map((e) => ({ ...e, id: Number(e.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="empresaId">Empresa*</label>
            <Dropdown
              id="empresaId"
              value={empresaIdLocal ? Number(empresaIdLocal) : null}
              options={empresasOptions}
              optionLabel="razonSocial"
              optionValue="id"
              onChange={(e) => {
                setEmpresaIdLocal(e.value);
                // Limpiar proveedor cuando cambia la empresa
                setProveedorId("");
              }}
              placeholder="Seleccione empresa"
              disabled={loading || isEdit}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
              maxLength={100}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcion">Descripción</label>
            <InputTextarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="proveedorId">Proveedor</label>
            <Dropdown
              id="proveedorId"
              value={proveedorId ? Number(proveedorId) : null}
              options={proveedoresOptions}
              optionLabel="razonSocial"
              optionValue="id"
              onChange={(e) => setProveedorId(e.value)}
              placeholder={empresaIdLocal ? "Seleccione proveedor" : "Primero seleccione una empresa"}
              disabled={loading || !empresaIdLocal}
              showClear
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esCentroExterno"
              checked={esCentroExterno}
              onChange={(e) => setEsCentroExterno(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esCentroExterno">Es Centro Externo</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esCentroPropioSede"
              checked={esCentroPropioSede}
              onChange={(e) => setEsCentroPropioSede(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esCentroPropioSede">Es Centro Propio Sede</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esCentroProduccion"
              checked={esCentroProduccion}
              onChange={(e) => setEsCentroProduccion(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esCentroProduccion">Es Centro Producción</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.checked)}
              disabled={loading}
            />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>
      <div className="p-dialog-footer" style={{ marginTop: "1rem" }}>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          className="p-button-text"
          type="button"
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          type="submit"
          disabled={loading}
        />
      </div>
    </form>
  );
}
