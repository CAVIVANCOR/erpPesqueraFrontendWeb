// src/components/almacen/AlmacenForm.jsx
// Formulario profesional para Almacen. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

export default function AlmacenForm({
  isEdit,
  defaultValues,
  centrosAlmacen,
  tiposAlmacenamiento,
  tiposAlmacen,
  empresaId,
  onSubmit,
  onCancel,
  loading,
}) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || "");
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || "");
  const [centroAlmacenId, setCentroAlmacenId] = React.useState(defaultValues.centroAlmacenId || null);
  const [tipoAlmacenamientoId, setTipoAlmacenamientoId] = React.useState(defaultValues.tipoAlmacenamientoId || null);
  const [tipoAlmacenId, setTipoAlmacenId] = React.useState(defaultValues.tipoAlmacenId || null);
  const [seLlevaKardex, setSeLlevaKardex] = React.useState(defaultValues.seLlevaKardex || false);
  const [esAlmacenExterno, setEsAlmacenExterno] = React.useState(defaultValues.esAlmacenExterno || false);
  const [esAlmacenPropioSede, setEsAlmacenPropioSede] = React.useState(defaultValues.esAlmacenPropioSede || false);
  const [esAlmacenProduccion, setEsAlmacenProduccion] = React.useState(defaultValues.esAlmacenProduccion || false);
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || "");
    setDescripcion(defaultValues.descripcion || "");
    setCentroAlmacenId(defaultValues.centroAlmacenId || null);
    setTipoAlmacenamientoId(defaultValues.tipoAlmacenamientoId || null);
    setTipoAlmacenId(defaultValues.tipoAlmacenId || null);
    setSeLlevaKardex(defaultValues.seLlevaKardex || false);
    setEsAlmacenExterno(defaultValues.esAlmacenExterno || false);
    setEsAlmacenPropioSede(defaultValues.esAlmacenPropioSede || false);
    setEsAlmacenProduccion(defaultValues.esAlmacenProduccion || false);
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion: descripcion || null,
      centroAlmacenId: centroAlmacenId ? Number(centroAlmacenId) : null,
      tipoAlmacenamientoId: tipoAlmacenamientoId ? Number(tipoAlmacenamientoId) : null,
      tipoAlmacenId: tipoAlmacenId ? Number(tipoAlmacenId) : null,
      seLlevaKardex,
      esAlmacenExterno,
      esAlmacenPropioSede,
      esAlmacenProduccion,
      activo,
    });
  };

  // Filtrar centros de almacén por empresa seleccionada
  const centrosFiltrados = React.useMemo(() => {
    if (!empresaId) return [];
    return centrosAlmacen.filter(c => Number(c.empresaId) === Number(empresaId));
  }, [centrosAlmacen, empresaId]);

  const centrosOptions = centrosFiltrados.map((c) => ({ ...c, id: Number(c.id) }));
  const tiposAlmacenamientoOptions = tiposAlmacenamiento.map((t) => ({ ...t, id: Number(t.id) }));
  const tiposAlmacenOptions = tiposAlmacen.map((t) => ({ ...t, id: Number(t.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="centroAlmacenId">Centro de Almacén*</label>
            <Dropdown
              id="centroAlmacenId"
              value={centroAlmacenId ? Number(centroAlmacenId) : null}
              options={centrosOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setCentroAlmacenId(e.value)}
              placeholder={empresaId ? "Seleccione centro de almacén" : "Primero seleccione una empresa"}
              disabled={loading || !empresaId}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="tipoAlmacenamientoId">Tipo de Almacenamiento*</label>
            <Dropdown
              id="tipoAlmacenamientoId"
              value={tipoAlmacenamientoId ? Number(tipoAlmacenamientoId) : null}
              options={tiposAlmacenamientoOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setTipoAlmacenamientoId(e.value)}
              placeholder="Seleccione tipo de almacenamiento"
              disabled={loading}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="tipoAlmacenId">Tipo de Almacén*</label>
            <Dropdown
              id="tipoAlmacenId"
              value={tipoAlmacenId ? Number(tipoAlmacenId) : null}
              options={tiposAlmacenOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setTipoAlmacenId(e.value)}
              placeholder="Seleccione tipo de almacén"
              disabled={loading}
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
          <div className="p-field-checkbox">
            <Checkbox
              id="seLlevaKardex"
              checked={seLlevaKardex}
              onChange={(e) => setSeLlevaKardex(e.checked)}
              disabled={loading}
            />
            <label htmlFor="seLlevaKardex">Se Lleva Kardex</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esAlmacenExterno"
              checked={esAlmacenExterno}
              onChange={(e) => setEsAlmacenExterno(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esAlmacenExterno">Es Almacén Externo</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esAlmacenPropioSede"
              checked={esAlmacenPropioSede}
              onChange={(e) => setEsAlmacenPropioSede(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esAlmacenPropioSede">Es Almacén Propio Sede</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="esAlmacenProduccion"
              checked={esAlmacenProduccion}
              onChange={(e) => setEsAlmacenProduccion(e.checked)}
              disabled={loading}
            />
            <label htmlFor="esAlmacenProduccion">Es Almacén Producción</label>
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
        <Button label="Guardar" icon="pi pi-check" type="submit" disabled={loading} />
      </div>
    </form>
  );
}