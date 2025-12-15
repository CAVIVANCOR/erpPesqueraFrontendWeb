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
import { BlockUI } from "primereact/blockui";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  getBahiasComerciales,
  getMotoristas,
  getPatrones,
} from "../../api/personal";
import {
  iniciarTemporada,
  finalizarTemporada,
  cancelarTemporada,
} from "../../api/temporadaPesca";
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
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
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
  tiposDocumento = [],
  onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
  readOnly = false,
  isEdit = false,
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
  const [finalizandoTemporada, setFinalizandoTemporada] = useState(false);
  const [cancelandoTemporada, setCancelandoTemporada] = useState(false);
  const [tieneFaenas, setTieneFaenas] = useState(false);
  const [camposRequeridosCompletos, setCamposRequeridosCompletos] =
    useState(false);
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
      limiteMaximoCapturaTn: null,
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
          getAllTipoMovEntregaRendir(),
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
    if (
      fechaInicio &&
      fechaFin &&
      estadoSeleccionado &&
      empresaSeleccionadaId
    ) {
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
      limiteMaximoCapturaTn: data.limiteMaximoCapturaTn ? Number(data.limiteMaximoCapturaTn) : null,
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon
        ? Number(data.cuotaAlquiladaTon)
        : null,
      fechaActualizacion: new Date().toISOString(),
      toneladasCapturadasTemporada: data.toneladasCapturadasTemporada || null,
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
   * Sistema profesional con loading state para evitar doble clic
   */
  const handleIniciarTemporada = () => {
    // Validar permisos
    if (readOnly) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para iniciar temporadas.",
        life: 3000,
      });
      return;
    }

    // Prevenir si ya está procesando
    if (iniciandoTemporada) {
      return;
    }

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
        setIniciandoTemporada(true);
        try {
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail: "Iniciando temporada, por favor espere...",
            life: 3000,
          });

          await iniciarTemporada(editingItem.id);
          
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Temporada iniciada correctamente",
            life: 3000,
          });

          // Re-verificar registros para deshabilitar el botón
          await verificarTemporadaIniciada(editingItem.id);

          // Obtener datos actualizados de la temporada y notificar cambios
          const temporadaActualizada = await getTemporadaPescaPorId(
            editingItem.id
          );
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
            detail: error?.response?.data?.mensaje || "Error al iniciar la temporada",
            life: 5000,
          });
        } finally {
          setIniciandoTemporada(false);
        }
      },
    });
  };

  /**
   * Manejar finalización de temporada
   * Sistema profesional con loading state para evitar doble clic
   */
  const handleFinalizarTemporada = () => {
    // Validar permisos
    if (readOnly) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para finalizar temporadas.",
        life: 3000,
      });
      return;
    }

    // Prevenir si ya está procesando
    if (finalizandoTemporada) {
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de finalizar esta temporada de pesca? Esta acción cambiará el estado a FINALIZADA.",
      header: "Confirmar Finalización de Temporada",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-warning",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Finalizar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setFinalizandoTemporada(true);
        try {
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail: "Finalizando temporada, por favor espere...",
            life: 3000,
          });

          await finalizarTemporada(editingItem.id);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Temporada finalizada correctamente",
            life: 3000,
          });

          // Recargar datos actualizados
          const temporadaActualizada = await getTemporadaPescaPorId(
            editingItem.id
          );
          if (onTemporadaDataChange && temporadaActualizada) {
            onTemporadaDataChange(temporadaActualizada);
          }
        } catch (error) {
          console.error("Error finalizando temporada:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.response?.data?.mensaje || "Error al finalizar la temporada",
            life: 5000,
          });
        } finally {
          setFinalizandoTemporada(false);
        }
      },
    });
  };

  /**
   * Manejar cancelación de temporada
   * Sistema profesional con loading state para evitar doble clic
   */
  const handleCancelarTemporada = () => {
    // Validar permisos
    if (readOnly) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para cancelar temporadas.",
        life: 3000,
      });
      return;
    }

    // Prevenir si ya está procesando
    if (cancelandoTemporada) {
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de cancelar esta temporada de pesca? Esta acción cambiará el estado a CANCELADA.",
      header: "Confirmar Cancelación de Temporada",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Cancelar",
      rejectLabel: "No",
      accept: async () => {
        setCancelandoTemporada(true);
        try {
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail: "Cancelando temporada, por favor espere...",
            life: 3000,
          });

          await cancelarTemporada(editingItem.id);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Temporada cancelada correctamente",
            life: 3000,
          });

          // Recargar datos actualizados
          const temporadaActualizada = await getTemporadaPescaPorId(
            editingItem.id
          );
          if (onTemporadaDataChange && temporadaActualizada) {
            onTemporadaDataChange(temporadaActualizada);
          }
        } catch (error) {
          console.error("Error cancelando temporada:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.response?.data?.mensaje || "Error al cancelar la temporada",
            life: 5000,
          });
        } finally {
          setCancelandoTemporada(false);
        }
      },
    });
  };

  /**
   * Renderizar footer del diálogo con botones de acción
   */
  const dialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        marginTop: 18,
      }}
    >
      {/* Botones de navegación de Cards - lado izquierdo */}
      <div className="flex gap-1">
        <Button
          icon="pi pi-info-circle"
          tooltip="Datos Generales"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "datos-generales"
              ? "p-button-primary"
              : "p-button-outlined"
          }
          onClick={() => setActiveCard("datos-generales")}
          type="button"
          size="small"
        />
        <Button
          icon="pi pi-file-pdf"
          tooltip="Resolución PDF"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "resolucion-pdf"
              ? "p-button-warning"
              : "p-button-outlined"
          }
          onClick={() => setActiveCard("resolucion-pdf")}
          type="button"
          size="small"
        />
        <Button
          icon="pi pi-money-bill"
          tooltip="Entregas a Rendir"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "entregas-a-rendir"
              ? "p-button-success"
              : "p-button-outlined"
          }
          onClick={() => setActiveCard("entregas-a-rendir")}
          type="button"
          size="small"
          disabled={!editingItem?.id}
        />
      </div>

      {/* Botones de acción - lado derecho */}
      <div className="flex gap-2">
        {/* Botón Iniciar Temporada - Solo visible en estado EN ESPERA (13) */}
        {editingItem && Number(estadoSeleccionado) === 13 && (
          <Button
            label={iniciandoTemporada ? "Iniciando..." : "Iniciar Temporada"}
            icon={iniciandoTemporada ? "pi pi-spin pi-spinner" : "pi pi-play"}
            className="p-button-success"
            onClick={handleIniciarTemporada}
            disabled={readOnly || !puedeIniciarTemporada() || iniciandoTemporada}
            loading={iniciandoTemporada}
            tooltip={
              readOnly
                ? "No tiene permisos para iniciar temporadas"
                : iniciandoTemporada
                ? "Procesando inicio de temporada..."
                : !camposRequeridosCompletos
                ? "Complete todos los campos requeridos primero"
                : tieneFaenas
                ? "La temporada ya fue iniciada"
                : "Iniciar temporada de pesca"
            }
          />
        )}

        {/* Botón Finalizar Temporada - Solo visible en estado EN PROCESO (14) */}
        {editingItem && Number(estadoSeleccionado) === 14 && (
          <Button
            label={finalizandoTemporada ? "Finalizando..." : "Finalizar Temporada"}
            icon={finalizandoTemporada ? "pi pi-spin pi-spinner" : "pi pi-check-circle"}
            className="p-button-warning"
            onClick={handleFinalizarTemporada}
            disabled={finalizandoTemporada}
            loading={finalizandoTemporada}
            tooltip={
              finalizandoTemporada
                ? "Procesando finalización de temporada..."
                : "Finalizar temporada de pesca"
            }
          />
        )}

        {/* Botón Cancelar Temporada - Visible en estados EN ESPERA (13) o EN PROCESO (14) */}
        {editingItem &&
          (Number(estadoSeleccionado) === 13 ||
            Number(estadoSeleccionado) === 14) && (
            <Button
              label={cancelandoTemporada ? "Cancelando..." : "Cancelar Temporada"}
              icon={cancelandoTemporada ? "pi pi-spin pi-spinner" : "pi pi-ban"}
              className="p-button-danger"
              onClick={handleCancelarTemporada}
              disabled={cancelandoTemporada}
              loading={cancelandoTemporada}
              tooltip={
                cancelandoTemporada
                  ? "Procesando cancelación de temporada..."
                  : "Cancelar temporada de pesca"
              }
            />
          )}

        <Button
          label="Salir"
          icon="pi pi-times"
          outlined
          onClick={handleHide}
          disabled={iniciandoTemporada || finalizandoTemporada || cancelandoTemporada}
        />
        <Button
          label={isEdit ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          onClick={handleSubmit(handleFormSubmit)}
          loading={validandoSuperposicion}
          disabled={readOnly || iniciandoTemporada || finalizandoTemporada || cancelandoTemporada}
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
        limiteMaximoCapturaTn: editingItem.limiteMaximoCapturaTn || null,
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
        limiteMaximoCapturaTn: null,
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

  // Determinar si hay alguna operación en proceso
  const operacionEnProceso = iniciandoTemporada || finalizandoTemporada || cancelandoTemporada;

  return (
    <Dialog
      visible={visible}
      style={{ width: "1300px" }}
      headerStyle={{ display: "none" }}
      modal
      footer={dialogFooter}
      onHide={handleHide}
      className="p-fluid"
      closable={!operacionEnProceso}
    >
      <BlockUI blocked={operacionEnProceso} template={operacionEnProceso ? <ProgressSpinner /> : null}>
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
            readOnly={readOnly}
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
            readOnly={readOnly}
          />
        )}
        {activeCard === "entregas-a-rendir" && (
          <EntregasARendirTemporadaCard
            temporadaPescaId={editingItem?.id}
            temporadaPescaIniciada={
              editingItem?.temporadaPescaIniciada || false
            }
            empresaId={editingItem?.empresaId}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            tiposDocumento={tiposDocumento}
            onDataChange={onTemporadaDataChange}
            readOnly={readOnly}
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
      
      {/* Mensaje de operación en proceso */}
      {operacionEnProceso && (
        <div className="col-12 mt-3">
          <Message
            severity="info"
            text={
              iniciandoTemporada
                ? "Iniciando temporada, por favor espere. No cierre esta ventana."
                : finalizandoTemporada
                ? "Finalizando temporada, por favor espere. No cierre esta ventana."
                : "Cancelando temporada, por favor espere. No cierre esta ventana."
            }
            className="w-full"
          />
        </div>
      )}
      
      <Toast ref={toast} />
      </BlockUI>
    </Dialog>
  );
};

export default TemporadaPescaForm;
