/**
 * DetMovsRendicionGastosForm.jsx
 * Formulario para crear y editar registros de DetMovsEntregaRendir para Rendición de Gastos.
 * Implementa validaciones y sigue el patrón estándar MEGUI.
 * Aplica la regla crítica de usar Number() para comparaciones de IDs.
 */
import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import CrearEntidadComercialButton from "../shared/CrearEntidadComercialButton";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getModulos } from "../../api/moduloSistema";
import { Card } from "primereact/card";
import TipoMovimientoSelector from "../common/TipoMovimientoSelector";
import ModuloDocumentoSelector from "../common/ModuloDocumentoSelector";
import ProductoSelector from "../common/ProductoSelector";
import PdfDetMovRendicionGastosCard from "./PdfDetMovRendicionGastosCard";
import PdfComprobanteOperacionDetMovCard from "./PdfComprobanteOperacionDetMovCard";
import { formatearFechaHora, formatearNumero } from "../../utils/utils";
import DetGastosPlanificadosTable from "../detGastosPlanificados/DetGastosPlanificadosTable";
import { getGastosPlanificados } from "../../api/detGastosPlanificados";
import LiquidacionRendicionGastosCard from "./LiquidacionRendicionGastosCard";
import {
  obtenerTodasAsignacionesNoLiquidadas,
  obtenerValoresIniciales,
} from "../../api/detMovsEntregaRendir";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getDocumentosPorModelo } from "../../api/documentoDinamico";

const DetMovsRendicionGastosForm = ({
  movimiento = null,
  rendicionGastos = null,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  categorias = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  productos = [],
  empresas = [],
  movimientosAsignacionEntregaRendir = [],
  todosLosMovimientos = [], // NUEVO: todos los movimientos para calcular gastos
  onGuardadoExitoso,
  onCancelar,
  permisos = {},
  onEntidadComercialCreada,
}) => {
  const toast = useRef(null);
  console.log('📦 MOVIMIENTO RECIBIDO EN FORM (PROPS):', movimiento);
  console.log('📦 movimiento.saldoInicialAsignacion:', movimiento?.saldoInicialAsignacion);
  console.log('📦 movimiento.saldoFinalAsignacion:', movimiento?.saldoFinalAsignacion);
  const isEditing = !!movimiento;
  const { usuario } = useAuthStore();
  const [modulos, setModulos] = useState([]);
  const [cardActiva, setCardActiva] = useState("datos");
  const [gastosPlanificadosAsignacion, setGastosPlanificadosAsignacion] =
    useState([]);
  const [gastoPlanificadoSeleccionado, setGastoPlanificadoSeleccionado] =
    useState(null);
  const [asignacionesNoLiquidadas, setAsignacionesNoLiquidadas] = useState([]);
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [moduloDocumentoDialogVisible, setModuloDocumentoDialogVisible] =
    useState(false);
  const [moduloDocumentoSeleccionado, setModuloDocumentoSeleccionado] =
    useState(null);
  const [refreshEntidadesComerciales, setRefreshEntidadesComerciales] =
    useState(null);
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      empresaId: 1,
      moduloOrigenId: 2,
      documentoOrigenId: 37,
      responsableId: "",
      fechaMovimiento: new Date(),
      tipoMovimientoId: "",
      centroCostoId: "",
      monto: 0,
      monedaId: 1,
      descripcion: "",
      entidadComercialId: "",
      urlComprobanteMovimiento: "",
      validadoTesoreria: false,
      fechaValidacionTesoreria: null,
      operacionSinFactura: false,
      fechaOperacionMovCaja: null,
      operacionMovCajaId: null,
      moduloOrigenMovCajaId: 3,
      urlComprobanteOperacionMovCaja: "",
      tipoDocumentoId: "",
      numeroSerieComprobante: "",
      numeroCorrelativoComprobante: "",
      productoId: "",
      detalleGastosPlanificados: "",
      asignacionOrigenId: 0,
      formaParteCalculoLiquidacionTripulantes: false,
      formaParteCalculoEntregaARendir: false,
      formaParteCalculoLiqAlquilerCuota: false,
      entregaARendirLiquidada: false,
      fechaLiquidacionEntregaARendir: null,
      urlLiquidacionEntregaARendir: null,
      enlaceAOtroDetalleGastoId: null,
      embarcacionId: null,
      enlaceGastosPlanificadosId: null,
    },
  });
  const urlComprobanteMovimiento = watch("urlComprobanteMovimiento");
  const validadoTesoreria = watch("validadoTesoreria");
  const operacionSinFactura = watch("operacionSinFactura");
  const formaParteCalculoLiquidacionTripulantes = watch(
    "formaParteCalculoLiquidacionTripulantes",
  );
  const formaParteCalculoEntregaARendir = watch(
    "formaParteCalculoEntregaARendir",
  );
  const formaParteCalculoLiqAlquilerCuota = watch(
    "formaParteCalculoLiqAlquilerCuota",
  );
  const fechaOperacionMovCaja = watch("fechaOperacionMovCaja");
  const operacionMovCajaId = watch("operacionMovCajaId");
  const moduloOrigenMovCajaId = watch("moduloOrigenMovCajaId");
  const urlComprobanteOperacionMovCaja = watch(
    "urlComprobanteOperacionMovCaja",
  );
  const tipoMovimientoId = watch("tipoMovimientoId");
  const asignacionOrigenId = watch("asignacionOrigenId");

  // Helper para detectar si el tipo de movimiento es categoría 17 (Asignación)
  const esTipoMovimientoCategoria17 = () => {
    if (!tipoMovimientoId) return false;
    const tipoMovSeleccionado = tiposMovimiento.find(
      (t) => Number(t.id) === Number(tipoMovimientoId),
    );
    return (
      tipoMovSeleccionado && Number(tipoMovSeleccionado.categoriaId) === 17
    );
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      if (isEditing && movimiento) {
        reset({
          empresaId: movimiento.empresaId ? Number(movimiento.empresaId) : 1,
          moduloOrigenId: movimiento.moduloOrigenId
            ? Number(movimiento.moduloOrigenId)
            : 2,
          documentoOrigenId: movimiento.documentoOrigenId
            ? Number(movimiento.documentoOrigenId)
            : null,
          responsableId: movimiento.responsableId
            ? Number(movimiento.responsableId)
            : null,
          fechaMovimiento: movimiento.fechaMovimiento
            ? new Date(movimiento.fechaMovimiento)
            : new Date(),
          tipoMovimientoId: movimiento.tipoMovimientoId
            ? Number(movimiento.tipoMovimientoId)
            : null,
          centroCostoId: movimiento.centroCostoId
            ? Number(movimiento.centroCostoId)
            : null,
          monto: Number(movimiento.monto) || 0,
          monedaId: movimiento.monedaId ? Number(movimiento.monedaId) : null,
          descripcion: movimiento.descripcion || "",
          entidadComercialId: movimiento.entidadComercialId
            ? Number(movimiento.entidadComercialId)
            : null,
          urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento || "",
          validadoTesoreria: movimiento.validadoTesoreria ?? false,
          fechaValidacionTesoreria: movimiento.fechaValidacionTesoreria || null,
          operacionSinFactura: movimiento.operacionSinFactura ?? false,
          fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja
            ? new Date(movimiento.fechaOperacionMovCaja)
            : null,
          operacionMovCajaId: movimiento.operacionMovCajaId
            ? Number(movimiento.operacionMovCajaId)
            : null,
          moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId
            ? Number(movimiento.moduloOrigenMovCajaId)
            : 3,
          urlComprobanteOperacionMovCaja:
            movimiento.urlComprobanteOperacionMovCaja || "",
          tipoDocumentoId: movimiento.tipoDocumentoId
            ? Number(movimiento.tipoDocumentoId)
            : null,
          numeroSerieComprobante: movimiento.numeroSerieComprobante || "",
          numeroCorrelativoComprobante:
            movimiento.numeroCorrelativoComprobante || "",
          productoId: movimiento.productoId
            ? Number(movimiento.productoId)
            : null,
          detalleGastosPlanificados: movimiento.detalleGastosPlanificados || "",
          asignacionOrigenId: movimiento.asignacionOrigenId
            ? Number(movimiento.asignacionOrigenId)
            : null,
          formaParteCalculoLiquidacionTripulantes:
            movimiento.formaParteCalculoLiquidacionTripulantes ?? false,
          formaParteCalculoEntregaARendir:
            movimiento.formaParteCalculoEntregaARendir ?? false,
          formaParteCalculoLiqAlquilerCuota:
            movimiento.formaParteCalculoLiqAlquilerCuota ?? false,
          entregaARendirLiquidada: movimiento.entregaARendirLiquidada ?? false,
          fechaLiquidacionEntregaARendir:
            movimiento.fechaLiquidacionEntregaARendir || null,
          urlLiquidacionEntregaARendir:
            movimiento.urlLiquidacionEntregaARendir || "",
          embarcacionId: movimiento.embarcacionId
            ? Number(movimiento.embarcacionId)
            : null,
        });

        if (
          movimiento.moduloOrigenId &&
          movimiento.documentoOrigenId &&
          modulos.length > 0
        ) {
          try {
            const modulo = modulos.find(
              (m) => Number(m.id) === Number(movimiento.moduloOrigenId),
            );

            if (modulo && modulo.modeloDocumentoOrigen) {
              const response = await getDocumentosPorModelo(
                modulo.modeloDocumentoOrigen,
              );
              const { modulo: moduloInfo, config, documentos } = response;

              const documento = documentos.find(
                (d) => Number(d.id) === Number(movimiento.documentoOrigenId),
              );

              if (documento) {
                const getNestedValue = (obj, path) => {
                  if (!path) return null;
                  return path
                    .split(".")
                    .reduce((acc, part) => acc?.[part], obj);
                };

                setModuloDocumentoSeleccionado({
                  moduloId: Number(movimiento.moduloOrigenId),
                  documentoId: Number(movimiento.documentoOrigenId),
                  moduloNombre: moduloInfo.nombre,
                  documentoNumero: documento[config.campoNumero] || "N/A",
                  documentoFecha: documento[config.campoFecha] || null,
                  entidad: config.campoEntidad
                    ? getNestedValue(documento, config.campoEntidad)
                    : null,
                });
              }
            }
          } catch (error) {
            console.error("Error al cargar datos del módulo/documento:", error);
          }
        }
      } else {
        if (rendicionGastos) {
          setValue("empresaId", Number(rendicionGastos.empresaId) || 1);
          setValue("moduloOrigenId", 2);
          setValue("documentoOrigenId", 37);
        }

        if (modulos.length > 0) {
          const moduloId = 2;
          const documentoId = 37;

          try {
            const modulo = modulos.find(
              (m) => Number(m.id) === Number(moduloId),
            );

            if (modulo && modulo.modeloDocumentoOrigen) {
              const response = await getDocumentosPorModelo(
                modulo.modeloDocumentoOrigen,
              );
              const { modulo: moduloInfo, config, documentos } = response;

              const documento = documentos.find(
                (d) => Number(d.id) === Number(documentoId),
              );

              if (documento) {
                const getNestedValue = (obj, path) => {
                  if (!path) return null;
                  return path
                    .split(".")
                    .reduce((acc, part) => acc?.[part], obj);
                };

                setModuloDocumentoSeleccionado({
                  moduloId: Number(moduloId),
                  documentoId: Number(documentoId),
                  moduloNombre: moduloInfo.nombre,
                  documentoNumero: documento[config.campoNumero] || "N/A",
                  documentoFecha: documento[config.campoFecha] || null,
                  entidad: config.campoEntidad
                    ? getNestedValue(documento, config.campoEntidad)
                    : null,
                });
              }
            }
          } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
          }
        }

        setValue("fechaMovimiento", new Date());
        setValue("operacionSinFactura", true);  // ← AGREGAR: Preseleccionar S/COMPROBANTE

        if (usuario?.personalId) {
          setValue("responsableId", Number(usuario.personalId));

          // Autocompletar empresa y entidad comercial desde el personal del usuario
          const selectedPersonal = personal.find(
            (p) => Number(p.id) === Number(usuario.personalId),
          );

          if (selectedPersonal) {
            // Preseleccionar empresa
            if (selectedPersonal.empresaId) {
              setValue("empresaId", Number(selectedPersonal.empresaId));
            }

            // Preseleccionar entidad comercial desde Empresa.entidadComercialId
            if (
              selectedPersonal.empresa &&
              selectedPersonal.empresa.entidadComercialId
            ) {
              setValue(
                "entidadComercialId",
                Number(selectedPersonal.empresa.entidadComercialId),
              );
            }
          }
        }
      }
    };
    cargarDatosIniciales();
  }, [movimiento, isEditing]);

  useEffect(() => {
    const cargarModulos = async () => {
      try {
        const modulosData = await getModulos();
        setModulos(modulosData || []);
      } catch (error) {
        console.error("❌ [useEffect 2] ERROR al cargar módulos:", error);
        throw error;
      }
    };
    cargarModulos();
  }, []);

  useEffect(() => {
    try {
      const tipoMovSeleccionado = tiposMovimiento.find(
        (t) => Number(t.id) === Number(tipoMovimientoId),
      );

      if (
        tipoMovSeleccionado &&
        Number(tipoMovSeleccionado.categoriaId) === 17
      ) {
        setValue("formaParteCalculoEntregaARendir", true);
        setValue("asignacionOrigenId", null);
      }
    } catch (error) {
      console.error("❌ [useEffect 3] ERROR:", error);
      throw error;
    }
  }, [tipoMovimientoId, setValue, tiposMovimiento]);

  useEffect(() => {
    try {
      if (!isEditing && formaParteCalculoEntregaARendir === true) {
        setValue("operacionSinFactura", true);
        setValue("asignacionOrigenId", null);
      }
    } catch (error) {
      throw error;
    }
  }, [formaParteCalculoEntregaARendir, setValue, isEditing]);

  useEffect(() => {
    const cargarGastosPlanificados = async () => {
      if (asignacionOrigenId && asignacionOrigenId > 0) {
        try {
          const gastos = await getGastosPlanificados({
            detMovEntregaRendirTemporadaPescaId: asignacionOrigenId,
          });
          setGastosPlanificadosAsignacion(gastos);
        } catch (error) {
          setGastosPlanificadosAsignacion([]);
          throw error;
        }
      } else {
        setGastosPlanificadosAsignacion([]);
        if (!isEditing) {
          setGastoPlanificadoSeleccionado(null);
        }
      }
    };
    cargarGastosPlanificados();
  }, [asignacionOrigenId]);

  useEffect(() => {
    const cargarAsignaciones = async () => {
      try {
        const asignaciones = await obtenerTodasAsignacionesNoLiquidadas();
        setAsignacionesNoLiquidadas(asignaciones);
      } catch (error) {
        console.error("❌ [useEffect 6] ERROR al cargar asignaciones:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar las asignaciones",
          life: 3000,
        });
        throw error;
      }
    };
    cargarAsignaciones();
  }, []);

  useEffect(() => {
    const cargarValoresIniciales = async () => {
      if (!isEditing && rendicionGastos) {
        try {
          const valores = await obtenerValoresIniciales(
            "RENDICION_GASTOS",
            Number(rendicionGastos.id),
          );
          setValue(
            "enlaceAOtroDetalleGastoId",
            valores.enlaceAOtroDetalleGastoId,
          );

          if (valores.embarcacionId) {
            setValue("embarcacionId", valores.embarcacionId);
          }
        } catch (error) {
          throw error;
        }
      }
    };

    cargarValoresIniciales();
  }, [isEditing, rendicionGastos, setValue]);

  useEffect(() => {
    const cargarEmbarcaciones = async () => {
      try {
        const embarcacionesData = await getEmbarcaciones();
        setEmbarcaciones(embarcacionesData);
      } catch (error) {
        console.error("❌ [useEffect 8] ERROR al cargar embarcaciones:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar las embarcaciones",
          life: 3000,
        });
        throw error;
      }
    };
    cargarEmbarcaciones();
  }, []);

  useEffect(() => {
    try {
      if (asignacionOrigenId && asignacionOrigenId > 0) {
        const asignacionOrigen = movimientosAsignacionEntregaRendir.find(
          (mov) => Number(mov.id) === Number(asignacionOrigenId),
        );
        if (asignacionOrigen && asignacionOrigen.centroCostoId) {
          setValue("centroCostoId", Number(asignacionOrigen.centroCostoId));
        }
      }
    } catch (error) {
      throw error;
    }
  }, [asignacionOrigenId, movimientosAsignacionEntregaRendir, setValue]);

  const handleEntidadCreada = async (entidad) => {
    try {
      // ✅ PRIMERO: Recargar entidades comerciales (esperar a que termine)
      if (
        onEntidadComercialCreada &&
        typeof onEntidadComercialCreada === "function"
      ) {
        await onEntidadComercialCreada(entidad);
      }

      // ✅ SEGUNDO: Forzar recarga del selector con timestamp
      setRefreshEntidadesComerciales(Date.now());

      // ✅ TERCERO: Esperar un momento para que se actualice el selector
      await new Promise((resolve) => setTimeout(resolve, 300));

      // ✅ CUARTO: Auto-seleccionar la nueva entidad
      if (entidad && entidad.id) {
        const entidadIdNumber = Number(entidad.id);
        setValue("entidadComercialId", entidadIdNumber, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });

        // Mostrar mensaje de éxito
        if (toast && toast.current) {
          toast.current.show({
            severity: "success",
            summary: "Proveedor Creado",
            detail: `Proveedor "${entidad.razonSocial || entidad.nombre}" creado y seleccionado exitosamente.`,
            life: 3000,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error al crear entidad:", error);
      if (toast && toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al crear el proveedor",
          life: 3000,
        });
      }
    }
  };

  const personalOptions = personal.map((p) => ({
    label: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
    value: Number(p.id),
  }));

  const empresaOptions = empresas.map((e) => ({
    label: e.razonSocial || e.nombre || "N/A",
    value: Number(e.id),
  }));

  const centroCostoOptions = centrosCosto.map((cc) => ({
    label: cc.Codigo + " - " + cc.Nombre || "N/A",
    value: Number(cc.id),
  }));

  const monedaOptions = (monedas || []).map((m) => ({
    label: `${m.simbolo}`,
    value: Number(m.id),
  }));

  const tipoDocumentoOptions = tiposDocumento
    .filter((td) => td.esParaCompras === true || td.esParaVentas === true)
    .map((td) => ({
      label:
        td.activo === false ? `${td.descripcion} (INACTIVO)` : td.descripcion,
      value: Number(td.id),
    }));

  // Filtrar asignaciones: solo del responsable seleccionado y NO liquidadas
  const responsableIdSeleccionado = watch("responsableId");

  const asignacionOrigenOptions = (movimientosAsignacionEntregaRendir || [])
    .filter((mov) => {
      // Filtro 1: Solo del responsable seleccionado
      const esDelResponsable = responsableIdSeleccionado
        ? Number(mov.responsableId) === Number(responsableIdSeleccionado)
        : true;

      // Filtro 2: Solo asignaciones NO liquidadas
      // const noEstaLiquidada = !mov.entregaARendirLiquidada;

      // Filtro 3: Solo asignaciones principales (no gastos)
      const esAsignacionPrincipal =
        mov.formaParteCalculoEntregaARendir === true;

      return esDelResponsable && esAsignacionPrincipal;
    })
    .map((mov) => {
      // Calcular monto asignado
      const montoAsignado = Number(mov.monto || 0);

      // Calcular total de gastos asociados a esta asignación
      const gastosAsociados = (
        todosLosMovimientos ||
        movimientosAsignacionEntregaRendir ||
        []
      ).filter(
        (gasto) =>
          gasto.asignacionOrigenId &&
          Number(gasto.asignacionOrigenId) === Number(mov.id),
      );

      const totalGastos = gastosAsociados.reduce((sum, gasto) => {
        return sum + Number(gasto.monto || 0);
      }, 0);

      // Calcular saldo disponible REAL
      const saldoDisponible = montoAsignado - totalGastos;
      const porcentajeSaldo =
        montoAsignado > 0 ? (saldoDisponible / montoAsignado) * 100 : 0;

      // Determinar estado visual
      let estadoIcono = "🟢"; // Verde
      if (porcentajeSaldo <= 0) {
        estadoIcono = "⚪"; // Gris (sin saldo pero no liquidada)
      } else if (porcentajeSaldo < 40) {
        estadoIcono = "🟡"; // Amarillo
      }

      // Formato de fecha corta
      const fecha = mov.fechaMovimiento
        ? new Date(mov.fechaMovimiento).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
        : "S/F";

      return {
        label: `💰 MOV-${mov.id} • ${fecha} • ${mov.moneda?.simbolo || "S/."} ${formatearNumero(montoAsignado)} → ${estadoIcono} Saldo: ${mov.moneda?.simbolo || "S/."} ${formatearNumero(saldoDisponible)}`,
        value: Number(mov.id),
        saldoDisponible,
        porcentajeSaldo,
        totalGastos, // Para debug si es necesario
      };
    });

  const handleToggleOperacionSinFactura = () => {
    const valorActual = getValues("operacionSinFactura");
    setValue("operacionSinFactura", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Operación marcada como SIN FACTURA"
        : "Operación marcada como CON FACTURA",
      life: 2000,
    });
  };

  const handleToggleCalculoLiquidacion = () => {
    const valorActual = getValues("formaParteCalculoLiquidacionTripulantes");
    setValue("formaParteCalculoLiquidacionTripulantes", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de liquidación de tripulantes"
        : "Excluido de cálculo de liquidación de tripulantes",
      life: 2000,
    });
  };

  const handleToggleCalculoLiqAlquilerCuota = () => {
    const valorActual = getValues("formaParteCalculoLiqAlquilerCuota");
    setValue("formaParteCalculoLiqAlquilerCuota", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de liquidación alquiler cuota"
        : "Excluido de cálculo de liquidación alquiler cuota",
      life: 2000,
    });
  };

  const handleToggleCalculoEntrega = () => {
    const valorActual = getValues("formaParteCalculoEntregaARendir");
    setValue("formaParteCalculoEntregaARendir", !valorActual);

    toast.current?.show({
      severity: "info",
      summary: "Estado Actualizado",
      detail: !valorActual
        ? "Incluido en cálculo de entrega a rendir"
        : "Excluido de cálculo de entrega a rendir",
      life: 2000,
    });
  };

  const cargarDatosDesdeGastoPlanificado = (gastoId) => {
    const gasto = gastosPlanificadosAsignacion.find(
      (g) => Number(g.id) === Number(gastoId),
    );

    if (gasto) {
      const productoId = Number(gasto.productoId);
      const monedaId = Number(gasto.monedaId);
      const monto = Number(gasto.montoPlanificado);
      const descripcion = gasto.descripcion || "";

      setValue("productoId", productoId);
      setValue("monedaId", monedaId);
      setValue("monto", monto);
      setValue("descripcion", descripcion);
      setValue("enlaceGastosPlanificadosId", Number(gastoId));
      setGastoPlanificadoSeleccionado(gastoId);
    } else {
      console.error("❌ No se encontró el gasto con ID:", gastoId);
    }
  };
  const formatearLabelModuloDocumento = () => {
    if (!moduloDocumentoSeleccionado || !moduloDocumentoSeleccionado.moduloId) {
      return "Seleccionar Módulo y Documento";
    }

    const {
      moduloNombre,
      documentoId,
      documentoNumero,
      documentoFecha,
      entidad,
    } = moduloDocumentoSeleccionado;

    let label = `${moduloNombre} | ${documentoId}`;

    if (documentoNumero && documentoNumero !== "N/A") {
      label += ` - ${documentoNumero}`;
    }

    if (documentoFecha) {
      const fecha = new Date(documentoFecha);
      const fechaFormateada = fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      label += ` (${fechaFormateada})`;
    }

    if (entidad) {
      label += ` - ${entidad}`;
    }

    return label;
  };
  const handleModuloDocumentoSelect = (
    moduloId,
    documentoId,
    moduloData,
    documentoData,
  ) => {
    setValue("moduloOrigenId", moduloId);
    setValue("documentoOrigenId", documentoId);

    setModuloDocumentoSeleccionado({
      moduloId,
      documentoId,
      moduloNombre: moduloData?.nombre || "N/A",
      documentoNumero:
        documentoData?.numero ||
        documentoData?.nombre ||
        documentoData?.numeroDocumento ||
        documentoData?.numeroCompleto ||
        "N/A",
      documentoFecha:
        documentoData?.fecha ||
        documentoData?.fechaInicio ||
        documentoData?.fechaDocumento ||
        null,
      entidad: documentoData?.entidad || null,
    });

    setModuloDocumentoDialogVisible(false);
  };

  const onSubmit = async (data, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    try {
      if (!data.monto || data.monto <= 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "El monto debe ser mayor a cero",
          life: 3000,
        });
        return;
      }

      const datosNormalizados = {
        empresaId: Number(data.empresaId) || 1,
        moduloOrigenId: data.moduloOrigenId
          ? Number(data.moduloOrigenId)
          : null,
        documentoOrigenId: data.documentoOrigenId
          ? Number(data.documentoOrigenId)
          : null,
        responsableId: data.responsableId ? Number(data.responsableId) : null,
        tipoMovimientoId: data.tipoMovimientoId
          ? Number(data.tipoMovimientoId)
          : null,
        centroCostoId: data.centroCostoId ? Number(data.centroCostoId) : null,
        monto: Number(data.monto),
        monedaId: data.monedaId ? Number(data.monedaId) : 1,
        fechaMovimiento: data.fechaMovimiento,
        descripcion: data.descripcion ? data.descripcion.toUpperCase() : null,
        entidadComercialId: data.entidadComercialId
          ? Number(data.entidadComercialId)
          : null,
        urlComprobanteMovimiento: data.urlComprobanteMovimiento?.trim() || null,
        urlComprobanteOperacionMovCaja:
          data.urlComprobanteOperacionMovCaja?.trim() || null,
        validadoTesoreria: data.validadoTesoreria,
        fechaValidacionTesoreria: data.fechaValidacionTesoreria,
        operacionSinFactura: data.operacionSinFactura,
        fechaOperacionMovCaja: data.fechaOperacionMovCaja,
        operacionMovCajaId: data.operacionMovCajaId
          ? Number(data.operacionMovCajaId)
          : null,
        moduloOrigenMovCajaId: data.moduloOrigenMovCajaId
          ? Number(data.moduloOrigenMovCajaId)
          : null,
        tipoDocumentoId: data.tipoDocumentoId
          ? Number(data.tipoDocumentoId)
          : null,
        numeroSerieComprobante: data.numeroSerieComprobante?.trim() || null,
        numeroCorrelativoComprobante:
          data.numeroCorrelativoComprobante?.trim() || null,
        productoId: data.productoId ? Number(data.productoId) : null,
        detalleGastosPlanificados: data.detalleGastosPlanificados
          ? data.detalleGastosPlanificados.toUpperCase().trim()
          : null,
        asignacionOrigenId: data.asignacionOrigenId
          ? Number(data.asignacionOrigenId)
          : data.formaParteCalculoEntregaARendir === true
            ? 0
            : null,
        formaParteCalculoLiquidacionTripulantes:
          data.formaParteCalculoLiquidacionTripulantes,
        formaParteCalculoEntregaARendir: data.formaParteCalculoEntregaARendir,
        formaParteCalculoLiqAlquilerCuota:
          data.formaParteCalculoLiqAlquilerCuota,
        entregaARendirLiquidada: data.entregaARendirLiquidada,
        fechaLiquidacionEntregaARendir: data.fechaLiquidacionEntregaARendir,
        urlLiquidacionEntregaARendir: data.urlLiquidacionEntregaARendir,
        enlaceAOtroDetalleGastoId: data.enlaceAOtroDetalleGastoId
          ? Number(data.enlaceAOtroDetalleGastoId)
          : null,
        embarcacionId: data.embarcacionId ? Number(data.embarcacionId) : null,
        enlaceGastosPlanificadosId: data.enlaceGastosPlanificadosId
          ? Number(data.enlaceGastosPlanificadosId)
          : null,
        actualizadoEn: new Date(),
      };

      if (!isEditing) {
        datosNormalizados.creadoEn = new Date();
      }

      onGuardadoExitoso?.(datosNormalizados);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar los datos del formulario",
        life: 3000,
      });
    }
  };

  const formularioDeshabilitado = getValues("validadoTesoreria");

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      {cardActiva === "datos" && (
        <Card
          title="Datos Generales del Movimiento"
          className="mb-4"
          pt={{
            header: { className: "pb-0" },
            content: { className: "pt-2" },
          }}
        >
          <form>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="empresaId"
                  className="block text-900 font-medium mb-2"
                >
                  Empresa *
                </label>
                <Controller
                  name="empresaId"
                  control={control}
                  rules={{ required: "La empresa es obligatoria" }}
                  render={({ field }) => (
                    <Dropdown
                      id="empresaId"
                      {...field}
                      value={field.value}
                      options={empresaOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione empresa"
                      className={classNames({
                        "p-invalid": errors.empresaId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.empresaId && (
                  <Message severity="error" text={errors.empresaId.message} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Módulo y Documento Origen *
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <Button
                    type="button"
                    label={formatearLabelModuloDocumento()}
                    icon="pi pi-search"
                    onClick={() => setModuloDocumentoDialogVisible(true)}
                    disabled={formularioDeshabilitado}
                    style={{
                      justifyContent: "flex-start",
                      fontWeight: "bold",
                    }}
                    tooltip="Haz clic para ver detalles completos del módulo y documento"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
                {errors.moduloOrigenId && (
                  <Message
                    severity="error"
                    text={errors.moduloOrigenId.message}
                  />
                )}
              </div>
              <div style={{ flex: 0.8, position: "relative" }}>
                {watch("responsableId") &&
                  (() => {
                    const selectedPersonal = personal.find(
                      (p) => Number(p.id) === Number(watch("responsableId")),
                    );
                    const urlFoto = selectedPersonal?.urlFotoPersona
                      ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${selectedPersonal.urlFotoPersona}`
                      : "/default-avatar.png";

                    return (
                      <img
                        src={urlFoto}
                        alt="Responsable"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                        style={{
                          position: "absolute",
                          top: "-50px",
                          right: "0px",
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #dee2e6",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          zIndex: 10,
                        }}
                      />
                    );
                  })()}
                <label
                  htmlFor="fechaMovimiento"
                  className="block text-900 font-medium mb-2"
                >
                  Fecha del Movimiento *
                </label>
                <Controller
                  name="fechaMovimiento"
                  control={control}
                  rules={{ required: "La fecha es obligatoria" }}
                  render={({ field }) => (
                    <Calendar
                      id="fechaMovimiento"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      showIcon
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      placeholder="Seleccione fecha y hora"
                      className={classNames({
                        "p-invalid": errors.fechaMovimiento,
                      })}
                      inputStyle={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.fechaMovimiento && (
                  <Message
                    severity="error"
                    text={errors.fechaMovimiento.message}
                  />
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="responsableId"
                  className="block text-900 font-medium mb-2"
                >
                  Responsable *
                </label>
                <Controller
                  name="responsableId"
                  control={control}
                  rules={{ required: "El responsable es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="responsableId"
                      {...field}
                      value={field.value}
                      options={personalOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione responsable"
                      className={classNames({
                        "p-invalid": errors.responsableId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.responsableId && (
                  <Message
                    severity="error"
                    text={errors.responsableId.message}
                  />
                )}
              </div>
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Entrega a Rendir
                </label>
                <Button
                  type="button"
                  label={formaParteCalculoEntregaARendir ? "SI" : "NO"}
                  icon={
                    formaParteCalculoEntregaARendir
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoEntregaARendir
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoEntrega}
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Controller
                  name="tipoMovimientoId"
                  control={control}
                  rules={{ required: "El tipo de movimiento es obligatorio" }}
                  render={({ field }) => (
                    <TipoMovimientoSelector
                      tiposMovimiento={tiposMovimiento}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={formularioDeshabilitado}
                      required={true}
                      error={!!errors.tipoMovimientoId}
                      errorMessage={errors.tipoMovimientoId?.message}
                      placeholder="Buscar tipo de movimiento..."
                    />
                  )}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {formaParteCalculoEntregaARendir === true &&
                !esTipoMovimientoCategoria17() && (
                  <div style={{ flex: 1 }}>
                    <label>Asignación Origen</label>
                    <Controller
                      name="asignacionOrigenId"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id="asignacionOrigenId"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.value);
                            if (e.value > 0) {
                              setGastoPlanificadoSeleccionado(null);
                              setValue("enlaceGastosPlanificadosId", null);
                            }
                          }}
                          options={asignacionOrigenOptions}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Seleccione asignación origen"
                          showClear
                          filter
                          filterBy="label"
                          emptyMessage="No hay asignaciones disponibles"
                          emptyFilterMessage="No se encontraron asignaciones"
                          itemTemplate={(option) => {
                            if (!option) return null;

                            // Determinar color del saldo según porcentaje
                            let colorSaldo = "#2e7d32"; // Verde
                            if (option.porcentajeSaldo <= 0) {
                              colorSaldo = "#616161"; // Gris
                            } else if (option.porcentajeSaldo < 40) {
                              colorSaldo = "#856404"; // Amarillo oscuro
                            }

                            // Extraer partes del label
                            const partes = option.label.split("→");
                            const parteIzquierda = partes[0] || "";
                            const parteDerecha = partes[1] || "";

                            // Extraer código, fecha y monto de la parte izquierda
                            // Formato: "💰 MOV-234 • 07/05/26 • S/. 2,500.00 "
                            const partesIzq = parteIzquierda.split("•");
                            const codigoYFecha = partesIzq
                              .slice(0, 2)
                              .join("•")
                              .trim(); // "💰 MOV-234 • 07/05/26"
                            const montoTexto = partesIzq[2]?.trim() || ""; // "S/. 2,500.00"

                            // Determinar moneda y color de fondo del tag para el MONTO
                            const esUSD = montoTexto.includes("$");
                            const colorFondoTag = esUSD ? "#d4edda" : "#fff3cd"; // Verde claro para USD, Amarillo claro para PEN
                            const colorTextoTag = esUSD ? "#155724" : "#856404"; // Verde oscuro para USD, Amarillo oscuro para PEN
                            const colorBordeTag = esUSD ? "#28a745" : "#ffc107"; // Verde para USD, Amarillo para PEN

                            return (
                              <div
                                style={{
                                  padding: "0.25rem 0",
                                  fontSize: "0.95rem",
                                  lineHeight: "1.3",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span style={{ fontWeight: "normal" }}>
                                  {codigoYFecha} •
                                </span>
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    padding: "0.25rem 0.5rem",
                                    backgroundColor: colorFondoTag,
                                    color: colorTextoTag,
                                    border: `1px solid ${colorBordeTag}`,
                                    borderRadius: "4px",
                                    fontSize: "0.9rem",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {montoTexto}
                                </span>
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    color: colorSaldo,
                                  }}
                                >
                                  → {parteDerecha}
                                </span>
                              </div>
                            );
                          }}
                          valueTemplate={(option) => {
                            if (!option) return "Seleccione asignación origen";

                            // Extraer partes del label
                            const partes = option.label.split("→");
                            const parteIzquierda = partes[0] || "";
                            const parteDerecha = partes[1] || "";

                            // Extraer código, fecha y monto de la parte izquierda
                            const partesIzq = parteIzquierda.split("•");
                            const codigoYFecha = partesIzq
                              .slice(0, 2)
                              .join("•")
                              .trim();
                            const montoTexto = partesIzq[2]?.trim() || "";

                            // Determinar moneda y color de fondo del tag
                            const esUSD = montoTexto.includes("$");
                            const colorFondoTag = esUSD ? "#d4edda" : "#fff3cd";
                            const colorTextoTag = esUSD ? "#155724" : "#856404";
                            const colorBordeTag = esUSD ? "#28a745" : "#ffc107";

                            return (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span style={{ fontWeight: "normal" }}>
                                  {codigoYFecha} •
                                </span>
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    padding: "0.25rem 0.5rem",
                                    backgroundColor: colorFondoTag,
                                    color: colorTextoTag,
                                    border: `1px solid ${colorBordeTag}`,
                                    borderRadius: "4px",
                                    fontSize: "0.9rem",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {montoTexto}
                                </span>
                                <span style={{ fontWeight: "bold" }}>
                                  {parteDerecha}
                                </span>
                              </div>
                            );
                          }}
                          style={{ fontWeight: "bold" }}
                          disabled={
                            formularioDeshabilitado ||
                            !responsableIdSeleccionado
                          }
                          tooltip={
                            !responsableIdSeleccionado
                              ? "Primero seleccione un responsable"
                              : ""
                          }
                          tooltipOptions={{ position: "top" }}
                        />
                      )}
                    />
                  </div>
                )}

              {formaParteCalculoEntregaARendir === true &&
                asignacionOrigenId > 0 && (
                  <div style={{ flex: 1 }}>
                    <label>Gasto Planificado *</label>
                    <Dropdown
                      id="gastoPlanificadoId"
                      value={gastoPlanificadoSeleccionado}
                      options={gastosPlanificadosAsignacion.map((g) => ({
                        label: `${g.producto?.descripcionArmada || g.producto?.nombre || "N/A"} - ${g.moneda?.simbolo || ""} ${Number(g.montoPlanificado || 0).toFixed(2)}`,
                        value: Number(g.id),
                      }))}
                      onChange={(e) =>
                        cargarDatosDesdeGastoPlanificado(e.value)
                      }
                      placeholder="Seleccione gasto planificado"
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  </div>
                )}
            </div>

            {(formaParteCalculoEntregaARendir === false ||
              (formaParteCalculoEntregaARendir === true &&
                (asignacionOrigenId > 0 ||
                  !esTipoMovimientoCategoria17()))) && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: "0.5rem",
                    alignItems: "end",
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <Controller
                      name="entidadComercialId"
                      control={control}
                      rules={{ required: "La entidad comercial es obligatoria" }}
                      render={({ field }) => (
                        <EntidadComercialSelector
                          empresaIdPreseleccionada={watch("empresaId")}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          disabled={formularioDeshabilitado}
                          required={true}
                          error={!!errors.entidadComercialId}
                          errorMessage={errors.entidadComercialId?.message}
                          placeholder="Seleccione una entidad comercial"
                          refreshTrigger={refreshEntidadesComerciales}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 0.5 }}>
                    <CrearEntidadComercialButton
                      empresaId={getValues("empresaId")}
                      tipoEntidad="proveedor"
                      onEntidadCreada={handleEntidadCreada}
                      label="Crear Proveedor"
                      icon="pi pi-building"
                      severity="info"
                      outlined={true}
                      disabled={formularioDeshabilitado}
                      className="w-full mt-2"
                      toast={toast}
                    />
                  </div>

                  <div style={{ flex: 2 }}>
                    <Controller
                      name="productoId"
                      control={control}
                      render={({ field }) => (
                        <ProductoSelector
                          empresaIdPreseleccionada={watch("empresaId")}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          disabled={formularioDeshabilitado}
                          required={false}
                          error={!!errors.productoId}
                          errorMessage={errors.productoId?.message}
                          placeholder="Buscar producto (gasto)..."
                        />
                      )}
                    />
                  </div>
                </div>
              )}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label
                  htmlFor="centroCostoId"
                  className="block text-900 font-medium mb-2"
                >
                  Centro de Costo *
                </label>
                <Controller
                  name="centroCostoId"
                  control={control}
                  rules={{ required: "El centro de costo es obligatorio" }}
                  render={({ field }) => (
                    <Dropdown
                      id="centroCostoId"
                      {...field}
                      value={field.value}
                      options={centroCostoOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione centro de costo"
                      className={classNames({
                        "p-invalid": errors.centroCostoId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.centroCostoId && (
                  <Message
                    severity="error"
                    text={errors.centroCostoId.message}
                  />
                )}
              </div>

              <div style={{ flex: 3 }}>
                <label
                  htmlFor="descripcion"
                  className="block text-900 font-medium mb-2"
                >
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      rows={1}
                      placeholder="Ingrese una descripción del movimiento"
                      className={classNames({
                        "p-invalid": errors.descripcion,
                      })}
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        color: "red",
                      }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.descripcion && (
                  <Message severity="error" text={errors.descripcion.message} />
                )}
              </div>
              <div style={{ flex: 0.5 }}>
                <label
                  htmlFor="monedaId"
                  className="block text-900 font-medium mb-2"
                >
                  Moneda *
                </label>
                <Controller
                  name="monedaId"
                  control={control}
                  rules={{ required: "La moneda es obligatoria" }}
                  render={({ field }) => (
                    <Dropdown
                      id="monedaId"
                      {...field}
                      value={field.value}
                      options={monedaOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione moneda"
                      className={classNames({
                        "p-invalid": errors.monedaId,
                      })}
                      filter
                      showClear
                      style={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.monedaId && (
                  <Message severity="error" text={errors.monedaId.message} />
                )}
              </div>
              <div style={{ flex: 0.5 }}>
                <label
                  htmlFor="monto"
                  className="block text-900 font-medium mb-2"
                >
                  Monto *
                </label>
                <Controller
                  name="monto"
                  control={control}
                  rules={{
                    required: "El monto es obligatorio",
                    min: {
                      value: 0.01,
                      message: "El monto debe ser mayor a cero",
                    },
                  }}
                  render={({ field }) => (
                    <InputNumber
                      id="monto"
                      value={field.value || null}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      className={classNames({
                        "p-invalid": errors.monto,
                      })}
                      inputStyle={{ fontWeight: "bold" }}
                      disabled={formularioDeshabilitado}
                    />
                  )}
                />
                {errors.monto && (
                  <Message severity="error" text={errors.monto.message} />
                )}
              </div>
            </div>
            {formaParteCalculoEntregaARendir === true &&
              (!asignacionOrigenId || asignacionOrigenId === 0) && (
                <div style={{ marginTop: "1rem" }}>
                  {!movimiento?.id ? (
                    <Message
                      severity="info"
                      text="Debe guardar el movimiento primero para poder agregar gastos planificados"
                      style={{ marginTop: "1rem" }}
                    />
                  ) : (
                    <DetGastosPlanificadosTable
                      entregaRendirData={{
                        detMovEntregaRendirTemporadaPescaId: movimiento.id,
                      }}
                      monedaIdCabecera={watch("monedaId")}
                      toast={toast}
                      permisos={{
                        puedeCrear: true,
                        puedeEditar: true,
                        puedeEliminar: true,
                        puedeVer: true,
                      }}
                      readOnly={formularioDeshabilitado}
                    />
                  )}
                </div>
              )}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Validado Tesorería
                </label>
                <Button
                  type="button"
                  label={validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
                  icon={
                    validadoTesoreria ? "pi pi-check-circle" : "pi pi-clock"
                  }
                  className={
                    validadoTesoreria ? "p-button-primary" : "p-button-danger"
                  }
                  disabled
                  size="small"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Comprobante
                </label>
                <Button
                  type="button"
                  label={
                    operacionSinFactura ? "S/COMPROBANTE" : "C/COMPROBANTE"
                  }
                  icon={
                    operacionSinFactura
                      ? "pi pi-exclamation-triangle"
                      : "pi pi-check-circle"
                  }
                  className={
                    operacionSinFactura
                      ? "p-button-warning"
                      : "p-button-primary"
                  }
                  onClick={handleToggleOperacionSinFactura}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Liquidación Tripulantes
                </label>
                <Button
                  type="button"
                  label={
                    formaParteCalculoLiquidacionTripulantes
                      ? "INCLUIDO"
                      : "EXCLUIDO"
                  }
                  icon={
                    formaParteCalculoLiquidacionTripulantes
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoLiquidacionTripulantes
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoLiquidacion}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Liq. Alquiler Cuota
                </label>
                <Button
                  type="button"
                  label={
                    formaParteCalculoLiqAlquilerCuota ? "INCLUIDO" : "EXCLUIDO"
                  }
                  icon={
                    formaParteCalculoLiqAlquilerCuota
                      ? "pi pi-check-circle"
                      : "pi pi-times-circle"
                  }
                  className={
                    formaParteCalculoLiqAlquilerCuota
                      ? "p-button-success"
                      : "p-button-secondary"
                  }
                  onClick={handleToggleCalculoLiqAlquilerCuota}
                  size="small"
                  style={{ width: "100%" }}
                  disabled={formularioDeshabilitado}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="embarcacionId"
                  className="block text-900 font-medium mb-2"
                >
                  Embarcación
                </label>
                <Controller
                  name="embarcacionId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="embarcacionId"
                      {...field}
                      value={field.value}
                      options={embarcaciones.map((emb) => ({
                        label: emb.activo?.nombre || emb.matricula,
                        value: Number(emb.id),
                      }))}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione embarcación (opcional)"
                      filter
                      showClear
                      disabled={formularioDeshabilitado}
                      emptyMessage="No hay embarcaciones disponibles"
                    />
                  )}
                />
              </div>
            </div>
            {!operacionSinFactura && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: "0.5rem",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="tipoDocumentoId"
                    className="block text-900 font-medium mb-2"
                  >
                    Tipo Comprobante
                  </label>
                  <Controller
                    name="tipoDocumentoId"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="tipoDocumentoId"
                        {...field}
                        value={field.value}
                        options={tipoDocumentoOptions}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione tipo"
                        filter
                        showClear
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="numeroSerieComprobante"
                    className="block text-900 font-medium mb-2"
                  >
                    Serie
                  </label>
                  <Controller
                    name="numeroSerieComprobante"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroSerieComprobante"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value?.toUpperCase())
                        }
                        placeholder="Ej: F001"
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="numeroCorrelativoComprobante"
                    className="block text-900 font-medium mb-2"
                  >
                    Correlativo
                  </label>
                  <Controller
                    name="numeroCorrelativoComprobante"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="numeroCorrelativoComprobante"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Ej: 00001234"
                        style={{ fontWeight: "bold" }}
                        disabled={formularioDeshabilitado}
                      />
                    )}
                  />
                </div>
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: "0.5rem",
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha de Creación
                </label>
                <InputText
                  value={
                    movimiento?.creadoEn
                      ? new Date(movimiento.creadoEn).toLocaleString("es-PE")
                      : new Date().toLocaleString("es-PE")
                  }
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha Operación Mov. Caja
                </label>
                <Controller
                  name="fechaOperacionMovCaja"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      value={
                        field.value
                          ? new Date(field.value).toLocaleString("es-PE")
                          : ""
                      }
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  ID Operación Mov. Caja
                </label>
                <Controller
                  name="operacionMovCajaId"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      value={field.value ? field.value.toString() : ""}
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha de Validación
                </label>
                <Controller
                  name="fechaValidacionTesoreria"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toLocaleString("es-PE", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                          : ""
                      }
                      placeholder="Pendiente"
                      readOnly
                      disabled
                      className="p-inputtext-sm"
                    />
                  )}
                />
              </div>

              <div style={{ flex: 0.5 }}>
                <label className="block text-900 font-medium mb-2">
                  Última Actualización
                </label>
                <InputText
                  value={
                    movimiento?.actualizadoEn
                      ? new Date(movimiento.actualizadoEn).toLocaleString(
                        "es-PE",
                      )
                      : ""
                  }
                  readOnly
                  className="p-inputtext-sm"
                />
              </div>
            </div>
          </form>
        </Card>
      )}

      {cardActiva === "pdf" && (
        <PdfDetMovRendicionGastosCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={getValues()}
          detMovId={movimiento?.id}
          readOnly={false}
        />
      )}

      {cardActiva === "pdfOperacion" && (
        <PdfComprobanteOperacionDetMovCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={getValues()}
          detMovId={movimiento?.id}
          readOnly={false}
        />
      )}

      {cardActiva === "liquidacion" && (
        <>
          {console.log('🔥 MOVIMIENTO PASADO A CARD:', movimiento)}
          {console.log('🔥 movimiento.saldoInicialAsignacion:', movimiento?.saldoInicialAsignacion)}
          {console.log('🔥 movimiento.saldoFinalAsignacion:', movimiento?.saldoFinalAsignacion)}
          <LiquidacionRendicionGastosCard
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={getValues()}
            detMovId={movimiento?.id}
            readOnly={false}
            movimientoData={movimiento}
            onLiquidacionExitosa={async () => {
              if (movimiento?.id) {
                try {
                  const token = useAuthStore.getState().token;
                  const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir/${movimiento.id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  if (response.ok) {
                    const movimientoActualizado = await response.json();
                    setValue(
                      "saldoInicialAsignacion",
                      movimientoActualizado.saldoInicialAsignacion,
                    );
                    setValue(
                      "saldoFinalAsignacion",
                      movimientoActualizado.saldoFinalAsignacion,
                    );

                    toast.current?.show({
                      severity: "success",
                      summary: "Saldo Actualizado",
                      detail: `Saldo Final: ${movimientoActualizado.moneda?.simbolo || ""} ${Number(movimientoActualizado.saldoFinalAsignacion || 0).toFixed(2)}`,
                      life: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Error al recargar movimiento:", error);
                }
              }
            }}
            onGuardarMovimiento={() => handleSubmit(onSubmit)()}
            permisos={permisos}
          />
        </>
      )}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          alignItems: "center",
          marginTop: "0.5rem",
          justifyContent: "space-between",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            icon="pi pi-file-edit"
            className={
              cardActiva === "datos" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("datos")}
            size="small"
            tooltip="Datos Generales"
            raised
          />
          <Button
            icon="pi pi-file-pdf"
            className={
              cardActiva === "pdf" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdf")}
            size="small"
            tooltip="Comprobante PDF"
            raised
          />
          <Button
            icon="pi pi-receipt"
            className={
              cardActiva === "pdfOperacion"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("pdfOperacion")}
            size="small"
            tooltip="Comprobante Operación MovCaja"
            raised
          />
          {!getValues("asignacionOrigenId") &&
            getValues("formaParteCalculoEntregaARendir") && (
              <Button
                type="button"
                label="Liquidación"
                icon="pi pi-file-check"
                className={
                  cardActiva === "liquidacion"
                    ? "p-button-primary"
                    : "p-button-secondary"
                }
                onClick={() => setCardActiva("liquidacion")}
              />
            )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            label="Salir"
            icon="pi pi-times"
            className="p-button-warning"
            size="small"
            severity="warning"
            onClick={onCancelar}
          />
          <Button
            type="button"
            label={isEditing ? "Actualizar" : "Crear"}
            icon={isEditing ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            size="small"
            severity="success"
            onClick={handleSubmit(onSubmit)}
            disabled={formularioDeshabilitado}
          />
        </div>
      </div>
      {/* Modal de Selección de Módulo y Documento */}
      <ModuloDocumentoSelector
        visible={moduloDocumentoDialogVisible}
        initialModuloId={watch("moduloOrigenId") || 0}
        initialDocumentoId={watch("documentoOrigenId") || 0}
        onSelect={handleModuloDocumentoSelect}
        onCancel={() => setModuloDocumentoDialogVisible(false)}
        moduloLabel="Módulo Origen"
        documentoLabel="Documento Origen"
      />
    </div>
  );
};
export default DetMovsRendicionGastosForm;
