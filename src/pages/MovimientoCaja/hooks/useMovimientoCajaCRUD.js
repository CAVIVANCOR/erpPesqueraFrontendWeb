import { useState, useCallback } from "react";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

// APIs
import { getAllMovimientoCaja, crearMovimientoCaja, actualizarMovimientoCaja, eliminarMovimientoCaja, validarMovimientoCaja, aprobarMovimientoCaja, rechazarMovimientoCaja, revertirMovimientoCaja } from "../../../api/movimientoCaja";
import { MODULOS_ORIGEN, ESTADOS } from "../utils/constants";

const useMovimientoCajaCRUD = ({
  toast,
  setLoading,
  setShowDialog,
  setEditingMovimiento,
  recargarDatos,
  empresas,
  monedas,
  tipoMovEntregaRendir,
  tipoReferenciaMovimientoCaja,
  cuentasCorrientes,
  entidadesComerciales,
  cuentasEntidadComercial,
  centrosCosto,
  personal,
  modulos,
  productos,
  estadosMultiFuncion
}) => {
  // Zustand state
  const userInfo = useAuthStore((state) => state.userInfo);

  // States para workflow
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [showRevertirDialog, setShowRevertirDialog] = useState(false);
  const [movimientoWorkflow, setMovimientoWorkflow] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [motivoReversion, setMotivoReversion] = useState("");
  const [saldosGenerados, setSaldosGenerados] = useState([]);
  const [showSaldosDialog, setShowSaldosDialog] = useState(false);

  // Crear nuevo movimiento
  const handleCrear = useCallback(() => {
    const nuevoMovimiento = {
      id: null,
      fechaOperacionMovCaja: new Date(),
      tipoMovimientoId: null,
      empresaOrigenId: userInfo?.empresaId || null,
      cuentaCorrienteOrigenId: null,
      empresaDestinoId: null,
      cuentaCorrienteDestinoId: null,
      entidadComercialId: null,
      cuentaDestinoEntidadComercialId: null,
      monto: null,
      monedaId: null,
      descripcion: "",
      referenciaExtId: null,
      tipoReferenciaId: null,
      usuarioId: userInfo?.id || null,
      estadoId: ESTADOS.PENDIENTE,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      centroCostoId: null,
      moduloOrigenMotivoOperacionId: null,
      origenMotivoOperacionId: null,
      fechaMotivoOperacion: null,
      usuarioMotivoOperacionId: null,
      operacionSinFactura: false,
      generarAsientoContable: false,
      incluirEnReporteFiscal: false,
      motivoSinFactura: ""
    };

    setEditingMovimiento(nuevoMovimiento);
    setShowDialog(true);
  }, [userInfo, setShowDialog, setEditingMovimiento]);

  // Editar movimiento existente
  const handleEditar = useCallback((movimiento) => {
    setEditingMovimiento({ ...movimiento });
    setShowDialog(true);
  }, [setShowDialog, setEditingMovimiento]);

  // Guardar movimiento (crear o actualizar)
  const handleGuardar = useCallback(async (movimientoData) => {
    try {
      setLoading(true);

      const datosGuardar = {
        ...movimientoData,
        usuarioId: userInfo?.id,
        empresaOrigenId: userInfo?.empresaId
      };

      const esEdicion = !!movimientoData.id;

      if (esEdicion) {
        // Actualizar - Patrón replicado de MovimientoCajaAnteriorOK.jsx líneas 824-839
        await actualizarMovimientoCaja(movimientoData.id, datosGuardar);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Registro actualizado correctamente.",
          life: 3000,
        });
        
        // Recargar movimiento actualizado sin cerrar diálogo
        const movimientoActualizado = await getAllMovimientoCaja();
        const movActualizado = movimientoActualizado.find(
          (m) => Number(m.id) === Number(movimientoData.id),
        );
        if (movActualizado) {
          setEditingMovimiento(movActualizado);
        }
        await recargarDatos();
        
      } else {
        // Crear - Patrón replicado de MovimientoCajaAnteriorOK.jsx líneas 840-858
        const nuevoMovimiento = await crearMovimientoCaja(datosGuardar);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Registro creado exitosamente. Puede continuar editando o cerrar la ventana.",
          life: 4000,
        });
        
        // Recargar movimiento creado sin cerrar diálogo
        const movimientos = await getAllMovimientoCaja();
        const movimientoCreado = movimientos.find(
          (m) => Number(m.id) === Number(nuevoMovimiento.id),
        );
        if (movimientoCreado) {
          setEditingMovimiento(movimientoCreado);
        }
        await recargarDatos();
      }

    } catch (error) {
      console.error("Error guardando movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al guardar el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo, setLoading, setEditingMovimiento, recargarDatos, toast]);

  // Eliminar movimiento
  const handleEliminar = useCallback(async (movimiento) => {
    try {
      setLoading(true);
      await eliminarMovimientoCaja(movimiento.id);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al eliminar el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [recargarDatos, toast]);

  // Validar movimiento - PATRÓN REPLICADO DE MovimientoCajaAnteriorOK.jsx líneas 875-916
  const handleValidarMovimiento = useCallback(async (movimiento) => {
    try {
      setLoading(true);
      const response = await validarMovimientoCaja(movimiento.id);

      if (response.saldosGenerados && response.saldosGenerados.length > 0) {
        setSaldosGenerados(response.saldosGenerados);
        setShowSaldosDialog(true);
      }

      toast.current?.show({
        severity: "success",
        summary: "Validado",
        detail: "Movimiento validado correctamente y saldos generados.",
        life: 4000,
      });

      // Recargar movimiento validado sin cerrar diálogo
      const movimientos = await getAllMovimientoCaja();
      const movimientoValidado = movimientos.find(
        (m) => Number(m.id) === Number(movimiento.id),
      );
      if (movimientoValidado) {
        setEditingMovimiento(movimientoValidado);
      }
      await recargarDatos();

    } catch (error) {
      console.error("Error validando movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al validar el movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setEditingMovimiento, setSaldosGenerados, setShowSaldosDialog, recargarDatos, toast]);

  // Aplicar movimientos desde tabs - PATRÓN REPLICADO DE MovimientoCajaAnteriorOK.jsx líneas 1081-1279
  const handleAplicarMovimientos = useCallback(async (movimientoSeleccionado, tipoOrigen) => {
    if (!movimientoSeleccionado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un movimiento",
        life: 3000,
      });
      return;
    }

    try {
      const estadoPendiente = estadosMultiFuncion.find(
        (estado) => Number(estado.id) === 20,
      );

      if (!estadoPendiente) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el estado PENDIENTE (id=20)",
          life: 3000,
        });
        return;
      }

      // Determinar módulo origen
      let moduloOrigenId = movimientoSeleccionado.moduloOrigenMovCajaId
        ? Number(movimientoSeleccionado.moduloOrigenMovCajaId)
        : null;

      if (!moduloOrigenId) {
        if (tipoOrigen === "industrial") {
          moduloOrigenId = 2;
        } else if (tipoOrigen === "consumo") {
          moduloOrigenId = 3;
        } else if (tipoOrigen === "compras") {
          moduloOrigenId = 4;
        } else if (tipoOrigen === "ventas") {
          moduloOrigenId = 5;
        } else if (tipoOrigen === "almacen") {
          moduloOrigenId = 6;
        } else if (tipoOrigen === "servicios") {
          moduloOrigenId = 7;
        } else if (tipoOrigen === "otMantenimiento") {
          moduloOrigenId = 8;
        }
      }

      // Determinar empresa destino
      let empresaDestinoId = userInfo?.empresaId;

      // Buscar la primera cuenta corriente de la empresa destino
      let cuentaCorrienteOrigenId = null;
      if (empresaDestinoId) {
        const cuentasEmpresa = cuentasCorrientes.filter(
          (cc) => Number(cc.empresaId) === Number(empresaDestinoId),
        );
        if (cuentasEmpresa.length > 0) {
          cuentaCorrienteOrigenId = Number(cuentasEmpresa[0].id);
        }
      }

      // Preparar datos iniciales para el diálogo
      const datosIniciales = {
        empresaOrigenId: empresaDestinoId ? Number(empresaDestinoId) : null,
        empresaDestinoId: empresaDestinoId ? Number(empresaDestinoId) : null,
        cuentaCorrienteOrigenId: cuentaCorrienteOrigenId,
        tipoMovimientoId: movimientoSeleccionado.tipoMovimientoId
          ? Number(movimientoSeleccionado.tipoMovimientoId)
          : null,
        entidadComercialId: movimientoSeleccionado.entidadComercialId
          ? Number(movimientoSeleccionado.entidadComercialId)
          : null,
        monto: Number(movimientoSeleccionado.monto) || 0,
        monedaId: movimientoSeleccionado.monedaId
          ? Number(movimientoSeleccionado.monedaId)
          : null,
        descripcion: movimientoSeleccionado.descripcion || "",
        fechaMotivoOperacion: movimientoSeleccionado.fechaMovimiento
          ? new Date(movimientoSeleccionado.fechaMovimiento)
          : null,
        usuarioMotivoOperacionId: movimientoSeleccionado.responsableId
          ? Number(movimientoSeleccionado.responsableId)
          : null,
        moduloOrigenMotivoOperacionId: moduloOrigenId,
        estadoId: Number(estadoPendiente.id),
        centroCostoId: movimientoSeleccionado.centroCostoId
          ? Number(movimientoSeleccionado.centroCostoId)
          : null,
        origenMotivoOperacionId: Number(movimientoSeleccionado.id),
        operacionSinFactura: movimientoSeleccionado.operacionSinFactura || false,
        productoId: movimientoSeleccionado.productoId
          ? Number(movimientoSeleccionado.productoId)
          : null,
        cuentaCorrienteDestinoId: null,
        referenciaExtId: null,
        tipoReferenciaId: null,
        usuarioId: userInfo?.id ? Number(userInfo.id) : null,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        fechaOperacionMovCaja: new Date(),
        generarAsientoContable: false,
        incluirEnReporteFiscal: false,
        motivoSinFactura: "",
        movimientoAplicado: movimientoSeleccionado,
        tipoOrigen: tipoOrigen,
      };

      // Abrir diálogo con datos prellenados
      setEditingMovimiento(datosIniciales);
      setShowDialog(true);

    } catch (error) {
      console.error("Error al preparar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al preparar los datos del movimiento",
        life: 3000,
      });
    }
  }, [userInfo, estadosMultiFuncion, cuentasCorrientes, setEditingMovimiento, setShowDialog, toast]);

  // Handlers de workflow
  const handleAprobar = useCallback((movimiento) => {
    setMovimientoWorkflow(movimiento);
    setShowAprobarDialog(true);
  }, []);

  const handleRechazar = useCallback((movimiento) => {
    setMovimientoWorkflow(movimiento);
    setMotivoRechazo("");
    setShowRechazarDialog(true);
  }, []);

  const handleRevertir = useCallback((movimiento) => {
    setMovimientoWorkflow(movimiento);
    setMotivoReversion("");
    setShowRevertirDialog(true);
  }, []);

  const handleAprobarConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await aprobarMovimientoCaja(movimientoWorkflow.id, userInfo?.id);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento aprobado correctamente",
        life: 3000,
      });

      setShowAprobarDialog(false);
      setMovimientoWorkflow(null);
      await recargarDatos();

    } catch (error) {
      console.error("Error aprobando movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al aprobar movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [movimientoWorkflow, userInfo, setLoading, recargarDatos, toast]);

  const handleRechazarConfirm = useCallback(async () => {
    if (!motivoRechazo.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar un motivo de rechazo",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await rechazarMovimientoCaja(movimientoWorkflow.id, userInfo?.id, motivoRechazo);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento rechazado correctamente",
        life: 3000,
      });

      setShowRechazarDialog(false);
      setMovimientoWorkflow(null);
      setMotivoRechazo("");
      await recargarDatos();

    } catch (error) {
      console.error("Error rechazando movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al rechazar movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [movimientoWorkflow, userInfo, motivoRechazo, setLoading, recargarDatos, toast]);

  const handleRevertirConfirm = useCallback(async () => {
    if (!motivoReversion.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar un motivo de reversión",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await revertirMovimientoCaja(movimientoWorkflow.id, userInfo?.id, motivoReversion);
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Movimiento revertido correctamente",
        life: 3000,
      });

      setShowRevertirDialog(false);
      setMovimientoWorkflow(null);
      setMotivoReversion("");
      await recargarDatos();

    } catch (error) {
      console.error("Error revirtiendo movimiento:", error);
      const mensaje = error.response?.data?.mensaje || error.message || "Error al revertir movimiento";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensaje,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [movimientoWorkflow, userInfo, motivoReversion, setLoading, recargarDatos, toast]);

  return {
    // Actions principales
    handleCrear,
    handleEditar,
    handleGuardar,
    handleEliminar,
    handleValidarMovimiento,
    handleAplicarMovimientos,

    // Workflow
    handleAprobar,
    handleRechazar,
    handleRevertir,
    handleAprobarConfirm,
    handleRechazarConfirm,
    handleRevertirConfirm,

    // States workflow
    showAprobarDialog,
    showRechazarDialog,
    showRevertirDialog,
    movimientoWorkflow,
    motivoRechazo,
    motivoReversion,
    saldosGenerados,
    showSaldosDialog,

    // Setters
    setShowAprobarDialog,
    setShowRechazarDialog,
    setShowRevertirDialog,
    setMovimientoWorkflow,
    setMotivoRechazo,
    setMotivoReversion,
    setSaldosGenerados,
    setShowSaldosDialog
  };
};

export default useMovimientoCajaCRUD;