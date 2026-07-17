// src/components/common/SelectorDocumentoAfectoOC.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { getOrdenesCompraParaDocumentoAfecto, getOrdenCompraPorId } from "../../api/ordenCompra";
import { formatearFecha, formatearNumero } from "../../utils/utils";

export default function SelectorDocumentoAfectoOC({
  value = null,
  onChange,
  empresaId,
  proveedorId,
  fechaLimite,
  disabled = false,
  placeholder = "Seleccionar documento afectado",
  showClearButton = true,
  toast,
}) {
  const [visible, setVisible] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  // Cargar documento seleccionado cuando value cambia
  useEffect(() => {
    if (value) {
      cargarDocumentoSeleccionado(value);
    } else {
      setDocumentoSeleccionado(null);
    }
  }, [value]);

  // Cargar documentos cuando se abre el dialog
  useEffect(() => {
    if (visible && empresaId && proveedorId) {
      cargarDocumentos();
    }
  }, [visible, empresaId, proveedorId, fechaLimite]);

  const cargarDocumentoSeleccionado = async (id) => {
    try {
      const doc = await getOrdenCompraPorId(id);
      setDocumentoSeleccionado(doc);
    } catch (error) {
      console.error("Error cargando documento seleccionado:", error);
      setDocumentoSeleccionado(null);
    }
  };

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const data = await getOrdenesCompraParaDocumentoAfecto(empresaId, proveedorId, fechaLimite);
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
      const ordenCompraCompleta = await getOrdenCompraPorId(rowData.id);
      setDocumentoSeleccionado(ordenCompraCompleta);
      onChange(ordenCompraCompleta.id);
      setVisible(false);

      toast?.current?.show({
        severity: "success",
        summary: "Documento Seleccionado",
        detail: `Orden de Compra ${ordenCompraCompleta.numeroDocumento} seleccionada`,
      });
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el documento completo",
      });
    }
    setLoading(false);
  };

  const handleLimpiar = () => {
    setDocumentoSeleccionado(null);
    onChange(null);
  };

  const handleAbrir = () => {
    if (!empresaId || !proveedorId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar empresa y proveedor primero",
      });
      return;
    }
    setVisible(true);
  };

  // Templates para columnas
  const fechaTemplate = (rowData) => formatearFecha(rowData.fechaDocumento);
  const montoTemplate = (rowData) => formatearNumero(rowData.total);
  const estadoTemplate = (rowData) => (
    <Tag value={rowData.estado?.nombre || "N/A"} severity="info" />
  );

  const accionesTemplate = (rowData) => (
    <Button
      icon="pi pi-check"
      className="p-button-sm p-button-success"
      onClick={() => handleSeleccionar(rowData)}
      tooltip="Seleccionar"
    />
  );

  // Header del dialog
  const header = (
    <div className="flex justify-content-between align-items-center">
      <h3>Seleccionar Orden de Compra Afectada</h3>
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

   return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button
          type="button"
          onClick={handleAbrir}
          disabled={disabled || !empresaId || !proveedorId}
          className="p-button-outlined"
          style={{ width: "100%", justifyContent: "flex-start", textAlign: "left" }}
          tooltip={!empresaId || !proveedorId ? "Seleccione empresa y proveedor primero" : ""}
        >
          {documentoSeleccionado ? (
            <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <Tag value={documentoSeleccionado.tipoDocumento?.descripcion || "DOC"} severity="info" />
              <Tag value={documentoSeleccionado.numeroDocumentoFinal || documentoSeleccionado.numeroDocumento} severity="success" style={{ fontWeight: "bold" }} />
              <Tag value={formatearFecha(documentoSeleccionado.fechaFacturacion || documentoSeleccionado.fechaDocumento)} severity="warning" />
              <span style={{
                backgroundColor: documentoSeleccionado.moneda?.colorFondo || '#FFFFE0',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                {documentoSeleccionado.moneda?.simbolo || 'S/.'} {formatearNumero(documentoSeleccionado.total)}
              </span>
            </span>
          ) : (
            <span style={{ color: "#999" }}>📄 {placeholder}</span>
          )}
        </Button>

        {showClearButton && documentoSeleccionado && !disabled && (
          <Button
            type="button"
            icon="pi pi-times"
            onClick={handleLimpiar}
            className="p-button-rounded p-button-text p-button-danger"
            tooltip="Limpiar selección"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>

      <Dialog
        header={header}
        visible={visible}
        style={{ width: "80vw" }}
        onHide={() => setVisible(false)}
        maximizable
      >
        <DataTable
          value={documentos}
          loading={loading}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron órdenes de compra"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        >
          <Column
            field="numeroDocumentoFinal"
            header="N° Documento Final"
            body={(rowData) => rowData.numeroDocumentoFinal || rowData.numeroDocumento}
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="fechaFacturacion"
            header="Fecha Facturación"
            body={(rowData) => formatearFecha(rowData.fechaFacturacion || rowData.fechaDocumento)}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="proveedor.razonSocial"
            header="Proveedor"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="total"
            header="Total"
            body={(rowData) => (
              <Tag
                value={`${rowData.moneda?.simbolo || ''} ${formatearNumero(rowData.total)}`}
                style={{
                  backgroundColor: rowData.moneda?.colorFondo || '#6366f1',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              />
            )}
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            field="estado.descripcion"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ minWidth: "100px" }}
          />
        </DataTable>
      </Dialog>
    </>
  );
}