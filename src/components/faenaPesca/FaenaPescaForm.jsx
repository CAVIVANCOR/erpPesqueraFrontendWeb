// src/components/faenaPesca/FaenaPescaForm.jsx
// Formulario profesional para FaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";

// APIs
import {
  getBahiasComerciales,
  getMotoristas,
  getPatrones,
} from "../../api/personal";
import { getEmbarcacionesPorTipo } from "../../api/embarcacion";
import { getBolichesPorPescaIndustrial } from "../../api/bolicheRed";
import { getPuertosActivos } from "../../api/puertoPesca";
import { getTemporadaPescaPorId } from "../../api/temporadaPesca";

export default function FaenaPescaForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
  temporadaData,
  embarcacionesOptions = [],
  bolichesOptions = [],
  bahiasComercialesOptions = [],
  motoristasOptions = [],
  patronesOptions = [],
  puertosOptions = [],
}) {
  const [temporadaId, setTemporadaId] = React.useState(
    defaultValues.temporadaId || ""
  );
  const [bahiaId, setBahiaId] = React.useState(defaultValues.bahiaId || "");
  const [motoristaId, setMotoristaId] = React.useState(
    defaultValues.motoristaId || ""
  );
  const [patronId, setPatronId] = React.useState(defaultValues.patronId || "");
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [fechaSalida, setFechaSalida] = React.useState(
    defaultValues.fechaSalida ? new Date(defaultValues.fechaSalida) : null
  );
  const [fechaRetorno, setFechaRetorno] = React.useState(
    defaultValues.fechaRetorno ? new Date(defaultValues.fechaRetorno) : null
  );
  const [puertoSalidaId, setPuertoSalidaId] = React.useState(
    defaultValues.puertoSalidaId || ""
  );
  const [puertoRetornoId, setPuertoRetornoId] = React.useState(
    defaultValues.puertoRetornoId || ""
  );
  const [puertoDescargaId, setPuertoDescargaId] = React.useState(
    defaultValues.puertoDescargaId || ""
  );
  const [embarcacionId, setEmbarcacionId] = React.useState(
    defaultValues.embarcacionId || ""
  );
  const [bolicheRedId, setBolicheRedId] = React.useState(
    defaultValues.bolicheRedId || ""
  );
  const [urlInformeFaena, setUrlInformeFaena] = React.useState(
    defaultValues.urlInformeFaena || ""
  );

  // Estados para dropdowns
  const [temporada, setTemporada] = React.useState(null);
  const [bahias, setBahias] = React.useState(bahiasComercialesOptions);
  const [motoristas, setMotoristas] = React.useState(motoristasOptions);
  const [patrones, setPatrones] = React.useState(patronesOptions);
  const [embarcaciones, setEmbarcaciones] =
    React.useState(embarcacionesOptions);
  const [boliches, setBoliches] = React.useState(bolichesOptions);
  const [puertos, setPuertos] = React.useState(puertosOptions);

  useEffect(() => {
    console.log(
      "FaenaPescaForm - useEffect ejecutándose, temporadaData:",
      temporadaData
    );

    // Actualizar opciones cuando cambien las props
    setBahias(bahiasComercialesOptions);
    setMotoristas(motoristasOptions);
    setPatrones(patronesOptions);
    setEmbarcaciones(embarcacionesOptions);
    setBoliches(bolichesOptions);
    setPuertos(puertosOptions);

    const cargarDatos = async () => {
      try {
        if (temporadaData) {
          console.log("TemporadaData recibida:", temporadaData);
          setTemporada(temporadaData);
        } else {
          console.log("No se recibió temporadaData");
        }
      } catch (error) {
        console.error("Error general cargando datos para dropdowns:", error);
      }
    };

    cargarDatos();
  }, [
    temporadaData,
    bahiasComercialesOptions,
    motoristasOptions,
    patronesOptions,
    embarcacionesOptions,
    bolichesOptions,
    puertosOptions,
  ]);

  React.useEffect(() => {
    setTemporadaId(defaultValues.temporadaId || "");
    setBahiaId(defaultValues.bahiaId || "");
    setMotoristaId(defaultValues.motoristaId || "");
    setPatronId(defaultValues.patronId || "");
    setDescripcion(defaultValues.descripcion || "");
    setFechaSalida(
      defaultValues.fechaSalida ? new Date(defaultValues.fechaSalida) : null
    );
    setFechaRetorno(
      defaultValues.fechaRetorno ? new Date(defaultValues.fechaRetorno) : null
    );
    setPuertoSalidaId(defaultValues.puertoSalidaId || "");
    setPuertoRetornoId(defaultValues.puertoRetornoId || "");
    setPuertoDescargaId(defaultValues.puertoDescargaId || "");
    setEmbarcacionId(defaultValues.embarcacionId || "");
    setBolicheRedId(defaultValues.bolicheRedId || "");
    setUrlInformeFaena(defaultValues.urlInformeFaena || "");
  }, [defaultValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("FaenaPescaForm - handleSubmit ejecutándose");
    console.log("Datos del formulario:", {
      temporadaId,
      bahiaId,
      motoristaId,
      patronId,
      descripcion,
      fechaSalida,
      fechaRetorno,
      puertoSalidaId,
      puertoRetornoId,
      puertoDescargaId,
      embarcacionId,
      bolicheRedId,
      urlInformeFaena,
    });
    
    onSubmit({
      bahiaId: bahiaId ? Number(bahiaId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      patronId: patronId ? Number(patronId) : null,
      descripcion,
      fechaSalida,
      fechaRetorno,
      puertoSalidaId: puertoSalidaId ? Number(puertoSalidaId) : null,
      puertoRetornoId: puertoRetornoId ? Number(puertoRetornoId) : null,
      puertoDescargaId: puertoDescargaId ? Number(puertoDescargaId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      bolicheRedId: bolicheRedId ? Number(bolicheRedId) : null,
      urlInformeFaena,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="temporadaId">Temporada*</label>
          <InputTextarea
            id="temporadaId"
            value={temporadaData?.nombre || "Sin temporada"}
            disabled={true}
            rows={2}
            style={{ fontWeight: "bold" }}
            placeholder="Temporada será cargada automáticamente"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="descripcion">Faena Descripción</label>
          <InputTextarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            disabled={loading}
            style={{ fontWeight: "bold" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="bahiaId">Bahía*</label>
          <Dropdown
            id="bahiaId"
            value={bahiaId}
            options={bahias}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setBahiaId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione bahía comercial"
            required
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="motoristaId">Motorista*</label>
          <Dropdown
            id="motoristaId"
            value={motoristaId}
            options={motoristas}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setMotoristaId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione motorista"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="patronId">Patrón*</label>
          <Dropdown
            id="patronId"
            value={patronId}
            options={patrones}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPatronId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione patrón"
            required
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoSalidaId">Puerto Salida*</label>
          <Dropdown
            id="puertoSalidaId"
            value={puertoSalidaId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoSalidaId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione puerto de salida"
            required
            disabled={loading}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaSalida">Fecha Salida*</label>
          <Calendar
            id="fechaSalida"
            value={fechaSalida}
            onChange={(e) => setFechaSalida(e.value)}
            showIcon
            dateFormat="yy-mm-dd"
            disabled={loading}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaRetorno">Fecha Retorno*</label>
          <Calendar
            id="fechaRetorno"
            value={fechaRetorno}
            onChange={(e) => setFechaRetorno(e.value)}
            showIcon
            dateFormat="yy-mm-dd"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoRetornoId">Puerto Retorno*</label>
          <Dropdown
            id="puertoRetornoId"
            value={puertoRetornoId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoRetornoId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione puerto de retorno"
            required
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoDescargaId">Puerto Descarga*</label>
          <Dropdown
            id="puertoDescargaId"
            value={puertoDescargaId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoDescargaId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione puerto de descarga"
            required
            disabled={loading}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="embarcacionId">Embarcación</label>
          <Dropdown
            id="embarcacionId"
            value={embarcacionId}
            options={embarcaciones}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setEmbarcacionId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione embarcación"
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="bolicheRedId">Boliche Red</label>
          <Dropdown
            id="bolicheRedId"
            value={bolicheRedId}
            options={boliches}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setBolicheRedId(e.value)}
            style={{ fontWeight: "bold" }}
            placeholder="Seleccione boliche red"
            disabled={loading}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="urlInformeFaena">URL Informe Faena</label>
          <InputText
            id="urlInformeFaena"
            value={urlInformeFaena}
            onChange={(e) => setUrlInformeFaena(e.target.value)}
            disabled
            style={{ fontWeight: "bold" }}
            placeholder="URL Informe Faena"
          />
        </div>
      </div>

      {/* Botones de acción */}
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
          className="p-button-text"
          onClick={onCancel}
          disabled={loading}
          severity="danger"
          raised
          outlined
          size="small"
        />
        <Button
          type="submit"
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-save"
          className="p-button-success"
          severity="success"
          raised
          outlined
          size="small"
          loading={loading}
          onClick={(e) => {
            console.log("Botón Actualizar clickeado");
            handleSubmit(e);
          }}
        />
      </div>
    </form>
  );
}
