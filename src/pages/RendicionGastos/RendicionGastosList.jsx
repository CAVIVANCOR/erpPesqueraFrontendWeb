// src/pages/RendicionGastos/RendicionGastosList.jsx
// Página principal del módulo de Rendición de Gastos
import React, { useState, useRef, useEffect, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import DetMovsRendicionGastosForm from "../../components/rendicionGastos/DetMovsRendicionGastosForm";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getAllDetMovsEntregaRendir } from "../../api/detMovsEntregaRendir";
import { getPersonal } from "../../api/personal";
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getEmpresas } from "../../api/empresa";
import { getMonedas } from "../../api/moneda";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getProductos } from "../../api/producto";
import { getAllCategoriaTipoMovEntregaRendir } from "../../api/categoriaTipoMovEntregaRendir";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import { ProgressBar } from "primereact/progressbar";

export default function RendicionGastosList({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);

  // Estados locales para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroEntregaARendir, setFiltroEntregaARendir] = useState(null);
  const [filtroCategoriaMovimiento, setFiltroCategoriaMovimiento] =
    useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);
  const [filtroAsignacionSeleccionada, setFiltroAsignacionSeleccionada] =
    useState(null);
  const [filtroEntidadComercial, setFiltroEntidadComercial] = useState(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState(null);
  const [filtroRangoFechas, setFiltroRangoFechas] = useState(null);

  // Estados para el dialog
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [saldosARendir, setSaldosARendir] = useState({});
  const [calculandoSaldos, setCalculandoSaldos] = useState(false);
  const [recalculandoSaldos, setRecalculandoSaldos] = useState(false);
  const [progresoRecalculo, setProgresoRecalculo] = useState(0);
  const [totalRecalculo, setTotalRecalculo] = useState(0);
  const [mostrarDialogoResultados, setMostrarDialogoResultados] = useState(false);
  const [resultadosRecalculo, setResultadosRecalculo] = useState(null);
  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        movimientosData,
        personalData,
        centrosCostoData,
        tiposMovimientoData,
        categoriasData,
        entidadesComercialesData,
        monedasData,
        tiposDocumentoData,
        productosData,
        empresasData,
      ] = await Promise.all([
        getAllDetMovsEntregaRendir(),
        getPersonal(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getAllCategoriaTipoMovEntregaRendir(),
        getEntidadesComerciales(),
        getMonedas(),
        getTiposDocumento(),
        getProductos(),
        getEmpresas(),
      ]);
      setMovimientos(movimientosData || []);
      setPersonal(
        (personalData || []).map((p) => ({
          ...p,
          nombreCompleto: `${p.nombres} ${p.apellidos}`.trim(),
        })),
      );
      setCentrosCosto(centrosCostoData || []);
      setTiposMovimiento(tiposMovimientoData || []);
      setCategorias(categoriasData || []);
      setEntidadesComerciales(entidadesComercialesData || []);
      setEmpresas(empresasData || []);
      setMonedas(monedasData || []);
      setTiposDocumento(tiposDocumentoData || []);
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del módulo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-seleccionar responsable del usuario logueado
  useEffect(() => {
    if (
      !loading &&
      personal.length > 0 &&
      !filtroResponsable &&
      usuario?.personalId
    ) {
      const personalIdNumber = Number(usuario.personalId);
      const personalExiste = personal.some(
        (p) => Number(p.id) === personalIdNumber,
      );
      if (personalExiste) {
        setFiltroResponsable(personalIdNumber);
      }
    }
  }, [loading, personal.length, usuario?.personalId]);

  // ✅ Función para recargar entidades comerciales cuando se crea una nueva
  const handleEntidadComercialCreada = async (entidad) => {
    try {
      const entidadesComercialesData = await getEntidadesComerciales();
      setEntidadesComerciales(entidadesComercialesData || []);
    } catch (error) {
      console.error("Error al recargar entidades comerciales:", error);
    }
  };

  // Calcular saldos A Rendir
  useEffect(() => {
    const calcularSaldos = () => {
      setCalculandoSaldos(true);
      const nuevosSaldos = {};

      const asignacionesOrigen = movimientos.filter(
        (mov) =>
          mov.formaParteCalculoEntregaARendir === true &&
          (mov.asignacionOrigenId === null ||
            mov.asignacionOrigenId === undefined ||
            Number(mov.asignacionOrigenId) === 0),
      );

      for (const asignacion of asignacionesOrigen) {
        const gastosAsociados = movimientos.filter(
          (mov) =>
            mov.asignacionOrigenId &&
            Number(mov.asignacionOrigenId) === Number(asignacion.id),
        );

        const totalGastos = gastosAsociados.reduce(
          (sum, gasto) => sum + Number(gasto.monto || 0),
          0,
        );

        const saldo = Number(asignacion.monto || 0) - totalGastos;
        nuevosSaldos[asignacion.id] = saldo;
      }

      setSaldosARendir(nuevosSaldos);
      setCalculandoSaldos(false);
    };

    if (movimientos && movimientos.length > 0) {
      calcularSaldos();
    } else {
      setSaldosARendir({});
      setCalculandoSaldos(false);
    }
  }, [movimientos]);

  // 💰 CALCULAR SALDOS INICIAL Y FINAL POR RESPONSABLE (JERARQUÍA ASIGNACIÓN → GASTOS/DEVOLUCIONES)
  const calcularSaldosDetallados = useMemo(() => {
    const saldosDetallados = {};

    // Filtrar solo movimientos con formaParteCalculoEntregaARendir = true
    const movimientosEntregaRendir = movimientos.filter(
      (mov) => mov.formaParteCalculoEntregaARendir === true,
    );

    // Agrupar por responsableId
    const movimientosPorResponsable = movimientosEntregaRendir.reduce(
      (grupos, mov) => {
        const responsableId = Number(mov.responsableId);
        if (!grupos[responsableId]) {
          grupos[responsableId] = [];
        }
        grupos[responsableId].push(mov);
        return grupos;
      },
      {},
    );

    // Procesar cada responsable independientemente
    Object.keys(movimientosPorResponsable).forEach((responsableId) => {
      const movimientosResponsable = movimientosPorResponsable[responsableId];

      // Separar asignaciones y gastos/devoluciones
      const asignaciones = movimientosResponsable.filter(
        (mov) =>
          mov.asignacionOrigenId === null ||
          mov.asignacionOrigenId === undefined ||
          Number(mov.asignacionOrigenId) === 0
      );

      // Ordenar asignaciones por fecha
      asignaciones.sort((a, b) => {
        const fechaA = new Date(a.fechaMovimiento);
        const fechaB = new Date(b.fechaMovimiento);
        if (fechaA.getTime() !== fechaB.getTime()) {
          return fechaA - fechaB;
        }
        return Number(a.id) - Number(b.id);
      });

      // Variables de control de saldo
      let SaldoInicial = 0;
      let SaldoFinal = 0;

      // Procesar cada asignación con sus gastos/devoluciones
      asignaciones.forEach((asignacion) => {
        const asignacionId = Number(asignacion.id);

        // Calcular saldos de la asignación
        SaldoFinal = SaldoInicial + Number(asignacion.monto || 0);

        saldosDetallados[asignacionId] = {
          saldoInicial: SaldoInicial,
          saldoFinal: SaldoFinal,
          responsableId: Number(responsableId),
          esAsignacion: true,
        };

        // Actualizar SaldoInicial para los gastos/devoluciones
        SaldoInicial = SaldoFinal;

        // Obtener gastos y devoluciones de esta asignación
        const movimientosAsignacion = movimientosResponsable.filter(
          (mov) => Number(mov.asignacionOrigenId) === asignacionId
        );

        // Ordenar por fecha
        movimientosAsignacion.sort((a, b) => {
          const fechaA = new Date(a.fechaMovimiento);
          const fechaB = new Date(b.fechaMovimiento);
          if (fechaA.getTime() !== fechaB.getTime()) {
            return fechaA - fechaB;
          }
          return Number(a.id) - Number(b.id);
        });

        // Procesar cada gasto o devolución
        movimientosAsignacion.forEach((movimiento) => {
          const movimientoId = Number(movimiento.id);
          const esDevolucion = Number(movimiento.tipoMovimientoId) === 28;

          // Calcular saldos según tipo de movimiento
          if (esDevolucion) {
            // DEVOLUCIÓN: SUMA al saldo
            SaldoFinal = SaldoInicial + Number(movimiento.monto || 0);
          } else {
            // GASTO: RESTA del saldo
            SaldoFinal = SaldoInicial - Number(movimiento.monto || 0);
          }

          saldosDetallados[movimientoId] = {
            saldoInicial: SaldoInicial,
            saldoFinal: SaldoFinal,
            responsableId: Number(responsableId),
            esAsignacion: false,
            esDevolucion: esDevolucion,
          };

          // Actualizar SaldoInicial para el siguiente
          SaldoInicial = SaldoFinal;
        });
      });
    });

    return saldosDetallados;
  }, [movimientos]);

  // 🔄 RECALCULAR Y GUARDAR SALDOS EN BASE DE DATOS
  const recalcularYGuardarSaldos = async () => {
    setRecalculandoSaldos(true);
    setProgresoRecalculo(0);

    try {
      const saldosCalculados = calcularSaldosDetallados;
      const movimientosActualizar = [];

      // Preparar actualizaciones
      Object.keys(saldosCalculados).forEach((movimientoId) => {
        const saldos = saldosCalculados[movimientoId];
        const movimientoOriginal = movimientos.find(m => Number(m.id) === Number(movimientoId));

        movimientosActualizar.push({
          id: Number(movimientoId),
          saldoInicialAsignacion: saldos.saldoInicial,
          saldoFinalAsignacion: saldos.saldoFinal,
          formaParteCalculoEntregaARendir: movimientoOriginal?.formaParteCalculoEntregaARendir,
          asignacionOrigenId: movimientoOriginal?.asignacionOrigenId,
          tipoMovimientoId: movimientoOriginal?.tipoMovimientoId,
          descripcion: movimientoOriginal?.descripcion,
          monto: movimientoOriginal?.monto,
          responsable: movimientoOriginal?.responsable?.nombreCompleto,
        });
      });

      setTotalRecalculo(movimientosActualizar.length);

      // Actualizar en lotes con progreso
      let actualizados = 0;
      const errores = [];

      for (let i = 0; i < movimientosActualizar.length; i++) {
        const movimiento = movimientosActualizar[i];

        try {
          await actualizarDetMovsEntregaRendir(movimiento.id, {
            saldoInicialAsignacion: movimiento.saldoInicialAsignacion,
            saldoFinalAsignacion: movimiento.saldoFinalAsignacion,
            formaParteCalculoEntregaARendir: movimiento.formaParteCalculoEntregaARendir,
            asignacionOrigenId: movimiento.asignacionOrigenId,
            tipoMovimientoId: movimiento.tipoMovimientoId,
          });
          actualizados++;
        } catch (error) {
          errores.push({
            id: movimiento.id,
            descripcion: movimiento.descripcion,
            monto: movimiento.monto,
            responsable: movimiento.responsable,
            error: error.response?.data?.message || error.message,
          });
        }

        // Actualizar progreso
        setProgresoRecalculo(i + 1);
      }

      // Recargar datos
      await cargarDatos();

      // Preparar resultados
      const resultados = {
        total: movimientosActualizar.length,
        actualizados: actualizados,
        errores: errores,
        exitoso: errores.length === 0,
      };

      setResultadosRecalculo(resultados);
      setMostrarDialogoResultados(true);

    } catch (error) {
      console.error("❌ Error crítico en recálculo de saldos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error Crítico",
        detail: "Error al recalcular saldos: " + (error.message || "Error desconocido"),
        life: 5000,
      });
    } finally {
      setRecalculandoSaldos(false);
      setProgresoRecalculo(0);
      setTotalRecalculo(0);
    }
  };

  // 🔍 DETECTAR ERRORES EN GASTOS DE ENTREGA A RENDIR
  const detectarErroresGastos = () => {
    const erroresDetectados = [];

    movimientos.forEach((mov) => {
      // Solo validar movimientos que forman parte del cálculo
      if (mov.formaParteCalculoEntregaARendir !== true) return;

      // Verificar si es un gasto (tiene asignacionOrigenId)
      const esGasto = mov.asignacionOrigenId !== null &&
        mov.asignacionOrigenId !== undefined &&
        Number(mov.asignacionOrigenId) !== 0;

      if (esGasto) {
        const erroresMovimiento = [];

        // Validar asignacionOrigenId
        if (!mov.asignacionOrigenId) {
          erroresMovimiento.push("Falta asignación origen");
        }

        // Validar campos obligatorios
        if (!mov.responsableId) erroresMovimiento.push("Falta responsable");
        if (!mov.tipoMovimientoId) erroresMovimiento.push("Falta tipo de movimiento");
        if (!mov.centroCostoId) erroresMovimiento.push("Falta centro de costo");
        if (!mov.monto || mov.monto === 0) erroresMovimiento.push("Falta monto");
        if (!mov.monedaId) erroresMovimiento.push("Falta moneda");

        if (erroresMovimiento.length > 0) {
          erroresDetectados.push({
            id: mov.id,
            descripcion: mov.descripcion,
            monto: mov.monto,
            responsable: mov.responsable?.nombreCompleto,
            errores: erroresMovimiento,
          });
        }
      }
    });

    // Mostrar resultados
    setResultadosRecalculo({
      total: movimientos.filter(m => m.formaParteCalculoEntregaARendir === true).length,
      actualizados: 0,
      errores: erroresDetectados,
      exitoso: erroresDetectados.length === 0,
      esDeteccion: true,
    });
    setMostrarDialogoResultados(true);
  };


  // 🔄 CALCULAR SALDOS DESDE ARRAY DE MOVIMIENTOS (para usar con datos frescos de BD)
  const calcularSaldosDetalladosDesdeMovimientos = (movimientosArray) => {
    const saldosPorMovimiento = {};

    movimientosArray.forEach((mov) => {
      const responsableId = Number(mov.responsableId);
      const asignacionId = mov.asignacionOrigenId ? Number(mov.asignacionOrigenId) : null;
      const esAsignacion = asignacionId === null || asignacionId === 0;

      if (!saldosPorMovimiento[mov.id]) {
        saldosPorMovimiento[mov.id] = {
          responsableId: responsableId,
          asignacionId: asignacionId,
          saldoInicial: 0,
          saldoFinal: 0,
        };
      }
    });

    // Ordenar movimientos por fecha
    const movimientosOrdenados = [...movimientosArray].sort(
      (a, b) => new Date(a.fechaMovimiento) - new Date(b.fechaMovimiento)
    );

    // Calcular saldos acumulados
    const saldosPorAsignacion = {};

    movimientosOrdenados.forEach((mov) => {
      const asignacionId = mov.asignacionOrigenId ? Number(mov.asignacionOrigenId) : null;
      const esAsignacion = asignacionId === null || asignacionId === 0;
      const monto = Number(mov.monto) || 0;

      if (!saldosPorAsignacion[asignacionId]) {
        saldosPorAsignacion[asignacionId] = 0;
      }

      const saldoInicial = saldosPorAsignacion[asignacionId];
      const saldoFinal = esAsignacion
        ? saldoInicial + monto
        : saldoInicial - monto;

      saldosPorMovimiento[mov.id] = {
        responsableId: Number(mov.responsableId),
        asignacionId: asignacionId,
        saldoInicial: saldoInicial,
        saldoFinal: saldoFinal,
      };

      saldosPorAsignacion[asignacionId] = saldoFinal;
    });

    return saldosPorMovimiento;
  };



  // 🔄 RECALCULAR SALDOS SOLO DEL RESPONSABLE AFECTADO (OPTIMIZADO)
  const recalcularSaldosAfectados = async (responsableId) => {
    try {
      if (!responsableId) return;

      // ✅ FUENTE ÚNICA DE VERDAD: Leer movimientos FRESCOS desde BD
      const todosMovimientosBD = await getAllDetMovsEntregaRendir();
      const movimientosFrescosBD = todosMovimientosBD.filter(
        m => Number(m.responsableId) === Number(responsableId)
      );

      // Calcular saldos usando los datos FRESCOS de BD
      const saldosCalculados = calcularSaldosDetalladosDesdeMovimientos(movimientosFrescosBD);
      const movimientosActualizar = [];

      // Filtrar solo movimientos del responsable afectado
      Object.keys(saldosCalculados).forEach((movimientoId) => {
        const saldos = saldosCalculados[movimientoId];
        if (Number(saldos.responsableId) === Number(responsableId)) {
          const movimientoOriginal = movimientosFrescosBD.find(m => Number(m.id) === Number(movimientoId));

          movimientosActualizar.push({
            id: Number(movimientoId),
            saldoInicialAsignacion: saldos.saldoInicial,
            saldoFinalAsignacion: saldos.saldoFinal,
            // ✅ Usar datos FRESCOS de BD
            formaParteCalculoEntregaARendir: movimientoOriginal?.formaParteCalculoEntregaARendir,
            asignacionOrigenId: movimientoOriginal?.asignacionOrigenId,
            tipoMovimientoId: movimientoOriginal?.tipoMovimientoId,
          });
        }
      });

      // Actualizar en BD sin bloquear UI
      for (const movimiento of movimientosActualizar) {
        try {
          await actualizarDetMovsEntregaRendir(movimiento.id, {
            saldoInicialAsignacion: movimiento.saldoInicialAsignacion,
            saldoFinalAsignacion: movimiento.saldoFinalAsignacion,
            formaParteCalculoEntregaARendir: movimiento.formaParteCalculoEntregaARendir,
            asignacionOrigenId: movimiento.asignacionOrigenId,
            tipoMovimientoId: movimiento.tipoMovimientoId,
          });
        } catch (error) {
          console.error(
            `Error actualizando saldos del movimiento ${movimiento.id}:`,
            error,
          );
          // Continuar con los demás aunque uno falle
        }
      }

      // Recargar datos para reflejar cambios en UI
      await cargarDatos();
    } catch (error) {
      console.error("Error al recalcular saldos afectados:", error);
      // No mostrar toast de error para no interrumpir flujo del usuario
    }
  };

  // Filtrar movimientos que son asignaciones
  const movimientosAsignacionEntregaRendir = useMemo(() => {
    return (movimientos || []).filter(
      (mov) =>
        mov.formaParteCalculoEntregaARendir === true &&
        (mov.asignacionOrigenId === null ||
          mov.asignacionOrigenId === undefined ||
          Number(mov.asignacionOrigenId) === 0) &&
        (!editingMovimiento || Number(mov.id) !== Number(editingMovimiento.id)),
    );
  }, [movimientos, editingMovimiento]);

  // 🔄 FUNCIÓN BASE PARA FILTROS DINÁMICOS
  const obtenerMovimientosBase = (excluirFiltro) => {
    let movimientosFiltrados = [...movimientos];

    if (excluirFiltro !== "tipoMovimiento" && filtroTipoMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.tipoMovimientoId) === Number(filtroTipoMovimiento),
      );
    }

    if (excluirFiltro !== "centroCosto" && filtroCentroCosto) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.centroCostoId) === Number(filtroCentroCosto),
      );
    }

    if (excluirFiltro !== "entregaARendir" && filtroEntregaARendir !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.formaParteCalculoEntregaARendir === filtroEntregaARendir,
      );
    }

    if (excluirFiltro !== "categoriaMovimiento" && filtroCategoriaMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        const categoriaId =
          mov.tipoMovimiento?.categoria?.id || mov.tipoMovimiento?.categoriaId;
        return (
          categoriaId &&
          Number(categoriaId) === Number(filtroCategoriaMovimiento)
        );
      });
    }

    if (
      excluirFiltro !== "validacionTesoreria" &&
      filtroValidacionTesoreria !== null
    ) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.validadoTesoreria === filtroValidacionTesoreria,
      );
    }

    if (
      excluirFiltro !== "asignacionSeleccionada" &&
      filtroAsignacionSeleccionada
    ) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        if (Number(mov.id) === Number(filtroAsignacionSeleccionada)) {
          return true;
        }
        if (
          mov.asignacionOrigenId &&
          Number(mov.asignacionOrigenId) ===
          Number(filtroAsignacionSeleccionada)
        ) {
          return true;
        }
        return false;
      });
    }

    if (excluirFiltro !== "entidadComercial" && filtroEntidadComercial) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) =>
          Number(mov.entidadComercialId) === Number(filtroEntidadComercial),
      );
    }

    if (excluirFiltro !== "empresa" && filtroEmpresa) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.empresaId) === Number(filtroEmpresa),
      );
    }

    if (excluirFiltro !== "responsable" && filtroResponsable) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.responsableId) === Number(filtroResponsable),
      );
    }

    if (
      excluirFiltro !== "rangoFechas" &&
      filtroRangoFechas &&
      filtroRangoFechas[0]
    ) {
      const fechaInicio = new Date(filtroRangoFechas[0]);
      fechaInicio.setHours(0, 0, 0, 0);

      const fechaFin = filtroRangoFechas[1]
        ? new Date(filtroRangoFechas[1])
        : new Date(filtroRangoFechas[0]);
      fechaFin.setHours(23, 59, 59, 999);

      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        const fechaMov = new Date(mov.fechaMovimiento);
        return fechaMov >= fechaInicio && fechaMov <= fechaFin;
      });
    }

    return movimientosFiltrados;
  };

  // 🔄 OPCIONES DINÁMICAS PARA ENTIDADES COMERCIALES
  const obtenerOpcionesEntidadesDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("entidadComercial");
    const entidadesConMovimientos = [
      ...new Set(
        movimientosBase
          .filter((m) => m.entidadComercialId)
          .map((m) => Number(m.entidadComercialId)),
      ),
    ];

    return entidadesComerciales
      .filter((e) => entidadesConMovimientos.includes(Number(e.id)))
      .map((entidad) => ({
        label: entidad.razonSocial,
        value: Number(entidad.id),
      }));
  }, [
    movimientos,
    entidadesComerciales,
    filtroTipoMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEmpresa,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🔄 OPCIONES DINÁMICAS PARA EMPRESAS
  const obtenerOpcionesEmpresasDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("empresa");
    const empresasConMovimientos = [
      ...new Set(
        movimientosBase
          .filter((m) => m.empresaId)
          .map((m) => Number(m.empresaId)),
      ),
    ];

    return empresas
      .filter((e) => empresasConMovimientos.includes(Number(e.id)))
      .map((empresa) => ({
        label: empresa.razonSocial,
        value: Number(empresa.id),
      }));
  }, [
    movimientos,
    empresas,
    filtroTipoMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEntidadComercial,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🔄 OPCIONES DINÁMICAS PARA RESPONSABLES
  const obtenerOpcionesResponsablesDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("responsable");
    const responsablesConMovimientos = [
      ...new Set(
        movimientosBase
          .filter((m) => m.responsableId)
          .map((m) => Number(m.responsableId)),
      ),
    ];

    return personal
      .filter((p) => responsablesConMovimientos.includes(Number(p.id)))
      .map((p) => ({
        label: p.nombreCompleto,
        value: Number(p.id),
        urlFoto: p.urlFotoPersona || null,
      }));
  }, [
    movimientos,
    personal,
    filtroTipoMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEntidadComercial,
    filtroEmpresa,
    filtroRangoFechas,
  ]);

  // Opciones completas de responsables (sin filtrar por movimientos)
  const opcionesResponsables = useMemo(() => {
    return personal.map((p) => ({
      label: p.nombreCompleto,
      value: Number(p.id),
      urlFoto: p.urlFotoPersona || null,
    }));
  }, [personal]);

  // 🔄 OPCIONES DINÁMICAS PARA CATEGORÍAS
  const obtenerOpcionesCategoriasDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("categoriaMovimiento");
    const categoriasConMovimientos = [
      ...new Set(
        movimientosBase
          .filter(
            (m) =>
              m.tipoMovimiento?.categoria?.id || m.tipoMovimiento?.categoriaId,
          )
          .map((m) => {
            const categoriaId =
              m.tipoMovimiento?.categoria?.id || m.tipoMovimiento?.categoriaId;
            return Number(categoriaId);
          }),
      ),
    ];

    const categoriasUnicas = tiposMovimiento
      .filter((t) => t.categoria && t.categoria.tipo === true)
      .map((t) => t.categoria)
      .filter(
        (cat, index, self) =>
          index === self.findIndex((c) => String(c.id) === String(cat.id)),
      );

    return categoriasUnicas.filter((cat) =>
      categoriasConMovimientos.includes(Number(cat.id)),
    );
  }, [
    movimientos,
    tiposMovimiento,
    filtroTipoMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEntidadComercial,
    filtroEmpresa,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🔄 OPCIONES DINÁMICAS PARA TIPOS DE MOVIMIENTO
  const obtenerOpcionesTiposMovimientoDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("tipoMovimiento");
    const tiposConMovimientos = [
      ...new Set(
        movimientosBase
          .filter((m) => m.tipoMovimientoId)
          .map((m) => Number(m.tipoMovimientoId)),
      ),
    ];

    return tiposMovimiento.filter((t) =>
      tiposConMovimientos.includes(Number(t.id)),
    );
  }, [
    movimientos,
    tiposMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEntidadComercial,
    filtroEmpresa,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🔄 OPCIONES DINÁMICAS PARA CENTROS DE COSTO
  const obtenerOpcionesCentrosCostoDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("centroCosto");
    const centrosConMovimientos = [
      ...new Set(
        movimientosBase
          .filter((m) => m.centroCostoId)
          .map((m) => Number(m.centroCostoId)),
      ),
    ];

    return centrosCosto
      .filter((c) => centrosConMovimientos.includes(Number(c.id)))
      .map((centro) => ({
        ...centro,
        displayLabel: centro.Codigo + " - " + centro.Nombre,
      }));
  }, [
    movimientos,
    centrosCosto,
    filtroTipoMovimiento,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroAsignacionSeleccionada,
    filtroEntidadComercial,
    filtroEmpresa,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🔄 OPCIONES DINÁMICAS PARA ASIGNACIONES (FILTRADAS Y ORDENADAS)
  const obtenerAsignacionesDisponibles = useMemo(() => {
    const movimientosBase = obtenerMovimientosBase("asignacionSeleccionada");

    return movimientosBase
      .filter((mov) => {
        const categoriaId =
          mov.tipoMovimiento?.categoria?.id || mov.tipoMovimiento?.categoriaId;

        // Validar que sea una asignación (categoría 17 y sin asignación origen)
        const esAsignacion =
          categoriaId &&
          Number(categoriaId) === 17 &&
          (mov.asignacionOrigenId === null ||
            mov.asignacionOrigenId === undefined ||
            Number(mov.asignacionOrigenId) === 0);

        if (!esAsignacion) return false;

        // ✅ FILTRAR POR RESPONSABLE SI ESTÁ SELECCIONADO
        if (filtroResponsable) {
          return Number(mov.responsableId) === Number(filtroResponsable);
        }

        return true;
      })
      .sort((a, b) => {
        // ✅ ORDENAR POR FECHA DESCENDENTE (MÁS RECIENTES PRIMERO)
        const fechaA = new Date(a.fechaMovimiento);
        const fechaB = new Date(b.fechaMovimiento);

        if (fechaB.getTime() !== fechaA.getTime()) {
          return fechaB - fechaA; // Descendente
        }

        // Si las fechas son iguales, ordenar por ID descendente
        return Number(b.id) - Number(a.id);
      })
      .map((asignacion) => {
        const moneda = monedas.find(
          (m) => Number(m.id) === Number(asignacion.monedaId),
        );

        // Obtener nombre del responsable para mostrar en el dropdown
        const responsable = personal.find(
          (p) => Number(p.id) === Number(asignacion.responsableId),
        );

        return {
          value: Number(asignacion.id),
          id: asignacion.id,
          descripcion: asignacion.descripcion,
          monto: asignacion.monto,
          moneda: moneda,
          fechaMovimiento: asignacion.fechaMovimiento,
          responsable: responsable, // ✅ NUEVO: Para mostrar en el template
        };
      });
  }, [
    movimientos,
    monedas,
    tiposMovimiento,
    personal,
    filtroTipoMovimiento,
    filtroCentroCosto,
    filtroEntregaARendir,
    filtroCategoriaMovimiento,
    filtroValidacionTesoreria,
    filtroEntidadComercial,
    filtroEmpresa,
    filtroResponsable,
    filtroRangoFechas,
  ]);

  // 🎨 TEMPLATE PARA ITEMS DEL DROPDOWN DE ASIGNACIONES
  const asignacionItemTemplate = (option) => {
    if (!option) return null;

    const montoFormateado = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: option.moneda?.codigoSunat || "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(option.monto);

    const fechaFormateada = new Date(option.fechaMovimiento).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 0",
        }}
      >
        <Badge
          value={fechaFormateada}
          severity="secondary"
          style={{ minWidth: "90px", fontSize: "0.75rem" }}
        />
        <Badge
          value={`ID: ${option.id}`}
          severity="info"
          style={{ minWidth: "60px" }}
        />
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {option.descripcion || "Sin descripción"}
        </span>
        {!filtroResponsable && option.responsable && (
          <Badge
            value={option.responsable.nombreCompleto || option.responsable.nombre}
            severity="warning"
            style={{ fontSize: "0.75rem" }}
          />
        )}
        <Badge
          value={montoFormateado}
          severity="success"
          style={{ minWidth: "100px", fontWeight: "bold" }}
        />
      </div>
    );
  };

  // 🎨 TEMPLATE PARA EL VALOR SELECCIONADO DEL DROPDOWN
  const asignacionValueTemplate = (option) => {
    if (!option) return "Seleccionar Asignación";

    const asignacion = obtenerAsignacionesDisponibles.find(
      (a) => a.value === option,
    );

    if (!asignacion) return "Seleccionar Asignación";

    const montoFormateado = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: asignacion.moneda?.codigoSunat || "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(asignacion.monto);

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Badge value={`ID: ${asignacion.id}`} severity="info" />
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {asignacion.descripcion || "Sin descripción"}
        </span>
        <Badge
          value={montoFormateado}
          severity="success"
          style={{ fontWeight: "bold" }}
        />
      </div>
    );
  };
  // Función para obtener movimientos filtrados
  const obtenerMovimientosFiltrados = () => {
    return obtenerMovimientosBase(null);
  };
  // Funciones para filtros
  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroEntregaARendir(null);
    setFiltroCategoriaMovimiento(null);
    setFiltroValidacionTesoreria(null);
    setFiltroAsignacionSeleccionada(null);
    setFiltroEntidadComercial(null);
    setFiltroEmpresa(null);
    setFiltroResponsable(null);
    setFiltroRangoFechas(null);
  };

  const alternarFiltroEntregaARendir = () => {
    if (filtroEntregaARendir === null) {
      setFiltroEntregaARendir(true);
    } else if (filtroEntregaARendir === true) {
      setFiltroEntregaARendir(false);
    } else {
      setFiltroEntregaARendir(null);
    }
  };

  const alternarFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      setFiltroValidacionTesoreria(true);
    } else if (filtroValidacionTesoreria === true) {
      setFiltroValidacionTesoreria(false);
    } else {
      setFiltroValidacionTesoreria(null);
    }
  };

  const alternarFiltroGastosARendir = () => {
    if (filtroCategoriaMovimiento === 17) {
      setFiltroCategoriaMovimiento(null);
    } else {
      setFiltroCategoriaMovimiento(17);
    }
  };

  const obtenerPropiedadesFiltroEntregaARendir = () => {
    if (filtroEntregaARendir === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroEntregaARendir === true) {
      return { label: "Sí", severity: "success" };
    } else {
      return { label: "No", severity: "secondary" };
    }
  };

  const obtenerPropiedadesFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroValidacionTesoreria === true) {
      return { label: "Validados", severity: "success" };
    } else {
      return { label: "Pendientes", severity: "danger" };
    }
  };

  const obtenerPropiedadesFiltroGastosARendir = () => {
    if (filtroCategoriaMovimiento === 17) {
      return { label: "Gastos a Rendir", severity: "success" };
    } else {
      return { label: "Todos los Gastos", severity: "secondary" };
    }
  };

  // Handlers internos
  const handleNuevoMovimiento = () => {
    setEditingMovimiento(null);
    setShowMovimientoForm(true);
  };

  const handleEditarMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setShowMovimientoForm(true);
  };

  const handleGuardarMovimiento = async (data) => {
    try {
      if (editingMovimiento) {
        // ═══════════════════════════════════════════════════════
        // EDICIÓN: Actualizar movimiento y recalcular saldos
        // ═══════════════════════════════════════════════════════
        await actualizarDetMovsEntregaRendir(editingMovimiento.id, data);

        // ✅ Recalcular saldos (lee FRESCO de BD, no del estado)
        await recalcularSaldosAfectados(editingMovimiento.responsableId);

        // Recargar datos para actualizar UI (ya se hace dentro de recalcularSaldosAfectados)
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
        return;
      } else {
        // ═══════════════════════════════════════════════════════
        // CREACIÓN: Crear movimiento y calcular saldos
        // ═══════════════════════════════════════════════════════
        const movimientoCreado = await crearDetMovsEntregaRendir(data);

        // Recargar datos para incluir el nuevo movimiento
        await cargarDatos();

        // Recalcular saldos del responsable afectado
        await recalcularSaldosAfectados(movimientoCreado.responsableId);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
        setEditingMovimiento(movimientoCreado);
        return;
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar movimiento",
        life: 3000,
      });
    }
  };

  const handleEliminarMovimiento = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento del ${new Date(
        movimiento.fechaMovimiento,
      ).toLocaleDateString()}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          // Guardar responsableId antes de eliminar
          const responsableIdAfectado = movimiento.responsableId;

          // Eliminar movimiento
          await eliminarDetMovsEntregaRendir(movimiento.id);

          // Recargar datos para reflejar la eliminación
          await cargarDatos();

          // Recalcular saldos del responsable afectado
          await recalcularSaldosAfectados(responsableIdAfectado);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
        } catch (error) {
          console.error("Error al eliminar movimiento:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar movimiento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSelectionChange = (e) => {
    setSelectedMovimientos(e.value);
  };

  // Templates para las columnas
  const fechaMovimientoTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
  };

  const montoTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );

    const codigoMoneda = moneda?.codigoSunat || "PEN";
    let backgroundColor = "#fff9c4";
    if (codigoMoneda === "USD") {
      backgroundColor = "#c8e6c9";
    } else if (codigoMoneda !== "PEN") {
      backgroundColor = "#b3e5fc";
    }

    const montoFormateado = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: codigoMoneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData.monto);

    return (
      <div
        style={{
          backgroundColor: backgroundColor,
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "bold",
          textAlign: "right",
        }}
      >
        {montoFormateado}
      </div>
    );
  };

  const descripcionTemplate = (rowData) => {
    return rowData.descripcion || "N/A";
  };

  const tipoMovimientoTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId),
    );
    return tipo ? tipo.nombre : "N/A";
  };

  const entregaARendirTagTemplate = (rowData) => {
    return (
      <div className="text-center">
        {rowData.formaParteCalculoEntregaARendir ? (
          <Badge value="SÍ" severity="success" />
        ) : (
          <Badge value="NO" severity="secondary" />
        )}
      </div>
    );
  };

  const categoriaTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId),
    );
    return tipo?.categoria?.nombre || "N/A";
  };

  const asignacionOrigenTemplate = (rowData) => {
    return rowData.asignacionOrigenId || "0";
  };

  const aRendirTemplate = (rowData) => {
    const esAsignacionOrigen =
      rowData.formaParteCalculoEntregaARendir === true &&
      (rowData.asignacionOrigenId === null ||
        rowData.asignacionOrigenId === undefined ||
        Number(rowData.asignacionOrigenId) === 0);

    if (!esAsignacionOrigen) {
      return "N/A";
    }

    if (calculandoSaldos) {
      return (
        <div style={{ textAlign: "right", fontStyle: "italic" }}>
          Calculando...
        </div>
      );
    }

    const saldo = saldosARendir[rowData.id] ?? 0;
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          color: saldo < 0 ? "red" : saldo === 0 ? "orange" : "green",
        }}
      >
        {rowData.moneda?.simbolo || ""} {formatearNumero(saldo, 2)}
      </div>
    );
  };

  const entidadComercialTemplate = (rowData) => {
    if (!rowData.entidadComercialId) return "N/A";

    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId),
    );
    return entidad ? entidad.razonSocial : "N/A";
  };

  const empresaEntidadTemplate = (rowData) => {
    if (!rowData.entidadComercialId) return "N/A";

    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId),
    );

    if (!entidad || !entidad.empresaId) return "N/A";

    const empresa = empresas.find(
      (emp) => Number(emp.id) === Number(entidad.empresaId),
    );

    return empresa ? empresa.razonSocial : "N/A";
  };

  const validacionTesoreriaTemplate = (rowData) => {
    return (
      <div className="text-center">
        <Badge
          value={rowData.validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
          severity={rowData.validadoTesoreria ? "success" : "danger"}
        />
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          aria-label="Editar"
          disabled={!permisos?.puedeEditar}
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para editar"
              : "Editar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminarMovimiento(rowData)}
          aria-label="Eliminar"
          disabled={!permisos?.puedeEditar}
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para eliminar"
              : "Eliminar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };
  const saldoInicialAsignacionTemplate = (rowData) => {
    const movimientoId = Number(rowData.id);
    const saldos = calcularSaldosDetallados[movimientoId];

    // Si no hay saldos calculados, no mostrar
    if (!saldos) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );

    const saldoInicial = saldos.saldoInicial;

    // Determinar color según el saldo
    const esPositivo = saldoInicial >= 0;
    const backgroundColor = esPositivo ? "#3b82f6" : "#ef4444"; // Azul o Rojo
    const textColor = "#ffffff"; // Blanco para contraste

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            padding: "8px 12px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "15px",
            minWidth: "120px",
            textAlign: "right",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {moneda?.simbolo || ""} {formatearNumero(saldoInicial, 2)}
        </div>
      </div>
    );
  };

  const saldoFinalAsignacionTemplate = (rowData) => {
    const movimientoId = Number(rowData.id);
    const saldos = calcularSaldosDetallados[movimientoId];

    // Si no hay saldos calculados, no mostrar
    if (!saldos) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );

    const saldoFinal = saldos.saldoFinal;

    // Determinar color según el saldo
    const esPositivo = saldoFinal >= 0;
    const backgroundColor = esPositivo ? "#3b82f6" : "#ef4444"; // Azul o Rojo
    const textColor = "#ffffff"; // Blanco para contraste

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            padding: "8px 12px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "15px",
            minWidth: "120px",
            textAlign: "right",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {moneda?.simbolo || ""} {formatearNumero(saldoFinal, 2)}
        </div>
      </div>
    );
  };
  /**
   * Template para Comprobante de Movimiento (PDF)
   */
  const comprobanteMovimientoTemplate = (rowData) => {
    if (!rowData.urlComprobanteMovimiento) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <div style={{ textAlign: "center" }}>
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            abrirPdfEnNuevaPestana(
              rowData.urlComprobanteMovimiento,
              toast.current,
              "No hay comprobante de movimiento disponible",
            );
          }}
          tooltip="Ver Comprobante de Movimiento"
          tooltipOptions={{ position: "top" }}
          style={{ color: "#dc2626" }}
        />
      </div>
    );
  };

  /**
   * Template para Comprobante de Operación MovCaja (PDF)
   */
  const comprobanteOperacionTemplate = (rowData) => {
    if (!rowData.urlComprobanteOperacionMovCaja) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <div style={{ textAlign: "center" }}>
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            abrirPdfEnNuevaPestana(
              rowData.urlComprobanteOperacionMovCaja,
              toast.current,
              "No hay comprobante de operación disponible",
            );
          }}
          tooltip="Ver Comprobante de Operación MovCaja"
          tooltipOptions={{ position: "top" }}
          style={{ color: "#dc2626" }}
        />
      </div>
    );
  };

  /**
   * Template para Liquidación de Entrega a Rendir (PDF)
   */
  const liquidacionEntregaTemplate = (rowData) => {
    if (!rowData.urlLiquidacionEntregaARendir) {
      return <div style={{ textAlign: "center", color: "#999" }}>-</div>;
    }

    return (
      <div style={{ textAlign: "center" }}>
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={(e) => {
            e.stopPropagation();
            abrirPdfEnNuevaPestana(
              rowData.urlLiquidacionEntregaARendir,
              toast.current,
              "No hay liquidación de entrega a rendir disponible",
            );
          }}
          tooltip="Ver Liquidación de Entrega a Rendir"
          tooltipOptions={{ position: "top" }}
          style={{ color: "#dc2626" }}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="mt-4">
        <DataTable
          key={`datatable-${Object.keys(saldosARendir).length}`}
          value={obtenerMovimientosFiltrados()}
          selection={selectedMovimientos}
          onSelectionChange={handleSelectionChange}
          selectionMode="single"
          onRowClick={(e) => handleEditarMovimiento(e.data)}
          dataKey="id"
          loading={loading}
          paginator
          rows={50}
          rowsPerPageOptions={[50, 100, 200]}
          emptyMessage="No hay movimientos registrados"
          style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
          rowClassName={(rowData) =>
            rowData.formaParteCalculoEntregaARendir
              ? "p-selectable-row bg-green-50"
              : "p-selectable-row"
          }
          size="small"
          stripedRows
          showGridlines
          sortField="id"
          sortOrder={-1}
          header={
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "end",
                  marginTop: 18,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h1>Rendición de Gastos xxxx</h1>
                </div>
                <div style={{ flex: 0.25 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    severity="success"
                    onClick={handleNuevoMovimiento}
                    disabled={!permisos?.puedeCrear}
                    tooltip={
                      !permisos?.puedeCrear
                        ? "No tiene permisos para crear"
                        : "Crear nuevo movimiento"
                    }
                    tooltipOptions={{ position: "top" }}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Gastos a Rendir</label>
                  <Button
                    label={obtenerPropiedadesFiltroGastosARendir().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroGastosARendir}
                    severity={obtenerPropiedadesFiltroGastosARendir().severity}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 0.25 }}>
                  <label htmlFor="">Entrega a Rendir</label>
                  <Button
                    label={obtenerPropiedadesFiltroEntregaARendir().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroEntregaARendir}
                    severity={obtenerPropiedadesFiltroEntregaARendir().severity}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 0.25 }}>
                  <label htmlFor="">Validación Tesorería</label>
                  <Button
                    label={obtenerPropiedadesFiltroValidacionTesoreria().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroValidacionTesoreria}
                    severity={
                      obtenerPropiedadesFiltroValidacionTesoreria().severity
                    }
                    type="button"
                    raised
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 0.25 }}>
                  <Button
                    icon="pi pi-filter-slash"
                    className="p-button-outlined"
                    onClick={limpiarFiltros}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                    tooltip="Limpiar filtros"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
                <div style={{ flex: 0.35, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Button
                    label="Recalcular Saldos"
                    icon={
                      recalculandoSaldos
                        ? "pi pi-spin pi-spinner"
                        : "pi pi-calculator"
                    }
                    className="p-button-warning"
                    severity="warning"
                    onClick={recalcularYGuardarSaldos}
                    disabled={recalculandoSaldos || !permisos?.puedeEditar}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                    tooltip={
                      !permisos?.puedeEditar
                        ? "No tiene permisos para recalcular"
                        : "Recalcular y guardar saldos en BD"
                    }
                    tooltipOptions={{ position: "top" }}
                  />
                  {recalculandoSaldos && totalRecalculo > 0 && (
                    <ProgressBar
                      value={Math.round((progresoRecalculo / totalRecalculo) * 100)}
                      style={{ height: '6px' }}
                      showValue={false}
                    />
                  )}
                </div>
                <div style={{ flex: 0.25 }}>
                  <Button
                    label="Detectar Errores"
                    icon="pi pi-exclamation-triangle"
                    className="p-button-help"
                    severity="help"
                    onClick={detectarErroresGastos}
                    disabled={recalculandoSaldos || !permisos?.puedeEditar}
                    type="button"
                    raised
                    style={{ width: "100%" }}
                    tooltip="Detectar errores en gastos"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroAsignacionSeleccionada}
                    options={obtenerAsignacionesDisponibles}
                    optionValue="value"
                    placeholder="Seleccionar Asignación"
                    onChange={(e) => setFiltroAsignacionSeleccionada(e.value)}
                    itemTemplate={asignacionItemTemplate}
                    valueTemplate={asignacionValueTemplate}
                    showClear
                    filter
                    filterBy="descripcion,id"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCategoriaMovimiento}
                    options={obtenerOpcionesCategoriasDisponibles}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Categoría"
                    onChange={(e) => setFiltroCategoriaMovimiento(e.value)}
                    style={{ width: "100%" }}
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroTipoMovimiento}
                    options={obtenerOpcionesTiposMovimientoDisponibles}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Tipo de Movimiento"
                    onChange={(e) => setFiltroTipoMovimiento(e.value)}
                    style={{ width: "100%" }}
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCentroCosto}
                    options={obtenerOpcionesCentrosCostoDisponibles}
                    optionLabel="displayLabel"
                    optionValue="id"
                    placeholder="Filtrar por Centro de Costo"
                    onChange={(e) => setFiltroCentroCosto(e.value)}
                    style={{ width: "100%" }}
                    showClear
                    filter
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroEntidadComercial}
                    options={obtenerOpcionesEntidadesDisponibles}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filtrar por Entidad Comercial"
                    onChange={(e) => setFiltroEntidadComercial(e.value)}
                    showClear
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroEmpresa}
                    options={obtenerOpcionesEmpresasDisponibles}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filtrar por Empresa"
                    onChange={(e) => setFiltroEmpresa(e.value)}
                    showClear
                    filter
                    style={{ width: "100%" }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Dropdown
                    value={filtroResponsable}
                    options={obtenerOpcionesResponsablesDisponibles}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filtrar por Responsable"
                    onChange={(e) => setFiltroResponsable(e.value)}
                    showClear
                    filter
                    style={{ flex: 1 }}
                  />
                  {filtroResponsable &&
                    (() => {
                      const selectedPersonal = personal.find(
                        (p) => Number(p.id) === Number(filtroResponsable),
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
                            width: "55px",
                            height: "55px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #dee2e6",
                          }}
                        />
                      );
                    })()}
                </div>
                <div style={{ flex: 1 }}>
                  <Calendar
                    id="rangoFechas"
                    value={filtroRangoFechas}
                    onChange={(e) => setFiltroRangoFechas(e.value)}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccionar rango de fechas"
                    showButtonBar
                    locale="es"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          }
        >
          <Column
            selectionMode="single"
            headerStyle={{ width: "3rem" }}
          ></Column>
          <Column field="id" header="Id" sortable />
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={fechaMovimientoTemplate}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Categoría"
            body={categoriaTemplate}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Tipo"
            body={tipoMovimientoTemplate}
            sortable
          />
          <Column
            field="descripcion"
            header="Descripción"
            body={descripcionTemplate}
            sortable
          />
          <Column field="monto" header="Monto" body={montoTemplate} sortable />
          <Column
            field="validadoTesoreria"
            header="Validación Tesorería"
            body={validacionTesoreriaTemplate}
            sortable
          />
          <Column
            field="asignacionOrigenId"
            header="A/Origen"
            body={asignacionOrigenTemplate}
            sortable
          />
          <Column
            field="formaParteCalculoEntregaARendir"
            header="E/R"
            body={entregaARendirTagTemplate}
            sortable
            style={{ width: "50px", textAlign: "center" }}
          />
          <Column
            field="producto.descripcionArmada"
            header="Producto/Gasto"
            body={(rowData) =>
              rowData.producto?.descripcionArmada || "Sin producto"
            }
            sortable
          />
          <Column
            field="entidadComercial.empresaId"
            header="Empresa Entidad"
            body={empresaEntidadTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="entidadComercialId"
            header="Entidad Comercial"
            body={entidadComercialTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />

          <Column
            field="saldoInicialAsignacion"
            header="Saldo Inicial"
            body={saldoInicialAsignacionTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="saldoFinalAsignacion"
            header="Saldo Final"
            body={saldoFinalAsignacionTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="urlComprobanteMovimiento"
            header="Comprob. Movim."
            body={comprobanteMovimientoTemplate}
            headerStyle={{ width: "80px", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            field="urlComprobanteOperacionMovCaja"
            header="Comprob. Oper."
            body={comprobanteOperacionTemplate}
            headerStyle={{ width: "80px", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            field="urlLiquidacionEntregaARendir"
            header="Liquid. Entrega"
            body={liquidacionEntregaTemplate}
            headerStyle={{ width: "80px", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            headerStyle={{ width: "8rem", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showMovimientoForm}
        style={{ width: "95vw" }}
        header={editingMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
        modal
        className="p-fluid"
        closable={false}
        maximizable
        maximized={true}
      >
        <DetMovsRendicionGastosForm
          movimiento={editingMovimiento}
          rendicionGastos={null}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          categorias={categorias}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          empresas={empresas}
          movimientosAsignacionEntregaRendir={
            movimientosAsignacionEntregaRendir
          }
          todosLosMovimientos={movimientos}
          onGuardadoExitoso={handleGuardarMovimiento}
          onCancelar={() => {
            setShowMovimientoForm(false);
            setEditingMovimiento(null);
            cargarDatos();
          }}
          onEntidadComercialCreada={handleEntidadComercialCreada}
          permisos={permisos}
        />
      </Dialog>




      {/* Diálogo de Resultados del Recálculo */}
      <Dialog
        header={resultadosRecalculo?.esDeteccion ? "🔍 Detección de Errores" : "📊 Resultados del Recálculo"}
        visible={mostrarDialogoResultados}
        style={{ width: '50vw' }}
        onHide={() => setMostrarDialogoResultados(false)}
        footer={
          <div>
            <Button
              label="Cerrar"
              icon="pi pi-times"
              onClick={() => setMostrarDialogoResultados(false)}
              className="p-button-text"
            />
          </div>
        }
      >
        {resultadosRecalculo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Resumen */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {resultadosRecalculo.total}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Total Movimientos
                </div>
              </div>
              {!resultadosRecalculo.esDeteccion && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    {resultadosRecalculo.actualizados}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Actualizados
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: resultadosRecalculo.errores.length > 0 ? '#ef4444' : '#10b981' }}>
                  {resultadosRecalculo.errores.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {resultadosRecalculo.esDeteccion ? 'Errores Detectados' : 'Errores'}
                </div>
              </div>
            </div>

            {/* Mensaje de éxito o error */}
            {resultadosRecalculo.exitoso ? (
              <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', color: '#065f46' }}>
                <i className="pi pi-check-circle" style={{ marginRight: '0.5rem' }}></i>
                {resultadosRecalculo.esDeteccion
                  ? '¡No se detectaron errores! Todos los gastos tienen la información completa.'
                  : '¡Recálculo completado exitosamente! Todos los saldos fueron actualizados correctamente.'}
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: '#991b1b' }}>
                <i className="pi pi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                {resultadosRecalculo.esDeteccion
                  ? `Se detectaron ${resultadosRecalculo.errores.length} movimientos con errores que deben corregirse.`
                  : `Se encontraron ${resultadosRecalculo.errores.length} errores durante el recálculo.`}
              </div>
            )}

            {/* Lista de errores */}
            {resultadosRecalculo.errores.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Detalle de Errores:</h4>
                <DataTable
                  value={resultadosRecalculo.errores}
                  scrollable
                  scrollHeight="300px"
                  size="small"
                  stripedRows
                >
                  <Column field="id" header="ID" style={{ width: '80px' }} />
                  <Column field="descripcion" header="Descripción" />
                  <Column
                    field="monto"
                    header="Monto"
                    body={(rowData) => `S/ ${Number(rowData.monto || 0).toFixed(2)}`}
                    style={{ width: '120px' }}
                  />
                  <Column field="responsable" header="Responsable" style={{ width: '200px' }} />
                  <Column
                    field={resultadosRecalculo.esDeteccion ? "errores" : "error"}
                    header="Error"
                    body={(rowData) => (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        {resultadosRecalculo.esDeteccion
                          ? rowData.errores.join(', ')
                          : rowData.error}
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            )}
          </div>
        )}
      </Dialog>


    </div>
  );
}
