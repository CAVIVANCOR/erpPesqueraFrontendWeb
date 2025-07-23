// src/components/contactoEntidad/ContactoEntidadForm.jsx
// Formulario profesional para ContactoEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function ContactoEntidadForm({ isEdit, defaultValues, entidades, onSubmit, onCancel, loading }) {
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [nombres, setNombres] = React.useState(defaultValues.nombres || '');
  const [cargoId, setCargoId] = React.useState(defaultValues.cargoId || '');
  const [telefono, setTelefono] = React.useState(defaultValues.telefono || '');
  const [correoCorportivo, setCorreoCorportivo] = React.useState(defaultValues.correoCorportivo || '');
  const [correoPersonal, setCorreoPersonal] = React.useState(defaultValues.correoPersonal || '');
  const [compras, setCompras] = React.useState(defaultValues.compras || false);
  const [ventas, setVentas] = React.useState(defaultValues.ventas || false);
  const [finanzas, setFinanzas] = React.useState(defaultValues.finanzas || false);
  const [logistica, setLogistica] = React.useState(defaultValues.logistica || false);
  const [representanteLegal, setRepresentanteLegal] = React.useState(defaultValues.representanteLegal || false);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setNombres(defaultValues.nombres || '');
    setCargoId(defaultValues.cargoId || '');
    setTelefono(defaultValues.telefono || '');
    setCorreoCorportivo(defaultValues.correoCorportivo || '');
    setCorreoPersonal(defaultValues.correoPersonal || '');
    setCompras(defaultValues.compras || false);
    setVentas(defaultValues.ventas || false);
    setFinanzas(defaultValues.finanzas || false);
    setLogistica(defaultValues.logistica || false);
    setRepresentanteLegal(defaultValues.representanteLegal || false);
    setObservaciones(defaultValues.observaciones || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      nombres,
      cargoId: cargoId ? Number(cargoId) : null,
      telefono,
      correoCorportivo,
      correoPersonal,
      compras,
      ventas,
      finanzas,
      logistica,
      representanteLegal,
      observaciones,
      activo
    });
  };

  // Normalizar opciones para el dropdown de entidades
  const entidadesOptions = entidades.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="entidadComercialId">Entidad Comercial*</label>
            <Dropdown
              id="entidadComercialId"
              value={entidadComercialId ? Number(entidadComercialId) : null}
              options={entidadesOptions}
              onChange={e => setEntidadComercialId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar entidad"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="nombres">Nombres*</label>
            <InputText 
              id="nombres" 
              value={nombres} 
              onChange={e => setNombres(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="cargoId">Cargo ID</label>
            <InputText 
              id="cargoId" 
              value={cargoId} 
              onChange={e => setCargoId(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="telefono">Teléfono</label>
            <InputText 
              id="telefono" 
              value={telefono} 
              onChange={e => setTelefono(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="correoCorportivo">Email Corporativo</label>
            <InputText 
              id="correoCorportivo" 
              value={correoCorportivo} 
              onChange={e => setCorreoCorportivo(e.target.value)} 
              disabled={loading}
              type="email"
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="correoPersonal">Email Personal</label>
            <InputText 
              id="correoPersonal" 
              value={correoPersonal} 
              onChange={e => setCorreoPersonal(e.target.value)} 
              disabled={loading}
              type="email"
            />
          </div>
        </div>
        <div className="p-col-12">
          <h4>Áreas de Responsabilidad</h4>
          <div className="p-grid">
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="compras" 
                  checked={compras} 
                  onChange={e => setCompras(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="compras">Compras</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="ventas" 
                  checked={ventas} 
                  onChange={e => setVentas(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="ventas">Ventas</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="finanzas" 
                  checked={finanzas} 
                  onChange={e => setFinanzas(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="finanzas">Finanzas</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="logistica" 
                  checked={logistica} 
                  onChange={e => setLogistica(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="logistica">Logística</label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field-checkbox">
            <Checkbox 
              id="representanteLegal" 
              checked={representanteLegal} 
              onChange={e => setRepresentanteLegal(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="representanteLegal">Representante Legal</label>
          </div>
        </div>
        <div className="p-col-12 p-md-6">
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
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea 
              id="observaciones" 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)} 
              rows={3} 
              disabled={loading} 
            />
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
