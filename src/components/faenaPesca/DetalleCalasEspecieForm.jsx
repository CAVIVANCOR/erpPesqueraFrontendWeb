/**
 * DetalleCalasEspecieForm.jsx
 * Componente CRUD para gestionar las especies de una cala de pesca.
 * Permite listar, crear, editar y eliminar registros de DetalleCalaEspecie.
 * Migrado a React Hook Form + PDFDocumentManager
 * @author ERP Megui
 * @version 2.0.0
 */
import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import PDFDocumentManager from "../pdf/PDFDocumentManager";
import {
  getResponsiveFontSize,
  createPorcentajeTemplate,
} from "../../utils/utils";
import { getEspecies } from "../../api/especie";
import {
  getDetalleCalaEspeciePorCala,
  crearDetalleCalaEspecie,
  actualizarDetalleCalaEspecie,
  eliminarDetalleCalaEspecie,
} from "../../api/detalleCalaEspecie";
import { recalcularToneladasCala } from "../../api/recalcularToneladas";
import { calcularPorcentajeJuveniles } from "../../utils/calcularPorcentajeJuveniles";

// Schema de validación con Yup
const schema = Yup.object().shape({
  especieId: Yup.number().required("Debe seleccionar una especie"),
  kilogramos: Yup.number()
    .required("Debe ingresar kilogramos")
    .min(0.001, "Debe ser mayor a 0"),
  porcentajeJuveniles: Yup.number()
    .nullable()
    .min(0, "Debe ser mayor o igual a 0")
    .max(100, "Debe ser menor o igual a 100"),
  pesoMuestra: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_9_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_10_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_10_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_11_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_11_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_12_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_12_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_13_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_13_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_14_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_14_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_15_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_15_50: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  talla_16_00: Yup.number().nullable().min(0, "Debe ser mayor o igual a 0"),
  urlDatosCala: Yup.string().nullable(),
  totalEjemplares: Yup.number().nullable(),
  observaciones: Yup.string().nullable(),
});

const DetalleCalasEspecieForm = ({
  calaId,
  faenaPescaId,
  temporadaId,
  calaFinalizada = false,
  camposDeshabilitados = false,
  onDataChange,
  onFaenasChange,
  loading = false,
}) => {
  const [especiesDetalle, setEspeciesDetalle] = useState([]);
  const [especiesDisponibles, setEspeciesDisponibles] = useState([]);
  const [detalleDialog, setDetalleDialog] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const isEdit = !!editingDetalle;

  // Valores por defecto para el formulario
  const getDefaultValues = () => ({
    id: editingDetalle?.id || null,
    especieId: editingDetalle?.especieId || null,
    kilogramos: editingDetalle?.toneladas ? editingDetalle.toneladas * 1000 : 0,
    porcentajeJuveniles: editingDetalle?.porcentajeJuveniles || 0,
    pesoMuestra: editingDetalle?.pesoMuestra || 0,
    talla_9_50: editingDetalle?.talla_9_50 || 0,
    talla_10_00: editingDetalle?.talla_10_00 || 0,
    talla_10_50: editingDetalle?.talla_10_50 || 0,
    talla_11_00: editingDetalle?.talla_11_00 || 0,
    talla_11_50: editingDetalle?.talla_11_50 || 0,
    talla_12_00: editingDetalle?.talla_12_00 || 0,
    talla_12_50: editingDetalle?.talla_12_50 || 0,
    talla_13_00: editingDetalle?.talla_13_00 || 0,
    talla_13_50: editingDetalle?.talla_13_50 || 0,
    talla_14_00: editingDetalle?.talla_14_00 || 0,
    talla_14_50: editingDetalle?.talla_14_50 || 0,
    talla_15_00: editingDetalle?.talla_15_00 || 0,
    talla_15_50: editingDetalle?.talla_15_50 || 0,
    talla_16_00: editingDetalle?.talla_16_00 || 0,
    urlDatosCala: editingDetalle?.urlDatosCala || "",
    totalEjemplares: editingDetalle?.totalEjemplares || 0,
    observaciones: editingDetalle?.observaciones || "",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: getDefaultValues(),
    mode: "onTouched",
  });

  // Watch para cálculo automático
  const watchTallas = watch([
    "talla_9_50",
    "talla_10_00",
    "talla_10_50",
    "talla_11_00",
    "talla_11_50",
    "talla_12_00",
    "talla_12_50",
    "talla_13_00",
    "talla_13_50",
    "talla_14_00",
    "talla_14_50",
    "talla_15_00",
    "talla_15_50",
    "talla_16_00",
  ]);

  // Calcular automáticamente porcentaje de juveniles y total SOLO si hay valores en tallas
  useEffect(() => {
    const tallasData = {
      talla_9_50: watchTallas[0] || 0,
      talla_10_00: watchTallas[1] || 0,
      talla_10_50: watchTallas[2] || 0,
      talla_11_00: watchTallas[3] || 0,
      talla_11_50: watchTallas[4] || 0,
      talla_12_00: watchTallas[5] || 0,
      talla_12_50: watchTallas[6] || 0,
      talla_13_00: watchTallas[7] || 0,
      talla_13_50: watchTallas[8] || 0,
      talla_14_00: watchTallas[9] || 0,
      talla_14_50: watchTallas[10] || 0,
      talla_15_00: watchTallas[11] || 0,
      talla_15_50: watchTallas[12] || 0,
      talla_16_00: watchTallas[13] || 0,
    };

    // ⭐ SOLO recalcular si hay al menos un valor > 0 en las tallas
    const hayValoresEnTallas = Object.values(tallasData).some((val) => val > 0);

    if (hayValoresEnTallas) {
      const { porcentajeJuveniles, totalEjemplares } =
        calcularPorcentajeJuveniles(tallasData);

      setValue("totalEjemplares", totalEjemplares, { shouldValidate: false });
      setValue("porcentajeJuveniles", porcentajeJuveniles, {
        shouldValidate: false,
      });
    }
  }, [watchTallas, setValue]);

  useEffect(() => {
    cargarEspecies();
    if (calaId) {
      cargarEspeciesDetalle();
    }
  }, [calaId]);

  useEffect(() => {
    if (editingDetalle) {
      reset(getDefaultValues());
    }
  }, [editingDetalle]);

  const cargarEspecies = async () => {
    try {
      const response = await getEspecies();
      setEspeciesDisponibles(
        response.map((e) => ({
          label: `${e.nombre} (${e.nombreCientifico})`,
          value: e.id,
        })),
      );
    } catch (error) {
      console.error("Error cargando especies:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las especies",
        life: 3000,
      });
    }
  };

  const cargarEspeciesDetalle = async () => {
    try {
      const response = await getDetalleCalaEspeciePorCala(calaId);
      setEspeciesDetalle(response);
    } catch (error) {
      console.error("Error cargando especies de la cala:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las especies de la cala",
        life: 3000,
      });
    }
  };

  const abrirNuevoDetalle = () => {
    setEditingDetalle(null);
    reset({
      id: null,
      especieId: null,
      kilogramos: 0,
      porcentajeJuveniles: 0,
      pesoMuestra: 0,
      talla_9_50: 0,
      talla_10_00: 0,
      talla_10_50: 0,
      talla_11_00: 0,
      talla_11_50: 0,
      talla_12_00: 0,
      talla_12_50: 0,
      talla_13_00: 0,
      talla_13_50: 0,
      talla_14_00: 0,
      talla_14_50: 0,
      talla_15_00: 0,
      talla_15_50: 0,
      talla_16_00: 0,
      urlDatosCala: "",
      totalEjemplares: 0,
      observaciones: "",
    });
    setDetalleDialog(true);
  };

  const editarDetalle = (detalle) => {
    setEditingDetalle(detalle);
    setDetalleDialog(true);
  };

  const onSubmitForm = async (data) => {
    try {
      if (!calaId) {
        toast.current?.show({
          severity: "error",
          summary: "Error de Validación",
          detail: "No se puede guardar: falta identificador de cala",
          life: 4000,
        });
        return;
      }

      const detalleData = {
        calaId: Number(calaId),
        especieId: Number(data.especieId),
        toneladas: data.kilogramos ? Number(data.kilogramos) / 1000 : null,
        pesoMuestra: data.pesoMuestra ? Number(data.pesoMuestra) : null,
        talla_9_50: Number(data.talla_9_50) || 0,
        talla_10_00: Number(data.talla_10_00) || 0,
        talla_10_50: Number(data.talla_10_50) || 0,
        talla_11_00: Number(data.talla_11_00) || 0,
        talla_11_50: Number(data.talla_11_50) || 0,
        talla_12_00: Number(data.talla_12_00) || 0,
        talla_12_50: Number(data.talla_12_50) || 0,
        talla_13_00: Number(data.talla_13_00) || 0,
        talla_13_50: Number(data.talla_13_50) || 0,
        talla_14_00: Number(data.talla_14_00) || 0,
        talla_14_50: Number(data.talla_14_50) || 0,
        talla_15_00: Number(data.talla_15_00) || 0,
        talla_15_50: Number(data.talla_15_50) || 0,
        talla_16_00: Number(data.talla_16_00) || 0,
        urlDatosCala: data.urlDatosCala?.trim() || null,
        porcentajeJuveniles: data.porcentajeJuveniles,
        totalEjemplares: data.totalEjemplares,
        observaciones: data.observaciones?.trim() || null,
      };

      if (editingDetalle) {
        await actualizarDetalleCalaEspecie(editingDetalle.id, detalleData);
      } else {
        await crearDetalleCalaEspecie(detalleData);
      }

      toast.current?.show({
        severity: "success",
        summary: "Operación Exitosa",
        detail: editingDetalle
          ? "Especie actualizada correctamente"
          : "Especie agregada correctamente",
        life: 3000,
      });

      setDetalleDialog(false);
      cargarEspeciesDetalle();

      if (faenaPescaId) {
        try {
          await recalcularToneladasCala(calaId);
          if (onFaenasChange) {
            onFaenasChange();
          }
        } catch (error) {
          console.error("Error recalculando toneladas:", error);
        }
      }

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.current?.show({
          severity: "warn",
          summary: "Registro Duplicado",
          detail: "Ya existe un registro para esta especie en la cala.",
          life: 5000,
        });
      } else if (error.response?.status === 400) {
        toast.current?.show({
          severity: "error",
          summary: "Datos Inválidos",
          detail:
            error.response?.data?.message ||
            "Los datos ingresados no son válidos.",
          life: 4000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error Inesperado",
          detail:
            error.response?.data?.message || "Ocurrió un error inesperado.",
          life: 4000,
        });
      }
    }
  };

  const eliminarDetalle = async (detalle) => {
    try {
      await eliminarDetalleCalaEspecie(detalle.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Especie eliminada",
        life: 3000,
      });
      cargarEspeciesDetalle();

      if (faenaPescaId) {
        try {
          await recalcularToneladasCala(calaId);
          if (onFaenasChange) {
            onFaenasChange();
          }
        } catch (error) {
          console.error("Error recalculando toneladas:", error);
        }
      }

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error eliminando detalle:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la especie",
        life: 3000,
      });
    }
  };

  const accionesTemplate = (rowData) => {
    return (
      <div>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-text"
          onClick={() => editarDetalle(rowData)}
          tooltip="Editar"
          size="small"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => eliminarDetalle(rowData)}
          tooltip="Eliminar"
          size="small"
          disabled={calaFinalizada}
        />
      </div>
    );
  };

  const porcentajeJuvenilesTemplate = (rowData) => {
    const templateData = createPorcentajeTemplate(rowData.porcentajeJuveniles);

    if (!templateData) return "-";

    return (
      <span style={templateData.estilos}>
        {templateData.valor}
        {templateData.sufijo}
      </span>
    );
  };

  const header = (
    <div className="flex align-items-center gap-2">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          <h2>Especies Capturadas</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Agregar Especie"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevoDetalle}
            disabled={!calaId || calaFinalizada}
            size="small"
            type="button"
            tooltip="Agregar Especie"
            tooltipOptions={{ position: "top" }}
            raised
            severity="success"
          />
        </div>
        <div style={{ flex: 1 }}>
          <span className="p-input-icon-left">
            <InputText
              type="search"
              onInput={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              size="small"
            />
          </span>
        </div>
      </div>
    </div>
  );

  const detalleDialogFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 18,
      }}
    >
      <Button
        label="Cancelar"
        icon="pi pi-times"
        type="button"
        onClick={() => setDetalleDialog(false)}
        className="p-button-warning"
        severity="warning"
        raised
        size="small"
        outlined
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        type="button"
        onClick={handleSubmit(onSubmitForm)}
        className="p-button-success"
        severity="success"
        raised
        size="small"
        outlined
      />
    </div>
  );

  const getFieldClass = (fieldName) => {
    return errors[fieldName] ? "p-invalid" : "";
  };

  const totalEjemplares = watch("totalEjemplares") || 0;
  const porcentajeJuveniles = watch("porcentajeJuveniles") || 0;

  return (
    <Card className="mt-3">
      <Toast ref={toast} />
      <DataTable
        value={especiesDetalle}
        selection={null}
        onSelectionChange={(e) => null}
        dataKey="id"
        stripedRows
        showGridlines
        globalFilter={globalFilter}
        header={header}
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        size="small"
        onRowClick={(e) => editarDetalle(e.data)}
      >
        <Column
          field="especie.nombre"
          header="Especie"
          sortable
          style={{ minWidth: "8rem" }}
          body={(rowData) => rowData.especie?.nombre || "-"}
        ></Column>
        <Column
          field="especie.nombreCientifico"
          header="Nombre Científico"
          sortable
          style={{ minWidth: "10rem" }}
          body={(rowData) => rowData.especie?.nombreCientifico || "-"}
        ></Column>
        <Column
          field="toneladas"
          header="Toneladas"
          sortable
          style={{ minWidth: "6rem" }}
          body={(rowData) =>
            rowData.toneladas ? `${rowData.toneladas} Ton` : "-"
          }
        ></Column>
        <Column
          field="porcentajeJuveniles"
          header="% Juveniles"
          sortable
          style={{ minWidth: "6rem" }}
          body={porcentajeJuvenilesTemplate}
        ></Column>
        <Column
          field="observaciones"
          header="Observaciones"
          style={{ minWidth: "10rem" }}
        ></Column>
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ minWidth: "6rem" }}
        ></Column>
      </DataTable>

      <Dialog
        visible={detalleDialog}
        style={{ width: "95vw", maxWidth: "1400px" }}
        breakpoints={{ "960px": "90vw", "640px": "100vw" }}
        header={
          editingDetalle ? "Editar Captura Especie" : "Agregar Captura Especie"
        }
        modal
        className="p-fluid"
        maximizable
        footer={detalleDialogFooter}
        onHide={() => setDetalleDialog(false)}
      >
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div
            style={{
              display: "flex",
              gap: 20,
              flexDirection: window.innerWidth < 1024 ? "column" : "row",
            }}
          >
            {/* COLUMNA IZQUIERDA - FORMULARIO */}
            <div style={{ flex: "1 1 30%", minWidth: 0 }}>
              <div className="p-fluid">
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label htmlFor="especieId">Especie *</label>
                    <Controller
                      name="especieId"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id="especieId"
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          options={especiesDisponibles}
                          placeholder="Seleccione una especie"
                          className={getFieldClass("especieId")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                    {errors.especieId && (
                      <small className="p-error">
                        {errors.especieId.message}
                      </small>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label htmlFor="kilogramos">Kilogramos *</label>
                    <Controller
                      name="kilogramos"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="kilogramos"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          minFractionDigits={0}
                          maxFractionDigits={3}
                          suffix=" Kg"
                          min={0}
                          className={getFieldClass("kilogramos")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                    {errors.kilogramos && (
                      <small className="p-error">
                        {errors.kilogramos.message}
                      </small>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label htmlFor="porcentajeJuveniles">
                      Porcentaje Juveniles (%)
                    </label>
                    <Controller
                      name="porcentajeJuveniles"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="porcentajeJuveniles"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          suffix="%"
                          min={0}
                          max={100}
                          className={getFieldClass("porcentajeJuveniles")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                    {errors.porcentajeJuveniles && (
                      <small className="p-error">
                        {errors.porcentajeJuveniles.message}
                      </small>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label htmlFor="pesoMuestra">Peso de Muestra (kg)</label>
                    <Controller
                      name="pesoMuestra"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="pesoMuestra"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          minFractionDigits={3}
                          maxFractionDigits={3}
                          placeholder="Ej: 2.800"
                          className={getFieldClass("pesoMuestra")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                    {errors.pesoMuestra && (
                      <small className="p-error">
                        {errors.pesoMuestra.message}
                      </small>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <h4 className="text-lg font-semibold mb-3 text-primary">
                    📊 Estructura de Tallas (cm)
                  </h4>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>9.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_9_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_9_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_9_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>13.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_13_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_13_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_13_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>10.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_10_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_10_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_10_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>13.50</label>
                  </div>

                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_13_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_13_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_13_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>10.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_10_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_10_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_10_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>14.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_14_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_14_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_14_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>11.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_11_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_11_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_11_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>14.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_14_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_14_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_14_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>11.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_11_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_11_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_11_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>15.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_15_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_15_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_15_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>12.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_12_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_12_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_12_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>15.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_15_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_15_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_15_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexDirection: window.innerWidth < 768 ? "column" : "row",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>12.50</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_12_50"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_12_50"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_12_50")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>16.00</label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Controller
                      name="talla_16_00"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          id="talla_16_00"
                          value={field.value}
                          onValueChange={(e) => field.onChange(e.value)}
                          mode="decimal"
                          useGrouping={false}
                          min={0}
                          className={getFieldClass("talla_16_00")}
                          disabled={calaFinalizada || camposDeshabilitados}
                        />
                      )}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <div className="p-3 bg-primary-50 border-round text-center">
                    <p className="m-0 text-lg font-bold text-primary">
                      Total Peces Muestreados: {totalEjemplares}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label htmlFor="observaciones">Observaciones</label>
                  <Controller
                    name="observaciones"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="observaciones"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        rows={3}
                        cols={20}
                        className={getFieldClass("observaciones")}
                        disabled={calaFinalizada || camposDeshabilitados}
                      />
                    )}
                  />
                  {errors.observaciones && (
                    <small className="p-error">
                      {errors.observaciones.message}
                    </small>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA - VISOR PDF */}
            <div style={{ flex: "1 1 70%", minWidth: 0 }}>
              {isEdit && (
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <PDFDocumentManager
                    moduleName="detalle-cala-especie"
                    fieldName="urlDatosCala"
                    entityId={editingDetalle?.id}
                    title="📄 Reporte de Cala (PDF)"
                    dialogTitle="Subir Reporte de Cala"
                    uploadButtonLabel="Capturar/Subir PDF"
                    viewButtonLabel="Abrir"
                    downloadButtonLabel="Descargar"
                    emptyMessage="No hay reporte PDF cargado"
                    emptyDescription='Use el botón "Capturar/Subir PDF" para agregar el reporte de la cala'
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    watch={watch}
                    getValues={getValues}
                    defaultValues={getDefaultValues()}
                    readOnly={calaFinalizada || camposDeshabilitados}
                  />
                </div>
              )}
              {!isEdit && (
                <div
                  className="text-center p-4"
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="pi pi-file-pdf text-gray-400"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-600 mt-3 mb-2">
                    El visor de PDF estará disponible después de guardar
                  </p>
                  <small className="text-500">
                    Primero guarde el registro para poder subir el PDF
                  </small>
                </div>
              )}
            </div>
          </div>
        </form>
      </Dialog>
    </Card>
  );
};

export default DetalleCalasEspecieForm;
