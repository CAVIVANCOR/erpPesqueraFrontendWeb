// src/components/centroCosto/CentroCostoForm.jsx
// Formulario profesional para CentroCosto. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';

export default function CentroCostoForm({ isEdit, defaultValues, categorias, onSubmit, onCancel, loading }) {
  const [codigo, setCodigo] = React.useState(defaultValues.Codigo || '');
  const [nombre, setNombre] = React.useState(defaultValues.Nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.Descripcion || '');
  const [categoriaID, setCategoriaID] = React.useState(defaultValues.CategoriaID || null);
  const [parentCentroID, setParentCentroID] = React.useState(defaultValues.ParentCentroID || '');

  React.useEffect(() => {
    setCodigo(defaultValues.Codigo || '');
    setNombre(defaultValues.Nombre || '');
    setDescripcion(defaultValues.Descripcion || '');
    setCategoriaID(defaultValues.CategoriaID ? Number(defaultValues.CategoriaID) : null);
    setParentCentroID(defaultValues.ParentCentroID || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      Codigo: codigo,
      Nombre: nombre,
      Descripcion: descripcion,
      CategoriaID: categoriaID ? Number(categoriaID) : null,
      ParentCentroID: parentCentroID || null
    });
  };

  // Normalizar opciones de categorías para el dropdown
  const categoriasOptions = categorias.map(c => ({ 
    ...c, 
    id: Number(c.id),
    label: c.nombre,
    value: Number(c.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="codigo">Código*</label>
        <InputText 
          id="codigo" 
          value={codigo} 
          onChange={e => setCodigo(e.target.value)} 
          required 
          disabled={loading}
          maxLength={20}
        />
      </div>
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText 
          id="nombre" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
          disabled={loading}
          maxLength={255}
        />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputTextarea 
          id="descripcion" 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          rows={3} 
          disabled={loading} 
        />
      </div>
      <div className="p-field">
        <label htmlFor="categoriaID">Categoría*</label>
        <Dropdown
          id="categoriaID"
          value={categoriaID ? Number(categoriaID) : null}
          options={categoriasOptions}
          onChange={e => setCategoriaID(e.value)}
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccionar categoría"
          disabled={loading}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="parentCentroID">Centro Padre</label>
        <InputText 
          id="parentCentroID" 
          value={parentCentroID} 
          onChange={e => setParentCentroID(e.target.value)} 
          disabled={loading}
          maxLength={20}
        />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
