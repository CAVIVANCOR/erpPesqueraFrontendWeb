/**
 * DetalleDiasSinFaenaCard.jsx
 *
 * Card para mostrar y gestionar los días sin faena de una temporada de pesca.
 * Incluye funcionalidad CRUD completa para DetalleDiaSinFaena.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { classNames } from "primereact/utils";

// APIs
import {
  getDetallesPorTemporada,
  crearDetalleDiaSinFaena,
  actualizarDetalleDiaSinFaena,
  eliminarDetalleDiaSinFaena,
} from "../../api/detalleDiaSinFaena";
import { getMotivosSinFaenaActivos } from "../../api/motivoSinFaena";
import { getResponsiveFontSize } from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  fecha: yup.date().required("La fecha es obligatoria"),
  motivoSinFaenaId: yup.number().required("El motivo es obligatorio"),
  observaciones: yup.string().max(500, "Máximo 500 caracteres").nullable(),
});

/**
 * Componente DetalleDiasSinFaenaCard
 * @param {Object} props - Props del componente
 * @param {number} props.temporadaPescaId - ID de la temporada de pesca
 */
const DetalleDiasSinFaenaCard = ({ temporadaPescaId }) => {
  // Estados principales
  const [detalles, setDetalles] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingDetalle, setEditingDetalle] = useState(null);
  const toast = useRef(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [detalleToDelete, setDetalleToDelete] = useState(null);
  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fecha: null,
      motivoSinFaenaId: null,
      observaciones: "",
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (temporadaPescaId) {
      cargarDetalles();
      cargarMotivos();
    }
  }, [temporadaPescaId]);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await getDetallesPorTemporada(temporadaPescaId);
      setDetalles(data);
    } catch (error) {
      console.error("Error al cargar días sin faena:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar días sin faena",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarMotivos = async () => {
    try {
      const data = await getMotivosSinFaenaActivos();
      setMotivos(
        data.map((m) => ({
          label: m.descripcion,
          value: Number(m.id),
        }))
      );
    } catch (error) {
      console.error("Error al cargar motivos:", error);
    }
  };

  const abrirDialogoNuevo = () => {
    setEditingDetalle(null);
    reset({
      fecha: null,
      motivoSinFaenaId: null,
      observaciones: "",
    });
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (detalle) => {
    setEditingDetalle(detalle);
    reset({
      fecha: new Date(detalle.fecha),
      motivoSinFaenaId: Number(detalle.motivoSinFaenaId),
      observaciones: detalle.observaciones || "",
    });
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEditingDetalle(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        temporadaPescaId: temporadaPescaId,
        novedadPescaConsumoId: null,
        fecha: data.fecha,
        motivoSinFaenaId: data.motivoSinFaenaId,
        observaciones: data.observaciones?.trim().toUpperCase() || null,
      };

      if (editingDetalle) {
        await actualizarDetalleDiaSinFaena(editingDetalle.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Día sin faena actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetalleDiaSinFaena(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Día sin faena registrado correctamente",
          life: 3000,
        });
      }

      await cargarDetalles();
      cerrarDialogo();
    } catch (error) {
      console.error("Error al guardar día sin faena:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar día sin faena",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarDetalle = (detalle) => {
    setDetalleToDelete(detalle);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (detalleToDelete) {
      await eliminar(detalleToDelete.id);
      setConfirmVisible(false);
      setDetalleToDelete(null);
    }
  };

  const eliminar = async (id) => {
    try {
      setLoading(true);
      await eliminarDetalleDiaSinFaena(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Día sin faena eliminado correctamente",
        life: 3000,
      });
      await cargarDetalles();
    } catch (error) {
      console.error("Error al eliminar día sin faena:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar día sin faena",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates de columnas
  const fechaTemplate = (rowData) => {
    return new Date(rowData.fecha).toLocaleDateString("es-PE");
  };

  const motivoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>
        {rowData.motivoSinFaena?.descripcion || "N/A"}
      </span>
    );
  };

  const observacionesTemplate = (rowData) => {
    return (
      <span style={{ fontSize: "0.9rem" }}>
        {rowData.observaciones || <em style={{ color: "#999" }}>Sin observaciones</em>}
      </span>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => abrirDialogoEdicion(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleEliminarDetalle(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <Button
        label="Agregar Día Sin Faena"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={abrirDialogoNuevo}
        size="small"
      />
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Actualizar"
        icon="pi pi-refresh"
        className="p-button-info"
        onClick={cargarDetalles}
        size="small"
      />
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el día sin faena del ${detalleToDelete ? new Date(detalleToDelete.fecha).toLocaleDateString() : ""
          }?`}
        header="Confirmar Eliminación"
        icon="pi pi-exclamation-triangle"
        accept={confirmarEliminacion}
        reject={() => setConfirmVisible(false)}
        acceptClassName="p-button-danger"
        acceptLabel="Sí, Eliminar"
        rejectLabel="Cancelar"
      />
      <Card
        title="Días Sin Faena"
        style={{ marginTop: "1rem" }}
        className="shadow-2"
      >
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          style={{ marginBottom: "1rem" }}
        />

        <DataTable
          value={detalles}
          loading={loading}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 15]}
          emptyMessage="No hay días sin faena registrados"
          size="small"
          showGridlines
          stripedRows
          style={{ fontSize: getResponsiveFontSize() }}
        >
          <Column
            field="fecha"
            header="Fecha"
            body={fechaTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            field="motivoSinFaena.descripcion"
            header="Motivo"
            body={motivoTemplate}
            sortable
          />
          <Column
            field="observaciones"
            header="Observaciones"
            body={observacionesTemplate}
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            style={{ width: "120px" }}
          />
        </DataTable>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog
        header={editingDetalle ? "Editar Día Sin Faena" : "Nuevo Día Sin Faena"}
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "500px" }}
        modal
      >
        <form onSubmit={(e) => { e.stopPropagation(); handleSubmit(onSubmit)(e); }} className="p-fluid">
          {/* Fecha */}
          <div className="p-field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="fecha" className="font-semibold">
              Fecha *
            </label>
            <Controller
              name="fecha"
              control={control}
              render={({ field }) => (
                <Calendar
                  id="fecha"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className={classNames({ "p-invalid": errors.fecha })}
                />
              )}
            />
            {errors.fecha && (
              <small className="p-error">{errors.fecha.message}</small>
            )}
          </div>

          {/* Motivo */}
          <div className="p-field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="motivoSinFaenaId" className="font-semibold">
              Motivo *
            </label>
            <Controller
              name="motivoSinFaenaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="motivoSinFaenaId"
                  value={field.value ? Number(field.value) : null}
                  onChange={(e) => field.onChange(e.value)}
                  options={motivos}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione un motivo"
                  filter
                  showClear
                  className={classNames({ "p-invalid": errors.motivoSinFaenaId })}
                />
              )}
            />
            {errors.motivoSinFaenaId && (
              <small className="p-error">{errors.motivoSinFaenaId.message}</small>
            )}
          </div>

          {/* Observaciones */}
          <div className="p-field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="observaciones" className="font-semibold">
              Observaciones
            </label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="observaciones"
                  {...field}
                  value={field.value?.toUpperCase() || ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  rows={3}
                  maxLength={500}
                  placeholder="Observaciones adicionales..."
                  style={{ textTransform: "uppercase" }}
                  className={classNames({ "p-invalid": errors.observaciones })}
                />
              )}
            />
            {errors.observaciones && (
              <small className="p-error">{errors.observaciones.message}</small>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={cerrarDialogo}
            />
            <Button
              type="submit"
              label={editingDetalle ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              className="p-button-success"
              loading={loading}
            />
          </div>
        </form>
      </Dialog>
    </>
  );
};

export default DetalleDiasSinFaenaCard;