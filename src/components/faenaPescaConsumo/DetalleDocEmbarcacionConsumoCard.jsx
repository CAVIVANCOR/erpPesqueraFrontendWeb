/**
 * DetalleDocEmbarcacionConsumoCard.jsx
 *
 * Componente para mostrar y gestionar los documentos de embarcación de una faena de pesca consumo.
 * Permite listar, crear y editar registros de DetDocEmbarcacionPescaConsumo.
 * Replica el patrón de DetalleDocEmbarcacionCard.jsx
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog } from "primereact/confirmdialog";
import { confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { getResponsiveFontSize } from "../../utils/utils";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";
import DetalleDocEmbarcacionConsumoForm from "../detDocEmbarcacionPescaConsumo/DetalleDocEmbarcacionConsumoForm";
import {
  getDetDocEmbarcacionPescaConsumo,
  crearDetDocEmbarcacionPescaConsumo,
  actualizarDetDocEmbarcacionPescaConsumo,
  eliminarDetDocEmbarcacionPescaConsumo,
} from "../../api/detDocEmbarcacionPescaConsumo";
import { SelectButton } from "primereact/selectbutton";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { getDocumentacionesEmbarcacion } from "../../api/documentacionEmbarcacion";

const DetalleDocEmbarcacionConsumoCard = ({
  faenaPescaConsumoId,
  novedadData,
  faenaData,
  faenaDescripcion,
  documentosPesca = [],
  documentacionEmbarcacion = [],
  loading = false,
  onDataChange,
  onDocEmbarcacionChange,
  onFaenasChange,
}) => {
  const [docEmbarcacion, setDocEmbarcacion] = useState([]);
  const [selectedDocEmbarcacion, setSelectedDocEmbarcacion] = useState(null);
  const [docEmbarcacionDialog, setDocEmbarcacionDialog] = useState(false);
  const [editingDocEmbarcacion, setEditingDocEmbarcacion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [filtroDocumento, setFiltroDocumento] = useState(null);
  const [filtroVencidos, setFiltroVencidos] = useState(null);

  // Estados para controlar el ordenamiento
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState(-1);

  // Estados para opciones de filtros dinámicos
  const [opcionesDocumento, setOpcionesDocumento] = useState([]);

  // Estados para props normalizadas
  const [documentosPescaNormalizados, setDocumentosPescaNormalizados] =
    useState([]);

  // Opciones fijas para el SelectButton de estado
  const opcionesEstado = [
    { label: "PENDIENTE", value: false },
    { label: "VERIFICADO", value: true },
  ];

  // Opciones para filtro de vencidos
  const opcionesVencidos = [
    { label: "VENCIDOS", value: true },
    { label: "VIGENTES", value: false },
  ];

  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarDocEmbarcacion();
    }
  }, [faenaPescaConsumoId]);

  useEffect(() => {
    actualizarOpcionesFiltros();
  }, [docEmbarcacion, documentosPesca]);

  useEffect(() => {
    // Normalizar documentos para el formulario
    const documentosFormateados = documentosPesca
      .filter((d) => d.paraEmbarcacion === true)
      .map((d) => ({
        label: d.nombre || d.descripcion,
        value: Number(d.id),
        ...d,
      }));
    setDocumentosPescaNormalizados(documentosFormateados);
  }, [documentosPesca]);

  // Actualizar la función actualizarOpcionesFiltros (línea 109)
  const actualizarOpcionesFiltros = () => {
    if (!docEmbarcacion.length) return;

    // Filtro de Documento
    const documentosUnicos = [
      ...new Set(
        docEmbarcacion.map((doc) => doc.documentoPescaId).filter(Boolean)
      ),
    ];
    const opcionesDocumentoNuevas = documentosUnicos
      .map((documentoPescaId) => {
        // Primero buscar en el objeto documentoPesca que viene del backend
        const docEnDetalle = docEmbarcacion.find(
          (d) => Number(d.documentoPescaId) === Number(documentoPescaId)
        )?.documentoPesca;

        // Si no existe, buscar en documentosPesca (fallback)
        const documentoEncontrado =
          docEnDetalle ||
          documentosPesca.find(
            (d) => Number(d.id) === Number(documentoPescaId)
          );

        return {
          label: documentoEncontrado?.nombre || `ID: ${documentoPescaId}`,
          value: documentoPescaId,
        };
      })
      .filter((option) => option.label !== `ID: ${option.value}`);
    setOpcionesDocumento(opcionesDocumentoNuevas);
  };
  const cargarDocEmbarcacion = async () => {
    try {
      setLoadingData(true);
      const response = await getDetDocEmbarcacionPescaConsumo({
        faenaPescaConsumoId,
      });
      setDocEmbarcacion(response || []);
    } catch (error) {
      console.error("Error al cargar documentos de embarcación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los documentos de embarcación",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setEditingDocEmbarcacion(null);
    setDocEmbarcacionDialog(true);
  };

  const editDocEmbarcacion = (docEmbarcacion) => {
    setEditingDocEmbarcacion(docEmbarcacion);
    setDocEmbarcacionDialog(true);
  };

  const hideDialog = () => {
    setDocEmbarcacionDialog(false);
    setEditingDocEmbarcacion(null);
  };

  const confirmDeleteDocEmbarcacion = (docEmbarcacion) => {
    setSelectedDocEmbarcacion(docEmbarcacion);
    // Implementar confirmación de eliminación si es necesario
  };

  const verificarDocumento = async (rowData) => {
    try {
      setLoadingData(true);
      const nuevoEstado = !rowData.verificado;

      await actualizarDetDocEmbarcacionPescaConsumo(rowData.id, {
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

      cargarDocEmbarcacion();
      if (onDocEmbarcacionChange) {
        onDocEmbarcacionChange();
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

  const cargarDocumentosEmbarcacion = async () => {
    const embarcacionId =
      faenaData?.embarcacionId || novedadData?.embarcacionId;

    if (!embarcacionId) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una embarcación primero",
        life: 3000,
      });
      return;
    }

    try {
      setLoadingData(true);

      // 1. Obtener todos los documentos de embarcación
      const todosLosDocumentos = await getDocumentacionesEmbarcacion();

      // 2. Filtrar por embarcacionId
      const documentosEmbarcacion = todosLosDocumentos.filter(
        (doc) => Number(doc.embarcacionId) === Number(embarcacionId)
      );

      if (documentosEmbarcacion.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin Documentos",
          detail: "No se encontraron documentos para esta embarcación",
          life: 3000,
        });
        return;
      }

      // 3. Obtener documentos existentes en DetDocEmbarcacionPescaConsumo
      const documentosExistentes = await getDetDocEmbarcacionPescaConsumo({
        faenaPescaConsumoId,
      });

      // 4. Crear o actualizar registros en DetDocEmbarcacionPescaConsumo
      let creados = 0;
      let actualizados = 0;
      let errores = 0;

      for (const docEmb of documentosEmbarcacion) {
        try {
          // Calcular docVencido basado en fechaVencimiento
          const fechaActual = new Date();
          const fechaVencimiento = docEmb.fechaVencimiento
            ? new Date(docEmb.fechaVencimiento)
            : null;
          const docVencido =
            !fechaVencimiento || fechaVencimiento < fechaActual;

          const dataToSend = {
            faenaPescaConsumoId: Number(faenaPescaConsumoId),
            documentoPescaId: Number(docEmb.documentoPescaId),
            numeroDocumento: docEmb.numeroDocumento || null,
            fechaEmision: docEmb.fechaEmision || null,
            fechaVencimiento: docEmb.fechaVencimiento || null,
            urlDocEmbarcacion: docEmb.urlDocPdf || null,
            docVencido: docVencido,
            verificado: false,
            observaciones: docEmb.observaciones || null,
            updatedAt: new Date().toISOString(),
          };

          // Verificar si ya existe el documento
          const documentoExistente = documentosExistentes.find(
            (d) =>
              Number(d.faenaPescaConsumoId) === Number(faenaPescaConsumoId) &&
              Number(d.documentoPescaId) === Number(docEmb.documentoPescaId)
          );

          if (documentoExistente) {
            // Actualizar documento existente
            await actualizarDetDocEmbarcacionPescaConsumo(
              documentoExistente.id,
              dataToSend
            );
            actualizados++;
          } else {
            // Crear nuevo documento
            await crearDetDocEmbarcacionPescaConsumo(dataToSend);
            creados++;
          }
        } catch (error) {
          console.error("Error al procesar documento:", error);
          errores++;
        }
      }

      // 5. Mostrar resultado
      if (creados > 0 || actualizados > 0) {
        toast.current?.show({
          severity: "success",
          summary: "Documentos Procesados",
          detail: `${creados} creado(s), ${actualizados} actualizado(s)${
            errores > 0 ? `. ${errores} error(es)` : ""
          }`,
          life: 4000,
        });

        await cargarDocEmbarcacion();

        // Notificar cambios al componente padre
        if (onDocEmbarcacionChange) {
          onDocEmbarcacionChange();
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
      console.error("Error al cargar documentos de embarcación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los documentos de la embarcación",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Función para filtrar datos
  const datosFiltrados = docEmbarcacion.filter((doc) => {
    const cumpleFiltroEstado =
      filtroEstado === null || doc.verificado === filtroEstado;
    const cumpleFiltroDocumento =
      filtroDocumento === null ||
      Number(doc.documentoPescaId) === Number(filtroDocumento);

    // Filtro por vencidos - evaluar fechaVencimiento vs fecha actual
    let cumpleFiltroVencidos = true;
    if (filtroVencidos !== null) {
      const fechaActual = new Date();
      const fechaVencimiento = doc.fechaVencimiento
        ? new Date(doc.fechaVencimiento)
        : null;

      // Si fechaVencimiento es null, se considera vencido (true)
      // Si fechaVencimiento < fechaActual, se considera vencido (true)
      const estaVencido = !fechaVencimiento || fechaVencimiento < fechaActual;

      cumpleFiltroVencidos = estaVencido === filtroVencidos;
    }

    return cumpleFiltroEstado && cumpleFiltroDocumento && cumpleFiltroVencidos;
  });

  const limpiarFiltros = () => {
    setFiltroEstado(null);
    setFiltroDocumento(null);
    setFiltroVencidos(null);
    setGlobalFilter("");
  };

  const handleToggleVencimiento = () => {
    if (filtroVencidos === true) {
      setFiltroVencidos(false);
    } else if (filtroVencidos === false) {
      setFiltroVencidos(null);
    } else {
      setFiltroVencidos(true);
    }
  };

  // Funciones para el filtro toggle de Estado
  const handleToggleEstado = () => {
    if (filtroEstado === null) {
      setFiltroEstado(false); // Mostrar solo pendientes
    } else if (filtroEstado === false) {
      setFiltroEstado(true); // Mostrar solo verificados
    } else {
      setFiltroEstado(null); // Mostrar todos
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

  const getVencimientoButtonLabel = () => {
    if (filtroVencidos === null) return "Todos";
    if (filtroVencidos === true) return "VENCIDOS";
    return "VIGENTES";
  };

  const getVencimientoButtonClass = () => {
    if (filtroVencidos === null) return "p-button-outlined";
    if (filtroVencidos === true) return "p-button-danger";
    return "p-button-success";
  };

  const getVencimientoButtonIcon = () => {
    if (filtroVencidos === null) return "pi pi-filter";
    if (filtroVencidos === true) return "pi pi-times-circle";
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
        <div style={{ flex: 0.5 }}>
          <h2>DOCUMENTOS EMBARCACION</h2>
          <small style={{ color: "#666", fontWeight: "normal" }}>
            Total de registros: {datosFiltrados.length}
          </small>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            icon="pi pi-download"
            label="Recargar Documentos"
            className="p-button-info"
            onClick={cargarDocumentosEmbarcacion}
            disabled={
              !(faenaData?.embarcacionId || novedadData?.embarcacionId) ||
              loadingData
            }
            tooltip={
              !(faenaData?.embarcacionId || novedadData?.embarcacionId)
                ? "Debe seleccionar una embarcación primero"
                : "Cargar documentos de la embarcación"
            }
            tooltipOptions={{ position: "top" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Nuevo"
            className="p-button-success"
            onClick={openNew}
            disabled={loadingData}
            style={{ fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ flex: 0.5 }}>
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
            icon={getEstadoButtonIcon()}
            label={getEstadoButtonLabel()}
            className={getEstadoButtonClass()}
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
            type="button"
            icon={getVencimientoButtonIcon()}
            label={getVencimientoButtonLabel()}
            className={getVencimientoButtonClass()}
            onClick={handleToggleVencimiento}
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

  // Templates para las columnas
  const verificadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.verificado ? "VERIFICADO" : "PENDIENTE"}
        severity={rowData.verificado ? "success" : "warning"}
        style={{
          fontSize: getResponsiveFontSize(),
          fontWeight: "bold",
        }}
      />
    );
  };

  const documentoPescaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {documentosPescaNormalizados.find(
          (doc) => Number(doc.value) === Number(rowData.documentoPescaId)
        )?.label || "N/A"}
      </span>
    );
  };

  const vencimientoTemplate = (rowData) => {
    const fechaActual = new Date();
    const fechaVencimiento = rowData.fechaVencimiento
      ? new Date(rowData.fechaVencimiento)
      : null;

    // Si fechaVencimiento es null, se considera vencido (true)
    // Si fechaVencimiento < fechaActual, se considera vencido (true)
    const estaVencido = !fechaVencimiento || fechaVencimiento < fechaActual;

    const fechaTexto = rowData.fechaVencimiento
      ? new Date(rowData.fechaVencimiento).toLocaleDateString("es-PE")
      : "-";

    return (
      <div>
        <div style={{ fontSize: getResponsiveFontSize(), marginBottom: "4px" }}>
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
  };

  const fechaTemplate = (field) => (rowData) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-ES")
      : "-";
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text"
          disabled={!rowData.urlDocEmbarcacion}
          onClick={() =>
            abrirPdfEnNuevaPestana(
              rowData.urlDocEmbarcacion,
              toast.current,
              "No hay PDF disponible"
            )
          }
          tooltip={
            rowData.urlDocEmbarcacion
              ? "Ver PDF del documento"
              : "No hay PDF disponible"
          }
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-file-edit"
          className="p-button-rounded p-button-outlined p-button-sm"
          onClick={() => editDocEmbarcacion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon={rowData.verificado ? "pi pi-times" : "pi pi-check"}
          className={`p-button-rounded p-button-sm ${
            rowData.verificado ? "p-button-warning" : "p-button-success"
          }`}
          onClick={() => verificarDocumento(rowData)}
          tooltip={rowData.verificado ? "Marcar como pendiente" : "Verificar"}
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  return (
    <Card>
      <Toast ref={toast} />
      <DataTable
        value={datosFiltrados}
        selection={selectedDocEmbarcacion}
        onSelectionChange={(e) => setSelectedDocEmbarcacion(e.value)}
        dataKey="id"
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} documentos"
        globalFilter={globalFilter}
        emptyMessage="No se encontraron documentos de embarcación."
        header={header}
        loading={loadingData}
        size="small"
        stripedRows
        showGridlines
        style={{ fontSize: getResponsiveFontSize() }}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(e) => {
          setSortField(e.sortField);
          setSortOrder(e.sortOrder);
        }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />
        <Column
          field="documentoPesca"
          header="Documento"
          body={documentoPescaTemplate}
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
          body={fechaTemplate("fechaEmision")}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="fechaVencimiento"
          header="F. Vencimiento"
          body={vencimientoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="verificado"
          header="Estado"
          body={verificadoTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ minWidth: "100px" }}
        />
      </DataTable>

      <Dialog
        visible={docEmbarcacionDialog}
        style={{ width: "1300px" }}
        header={
          editingDocEmbarcacion
            ? "Editar Documento de Embarcación"
            : "Nuevo Documento de Embarcación"
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        {docEmbarcacionDialog && (
          <DetalleDocEmbarcacionConsumoForm
            detalle={editingDocEmbarcacion}
            documentosPesca={documentosPescaNormalizados}
            onGuardadoExitoso={() => {
              hideDialog();
              cargarDocEmbarcacion();
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
};

export default DetalleDocEmbarcacionConsumoCard;
