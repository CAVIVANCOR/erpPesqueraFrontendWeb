/**
 * Card para mostrar documentación asociada a una embarcación
 * Basado en DocumentacionEmbarcacion.jsx
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Card } from "primereact/card";
import { getDocumentacionesEmbarcacion } from "../../api/documentacionEmbarcacion";
import { getDocumentosPesca } from "../../api/documentoPesca";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";
import { abrirPdfEnNuevaPestana } from "../../utils/pdfUtils";

export default function DetalleDocsEmbarcacionCard({ embarcacionId }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const [documentaciones, setDocumentaciones] = useState([]);
  const [documentosPesca, setDocumentosPesca] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroVencimiento, setFiltroVencimiento] = useState("todos"); // "todos", "vencidos", "vigentes", "por-vencer"
  useEffect(() => {
    if (embarcacionId) {
      cargarDocumentaciones();
      cargarDocumentosPesca();
    }
  }, [embarcacionId]);

  const cargarDocumentaciones = async () => {
    setLoading(true);
    try {
      const data = await getDocumentacionesEmbarcacion();
      // Filtrar por embarcacionId y cesado === false
      const documentacionesFiltradas = data.filter(
        (doc) =>
          Number(doc.embarcacionId) === Number(embarcacionId) &&
          doc.cesado === false
      );
      setDocumentaciones(documentacionesFiltradas);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la documentación",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarDocumentosPesca = async () => {
    try {
      const data = await getDocumentosPesca();
      setDocumentosPesca(data);
    } catch (err) {
      console.error("Error al cargar documentos pesca:", err);
    }
  };

  // Templates para las columnas
  const documentoPescaTemplate = (rowData) => {
    const documento = documentosPesca.find(
      (d) => Number(d.id) === Number(rowData.documentoPescaId)
    );
    return documento ? documento.descripcion : "N/A";
  };

  const fechaEmisionTemplate = (rowData) => {
    return rowData.fechaEmision
      ? new Date(rowData.fechaEmision).toLocaleDateString("es-PE")
      : "N/A";
  };

  const fechaVencimientoTemplate = (rowData) => {
    return rowData.fechaVencimiento
      ? new Date(rowData.fechaVencimiento).toLocaleDateString("es-PE")
      : "N/A";
  };

  const estadoVencimientoTemplate = (rowData) => {
    if (!rowData.fechaVencimiento) {
      return <Badge value="SIN FECHA" severity="secondary" />;
    }

    const hoy = new Date();
    const fechaVencimiento = new Date(rowData.fechaVencimiento);
    const diasRestantes = Math.ceil(
      (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)
    );

    if (rowData.docVencido || diasRestantes < 0) {
      return <Badge value="VENCIDO" severity="danger" />;
    } else if (diasRestantes <= 30) {
      return <Badge value="POR VENCER" severity="warning" />;
    } else {
      return <Badge value="VIGENTE" severity="success" />;
    }
  };

  const urlDocTemplate = (rowData) => {
    if (rowData.urlDocPdf) {
      return (
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-text p-button-sm"
          tooltip="Ver PDF"
          tooltipOptions={{ position: "top" }}
          onClick={() =>
            abrirPdfEnNuevaPestana(
              rowData.urlDocPdf,
              toast,
              "No hay PDF disponible para este documento."
            )
          }
          type="button"
        />
      );
    }
    return "Sin archivo";
  };

  const cambiarFiltroVencimiento = () => {
    if (filtroVencimiento === "todos") {
      setFiltroVencimiento("vencidos");
    } else if (filtroVencimiento === "vencidos") {
      setFiltroVencimiento("por-vencer");
    } else if (filtroVencimiento === "por-vencer") {
      setFiltroVencimiento("vigentes");
    } else {
      setFiltroVencimiento("todos");
    }
  };

  const getConfiguracionBotonVencimiento = () => {
    switch (filtroVencimiento) {
      case "vencidos":
        return {
          label: "Vencidos",
          severity: "danger",
          icon: "pi pi-times-circle",
        };
      case "por-vencer":
        return {
          label: "Por Vencer",
          severity: "warning",
          icon: "pi pi-exclamation-triangle",
        };
      case "vigentes":
        return {
          label: "Vigentes",
          severity: "success",
          icon: "pi pi-check-circle",
        };
      default:
        return { label: "Todos", severity: "info", icon: "pi pi-list" };
    }
  };

  const documentacionesFiltradas = documentaciones.filter((doc) => {
    if (filtroVencimiento === "todos") return true;

    const hoy = new Date();
    const fechaVencimiento = doc.fechaVencimiento
      ? new Date(doc.fechaVencimiento)
      : null;

    if (!fechaVencimiento) return filtroVencimiento === "vigentes"; // Sin fecha = vigente

    const diasRestantes = Math.ceil(
      (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)
    );
    const estaVencido = doc.docVencido || diasRestantes < 0;
    const estaPorVencer = !estaVencido && diasRestantes <= 30;

    switch (filtroVencimiento) {
      case "vencidos":
        return estaVencido;
      case "por-vencer":
        return estaPorVencer;
      case "vigentes":
        return !estaVencido && !estaPorVencer;
      default:
        return true;
    }
  });
  const configBoton = getConfiguracionBotonVencimiento();

  return (
    <>
      <Toast ref={toast} />
      <Card>
        <DataTable
          value={documentacionesFiltradas}
          loading={loading}
          dataKey="id"
          paginator
          rows={6}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No hay documentación registrada para esta embarcación"
          style={{ fontSize: getResponsiveFontSize() }}
          header={
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Documentación de la Embarcación</h2>
              </div>
              <div style={{ flex: 1 }}>
                <label>Filtrar Estado:</label>
                <Button
                  label={configBoton.label}
                  icon={configBoton.icon}
                  severity={configBoton.severity}
                  size="small"
                  onClick={cambiarFiltroVencimiento}
                  tooltip={`Filtrar por: ${configBoton.label}`}
                  type="button"
                  raised
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Actualizar</label>
                <Button
                  icon="pi pi-refresh"
                  label="Actualizar"
                  className="p-button-primary"
                  onClick={cargarDocumentaciones}
                  tooltip="Actualizar"
                  type="button"
                  severity="primary"
                  size="small"
                  raised
                />
              </div>
            </div>
          }
        >
          <Column
            field="documentoPescaId"
            header="Tipo de Documento"
            body={documentoPescaTemplate}
            sortable
          />
          <Column field="numeroDocumento" header="Número" sortable />
          <Column
            field="fechaEmision"
            header="Fecha Emisión"
            body={fechaEmisionTemplate}
            sortable
          />
          <Column
            field="fechaVencimiento"
            header="Fecha Vencimiento"
            body={fechaVencimientoTemplate}
            sortable
          />
          <Column
            header="Estado"
            body={estadoVencimientoTemplate}
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column
            field="urlDocPdf"
            header="Archivo"
            body={urlDocTemplate}
            style={{ width: "80px", textAlign: "center" }}
          />
          <Column field="observaciones" header="Observaciones" />
        </DataTable>
      </Card>
    </>
  );
}
