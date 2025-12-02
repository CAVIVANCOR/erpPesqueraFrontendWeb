// src/components/cotizacionVentas/DetalleDialogCV.jsx
/**
 * Diálogo para agregar/editar detalles de Cotización de Ventas
 * Incluye TODOS los campos del modelo DetCotizacionVentas
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Badge } from "primereact/badge";
import { Message } from "primereact/message";
import ProductoSelectorDialog from "../movimientoAlmacen/ProductoSelectorDialog";
import {
  crearDetalleCotizacionVentas,
  actualizarDetalleCotizacionVentas,
} from "../../api/detalleCotizacionVentas";
import { obtenerPrecioEspecialActivo } from "../../api/precioEntidad";
import { getSaldosProductoClienteConFiltros } from "../../api/saldosProductoCliente";
import { formatearNumero } from "../../utils/utils";
import { Tag } from "primereact/tag";

export default function DetalleDialogCV({
  visible,
  onHide,
  detalle,
  cotizacionId,
  productos,
  empresaId,
  datosGenerales,
  empresas,
  centrosCosto = [],
  puedeEditarDetalles,
  onSaveSuccess,
  toast,
  monedasOptions = [],
  monedaId = 1,
}) {
  const [formData, setFormData] = useState({
    productoId: null,
    cantidad: 0,
    pesoNeto: 0,
    costoUnitarioEstimado: 0,
    factorExportacionAplicado: 1,
    precioUnitario: 0,
    precioUnitarioFinal: 0,
    // Nuevos campos de precio especial
    precioEntidadId: null,
    precioEntidadOriginal: null,
    precioFueEditado: false,
    // Nuevos campos de márgenes
    margenMinimoPermitido: null,
    margenUtilidadObjetivo: null,
    margenUtilidadReal: null,
    loteProduccion: "",
    fechaProduccion: null,
    fechaVencimiento: null,
    temperaturaAlmacenamiento: "",
    centroCostoId: null,
    descripcionAdicional: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProductoSelector, setShowProductoSelector] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [stockDisponible, setStockDisponible] = useState(0);
  const [pesoDisponible, setPesoDisponible] = useState(0);

  // Obtener entidadComercialId de la empresa seleccionada
  const empresaSeleccionada = empresas?.find(
    (e) => Number(e.id) === Number(empresaId)
  );
  const entidadComercialId = empresaSeleccionada?.entidadComercialId;

  // Helper para obtener código de moneda
  const getCodigoMoneda = () => {
    const moneda = monedasOptions.find(
      (m) => Number(m.value) === Number(monedaId)
    );
    return moneda?.codigoSunat || "PEN";
  };

  /**
   * Consulta el stock disponible actual en tiempo real desde la base de datos
   * Replica la lógica de ProductoSelectorDialog/useProductoSelectorData
   *
   * LÓGICA:
   * - Para mercadería propia: clienteId = Empresa.entidadComercialId
   * - Para mercadería en custodia: clienteId = entidadComercialId del cliente
   * - Consolida stock de todos los almacenes para el producto
   */
  const consultarStockActual = async (productoId) => {
    try {
      if (!empresaId || !entidadComercialId || !productoId) {
        setStockDisponible(0);
        setPesoDisponible(0);
        return;
      }

      // Consultar saldos usando la misma lógica que ProductoSelectorDialog
      // clienteId = entidadComercialId (la empresa dueña del stock)
      // custodia = false (mercadería propia de la empresa)
      const filtrosSaldos = {
        empresaId: Number(empresaId),
        clienteId: Number(entidadComercialId),
        custodia: false, // Mercadería propia de la empresa
      };

      const saldosData = await getSaldosProductoClienteConFiltros(
        filtrosSaldos
      );

      // Filtrar saldos de este producto específico
      const saldosProducto = saldosData.filter(
        (s) => Number(s.productoId) === Number(productoId)
      );

      if (saldosProducto.length > 0) {
        // Consolidar stock de todos los almacenes (igual que ProductoSelectorDialog)
        const stockTotal = saldosProducto.reduce(
          (sum, s) => sum + Number(s.saldoCantidad || 0),
          0
        );
        const pesoTotal = saldosProducto.reduce(
          (sum, s) => sum + Number(s.saldoPeso || 0),
          0
        );

        setStockDisponible(stockTotal);
        setPesoDisponible(pesoTotal);
      } else {
        // No hay stock disponible
        setStockDisponible(0);
        setPesoDisponible(0);
      }
    } catch (error) {
      console.error("Error al consultar stock actual:", error);
      setStockDisponible(0);
      setPesoDisponible(0);
    }
  };

  // Consultar stock en tiempo real cuando se carga un detalle
  useEffect(() => {
    if (
      detalle &&
      detalle.productoId &&
      visible &&
      empresaId &&
      entidadComercialId
    ) {
      consultarStockActual(detalle.productoId);
    }
  }, [detalle, visible, empresaId, entidadComercialId]);

  useEffect(() => {
    if (detalle) {
      setFormData({
        productoId: detalle.productoId,
        cantidad: detalle.cantidad || 0,
        pesoNeto: detalle.pesoNeto || 0,
        costoUnitarioEstimado: detalle.costoUnitarioEstimado || 0,
        factorExportacionAplicado: detalle.factorExportacionAplicado || 1,
        precioUnitario: detalle.precioUnitario || 0,
        precioUnitarioFinal: detalle.precioUnitarioFinal || 0,
        // Campos de precio especial
        precioEntidadId: detalle.precioEntidadId || null,
        precioEntidadOriginal: detalle.precioEntidadOriginal || null,
        precioFueEditado: detalle.precioFueEditado || false,
        // Campos de márgenes
        margenMinimoPermitido: detalle.margenMinimoPermitido || null,
        margenUtilidadObjetivo: detalle.margenUtilidadObjetivo || null,
        margenUtilidadReal: detalle.margenUtilidadReal || null,
        loteProduccion: detalle.loteProduccion || "",
        fechaProduccion: detalle.fechaProduccion
          ? new Date(detalle.fechaProduccion)
          : null,
        fechaVencimiento: detalle.fechaVencimiento
          ? new Date(detalle.fechaVencimiento)
          : null,
        temperaturaAlmacenamiento: detalle.temperaturaAlmacenamiento || "",
        centroCostoId: detalle.centroCostoId
          ? Number(detalle.centroCostoId)
          : null,
        descripcionAdicional: detalle.descripcionAdicional || "",
        observaciones: detalle.observaciones || "",
      });
      // Buscar el producto seleccionado
      const producto = productos.find(
        (p) => Number(p.id) === Number(detalle.productoId)
      );
      setProductoSeleccionado(producto || null);

      // Cargar stock disponible del producto
      if (detalle.producto) {
        const stock =
          detalle.producto.saldo?.saldoCantidad ||
          detalle.producto.stockDisponible ||
          0;
        const peso =
          detalle.producto.saldo?.saldoPeso ||
          detalle.producto.pesoDisponible ||
          0;
        setStockDisponible(stock);
        setPesoDisponible(peso);
      } else if (producto) {
        // Si no viene en detalle, intentar obtenerlo del producto
        const stock =
          producto.saldo?.saldoCantidad || producto.stockDisponible || 0;
        const peso = producto.saldo?.saldoPeso || producto.pesoDisponible || 0;
        setStockDisponible(stock);
        setPesoDisponible(peso);
      }
    } else {
      setFormData({
        productoId: null,
        cantidad: 0,
        pesoNeto: 0,
        costoUnitarioEstimado: 0,
        factorExportacionAplicado: 1,
        precioUnitario: 0,
        precioUnitarioFinal: 0,
        // Campos de precio especial
        precioEntidadId: null,
        precioEntidadOriginal: null,
        precioFueEditado: false,
        // Campos de márgenes
        margenMinimoPermitido: null,
        margenUtilidadObjetivo: null,
        margenUtilidadReal: null,
        loteProduccion: "",
        fechaProduccion: null,
        fechaVencimiento: null,
        temperaturaAlmacenamiento: "",
        centroCostoId: datosGenerales?.centroCostoId || null,
        descripcionAdicional: "",
        observaciones: "",
      });
      setProductoSeleccionado(null);
    }
    setShowProductoSelector(false);
  }, [detalle, visible, productos, datosGenerales]);

  /**
   * Función para calcular precios y márgenes según lógica de negocio
   *
   * CASO 1 - Sin precio especial:
   *   precioUnitario = costoUnitarioEstimado * factorExportacionAplicado
   *   precioUnitarioFinal = precioUnitario / (1 - margenUtilidadObjetivo/100)
   *   margenUtilidadReal = ((precioUnitarioFinal - precioUnitario) / precioUnitarioFinal) × 100
   *
   * CASO 2 - Con precio especial:
   *   precioUnitario = costoUnitarioEstimado * factorExportacionAplicado
   *   precioUnitarioFinal = precioEntidadOriginal (del precio especial)
   *   margenUtilidadReal = ((precioUnitarioFinal - precioUnitario) / precioUnitarioFinal) × 100
   *   precioFueEditado = true si usuario modifica precioUnitarioFinal
   */
  const calcularPrecios = (datos, campoModificado = null) => {
    const resultado = { ...datos };

    // PASO 1: Calcular precioUnitario = costoUnitarioEstimado × factorExportacionAplicado
    if (
      resultado.costoUnitarioEstimado &&
      resultado.factorExportacionAplicado
    ) {
      resultado.precioUnitario =
        resultado.costoUnitarioEstimado * resultado.factorExportacionAplicado;
    }

    // CASO 2: Con precio especial
    if (resultado.precioEntidadId && resultado.precioEntidadOriginal) {
      // Si el usuario edita manualmente precioUnitarioFinal
      if (campoModificado === "precioUnitarioFinal") {
        resultado.precioFueEditado = true;
        // precioUnitarioFinal ya viene en 'datos', no recalcular
      } else if (!resultado.precioFueEditado) {
        // Si NO ha sido editado, usar el precio especial
        resultado.precioUnitarioFinal = resultado.precioEntidadOriginal;
      }
      // Si ya fue editado y no es el campo modificado, mantener el valor actual
    } else {
      // CASO 1: Sin precio especial

      if (campoModificado === "precioUnitarioFinal") {
        // Usuario edita precioUnitarioFinal manualmente, no recalcular
        // Mantener el valor que viene en 'datos'
      } else {
        // Recalcular precioUnitarioFinal usando margenUtilidadObjetivo
        // Fórmula: precioFinal = precioUnitario / (1 - margen/100)
        if (resultado.precioUnitario && resultado.margenUtilidadObjetivo) {
          const margenDecimal = resultado.margenUtilidadObjetivo / 100;
          if (margenDecimal < 1 && margenDecimal >= 0) {
            resultado.precioUnitarioFinal =
              resultado.precioUnitario / (1 - margenDecimal);
          }
        }
      }
    }

    // PASO 3: Calcular margenUtilidadReal siempre
    // Fórmula: margenReal = ((precioFinal - precioUnitario) / precioFinal) × 100
    if (
      resultado.precioUnitario &&
      resultado.precioUnitarioFinal &&
      resultado.precioUnitarioFinal > 0
    ) {
      resultado.margenUtilidadReal =
        ((resultado.precioUnitarioFinal - resultado.precioUnitario) /
          resultado.precioUnitarioFinal) *
        100;
    } else {
      resultado.margenUtilidadReal = null;
    }

    return resultado;
  };

  const handleChange = (field, value) => {
    let newFormData = { ...formData, [field]: value };

    // Calcular peso automáticamente si hay producto seleccionado
    if (
      field === "cantidad" &&
      productoSeleccionado &&
      productoSeleccionado.unidadMedida
    ) {
      const factorConversion =
        productoSeleccionado.unidadMedida.factorConversion;
      if (factorConversion) {
        const pesoCalculado = value * factorConversion;
        newFormData.pesoNeto = pesoCalculado;
      }
    }

    // Validación de stock en tiempo real cuando cambia la cantidad
    if (field === "cantidad" && value > stockDisponible) {
      const mensaje =
        stockDisponible === 0
          ? `No hay stock disponible para este producto. La cantidad ingresada es ${value.toFixed(
              3
            )}.`
          : `La cantidad ingresada (${value.toFixed(
              3
            )}) supera el stock disponible (${stockDisponible.toFixed(3)}).`;

      // Usar toast con posición top-center para que sea visible sobre el Dialog
      if (toast?.current) {
        // Limpiar toasts anteriores de stock
        toast.current.clear();
        toast.current.show({
          severity: "warn",
          summary: "⚠️ Advertencia de Stock",
          detail: mensaje,
          life: 5000,
          sticky: false,
        });
      }
    }

    // Usar función genérica para calcular precios y márgenes
    newFormData = calcularPrecios(newFormData, field);

    setFormData(newFormData);
  };

  const handleProductoSelect = async (data) => {
    if (data) {
      const producto = data.producto || data;
      setProductoSeleccionado(producto);

      // Obtener costo del saldo (SaldosProductoCliente) - siempre viene en PEN
      let costoUnitario =
        data.saldo?.costoUnitarioPromedio || data.costoUnitarioPromedio || 0;

      // Convertir costo a la moneda de la cotización si es necesario
      const codigoMonedaCotizacion = getCodigoMoneda();
      if (codigoMonedaCotizacion === "USD" && datosGenerales?.tipoCambio) {
        // El costo viene en PEN, convertir a USD
        costoUnitario = costoUnitario / datosGenerales.tipoCambio;
      }

      // Obtener stock disponible del saldo o producto
      const stock = data.saldo?.saldoCantidad || data.stockDisponible || 0;
      const peso = data.saldo?.saldoPeso || data.pesoDisponible || 0;
      setStockDisponible(stock);
      setPesoDisponible(peso);

      // Preparar datos iniciales con el producto
      let datosIniciales = {
        ...formData,
        productoId: Number(producto.id),
        costoUnitarioEstimado: costoUnitario,
        precioUnitario: costoUnitario,
        // Heredar márgenes del producto
        margenMinimoPermitido: producto.margenMinimoPermitido || null,
        margenUtilidadObjetivo: producto.margenUtilidadObjetivo || null,
      };

      // 🏷️ Buscar precio especial vigente para este cliente-producto
      try {
        if (entidadComercialId && producto.id) {
          const precioEspecial = await obtenerPrecioEspecialActivo(
            entidadComercialId,
            producto.id
          );

          if (precioEspecial) {
            // Aplicar precio especial
            datosIniciales.precioUnitario = precioEspecial.precioUnitario;
            datosIniciales.precioEntidadId = precioEspecial.id;
            datosIniciales.precioEntidadOriginal =
              precioEspecial.precioUnitario;
            datosIniciales.precioFueEditado = false;

            // Mostrar notificación de precio especial aplicado
            toast?.current?.show({
              severity: "info",
              summary: "🏷️ Precio Especial Aplicado",
              detail: `ID: ${precioEspecial.id} | Precio: ${
                precioEspecial.moneda?.simbolo || "S/"
              } ${formatearNumero(precioEspecial.precioUnitario)} | Producto: ${
                producto.descripcionArmada || producto.nombre
              }`,
              life: 6000,
            });
          }
        }
      } catch (error) {
        console.error("Error al buscar precio especial:", error);
        // No mostrar error al usuario, simplemente usar precio normal
      }

      // Usar función genérica para calcular precios y márgenes
      const datosCalculados = calcularPrecios(
        datosIniciales,
        "margenUtilidadObjetivo"
      );

      // Actualizar formData con todos los cálculos
      setFormData(datosCalculados);

      setShowProductoSelector(false);
    }
  };

  const handleSave = async () => {

    // Validación de cotizacionId
    if (!cotizacionId) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se puede guardar: ID de cotización no válido",
      });
      return;
    }

    // Validaciones
    if (!formData.productoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto",
      });
      return;
    }

    if (formData.cantidad <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "La cantidad debe ser mayor a 0",
      });
      return;
    }

    // Validación de stock según estándares ERP:
    // En COTIZACIONES: Advertencia informativa (no bloquea)
    // En PEDIDOS: Error crítico (bloquea)
    if (formData.cantidad > stockDisponible) {
      const mensaje =
        stockDisponible === 0
          ? `No hay stock disponible para este producto. La cantidad cotizada es ${formData.cantidad.toFixed(
              3
            )}. Se permite guardar pero considere la disponibilidad real.`
          : `La cantidad cotizada (${formData.cantidad.toFixed(
              3
            )}) supera el stock disponible (${stockDisponible.toFixed(
              3
            )}). Se permite guardar pero considere la disponibilidad real.`;

      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia de Stock",
        detail: mensaje,
        life: 6000,
      });
      // No retornamos, permitimos guardar (es solo una cotización)
    }

    if (formData.precioUnitario <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El precio unitario debe ser mayor a 0",
      });
      return;
    }

    if (!formData.precioUnitarioFinal || formData.precioUnitarioFinal <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El precio unitario final debe ser mayor a 0",
      });
      return;
    }

    if (!formData.centroCostoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un centro de costo",
      });
      return;
    }

    setSaving(true);
    try {
      if (detalle) {
        await actualizarDetalleCotizacionVentas(detalle.id, formData);
        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Detalle actualizado correctamente",
        });
      } else {
        await crearDetalleCotizacionVentas({
          ...formData,
          cotizacionVentasId: cotizacionId,
        });
        toast?.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Detalle creado correctamente",
        });
      }
      onSaveSuccess();
    } catch (err) {
      // Extraer mensaje de error del backend
      let errorMessage = "No se pudo guardar el detalle";

      if (err.response?.data) {
        // Si hay un mensaje de error específico
        errorMessage =
          err.response.data.error || err.response.data.message || errorMessage;

        // Si hay detalles adicionales, agregarlos
        if (err.response.data.details) {
          errorMessage += `\n\nDetalles: ${err.response.data.details}`;
        }
      }

      toast?.current?.show({
        severity: "error",
        summary: "Error al Guardar",
        detail: errorMessage,
        life: 8000, // Mostrar por más tiempo para que se pueda leer
      });
    }
    setSaving(false);
  };

  return (
    <Dialog
      header={detalle ? "Editar Detalle" : "Nuevo Detalle"}
      visible={visible}
      style={{ width: "1300px" }}
      onHide={onHide}
      modal
    >
      <div className="p-fluid">
        {/* Selección de Producto */}
        <div style={{ marginBottom: "1rem" }}>
          {productoSeleccionado ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: formData.precioEntidadId
                  ? "2fr 1fr 1fr"
                  : "2fr 1fr",
                gap: "0.5rem",
                padding: "0.5rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "0.2rem",
                border: "2px solid #e0e0e0",
              }}
            >
              {/* COLUMNA IZQUIERDA: INFORMACIÓN DEL PRODUCTO */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {/* Nombre del Producto */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "2px solid #1976d2",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <i
                      className="pi pi-box"
                      style={{ fontSize: "1.3rem", color: "#1976d2" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      Producto:
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#1976d2",
                      fontSize: "1.2rem",
                      lineHeight: "1.3",
                    }}
                  >
                    {productoSeleccionado.descripcionArmada}
                  </div>
                </div>

                {/* Unidad de Empaque */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: "2px solid #7b1fa2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i
                      className="pi pi-tag"
                      style={{ fontSize: "1.2rem", color: "#7b1fa2" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      Unidad de Empaque:
                    </span>
                    <Badge
                      value={productoSeleccionado.unidadMedida?.nombre || "-"}
                      severity="warning"
                      style={{
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                </div>

                {/* Botón Cambiar Producto */}
                <Button
                  type="button"
                  label="Cambiar Producto"
                  icon="pi pi-sync"
                  severity="success"
                  raised
                  onClick={() => setShowProductoSelector(true)}
                  disabled={saving || !puedeEditarDetalles}
                />
              </div>
              {/* COLUMNA DERECHA: STOCK DISPONIBLE */}
              <div
                style={{
                  backgroundColor:
                    formData.cantidad > stockDisponible ? "#ffebee" : "#e8f5e9",
                  borderRadius: "10px",
                  border: `3px solid ${
                    formData.cantidad > stockDisponible ? "#d32f2f" : "#2e7d32"
                  }`,
                  padding: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {/* Título Stock */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: `2px solid ${
                      formData.cantidad > stockDisponible
                        ? "#d32f2f"
                        : "#2e7d32"
                    }`,
                    paddingBottom: "0.5rem",
                  }}
                >
                  <i
                    className={`pi ${
                      formData.cantidad > stockDisponible
                        ? "pi-exclamation-triangle"
                        : "pi-check-circle"
                    }`}
                    style={{
                      fontSize: "1.5rem",
                      color:
                        formData.cantidad > stockDisponible
                          ? "#d32f2f"
                          : "#2e7d32",
                    }}
                  />
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      color:
                        formData.cantidad > stockDisponible
                          ? "#d32f2f"
                          : "#2e7d32",
                    }}
                  >
                    STOCK DISPONIBLE
                  </span>
                </div>

                {/* Cantidad */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    Cantidad:
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: "bold",
                        color:
                          formData.cantidad > stockDisponible
                            ? "#d32f2f"
                            : "#2e7d32",
                      }}
                    >
                      {formatearNumero(stockDisponible)}
                    </span>
                    <Badge
                      value={productoSeleccionado?.unidadMedida?.nombre || "UN"}
                      severity={
                        formData.cantidad > stockDisponible
                          ? "danger"
                          : "success"
                      }
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                {/* Peso */}
                {pesoDisponible > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      Peso:
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#0288d1",
                        }}
                      >
                        {formatearNumero(pesoDisponible)}
                      </span>
                      <Badge value="KG" severity="info" />
                    </div>
                  </div>
                )}

                {/* Alerta si supera stock */}
                {formData.cantidad > stockDisponible && (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "2px solid #d32f2f",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i
                      className="pi pi-info-circle"
                      style={{ fontSize: "1.2rem", color: "#d32f2f" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#d32f2f",
                        fontWeight: "bold",
                      }}
                    >
                      Cantidad supera stock
                    </span>
                  </div>
                )}
              </div>

              {/* COLUMNA TERCERA: PRECIO ESPECIAL APLICADO */}
              {formData.precioEntidadId && (
                <div
                  style={{
                    backgroundColor: "#E3F2FD",
                    borderRadius: "10px",
                    border: "3px solid #2196F3",
                    padding: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {/* Título */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderBottom: "2px solid #2196F3",
                      paddingBottom: "8px",
                    }}
                  >
                    <i
                      className="pi pi-tag"
                      style={{ color: "#2196F3", fontSize: "1.5rem" }}
                    />
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#1976D2",
                        fontSize: "medium",
                      }}
                    >
                      PRECIO ESPECIAL
                    </span>
                    {formData.precioFueEditado && (
                      <Tag value="✏️EDITADO" severity="primary" size="small" />
                    )}
                  </div>
                  {/* ID Precio */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      ID Precio:
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#1976D2",
                        }}
                      >
                        #{formData.precioEntidadId}
                      </span>
                      <Badge value="ID" severity="info" />
                    </div>
                  </div>

                  {/* Precio Original */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      Precio Original:
                    </span>
                    <div
                      style={{
                        backgroundColor: "#fff",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "2px solid #2196F3",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: "bold",
                          color: "#1976D2",
                        }}
                      >
                        {getCodigoMoneda()}{" "}
                        {formatearNumero(formData.precioEntidadOriginal || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Estado */}
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "2px solid #4caf50",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "auto",
                    }}
                  >
                    <i
                      className="pi pi-check-circle"
                      style={{ fontSize: "1.2rem", color: "#4caf50" }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#4caf50",
                        fontWeight: "bold",
                      }}
                    >
                      Precio aplicado
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              type="button"
              label="Seleccionar Producto"
              icon="pi pi-search"
              className="p-button-primary"
              severity="primary"
              raised
              onClick={() => setShowProductoSelector(true)}
              disabled={saving || !puedeEditarDetalles}
            />
          )}
        </div>

        <ProductoSelectorDialog
          visible={showProductoSelector}
          onHide={() => setShowProductoSelector(false)}
          onSelect={handleProductoSelect}
          modo="egreso"
          empresaId={empresaId}
          clienteId={entidadComercialId}
          esCustodia={false}
        />

        {/* SECCIÓN: CANTIDADES Y PESOS */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 0.7 }}>
            <label
              htmlFor="cantidad"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Cantidad *
            </label>
            <InputNumber
              id="cantidad"
              value={formData.cantidad}
              onValueChange={(e) => handleChange("cantidad", e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              required
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{ fontWeight: "bold", textAlign: "right" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="pesoNeto"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Peso Neto (Kg)
            </label>
            <InputNumber
              id="pesoNeto"
              value={formData.pesoNeto}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold", textAlign: "right" }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label
              htmlFor="unidad"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Unidad/Empaque
            </label>
            <InputText
              id="unidad"
              value={productoSeleccionado?.unidadMedida?.nombre || "-"}
              disabled
              style={{
                fontWeight: "bold",
                backgroundColor: "#f5f5f5",
              }}
            />
          </div>
          <div style={{ flex: 0.8 }}>
            <label
              htmlFor="costoUnitarioEstimado"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Costo Unit.
            </label>
            <InputNumber
              id="costoUnitarioEstimado"
              value={formData.costoUnitarioEstimado}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold", textAlign: "right" }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label
              htmlFor="factorExportacionAplicado"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Factor Exportación
            </label>
            <InputNumber
              id="factorExportacionAplicado"
              value={formData.factorExportacionAplicado}
              mode="decimal"
              minFractionDigits={6}
              maxFractionDigits={6}
              min={0}
              disabled={true}
              inputStyle={{ fontWeight: "bold", textAlign: "right" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="precioUnitario"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              V. Venta Unit. *
            </label>
            <InputNumber
              id="precioUnitario"
              value={formData.precioUnitario}
              onValueChange={(e) => handleChange("precioUnitario", e.value)}
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              min={0}
              disabled
              inputStyle={{ fontWeight: "bold", textAlign: "right" }}
            />
          </div>
        </div>
        {/* SECCIÓN: PRECIOS */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              htmlFor="precioUnitarioFinal"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              V. Venta Unit. Final
            </label>
            <InputNumber
              id="precioUnitarioFinal"
              value={formData.precioUnitarioFinal}
              onValueChange={(e) =>
                handleChange("precioUnitarioFinal", e.value)
              }
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              min={0}
              disabled={saving || !puedeEditarDetalles}
              inputStyle={{
                fontWeight: "bold",
                textAlign: "right",
                backgroundColor: "#e3f2fd",
              }}
            />
          </div>
          {/* Subtotal sin IGV */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="subtotalSinIGV"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Subtotal (sin IGV)
            </label>
            <InputNumber
              id="subtotalSinIGV"
              value={
                (formData.cantidad || 0) * (formData.precioUnitarioFinal || 0)
              }
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                backgroundColor: "#fff",
                textAlign: "right",
              }}
            />
          </div>

          {/* IGV */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="totaldetigv"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              IGV ({datosGenerales?.porcentajeIGV || 0}%)
            </label>
            <InputNumber
              id="totaldetigv"
              value={
                ((formData.cantidad || 0) *
                  (formData.precioUnitarioFinal || 0) *
                  (datosGenerales?.porcentajeIGV || 0)) /
                100
              }
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                backgroundColor: "#fff",
                textAlign: "right",
              }}
            />
          </div>

          {/* Total con IGV */}
          <div style={{ flex: 1 }}>
            <label
              htmlFor="totalconigv"
              style={{
                fontWeight: "bold",
                textAlign: "center",
                display: "block",
              }}
            >
              Total (con IGV)
            </label>
            <InputNumber
              id="totalconigv"
              value={
                (formData.cantidad || 0) *
                (formData.precioUnitarioFinal || 0) *
                (1 + (datosGenerales?.porcentajeIGV || 0) / 100)
              }
              mode="currency"
              currency={getCodigoMoneda()}
              locale="es-PE"
              minFractionDigits={2}
              disabled
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.3rem",
                backgroundColor: "#bbdefb",
                color: "#0d47a1",
                textAlign: "right",
              }}
            />
          </div>
        </div>

        {/* SECCIÓN: MÁRGENES DE UTILIDAD */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "12px",
                fontSize: "1.1em",
                color: "#1976d2",
              }}
            >
              📊 Márgenes de Utilidad
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="margenMinimoPermitido"
                  style={{
                    fontWeight: "bold",
                    fontSize: "0.9em",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  Margen Mínimo Permitido (%)
                </label>
                <InputNumber
                  id="margenMinimoPermitido"
                  value={formData.margenMinimoPermitido}
                  onValueChange={(e) =>
                    handleChange("margenMinimoPermitido", e.value)
                  }
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  max={100}
                  suffix=" %"
                  disabled
                  inputStyle={{ fontWeight: "bold" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="margenUtilidadObjetivo"
                  style={{
                    fontWeight: "bold",
                    fontSize: "0.9em",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  Margen Objetivo (%)
                </label>
                <InputNumber
                  id="margenUtilidadObjetivo"
                  value={formData.margenUtilidadObjetivo}
                  onValueChange={(e) =>
                    handleChange("margenUtilidadObjetivo", e.value)
                  }
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  max={100}
                  suffix=" %"
                  disabled
                  inputStyle={{ fontWeight: "bold" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="margenUtilidadReal"
                  style={{
                    fontWeight: "bold",
                    fontSize: "0.9em",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  Margen Real Calculado (%)
                </label>
                <InputNumber
                  id="margenUtilidadReal"
                  value={formData.margenUtilidadReal}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  suffix=" %"
                  disabled
                  inputStyle={{
                    fontWeight: "bold",
                    backgroundColor:
                      formData.margenUtilidadReal !== null &&
                      formData.margenMinimoPermitido !== null &&
                      formData.margenUtilidadReal <
                        formData.margenMinimoPermitido
                        ? "#ffebee"
                        : "#e8f5e9",
                    color:
                      formData.margenUtilidadReal !== null &&
                      formData.margenMinimoPermitido !== null &&
                      formData.margenUtilidadReal <
                        formData.margenMinimoPermitido
                        ? "#c62828"
                        : "#2e7d32",
                  }}
                />
              </div>
            </div>

            {/* Alerta si el margen es menor al mínimo */}
            {formData.margenUtilidadReal !== null &&
              formData.margenMinimoPermitido !== null &&
              formData.margenUtilidadReal < formData.margenMinimoPermitido && (
                <Message
                  severity="warn"
                  text={`⚠️ El margen calculado (${formData.margenUtilidadReal.toFixed(
                    2
                  )}%) es menor al mínimo permitido (${
                    formData.margenMinimoPermitido
                  }%)`}
                  style={{ marginTop: "8px", width: "100%" }}
                />
              )}
          </div>
        </div>
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {/* SECCIÓN: CENTRO DE COSTO */}
          <div style={{ flex: 1 }}>
            <label htmlFor="centroCostoId" style={{ fontWeight: "bold" }}>
              Centro de Costo *
            </label>
            <Dropdown
              id="centroCostoId"
              value={formData.centroCostoId}
              options={centrosCosto.map((c) => ({
                label: `${c.Codigo} - ${c.Nombre}`,
                value: Number(c.id),
              }))}
              onChange={(e) => handleChange("centroCostoId", e.value)}
              placeholder="Seleccionar centro de costo"
              filter
              showClear
              disabled={saving || !puedeEditarDetalles}
            />
          </div>
        </div>

        {/* Sección de Información Trazabilidad */}
        <Panel
          header="Información Trazabilidad"
          toggleable
          collapsed
          className="p-mt-3"
        >
          {/* SECCIÓN: TRAZABILIDAD */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="loteProduccion"
                style={{
                  fontWeight: "bold",
                  textAlign: "center",
                  display: "block",
                }}
              >
                Lote Producción
              </label>
              <InputText
                id="loteProduccion"
                value={formData.loteProduccion}
                onChange={(e) => handleChange("loteProduccion", e.target.value)}
                maxLength={50}
                disabled={saving || !puedeEditarDetalles}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label
                htmlFor="temperaturaAlmacenamiento"
                style={{ fontWeight: "bold" }}
              >
                Temperatura
              </label>
              <InputText
                id="temperaturaAlmacenamiento"
                value={formData.temperaturaAlmacenamiento}
                onChange={(e) =>
                  handleChange("temperaturaAlmacenamiento", e.target.value)
                }
                maxLength={50}
                placeholder="Ej: -18°C"
                disabled={saving || !puedeEditarDetalles}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaProduccion" style={{ fontWeight: "bold" }}>
                Fecha Producción
              </label>
              <Calendar
                id="fechaProduccion"
                value={formData.fechaProduccion}
                onChange={(e) => handleChange("fechaProduccion", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={saving || !puedeEditarDetalles}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
                Fecha Vencimiento
              </label>
              <Calendar
                id="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={(e) => handleChange("fechaVencimiento", e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={saving || !puedeEditarDetalles}
              />
            </div>
          </div>

          {/* SECCIÓN: DESCRIPCIONES */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="descripcionAdicional"
                style={{ fontWeight: "bold" }}
              >
                Descripción Adicional
              </label>
              <InputTextarea
                id="descripcionAdicional"
                value={formData.descripcionAdicional}
                onChange={(e) =>
                  handleChange("descripcionAdicional", e.target.value)
                }
                rows={2}
                disabled={saving || !puedeEditarDetalles}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
                Observaciones
              </label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                rows={2}
                disabled={saving}
              />
            </div>
          </div>
        </Panel>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            disabled={saving}
            className="p-button-warning"
            severity="warning"
            size="small"
            outlined
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={!puedeEditarDetalles}
            className="p-button-success"
            severity="success"
            size="small"
            outlined
          />
        </div>
      </div>
    </Dialog>
  );
}
