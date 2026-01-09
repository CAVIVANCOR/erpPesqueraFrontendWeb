// src/components/preFactura/FacturacionElectronicaTab.jsx
import React, { useState, useEffect } from "react";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import { getResponsiveFontSize } from "../../utils/utils";

export default function FacturacionElectronicaTab({
  formData,
  onChange,
  tiposDocumentoOptions,
  seriesDocumentoFinalOptions,
  puedeEditar,
  readOnly,
  onGenerarComprobante,
  onPartirDocumento,
  toast,
}) {
  const [tipoDocumentoFinalSeleccionado, setTipoDocumentoFinalSeleccionado] = useState(null);
  const [serieDocFinalSeleccionada, setSerieDocFinalSeleccionada] = useState(null);

  // Sincronizar con formData cuando se carga
  useEffect(() => {
    if (formData.tipoDocumentoFinalId) {
      setTipoDocumentoFinalSeleccionado(Number(formData.tipoDocumentoFinalId));
    }
    if (formData.serieDocFinalId) {
      setSerieDocFinalSeleccionada(Number(formData.serieDocFinalId));
    }
  }, [formData.tipoDocumentoFinalId, formData.serieDocFinalId]);

  // Manejar cambio de tipo de documento final
  const handleTipoDocumentoFinalChange = (tipoId) => {
    setTipoDocumentoFinalSeleccionado(tipoId);
    onChange("tipoDocumentoFinalId", tipoId);
    // Limpiar serie cuando cambia el tipo
    setSerieDocFinalSeleccionada(null);
    onChange("serieDocFinalId", null);
  };

  // Manejar cambio de serie final
  const handleSerieDocFinalChange = (serieId) => {
    setSerieDocFinalSeleccionada(serieId);
    onChange("serieDocFinalId", serieId);
  };

  // Generar comprobante electrónico
  const handleGenerarComprobante = () => {
    if (!tipoDocumentoFinalSeleccionado || !serieDocFinalSeleccionada) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar el tipo de documento y la serie antes de generar el comprobante.",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message: "¿Está seguro de generar el comprobante electrónico? Esta acción no se puede deshacer.",
      header: "Confirmar Generación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-success",
      acceptLabel: "Sí, generar",
      rejectLabel: "Cancelar",
      accept: () => {
        if (onGenerarComprobante) {
          onGenerarComprobante({
            tipoDocumentoFinalId: tipoDocumentoFinalSeleccionado,
            serieDocFinalId: serieDocFinalSeleccionada,
          });
        }
      },
    });
  };

  // Partir documento en Blanca/Negra
  const handlePartirDocumento = () => {
    confirmDialog({
      message: "¿Está seguro de partir este documento en Facturación Blanca y Negra? Se crearán 2 nuevas pre-facturas y esta se anulará.",
      header: "Confirmar Partición",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-warning",
      acceptLabel: "Sí, partir",
      rejectLabel: "Cancelar",
      accept: () => {
        if (onPartirDocumento) {
          onPartirDocumento();
        }
      },
    });
  };

  // Filtrar series por tipo de documento seleccionado
  const seriesFiltradas = seriesDocumentoFinalOptions.filter(
    (serie) => Number(serie.tipoDocumentoId) === Number(tipoDocumentoFinalSeleccionado)
  );

  return (
    <div className="fluid">
      {/* ============================================ */}
      {/* PANEL: ESTADO DE FACTURACIÓN */}
      {/* ============================================ */}
      <Panel header="📊 Estado de Facturación" toggleable>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {formData.facturado && (
            <Badge
              value="FACTURADO"
              severity="success"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
          )}
          {formData.esGerencial && (
            <Badge
              value="GERENCIAL (NO SUNAT)"
              severity="warning"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
          )}
          {formData.esParticionada && (
            <Badge
              value="PARTICIONADA"
              severity="info"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
          )}
          {!formData.facturado && !formData.esGerencial && !formData.esParticionada && (
            <Badge
              value="PENDIENTE DE FACTURACIÓN"
              severity="secondary"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
          )}
        </div>

        {formData.facturado && formData.fechaFacturacion && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Fecha de Facturación: </strong>
            {new Date(formData.fechaFacturacion).toLocaleDateString("es-PE")}
          </div>
        )}

        {formData.numeroDocumentoFinal && (
          <div style={{ marginTop: "0.5rem" }}>
            <strong>Comprobante Generado: </strong>
            {formData.numeroDocumentoFinal}
          </div>
        )}
      </Panel>

      {/* ============================================ */}
      {/* PANEL: GENERAR COMPROBANTE ELECTRÓNICO */}
      {/* ============================================ */}
      {!formData.facturado && (
        <Panel
          header="📄 Generar Comprobante Electrónico"
          toggleable
          style={{ marginTop: "1rem" }}
        >
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="tipoDocumentoFinalId"
              >
                Tipo de Documento Final*
              </label>
              <Dropdown
                id="tipoDocumentoFinalId"
                value={tipoDocumentoFinalSeleccionado}
                options={tiposDocumentoOptions}
                onChange={(e) => handleTipoDocumentoFinalChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo (Factura/Boleta)"
                filter
                disabled={!puedeEditar || readOnly || formData.facturado}
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="serieDocFinalId"
              >
                Serie del Documento Final*
              </label>
              <Dropdown
                id="serieDocFinalId"
                value={serieDocFinalSeleccionada}
                options={seriesFiltradas}
                onChange={(e) => handleSerieDocFinalChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar serie"
                filter
                disabled={
                  !puedeEditar ||
                  readOnly ||
                  formData.facturado ||
                  !tipoDocumentoFinalSeleccionado
                }
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              />
            </div>

            <div style={{ flex: 0.7 }}>
              <label
                style={{ fontWeight: "bold", fontSize: getResponsiveFontSize() }}
                htmlFor="numCorreDocFinal"
              >
                Correlativo
              </label>
              <InputText
                id="numCorreDocFinal"
                value={formData.numCorreDocFinal || "Automático"}
                disabled
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  backgroundColor: "#f0f0f0",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            <Button
              label="Generar Comprobante Electrónico"
              icon="pi pi-file-pdf"
              className="p-button-success"
              onClick={handleGenerarComprobante}
              disabled={
                !puedeEditar ||
                readOnly ||
                formData.facturado ||
                !tipoDocumentoFinalSeleccionado ||
                !serieDocFinalSeleccionada
              }
              tooltip={
                formData.facturado
                  ? "Ya se generó el comprobante"
                  : !tipoDocumentoFinalSeleccionado || !serieDocFinalSeleccionada
                  ? "Debe seleccionar tipo de documento y serie"
                  : "Generar comprobante electrónico SUNAT"
              }
            />
          </div>
        </Panel>
      )}

      {/* ============================================ */}
      {/* PANEL: PARTIR DOCUMENTO (BLANCA/NEGRA) */}
      {/* ============================================ */}
      {!formData.facturado && !formData.esParticionada && (
        <Panel
          header="✂️ Partir Documento (Facturación Blanca/Negra)"
          toggleable
          collapsed={true}
          style={{ marginTop: "1rem" }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Importante:</strong> Esta acción dividirá la pre-factura actual en dos nuevas:
            </p>
            <ul>
              <li>
                <strong>Facturación Blanca:</strong> Para reportar a SUNAT (Formal)
              </li>
              <li>
                <strong>Facturación Negra:</strong> Gerencial (No SUNAT)
              </li>
            </ul>
            <p>
              La pre-factura actual se marcará como <strong>PARTICIONADA</strong> y se anulará.
            </p>
          </div>

          <Button
            label="Partir Documento"
            icon="pi pi-clone"
            className="p-button-warning"
            onClick={handlePartirDocumento}
            disabled={!puedeEditar || readOnly || formData.facturado || formData.esParticionada}
            tooltip={
              formData.facturado
                ? "No se puede partir un documento ya facturado"
                : formData.esParticionada
                ? "Este documento ya fue particionado"
                : "Dividir en Facturación Blanca y Negra"
            }
          />
        </Panel>
      )}

      {/* ============================================ */}
      {/* INFORMACIÓN DE DOCUMENTO PARTICIONADO */}
      {/* ============================================ */}
      {formData.esParticionada && (
        <Panel
          header="ℹ️ Documento Particionado"
          toggleable
          style={{ marginTop: "1rem" }}
        >
          <div>
            <Badge
              value="ESTE DOCUMENTO FUE PARTICIONADO"
              severity="info"
              style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
            <p style={{ marginTop: "1rem" }}>
              Este documento fue dividido en Facturación Blanca y Negra. Consulte las nuevas
              pre-facturas generadas.
            </p>
          </div>
        </Panel>
      )}

      {/* ============================================ */}
      {/* INFORMACIÓN DE DOCUMENTO ORIGEN (SI ES PARTICIÓN) */}
      {/* ============================================ */}
      {formData.preFacturaOrigenId && (
        <Panel
          header="🔗 Documento Origen"
          toggleable
          collapsed={true}
          style={{ marginTop: "1rem" }}
        >
          <div>
            <p>
              <strong>Pre-Factura Origen ID:</strong> {formData.preFacturaOrigenId}
            </p>
            <p>Este documento fue creado a partir de una partición de facturación.</p>
          </div>
        </Panel>
      )}
    </div>
  );
}
