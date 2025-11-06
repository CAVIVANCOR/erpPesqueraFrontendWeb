/**
 * Card de Documentos Requeridos para Cotización de Ventas
 * 
 * Funcionalidades:
 * - DataTable con documentos requeridos según país destino
 * - Agregar/Editar/Eliminar documentos
 * - Control de documentos obligatorios
 * - Observaciones por documento
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getPaises } from "../../api/pais";

const DocumentosRequeridosCard = ({
  cotizacionId,
  paisDestinoId,
  documentos,
  setDocumentos,
  toast,
}) => {
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [paises, setPaises] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [tipoDocumentoId, setTipoDocumentoId] = useState(null);
  const [paisId, setPaisId] = useState(null);
  const [esObligatorio, setEsObligatorio] = useState(true);
  const [requiereOriginal, setRequiereOriginal] = useState(false);
  const [requiereCopia, setRequiereCopia] = useState(true);
  const [cantidadCopias, setCantidadCopias] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  const [orden, setOrden] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Cuando cambia el país destino, actualizar el país en el formulario
    if (paisDestinoId) {
      setPaisId(Number(paisDestinoId));
    }
  }, [paisDestinoId]);

  const cargarDatos = async () => {
    try {
      const [tiposDocData, paisesData] = await Promise.all([
        getTiposDocumento(),
        getPaises(),
      ]);

      setTiposDocumento(tiposDocData);
      setPaises(paisesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    }
  };

  const abrirDialogoNuevo = () => {
    limpiarFormulario();
    setEditingDocumento(null);
    setOrden(documentos.length + 1);
    setPaisId(paisDestinoId ? Number(paisDestinoId) : null);
    setShowDialog(true);
  };

  const abrirDialogoEditar = (documento) => {
    setEditingDocumento(documento);
    setTipoDocumentoId(documento.tipoDocumentoId);
    setPaisId(documento.paisId);
    setEsObligatorio(documento.esObligatorio);
    setRequiereOriginal(documento.requiereOriginal);
    setRequiereCopia(documento.requiereCopia);
    setCantidadCopias(documento.cantidadCopias || 1);
    setObservaciones(documento.observaciones || "");
    setOrden(documento.orden);
    setShowDialog(true);
  };

  const limpiarFormulario = () => {
    setTipoDocumentoId(null);
    setPaisId(paisDestinoId ? Number(paisDestinoId) : null);
    setEsObligatorio(true);
    setRequiereOriginal(false);
    setRequiereCopia(true);
    setCantidadCopias(1);
    setObservaciones("");
    setOrden(0);
  };

  const handleGuardarDocumento = () => {
    if (!tipoDocumentoId || !paisId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar tipo de documento y país",
        life: 3000,
      });
      return;
    }

    const tipoDoc = tiposDocumento.find((t) => Number(t.id) === Number(tipoDocumentoId));
    const pais = paises.find((p) => Number(p.id) === Number(paisId));

    const nuevoDocumento = {
      id: editingDocumento?.id || Date.now(),
      tipoDocumentoId: Number(tipoDocumentoId),
      tipoDocumento: tipoDoc,
      paisId: Number(paisId),
      pais: pais,
      esObligatorio: esObligatorio,
      requiereOriginal: requiereOriginal,
      requiereCopia: requiereCopia,
      cantidadCopias: Number(cantidadCopias),
      observaciones: observaciones?.trim().toUpperCase() || null,
      orden: Number(orden),
    };

    if (editingDocumento) {
      const nuevosDocumentos = documentos.map((d) =>
        d.id === editingDocumento.id ? nuevoDocumento : d
      );
      setDocumentos(nuevosDocumentos);
      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Documento actualizado correctamente",
        life: 3000,
      });
    } else {
      setDocumentos([...documentos, nuevoDocumento]);
      toast.current?.show({
        severity: "success",
        summary: "Agregado",
        detail: "Documento agregado correctamente",
        life: 3000,
      });
    }

    setShowDialog(false);
    limpiarFormulario();
  };

  const confirmarEliminar = (documento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el documento ${documento.tipoDocumento?.nombre}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarDocumento(documento),
    });
  };

  const eliminarDocumento = (documento) => {
    const nuevosDocumentos = documentos.filter((d) => d.id !== documento.id);
    setDocumentos(nuevosDocumentos);
    toast.current?.show({
      severity: "success",
      summary: "Eliminado",
      detail: "Documento eliminado correctamente",
      life: 3000,
    });
  };

  // Templates
  const ordenTemplate = (rowData) => {
    return <span style={{ fontWeight: "bold" }}>{rowData.orden}</span>;
  };

  const tipoDocumentoTemplate = (rowData) => {
    return <span>{rowData.tipoDocumento?.nombre || "N/A"}</span>;
  };

  const paisTemplate = (rowData) => {
    return <span>{rowData.pais?.nombre || "N/A"}</span>;
  };

  const obligatorioTemplate = (rowData) => {
    return rowData.esObligatorio ? (
      <i className="pi pi-check-circle" style={{ color: "#4CAF50", fontSize: "1.2rem" }} />
    ) : (
      <i className="pi pi-times-circle" style={{ color: "#999", fontSize: "1.2rem" }} />
    );
  };

  const originalTemplate = (rowData) => {
    return rowData.requiereOriginal ? (
      <i className="pi pi-check" style={{ color: "#2196F3" }} />
    ) : (
      <span style={{ color: "#999" }}>-</span>
    );
  };

  const copiaTemplate = (rowData) => {
    if (rowData.requiereCopia) {
      return (
        <span style={{ color: "#2196F3", fontWeight: "bold" }}>
          {rowData.cantidadCopias} {rowData.cantidadCopias === 1 ? "copia" : "copias"}
        </span>
      );
    }
    return <span style={{ color: "#999" }}>-</span>;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => abrirDialogoEditar(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "bottom" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "bottom" }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-secondary"
        onClick={() => setShowDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-success"
        onClick={handleGuardarDocumento}
        loading={loading}
      />
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Documentos Requeridos</h3>
        <Button
          label="Agregar Documento"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={abrirDialogoNuevo}
          disabled={!cotizacionId || !paisDestinoId}
        />
      </div>

      {!cotizacionId && (
        <div className="p-message p-message-info" style={{ marginBottom: "1rem" }}>
          <span>Debe guardar primero los datos generales para agregar documentos</span>
        </div>
      )}

      {cotizacionId && !paisDestinoId && (
        <div className="p-message p-message-warn" style={{ marginBottom: "1rem" }}>
          <span>Debe seleccionar un país destino en Datos Generales</span>
        </div>
      )}

      <DataTable
        value={documentos}
        emptyMessage="No hay documentos agregados"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="orden" header="Orden" body={ordenTemplate} style={{ width: "80px" }} />
        <Column field="tipoDocumento.nombre" header="Tipo Documento" body={tipoDocumentoTemplate} />
        <Column field="pais.nombre" header="País" body={paisTemplate} style={{ width: "150px" }} />
        <Column field="esObligatorio" header="Obligatorio" body={obligatorioTemplate} style={{ width: "110px" }} />
        <Column field="requiereOriginal" header="Original" body={originalTemplate} style={{ width: "90px" }} />
        <Column field="requiereCopia" header="Copias" body={copiaTemplate} style={{ width: "120px" }} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Resumen */}
      {documentos.length > 0 && (
        <div style={{ marginTop: "1rem", textAlign: "right", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
          <div style={{ fontSize: "1.1rem", color: "#2196F3", fontWeight: "bold" }}>
            <strong>Total Documentos:</strong> {documentos.length}
          </div>
        </div>
      )}

      {/* Dialog para agregar/editar documento */}
      <Dialog
        visible={showDialog}
        style={{ width: "700px" }}
        header={editingDocumento ? "Editar Documento" : "Agregar Documento"}
        modal
        footer={dialogFooter}
        onHide={() => setShowDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <label htmlFor="tipoDocumentoId" style={{ fontWeight: "bold" }}>
              Tipo de Documento *
            </label>
            <Dropdown
              id="tipoDocumentoId"
              value={tipoDocumentoId}
              options={tiposDocumento.map((t) => ({
                label: t.nombre,
                value: Number(t.id),
              }))}
              onChange={(e) => setTipoDocumentoId(e.value)}
              placeholder="Seleccionar tipo"
              filter
              showClear
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="paisId" style={{ fontWeight: "bold" }}>
              País *
            </label>
            <Dropdown
              id="paisId"
              value={paisId}
              options={paises.map((p) => ({
                label: p.nombre,
                value: Number(p.id),
              }))}
              onChange={(e) => setPaisId(e.value)}
              placeholder="Seleccionar país"
              filter
              showClear
              className="w-full"
              disabled={!!paisDestinoId}
              style={paisDestinoId ? { backgroundColor: "#f0f0f0" } : {}}
            />
          </div>

          <div className="col-12 md:col-3">
            <label htmlFor="orden" style={{ fontWeight: "bold" }}>
              Orden
            </label>
            <Dropdown
              id="orden"
              value={orden}
              options={[...Array(20)].map((_, i) => ({
                label: String(i + 1),
                value: i + 1,
              }))}
              onChange={(e) => setOrden(e.value)}
              placeholder="Orden"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-3">
            <label htmlFor="cantidadCopias" style={{ fontWeight: "bold" }}>
              Cantidad Copias
            </label>
            <Dropdown
              id="cantidadCopias"
              value={cantidadCopias}
              options={[...Array(10)].map((_, i) => ({
                label: String(i + 1),
                value: i + 1,
              }))}
              onChange={(e) => setCantidadCopias(e.value)}
              placeholder="Copias"
              className="w-full"
              disabled={!requiereCopia}
            />
          </div>

          <div className="col-12 md:col-6">
            <div style={{ marginTop: "1.5rem" }}>
              <div className="field-checkbox" style={{ marginBottom: "0.5rem" }}>
                <Checkbox
                  inputId="esObligatorio"
                  checked={esObligatorio}
                  onChange={(e) => setEsObligatorio(e.checked)}
                />
                <label htmlFor="esObligatorio" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                  Es Obligatorio
                </label>
              </div>

              <div className="field-checkbox" style={{ marginBottom: "0.5rem" }}>
                <Checkbox
                  inputId="requiereOriginal"
                  checked={requiereOriginal}
                  onChange={(e) => setRequiereOriginal(e.checked)}
                />
                <label htmlFor="requiereOriginal" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                  Requiere Original
                </label>
              </div>

              <div className="field-checkbox">
                <Checkbox
                  inputId="requiereCopia"
                  checked={requiereCopia}
                  onChange={(e) => setRequiereCopia(e.checked)}
                />
                <label htmlFor="requiereCopia" style={{ fontWeight: "bold", marginLeft: "0.5rem" }}>
                  Requiere Copia
                </label>
              </div>
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
              Observaciones
            </label>
            <InputTextarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.toUpperCase())}
              rows={3}
              className="w-full"
              style={{ textTransform: "uppercase" }}
              placeholder="OBSERVACIONES SOBRE EL DOCUMENTO..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DocumentosRequeridosCard;