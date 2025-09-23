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
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import {
  getBahiasComerciales,
  getMotoristas,
  getPatrones,
} from "../../api/personal";
import { iniciarTemporada } from "../../api/temporadaPesca";
import { getEstadosMultiFuncionParaTemporadaPesca } from "../../api/estadoMultiFuncion";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getAllBolicheRed } from "../../api/bolicheRed";
import { getPuertosPesca } from "../../api/puertoPesca";
import { getTemporadaPescaPorId } from "../../api/temporadaPesca"; // Importar función para obtener temporada por ID
// Importar componentes de cards
import DatosGeneralesTemporadaForm from "./DatosGeneralesTemporadaForm";
import ResolucionPDFTemporadaForm from "./ResolucionPDFTemporadaForm";
import EntregasARendirTemporadaCard from "./EntregasARendirTemporadaCard";
// Importar APIs adicionales
import { getPersonal } from "../../api/personal";
import { getCentrosCosto } from "../../api/centroCosto";
import { getTiposMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { getEmpresas } from "../../api/empresa";

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
  onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
}) => {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [bahiasComerciales, setBahiasComerciales] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [patrones, setPatrones] = useState([]);
  const [estadosTemporada, setEstadosTemporada] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [boliches, setBoliches] = useState([]);
  const [puertosPesca, setPuertosPesca] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [validandoSuperposicion, setValidandoSuperposicion] = useState(false);
  const [estadoDefaultId, setEstadoDefaultId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [archivoSubido, setArchivoSubido] = useState(null);
  const [iniciandoTemporada, setIniciandoTemporada] = useState(false);
  const [tieneFaenas, setTieneFaenas] = useState(false);
  const [camposRequeridosCompletos, setCamposRequeridosCompletos] = useState(false);
  // Estados para nuevos catálogos
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [empresasList, setEmpresasList] = useState([]);

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
      toneladasCapturadasTemporada: null,
    },
  });

  // Observar cambios en empresa para filtrar bahías
  const empresaSeleccionadaId = watch("empresaId");
  const fechaInicio = watch("fechaInicio");
  const fechaFin = watch("fechaFin");
  const estadoSeleccionado = watch("estadoTemporadaId");

  /**
   * Cargar estados de temporada al montar el componente
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          estadosData,
          embarcacionesData,
          bolichesData,
          puertosData,
          personalData,
          centrosCostoData,
          tiposMovimientoData,
          empresasData,
        ] = await Promise.all([
          getEstadosMultiFuncionParaTemporadaPesca(),
          getEmbarcaciones(),
          getAllBolicheRed(),
          getPuertosPesca(),
          getPersonal(),
          getCentrosCosto(),
          getTiposMovEntregaRendir(),
          getEmpresas(),
        ]);

        setEstadosTemporada(estadosData);
        setEmbarcaciones(embarcacionesData);
        setBoliches(bolichesData);
        setPuertosPesca(puertosData);
        setPersonal(personalData);
        setCentrosCosto(centrosCostoData);
        setTiposMovimiento(tiposMovimientoData);
        setEmpresasList(empresasData);

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
   * Cargar responsables de faena al montar el componente
   */
  useEffect(() => {
    const cargarResponsablesFaena = async () => {
      try {
        // Usar la empresa del editingItem o la primera empresa disponible
        const empresaId = editingItem?.empresaId || empresasList[0]?.id || null;

        if (empresaId) {
          const [bahiasData, motoristasData, patronesData] = await Promise.all([
            getBahiasComerciales(Number(empresaId), "BAHIA COMERCIAL"),
            getMotoristas(Number(empresaId), "MOTORISTA EMBARCACION"),
            getPatrones(Number(empresaId), "PATRON EMBARCACION"),
          ]);

          setBahiasComerciales(bahiasData);
          setMotoristas(motoristasData);
          setPatrones(patronesData);
        }
      } catch (error) {
        console.error("Error cargando responsables de faena:", error);
        setBahiasComerciales([]);
        setMotoristas([]);
        setPatrones([]);
      }
    };

    if (editingItem?.empresaId || empresasList.length > 0) {
      cargarResponsablesFaena();
    }
  }, [editingItem, empresasList]);

  /**
   * Verificar si la temporada ya fue iniciada
   */
  const verificarTemporadaIniciada = async (temporadaId) => {
    if (!temporadaId) {
      setTieneFaenas(false);
      return;
    }

    try {
      // Obtener la temporada por ID para verificar temporadaPescaIniciada
      const temporada = await getTemporadaPescaPorId(temporadaId);
      const yaIniciada = temporada?.temporadaPescaIniciada || false;
      setTieneFaenas(yaIniciada);
    } catch (error) {
      console.error("Error verificando temporada iniciada:", error);
      setTieneFaenas(false);
    }
  };

  /**
   * Verificar si los campos requeridos están completos
   */
  const verificarCamposRequeridos = (formData) => {
    const camposCompletos = !!(
      formData.numeroResolucion &&
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.cuotaPropiaTon &&
      formData.cuotaAlquiladaTon
    );
    setCamposRequeridosCompletos(camposCompletos);
    return camposCompletos;
  };

  // Efecto para verificar campos requeridos cuando cambian los valores del formulario
  useEffect(() => {
    const subscription = watch((value) => {
      verificarCamposRequeridos(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Efecto para re-evaluar campos requeridos cuando editingItem cambie
  useEffect(() => {
    if (editingItem) {
      const currentValues = getValues();
      verificarCamposRequeridos(currentValues);
    }
  }, [editingItem, getValues]);

  /**
   * Validar superposición cuando cambien fechas o estado
   */
  useEffect(() => {
    if (fechaInicio && fechaFin && estadoSeleccionado && empresaSeleccionadaId) {
      validarSuperposicionFechas();
    }
  }, [fechaInicio, fechaFin, estadoSeleccionado, empresaSeleccionadaId]);

  /**
   * Validar superposición de fechas con otras temporadas
   */
  const validarSuperposicionFechas = async () => {
    try {
      setValidandoSuperposicion(true);

      const datos = {
        empresaId: Number(empresaSeleccionadaId),
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
  const handleFormSubmit = async (data) => {
    setValidandoSuperposicion(true);
    // Preparar datos con normalización de IDs
    const formData = {
      empresaId: Number(data.empresaId),
      BahiaId: Number(data.BahiaId),
      estadoTemporadaId: Number(data.estadoTemporadaId),
      nombre: data.nombre?.trim().toUpperCase() || "",
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
      numeroResolucion: data.numeroResolucion?.trim().toUpperCase() || null,
      urlResolucionPdf:
        data.urlResolucionPdf?.trim() || archivoSubido?.url || null,
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon
        ? Number(data.cuotaAlquiladaTon)
        : null,
      fechaActualizacion: new Date().toISOString(),
      toneladasCapturadasTemporada:
        data.toneladasCapturadasTemporada || null,
    };

    // Solo incluir ID si existe y no es null (para edición)
    if (data.id && editingItem?.id) {
      formData.id = data.id;
    }

    try {
      const resultado = await onSave(formData);
      // Si es una nueva temporada y se obtuvo un ID, re-verificar registros
      if (resultado && resultado.id && !editingItem?.id) {
        // Forzar re-verificación de registros con el nuevo ID
        setTimeout(async () => {
          await verificarTemporadaIniciada(resultado.id);
        }, 100);
      } else if (resultado && resultado.id) {
        // Si es actualización de temporada existente, también verificar
        setTimeout(async () => {
          await verificarTemporadaIniciada(resultado.id);
        }, 100);
      }
      setValidandoSuperposicion(false);
    } catch (error) {
      console.error("Error en handleFormSubmit:", error);
      setValidandoSuperposicion(false);
      throw error;
    }
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
   * Determinar si el botón Iniciar Temporada debe estar habilitado
   */
  const puedeIniciarTemporada = () => {
    const tieneId = !!editingItem?.id;
    const camposCompletos = camposRequeridosCompletos;
    const noTieneFaenas = !tieneFaenas;
    return tieneId && camposCompletos && noTieneFaenas;
  };

  /**
   * Manejar inicio de temporada
   */
  const handleIniciarTemporada = () => {
    confirmDialog({
      message:
        "¿Está seguro de iniciar esta temporada de pesca? Esta acción creará los registros necesarios.",
      header: "Confirmar Inicio de Temporada",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-success",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Iniciar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          await iniciarTemporada(editingItem.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Temporada iniciada correctamente",
          });

          // Re-verificar registros para deshabilitar el botón
          await verificarTemporadaIniciada(editingItem.id);

          // Obtener datos actualizados de la temporada y notificar cambios
          const temporadaActualizada = await getTemporadaPescaPorId(editingItem.id);
          if (onTemporadaDataChange && temporadaActualizada) {
            onTemporadaDataChange(temporadaActualizada);
          }

          // Notificar actualización de faenas
          window.dispatchEvent(
            new CustomEvent("refreshFaenas", {
              detail: { temporadaId: editingItem.id },
            })
          );

          // Recalcular estados de documentación personal
          window.dispatchEvent(
            new CustomEvent("recalcularDocumentacionPersonal")
          );
        } catch (error) {
          console.error("Error iniciando temporada:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al iniciar la temporada",
          });
        }
      },
    });
  };

  /**
   * Footer del diálogo con botones de acción
   */
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
          tooltip="Temporada de Pesca y Detalle de Faenas"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "datos-generales"
              ? "p-button-primary"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("datos-generales")}
          type="button"
          size="small"
        />
        <Button
          icon="pi pi-file-pdf"
          tooltip="Resolución Ministerial en PDF"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "resolucion-pdf"
              ? "p-button-warning"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("resolucion-pdf")}
          type="button"
          size="small"
        />
        <Button
          icon="pi pi-file-excel"
          tooltip="Entregas a Rendir"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "entregas-a-rendir"
              ? "p-button-success"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("entregas-a-rendir")}
          type="button"
          size="small"
        />
      </div>

      {/* Botones de acción - lado derecho */}
      <div className="flex gap-2">
        {editingItem && (
          <Button
            label="Iniciar Temporada"
            icon="pi pi-play"
            className="p-button-success"
            disabled={(() => {
              const resultado = !puedeIniciarTemporada();
              return resultado;
            })()}
            onClick={handleIniciarTemporada}
            tooltip={
              !editingItem?.id
                ? "Debe guardar la temporada primero"
                : !camposRequeridosCompletos
                ? "Complete todos los campos requeridos (Número de resolución, fechas y cuotas)"
                : tieneFaenas
                ? "La temporada ya fue iniciada"
                : "Iniciar temporada de pesca"
            }
          />
        )}
        <Button
          label="Cancelar"
          icon="pi pi-times"
          outlined
          onClick={handleHide}
        />
        <Button
          label={editingItem ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          onClick={handleSubmit(handleFormSubmit)}
          loading={validandoSuperposicion}
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (editingItem) {
      reset({
        id: editingItem.id || null,
        empresaId: editingItem.empresaId ? Number(editingItem.empresaId) : null,
        BahiaId: editingItem.BahiaId || null,
        estadoTemporadaId: editingItem.estadoTemporadaId || estadoDefaultId,
        nombre: editingItem.nombre || "",
        fechaInicio: editingItem.fechaInicio
          ? new Date(editingItem.fechaInicio)
          : null,
        fechaFin: editingItem.fechaFin ? new Date(editingItem.fechaFin) : null,
        numeroResolucion: editingItem.numeroResolucion || "",
        urlResolucionPdf: editingItem.urlResolucionPdf || "",
        cuotaPropiaTon: editingItem.cuotaPropiaTon || null,
        cuotaAlquiladaTon: editingItem.cuotaAlquiladaTon || null,
        toneladasCapturadasTemporada:
          editingItem.toneladasCapturadasTemporada || null,
      });
    } else {
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
        toneladasCapturadasTemporada: null,
      });
    }
  }, [editingItem, reset, estadoDefaultId]);

  // Verificar si la temporada ya fue iniciada cuando editingItem cambie
  useEffect(() => {
    if (editingItem?.id) {
      verificarTemporadaIniciada(editingItem.id);
    } else {
      setTieneFaenas(false);
    }
  }, [editingItem?.id]);

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      headerStyle={{ display: "none" }}
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
            padding: "0.75rem 0.5rem",
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            marginTop: "0.5rem",
          }}
        />
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {activeCard === "datos-generales" && (
          <DatosGeneralesTemporadaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            empresas={empresasList}
            bahiasComerciales={bahiasComerciales}
            motoristas={motoristas}
            patrones={patrones}
            estadosTemporada={estadosTemporada}
            empresaSeleccionada={empresaSeleccionada}
            defaultValues={getValues()}
            embarcaciones={embarcaciones}
            boliches={boliches}
            puertos={puertosPesca}
            temporadaData={editingItem}
            onTemporadaDataChange={onTemporadaDataChange}
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
        {activeCard === "entregas-a-rendir" && (
          <EntregasARendirTemporadaCard
            temporadaPescaId={editingItem?.id}
            temporadaPescaIniciada={editingItem?.temporadaPescaIniciada || false}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            onDataChange={onTemporadaDataChange}
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
