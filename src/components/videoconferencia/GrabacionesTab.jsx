// src/components/videoconferencia/GrabacionesTab.jsx
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getGrabacionesPorVideoconferencia,
  eliminarGrabacionReunion,
} from "../../api/grabacionReunion";
import { formatearFecha } from "../../utils/utils";

export default function GrabacionesTab({
  videoconferenciaId,
  puedeEditar,
  toast,
  onCountChange,
}) {
  const [grabaciones, setGrabaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videoconferenciaId) {
      cargarGrabaciones();
    }
  }, [videoconferenciaId]);

  const cargarGrabaciones = async () => {
    if (!videoconferenciaId) return;
    setLoading(true);
    try {
      const data = await getGrabacionesPorVideoconferencia(videoconferenciaId);
      setGrabaciones(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las grabaciones.",
      });
    }
    setLoading(false);
  };

  const handleDelete = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la grabación "${rowData.nombreArchivo}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          await eliminarGrabacionReunion(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Grabación eliminada correctamente.",
          });
          cargarGrabaciones();
        } catch (err) {
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.error ||
            "No se pudo eliminar.";
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: errorMsg,
          });
        }
        setLoading(false);
      },
    });
  };

  const fechaBodyTemplate = (rowData) => {
    return formatearFecha(rowData.fechaGrabacion);
  };

  const duracionBodyTemplate = (rowData) => {
    const minutos = Math.floor(rowData.duracionSegundos / 60);
    const segundos = rowData.duracionSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, "0")}`;
  };

  const tamanoBodyTemplate = (rowData) => {
    const mb = (rowData.tamanoBytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button
          icon="pi pi-download"
          className="p-button-rounded p-button-info p-button-sm"
          tooltip="Descargar"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            window.open(rowData.rutaArchivo, "_blank");
          }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleDelete(rowData)}
          disabled={!puedeEditar}
        />
      </div>
    );
  };

  return (
    <div>
      <ConfirmDialog />
      <div className="flex justify-content-between align-items-center mb-3">
        <h4>GRABACIONES DE LA VIDEOCONFERENCIA</h4>
      </div>

      <DataTable
        value={grabaciones}
        loading={loading}
        emptyMessage="No hay grabaciones disponibles."
        responsiveLayout="scroll"
        stripedRows
      >
        <Column
          field="nombreArchivo"
          header="NOMBRE ARCHIVO"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="fechaGrabacion"
          header="FECHA"
          body={fechaBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="duracionSegundos"
          header="DURACIÓN"
          body={duracionBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="tamanoBytes"
          header="TAMAÑO"
          body={tamanoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="ACCIONES"
          body={accionesBodyTemplate}
          style={{ minWidth: "150px" }}
        />
      </DataTable>

      {grabaciones.length === 0 && !loading && (
        <div className="text-center mt-4 p-4" style={{ color: "#6c757d" }}>
          <i className="pi pi-video" style={{ fontSize: "3rem" }}></i>
          <p className="mt-2">
            Las grabaciones aparecerán aquí automáticamente cuando Jitsi Meet
            finalice el proceso de grabación.
          </p>
        </div>
      )}
    </div>
  );
}
