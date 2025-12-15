// src/components/direccionEntidad/DireccionEntidadForm.jsx
// Formulario profesional para DireccionEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function DireccionEntidadForm({ isEdit, defaultValues, entidades, onSubmit, onCancel, loading, readOnly = false }) {
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [direccion, setDireccion] = React.useState(defaultValues.direccion || '');
  const [direccionArmada, setDireccionArmada] = React.useState(defaultValues.direccionArmada || '');
  const [ubigeoId, setUbigeoId] = React.useState(defaultValues.ubigeoId || '');
  const [fiscal, setFiscal] = React.useState(defaultValues.fiscal || false);
  const [almacenPrincipal, setAlmacenPrincipal] = React.useState(defaultValues.almacenPrincipal || false);
  const [referencia, setReferencia] = React.useState(defaultValues.referencia || '');
  const [telefono, setTelefono] = React.useState(defaultValues.telefono || '');
  const [correo, setCorreo] = React.useState(defaultValues.correo || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setDireccion(defaultValues.direccion || '');
    setDireccionArmada(defaultValues.direccionArmada || '');
    setUbigeoId(defaultValues.ubigeoId || '');
    setFiscal(defaultValues.fiscal || false);
    setAlmacenPrincipal(defaultValues.almacenPrincipal || false);
    setReferencia(defaultValues.referencia || '');
    setTelefono(defaultValues.telefono || '');
    setCorreo(defaultValues.correo || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      direccion,
      direccionArmada,
      ubigeoId: ubigeoId ? Number(ubigeoId) : null,
      fiscal,
      almacenPrincipal,
      referencia,
      telefono,
      correo,
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
        <div className="p-col-12">
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
              disabled={loading || readOnly}
              required
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="direccion">Dirección*</label>
            <InputText 
              id="direccion" 
              value={direccion} 
              onChange={e => setDireccion(e.target.value)} 
              required 
              disabled={loading || readOnly}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="direccionArmada">Dirección Armada</label>
            <InputTextarea 
              id="direccionArmada" 
              value={direccionArmada} 
              onChange={e => setDireccionArmada(e.target.value)} 
              rows={2} 
              disabled={loading || readOnly} 
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="ubigeoId">Ubigeo ID*</label>
            <InputText 
              id="ubigeoId" 
              value={ubigeoId} 
              onChange={e => setUbigeoId(e.target.value)} 
              required 
              disabled={loading || readOnly}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="referencia">Referencia</label>
            <InputText 
              id="referencia" 
              value={referencia} 
              onChange={e => setReferencia(e.target.value)} 
              disabled={loading || readOnly}
              style={{ textTransform: 'uppercase' }}
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
              disabled={loading || readOnly}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="correo">Correo</label>
            <InputText 
              id="correo" 
              value={correo} 
              onChange={e => setCorreo(e.target.value)} 
              disabled={loading || readOnly}
              type="email"
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-grid">
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="fiscal" 
                  checked={fiscal} 
                  onChange={e => setFiscal(e.checked)} 
                  disabled={loading || readOnly} 
                />
                <label htmlFor="fiscal">Dirección Fiscal</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="almacenPrincipal" 
                  checked={almacenPrincipal} 
                  onChange={e => setAlmacenPrincipal(e.checked)} 
                  disabled={loading || readOnly} 
                />
                <label htmlFor="almacenPrincipal">Almacén Principal</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
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
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} disabled={readOnly} />
      </div>
    </form>
  );
}
