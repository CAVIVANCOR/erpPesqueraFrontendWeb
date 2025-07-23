// src/components/entidadComercial/EntidadComercialForm.jsx
// Formulario profesional para EntidadComercial. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function EntidadComercialForm({ 
  isEdit, 
  defaultValues, 
  empresas, 
  tiposDocumento, 
  tiposEntidad, 
  formasPago, 
  agrupaciones, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || null);
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState(defaultValues.tipoDocumentoId || null);
  const [tipoEntidadId, setTipoEntidadId] = React.useState(defaultValues.tipoEntidadId || null);
  const [formaPagoId, setFormaPagoId] = React.useState(defaultValues.formaPagoId || null);
  const [vendedorId, setVendedorId] = React.useState(defaultValues.vendedorId || '');
  const [agenciaEnvioId, setAgenciaEnvioId] = React.useState(defaultValues.agenciaEnvioId || '');
  const [agrupacionEntidadId, setAgrupacionEntidadId] = React.useState(defaultValues.agrupacionEntidadId || null);
  const [numeroDocumento, setNumeroDocumento] = React.useState(defaultValues.numeroDocumento || '');
  const [razonSocial, setRazonSocial] = React.useState(defaultValues.razonSocial || '');
  const [nombreComercial, setNombreComercial] = React.useState(defaultValues.nombreComercial || '');
  const [esCliente, setEsCliente] = React.useState(defaultValues.esCliente || false);
  const [esProveedor, setEsProveedor] = React.useState(defaultValues.esProveedor || false);
  const [esCorporativo, setEsCorporativo] = React.useState(defaultValues.esCorporativo || false);
  const [estado, setEstado] = React.useState(defaultValues.estado !== undefined ? defaultValues.estado : true);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');
  const [codigoErpFinanciero, setCodigoErpFinanciero] = React.useState(defaultValues.codigoErpFinanciero || '');
  
  // Controles específicos
  const [custodiaStock, setCustodiaStock] = React.useState(defaultValues.custodiaStock || false);
  const [controlLote, setControlLote] = React.useState(defaultValues.controlLote || false);
  const [controlFechaVenc, setControlFechaVenc] = React.useState(defaultValues.controlFechaVenc || false);
  const [controlFechaProd, setControlFechaProd] = React.useState(defaultValues.controlFechaProd || false);
  const [controlFechaIngreso, setControlFechaIngreso] = React.useState(defaultValues.controlFechaIngreso || false);
  const [controlSerie, setControlSerie] = React.useState(defaultValues.controlSerie || false);
  const [controlEnvase, setControlEnvase] = React.useState(defaultValues.controlEnvase || false);
  const [sujetoRetencion, setSujetoRetencion] = React.useState(defaultValues.sujetoRetencion || false);
  const [sujetoPercepcion, setSujetoPercepcion] = React.useState(defaultValues.sujetoPercepcion || false);

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
    setTipoDocumentoId(defaultValues.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : null);
    setTipoEntidadId(defaultValues.tipoEntidadId ? Number(defaultValues.tipoEntidadId) : null);
    setFormaPagoId(defaultValues.formaPagoId ? Number(defaultValues.formaPagoId) : null);
    setVendedorId(defaultValues.vendedorId || '');
    setAgenciaEnvioId(defaultValues.agenciaEnvioId || '');
    setAgrupacionEntidadId(defaultValues.agrupacionEntidadId ? Number(defaultValues.agrupacionEntidadId) : null);
    setNumeroDocumento(defaultValues.numeroDocumento || '');
    setRazonSocial(defaultValues.razonSocial || '');
    setNombreComercial(defaultValues.nombreComercial || '');
    setEsCliente(defaultValues.esCliente || false);
    setEsProveedor(defaultValues.esProveedor || false);
    setEsCorporativo(defaultValues.esCorporativo || false);
    setEstado(defaultValues.estado !== undefined ? defaultValues.estado : true);
    setObservaciones(defaultValues.observaciones || '');
    setCodigoErpFinanciero(defaultValues.codigoErpFinanciero || '');
    setCustodiaStock(defaultValues.custodiaStock || false);
    setControlLote(defaultValues.controlLote || false);
    setControlFechaVenc(defaultValues.controlFechaVenc || false);
    setControlFechaProd(defaultValues.controlFechaProd || false);
    setControlFechaIngreso(defaultValues.controlFechaIngreso || false);
    setControlSerie(defaultValues.controlSerie || false);
    setControlEnvase(defaultValues.controlEnvase || false);
    setSujetoRetencion(defaultValues.sujetoRetencion || false);
    setSujetoPercepcion(defaultValues.sujetoPercepcion || false);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      tipoEntidadId: tipoEntidadId ? Number(tipoEntidadId) : null,
      formaPagoId: formaPagoId ? Number(formaPagoId) : null,
      vendedorId: vendedorId ? Number(vendedorId) : null,
      agenciaEnvioId: agenciaEnvioId ? Number(agenciaEnvioId) : null,
      agrupacionEntidadId: agrupacionEntidadId ? Number(agrupacionEntidadId) : null,
      numeroDocumento,
      razonSocial,
      nombreComercial,
      esCliente,
      esProveedor,
      esCorporativo,
      estado,
      observaciones,
      codigoErpFinanciero,
      custodiaStock,
      controlLote,
      controlFechaVenc,
      controlFechaProd,
      controlFechaIngreso,
      controlSerie,
      controlEnvase,
      sujetoRetencion,
      sujetoPercepcion
    });
  };

  // Normalizar opciones para dropdowns
  const empresasOptions = empresas.map(e => ({ ...e, id: Number(e.id), label: e.nombre, value: Number(e.id) }));
  const tiposDocOptions = tiposDocumento.map(t => ({ ...t, id: Number(t.id), label: t.nombre, value: Number(t.id) }));
  const tiposEntidadOptions = tiposEntidad.map(t => ({ ...t, id: Number(t.id), label: t.nombre, value: Number(t.id) }));
  const formasPagoOptions = formasPago.map(f => ({ ...f, id: Number(f.id), label: f.nombre, value: Number(f.id) }));
  const agrupacionesOptions = agrupaciones.map(a => ({ ...a, id: Number(a.id), label: a.nombre, value: Number(a.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="empresaId">Empresa*</label>
            <Dropdown
              id="empresaId"
              value={empresaId ? Number(empresaId) : null}
              options={empresasOptions}
              onChange={e => setEmpresaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar empresa"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoDocumentoId">Tipo Documento*</label>
            <Dropdown
              id="tipoDocumentoId"
              value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
              options={tiposDocOptions}
              onChange={e => setTipoDocumentoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo documento"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numeroDocumento">Número Documento*</label>
            <InputText 
              id="numeroDocumento" 
              value={numeroDocumento} 
              onChange={e => setNumeroDocumento(e.target.value)} 
              required 
              disabled={loading}
              maxLength={20}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="tipoEntidadId">Tipo Entidad*</label>
            <Dropdown
              id="tipoEntidadId"
              value={tipoEntidadId ? Number(tipoEntidadId) : null}
              options={tiposEntidadOptions}
              onChange={e => setTipoEntidadId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo entidad"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="razonSocial">Razón Social*</label>
            <InputText 
              id="razonSocial" 
              value={razonSocial} 
              onChange={e => setRazonSocial(e.target.value)} 
              required 
              disabled={loading}
              maxLength={255}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="nombreComercial">Nombre Comercial</label>
            <InputText 
              id="nombreComercial" 
              value={nombreComercial} 
              onChange={e => setNombreComercial(e.target.value)} 
              disabled={loading}
              maxLength={255}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="formaPagoId">Forma Pago*</label>
            <Dropdown
              id="formaPagoId"
              value={formaPagoId ? Number(formaPagoId) : null}
              options={formasPagoOptions}
              onChange={e => setFormaPagoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar forma pago"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="agrupacionEntidadId">Agrupación</label>
            <Dropdown
              id="agrupacionEntidadId"
              value={agrupacionEntidadId ? Number(agrupacionEntidadId) : null}
              options={agrupacionesOptions}
              onChange={e => setAgrupacionEntidadId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar agrupación"
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="vendedorId">Vendedor ID*</label>
            <InputText 
              id="vendedorId" 
              value={vendedorId} 
              onChange={e => setVendedorId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="agenciaEnvioId">Agencia Envío ID*</label>
            <InputText 
              id="agenciaEnvioId" 
              value={agenciaEnvioId} 
              onChange={e => setAgenciaEnvioId(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="codigoErpFinanciero">Código ERP Financiero</label>
            <InputText 
              id="codigoErpFinanciero" 
              value={codigoErpFinanciero} 
              onChange={e => setCodigoErpFinanciero(e.target.value)} 
              disabled={loading}
              maxLength={50}
            />
          </div>
        </div>
        <div className="p-col-12">
          <h4>Configuración de Entidad</h4>
          <div className="p-grid">
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="esCliente" checked={esCliente} onChange={e => setEsCliente(e.checked)} disabled={loading} />
                <label htmlFor="esCliente">Es Cliente</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="esProveedor" checked={esProveedor} onChange={e => setEsProveedor(e.checked)} disabled={loading} />
                <label htmlFor="esProveedor">Es Proveedor</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="esCorporativo" checked={esCorporativo} onChange={e => setEsCorporativo(e.checked)} disabled={loading} />
                <label htmlFor="esCorporativo">Es Corporativo</label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-col-12">
          <h4>Controles de Stock</h4>
          <div className="p-grid">
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox id="custodiaStock" checked={custodiaStock} onChange={e => setCustodiaStock(e.checked)} disabled={loading} />
                <label htmlFor="custodiaStock">Custodia Stock</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox id="controlLote" checked={controlLote} onChange={e => setControlLote(e.checked)} disabled={loading} />
                <label htmlFor="controlLote">Control Lote</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox id="controlSerie" checked={controlSerie} onChange={e => setControlSerie(e.checked)} disabled={loading} />
                <label htmlFor="controlSerie">Control Serie</label>
              </div>
            </div>
            <div className="p-col-12 p-md-3">
              <div className="p-field-checkbox">
                <Checkbox id="controlEnvase" checked={controlEnvase} onChange={e => setControlEnvase(e.checked)} disabled={loading} />
                <label htmlFor="controlEnvase">Control Envase</label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-col-12">
          <h4>Controles de Fechas</h4>
          <div className="p-grid">
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="controlFechaVenc" checked={controlFechaVenc} onChange={e => setControlFechaVenc(e.checked)} disabled={loading} />
                <label htmlFor="controlFechaVenc">Control Fecha Venc.</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="controlFechaProd" checked={controlFechaProd} onChange={e => setControlFechaProd(e.checked)} disabled={loading} />
                <label htmlFor="controlFechaProd">Control Fecha Prod.</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="controlFechaIngreso" checked={controlFechaIngreso} onChange={e => setControlFechaIngreso(e.checked)} disabled={loading} />
                <label htmlFor="controlFechaIngreso">Control Fecha Ingreso</label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-col-12">
          <h4>Configuración Tributaria</h4>
          <div className="p-grid">
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="sujetoRetencion" checked={sujetoRetencion} onChange={e => setSujetoRetencion(e.checked)} disabled={loading} />
                <label htmlFor="sujetoRetencion">Sujeto Retención</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="sujetoPercepcion" checked={sujetoPercepcion} onChange={e => setSujetoPercepcion(e.checked)} disabled={loading} />
                <label htmlFor="sujetoPercepcion">Sujeto Percepción</label>
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field-checkbox">
                <Checkbox id="estado" checked={estado} onChange={e => setEstado(e.checked)} disabled={loading} />
                <label htmlFor="estado">Estado Activo</label>
              </div>
            </div>
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
