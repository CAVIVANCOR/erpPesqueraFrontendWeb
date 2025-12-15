// src/components/cotizacionVentas/CostosExportacionCard.jsx
/**
 * Card de Costos de Exportación para Cotización de Ventas
 * Gestiona costos estimados de exportación con integración completa al backend
 * Calcula automáticamente el factor de exportación basado en los costos
 *
 * @author ERP Megui
 * @version 3.0.0 - Implementación profesional con CRUD completo
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import {
  getCostosExportacionPorCotizacion,
  crearCostoExportacionCotizacion,
  actualizarCostoExportacionCotizacion,
  eliminarCostoExportacionCotizacion,
} from "../../api/costosExportacionCotizacion";
import { cargarCostosSegunIncoterm } from "../../api/cotizacionVentas";
import { formatearNumero, getResponsiveFontSize } from "../../utils/utils";
import CostoExportacionDialog from "./CostoExportacionDialog";

// Estado inicial para un nuevo costo
const COSTO_INICIAL = {
  productoId: null,
  montoEstimado: 0,
  monedaId: null,
  tipoCambioAplicado: 1,
  montoEstimadoMonedaBase: 0,
  aplicaSegunIncoterm: true,
  proveedorId: null,
  requiereDocumento: false,
  esObligatorio: true,
  orden: 1,
};

const CostosExportacionCard = ({
  cotizacionId,
  incotermId,
  productos = [],
  monedasOptions = [],
  proveedores = [],
  puedeEditar = true,
  toast,
  onFactorCalculado,
  detalles = [],
  readOnly = false,
}) => {
  // Estados
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCosto, setEditingCosto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cargandoCostos, setCargandoCostos] = useState(false);
  const [factorExportacion, setFactorExportacion] = useState(1);

  // Refs para evitar loops infinitos
  const costosRef = useRef(costos);
  const detallesRef = useRef(detalles);
  const isCalculatingRef = useRef(false);

  // Cargar costos desde el backend
  const cargarCostos = useCallback(async () => {
    if (!cotizacionId) return;
    
    setLoading(true);
    try {
      const data = await getCostosExportacionPorCotizacion(cotizacionId);
      setCostos(data);
    } catch (error) {
      console.error("Error al cargar costos:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los costos de exportación",
      });
    } finally {
      setLoading(false);
    }
  }, [cotizacionId, toast]);

  // Actualizar refs cuando cambien los valores
  useEffect(() => {
    costosRef.current = costos;
  }, [costos]);

  useEffect(() => {
    detallesRef.current = detalles;
  }, [detalles]);

  // Cargar costos al montar
  useEffect(() => {
    if (cotizacionId) {
      cargarCostos();
    }
  }, [cotizacionId, cargarCostos]);

  // Calcular factor cuando cambien costos o detalles
  useEffect(() => {
    const totalCostos = costos.reduce(
      (sum, costo) => sum + (Number(costo.montoEstimadoMonedaBase) || 0),
      0
    );

    const pesoTotal = detalles.reduce(
      (sum, detalle) => sum + (Number(detalle.pesoNeto) || 0),
      0
    );

    const factor = pesoTotal > 0 ? totalCostos / pesoTotal : 1;
    setFactorExportacion(factor);
  }, [costos, detalles]);

  // Calcular factor de exportación manualmente
  const calcularFactorExportacion = useCallback(() => {
    const costosActuales = costosRef.current;
    const detallesActuales = detallesRef.current;
    
    const totalCostos = costosActuales.reduce(
      (sum, costo) => sum + (Number(costo.montoEstimadoMonedaBase) || 0),
      0
    );

    const pesoTotal = detallesActuales.reduce(
      (sum, detalle) => sum + (Number(detalle.pesoNeto) || 0),
      0
    );

    const factor = pesoTotal > 0 ? totalCostos / pesoTotal : 1;

    if (onFactorCalculado) {
      onFactorCalculado(factor);
    }

    return factor;
  }, [onFactorCalculado]);

  // Convertir a moneda base
  const convertirAMonedaBase = (monto, monedaId, tipoCambio) => {
    return Number(monto) * Number(tipoCambio || 1);
  };

  // Abrir diálogo para agregar
  const handleAgregar = () => {
    const nuevoOrden =
      costos.length > 0 ? Math.max(...costos.map((c) => c.orden || 0)) + 1 : 1;

    setEditingCosto({
      ...COSTO_INICIAL,
      orden: nuevoOrden,
    });
    setShowDialog(true);
  };

  // Abrir diálogo para editar
  const handleEditar = (costo) => {
    setEditingCosto({
      ...costo,
      productoId: costo.productoId ? Number(costo.productoId) : null,
      monedaId: costo.monedaId ? Number(costo.monedaId) : null,
      proveedorId: costo.proveedorId ? Number(costo.proveedorId) : null,
    });
    setShowDialog(true);
  };

  // Guardar costo
  const handleGuardar = async () => {
    // Validaciones
    if (!editingCosto.productoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un producto de gastos de exportación",
      });
      return;
    }

    if (!editingCosto.monedaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar una moneda",
      });
      return;
    }

    if (Number(editingCosto.montoEstimado) <= 0) {
      toast?.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El monto estimado debe ser mayor a cero",
      });
      return;
    }

    setSaving(true);
    try {
      const montoEnMonedaBase = convertirAMonedaBase(
        editingCosto.montoEstimado,
        editingCosto.monedaId,
        editingCosto.tipoCambioAplicado
      );

      const datosGuardar = {
        ...editingCosto,
        cotizacionVentasId: cotizacionId,
        montoEstimadoMonedaBase: montoEnMonedaBase,
        productoId: Number(editingCosto.productoId),
        monedaId: Number(editingCosto.monedaId),
        proveedorId: editingCosto.proveedorId
          ? Number(editingCosto.proveedorId)
          : null,
        montoEstimado: Number(editingCosto.montoEstimado),
        tipoCambioAplicado: Number(editingCosto.tipoCambioAplicado || 1),
        orden: Number(editingCosto.orden || 1),
      };

      if (editingCosto.id) {
        await actualizarCostoExportacionCotizacion(
          editingCosto.id,
          datosGuardar
        );
        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Costo actualizado correctamente",
        });
      } else {
        await crearCostoExportacionCotizacion(datosGuardar);
        toast?.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Costo agregado correctamente",
        });
      }

      setShowDialog(false);
      setEditingCosto(null);
      await cargarCostos();
    } catch (error) {
      console.error("Error al guardar costo:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "No se pudo guardar el costo",
      });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar costo
  const handleEliminar = (costo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el costo "${costo.producto?.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarCostoExportacionCotizacion(costo.id);
          toast?.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Costo eliminado correctamente",
          });
          await cargarCostos();
        } catch (error) {
          console.error("Error al eliminar costo:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo eliminar el costo",
          });
        }
      },
    });
  };

  // Cargar costos según Incoterm
  const handleCargarCostosIncoterm = () => {
    // Validar que haya un Incoterm seleccionado
    if (!incotermId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Incoterm requerido",
        detail:
          "Debe seleccionar un Incoterm en los datos generales antes de cargar los costos de exportación",
        life: 4000,
      });
      return;
    }

    confirmDialog({
      message: (
        <div>
          <p>
            ¿Desea cargar los costos de exportación según el Incoterm
            seleccionado?
          </p>
          <p
            style={{ color: "#2196F3", fontSize: "0.9rem", marginTop: "1rem" }}
          >
            ℹ️ Si un costo ya existe (mismo producto), se actualizará. Si no
            existe, se creará nuevo.
          </p>
        </div>
      ),
      header: "Cargar Costos según Incoterm",
      icon: "pi pi-download",
      acceptLabel: "Cargar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setCargandoCostos(true);
        try {
          const response = await cargarCostosSegunIncoterm(cotizacionId);

          // Construir mensaje detallado
          let detailMsg = response.mensaje;
          if (
            response.cantidadCreados > 0 ||
            response.cantidadActualizados > 0
          ) {
            detailMsg += ` (${response.total} total)`;
          }

          toast?.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: detailMsg,
            life: 4000,
          });

          // Recargar costos
          await cargarCostos();
        } catch (error) {
          console.error("Error al cargar costos según Incoterm:", error);

          const errorMsg =
            error.response?.data?.error ||
            error.response?.data?.mensaje ||
            "Error al cargar los costos de exportación";

          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: errorMsg,
            life: 5000,
          });
        } finally {
          setCargandoCostos(false);
        }
      },
    });
  };

  // Cambio de campo
  const handleCampoChange = (campo, valor) => {
    setEditingCosto((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // Templates de columnas
  const productoNombreTemplate = (rowData) => (
    <div>
      <div style={{ fontWeight: "bold" }}>
        {rowData.producto?.descripcionArmada || "S/D"}
      </div>
    </div>
  );

  const subfamiliaTemplate = (rowData) =>
    rowData.producto?.subfamilia?.nombre || "-";

  const montoEstimadoTemplate = (rowData) => {
    const simbolo = rowData.moneda?.simbolo || "$";
    return `${simbolo} ${formatearNumero(rowData.montoEstimado)}`;
  };

  const montoMonedaBaseTemplate = (rowData) =>
    `$ ${formatearNumero(rowData.montoEstimadoMonedaBase)}`;

  const incotermTemplate = (rowData) => (
    <Badge
      value={rowData.aplicaSegunIncoterm ? "SÍ" : "NO"}
      severity={rowData.aplicaSegunIncoterm ? "success" : "secondary"}
    />
  );

  const proveedorTemplate = (rowData) => rowData.proveedor?.razonSocial || "-";

  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEditar(rowData)}
        disabled={!puedeEditar || readOnly}
        tooltip="Editar"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleEliminar(rowData)}
        disabled={!puedeEditar || readOnly}
        tooltip="Eliminar"
      />
    </div>
  );

  // Calcular total
  const calcularTotalEstimado = () => {
    return costos.reduce(
      (sum, costo) => sum + (Number(costo.montoEstimadoMonedaBase) || 0),
      0
    );
  };

  const familiaGastosExportacionId = 7;
  // Filtrar productos de familia 7
  const productosGastosExportacion = productos.filter(
    (p) => Number(p.familiaId) === Number(familiaGastosExportacionId)
  );

  const productosOptions = productosGastosExportacion.map((p) => ({
    label: p.descripcionArmada,
    value: Number(p.id),
  }));

  const monedasOptionsFormatted = monedasOptions.map((m) => ({
    label: `${m.codigoSunat} - ${m.nombre}`,
    value: Number(m.value || m.id),
  }));

  const proveedoresOptions = proveedores.map((p) => ({
    label: p.razonSocial,
    value: Number(p.id),
  }));

  return (
    <div>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0 }}>Costos de Exportación</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            type="button"
            label="Cargar según Incoterm"
            icon="pi pi-download"
            onClick={handleCargarCostosIncoterm}
            disabled={!puedeEditar || readOnly || !cotizacionId || cargandoCostos}
            loading={cargandoCostos}
            className="p-button-info"
            tooltip="Carga automáticamente los costos configurados para el Incoterm seleccionado"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            type="button"
            label="Agregar Costo"
            icon="pi pi-plus"
            onClick={handleAgregar}
            disabled={!puedeEditar || readOnly || !cotizacionId}
            className="p-button-success"
          />
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        value={costos}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        selectionMode="single"
        onRowClick={(e) => handleEditar(e.data)}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} costos"
        emptyMessage="No hay costos de exportación agregados"
      >
        <Column
          field="orden"
          header="#"
          style={{ width: "60px", textAlign: "center" }}
        />
        <Column
          field="producto.subfamilia.nombre"
          header="Subfamilia"
          body={subfamiliaTemplate}
          style={{ minWidth: "120px" }}
        />
        <Column
          field="producto.nombre"
          header="Producto"
          body={productoNombreTemplate}
          style={{ minWidth: "250px" }}
        />

        <Column
          field="montoEstimado"
          header="Monto Estimado"
          body={montoEstimadoTemplate}
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          field="montoEstimadoMonedaBase"
          header="Monto en USD"
          body={montoMonedaBaseTemplate}
          style={{ minWidth: "120px", textAlign: "right" }}
        />
        <Column
          field="aplicaSegunIncoterm"
          header="Aplica Incoterm"
          body={incotermTemplate}
          style={{ minWidth: "120px", textAlign: "center" }}
        />
        <Column
          field="proveedor.razonSocial"
          header="Proveedor"
          body={proveedorTemplate}
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>

      {/* Totales */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div style={{ minWidth: "300px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontWeight: "bold" }}>Total Costos Estimados:</span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                color: "#2196F3",
              }}
            >
              $ {formatearNumero(calcularTotalEstimado())}
            </span>
          </div>
          {detalles.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                color: "#666",
              }}
            >
              <span>Factor de Exportación:</span>
              <span style={{ fontWeight: "bold" }}>
                {formatearNumero(factorExportacion, 4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Modular */}
      <CostoExportacionDialog
        visible={showDialog}
        costo={editingCosto}
        onHide={() => {
          setShowDialog(false);
          setEditingCosto(null);
        }}
        onSave={handleGuardar}
        onCampoChange={handleCampoChange}
        productosOptions={productosOptions}
        monedasOptions={monedasOptionsFormatted}
        proveedoresOptions={proveedoresOptions}
        saving={saving}
      />
    </div>
  );
};

export default CostosExportacionCard;