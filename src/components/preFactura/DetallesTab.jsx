// src/components/preFactura/DetallesTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import {
  ProductoSelectorDialog,
  ProductoSelectedDisplay,
} from "../common/productoSelectorConStock";
import {
  getDetallesPreFactura,
  crearDetallePreFactura,
  actualizarDetallePreFactura,
  eliminarDetallePreFactura,
} from "../../api/detallePreFactura";
import AsignarStockDialog from '../common/kardex/asignar-stock/AsignarStockDialog';

export default function DetallesTab({
  preFacturaId,
  productos,
  empresaId,
  empresas,
  puedeEditar,
  toast,
  onCountChange,
  readOnly = false,
  subtotal = 0,
  totalIGV = 0,
  montoImpuestoRenta = 0,
  aplicaImpuestoRenta = false,
  // Impuestos
  aplicaDetraccion = false,
  montoDetraccion = 0,
  porcentajeDetraccion = 0,
  aplicaRetencion = false,
  montoRetencion = 0,
  porcentajeRetencion = 0,
  aplicaPercepcion = false,
  montoPercepcion = 0,
  porcentajePercepcion = 0,
  total = 0,
  porcentajeIGV = 0,
  monedaId = null,
  monedas = [],
  pagosPreviosSI = 0,
  tipoDocumentoId = null,
  tiposDocumentoOptions = [],
  onChange = () => { },
  onEstadoAsignacionChange = () => { },
  // ⭐ NUEVOS PROPS PARA PRECIO AUTOMÁTICO
  clienteId = null,
  fechaDocumento = null,
}) {
  // Obtener entidadComercialId de la empresa seleccionada
  const empresaSeleccionada = empresas?.find(
    (e) => Number(e.id) === Number(empresaId),
  );
  const empresaEntidadComercialId = empresaSeleccionada?.entidadComercialId || null;
  // Detectar si es Saldo Inicial
  const tipoDocSeleccionado = tiposDocumentoOptions.find(
    (t) => Number(t.value) === Number(tipoDocumentoId),
  );
  const esSaldoInicial = tipoDocSeleccionado?.label?.startsWith("SI-");
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false); // ⭐ NUEVO
  const [usarUnidadComercial, setUsarUnidadComercial] = useState(false); // ⭐ NUEVO - Unidades comerciales
  const [detalleActual, setDetalleActual] = useState({
    productoId: null,
    cantidad: 1,
    precioUnitario: 0,
    cantidadVenta: null,
    precioUnitarioVenta: null,
  });
  // ⭐ ESTADOS PARA ASIGNACIÓN DE STOCK (FASE 1 y FASE 2)
  const [asignacionesStock, setAsignacionesStock] = useState({});
  const [estadoGlobalAsignacion, setEstadoGlobalAsignacion] = useState({
    estaCompleto: false,
    itemsAsignados: 0,
    itemsTotales: 0,
    movimientosAGenerar: []
  });
  const [showAsignarStock, setShowAsignarStock] = useState(false);
  const [detalleParaAsignar, setDetalleParaAsignar] = useState(null);
  // Cargar detalles cuando cambie preFacturaId
  useEffect(() => {
    if (preFacturaId) {
      cargarDetalles();
    } else {
      setDetalles([]);
      if (onCountChange) onCountChange(0);
    }
  }, [preFacturaId]);

  const cargarDetalles = async () => {
    if (!preFacturaId) return;
    setLoading(true);
    try {
      const data = await getDetallesPreFactura(preFacturaId);
      setDetalles(data);
      if (onCountChange) onCountChange(data.length);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los detalles",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    if (!preFacturaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar la pre-factura antes de agregar detalles",
        life: 3000,
      });
      return;
    }
    setDetalleActual({
      productoId: null,
      cantidad: 1,
      precioUnitario: 0,
      cantidadVenta: null,
      precioUnitarioVenta: null,
    });
    setEditando(false);
    setUsarUnidadComercial(false);
    setDialogVisible(true);
  };

  const abrirDialogoEditar = (detalle) => {
    const tieneUnidadComercial = !!(detalle.cantidadVenta && detalle.precioUnitarioVenta);
    setDetalleActual({
      id: detalle.id,
      productoId: Number(detalle.productoId),
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
      cantidadVenta: detalle.cantidadVenta ? Number(detalle.cantidadVenta) : null,
      precioUnitarioVenta: detalle.precioUnitarioVenta ? Number(detalle.precioUnitarioVenta) : null,
    });
    setEditando(true);
    setUsarUnidadComercial(tieneUnidadComercial);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setUsarUnidadComercial(false);
    setDetalleActual({
      productoId: null,
      cantidad: 1,
      precioUnitario: 0,
      cantidadVenta: null,
      precioUnitarioVenta: null,
    });
  };

  const handleProductoSeleccionado = (productoData) => {
    // productoData viene de ProductoSelectorDialog
    // Si es tipo "saldo" (egreso), puede traer precioUnitario automático
    // Si es tipo "producto" (ingreso), precioUnitario será 0
    setDetalleActual({
      ...detalleActual,
      productoId: Number(productoData.productoId),
      precioUnitario: Number(productoData.precioUnitario || 0),
    });
    setShowProductoSelector(false);
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!detalleActual.productoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto",
        life: 3000,
      });
      return;
    }

    // Validar según modo
    if (usarUnidadComercial) {
      if (!detalleActual.cantidadVenta || detalleActual.cantidadVenta <= 0) {
        toast?.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: "La cantidad de venta debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
      if (!detalleActual.precioUnitarioVenta || detalleActual.precioUnitarioVenta <= 0) {
        toast?.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: "El precio unitario de venta debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
    } else {
      if (!detalleActual.cantidad || detalleActual.cantidad <= 0) {
        toast?.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: "La cantidad debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
      if (!detalleActual.precioUnitario || detalleActual.precioUnitario <= 0) {
        toast?.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: "El precio unitario debe ser mayor a 0",
          life: 3000,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const data = {
        preFacturaId: Number(preFacturaId),
        productoId: Number(detalleActual.productoId),
      };
      // Agregar datos según modo
      if (usarUnidadComercial) {
        data.cantidadVenta = Number(detalleActual.cantidadVenta);
        data.precioUnitarioVenta = Number(detalleActual.precioUnitarioVenta);
      } else {
        data.cantidad = Number(detalleActual.cantidad);
        data.precioUnitario = Number(detalleActual.precioUnitario);
      }
      if (editando) {
        await actualizarDetallePreFactura(detalleActual.id, data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetallePreFactura(data);
        toast?.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Detalle agregado correctamente",
          life: 3000,
        });
      }
      cerrarDialogo();
      await cargarDetalles();
    } catch (error) {
      console.error("Error al guardar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "No se pudo guardar el detalle",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ⭐ HANDLER: Confirmar asignación de stock (FASE 1)
  const handleConfirmarAsignacion = (resultado) => {
    setAsignacionesStock(prev => ({
      ...prev,
      [resultado.detallePreFacturaId]: {
        estaAsignado: true,
        asignaciones: resultado.asignaciones,
        cantidadTotal: resultado.cantidadTotal,
        pesoTotal: resultado.pesoTotal
      }
    }));
    setShowAsignarStock(false);
    setDetalleParaAsignar(null);
    toast.current?.show({
      severity: 'success',
      summary: 'Stock Asignado',
      detail: `Se asignaron ${resultado.asignaciones.length} lote(s) correctamente`,
      life: 3000
    });
  };
  // ⭐ HANDLER: Abrir dialog de asignación de stock
  const handleAbrirAsignarStock = (detalle) => {
    setDetalleParaAsignar(detalle);
    setShowAsignarStock(true);
  };

  const confirmarEliminar = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el producto "${detalle.producto?.nombre || "N/A"}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: () => handleEliminar(detalle.id),
    });
  };

  // ⭐ FUNCIÓN: Actualizar estado global de asignación
  const actualizarEstadoGlobalAsignacion = useCallback(() => {
    const itemsAsignados = detalles.filter(det =>
      asignacionesStock[det.id]?.estaAsignado === true
    ).length;

    const itemsTotales = detalles.length;
    const estaCompleto = itemsTotales > 0 && itemsAsignados === itemsTotales;

    let movimientosAGenerar = [];
    if (estaCompleto) {
      const todosLosLotes = [];
      detalles.forEach(det => {
        const asignacion = asignacionesStock[det.id];
        if (asignacion?.lotes) {
          todosLosLotes.push(...asignacion.lotes);
        }
      });

      const lotesPorAlmacen = todosLosLotes.reduce((acc, lote) => {
        if (!acc[lote.almacenId]) {
          acc[lote.almacenId] = {
            almacenId: lote.almacenId,
            almacenNombre: lote.almacenNombre,
            lotes: []
          };
        }
        acc[lote.almacenId].lotes.push(lote);
        return acc;
      }, {});

      movimientosAGenerar = Object.values(lotesPorAlmacen).map(grupo => ({
        almacenId: grupo.almacenId,
        almacenNombre: grupo.almacenNombre,
        cantidadTotal: grupo.lotes.reduce((sum, l) => sum + l.cantidad, 0),
        pesoTotal: grupo.lotes.reduce((sum, l) => sum + l.peso, 0),
        numLotes: grupo.lotes.length,
        lotes: grupo.lotes,
        conceptoMovAlmacenId: null,
        dirOrigenId: null,
        dirDestinoId: null,
        observaciones: ""
      }));
    }

    setEstadoGlobalAsignacion({
      estaCompleto,
      itemsAsignados,
      itemsTotales,
      movimientosAGenerar
    });
  }, [detalles, asignacionesStock]);


  // ⭐ EFECTO: Actualizar estado global cuando cambian detalles o asignaciones
  useEffect(() => {
    actualizarEstadoGlobalAsignacion();
  }, [actualizarEstadoGlobalAsignacion]);

  // ⭐ EFECTO: Notificar cambios de estado global al padre
  useEffect(() => {
    if (onEstadoAsignacionChange) {
      onEstadoAsignacionChange(estadoGlobalAsignacion);
    }
  }, [estadoGlobalAsignacion, onEstadoAsignacionChange]);

  const handleEliminar = async (detalleId) => {
    setLoading(true);
    try {
      await eliminarDetallePreFactura(detalleId);
      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Detalle eliminado correctamente",
        life: 3000,
      });
      await cargarDetalles();
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el detalle",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por empresaId
  const productosFiltrados = productos.filter(
    (p) => Number(p.empresaId) === Number(empresaId),
  );

  const productosOptions = productosFiltrados.map((p) => ({
    label: `${p.codigo} - ${p.nombre}`,
    value: Number(p.id),
  }));

  // Templates de columnas
  const productoTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: "500" }}>
          {rowData.producto?.descripcionArmada || "N/A"}
        </div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <div style={{ textAlign: "right" }}>
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(rowData.cantidad)}
      </div>
    );
  };

  const subtotalTemplate = (rowData) => {
    const simboloMoneda = getSimboloMoneda();
    const subtotal = Number(rowData.cantidad) * Number(rowData.precioUnitario);
    return (
      <div style={{
        textAlign: "right",
        fontWeight: "bold",
        color: "#2196F3",
        backgroundColor: getColorPorMoneda(),
        padding: "0.5rem"
      }}>
        {simboloMoneda}{" "}
        {new Intl.NumberFormat("es-PE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(subtotal)}
      </div>
    );
  };


  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button
          icon="pi pi-box"
          label="Asignar"
          className="p-button-sm p-button-info"
          onClick={() => handleAbrirAsignarStock(rowData)}
          disabled={readOnly}
          tooltip="Asignar stock desde almacenes"
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          disabled={!puedeEditar || readOnly}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  // Footer del diálogo
  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={cerrarDialogo}
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleGuardar}
        disabled={loading}
        loading={loading}
      />
    </div>
  );

  // Helper para obtener código de moneda (ISO)
  const getCodigoMoneda = () => {
    if (!monedaId) return "PEN";
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.codigoSunat || "PEN";
  };

  // Helper para obtener símbolo de moneda desde la BD
  const getSimboloMoneda = () => {
    if (!monedaId) return "S/.";
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.simbolo || "S/.";
  };

  // Helper para obtener color de fondo desde la BD
  const getColorPorMoneda = () => {
    if (!monedaId) return "#fff3cd";
    const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
    return moneda?.colorFondo || "#ffffff";
  };

  // Calcular totales restando pagos previos SI
  const subtotalMostrado = esSaldoInicial
    ? subtotal - (pagosPreviosSI || 0)
    : subtotal;
  const totalMostrado = esSaldoInicial ? total - (pagosPreviosSI || 0) : total;
  return (
    <div>
      {/* FILA: BOTÓN AGREGAR Y TOTALES */}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: 5,
          padding: "5px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "2px solid #dee2e6",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ opacity: 0 }}>.</label>
          <Button
            label="Agregar Producto"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirDialogoNuevo}
            disabled={!puedeEditar || readOnly || !preFacturaId}
            style={{ width: "100%", fontWeight: "bold" }}
            tooltip={
              !preFacturaId
                ? "Debe guardar la pre-factura primero"
                : readOnly
                  ? "Modo solo lectura"
                  : ""
            }
          />
        </div>

        {/* PAGOS PREVIOS SI - Solo para Saldos Iniciales */}
        {esSaldoInicial && (
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold" }}>Pagos Previos</label>
            <InputNumber
              value={pagosPreviosSI || 0}
              onValueChange={(e) => onChange("pagosPreviosSI", e.value)}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              min={0}
              disabled={!puedeEditar || readOnly}
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: getColorPorMoneda(),
                textAlign: "right",
              }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>VALOR VENTA TOTAL</label>
          <InputNumber
            value={subtotalMostrado || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: getColorPorMoneda(),
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>
            TOTAL IGV ({porcentajeIGV || 0}%)
          </label>
          <InputNumber
            value={totalIGV || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: getColorPorMoneda(),
              textAlign: "right",
            }}
          />
        </div>
        {aplicaImpuestoRenta && (
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#FF6B6B" }}>
              IMPUESTO A LA RENTA (8%)
            </label>
            <InputNumber
              value={montoImpuestoRenta || 0}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: "#FFE5E5",
                textAlign: "right",
                color: "#D32F2F"
              }}
            />
          </div>
        )}
        {aplicaDetraccion && (
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#FF9800" }}>
              DETRACCIÓN ({porcentajeDetraccion}%)
            </label>
            <InputNumber
              value={montoDetraccion || 0}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: "#FFF3E0",
                textAlign: "right",
                color: "#E65100"
              }}
            />
          </div>
        )}
        {aplicaRetencion && (
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#9C27B0" }}>
              RETENCIÓN ({porcentajeRetencion}%)
            </label>
            <InputNumber
              value={montoRetencion || 0}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: "#F3E5F5",
                textAlign: "right",
                color: "#6A1B9A"
              }}
            />
          </div>
        )}
        {aplicaPercepcion && (
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#00BCD4" }}>
              PERCEPCIÓN ({porcentajePercepcion}%)
            </label>
            <InputNumber
              value={montoPercepcion || 0}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: "#E0F7FA",
                textAlign: "right",
                color: "#006064"
              }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#2196F3" }}>PRECIO VENTA TOTAL</label>
          <InputNumber
            value={totalMostrado || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.2rem",
              backgroundColor: getColorPorMoneda(),
              color: "#1976D2",
              textAlign: "right",
            }}
          />
        </div>
      </div>

      {/* Tabla de detalles */}
      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay productos agregados"
        size="small"
        showGridlines
        stripedRows
      >
        <Column
          field="producto.familia.nombre"
          header="Familia"
          style={{ width: "150px" }}
          body={(rowData) => rowData.producto?.familia?.nombre || "-"}
        />
        <Column
          field="producto.subfamilia.nombre"
          header="Subfamilia"
          style={{ width: "150px" }}
          body={(rowData) => rowData.producto?.subfamilia?.nombre || "-"}
        />
        <Column
          field="producto.nombre"
          header="Producto"
          body={productoTemplate}
          style={{ minWidth: "250px" }}
        />
        <Column
          header="% Detrac."
          body={(rowData) => {
            if (!rowData.producto?.porcentajeDetraccion) return "-";
            return (
              <div style={{ textAlign: "right", fontWeight: "bold", color: "#FF9800" }}>
                {Number(rowData.producto.porcentajeDetraccion).toFixed(2)}%
              </div>
            );
          }}
          style={{ width: "100px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          alignHeader="center"
        />
        <Column
          field="cantidad"
          header="Cant. Kardex"
          body={cantidadTemplate}
          style={{ width: "100px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          alignHeader="center"
        />
        <Column
          header="U.M. Kardex"
          body={(rowData) => rowData.producto?.unidadMedida?.simbolo || "-"}
          style={{ width: "250px", textAlign: "left" }}
          bodyStyle={{ textAlign: "center" }}
          alignHeader="center"
        />
        <Column
          header="Cant. Venta"
          body={(rowData) => {
            if (!rowData.cantidadVenta) return "-";
            return (
              <div style={{ textAlign: "right", fontWeight: "bold" }}>
                {new Intl.NumberFormat("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                }).format(rowData.cantidadVenta)}
              </div>
            );
          }}
          style={{ width: "120px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          alignHeader="center"
        />
        <Column
          header="U.M. Venta"
          body={(rowData) => rowData.producto?.unidadMedidaComercial?.simbolo || "-"}
          style={{ width: "250px", textAlign: "left", fontWeight: "bold" }}
          bodyStyle={{ textAlign: "center" }}
          alignHeader="center"
        />

        <Column
          header="Precio Venta Unit."
          body={(rowData) => {
            if (!rowData.precioUnitarioVenta) return "-";
            const simboloMoneda = getSimboloMoneda();
            return (
              <div style={{
                textAlign: "right",
                fontWeight: "bold",
                backgroundColor: getColorPorMoneda(),
                padding: "0.5rem"
              }}>
                {simboloMoneda}{" "}
                {new Intl.NumberFormat("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                }).format(rowData.precioUnitarioVenta)}
              </div>
            );
          }}
          style={{ width: "160px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          alignHeader="center"
        />
        <Column
          header="Valor Venta Total"
          body={subtotalTemplate}
          style={{ width: "160px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
          alignHeader="center"
        />
        <Column
          header="Cant Asignada"
          body={(rowData) => {
            const asignacion = asignacionesStock[rowData.id];
            if (!asignacion || !asignacion.estaAsignado) {
              return (
                <Tag severity="warning" value="Sin asignar" icon="pi pi-exclamation-triangle" />
              );
            }
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag severity="success" value={`${asignacion.cantidadAsignada} ${rowData.producto?.unidadMedida?.simbolo || ''}`} icon="pi pi-check" />
                <small style={{ color: '#6c757d' }}>({asignacion.lotes?.length || 0} lotes)</small>
              </div>
            );
          }}
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: "220px" }}
        />
      </DataTable>

      {/* Diálogo para agregar/editar detalle */}
      <Dialog
        visible={dialogVisible}
        style={{ width: "900px" }}
        header={editando ? "Editar Detalle" : "Agregar Detalle"}
        modal
        footer={dialogFooter}
        onHide={cerrarDialogo}
      >
        <div className="p-fluid">
          <ProductoSelectedDisplay
            producto={
              detalleActual.productoId
                ? productos.find(
                  (p) => Number(p.id) === Number(detalleActual.productoId)
                )
                : null
            }
            onChangeClick={() => setShowProductoSelector(true)}
            disabled={loading || !empresaId}
            label="Producto *"
          />

          {/* Checkbox para usar unidad comercial */}
          {detalleActual.productoId && productos.find(p => Number(p.id) === Number(detalleActual.productoId))?.unidadMedidaComercialId && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Checkbox
                inputId="usarComercial"
                checked={usarUnidadComercial}
                onChange={(e) => setUsarUnidadComercial(e.checked)}
                disabled={loading}
              />
              <label htmlFor="usarComercial" style={{ fontWeight: "bold" }}>
                Usar Unidad Comercial ({productos.find(p => Number(p.id) === Number(detalleActual.productoId))?.unidadMedidaComercial?.simbolo})
              </label>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            {usarUnidadComercial ? (
              <>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cantidadVenta">
                    Cantidad ({productos.find(p => Number(p.id) === Number(detalleActual.productoId))?.unidadMedidaComercial?.simbolo}) *
                  </label>
                  <InputNumber
                    id="cantidadVenta"
                    value={detalleActual.cantidadVenta}
                    onValueChange={(e) =>
                      setDetalleActual({ ...detalleActual, cantidadVenta: e.value })
                    }
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={3}
                    min={0.001}
                    disabled={loading}
                    inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="precioUnitarioVenta">
                    Precio Unitario ({productos.find(p => Number(p.id) === Number(detalleActual.productoId))?.unidadMedidaComercial?.simbolo}) *
                  </label>
                  <InputNumber
                    id="precioUnitarioVenta"
                    value={detalleActual.precioUnitarioVenta}
                    onValueChange={(e) =>
                      setDetalleActual({
                        ...detalleActual,
                        precioUnitarioVenta: e.value,
                      })
                    }
                    mode="currency"
                    currency={getCodigoMoneda()}
                    locale="es-PE"
                    minFractionDigits={2}
                    maxFractionDigits={6}
                    min={0}
                    disabled={loading}
                    inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cantidad">Cantidad *</label>
                  <InputNumber
                    id="cantidad"
                    value={detalleActual.cantidad}
                    onValueChange={(e) =>
                      setDetalleActual({ ...detalleActual, cantidad: e.value })
                    }
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={3}
                    min={0.001}
                    disabled={loading}
                    inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="precioUnitario">Valor de Venta Unitario (Sin IGV) *</label>
                  <InputNumber
                    id="precioUnitario"
                    value={detalleActual.precioUnitario}
                    onValueChange={(e) =>
                      setDetalleActual({
                        ...detalleActual,
                        precioUnitario: e.value,
                      })
                    }
                    mode="currency"
                    currency={getCodigoMoneda()}
                    locale="es-PE"
                    minFractionDigits={2}
                    maxFractionDigits={6}
                    min={0}
                    disabled={loading}
                    inputStyle={{ fontWeight: "bold", textTransform: "uppercase" }}
                  />
                </div>
                {/* Campo informativo: Precio de Venta Unitario (Con IGV) */}
                {!usarUnidadComercial && detalleActual.precioUnitario > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <label htmlFor="precioConIGV" style={{ color: "#666", fontSize: "0.9rem" }}>
                      Precio de Venta Unitario (Con IGV) - Informativo
                    </label>
                    <InputNumber
                      id="precioConIGV"
                      value={Number(detalleActual.precioUnitario) * (1 + (porcentajeIGV || 0) / 100)}
                      mode="currency"
                      currency={getCodigoMoneda()}
                      locale="es-PE"
                      minFractionDigits={2}
                      disabled
                      inputStyle={{
                        fontWeight: "bold",
                        backgroundColor: "#f0f0f0",
                        color: "#666",
                        textAlign: "right",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mostrar resumen calculado */}
          {((usarUnidadComercial && detalleActual.cantidadVenta > 0 && detalleActual.precioUnitarioVenta > 0) ||
            (!usarUnidadComercial && detalleActual.cantidad > 0 && detalleActual.precioUnitario > 0)) && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#495057" }}>
                  RESUMEN
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span>Valor Venta Total (Sin IGV):</span>
                  <span style={{ fontWeight: "bold" }}>
                    {getSimboloMoneda()}{" "}
                    {new Intl.NumberFormat("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(
                      Number(detalleActual.cantidad) *
                      Number(detalleActual.precioUnitario),
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span>IGV ({porcentajeIGV || 0}%):</span>
                  <span style={{ fontWeight: "bold" }}>
                    {getSimboloMoneda()}{" "}
                    {new Intl.NumberFormat("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(
                      Number(detalleActual.cantidad) *
                      Number(detalleActual.precioUnitario) *
                      ((porcentajeIGV || 0) / 100),
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    paddingTop: "0.5rem",
                    borderTop: "2px solid #dee2e6",
                  }}
                >
                  <span style={{ color: "#2196F3" }}>Precio de Venta Total (Con IGV):</span>
                  <span style={{ color: "#2196F3" }}>
                    {getSimboloMoneda()}{" "}
                    {new Intl.NumberFormat("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(
                      Number(detalleActual.cantidad) *
                      Number(detalleActual.precioUnitario) *
                      (1 + (porcentajeIGV || 0) / 100),
                    )}
                  </span>
                </div>
              </div>
            )}
        </div>
      </Dialog>
      {/* Selector de Productos Avanzado */}
      <ProductoSelectorDialog
        visible={showProductoSelector}
        onHide={() => setShowProductoSelector(false)}
        modo="egreso"
        esCustodia={false}
        empresaId={empresaId}
        propietarioStockId={empresaEntidadComercialId}
        almacenId={null}
        productoIdSeleccionado={detalleActual.productoId}
        clienteId={clienteId}
        empresaEntidadComercialId={empresaEntidadComercialId}
        monedaId={monedaId}
        fechaDocumento={fechaDocumento}
        buscarPrecioVenta={true}
        onSelect={handleProductoSeleccionado}
      />

      {/* ⭐ DIÁLOGO: Asignar Stock (FASE 1) */}
      <AsignarStockDialog
        visible={showAsignarStock}
        onHide={() => {
          setShowAsignarStock(false);
          setDetalleParaAsignar(null);
        }}
        empresaId={empresaId}
        productoId={detalleParaAsignar?.productoId}
        productoNombre={detalleParaAsignar?.producto?.descripcionArmada}
        cantidadRequerida={detalleParaAsignar?.cantidad}
        unidadMedida={detalleParaAsignar?.producto?.unidadMedida?.simbolo}
        detallePreFacturaId={detalleParaAsignar?.id}
        onConfirmar={handleConfirmarAsignacion}
      />
    </div>
  );
}
