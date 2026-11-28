// src/components/preFactura/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
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
import useAsignacionStock from "./asignacionStock/useAsignacionStock";
import BotonAsignacionStock from "./asignacionStock/BotonAsignacionStock";
import AsignacionStockDialogs from "./asignacionStock/AsignacionStockDialogs";

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
  // ⭐ ASIGNACIÓN DE STOCK / KARDEX
  kardexGenerado = false, // la PreFactura ya tiene sus movimientos de salida
  puedeDespachar = false, // emitida, con permiso y no es nota de crédito/débito
  motivoNoDespachar = "", // por qué el botón está deshabilitado
  onStockDespachado = () => { }, // se llama tras generar movimientos, kardex y saldos
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
    observaciones: "",
    mostrarDescripcionArmada: true,
  });
  // ⭐ ASIGNACIÓN DE STOCK: componente autónomo, el JSON vive en memoria y se limpia al cambiar/salir de la PreFactura
  const asignacionStock = useAsignacionStock({
    preFacturaId,
    detalles,
    empresaId,
    kardexGenerado,
    puedeDespachar,
    motivoNoDespachar,
    toast,
    onGenerado: async () => {
      await cargarDetalles();
      await onStockDespachado();
    },
    onEliminado: async () => {
      await cargarDetalles();
      await onStockDespachado();
    },
  });
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
      observaciones: "",
      mostrarDescripcionArmada: true,
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
      observaciones: detalle.observaciones || "",
      mostrarDescripcionArmada: detalle.mostrarDescripcionArmada !== false,
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
      observaciones: "",
      mostrarDescripcionArmada: true,
    });
  };

  const handleProductoSeleccionado = (productoData) => {
    // productoData viene de ProductoSelectorDialog
    // Si es tipo "saldo" (egreso), puede traer precioUnitario automático
    // Si es tipo "producto" (ingreso), precioUnitario será 0
    const producto = productos.find((p) => Number(p.id) === Number(productoData.productoId));
    // Si el producto tiene unidad comercial, la línea se captura en ella por defecto; la casilla sigue disponible para pasar a Presentación
    const usaComercial = Boolean(producto?.unidadMedidaComercialId);
    const precioPresentacion = Number(productoData.precioUnitario || 0);
    // El selector entrega el precio por Presentación; en unidad comercial se convierte con el mismo factor que usa el servidor
    const factorComercial = Number(producto?.unidadMedidaComercial?.factorConversion) || 1;
    const factorPresentacion = Number(producto?.unidadMedida?.factorConversion) || 1;
    setUsarUnidadComercial(usaComercial);
    setDetalleActual({
      ...detalleActual,
      productoId: Number(productoData.productoId),
      precioUnitario: precioPresentacion,
      cantidadVenta: usaComercial ? 1 : null,
      precioUnitarioVenta:
        usaComercial && precioPresentacion > 0
          ? Number((precioPresentacion * (factorComercial / factorPresentacion)).toFixed(6))
          : null,
    });
    setShowProductoSelector(false);
  };

  // SUNAT admite 500 caracteres en la descripción del ítem: descripción armada + salto de línea + observación
  const largoArmadaProducto = String(
    productos.find((p) => Number(p.id) === Number(detalleActual.productoId))?.descripcionArmada || "",
  ).length;
  const maxObservaciones = Math.max(0, 499 - largoArmadaProducto);

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
      // Línea NEGATIVA de un anticipo descontado en la factura final: se corrige su monto (negativo) para igualar el comprobante
      const esLineaAnticipo = Boolean(detalleActual.id) && Number(detalleActual.precioUnitario) < 0;
      if (!esLineaAnticipo && (!detalleActual.precioUnitario || detalleActual.precioUnitario <= 0)) {
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
      // Descripción complementaria de la línea (null borra la que hubiera)
      data.observaciones = String(detalleActual.observaciones || "").trim() || null;
      // Sin descripción armada la observación pasa a ser la única descripción del comprobante: no puede ir vacía
      data.mostrarDescripcionArmada = detalleActual.mostrarDescripcionArmada !== false;
      if (!data.mostrarDescripcionArmada && !data.observaciones) {
        toast?.current?.show({
          severity: "error",
          summary: "Observación obligatoria",
          detail: 'Desmarcó "Mostrar descripción armada": escriba la observación de la línea, que será la única descripción en el comprobante.',
          life: 6000,
        });
        setLoading(false);
        return;
      }
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

  // Producto es un maestro único (MEGUI): todos los productos sirven para cualquier empresa
  const productosFiltrados = productos;

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
        {rowData.observaciones && (
          <div style={{ fontSize: "0.8rem", color: "#6c757d", whiteSpace: "pre-line" }}>{rowData.observaciones}</div>
        )}
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
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={!puedeEditar || readOnly || asignacionStock.kardexGenerado}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          disabled={!puedeEditar || readOnly || asignacionStock.kardexGenerado}
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
            disabled={!puedeEditar || readOnly || !preFacturaId || asignacionStock.kardexGenerado}
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

        {/* ELIMINAR KARDEX - Borra todos los movimientos de salida generados para poder generar de nuevo */}
        {asignacionStock.kardexGenerado && (
          <div style={{ flex: 1 }}>
            <label style={{ opacity: 0 }}>.</label>
            <Button
              label="Eliminar Kardex"
              icon="pi pi-trash"
              severity="danger"
              onClick={asignacionStock.pedirEliminacion}
              disabled={readOnly || asignacionStock.eliminando}
              style={{ width: "100%", fontWeight: "bold" }}
              tooltip="Elimina todos los movimientos de almacén generados y devuelve el stock"
            />
          </div>
        )}

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
              currency="PEN"
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: monedas.find(m => m.codigo === 'PEN')?.colorFondo || "#FFFFE0",
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
              currency="PEN"
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: monedas.find(m => m.codigo === 'PEN')?.colorFondo || "#FFFFE0",
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
              currency="PEN"
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: monedas.find(m => m.codigo === 'PEN')?.colorFondo || "#FFFFE0",
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
        cellMemo={false}
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
          header="Stock / Kardex"
          body={(rowData) => <BotonAsignacionStock a={asignacionStock} detalle={rowData} />}
          style={{ minWidth: "230px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ minWidth: "110px" }}
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
                Usar Unidad Medida ({productos.find(p => Number(p.id) === Number(detalleActual.productoId))?.unidadMedidaComercial?.simbolo})
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
                    min={detalleActual?.id && Number(detalleActual.precioUnitario) < 0 ? -999999999 : 0}
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

          {/* Descripción complementaria: se imprime debajo de la descripción del producto en el comprobante (también dentro del XML),
              en la venta y en el voucher de almacén. Es texto libre de esta línea; no cambia el producto del maestro. */}
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Checkbox
              inputId="mostrarDescripcionArmada"
              checked={detalleActual.mostrarDescripcionArmada !== false}
              onChange={(e) => setDetalleActual({ ...detalleActual, mostrarDescripcionArmada: e.checked })}
            />
            <label htmlFor="mostrarDescripcionArmada" style={{ fontWeight: "bold", cursor: "pointer" }}>
              Mostrar descripción armada en el comprobante (desmarcar para que solo salga la observación)
            </label>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="observacionesLinea" style={{ fontWeight: "bold" }}>
              Observaciones (se imprimen debajo de la descripción)
            </label>
            <InputTextarea
              id="observacionesLinea"
              value={detalleActual.observaciones || ""}
              onChange={(e) => setDetalleActual({ ...detalleActual, observaciones: e.target.value })}
              rows={3}
              autoResize
              maxLength={maxObservaciones}
              style={{ width: "100%" }}
              placeholder="Ej.: características, presentación, lote o cualquier detalle que deba constar en el comprobante"
            />
            <small style={{ color: "#6c757d" }}>
              {(detalleActual.observaciones || "").length}/{maxObservaciones}. En el comprobante electrónico, la descripción armada del producto
              más esta observación no pueden pasar de 500 caracteres.
            </small>
          </div>

          {/* Mostrar resumen calculado. Con unidad comercial el importe sale de cantidadVenta x precioUnitarioVenta: los campos
              cantidad y precioUnitario solo se llenan en el modo de unidad base y daban 0 */}
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
                      (usarUnidadComercial ? Number(detalleActual.cantidadVenta) * Number(detalleActual.precioUnitarioVenta) : Number(detalleActual.cantidad) * Number(detalleActual.precioUnitario)),
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
                      (usarUnidadComercial ? Number(detalleActual.cantidadVenta) * Number(detalleActual.precioUnitarioVenta) : Number(detalleActual.cantidad) * Number(detalleActual.precioUnitario)) *
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
                      (usarUnidadComercial ? Number(detalleActual.cantidadVenta) * Number(detalleActual.precioUnitarioVenta) : Number(detalleActual.cantidad) * Number(detalleActual.precioUnitario)) *
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
        uso="venta"
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

      {/* ⭐ DIÁLOGOS: asignación de stock por línea y confirmación de generación del kardex */}
      <AsignacionStockDialogs a={asignacionStock} />
    </div>
  );
}
