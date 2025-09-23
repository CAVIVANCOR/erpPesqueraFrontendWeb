// src/components/cuentaCorriente/CuentaCorrienteForm.jsx
// Formulario profesional para CuentaCorriente. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

export default function CuentaCorrienteForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  bancos = [],
  monedas = [],
  empresas = [],
  tiposCuentaCorriente = [],
}) {
  const [bancoId, setBancoId] = React.useState(defaultValues.bancoId || "");
  const [numeroCuenta, setNumeroCuenta] = React.useState(
    defaultValues.numeroCuenta || ""
  );
  const [monedaId, setMonedaId] = React.useState(defaultValues.monedaId || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [activa, setActiva] = React.useState(
    defaultValues.activa !== undefined ? !!defaultValues.activa : true
  );
  const [empresaId, setEmpresaId] = React.useState(
    defaultValues.empresaId || ""
  );
  const [tipoCuentaCorrienteId, setTipoCuentaCorrienteId] = React.useState(
    defaultValues.tipoCuentaCorrienteId || ""
  );
  const [codigoSwift, setCodigoSwift] = React.useState(
    defaultValues.codigoSwift || ""
  );
  const [numeroCuentaCCI, setNumeroCuentaCCI] = React.useState(
    defaultValues.numeroCuentaCCI || ""
  );

  React.useEffect(() => {
    setBancoId(defaultValues.bancoId || "");
    setNumeroCuenta(defaultValues.numeroCuenta || "");
    setMonedaId(defaultValues.monedaId || "");
    setDescripcion(defaultValues.descripcion || "");
    setActiva(
      defaultValues.activa !== undefined ? !!defaultValues.activa : true
    );
    setEmpresaId(defaultValues.empresaId || "");
    setTipoCuentaCorrienteId(defaultValues.tipoCuentaCorrienteId || "");
    setCodigoSwift(defaultValues.codigoSwift || "");
    setNumeroCuentaCCI(defaultValues.numeroCuentaCCI || "");
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaId ? Number(empresaId) : null,
      bancoId: bancoId ? Number(bancoId) : null,
      numeroCuenta,
      tipoCuentaCorrienteId: tipoCuentaCorrienteId
        ? Number(tipoCuentaCorrienteId)
        : null,
      monedaId: monedaId ? Number(monedaId) : null,
      descripcion,
      activa,
      codigoSwift,
      numeroCuentaCCI,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa*</label>
          <Dropdown
            id="empresaId"
            value={empresaId}
            options={empresas.map((empresa) => ({
              label: empresa.razonSocial,
              value: empresa.id,
            }))}
            onChange={(e) => setEmpresaId(e.value)}
            placeholder="Seleccione empresa"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="bancoId">Banco*</label>
          <Dropdown
            id="bancoId"
            value={bancoId}
            options={bancos.map((banco) => ({
              label: banco.nombre,
              value: banco.id,
            }))}
            onChange={(e) => setBancoId(e.value)}
            placeholder="Seleccione banco"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="monedaId">Moneda*</label>
          <Dropdown
            id="monedaId"
            value={monedaId}
            options={monedas.map((moneda) => ({
              label: moneda.simbolo,
              value: moneda.id,
            }))}
            onChange={(e) => setMonedaId(e.value)}
            placeholder="Seleccione moneda"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      ></div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuenta">Número de Cuenta*</label>
          <InputText
            id="numeroCuenta"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value.toUpperCase())}
            required
            disabled={loading}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="numeroCuentaCCI">Número CCI</label>
          <InputText
            id="numeroCuentaCCI"
            value={numeroCuentaCCI}
            onChange={(e) => setNumeroCuentaCCI(e.target.value.toUpperCase())}
            disabled={loading}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="codigoSwift">Código Swift</label>
          <InputText
            id="codigoSwift"
            value={codigoSwift}
            onChange={(e) => setCodigoSwift(e.target.value.toUpperCase())}
            disabled={loading}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
      </div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcion">Descripción</label>
          <InputText
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
            disabled={loading}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="tipoCuentaCorrienteId">
            Tipo de Cuenta Corriente*
          </label>
          <Dropdown
            id="tipoCuentaCorrienteId"
            value={tipoCuentaCorrienteId}
            options={tiposCuentaCorriente.map((tipo) => ({
              label: tipo.nombre,
              value: tipo.id,
            }))}
            onChange={(e) => setTipoCuentaCorrienteId(e.value)}
            placeholder="Seleccione tipo de cuenta corriente"
            required
            disabled={loading}
            filter
            showClear
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label={activa ? "ACTIVO" : "CESADO"}
            icon={activa ? "pi pi-check-circle" : "pi pi-times-circle"}
            className={activa ? "p-button-primary" : "p-button-danger"}
            severity={activa ? "primary" : "danger"}
            onClick={() => setActiva(!activa)}
            size="small"
            style={{ width: "200px", fontWeight: "bold" }}
            disabled={loading}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
