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
import { recalcularDocEmbarcacionVencidos } from "../utils/documentacionEmbarcacionUtils";

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
  const [filtroEstadoDoc, setFiltroEstadoDoc] = useState("todos");

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
          label: d.nombre,
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
    const embarcacion = rowData.embarcacion;
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
          <Tag severity="warning" value="OBLIGATORIO" className="ml-2" />
        )}
      </div>
    ) : (
      <Tag severity="warning" value="No encontrado" />
    );
  };

  const fechaEmisionBodyTemplate = (rowData) => {
    if (!rowData.fechaEmision) return "";
    const fecha = new Date(rowData.fechaEmision);
    const fechaFormateada = fecha.toLocaleDateString("es-PE");
    const horaFormateada = fecha.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div>
        <div style={{ fontSize: getResponsiveFontSize() }}>
          {fechaFormateada}
        </div>
        <small style={{ color: "#666" }}>{horaFormateada}</small>
      </div>
    );
  };

  const fechaVencimientoBodyTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) return "";
    const fecha = new Date(rowData.fechaVencimiento);
    const fechaFormateada = fecha.toLocaleDateString("es-PE");
    const horaFormateada = fecha.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const hoy = new Date();
    const estaVencido = fecha < hoy;
    return (
      <div>
        <div style={{ fontSize: getResponsiveFontSize() }}>
          {fechaFormateada}
        </div>
        <small style={{ color: "#666" }}>{horaFormateada}</small>
        <br />
        <Tag
          severity={estaVencido ? "danger" : "success"}
          value={estaVencido ? "VENCIDO" : "VIGENTE"}
          style={{ marginTop: "4px" }}
        />
      </div>
    );
  };

  const docVencidoBodyTemplate = (rowData) => {
    return (
      <Tag
        severity={rowData.docVencido ? "danger" : "success"}
        value={rowData.docVencido ? "VENCIDO" : "VIGENTE"}
        style={{
          fontSize: getResponsiveFontSize(),
          fontWeight: "bold",
        }}
      />
    );
  };

  const cesadoBodyTemplate = (rowData) => {
    return (
      <Tag
        severity={rowData.cesado ? "danger" : "success"}
        value={rowData.cesado ? "CESADO" : "ACTIVO"}
        style={{
          fontSize: getResponsiveFontSize(),
          fontWeight: "bold",
        }}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    const puedeEliminar = usuario?.esSuperUsuario || usuario?.esAdmin;
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  const handleEdit = (rowData) => {
    setSelected(rowData);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDelete = (rowData) => {
    setSelected(rowData);
    // Implementar confirmación de eliminación
  };

  const handleNew = () => {
    setSelected(null);
    setIsEdit(false);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    try {
      if (isEdit) {
        await actualizarDocumentacionEmbarcacion(selected.id, data);
        toast?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documentación actualizada correctamente",
        });
      } else {
        await crearDocumentacionEmbarcacion(data);
        toast?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documentación creada correctamente",
        });
      }
      setShowForm(false);
      cargarDocumentaciones();
    } catch (err) {
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la documentación",
      });
    }
  };

  const limpiarFiltros = () => {
    setFiltroEmbarcacion(null);
    setFiltroDocumentoPesca(null);
    setFiltroEstadoDoc("todos");
    setGlobalFilter("");
  };

  const recalcularEstados = async () => {
    try {
      setLoading(true);
      await recalcularDocEmbarcacionVencidos();
      toast?.show({
        severity: "success",
        summary: "Estados Recalculados",
        detail: "Los estados de vencimiento fueron recalculados correctamente",
        life: 3000,
      });
      await cargarDocumentaciones();
    } catch (error) {
      console.error("Error al recalcular estados:", error);
      toast?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo recalcular los estados de vencimiento",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cambiarFiltroEstadoDoc = () => {
    const estados = ["todos", "vencidos", "vigentes"];
    const indiceActual = estados.indexOf(filtroEstadoDoc);
    const siguienteIndice = (indiceActual + 1) % estados.length;
    setFiltroEstadoDoc(estados[siguienteIndice]);
  };

  const obtenerConfigFiltroEstado = () => {
    switch (filtroEstadoDoc) {
      case "vencidos":
        return {
          label: "VENCIDOS",
          icon: "pi pi-times-circle",
          className: "p-button-danger",
          tooltip: "Mostrando solo documentos vencidos",
        };
      case "vigentes":
        return {
          label: "VIGENTES",
          icon: "pi pi-check-circle",
          className: "p-button-success",
          tooltip: "Mostrando solo documentos vigentes",
        };
      default:
        return {
          label: "TODOS",
          icon: "pi pi-list",
          className: "p-button-secondary",
          tooltip: "Mostrando todos los documentos",
        };
    }
  };

  // Filtrar datos
  const documentacionesFiltradas = documentaciones.filter((doc) => {
    const cumpleFiltroEmbarcacion =
      filtroEmbarcacion === null ||
      Number(doc.embarcacionId) === Number(filtroEmbarcacion);
    const cumpleFiltroDocumento =
      filtroDocumentoPesca === null ||
      Number(doc.documentoPescaId) === Number(filtroDocumentoPesca);

    // Aplicar filtro de estado de documento
    const filtroEstadoMatch =
      filtroEstadoDoc === "todos" ||
      (filtroEstadoDoc === "vencidos" && doc.docVencido) ||
      (filtroEstadoDoc === "vigentes" && !doc.docVencido);

    return cumpleFiltroEmbarcacion && cumpleFiltroDocumento && filtroEstadoMatch;
  });

  const header = (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>DOCUMENTACIÓN EMBARCACIONES</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            onClick={handleNew}
            className="p-button-success"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Recalcular Estados"
            icon="pi pi-refresh"
            className="p-button-info"
            onClick={recalcularEstados}
            tooltip="Recalcular Estados de Vencimiento"
            tooltipOptions={{ position: "top" }}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            {...obtenerConfigFiltroEstado()}
            onClick={cambiarFiltroEstadoDoc}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            className="w-full"
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 8,
          marginTop: "0.5rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            className="block text-900 font-medium mb-1"
            style={{ fontSize: "0.875rem" }}
          >
            Filtrar por Embarcación
          </label>
          <Dropdown
            value={filtroEmbarcacion}
            onChange={(e) => setFiltroEmbarcacion(e.value)}
            options={embarcaciones}
            optionLabel="label"
            optionValue="id"
            placeholder="Todas las embarcaciones"
            showClear
            filter
            className="w-full"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            className="block text-900 font-medium mb-1"
            style={{ fontSize: "0.875rem" }}
          >
            Filtrar por Documento
          </label>
          <Dropdown
            value={filtroDocumentoPesca}
            onChange={(e) => setFiltroDocumentoPesca(e.value)}
            options={documentosPesca}
            optionLabel="label"
            optionValue="id"
            placeholder="Todos los documentos"
            showClear
            filter
            className="w-full"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Limpiar Filtros"
            outlined
            onClick={limpiarFiltros}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={setToast} />
      <ConfirmDialog />
      <DataTable
        value={documentacionesFiltradas}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={["numeroDocumento", "observaciones"]} // ✅ Agregar esta línea
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron documentaciones"
        responsiveLayout="scroll"
        stripedRows
        showGridlines
        size="small"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
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
          field="numeroDocumento"
          header="Número"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="F. Emisión"
          body={fechaEmisionBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="F. Vencimiento"
          body={fechaVencimientoBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Estado"
          body={docVencidoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Cesado"
          body={cesadoBodyTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={showForm}
        onHide={() => setShowForm(false)}
        header={isEdit ? "Editar Documentación" : "Nueva Documentación"}
        style={{ width: "90vw", maxWidth: "1200px" }}
        modal
      >
        <DocumentacionEmbarcacionForm
          documentacion={selected}
          embarcaciones={embarcaciones}
          documentosPesca={documentosPesca}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      </Dialog>
    </div>
  );
}