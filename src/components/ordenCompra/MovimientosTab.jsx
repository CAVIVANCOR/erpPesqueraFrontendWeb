// src/components/ordenCompra/MovimientosTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { generarMovimientoAlmacen } from "../../api/ordenCompra";
import { getConceptosMovAlmacen } from "../../api/conceptoMovAlmacen";

export default function MovimientosTab({ ordenCompraId, toast, onCountChange }) {
  const [movimientos, setMovimientos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    conceptoMovAlmacenId: null,
    fechaDocumento: new Date(),
    observaciones: "",
  });
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (ordenCompraId) {
      cargarDatos();
    }
  }, [ordenCompraId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(movimientos.length);
    }
  }, [movimientos, onCountChange]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar conceptos de movimiento (tipo INGRESO)
      const conceptosData = await getConceptosMovAlmacen();
      const conceptosIngreso = conceptosData.filter(
        (c) => c.tipoMovimiento === "INGRESO" && !c.cesado
      );
      setConceptos(conceptosIngreso);

      // Cargar movimientos asociados a esta orden
      // Nota: Esto se carga desde el backend en el defaultValues de la orden
      // Por ahora mostramos vacío hasta que se implemente la relación
      setMovimientos([]);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
    setLoading(false);
  };

  const handleGenerarMovimiento = () => {
    setFormData({
      conceptoMovAlmacenId: null,
      fechaDocumento: new Date(),
      observaciones: "",
    });
    setShowDialog(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmarGeneracion = async () => {
    // Validaciones
    if (!formData.conceptoMovAlmacenId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un concepto de movimiento",
      });
      return;
    }

    setGenerando(true);
    try {
      const resultado = await generarMovimientoAlmacen(ordenCompraId, formData);

      toast.current.show({
        severity: "success",
        summary: "Movimiento Generado",
        detail: `Movimiento ${resultado.numeroDocumento} generado exitosamente`,
        life: 5000,
      });

      setShowDialog(false);
      
      // Agregar el movimiento a la lista
      setMovimientos((prev) => [...prev, resultado]);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.error ||
          "No se pudo generar el movimiento de almacén",
      });
    }
    setGenerando(false);
  };

  const fechaTemplate = (rowData) => {
    return rowData.fechaDocumento
      ? new Date(rowData.fechaDocumento).toLocaleDateString()
      : "";
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoDocAlmacen?.nombre || "";
    let severity = "info";

    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "APROBADO") severity = "success";
    if (estado === "ANULADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const tipoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.conceptoMovAlmacen?.tipoMovimiento || ""}
        severity="info"
        icon="pi pi-arrow-down"
      />
    );
  };

  return (
    <div>
      <div className="mb-3">
        <div className="p-3 bg-blue-50 border-round mb-3">
          <div className="flex align-items-center gap-3">
            <i className="pi pi-warehouse text-blue-500 text-3xl"></i>
            <div className="flex-1">
              <p className="m-0 font-bold text-lg">
                Generar Movimiento de Almacén
              </p>
              <p className="m-0 text-sm">
                Desde esta orden aprobada puedes generar un ingreso al almacén
                con todos los productos del detalle
              </p>
            </div>
            <Button
              label="Generar Movimiento"
              icon="pi pi-plus"
              className="p-button-success"
              onClick={handleGenerarMovimiento}
              disabled={movimientos.length > 0}
            />
          </div>
        </div>

        {movimientos.length > 0 && (
          <div className="p-3 bg-green-50 border-round mb-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check-circle text-green-600"></i>
              <span className="font-bold">
                Esta orden ya tiene un movimiento de almacén generado
              </span>
            </div>
          </div>
        )}
      </div>

      <DataTable
        value={movimientos}
        loading={loading}
        emptyMessage="No hay movimientos de almacén generados"
      >
        <Column field="numeroDocumento" header="Nº Documento" />
        <Column
          field="conceptoMovAlmacen.nombre"
          header="Concepto"
        />
        <Column
          field="conceptoMovAlmacen.tipoMovimiento"
          header="Tipo"
          body={tipoTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="fechaDocumento"
          header="Fecha"
          body={fechaTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="estadoDocAlmacenId"
          header="Estado"
          body={estadoTemplate}
          style={{ width: "130px" }}
        />
        <Column field="observaciones" header="Observaciones" />
      </DataTable>

      {/* DIALOG PARA GENERAR MOVIMIENTO */}
      <Dialog
        header="Generar Movimiento de Almacén"
        visible={showDialog}
        style={{ width: "600px" }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <div className="p-fluid">
          <div className="mb-3 p-3 bg-yellow-50 border-round">
            <div className="flex align-items-start gap-2">
              <i className="pi pi-info-circle text-yellow-600 mt-1"></i>
              <div>
                <p className="m-0 font-bold">Información Importante</p>
                <p className="m-0 text-sm mt-2">
                  Se generará un movimiento de almacén tipo <strong>INGRESO</strong> con
                  todos los productos del detalle de esta orden de compra.
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="conceptoMovAlmacenId">Concepto de Movimiento*</label>
            <Dropdown
              id="conceptoMovAlmacenId"
              value={formData.conceptoMovAlmacenId}
              options={conceptos.map((c) => ({
                label: `${c.nombre} (${c.tipoMovimiento})`,
                value: Number(c.id),
              }))}
              onChange={(e) => handleChange("conceptoMovAlmacenId", e.value)}
              placeholder="Seleccionar concepto"
            />
          </div>

          <div className="field">
            <label htmlFor="fechaDocumento">Fecha del Documento*</label>
            <Calendar
              id="fechaDocumento"
              value={formData.fechaDocumento}
              onChange={(e) => handleChange("fechaDocumento", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>

          <div className="field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={3}
              placeholder="Observaciones del movimiento de almacén..."
            />
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={() => setShowDialog(false)}
              disabled={generando}
            />
            <Button
              label="Generar Movimiento"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleConfirmarGeneracion}
              loading={generando}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}