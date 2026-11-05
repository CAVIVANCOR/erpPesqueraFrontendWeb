// src/pages/PlantillaFormatoExterno.jsx
// Plantillas de formato externo (PLAME, AFPnet): el diseño de los archivos oficiales vive como dato con vigencia.
// Layout: patrón de LineaCredito.jsx (header con filtros, DataTable, Dialog maximizado).
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import {
  getPlantillasFormatoExterno,
  getPlantillaFormatoExternoById,
  createPlantillaFormatoExterno,
  updatePlantillaFormatoExterno,
  deletePlantillaFormatoExterno,
} from "../api/recursosHumanos/plantillaFormatoExterno";
import PlantillaFormatoExternoForm from "../components/plantillaFormatoExterno/PlantillaFormatoExternoForm";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";

const PlantillaFormatoExterno = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  const usuario = useAuthStore((state) => state.usuario);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [visible, setVisible] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Personal para mostrar quién creó o modificó cada registro (AuditoriaDialog)
  const [personalAuditoria, setPersonalAuditoria] = useState([]);

  const personalId = usuario?.personalId ? Number(usuario.personalId) : null;

  useEffect(() => {
    getPersonal()
      .then((data) => setPersonalAuditoria(data || []))
      .catch((error) => mostrarError(error, "No se pudo cargar el personal para la auditoría"));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarError = (error, accionFallida) => {
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accionFallida), life: 5000 });
  };

  const denegar = (accion) =>
    toast.current?.show({ severity: "warn", summary: "Acceso Denegado", detail: `No tiene permisos para ${accion}`, life: 3000 });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setPlantillas((await getPlantillasFormatoExterno()) || []);
    } catch (error) {
      mostrarError(error, "No se pudieron cargar las plantillas de formato externo");
    } finally {
      setLoading(false);
    }
  };

  const plantillasFiltradas = plantillas.filter((plantilla) => {
    const texto = globalFilter.trim().toLowerCase();
    return !texto || [plantilla.codigo, plantilla.descripcion].filter(Boolean).join(" ").toLowerCase().includes(texto);
  });

  const handleNew = () => {
    setPlantillaSeleccionada(null);
    setVisible(true);
  };

  const handleEdit = async (plantilla) => {
    try {
      setLoading(true);
      setPlantillaSeleccionada(await getPlantillaFormatoExternoById(plantilla.id));
      setVisible(true);
    } catch (error) {
      mostrarError(error, "No se pudo cargar la plantilla de formato externo");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setPlantillaSeleccionada(null);
  };

  const handleSave = async (data) => {
    const esEdicion = Boolean(plantillaSeleccionada);
    if (esEdicion && !permisos.puedeEditar) return denegar("editar");
    if (!esEdicion && !permisos.puedeCrear) return denegar("crear");
    try {
      setGuardando(true);
      if (esEdicion) {
        await updatePlantillaFormatoExterno(plantillaSeleccionada.id, { ...data, actualizadoPor: personalId });
      } else {
        await createPlantillaFormatoExterno({ ...data, creadoPor: personalId });
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion ? "Plantilla actualizada correctamente" : "Plantilla registrada correctamente",
        life: 3000,
      });
      handleCancel();
      cargarDatos();
    } catch (error) {
      mostrarError(error, "No se pudo guardar la plantilla de formato externo");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (plantilla) => {
    if (!permisos.puedeEliminar) return denegar("eliminar");
    confirmDialog({
      message: `¿Está seguro de eliminar la plantilla ${plantilla.codigo}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "No",
      accept: async () => {
        try {
          setLoading(true);
          await deletePlantillaFormatoExterno(plantilla.id);
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Plantilla eliminada correctamente", life: 3000 });
          cargarDatos();
        } catch (error) {
          mostrarError(error, "No se pudo eliminar la plantilla de formato externo");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const accionesBodyTemplate = (plantilla) => (
    <div className="flex gap-2">
      <Button
        icon={permisos.puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
        rounded
        outlined
        className="p-button-warning"
        onClick={() => handleEdit(plantilla)}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
        tooltipOptions={{ position: "top" }}
      />
      {(
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => handleDelete(plantilla)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      )}
    </div>
  );

  const header = (
    <div
      style={{
        alignItems: "end",
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
        marginBottom: 15,
      }}
    >
      <div style={{ flex: 2 }}>
        <h3 style={{ margin: 0 }}>Formatos Externos (PLAME / AFPnet)</h3>
        <small style={{ color: "#666", fontWeight: "normal" }}>Total de registros: {plantillasFiltradas.length}</small>
      </div>
      <div style={{ flex: 2 }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>Buscar</label>
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" />
          <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Código o descripción" style={{ width: "100%" }} />
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success"
          severity="success"
          raised
          onClick={handleNew}
          disabled={!permisos.puedeCrear || loading}
          tooltip={!permisos.puedeCrear ? "No tiene permisos para crear" : "Nueva plantilla"}
          style={{ width: "100%" }}
          size="small"
        />
      </div>
      <div style={{ flex: 0.6 }}>
        <Button icon="pi pi-refresh" className="p-button-outlined p-button-info" onClick={cargarDatos} loading={loading} tooltip="Actualizar" tooltipOptions={{ position: "top" }} style={{ width: "100%" }} size="small" />
      </div>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={plantillasFiltradas}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron plantillas de formato externo"
        className="datatable-responsive"
        showGridlines
        stripedRows
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        dataKey="id"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="codigo" header="Código" sortable style={{ width: 220 }} body={(plantilla) => <strong>{plantilla.codigo}</strong>} />
        <Column field="descripcion" header="Descripción" sortable />
        <Column field="vigenteDesde" header="Desde" body={(plantilla) => formatearFecha(plantilla.vigenteDesde)} sortable style={{ width: 110 }} />
        <Column
          header="Hasta"
          body={(plantilla) => (plantilla.vigenteHasta ? formatearFecha(plantilla.vigenteHasta) : <Tag value="SIN FIN" severity="secondary" />)}
          style={{ width: 110 }}
        />
        <Column header="Acciones" body={accionesBodyTemplate} exportable={false} style={{ width: 150 }} />
      </DataTable>

      <Dialog
        header={
          plantillaSeleccionada
            ? permisos.puedeEditar
              ? "Editar Plantilla de Formato Externo"
              : "Ver Plantilla de Formato Externo"
            : "Nueva Plantilla de Formato Externo"
        }
        visible={visible}
        style={{ width: "1000px" }}
        maximizable
        onHide={handleCancel}
        modal
        key={`plantilla-${plantillaSeleccionada?.id || "nueva"}`}
      >
        <PlantillaFormatoExternoForm
          plantilla={plantillaSeleccionada}
          personalAuditoria={personalAuditoria}
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={Boolean(plantillaSeleccionada) && !permisos.puedeEditar}
          loading={guardando}
        />
      </Dialog>
    </div>
  );
};

export default PlantillaFormatoExterno;
