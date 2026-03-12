/**
 * DetalleComisionFidelizacionEntidad.jsx
 *
 * Componente CRUD para gestionar configuración de comisiones de fidelización por personal de una entidad comercial.
 * Sigue el patrón profesional ERP Megui con control de roles y feedback visual.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  obtenerDetallesPorEntidad,
  crearDetalleComisionFidelizacion,
  actualizarDetalleComisionFidelizacion,
  eliminarDetalleComisionFidelizacion,
} from "../../api/detComisionFidelizacionEntidad";
import { getPersonal } from "../../api/personal";
import { classNames } from "primereact/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { actualizarEntidadComercial } from "../../api/entidadComercial";

// Esquema de validación
const esquemaValidacionComision = yup.object().shape({
  personalId: yup
    .number()
    .required("El personal es requerido")
    .integer("Debe ser un número entero"),
  precioPorTonelada: yup
    .number()
    .required("El precio por tonelada es requerido")
    .min(0, "El precio debe ser mayor o igual a 0")
    .max(99999.99, "El precio no puede exceder 99999.99"),
  cesado: yup.boolean(),
});

const DetalleComisionFidelizacionEntidad = forwardRef(
  (
    {
      entidadComercialFidelizacionId,
      entidadComercial,
      readOnly = false,
      permisos = {},
    },
    ref,
  ) => {
    const [comisionesData, setComisionesData] = useState([]);
    const [personalData, setPersonalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [comisionSeleccionada, setComisionSeleccionada] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [comisionAEliminar, setComisionAEliminar] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [
      precioPorTonComisionFidelizacion,
      setPrecioPorTonComisionFidelizacion,
    ] = useState(0);

    useEffect(() => {
      if (entidadComercial?.precioPorTonComisionFidelizacion) {
        setPrecioPorTonComisionFidelizacion(
          entidadComercial.precioPorTonComisionFidelizacion,
        );
      }
    }, [entidadComercial]);

    const toast = useRef(null);
    const { usuario } = useAuthStore();

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(esquemaValidacionComision),
      defaultValues: {
        personalId: null,
        precioPorTonelada: 0,
        cesado: false,
      },
    });

    useImperativeHandle(ref, () => ({
      recargar: cargarComisiones,
    }));

    useEffect(() => {
      if (entidadComercialFidelizacionId) {
        cargarComisiones();
        cargarPersonal();
      }
    }, [entidadComercialFidelizacionId]);

    const cargarComisiones = async () => {
      if (!entidadComercialFidelizacionId) return;
      setLoading(true);
      try {
        const data = await obtenerDetallesPorEntidad(
          entidadComercialFidelizacionId,
        );
        setComisionesData(data || []);
      } catch (error) {
        console.error("Error al cargar comisiones:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar comisiones de fidelización",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    const cargarPersonal = async () => {
      try {
        const data = await getPersonal();
        setPersonalData(data || []);
      } catch (error) {
        console.error("Error al cargar personal:", error);
      }
    };

    const actualizarPrecioComisionFidelizacion = async (nuevoPrecio) => {
      if (!entidadComercialFidelizacionId) return;

      try {
        await actualizarEntidadComercial(entidadComercialFidelizacionId, {
          precioPorTonComisionFidelizacion: nuevoPrecio,
          actualizadoPor: usuario?.id,
        });

        setPrecioPorTonComisionFidelizacion(nuevoPrecio);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Precio de comisión actualizado correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al actualizar precio:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar precio de comisión",
          life: 3000,
        });
      }
    };

    const abrirDialogoNuevo = () => {
      setComisionSeleccionada(null);
      reset({
        personalId: null,
        precioPorTonelada: 0,
        cesado: false,
      });
      setDialogVisible(true);
    };

    const abrirDialogoEditar = (comision) => {
      setComisionSeleccionada(comision);
      reset({
        personalId: comision.personalId,
        precioPorTonelada: comision.precioPorTonelada,
        cesado: comision.cesado,
      });
      setDialogVisible(true);
    };

    const cerrarDialogo = () => {
      setDialogVisible(false);
      setComisionSeleccionada(null);
      reset();
    };

    const guardarComision = async (data) => {
      setLoading(true);
      try {
        const payload = {
          personalId: data.personalId,
          precioPorTonelada: data.precioPorTonelada,
          cesado: data.cesado,
          entidadComercialFidelizacionId: entidadComercialFidelizacionId,
        };

        if (comisionSeleccionada) {
          await actualizarDetalleComisionFidelizacion(
            comisionSeleccionada.id,
            payload,
          );
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Comisión actualizada correctamente",
            life: 3000,
          });
        } else {
          await crearDetalleComisionFidelizacion(payload);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Comisión creada correctamente",
            life: 3000,
          });
        }

        cerrarDialogo();
        await cargarComisiones();
      } catch (error) {
        console.error("Error al guardar comisión:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al guardar comisión de fidelización",
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    const confirmarEliminar = (comision) => {
      setComisionAEliminar(comision);
      setConfirmVisible(true);
    };

    const eliminarComision = async () => {
      if (!comisionAEliminar) return;

      setLoading(true);
      try {
        await eliminarDetalleComisionFidelizacion(comisionAEliminar.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Comisión eliminada correctamente",
          life: 3000,
        });
        setConfirmVisible(false);
        setComisionAEliminar(null);
        await cargarComisiones();
      } catch (error) {
        console.error("Error al eliminar comisión:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar comisión de fidelización",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Templates de columnas
    const personalBodyTemplate = (rowData) => {
      if (!rowData.personal) return "-";
      return `${rowData.personal.nombres} ${rowData.personal.apellidos}`;
    };

    const precioBodyTemplate = (rowData) => {
      return (
        <div style={{ textAlign: "right", fontWeight: "bold" }}>
          $ {Number(rowData.precioPorTonelada || 0).toFixed(2)}
        </div>
      );
    };

    const cesadoBodyTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.cesado ? "CESADO" : "ACTIVO"}
          severity={rowData.cesado ? "danger" : "success"}
        />
      );
    };

    const accionesBodyTemplate = (rowData) => {
      if (readOnly) return null;

      return (
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
        >
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            severity="warning"
            onClick={() => abrirDialogoEditar(rowData)}
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => confirmarEliminar(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      );
    };

    const personalOptions = personalData.map((p) => ({
      label: `${p.nombres} ${p.apellidos}`,
      value: p.id,
    }));

    const header = (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <h4 className="m-0">Comisiones de Fidelización</h4>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="precioPorTonComisionFidelizacion"
              style={{ fontSize: "0.875rem", fontWeight: "bold" }}
            >
              Precio/Ton Com.Fidelización (US$)
            </label>
            <InputNumber
              id="precioPorTonComisionFidelizacion"
              value={precioPorTonComisionFidelizacion}
              onValueChange={(e) =>
                actualizarPrecioComisionFidelizacion(e.value)
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={9999.99}
              prefix="$ "
              disabled={readOnly || loading}
              style={{ width: "200px", fontWeight: "bold" }}
            />
          </div>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <input
              type="text"
              className="p-inputtext p-component"
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </span>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            severity="success"
            type="button"
            onClick={abrirDialogoNuevo}
            disabled={readOnly || !entidadComercialFidelizacionId}
          />
        </div>
      </div>
    );

    return (
      <div className="card">
        <Toast ref={toast} />
        <DataTable
          value={comisionesData}
          loading={loading}
          header={header}
          stripedRows
          showGridlines
          globalFilter={globalFilter}
          emptyMessage="No se encontraron comisiones"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          size="small"
          selectionMode="single"
          onRowClick={(e) => {
            if (!readOnly) {
              abrirDialogoEditar(e.data);
            }
          }}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        >
          <Column field="id" header="ID" sortable style={{ width: "5%" }} />
          <Column
            header="Personal"
            body={personalBodyTemplate}
            sortable
            style={{ width: "40%" }}
          />
          <Column
            header="Precio/Ton (USD)"
            body={precioBodyTemplate}
            sortable
            style={{ width: "20%" }}
          />
          <Column
            header="Estado"
            body={cesadoBodyTemplate}
            sortable
            style={{ width: "15%" }}
          />
          <Column
            header="Acciones"
            body={accionesBodyTemplate}
            exportable={false}
            style={{ width: "20%" }}
          />
        </DataTable>

        <Dialog
          visible={dialogVisible}
          style={{ width: "750px" }}
          header={comisionSeleccionada ? "Editar Comisión" : "Nueva Comisión"}
          modal
          className="p-fluid"
          onHide={cerrarDialogo}
        >
          <form className="p-fluid">
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="personalId">Personal *</label>
                <Controller
                  name="personalId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="personalId"
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={personalOptions}
                      placeholder="Seleccione personal"
                      filter
                      showClear
                      className={classNames({ "p-invalid": errors.personalId })}
                      style={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {errors.personalId && (
                  <small className="p-error">{errors.personalId.message}</small>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "end",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="precioPorTonelada">
                  Precio por Tonelada (USD) *
                </label>
                <Controller
                  name="precioPorTonelada"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="precioPorTonelada"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      min={0}
                      max={99999.99}
                      prefix="$ "
                      className={classNames({
                        "p-invalid": errors.precioPorTonelada,
                      })}
                      inputStyle={{ fontWeight: "bold" }}
                    />
                  )}
                />
                {errors.precioPorTonelada && (
                  <small className="p-error">
                    {errors.precioPorTonelada.message}
                  </small>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Controller
                  name="cesado"
                  control={control}
                  render={({ field }) => (
                    <Button
                      id="cesado"
                      type="button"
                      label={field.value ? "CESADO" : "ACTIVO"}
                      icon={
                        field.value
                          ? "pi pi-times-circle"
                          : "pi pi-check-circle"
                      }
                      severity={field.value ? "danger" : "success"}
                      onClick={() => field.onChange(!field.value)}
                      className="w-full"
                      style={{
                        fontWeight: "bold",
                        fontSize: "1rem",
                      }}
                      disabled={readOnly || loading}
                    />
                  )}
                />
              </div>
            </div>
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
                onClick={cerrarDialogo}
                disabled={loading}
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
                onClick={handleSubmit(guardarComision)}
                loading={loading}
                disabled={loading}
                className="p-button-success"
                severity="success"
                raised
                size="small"
                outlined
              />
            </div>
          </form>
        </Dialog>

        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message="¿Está seguro de eliminar esta comisión?"
          header="Confirmar Eliminación"
          icon="pi pi-exclamation-triangle"
          accept={eliminarComision}
          reject={() => setConfirmVisible(false)}
          acceptLabel="Sí, eliminar"
          rejectLabel="Cancelar"
          acceptClassName="p-button-danger"
        />
      </div>
    );
  },
);

export default DetalleComisionFidelizacionEntidad;
