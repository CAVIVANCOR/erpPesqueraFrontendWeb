// src/components/faenaPescaConsumo/DetalleDocEmbarcacionConsumoCard.jsx
// Card para gestionar documentos de embarcación de FaenaPescaConsumo
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Controller, useForm } from "react-hook-form";
import {
  getDetDocEmbarcacionPescaConsumo,
  crearDetDocEmbarcacionPescaConsumo,
  actualizarDetDocEmbarcacionPescaConsumo,
  eliminarDetDocEmbarcacionPescaConsumo,
} from "../../api/detDocEmbarcacionPescaConsumo";

export default function DetalleDocEmbarcacionConsumoCard({
  faenaPescaConsumoId,
  documentacionEmbarcacion = [],
  onDataChange,
}) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);
  const [filtroVencimiento, setFiltroVencimiento] = useState(null);
  const toast = useRef(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarDocumentos();
    }
  }, [faenaPescaConsumoId]);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const data = await getDetDocEmbarcacionPescaConsumo();
      const docsFaena = data.filter(
        (d) => Number(d.faenaPescaConsumoId) === Number(faenaPescaConsumoId)
      );
      setDocumentos(docsFaena);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar documentos de embarcación",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setEditingDocumento(null);
    reset({
      documentoPescaId: null,
      numeroDocumento: "",
      fechaEmision: null,
      fechaVencimiento: null,
      urlDocEmbarcacion: "",
      verificado: false,
      observaciones: "",
    });
    setDialogVisible(true);
  };

  const handleEditar = (documento) => {
    setEditingDocumento(documento);
    reset({
      documentoPescaId: documento.documentoPescaId
        ? Number(documento.documentoPescaId)
        : null,
      numeroDocumento: documento.numeroDocumento || "",
      fechaEmision: documento.fechaEmision
        ? new Date(documento.fechaEmision)
        : null,
      fechaVencimiento: documento.fechaVencimiento
        ? new Date(documento.fechaVencimiento)
        : null,
      urlDocEmbarcacion: documento.urlDocEmbarcacion || "",
      verificado: documento.verificado || false,
      observaciones: documento.observaciones || "",
    });
    setDialogVisible(true);
  };

  const handleEliminar = (documento) => {
    confirmDialog({
      message: "¿Está seguro de eliminar este documento?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarDetDocEmbarcacionPescaConsumo(documento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Documento eliminado correctamente",
            life: 3000,
          });
          cargarDocumentos();
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar documento:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar el documento",
            life: 3000,
          });
        }
      },
    });
  };

  const onSubmit = async (data) => {
    try {
      const fechaActual = new Date();
      const docVencido = data.fechaVencimiento
        ? new Date(data.fechaVencimiento) < fechaActual
        : true;

      const payload = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        documentoPescaId: data.documentoPescaId
          ? Number(data.documentoPescaId)
          : null,
        numeroDocumento: data.numeroDocumento?.trim() || null,
        fechaEmision: data.fechaEmision
          ? new Date(data.fechaEmision).toISOString()
          : null,
        fechaVencimiento: data.fechaVencimiento
          ? new Date(data.fechaVencimiento).toISOString()
          : null,
        urlDocEmbarcacion: data.urlDocEmbarcacion?.trim() || null,
        verificado: data.verificado || false,
        observaciones: data.observaciones?.trim() || null,
        docVencido: docVencido,
      };

      if (editingDocumento) {
        await actualizarDetDocEmbarcacionPescaConsumo(
          editingDocumento.id,
          payload
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetDocEmbarcacionPescaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento creado correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      cargarDocumentos();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar documento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el documento",
        life: 3000,
      });
    }
  };

  // Filtros
  const alternarFiltroVencimiento = () => {
    if (filtroVencimiento === null) {
      setFiltroVencimiento(true); // Vencidos
    } else if (filtroVencimiento === true) {
      setFiltroVencimiento(false); // Vigentes
    } else {
      setFiltroVencimiento(null); // Todos
    }
  };

  const obtenerDocumentosFiltrados = () => {
    if (filtroVencimiento === null) return documentos;

    const fechaActual = new Date();
    return documentos.filter((doc) => {
      const estaVencido = doc.fechaVencimiento
        ? new Date(doc.fechaVencimiento) < fechaActual
        : true;
      return filtroVencimiento ? estaVencido : !estaVencido;
    });
  };

  // Templates
  const documentoTemplate = (rowData) => {
    const documento = documentacionEmbarcacion.find(
      (d) => Number(d.id) === Number(rowData.documentoPescaId)
    );
    return documento ? documento.nombre : "N/A";
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field.field]
      ? new Date(rowData[field.field]).toLocaleDateString("es-PE")
      : "-";
  };

  const vencimientoTemplate = (rowData) => {
    const fechaActual = new Date();
    const estaVencido = rowData.fechaVencimiento
      ? new Date(rowData.fechaVencimiento) < fechaActual
      : true;

    return (
      <Tag
        value={estaVencido ? "VENCIDO" : "VIGENTE"}
        severity={estaVencido ? "danger" : "success"}
      />
    );
  };

  const verificadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.verificado ? "SÍ" : "NO"}
        severity={rowData.verificado ? "success" : "warning"}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditar(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminar(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  if (!faenaPescaConsumoId) {
    return (
      <Card title="Documentos de Embarcación">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar documentos de embarcación
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Documentos de Embarcación"
        subTitle="Gestión de documentos de la embarcación para la faena"
      >
        <div className="flex justify-content-between mb-3">
          <Button
            label={
              filtroVencimiento === null
                ? "Todos"
                : filtroVencimiento
                ? "Vencidos"
                : "Vigentes"
            }
            icon="pi pi-filter"
            onClick={alternarFiltroVencimiento}
            severity={
              filtroVencimiento === null
                ? "info"
                : filtroVencimiento
                ? "danger"
                : "success"
            }
            size="small"
          />
          <Button
            label="Nuevo Documento"
            icon="pi pi-plus"
            onClick={handleNuevo}
            severity="success"
            size="small"
          />
        </div>

        <DataTable
          value={obtenerDocumentosFiltrados()}
          loading={loading}
          emptyMessage="No hay documentos registrados"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
        >
          <Column field="id" header="ID" sortable style={{ width: "80px" }} />
          <Column
            field="documentoPescaId"
            header="Tipo Documento"
            body={documentoTemplate}
            sortable
          />
          <Column field="numeroDocumento" header="Número" sortable />
          <Column
            field="fechaEmision"
            header="F. Emisión"
            body={(rowData) => fechaTemplate(rowData, { field: "fechaEmision" })}
            sortable
          />
          <Column
            field="fechaVencimiento"
            header="F. Vencimiento"
            body={(rowData) =>
              fechaTemplate(rowData, { field: "fechaVencimiento" })
            }
            sortable
          />
          <Column
            header="Vencimiento"
            body={vencimientoTemplate}
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="verificado"
            header="Verificado"
            body={verificadoTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "120px" }}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={
          editingDocumento
            ? "Editar Documento de Embarcación"
            : "Nuevo Documento de Embarcación"
        }
        style={{ width: "800px" }}
        modal
        className="p-fluid"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid">
            {/* Tipo de Documento */}
            <div className="col-12">
              <label htmlFor="documentoPescaId" className="block font-medium mb-2">
                Tipo de Documento *
              </label>
              <Controller
                name="documentoPescaId"
                control={control}
                rules={{ required: "El tipo de documento es obligatorio" }}
                render={({ field }) => (
                  <Dropdown
                    id="documentoPescaId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={documentacionEmbarcacion}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione tipo de documento"
                    filter
                    className={errors.documentoPescaId ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.documentoPescaId && (
                <small className="p-error">
                  {errors.documentoPescaId.message}
                </small>
              )}
            </div>

            {/* Número de Documento */}
            <div className="col-12">
              <label htmlFor="numeroDocumento" className="block font-medium mb-2">
                Número de Documento
              </label>
              <Controller
                name="numeroDocumento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroDocumento"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Número del documento"
                  />
                )}
              />
            </div>

            {/* Fecha Emisión */}
            <div className="col-12 md:col-6">
              <label htmlFor="fechaEmision" className="block font-medium mb-2">
                Fecha de Emisión
              </label>
              <Controller
                name="fechaEmision"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEmision"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Seleccione fecha"
                  />
                )}
              />
            </div>

            {/* Fecha Vencimiento */}
            <div className="col-12 md:col-6">
              <label htmlFor="fechaVencimiento" className="block font-medium mb-2">
                Fecha de Vencimiento
              </label>
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaVencimiento"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Seleccione fecha"
                  />
                )}
              />
            </div>

            {/* URL Documento */}
            <div className="col-12">
              <label
                htmlFor="urlDocEmbarcacion"
                className="block font-medium mb-2"
              >
                URL Documento
              </label>
              <Controller
                name="urlDocEmbarcacion"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="urlDocEmbarcacion"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="https://..."
                  />
                )}
              />
            </div>

            {/* Verificado */}
            <div className="col-12">
              <Controller
                name="verificado"
                control={control}
                render={({ field }) => (
                  <div className="flex align-items-center">
                    <Checkbox
                      inputId="verificado"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                    />
                    <label htmlFor="verificado" className="ml-2">
                      Documento Verificado
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Observaciones */}
            <div className="col-12">
              <label htmlFor="observaciones" className="block font-medium mb-2">
                Observaciones
              </label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={3}
                    placeholder="Observaciones..."
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              type="submit"
              label="Guardar"
              icon="pi pi-check"
              severity="success"
            />
          </div>
        </form>
      </Dialog>

      <Toast ref={toast} />
    </>
  );
}