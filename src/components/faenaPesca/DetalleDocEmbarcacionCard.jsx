/**
 * DetalleDocEmbarcacionCard.jsx
 *
 * Componente para mostrar y gestionar los documentos de embarcación de una faena de pesca.
 * Permite listar, crear y editar registros de DetalleDocEmbarcacion.
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
import DetalleDocEmbarcacionForm from "../detalleDocEmbarcacion/DetalleDocEmbarcacionForm";
import {
  getDetallesDocEmbarcacion,
  crearDetalleDocEmbarcacion,
  actualizarDetalleDocEmbarcacion,
  eliminarDetalleDocEmbarcacion,
} from "../../api/detalleDocEmbarcacion";
import { SelectButton } from "primereact/selectbutton";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { getDocumentacionesEmbarcacion } from "../../api/documentacionEmbarcacion";

const DetalleDocEmbarcacionCard = ({
  faenaPescaId,
  temporadaData,
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

  // Estados para manejo de formulario
  const [formData, setFormData] = useState({
    tipoDocumentoId: null,
    numeroDocumento: "",
    fechaEmision: null,
    fechaVencimiento: null,
    observaciones: "",
    vigente: true,
    urlDocEmbarcacion: "",
  });
  const [errors, setErrors] = useState({});

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

  // Handlers para el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  useEffect(() => {
    if (faenaPescaId) {
      cargarDocEmbarcacion();
    }
  }, [faenaPescaId]);

  useEffect(() => {
    actualizarOpcionesFiltros();
  }, [docEmbarcacion, documentosPesca]);

  useEffect(() => {
    const documentosFormateados = documentosPesca
      .filter((d) => d.paraEmbarcacion === true)
      .map((d) => ({
        label: d.nombre || d.descripcion,
        value: Number(d.id),
        ...d,
      }));
    setDocumentosPescaNormalizados(documentosFormateados);
  }, [documentosPesca]);

  const actualizarOpcionesFiltros = () => {
    if (!docEmbarcacion.length) return;

    const documentosUnicos = [
      ...new Set(
        docEmbarcacion.map((doc) => doc.documentoPescaId).filter(Boolean),
      ),
    ];
    const opcionesDocumentoNuevas = documentosUnicos
      .map((documentoPescaId) => {
        const documentoEncontrado = documentosPesca.find(
          (d) => Number(d.id) === Number(documentoPescaId),
        );
        return {
          label: documentoEncontrado
            ? documentoEncontrado.nombre
            : `ID: ${documentoPescaId}`,
          value: documentoPescaId,
        };
      })
      .filter((option) => option.label !== `ID: ${option.value}`);
    setOpcionesDocumento(opcionesDocumentoNuevas);
  };

  const cargarDocEmbarcacion = async () => {
    try {
      setLoadingData(true);
      const response = await getDetallesDocEmbarcacion({ faenaPescaId });
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

  const cargarDocumentosEmbarcacion = async () => {
    try {
      setLoadingData(true);

      // Usar la prop documentacionEmbarcacion que ya viene filtrada desde el padre
      if (!documentacionEmbarcacion || documentacionEmbarcacion.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "Sin Documentos",
          detail: "No se encontraron documentos para esta embarcación",
          life: 3000,
        });
        return;
      }

      const documentosExistentes = await getDetallesDocEmbarcacion({
        faenaPescaId,
      });

      let creados = 0;
      let actualizados = 0;
      let errores = 0;

      for (const docEmb of documentacionEmbarcacion) {
        try {
          const fechaActual = new Date();
          const fechaVencimiento = docEmb.fechaVencimiento
            ? new Date(docEmb.fechaVencimiento)
            : null;
          const docVencido =
            !fechaVencimiento || fechaVencimiento < fechaActual;

          const dataToSend = {
            faenaPescaId: Number(faenaPescaId),
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

          const documentoExistente = documentosExistentes.find(
            (d) =>
              Number(d.faenaPescaId) === Number(faenaPescaId) &&
              Number(d.documentoPescaId) === Number(docEmb.documentoPescaId),
          );

          if (documentoExistente) {
            await actualizarDetalleDocEmbarcacion(
              documentoExistente.id,
              dataToSend,
            );
            actualizados++;
          } else {
            await crearDetalleDocEmbarcacion(dataToSend);
            creados++;
          }
        } catch (error) {
          console.error("Error al procesar documento:", error);
          errores++;
        }
      }

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
        detail: "Error al cargar documentos de embarcación",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openNew = () => {
    setFormData({
      tipoDocumentoId: null,
      numeroDocumento: "",
      fechaEmision: null,
      fechaVencimiento: null,
      observaciones: "",
      vigente: true,
      urlDocEmbarcacion: "",
    });
    setErrors({});
    setEditingDocEmbarcacion(null);
    setDocEmbarcacionDialog(true);
  };

  const editDocEmbarcacion = (docEmbarcacion) => {
    setFormData({
      tipoDocumentoId: docEmbarcacion.documentoPescaId
        ? Number(docEmbarcacion.documentoPescaId)
        : null,
      numeroDocumento: docEmbarcacion.numeroDocumento || "",
      fechaEmision: docEmbarcacion.fechaEmision
        ? new Date(docEmbarcacion.fechaEmision)
        : null,
      fechaVencimiento: docEmbarcacion.fechaVencimiento
        ? new Date(docEmbarcacion.fechaVencimiento)
        : null,
      observaciones: docEmbarcacion.observaciones || "",
      vigente:
        docEmbarcacion.vigente !== undefined ? docEmbarcacion.vigente : true,
      urlDocEmbarcacion: docEmbarcacion.urlDocEmbarcacion || "",
    });
    setErrors({});
    setEditingDocEmbarcacion(docEmbarcacion);
    setDocEmbarcacionDialog(true);
  };

  const hideDialog = () => {
    setDocEmbarcacionDialog(false);
    setEditingDocEmbarcacion(null);
  };

  const confirmDeleteDocEmbarcacion = (docEmbarcacion) => {
    setSelectedDocEmbarcacion(docEmbarcacion);
  };

  const verificarDocumento = async (rowData) => {
    try {
      setLoadingData(true);
      const nuevoEstado = !rowData.verificado;

      await actualizarDetalleDocEmbarcacion(rowData.id, {
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
  const datosFiltrados = docEmbarcacion.filter((doc) => {
    const cumpleFiltroEstado =
      filtroEstado === null || doc.verificado === filtroEstado;
    const cumpleFiltroDocumento =
      filtroDocumento === null ||
      Number(doc.documentoPescaId) === Number(filtroDocumento);

    let cumpleFiltroVencidos = true;
    if (filtroVencidos !== null) {
      const fechaActual = new Date();
      const fechaVencimiento = doc.fechaVencimiento
        ? new Date(doc.fechaVencimiento)
        : null;

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
        <div style={{ flex: 1 }}>
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
            disabled={loadingData || !temporadaData}
            tooltip="Cargar documentos de la embarcación"
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
          (doc) => Number(doc.value) === Number(rowData.documentoPescaId),
        )?.label || "N/A"}
      </span>
    );
  };

  const vencimientoTemplate = (rowData) => {
    const fechaActual = new Date();
    const fechaVencimiento = rowData.fechaVencimiento
      ? new Date(rowData.fechaVencimiento)
      : null;

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
              "No hay PDF disponible",
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
        rows={15}
        rowsPerPageOptions={[15, 30, 60]}
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
        onRowClick={(e) => editDocEmbarcacion(e.data)}
        selectionMode="single"
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
          <DetalleDocEmbarcacionForm
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleDateChange={handleDateChange}
            handleCheckboxChange={handleCheckboxChange}
            tiposDocumentoOptions={documentosPescaNormalizados}
            readOnly={false}
            toast={toast}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default DetalleDocEmbarcacionCard;
