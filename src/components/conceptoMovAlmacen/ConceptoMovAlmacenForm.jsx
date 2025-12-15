// src/components/conceptoMovAlmacen/ConceptoMovAlmacenForm.jsx
// Formulario profesional para ConceptoMovAlmacen. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function ConceptoMovAlmacenForm({
  isEdit,
  defaultValues,
  tiposConcepto,
  tiposMovimiento,
  tiposAlmacen,
  almacenes,
  empresaId,
  onSubmit,
  onCancel,
  loading,
  readOnly = false,
}) {
  const [tipoConceptoId, setTipoConceptoId] = React.useState(defaultValues.tipoConceptoId || null);
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(defaultValues.tipoMovimientoId || null);
  const [tipoAlmacenId, setTipoAlmacenId] = React.useState(defaultValues.tipoAlmacenId || null);
  const [almacenOrigenId, setAlmacenOrigenId] = React.useState(defaultValues.almacenOrigenId || null);
  const [almacenDestinoId, setAlmacenDestinoId] = React.useState(defaultValues.almacenDestinoId || null);
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [kardexOrigen, setKardexOrigen] = React.useState(defaultValues.llevaKardexOrigen || false);
  const [kardexDestino, setKardexDestino] = React.useState(defaultValues.llevaKardexDestino || false);
  const [custodia, setCustodia] = React.useState(defaultValues.esCustodia || false);
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setTipoConceptoId(defaultValues.tipoConceptoId || null);
    setTipoMovimientoId(defaultValues.tipoMovimientoId || null);
    setTipoAlmacenId(defaultValues.tipoAlmacenId || null);
    setAlmacenOrigenId(defaultValues.almacenOrigenId || null);
    setAlmacenDestinoId(defaultValues.almacenDestinoId || null);
    setDescripcion(defaultValues.descripcion || '');
    setKardexOrigen(defaultValues.llevaKardexOrigen || false);
    setKardexDestino(defaultValues.llevaKardexDestino || false);
    setCustodia(defaultValues.esCustodia || false);
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  // Actualizar kardexOrigen cuando cambia el almacén origen
  React.useEffect(() => {
    if (almacenOrigenId) {
      const almacen = almacenes.find(a => Number(a.id) === Number(almacenOrigenId));
      if (almacen) {
        setKardexOrigen(almacen.seLlevaKardex || false);
      }
    } else {
      setKardexOrigen(false);
    }
  }, [almacenOrigenId, almacenes]);

  // Actualizar kardexDestino cuando cambia el almacén destino
  React.useEffect(() => {
    if (almacenDestinoId) {
      const almacen = almacenes.find(a => Number(a.id) === Number(almacenDestinoId));
      if (almacen) {
        setKardexDestino(almacen.seLlevaKardex || false);
      }
    } else {
      setKardexDestino(false);
    }
  }, [almacenDestinoId, almacenes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      tipoConceptoId: tipoConceptoId ? Number(tipoConceptoId) : null,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      tipoAlmacenId: tipoAlmacenId ? Number(tipoAlmacenId) : null,
      almacenOrigenId: almacenOrigenId ? Number(almacenOrigenId) : null,
      almacenDestinoId: almacenDestinoId ? Number(almacenDestinoId) : null,
      descripcion,
      llevaKardexOrigen: kardexOrigen,
      llevaKardexDestino: kardexDestino,
      esCustodia: custodia,
      activo
    });
  };

  // Filtrar almacenes por empresa seleccionada
  const almacenesFiltrados = React.useMemo(() => {
    if (!empresaId) return [];
    return almacenes.filter(a => {
      // Filtrar por centroAlmacen.empresaId
      return a.centroAlmacen && Number(a.centroAlmacen.empresaId) === Number(empresaId);
    });
  }, [almacenes, empresaId]);

  // La descripción armada se genera en el backend al guardar
  // Solo mostramos el valor existente si es edición
  const descripcionArmada = isEdit && defaultValues.descripcionArmada 
    ? defaultValues.descripcionArmada 
    : 'Se generará automáticamente al guardar';

  const tiposConceptoOptions = tiposConcepto.map(t => ({ ...t, id: Number(t.id) }));
  const tiposMovimientoOptions = tiposMovimiento.map(t => ({ ...t, id: Number(t.id) }));
  const tiposAlmacenOptions = tiposAlmacen.map(t => ({ ...t, id: Number(t.id) }));
  const almacenesOptions = almacenesFiltrados.map(a => ({ ...a, id: Number(a.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="tipoConceptoId">Tipo de Concepto*</label>
            <Dropdown 
              id="tipoConceptoId"
              value={tipoConceptoId ? Number(tipoConceptoId) : null}
              options={tiposConceptoOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setTipoConceptoId(e.value)}
              placeholder="Seleccione tipo de concepto"
              disabled={loading || readOnly}
              style={{ fontWeight: 'bold' }}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="tipoMovimientoId">Tipo de Movimiento*</label>
            <Dropdown 
              id="tipoMovimientoId"
              value={tipoMovimientoId ? Number(tipoMovimientoId) : null}
              options={tiposMovimientoOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setTipoMovimientoId(e.value)}
              placeholder="Seleccione tipo de movimiento"
              disabled={loading || readOnly}
              style={{ fontWeight: 'bold' }}
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
              onChange={e => setTipoAlmacenId(e.value)}
              placeholder="Seleccione tipo de almacén"
              disabled={loading || readOnly}
              style={{ fontWeight: 'bold' }}
              required
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="almacenOrigenId">Almacén Origen</label>
            <Dropdown 
              id="almacenOrigenId"
              value={almacenOrigenId ? Number(almacenOrigenId) : null}
              options={almacenesOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setAlmacenOrigenId(e.value)}
              placeholder={empresaId ? "Seleccione almacén origen" : "Primero seleccione una empresa"}
              disabled={loading || !empresaId}
              style={{ fontWeight: 'bold' }}
              showClear
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="almacenDestinoId">Almacén Destino</label>
            <Dropdown 
              id="almacenDestinoId"
              value={almacenDestinoId ? Number(almacenDestinoId) : null}
              options={almacenesOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setAlmacenDestinoId(e.value)}
              placeholder={empresaId ? "Seleccione almacén destino" : "Primero seleccione una empresa"}
              disabled={loading || !empresaId}
              style={{ fontWeight: 'bold' }}
              showClear
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcion">Descripción*</label>
            <InputTextarea 
              id="descripcion" 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
              disabled={loading || readOnly}
              rows={1}
              style={{ fontWeight: 'bold' }}
              maxLength={200}
              required
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="descripcionArmada" style={{ fontWeight: 'bold', color: '#2196F3' }}>Descripción Armada (Generada por el Sistema)</label>
            <InputTextarea 
              id="descripcionArmada" 
              value={descripcionArmada} 
              disabled={true}
              rows={3}
              style={{ backgroundColor: '#f0f8ff', fontWeight: 'bold', color: '#666', fontStyle: isEdit ? 'normal' : 'italic' }}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="kardexOrigen" 
              checked={kardexOrigen} 
              onChange={e => setKardexOrigen(e.checked)} 
              disabled={true}
            />
            <label htmlFor="kardexOrigen">Kardex Origen (automático desde almacén)</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="kardexDestino" 
              checked={kardexDestino} 
              onChange={e => setKardexDestino(e.checked)} 
              disabled={true}
            />
            <label htmlFor="kardexDestino">Kardex Destino (automático desde almacén)</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="custodia" 
              checked={custodia} 
              onChange={e => setCustodia(e.checked)} 
              disabled={loading || readOnly} 
            />
            <label htmlFor="custodia">Custodia</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.checked)} 
              disabled={loading || readOnly} 
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
          disabled={loading || readOnly}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          type="submit"
          disabled={loading || readOnly}
        />
      </div>
    </form>
  );
}
