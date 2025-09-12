// src/pages/DocumentacionPersonal.jsx
// Pantalla CRUD profesional para DocumentacionPersonal. Cumple la regla transversal ERP Megui.
// Sigue el patrón estándar de DocumentacionEmbarcacion.jsx con templates profesionales y control de roles.

import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import DocumentacionPersonalForm from "../components/documentacionPersonal/DocumentacionPersonalForm";
import {
  getAllDocumentacionPersonal,
  crearDocumentacionPersonal,
  actualizarDocumentacionPersonal,
  eliminarDocumentacionPersonal,
} from "../api/documentacionPersonal";
import { getPersonal } from "../api/personal";
import { getDocumentosPesca } from "../api/documentoPesca";
import { getEmpresas } from "../api/empresa";
import { getCargosPersonal } from "../api/cargosPersonal";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../utils/utils";
import { recalcularDocPersonalVencidos } from "../utils/documentacionPersonalUtils";
import { abrirPdfEnNuevaPestana } from "../utils/pdfUtils";

/**
 * Página de gestión de documentación de personal.
 * Cumple la regla transversal ERP Megui:
 * - Edición profesional por clic en fila (abre modal).
 * - Botón de eliminar solo visible para superusuario o admin (usuario?.esSuperUsuario || usuario?.esAdmin), usando useAuthStore.
 * - Confirmación de borrado con ConfirmDialog visual rojo.
 * - Feedback visual con Toast.
 * - Documentación de la regla en el encabezado.
 */
export default function DocumentacionPersonal() {
  // Obtener usuario autenticado para control de permisos
  const usuario = useAuthStore((state) => state.usuario);

  const [documentaciones, setDocumentaciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para filtros específicos
  const [filtroPersonal, setFiltroPersonal] = useState(null);
  const [filtroDocumentoPesca, setFiltroDocumentoPesca] = useState(null);
  const [filtroCargo, setFiltroCargo] = useState(null);
  const [filtroEstadoDoc, setFiltroEstadoDoc] = useState("todos");

  // Estados para combos de referencia
  const [personal, setPersonal] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargosPersonal, setCargosPersonal] = useState([]);

  // Estados para confirmación de eliminación
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });

  // Carga inicial de datos
  useEffect(() => {
    cargarDocumentaciones();
    cargarCombosReferencia();
  }, []);

  const cargarDocumentaciones = async () => {
    setLoading(true);
    try {
      const data = await getAllDocumentacionPersonal();
      setDocumentaciones(data);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la documentación de personal",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarCombosReferencia = async () => {
    try {
      const [personalRes, documentosPescaRes, empresasRes, cargosPersonalRes] =
        await Promise.allSettled([
          getPersonal(),
          getDocumentosPesca(),
          getEmpresas(),
          getCargosPersonal(),
        ]);

      if (personalRes.status === "fulfilled") {
        const empresasData =
          empresasRes.status === "fulfilled" ? empresasRes.value : [];
        const personalData = personalRes.value.map((p) => {
          const empresa = empresasData.find(
            (e) => Number(e.id) === Number(p.empresaId)
          );
          return {
            ...p,
            id: Number(p.id),
            label: `${p.nombres} ${p.apellidos} - ${
              empresa?.nombreComercial || "Sin empresa"
            }`,
          };
        });
        setPersonal(personalData);
      }
      if (documentosPescaRes.status === "fulfilled") {
        const documentosData = documentosPescaRes.value.map((d) => ({
          ...d,
          id: Number(d.id),
          label: d.descripcion,
        }));
        setDocumentosPesca(documentosData);
      }
      if (empresasRes.status === "fulfilled") {
        const empresasData = empresasRes.value.map((e) => ({
          ...e,
          id: Number(e.id),
          label: e.nombreComercial,
        }));
        setEmpresas(empresasData);
      }
      if (cargosPersonalRes.status === "fulfilled") {
        const cargosData = cargosPersonalRes.value.map((c) => ({
          ...c,
          id: Number(c.id),
          label: c.descripcion,
        }));
        setCargosPersonal(cargosData);
      }
    } catch (err) {
      console.error("Error al cargar combos de referencia:", err);
    }
  };

  // Templates profesionales para visualización
  const personalTemplate = (rowData) => {
    const persona = personal.find(
      (p) => Number(p.id) === Number(rowData.personalId)
    );
    const empresa = empresas.find(
      (e) => Number(e.id) === Number(persona?.empresaId)
    );
    return persona ? (
      <div>
        <strong style={{ color: "#2196F3" }}>
          {persona.nombres} {persona.apellidos}
        </strong>
        <br />
        <small>{empresa?.nombreComercial || "Sin empresa"}</small>
      </div>
    ) : (
      <Tag severity="warning" value="No encontrado" />
    );
  };

  const documentoPescaTemplate = (rowData) => {
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(rowData.documentoPescaId)
    );
    return documento ? (
      <div>
        <strong>{documento.nombre}</strong>
        <br />
        <small>{documento.descripcion}</small>
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

  const cargoTemplate = (rowData) => {
    return rowData.cargoNombre ? (
      <div>
        <strong style={{ color: "#4CAF50" }}>{rowData.cargoNombre}</strong>
      </div>
    ) : (
      <Tag severity="secondary" value="Sin cargo" />
    );
  };

  // Template para fecha de vencimiento
  const fechaVencimientoTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) {
      return <Tag severity="secondary" value="Sin fecha" />;
    }

    const fechaVencimiento = new Date(rowData.fechaVencimiento);
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);

    const esVencido = fechaVencimiento < fechaActual;

    return (
      <div
        style={{
          color: esVencido ? "#d32f2f" : "#2e7d32",
          fontWeight: "bold",
        }}
      >
        {fechaVencimiento.toLocaleDateString("es-PE")}
      </div>
    );
  };

  // Template para estado de documento vencido
  const docVencidoTemplate = (rowData) => {
    const esVencido = rowData.docVencido;

    return (
      <Tag
        severity={esVencido ? "danger" : "success"}
        value={esVencido ? "VENCIDO" : "VIGENTE"}
        icon={esVencido ? "pi pi-times" : "pi pi-check"}
        style={{ fontWeight: "bold" }}
      />
    );
  };

  // Funciones de CRUD
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

  const onDelete = (row) => {
    setConfirmState({ visible: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;

    const persona = personal.find(
      (p) => Number(p.id) === Number(row.personalId)
    );
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(row.documentoPescaId)
    );
    const descripcion = `${persona?.nombres || `Personal ${row.personalId}`} ${
      persona?.apellidos || ""
    } - ${documento?.descripcion || "Documento"}`;

    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await eliminarDocumentacionPersonal(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: `Se eliminó la documentación: ${descripcion}`,
      });
      cargarDocumentaciones();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            err.response.data?.message ||
            "No se pudo eliminar la documentación.",
        });
      } else {
        console.error("[DocumentacionPersonal] Error inesperado:", err);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error inesperado al eliminar la documentación.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit && selected?.id) {
        await actualizarDocumentacionPersonal(selected.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Documentación actualizada correctamente",
        });
      } else {
        await crearDocumentacionPersonal(data);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Documentación creada correctamente",
        });
      }
      setShowForm(false);
      setSelected(null);
      setIsEdit(false);
      cargarDocumentaciones();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la documentación",
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setShowForm(false);
    setSelected(null);
    setIsEdit(false);
  };

  // Conversión profesional de campos para edición
  const selectedDocumentacion = selected
    ? {
        ...selected,
        personalId: selected.personalId ? Number(selected.personalId) : null,
        documentoPescaId: selected.documentoPescaId
          ? Number(selected.documentoPescaId)
          : null,
        observaciones: selected.observaciones || "",
      }
    : {};

  // Función para filtrar documentaciones
  const documentacionesFiltradas = documentaciones
    .map((doc) => {
      const persona = personal.find(
        (p) => Number(p.id) === Number(doc.personalId)
      );
      const documento = documentosPesca.find(
        (d) => Number(d.id) === Number(doc.documentoPescaId)
      );
      const cargo = cargosPersonal.find(
        (c) => Number(c.id) === Number(persona?.cargoId)
      );

      // Crear copia con campos virtuales para ordenamiento
      return {
        ...doc,
        personalNombre: persona
          ? `${persona.nombres} ${persona.apellidos}`
          : "",
        documentoPescaNombre: documento ? documento.nombre : "",
        cargoNombre: cargo ? cargo.descripcion : "",
      };
    })
    .filter((doc) => {
      // Aplicar filtros
      const filtroPersonalMatch = filtroPersonal
        ? Number(doc.personalId) === Number(filtroPersonal)
        : true;
      const filtroDocumentoMatch = filtroDocumentoPesca
        ? Number(doc.documentoPescaId) === Number(filtroDocumentoPesca)
        : true;

      // Buscar la persona para obtener su cargoId
      const persona = personal.find(
        (p) => Number(p.id) === Number(doc.personalId)
      );
      const filtroCargoMatch = filtroCargo
        ? Number(persona?.cargoId) === Number(filtroCargo)
        : true;

      // Aplicar filtro de estado de documento
      const filtroEstadoMatch =
        filtroEstadoDoc === "todos" ||
        (filtroEstadoDoc === "vencidos" && doc.docVencido) ||
        (filtroEstadoDoc === "vigentes" && !doc.docVencido);

      return (
        filtroPersonalMatch &&
        filtroDocumentoMatch &&
        filtroCargoMatch &&
        filtroEstadoMatch
      );
    });

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroPersonal(null);
    setFiltroDocumentoPesca(null);
    setFiltroCargo(null);
    setFiltroEstadoDoc("todos");
    setGlobalFilter("");
  };

  // Función para recalcular y guardar estados en base de datos
  const recalcularEstados = async () => {
    try {
      await recalcularDocPersonalVencidos(toast);
      // Recargar datos después de la actualización
      cargarDocumentaciones();
    } catch (error) {
      // El error ya se maneja en la función utilitaria
      console.error("Error en recalcularEstados:", error);
    }
  };

  // Función para cambiar filtro de estado de documento
  const cambiarFiltroEstadoDoc = () => {
    const estados = ["todos", "vencidos", "vigentes"];
    const indiceActual = estados.indexOf(filtroEstadoDoc);
    const siguienteIndice = (indiceActual + 1) % estados.length;
    setFiltroEstadoDoc(estados[siguienteIndice]);
  };

  // Función para obtener configuración del filtro de estado
  const obtenerConfigFiltroEstado = () => {
    switch (filtroEstadoDoc) {
      case "vencidos":
        return {
          label: "Vencidos",
          icon: "pi pi-times-circle",
          className: "p-button-danger",
          size: "small",
          raised: true,
          tooltip: "Mostrando solo documentos vencidos",
        };
      case "vigentes":
        return {
          label: "Vigentes",
          icon: "pi pi-check-circle",
          className: "p-button-success",
          size: "small",
          raised: true,
          tooltip: "Mostrando solo documentos vigentes",
        };
      default:
        return {
          label: "Todos los Estados",
          icon: "pi pi-list",
          className: "p-button-secondary",
          size: "small",
          raised: true,
          tooltip: "Mostrando todos los documentos",
        };
    }
  };

  // Template para botones de acción
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text"
          disabled={!rowData.urlDocPdf}
          onClick={() =>
            abrirPdfEnNuevaPestana(
              rowData.urlDocPdf,
              toast,
              "No hay PDF de documentación disponible"
            )
          }
          tooltip={
            rowData.urlDocPdf
              ? "Ver PDF de documentación"
              : "No hay PDF de documentación disponible"
          }
          tooltipOptions={{ position: "top" }}
        />
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
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
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
        sortField="id"
        sortOrder={-1}
        header={
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <h2>Documentación Requerida Tripulantes</h2>
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
              <div style={{ flex: 2 }}>
                <Button
                  label="Recalcular Estados"
                  icon="pi pi-refresh"
                  className="p-button-info"
                  size="small"
                  raised
                  tooltip="Recalcular Estados"
                  onClick={recalcularEstados}
                />
              </div>
              <div style={{ flex: 2 }}>
                <Button
                  {...obtenerConfigFiltroEstado()}
                  onClick={cambiarFiltroEstadoDoc}
                />
              </div>
              <div style={{ flex: 2 }}>
                <Button
                  label="Limpiar Filtros"
                  icon="pi pi-filter-slash"
                  className="p-button-warning"
                  size="small"
                  raised
                  tooltip="Limpiar Filtros"
                  onClick={limpiarFiltros}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "0.25rem",
                gap: "0.25rem",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <Dropdown
                  value={filtroPersonal}
                  onChange={(e) => setFiltroPersonal(Number(e.value))}
                  options={personal}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Filtrar Personal"
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
                <Dropdown
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(Number(e.value))}
                  options={cargosPersonal}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Filtrar Cargo"
                  showClear
                  style={{ width: "250px", fontWeight: "bold" }}
                  filter
                  filterBy="label"
                />
              </div>

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
          header="Cargo"
          body={cargoTemplate}
          sortable
          field="cargoNombre"
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Personal"
          body={personalTemplate}
          sortable
          field="personalNombre"
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Documento de Pesca"
          body={documentoPescaTemplate}
          sortable
          field="documentoPescaNombre"
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Fecha Vencimiento"
          body={fechaVencimientoTemplate}
          sortable
          field="fechaVencimiento"
          style={{ minWidth: "130px", textAlign: "center" }}
        />
        <Column
          header="Estado"
          body={docVencidoTemplate}
          sortable
          field="docVencido"
          style={{ minWidth: "120px", textAlign: "center" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: 180, textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={isEdit ? "Editar Documentación" : "Nueva Documentación"}
        visible={showForm}
        style={{ width: 1300 }}
        onHide={onCancel}
        modal
        maximizable
      >
        <DocumentacionPersonalForm
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
