// src/components/banco/BancoForm.jsx
// Formulario profesional para Banco. Cumple la regla transversal ERP Megui.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import BooleanToggleButton from '../common/BooleanToggleButton';
import PlanCuentaContableSelector from '../common/PlanCuentaContableSelector';
import EntidadComercialSelector from '../common/EntidadComercialSelector';

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
  // IMPORTANTE: Permitir valor 0 para cuentas contables (usado al limpiar)
  const [cuentaContableId, setCuentaContableId] = React.useState(
    (defaultValues.cuentaContableId !== null && defaultValues.cuentaContableId !== undefined)
      ? Number(defaultValues.cuentaContableId)
      : null
  );
  // Entidad comercial que representa al banco (acreedor/tercero en movimientos y asientos)
  const [enlaceEntidadComercialId, setEnlaceEntidadComercialId] = React.useState(
    (defaultValues.enlaceEntidadComercialId !== null && defaultValues.enlaceEntidadComercialId !== undefined)
      ? Number(defaultValues.enlaceEntidadComercialId)
      : null
  );

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
    // IMPORTANTE: Permitir valor 0 para cuentas contables (usado al limpiar)
    setCuentaContableId(
      (defaultValues.cuentaContableId !== null && defaultValues.cuentaContableId !== undefined)
        ? Number(defaultValues.cuentaContableId)
        : null
    );
    setEnlaceEntidadComercialId(
      (defaultValues.enlaceEntidadComercialId !== null && defaultValues.enlaceEntidadComercialId !== undefined)
        ? Number(defaultValues.enlaceEntidadComercialId)
        : null
    );

  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre,
      codigoSwift,
      codigoBcrp,
      paisId: paisId ? Number(paisId) : null,
      activo,
      // IMPORTANTE: Permitir valor 0 para limpiar cuenta contable
      // El componente PlanCuentaContableSelector envía 0 cuando se limpia
      cuentaContableId: (cuentaContableId !== null && cuentaContableId !== undefined)
        ? Number(cuentaContableId)
        : null,
      // null = sin enlace (el backend limpia el campo)
      enlaceEntidadComercialId: enlaceEntidadComercialId ? Number(enlaceEntidadComercialId) : null,
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
        <EntidadComercialSelector
          value={enlaceEntidadComercialId}
          onChange={setEnlaceEntidadComercialId}
          label="Entidad Comercial del Banco"
          placeholder="Enlazar con la entidad comercial del banco (opcional)"
          disabled={loading || readOnly}
        />
        <small style={{ color: "#6c757d", display: "block" }}>
          Se usa como tercero (acreedor) en los movimientos de caja y asientos de préstamos.
          Déjelo vacío para registros como "S/B" o billeteras digitales sin entidad.
        </small>
        {enlaceEntidadComercialId && !readOnly && (
          <Button
            type="button"
            label="Quitar enlace"
            icon="pi pi-times"
            className="p-button-text p-button-danger p-button-sm"
            onClick={() => setEnlaceEntidadComercialId(null)}
            disabled={loading}
            style={{ width: "auto", marginTop: 4 }}
          />
        )}
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
