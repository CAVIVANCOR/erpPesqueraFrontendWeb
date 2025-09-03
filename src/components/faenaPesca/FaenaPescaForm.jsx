// src/components/faenaPesca/FaenaPescaForm.jsx
// Formulario profesional para FaenaPesca. Cumple la regla transversal ERP Megui.
import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

// Componentes de cards
import DatosGeneralesFaenaPesca from "./DatosGeneralesFaenaPesca";
import DetalleAccionesPreviasForm from "./DetalleAccionesPreviasForm";
import InformeFaenaPescaForm from "./InformeFaenaPescaForm";

// API imports
import { listarEstadosMultiFuncionFaenaPesca } from "../../api/estadoMultiFuncion";
import { getPersonal } from "../../api/personal";

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
  onDataChange, // Callback para notificar cambios en los datos
  onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
  onFaenasChange, // Callback para notificar cambios en faenas
}) {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const toast = useRef(null);

  // Estados para datos del backend
  const [estadosFaena, setEstadosFaena] = useState([]);
  const [personal, setPersonal] = useState([]);

  // Estados para dropdowns
  const [temporada, setTemporada] = useState(null);
  const [bahias, setBahias] = useState(bahiasComercialesOptions);
  const [motoristas, setMotoristas] = useState(motoristasOptions);
  const [patrones, setPatrones] = useState(patronesOptions);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesOptions);
  const [boliches, setBoliches] = useState(bolichesOptions);
  const [puertos, setPuertos] = useState(puertosOptions);

  // Configuración del formulario con React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: null,
      temporadaId: null,
      bahiaId: null,
      motoristaId: null,
      patronId: null,
      descripcion: "",
      fechaSalida: null,
      fechaRetorno: null,
      fechaDescarga: null,
      puertoSalidaId: null,
      puertoRetornoId: null,
      puertoDescargaId: null,
      embarcacionId: null,
      bolicheRedId: null,
      urlInformeFaena: "",
      urlReporteFaenaCalas: "",
      urlDeclaracionDesembarqueArmador: "",
      estadoFaenaId: null,
      toneladasCapturadasFaena: 0,
    },
  });

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
        // Cargar estados de faena
        const estadosData = await listarEstadosMultiFuncionFaenaPesca();
        // Normalizar IDs a números
        const estadosNormalizados = estadosData.map((estado) => ({
          ...estado,
          id: Number(estado.id),
        }));

        setEstadosFaena(estadosNormalizados);

        if (temporadaData) {
          setTemporada(temporadaData);
        }

        // Cargar personal
        const personalData = await getPersonal();
        setPersonal(personalData);
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
    reset({
      ...defaultValues,
      fechaSalida: defaultValues.fechaSalida
        ? new Date(defaultValues.fechaSalida)
        : null,
      fechaRetorno: defaultValues.fechaRetorno
        ? new Date(defaultValues.fechaRetorno)
        : null,
      fechaDescarga: defaultValues.fechaDescarga
        ? new Date(defaultValues.fechaDescarga)
        : null,
    });
  }, [defaultValues, reset]);

  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  const handleHide = () => {
    setActiveCard("datos-generales");
    onHide();
  };

  const dialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        marginTop: 2,
      }}
    >
      {/* Botones de navegación de Cards - lado izquierdo */}
      <div className="flex gap-1">
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
          size="small"
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
          size="small"
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
          size="small"
        />
      </div>
      <div className="flex gap-2">
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
          onClick={handleSubmit((data) => {
            onSubmit(data);
          })}
          className="p-button-success"
          loading={loading}
          severity="success"
          raised
          outlined
          size="small"
        />
      </div>
    </div>
  );

  const handleFormSubmit = async (data) => {
    try {
      // Llamar onSubmit original
      await onSubmit(data);
    } catch (error) {
      console.error("Error en handleFormSubmit:", error);
    }
  };

  const handleFinalizarFaena = () => {
    // Cambiar estado a FINALIZADA (19)
    setValue("estadoFaenaId", 19);
    // Forzar actualización inmediata
    handleSubmit(handleFormSubmit)();
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      headerStyle={{ display: "none" }}
      modal
      footer={dialogFooter}
      onHide={handleHide}
    >
      <Toast ref={toast} />
      {/* Mostrar descripción de faena con Tag */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={watch("descripcion") || defaultValues.descripcion || "Nueva Faena de Pesca"}
          severity="info"
          style={{
            fontSize: "1.1rem",
            padding: "0.75rem 1.25rem",
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            marginTop: "0.5rem",
          }}
        />
      </div>
      {/* Contenido de Cards */}
      <div className="p-fluid">
        {activeCard === "datos-generales" && (
          <DatosGeneralesFaenaPesca
            temporadaData={temporadaData}
            control={control}
            watch={watch}
            errors={errors}
            setValue={setValue}
            bahias={bahias}
            motoristas={motoristas}
            patrones={patrones}
            puertos={puertos}
            embarcaciones={embarcaciones}
            boliches={boliches}
            estadosFaena={estadosFaena}
            faenaPescaId={defaultValues.id}
            loading={loading}
            handleFinalizarFaena={handleFinalizarFaena}
            onDataChange={onDataChange} // Callback para notificar cambios en los datos
            onTemporadaDataChange={onTemporadaDataChange} // Callback para notificar cambios en datos de temporada
            onFaenasChange={onFaenasChange} // Callback para notificar cambios en faenas
          />
        )}

        {activeCard === "acciones-previas" && (
          <DetalleAccionesPreviasForm 
          temporadaPescaId={temporadaData?.id} 
          faenaPescaId={defaultValues.id}
          personal={personal}
          />
        )}

        {activeCard === "informe" && (
          <InformeFaenaPescaForm
            control={control}
            watch={watch}
            errors={errors}
            loading={loading}
          />
        )}
      </div>
    </Dialog>
  );
}
