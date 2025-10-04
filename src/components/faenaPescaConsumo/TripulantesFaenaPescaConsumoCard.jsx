// src/components/faenaPescaConsumo/TripulantesFaenaPescaConsumoCard.jsx
// Card para gestionar tripulantes de FaenaPescaConsumo
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
import { confirmDialog } from "primereact/confirmdialog";
import { Controller, useForm } from "react-hook-form";
import {
    getTripulantesFaenaConsumo,
  createTripulanteFaenaConsumo,
  updateTripulanteFaenaConsumo,
  eliminarTripulanteFaenaConsumo,
} from "../../api/tripulanteFaenaConsumo";
import { getCargosPersonal } from "../../api/cargosPersonal";

export default function TripulantesFaenaPescaConsumoCard({
  faenaPescaConsumoId,
  personal = [],
  onDataChange,
}) {
  const [tripulantes, setTripulantes] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTripulante, setEditingTripulante] = useState(null);
  const toast = useRef(null);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const personalIdWatch = watch("personalId");

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarTripulantes();
      cargarCargos();
    }
  }, [faenaPescaConsumoId]);

  // Auto-completar nombres cuando se selecciona personal
  useEffect(() => {
    if (personalIdWatch) {
      const personaSeleccionada = personal.find(
        (p) => Number(p.id) === Number(personalIdWatch)
      );
      if (personaSeleccionada) {
        reset((formValues) => ({
          ...formValues,
          nombres: personaSeleccionada.nombres,
          apellidos: personaSeleccionada.apellidos,
          cargoId: personaSeleccionada.cargoId
            ? Number(personaSeleccionada.cargoId)
            : null,
        }));
      }
    }
  }, [personalIdWatch, personal, reset]);

  const cargarTripulantes = async () => {
    try {
      setLoading(true);
      const data = await getTripulantesFaenaConsumo();
      const tripulantesFaena = data.filter(
        (t) => Number(t.faenaPescaConsumoId) === Number(faenaPescaConsumoId)
      );
      setTripulantes(tripulantesFaena);
    } catch (error) {
      console.error("Error al cargar tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar tripulantes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarCargos = async () => {
    try {
      const data = await getCargosPersonal();
      setCargos(data);
    } catch (error) {
      console.error("Error al cargar cargos:", error);
    }
  };

  const handleNuevo = () => {
    setEditingTripulante(null);
    reset({
      personalId: null,
      cargoId: null,
      nombres: "",
      apellidos: "",
      observaciones: "",
    });
    setDialogVisible(true);
  };

  const handleEditar = (tripulante) => {
    setEditingTripulante(tripulante);
    reset({
      personalId: tripulante.personalId ? Number(tripulante.personalId) : null,
      cargoId: tripulante.cargoId ? Number(tripulante.cargoId) : null,
      nombres: tripulante.nombres || "",
      apellidos: tripulante.apellidos || "",
      observaciones: tripulante.observaciones || "",
    });
    setDialogVisible(true);
  };

  const handleEliminar = (tripulante) => {
    confirmDialog({
      message: `¿Está seguro de eliminar al tripulante ${tripulante.nombres} ${tripulante.apellidos}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarTripulanteFaenaConsumo(tripulante.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Tripulante eliminado correctamente",
            life: 3000,
          });
          cargarTripulantes();
          onDataChange?.();
        } catch (error) {
          console.error("Error al eliminar tripulante:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar el tripulante",
            life: 3000,
          });
        }
      },
    });
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        faenaPescaConsumoId: Number(faenaPescaConsumoId),
        personalId: data.personalId ? Number(data.personalId) : null,
        cargoId: data.cargoId ? Number(data.cargoId) : null,
        nombres: data.nombres?.trim() || null,
        apellidos: data.apellidos?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
      };

      if (editingTripulante) {
        await updateTripulanteFaenaConsumo(editingTripulante.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tripulante actualizado correctamente",
          life: 3000,
        });
      } else {
        await createTripulanteFaenaConsumo(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Tripulante agregado correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      cargarTripulantes();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar tripulante:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el tripulante",
        life: 3000,
      });
    }
  };

  // Templates
  const personalTemplate = (rowData) => {
    if (rowData.personalId) {
      const persona = personal.find(
        (p) => Number(p.id) === Number(rowData.personalId)
      );
      return persona ? `${persona.nombres} ${persona.apellidos}` : "N/A";
    }
    return `${rowData.nombres || ""} ${rowData.apellidos || ""}`.trim() || "N/A";
  };

  const cargoTemplate = (rowData) => {
    const cargo = cargos.find((c) => Number(c.id) === Number(rowData.cargoId));
    return cargo ? cargo.descripcion : "N/A";
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
      <Card title="Tripulantes">
        <p className="text-center text-500">
          Debe crear la faena primero para gestionar tripulantes
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Tripulantes de la Faena"
        subTitle="Gestión de tripulantes que participan en la faena"
      >
        <div className="flex justify-content-end mb-3">
          <Button
            label="Nuevo Tripulante"
            icon="pi pi-plus"
            onClick={handleNuevo}
            severity="success"
            size="small"
          />
        </div>

        <DataTable
          value={tripulantes}
          loading={loading}
          emptyMessage="No hay tripulantes registrados"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
        >
          <Column field="id" header="ID" sortable style={{ width: "80px" }} />
          <Column
            field="personalId"
            header="Tripulante"
            body={personalTemplate}
            sortable
          />
          <Column
            field="cargoId"
            header="Cargo"
            body={cargoTemplate}
            sortable
          />
          <Column field="observaciones" header="Observaciones" sortable />
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
        header={editingTripulante ? "Editar Tripulante" : "Nuevo Tripulante"}
        style={{ width: "700px" }}
        modal
        className="p-fluid"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid">
            {/* Personal */}
            <div className="col-12">
              <label htmlFor="personalId" className="block font-medium mb-2">
                Seleccionar Personal (Opcional)
              </label>
              <Controller
                name="personalId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="personalId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={personal.map((p) => ({
                      label: `${p.nombres} ${p.apellidos}`,
                      value: Number(p.id),
                    }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione personal"
                    filter
                    showClear
                  />
                )}
              />
              <small className="text-500">
                Si selecciona personal, los datos se completarán automáticamente
              </small>
            </div>

            {/* Nombres */}
            <div className="col-12 md:col-6">
              <label htmlFor="nombres" className="block font-medium mb-2">
                Nombres *
              </label>
              <Controller
                name="nombres"
                control={control}
                rules={{ required: "Los nombres son obligatorios" }}
                render={({ field }) => (
                  <InputText
                    id="nombres"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Nombres del tripulante"
                    className={errors.nombres ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.nombres && (
                <small className="p-error">{errors.nombres.message}</small>
              )}
            </div>

            {/* Apellidos */}
            <div className="col-12 md:col-6">
              <label htmlFor="apellidos" className="block font-medium mb-2">
                Apellidos *
              </label>
              <Controller
                name="apellidos"
                control={control}
                rules={{ required: "Los apellidos son obligatorios" }}
                render={({ field }) => (
                  <InputText
                    id="apellidos"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="Apellidos del tripulante"
                    className={errors.apellidos ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.apellidos && (
                <small className="p-error">{errors.apellidos.message}</small>
              )}
            </div>

            {/* Cargo */}
            <div className="col-12">
              <label htmlFor="cargoId" className="block font-medium mb-2">
                Cargo
              </label>
              <Controller
                name="cargoId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="cargoId"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={cargos}
                    optionLabel="descripcion"
                    optionValue="id"
                    placeholder="Seleccione cargo"
                    filter
                    showClear
                  />
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