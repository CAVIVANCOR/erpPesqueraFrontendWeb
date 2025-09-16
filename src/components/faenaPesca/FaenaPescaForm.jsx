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
import DetalleDocTripulantesCard from "./DetalleDocTripulantesCard";
import DetalleDocEmbarcacionCard from "./DetalleDocEmbarcacionCard";
import DescargaFaenaPescaCard from "./DescargaFaenaPescaCard";
import LiquidacionFaenaPescaCard from "./LiquidacionFaenaPescaCard";

// API imports
import { listarEstadosMultiFuncionFaenaPesca } from "../../api/estadoMultiFuncion";
import { getPersonal } from "../../api/personal";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getDocumentacionesEmbarcacion } from "../../api/documentacionEmbarcacion";
import { getClientesPorEmpresa } from "../../api/entidadComercial"; 
import { getEspeciesParaDropdown } from "../../api/especie";
import { getPuertosActivos } from "../../api/puertoPesca";
import logoEscudoPeru from "../../assets/logoEscudoPeru.png";

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
  faenaCreatedSuccessfully = false, // Nueva prop para saber si la faena fue creada
  setFaenaCreatedSuccessfully, // Función para actualizar el estado del padre
}) {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [currentFaenaData, setCurrentFaenaData] = useState(defaultValues);
  const [isEditMode, setIsEditMode] = useState(isEdit || !!defaultValues.id); // Estado interno para controlar modo edición
  const [forceUpdate, setForceUpdate] = useState(0); // Estado para forzar re-render
  const toast = useRef(null);

  // Estados para datos del backend
  const [estadosFaena, setEstadosFaena] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [documentacionEmbarcacion, setDocumentacionEmbarcacion] = useState([]);
  const [clientes, setClientes] = useState([]); // Estado para clientes
  const [especies, setEspecies] = useState([]); // Estado para especies

  // Estados para dropdowns
  const [temporada, setTemporada] = useState(null);
  const [bahias, setBahias] = useState(bahiasComercialesOptions);
  const [motoristas, setMotoristas] = useState(motoristasOptions);
  const [patrones, setPatrones] = useState(patronesOptions);
  const [embarcaciones, setEmbarcaciones] = useState(embarcacionesOptions);
  const [boliches, setBoliches] = useState(bolichesOptions);
  const [puertos, setPuertos] = useState(puertosOptions);
  const [puertosDescarga, setPuertosDescarga] = useState([]); // Estado para puertos de descarga
  const [documentosPesca, setDocumentosPesca] = useState([]);

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
        const documentosPescaData = await getDocumentosPesca();
        const documentacionEmbarcacionData = await getDocumentacionesEmbarcacion();
        const especiesData = await getEspeciesParaDropdown();
        const puertosData = await getPuertosActivos();
        
        setPersonal(personalData);
        setDocumentosPesca(documentosPescaData);
        setDocumentacionEmbarcacion(documentacionEmbarcacionData);
        setEspecies(especiesData);
        setPuertosDescarga(puertosData);

        // Cargar clientes si hay temporada con empresaId
        if (temporadaData?.empresaId) {
          const clientesData = await getClientesPorEmpresa(temporadaData.empresaId);
          setClientes(clientesData);
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

  useEffect(() => {
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

  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [isEditMode]);

  useEffect(() => {
    const descripcion = watch("descripcion");
    const id = watch("id");
    setForceUpdate((prev) => prev + 1);
  }, [watch("descripcion"), watch("id"), currentFaenaData.id, currentFaenaData.descripcion]);

  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  const handleHide = () => {
    setActiveCard("datos-generales");
    onHide();
  };

  const handleFormSubmit = async (data) => {
    try {
      // Llamar onSubmit original y obtener la respuesta
      const resultado = await onSubmit(data);      
      // Si es creación y se obtuvo un ID, actualizar los datos actuales
      if (!isEditMode && resultado && resultado.id) {
        
        // Generar descripción si el backend no la devuelve
        const descripcionGenerada = resultado.descripcion || `Faena ${resultado.id} Temporada ${temporadaData?.numeroResolucion || 'S/N'}`;
        
        const nuevaFaenaData = { 
          ...data, 
          id: resultado.id,
          descripcion: descripcionGenerada
        };
        setCurrentFaenaData(nuevaFaenaData);
        
        // Actualizar el formulario con el nuevo ID ANTES de cambiar isEditMode
        reset({
          ...data,
          id: resultado.id,
          descripcion: descripcionGenerada
        });
        
        
        // Cambiar a modo edición inmediatamente
        setIsEditMode(true);
        
        
        // Forzar actualización después de un pequeño delay para asegurar que el reset se complete
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 100);
        
        // Actualizar la prop faenaCreatedSuccessfully
        setFaenaCreatedSuccessfully?.(true);
        
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena creada correctamente. Ahora puede acceder a todas las funciones.",
          life: 4000,
        });
      } else if (isEditMode) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito", 
          detail: "Faena actualizada correctamente",
          life: 3000,
        });
      }
      
      // NO cerrar la ventana - comentar o eliminar onHide()
      // onHide();
      
    } catch (error) {
      console.error("❌ Error en handleFormSubmit:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la faena",
        life: 3000,
      });
    }
  };

  const handleFinalizarFaena = () => {
    // Cambiar estado a FINALIZADA (19)
    setValue("estadoFaenaId", 19);
    // Forzar actualización inmediata
    handleSubmit(handleFormSubmit)();
  };

  {
    /* Botones de navegación de Cards - lado izquierdo */
  }
  const dialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: 8,
        marginTop: 2,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <Button
          icon="pi pi-list"
          tooltip="Acciones Previas"
          label="Previas"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "acciones-previas"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("acciones-previas")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
        <Button
          icon="pi pi-info-circle"
          tooltip="Datos Generales y Detalle de Calas"
          label="Generales y Calas"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "datos-generales"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("datos-generales")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <Button
          icon="pi pi-users"
          tooltip="Documentos de Tripulantes"
          label="Dcmto Tripulantes"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "doc-tripulantes"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("doc-tripulantes")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
        <Button
          icon="pi pi-id-card"
          tooltip="Documentos de Embarcación"
          label="Dcmto Embarcación"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "doc-embarcacion"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("doc-embarcacion")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <Button
          icon="pi pi-download"
          tooltip="Descarga de Faena"
          label="Descarga Faena"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "descarga-faena"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("descarga-faena")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
        <Button
          icon="pi pi-calculator"
          tooltip="Liquidación de Faena"
          label="Liquidación Faena"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "liquidacion-faena"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("liquidacion-faena")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Button
          tooltip="Reporte de Faenas y Calas PRODUCE"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "informe" ? "p-button-info" : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("informe")}
          type="button"
          style={{ fontWeight: "bold", width: "100%" }}
          size="small"
        >
          <img
            src={logoEscudoPeru}
            alt="Escudo Perú"
            style={{
              width: "16px",
              height: "16px",
              marginRight: "0.5rem",
              filter:
                activeCard === "informe" ? "brightness(0) invert(1)" : "none",
            }}
          />
          PRODUCE
        </Button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
          key={`button-${isEditMode}-${forceUpdate}`}
          label={isEditMode ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          onClick={handleSubmit(handleFormSubmit)}
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

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      headerStyle={{ display: "none" }}
      modal
      maximizable
      footer={dialogFooter}
      onHide={handleHide}
    >
      <Toast ref={toast} />
      {/* Mostrar descripción de faena con Tag */}
      <div className="flex justify-content-center mb-4">
        <Tag
          key={`tag-${isEditMode}-${faenaCreatedSuccessfully}-${watch("id")}-${watch("descripcion")}-${forceUpdate}`}
          value={(() => {
            const descripcion = watch("descripcion") || currentFaenaData.descripcion || defaultValues.descripcion;
            const faenaId = watch("id") || currentFaenaData.id || defaultValues.id;
            const numeroResolucion = temporadaData?.numeroResolucion || 'S/N';
            let descripcionBase = "";
            if (descripcion && descripcion.includes('Faena')) {
              descripcionBase = descripcion;
            } else if (faenaId) {
              descripcionBase = `Faena ${faenaId} Temporada ${numeroResolucion}`;
            } else {
              descripcionBase = `Nueva Faena Temporada ${numeroResolucion}`;
            }
            
            let resultado = "";
            if (isEditMode) {
              resultado = `EDITAR: ${descripcionBase}`;
            } else if (faenaCreatedSuccessfully) {
              resultado = `CREADA: ${descripcionBase}`;
            } else {
              resultado = descripcionBase;
            }
            
            return resultado;
          })()}
          severity={isEditMode ? "warning" : faenaCreatedSuccessfully ? "success" : "info"}
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
            faenaPescaId={currentFaenaData.id || defaultValues.id}
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
            faenaPescaId={currentFaenaData.id || defaultValues.id}
            personal={personal}
          />
        )}

        {activeCard === "doc-tripulantes" && (
          <DetalleDocTripulantesCard
            faenaPescaId={currentFaenaData.id || defaultValues.id}
            temporadaData={temporadaData}
            personal={personal}
            documentosPesca={documentosPesca}
            loading={loading}
            onDataChange={onDataChange}
            onFaenasChange={onFaenasChange}
          />
        )}

        {activeCard === "doc-embarcacion" && (
          <DetalleDocEmbarcacionCard
            faenaPescaId={currentFaenaData.id || defaultValues.id}
            temporadaData={temporadaData}
            personal={personal}
            documentosPesca={documentosPesca}
            documentacionEmbarcacion={documentacionEmbarcacion}
            loading={loading}
            onDataChange={onDataChange}
            onFaenasChange={onFaenasChange}
          />
        )}

        {activeCard === "descarga-faena" && (
          <DescargaFaenaPescaCard
            faenaPescaId={currentFaenaData.id || defaultValues.id}
            temporadaData={temporadaData}
            faenaData={currentFaenaData}
            puertos={puertosDescarga} // Usar puertos de descarga
            patrones={patrones}
            motoristas={motoristas}
            bahias={bahias}
            clientes={clientes}
            personal={personal}
            especies={especies}
            loading={loading}
            onDataChange={onDataChange}
            onFaenasChange={onFaenasChange}
          />
        )}

        {activeCard === "liquidacion-faena" && (
          <LiquidacionFaenaPescaCard
            faenaPescaId={currentFaenaData.id || defaultValues.id}
            temporadaData={temporadaData}
            personal={personal}
            loading={loading}
            onDataChange={onDataChange}
            onFaenasChange={onFaenasChange}
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
