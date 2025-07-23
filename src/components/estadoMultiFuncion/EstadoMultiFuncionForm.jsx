// src/components/estadoMultiFuncion/EstadoMultiFuncionForm.jsx
// Formulario profesional para EstadoMultiFuncion. Cumple regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

export default function EstadoMultiFuncionForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [descripcion, setDescripcion] = React.useState(defaultValues.descripcion || '');

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setDescripcion(defaultValues.descripcion || '');
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nombre, descripcion });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} autoFocus />
      </div>
      <div className="p-field">
        <label htmlFor="descripcion">Descripción</label>
        <InputText id="descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={loading} />
      </div>
      <div className="p-d-flex p-jc-end p-mt-3">
        <Button label="Cancelar" className="p-button-text p-mr-2" type="button" onClick={onCancel} disabled={loading} />
        <Button label={isEdit ? 'Actualizar' : 'Crear'} icon="pi pi-save" type="submit" loading={loading} />
      </div>
    </form>
  );
}
