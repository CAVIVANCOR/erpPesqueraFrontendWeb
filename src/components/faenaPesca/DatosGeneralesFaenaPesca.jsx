/**
 * DatosGeneralesFaenaPesca.jsx
 *
 * Componente para mostrar y editar los datos generales de una faena de pesca.
 * Extraído de FaenaPescaForm.jsx para seguir el patrón de cards.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import DetalleCalasForm from "./DetalleCalasForm";

const DatosGeneralesFaenaPesca = ({
  temporadaData,
  descripcion,
  setDescripcion,
  bahiaId,
  setBahiaId,
  motoristaId,
  setMotoristaId,
  patronId,
  setPatronId,
  puertoSalidaId,
  setPuertoSalidaId,
  fechaSalida,
  setFechaSalida,
  fechaRetorno,
  setFechaRetorno,
  fechaDescarga,
  setFechaDescarga,
  puertoRetornoId,
  setPuertoRetornoId,
  puertoDescargaId,
  setPuertoDescargaId,
  embarcacionId,
  setEmbarcacionId,
  bolicheRedId,
  setBolicheRedId,
  bahias,
  motoristas,
  patrones,
  puertos,
  embarcaciones,
  boliches,
  faenaPescaId,
  loading = false,
}) => {
  return (
    <div className="card">
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
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaSalida" style={{ color: "#2c32d3" }}>
            Fecha Zarpe*
          </label>
          <Calendar
            id="fechaSalida"
            value={fechaSalida}
            onChange={(e) => setFechaSalida(e.value)}
            showIcon
            dateFormat="dd/mm/yy"
            inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
            disabled={loading}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoSalidaId" style={{ color: "#2c32d3" }}>
            Puerto Zarpe*
          </label>
          <Dropdown
            id="puertoSalidaId"
            value={puertoSalidaId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoSalidaId(e.value)}
            pt={{
              input: { style: { color: "#2c32d3", fontWeight: "bold" } },
            }}
            placeholder="Puerto de salida"
            required
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDescarga" style={{ color: "#21962e" }}>
            Fecha Descarga
          </label>
          <Calendar
            id="fechaDescarga"
            value={fechaDescarga}
            onChange={(e) => setFechaDescarga(e.value)}
            showIcon
            dateFormat="dd/mm/yy"
            inputStyle={{ fontWeight: "bold", color: "#21962e" }}
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoDescargaId" style={{ color: "#21962e" }}>
            Puerto Descarga*
          </label>
          <Dropdown
            id="puertoDescargaId"
            value={puertoDescargaId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoDescargaId(e.value)}
            pt={{
              input: { style: { color: "#21962e", fontWeight: "bold" } },
            }}
            placeholder="Puerto de descarga"
            required
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaRetorno" style={{ color: "#c61515" }}>Fecha Retorno*</label>
          <Calendar
            id="fechaRetorno"
            value={fechaRetorno}
            onChange={(e) => setFechaRetorno(e.value)}
            showIcon
            dateFormat="dd/mm/yy"
            inputStyle={{ fontWeight: "bold", color: "#c61515" }}
            disabled={loading}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoRetornoId" style={{ color: "#c61515" }}>Puerto Retorno*</label>
          <Dropdown
            id="puertoRetornoId"
            value={puertoRetornoId}
            options={puertos}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => setPuertoRetornoId(e.value)}
            pt={{
              input: { style: { color: "#c61515", fontWeight: "bold" } },
            }}
            placeholder="Puerto de retorno"
            required
            disabled={loading}
          />
        </div>
      </div>
      <DetalleCalasForm 
        faenaPescaId={faenaPescaId}
        temporadaData={temporadaData}
        faenaData={{ descripcion, bahiaId, motoristaId, patronId, embarcacionId }}
        bahias={bahias}
        motoristas={motoristas}
        patrones={patrones}
        puertos={puertos}
        embarcaciones={embarcaciones}
        loading={loading}
      />
    </div>
  );
};

export default DatosGeneralesFaenaPesca;
