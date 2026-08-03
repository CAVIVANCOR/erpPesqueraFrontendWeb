// src/components/contabilidad/detraccion/DetraccionForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { createDetraccion, updateDetraccion } from "../../../api/contabilidad/detraccion";
import { getEntidadesComerciales } from "../../../api/entidadComercial";
import { getTiposDetraccion } from "../../../api/tipoDetraccion";
import { getPreFacturas } from "../../../api/preFactura";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

export default function DetraccionForm({ detraccion, onGuardar, onCancelar, toast, empresas, monedas }) {
  const { usuario } = useAuthStore();
  const [formData, setFormData] = useState({
    empresaId: usuario?.empresaId || null,
    numeroConstancia: "",
    fechaDeposito: new Date(),
    clienteId: null,
    tipoDetraccionId: null,
    tasaDetraccion: 0,
    monedaId: 1,
    importeTotal: 0,
    importeDetraido: 0,
    observaciones: "",
  });

  const [clientes, setClientes] = useState([]);
  const [tiposDetraccion, setTiposDetraccion] = useState([]);
  const [preFacturas, setPreFacturas] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [detalleFormData, setDetalleFormData] = useState({
    preFacturaOrigenId: null,
    importeTotal: 0,
    importeDetraido: 0,
  });
  const [confirmDeleteDetalle, setConfirmDeleteDetalle] = useState({
    visible: false,
    detalle: null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (detraccion) {
      setFormData({
        ...detraccion,
        fechaDeposito: new Date(detraccion.fechaDeposito),
      });
      setDetalles(detraccion.detalles || []);
    }
  }, [detraccion]);

  useEffect(() => {
    calcularTotales();
  }, [detalles]);

  const cargarDatos = async () => {
    try {
      const [clientesData, tiposData, preFacturasData] = await Promise.all([
        getEntidadesComerciales(),
        getTiposDetraccion(),
        getPreFacturas(),
      ]);
      setClientes(clientesData.filter((e) => e.esCliente));
      setTiposDetraccion(tiposData);
      setPreFacturas(preFacturasData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    }
  };

  const calcularTotales = () => {
    const total = detalles.reduce((sum, d) => sum + Number(d.importeTotal || 0), 0);
    const detraido = detalles.reduce((sum, d) => sum + Number(d.importeDetraido || 0), 0);
    setFormData((prev) => ({
      ...prev,
      importeTotal: total,
      importeDetraido: detraido,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        detalles: detalles.map((d) => ({
          preFacturaOrigenId: d.preFacturaOrigenId,
          importeTotal: d.importeTotal,
          importeDetraido: d.importeDetraido,
        })),
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      if (detraccion?.id) {
        await updateDetraccion(detraccion.id, dataToSend);
      } else {
        await createDetraccion(dataToSend);
      }

      onGuardar();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar detracción",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewDetalle = () => {
    setEditingDetalle(null);
    setDetalleFormData({
      preFacturaOrigenId: null,
      importeTotal: 0,
      importeDetraido: 0,
    });
    setShowDetalleDialog(true);
  };

  const openEditDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setDetalleFormData({
      preFacturaOrigenId: detalle.preFacturaOrigenId,
      importeTotal: detalle.importeTotal,
      importeDetraido: detalle.importeDetraido,
    });
    setShowDetalleDialog(true);
  };

  const handleSaveDetalle = () => {
    if (!detalleFormData.preFacturaOrigenId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una factura",
        life: 3000,
      });
      return;
    }

    const preFactura = preFacturas.find((p) => p.id === detalleFormData.preFacturaOrigenId);

    if (editingDetalle) {
      setDetalles((prev) =>
        prev.map((d) =>
          d === editingDetalle
            ? { ...detalleFormData, preFacturaOrigen: preFactura }
            : d
        )
      );
    } else {
      setDetalles((prev) => [...prev, { ...detalleFormData, preFacturaOrigen: preFactura }]);
    }

    setShowDetalleDialog(false);
  };

  const handleDeleteDetalle = (detalle) => {
    setConfirmDeleteDetalle({ visible: true, detalle });
  };

  const confirmarEliminarDetalle = () => {
    setDetalles((prev) => prev.filter((d) => d !== confirmDeleteDetalle.detalle));
    setConfirmDeleteDetalle({ visible: false, detalle: null });
  };

  const montoBodyTemplate = (rowData, field) => {
    return Number(rowData[field] || 0).toFixed(2);
  };

  const accionesDetalleBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => openEditDetalle(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          onClick={() => handleDeleteDetalle(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  return (
    <>
      <ConfirmDialog
        visible={confirmDeleteDetalle.visible}
        onHide={() => setConfirmDeleteDetalle({ visible: false, detalle: null })}
        message="¿Está seguro de eliminar este detalle?"
        header="Confirmar"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminarDetalle}
        reject={() => setConfirmDeleteDetalle({ visible: false, detalle: null })}
        acceptLabel="Sí"
        rejectLabel="No"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid p-fluid">
          <div className="col-12">
            <h5>Datos de la Detracción</h5>
          </div>

          <div className="col-12 md:col-4">
            <label>Empresa *</label>
            <Dropdown
              value={formData.empresaId}
              options={empresas}
              onChange={(e) => setFormData({ ...formData, empresaId: e.value })}
              optionLabel="razonSocial"
              optionValue="id"
              placeholder="Seleccionar empresa"
              required
            />
          </div>

          <div className="col-12 md:col-4">
            <label>N° Constancia *</label>
            <InputText
              value={formData.numeroConstancia}
              onChange={(e) =>
                setFormData({ ...formData, numeroConstancia: e.target.value })
              }
              required
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Fecha Depósito *</label>
            <Calendar
              value={formData.fechaDeposito}
              onChange={(e) => setFormData({ ...formData, fechaDeposito: e.value })}
              showIcon
              dateFormat="dd/mm/yy"
              required
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Cliente *</label>
            <Dropdown
              value={formData.clienteId}
              options={clientes}
              onChange={(e) => setFormData({ ...formData, clienteId: e.value })}
              optionLabel="razonSocial"
              optionValue="id"
              filter
              placeholder="Seleccionar cliente"
              required
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Tipo Detracción</label>
            <Dropdown
              value={formData.tipoDetraccionId}
              options={tiposDetraccion}
              onChange={(e) => setFormData({ ...formData, tipoDetraccionId: e.value })}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar tipo"
              showClear
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Tasa Detracción (%)</label>
            <InputNumber
              value={formData.tasaDetraccion}
              onValueChange={(e) =>
                setFormData({ ...formData, tasaDetraccion: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Moneda *</label>
            <Dropdown
              value={formData.monedaId}
              options={monedas}
              onChange={(e) => setFormData({ ...formData, monedaId: e.value })}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar moneda"
              required
            />
          </div>

          <div className="col-12">
            <label>Observaciones</label>
            <InputTextarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="col-12">
            <hr />
            <div className="flex justify-content-between align-items-center mb-3">
              <h5>Facturas Afectas</h5>
              <Button
                label="Agregar Factura"
                icon="pi pi-plus"
                onClick={openNewDetalle}
                type="button"
              />
            </div>

            <DataTable value={detalles} emptyMessage="No hay facturas agregadas">
              <Column
                field="preFacturaOrigen.numeroDocumento"
                header="N° Factura"
              />
              <Column
                field="preFacturaOrigen.fechaEmision"
                header="Fecha"
                body={(rowData) =>
                  rowData.preFacturaOrigen?.fechaEmision
                    ? new Date(rowData.preFacturaOrigen.fechaEmision).toLocaleDateString("es-PE")
                    : ""
                }
              />
              <Column
                field="importeTotal"
                header="Importe Total"
                body={(rowData) => montoBodyTemplate(rowData, "importeTotal")}
              />
              <Column
                field="importeDetraido"
                header="Importe Detraído"
                body={(rowData) => montoBodyTemplate(rowData, "importeDetraido")}
              />
              <Column body={accionesDetalleBodyTemplate} header="Acciones" />
            </DataTable>

            <div className="flex justify-content-end mt-3 gap-3">
              <strong>Total: {Number(formData.importeTotal || 0).toFixed(2)}</strong>
              <strong>Detraído: {Number(formData.importeDetraido || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={onCancelar}
            type="button"
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            loading={loading}
            type="submit"
          />
        </div>
      </form>

      <Dialog
        visible={showDetalleDialog}
        style={{ width: "50vw" }}
        header={editingDetalle ? "Editar Factura" : "Agregar Factura"}
        modal
        onHide={() => setShowDetalleDialog(false)}
      >
        <div className="grid p-fluid">
          <div className="col-12">
            <label>Factura *</label>
            <Dropdown
              value={detalleFormData.preFacturaOrigenId}
              options={preFacturas}
              onChange={(e) => {
                const preFactura = preFacturas.find((p) => p.id === e.value);
                setDetalleFormData({
                  ...detalleFormData,
                  preFacturaOrigenId: e.value,
                  importeTotal: preFactura?.importeTotal || 0,
                });
              }}
              optionLabel="numeroDocumento"
              optionValue="id"
              filter
              placeholder="Seleccionar factura"
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Importe Total</label>
            <InputNumber
              value={detalleFormData.importeTotal}
              onValueChange={(e) =>
                setDetalleFormData({ ...detalleFormData, importeTotal: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Importe Detraído</label>
            <InputNumber
              value={detalleFormData.importeDetraido}
              onValueChange={(e) =>
                setDetalleFormData({ ...detalleFormData, importeDetraido: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setShowDetalleDialog(false)}
          />
          <Button label="Guardar" icon="pi pi-check" onClick={handleSaveDetalle} />
        </div>
      </Dialog>
    </>
  );
}