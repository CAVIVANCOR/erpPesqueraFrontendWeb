// src/components/faenaPescaConsumo/DetalleDocTripulantesConsumoCard.jsx
// Card para gestionar documentos de tripulantes de FaenaPescaConsumo
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import { getResponsiveFontSize } from "../../utils/utils";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import {
  getDetDocTripulantesFaenaConsumo,
  crearDetDocTripulantesFaenaConsumo,
  actualizarDetDocTripulantesFaenaConsumo,
  eliminarDetDocTripulantesFaenaConsumo,
} from "../../api/detDocTripulantesFaenaConsumo";
import { getAllDocumentacionPersonal } from "../../api/documentacionPersonal";
import DetDocTripulantesFaenaConsumoForm from "../detDocTripulantesFaenaConsumo/DetDocTripulantesFaenaConsumoForm";

export default function DetalleDocTripulantesConsumoCard({
  faenaPescaConsumoId,
  documentosPesca = [],
  personal = [],
  onDataChange,
}) {
  const [documentos, setDocumentos] = useState([]);
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroTripulante, setFiltroTripulante] = useState(null);
  const [filtroDocumento, setFiltroDocumento] = useState(null);
  const [filtroVencidos, setFiltroVencidos] = useState(null);

  // Estados para controlar el ordenamiento
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState(-1);

  // Estados para opciones de filtros dinámicos
  const [opcionesTripulante, setOpcionesTripulante] = useState([]);
  const [opcionesDocumento, setOpcionesDocumento] = useState([]);

  // Estados para props normalizadas
  const [tripulantesNormalizados, setTripulantesNormalizados] = useState([]);
  const [documentosNormalizados, setDocumentosNormalizados] = useState([]);

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarDocumentos();
    }
  }, [faenaPescaConsumoId]);

  // Actualizar opciones de filtros cuando cambien los datos
  useEffect(() => {
    actualizarOpcionesFiltros();
  }, [documentos, personal, documentosPesca]);

  useEffect(() => {
    // Normalizar personal para el formulario
    const tripulantesFormateados = personal.map((p) => ({
      label: `${p.nombres} ${p.apellidos}`,
      value: Number(p.id),
      ...p,
    }));
    setTripulantesNormalizados(tripulantesFormateados);

    // Normalizar documentos para el formulario
    const documentosFormateados = documentosPesca
      .filter((d) => d.paraTripulantes === true)
      .map((d) => ({
        label: d.nombre || d.descripcion,
        value: Number(d.id),
        ...d,
      }));
    setDocumentosNormalizados(documentosFormateados);
  }, [personal, documentosPesca]);

  const actualizarOpcionesFiltros = () => {
    if (!documentos.length) return;

    // Filtro de Tripulante
    const tripulantesUnicos = [
      ...new Set(documentos.map((doc) => doc.tripulanteId).filter(Boolean)),
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
      ...new Set(documentos.map((doc) => doc.documentoId).filter(Boolean)),
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

  const cargarDocumentos = async () => {
    try {
      setLoadingData(true);
      const response = await getDetDocTripulantesFaenaConsumo({
        faenaPescaConsumoId,
      });
      setDocumentos(response || []);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
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

  const cargarDocumentosTripulantes = async () => {
    try {
      setLoadingData(true);

      // 1. Filtrar personal por paraPescaConsumo=true, cargoId y cesado=false
      const tripulantesEmbarcacion = personal.filter(
        (p) =>
          p.paraPescaConsumo === true &&
          (Number(p.cargoId) === 21 || // TRIPULANTE EMBARCACION
            Number(p.cargoId) === 22 || // PATRON EMBARCACION
            Number(p.cargoId) === 14) && // MOTORISTA EMBARCACION
          p.cesado === false
      );

      if (tripulantesEmbarcacion.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin Tripulantes",
          detail:
            "No se encontraron tripulantes disponibles para pesca consumo",
          life: 3000,
        });
        return;
      }

      // 2. Obtener IDs de los tripulantes filtrados
      const tripulantesIds = tripulantesEmbarcacion.map((t) => Number(t.id));

      // 3. Obtener todos los documentos de personal
      const todosLosDocumentos = await getAllDocumentacionPersonal();

      // 4. Filtrar documentos que pertenecen a los tripulantes
      const documentosTripulantes = todosLosDocumentos.filter((doc) =>
        tripulantesIds.includes(Number(doc.personalId))
      );

      if (documentosTripulantes.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin Documentos",
          detail: "No se encontraron documentos para los tripulantes",
          life: 3000,
        });
        return;
      }

      // 5. Obtener documentos existentes en DetDocTripulantesFaenaConsumo
      const documentosExistentes = await getDetDocTripulantesFaenaConsumo({
        faenaPescaConsumoId,
      });

      // 6. Crear o actualizar registros
      let creados = 0;
      let actualizados = 0;
      let errores = 0;

      for (const docPersonal of documentosTripulantes) {
        try {
          // Calcular docVencido
          const fechaActual = new Date();
          const fechaVencimiento = docPersonal.fechaVencimiento
            ? new Date(docPersonal.fechaVencimiento)
            : null;
          const docVencido =
            !fechaVencimiento || fechaVencimiento < fechaActual;

          const dataToSend = {
            faenaPescaConsumoId: Number(faenaPescaConsumoId),
            tripulanteId: Number(docPersonal.personalId),
            documentoId: Number(docPersonal.documentoPescaId),
            numeroDocumento: docPersonal.numeroDocumento || null,
            fechaEmision: docPersonal.fechaEmision || null,
            fechaVencimiento: docPersonal.fechaVencimiento || null,
            urlDocTripulantePdf: docPersonal.urlDocPdf || null,
            docVencido: docVencido,
            verificado: false,
            observaciones: docPersonal.observaciones || null,
            updatedAt: new Date().toISOString(),
          };

          // Verificar si ya existe el documento
          const documentoExistente = documentosExistentes.find(
            (d) =>
              Number(d.faenaPescaConsumoId) === Number(faenaPescaConsumoId) &&
              Number(d.tripulanteId) === Number(docPersonal.personalId) &&
              Number(d.documentoId) === Number(docPersonal.documentoPescaId)
          );

          if (documentoExistente) {
            // Actualizar documento existente
            await actualizarDetDocTripulantesFaenaConsumo(
              documentoExistente.id,
              dataToSend
            );
            actualizados++;
          } else {
            // Crear nuevo documento
            await crearDetDocTripulantesFaenaConsumo(dataToSend);
            creados++;
          }
        } catch (error) {
          console.error("Error al procesar documento:", error);
          errores++;
        }
      }

      // 7. Mostrar resultado
      if (creados > 0 || actualizados > 0) {
        toast.current?.show({
          severity: "success",
          summary: "Documentos Procesados",
          detail: `${creados} creado(s), ${actualizados} actualizado(s)${
            errores > 0 ? `. ${errores} error(es)` : ""
          }`,
          life: 4000,
        });

        await cargarDocumentos();

        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo procesar ningún documento",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al cargar documentos de tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los documentos de los tripulantes",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setEditingDocumento(null);
    setDialogVisible(true);
  };

  const editDocumento = (documento) => {
    setEditingDocumento(documento);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setEditingDocumento(null);
  };

  const verificarDocumento = async (rowData) => {
    try {
      setLoadingData(true);
      const nuevoEstado = !rowData.verificado;

      await actualizarDetDocTripulantesFaenaConsumo(rowData.id, {
        ...rowData,
        verificado: nuevoEstado,
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Documento ${
          nuevoEstado ? "verificado" : "marcado como pendiente"
        } correctamente`,
        life: 3000,
      });

      cargarDocumentos();
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error al verificar documento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar el estado del documento",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Datos filtrados
  const datosFiltrados = documentos.filter((doc) => {
    const cumpleFiltroEstado =
      filtroEstado === null || doc.verificado === filtroEstado;
    const cumpleFiltroTripulante =
      filtroTripulante === null ||
      Number(doc.tripulanteId) === Number(filtroTripulante);
    const cumpleFiltroDocumento =
      filtroDocumento === null ||
      Number(doc.documentoId) === Number(filtroDocumento);

    // Filtro por vencidos
    let cumpleFiltroVencidos = true;
    if (filtroVencidos !== null) {
      const fechaActual = new Date();
      const fechaVencimiento = doc.fechaVencimiento
        ? new Date(doc.fechaVencimiento)
        : null;
      const estaVencido = !fechaVencimiento || fechaVencimiento < fechaActual;
      cumpleFiltroVencidos = estaVencido === filtroVencidos;
    }

    return (
      cumpleFiltroEstado &&
      cumpleFiltroTripulante &&
      cumpleFiltroDocumento &&
      cumpleFiltroVencidos
    );
  });

  const limpiarFiltros = () => {
    setFiltroEstado(null);
    setFiltroTripulante(null);
    setFiltroDocumento(null);
    setFiltroVencidos(null);
    setGlobalFilter("");
  };

  // Funciones para el filtro toggle de Estado
  const handleToggleEstado = () => {
    if (filtroEstado === null) {
      setFiltroEstado(false);
    } else if (filtroEstado === false) {
      setFiltroEstado(true);
    } else {
      setFiltroEstado(null);
    }
  };

  const getEstadoButtonLabel = () => {
    if (filtroEstado === null) return "TODOS";
    if (filtroEstado === false) return "PENDIENTES";
    return "VERIFICADOS";
  };

  const getEstadoButtonClass = () => {
    if (filtroEstado === null) return "p-button-outlined";
    if (filtroEstado === false) return "p-button-warning";
    return "p-button-success";
  };

  const getEstadoButtonIcon = () => {
    if (filtroEstado === null) return "pi pi-filter";
    if (filtroEstado === false) return "pi pi-clock";
    return "pi pi-check-circle";
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
          <small style={{ color: "#666", fontWeight: "normal" }}>
            Total de registros: {datosFiltrados.length}
          </small>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            icon="pi pi-download"
            label="Cargar Documentos Tripulantes"
            className="p-button-info"
            onClick={cargarDocumentosTripulantes}
            disabled={loadingData}
            tooltip="Cargar documentos de los tripulantes"
            tooltipOptions={{ position: "top" }}
            style={{ fontSize: "0.875rem" }}
          />
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
            Filtrar por Estado
          </label>
          <Button
            type="button"
            label={getEstadoButtonLabel()}
            icon={getEstadoButtonIcon()}
            className={`w-full ${getEstadoButtonClass()}`}
            onClick={handleToggleEstado}
            style={{ fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label
            className="block text-900 font-medium mb-1"
            style={{ fontSize: "0.875rem" }}
          >
            Filtrar por Vencimiento
          </label>
          <Button
            label={
              filtroVencidos === null
                ? "TODOS"
                : filtroVencidos === true
                ? "VENCIDOS"
                : "VIGENTES"
            }
            icon={
              filtroVencidos === null
                ? "pi pi-filter"
                : filtroVencidos === true
                ? "pi pi-times-circle"
                : "pi pi-check-circle"
            }
            className={`w-full ${
              filtroVencidos === true
                ? "p-button-danger"
                : filtroVencidos === false
                ? "p-button-success"
                : "p-button-outlined"
            }`}
            onClick={() => {
              if (filtroVencidos === null) {
                setFiltroVencidos(true);
              } else if (filtroVencidos === true) {
                setFiltroVencidos(false);
              } else {
                setFiltroVencidos(null);
              }
            }}
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
        selection={selectedDocumento}
        onSelectionChange={(e) => setSelectedDocumento(e.value)}
        dataKey="id"
        paginator
        rows={20}
        rowsPerPageOptions={[20, 40, 80]}
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
        style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(e) => {
          setSortField(e.sortField);
          setSortOrder(e.sortOrder);
        }}
        onRowClick={(e) => editDocumento(e.data)}
        rowHover
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
          header="Emisión"
          body={(rowData) => {
            return rowData.fechaEmision
              ? new Date(rowData.fechaEmision).toLocaleDateString("es-PE")
              : "-";
          }}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="fechaVencimiento"
          header="Vencimiento"
          body={(rowData) => {
            const fechaActual = new Date();
            const fechaVencimiento = rowData.fechaVencimiento
              ? new Date(rowData.fechaVencimiento)
              : null;

            const estaVencido =
              !fechaVencimiento || fechaVencimiento < fechaActual;

            const fechaTexto = rowData.fechaVencimiento
              ? new Date(rowData.fechaVencimiento).toLocaleDateString("es-PE")
              : "-";

            return (
              <div>
                <div
                  style={{
                    fontSize: getResponsiveFontSize(),
                    marginBottom: "4px",
                  }}
                >
                  {fechaTexto}
                </div>
                <Tag
                  value={estaVencido ? "VENCIDO" : "VIGENTE"}
                  severity={estaVencido ? "danger" : "success"}
                  style={{
                    fontSize: getResponsiveFontSize(),
                    fontWeight: "bold",
                  }}
                />
              </div>
            );
          }}
          sortable
          style={{ minWidth: "120px" }}
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
                icon="pi pi-file-pdf"
                className="p-button-rounded p-button-text"
                disabled={!rowData.urlDocTripulantePdf}
                onClick={(e) => {
                  e.stopPropagation();
                  abrirPdfEnNuevaPestana(
                    rowData.urlDocTripulantePdf,
                    toast,
                    "No hay PDF disponible"
                  );
                }}
                tooltip={
                  rowData.urlDocTripulantePdf
                    ? "Ver PDF del documento"
                    : "No hay PDF disponible"
                }
                tooltipOptions={{ position: "top" }}
              />
              <Button
                icon="pi pi-file-edit"
                className="p-button-rounded p-button-outlined p-button-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  editDocumento(rowData);
                }}
                tooltip="Editar"
                tooltipOptions={{ position: "top" }}
              />
              <Button
                icon={rowData.verificado ? "pi pi-times" : "pi pi-check"}
                className={`p-button-rounded ${
                  rowData.verificado ? "p-button-warning" : "p-button-success"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  verificarDocumento(rowData);
                }}
                tooltip={
                  rowData.verificado ? "Marcar como pendiente" : "Verificar"
                }
                tooltipOptions={{ position: "top" }}
              />
            </div>
          )}
          header="Acciones"
          style={{ minWidth: "150px" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={
          editingDocumento
            ? "Editar Documento de Tripulante"
            : "Nuevo Documento de Tripulante"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        {dialogVisible && (
          <DetDocTripulantesFaenaConsumoForm
            documento={editingDocumento}
            tripulantes={tripulantesNormalizados}
            documentos={documentosNormalizados}
            onGuardadoExitoso={() => {
              hideDialog();
              cargarDocumentos();
              if (onDataChange) {
                onDataChange();
              }
            }}
            onCancelar={hideDialog}
          />
        )}
      </Dialog>
    </Card>
  );
}
