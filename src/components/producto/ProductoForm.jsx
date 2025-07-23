// src/components/producto/ProductoForm.jsx
// Formulario profesional para Producto. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';

export default function ProductoForm({ isEdit, defaultValues, familias, subfamilias, unidadesMedida, tiposMaterial, colores, onSubmit, onCancel, loading }) {
  const [codigo, setCodigo] = React.useState(defaultValues.codigo || '');
  const [descripcionBase, setDescripcionBase] = React.useState(defaultValues.descripcionBase || '');
  const [descripcionExtendida, setDescripcionExtendida] = React.useState(defaultValues.descripcionExtendida || '');
  const [descripcionArmada, setDescripcionArmada] = React.useState(defaultValues.descripcionArmada || '');
  const [familiaId, setFamiliaId] = React.useState(defaultValues.familiaId || null);
  const [subfamiliaId, setSubfamiliaId] = React.useState(defaultValues.subfamiliaId || null);
  const [unidadMedidaId, setUnidadMedidaId] = React.useState(defaultValues.unidadMedidaId || null);
  const [tipoAlmacenamientoId, setTipoAlmacenamientoId] = React.useState(defaultValues.tipoAlmacenamientoId || null);
  const [procedenciaId, setProcedenciaId] = React.useState(defaultValues.procedenciaId || null);
  const [marcaId, setMarcaId] = React.useState(defaultValues.marcaId || null);
  const [estadoInicialId, setEstadoInicialId] = React.useState(defaultValues.estadoInicialId || null);
  const [exoneradoIgv, setExoneradoIgv] = React.useState(defaultValues.exoneradoIgv || false);
  const [porcentajeDetraccion, setPorcentajeDetraccion] = React.useState(defaultValues.porcentajeDetraccion || null);
  const [clienteId, setClienteId] = React.useState(defaultValues.clienteId || null);
  const [tipoMaterialId, setTipoMaterialId] = React.useState(defaultValues.tipoMaterialId || null);
  const [colorId, setColorId] = React.useState(defaultValues.colorId || null);
  const [diametro, setDiametro] = React.useState(defaultValues.diametro || null);
  const [ancho, setAncho] = React.useState(defaultValues.ancho || null);
  const [alto, setAlto] = React.useState(defaultValues.alto || null);
  const [largo, setLargo] = React.useState(defaultValues.largo || null);
  const [espesor, setEspesor] = React.useState(defaultValues.espesor || null);
  const [angulo, setAngulo] = React.useState(defaultValues.angulo || null);
  const [exoneradoRetencion, setExoneradoRetencion] = React.useState(defaultValues.exoneradoRetencion || false);
  const [sujetoDetraccion, setSujetoDetraccion] = React.useState(defaultValues.sujetoDetraccion || false);

  // Estados locales para subfamilias filtradas
  const [subfamiliasFiltradas, setSubfamiliasFiltradas] = React.useState([]);

  React.useEffect(() => {
    setCodigo(defaultValues.codigo || '');
    setDescripcionBase(defaultValues.descripcionBase || '');
    setDescripcionExtendida(defaultValues.descripcionExtendida || '');
    setDescripcionArmada(defaultValues.descripcionArmada || '');
    setFamiliaId(defaultValues.familiaId || null);
    setSubfamiliaId(defaultValues.subfamiliaId || null);
    setUnidadMedidaId(defaultValues.unidadMedidaId || null);
    setTipoAlmacenamientoId(defaultValues.tipoAlmacenamientoId || null);
    setProcedenciaId(defaultValues.procedenciaId || null);
    setMarcaId(defaultValues.marcaId || null);
    setEstadoInicialId(defaultValues.estadoInicialId || null);
    setExoneradoIgv(defaultValues.exoneradoIgv || false);
    setPorcentajeDetraccion(defaultValues.porcentajeDetraccion || null);
    setClienteId(defaultValues.clienteId || null);
    setTipoMaterialId(defaultValues.tipoMaterialId || null);
    setColorId(defaultValues.colorId || null);
    setDiametro(defaultValues.diametro || null);
    setAncho(defaultValues.ancho || null);
    setAlto(defaultValues.alto || null);
    setLargo(defaultValues.largo || null);
    setEspesor(defaultValues.espesor || null);
    setAngulo(defaultValues.angulo || null);
    setExoneradoRetencion(defaultValues.exoneradoRetencion || false);
    setSujetoDetraccion(defaultValues.sujetoDetraccion || false);
  }, [defaultValues]);

  // Filtrar subfamilias cuando cambie la familia seleccionada
  React.useEffect(() => {
    if (familiaId && subfamilias.length > 0) {
      const filtradas = subfamilias.filter(s => Number(s.familiaId) === Number(familiaId));
      setSubfamiliasFiltradas(filtradas);
      // Si la subfamilia actual no pertenece a la familia seleccionada, limpiarla
      if (subfamiliaId && !filtradas.find(s => Number(s.id) === Number(subfamiliaId))) {
        setSubfamiliaId(null);
      }
    } else {
      setSubfamiliasFiltradas([]);
      setSubfamiliaId(null);
    }
  }, [familiaId, subfamilias, subfamiliaId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      codigo,
      descripcionBase,
      descripcionExtendida,
      descripcionArmada,
      familiaId: familiaId ? Number(familiaId) : null,
      subfamiliaId: subfamiliaId ? Number(subfamiliaId) : null,
      unidadMedidaId: unidadMedidaId ? Number(unidadMedidaId) : null,
      tipoAlmacenamientoId: tipoAlmacenamientoId ? Number(tipoAlmacenamientoId) : null,
      procedenciaId: procedenciaId ? Number(procedenciaId) : null,
      marcaId: marcaId ? Number(marcaId) : null,
      estadoInicialId: estadoInicialId ? Number(estadoInicialId) : null,
      exoneradoIgv,
      porcentajeDetraccion,
      clienteId: clienteId ? Number(clienteId) : null,
      tipoMaterialId: tipoMaterialId ? Number(tipoMaterialId) : null,
      colorId: colorId ? Number(colorId) : null,
      diametro,
      ancho,
      alto,
      largo,
      espesor,
      angulo,
      exoneradoRetencion,
      sujetoDetraccion
    });
  };

  const familiasOptions = familias.map(f => ({ ...f, id: Number(f.id) }));
  const subfamiliasOptions = subfamiliasFiltradas.map(s => ({ ...s, id: Number(s.id) }));
  const unidadesMedidaOptions = unidadesMedida.map(u => ({ ...u, id: Number(u.id) }));
  const tiposMaterialOptions = tiposMaterial.map(t => ({ ...t, id: Number(t.id) }));
  const coloresOptions = colores.map(c => ({ ...c, id: Number(c.id) }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <TabView>
        <TabPanel header="Información Básica">
          <div className="p-grid">
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="codigo">Código*</label>
                <InputText 
                  id="codigo" 
                  value={codigo} 
                  onChange={e => setCodigo(e.target.value)} 
                  required 
                  disabled={loading}
                  maxLength={40}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="familiaId">Familia*</label>
                <Dropdown 
                  id="familiaId"
                  value={familiaId ? Number(familiaId) : null}
                  options={familiasOptions}
                  optionLabel="descripcionBase"
                  optionValue="id"
                  onChange={e => setFamiliaId(e.value)}
                  placeholder="Seleccione familia"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div className="p-col-12">
              <div className="p-field">
                <label htmlFor="descripcionBase">Descripción Base*</label>
                <InputText 
                  id="descripcionBase" 
                  value={descripcionBase} 
                  onChange={e => setDescripcionBase(e.target.value)} 
                  required 
                  disabled={loading}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="p-col-12">
              <div className="p-field">
                <label htmlFor="descripcionExtendida">Descripción Extendida</label>
                <InputTextarea 
                  id="descripcionExtendida" 
                  value={descripcionExtendida} 
                  onChange={e => setDescripcionExtendida(e.target.value)} 
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="subfamiliaId">Subfamilia</label>
                <Dropdown 
                  id="subfamiliaId"
                  value={subfamiliaId ? Number(subfamiliaId) : null}
                  options={subfamiliasOptions}
                  optionLabel="descripcionBase"
                  optionValue="id"
                  onChange={e => setSubfamiliaId(e.value)}
                  placeholder="Seleccione subfamilia"
                  disabled={loading || !familiaId}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="unidadMedidaId">Unidad de Medida*</label>
                <Dropdown 
                  id="unidadMedidaId"
                  value={unidadMedidaId ? Number(unidadMedidaId) : null}
                  options={unidadesMedidaOptions}
                  optionLabel="nombre"
                  optionValue="id"
                  onChange={e => setUnidadMedidaId(e.value)}
                  placeholder="Seleccione unidad"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel header="Características">
          <div className="p-grid">
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="tipoMaterialId">Tipo de Material</label>
                <Dropdown 
                  id="tipoMaterialId"
                  value={tipoMaterialId ? Number(tipoMaterialId) : null}
                  options={tiposMaterialOptions}
                  optionLabel="descripcionBase"
                  optionValue="id"
                  onChange={e => setTipoMaterialId(e.value)}
                  placeholder="Seleccione tipo de material"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="colorId">Color</label>
                <Dropdown 
                  id="colorId"
                  value={colorId ? Number(colorId) : null}
                  options={coloresOptions}
                  optionLabel="descripcionBase"
                  optionValue="id"
                  onChange={e => setColorId(e.value)}
                  placeholder="Seleccione color"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="diametro">Diámetro</label>
                <InputNumber 
                  id="diametro" 
                  value={diametro} 
                  onValueChange={e => setDiametro(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="ancho">Ancho</label>
                <InputNumber 
                  id="ancho" 
                  value={ancho} 
                  onValueChange={e => setAncho(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="alto">Alto</label>
                <InputNumber 
                  id="alto" 
                  value={alto} 
                  onValueChange={e => setAlto(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="largo">Largo</label>
                <InputNumber 
                  id="largo" 
                  value={largo} 
                  onValueChange={e => setLargo(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="espesor">Espesor</label>
                <InputNumber 
                  id="espesor" 
                  value={espesor} 
                  onValueChange={e => setEspesor(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-4">
              <div className="p-field">
                <label htmlFor="angulo">Ángulo</label>
                <InputNumber 
                  id="angulo" 
                  value={angulo} 
                  onValueChange={e => setAngulo(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel header="Configuración Tributaria">
          <div className="p-grid">
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="porcentajeDetraccion">Porcentaje Detracción (%)</label>
                <InputNumber 
                  id="porcentajeDetraccion" 
                  value={porcentajeDetraccion} 
                  onValueChange={e => setPorcentajeDetraccion(e.value)} 
                  disabled={loading}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  step={0.01}
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <div className="p-col-12 p-md-6">
              <div className="p-field">
                <label htmlFor="clienteId">Cliente ID</label>
                <InputNumber 
                  id="clienteId" 
                  value={clienteId} 
                  onValueChange={e => setClienteId(e.value)} 
                  disabled={loading}
                  useGrouping={false}
                />
              </div>
            </div>
            <div className="p-col-12">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="exoneradoIgv" 
                  checked={exoneradoIgv} 
                  onChange={e => setExoneradoIgv(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="exoneradoIgv">Exonerado de IGV</label>
              </div>
            </div>
            <div className="p-col-12">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="exoneradoRetencion" 
                  checked={exoneradoRetencion} 
                  onChange={e => setExoneradoRetencion(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="exoneradoRetencion">Exonerado de Retención</label>
              </div>
            </div>
            <div className="p-col-12">
              <div className="p-field-checkbox">
                <Checkbox 
                  id="sujetoDetraccion" 
                  checked={sujetoDetraccion} 
                  onChange={e => setSujetoDetraccion(e.checked)} 
                  disabled={loading} 
                />
                <label htmlFor="sujetoDetraccion">Sujeto a Detracción</label>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
