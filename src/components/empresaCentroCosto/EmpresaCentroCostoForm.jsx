// src/components/empresaCentroCosto/EmpresaCentroCostoForm.jsx
// Formulario profesional para EmpresaCentroCosto. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

export default function EmpresaCentroCostoForm({ isEdit, defaultValues, empresas, centrosCosto, onSubmit, onCancel, loading }) {
  const [empresaID, setEmpresaID] = React.useState(defaultValues.EmpresaID || null);
  const [centroCostoID, setCentroCostoID] = React.useState(defaultValues.CentroCostoID || null);
  const [responsableID, setResponsableID] = React.useState(defaultValues.ResponsableID || '');
  const [proveedorExternoID, setProveedorExternoID] = React.useState(defaultValues.ProveedorExternoID || '');
  const [activo, setActivo] = React.useState(defaultValues.Activo !== undefined ? !!defaultValues.Activo : true);

  React.useEffect(() => {
    setEmpresaID(defaultValues.EmpresaID ? Number(defaultValues.EmpresaID) : null);
    setCentroCostoID(defaultValues.CentroCostoID ? Number(defaultValues.CentroCostoID) : null);
    setResponsableID(defaultValues.ResponsableID || '');
    setProveedorExternoID(defaultValues.ProveedorExternoID || '');
    setActivo(defaultValues.Activo !== undefined ? !!defaultValues.Activo : true);
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      EmpresaID: empresaID ? Number(empresaID) : null,
      CentroCostoID: centroCostoID ? Number(centroCostoID) : null,
      ResponsableID: responsableID ? Number(responsableID) : null,
      ProveedorExternoID: proveedorExternoID ? Number(proveedorExternoID) : null,
      Activo: activo
    });
  };

  // Normalizar opciones para los dropdowns
  const empresasOptions = empresas.map(e => ({ 
    ...e, 
    id: Number(e.id),
    label: e.nombre,
    value: Number(e.id)
  }));

  const centrosCostoOptions = centrosCosto.map(c => ({ 
    ...c, 
    id: Number(c.id),
    label: c.Nombre,
    value: Number(c.id)
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="empresaID">Empresa*</label>
        <Dropdown
          id="empresaID"
          value={empresaID ? Number(empresaID) : null}
          options={empresasOptions}
          onChange={e => setEmpresaID(e.value)}
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccionar empresa"
          disabled={loading}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="centroCostoID">Centro de Costo*</label>
        <Dropdown
          id="centroCostoID"
          value={centroCostoID ? Number(centroCostoID) : null}
          options={centrosCostoOptions}
          onChange={e => setCentroCostoID(e.value)}
          optionLabel="Nombre"
          optionValue="id"
          placeholder="Seleccionar centro de costo"
          disabled={loading}
          required
        />
      </div>
      <div className="p-field">
        <label htmlFor="responsableID">Responsable ID*</label>
        <InputText 
          id="responsableID" 
          value={responsableID} 
          onChange={e => setResponsableID(e.target.value)} 
          required 
          disabled={loading}
        />
      </div>
      <div className="p-field">
        <label htmlFor="proveedorExternoID">Proveedor Externo ID</label>
        <InputText 
          id="proveedorExternoID" 
          value={proveedorExternoID} 
          onChange={e => setProveedorExternoID(e.target.value)} 
          disabled={loading}
        />
      </div>
      <div className="p-field-checkbox">
        <Checkbox 
          id="activo" 
          checked={activo} 
          onChange={e => setActivo(e.checked)} 
          disabled={loading} 
        />
        <label htmlFor="activo">Activo</label>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} />
      </div>
    </form>
  );
}
