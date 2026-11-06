// src/components/entidadPension/TarifaEntidadPensionList.jsx
// Detalle del formulario de la entidad de pensión: tarifas con vigencia (CRUD).
// Patrón: SublineaCreditoList (lista dentro del formulario del registro padre, con su propio Dialog de edición).
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import TarifaEntidadPensionForm from "./TarifaEntidadPensionForm";
import {
  getTarifasEntidadPension,
  createTarifaEntidadPension,
  updateTarifaEntidadPension,
  deleteTarifaEntidadPension,
} from "../../api/recursosHumanos/entidadPension";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { formatearFecha } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";

const formatearPorcentaje = (valor) => (valor === null || valor === undefined ? "-" : `${Number(valor).toFixed(2)} %`);

const TarifaEntidadPensionList = ({ entidadPensionId, permisos = {} }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const toast = useRef(null);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tarifaToDelete, setTarifaToDelete] = useState(null);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    if (entidadPensionId) cargarTarifas();
  }, [entidadPensionId]);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const cargarTarifas = async () => {
    try {
      setLoading(true);
      setTarifas((await getTarifasEntidadPension(entidadPensionId)) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las tarifas de la entidad");
    } finally {
      setLoading(false);
    }
  };

  const abrirNuevo = () => {
    setTarifaSeleccionada(null);
    setDialogVisible(true);
  };

  const editarTarifa = (tarifa) => {
    setTarifaSeleccionada(tarifa);
    setDialogVisible(true);
  };

  const onCancelar = () => {
    setDialogVisible(false);
    setTarifaSeleccionada(null);
  };

  const onGuardar = async (data) => {
    const esEdicion = Boolean(tarifaSeleccionada);
    try {
      setGuardando(true);
      if (esEdicion) {
        await updateTarifaEntidadPension(tarifaSeleccionada.id, { ...data, actualizadoPor: personalId });
      } else {
        await createTarifaEntidadPension({ ...data, entidadPensionId: Number(entidadPensionId), creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Tarifa actualizada correctamente" : "Tarifa registrada correctamente",
        life: 3000,
      });
      onCancelar();
      cargarTarifas();
    } catch (error) {
      mostrarError(error, "No se pudo guardar la tarifa");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarTarifa = (tarifa) => {
    setTarifaToDelete(tarifa);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    try {
      await deleteTarifaEntidadPension(tarifaToDelete.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Tarifa eliminada correctamente", life: 3000 });
      setConfirmVisible(false);
      cargarTarifas();
    } catch (error) {
      mostrarError(error, "No se pudo eliminar la tarifa");
      setConfirmVisible(false);
    }
  };

  const accionesTemplate = (tarifa) => (
    <div className="flex gap-2">
      <Button
        type="button"
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-warning"
        onClick={(e) => {
          e.stopPropagation();
          editarTarifa(tarifa);
        }}
        disabled={permisos.puedeEditar === false}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        type="button"
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        onClick={(e) => {
          e.stopPropagation();
          handleEliminarTarifa(tarifa);
        }}
        disabled={permisos.puedeEliminar === false}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const header = (
    <div className="flex justify-content-between align-items-center">
      <div>
        <h4 style={{ margin: 0 }}>Tarifas con vigencia</h4>
        <small style={{ color: "#666", fontWeight: "normal" }}>
          Al registrar una tarifa nueva, la anterior se cierra el día previo a su vigencia.
        </small>
      </div>
      <Button
        type="button"
        label="Nueva tarifa"
        icon="pi pi-plus"
        className="p-button-success"
        severity="success"
        raised
        size="small"
        onClick={abrirNuevo}
        disabled={permisos.puedeCrear === false}
      />
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar la tarifa vigente desde ${tarifaToDelete ? formatearFecha(tarifaToDelete.vigenteDesde) : ""}?`}
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Sí, eliminar"
        rejectLabel="No"
        accept={confirmarEliminacion}
        reject={() => setConfirmVisible(false)}
      />

      <DataTable
        value={tarifas}
        loading={loading}
        header={header}
        emptyMessage="Esta entidad aún no tiene tarifas registradas"
        size="small"
        stripedRows
        showGridlines
        dataKey="id"
      >
        <Column field="vigenteDesde" header="Desde" body={(tarifa) => formatearFecha(tarifa.vigenteDesde)} sortable />
        <Column
          header="Hasta"
          body={(tarifa) => (tarifa.vigenteHasta ? formatearFecha(tarifa.vigenteHasta) : <Tag value="VIGENTE" severity="success" />)}
        />
        <Column header="Aporte" body={(tarifa) => formatearPorcentaje(tarifa.porcentajeAporte)} style={{ textAlign: "right" }} />
        <Column header="Seguro" body={(tarifa) => formatearPorcentaje(tarifa.porcentajeSeguro)} style={{ textAlign: "right" }} />
        <Column header="Comisión flujo" body={(tarifa) => formatearPorcentaje(tarifa.porcentajeComisionFlujo)} style={{ textAlign: "right" }} />
        <Column header="Comisión mixta" body={(tarifa) => formatearPorcentaje(tarifa.porcentajeComisionMixta)} style={{ textAlign: "right" }} />
        <Column
          header="Rem. máx. asegurable"
          body={(tarifa) =>
            tarifa.remuneracionMaximaAsegurable === null || tarifa.remuneracionMaximaAsegurable === undefined
              ? "-"
              : `S/ ${Number(tarifa.remuneracionMaximaAsegurable).toFixed(2)}`
          }
          style={{ textAlign: "right" }}
        />
        <Column header="Acciones" body={accionesTemplate} exportable={false} style={{ width: 110 }} />
      </DataTable>

      <Dialog
        header={tarifaSeleccionada ? "Editar Tarifa" : "Nueva Tarifa"}
        visible={dialogVisible}
        style={{ width: "550px" }}
        onHide={onCancelar}
        modal
        className="p-fluid"
        key={`tarifa-${tarifaSeleccionada?.id || "nueva"}`}
      >
        <TarifaEntidadPensionForm
          isEdit={Boolean(tarifaSeleccionada)}
          defaultValues={tarifaSeleccionada || {}}
          onSubmit={onGuardar}
          onCancel={onCancelar}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default TarifaEntidadPensionList;
