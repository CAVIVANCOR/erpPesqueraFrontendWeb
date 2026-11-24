// src/components/serieDoc/SerieDocForm.jsx
// Formulario profesional para SerieDoc. Cumple la regla transversal ERP Megui.
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";

export default function SerieDocForm({
  isEdit,
  defaultValues,
  empresas = [],
  empresaId,
  tiposDocumento = [],
  tiposAlmacen = [],
  onSubmit,
  onCancel,
  loading,
}) {
  const [empresaIdState, setEmpresaIdState] = React.useState(
    defaultValues.empresaId || empresaId || null
  );
  const [tipoDocumentoId, setTipoDocumentoId] = React.useState(
    defaultValues.tipoDocumentoId || null
  );
  const [tipoAlmacenId, setTipoAlmacenId] = React.useState(
    defaultValues.tipoAlmacenId || null
  );
  const [serie, setSerie] = React.useState(defaultValues.serie || "");
  const [correlativo, setCorrelativo] = React.useState(
    defaultValues.correlativo !== undefined ? defaultValues.correlativo : 0
  );
  const [numCerosIzqCorre, setNumCerosIzqCorre] = React.useState(
    defaultValues.numCerosIzqCorre || 0
  );
  const [numCerosIzqSerie, setNumCerosIzqSerie] = React.useState(
    defaultValues.numCerosIzqSerie || 0
  );
  const [activo, setActivo] = React.useState(
    defaultValues.activo !== undefined ? defaultValues.activo : true
  );
  // Serie SUNAT para comprobantes electrónicos (F001, B001, FC01...): el servidor valida su formato
  const [esElectronica, setEsElectronica] = React.useState(
    defaultValues.esElectronica === true
  );

  React.useEffect(() => {
    setEmpresaIdState(defaultValues.empresaId || empresaId || null);
    setTipoDocumentoId(defaultValues.tipoDocumentoId || null);
    setTipoAlmacenId(defaultValues.tipoAlmacenId || null);
    setSerie(defaultValues.serie || "");
    setCorrelativo(
      defaultValues.correlativo !== undefined ? defaultValues.correlativo : 0
    );
    setNumCerosIzqCorre(defaultValues.numCerosIzqCorre || 0);
    setNumCerosIzqSerie(defaultValues.numCerosIzqSerie || 0);
    setActivo(defaultValues.activo !== undefined ? defaultValues.activo : true);
    setEsElectronica(defaultValues.esElectronica === true);
  }, [defaultValues, empresaId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      empresaId: empresaIdState ? Number(empresaIdState) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      tipoAlmacenId: tipoAlmacenId ? Number(tipoAlmacenId) : null,
      serie,
      correlativo,
      numCerosIzqCorre,
      numCerosIzqSerie,
      activo,
      esElectronica,
    });
  };

  const empresasOptions = empresas.map((e) => ({
    ...e,
    id: Number(e.id),
  }));
  const tiposDocumentoOptions = tiposDocumento.map((t) => ({
    ...t,
    id: Number(t.id),
  }));
  const tiposAlmacenOptions = tiposAlmacen.map((t) => ({
    ...t,
    id: Number(t.id),
  }));

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="empresaId">Empresa*</label>
          <Dropdown
            id="empresaId"
            value={empresaIdState ? Number(empresaIdState) : null}
            options={empresasOptions}
            optionLabel="razonSocial"
            optionValue="id"
            onChange={(e) => setEmpresaIdState(e.value)}
            placeholder="Seleccione empresa"
            disabled={loading || isEdit}
            style={{ fontWeight: "bold" }}
            required
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="tipoDocumentoId">Tipo de Documento*</label>
          <Dropdown
            id="tipoDocumentoId"
            value={tipoDocumentoId ? Number(tipoDocumentoId) : null}
            options={tiposDocumentoOptions}
            optionLabel="descripcion"
            optionValue="id"
            onChange={(e) => setTipoDocumentoId(e.value)}
            placeholder="Seleccione tipo de documento"
            disabled={loading}
            style={{ fontWeight: "bold" }}
            required
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="p-field">
            <label htmlFor="tipoAlmacenId">Tipo de Almacén</label>
            <Dropdown
              id="tipoAlmacenId"
              value={tipoAlmacenId ? Number(tipoAlmacenId) : null}
              options={tiposAlmacenOptions}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setTipoAlmacenId(e.value)}
              placeholder="Seleccione tipo de almacén"
              disabled={loading}
              style={{ fontWeight: "bold" }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="serie">Serie*</label>
          <InputText
            id="serie"
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            required
            disabled={loading}
            maxLength={10}
            style={{ fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="correlativo">Correlativo*</label>
          <InputNumber
            id="correlativo"
            value={correlativo}
            onValueChange={(e) => setCorrelativo(e.value)}
            disabled={loading}
            min={0}
            useGrouping={false}
            inputStyle={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
                      <label htmlFor="numCerosIzqSerie">Ceros Izquierda Serie</label>
            <InputNumber
              id="numCerosIzqSerie"
              value={numCerosIzqSerie}
              onValueChange={(e) => setNumCerosIzqSerie(e.value)}
              disabled={loading}
              min={0}
              max={10}
              useGrouping={false}
              inputStyle={{ fontWeight: "bold" }}
            />
        </div>
        <div style={{ flex: 1 }}>
                      <label htmlFor="numCerosIzqCorre">
              Ceros Izquierda Correlativo
            </label>
            <InputNumber
              id="numCerosIzqCorre"
              value={numCerosIzqCorre}
              onValueChange={(e) => setNumCerosIzqCorre(e.value)}
              disabled={loading}
              min={0}
              max={10}
              useGrouping={false}
              inputStyle={{ fontWeight: "bold" }}
            />
        </div>
      </div>

      <div className="p-grid">
        <div className="p-col-12">
          <div className="p-field-checkbox">
            <Checkbox
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.checked)}
              disabled={loading}
              style={{ fontWeight: "bold" }}
            />
            <label htmlFor="activo">Activo</label>
          </div>
          {/* Serie SUNAT: 4 caracteres (F001, B001, FC01...), 8 ceros de correlativo; el correlativo nunca retrocede */}
          <div className="p-field-checkbox" style={{ marginTop: 8 }}>
            <Checkbox
              id="esElectronica"
              checked={esElectronica}
              onChange={(e) => setEsElectronica(e.checked)}
              disabled={loading}
              style={{ fontWeight: "bold" }}
            />
            <label htmlFor="esElectronica">Serie electrónica SUNAT (facturación electrónica)</label>
          </div>
          {esElectronica && (
            <small style={{ display: "block", color: "#666", marginTop: 4 }}>
              Formato: 4 caracteres que empiezan con F (factura), B (boleta) o F/B (notas), por ejemplo F001. Use 8 ceros
              a la izquierda en el correlativo. El correlativo no puede retroceder ni la serie reutilizarse.
            </small>
          )}
        </div>
      </div>
      <div className="p-d-flex p-jc-end" style={{ gap: 8, marginTop: 16 }}>
        <Button
          type="button"
          label="Cancelar"
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          loading={loading}
        />
      </div>
    </form>
  );
}
