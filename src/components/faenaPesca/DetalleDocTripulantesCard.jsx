/**
 * DetalleDocTripulantesCard.jsx
 *
 * Componente para mostrar y gestionar los documentos de tripulantes de una faena de pesca.
 * Permite listar, crear y editar registros de DetalleDocTripulantes.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { getResponsiveFontSize } from "../../utils/utils";
import DetalleDocTripulantesForm from "../detalleDocTripulantes/DetalleDocTripulantesForm";
import {
  getDetallesDocTripulantes,
  crearDetalleDocTripulantes,
  actualizarDetalleDocTripulantes,
  eliminarDetalleDocTripulantes,
} from "../../api/detalleDocTripulantes";

const DetalleDocTripulantesCard = ({
  faenaPescaId,
  temporadaData,
  personal = [],
  documentosPesca = [],
  loading = false,
  onDataChange,
  onDocTripulantesChange, // Callback para notificar cambios
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [docTripulantes, setDocTripulantes] = useState([]);
  const [selectedDocTripulante, setSelectedDocTripulante] = useState(null);
  const [docTripulanteDialog, setDocTripulanteDialog] = useState(false);
  const [editingDocTripulante, setEditingDocTripulante] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroTripulante, setFiltroTripulante] = useState(null);
  const [filtroDocumento, setFiltroDocumento] = useState(null);

  // Estados para opciones de filtros dinámicos
  const [opcionesTripulante, setOpcionesTripulante] = useState([]);
  const [opcionesDocumento, setOpcionesDocumento] = useState([]);

  // Estados para props normalizadas
  const [tripulantes, setTripulantes] = useState(null);

  // Opciones fijas para el SelectButton de estado
  const opcionesEstado = [
    { label: "PENDIENTE", value: false },
    { label: "VERIFICADO", value: true },
  ];

  useEffect(() => {
    if (faenaPescaId) {
      cargarDocTripulantes();
    }
  }, [faenaPescaId]);

  // Actualizar opciones de filtros cuando cambien los datos
  useEffect(() => {
    actualizarOpcionesFiltros();
  }, [docTripulantes, personal, documentosPesca]);

  const actualizarOpcionesFiltros = () => {
    if (!docTripulantes.length) return;

    // Filtro de Tripulante
    const tripulantesUnicos = [
      ...new Set(docTripulantes.map((doc) => doc.tripulanteId).filter(Boolean)),
    ];
    const opcionesTripulanteNuevas = tripulantesUnicos
      .map((tripulanteId) => {
        const tripulanteEncontrado = personal.find(
          (p) => Number(p.id) === Number(tripulanteId)
        );
        return {
          label: tripulanteEncontrado
            ? `${tripulanteEncontrado.nombres} ${tripulanteEncontrado.apellidos}`
            : `ID: ${tripulanteId}`,
          value: tripulanteId,
        };
      })
      .filter((option) => option.label !== `ID: ${option.value}`);
    setOpcionesTripulante(opcionesTripulanteNuevas);

    // Filtro de Documento
    const documentosUnicos = [
      ...new Set(docTripulantes.map((doc) => doc.documentoId).filter(Boolean)),
    ];
    const opcionesDocumentoNuevas = documentosUnicos
      .map((documentoId) => {
        const documentoEncontrado = documentosPesca.find(
          (d) => Number(d.id) === Number(documentoId)
        );
        return {
          label: documentoEncontrado
            ? documentoEncontrado.nombre
            : `ID: ${documentoId}`,
          value: documentoId,
        };
      })
      .filter((option) => option.label !== `ID: ${option.value}`);
    setOpcionesDocumento(opcionesDocumentoNuevas);
  };

  const cargarDocTripulantes = async () => {
    try {
      setLoadingData(true);
      const response = await getDetallesDocTripulantes({ faenaPescaId });
      setDocTripulantes(response || []);
    } catch (error) {
      console.error("Error al cargar documentos de tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los documentos de tripulantes",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setEditingDocTripulante(null);
    setDocTripulanteDialog(true);
  };

  const editDocTripulante = (docTripulante) => {
    setEditingDocTripulante(docTripulante);
    setDocTripulanteDialog(true);
  };

  const hideDialog = () => {
    setDocTripulanteDialog(false);
    setEditingDocTripulante(null);
  };

  const saveDocTripulante = async (docTripulanteData) => {
    try {
      setLoadingData(true);

      const dataToSend = {
        ...docTripulanteData,
        faenaPescaId: Number(faenaPescaId),
        tripulanteId: docTripulanteData.tripulanteId
          ? Number(docTripulanteData.tripulanteId)
          : null,
        documentoId: docTripulanteData.documentoId
          ? Number(docTripulanteData.documentoId)
          : null,
      };

      if (editingDocTripulante) {
        await actualizarDetalleDocTripulantes(
          editingDocTripulante.id,
          dataToSend
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento de tripulante actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetalleDocTripulantes(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento de tripulante creado correctamente",
          life: 3000,
        });
      }

      await cargarDocTripulantes();
      hideDialog();

      // Notificar cambios al componente padre
      if (onDocTripulantesChange) {
        onDocTripulantesChange();
      }
    } catch (error) {
      console.error("Error al guardar documento de tripulante:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el documento de tripulante",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const confirmDeleteDocTripulante = (docTripulante) => {
    setSelectedDocTripulante(docTripulante);
    // Implementar confirmación de eliminación si es necesario
  };

  // Función para filtrar datos
  const datosFiltrados = docTripulantes.filter((doc) => {
    const cumpleFiltroEstado =
      filtroEstado === null || doc.verificado === filtroEstado;
    const cumpleFiltroTripulante =
      filtroTripulante === null ||
      Number(doc.tripulanteId) === Number(filtroTripulante);
    const cumpleFiltroDocumento =
      filtroDocumento === null ||
      Number(doc.documentoId) === Number(filtroDocumento);

    return (
      cumpleFiltroEstado && cumpleFiltroTripulante && cumpleFiltroDocumento
    );
  });

  const limpiarFiltros = () => {
    setFiltroEstado(null);
    setFiltroTripulante(null);
    setFiltroDocumento(null);
    setGlobalFilter("");
  };

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
          <h2>DOCUMENTOS TRIPULACION</h2>
        </div>
        <div style={{ flex: 1 }}>
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar documentos..."
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            className="block text-900 font-medium mb-1"
            style={{ fontSize: "0.875rem" }}
          >
            Filtrar por Estado
          </label>
          <SelectButton
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.value)}
            options={opcionesEstado}
            allowEmpty={true}
            className="w-full"
            style={{ fontSize: "0.875rem" }}
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
            Filtrar por Tripulante
          </label>
          <Dropdown
            value={filtroTripulante}
            onChange={(e) => setFiltroTripulante(e.value)}
            options={opcionesTripulante}
            placeholder="Todos los tripulantes"
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
            value={filtroDocumento}
            onChange={(e) => setFiltroDocumento(e.value)}
            options={opcionesDocumento}
            placeholder="Todos los documentos"
            showClear
            filter
            className="w-full"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            className="block text-900 font-medium mb-1"
            style={{ fontSize: "0.875rem", visibility: "hidden" }}
          >
            Acciones
          </label>
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="p-button-outlined p-button-secondary w-full"
            onClick={limpiarFiltros}
            size="small"
            style={{ fontSize: "0.875rem" }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <Toast ref={toast} />
      <DataTable
        value={datosFiltrados}
        selection={selectedDocTripulante}
        onSelectionChange={(e) => setSelectedDocTripulante(e.value)}
        dataKey="id"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron documentos de tripulantes."
        header={header}
        loading={loadingData}
        size="small"
        stripedRows
        showGridlines
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          field="tripulante"
          header="Tripulante"
          body={(rowData) => {
            const tripulanteEncontrado = personal.find(
              (p) => Number(p.id) === Number(rowData.tripulanteId)
            );
            return (
              <span style={{ fontStyle: "italic" }}>
                {tripulanteEncontrado
                  ? `${tripulanteEncontrado.nombres} ${tripulanteEncontrado.apellidos}`
                  : "N/A"}
              </span>
            );
          }}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="documento"
          header="Documento"
          body={(rowData) => {
            const documentoPescaEncontrado = documentosPesca.find(
              (d) => Number(d.id) === Number(rowData.documentoId)
            );
            return (
              <span style={{ fontWeight: "bold" }}>
                {documentoPescaEncontrado
                  ? documentoPescaEncontrado.nombre
                  : "N/A"}
              </span>
            );
          }}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="numeroDocumento"
          header="Número"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="fechaEmision"
          header="F. Emisión"
          body={(rowData) =>
            rowData.fechaEmision
              ? new Date(rowData.fechaEmision).toLocaleDateString("es-ES")
              : "-"
          }
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="fechaVencimiento"
          header="F. Vencimiento"
          body={(rowData) =>
            rowData.fechaVencimiento
              ? new Date(rowData.fechaVencimiento).toLocaleDateString("es-ES")
              : "-"
          }
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="verificado"
          header="Estado"
          body={(rowData) => (
            <Tag
              value={rowData.verificado ? "VERIFICADO" : "PENDIENTE"}
              severity={rowData.verificado ? "success" : "warning"}
              style={{
                fontSize: getResponsiveFontSize(),
                fontWeight: "bold",
              }}
            />
          )}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          body={(rowData) => (
            <div className="flex gap-2">
              <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-success p-button-sm"
                onClick={() => editDocTripulante(rowData)}
                tooltip="Editar"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          )}
          header="Acciones"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={docTripulanteDialog}
        style={{ width: "800px" }}
        header={
          editingDocTripulante
            ? "Editar Documento de Tripulante"
            : "Nuevo Documento de Tripulante"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        {docTripulanteDialog && (
          <DetalleDocTripulantesForm
            isEdit={!!editingDocTripulante}
            defaultValues={
              editingDocTripulante || { faenaPescaId: Number(faenaPescaId) }
            }
            tripulantes={tripulantes}
            documentos={documentosPesca}
            onSubmit={saveDocTripulante}
            onCancel={hideDialog}
            loading={loadingData}
            toast={toast}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default DetalleDocTripulantesCard;
