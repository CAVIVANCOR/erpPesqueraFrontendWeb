// src/components/contratoServicio/DetServicioContratoCard.jsx
/**
 * Card de Detalles de Servicios para Contrato de Servicio
 * Patrón profesional ERP Megui
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import DetServicioContratoForm from "./DetServicioContratoForm";
import { formatearNumero } from "../../utils/utils";
import {
  getDetallesPorContrato,
  crearDetServicioContrato,
  actualizarDetServicioContrato,
  eliminarDetServicioContrato,
} from "../../api/detServicioContrato";

export default function DetServicioContratoCard({
  contratoId,
  detalles = [],
  setDetalles,
  productos = [],
  moneda,
  toast,
  isEdit = false,
  empresaId = null,
  empresaEntidadComercialId = null,
  clienteId = null,
  fechaCelebracion = null,
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar detalles cuando cambie el contratoId
  useEffect(() => {
    if (contratoId && isEdit) {
      cargarDetalles();
    }
  }, [contratoId, isEdit]);

  const cargarDetalles = async () => {
    if (!contratoId) return;

    setLoading(true);
    try {
      const data = await getDetallesPorContrato(contratoId);
      setDetalles(data);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los detalles del contrato",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
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
      message: `¿Está seguro de eliminar el servicio "${detalle.productoServicio?.descripcionArmada || 'este servicio'}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        if (!detalle.id) {
          // Detalle no guardado, solo remover del estado
          const nuevosDetalles = detalles.filter((d) => d !== detalle);
          setDetalles(nuevosDetalles);
          toast?.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Servicio eliminado correctamente",
          });
          return;
        }

        // Detalle guardado, eliminar del backend
        setLoading(true);
        try {
          await eliminarDetServicioContrato(detalle.id);
          await cargarDetalles(); // Recargar lista
          toast?.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Servicio eliminado correctamente",
            life: 3000,
          });
        } catch (error) {
          console.error("Error al eliminar detalle:", error);
          toast?.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo eliminar el servicio",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSave = async (detalleData) => {
    if (!contratoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe guardar el contrato antes de agregar servicios",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para backend
      const dataToSave = {
        contratoServicioId: Number(contratoId),
        productoServicioId: Number(detalleData.productoId),
        cantidad: Number(detalleData.cantidad),
        valorVentaUnitario: Number(detalleData.valorVentaUnitario),
        incluyeLuz: Boolean(detalleData.incluyeLuz),
      };

      if (editingDetalle && editingDetalle.id) {
        // Actualizar detalle existente
        await actualizarDetServicioContrato(editingDetalle.id, dataToSave);
        toast?.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Servicio actualizado correctamente",
          life: 3000,
        });
      } else {
        // Crear nuevo detalle
        await crearDetServicioContrato(dataToSave);
        toast?.current?.show({
          severity: "success",
          summary: "Agregado",
          detail: "Servicio agregado correctamente",
          life: 3000,
        });
      }

      // Recargar detalles desde backend
      await cargarDetalles();
      setShowDialog(false);
      setEditingDetalle(null);
    } catch (error) {
      console.error("Error al guardar detalle:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "No se pudo guardar el servicio",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper para obtener símbolo de moneda
  const getSimboloMoneda = () => {
    return moneda?.codigoSunat === "USD" ? "$" : "S/";
  };

  // Templates de columnas
  const productoTemplate = (rowData) => {
    return rowData.productoServicio?.descripcionArmada || "";
  };

  const cantidadTemplate = (rowData) => {
    return formatearNumero(rowData.cantidad || 0, 2);
  };

  const precioTemplate = (rowData) => {
    return `${getSimboloMoneda()} ${formatearNumero(rowData.valorVentaUnitario || 0, 2)}`;
  };

  const totalTemplate = (rowData) => {
    const total = (rowData.cantidad || 0) * (rowData.valorVentaUnitario || 0);
    return `${getSimboloMoneda()} ${formatearNumero(total, 2)}`;
  };

  const luzTemplate = (rowData) => {
    return rowData.incluyeLuz ? "Sí" : "No";
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Calcular totales
  const calcularTotales = () => {
    const total = detalles.reduce((sum, detalle) => {
      return sum + ((detalle.cantidad || 0) * (detalle.valorVentaUnitario || 0));
    }, 0);

    return { total };
  };

  const totales = calcularTotales();

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0 }}>
          Servicios del Contrato
          <Badge value={detalles.length} severity="info" style={{ marginLeft: "0.5rem" }} />
        </h3>
        <Button
          label="Agregar Servicio"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleAdd}
        />
      </div>

      <DataTable
        value={detalles}
        loading={loading}
        emptyMessage="No hay servicios agregados"
        style={{ fontSize: "12px" }}
        stripedRows
      >
        <Column 
          field="productoServicio.descripcionArmada" 
          header="Servicio" 
          body={productoTemplate} 
        />
        <Column 
          field="cantidad" 
          header="Cantidad" 
          body={cantidadTemplate} 
          style={{ width: "120px", textAlign: "right" }}
        />
        <Column 
          field="valorVentaUnitario" 
          header="Valor Venta Unit." 
          body={precioTemplate} 
          style={{ width: "150px", textAlign: "right" }}
        />
        <Column 
          header="Total" 
          body={totalTemplate} 
          style={{ width: "150px", textAlign: "right" }}
        />
        <Column 
          header="Incluye Luz" 
          body={luzTemplate} 
          style={{ width: "120px", textAlign: "center" }}
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
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <strong>Total Contrato:</strong>
          <div style={{ fontSize: "1.5rem", color: "#28a745", fontWeight: "bold" }}>
            {getSimboloMoneda()} {formatearNumero(totales.total, 2)}
          </div>
        </div>
      </div>

      {/* Dialog del formulario */}
      {showDialog && (
        <DetServicioContratoForm
          visible={showDialog}
          onHide={() => {
            setShowDialog(false);
            setEditingDetalle(null);
          }}
          detalle={editingDetalle}
          onSave={handleSave}
          productos={productos}
          moneda={moneda}
          empresaId={empresaId}
          empresaEntidadComercialId={empresaEntidadComercialId}
          clienteId={clienteId}
          fechaDocumento={fechaCelebracion}
        />
      )}
    </div>
  );
}