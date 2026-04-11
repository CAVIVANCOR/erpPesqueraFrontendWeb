// src/components/temporadaPesca/DetEntregaRendirPescaIndustrial.jsx
// Componente autónomo para gestión de detalle de entregas a rendir en pesca industrial
import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import DetMovsEntregaRendirForm from "./DetMovsEntregaRendirForm";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { generarYSubirPDFLiquidacionPI } from "./LiquidacionPescaIndustrialPDF";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";

export default function DetEntregaRendirPescaIndustrial({
  // Props de datos
  entregaARendir,
  temporadaPesca = null,
  movimientos = [],
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  categorias = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  productos = [],
  // Props de estado
  temporadaPescaIniciada = false,
  loading = false,
  selectedMovimientos = [],
  // Props de callbacks
  onSelectionChange,
  onDataChange,
  readOnly = false,
  permisos,
}) {
  // Estados locales para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroEntregaARendir, setFiltroEntregaARendir] = useState(null);
  const [filtroCategoriaMovimiento, setFiltroCategoriaMovimiento] =
    useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);
  // Estados para el dialog
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [saldosARendir, setSaldosARendir] = useState({});
  const [calculandoSaldos, setCalculandoSaldos] = useState(false);
  // Calcular saldos A Rendir con conversión de moneda
  // Calcular saldos A Rendir con conversión de moneda
  useEffect(() => {
    const calcularSaldosConConversion = async () => {
      setCalculandoSaldos(true);
      const nuevosSaldos = {};
      // Identificar asignaciones origen
      const asignacionesOrigen = movimientos.filter(
        (mov) =>
          mov.formaParteCalculoEntregaARendir === true &&
          (mov.asignacionOrigenId === null ||
            mov.asignacionOrigenId === undefined ||
            Number(mov.asignacionOrigenId) === 0),
      );
      for (const asignacion of asignacionesOrigen) {
        // Buscar gastos asociados a esta asignación
        const gastosAsociados = movimientos.filter(
          (mov) =>
            mov.asignacionOrigenId &&
            Number(mov.asignacionOrigenId) === Number(asignacion.id),
        );
        let totalGastosConvertidos = 0;
        // Procesar cada gasto
        for (const gasto of gastosAsociados) {
          let montoConvertido = Number(gasto.monto || 0);

          // Si la moneda del gasto es diferente a la de la asignación, convertir
          if (Number(gasto.monedaId) !== Number(asignacion.monedaId)) {
            try {
              // Obtener fecha del movimiento en formato YYYY-MM-DD
              const fecha = new Date(gasto.fechaMovimiento);
              const fechaISO = fecha.toISOString().split("T")[0];

              // Consultar tipo de cambio SUNAT
              const tipoCambioData = await consultarTipoCambioSunat({
                date: fechaISO,
              });

              if (tipoCambioData && tipoCambioData.sell_price) {
                const tipoCambio = parseFloat(tipoCambioData.sell_price);

                // Determinar dirección de conversión
                // Asumiendo: monedaId=1 es PEN (Soles), monedaId=2 es USD (Dólares)
                if (
                  Number(asignacion.monedaId) === 1 &&
                  Number(gasto.monedaId) === 2
                ) {
                  // Convertir USD a PEN: multiplicar por tipo de cambio
                  montoConvertido = Number(gasto.monto) * tipoCambio;
                } else if (
                  Number(asignacion.monedaId) === 2 &&
                  Number(gasto.monedaId) === 1
                ) {
                  // Convertir PEN a USD: dividir por tipo de cambio
                  montoConvertido = Number(gasto.monto) / tipoCambio;
                }
              }
            } catch (error) {
              console.error(
                `Error al convertir moneda para gasto ${gasto.id}:`,
                error,
              );
              // Si falla la conversión, usar monto original (sin conversión)
            }
          }

          totalGastosConvertidos += montoConvertido;
        }

        // Calcular saldo
        const saldo = Number(asignacion.monto || 0) - totalGastosConvertidos;
        nuevosSaldos[asignacion.id] = saldo;
      }
      setSaldosARendir(nuevosSaldos);
      setCalculandoSaldos(false);
    };

    if (movimientos && movimientos.length > 0) {
      calcularSaldosConConversion();
    } else {
      setSaldosARendir({});
      setCalculandoSaldos(false);
    }
  }, [movimientos]);

  // Filtrar movimientos que son asignaciones (inicial o adicional) y forman parte del cálculo
  // Excluir el movimiento actual si está en edición
  const movimientosAsignacionEntregaRendir = (movimientos || []).filter(
    (mov) =>
      mov.formaParteCalculoEntregaARendir === true &&
      (mov.asignacionOrigenId === null ||
        mov.asignacionOrigenId === undefined ||
        Number(mov.asignacionOrigenId) === 0) &&
      (!editingMovimiento || Number(mov.id) !== Number(editingMovimiento.id)),
  );
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Función para obtener movimientos filtrados
  const obtenerMovimientosFiltrados = () => {
    let movimientosFiltrados = [...movimientos];

    if (filtroTipoMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.tipoMovimientoId) === Number(filtroTipoMovimiento),
      );
    }

    if (filtroCentroCosto) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.centroCostoId) === Number(filtroCentroCosto),
      );
    }

    if (filtroEntregaARendir !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.formaParteCalculoEntregaARendir === filtroEntregaARendir,
      );
    }

    if (filtroCategoriaMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        // Usar la relación directa: DetMovsEntregaRendir.tipoMovimiento.categoria.id
        const categoriaId =
          mov.tipoMovimiento?.categoria?.id || mov.tipoMovimiento?.categoriaId;
        const cumpleFiltro =
          categoriaId &&
          Number(categoriaId) === Number(filtroCategoriaMovimiento);

        return cumpleFiltro;
      });
    }

    if (filtroValidacionTesoreria !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.validadoTesoreria === filtroValidacionTesoreria,
      );
    }
    return movimientosFiltrados;
  };

  // Funciones para filtros
  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroEntregaARendir(null);
    setFiltroCategoriaMovimiento(null);
    setFiltroValidacionTesoreria(null);
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
        await actualizarDetMovsEntregaRendir(editingMovimiento.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
        // NO recargar datos para evitar que se cierre el formulario
        return; // No cerrar el formulario
      } else {
        const movimientoCreado = await crearDetMovsEntregaRendir(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail:
            "Movimiento creado correctamente. Ahora puede agregar gastos planificados.",
          life: 3000,
        });
        // Cambiar a modo edición con el movimiento recién creado
        setEditingMovimiento(movimientoCreado);
        return; // No cerrar el formulario
      }

      // Este código ya no se ejecuta porque ambos casos hacen return
      setShowMovimientoForm(false);
      setEditingMovimiento(null);
      onDataChange?.();
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
          await eliminarDetMovsEntregaRendir(movimiento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          onDataChange?.();
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

  const handleProcesarLiquidacion = () => {
    confirmDialog({
      message:
        "¿Está seguro de procesar la liquidación? Esta acción generará el PDF automáticamente, bloqueará todas las modificaciones futuras y no se puede deshacer.",
      header: "Confirmar Procesamiento de Liquidación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const fechaActual = new Date();

          // 1. Actualizar todos los movimientos DetMovsEntregaRendir - SOLO campos escalares
          const promesasActualizacion = movimientos.map((movimiento) => {
            const movimientoActualizado = {
              entregaARendirId: movimiento.entregaARendirId,
              responsableId: movimiento.responsableId,
              fechaMovimiento: movimiento.fechaMovimiento,
              tipoMovimientoId: movimiento.tipoMovimientoId,
              productoId: movimiento.productoId,
              monto: movimiento.monto,
              descripcion: movimiento.descripcion,
              creadoEn: movimiento.creadoEn,
              actualizadoEn: fechaActual,
              centroCostoId: movimiento.centroCostoId,
              urlComprobanteMovimiento: movimiento.urlComprobanteMovimiento,
              validadoTesoreria: true,
              fechaValidacionTesoreria: fechaActual,
              operacionSinFactura: movimiento.operacionSinFactura,
              fechaOperacionMovCaja: movimiento.fechaOperacionMovCaja,
              operacionMovCajaId: movimiento.operacionMovCajaId,
              moduloOrigenMovCajaId: movimiento.moduloOrigenMovCajaId,
              entidadComercialId: movimiento.entidadComercialId,
              monedaId: movimiento.monedaId,
              urlComprobanteOperacionMovCaja:
                movimiento.urlComprobanteOperacionMovCaja,
              tipoDocumentoId: movimiento.tipoDocumentoId,
              numeroSerieComprobante: movimiento.numeroSerieComprobante,
              numeroCorrelativoComprobante:
                movimiento.numeroCorrelativoComprobante,
            };
            return actualizarDetMovsEntregaRendir(
              movimiento.id,
              movimientoActualizado,
            );
          });

          await Promise.all(promesasActualizacion);

          // 2. Cargar entrega completa con relaciones para el PDF
          const token = useAuthStore.getState().token;
          const headers = { Authorization: `Bearer ${token}` };

          const entregaResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/entregas-a-rendir/${entregaARendir.id}`,
            { headers },
          );
          const entregaCompleta = await entregaResponse.json();

          // 3. Cargar empresa
          let empresa;
          try {
            const empresaResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/empresas/1`,
              { headers },
            );
            if (empresaResponse.ok) {
              empresa = await empresaResponse.json();
            }
          } catch (error) {
            console.error("Error cargando empresa:", error);
            empresa = {
              razonSocial: "EMPRESA",
              ruc: "N/A",
              direccion: "N/A",
            };
          }

          // 4. Generar PDF automáticamente
          const resultadoPdf = await generarYSubirPDFLiquidacionPI(
            {
              ...entregaCompleta,
              respLiquidacionId: usuario?.personalId || null,
              entregaLiquidada: true,
              fechaLiquidacion: fechaActual,
            },
            movimientos,
            empresa,
          );

          if (!resultadoPdf.success) {
            throw new Error(resultadoPdf.error || "Error al generar el PDF");
          }

          toast.current?.show({
            severity: "success",
            summary: "Liquidación Procesada",
            detail:
              "La entrega a rendir ha sido liquidada exitosamente y el PDF ha sido generado",
            life: 5000,
          });

          onDataChange?.();
        } catch (error) {
          console.error("Error al procesar liquidación:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.message || "Error al procesar la liquidación",
            life: 5000,
          });
        }
      },
    });
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
    const simboloMoneda = moneda?.simbolo || "S/.";

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
    // Solo mostrar para asignaciones origen
    const esAsignacionOrigen =
      rowData.formaParteCalculoEntregaARendir === true &&
      (rowData.asignacionOrigenId === null ||
        rowData.asignacionOrigenId === undefined ||
        Number(rowData.asignacionOrigenId) === 0);

    if (!esAsignacionOrigen) {
      return "N/A";
    }

    // Obtener saldo precalculado (con conversión de moneda)
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

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId),
    );
    return centro ? centro.Codigo + " - " + centro.Nombre : "N/A";
  };

  const entidadComercialTemplate = (rowData) => {
    if (!rowData.entidadComercialId) return "N/A";

    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId),
    );
    return entidad ? entidad.razonSocial : "N/A";
  };
  
  const gastoPlanificadoTemplate = (rowData) => {
    // Verificar si existe la relación enlaceGastoPlanificado
    if (!rowData.enlaceGastoPlanificado) {
      return <span style={{ color: "#999", fontStyle: "italic" }}>Sin gasto planificado</span>;
    }

    // Mostrar descripcionArmada del producto del gasto planificado
    const descripcion = rowData.enlaceGastoPlanificado.producto?.descripcionArmada 
      || rowData.enlaceGastoPlanificado.producto?.nombre 
      || "N/A";

    return (
      <div style={{ fontSize: "0.85rem", color: "#666" }}>
        {descripcion}
      </div>
    );
  };

    const saldoInicialTemplate = (rowData) => {
    // Solo mostrar para asignaciones principales
    const esAsignacionPrincipal =
      rowData.formaParteCalculoEntregaARendir === true &&
      (rowData.asignacionOrigenId === null ||
        rowData.asignacionOrigenId === undefined ||
        Number(rowData.asignacionOrigenId) === 0);

    if (!esAsignacionPrincipal) {
      return "N/A";
    }

    const saldo = Number(rowData.saldoInicialAsignacion || 0);
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          color: saldo > 0 ? "green" : "#666",
        }}
      >
        {rowData.moneda?.simbolo || ""} {formatearNumero(saldo, 2)}
      </div>
    );
  };

    const saldoFinalTemplate = (rowData) => {
    // Solo mostrar para asignaciones principales
    const esAsignacionPrincipal =
      rowData.formaParteCalculoEntregaARendir === true &&
      (rowData.asignacionOrigenId === null ||
        rowData.asignacionOrigenId === undefined ||
        Number(rowData.asignacionOrigenId) === 0);

    if (!esAsignacionPrincipal) {
      return "N/A";
    }

    // Calcular saldo final en tiempo real
    // Saldo Final = Saldo Inicial + Monto Asignación - Total Gastos
    const saldoInicial = Number(rowData.saldoInicialAsignacion || 0);
    const montoAsignacion = Number(rowData.monto || 0);
    
    // Buscar gastos asociados a esta asignación
    const gastosAsociados = movimientos.filter(
      (mov) =>
        mov.asignacionOrigenId &&
        Number(mov.asignacionOrigenId) === Number(rowData.id),
    );
    
    // Sumar total de gastos
    const totalGastos = gastosAsociados.reduce((sum, gasto) => {
      return sum + Number(gasto.monto || 0);
    }, 0);
    
    // Calcular saldo final
    const saldoFinal = saldoInicial + montoAsignacion - totalGastos;

    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          color: saldoFinal < 0 ? "red" : saldoFinal === 0 ? "orange" : "green",
        }}
      >
        {rowData.moneda?.simbolo || ""} {formatearNumero(saldoFinal, 2)}
      </div>
    );
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

  const fechaValidacionTesoreriaTemplate = (rowData) => {
    return rowData.fechaValidacionTesoreria
      ? new Date(rowData.fechaValidacionTesoreria).toLocaleDateString("es-PE")
      : "N/A";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          aria-label="Editar"
          disabled={
            readOnly ||
            entregaARendir?.entregaLiquidada ||
            !permisos?.puedeEditar
          }
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para editar"
              : readOnly || entregaARendir?.entregaLiquidada
                ? "No se puede editar"
                : "Editar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminarMovimiento(rowData)}
          aria-label="Eliminar"
          disabled={
            readOnly ||
            entregaARendir?.entregaLiquidada ||
            !permisos?.puedeEditar
          }
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para eliminar"
              : readOnly || entregaARendir?.entregaLiquidada
                ? "No se puede eliminar"
                : "Eliminar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  if (!entregaARendir) {
    return null;
  }

  return (
    <>
      <div className="mt-4">
        <DataTable
          key={`datatable-${Object.keys(saldosARendir).length}`}
          value={obtenerMovimientosFiltrados()}
          selection={selectedMovimientos}
          onSelectionChange={onSelectionChange}
          selectionMode="single"
          onRowClick={
            readOnly ? undefined : (e) => handleEditarMovimiento(e.data)
          }
          dataKey="id"
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 40]}
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
                  <h3>Detalle de Gastos</h3>
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    severity="success"
                    onClick={handleNuevoMovimiento}
                    disabled={
                      !permisos?.puedeEditar ||
                      readOnly ||
                      !temporadaPescaIniciada ||
                      !entregaARendir ||
                      entregaARendir?.entregaLiquidada
                    }
                    tooltip={
                      !permisos?.puedeEditar
                        ? "No tiene permisos para crear"
                        : readOnly
                          ? "Modo solo lectura"
                          : !temporadaPescaIniciada
                            ? "Temporada de pesca no iniciada"
                            : !entregaARendir
                              ? "No hay entrega a rendir"
                              : entregaARendir?.entregaLiquidada
                                ? "Entrega ya liquidada"
                                : "Crear nuevo movimiento"
                    }
                    tooltipOptions={{ position: "top" }}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Entrega a Rendir</label>
                  <Button
                    label={obtenerPropiedadesFiltroEntregaARendir().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroEntregaARendir}
                    severity={obtenerPropiedadesFiltroEntregaARendir().severity}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
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
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined"
                    onClick={limpiarFiltros}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Procesar Liquidación"
                    icon="pi pi-check"
                    className="p-button-danger"
                    severity="danger"
                    onClick={handleProcesarLiquidacion}
                    type="button"
                    disabled={
                      !permisos?.puedeEditar ||
                      readOnly ||
                      entregaARendir.entregaLiquidada
                    }
                    tooltip={
                      !permisos?.puedeEditar
                        ? "No tiene permisos para procesar liquidación"
                        : readOnly
                          ? "Modo solo lectura"
                          : entregaARendir.entregaLiquidada
                            ? "Entrega ya liquidada"
                            : "Procesar liquidación de la entrega"
                    }
                    tooltipOptions={{ position: "top" }}
                    raised
                  />
                </div>
              </div>

              {/* Sección de Filtros */}
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
                    value={filtroCategoriaMovimiento}
                    options={(() => {
                      const categoriasUnicas = tiposMovimiento
                        .filter((t) => t.categoria && t.categoria.tipo === true)
                        .map((t) => t.categoria)
                        .filter(
                          (cat, index, self) =>
                            index ===
                            self.findIndex(
                              (c) => String(c.id) === String(cat.id),
                            ),
                        );
                      return categoriasUnicas;
                    })()}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Categoría"
                    onChange={(e) => setFiltroCategoriaMovimiento(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroTipoMovimiento}
                    options={tiposMovimiento}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Tipo de Movimiento"
                    onChange={(e) => setFiltroTipoMovimiento(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCentroCosto}
                    options={centrosCosto.map((centro) => ({
                      ...centro,
                      displayLabel: centro.Codigo + " - " + centro.Nombre,
                    }))}
                    optionLabel="displayLabel"
                    optionValue="id"
                    placeholder="Filtrar por Centro de Costo"
                    onChange={(e) => setFiltroCentroCosto(e.value)}
                    className="w-full"
                    showClear
                    filter
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
            field="saldoInicialAsignacion"
            header="Saldo Inicial"
            body={saldoInicialTemplate}
            sortable
            style={{ width: "120px", textAlign: "right" }}
          />
          <Column
            field="saldoFinalAsignacion"
            header="Saldo Final"
            body={saldoFinalTemplate}
            sortable
            style={{ width: "120px", textAlign: "right" }}
          />
          <Column
            field="detalleGastosPlanificados"
            header="Gasto Planificado"
            body={gastoPlanificadoTemplate}
            sortable
          />
          <Column
            field="entidadComercialId"
            header="Entidad Comercial"
            body={entidadComercialTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            headerStyle={{ width: "8rem", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Dialog para DetMovsEntregaRendir */}
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
        <DetMovsEntregaRendirForm
          movimiento={editingMovimiento}
          entregaARendirId={entregaARendir?.id}
          temporadaPesca={temporadaPesca}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          categorias={categorias}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          movimientosAsignacionEntregaRendir={
            movimientosAsignacionEntregaRendir
          }
          onGuardadoExitoso={handleGuardarMovimiento}
          onCancelar={() => {
            setShowMovimientoForm(false);
            setEditingMovimiento(null);
            onDataChange?.();
          }}
        />
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}
