// src/components/accesosUsuario/AccesosUsuarioForm.jsx
// Formulario profesional para AccesosUsuario. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';

export default function AccesosUsuarioForm({ isEdit, defaultValues, onSubmit, onCancel, loading }) {
  const [usuarioId, setUsuarioId] = React.useState(defaultValues.usuarioId || '');
  const [submoduloId, setSubmoduloId] = React.useState(defaultValues.submoduloId || '');
  const [puedeVer, setPuedeVer] = React.useState(defaultValues.puedeVer !== undefined ? !!defaultValues.puedeVer : true);
  const [puedeCrear, setPuedeCrear] = React.useState(defaultValues.puedeCrear !== undefined ? !!defaultValues.puedeCrear : false);
  const [puedeEditar, setPuedeEditar] = React.useState(defaultValues.puedeEditar !== undefined ? !!defaultValues.puedeEditar : false);
  const [puedeEliminar, setPuedeEliminar] = React.useState(defaultValues.puedeEliminar !== undefined ? !!defaultValues.puedeEliminar : false);
  const [puederAprobarDocs, setPuederAprobarDocs] = React.useState(defaultValues.puederAprobarDocs !== undefined ? !!defaultValues.puederAprobarDocs : false);
  const [puederRechazarDocs, setPuederRechazarDocs] = React.useState(defaultValues.puederRechazarDocs !== undefined ? !!defaultValues.puederRechazarDocs : false);
  const [puedeReactivarDocs, setPuedeReactivarDocs] = React.useState(defaultValues.puedeReactivarDocs !== undefined ? !!defaultValues.puedeReactivarDocs : false);
  const [fechaOtorgado, setFechaOtorgado] = React.useState(defaultValues.fechaOtorgado ? new Date(defaultValues.fechaOtorgado) : new Date());

  React.useEffect(() => {
    setUsuarioId(defaultValues.usuarioId || '');
    setSubmoduloId(defaultValues.submoduloId || '');
    setPuedeVer(defaultValues.puedeVer !== undefined ? !!defaultValues.puedeVer : true);
    setPuedeCrear(defaultValues.puedeCrear !== undefined ? !!defaultValues.puedeCrear : false);
    setPuedeEditar(defaultValues.puedeEditar !== undefined ? !!defaultValues.puedeEditar : false);
    setPuedeEliminar(defaultValues.puedeEliminar !== undefined ? !!defaultValues.puedeEliminar : false);
    setPuederAprobarDocs(defaultValues.puederAprobarDocs !== undefined ? !!defaultValues.puederAprobarDocs : false);
    setPuederRechazarDocs(defaultValues.puederRechazarDocs !== undefined ? !!defaultValues.puederRechazarDocs : false);
    setPuedeReactivarDocs(defaultValues.puedeReactivarDocs !== undefined ? !!defaultValues.puedeReactivarDocs : false);
    setFechaOtorgado(defaultValues.fechaOtorgado ? new Date(defaultValues.fechaOtorgado) : new Date());
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      usuarioId: usuarioId ? Number(usuarioId) : null,
      submoduloId: submoduloId ? Number(submoduloId) : null,
      puedeVer,
      puedeCrear,
      puedeEditar,
      puedeEliminar,
      puederAprobarDocs,
      puederRechazarDocs,
      puedeReactivarDocs,
      fechaOtorgado
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="usuarioId">Usuario*</label>
        <InputText id="usuarioId" value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field">
        <label htmlFor="submoduloId">Submódulo*</label>
        <InputText id="submoduloId" value={submoduloId} onChange={e => setSubmoduloId(e.target.value)} required disabled={loading} />
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puedeVer" checked={puedeVer} onChange={e => setPuedeVer(e.checked)} disabled={loading} />
        <label htmlFor="puedeVer">Puede Ver</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puedeCrear" checked={puedeCrear} onChange={e => setPuedeCrear(e.checked)} disabled={loading} />
        <label htmlFor="puedeCrear">Puede Crear</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puedeEditar" checked={puedeEditar} onChange={e => setPuedeEditar(e.checked)} disabled={loading} />
        <label htmlFor="puedeEditar">Puede Editar</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puedeEliminar" checked={puedeEliminar} onChange={e => setPuedeEliminar(e.checked)} disabled={loading} />
        <label htmlFor="puedeEliminar">Puede Eliminar</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puederAprobarDocs" checked={puederAprobarDocs} onChange={e => setPuederAprobarDocs(e.checked)} disabled={loading} />
        <label htmlFor="puederAprobarDocs">Puede Aprobar Documentos</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puederRechazarDocs" checked={puederRechazarDocs} onChange={e => setPuederRechazarDocs(e.checked)} disabled={loading} />
        <label htmlFor="puederRechazarDocs">Puede Rechazar Documentos</label>
      </div>
      <div className="p-field-checkbox">
        <Checkbox id="puedeReactivarDocs" checked={puedeReactivarDocs} onChange={e => setPuedeReactivarDocs(e.checked)} disabled={loading} />
        <label htmlFor="puedeReactivarDocs">Puede Reactivar Documentos</label>
      </div>
      <div className="p-field">
        <label htmlFor="fechaOtorgado">Fecha Otorgado*</label>
        <Calendar id="fechaOtorgado" value={fechaOtorgado} onChange={e => setFechaOtorgado(e.value)} showIcon dateFormat="yy-mm-dd" disabled={loading} required />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
