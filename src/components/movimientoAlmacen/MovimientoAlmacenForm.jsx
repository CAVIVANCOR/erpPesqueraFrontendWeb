// src/components/movimientoAlmacen/MovimientoAlmacenForm.jsx
// Formulario profesional para MovimientoAlmacen. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';

export default function MovimientoAlmacenForm({ 
  isEdit, 
  defaultValues, 
  empresas, 
  tiposDocumento, 
  entidadesComerciales, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const [empresaId, setEmpresaId] = React.useState(defaultValues.empresaId || null);
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState(defaultValues.tipoDocumentoId || null);
  const [conceptoMovAlmacenId, setConceptoMovAlmacenId] = React.useState(defaultValues.conceptoMovAlmacenId || null);
  const [serieDocId, setSerieDocId] = React.useState(defaultValues.serieDocId || null);
  const [numSerieDoc, setNumSerieDoc] = React.useState(defaultValues.numSerieDoc || '');
  const [numCorreDoc, setNumCorreDoc] = React.useState(defaultValues.numCorreDoc || '');
  const [numeroDocumento, setNumeroDocumento] = React.useState(defaultValues.numeroDocumento || '');
  const [fechaDocumento, setFechaDocumento] = React.useState(defaultValues.fechaDocumento ? new Date(defaultValues.fechaDocumento) : new Date());
  const [entidadComercialId, setEntidadComercialId] = React.useState(defaultValues.entidadComercialId || null);
  const [liquidacionViajeId, setLiquidacionViajeId] = React.useState(defaultValues.liquidacionViajeId || null);
  const [faenaPescaId, setFaenaPescaId] = React.useState(defaultValues.faenaPescaId || null);
  const [embarcacionId, setEmbarcacionId] = React.useState(defaultValues.embarcacionId || null);
  const [ordenTrabajoId, setOrdenTrabajoId] = React.useState(defaultValues.ordenTrabajoId || null);
  const [dirOrigenId, setDirOrigenId] = React.useState(defaultValues.dirOrigenId || null);
  const [dirDestinoId, setDirDestinoId] = React.useState(defaultValues.dirDestinoId || null);
  const [numGuiaSunat, setNumGuiaSunat] = React.useState(defaultValues.numGuiaSunat || '');
  const [fechaGuiaSunat, setFechaGuiaSunat] = React.useState(defaultValues.fechaGuiaSunat ? new Date(defaultValues.fechaGuiaSunat) : null);
  const [transportistaId, setTransportistaId] = React.useState(defaultValues.transportistaId || null);
  const [vehiculoId, setVehiculoId] = React.useState(defaultValues.vehiculoId || null);
  const [choferId, setChoferId] = React.useState(defaultValues.choferId || null);
  const [agenciaEnvioId, setAgenciaEnvioId] = React.useState(defaultValues.agenciaEnvioId || null);
  const [dirAgenciaEnvioId, setDirAgenciaEnvioId] = React.useState(defaultValues.dirAgenciaEnvioId || null);
  const [personalRespAlmacen, setPersonalRespAlmacen] = React.useState(defaultValues.personalRespAlmacen || null);
  const [ordenCompraId, setOrdenCompraId] = React.useState(defaultValues.ordenCompraId || null);
  const [pedidoVentaId, setPedidoVentaId] = React.useState(defaultValues.pedidoVentaId || null);
  const [estadoDocAlmacenId, setEstadoDocAlmacenId] = React.useState(defaultValues.estadoDocAlmacenId || null);
  const [refEmbarcacionMatricula, setRefEmbarcacionMatricula] = React.useState(defaultValues.refEmbarcacionMatricula || '');
  const [refEmbarcacionNombre, setRefEmbarcacionNombre] = React.useState(defaultValues.refEmbarcacionNombre || '');
  const [refEmbarcacionNroPlaca, setRefEmbarcacionNroPlaca] = React.useState(defaultValues.refEmbarcacionNroPlaca || '');
  const [custodia, setCustodia] = React.useState(defaultValues.custodia !== undefined ? defaultValues.custodia : false);
  const [observaciones, setObservaciones] = React.useState(defaultValues.observaciones || '');

  React.useEffect(() => {
    setEmpresaId(defaultValues.empresaId ? Number(defaultValues.empresaId) : null);
    setTipoDocumentoId(defaultValues.tipoDocumentoId ? Number(defaultValues.tipoDocumentoId) : null);
    setConceptoMovAlmacenId(defaultValues.conceptoMovAlmacenId ? Number(defaultValues.conceptoMovAlmacenId) : null);
    setSerieDocId(defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null);
    setNumSerieDoc(defaultValues.numSerieDoc || '');
    setNumCorreDoc(defaultValues.numCorreDoc || '');
    setNumeroDocumento(defaultValues.numeroDocumento || '');
    setFechaDocumento(defaultValues.fechaDocumento ? new Date(defaultValues.fechaDocumento) : new Date());
    setEntidadComercialId(defaultValues.entidadComercialId ? Number(defaultValues.entidadComercialId) : null);
    setLiquidacionViajeId(defaultValues.liquidacionViajeId ? Number(defaultValues.liquidacionViajeId) : null);
    setFaenaPescaId(defaultValues.faenaPescaId ? Number(defaultValues.faenaPescaId) : null);
    setEmbarcacionId(defaultValues.embarcacionId ? Number(defaultValues.embarcacionId) : null);
    setOrdenTrabajoId(defaultValues.ordenTrabajoId ? Number(defaultValues.ordenTrabajoId) : null);
    setDirOrigenId(defaultValues.dirOrigenId ? Number(defaultValues.dirOrigenId) : null);
    setDirDestinoId(defaultValues.dirDestinoId ? Number(defaultValues.dirDestinoId) : null);
    setNumGuiaSunat(defaultValues.numGuiaSunat || '');
    setFechaGuiaSunat(defaultValues.fechaGuiaSunat ? new Date(defaultValues.fechaGuiaSunat) : null);
    setTransportistaId(defaultValues.transportistaId ? Number(defaultValues.transportistaId) : null);
    setVehiculoId(defaultValues.vehiculoId ? Number(defaultValues.vehiculoId) : null);
    setChoferId(defaultValues.choferId ? Number(defaultValues.choferId) : null);
    setAgenciaEnvioId(defaultValues.agenciaEnvioId ? Number(defaultValues.agenciaEnvioId) : null);
    setDirAgenciaEnvioId(defaultValues.dirAgenciaEnvioId ? Number(defaultValues.dirAgenciaEnvioId) : null);
    setPersonalRespAlmacen(defaultValues.personalRespAlmacen ? Number(defaultValues.personalRespAlmacen) : null);
    setOrdenCompraId(defaultValues.ordenCompraId ? Number(defaultValues.ordenCompraId) : null);
    setPedidoVentaId(defaultValues.pedidoVentaId ? Number(defaultValues.pedidoVentaId) : null);
    setEstadoDocAlmacenId(defaultValues.estadoDocAlmacenId ? Number(defaultValues.estadoDocAlmacenId) : null);
    setRefEmbarcacionMatricula(defaultValues.refEmbarcacionMatricula || '');
    setRefEmbarcacionNombre(defaultValues.refEmbarcacionNombre || '');
    setRefEmbarcacionNroPlaca(defaultValues.refEmbarcacionNroPlaca || '');
    setCustodia(defaultValues.custodia !== undefined ? defaultValues.custodia : false);
    setObservaciones(defaultValues.observaciones || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      conceptoMovAlmacenId: conceptoMovAlmacenId ? Number(conceptoMovAlmacenId) : null,
      serieDocId: serieDocId ? Number(serieDocId) : null,
      numSerieDoc,
      numCorreDoc,
      numeroDocumento,
      fechaDocumento,
      entidadComercialId: entidadComercialId ? Number(entidadComercialId) : null,
      liquidacionViajeId: liquidacionViajeId ? Number(liquidacionViajeId) : null,
      faenaPescaId: faenaPescaId ? Number(faenaPescaId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      ordenTrabajoId: ordenTrabajoId ? Number(ordenTrabajoId) : null,
      dirOrigenId: dirOrigenId ? Number(dirOrigenId) : null,
      dirDestinoId: dirDestinoId ? Number(dirDestinoId) : null,
      numGuiaSunat,
      fechaGuiaSunat,
      transportistaId: transportistaId ? Number(transportistaId) : null,
      vehiculoId: vehiculoId ? Number(vehiculoId) : null,
      choferId: choferId ? Number(choferId) : null,
      agenciaEnvioId: agenciaEnvioId ? Number(agenciaEnvioId) : null,
      dirAgenciaEnvioId: dirAgenciaEnvioId ? Number(dirAgenciaEnvioId) : null,
      personalRespAlmacen: personalRespAlmacen ? Number(personalRespAlmacen) : null,
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : null,
      pedidoVentaId: pedidoVentaId ? Number(pedidoVentaId) : null,
      estadoDocAlmacenId: estadoDocAlmacenId ? Number(estadoDocAlmacenId) : null,
      refEmbarcacionMatricula,
      refEmbarcacionNombre,
      refEmbarcacionNroPlaca,
      custodia,
      observaciones
    });
  };

  // Normalizar opciones para dropdowns
  const empresasOptions = empresas.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.razonSocial,
    value: Number(e.id)
  }));

  const tiposDocumentoOptions = tiposDocumento.map(t => ({ 
    ...t, 
    id: Number(t.id),
    label: t.nombre,
    value: Number(t.id)
  }));

  const entidadesOptions = entidadesComerciales.map(e => ({ 
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
            <label htmlFor="tipoDocumentoId">Tipo de Documento*</label>
            <Dropdown
              id="tipoDocumentoId"
              value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
              options={tiposDocumentoOptions}
              onChange={e => setTipoDocumentoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="conceptoMovAlmacenId">Concepto Movimiento*</label>
            <InputNumber 
              id="conceptoMovAlmacenId" 
              value={conceptoMovAlmacenId} 
              onValueChange={e => setConceptoMovAlmacenId(e.value)} 
              required 
              disabled={loading}
              useGrouping={false}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numeroDocumento">Número de Documento</label>
            <InputText 
              id="numeroDocumento" 
              value={numeroDocumento} 
              onChange={e => setNumeroDocumento(e.target.value)} 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaDocumento">Fecha Documento*</label>
            <Calendar
              id="fechaDocumento"
              value={fechaDocumento}
              onChange={e => setFechaDocumento(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              required
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="entidadComercialId">Entidad Comercial</label>
            <Dropdown
              id="entidadComercialId"
              value={entidadComercialId ? Number(entidadComercialId) : null}
              options={entidadesOptions}
              onChange={e => setEntidadComercialId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar entidad"
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numSerieDoc">Número Serie Doc.</label>
            <InputText 
              id="numSerieDoc" 
              value={numSerieDoc} 
              onChange={e => setNumSerieDoc(e.target.value)} 
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numCorreDoc">Número Correlativo Doc.</label>
            <InputText 
              id="numCorreDoc" 
              value={numCorreDoc} 
              onChange={e => setNumCorreDoc(e.target.value)} 
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="numGuiaSunat">Número Guía SUNAT</label>
            <InputText 
              id="numGuiaSunat" 
              value={numGuiaSunat} 
              onChange={e => setNumGuiaSunat(e.target.value)} 
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="fechaGuiaSunat">Fecha Guía SUNAT</label>
            <Calendar
              id="fechaGuiaSunat"
              value={fechaGuiaSunat}
              onChange={e => setFechaGuiaSunat(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-4">
          <div className="p-field">
            <label htmlFor="refEmbarcacionMatricula">Ref. Embarcación Matrícula</label>
            <InputText 
              id="refEmbarcacionMatricula" 
              value={refEmbarcacionMatricula} 
              onChange={e => setRefEmbarcacionMatricula(e.target.value)} 
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-4">
          <div className="p-field">
            <label htmlFor="refEmbarcacionNombre">Ref. Embarcación Nombre</label>
            <InputText 
              id="refEmbarcacionNombre" 
              value={refEmbarcacionNombre} 
              onChange={e => setRefEmbarcacionNombre(e.target.value)} 
              disabled={loading}
              maxLength={100}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-4">
          <div className="p-field">
            <label htmlFor="refEmbarcacionNroPlaca">Ref. Embarcación Nro. Placa</label>
            <InputText 
              id="refEmbarcacionNroPlaca" 
              value={refEmbarcacionNroPlaca} 
              onChange={e => setRefEmbarcacionNroPlaca(e.target.value)} 
              disabled={loading}
              maxLength={40}
            />
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox 
              id="custodia" 
              checked={custodia} 
              onChange={e => setCustodia(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="custodia">Custodia</label>
          </div>
        </div>
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea 
              id="observaciones" 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)} 
              disabled={loading}
              rows={3}
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
