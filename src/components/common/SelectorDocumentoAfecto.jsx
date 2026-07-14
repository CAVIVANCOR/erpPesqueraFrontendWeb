// src/components/common/SelectorDocumentoAfecto.jsx
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { getPreFacturasParaDocumentoAfecto, getPreFacturaPorId } from "../../api/preFactura";
import { formatearFecha, formatearNumero } from "../../utils/utils";

export default function SelectorDocumentoAfecto({
  value = null,
  onChange,
  empresaId,
  clienteId,
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
    if (visible && empresaId && clienteId) {
      cargarDocumentos();
    }
  }, [visible, empresaId, clienteId, fechaLimite]);

  const cargarDocumentoSeleccionado = async (id) => {
    try {
      const doc = await getPreFacturaPorId(id);
      setDocumentoSeleccionado(doc);
    } catch (error) {
      console.error("Error cargando documento seleccionado:", error);
      setDocumentoSeleccionado(null);
    }
  };

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
      const preFacturaCompleta = await getPreFacturaPorId(rowData.id);
      setDocumentoSeleccionado(preFacturaCompleta);
      onChange(preFacturaCompleta.id);
      setVisible(false);

      toast?.current?.show({
        severity: "success",
        summary: "Documento Seleccionado",
        detail: `${preFacturaCompleta.numeroDocumentoFinal || preFacturaCompleta.numeroDocumento} seleccionado`,
      });
    } catch (error) {
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el documento",
      });
    }
    setLoading(false);
  };

  const handleClear = () => {
    setDocumentoSeleccionado(null);
    onChange(null);
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
    return formatearFecha(rowData.fechaFacturacion || rowData.fechaDocumento);
  };

  const montoTemplate = (rowData) => {
    const moneda = rowData.moneda;
    return (
      <div style={{
        backgroundColor: moneda?.colorFondo || '#FFFFFF',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        display: 'inline-block',
        fontWeight: 'bold'
      }}>
        {moneda?.simbolo || 'S/.'} {formatearNumero(rowData.total)}
      </div>
    );
  };

  const tipoDocumentoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.tipoDocumentoFinal?.descripcion || rowData.tipoDocumento?.descripcion || "N/A"}
        severity="info"
      />
    );
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button
          type="button"
          onClick={() => setVisible(true)}
          disabled={disabled || !empresaId || !clienteId}
          className="p-button-outlined"
          style={{ width: "100%", justifyContent: "flex-start", textAlign: "left" }}
          tooltip={!empresaId || !clienteId ? "Seleccione empresa y cliente primero" : ""}
        >
          {documentoSeleccionado ? (
            <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <Tag value={documentoSeleccionado.tipoDocumentoFinal?.descripcion} severity="success" />
              <Tag value={documentoSeleccionado.numeroDocumentoFinal} severity="info" style={{ fontWeight: "bold" }} />
              <Tag value={formatearFecha(documentoSeleccionado.fechaFacturacion)} severity="warning" />
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
            onClick={handleClear}
            className="p-button-rounded p-button-text p-button-danger"
            tooltip="Limpiar selección"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>

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
          <Column field="tipoDocumentoFinal.descripcion" header="Tipo" body={tipoDocumentoTemplate} sortable />
          <Column field="numeroDocumentoFinal" header="Número" sortable />
          <Column field="fechaFacturacion" header="Fecha" body={fechaTemplate} sortable />
          <Column field="total" header="Total" body={montoTemplate} sortable />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "150px" }} />
        </DataTable>
      </Dialog>
    </>
  );
}