// src/components/faenaPescaConsumo/FaenaPescaConsumoForm.jsx
// Formulario profesional para FaenaPescaConsumo. Cumple la regla transversal ERP Megui.
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

// Componentes de cards
import DatosGeneralesFaenaPescaConsumo from "./DatosGeneralesFaenaPescaConsumo";
import DetalleAccionesPreviasConsumoCard from "./DetalleAccionesPreviasConsumoCard";
import InformeFaenaPescaConsumoForm from "./InformeFaenaPescaConsumoForm";
import DetalleDocTripulantesConsumoCard from "./DetalleDocTripulantesConsumoCard";
import TripulantesFaenaPescaConsumoCard from "./TripulantesFaenaPescaConsumoCard";
import DetalleDocEmbarcacionConsumoCard from "./DetalleDocEmbarcacionConsumoCard";
import DescargaFaenaConsumoCard from "./DescargaFaenaConsumoCard";

// API imports
import { listarEstadosMultiFuncionFaenaPescaConsumo } from "../../api/estadoMultiFuncion";
import { getPersonal } from "../../api/personal";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { getDocumentacionesEmbarcacion } from "../../api/documentacionEmbarcacion";
import { getClientesPorEmpresa } from "../../api/entidadComercial";
import { getEspeciesParaDropdown } from "../../api/especie";
import { getPuertosActivos } from "../../api/puertoPesca";
import { getFaenaPescaConsumoPorId } from "../../api/faenaPescaConsumo";
import logoEscudoPeru from "../../assets/logoEscudoPeru.png";

export default function FaenaPescaConsumoForm({
  visible,
  onHide,
  isEdit = false,
  defaultValues = {},
  onSubmit,
  loading = false,
  novedadData,
  embarcacionesOptions = [],
  bolichesOptions = [],
  bahiasComercialesOptions = [],
  motoristasOptions = [],
  patronesOptions = [],
  puertosOptions = [],
  onDataChange,
  onNovedadDataChange,
  onFaenasChange,
  faenaCreatedSuccessfully = false,
  setFaenaCreatedSuccessfully,
}) {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [currentFaenaData, setCurrentFaenaData] = useState(defaultValues);
  const [isEditMode, setIsEditMode] = useState(isEdit || !!defaultValues.id);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastDescargaUpdate, setLastDescargaUpdate] = useState(null);
  const toast = useRef(null);
  const previousDefaultValuesId = useRef(null);

  // Estados para datos del backend
  const [estadosFaena, setEstadosFaena] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [documentacionEmbarcacion, setDocumentacionEmbarcacion] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [puertosDescarga, setPuertosDescarga] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);

  // Estados para novedad
  const [novedad, setNovedad] = useState(null);

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
      novedadPescaConsumoId: null,
      embarcacionId: null,
      bolicheRedId: null,
      patronId: null,
      motoristaId: null,
      bahiaId: null,
      fechaSalida: null,
      fechaDescarga: null,
      puertoSalidaId: null,
      puertoFondeoId: null,
      puertoDescargaId: null,
      urlInformeFaena: "",
      observaciones: "",
      estadoFaenaId: null,
      toneladasCapturadasFaena: null,
      fechaHoraFondeo: null,
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Actualizar cuando cambia novedadData
  useEffect(() => {
    if (novedadData) {
      setNovedad(novedadData);
      setValue("novedadPescaConsumoId", Number(novedadData.id));
    }
  }, [novedadData, setValue]);

  // Actualizar cuando cambian defaultValues
  useEffect(() => {
    if (
      defaultValues?.id &&
      defaultValues.id !== previousDefaultValuesId.current
    ) {
      previousDefaultValuesId.current = defaultValues.id;
      setCurrentFaenaData(defaultValues);
      setIsEditMode(true);
      reset({
        ...defaultValues,
        novedadPescaConsumoId: defaultValues.novedadPescaConsumoId
          ? Number(defaultValues.novedadPescaConsumoId)
          : null,
        embarcacionId: defaultValues.embarcacionId
          ? Number(defaultValues.embarcacionId)
          : null,
        bolicheRedId: defaultValues.bolicheRedId
          ? Number(defaultValues.bolicheRedId)
          : null,
        patronId: defaultValues.patronId
          ? Number(defaultValues.patronId)
          : null,
        motoristaId: defaultValues.motoristaId
          ? Number(defaultValues.motoristaId)
          : null,
        bahiaId: defaultValues.bahiaId ? Number(defaultValues.bahiaId) : null,
        puertoSalidaId: defaultValues.puertoSalidaId
          ? Number(defaultValues.puertoSalidaId)
          : null,
        puertoFondeoId: defaultValues.puertoFondeoId
          ? Number(defaultValues.puertoFondeoId)
          : null,
        puertoDescargaId: defaultValues.puertoDescargaId
          ? Number(defaultValues.puertoDescargaId)
          : null,
        estadoFaenaId: defaultValues.estadoFaenaId
          ? Number(defaultValues.estadoFaenaId)
          : null,
        fechaSalida: defaultValues.fechaSalida
          ? new Date(defaultValues.fechaSalida)
          : null,
        fechaDescarga: defaultValues.fechaDescarga
          ? new Date(defaultValues.fechaDescarga)
          : null,
        fechaHoraFondeo: defaultValues.fechaHoraFondeo
          ? new Date(defaultValues.fechaHoraFondeo)
          : null,
      });
    } else if (!defaultValues?.id && previousDefaultValuesId.current !== null) {
      previousDefaultValuesId.current = null;
      setIsEditMode(false);
      setCurrentFaenaData({});
    }
  }, [defaultValues?.id, reset]);

  // Recargar faena cuando se crea exitosamente
  useEffect(() => {
    if (faenaCreatedSuccessfully && currentFaenaData?.id) {
      recargarFaena();
      setFaenaCreatedSuccessfully?.(false);
    }
  }, [
    faenaCreatedSuccessfully,
    currentFaenaData?.id,
    setFaenaCreatedSuccessfully,
  ]);

  const cargarDatosIniciales = async () => {
    try {
      const estadosData = await listarEstadosMultiFuncionFaenaPescaConsumo();
      setEstadosFaena(estadosData);

      const personalData = await getPersonal();
      setPersonal(personalData);

      const documentosData = await getDocumentosPesca();
      setDocumentosPesca(documentosData);

      const docEmbarcacionData = await getDocumentacionesEmbarcacion();
      setDocumentacionEmbarcacion(docEmbarcacionData);

      if (novedadData?.empresaId) {
        const clientesData = await getClientesPorEmpresa(novedadData.empresaId);
        setClientes(clientesData);
      }

      const especiesData = await getEspeciesParaDropdown();
      setEspecies(especiesData);

      const puertosDescargaData = await getPuertosActivos();
      setPuertosDescarga(puertosDescargaData);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del formulario",
        life: 3000,
      });
    }
  };

  const recargarFaena = async () => {
    if (!currentFaenaData?.id) return;

    try {
      const faenaActualizada = await getFaenaPescaConsumoPorId(
        currentFaenaData.id
      );
      setCurrentFaenaData(faenaActualizada);
      setForceUpdate((prev) => prev + 1);
    } catch (error) {
      console.error("Error al recargar faena:", error);
    }
  };

  const handleFaenaDataChange = (updatedData) => {
    const newData = { ...currentFaenaData, ...updatedData };
    setCurrentFaenaData(newData);
    onDataChange?.(newData);

    // Si se creó una nueva faena, actualizar el modo de edición
    if (updatedData?.id && !currentFaenaData?.id) {
      setIsEditMode(true);
      setFaenaCreatedSuccessfully?.(true);
    }
  };
  const handleDescargaUpdate = () => {
    setLastDescargaUpdate(Date.now());
    recargarFaena();
  };

  const handleNavigateToCard = (cardId) => {
    setActiveCard(cardId);
  };

  const handleHide = () => {
    onHide();
  };

  const handleFormSubmit = async (data) => {
    try {
      const resultado = await onSubmit(data);

      if (!isEditMode && resultado?.id) {
        // Generar descripción automática
        const descripcionGenerada = `Faena ${resultado.id} Novedad ${
          novedadData?.numeroNovedad || "S/N"
        }`;

        const nuevaFaenaData = {
          ...data,
          id: resultado.id,
          descripcion: descripcionGenerada,
        };
        setCurrentFaenaData(nuevaFaenaData);

        // Actualizar el formulario con el nuevo ID ANTES de cambiar isEditMode
        reset({
          ...data,
          id: resultado.id,
          descripcion: descripcionGenerada,
        });

        // Cambiar a modo edición inmediatamente
        setIsEditMode(true);

        // Forzar actualización después de un pequeño delay
        setTimeout(() => {
          setForceUpdate((prev) => prev + 1);
        }, 100);

        // Actualizar la prop faenaCreatedSuccessfully
        setFaenaCreatedSuccessfully?.(true);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail:
            "Faena creada correctamente. Ahora puede acceder a todas las funciones.",
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
  const commonProps = {
    control,
    errors,
    setValue,
    getValues,
    watch,
    faenaData: currentFaenaData,
    novedadData: novedad,
    onFaenaDataChange: handleFaenaDataChange,
    onNovedadDataChange,
    estadosFaena,
    embarcaciones: embarcacionesOptions,
    boliches: bolichesOptions,
    bahias: bahiasComercialesOptions,
    motoristas: motoristasOptions,
    patrones: patronesOptions,
    puertos: puertosOptions,
    puertosDescarga,
    personal,
    documentosPesca,
    documentacionEmbarcacion,
    clientes,
    especies,
  };

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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
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
          disabled={!currentFaenaData?.id}
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Button
          icon="pi pi-users"
          tooltip="Documentos de Tripulantes"
          label="Dcmto Tripulantes"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "documentos-tripulantes"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("documentos-tripulantes")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
          disabled={!currentFaenaData?.id}
        />
        <Button
          icon="pi pi-id-card"
          tooltip="Documentos de Embarcación"
          label="Dcmto Embarcación"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "documentos-embarcacion"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("documentos-embarcacion")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
          disabled={!currentFaenaData?.id}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Button
          icon="pi pi-download"
          tooltip="Descarga de Faena"
          label="Descarga Faena"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "descarga" ? "p-button-info" : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("descarga")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
          disabled={!currentFaenaData?.id}
        />
        <Button
          icon="pi pi-calculator"
          tooltip="Tripulantes"
          label="Tripulantes"
          tooltipOptions={{ position: "bottom" }}
          className={
            activeCard === "tripulantes" ? "p-button-info" : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("tripulantes")}
          type="button"
          size="small"
          style={{ width: "100%", height: "100%" }}
          disabled={!currentFaenaData?.id}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
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
          disabled={!currentFaenaData?.id}
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
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
          type="button"
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
          type="button"
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
          key={`tag-${isEditMode}-${faenaCreatedSuccessfully}-${currentFaenaData?.id}-${forceUpdate}`}
          value={(() => {
            const faenaId = currentFaenaData?.id;
            const novedadNumero = novedadData?.numeroNovedad || "S/N";
            let descripcionBase = "";

            if (faenaId) {
              descripcionBase = `Faena ${faenaId} Novedad ${novedadNumero}`;
            } else {
              descripcionBase = `Nueva Faena Novedad ${novedadNumero}`;
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
          severity={
            isEditMode
              ? "warning"
              : faenaCreatedSuccessfully
              ? "success"
              : "info"
          }
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
          <DatosGeneralesFaenaPescaConsumo {...commonProps} />
        )}

        {activeCard === "acciones-previas" && (
          <DetalleAccionesPreviasConsumoCard
            faenaPescaConsumoId={currentFaenaData?.id}
            personal={personal}
            onDataChange={handleFaenaDataChange}
          />
        )}

        {activeCard === "documentos-embarcacion" && (
          <DetalleDocEmbarcacionConsumoCard
            faenaPescaConsumoId={currentFaenaData?.id}
            faenaData={currentFaenaData} // ✅ Agregar esta línea
            documentacionEmbarcacion={documentacionEmbarcacion}
            onDataChange={handleFaenaDataChange}
          />
        )}

        {activeCard === "tripulantes" && (
          <TripulantesFaenaPescaConsumoCard
            faenaPescaConsumoId={currentFaenaData?.id}
            personal={personal}
            onDataChange={handleFaenaDataChange}
          />
        )}

        {activeCard === "documentos-tripulantes" && (
          <DetalleDocTripulantesConsumoCard
            faenaPescaConsumoId={currentFaenaData?.id}
            novedadData={novedad}
            documentosPesca={documentosPesca}
            personal={personal}
            onDataChange={handleFaenaDataChange}
          />
        )}

        {activeCard === "descarga" && (
          <DescargaFaenaConsumoCard
            faenaPescaConsumoId={currentFaenaData?.id}
            novedadData={novedad}
            faenaData={currentFaenaData}
            puertos={puertosDescarga} // ✅ CORREGIDO: era puertosDescarga={puertosDescarga}
            patrones={patronesOptions}
            motoristas={motoristasOptions}
            bahias={bahiasComercialesOptions}
            clientes={clientes}
            especies={especies}
            onDataChange={handleDescargaUpdate}
            lastUpdate={lastDescargaUpdate}
          />
        )}

        {activeCard === "informe" && (
          <InformeFaenaPescaConsumoForm
            control={control}
            watch={watch}
            errors={errors}
            loading={loading}
            setValue={setValue}
            faenaData={currentFaenaData}
          />
        )}
      </div>
    </Dialog>
  );
}
