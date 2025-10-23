// src/components/requerimientoCompra/CotizacionesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog } from "primereact/confirmdialog";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import {
  getCotizacionesProveedor,
  crearCotizacionProveedor,
  actualizarCotizacionProveedor,
  eliminarCotizacionProveedor,
  seleccionarCotizacionProveedor,
} from "../../api/cotizacionProveedor";

export default function CotizacionesTab({
  requerimientoId,
  proveedores,
  puedeEditar,
  toast,
  onCountChange,
}) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [formCotizacion, setFormCotizacion] = useState({
    proveedorId: null,
    fechaCotizacion: new Date(),
    montoTotal: 0,
    tiempoEntrega: "",
    observaciones: "",
  });

  useEffect(() => {
    if (requerimientoId) {
      cargarCotizaciones();
    }
  }, [requerimientoId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(cotizaciones.length);
    }
  }, [cotizaciones, onCountChange]);

  const cargarCotizaciones = async () => {
    setLoading(true);
    try {
      const data = await getCotizacionesProveedor(requerimientoId);
      setCotizaciones(data);
    } catch (err) {
      console.error("Error al cargar cotizaciones:", err);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingCotizacion(null);
    setFormCotizacion({
      proveedorId: null,
      fechaCotizacion: new Date(),
      montoTotal: 0,
      tiempoEntrega: "",
      observaciones: "",
    });
    setShowDialog(true);
  };

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion);
    setFormCotizacion({
      proveedorId: cotizacion.proveedorId,
      fechaCotizacion: cotizacion.fechaCotizacion
        ? new Date(cotizacion.fechaCotizacion)
        : new Date(),
      montoTotal: cotizacion.montoTotal || 0,
      tiempoEntrega: cotizacion.tiempoEntrega || "",
      observaciones: cotizacion.observaciones || "",
    });
    setShowDialog(true);
  };

  const handleDelete = (cotizacion) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cotización del proveedor "${cotizacion.proveedor?.razonSocial || 'este proveedor'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await eliminarCotizacionProveedor(cotizacion.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Cotización eliminada correctamente",
          });
          cargarCotizaciones();
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.error || "No se pudo eliminar la cotización",
          });
        }
      },
    });
  };

  const handleSeleccionar = async (cotizacion) => {
    try {
      await seleccionarCotizacionProveedor(cotizacion.id);
      toast.current.show({
        severity: "success",
        summary: "Seleccionada",
        detail: `Cotización de ${cotizacion.proveedor?.razonSocial} seleccionada`,
      });
      cargarCotizaciones();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo seleccionar la cotización",
      });
    }
  };

  const handleChangeCotizacion = (field, value) => {
    setFormCotizacion((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCotizacion = async () => {
    // Validaciones
    if (!formCotizacion.proveedorId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar un proveedor",
      });
      return;
    }

    if (formCotizacion.montoTotal <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "El monto total debe ser mayor a 0",
      });
      return;
    }

    try {
      if (editingCotizacion) {
        await actualizarCotizacionProveedor(editingCotizacion.id, formCotizacion);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Cotización actualizada correctamente",
        });
      } else {
        await crearCotizacionProveedor({
          ...formCotizacion,
          requerimientoCompraId: requerimientoId,
        });
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Cotización creada correctamente",
        });
      }
      setShowDialog(false);
      cargarCotizaciones();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.error || "No se pudo guardar la cotización",
      });
    }
  };

  const montoTemplate = (rowData) => {
    return rowData.montoTotal
      ? `S/ ${Number(rowData.montoTotal).toFixed(2)}`
      : "";
  };

  const fechaTemplate = (rowData) => {
    return rowData.fechaCotizacion
      ? new Date(rowData.fechaCotizacion).toLocaleDateString()
      : "";
  };

  const seleccionadaTemplate = (rowData) => {
    return rowData.esSeleccionada ? (
      <Tag value="SELECCIONADA" severity="success" icon="pi pi-check" />
    ) : null;
  };

  const accionesTemplate = (rowData) => (
    <div className="flex gap-2">
      {!rowData.esSeleccionada && (
        <Button
          icon="pi pi-check"
          className="p-button-text p-button-success p-button-sm"
          onClick={() => handleSeleccionar(rowData)}
          tooltip="Seleccionar"
          disabled={!puedeEditar}
        />
      )}
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
        disabled={!puedeEditar || rowData.esSeleccionada}
      />
    </div>
  );

  return (
    <div>
      <div className="mb-3">
        <Button
          label="Agregar Cotización"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleAdd}
          disabled={!puedeEditar}
        />
      </div>

      <DataTable
        value={cotizaciones}
        loading={loading}
        emptyMessage="No hay cotizaciones agregadas"
      >
        <Column field="proveedor.razonSocial" header="Proveedor" />
        <Column
          field="fechaCotizacion"
          header="Fecha"
          body={fechaTemplate}
          style={{ width: "120px" }}
        />
        <Column
          field="montoTotal"
          header="Monto Total"
          body={montoTemplate}
          style={{ width: "130px" }}
        />
        <Column field="tiempoEntrega" header="Tiempo Entrega" style={{ width: "130px" }} />
        <Column
          field="esSeleccionada"
          header="Estado"
          body={seleccionadaTemplate}
          style={{ width: "150px" }}
        />
        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>

      {/* DIALOG PARA AGREGAR/EDITAR COTIZACIÓN */}
      <Dialog
        header={editingCotizacion ? "Editar Cotización" : "Nueva Cotización"}
        visible={showDialog}
        style={{ width: "600px" }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="proveedorId">Proveedor*</label>
            <Dropdown
              id="proveedorId"
              value={formCotizacion.proveedorId}
              options={proveedores.map((p) => ({
                label: p.razonSocial,
                value: Number(p.id),
              }))}
              onChange={(e) => handleChangeCotizacion("proveedorId", e.value)}
              placeholder="Seleccionar proveedor"
              filter
            />
          </div>

          <div className="field">
            <label htmlFor="fechaCotizacion">Fecha Cotización*</label>
            <Calendar
              id="fechaCotizacion"
              value={formCotizacion.fechaCotizacion}
              onChange={(e) => handleChangeCotizacion("fechaCotizacion", e.value)}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>

          <div className="field">
            <label htmlFor="montoTotal">Monto Total*</label>
            <InputNumber
              id="montoTotal"
              value={formCotizacion.montoTotal}
              onValueChange={(e) => handleChangeCotizacion("montoTotal", e.value)}
              mode="currency"
              currency="PEN"
              locale="es-PE"
              min={0}
            />
          </div>

          <div className="field">
            <label htmlFor="tiempoEntrega">Tiempo de Entrega</label>
            <InputTextarea
              id="tiempoEntrega"
              value={formCotizacion.tiempoEntrega}
              onChange={(e) => handleChangeCotizacion("tiempoEntrega", e.target.value)}
              rows={2}
              placeholder="Ej: 5 días hábiles"
            />
          </div>

          <div className="field">
            <label htmlFor="observaciones">Observaciones</label>
            <InputTextarea
              id="observaciones"
              value={formCotizacion.observaciones}
              onChange={(e) => handleChangeCotizacion("observaciones", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              className="p-button-primary"
              onClick={handleSaveCotizacion}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}