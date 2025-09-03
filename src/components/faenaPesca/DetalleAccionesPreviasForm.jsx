/**
 * DetalleAccionesPreviasForm.jsx
 *
 * Componente para mostrar y gestionar las acciones previas de faena de una temporada de pesca.
 * Sigue el patrón profesional ERP Megui basado en DetalleContactosEntidad.jsx.
 * Solo lectura - muestra los registros creados cuando se inicia la temporada.
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
import { ToggleButton } from "primereact/togglebutton";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import {
  obtenerDetAccionesPreviasFaenaPorTemporada,
  actualizarDetAccionesPreviasFaena,
} from "../../api/detAccionesPreviasFaena";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import DetAccionesPreviasFaenaForm from "../detAccionesPreviasFaena/DetAccionesPreviasFaenaForm";
import { Dialog } from "primereact/dialog";
import { getAllAccionesPreviasFaena } from "../../api/accionesPreviasFaena";

/**
 * Componente DetalleAccionesPreviasForm
 * @param {Object} props - Props del componente
 * @param {number} props.temporadaPescaId - ID de la temporada de pesca
 * @param {number} props.faenaPescaId - ID de la faena de pesca
 * @param {Array} props.personal - Array de personal para mostrar nombres completos
 */
const DetalleAccionesPreviasForm = forwardRef(
  ({ temporadaPescaId, faenaPescaId, personal = [] }, ref) => {
    // Estados del componente
    const [accionesPreviasData, setAccionesPreviasData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedAccion, setSelectedAccion] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [accionesPreviasCatalogo, setAccionesPreviasCatalogo] = useState([]);

    // Referencias
    const toast = useRef(null);
    const { usuario } = useAuthStore();

    // Función para cargar acciones previas desde la API
    const cargarAccionesPrevias = async () => {
      if (!temporadaPescaId) return;

      try {
        setLoading(true);
        const response = await obtenerDetAccionesPreviasFaenaPorTemporada(
          temporadaPescaId
        );
        setAccionesPreviasData(response);
      } catch (error) {
        console.error("❌ [FRONTEND] Error al cargar acciones previas:", error);
        setAccionesPreviasData([]);
        toast.current?.show({
          severity: "error",
          summary: "Error al Cargar",
          detail:
            error.response?.data?.message ||
            "Error al cargar las acciones previas desde el servidor",
          life: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Función para cargar catálogo de AccionesPreviasFaena
    const cargarCatalogoAccionesPrevias = async () => {
      try {
        const response = await getAllAccionesPreviasFaena();
        setAccionesPreviasCatalogo(response);
      } catch (error) {
        console.error("Error al cargar catálogo AccionesPreviasFaena:", error);
        setAccionesPreviasCatalogo([]);
      }
    };

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar: cargarAccionesPrevias,
    }));

    // Cargar acciones previas al montar el componente o cambiar temporadaPescaId
    useEffect(() => {
      cargarAccionesPrevias();
      cargarCatalogoAccionesPrevias();
    }, [temporadaPescaId]);

    // Template para mostrar el estado de completado
    const completadoTemplate = (rowData) => {
      return (
        <Tag
          value={rowData.cumplida ? "COMPLETADO" : "PENDIENTE"}
          severity={rowData.cumplida ? "success" : "danger"}
          style={{
            fontSize: getResponsiveFontSize(),
            fontWeight: "bold",
          }}
        />
      );
    };

    // Template para mostrar la acción previa
    const accionTemplate = (rowData) => {
      return (
        <span style={{ fontStyle: "italic" }}>
          {rowData.accionPrevia?.nombre || "N/A"}
        </span>
      );
    };

    // Template para mostrar el responsable
    const responsableTemplate = (rowData) => {
      const responsable = personal.find((p) => p.id === rowData.responsableId);
      return (
        responsable?.nombres + " " + responsable?.apellidos || "Sin asignar"
      );
    };

    // Template para mostrar el verificador
    const verificadorTemplate = (rowData) => {
      const verificador = personal.find((p) => p.id === rowData.verificadorId);
      return (
        verificador?.nombres + " " + verificador?.apellidos || "Sin asignar"
      );
    };

    // Template para mostrar fecha de creación
    const fechaCreacionTemplate = (rowData) => {
      return rowData.fechaCreacion
        ? new Date(rowData.fechaCreacion).toLocaleDateString("es-ES")
        : "N/A";
    };

    // Función para marcar acción como cumplida
    const marcarComoCumplida = async (rowData) => {
      try {
        setLoading(true);
        await actualizarDetAccionesPreviasFaena(rowData.id, {
          cumplida: true,
          fechaCumplida: new Date(),
        });

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Acción marcada como cumplida",
          life: 3000,
        });

        // Recargar datos
        await cargarAccionesPrevias();
      } catch (error) {
        console.error("Error al marcar como cumplida:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo marcar como cumplida",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Template para columna de acciones
    const accionesTemplate = (rowData) => {
      const puedeMarcarCumplida =
        rowData.urlConfirmaAccionPdf && rowData.verificado && !rowData.cumplida;

      return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            icon="pi pi-file-pdf"
            className="p-button-rounded p-button-text"
            disabled={!rowData.urlConfirmaAccionPdf}
            onClick={() =>
              abrirPdfEnNuevaPestana(
                rowData.urlConfirmaAccionPdf,
                toast,
                "No hay PDF de confirmación disponible"
              )
            }
            tooltip={
              rowData.urlConfirmaAccionPdf
                ? "Ver PDF de confirmación"
                : "No hay PDF de confirmación disponible"
            }
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-warning"
            onClick={() => editarAccionPrevia(rowData)}
            tooltip="Editar acción previa"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-check"
            className="p-button-danger"
            size="small"
            disabled={!puedeMarcarCumplida}
            onClick={() => marcarComoCumplida(rowData)}
            tooltip={
              !rowData.urlConfirmaAccionPdf
                ? "Requiere archivo PDF de confirmación"
                : !rowData.verificado
                ? "Debe estar verificado primero"
                : rowData.cumplida
                ? "Ya está marcada como cumplida"
                : "Marcar como cumplida"
            }
            tooltipOptions={{ position: "top" }}
          />
        </div>
      );
    };

    // Template para mostrar nombre de la embarcación
    const nombreEmbarcacionTemplate = (rowData) => {
      return rowData.faenaPesca?.embarcacion?.activo?.nombre || "-";
    };

    // Función para editar acción previa
    const editarAccionPrevia = (rowData) => {
      setSelectedAccion(rowData);
      setShowEditDialog(true);
    };

    // Función para manejar el submit del formulario de edición
    const handleEditSubmit = async (formData) => {
      try {
        setEditLoading(true);
        await actualizarDetAccionesPreviasFaena(selectedAccion.id, formData);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Acción previa actualizada correctamente",
          life: 3000,
        });
        
        setShowEditDialog(false);
        setSelectedAccion(null);
        await cargarAccionesPrevias();
      } catch (error) {
        console.error("Error al actualizar acción previa:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo actualizar la acción previa",
          life: 3000,
        });
      } finally {
        setEditLoading(false);
      }
    };

    // Función para cancelar edición
    const handleEditCancel = () => {
      setShowEditDialog(false);
      setSelectedAccion(null);
    };

    return (
      <div className="card">
        <DataTable
          value={accionesPreviasData}
          loading={loading}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron acciones previas para esta temporada"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          size="small"
          style={{
            fontSize: getResponsiveFontSize(),
          }}
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
                <h3 className="m-0">Acciones Previas de Faena</h3>
              </div>
              <div style={{ flex: 1 }}>
                <Tag
                  value={`${accionesPreviasData.length} registro${
                    accionesPreviasData.length !== 1 ? "s" : ""
                  }`}
                  severity="info"
                />
              </div>
              <div style={{ flex: 2 }}>
                <span className="p-input-icon-left">
                  <InputText
                    type="search"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "300px" }}
                  />
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  icon="pi pi-refresh"
                  className="p-button-outlined"
                  onClick={cargarAccionesPrevias}
                  tooltip="Actualizar lista"
                  tooltipOptions={{ position: "top" }}
                  type="button"
                />
              </div>
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            body={(rowData) => rowData.id}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="accionPrevia.nombre"
            header="Acción Previa"
            body={accionTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="cumplida"
            header="Estado"
            body={completadoTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="responsable.nombres"
            header="Responsable"
            body={responsableTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="verificador.nombres"
            header="Verificador"
            body={verificadorTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="faenaPesca.embarcacion.activo.nombre"
            header="Embarcación"
            body={nombreEmbarcacionTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="acciones"
            header="Acciones"
            body={accionesTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
        </DataTable>
        <Toast ref={toast} />
        
        {/* Dialog para editar acción previa */}
        <Dialog
          headerStyle={{ display: "none" }}
          visible={showEditDialog}
          onHide={handleEditCancel}
          style={{ width: "1300px" }}
          breakpoints={{ "960px": "85vw", "641px": "95vw" }}
          modal
        >
                {/* Mostrar descripción de acción previa con Tag */}
                <div className="flex justify-content-center mb-4">
                  <Tag
                    value={selectedAccion?.accionPrevia?.nombre || "N/A"}
                    severity="info"
                    style={{
                      fontSize: "1.1rem",
                      padding: "0.75rem 1.25rem",
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      textAlign: "center",
                      width: "100%",
                      marginTop: "0.5rem",
                    }}
                  />
                </div>
          {selectedAccion && (
            <DetAccionesPreviasFaenaForm
              isEdit={true}
              defaultValues={{
                faenaPescaId: selectedAccion.faenaPescaId,
                accionPreviaId: selectedAccion.accionPreviaId,
                responsableId: selectedAccion.responsableId,
                verificadorId: selectedAccion.verificadorId,
                fechaVerificacion: selectedAccion.fechaVerificacion,
                cumplida: selectedAccion.cumplida,
                fechaCumplida: selectedAccion.fechaCumplida,
                urlConfirmaAccionPdf: selectedAccion.urlConfirmaAccionPdf,
                observaciones: selectedAccion.observaciones,
                verificado: selectedAccion.verificado,
              }}
              faenas={[]}
              acciones={accionesPreviasCatalogo}
              personal={personal}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              loading={editLoading}
            />
          )}
        </Dialog>
      </div>
    );
  }
);

DetalleAccionesPreviasForm.displayName = "DetalleAccionesPreviasForm";

export default DetalleAccionesPreviasForm;
