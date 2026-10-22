// src/components/tesoreria/PartesPrestamoEntidad.jsx
// Las dos partes de un préstamo con accionistas y terceros, separadas y tituladas.
// Solo existen dos términos: PRESTAMISTA (quien presta el dinero) y DEUDOR (quien recibe el préstamo y debe devolverlo).
// La empresa es una de las dos partes; la otra es el accionista o tercero.
//
// Modo edición: el usuario indica si la empresa es el Prestamista o el Deudor y elige la otra parte.
// Modo lectura (prop `nombres`): solo muestra quién es el Prestamista y quién el Deudor de un préstamo existente.
import React from "react";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import EmpresaSelector from "../common/EmpresaSelector";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import BooleanToggleButton from "../common/BooleanToggleButton";

const etiqueta = { fontWeight: "bold", display: "block", marginBottom: 5 };

const TITULO_PRESTAMISTA = (
  <span>
    PRESTAMISTA <small style={{ fontWeight: "normal" }}>(quien presta el dinero)</small>
  </span>
);
const TITULO_DEUDOR = (
  <span>
    DEUDOR <small style={{ fontWeight: "normal" }}>(quien recibe el préstamo y debe devolverlo)</small>
  </span>
);

export default function PartesPrestamoEntidad({
  esPrestamista = false, // la empresa es el Prestamista (true) o el Deudor (false)
  onRolChange,
  empresaId,
  onEmpresaChange,
  esAccionista = true,
  onTipoChange,
  entidadId,
  onEntidadChange,
  disabled = false,
  rolBloqueado = false, // el rol de la empresa no se puede cambiar (operaciones sobre un préstamo existente)
  nombres = null, // { prestamista, deudor, tipoOtraParte, esPrestamistaLaEmpresa }: modo lectura
}) {
  const direccion = window.innerWidth < 768 ? "column" : "row";

  if (nombres) {
    const lectura = (nombre, tipo) => (
      <div>
        <div style={{ fontWeight: "bold", fontSize: "1.05rem" }}>{nombre || "-"}</div>
        {tipo && <Tag value={tipo} severity={tipo === "ACCIONISTA" ? "success" : "info"} style={{ marginTop: 6 }} />}
      </div>
    );
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: direccion }}>
        <Panel header={TITULO_PRESTAMISTA} style={{ flex: 1 }}>
          {lectura(nombres.prestamista, nombres.esPrestamistaLaEmpresa ? "EMPRESA" : nombres.tipoOtraParte)}
        </Panel>
        <Panel header={TITULO_DEUDOR} style={{ flex: 1 }}>
          {lectura(nombres.deudor, nombres.esPrestamistaLaEmpresa ? nombres.tipoOtraParte : "EMPRESA")}
        </Panel>
      </div>
    );
  }

  const bloqueEmpresa = (
    <div>
      <label style={etiqueta}>Empresa *</label>
      <EmpresaSelector empresaId={empresaId} onEmpresaChange={onEmpresaChange} disabled={disabled} />
    </div>
  );

  const bloqueOtraParte = (
    <div>
      <label style={etiqueta}>Tipo *</label>
      <BooleanToggleButton
        labelTrue="ACCIONISTA"
        labelFalse="TERCERO"
        severityTrue="success"
        severityFalse="info"
        icon={esAccionista ? "pi-briefcase" : "pi-user"}
        value={esAccionista}
        onChange={onTipoChange}
        disabled={disabled}
      />
      <div style={{ marginTop: 10 }}>
        <EntidadComercialSelector
          value={entidadId}
          onChange={onEntidadChange}
          label={`${esAccionista ? "Accionista" : "Tercero"} *`}
          placeholder="Seleccione la persona o empresa"
          disabled={disabled}
        />
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <label style={{ fontWeight: "bold" }}>La empresa es el *</label>
        <div style={{ width: 220 }}>
          <BooleanToggleButton
            labelTrue="PRESTAMISTA"
            labelFalse="DEUDOR"
            severityTrue="success"
            severityFalse="warning"
            icon={esPrestamista ? "pi-arrow-up-right" : "pi-arrow-down-left"}
            value={esPrestamista}
            onChange={onRolChange}
            disabled={disabled || rolBloqueado}
          />
        </div>
        <small style={{ color: "#6c757d" }}>
          {esPrestamista
            ? "La empresa presta el dinero: el accionista o tercero es el Deudor."
            : "La empresa recibe el préstamo y debe devolverlo: el accionista o tercero es el Prestamista."}
        </small>
      </div>
      <div style={{ display: "flex", gap: 10, flexDirection: direccion }}>
        <Panel header={TITULO_PRESTAMISTA} style={{ flex: 1 }}>
          {esPrestamista ? bloqueEmpresa : bloqueOtraParte}
        </Panel>
        <Panel header={TITULO_DEUDOR} style={{ flex: 1 }}>
          {esPrestamista ? bloqueOtraParte : bloqueEmpresa}
        </Panel>
      </div>
    </div>
  );
}
