// src/components/ubigeo/UbigeoForm.jsx
// Formulario profesional para Ubigeo. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function UbigeoForm({ 
  isEdit, 
  defaultValues, 
  paises, 
  departamentos, 
  provincias, 
  distritos, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const [paisId, setPaisId] = React.useState(defaultValues.paisId || null);
  const [departamentoId, setDepartamentoId] = React.useState(defaultValues.departamentoId || null);
  const [provinciaId, setProvinciaId] = React.useState(defaultValues.provinciaId || null);
  const [distritoId, setDistritoId] = React.useState(defaultValues.distritoId || null);
  const [codigo, setCodigo] = React.useState(defaultValues.codigo || '');
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  // Estados para combos dependientes filtrados
  const [departamentosFiltrados, setDepartamentosFiltrados] = React.useState([]);
  const [provinciasFiltradas, setProvinciasFiltradas] = React.useState([]);
  const [distritosFiltrados, setDistritosFiltrados] = React.useState([]);

  React.useEffect(() => {
    setPaisId(defaultValues.paisId ? Number(defaultValues.paisId) : null);
    setDepartamentoId(defaultValues.departamentoId ? Number(defaultValues.departamentoId) : null);
    setProvinciaId(defaultValues.provinciaId ? Number(defaultValues.provinciaId) : null);
    setDistritoId(defaultValues.distritoId ? Number(defaultValues.distritoId) : null);
    setCodigo(defaultValues.codigo || '');
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  // Filtrar departamentos cuando cambia el país
  React.useEffect(() => {
    if (paisId && departamentos.length > 0) {
      const filtrados = departamentos.filter(d => Number(d.paisId) === Number(paisId));
      setDepartamentosFiltrados(filtrados);
      
      // Si el departamento seleccionado no pertenece al país, limpiarlo
      if (departamentoId && !filtrados.find(d => Number(d.id) === Number(departamentoId))) {
        setDepartamentoId(null);
        setProvinciaId(null);
        setDistritoId(null);
      }
    } else {
      setDepartamentosFiltrados([]);
      setDepartamentoId(null);
      setProvinciaId(null);
      setDistritoId(null);
    }
  }, [paisId, departamentos]);

  // Filtrar provincias cuando cambia el departamento
  React.useEffect(() => {
    if (departamentoId && provincias.length > 0) {
      const filtradas = provincias.filter(p => Number(p.departamentoId) === Number(departamentoId));
      setProvinciasFiltradas(filtradas);
      
      // Si la provincia seleccionada no pertenece al departamento, limpiarla
      if (provinciaId && !filtradas.find(p => Number(p.id) === Number(provinciaId))) {
        setProvinciaId(null);
        setDistritoId(null);
      }
    } else {
      setProvinciasFiltradas([]);
      setProvinciaId(null);
      setDistritoId(null);
    }
  }, [departamentoId, provincias]);

  // Filtrar distritos cuando cambia la provincia
  React.useEffect(() => {
    if (provinciaId && distritos.length > 0) {
      const filtrados = distritos.filter(d => Number(d.provinciaId) === Number(provinciaId));
      setDistritosFiltrados(filtrados);
      
      // Si el distrito seleccionado no pertenece a la provincia, limpiarlo
      if (distritoId && !filtrados.find(d => Number(d.id) === Number(distritoId))) {
        setDistritoId(null);
      }
    } else {
      setDistritosFiltrados([]);
      setDistritoId(null);
    }
  }, [provinciaId, distritos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      paisId: paisId ? Number(paisId) : null,
      departamentoId: departamentoId ? Number(departamentoId) : null,
      provinciaId: provinciaId ? Number(provinciaId) : null,
      distritoId: distritoId ? Number(distritoId) : null,
      codigo,
      activo
    });
  };

  // Normalizar opciones para dropdowns
  const paisesOptions = paises.map(p => ({ 
    ...p, 
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id)
  }));

  const departamentosOptions = departamentosFiltrados.map(d => ({ 
    ...d, 
    id: Number(d.id),
    label: d.nombre,
    value: Number(d.id)
  }));

  const provinciasOptions = provinciasFiltradas.map(p => ({ 
    ...p, 
    id: Number(p.id),
    label: p.nombre,
    value: Number(p.id)
  }));

  const distritosOptions = distritosFiltrados.map(d => ({ 
    ...d, 
    id: Number(d.id),
    label: d.nombre,
    value: Number(d.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="paisId">País*</label>
            <Dropdown
              id="paisId"
              value={paisId ? Number(paisId) : null}
              options={paisesOptions}
              onChange={e => setPaisId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar país"
              disabled={loading}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="departamentoId">Departamento*</label>
            <Dropdown
              id="departamentoId"
              value={departamentoId ? Number(departamentoId) : null}
              options={departamentosOptions}
              onChange={e => setDepartamentoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar departamento"
              disabled={loading || !paisId}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="provinciaId">Provincia*</label>
            <Dropdown
              id="provinciaId"
              value={provinciaId ? Number(provinciaId) : null}
              options={provinciasOptions}
              onChange={e => setProvinciaId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar provincia"
              disabled={loading || !departamentoId}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div className="p-field">
            <label htmlFor="distritoId">Distrito*</label>
            <Dropdown
              id="distritoId"
              value={distritoId ? Number(distritoId) : null}
              options={distritosOptions}
              onChange={e => setDistritoId(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar distrito"
              disabled={loading || !provinciaId}
              required
            />
          </div>
        </div>
        <div className="p-col-12 p-md-8">
          <div className="p-field">
            <label htmlFor="codigo">Código*</label>
            <InputText 
              id="codigo" 
              value={codigo} 
              onChange={e => setCodigo(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-col-12 p-md-4">
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
