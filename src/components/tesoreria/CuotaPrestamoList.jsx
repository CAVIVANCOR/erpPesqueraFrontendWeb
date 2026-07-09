import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import {
  getCuotasPorPrestamo,
  deleteCuotaPrestamo,
  generarCronogramaCuotas,
  guardarCuotasBulk,
  marcarCuotaSaldoInicial,
  updateCuotaPrestamo,
} from "../../api/tesoreria/cuotaPrestamo";
import { getResponsiveFontSize, ESTADO_CUOTA_PRESTAMO } from "../../utils/utils";
import { getEstadosMultiFuncionPorTipoProvieneDe } from "../../api/estadoMultiFuncion";
import BooleanToggleButton from "../common/BooleanToggleButton";
import CuotaPrestamoForm from "./CuotaPrestamoForm";
// Estilos para celdas editables
const editableCellStyle = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #90caf9',
  cursor: 'pointer'
};

/**
 * Método BBVA/Interbank: Sistema Francés con días reales y TEA
 * Fórmula: i = (1 + TEA)^(dias/360) - 1
 */
function calcularCuotasSistemaFrancesDiasReales(cuotasArray, TEA, cuotaFija) {
  for (let i = 1; i < cuotasArray.length; i++) {
    // Saldo anterior
    const saldoAnterior = parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);
    cuotasArray[i].saldoCapitalAntes = saldoAnterior;

    // Calcular días entre fechas
    const fechaAnterior = new Date(cuotasArray[i - 1].fechaVencimiento);
    const fechaActual = new Date(cuotasArray[i].fechaVencimiento);
    const dias = Math.round((fechaActual - fechaAnterior) / (1000 * 60 * 60 * 24));

    // Tasa del período: i = (1 + TEA)^(dias/360) - 1
    const tasaPeriodo = Math.pow(1 + TEA, dias / 360) - 1;

    // Interés = Saldo × tasa del período
    let interes = saldoAnterior * tasaPeriodo;
    interes = Number(interes.toFixed(2)); // Redondeo bancario

    // Capital = Cuota fija - Interés
    let capital = cuotaFija - interes - parseFloat(cuotasArray[i].montoComision || 0) - parseFloat(cuotasArray[i].montoSeguro || 0);
    capital = Number(capital.toFixed(2));

    // Asignar valores
    cuotasArray[i].montoInteres = interes;
    cuotasArray[i].montoCapital = capital;
    cuotasArray[i].saldoCapitalDespues = Number((saldoAnterior - capital).toFixed(2));
    cuotasArray[i].montoTotal = Number((capital + interes + parseFloat(cuotasArray[i].montoComision || 0) + parseFloat(cuotasArray[i].montoSeguro || 0)).toFixed(2));
  }
}

/**
 * Método Genérico: Tasa mensual fija (sin días reales)
 * Fórmula: i = Saldo × (TNA / 12)
 */
function calcularCuotasTasaMensualFija(cuotasArray, tasaMensual, cuotaFija) {
  for (let i = 1; i < cuotasArray.length; i++) {
    // Saldo anterior
    const saldoAnterior = parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);
    cuotasArray[i].saldoCapitalAntes = saldoAnterior;

    // Interés = Saldo × tasa mensual
    const interes = Number((saldoAnterior * tasaMensual).toFixed(2));

    // Capital = Cuota fija - Interés
    const capital = Number((cuotaFija - interes - parseFloat(cuotasArray[i].montoComision || 0) - parseFloat(cuotasArray[i].montoSeguro || 0)).toFixed(2));

    // Asignar valores
    cuotasArray[i].montoInteres = interes;
    cuotasArray[i].montoCapital = capital;
    cuotasArray[i].saldoCapitalDespues = Number((saldoAnterior - capital).toFixed(2));
    cuotasArray[i].montoTotal = Number((capital + interes + parseFloat(cuotasArray[i].montoComision || 0) + parseFloat(cuotasArray[i].montoSeguro || 0)).toFixed(2));
  }
}



export default function CuotaPrestamoList({
  prestamoBancarioId,
  prestamo,
  readOnly = false,
  onCuotasChanged,
}) {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [estadosCuota, setEstadosCuota] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState(null);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDateCell, setSelectedDateCell] = useState(null);
  const [tempDate, setTempDate] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    if (prestamoBancarioId) {
      cargarCuotas();
      cargarEstados();
    }
  }, [prestamoBancarioId]);

  const cargarEstados = async () => {
    try {
      const estados = await getEstadosMultiFuncionPorTipoProvieneDe(31);
      setEstadosCuota(estados);
    } catch (error) {
      console.error("Error al cargar estados:", error);
    }
  };

  const cargarCuotas = async () => {
    try {
      setLoading(true);
      const data = await getCuotasPorPrestamo(prestamoBancarioId);
      if (data && data.length > 0) {
        setCuotas(data);
      } else {
        await handleGenerarCronograma();
      }
    } catch (error) {
      console.error("Error al cargar cuotas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarSaldoInicial = (cuota) => {
    confirmDialog({
      message: `¿Marcar cuota #${cuota.numeroCuota} como Historico?\n\nEsta acción:\n• Marcará la cuota como pagada el 31/12/2025\n• Actualizará los saldos del préstamo\n• No se puede deshacer fácilmente`,
      header: "Confirmar Historico",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Confirmar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          setLoading(true);
          await marcarCuotaSaldoInicial(cuota.id);
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: `Cuota #${cuota.numeroCuota} marcada como Historico`,
            life: 3000,
          });
          await cargarCuotas();

          // Notificar al padre que las cuotas cambiaron
          if (onCuotasChanged) {
            onCuotasChanged();
          }
        } catch (error) {
          console.error("Error al marcar Historico:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Error al marcar Historico",
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };


  const handleEdit = (cuota) => {
    setSelectedCuota(cuota);
    setShowEditDialog(true);
  };

  const handleUpdateCuota = async (data) => {
    try {
      setLoading(true);
      await updateCuotaPrestamo(selectedCuota.id, data);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuota actualizada correctamente",
        life: 3000,
      });
      setShowEditDialog(false);
      setSelectedCuota(null);
      await cargarCuotas();

      // Notificar al padre que las cuotas cambiaron
      if (onCuotasChanged) {
        onCuotasChanged();
      }
    } catch (error) {
      console.error("Error al actualizar cuota:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al actualizar cuota",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleGenerarCronograma = async () => {
    try {
      setLoading(true);
      const data = await generarCronogramaCuotas(prestamoBancarioId);
      setCuotas(data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cronograma generado: ${data.length} cuotas`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al generar cronograma:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al generar cronograma",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRegenerarDesdeCuota = async (numeroCuota) => {
    try {
      setLoading(true);

      const cuotasArray = [...cuotas];
      const index = cuotasArray.findIndex(c => c.numeroCuota === numeroCuota);

      if (index === -1) return;

      // Recalcular desde esta cuota hacia adelante
      for (let i = index; i < cuotasArray.length; i++) {
        // Calcular saldo antes
        const saldoAnterior = i === 0
          ? parseFloat(prestamo?.montoDesembolsado || 0)
          : parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);

        cuotasArray[i].saldoCapitalAntes = saldoAnterior;

        // Si NO fue editado manualmente, recalcular capital
        if (!cuotasArray[i].capitalEditadoManualmente) {
          // Calcular cuota fija (sistema francés)
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          const n = cuotasArray.length;
          const cuotaFija = parseFloat(prestamo?.montoDesembolsado || 0) *
            (tasaMensual * Math.pow(1 + tasaMensual, n)) /
            (Math.pow(1 + tasaMensual, n) - 1);

          const interesCuota = saldoAnterior * tasaMensual;
          cuotasArray[i].montoCapital = cuotaFija - interesCuota;
        }

        // Si NO fue editado manualmente, recalcular interés
        if (!cuotasArray[i].interesEditadoManualmente) {
          const tasaMensual = prestamo?.tasaInteresEfectiva
            ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
            : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

          cuotasArray[i].montoInteres = saldoAnterior * tasaMensual;
        }

        // Recalcular saldo después
        cuotasArray[i].saldoCapitalDespues = saldoAnterior - parseFloat(cuotasArray[i].montoCapital || 0);

        // Recalcular total
        cuotasArray[i].montoTotal =
          parseFloat(cuotasArray[i].montoCapital || 0) +
          parseFloat(cuotasArray[i].montoInteres || 0) +
          parseFloat(cuotasArray[i].montoComision || 0) +
          parseFloat(cuotasArray[i].montoSeguro || 0);
      }

      setCuotas([...cuotasArray]);

      // Guardar
      await guardarCuotasBulk(prestamoBancarioId, cuotasArray);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cuotas regeneradas desde la ${numeroCuota}`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al regenerar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al regenerar cuotas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarCalculos = async () => {
    if (!cuotas || cuotas.length < 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay cuotas para completar cálculos",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const cuotasArray = [...cuotas];

      // ✅ PRIMERO: Recalcular saldo después de la cuota 1
      const saldoInicial = parseFloat(cuotasArray[0].saldoCapitalAntes || 0);
      cuotasArray[0].saldoCapitalDespues = saldoInicial - parseFloat(cuotasArray[0].montoCapital || 0);

      // ✅ Obtener cuota fija de la cuota 1
      const cuotaFija = parseFloat(cuotasArray[0].montoTotal || 0);

      // ✅ Obtener datos del préstamo
      const TEA = parseFloat(prestamo?.tasaInteresAnual || 0) / 100;
      const nombreBanco = prestamo?.banco?.nombre?.toUpperCase() || "";

      // ✅ Si solo hay 1 cuota, calcular interés por días
      if (cuotasArray.length === 1) {

        // Calcular días desde desembolso hasta vencimiento
        const fechaDesembolso = new Date(prestamo?.fechaDesembolso);
        const fechaVencimiento = new Date(cuotasArray[0].fechaVencimiento);
        const dias = Math.round((fechaVencimiento - fechaDesembolso) / (1000 * 60 * 60 * 24));

        // Tasa del período: i = (1 + TEA)^(dias/360) - 1
        const tasaPeriodo = Math.pow(1 + TEA, dias / 360) - 1;

        // Interés = Capital × tasa del período
        const capital = parseFloat(cuotasArray[0].saldoCapitalAntes || 0);
        const interes = Number((capital * tasaPeriodo).toFixed(2));
        // Actualizar cuota
        cuotasArray[0].montoInteres = interes;
        cuotasArray[0].montoCapital = capital;
        cuotasArray[0].montoTotal = Number((capital + interes + parseFloat(cuotasArray[0].montoComision || 0) + parseFloat(cuotasArray[0].montoSeguro || 0)).toFixed(2));
        cuotasArray[0].saldoCapitalDespues = 0;
      } else {
        // ✅ Seleccionar método de cálculo según el banco
        if (nombreBanco.includes("BBVA") || nombreBanco.includes("INTERBANK")) {
          calcularCuotasSistemaFrancesDiasReales(cuotasArray, TEA, cuotaFija);
        } else {
          // Método genérico: calcular tasa mensual desde cuota 1
          const saldoCuota1 = parseFloat(cuotasArray[0].saldoCapitalAntes || 0);
          const interesCuota1 = parseFloat(cuotasArray[0].montoInteres || 0);
          const tasaMensual = interesCuota1 / saldoCuota1;
          calcularCuotasTasaMensualFija(cuotasArray, tasaMensual, cuotaFija);
        }
      }

      // Actualizar estado primero
      setCuotas([...cuotasArray]);

      // Guardar en BD
      await guardarCuotasBulk(prestamoBancarioId, cuotasArray);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cálculos completados y guardados correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error al completar cálculos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al completar cálculos",
        life: 3000,
      });
      await cargarCuotas();
    } finally {
      setLoading(false);
    }
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;
    const cuotasArray = [...cuotas];
    const index = cuotasArray.findIndex((c) => c.numeroCuota === rowData.numeroCuota);

    if (index === -1) {
      event.preventDefault();
      return;
    }


    if (field === "fechaVencimiento") {
      cuotasArray[index][field] = newValue;
      cuotasArray[index].fechaEditadaManualmente = true;
    } else {
      // CONVERTIR A NÚMERO - NUNCA STRINGS
      const valor = parseFloat(newValue) || 0;
      cuotasArray[index][field] = valor;

      // Marcar como editado manualmente
      if (field === "montoCapital") {
        cuotasArray[index].capitalEditadoManualmente = true;
      } else if (field === "montoInteres") {
        cuotasArray[index].interesEditadoManualmente = true;
      } else if (field === "montoComision") {
        cuotasArray[index].comisionEditadaManualmente = true;
      } else if (field === "montoSeguro") {
        cuotasArray[index].seguroEditadoManualmente = true;
      }

      // RECALCULAR TOTAL - SIEMPRE CON NÚMEROS
      const nuevoTotal =
        parseFloat(cuotasArray[index].montoCapital || 0) +
        parseFloat(cuotasArray[index].montoInteres || 0) +
        parseFloat(cuotasArray[index].montoComision || 0) +
        parseFloat(cuotasArray[index].montoSeguro || 0);

      // Crear nuevo objeto para forzar re-render
      cuotasArray[index] = {
        ...cuotasArray[index],
        montoTotal: nuevoTotal
      };
      // Si editó capital, recalcular saldos siguientes
      if (field === "montoCapital") {
        // Recalcular saldo después de la cuota editada
        const saldoAnteriorCuotaEditada = index === 0
          ? parseFloat(prestamo?.montoDesembolsado || 0)
          : parseFloat(cuotasArray[index - 1].saldoCapitalDespues || 0);

        cuotasArray[index].saldoCapitalDespues = saldoAnteriorCuotaEditada - parseFloat(cuotasArray[index].montoCapital || 0);

        // Recalcular saldos de cuotas siguientes (desde index + 1)
        for (let i = index + 1; i < cuotasArray.length; i++) {
          const saldoAnterior = parseFloat(cuotasArray[i - 1].saldoCapitalDespues || 0);

          cuotasArray[i].saldoCapitalAntes = saldoAnterior;
          cuotasArray[i].saldoCapitalDespues = saldoAnterior - parseFloat(cuotasArray[i].montoCapital || 0);
        }
      }
    }

    // Forzar re-render creando nuevo array
    setCuotas([...cuotasArray]);

    // Guardar inmediatamente
    try {
      // Limpiar campos que no deben enviarse al backend
      const cuotasLimpias = cuotasArray.map(c => {
        const cuotaLimpia = { ...c };
        delete cuotaLimpia.fechaEditadaManualmente;
        delete cuotaLimpia.capitalEditadoManualmente;
        delete cuotaLimpia.interesEditadoManualmente;
        delete cuotaLimpia.comisionEditadaManualmente;
        delete cuotaLimpia.seguroEditadoManualmente;
        delete cuotaLimpia.prestamo;
        delete cuotaLimpia.movimientoCaja;
        delete cuotaLimpia.asientosContables;
        return cuotaLimpia;
      });

      const cuotasActualizadas = await guardarCuotasBulk(prestamoBancarioId, cuotasLimpias);

      // ✅ ACTUALIZAR ESTADO CON LA RESPUESTA DEL SERVIDOR
      if (cuotasActualizadas && cuotasActualizadas.length > 0) {
        setCuotas(cuotasActualizadas);
      }

      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: `${field} actualizado`,
        life: 2000,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cambios",
        life: 3000,
      });
      await cargarCuotas();
    }

    event.preventDefault();
  };
  // Recalcular solo el total de UNA cuota (cuando se edita interés/comisión/seguro)
  const recalcularTotalCuota = (cuotasArray, index) => {
    cuotasArray[index].montoTotal =
      parseFloat(cuotasArray[index].montoCapital || 0) +
      parseFloat(cuotasArray[index].montoInteres || 0) +
      parseFloat(cuotasArray[index].montoComision || 0) +
      parseFloat(cuotasArray[index].montoSeguro || 0);
  };

  // Recalcular saldos e intereses desde una cuota hacia adelante (cuando se edita capital)
  const recalcularDesdeCuota = (cuotasArray, index) => {
    const tasaMensual = prestamo?.tasaInteresEfectiva
      ? Math.pow(1 + parseFloat(prestamo.tasaInteresEfectiva) / 100, 1 / 12) - 1
      : Math.pow(1 + parseFloat(prestamo?.tasaInteresAnual || 0) / 100, 1 / 12) - 1;

    for (let i = index; i < cuotasArray.length; i++) {
      // Recalcular saldo antes
      const saldoAnterior = i === 0
        ? parseFloat(prestamo?.montoDesembolsado || 0)
        : cuotasArray[i - 1].saldoCapitalDespues;

      cuotasArray[i].saldoCapitalAntes = saldoAnterior;

      // Recalcular saldo después
      cuotasArray[i].saldoCapitalDespues = saldoAnterior - (cuotasArray[i].montoCapital || 0);

      // Solo recalcular interés si NO fue editado manualmente
      if (!cuotasArray[i].interesEditadoManualmente) {
        cuotasArray[i].montoInteres = saldoAnterior * tasaMensual;
      }

      // Recalcular total
      cuotasArray[i].montoTotal =
        parseFloat(cuotasArray[i].montoCapital || 0) +
        parseFloat(cuotasArray[i].montoInteres || 0) +
        parseFloat(cuotasArray[i].montoComision || 0) +
        parseFloat(cuotasArray[i].montoSeguro || 0);
    }
  };

  const cellEditor = (options) => {
    if (options.field === "fechaVencimiento") {
      return (
        <Button
          type="button"
          label={options.value ? new Date(options.value).toLocaleDateString('es-PE') : 'Seleccionar'}
          icon="pi pi-calendar"
          onClick={() => {
            setSelectedDateCell(options);
            // Convertir string a Date object si es necesario
            const fechaActual = options.value ? new Date(options.value) : new Date();
            setTempDate(fechaActual);
            setShowCalendarDialog(true);
          }}
          style={{ width: '100%' }}
          size="small"
        />
      );
    }
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
      />
    );
  };

  const handleDateSelect = async () => {
    if (selectedDateCell && tempDate) {


      setShowCalendarDialog(false);

      // Actualizar directamente en el array de cuotas
      const cuotasArray = [...cuotas];

      // ✅ BUSCAR POR numeroCuota EN LUGAR DE id (el id cambia al recrear)
      const index = cuotasArray.findIndex((c) => c.numeroCuota === selectedDateCell.rowData.numeroCuota);

      if (index !== -1) {

        // Convertir Date a ISO string para consistencia
        const fechaISO = tempDate instanceof Date ? tempDate.toISOString() : tempDate;

        // Crear nuevo objeto para forzar re-render
        cuotasArray[index] = {
          ...cuotasArray[index],
          fechaVencimiento: fechaISO,
          fechaEditadaManualmente: true
        };

        // Actualizar estado ANTES de guardar para mostrar cambio inmediatamente
        setCuotas([...cuotasArray]);

        // Guardar inmediatamente en BD
        try {
          // Limpiar campos que no deben enviarse al backend
          const cuotasLimpias = cuotasArray.map(c => {
            const cuotaLimpia = { ...c };
            delete cuotaLimpia.fechaEditadaManualmente;
            delete cuotaLimpia.capitalEditadoManualmente;
            delete cuotaLimpia.interesEditadoManualmente;
            delete cuotaLimpia.comisionEditadaManualmente;
            delete cuotaLimpia.seguroEditadoManualmente;
            delete cuotaLimpia.prestamo;
            delete cuotaLimpia.movimientoCaja;
            delete cuotaLimpia.asientosContables;
            return cuotaLimpia;
          });
          const cuotasActualizadas = await guardarCuotasBulk(prestamoBancarioId, cuotasLimpias);
          // ✅ ACTUALIZAR ESTADO CON LA RESPUESTA DEL SERVIDOR
          if (cuotasActualizadas && cuotasActualizadas.length > 0) {
            setCuotas(cuotasActualizadas);
          }

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Fecha actualizada correctamente",
            life: 2000,
          });
        } catch (error) {
          console.error("Error al guardar fecha:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al guardar la fecha",
            life: 3000,
          });
          // Recargar para revertir cambio
          await cargarCuotas();
        }
      }
    }
    setSelectedDateCell(null);
    setTempDate(null);
  };
  const totales = useMemo(() => {
    return {
      montoCapital: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoCapital || 0),
        0
      ),
      montoInteres: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoInteres || 0),
        0
      ),
      montoComision: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoComision || 0),
        0
      ),
      montoSeguro: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoSeguro || 0),
        0
      ),
      montoTotal: cuotas.reduce(
        (sum, c) => sum + parseFloat(c.montoTotal || 0),
        0
      ),
    };
  }, [cuotas]);

  const confirmDelete = (cuota) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cuota ${cuota.numeroCuota}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: () => handleDelete(cuota.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteCuotaPrestamo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuota eliminada correctamente",
        life: 3000,
      });
      await cargarCuotas();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar cuota",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const estadoBodyTemplate = (rowData) => {
    const severity =
      rowData.estadoPago === "PAGADO"
        ? "success"
        : rowData.estadoPago === "VENCIDO"
          ? "danger"
          : "warning";
    return <Tag value={rowData.estadoPago} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return "";
    return new Date(rowData.fechaVencimiento).toLocaleDateString("es-PE");
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData[field] || 0);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          rounded
          outlined
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={readOnly}
        />
      </div>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const cuotasFiltradas = useMemo(() => {
    if (!estadoFiltro) return cuotas;
    return cuotas.filter(c => c.estadoPago === estadoFiltro);
  }, [cuotas, estadoFiltro]);

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Dialog
        header="Seleccionar Fecha"
        visible={showCalendarDialog}
        style={{ width: '550px' }}
        onHide={() => {
          setShowCalendarDialog(false);
          setSelectedDateCell(null);
          setTempDate(null);
        }}
        footer={
          <div>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowCalendarDialog(false)}
              className="p-button-text"
            />
            <Button
              type="button"
              label="Aceptar"
              icon="pi pi-check"
              onClick={handleDateSelect}
              autoFocus
            />
          </div>
        }
      >
        <Calendar
          value={tempDate}
          onChange={(e) => setTempDate(e.value)}
          dateFormat="dd/mm/yy"
          inline
          style={{ width: "100%" }}
        />
      </Dialog>

      <div className="card">
        <DataTable
          value={cuotasFiltradas}
          loading={loading}
          dataKey="id"
          showGridlines
          stripedRows
          size="small"
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 80, 160]}
          filters={filters}
          globalFilterFields={["numeroCuota", "estadoPago"]}
          emptyMessage="No se encontraron cuotas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cuotas"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          style={{ fontSize: getResponsiveFontSize() }}
          editMode="cell"
          header={
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Cronograma de Cuotas</h2>
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  type="button"
                  label="Regenerar Cronograma"
                  icon="pi pi-refresh"
                  severity="warning"
                  onClick={handleGenerarCronograma}
                  loading={loading}
                  disabled={readOnly}
                  tooltip="Regenera todas las cuotas desde cero"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  type="button"
                  label="Completar Cálculos"
                  icon="pi pi-calculator"
                  severity="info"
                  onClick={handleCompletarCalculos}
                  loading={loading}
                  disabled={readOnly || cuotas.length < 2}
                  tooltip="Recalcula cuotas desde la 2 respetando valores editados"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Dropdown
                  value={estadoFiltro}
                  options={[
                    { label: "Todos los estados", value: null },
                    ...estadosCuota.map(e => ({ label: e.descripcion, value: e.descripcion }))
                  ]}
                  onChange={(e) => setEstadoFiltro(e.value)}
                  placeholder="Filtrar por estado"
                  style={{ width: "200px" }}
                  filter
                />
              </div>
            </div>
          }
        >
          <Column
            field="numeroCuota"
            header="N°"
            sortable
            style={{ width: "60px", textAlign: "center" }}
            footer="TOTALES:"
            footerStyle={{ textAlign: "right", fontWeight: "bold" }}
          />
          <Column
            field="fechaVencimiento"
            header="Vencimiento"
            body={fechaBodyTemplate}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "130px", textAlign: "center" }}
            bodyStyle={editableCellStyle}
          />
          <Column
            field="saldoCapitalAntes"
            header="Saldo Antes"
            body={(r) => montoBodyTemplate(r, "saldoCapitalAntes")}
            sortable
            style={{ width: "130px", textAlign: "right", backgroundColor: "#f5f5f5" }}
          />
          <Column
            field="montoCapital"
            header="Capital"
            body={(r) => montoBodyTemplate(r, "montoCapital")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "120px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoCapital)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoInteres"
            header="Interés"
            body={(r) => montoBodyTemplate(r, "montoInteres")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "110px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoInteres)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoComision"
            header="Comisión"
            body={(r) => montoBodyTemplate(r, "montoComision")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "110px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoComision)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoSeguro"
            header="Seguro"
            body={(r) => montoBodyTemplate(r, "montoSeguro")}
            editor={cellEditor}
            onCellEditComplete={onCellEditComplete}
            sortable
            style={{ width: "100px", textAlign: "right" }}
            bodyStyle={editableCellStyle}
            footer={formatCurrency(totales.montoSeguro)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="montoTotal"
            header="Total"
            body={(r) => montoBodyTemplate(r, "montoTotal")}
            sortable
            style={{
              width: "120px",
              textAlign: "right",
              backgroundColor: "#d1ecf1",
              fontWeight: "bold",
            }}
            footer={formatCurrency(totales.montoTotal)}
            footerStyle={{
              textAlign: "right",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
            }}
          />
          <Column
            field="saldoCapitalDespues"
            header="Saldo Después"
            body={(r) => montoBodyTemplate(r, "saldoCapitalDespues")}
            sortable
            style={{ width: "130px", textAlign: "right", backgroundColor: "#f5f5f5" }}
          />
          <Column
            field="estadoPago"
            header="Estado"
            body={(rowData) => {
              const estado = estadosCuota.find(e => e.descripcion === rowData.estadoPago);
              return (
                <Tag
                  value={rowData.estadoPago}
                  severity={estado?.severityColor || "secondary"}
                />
              );
            }}
            style={{ width: "120px" }}
          />
          <Column
            header="Historico"
            body={(rowData) => {
              const fechaCorte = new Date("2026-01-01");
              const fechaVenc = new Date(rowData.fechaVencimiento);
              const puedeMarcar = fechaVenc < fechaCorte && !rowData.saldoInicialPagada && !readOnly;

              if (fechaVenc >= fechaCorte) return null;

              return (
                <BooleanToggleButton
                  value={rowData.saldoInicialPagada}
                  onChange={() => handleMarcarSaldoInicial(rowData)}
                  labelTrue="Sí"
                  labelFalse="No"
                  severityTrue="info"
                  severityFalse="secondary"
                  size="small"
                  disabled={!puedeMarcar}
                  style={{ width: "60px" }}
                />
              );
            }}
            style={{ width: "80px", textAlign: "center" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "80px" }}
          />
        </DataTable>
      </div>
      <Dialog
        header="Editar Cuota"
        visible={showEditDialog}
        style={{ width: "800px" }}
        onHide={() => {
          setShowEditDialog(false);
          setSelectedCuota(null);
        }}
        modal
      >
        {selectedCuota && (
          <CuotaPrestamoForm
            isEdit={true}
            defaultValues={selectedCuota}
            prestamoBancarioId={prestamoBancarioId}
            onSubmit={handleUpdateCuota}
            onCancel={() => {
              setShowEditDialog(false);
              setSelectedCuota(null);
            }}
            loading={loading}
          />
        )}
      </Dialog>
    </div>
  );
}