// src/components/requerimientoCompra/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { InputNumber } from "primereact/inputnumber";
import DetalleDialog from "./DetalleDialog";
import {
  getDetallesReqCompra,
  eliminarDetalleReqCompra,
} from "../../api/detalleReqCompra";
import { getResponsiveFontSize } from "../../utils/utils";

export default function DetallesTab({
  requerimientoId,
  productos,
  empresaId,
  puedeEditar,
  datosGenerales,
  toast,
  onCountChange,
  subtotal = 0,
  totalIGV = 0,
  total = 0,
  monedasOptions = [],
  monedaId = 1,
  porcentajeIGV = 0,
}) {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);

  useEffect(() => {
    if (requerimientoId) {
      cargarDetalles();
    }
  }, [requerimientoId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(detalles.length);
    }
  }, [detalles, onCountChange]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      const data = await getDetallesReqCompra(requerimientoId);
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
          await eliminarDetalleReqCompra(detalle.id);
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

  // Formatear números con comas para miles y apóstrofe para millones
  const formatearNumero = (numero) => {
    const num = Number(numero);
    if (isNaN(num)) return "";
    
    const partes = num.toFixed(2).split(".");
    const entero = partes[0];
    const decimal = partes[1];
    
    // Formatear parte entera con comas y apóstrofes
    let enteroFormateado = "";
    let contador = 0;
    
    for (let i = entero.length - 1; i >= 0; i--) {
      if (contador === 3) {
        enteroFormateado = "," + enteroFormateado;
        contador = 0;
      }
      if (contador === 6) {
        enteroFormateado = "'" + enteroFormateado;
        contador = 0;
      }
      enteroFormateado = entero[i] + enteroFormateado;
      contador++;
    }
    
    // Agregar apóstrofe para millones si es necesario
    if (enteroFormateado.length > 7) {
      const partesMiles = enteroFormateado.split(",");
      if (partesMiles.length > 1) {
        enteroFormateado = partesMiles[0] + "'" + partesMiles.slice(1).join(",");
      }
    }
    
    return `${enteroFormateado}.${decimal}`;
  };

  const costoTemplate = (rowData) => {
    return rowData.costoUnitario
      ? `S/ ${formatearNumero(rowData.costoUnitario)}`
      : "";
  };

  const subtotalTemplate = (rowData) => {
    return rowData.subtotal ? `S/ ${formatearNumero(rowData.subtotal)}` : "";
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

  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", flexDirection: "row", gap: "8px", justifyContent: "center", alignItems: "center" }}>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(rowData);
        }}
        disabled={!puedeEditar}
        style={{ padding: "0.25rem" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(rowData);
        }}
        disabled={!puedeEditar}
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
    const moneda = monedasOptions.find((m) => m.value === monedaId);
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
          marginBottom: 15,
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "2px solid #dee2e6",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ opacity: 0 }}>.</label>
          <Button
            label="Agregar Detalle"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleAdd}
            disabled={!puedeEditar}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Valor Compra</label>
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
              backgroundColor: "#fff",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>IGV ({porcentajeIGV || 0}%)</label>
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
          <label style={{ fontWeight: "bold", color: "#2196F3" }}>Precio Compra Total</label>
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
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        className="p-datatable-gridlines"
        onRowClick={(e) => {
          if (puedeEditar) {
            handleEdit(e.data);
          }
        }}
        selectionMode="single"
      >
        <Column 
          field="producto.descripcionArmada" 
          header="Producto" 
          body={productoTemplate}
          style={{ borderRight: "1px solid #dee2e6" }}
        />
        <Column 
          field="cantidad" 
          header="Cantidad" 
          body={cantidadTemplate}
          style={{ width: "100px", borderRight: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold" }} 
        />
        <Column
          field="producto.unidadMedida.nombre"
          header="Unidad/Empaque"
          body={unidadTemplate}
          style={{ width: "180px", borderRight: "1px solid #dee2e6", textAlign: "center" }}
        />
        <Column
          field="costoUnitario"
          header="Precio Unit. Compra"
          body={costoTemplate}
          style={{ width: "150px", borderRight: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          field="subtotal"
          header="Precio Total Compra"
          body={subtotalTemplate}
          style={{ width: "150px", borderRight: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>

      <DetalleDialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        detalle={editingDetalle}
        requerimientoId={requerimientoId}
        productos={productos}
        empresaId={empresaId}
        datosGenerales={datosGenerales}
        onSaveSuccess={handleSaveSuccess}
        toast={toast}
      />
    </div>
  );
}