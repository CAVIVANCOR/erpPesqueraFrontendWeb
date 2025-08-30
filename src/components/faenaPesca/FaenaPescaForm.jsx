// src/components/faenaPesca/FaenaPescaForm.jsx
// Formulario profesional para FaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

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

// Componentes de cards
import DatosGeneralesFaenaPesca from "./DatosGeneralesFaenaPesca";
import DetalleAccionesPreviasForm from "./DetalleAccionesPreviasForm";
import InformeFaenaPescaForm from "./InformeFaenaPescaForm";

export default function FaenaPescaForm({
  visible,
  onHide,
  isEdit = false,
  defaultValues = {},
  onSubmit,
  loading = false,
  temporadaData,
  embarcacionesOptions = [],
  bolichesOptions = [],
  bahiasComercialesOptions = [],
  motoristasOptions = [],
  patronesOptions = [],
  puertosOptions = [],
}) {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const toast = React.useRef(null);

  // Estados del formulario
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
  const [fechaDescarga, setFechaDescarga] = React.useState(
    defaultValues.fechaDescarga ? new Date(defaultValues.fechaDescarga) : null
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
          setTemporada(temporadaData);
        } else {
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
    setFechaDescarga(
      defaultValues.fechaDescarga ? new Date(defaultValues.fechaDescarga) : null
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
    onSubmit({
      bahiaId: bahiaId ? Number(bahiaId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      patronId: patronId ? Number(patronId) : null,
      descripcion,
      fechaSalida,
      fechaRetorno,
      fechaDescarga,
      puertoSalidaId: puertoSalidaId ? Number(puertoSalidaId) : null,
      puertoRetornoId: puertoRetornoId ? Number(puertoRetornoId) : null,
      puertoDescargaId: puertoDescargaId ? Number(puertoDescargaId) : null,
      embarcacionId: embarcacionId ? Number(embarcacionId) : null,
      bolicheRedId: bolicheRedId ? Number(bolicheRedId) : null,
      urlInformeFaena,
    });
  };

  /**
   * Función para navegar entre cards
   */
  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    setActiveCard("datos-generales");
    onHide();
  };

  /**
   * Footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 18,
      }}
    >
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleHide}
        className="p-button-text"
        severity="danger"
        raised
        outlined
        size="small"
      />
      <Button
        label={isEdit ? "Actualizar" : "Crear"}
        icon="pi pi-check"
        onClick={handleSubmit}
        className="p-button-success"
        loading={loading}
        severity="success"
        raised
        outlined
        size="small"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      header={isEdit ? "Editar Faena de Pesca" : "Nueva Faena de Pesca"}
      modal
      footer={dialogFooter}
      onHide={handleHide}
    >
      {/* Mostrar descripción de faena con Tag */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={descripcion || "Nueva Faena de Pesca"}
          severity="info"
          style={{
            fontSize: "1.1rem",
            padding: "0.75rem 1.25rem",
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
          }}
        />
      </div>

      {/* Navegación de Cards */}
      <div
        className="mb-4"
        style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}
      >
        <ButtonGroup>
          <Button
            icon="pi pi-info-circle"
            tooltip="Datos Generales"
            tooltipOptions={{ position: "bottom" }}
            className={
              activeCard === "datos-generales"
                ? "p-button-info"
                : "p-button-outlined"
            }
            onClick={() => handleNavigateToCard("datos-generales")}
            type="button"
          />
          <Button
            icon="pi pi-list"
            tooltip="Acciones Previas"
            tooltipOptions={{ position: "bottom" }}
            className={
              activeCard === "acciones-previas"
                ? "p-button-info"
                : "p-button-outlined"
            }
            onClick={() => handleNavigateToCard("acciones-previas")}
            type="button"
          />
          <Button
            icon="pi pi-file"
            tooltip="Informe de Faena"
            tooltipOptions={{ position: "bottom" }}
            className={
              activeCard === "informe" ? "p-button-info" : "p-button-outlined"
            }
            onClick={() => handleNavigateToCard("informe")}
            type="button"
          />
        </ButtonGroup>
      </div>

      {/* Contenido de Cards */}
      <div className="p-fluid">
        {activeCard === "datos-generales" && (
          <DatosGeneralesFaenaPesca
            temporadaData={temporadaData}
            descripcion={descripcion}
            setDescripcion={setDescripcion}
            bahiaId={bahiaId}
            setBahiaId={setBahiaId}
            motoristaId={motoristaId}
            setMotoristaId={setMotoristaId}
            patronId={patronId}
            setPatronId={setPatronId}
            puertoSalidaId={puertoSalidaId}
            setPuertoSalidaId={setPuertoSalidaId}
            fechaSalida={fechaSalida}
            setFechaSalida={setFechaSalida}
            fechaRetorno={fechaRetorno}
            setFechaRetorno={setFechaRetorno}
            fechaDescarga={fechaDescarga}
            setFechaDescarga={setFechaDescarga}
            puertoRetornoId={puertoRetornoId}
            setPuertoRetornoId={setPuertoRetornoId}
            puertoDescargaId={puertoDescargaId}
            setPuertoDescargaId={setPuertoDescargaId}
            embarcacionId={embarcacionId}
            setEmbarcacionId={setEmbarcacionId}
            bolicheRedId={bolicheRedId}
            setBolicheRedId={setBolicheRedId}
            bahias={bahias}
            motoristas={motoristas}
            patrones={patrones}
            puertos={puertos}
            embarcaciones={embarcaciones}
            boliches={boliches}
            faenaPescaId={defaultValues.id}
            loading={loading}
          />
        )}

        {activeCard === "acciones-previas" && (
          <DetalleAccionesPreviasForm temporadaPescaId={temporadaData?.id} />
        )}

        {activeCard === "informe" && (
          <InformeFaenaPescaForm
            urlInformeFaena={urlInformeFaena}
            setUrlInformeFaena={setUrlInformeFaena}
            loading={loading}
          />
        )}
      </div>

      <Toast ref={toast} />
    </Dialog>
  );
}
