// src/components/requerimientoCompra/EntregasARendirComprasCard.jsx
// Card para gestionar entregas a rendir asociadas a un requerimiento de compra
import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge";
import DetEntregaRendirCompras from "./DetEntregaRendirCompras";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  getEntregasARendirPCompras,
  crearEntregaARendirPCompras,
  actualizarEntregaARendirPCompras,
  eliminarEntregaARendirPCompras,
} from "../../api/entregaARendirPCompras";
import { getDetMovsEntregaRendirPCompras } from "../../api/detMovsEntregaRendirPCompras";

export default function EntregasARendirComprasCard({
  requerimientoCompra,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  entidadesComerciales = [],
  monedas = [],
  tiposDocumento = [],
  puedeEditar = true,
  onCountChange,
}) {
  const [entregas, setEntregas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [editingEntrega, setEditingEntrega] = useState(null);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [formData, setFormData] = useState({
    respEntregaRendirId: null,
    centroCostoId: null,
  });

  const toast = useRef(null);

  useEffect(() => {
    if (requerimientoCompra?.id) {
      cargarEntregas();
    }
  }, [requerimientoCompra]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(entregas.length);
    }
  }, [entregas, onCountChange]);

  const cargarEntregas = async () => {
    setLoading(true);
    try {
      const data = await getEntregasARendirPCompras();
      const entregasFiltradas = data.filter(
        (e) => Number(e.requerimientoCompraId) === Number(requerimientoCompra.id)
      );
      setEntregas(entregasFiltradas);
    } catch (error) {
      console.error("Error al cargar entregas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las entregas a rendir",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientos = async (entregaId) => {
    try {
      const data = await getDetMovsEntregaRendirPCompras();
      const movsFiltrados = data.filter(
        (m) => Number(m.entregaARendirPComprasId) === Number(entregaId)
      );
      setMovimientos(movsFiltrados);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los movimientos",
        life: 3000,
      });
    }
  };

  const handleNuevaEntrega = () => {
    setEditingEntrega(null);
    setFormData({
      respEntregaRendirId: null,
      centroCostoId: requerimientoCompra.centroCostoId || null,
    });
    setShowDialog(true);
  };

  const handleEditarEntrega = (entrega) => {
    setEditingEntrega(entrega);
    setFormData({
      respEntregaRendirId: entrega.respEntregaRendirId,
      centroCostoId: entrega.centroCostoId,
    });
    setShowDialog(true);
  };

  const handleGuardarEntrega = async () => {
    if (!formData.respEntregaRendirId || !formData.centroCostoId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Complete todos los campos requeridos",
        life: 3000,
      });
      return;
    }

    try {
      const dataToSave = {
        requerimientoCompraId: Number(requerimientoCompra.id),
        respEntregaRendirId: Number(formData.respEntregaRendirId),
        centroCostoId: Number(formData.centroCostoId),
        entregaLiquidada: false,
      };

      if (editingEntrega) {
        await actualizarEntregaARendirPCompras(editingEntrega.id, dataToSave);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearEntregaARendirPCompras(dataToSave);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega creada correctamente",
          life: 3000,
        });
      }

      setShowDialog(false);
      cargarEntregas();
    } catch (error) {
      console.error("Error al guardar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "Error al guardar la entrega",
        life: 3000,
      });
    }
  };

  const handleEliminarEntrega = (entrega) => {
    confirmDialog({
      message: "¿Está seguro de eliminar esta entrega a rendir?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarEntregaARendirPCompras(entrega.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Entrega eliminada correctamente",
            life: 3000,
          });
          cargarEntregas();
        } catch (error) {
          console.error("Error al eliminar entrega:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.mensaje || "Error al eliminar la entrega",
            life: 3000,
          });
        }
      },
    });
  };

  const handleVerDetalle = async (entrega) => {
    setSelectedEntrega(entrega);
    await cargarMovimientos(entrega.id);
    setShowDetalle(true);
  };

  // Templates
  const responsableTemplate = (rowData) => {
    const resp = personal.find((p) => Number(p.id) === Number(rowData.respEntregaRendirId));
    return resp?.nombreCompleto || `${resp?.nombres || ""} ${resp?.apellidos || ""}` || "N/A";
  };

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find((c) => Number(c.id) === Number(rowData.centroCostoId));
    return centro ? `${centro.Codigo} - ${centro.Nombre}` : "N/A";
  };

  const estadoTemplate = (rowData) => {
    return (
      <Badge
        value={rowData.entregaLiquidada ? "LIQUIDADA" : "ACTIVA"}
        severity={rowData.entregaLiquidada ? "success" : "warning"}
      />
    );
  };

  const fechaLiquidacionTemplate = (rowData) => {
    return rowData.fechaLiquidacion
      ? new Date(rowData.fechaLiquidacion).toLocaleDateString("es-PE")
      : "N/A";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm"
          onClick={() => handleVerDetalle(rowData)}
          tooltip="Ver Detalle"
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditarEntrega(rowData)}
          disabled={!puedeEditar || rowData.entregaLiquidada}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminarEntrega(rowData)}
          disabled={!puedeEditar || rowData.entregaLiquidada}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <>
      <Card
        title={
          <div className="flex justify-content-between align-items-center">
            <span>Entregas a Rendir</span>
            <Button
              label="Nueva Entrega"
              icon="pi pi-plus"
              className="p-button-success p-button-sm"
              onClick={handleNuevaEntrega}
              disabled={!puedeEditar || !requerimientoCompra?.id}
            />
          </div>
        }
        className="mt-3"
      >
        {!requerimientoCompra?.id ? (
          <Message
            severity="info"
            text="Guarde el requerimiento primero para poder crear entregas a rendir"
          />
        ) : (
          <DataTable
            value={entregas}
            loading={loading}
            emptyMessage="No hay entregas a rendir registradas"
            className="p-datatable-sm"
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column field="id" header="ID" style={{ width: "80px" }} />
            <Column
              field="respEntregaRendirId"
              header="Responsable"
              body={responsableTemplate}
            />
            <Column
              field="centroCostoId"
              header="Centro de Costo"
              body={centroCostoTemplate}
            />
            <Column
              field="entregaLiquidada"
              header="Estado"
              body={estadoTemplate}
              style={{ width: "120px" }}
            />
            <Column
              field="fechaLiquidacion"
              header="Fecha Liquidación"
              body={fechaLiquidacionTemplate}
            />
            <Column
              header="Acciones"
              body={accionesTemplate}
              style={{ width: "150px", textAlign: "center" }}
            />
          </DataTable>
        )}
      </Card>

      {/* Dialog para crear/editar entrega */}
      <Dialog
        visible={showDialog}
        style={{ width: "500px" }}
        header={editingEntrega ? "Editar Entrega a Rendir" : "Nueva Entrega a Rendir"}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field">
          <label htmlFor="responsable">Responsable *</label>
          <Dropdown
            id="responsable"
            value={formData.respEntregaRendirId}
            options={personal}
            optionLabel={(option) =>
              option.nombreCompleto || `${option.nombres} ${option.apellidos}`
            }
            optionValue="id"
            placeholder="Seleccione un responsable"
            onChange={(e) =>
              setFormData({ ...formData, respEntregaRendirId: e.value })
            }
            filter
            showClear
          />
        </div>

        <div className="field">
          <label htmlFor="centroCosto">Centro de Costo *</label>
          <Dropdown
            id="centroCosto"
            value={formData.centroCostoId}
            options={centrosCosto}
            optionLabel={(option) => `${option.Codigo} - ${option.Nombre}`}
            optionValue="id"
            placeholder="Seleccione un centro de costo"
            onChange={(e) => setFormData({ ...formData, centroCostoId: e.value })}
            filter
            showClear
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setShowDialog(false)}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleGuardarEntrega}
          />
        </div>
      </Dialog>

      {/* Dialog para ver detalle de movimientos */}
      <Dialog
        visible={showDetalle}
        style={{ width: "95vw", maxWidth: "1400px" }}
        header="Detalle de Movimientos - Entrega a Rendir"
        modal
        maximizable
        onHide={() => setShowDetalle(false)}
      >
        {selectedEntrega && (
          <DetEntregaRendirCompras
            entregaARendir={selectedEntrega}
            movimientos={movimientos}
            personal={personal}
            centrosCosto={centrosCosto}
            tiposMovimiento={tiposMovimiento}
            entidadesComerciales={entidadesComerciales}
            monedas={monedas}
            tiposDocumento={tiposDocumento}
            requerimientoCompraAprobado={true}
            onDataChange={() => cargarMovimientos(selectedEntrega.id)}
          />
        )}
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}