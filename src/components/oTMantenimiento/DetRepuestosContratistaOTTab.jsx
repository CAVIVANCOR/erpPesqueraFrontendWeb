/**
 * DetRepuestosContratistaOTTab.jsx
 *
 * Tab/área de detalle de un presupuesto de contratista.
 * Equivalente a DetallesTab en OrdenCompra:
 *  - carga los ítems del presupuesto,
 *  - muestra un DataTable,
 *  - botón "Agregar Ítem",
 *  - totales,
 *  - diálogo DetRepuestosContratistaOTDialog para alta/edición.
 *
 * Props:
 *  presupuestoId {number|string}  ID del DetContratistasOT
 *  monedaId      {number|string}   Moneda base del presupuesto
 *  empresaId     {number|string}   Empresa de la OT
 *  monedas       {Array}
 *  onChange      {function()}      Callback tras crear/editar/eliminar
 *  readOnly      {boolean}
 *  puedeEditar   {boolean}
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import DetRepuestosContratistaOTTable from "./DetRepuestosContratistaOTTable";
import DetRepuestosContratistaOTDialog from "./DetRepuestosContratistaOTDialog";
import {
  getDetallesPorContratistaOT,
  eliminarDetalleRepuesto,
} from "../../api/detRepuestosContratistaOT";
import { formatearNumero } from "../../utils/utils";

export default function DetRepuestosContratistaOTTab({
  presupuestoId,
  monedaId,
  empresaId,
  monedas = [],
  onChange,
  readOnly = false,
  puedeEditar = true,
}) {
  const toast = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [numeroLineaNuevo, setNumeroLineaNuevo] = useState(1);

  useEffect(() => {
    if (presupuestoId) {
      cargarItems();
    } else {
      setItems([]);
    }
  }, [presupuestoId]);

  const cargarItems = async () => {
    if (!presupuestoId) return;
    setLoading(true);
    try {
      const data = await getDetallesPorContratistaOT(presupuestoId);
      setItems(data);
    } catch (error) {
      console.error("Error al cargar ítems del presupuesto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los ítems del presupuesto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSiguienteLinea = () => {
    if (!items.length) return 1;
    return Math.max(...items.map((i) => i.numeroLinea || 0)) + 1;
  };

  const handleAdd = () => {
    setNumeroLineaNuevo(getSiguienteLinea());
    setEditingItem(null);
    setDialogVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogVisible(true);
  };

  const handleDelete = (item) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el ítem "${item.descripcion || ""}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          await eliminarDetalleRepuesto(item.id);
          toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Ítem eliminado correctamente",
            life: 2000,
          });
          await cargarItems();
          if (onChange) onChange();
        } catch (error) {
          console.error("Error al eliminar ítem:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.mensaje ||
              "No se pudo eliminar el ítem",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSaveSuccess = () => {
    setDialogVisible(false);
    cargarItems();
    if (onChange) onChange();
  };

  const moneda = monedas.find((m) => Number(m.id) === Number(monedaId));
  const totalPresupuesto = items.reduce(
    (suma, i) => suma + Number(i.total || 0),
    0,
  );

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* FILA: BOTÓN AGREGAR + TOTAL */}
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          marginBottom: 10,
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "2px solid #dee2e6",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ opacity: 0 }}>.</label>
          <Button
            label="Agregar Ítem"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleAdd}
            disabled={readOnly || !puedeEditar}
            style={{ width: "100%", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>Total Presupuestado</label>
          <InputNumber
            value={totalPresupuesto}
            mode="currency"
            currency={moneda?.codigoSunat || "PEN"}
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
      </div>

      <DetRepuestosContratistaOTTable
        items={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        readOnly={readOnly}
        puedeEditar={puedeEditar}
        monedaId={monedaId}
        monedas={monedas}
      />

      <DetRepuestosContratistaOTDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        presupuesto={{ id: presupuestoId, monedaId }}
        empresaId={empresaId}
        monedas={monedas}
        detalle={editingItem}
        numeroLineaSugerido={numeroLineaNuevo}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
