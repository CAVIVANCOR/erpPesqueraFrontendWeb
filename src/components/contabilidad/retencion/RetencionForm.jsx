// src/components/contabilidad/retencion/RetencionForm.jsx
import React, { useState, useEffect } from "react";
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
import { createRetencion, updateRetencion } from "../../../api/contabilidad/retencion";
import { getEntidadesComerciales } from "../../../api/entidadComercial";
import { getTiposRetencionPercepcion } from "../../../api/tesoreria/tipoRetencionPercepcion";
import { getTiposDocumento } from "../../../api/tipoDocumento";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

export default function RetencionForm({ retencion, onGuardar, onCancelar, toast, empresas, monedas }) {
  const { usuario } = useAuthStore();
  const [formData, setFormData] = useState({
    empresaId: usuario?.empresaId || null,
    tipoDocumentoId: null,
    numeroDocumento: "",
    fechaEmision: new Date(),
    fechaPago: new Date(),
    proveedorId: null,
    tipoRetencionId: null,
    tasaRetencion: 0,
    monedaId: 1,
    importeTotal: 0,
    importeRetenido: 0,
    importeNeto: 0,
    observaciones: "",
  });

  const [proveedores, setProveedores] = useState([]);
  const [tiposRetencion, setTiposRetencion] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [detalleFormData, setDetalleFormData] = useState({
    tipoDocumentoId: null,
    numeroDocumento: "",
    fechaEmision: new Date(),
    importeTotal: 0,
    importeRetenido: 0,
    importeNeto: 0,
    fechaPago: new Date(),
    numeroPago: "",
  });
  const [confirmDeleteDetalle, setConfirmDeleteDetalle] = useState({
    visible: false,
    detalle: null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (retencion) {
      setFormData({
        ...retencion,
        fechaEmision: new Date(retencion.fechaEmision),
        fechaPago: new Date(retencion.fechaPago),
      });
      setDetalles(retencion.detalles || []);
    }
  }, [retencion]);

  useEffect(() => {
    calcularTotales();
  }, [detalles]);

  const cargarDatos = async () => {
    try {
      const [proveedoresData, tiposData, tiposDocData] = await Promise.all([
        getEntidadesComerciales(),
        getTiposRetencionPercepcion(),
        getTiposDocumento(),
      ]);
      setProveedores(proveedoresData.filter((e) => e.esProveedor));
      setTiposRetencion(tiposData.filter((t) => t.tipo === "RETENCION"));
      setTiposDocumento(tiposDocData);
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
    const retenido = detalles.reduce((sum, d) => sum + Number(d.importeRetenido || 0), 0);
    const neto = detalles.reduce((sum, d) => sum + Number(d.importeNeto || 0), 0);
    setFormData((prev) => ({
      ...prev,
      importeTotal: total,
      importeRetenido: retenido,
      importeNeto: neto,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        detalles: detalles.map((d) => ({
          tipoDocumentoId: d.tipoDocumentoId,
          numeroDocumento: d.numeroDocumento,
          fechaEmision: d.fechaEmision,
          importeTotal: d.importeTotal,
          importeRetenido: d.importeRetenido,
          importeNeto: d.importeNeto,
          fechaPago: d.fechaPago,
          numeroPago: d.numeroPago,
        })),
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      if (retencion?.id) {
        await updateRetencion(retencion.id, dataToSend);
      } else {
        await createRetencion(dataToSend);
      }

      onGuardar();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar retención",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewDetalle = () => {
    setEditingDetalle(null);
    setDetalleFormData({
      tipoDocumentoId: null,
      numeroDocumento: "",
      fechaEmision: new Date(),
      importeTotal: 0,
      importeRetenido: 0,
      importeNeto: 0,
      fechaPago: new Date(),
      numeroPago: "",
    });
    setShowDetalleDialog(true);
  };

  const openEditDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setDetalleFormData({
      ...detalle,
      fechaEmision: new Date(detalle.fechaEmision),
      fechaPago: new Date(detalle.fechaPago),
    });
    setShowDetalleDialog(true);
  };

  const handleSaveDetalle = () => {
    if (!detalleFormData.tipoDocumentoId || !detalleFormData.numeroDocumento) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe completar los campos obligatorios",
        life: 3000,
      });
      return;
    }

    const tipoDoc = tiposDocumento.find((t) => t.id === detalleFormData.tipoDocumentoId);

    if (editingDetalle) {
      setDetalles((prev) =>
        prev.map((d) =>
          d === editingDetalle
            ? { ...detalleFormData, tipoDocumento: tipoDoc }
            : d
        )
      );
    } else {
      setDetalles((prev) => [...prev, { ...detalleFormData, tipoDocumento: tipoDoc }]);
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

  const fechaBodyTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleDateString("es-PE") : "";
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
            <h5>Datos de la Retención</h5>
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
            <label>Tipo Documento *</label>
            <Dropdown
              value={formData.tipoDocumentoId}
              options={tiposDocumento}
              onChange={(e) => setFormData({ ...formData, tipoDocumentoId: e.value })}
              optionLabel="descripcion"
              optionValue="id"
              placeholder="Seleccionar tipo"
              required
            />
          </div>

          <div className="col-12 md:col-4">
            <label>N° Documento</label>
            <InputText
              value={formData.numeroDocumento}
              onChange={(e) =>
                setFormData({ ...formData, numeroDocumento: e.target.value })
              }
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Fecha Emisión *</label>
            <Calendar
              value={formData.fechaEmision}
              onChange={(e) => setFormData({ ...formData, fechaEmision: e.value })}
              showIcon
              dateFormat="dd/mm/yy"
              required
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Fecha Pago *</label>
            <Calendar
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.value })}
              showIcon
              dateFormat="dd/mm/yy"
              required
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Proveedor *</label>
            <Dropdown
              value={formData.proveedorId}
              options={proveedores}
              onChange={(e) => setFormData({ ...formData, proveedorId: e.value })}
              optionLabel="razonSocial"
              optionValue="id"
              filter
              placeholder="Seleccionar proveedor"
              required
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Tipo Retención *</label>
            <Dropdown
              value={formData.tipoRetencionId}
              options={tiposRetencion}
              onChange={(e) => setFormData({ ...formData, tipoRetencionId: e.value })}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar tipo"
              required
            />
          </div>

          <div className="col-12 md:col-3">
            <label>Tasa Retención (%)</label>
            <InputNumber
              value={formData.tasaRetencion}
              onValueChange={(e) =>
                setFormData({ ...formData, tasaRetencion: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>

          <div className="col-12 md:col-3">
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
              <h5>Documentos Afectos</h5>
              <Button
                label="Agregar Documento"
                icon="pi pi-plus"
                onClick={openNewDetalle}
                type="button"
              />
            </div>

            <DataTable value={detalles} emptyMessage="No hay documentos agregados">
              <Column field="tipoDocumento.descripcion" header="Tipo Doc" />
              <Column field="numeroDocumento" header="N° Documento" />
              <Column
                field="fechaEmision"
                header="Fecha"
                body={(rowData) => fechaBodyTemplate(rowData, "fechaEmision")}
              />
              <Column
                field="importeTotal"
                header="Importe Total"
                body={(rowData) => montoBodyTemplate(rowData, "importeTotal")}
              />
              <Column
                field="importeRetenido"
                header="Retenido"
                body={(rowData) => montoBodyTemplate(rowData, "importeRetenido")}
              />
              <Column
                field="importeNeto"
                header="Neto"
                body={(rowData) => montoBodyTemplate(rowData, "importeNeto")}
              />
              <Column body={accionesDetalleBodyTemplate} header="Acciones" />
            </DataTable>

            <div className="flex justify-content-end mt-3 gap-3">
              <strong>Total: {Number(formData.importeTotal || 0).toFixed(2)}</strong>
              <strong>Retenido: {Number(formData.importeRetenido || 0).toFixed(2)}</strong>
              <strong>Neto: {Number(formData.importeNeto || 0).toFixed(2)}</strong>
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
        style={{ width: "60vw" }}
        header={editingDetalle ? "Editar Documento" : "Agregar Documento"}
        modal
        onHide={() => setShowDetalleDialog(false)}
      >
        <div className="grid p-fluid">
          <div className="col-12 md:col-6">
            <label>Tipo Documento *</label>
            <Dropdown
              value={detalleFormData.tipoDocumentoId}
              options={tiposDocumento}
              onChange={(e) =>
                setDetalleFormData({ ...detalleFormData, tipoDocumentoId: e.value })
              }
              optionLabel="descripcion"
              optionValue="id"
              placeholder="Seleccionar tipo"
            />
          </div>

          <div className="col-12 md:col-6">
            <label>N° Documento *</label>
            <InputText
              value={detalleFormData.numeroDocumento}
              onChange={(e) =>
                setDetalleFormData({ ...detalleFormData, numeroDocumento: e.target.value })
              }
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Fecha Emisión *</label>
            <Calendar
              value={detalleFormData.fechaEmision}
              onChange={(e) =>
                setDetalleFormData({ ...detalleFormData, fechaEmision: e.value })
              }
              showIcon
              dateFormat="dd/mm/yy"
            />
          </div>

          <div className="col-12 md:col-6">
            <label>Fecha Pago</label>
            <Calendar
              value={detalleFormData.fechaPago}
              onChange={(e) =>
                setDetalleFormData({ ...detalleFormData, fechaPago: e.value })
              }
              showIcon
              dateFormat="dd/mm/yy"
            />
          </div>

          <div className="col-12 md:col-4">
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

          <div className="col-12 md:col-4">
            <label>Importe Retenido</label>
            <InputNumber
              value={detalleFormData.importeRetenido}
              onValueChange={(e) =>
                setDetalleFormData({ ...detalleFormData, importeRetenido: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>

          <div className="col-12 md:col-4">
            <label>Importe Neto</label>
            <InputNumber
              value={detalleFormData.importeNeto}
              onValueChange={(e) =>
                setDetalleFormData({ ...detalleFormData, importeNeto: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>

          <div className="col-12">
            <label>N° Pago</label>
            <InputText
              value={detalleFormData.numeroPago}
              onChange={(e) =>
                setDetalleFormData({ ...detalleFormData, numeroPago: e.target.value })
              }
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