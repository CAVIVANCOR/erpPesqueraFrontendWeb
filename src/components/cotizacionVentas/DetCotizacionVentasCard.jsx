// src/components/cotizacionVentas/DetCotizacionVentasCard.jsx
/**
 * Card de Detalles para Cotización de Ventas
 * Replicado desde RequerimientoCompra/DetallesTab.jsx
 * 
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { InputNumber } from "primereact/inputnumber";
import { Badge } from "primereact/badge";
import DetalleDialogCV from "./DetalleDialogCV";
import DatosTrazabilidadDialog from "./DatosTrazabilidadDialog";
import {
  getDetallesCotizacionVentas,
  eliminarDetalleCotizacionVentas,
  actualizarDetalleCotizacionVentas,
} from "../../api/detalleCotizacionVentas";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";

export default function DetCotizacionVentasCard({
  cotizacionId,
  productos,
  empresaId,
  empresasOptions,
  puedeEditar,
  puedeVerDetalles,
  puedeEditarDetalles,
  datosGenerales,
  toast,
  onCountChange,
  subtotal = 0,
  totalIGV = 0,
  total = 0,
  monedasOptions = [],
  monedaId = 1,
  porcentajeIGV = 0,
  centrosCosto = [],
}) {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [showTrazabilidadDialog, setShowTrazabilidadDialog] = useState(false);

  useEffect(() => {
    if (cotizacionId) {
      cargarDetalles();
    }
  }, [cotizacionId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(detalles.length);
    }
  }, [detalles, onCountChange]);

  // Forzar re-render cuando cambie el porcentajeIGV o esExoneradoAlIGV de la cabecera
  useEffect(() => {
    // Este useEffect fuerza un re-render para actualizar los templates
    // que dependen de datosGenerales.porcentajeIGV y datosGenerales.esExoneradoAlIGV
  }, [datosGenerales?.porcentajeIGV, datosGenerales?.esExoneradoAlIGV]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      const data = await getDetallesCotizacionVentas(cotizacionId);
      setDetalles(data);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingDetalle(null);
    setShowDialog(true);
  };

  const handleEdit = (detalle) => {
    setEditingDetalle(detalle);
    setShowDialog(true);
  };

  const handleDelete = (detalle) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el detalle del producto "${detalle.producto?.nombre || 'este producto'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await eliminarDetalleCotizacionVentas(detalle.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Detalle eliminado correctamente",
          });
          cargarDetalles();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.error || "No se pudo eliminar el detalle",
          });
        }
      }
    });
  };

  const handleSaveSuccess = () => {
    setShowDialog(false);
    cargarDetalles();
  };

  /**
   * Asigna datos de trazabilidad a todos los detalles
   */
  const handleAsignarTrazabilidad = async (datosTrazabilidad) => {
    setLoading(true);
    try {
      // Actualizar todos los detalles con los datos de trazabilidad
      const promesas = detalles.map((detalle) => {
        // Construir objeto solo con los campos necesarios (sin relaciones)
        const datosActualizados = {
          cotizacionVentasId: detalle.cotizacionVentasId,
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          pesoNeto: detalle.pesoNeto,
          costoUnitarioEstimado: detalle.costoUnitarioEstimado,
          factorExportacionAplicado: detalle.factorExportacionAplicado,
          precioUnitario: detalle.precioUnitario,
          precioUnitarioFinal: detalle.precioUnitarioFinal,
          precioEntidadId: detalle.precioEntidadId,
          precioEntidadOriginal: detalle.precioEntidadOriginal,
          precioFueEditado: detalle.precioFueEditado,
          margenMinimoPermitido: detalle.margenMinimoPermitido,
          margenUtilidadObjetivo: detalle.margenUtilidadObjetivo,
          margenUtilidadReal: detalle.margenUtilidadReal,
          centroCostoId: detalle.centroCostoId,
          descripcionAdicional: detalle.descripcionAdicional,
          observaciones: detalle.observaciones,
          // Actualizar campos de trazabilidad con los nuevos valores
          loteProduccion: datosTrazabilidad.loteProduccion || detalle.loteProduccion,
          temperaturaAlmacenamiento: datosTrazabilidad.temperaturaAlmacenamiento || detalle.temperaturaAlmacenamiento,
          fechaProduccion: datosTrazabilidad.fechaProduccion || detalle.fechaProduccion,
          fechaVencimiento: datosTrazabilidad.fechaVencimiento || detalle.fechaVencimiento,
        };
        return actualizarDetalleCotizacionVentas(detalle.id, datosActualizados);
      });

      await Promise.all(promesas);
      await cargarDetalles();
    } catch (error) {
      console.error("Error al asignar trazabilidad:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper para obtener símbolo de moneda
  const getSimboloMoneda = () => {
    const moneda = monedasOptions.find((m) => Number(m.value) === Number(monedaId));
    return moneda?.codigoSunat === "USD" ? "$" : "S/";
  };

  const precioTemplate = (rowData) => {
    return rowData.precioUnitario
      ? `${getSimboloMoneda()} ${formatearNumero(rowData.precioUnitario)}`
      : "";
  };

  const subtotalTemplate = (rowData) => {
    const cantidad = Number(rowData.cantidad) || 0;
    const precioFinal = Number(rowData.precioUnitarioFinal) || 0;
    const subtotalLinea = cantidad * precioFinal;
    
    // Si la cotización está afecta al IGV, agregar el IGV a cada línea
    // IMPORTANTE: Usar porcentajeIGV de la cabecera (datosGenerales)
    const esExonerado = datosGenerales?.esExoneradoAlIGV === true;
    const porcentajeIGVCabecera = Number(datosGenerales?.porcentajeIGV) || 0;
    
    // Si está exonerado O el porcentaje es 0, no aplicar IGV
    const totalLineaConIGV = (esExonerado || porcentajeIGVCabecera === 0)
      ? subtotalLinea 
      : subtotalLinea * (1 + porcentajeIGVCabecera / 100);
    
    return totalLineaConIGV > 0 ? `${getSimboloMoneda()} ${formatearNumero(totalLineaConIGV)}` : "";
  };

  const costoUnitarioTemplate = (rowData) => {
    return rowData.costoUnitarioEstimado
      ? `${getSimboloMoneda()} ${formatearNumero(rowData.costoUnitarioEstimado)}`
      : "";
  };

  const factorExportacionTemplate = (rowData) => {
    return rowData.factorExportacionAplicado
      ? formatearNumero(rowData.factorExportacionAplicado, 4)
      : "1.0000";
  };

  const precioUnitarioFinalTemplate = (rowData) => {
    return rowData.precioUnitarioFinal
      ? `${getSimboloMoneda()} ${formatearNumero(rowData.precioUnitarioFinal)}`
      : "";
  };

  const margenRealTemplate = (rowData) => {
    const precioFinal = Number(rowData.precioUnitarioFinal) || 0;
    const costo = Number(rowData.costoUnitarioEstimado) || 0;
    
    if (precioFinal === 0) return <Badge value="0.00%" severity="secondary" />;
    
    const margen = ((precioFinal - costo) / precioFinal) * 100;
    const margenMinimo = Number(rowData.margenMinimoPermitido) || 0;
    const margenObjetivo = Number(rowData.margenUtilidadObjetivo) || 0;
    
    // Severity según los márgenes definidos en la tabla
    let severity = "secondary";
    
    if (margen < margenMinimo) {
      severity = "danger"; // Rojo - por debajo del mínimo
    } else if (margen === margenMinimo) {
      severity = "warning"; // Naranja - igual al mínimo
    } else if (margen > margenMinimo && margen <= margenObjetivo) {
      severity = "info"; // Azul - entre mínimo y objetivo
    } else if (margen > margenObjetivo) {
      severity = "success"; // Verde - supera el objetivo
    }
    
    return (
      <Badge 
        value={`${formatearNumero(margen)}%`} 
        severity={severity}
        size="small"
      />
    );
  };

  const precioVentaUnitarioTemplate = (rowData) => {
    const precioFinal = Number(rowData.precioUnitarioFinal) || 0;
    const porcentajeIGVCabecera = Number(datosGenerales?.porcentajeIGV) || 0;

    // Si el porcentaje es 0, no aplicar IGV
    const precioConIGV = porcentajeIGVCabecera === 0
      ? precioFinal 
      : precioFinal * (1 + porcentajeIGVCabecera / 100);
    
    return precioConIGV > 0 ? `${getSimboloMoneda()} ${formatearNumero(precioConIGV)}` : "";
  };

  const cantidadTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.cantidad}</span>;
  };

  const productoTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.producto?.descripcionArmada}</span>;
  };

  const unidadTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.producto?.unidadMedida?.nombre}</span>;
  };

  const nroItemTemplate = (rowData, options) => {
    return <span style={{ fontWeight: "bold" }}>{options.rowIndex + 1}</span>;
  };

  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", flexDirection: "row", gap: "8px", justifyContent: "center", alignItems: "center" }}>
      <Button
        icon={puedeEditarDetalles ? "pi pi-pencil" : "pi pi-eye"}
        className="p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(rowData);
        }}
        tooltip={puedeEditarDetalles ? "Editar detalle" : "Ver detalle"}
        style={{ padding: "0.25rem" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(rowData);
        }}
        disabled={!puedeEditarDetalles}
        tooltip={puedeEditarDetalles ? "Eliminar detalle" : "No se puede eliminar en este estado"}
        style={{ padding: "0.25rem" }}
      />
    </div>
  );

  // Calcular total
  const totalGeneral = detalles.reduce(
    (sum, det) => sum + (Number(det.subtotal) || 0),
    0
  );

  // Helper para obtener código de moneda
  const getCodigoMoneda = () => {
    const moneda = monedasOptions.find((m) => Number(m.value) === Number(monedaId));
    return moneda?.codigoSunat || "PEN";
  };

  return (
    <div>
      {/* FILA: TOTALES Y BOTÓN */}
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
            type="button"
            label="Agregar Detalle"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleAdd}
            disabled={!puedeEditarDetalles}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ opacity: 0 }}>.</label>
          <Button
            type="button"
            label="Datos Trazabilidad"
            icon="pi pi-tag"
            severity="info"
            onClick={() => setShowTrazabilidadDialog(true)}
            disabled={!puedeEditarDetalles || detalles.length === 0}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Valor Venta</label>
          <InputNumber
            value={subtotal || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: "#fcf2e0",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>IGV ({Number(datosGenerales?.porcentajeIGV) || 0}%)</label>
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
              backgroundColor: "#fff",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#2196F3" }}>Precio Venta Total</label>
          <InputNumber
            value={total || 0}
            mode="currency"
            currency={getCodigoMoneda()}
            locale="es-PE"
            minFractionDigits={2}
            disabled
            inputStyle={{
              fontWeight: "bold",
              fontSize: "1.2rem",
              backgroundColor: "#e3f2fd",
              color: "#1976D2",
              textAlign: "right",
            }}
          />
        </div>
      </div>

      <DataTable
        key={`dt-${datosGenerales?.porcentajeIGV || 0}`}
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        onRowClick={(e) => {
          if (puedeVerDetalles) {
            handleEdit(e.data);
          }
        }}
        selectionMode="single"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 15, 20]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} detalles"
        size="small"
        showGridlines
        stripedRows
      >
        <Column
          header="#"
          align="center"
          body={nroItemTemplate}
          style={{ width: "70px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #dee2e6", verticalAlign: "top" }}
        />
        <Column 
          field="producto.descripcionArmada" 
          header="Producto" 
          align="center"
          body={productoTemplate}
          style={{ minWidth: "200px", borderRight: "1px solid #dee2e6", verticalAlign: "top" }}
        />
        <Column 
          field="cantidad" 
          header="Cant." 
          align="center"
          body={cantidadTemplate}
          style={{ width: "80px", borderRight: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold", verticalAlign: "top" }} 
        />
        <Column
          field="producto.unidadMedida.nombre"
          header="Unid. Empaque"
          align="center"
          body={unidadTemplate}
          style={{ width: "80px", borderRight: "1px solid #dee2e6", textAlign: "center", verticalAlign: "top" }}
        />
        <Column
          field="costoUnitarioEstimado"
          header="C. Unit."
          align="center"
          body={costoUnitarioTemplate}
          style={{ width: "70px", borderRight: "1px solid #dee2e6", textAlign: "right", backgroundColor: "#fcf2e0", verticalAlign: "top" }}
        />
        <Column
          field="factorExportacionAplicado"
          header="Factor Exportación"
          align="center"
          body={factorExportacionTemplate}
          style={{ width: "60px", borderRight: "1px solid #dee2e6", textAlign: "center", verticalAlign: "top" }}
        />
        <Column
          field="precioUnitario"
          header="V.V.Unit." 
          align="center"
          body={precioTemplate}
          style={{ width: "80px", borderRight: "1px solid #dee2e6", textAlign: "right", backgroundColor: "#fcf2e0", verticalAlign: "top" }}
        />
        <Column
          field="precioUnitarioFinal"
          header="V.V.Unit.Final"
          align="center"
          body={precioUnitarioFinalTemplate}
          style={{ width: "80px", borderRight: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#fcf2e0", verticalAlign: "top" }}
        />
        <Column
          header="Margen Real %"
          align="center"
          body={margenRealTemplate}
          style={{ width: "90px", borderRight: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold", backgroundColor: "#fff3e0", verticalAlign: "top" }}
        />
        <Column
          field="precioUnitarioFinal"
          header="P.Venta Unit."
          align="center"
          body={precioVentaUnitarioTemplate}
          style={{ width: "80px", borderRight: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#e3f2fd", verticalAlign: "top" }}
        />
        <Column
          header="P. Venta Total"
          align="center"
          body={subtotalTemplate}
          style={{ width: "130px", borderRight: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#e3f2fd", verticalAlign: "top" }}
        />
        <Column
          header="Acciones"
          align="center"
          body={accionesTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>

      <DetalleDialogCV
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        detalle={editingDetalle}
        cotizacionId={cotizacionId}
        productos={productos}
        empresaId={empresaId}
        empresas={empresasOptions}
        datosGenerales={datosGenerales}
        centrosCosto={centrosCosto}
        puedeEditarDetalles={puedeEditarDetalles}
        onSaveSuccess={handleSaveSuccess}
        toast={toast}
        monedasOptions={monedasOptions}
        monedaId={monedaId}
      />

      <DatosTrazabilidadDialog
        visible={showTrazabilidadDialog}
        onHide={() => setShowTrazabilidadDialog(false)}
        onAsignar={handleAsignarTrazabilidad}
        toast={toast}
      />
    </div>
  );
}