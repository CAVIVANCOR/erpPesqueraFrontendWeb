// src/pages/Videoconferencia.jsx
// Pantalla CRUD profesional para Videoconferencia. Cumple la regla transversal ERP Megui.
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import VideoconferenciaForm from "../components/videoconferencia/VideoconferenciaForm";
import {
  getVideoconferencias,
  crearVideoconferencia,
  actualizarVideoconferencia,
  eliminarVideoconferencia,
  iniciarVideoconferencia,
  finalizarVideoconferencia,
  cancelarVideoconferencia,
} from "../api/videoconferencia";
import { getPersonal } from "../api/personal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize, formatearFecha } from "../utils/utils";

/**
 * Pantalla profesional para gestión de Videoconferencias.
 */
export default function Videoconferencia({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [organizadorSeleccionado, setOrganizadorSeleccionado] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [organizadoresUnicos, setOrganizadoresUnicos] = useState([]);

  const estadosOptions = [
    { label: "PROGRAMADA", value: "PROGRAMADA" },
    { label: "EN CURSO", value: "EN_CURSO" },
    { label: "FINALIZADA", value: "FINALIZADA" },
    { label: "CANCELADA", value: "CANCELADA" },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    let filtrados = items;

    if (organizadorSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.organizadorId) === Number(organizadorSeleccionado)
      );
    }

    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaInicio);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaDoc >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaDoc = new Date(item.fechaInicio);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaDoc <= fechaFinDia;
      });
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => item.estado === estadoSeleccionado
      );
    }

    setItemsFiltrados(filtrados);
  }, [
    organizadorSeleccionado,
    fechaInicio,
    fechaFin,
    estadoSeleccionado,
    items,
  ]);

  useEffect(() => {
    const organizadoresMap = new Map();
    items.forEach((item) => {
      if (item.organizadorId && item.organizador) {
        organizadoresMap.set(item.organizadorId, item.organizador);
      }
    });
    const organizadoresArray = Array.from(organizadoresMap.values());
    setOrganizadoresUnicos(organizadoresArray);
  }, [items]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [videoconferenciasData, personalData] = await Promise.all([
        getVideoconferencias(),
        getPersonal(),
      ]);

      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);
      setItems(videoconferenciasData);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  const handleEdit = (rowData) => {
    setEditing(rowData);
    setShowDialog(true);
  };

  const handleDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar la videoconferencia "${rowData.titulo}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          await eliminarVideoconferencia(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Videoconferencia eliminada correctamente.",
          });
          cargarDatos();
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

  const handleFormSubmit = async (data) => {
    const esEdicion = editing && editing.id;

    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (esEdicion) {
        await actualizarVideoconferencia(editing.id, data);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Videoconferencia actualizada correctamente.",
        });
      } else {
        const resultado = await crearVideoconferencia(data);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Videoconferencia "${resultado.titulo}" creada correctamente.`,
          life: 5000,
        });
      }

      cargarDatos();
      setShowDialog(false);
      setEditing(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar.";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
      });
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const limpiarFiltros = () => {
    setOrganizadorSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
    setEstadoSeleccionado(null);
  };

  const handleIniciar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de iniciar la videoconferencia "${rowData.titulo}"?`,
      header: "Confirmar Inicio",
      icon: "pi pi-play",
      acceptLabel: "Sí, iniciar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          await iniciarVideoconferencia(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Iniciada",
            detail: "Videoconferencia iniciada correctamente.",
          });
          cargarDatos();
        } catch (err) {
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.error ||
            "No se pudo iniciar.";
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

  const handleFinalizar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de finalizar la videoconferencia "${rowData.titulo}"?`,
      header: "Confirmar Finalización",
      icon: "pi pi-stop",
      acceptLabel: "Sí, finalizar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setLoading(true);
        try {
          await finalizarVideoconferencia(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Finalizada",
            detail: "Videoconferencia finalizada correctamente.",
          });
          cargarDatos();
        } catch (err) {
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.error ||
            "No se pudo finalizar.";
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

  const handleCancelar = (rowData) => {
    confirmDialog({
      message: `¿Está seguro de cancelar la videoconferencia "${rowData.titulo}"?`,
      header: "Confirmar Cancelación",
      icon: "pi pi-times",
      acceptLabel: "Sí, cancelar",
      rejectLabel: "No",
      accept: async () => {
        setLoading(true);
        try {
          await cancelarVideoconferencia(rowData.id);
          toast.current.show({
            severity: "success",
            summary: "Cancelada",
            detail: "Videoconferencia cancelada correctamente.",
          });
          cargarDatos();
        } catch (err) {
          const errorMsg =
            err.response?.data?.mensaje ||
            err.response?.data?.error ||
            "No se pudo cancelar.";
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

  const estadoBodyTemplate = (rowData) => {
    const severityMap = {
      PROGRAMADA: "info",
      EN_CURSO: "success",
      FINALIZADA: "secondary",
      CANCELADA: "danger",
    };
    return (
      <Tag
        value={rowData.estado.replace("_", " ")}
        severity={severityMap[rowData.estado]}
      />
    );
  };

  const fechaBodyTemplate = (rowData) => {
    return formatearFecha(rowData.fechaInicio);
  };

  const organizadorBodyTemplate = (rowData) => {
    if (!rowData.organizador) return "";
    return `${rowData.organizador.nombres} ${
      rowData.organizador.apellidos || ""
    }`.trim();
  };

  const duracionBodyTemplate = (rowData) => {
    return `${rowData.duracionMinutos} min`;
  };

  const toCamelCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const participantesBodyTemplate = (rowData) => {
    if (!rowData.participantes || rowData.participantes.length === 0) {
      return <span style={{ fontStyle: "italic", color: "#999" }}>Sin participantes</span>;
    }

    const nombresParticipantes = rowData.participantes
      .map((p) => {
        if (!p.personal) return null;
        const nombres = toCamelCase(p.personal.nombres || "");
        const apellidos = toCamelCase(p.personal.apellidos || "");
        return `${nombres} ${apellidos}`.trim();
      })
      .filter((nombre) => nombre)
      .join(", ");

    return (
      <span style={{ fontStyle: "italic" }}>
        {nombresParticipantes || "Sin participantes"}
      </span>
    );
  };

  const handleUnirse = (rowData) => {
    if (!rowData.salaId) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se encontró el ID de la sala de Jitsi.",
        life: 3000,
      });
      return;
    }

    const jitsiUrl = `https://meet.jit.si/${rowData.salaId}`;
    window.open(jitsiUrl, "_blank", "noopener,noreferrer");
  };

  const accionesBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {rowData.estado === "PROGRAMADA" && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Iniciar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleIniciar(rowData)}
          />
        )}
        {rowData.estado === "EN_CURSO" && (
          <>
            <Button
              icon="pi pi-video"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Unirse a la Sala"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleUnirse(rowData)}
            />
            <Button
              icon="pi pi-stop"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Finalizar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleFinalizar(rowData)}
            />
          </>
        )}
        {(rowData.estado === "PROGRAMADA" || rowData.estado === "EN_CURSO") && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            tooltip="Cancelar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleCancelar(rowData)}
          />
        )}
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-info p-button-sm"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleEdit(rowData)}
          disabled={
            rowData.estado === "FINALIZADA" || rowData.estado === "CANCELADA"
          }
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleDelete(rowData)}
          disabled={
            rowData.estado === "EN_CURSO" || rowData.estado === "FINALIZADA"
          }
        />
      </div>
    );
  };

  const organizadoresOptions = organizadoresUnicos.map((org) => ({
    label: `${org.nombres} ${org.apellidoPaterno || ""}`.trim(),
    value: Number(org.id),
  }));

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="mb-4">
        <h2>
          GESTIÓN VIDEO CONFERENCIAS
        </h2>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "end",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 0.5 }}>
          {permisos.puedeCrear && (
            <Button
              label="Nueva"
              icon="pi pi-plus"
              onClick={handleAdd}
              className="p-button-success"
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="organizador" className="block mb-2 font-bold">
            ORGANIZADOR
          </label>
          <Dropdown
            id="organizador"
            value={organizadorSeleccionado}
            options={organizadoresOptions}
            onChange={(e) => setOrganizadorSeleccionado(e.value)}
            placeholder="Todos"
            showClear
            filter
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estado" className="block mb-2 font-bold">
            ESTADO
          </label>
          <Dropdown
            id="estado"
            value={estadoSeleccionado}
            options={estadosOptions}
            onChange={(e) => setEstadoSeleccionado(e.value)}
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaInicio" className="block mb-2 font-bold">
            FECHA DESDE
          </label>
          <Calendar
            id="fechaInicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Seleccione"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaFin" className="block mb-2 font-bold">
            FECHA HASTA
          </label>
          <Calendar
            id="fechaFin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Seleccione"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            className="p-button-outlined"
            onClick={limpiarFiltros}
          />
        </div>
        <div style={{ flex: 1 }}></div>
      </div>

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-3">
          <h3>LISTADO DE VIDEOCONFERENCIAS</h3>
        </div>

        <DataTable
          value={itemsFiltrados}
          loading={loading}
         size="small"
        stripedRows
        showGridlines
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80, 160]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} VideoConferencias"
        sortField="id"
        sortOrder={-1}
        selectionMode="single"
          emptyMessage="No se encontraron videoconferencias."
          onRowClick={(e) => handleEdit(e.data)}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        >
          <Column
            field="titulo"
            header="TÍTULO"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="fechaInicio"
            header="FECHA"
            body={fechaBodyTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="duracionMinutos"
            header="DURACIÓN"
            body={duracionBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="organizador"
            header="ORGANIZADOR"
            body={organizadorBodyTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="PARTICIPANTES"
            body={participantesBodyTemplate}
            style={{ minWidth: "250px" }}
          />
          <Column
            field="estado"
            header="ESTADO"
            body={estadoBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="ACCIONES"
            body={accionesBodyTemplate}
            style={{ minWidth: "250px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => {
          setShowDialog(false);
          setEditing(null);
        }}
        header={editing ? "EDITAR VIDEOCONFERENCIA" : "NUEVA VIDEOCONFERENCIA"}
        modal
        style={{ width: "90vw", maxWidth: "1200px" }}
        maximizable
      >
        <VideoconferenciaForm
          isEdit={!!editing}
          defaultValues={editing}
          personalOptions={personalOptions}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowDialog(false);
            setEditing(null);
          }}
          loading={loading}
          toast={toast}
          permisos={permisos}
        />
      </Dialog>
    </div>
  );
}
