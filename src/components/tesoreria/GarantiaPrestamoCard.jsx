import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import {
  getGarantiasPorPrestamo,
  createGarantiaPrestamo,
  updateGarantiaPrestamo,
  deleteGarantiaPrestamo,
  liberarGarantia,
  reactivarGarantia,
} from "../../api/tesoreria/garantiaPrestamo";
import { getResponsiveFontSize } from "../../utils/utils";

export default function GarantiaPrestamoCard({
  prestamoBancarioId,
  readOnly = false,
}) {
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const toast = useRef(null);

  const tiposGarantia = [
    { label: "Hipotecaria", value: "HIPOTECARIA" },
    { label: "Prendaria", value: "PRENDARIA" },
    { label: "Fianza", value: "FIANZA" },
    { label: "Sin Garantía", value: "SIN_GARANTIA" },
  ];

  const [formData, setFormData] = useState({
    tipoGarantia: "HIPOTECARIA",
    descripcion: "",
    valorTasacion: 0,
    direccionInmueble: "",
    partidaRegistral: "",
    descripcionBien: "",
    numeroSerie: "",
    nombreFiador: "",
    documentoFiador: "",
    observaciones: "",
  });

  useEffect(() => {
    if (prestamoBancarioId) {
      cargarGarantias();
    }
  }, [prestamoBancarioId]);

  const cargarGarantias = async () => {
    try {
      setLoading(true);
      const data = await getGarantiasPorPrestamo(prestamoBancarioId);
      setGarantias(data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar garantías",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const openNew = () => {
    setFormData({
      tipoGarantia: "HIPOTECARIA",
      descripcion: "",
      valorTasacion: 0,
      direccionInmueble: "",
      partidaRegistral: "",
      descripcionBien: "",
      numeroSerie: "",
      nombreFiador: "",
      documentoFiador: "",
      observaciones: "",
    });
    setSelectedGarantia(null);
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (garantia) => {
    setFormData({
      tipoGarantia: garantia.tipoGarantia,
      descripcion: garantia.descripcion,
      valorTasacion: Number(garantia.valorTasacion),
      direccionInmueble: garantia.direccionInmueble || "",
      partidaRegistral: garantia.partidaRegistral || "",
      descripcionBien: garantia.descripcionBien || "",
      numeroSerie: garantia.numeroSerie || "",
      nombreFiador: garantia.nombreFiador || "",
      documentoFiador: garantia.documentoFiador || "",
      observaciones: garantia.observaciones || "",
    });
    setSelectedGarantia(garantia);
    setIsEdit(true);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedGarantia(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.descripcion || !formData.valorTasacion) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Complete los campos obligatorios",
          life: 3000,
        });
        return;
      }

      setLoading(true);

      const dataToSend = {
        prestamoBancarioId: BigInt(prestamoBancarioId),
        tipoGarantia: formData.tipoGarantia,
        descripcion: formData.descripcion,
        valorTasacion: Number(formData.valorTasacion),
        direccionInmueble: formData.direccionInmueble || null,
        partidaRegistral: formData.partidaRegistral || null,
        descripcionBien: formData.descripcionBien || null,
        numeroSerie: formData.numeroSerie || null,
        nombreFiador: formData.nombreFiador || null,
        documentoFiador: formData.documentoFiador || null,
        observaciones: formData.observaciones || null,
        activo: true,
      };

      if (isEdit && selectedGarantia) {
        await updateGarantiaPrestamo(selectedGarantia.id, dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Garantía actualizada correctamente",
          life: 3000,
        });
      } else {
        await createGarantiaPrestamo(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Garantía creada correctamente",
          life: 3000,
        });
      }

      hideDialog();
      cargarGarantias();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar garantía",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (garantia) => {
    confirmDialog({
      message: `¿Está seguro de eliminar esta garantía?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleDelete(garantia.id),
      acceptLabel: "Sí",
      rejectLabel: "No",
      acceptClassName: "p-button-danger",
    });
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteGarantiaPrestamo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Garantía eliminada correctamente",
        life: 3000,
      });
      cargarGarantias();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar garantía",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmLiberar = (garantia) => {
    confirmDialog({
      message: `¿Está seguro de liberar esta garantía?`,
      header: "Confirmar Liberación",
      icon: "pi pi-info-circle",
      accept: () => handleLiberar(garantia.id),
      acceptLabel: "Sí",
      rejectLabel: "No",
    });
  };

  const handleLiberar = async (id) => {
    try {
      setLoading(true);
      await liberarGarantia(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Garantía liberada correctamente",
        life: 3000,
      });
      cargarGarantias();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al liberar garantía",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivar = async (id) => {
    try {
      setLoading(true);
      await reactivarGarantia(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Garantía reactivada correctamente",
        life: 3000,
      });
      cargarGarantias();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al reactivar garantía",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {!readOnly && (
          <Button
            label="Nueva Garantía"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openNew}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        )}
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar..."
          style={{ fontSize: getResponsiveFontSize() }}
        />
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {!readOnly && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning"
              onClick={() => openEdit(rowData)}
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
              style={{ fontSize: getResponsiveFontSize() }}
            />
            {rowData.activo ? (
              <Button
                icon="pi pi-unlock"
                className="p-button-rounded p-button-info"
                onClick={() => confirmLiberar(rowData)}
                tooltip="Liberar"
                tooltipOptions={{ position: "top" }}
                style={{ fontSize: getResponsiveFontSize() }}
              />
            ) : (
              <Button
                icon="pi pi-lock"
                className="p-button-rounded p-button-success"
                onClick={() => handleReactivar(rowData.id)}
                tooltip="Reactivar"
                tooltipOptions={{ position: "top" }}
                style={{ fontSize: getResponsiveFontSize() }}
              />
            )}
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-danger"
              onClick={() => confirmDelete(rowData)}
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              disabled={rowData.activo}
              style={{ fontSize: getResponsiveFontSize() }}
            />
          </>
        )}
      </div>
    );
  };

  const tipoBodyTemplate = (rowData) => {
    const tipoMap = {
      HIPOTECARIA: "Hipotecaria",
      PRENDARIA: "Prendaria",
      FIANZA: "Fianza",
      SIN_GARANTIA: "Sin Garantía",
    };
    return tipoMap[rowData.tipoGarantia] || rowData.tipoGarantia;
  };

  const valorBodyTemplate = (rowData) => {
    return `S/ ${Number(rowData.valorTasacion).toFixed(2)}`;
  };

  const estadoBodyTemplate = (rowData) => {
    return rowData.activo ? (
      <Tag value="Activa" severity="success" />
    ) : (
      <Tag value="Liberada" severity="warning" />
    );
  };

  const renderCamposEspecificos = () => {
    switch (formData.tipoGarantia) {
      case "HIPOTECARIA":
        return (
          <>
            <div className="field">
              <label htmlFor="direccionInmueble" style={{ fontSize: getResponsiveFontSize() }}>
                Dirección del Inmueble *
              </label>
              <InputText
                id="direccionInmueble"
                value={formData.direccionInmueble}
                onChange={(e) =>
                  setFormData({ ...formData, direccionInmueble: e.target.value })
                }
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div className="field">
              <label htmlFor="partidaRegistral" style={{ fontSize: getResponsiveFontSize() }}>
                Partida Registral *
              </label>
              <InputText
                id="partidaRegistral"
                value={formData.partidaRegistral}
                onChange={(e) =>
                  setFormData({ ...formData, partidaRegistral: e.target.value })
                }
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
          </>
        );
      case "PRENDARIA":
        return (
          <>
            <div className="field">
              <label htmlFor="descripcionBien" style={{ fontSize: getResponsiveFontSize() }}>
                Descripción del Bien *
              </label>
              <InputTextarea
                id="descripcionBien"
                value={formData.descripcionBien}
                onChange={(e) =>
                  setFormData({ ...formData, descripcionBien: e.target.value })
                }
                rows={3}
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div className="field">
              <label htmlFor="numeroSerie" style={{ fontSize: getResponsiveFontSize() }}>
                Número de Serie
              </label>
              <InputText
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) =>
                  setFormData({ ...formData, numeroSerie: e.target.value })
                }
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
          </>
        );
      case "FIANZA":
        return (
          <>
            <div className="field">
              <label htmlFor="nombreFiador" style={{ fontSize: getResponsiveFontSize() }}>
                Nombre del Fiador *
              </label>
              <InputText
                id="nombreFiador"
                value={formData.nombreFiador}
                onChange={(e) =>
                  setFormData({ ...formData, nombreFiador: e.target.value })
                }
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
            <div className="field">
              <label htmlFor="documentoFiador" style={{ fontSize: getResponsiveFontSize() }}>
                Documento del Fiador *
              </label>
              <InputText
                id="documentoFiador"
                value={formData.documentoFiador}
                onChange={(e) =>
                  setFormData({ ...formData, documentoFiador: e.target.value })
                }
                style={{ fontSize: getResponsiveFontSize() }}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
        style={{ fontSize: getResponsiveFontSize() }}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h3 style={{ fontSize: getResponsiveFontSize() }}>Garantías del Préstamo</h3>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={garantias}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        dataKey="id"
        filters={filters}
        globalFilterFields={["descripcion", "observaciones"]}
        emptyMessage="No se encontraron garantías"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="tipoGarantia"
          header="Tipo"
          body={tipoBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "15rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="valorTasacion"
          header="Valor"
          body={valorBodyTemplate}
          sortable
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          field="activo"
          header="Estado"
          body={estadoBodyTemplate}
          sortable
          style={{ minWidth: "8rem", fontSize: getResponsiveFontSize() }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "10rem", fontSize: getResponsiveFontSize() }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header={isEdit ? "Editar Garantía" : "Nueva Garantía"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="tipoGarantia" style={{ fontSize: getResponsiveFontSize() }}>
            Tipo de Garantía *
          </label>
          <Dropdown
            id="tipoGarantia"
            value={formData.tipoGarantia}
            options={tiposGarantia}
            onChange={(e) => setFormData({ ...formData, tipoGarantia: e.value })}
            placeholder="Seleccione tipo"
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="descripcion" style={{ fontSize: getResponsiveFontSize() }}>
            Descripción *
          </label>
          <InputTextarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            rows={3}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        <div className="field">
          <label htmlFor="valorTasacion" style={{ fontSize: getResponsiveFontSize() }}>
            Valor de Tasación *
          </label>
          <InputNumber
            id="valorTasacion"
            value={formData.valorTasacion}
            onValueChange={(e) =>
              setFormData({ ...formData, valorTasacion: e.value })
            }
            mode="currency"
            currency="PEN"
            locale="es-PE"
            minFractionDigits={2}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>

        {renderCamposEspecificos()}

        <div className="field">
          <label htmlFor="observaciones" style={{ fontSize: getResponsiveFontSize() }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
            rows={2}
            style={{ fontSize: getResponsiveFontSize() }}
          />
        </div>
      </Dialog>
    </div>
  );
}
