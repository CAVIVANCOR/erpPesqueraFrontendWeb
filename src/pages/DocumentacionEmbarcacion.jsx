// src/pages/DocumentacionEmbarcacion.jsx
// Pantalla CRUD profesional para DocumentacionEmbarcacion. Cumple la regla transversal ERP Megui.
// Sigue el patrón estándar de Personal.jsx con templates profesionales y control de roles.

import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import DocumentacionEmbarcacionForm from "../components/documentacionEmbarcacion/DocumentacionEmbarcacionForm";
import {
  getDocumentacionesEmbarcacion,
  crearDocumentacionEmbarcacion,
  actualizarDocumentacionEmbarcacion,
  eliminarDocumentacionEmbarcacion,
} from "../api/documentacionEmbarcacion";
import { getEmbarcaciones } from "../api/embarcacion";
import { getDocumentosPesca } from "../api/documentoPesca";
import { getActivos } from "../api/activo";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Página de gestión de documentación de embarcaciones.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DocumentacionEmbarcacion() {
  // Obtener usuario autenticado para control de permisos
  const usuario = useAuthStore((state) => state.usuario);

  const [documentaciones, setDocumentaciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtroEmbarcacion, setFiltroEmbarcacion] = useState(null);
  const [filtroDocumentoPesca, setFiltroDocumentoPesca] = useState(null);

  // Estados para combos de referencia
  const [embarcaciones, setEmbarcaciones] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [activos, setActivos] = useState([]);

  // Carga inicial de datos
  useEffect(() => {
    cargarDocumentaciones();
    cargarCombosReferencia();
  }, []);

  const cargarDocumentaciones = async () => {
    setLoading(true);
    try {
      const data = await getDocumentacionesEmbarcacion();
      setDocumentaciones(data);
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la documentación de embarcaciones",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarCombosReferencia = async () => {
    try {
      const [embarcacionesRes, documentosPescaRes, activosRes] =
        await Promise.allSettled([
          getEmbarcaciones(),
          getDocumentosPesca(),
          getActivos(),
        ]);

      if (embarcacionesRes.status === "fulfilled") {
        const activosData =
          activosRes.status === "fulfilled" ? activosRes.value : [];
        const embarcacionesData = embarcacionesRes.value.map((e) => {
          const activo = activosData.find(
            (a) => Number(a.id) === Number(e.activoId)
          );
          return {
            ...e,
            id: Number(e.id),
            label: activo ? activo.descripcion : `Embarcación ${e.id}`,
          };
        });
        setEmbarcaciones(embarcacionesData);
      }
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value.map((d) => ({
          ...d,
          id: Number(d.id),
          label: d.descripcion,
        }));
        setDocumentosPesca(documentosData);
      }
      if (activosRes.status === "fulfilled") {
        setActivos(activosRes.value);
      }
    } catch (err) {
      console.error("Error al cargar combos de referencia:", err);
    }
  };

  // Templates profesionales para visualización
  const embarcacionTemplate = (rowData) => {
    const embarcacion = embarcaciones.find(
      (e) => Number(e.id) === Number(rowData.embarcacionId)
    );
    const activo = activos.find(
      (a) => Number(a.id) === Number(embarcacion?.activoId)
    );
    return embarcacion ? (
      <div>
        <strong style={{ color: "#2196F3" }}>{embarcacion.matricula}</strong>
        <br />
        <small>{activo?.descripcion || "Sin activo"}</small>
      </div>
    ) : (
      <Tag severity="warning" value="No encontrada" />
    );
  };

  const documentoPescaTemplate = (rowData) => {
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(rowData.documentoPescaId)
    );
    return documento ? (
      <div>
        <strong>{documento.nombre}</strong>
        {documento.obligatorio && (
          <Tag severity="danger" value="OBLIGATORIO" className="ml-2" />
        )}
      </div>
    ) : (
      <Tag severity="warning" value="No encontrado" />
    );
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-PE")
      : "-";
  };

  const observacionesTemplate = (rowData) => {
    return rowData.observaciones ? (
      <div
        style={{
          maxWidth: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {rowData.observaciones}
      </div>
    ) : (
      <Tag severity="secondary" value="Sin observaciones" />
    );
  };

  // Renderizado de botones de acción
  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-rounded"
        onClick={(ev) => {
          ev.stopPropagation();
          onEdit(rowData);
        }}
        tooltip="Editar"
      />
      {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-rounded"
          onClick={(ev) => {
            ev.stopPropagation();
            onDelete(rowData);
          }}
          tooltip="Eliminar Registro"
        />
      )}
    </div>
  );

  // Lógica para alta y edición
  const onNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };

  const onEdit = (row) => {
    setSelected(row);
    setIsEdit(true);
    setShowForm(true);
  };

  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  const onDelete = (row) => {
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;

    const embarcacion = embarcaciones.find(
      (e) => Number(e.id) === Number(row.embarcacionId)
    );
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(row.documentoPescaId)
    );
    const activo = activos.find(
      (a) => Number(a.id) === Number(embarcacion?.activoId)
    );
    const descripcion = `${
      activo?.descripcion || `Embarcación ${row.embarcacionId}`
    } - ${documento?.descripcion || "Documento"}`;

    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarDocumentacionEmbarcacion(row.id);
      toast?.show({
        severity: "success",
        summary: "Documentación eliminada",
        detail: `La documentación ${descripcion} fue eliminada correctamente.`,
      });
      await cargarDocumentaciones();
    } catch (err) {
      if (err?.response?.data) {
        console.error(
          "[DocumentacionEmbarcacion] Error backend al eliminar:",
          JSON.stringify(err.response.data)
        );
        toast?.show({
          severity: "error",
          summary: "Error",
          detail:
            err.response.data?.message ||
            "No se pudo eliminar la documentación.",
        });
      } else {
        console.error("[DocumentacionEmbarcacion] Error inesperado:", err);
        toast?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la documentación.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowForm(false);
    setSelected(null);
    setIsEdit(false);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        embarcacionId: Number(data.embarcacionId),
        documentoPescaId: Number(data.documentoPescaId),
        observaciones: data.observaciones || null,
      };

      if (isEdit && selected) {
        await actualizarDocumentacionEmbarcacion(selected.id, payload);
        toast?.show({
          severity: "success",
          summary: "Documentación actualizada",
          detail: "La documentación fue actualizada correctamente.",
        });
      } else {
        await crearDocumentacionEmbarcacion(payload);
        toast?.show({
          severity: "success",
          summary: "Documentación creada",
          detail: "La documentación fue registrada correctamente.",
        });
      }
      setShowForm(false);
      setSelected(null);
      setIsEdit(false);
      cargarDocumentaciones();
    } catch (err) {
      if (err?.response?.data) {
        console.error(
          "[DocumentacionEmbarcacion] Respuesta de error backend:",
          JSON.stringify(err.response.data)
        );
      }
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la documentación.",
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroEmbarcacion(null);
    setFiltroDocumentoPesca(null);
    setGlobalFilter("");
  };

  // Conversión profesional de campos para edición
  const selectedDocumentacion = selected
    ? {
        ...selected,
        embarcacionId: selected.embarcacionId
          ? Number(selected.embarcacionId)
          : null,
        documentoPescaId: selected.documentoPescaId
          ? Number(selected.documentoPescaId)
          : null,
        observaciones: selected.observaciones || "",
      }
    : {};

  const documentacionesFiltradas = documentaciones.filter((doc) => {
    const embarcacion = embarcaciones.find(
      (e) => Number(e.id) === Number(doc.embarcacionId)
    );
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(doc.documentoPescaId)
    );
    const activo = activos.find(
      (a) => Number(a.id) === Number(embarcacion?.activoId)
    );

    const filtroEmbarcacionId = filtroEmbarcacion
      ? Number(filtroEmbarcacion)
      : null;
    const filtroDocumentoPescaId = filtroDocumentoPesca
      ? Number(filtroDocumentoPesca)
      : null;

    const matchEmbarcacion = filtroEmbarcacionId
      ? Number(doc.embarcacionId) === filtroEmbarcacionId
      : true;
    const matchDocumentoPesca = filtroDocumentoPescaId
      ? Number(doc.documentoPescaId) === filtroDocumentoPescaId
      : true;
    const matchGlobalFilter = globalFilter
      ? doc.observaciones?.toLowerCase().includes(globalFilter.toLowerCase())
      : true;

    return matchEmbarcacion && matchDocumentoPesca && matchGlobalFilter;
  });

  return (
    <div className="p-m-4">
      <Toast ref={setToast} />
      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            ¿Está seguro que desea{" "}
            <span style={{ color: "#b71c1c" }}>eliminar</span> esta
            documentación?
            <br />
            <span style={{ fontWeight: 400, color: "#b71c1c" }}>
              Esta acción no se puede deshacer.
            </span>
          </span>
        }
        header={<span style={{ color: "#b71c1c" }}>Confirmar eliminación</span>}
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        accept={handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={documentacionesFiltradas}
        loading={loading}
        paginator
        rows={10}
        selectionMode="single"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h2>Gestión de Documentación de Embarcaciones</h2>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Nuevo"
                icon="pi pi-plus"
                className="p-button-success"
                size="small"
                raised
                tooltip="Nueva Documentación"
                outlined
                onClick={onNew}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Dropdown
                value={filtroEmbarcacion}
                onChange={(e) => setFiltroEmbarcacion(Number(e.value))}
                options={embarcaciones}
                optionLabel="label"
                optionValue="id"
                placeholder="Filtrar Embarcación"
                showClear
                style={{ width: "250px", fontWeight: "bold" }}
                filter
                filterBy="label"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Dropdown
                value={filtroDocumentoPesca}
                onChange={(e) => setFiltroDocumentoPesca(Number(e.value))}
                options={documentosPesca}
                optionLabel="label"
                optionValue="id"
                placeholder="Filtrar Documento"
                showClear
                style={{ width: "250px", fontWeight: "bold" }}
                filter
                filterBy="label"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Button
                label="Limpiar Filtros"
                icon="pi pi-filter-slash"
                className="p-button-secondary"
                size="small"
                raised
                tooltip="Limpiar Filtros"
                outlined
                onClick={limpiarFiltros}
              />
            </div>
          </div>
        }
        onRowClick={(e) => onEdit(e.data)}
        globalFilter={globalFilter}
        globalFilterFields={["observaciones"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
      >
        <Column
          field="id"
          header="ID"
          sortable
          style={{ width: 80 }}
          body={(rowData) => (
            <span style={{ fontWeight: "bold", color: "#2196F3" }}>
              {rowData.id}
            </span>
          )}
        />
        <Column
          header="Embarcación"
          body={embarcacionTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Documento de Pesca"
          body={documentoPescaTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Observaciones"
          body={observacionesTemplate}
          style={{ minWidth: "200px" }}
        />
        <Column
          field="updatedAt"
          header="Actualizado"
          body={(rowData) => fechaTemplate(rowData, "updatedAt")}
          sortable
          style={{ width: 120 }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: 130, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={isEdit ? "Editar Documentación" : "Nueva Documentación"}
        visible={showForm}
        style={{ width: "50vw", minWidth: 400 }}
        modal
        className="p-fluid"
        onHide={onCancel}
        closeOnEscape
        dismissableMask
      >
        <DocumentacionEmbarcacionForm
          isEdit={isEdit}
          defaultValues={selectedDocumentacion}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
        />
      </Dialog>
    </div>
  );
}
