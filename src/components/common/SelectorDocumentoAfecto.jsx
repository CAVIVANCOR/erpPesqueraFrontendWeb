// src/components/common/SelectorDocumentoAfecto.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { getPreFacturasParaDocumentoAfecto, getPreFacturaPorId } from "../../api/preFactura";
import { formatearFecha, formatearNumero } from "../../utils/utils";

/**
 * Componente genérico para seleccionar un documento afecto (PreFactura)
 * para Notas de Crédito/Débito
 */
export default function SelectorDocumentoAfecto({
  empresaId,
  clienteId,
  fechaLimite,
  onSelect,
  disabled = false,
  placeholder = "Seleccionar documento afectado",
  toast,
}) {
  const [visible, setVisible] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  // Cargar documentos cuando se abre el dialog
  useEffect(() => {
    if (visible && empresaId && clienteId) {
      cargarDocumentos();
    }
  }, [visible, empresaId, clienteId, fechaLimite]);

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const data = await getPreFacturasParaDocumentoAfecto(empresaId, clienteId, fechaLimite);
      setDocumentos(data || []);
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los documentos",
      });
    }
    setLoading(false);
  };

  const handleSeleccionar = async (rowData) => {
    setLoading(true);
    try {
      // Obtener el detalle completo de la PreFactura
      const preFacturaCompleta = await getPreFacturaPorId(rowData.id);

      // Preparar datos para retornar
      const datosDocumento = {
        preFacturaId: preFacturaCompleta.id,
        fechaDocumento: preFacturaCompleta.fechaDocumento,
        numeroDocumento: preFacturaCompleta.numeroDocumento,
        detalleItems: preFacturaCompleta.detalles || [],
      };

      console.log("📄 Documento seleccionado:", datosDocumento);
      console.log("📦 Items a cargar:", datosDocumento.detalleItems.length);

      // Llamar al callback
      onSelect(datosDocumento);

      // Cerrar dialog
      setVisible(false);
      setDocumentoSeleccionado(null);

      toast?.current?.show({
        severity: "success",
        summary: "Documento Cargado",
        detail: `PreFactura ${preFacturaCompleta.numeroDocumento} cargada correctamente`,
      });
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el detalle del documento",
      });
    }
    setLoading(false);
  };

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3>Seleccionar Documento Afectado</h3>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    </div>
  );

  const accionesTemplate = (rowData) => {
    return (
      <Button
        label="Seleccionar"
        icon="pi pi-check"
        className="p-button-sm p-button-success"
        onClick={() => handleSeleccionar(rowData)}
      />
    );
  };

  const fechaTemplate = (rowData) => {
    return formatearFecha(rowData.fechaDocumento);
  };

  const montoTemplate = (rowData) => {
    return formatearNumero(rowData.total);
  };

  const tipoDocumentoTemplate = (rowData) => {
    return rowData.tipoDocumento?.descripcion || "N/A";
  };

  const clienteTemplate = (rowData) => {
    return rowData.cliente?.razonSocial || "N/A";
  };

  return (
    <>
      <Button
        label={documentoSeleccionado?.numeroDocumento || placeholder}
        icon="pi pi-search"
        onClick={() => setVisible(true)}
        disabled={disabled || !empresaId || !clienteId}
        className="p-button-outlined"
        style={{ width: "100%" }}
        tooltip={!empresaId || !clienteId ? "Seleccione empresa y cliente primero" : ""}
      />

      <Dialog
        header="Documentos Disponibles"
        visible={visible}
        style={{ width: "80vw" }}
        onHide={() => setVisible(false)}
        maximizable
      >
        <DataTable
          value={documentos}
          loading={loading}
          paginator
          rows={10}
          globalFilter={globalFilter}
          header={header}
          showGridlines
          stripedRows
          size="small"
          emptyMessage="No se encontraron documentos"
        >
          <Column field="tipoDocumento.descripcion" header="Tipo Documento" body={tipoDocumentoTemplate} sortable />
          <Column field="numeroDocumento" header="Número" sortable />
          <Column field="fechaDocumento" header="Fecha" body={fechaTemplate} sortable />
          <Column field="cliente.razonSocial" header="Cliente" body={clienteTemplate} sortable />
          <Column field="total" header="Monto Total" body={montoTemplate} sortable />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "150px" }} />
        </DataTable>
      </Dialog>
    </>
  );
}