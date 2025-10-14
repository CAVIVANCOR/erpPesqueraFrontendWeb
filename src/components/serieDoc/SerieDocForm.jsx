// src/components/serieDoc/SerieDocForm.jsx
// Formulario profesional para SerieDoc. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function SerieDocForm({ 
  isEdit, 
  defaultValues, 
  tiposDocumento = [], 
  tiposAlmacen = [], 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState(defaultValues.tipoDocumentoId || null);
  const [tipoAlmacenId, setTipoAlmacenId] = React.useState(defaultValues.tipoAlmacenId || null);
  const [serie, setSerie] = React.useState(defaultValues.serie || '');
  const [correlativo, setCorrelativo] = React.useState(defaultValues.correlativo || 1);
  const [numCerosIzqCorre, setNumCerosIzqCorre] = React.useState(defaultValues.numCerosIzqCorre || 0);
  const [numCerosIzqSerie, setNumCerosIzqSerie] = React.useState(defaultValues.numCerosIzqSerie || 0);
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setTipoDocumentoId(defaultValues.tipoDocumentoId || null);
    setTipoAlmacenId(defaultValues.tipoAlmacenId || null);
    setSerie(defaultValues.serie || '');
    setCorrelativo(defaultValues.correlativo || 1);
    setNumCerosIzqCorre(defaultValues.numCerosIzqCorre || 0);
    setNumCerosIzqSerie(defaultValues.numCerosIzqSerie || 0);
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      tipoAlmacenId: tipoAlmacenId ? Number(tipoAlmacenId) : null,
      serie,
      correlativo,
      numCerosIzqCorre,
      numCerosIzqSerie,
      activo
    });
  };

  const tiposDocumentoOptions = tiposDocumento.map(t => ({ ...t, id: Number(t.id) }));
  const tiposAlmacenOptions = tiposAlmacen.map(t => ({ ...t, id: Number(t.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoDocumentoId">Tipo de Documento*</label>
            <Dropdown 
              id="tipoDocumentoId"
              value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
              options={tiposDocumentoOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setTipoDocumentoId(e.value)}
              placeholder="Seleccione tipo de documento"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoAlmacenId">Tipo de Almacén</label>
            <Dropdown 
              id="tipoAlmacenId"
              value={tipoAlmacenId ? Number(tipoAlmacenId) : null}
              options={tiposAlmacenOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={e => setTipoAlmacenId(e.value)}
              placeholder="Seleccione tipo de almacén"
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="serie">Serie*</label>
            <InputText 
              id="serie" 
              value={serie} 
              onChange={e => setSerie(e.target.value)} 
              required 
              disabled={loading}
              maxLength={10}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="correlativo">Correlativo*</label>
            <InputNumber 
              id="correlativo" 
              value={correlativo} 
              onValueChange={e => setCorrelativo(e.value)} 
              disabled={loading}
              min={1}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numCerosIzqCorre">Ceros Izquierda Correlativo</label>
            <InputNumber 
              id="numCerosIzqCorre" 
              value={numCerosIzqCorre} 
              onValueChange={e => setNumCerosIzqCorre(e.value)} 
              disabled={loading}
              min={0}
              max={10}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numCerosIzqSerie">Ceros Izquierda Serie</label>
            <InputNumber 
              id="numCerosIzqSerie" 
              value={numCerosIzqSerie} 
              onValueChange={e => setNumCerosIzqSerie(e.value)} 
              disabled={loading}
              min={0}
              max={10}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="activo" 
              checked={activo} 
              onChange={e => setActivo(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
