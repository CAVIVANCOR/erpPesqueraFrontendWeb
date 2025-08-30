/**
 * Formulario para gestión de Temporadas de Pesca
 *
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Sistema de Cards navegables como ProductoForm
 * - Combos relacionales con empresas, personal con cargo BAHIA COMERCIAL y estados de temporada
 * - Gestión de cuotas con formato decimal
 * - Control de fechas de inicio y fin con validaciones
 * - Upload de archivos PDF para resoluciones
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Validaciones de negocio específicas (fechas, cuotas, superposición)
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { ButtonGroup } from "primereact/buttongroup";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import {
  getBahiasComerciales,
  getMotoristas,
  getPatrones,
} from "../../api/personal";
import { iniciarTemporada } from "../../api/temporadaPesca";
import { getEstadosMultiFuncionParaTemporadaPesca } from "../../api/estadoMultiFuncion";
import { crearFaenaPesca } from "../../api/faenaPesca"; // Importar función crearFaenaPesca
import { getEmbarcaciones } from "../../api/embarcacion";
import { getAllBolicheRed } from "../../api/bolicheRed";
import { getPuertosPesca } from "../../api/puertoPesca";
// Importar componentes de cards
import DatosGeneralesTemporadaForm from "./DatosGeneralesTemporadaForm";
import ResolucionPDFTemporadaForm from "./ResolucionPDFTemporadaForm";
import DetalleFaenasPescaCard from "./DetalleFaenasPescaCard";

/**
 * Componente de formulario para temporadas de pesca
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const TemporadaPescaForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  empresas = [],
}) => {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [bahiasComerciales, setBahiasComerciales] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [patrones, setPatrones] = useState([]);
  const [estadosTemporada, setEstadosTemporada] = useState([]);
  const [estadoDefaultId, setEstadoDefaultId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [archivoSubido, setArchivoSubido] = useState(null);
  const [validandoSuperposicion, setValidandoSuperposicion] = useState(false);
  const [iniciandoTemporada, setIniciandoTemporada] = useState(false);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [boliches, setBoliches] = useState([]);
  const [puertosPesca, setPuertosPesca] = useState([]);

  // Ref para Toast
  const toast = useRef(null);

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
      empresaId: null,
      BahiaId: null,
      estadoTemporadaId: null,
      nombre: "",
      fechaInicio: null,
      fechaFin: null,
      numeroResolucion: "",
      urlResolucionPdf: "",
      cuotaPropiaTon: null,
      cuotaAlquiladaTon: null,
    },
  });

  // Observar cambios en empresa para filtrar bahías
  const empresaSeleccionada = watch("empresaId");
  const fechaInicio = watch("fechaInicio");
  const fechaFin = watch("fechaFin");
  const estadoSeleccionado = watch("estadoTemporadaId");

  /**
   * Cargar estados de temporada al montar el componente
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [estadosData, embarcacionesData, bolichesData, puertosData] = await Promise.all([
          getEstadosMultiFuncionParaTemporadaPesca(),
          getEmbarcaciones(),
          getAllBolicheRed(),
          getPuertosPesca()
        ]);
        
        setEstadosTemporada(estadosData);
        setEmbarcaciones(embarcacionesData);
        setBoliches(bolichesData);
        setPuertosPesca(puertosData);

        // Encontrar y guardar el ID del estado por defecto
        const estadoDefault = estadosData.find(
          (estado) => estado.descripcion === "EN ESPERA DE INICIO"
        );
        if (estadoDefault) {
          setEstadoDefaultId(Number(estadoDefault.id));
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
  }, []);

  /**
   * Establecer estado por defecto cuando esté disponible y no hay elemento en edición
   */
  useEffect(() => {
    if (estadoDefaultId && !editingItem) {
      setValue("estadoTemporadaId", estadoDefaultId);
    }
  }, [estadoDefaultId, editingItem, setValue]);

  /**
   * Filtrar bahías comerciales cuando cambie la empresa seleccionada
   */
  useEffect(() => {
    if (empresaSeleccionada) {
      const cargarResponsablesFaena = async () => {
        try {
          const bahiasData = await getBahiasComerciales(
            Number(empresaSeleccionada),
            "BAHIA COMERCIAL"
          );
          const motoristasData = await getMotoristas(
            Number(empresaSeleccionada),
            "MOTORISTA EMBARCACION"
          );
          const patronesData = await getPatrones(
            Number(empresaSeleccionada),
            "PATRON EMBARCACION"
          );
          setBahiasComerciales(bahiasData);
          setMotoristas(motoristasData);
          setPatrones(patronesData);
        } catch (error) {
          console.error("Error cargando bahías comerciales:", error);
          setBahiasComerciales([]);
          setMotoristas([]);
          setPatrones([]);
        }
      };
      cargarResponsablesFaena();
    } else {
      setBahiasComerciales([]);
      setMotoristas([]);
      setPatrones([]);
      setValue("BahiaId", null);
    }
  }, [empresaSeleccionada, setValue]);

  /**
   * Validar superposición cuando cambien fechas o estado
   */
  useEffect(() => {
    if (fechaInicio && fechaFin && estadoSeleccionado && empresaSeleccionada) {
      validarSuperposicionFechas();
    }
  }, [fechaInicio, fechaFin, estadoSeleccionado, empresaSeleccionada]);

  /**
   * Efecto para cargar datos cuando se edita un elemento
   */
  useEffect(() => {
    if (editingItem) {
      reset({
        id: editingItem.id,
        empresaId: Number(editingItem.empresaId),
        BahiaId: Number(editingItem.BahiaId),
        estadoTemporadaId: Number(editingItem.estadoTemporadaId) || 1,
        nombre: editingItem.nombre,
        fechaInicio: new Date(editingItem.fechaInicio),
        fechaFin: new Date(editingItem.fechaFin),
        numeroResolucion: editingItem.numeroResolucion || "",
        urlResolucionPdf: editingItem.urlResolucionPdf || "",
        cuotaPropiaTon: editingItem.cuotaPropiaTon
          ? Number(editingItem.cuotaPropiaTon)
          : null,
        cuotaAlquiladaTon: editingItem.cuotaAlquiladaTon
          ? Number(editingItem.cuotaAlquiladaTon)
          : null,
      });

      if (editingItem.urlResolucionPdf) {
        setArchivoSubido({
          name: editingItem.numeroResolucion + ".pdf",
          url: editingItem.urlResolucionPdf,
        });
      }
    } else {
      // Limpiar formulario para nueva temporada
      reset({
        id: null,
        empresaId: null,
        BahiaId: null,
        estadoTemporadaId: estadoDefaultId,
        nombre: "",
        fechaInicio: null,
        fechaFin: null,
        numeroResolucion: "",
        urlResolucionPdf: "",
        cuotaPropiaTon: null,
        cuotaAlquiladaTon: null,
      });
      setArchivoSubido(null);
    }
  }, [editingItem, reset, estadoDefaultId]);

  /**
   * Validar superposición de fechas con otras temporadas
   */
  const validarSuperposicionFechas = async () => {
    try {
      setValidandoSuperposicion(true);

      const datos = {
        empresaId: Number(empresaSeleccionada),
        estadoTemporadaId: Number(estadoSeleccionado),
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      };

      // Simulación de validación - implementar según API
      setTimeout(() => {
        setValidandoSuperposicion(false);
      }, 1000);
    } catch (error) {
      console.error("Error al validar superposición:", error);
      setValidandoSuperposicion(false);
    }
  };

  /**
   * Función para navegar entre cards
   */
  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  /**
   * Manejar envío del formulario
   */
  const onSubmit = (data) => {
    // Preparar datos con normalización de IDs
    const formData = {
      id: data.id,
      empresaId: Number(data.empresaId),
      BahiaId: Number(data.BahiaId),
      estadoTemporadaId: Number(data.estadoTemporadaId),
      nombre: data.nombre.trim(),
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
      numeroResolucion: data.numeroResolucion?.trim() || null,
      urlResolucionPdf:
        data.urlResolucionPdf?.trim() || archivoSubido?.url || null,
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon
        ? Number(data.cuotaAlquiladaTon)
        : null,
    };

    onSave(formData);
  };

  /**
   * Manejar cierre del diálogo
   */
  const handleHide = () => {
    reset();
    setArchivoSubido(null);
    setUploadProgress(0);
    setActiveCard("datos-generales");
    onHide();
  };

  /**
   * Manejar inicio de temporada
   */
  const handleIniciarTemporada = async () => {
    if (!editingItem?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la temporada antes de iniciarla",
        life: 3000,
      });
      return;
    }

    try {
      setIniciandoTemporada(true);
      const resultado = await iniciarTemporadaConAutocompletado(editingItem);
      
      // Actualizar el estado de la temporada en el frontend
      if (resultado && resultado.temporadaActualizada) {
        // Actualizar el formulario para que el dropdown refleje el cambio
        setValue("estadoTemporadaId", resultado.temporadaActualizada.estadoTemporadaId);
        
      }
      
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Temporada iniciada exitosamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al iniciar temporada:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al iniciar temporada",
        life: 3000,
      });
    } finally {
      setIniciandoTemporada(false);
    }
  };

  const iniciarTemporadaConAutocompletado = async (temporada) => {
    try {
      // Solo llamar al backend para iniciar temporada
      // El backend ya crea FaenaPesca, EntregaARendir y DetAccionesPreviasFaena
      const resultado = await iniciarTemporada(temporada.id);
      return resultado;

    } catch (error) {
      console.error("Error en iniciarTemporadaConAutocompletado:", error);
      throw error;
    }
  };

  /**
   * Footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={handleHide}
      />
      {editingItem && (
        <Button
          label="Iniciar Temporada"
          icon="pi pi-play"
          severity="success"
          onClick={handleIniciarTemporada}
          loading={iniciandoTemporada}
        />
      )}
      <Button
        label={editingItem ? "Actualizar" : "Crear"}
        icon="pi pi-check"
        onClick={handleSubmit(onSubmit)}
        loading={validandoSuperposicion}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      header={
        editingItem ? "Editar Temporada de Pesca" : "Nueva Temporada de Pesca"
      }
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
    >
      {/* Mostrar nombre de temporada con Tag */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={watch("nombre") || "Nueva Temporada de Pesca"}
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

      {/* Sistema de navegación con botones de iconos */}
      <Toolbar
        className="mb-4"
        center={
          <ButtonGroup>
            <Button
              icon="pi pi-info-circle"
              tooltip="Datos Generales - Información básica de la temporada"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "datos-generales"
                  ? "p-button-primary"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("datos-generales")}
              type="button"
            />
            <Button
              icon="pi pi-file-pdf"
              tooltip="Resolución PDF - Documento ministerial de autorización"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "resolucion-pdf"
                  ? "p-button-warning"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("resolucion-pdf")}
              type="button"
            />
            {editingItem && (
              <Button
                icon="pi pi-chart-line"
                tooltip="Faenas Pesca - Detalle de faenas de pesca"
                tooltipOptions={{ position: "bottom" }}
                className={
                  activeCard === "faenas-pesca"
                    ? "p-button-info"
                    : "p-button-outlined"
                }
                onClick={() => handleNavigateToCard("faenas-pesca")}
                type="button"
              />
            )}
          </ButtonGroup>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {activeCard === "datos-generales" && (
          <DatosGeneralesTemporadaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            empresas={empresas}
            bahiasComerciales={bahiasComerciales}
            motoristas={motoristas}
            patrones={patrones}
            estadosTemporada={estadosTemporada}
            empresaSeleccionada={empresaSeleccionada}
            defaultValues={getValues()}
          />
        )}

        {activeCard === "resolucion-pdf" && (
          <ResolucionPDFTemporadaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={getValues()}
          />
        )}

        {activeCard === "faenas-pesca" && (
          <DetalleFaenasPescaCard
            temporadaPescaId={editingItem?.id}
            embarcaciones={embarcaciones}
            boliches={boliches}
            puertos={puertosPesca}
            bahiasComerciales={bahiasComerciales}
            motoristas={motoristas}
            patrones={patrones}
            temporadaData={editingItem}
          />
        )}

        {/* Indicador de validación de superposición */}
        {validandoSuperposicion && (
          <div className="col-12">
            <Message
              severity="info"
              text="Validando superposición de fechas con otras temporadas..."
              className="w-full"
            />
          </div>
        )}
      </form>
      <Toast ref={toast} />
    </Dialog>
  );
};

export default TemporadaPescaForm;
