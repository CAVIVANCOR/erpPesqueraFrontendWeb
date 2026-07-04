// src/components/ordenCompra/DetallesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { InputNumber } from "primereact/inputnumber";
import DetalleDialog from "./DetalleDialog";
import {
  getDetallesOrdenCompra,
  eliminarDetalleOrdenCompra,
} from "../../api/detalleOrdenCompra";
import { getResponsiveFontSize, formatearFecha } from "../../utils/utils";

export default function DetallesTab({
  ordenCompraId,
  productos,
  puedeEditar,
  toast,
  onCountChange,
  onChange, // ⭐ NUEVO: Callback para notificar cambios
  subtotal = 0,
  totalIGV = 0,
  montoImpuestoRenta = 0,
  aplicaImpuestoRenta = false,
  total = 0,
  porcentajeIGV = 0,
  monedas = [],
  monedaId = null,
  pagosPreviosSI = 0,
  tipoDocumentoId = null,
  tiposDocumentoOptions = [],
  readOnly = false,
  permisos = {},
  empresaId,
  empresas = [],
}) {
  const tipoDocSeleccionado = tiposDocumentoOptions.find(
    (t) => Number(t.value) === Number(tipoDocumentoId),
  );
  const esSaldoInicial = tipoDocSeleccionado?.codigo?.startsWith("SI-");
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);

  // Construir datosGenerales con la moneda seleccionada
  const monedaSeleccionada = monedas.find(
    (m) => Number(m.id) === Number(monedaId)
  );
  const datosGenerales = {
    moneda: monedaSeleccionada,
  };

  useEffect(() => {
    if (ordenCompraId) {
      cargarDetalles();
    }
  }, [ordenCompraId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(detalles.length);
    }
  }, [detalles, onCountChange]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      const data = await getDetallesOrdenCompra(ordenCompraId);
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
      message: `¿Está seguro de eliminar el detalle del producto "${detalle.producto?.descripcionArmada || 'este producto'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await eliminarDetalleOrdenCompra(detalle.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Detalle eliminado correctamente",
          });
          cargarDetalles();
          // ⭐ NUEVO: Notificar al padre para que recalcule totales
          if (onChange) {
            onChange();
          }
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
    // ⭐ NUEVO: Notificar al padre para que recalcule totales
    if (onChange) {
      onChange();
    }
  };

  const cantidadTemplate = (rowData) => {
    return rowData.cantidad
      ? Number(rowData.cantidad).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : "";
  };

  const precioTemplate = (rowData) => {
    const simboloMoneda = getSimboloMoneda();
    return rowData.precioUnitario
      ? `${simboloMoneda} ${Number(rowData.precioUnitario).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
      : "";
  };

  const subtotalTemplate = (rowData) => {
    const simboloMoneda = getSimboloMoneda();
    return rowData.subtotal
      ? `${simboloMoneda} ${Number(rowData.subtotal).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
      : "";
  };

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => handleEdit(rowData)}
        disabled={!puedeEditar}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-danger p-button-sm"
        onClick={() => handleDelete(rowData)}
        disabled={!puedeEditar}
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

  const subtotalMostrado = esSaldoInicial
    ? subtotal - (pagosPreviosSI || 0)
    : subtotal;
  const totalMostrado = esSaldoInicial
    ? total - (pagosPreviosSI || 0)
    : total;


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
          marginTop:10,
          padding: "5px",
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
              disabled={readOnly}
              inputStyle={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                backgroundColor: "#fff3cd",
                textAlign: "right",
              }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Valor Compra</label>
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
              backgroundColor: "#fff",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>
            IGV ({porcentajeIGV || 0}%)
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
              backgroundColor: "#fff",
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
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#2196F3" }}>
            Precio Compra Total
          </label>
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
              backgroundColor: "#e3f2fd",
              color: "#1976D2",
              textAlign: "right",
            }}
          />
        </div>
      </div>

      <DataTable
        key={`detalle-table-${monedaId || 'default'}`}
        value={detalles}
        loading={loading}
        emptyMessage="No hay detalles agregados"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 15, 20, 40]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
        size="small"
        showGridlines
        stripedRows
        sortField="id"
        sortOrder={-1}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => handleEdit(e.data)
            : undefined
        }
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
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
        <Column field="producto.descripcionArmada" header="Producto" />
        <Column
          field="cantidad"
          header="Cantidad"
          body={cantidadTemplate}
          style={{ width: "100px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
        />
        <Column
          field="producto.unidadMedida.nombre"
          header="Unidad"
        />
        <Column
          field="precioUnitario"
          header="P. Compra Unit."
          body={precioTemplate}
          style={{ width: "140px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
        />
        <Column
          field="subtotal"
          header="P. Compra SubTotal"
          body={subtotalTemplate}
          style={{ width: "140px", textAlign: "right" }}
          bodyStyle={{ textAlign: "right" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "120px" }}
        />
      </DataTable>

      <DetalleDialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        detalle={editingDetalle}
        ordenCompraId={ordenCompraId}
        empresaId={empresaId}
        entidadComercialId={empresas?.find(e => Number(e.id) === Number(empresaId))?.entidadComercialId} // ⭐ CORRECTO: entidadComercialId de la empresa
        productos={productos}
        datosGenerales={datosGenerales}
        empresas={empresas}
        porcentajeIGV={porcentajeIGV}
        esExoneradoIGV={datosGenerales?.esExoneradoAlIGV || false}
        puedeEditarDetalles={puedeEditar}
        onSaveSuccess={handleSaveSuccess}
        toast={toast}
      />
    </div>
  );
}
