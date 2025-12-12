/**
 * Formulario para gestión de Novedades de Pesca Consumo
 *
 * Características:
 * - Formulario con validaciones usando React Hook Form
 * - Sistema de Cards navegables como TemporadaPescaForm
 * - Combos relacionales con empresas, personal con cargo BAHIA COMERCIAL y estados
 * - Control de fechas de inicio y fin con validaciones
 * - Normalización de IDs numéricos según regla ERP Megui
 * - Integración de CRUD de FaenaPescaConsumo en DatosGeneralesNovedadForm
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
import {
  iniciarNovedadPescaConsumo,
  finalizarNovedadPescaConsumo,
  cancelarNovedadPescaConsumo,
} from "../../api/novedadPescaConsumo";
import { getEstadosMultiFuncionParaNovedadPescaConsumo } from "../../api/estadoMultiFuncion";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getAllBolicheRed } from "../../api/bolicheRed";
import { getPuertosPesca } from "../../api/puertoPesca";
import { getNovedadPescaConsumoPorId } from "../../api/novedadPescaConsumo";
// Importar componentes de cards
import DatosGeneralesNovedadForm from "./DatosGeneralesNovedadForm";
import EntregasARendirNovedadCard from "./EntregasARendirNovedadCard";
// Importar APIs adicionales
import { getPersonal } from "../../api/personal";
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { getEmpresas } from "../../api/empresa";
import ResolucionPDFNovedadForm from "./ResolucionPDFNovedadForm";

/**
 * Componente de formulario para novedades de pesca consumo
 * Implementa las reglas de validación y normalización del ERP Megui
 */
const NovedadPescaConsumoForm = ({
  visible,
  onHide,
  onSave,
  editingItem,
  empresas = [],
  tiposDocumento = [],
  onNovedadDataChange, // Callback para notificar cambios en datos de novedad
}) => {
  // Estados principales
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [bahiasComerciales, setBahiasComerciales] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [patrones, setPatrones] = useState([]);
  const [estadosNovedad, setEstadosNovedad] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [boliches, setBoliches] = useState([]);
  const [puertosPesca, setPuertosPesca] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [validandoSuperposicion, setValidandoSuperposicion] = useState(false);
  const [estadoDefaultId, setEstadoDefaultId] = useState(null);
  const [iniciandoNovedadPesca, setIniciandoNovedadPesca] = useState(false);
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
      estadoNovedadPescaConsumoId: null,
      nombre: "",
      numeroResolucion: "",
      fechaInicio: null,
      fechaFin: null,
      cuotaPropiaTon: null,
      cuotaAlquiladaTon: null,
      toneladasCapturadas: null,
      novedadPescaConsumoIniciada: false,
      urlResolucionPdf: "",
      referenciaExtra: "", // Incluir referenciaExtra en defaultValues
    },
  });

  // Cargar estados de novedad al montar
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const estadosData =
          await getEstadosMultiFuncionParaNovedadPescaConsumo();
        setEstadosNovedad(estadosData);

        // Buscar estado por defecto "EN ESPERA DE INICIO"
        const estadoDefault = estadosData.find(
          (estado) =>
            estado.descripcion === "EN ESPERA DE INICIO" &&
            Number(estado.tipoProvieneDeId) === 7 // NOVEDAD PESCA CONSUMO
        );

        if (estadoDefault) {
          setEstadoDefaultId(Number(estadoDefault.id));
        }
      } catch (error) {
        console.error("Error cargando estados:", error);
      }
    };

    cargarEstados();
  }, []);

  // Cargar catálogos al montar
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [
          embarcacionesRes,
          bolichesRes,
          puertosRes,
          personalRes,
          centrosRes,
          tiposMovRes,
          empresasRes,
        ] = await Promise.allSettled([
          getEmbarcaciones(),
          getAllBolicheRed(),
          getPuertosPesca(),
          getPersonal(),
          getCentrosCosto(),
          getAllTipoMovEntregaRendir(),
          getEmpresas(),
        ]);

        if (embarcacionesRes.status === "fulfilled") {
          setEmbarcaciones(
            embarcacionesRes.value.map((e) => ({
              label: e.activo?.descripcion || e.matricula,
              value: Number(e.id),
            }))
          );
        }
        if (bolichesRes.status === "fulfilled") {
          setBoliches(
            bolichesRes.value.map((b) => ({
              label: b.activo?.descripcion || b.descripcion,
              value: Number(b.id),
            }))
          );
        }
        if (puertosRes.status === "fulfilled") {
          setPuertosPesca(
            puertosRes.value.map((p) => ({
              label: p.nombre,
              value: Number(p.id),
            }))
          );
        }
        if (personalRes.status === "fulfilled") setPersonal(personalRes.value);
        if (centrosRes.status === "fulfilled")
          setCentrosCosto(centrosRes.value);
        if (tiposMovRes.status === "fulfilled")
          setTiposMovimiento(tiposMovRes.value);
        if (empresasRes.status === "fulfilled")
          setEmpresasList(empresasRes.value);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };

    cargarCatalogos();
  }, []);

  // Cargar personal por empresa
  useEffect(() => {
    const cargarPersonalPorEmpresa = async () => {
      try {
        const empresaId = editingItem?.empresaId || empresas[0]?.id || null;
        if (!empresaId) return;

        const [bahiasData, motoristasData, patronesData] = await Promise.all([
          getBahiasComerciales(Number(empresaId), "BAHIA COMERCIAL"),
          getMotoristas(Number(empresaId), "MOTORISTA EMBARCACION"),
          getPatrones(Number(empresaId), "PATRON EMBARCACION"),
        ]);

        setBahiasComerciales(
          bahiasData.map((p) => ({
            label: `${p.nombres} ${p.apellidos}`.trim(),
            value: Number(p.id),
          }))
        );
        setMotoristas(
          motoristasData.map((p) => ({
            label: `${p.nombres} ${p.apellidos}`.trim(),
            value: Number(p.id),
          }))
        );
        setPatrones(
          patronesData.map((p) => ({
            label: `${p.nombres} ${p.apellidos}`.trim(),
            value: Number(p.id),
          }))
        );
      } catch (error) {
        console.error("Error cargando personal:", error);
      }
    };

    if (editingItem?.empresaId || empresas.length > 0) {
      cargarPersonalPorEmpresa();
    }
  }, [editingItem, empresas]);

  // Manejar navegación entre cards
  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

// Manejar envío del formulario
const handleFormSubmit = async (data) => {
  try {
    const normalizedData = {
      ...data,
      id: data.id ? Number(data.id) : undefined,
      empresaId: Number(data.empresaId),
      BahiaId: Number(data.BahiaId),
      estadoNovedadPescaConsumoId: Number(data.estadoNovedadPescaConsumoId),
      cuotaPropiaTon: data.cuotaPropiaTon ? Number(data.cuotaPropiaTon) : null,
      cuotaAlquiladaTon: data.cuotaAlquiladaTon ? Number(data.cuotaAlquiladaTon) : null,
      // Asegurar que referenciaExtra se incluya si existe
      referenciaExtra: data.referenciaExtra || null,
    };

    await onSave(normalizedData);
  } catch (error) {
    console.error("Error guardando novedad:", error);
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: "Error al guardar la novedad",
      life: 3000,
    });
  }
};

  /**
   * Manejar inicio de novedad
   * Sistema profesional con loading state para evitar doble clic
   */
  const handleIniciarNovedad = () => {
    // Prevenir si ya está procesando
    if (iniciandoNovedadPesca) {
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de iniciar esta novedad de pesca? Esta acción creará los registros necesarios para faenas y entregas a rendir.",
      header: "Confirmar Inicio de Novedad",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-success",
      rejectClassName: "p-button-secondary",
      acceptLabel: "Sí, Iniciar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setIniciandoNovedadPesca(true);
        try {
          toast.current?.show({
            severity: "info",
            summary: "Procesando",
            detail: "Iniciando novedad de pesca, por favor espere...",
            life: 3000,
          });

          await iniciarNovedadPescaConsumo(editingItem.id);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Novedad de pesca iniciada correctamente",
            life: 3000,
          });

          // Notificar cambios al componente padre
          if (onNovedadDataChange) {
            const novedadActualizada = {
              ...editingItem,
              novedadPescaConsumoIniciada: true,
            };
            onNovedadDataChange(novedadActualizada);
          }

          // Disparar eventos para actualizar otros componentes
          window.dispatchEvent(
            new CustomEvent("refreshFaenasConsumo", {
              detail: { novedadId: editingItem.id },
            })
          );
        } catch (error) {
          console.error("Error iniciando novedad:", error);

          // Extraer el mensaje de error del backend
          let mensajeError = "Error al iniciar la novedad de pesca";

          if (error.response?.data?.message) {
            mensajeError = error.response.data.message;
          } else if (error.message) {
            mensajeError = error.message;
          }

          toast.current?.show({
            severity: "error",
            summary: "Error al Iniciar Novedad",
            detail: mensajeError,
            life: 5000,
          });
        } finally {
          setIniciandoNovedadPesca(false);
        }
      },
    });
  };

    /**
   * Manejar finalización de novedad
   */
    const handleFinalizarNovedad = () => {
      confirmDialog({
        message: "¿Está seguro de finalizar esta novedad de pesca? Esta acción cambiará el estado a FINALIZADA.",
        header: "Confirmar Finalización de Novedad",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-warning",
        rejectClassName: "p-button-secondary",
        acceptLabel: "Sí, Finalizar",
        rejectLabel: "Cancelar",
        accept: async () => {
          try {
            await finalizarNovedadPescaConsumo(editingItem.id);
  
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Novedad finalizada correctamente",
              life: 3000,
            });
  
            // Recargar datos actualizados
            const novedadActualizada = await getNovedadPescaConsumoPorId(editingItem.id);
            if (onNovedadDataChange && novedadActualizada) {
              onNovedadDataChange(novedadActualizada);
            }
          } catch (error) {
            console.error("Error finalizando novedad:", error);
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: "Error al finalizar la novedad",
              life: 3000,
            });
          }
        },
      });
    };
  
    /**
     * Manejar cancelación de novedad
     */
    const handleCancelarNovedad = () => {
      confirmDialog({
        message: "¿Está seguro de cancelar esta novedad de pesca? Esta acción cambiará el estado a CANCELADA.",
        header: "Confirmar Cancelación de Novedad",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        rejectClassName: "p-button-secondary",
        acceptLabel: "Sí, Cancelar",
        rejectLabel: "No",
        accept: async () => {
          try {
            await cancelarNovedadPescaConsumo(editingItem.id);
  
            toast.current?.show({
              severity: "warn",
              summary: "Novedad Cancelada",
              detail: "Novedad cancelada correctamente",
              life: 3000,
            });
  
            // Recargar datos actualizados
            const novedadActualizada = await getNovedadPescaConsumoPorId(editingItem.id);
            if (onNovedadDataChange && novedadActualizada) {
              onNovedadDataChange(novedadActualizada);
            }
          } catch (error) {
            console.error("Error cancelando novedad:", error);
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: "Error al cancelar la novedad",
              life: 3000,
            });
          }
        },
      });
    };

  // Verificar si la novedad ya fue iniciada
  const verificarNovedadIniciada = async (novedadId) => {
    try {
      const novedad = await getNovedadPescaConsumoPorId(novedadId);
      setTieneFaenas(novedad.novedadPescaConsumoIniciada || false);
    } catch (error) {
      console.error("Error verificando novedad iniciada:", error);
      setTieneFaenas(false);
    }
  };

  // Manejar cierre del diálogo
  const handleHide = () => {
    reset();
    setActiveCard("datos-generales");
    onHide();
  };

  // Footer del diálogo con botones de navegación y acciones
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
          tooltip="Novedad de Pesca y Detalle de Faenas"
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
          tooltip="Resolución Ministerial PDF"
          tooltipOptions={{ position: "top" }}
          className={
            activeCard === "resolucion-pdf"
              ? "p-button-help"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("resolucion-pdf")}
          type="button"
          size="small"
          disabled={!editingItem?.id}
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
          disabled={!editingItem?.id}
        />
      </div>

      {/* Botones de acción - lado derecho */}
      <div className="flex gap-2">
        {/* Botón Iniciar Novedad - Solo visible en estado EN ESPERA (23) */}
        {editingItem && Number(watch("estadoNovedadPescaConsumoId")) === 23 && (
          <Button
            label={iniciandoNovedadPesca ? "Iniciando..." : "Iniciar Novedad"}
            icon={iniciandoNovedadPesca ? "pi pi-spin pi-spinner" : "pi pi-play"}
            className="p-button-success"
            onClick={handleIniciarNovedad}
            disabled={
              editingItem?.novedadPescaConsumoIniciada || iniciandoNovedadPesca
            }
            loading={iniciandoNovedadPesca}
            type="button"
            size="small"
            tooltip={
              iniciandoNovedadPesca
                ? "Procesando inicio de novedad..."
                : editingItem?.novedadPescaConsumoIniciada
                ? "La novedad ya fue iniciada"
                : "Iniciar novedad de pesca"
            }
          />
        )}

        {/* Botón Finalizar Novedad - Solo visible en estado EN PROCESO (24) */}
        {editingItem && Number(watch("estadoNovedadPescaConsumoId")) === 24 && (
          <Button
            label="Finalizar Novedad"
            icon="pi pi-check-circle"
            className="p-button-warning"
            onClick={handleFinalizarNovedad}
            tooltip="Finalizar novedad de pesca"
            type="button"
            size="small"
          />
        )}

        {/* Botón Cancelar Novedad - Visible en estados EN ESPERA (23) o EN PROCESO (24) */}
        {editingItem &&
          (Number(watch("estadoNovedadPescaConsumoId")) === 23 ||
            Number(watch("estadoNovedadPescaConsumoId")) === 24) && (
            <Button
              label="Cancelar Novedad"
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={handleCancelarNovedad}
              tooltip="Cancelar novedad de pesca"
              type="button"
              size="small"
            />
          )}

        <Button
          label="Salir"
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
        id: Number(editingItem.id) || null,
        empresaId: Number(editingItem.empresaId) || null,
        BahiaId: Number(editingItem.BahiaId) || null,
        estadoNovedadPescaConsumoId:
          Number(editingItem.estadoNovedadPescaConsumoId) || estadoDefaultId,
        nombre: editingItem.nombre || "",
        numeroResolucion: editingItem.numeroResolucion || "",
        fechaInicio: editingItem.fechaInicio
          ? new Date(editingItem.fechaInicio)
          : null,
        fechaFin: editingItem.fechaFin ? new Date(editingItem.fechaFin) : null,
        cuotaPropiaTon: editingItem.cuotaPropiaTon || null,
        cuotaAlquiladaTon: editingItem.cuotaAlquiladaTon || null,
        toneladasCapturadas: editingItem.toneladasCapturadas || null,
        novedadPescaConsumoIniciada:
          editingItem.novedadPescaConsumoIniciada || false,
        urlResolucionPdf: editingItem.urlResolucionPdf || "",
        referenciaExtra: editingItem.referenciaExtra || "",
      });
    } else {
      reset({
        id: null,
        empresaId: null,
        BahiaId: null,
        estadoNovedadPescaConsumoId: Number(estadoDefaultId),
        nombre: "",
        numeroResolucion: "",
        fechaInicio: null,
        fechaFin: null,
        cuotaPropiaTon: null,
        cuotaAlquiladaTon: null,
        toneladasCapturadas: null,
        novedadPescaConsumoIniciada: false,
        urlResolucionPdf: "",
        referenciaExtra: "",
      });
    }
  }, [editingItem, reset, estadoDefaultId]);
  
  // Verificar si la novedad ya fue iniciada cuando editingItem cambie
  useEffect(() => {
    if (editingItem?.id) {
      verificarNovedadIniciada(editingItem.id);
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
      {/* Mostrar nombre de novedad con Tag */}
      <div className="flex justify-content-center mb-4">
        <Tag
          value={watch("nombre") || "Nueva Novedad de Pesca Consumo"}
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
          <DatosGeneralesNovedadForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            empresas={empresasList}
            bahiasComerciales={bahiasComerciales}
            motoristas={motoristas}
            patrones={patrones}
            estadosNovedad={estadosNovedad}
            empresaSeleccionada={empresaSeleccionada}
            defaultValues={getValues()}
            embarcaciones={embarcaciones}
            boliches={boliches}
            puertos={puertosPesca}
            novedadData={editingItem}
            onNovedadDataChange={onNovedadDataChange}
          />
        )}
        {activeCard === "resolucion-pdf" && (
          <ResolucionPDFNovedadForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={getValues()}
          />
        )}
        {activeCard === "entregas-a-rendir" && (
          <EntregasARendirNovedadCard
            novedadPescaConsumoId={editingItem?.id}
            novedadPescaConsumoIniciada={
              editingItem?.novedadPescaConsumoIniciada || false
            }
            empresaId={editingItem?.empresaId}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            tiposDocumento={tiposDocumento}
            onDataChange={onNovedadDataChange}
          />
        )}

        {/* Indicador de validación de superposición */}
        {validandoSuperposicion && (
          <div className="col-12">
            <Message
              severity="info"
              text="Validando superposición de fechas con otras novedades..."
              className="w-full"
            />
          </div>
        )}
      </form>
      <Toast ref={toast} />
    </Dialog>
  );
};

export default NovedadPescaConsumoForm;