// src/components/deudaTributaria/DeudaTributariaForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import BooleanToggleButton from "../common/BooleanToggleButton"
import {
  getDeudaTributariaById,
} from "../../api/tesoreria/deudaTributaria";
import {
  getPagosDeudaTributariaByDeuda,
  createPagoDeudaTributaria,
  updatePagoDeudaTributaria,
  deletePagoDeudaTributaria,
} from "../../api/tesoreria/pagoDeudaTributaria";
import PagoDeudaTributariaDialog from "./PagoDeudaTributariaDialog";
import AsientoContableManager from "../common/AsientoContableManager";


// ════════════════════════════════════════════════════════════
// CONSTANTES DE CONFIGURACIÓN - DEUDAS TRIBUTARIAS
// ════════════════════════════════════════════════════════════

/**
 * ID del tipo "DEUDAS TRIBUTARIAS" en la tabla EstadoMultiFuncion
 * Se usa para filtrar solo los estados válidos para este módulo
 * Estados válidos:
 * - 120: PENDIENTE (danger)
 * - 121: PAGO PARCIAL (warning)
 * - 122: PAGADO (success)
 * - 123: VENCIDO (danger)
 * - 124: ANULADO (secondary)
 * - 125: CANJEADO (contrast)
 */
const TIPO_PROVIENE_DEUDAS_TRIBUTARIAS = 27;

/**
 * Estado por defecto para nuevas deudas tributarias
 * IMPORTANTE: Este ID corresponde al estado "PENDIENTE" en EstadoMultiFuncion
 * donde tipoProvieneDeId = 27 (DEUDAS TRIBUTARIAS)
 * 
 * Estados disponibles (tipoProvieneDeId = 27):
 * - 120: PENDIENTE (danger) ← DEFAULT
 * - 121: PAGO PARCIAL (warning)
 * - 122: PAGADO (success)
 * - 123: VENCIDO (danger)
 * - 124: ANULADO (secondary)
 * - 125: CANJEADO (contrast)
 */
const ESTADO_DEFAULT_PENDIENTE = 120;

/**
 * IDs de estados específicos para deudas tributarias
 */
const ESTADOS_DEUDA_TRIBUTARIA = {
  PENDIENTE: 120,      // Deuda sin pagos
  PAGO_PARCIAL: 121,   // Deuda con pagos parciales
  PAGADO: 122,         // Deuda totalmente pagada
  VENCIDO: 123,        // Deuda vencida sin pagar
  ANULADO: 124,        // Deuda anulada
  CANJEADO: 125,       // Deuda canjeada por otro documento
};

/**
 * Valores por defecto para montos
 */
const MONTO_DEFAULT = 0;

const DeudaTributariaForm = forwardRef((props, ref) => {
  const {
    isEdit,
    defaultValues,
    empresas,
    tiposDeuda,
    monedas,
    estados,
    periodosContables,
    mediosPago,
    empresaFija,
    onSubmit,
    onCancel,
    loading,
    readOnly,
    permisos,
    toast,
  } = props;

  const { usuario } = useAuthStore();
  // Estado único para todos los campos del formulario (patrón PreFactura)
  const [formData, setFormData] = useState({
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
        ? Number(empresaFija)
        : null,
    tipoDeudaId: defaultValues?.tipoDeudaId ? Number(defaultValues.tipoDeudaId) : null,
    periodo: defaultValues?.periodo || "",
    numeroDeclaracion: defaultValues?.numeroDeclaracion || "",
    fechaGeneracion: defaultValues?.fechaGeneracion ? new Date(defaultValues.fechaGeneracion) : new Date(),
    fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : new Date(),
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
    montoPagadoAnterior: defaultValues?.montoPagadoAnterior || MONTO_DEFAULT,
    montoOriginal: defaultValues?.montoOriginal || MONTO_DEFAULT,
    montoPagado: defaultValues?.montoPagado || MONTO_DEFAULT,
    saldoPendiente: defaultValues?.saldoPendiente || MONTO_DEFAULT,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : ESTADO_DEFAULT_PENDIENTE,
    observaciones: defaultValues?.observaciones || "",
    esSaldoInicial: defaultValues?.esSaldoInicial || false,
    fechaContable: defaultValues?.fechaContable ? new Date(defaultValues.fechaContable) : new Date(),
    periodoContableId: defaultValues?.periodoContableId ? Number(defaultValues.periodoContableId) : null,
    creadoPor: defaultValues?.creadoPor || null,
    actualizadoPor: defaultValues?.actualizadoPor || null,
  });

  // Función para actualizar campos individuales (patrón PreFactura)
  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Estados para CRUD de pagos
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [isEditPago, setIsEditPago] = useState(false);

  // Cargar pagos si es edición
  useEffect(() => {
    if (isEdit && defaultValues?.id) {
      cargarPagos();
    }
  }, [isEdit, defaultValues?.id]);

  // Filtrar períodos contables por empresa seleccionada
  const periodosContablesFiltrados = React.useMemo(() => {
    if (!periodosContables) return [];

    return periodosContables
      .filter((p) => {
        // Filtrar por empresa O incluir el periodo seleccionado actualmente
        const perteneceAEmpresa =
          Number(p.empresaId) === Number(formData.empresaId);
        const esPeriodoSeleccionado =
          formData.periodoContableId &&
          Number(p.id) === Number(formData.periodoContableId);

        return perteneceAEmpresa || esPeriodoSeleccionado;
      })
      .sort((a, b) => {
        // Ordenar por fecha de inicio descendente (más recientes primero)
        return new Date(b.fechaInicio) - new Date(a.fechaInicio);
      })
      .map((p) => {
        // Agregar indicador visual del estado
        let estadoLabel = "";
        const estadoId = Number(p.estadoId);

        // IDs de estados para PERIODO CONTABLE:
        // 73 = ABIERTO, 74 = CERRADO, 75 = BLOQUEADO
        if (estadoId === 73) {
          estadoLabel = "🟢 ABIERTO";
        } else if (estadoId === 74) {
          estadoLabel = "🔴 CERRADO";
        } else if (estadoId === 75) {
          estadoLabel = "🔒 BLOQUEADO";
        } else {
          estadoLabel = "⚪ SIN ESTADO";
        }

        return {
          label: `${p.nombrePeriodo} - ${estadoLabel}`,
          value: Number(p.id),
          estadoId: estadoId,
          disabled: estadoId !== 73 && !isEdit, // Deshabilitar si no está ABIERTO (solo en creación)
        };
      });
  }, [formData.empresaId, formData.periodoContableId, periodosContables, isEdit]);

  // Obtener color de moneda
  const getColorPorMoneda = () => {
    if (!formData.monedaId) return "#ffffff";
    const moneda = monedas?.find((m) => Number(m.id) === Number(formData.monedaId));
    return moneda?.colorFondo || "#ffffff";
  };

  const getColorPorMonedaPago = (monedaPagoId) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(monedaPagoId));
    return moneda?.colorFondo || "#ffffff";
  };

  // Recalcular montoPagado y saldoPendiente cuando cambien los pagos
  useEffect(() => {
    const totalPagado = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoPago || 0),
      0
    );
    onChange("montoPagado", totalPagado);
    onChange("saldoPendiente", Number(formData.montoOriginal) - totalPagado);
  }, [pagos, formData.montoOriginal]);

  // Calcular saldoPendiente cuando cambie montoOriginal, montoPagadoAnterior o pagos
  useEffect(() => {
    const totalPagadoSistema = pagos.reduce(
      (sum, pago) => sum + Number(pago.montoPago || 0),
      0
    );

    // Fórmula: Saldo = Original - Pagado Anterior - Pagado Sistema
    const nuevoSaldo =
      Number(formData.montoOriginal) -
      Number(formData.montoPagadoAnterior || 0) -
      totalPagadoSistema;

    if (nuevoSaldo !== formData.saldoPendiente) {
      onChange("saldoPendiente", nuevoSaldo);
    }

    // También actualizar montoPagado con el total del sistema
    if (totalPagadoSistema !== formData.montoPagado) {
      onChange("montoPagado", totalPagadoSistema);
    }
  }, [formData.montoOriginal, formData.montoPagadoAnterior, pagos]);

  // Calcular estado automáticamente según pagos y fecha de vencimiento
  useEffect(() => {
    // No calcular estado en modo edición si ya tiene un estado manual
    if (isEdit && formData.estadoId === ESTADOS_DEUDA_TRIBUTARIA.ANULADO) {
      return; // No cambiar estados ANULADO
    }

    const montoOriginal = Number(formData.montoOriginal || 0);
    const montoPagadoAnterior = Number(formData.montoPagadoAnterior || 0);
    const montoPagado = Number(formData.montoPagado || 0);
    const totalPagado = montoPagadoAnterior + montoPagado;
    const saldoPendiente = Number(formData.saldoPendiente || 0);
    const fechaVencimiento = formData.fechaVencimiento ? new Date(formData.fechaVencimiento) : null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

    let nuevoEstadoId = formData.estadoId;

    // 1. Si está totalmente pagado → PAGADO (prioridad máxima)
    if (montoOriginal > 0 && saldoPendiente <= 0) {
      nuevoEstadoId = ESTADOS_DEUDA_TRIBUTARIA.PAGADO;
    }
    // 2. Si está vencido y tiene saldo pendiente → VENCIDO (predomina sobre pago parcial)
    else if (fechaVencimiento && fechaVencimiento < hoy && saldoPendiente > 0) {
      nuevoEstadoId = ESTADOS_DEUDA_TRIBUTARIA.VENCIDO;
    }
    // 3. Si tiene pagos parciales y no está vencido → PAGO_PARCIAL
    else if (totalPagado > 0 && saldoPendiente > 0) {
      nuevoEstadoId = ESTADOS_DEUDA_TRIBUTARIA.PAGO_PARCIAL;
    }
    // 4. Si no tiene pagos y no está vencido → PENDIENTE
    else if (totalPagado === 0 && saldoPendiente > 0) {
      nuevoEstadoId = ESTADOS_DEUDA_TRIBUTARIA.PENDIENTE;
    }

    // Actualizar estado solo si cambió
    if (nuevoEstadoId !== formData.estadoId) {
      onChange("estadoId", nuevoEstadoId);
    }
  }, [
    formData.montoOriginal,
    formData.montoPagadoAnterior,
    formData.montoPagado,
    formData.saldoPendiente,
    formData.fechaVencimiento,
    isEdit,
  ]);

  const cargarPagos = async () => {
    try {
      setLoadingPagos(true);
      const data = await getPagosDeudaTributariaByDeuda(defaultValues.id);
      setPagos(data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los pagos",
        life: 3000,
      });
    } finally {
      setLoadingPagos(false);
    }
  };

  const recargarDeudaDesdeBackend = async () => {
    if (!isEdit || !defaultValues?.id) return;

    try {
      const deudaActualizada = await getDeudaTributariaById(defaultValues.id);
      onChange("montoOriginal", deudaActualizada.montoOriginal || 0);
      onChange("montoPagado", deudaActualizada.montoPagado || 0);
      onChange("saldoPendiente", deudaActualizada.saldoPendiente || 0);
      onChange("estadoId", deudaActualizada.estadoId || ESTADO_DEFAULT_PENDIENTE);
    } catch (error) {
      console.error("Error al recargar deuda desde backend:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    recargarDeudaDesdeBackend,
  }));

  const handleSubmit = () => {
    if (loading) return; // Prevenir múltiples clics

    const data = {
      empresaId: Number(formData.empresaId),
      tipoDeudaId: Number(formData.tipoDeudaId),
      moduloOrigenId: formData.moduloOrigenId ? Number(formData.moduloOrigenId) : null,
      origenId: formData.origenId ? Number(formData.origenId) : null,
      periodo: formData.periodo,
      fechaGeneracion: formData.fechaGeneracion,
      fechaVencimiento: formData.fechaVencimiento,
      numeroDeclaracion: formData.numeroDeclaracion || null,
      montoPagadoAnterior: Number(formData.montoPagadoAnterior) || MONTO_DEFAULT,
      montoOriginal: Number(formData.montoOriginal),
      montoPagado: Number(formData.montoPagado) || MONTO_DEFAULT,
      saldoPendiente: Number(formData.saldoPendiente),
      monedaId: Number(formData.monedaId),
      estadoId: Number(formData.estadoId),
      esSaldoInicial: formData.esSaldoInicial || false,
      fechaContable: formData.fechaContable || null,
      periodoContableId: formData.periodoContableId ? Number(formData.periodoContableId) : null,
      observaciones: formData.observaciones || null,
      creadoPor: isEdit ? formData.creadoPor : usuario?.personalId ? Number(usuario.personalId) : null,
      actualizadoPor: isEdit && usuario?.personalId ? Number(usuario.personalId) : null,
    };
    onSubmit(data);
  };


  /**
   * Callback antes de generar asiento contable
   * Valida que la deuda esté guardada y tenga los datos necesarios
   */
  const handleBeforeGenerateAsiento = async () => {
    if (!defaultValues?.id) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Debe guardar la deuda tributaria antes de generar el asiento contable.",
        life: 5000,
      });
      return false;
    }

    const deudaCompleta = await getDeudaTributariaById(defaultValues.id);

    if (!deudaCompleta) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la información completa de la deuda.",
        life: 5000,
      });
      return false;
    }

    // Validar que sea saldo inicial
    if (!deudaCompleta.esSaldoInicial) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Solo se pueden generar asientos para saldos iniciales por el momento.",
        life: 5000,
      });
      return false;
    }

    // Validar que tenga cuenta contable asociada
    if (!deudaCompleta.tipoDeuda?.cuentaContableId) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El tipo de deuda no tiene una cuenta contable asociada. Configure el tipo de deuda antes de generar el asiento.",
        life: 5000,
      });
      return false;
    }

    // Validar que tenga monto
    if (Number(deudaCompleta.montoOriginal) === 0) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "El monto de la deuda está en cero. Verifique los datos antes de generar el asiento.",
        life: 5000,
      });
      return false;
    }

    return true; // Continuar generación
  };

  const handleRegistrarPago = () => {
    setPagoSeleccionado(null);
    setIsEditPago(false);
    setShowPagoDialog(true);
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    setIsEditPago(true);
    setShowPagoDialog(true);
  };

  const handleEliminarPago = (pago) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el pago de ${formatearNumero(pago.montoPagado, 2)}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deletePagoDeudaTributaria(pago.id);
          toast?.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pago eliminado correctamente",
            life: 3000,
          });
          await cargarPagos();
          await recargarDeudaDesdeBackend();
        } catch (error) {
          console.error("Error al eliminar pago:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "No se pudo eliminar el pago",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSubmitPago = async (dataPago) => {
    try {
      if (isEditPago) {
        await updatePagoDeudaTributaria(pagoSeleccionado.id, dataPago);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoDeudaTributaria({
          ...dataPago,
          deudaTributariaId: Number(defaultValues.id),
        });
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }
      setShowPagoDialog(false);
      await cargarPagos();
      await recargarDeudaDesdeBackend();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "No se pudo guardar el pago",
        life: 3000,
      });
    }
  };

  // Templates para DataTable
  const montoTemplate = (rowData) => {
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {formatearNumero(rowData.montoPagado, 2)}
      </span>
    );
  };

  const monedaPagoTemplate = (rowData) => {
    const moneda = monedas?.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
    const codigo = moneda?.codigoSunat || "-";
    return (
      <span
        style={{
          backgroundColor: getColorPorMonedaPago(rowData.monedaPagoId),
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        {codigo}
      </span>
    );
  };

  const fechaPagoTemplate = (rowData) => {
    return rowData.fechaPago
      ? new Date(rowData.fechaPago).toLocaleDateString("es-PE")
      : "-";
  };

  const medioPagoTemplate = (rowData) => {
    const medio = mediosPago?.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.descripcion || "-";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => handleEditarPago(rowData)}
          disabled={readOnly || !permisos?.puedeEditar}
          tooltip="Editar pago"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleEliminarPago(rowData)}
          disabled={readOnly || !permisos?.puedeEliminar}
          tooltip="Eliminar pago"
        />
      </div>
    );
  };

  return (
    <>
      <TabView>
        {/* TAB 1: DATOS GENERALES */}
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <div className="p-fluid">

            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Empresa */}
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaId">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="empresaId"
                  value={formData.empresaId}
                  options={empresas?.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  })) || []}
                  onChange={(e) => onChange("empresaId", e.value)}
                  placeholder="Seleccione empresa"
                  filter
                  disabled={true}
                />
              </div>

              {/* Tipo Deuda */}
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoDeudaId">
                  Tipo de Deuda Tributaria <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="tipoDeudaId"
                  value={formData.tipoDeudaId}
                  options={tiposDeuda?.map((t) => ({
                    label: t.nombre,
                    value: Number(t.id),
                  })) || []}
                  onChange={(e) => onChange("tipoDeudaId", e.value)}
                  placeholder="Seleccione tipo de deuda"
                  filter
                  disabled={readOnly || loading}
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
              {/* Período */}
              <div style={{ flex: 1 }}>
                <label htmlFor="periodo">
                  Período <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="periodo"
                  value={formData.periodo}
                  onChange={(e) => onChange("periodo", e.target.value)}
                  placeholder="Ej: 202401, 2024-Q1"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Número Declaración */}
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroDeclaracion">Número de Declaración</label>
                <InputText
                  id="numeroDeclaracion"
                  value={formData.numeroDeclaracion}
                  onChange={(e) => onChange("numeroDeclaracion", e.target.value)}
                  placeholder="Ej: 001-2024-001"
                  disabled={readOnly || loading}
                />
              </div>

              {/* Fecha Generación */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaGeneracion">
                  Fecha Generación <span className="text-red-500">*</span>
                </label>
                <Calendar
                  id="fechaGeneracion"
                  value={formData.fechaGeneracion}
                  onChange={(e) => onChange("fechaGeneracion", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
                />
              </div>
              {/* Fecha Vencimiento */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaVencimiento">
                  Fecha Vencimiento <span className="text-red-500">*</span>
                </label>
                <Calendar
                  id="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={(e) => onChange("fechaVencimiento", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
                />
              </div>
              {/* Fecha Contable */}
              <div style={{ flex: 1 }}>
                <label htmlFor="fechaContable">
                  Fecha Contable
                </label>
                <Calendar
                  id="fechaContable"
                  value={formData.fechaContable}
                  onChange={(e) => onChange("fechaContable", e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={readOnly || loading}
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
              {/* Moneda */}
              <div style={{ flex: 1 }}>
                <label htmlFor="monedaId">
                  Moneda <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="monedaId"
                  value={formData.monedaId}
                  options={monedas?.map((m) => ({
                    label: m.codigoSunat,
                    value: Number(m.id),
                  })) || []}
                  onChange={(e) => onChange("monedaId", e.value)}
                  placeholder="Seleccione moneda"
                  disabled={readOnly || loading}
                />
              </div>
              {/* Monto Original */}
              <div style={{ flex: 1 }}>
                <label htmlFor="montoOriginal">
                  Monto Original <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="montoOriginal"
                  value={formData.montoOriginal}
                  onValueChange={(e) => onChange("montoOriginal", e.value || 0)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={readOnly || loading}
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>
              {/* Monto Pagado Anterior - Solo visible si es saldo inicial */}
              {formData.esSaldoInicial && (
                <div style={{ flex: 1 }}>
                  <label htmlFor="montoPagadoAnterior">
                    Pagado Anterior (Histórico) <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    id="montoPagadoAnterior"
                    value={formData.montoPagadoAnterior}
                    onValueChange={(e) => onChange("montoPagadoAnterior", e.value || 0)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    disabled={readOnly || loading}
                    style={{ backgroundColor: getColorPorMoneda() }}
                  />
                </div>
              )}
              {/* Monto Pagado - Siempre deshabilitado (se calcula automáticamente) */}
              <div style={{ flex: 1 }}>
                <label htmlFor="montoPagado">Monto Pagado</label>
                <InputNumber
                  id="montoPagado"
                  value={formData.montoPagado}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>
              {/* Saldo Pendiente */}
              <div style={{ flex: 1 }}>
                <label htmlFor="saldoPendiente">Saldo Pendiente</label>
                <InputNumber
                  id="saldoPendiente"
                  value={formData.saldoPendiente}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  style={{ backgroundColor: getColorPorMoneda() }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Estado */}
              <div style={{ flex: 1 }}>
                <label htmlFor="estadoId">Estado</label>
                <Dropdown
                  id="estadoId"
                  value={formData.estadoId}
                  options={estados
                    .filter((e) => Number(e.tipoProvieneDeId) === TIPO_PROVIENE_DEUDAS_TRIBUTARIAS)
                    .map((e) => ({
                      label: e.descripcion,
                      value: Number(e.id),
                    }))}
                  onChange={(e) => onChange("estadoId", e.value)}
                  placeholder="Estado (automático)"
                  disabled={true}
                />
              </div>

              {/* Período Contable */}
              <div style={{ flex: 1 }}>
                <label htmlFor="periodoContableId">Período Contable</label>
                <Dropdown
                  id="periodoContableId"
                  value={formData.periodoContableId}
                  options={periodosContablesFiltrados || []}
                  optionDisabled={(option) => option.disabled}
                  onChange={(e) => onChange("periodoContableId", e.value)}
                  placeholder="Seleccione período"
                  filter
                  showClear
                  disabled={readOnly || loading}
                />
              </div>
              {/* Checkboxes */}
              {/* Saldo Inicial */}
              <div style={{ flex: 1 }}>
                <BooleanToggleButton
                  value={formData.esSaldoInicial}
                  onChange={(val) => onChange("esSaldoInicial", val)}
                  labelTrue="SALDO INICIAL"
                  labelFalse="DEUDA NUEVA"
                  severityTrue="primary"
                  severityFalse="secondary"
                  size="large"
                  disabled={readOnly || loading}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Observaciones */}
              <div style={{ flex: 1 }}>
                <label htmlFor="observaciones">Observaciones</label>
                <InputTextarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => onChange("observaciones", e.target.value)}
                  rows={2}
                  disabled={readOnly || loading}
                />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <Button
              label="Registrar Pago"
              icon="pi pi-plus"
              className="p-button-success"
              type="button"
              onClick={handleRegistrarPago}
              disabled={readOnly || !permisos?.puedeCrear || loading}
            />
          </div>

          <DataTable
            value={pagos}
            loading={loadingPagos}
            emptyMessage="No hay pagos registrados"
            size="small"
            stripedRows
            showGridlines
          >
            <Column field="id" header="ID" style={{ width: "80px" }} />
            <Column header="Fecha Pago" body={fechaPagoTemplate} />
            <Column header="Medio Pago" body={medioPagoTemplate} />
            <Column header="Moneda Pago" body={monedaPagoTemplate} />
            <Column header="Monto Pagado" body={montoTemplate} />
            <Column field="numeroOperacion" header="N° Operación" />
            <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
          </DataTable>
        </TabPanel>
      </TabView>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Componente genérico de asientos contables */}
        {isEdit && defaultValues?.id && (
          <div style={{ marginTop: "1rem" }}>
            <AsientoContableManager
              documentoId={defaultValues.id}
              documentoTipo="DeudaTributaria"
              empresaId={formData.empresaId}
              periodoContableId={formData.periodoContableId}
              showAsButton={true}
              onBeforeGenerate={handleBeforeGenerateAsiento}
            />
          </div>
        )}
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-warning"
          onClick={onCancel}
          disabled={loading}
          outlined
        />
        <Button
          type="button"
          label={isEdit ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={loading}
          disabled={readOnly || loading}
        />
      </div>



      {/* Dialog para pagos */}
      <Dialog
        visible={showPagoDialog}
        style={{ width: "600px" }}
        header={isEditPago ? "Editar Pago" : "Registrar Pago"}
        modal
        onHide={() => setShowPagoDialog(false)}
      >
        <PagoDeudaTributariaDialog
          pago={pagoSeleccionado}
          deudaId={defaultValues?.id}
          monedaDeudaId={formData.monedaId}
          saldoPendiente={formData.saldoPendiente}
          monedas={monedas}
          mediosPago={mediosPago}
          onSubmit={handleSubmitPago}
          onCancel={() => setShowPagoDialog(false)}
        />
      </Dialog>
      <ConfirmDialog />

    </>
  );
});

export default DeudaTributariaForm;