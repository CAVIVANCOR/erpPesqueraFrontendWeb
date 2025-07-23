// src/components/tipoEntidad/TipoEntidadForm.jsx
// Formulario profesional para TipoEntidad. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';

export default function TipoEntidadForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');
  const [esCliente, setEsCliente] = React.useState(defaultValues.esCliente || false);
  const [esProveedor, setEsProveedor] = React.useState(defaultValues.esProveedor || false);
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? defaultValues.activo : true);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
    setEsCliente(defaultValues.esCliente || false);
    setEsProveedor(defaultValues.esProveedor || false);
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      descripcion,
      esCliente,
      esProveedor,
      activo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field">
            <label htmlFor="nombre">Nombre*</label>
            <InputText 
              id="nombre" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              disabled={loading}
              maxLength={50}
            />
          </div>
        </div>
        <div className="p-col-12">
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
        </div>
        <div className="p-col-12 p-md-4">
          <div className="p-field-checkbox">
            <Checkbox 
              id="esCliente" 
              checked={esCliente} 
              onChange={e => setEsCliente(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="esCliente">Es Cliente</label>
          </div>
        </div>
        <div className="p-col-12 p-md-4">
          <div className="p-field-checkbox">
            <Checkbox 
              id="esProveedor" 
              checked={esProveedor} 
              onChange={e => setEsProveedor(e.checked)} 
              disabled={loading} 
            />
            <label htmlFor="esProveedor">Es Proveedor</label>
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
