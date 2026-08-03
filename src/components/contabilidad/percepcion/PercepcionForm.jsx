// src/components/contabilidad/percepcion/PercepcionForm.jsx
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
import { createPercepcion, updatePercepcion } from "../../../api/contabilidad/percepcion";
import { getEntidadesComerciales } from "../../../api/entidadComercial";
import { getTiposRetencionPercepcion } from "../../../api/tesoreria/tipoRetencionPercepcion";
import { getTiposDocumento } from "../../../api/tipoDocumento";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

export default function PercepcionForm({ percepcion, onGuardar, onCancelar, toast, empresas, monedas }) {
  const { usuario } = useAuthStore();
  const [formData, setFormData] = useState({
    empresaId: usuario?.empresaId || null,
    tipoDocumentoId: null,
    numeroDocumento: "",
    fechaEmision: new Date(),
    fechaCobro: new Date(),
    proveedorId: null,
    tipoPercepcionId: null,
    tasaPercepcion: 0,
    monedaId: 1,
    importeTotal: 0,
    importePercibido: 0,
    importePagado: 0,
    observaciones: "",
  });

  const [proveedores, setProveedores] = useState([]);
  const [tiposPercepcion, setTiposPercepcion] = useState([]);
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
    importePercibido: 0,
  });
  const [confirmDeleteDetalle, setConfirmDeleteDetalle] = useState({
    visible: false,
    detalle: null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (percepcion) {
      setFormData({
        ...percepcion,
        fechaEmision: new Date(percepcion.fechaEmision),
        fechaCobro: new Date(percepcion.fechaCobro),
      });
      setDetalles(percepcion.detalles || []);
    }
  }, [percepcion]);

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
      setTiposPercepcion(tiposData.filter((t) => t.tipo === "PERCEPCION"));
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
    const percibido = detalles.reduce((sum, d) => sum + Number(d.importePercibido || 0), 0);
    setFormData((prev) => ({
      ...prev,
      importeTotal: total,
      importePercibido: percibido,
      importePagado: total + percibido,
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
          importePercibido: d.importePercibido,
        })),
        creadoPor: usuario?.id,
        actualizadoPor: usuario?.id,
      };

      if (percepcion?.id) {
        await updatePercepcion(percepcion.id, dataToSend);
      } else {
        await createPercepcion(dataToSend);
      }

      onGuardar();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al guardar percepción",
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
      importePercibido: 0,
    });
    setShowDetalleDialog(true);
  };

  const openEditDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setDetalleFormData({
      ...detalle,
      fechaEmision: new Date(detalle.fechaEmision),
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
            <h5>Datos de la Percepción</h5>
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
            <label>Fecha Cobro *</label>
            <Calendar
              value={formData.fechaCobro}
              onChange={(e) => setFormData({ ...formData, fechaCobro: e.value })}
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
            <label>Tipo Percepción *</label>
            <Dropdown
              value={formData.tipoPercepcionId}
              options={tiposPercepcion}
              onChange={(e) => setFormData({ ...formData, tipoPercepcionId: e.value })}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccionar tipo"
              required
            />
          </div>

          <div className="col-12 md:col-3">
            <label>Tasa Percepción (%)</label>
            <InputNumber
              value={formData.tasaPercepcion}
              onValueChange={(e) =>
                setFormData({ ...formData, tasaPercepcion: e.value })
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
                field="importePercibido"
                header="Percibido"
                body={(rowData) => montoBodyTemplate(rowData, "importePercibido")}
              />
              <Column body={accionesDetalleBodyTemplate} header="Acciones" />
            </DataTable>

            <div className="flex justify-content-end mt-3 gap-3">
              <strong>Total: {Number(formData.importeTotal || 0).toFixed(2)}</strong>
              <strong>Percibido: {Number(formData.importePercibido || 0).toFixed(2)}</strong>
              <strong>Pagado: {Number(formData.importePagado || 0).toFixed(2)}</strong>
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

          <div className="col-12">
            <label>Importe Percibido</label>
            <InputNumber
              value={detalleFormData.importePercibido}
              onValueChange={(e) =>
                setDetalleFormData({ ...detalleFormData, importePercibido: e.value })
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