// src/components/direccionEntidad/DireccionEntidadForm.jsx
// Formulario profesional para DireccionEntidad. Cumple la regla transversal ERP Megui.
// NUEVOS CAMPOS: conceptoAlmacenCompraId, conceptoAlmacenVentaId, esAlmacenExterno, condicionesRecepcionAlmacen, condicionesEntregaAlmacen
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function DireccionEntidadForm({ 
  isEdit, 
  defaultValues, 
  entidades, 
  conceptosAlmacen = [],
  onSubmit, 
  onCancel, 
  loading, 
  readOnly = false 
}) {
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
  const [conceptoAlmacenCompraId, setConceptoAlmacenCompraId] = React.useState(defaultValues.conceptoAlmacenCompraId || null);
  const [conceptoAlmacenVentaId, setConceptoAlmacenVentaId] = React.useState(defaultValues.conceptoAlmacenVentaId || null);
  const [esAlmacenExterno, setEsAlmacenExterno] = React.useState(defaultValues.esAlmacenExterno || false);
  const [condicionesRecepcionAlmacen, setCondicionesRecepcionAlmacen] = React.useState(defaultValues.condicionesRecepcionAlmacen || '');
  const [condicionesEntregaAlmacen, setCondicionesEntregaAlmacen] = React.useState(defaultValues.condicionesEntregaAlmacen || '');

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
    setConceptoAlmacenCompraId(defaultValues.conceptoAlmacenCompraId ? Number(defaultValues.conceptoAlmacenCompraId) : null);
    setConceptoAlmacenVentaId(defaultValues.conceptoAlmacenVentaId ? Number(defaultValues.conceptoAlmacenVentaId) : null);
    setEsAlmacenExterno(defaultValues.esAlmacenExterno || false);
    setCondicionesRecepcionAlmacen(defaultValues.condicionesRecepcionAlmacen || '');
    setCondicionesEntregaAlmacen(defaultValues.condicionesEntregaAlmacen || '');
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
      activo,
      conceptoAlmacenCompraId: conceptoAlmacenCompraId ? Number(conceptoAlmacenCompraId) : null,
      conceptoAlmacenVentaId: conceptoAlmacenVentaId ? Number(conceptoAlmacenVentaId) : null,
      esAlmacenExterno,
      condicionesRecepcionAlmacen: condicionesRecepcionAlmacen || null,
      condicionesEntregaAlmacen: condicionesEntregaAlmacen || null
    });
  };

  const entidadesOptions = entidades.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const conceptosOptions = conceptosAlmacen.map(c => ({
    label: c.nombre,
    value: Number(c.id)
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

        {/* NUEVOS CAMPOS */}
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="conceptoAlmacenCompraId">Concepto Almacén para Compras</label>
            <Dropdown
              id="conceptoAlmacenCompraId"
              value={conceptoAlmacenCompraId ? Number(conceptoAlmacenCompraId) : null}
              options={conceptosOptions}
              onChange={e => setConceptoAlmacenCompraId(e.value)}
              placeholder="Seleccionar concepto"
              disabled={loading || readOnly}
              showClear
              filter
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="conceptoAlmacenVentaId">Concepto Almacén para Ventas</label>
            <Dropdown
              id="conceptoAlmacenVentaId"
              value={conceptoAlmacenVentaId ? Number(conceptoAlmacenVentaId) : null}
              options={conceptosOptions}
              onChange={e => setConceptoAlmacenVentaId(e.value)}
              placeholder="Seleccionar concepto"
              disabled={loading || readOnly}
              showClear
              filter
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="condicionesRecepcionAlmacen">Condiciones de Recepción en Almacén</label>
            <InputTextarea 
              id="condicionesRecepcionAlmacen" 
              value={condicionesRecepcionAlmacen} 
              onChange={e => setCondicionesRecepcionAlmacen(e.target.value)} 
              rows={3} 
              disabled={loading || readOnly}
              placeholder="Ej: Horario de recepción, requisitos de documentación, etc."
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="condicionesEntregaAlmacen">Condiciones de Entrega desde Almacén</label>
            <InputTextarea 
              id="condicionesEntregaAlmacen" 
              value={condicionesEntregaAlmacen} 
              onChange={e => setCondicionesEntregaAlmacen(e.target.value)} 
              rows={3} 
              disabled={loading || readOnly}
              placeholder="Ej: Horario de despacho, condiciones de transporte, etc."
            />
          </div>
        </div>

        <div className="p-col-12">
          <div className="p-grid">
            <div className="p-col-12 p-md-3">
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
            <div className="p-col-12 p-md-3">
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
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="esAlmacenExterno" 
                  checked={esAlmacenExterno} 
                  onChange={e => setEsAlmacenExterno(e.checked)} 
                  disabled={loading || readOnly} 
                />
                <label htmlFor="esAlmacenExterno">Almacén Externo</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
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