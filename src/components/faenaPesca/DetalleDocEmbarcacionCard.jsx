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
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { getResponsiveFontSize } from "../../utils/utils";
import DetalleDocEmbarcacionForm from "../detalleDocEmbarcacion/DetalleDocEmbarcacionForm";
import {
  getAllDetalleDocEmbarcacion,
  crearDetalleDocEmbarcacion,
  actualizarDetalleDocEmbarcacion,
  eliminarDetalleDocEmbarcacion,
} from "../../api/detalleDocEmbarcacion";

const DetalleDocEmbarcacionCard = ({
  faenaPescaId,
  temporadaData,
  faenaData,
  faenaDescripcion,
  documentosPesca: documentosPescaProps = [],
  loading = false,
  onDataChange,
  onDocEmbarcacionChange, // Callback para notificar cambios
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [docEmbarcacion, setDocEmbarcacion] = useState([]);
  const [selectedDocEmbarcacion, setSelectedDocEmbarcacion] = useState(null);
  const [docEmbarcacionDialog, setDocEmbarcacionDialog] = useState(false);
  const [editingDocEmbarcacion, setEditingDocEmbarcacion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const toast = useRef(null);

  // Estados para props normalizadas
  const [documentosPesca, setDocumentosPesca] = useState(documentosPescaProps);

  useEffect(() => {
    if (faenaPescaId) {
      cargarDocEmbarcacion();
    }
  }, [faenaPescaId]);

  useEffect(() => {
    if (documentosPescaProps?.length > 0) {
      const documentosNormalizados = documentosPescaProps.map((item) => ({
        value: Number(item.value),
        label: item.label,
      }));
      setDocumentosPesca(documentosNormalizados);
    }
  }, [documentosPescaProps]);

  const cargarDocEmbarcacion = async () => {
    try {
      setLoadingData(true);
      const response = await getAllDetalleDocEmbarcacion({ faenaPescaId });
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

  const saveDocEmbarcacion = async (docEmbarcacionData) => {
    try {
      setLoadingData(true);

      const dataToSend = {
        ...docEmbarcacionData,
        faenaPescaId: Number(faenaPescaId),
        documentoPescaId: docEmbarcacionData.documentoPescaId
          ? Number(docEmbarcacionData.documentoPescaId)
          : null,
      };

      if (editingDocEmbarcacion) {
        await actualizarDetalleDocEmbarcacion(
          editingDocEmbarcacion.id,
          dataToSend
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento de embarcación actualizado correctamente",
          life: 3000,
        });
      } else {
        await crearDetalleDocEmbarcacion(dataToSend);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Documento de embarcación creado correctamente",
          life: 3000,
        });
      }

      await cargarDocEmbarcacion();
      hideDialog();

      // Notificar cambios al componente padre
      if (onDocEmbarcacionChange) {
        onDocEmbarcacionChange();
      }
    } catch (error) {
      console.error("Error al guardar documento de embarcación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el documento de embarcación",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const confirmDeleteDocEmbarcacion = (docEmbarcacion) => {
    setSelectedDocEmbarcacion(docEmbarcacion);
    // Implementar confirmación de eliminación si es necesario
  };

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
        {rowData.documentoPesca?.nombre || "N/A"}
      </span>
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
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editDocEmbarcacion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const header = (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 10,
        flexDirection: window.innerWidth < 768 ? "column" : "row",
      }}
    >
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <h2>DOCUMENTOS DE EMBARCACIÓN</h2>
      </div>
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar documentos..."
        />{" "}
      </div>
    </div>
  );

  return (
    <Card>
      <Toast ref={toast} />
      <DataTable
        value={docEmbarcacion}
        selection={selectedDocEmbarcacion}
        onSelectionChange={(e) => setSelectedDocEmbarcacion(e.value)}
        dataKey="id"
        paginator
        rows={10}
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
          body={fechaTemplate("fechaVencimiento")}
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
        style={{ width: "800px" }}
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
            isEdit={!!editingDocEmbarcacion}
            defaultValues={
              editingDocEmbarcacion || { faenaPescaId: Number(faenaPescaId) }
            }
            documentosPesca={documentosPesca}
            onSubmit={saveDocEmbarcacion}
            onCancel={hideDialog}
            loading={loadingData}
            toast={toast}
          />
        )}
      </Dialog>
    </Card>
  );
};

export default DetalleDocEmbarcacionCard;
