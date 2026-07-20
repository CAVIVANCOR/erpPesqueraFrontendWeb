// src/components/banco/BancoForm.jsx
// Formulario profesional para Banco. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import BooleanToggleButton from '../common/BooleanToggleButton';
import PlanCuentaContableSelector from '../common/PlanCuentaContableSelector';

export default function BancoForm({ isEdit, defaultValues, onSubmit, onCancel, loading, paises = [], readOnly = false }) {
  const [nombre, setNombre] = React.useState(defaultValues.nombre || '');
  const [codigoSwift, setCodigoSwift] = React.useState(defaultValues.codigoSwift || '');
  const [codigoBcrp, setCodigoBcrp] = React.useState(defaultValues.codigoBcrp || '');
  // Establecer Perú (ID=1) como valor por defecto para nuevos bancos
  const [paisId, setPaisId] = React.useState(() => {
    if (defaultValues.paisId !== undefined) {
      return Number(defaultValues.paisId);
    }
    return 1; // Perú por defecto para nuevos bancos
  });
  const [activo, setActivo] = React.useState(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
  const [cuentaContableId, setCuentaContableId] = React.useState(defaultValues.cuentaContableId ? Number(defaultValues.cuentaContableId) : null);

  React.useEffect(() => {
    setNombre(defaultValues.nombre || '');
    setCodigoSwift(defaultValues.codigoSwift || '');
    setCodigoBcrp(defaultValues.codigoBcrp || '');
    // Solo actualizar paisId si hay un valor específico en defaultValues
    if (defaultValues.paisId !== undefined) {
      setPaisId(Number(defaultValues.paisId));
    } else {
      setPaisId(1); // Perú por defecto
    }
    setActivo(defaultValues.activo !== undefined ? !!defaultValues.activo : true);
    setCuentaContableId(defaultValues.cuentaContableId ? Number(defaultValues.cuentaContableId) : null);

  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      codigoSwift,
      codigoBcrp,
      paisId: paisId ? Number(paisId) : null,
      activo,
      cuentaContableId: cuentaContableId ? Number(cuentaContableId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="p-field">
        <label htmlFor="nombre">Nombre*</label>
        <InputText id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading || readOnly} maxLength={100} />
      </div>
      <div className="p-field">
        <label htmlFor="codigoSwift">Código SWIFT</label>
        <InputText id="codigoSwift" value={codigoSwift} onChange={e => setCodigoSwift(e.target.value)} disabled={loading || readOnly} maxLength={20} />
      </div>
      <div className="p-field">
        <label htmlFor="codigoBcrp">Código BCRP</label>
        <InputText id="codigoBcrp" value={codigoBcrp} onChange={e => setCodigoBcrp(e.target.value)} disabled={loading || readOnly} maxLength={20} />
      </div>
      <div className="p-field">
        <label htmlFor="paisId">País</label>
        <Dropdown
          id="paisId"
          value={paisId}
          options={paises.map((pais) => ({
            label: pais.nombre,
            value: Number(pais.id), // Asegurar que sea número
          }))}
          onChange={(e) => setPaisId(e.value)}
          placeholder="Seleccione país"
          disabled={loading || readOnly}
          filter
          showClear
          style={{ fontWeight: "bold" }}
        />
      </div>
      <div className="p-field">
        <PlanCuentaContableSelector
          value={cuentaContableId}
          onChange={setCuentaContableId}
          label="Cuenta Contable"
          disabled={loading || readOnly}
          required={false}
          showClearButton={true}
          placeholder="Seleccionar cuenta contable del banco"
        />
      </div>
      <div className="p-field">
        <label htmlFor="activo">Activo</label>
        <BooleanToggleButton
          labelTrue="Activo"
          labelFalse="Inactivo"
          value={activo}
          onChange={setActivo}
          disabled={loading || readOnly}
        />
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8 }}>
        <Button type="button" label="Cancelar" className="p-button-text" onClick={onCancel} disabled={loading} />
        <Button type="submit" label={isEdit ? "Actualizar" : "Crear"} icon="pi pi-save" loading={loading} disabled={readOnly} />
      </div>
    </form>
  );
}
