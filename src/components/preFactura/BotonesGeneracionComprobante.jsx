// src/components/preFactura/BotonesGeneracionComprobante.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { getComprobantesByPreFactura } from "../../api/facturacionElectronica/comprobanteElectronico";

/**
 * Componente simplificado para generar Comprobante Electrónico desde PreFactura EMITIDA
 * El tipo de comprobante se detecta automáticamente desde tipoDocumentoId de la PreFactura
 */
const BotonesGeneracionComprobante = ({ 
  preFacturaId, 
  tipoDocumentoId,
  esGerencial,
  estadoId,
  toast, 
  onGenerarComprobante 
}) => {
  const [loading, setLoading] = useState(false);
  const [comprobantesGenerados, setComprobantesGenerados] = useState([]);

  // Cargar comprobantes ya generados
  useEffect(() => {
    if (preFacturaId) {
      cargarComprobantesGenerados();
    }
  }, [preFacturaId]);

  const cargarComprobantesGenerados = async () => {
    try {
      const comprobantes = await getComprobantesByPreFactura(preFacturaId);
      setComprobantesGenerados(comprobantes || []);
    } catch (error) {
      console.error("Error al cargar comprobantes generados:", error);
      setComprobantesGenerados([]);
    }
  };

  const handleGenerarClick = async () => {
    if (!preFacturaId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay PreFactura seleccionada",
        life: 3000,
      });
      return;
    }

    // Validar que esté en estado EMITIDA (96)
    if (estadoId !== 96) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "La PreFactura debe estar en estado EMITIDA para generar el comprobante",
        life: 3000,
      });
      return;
    }

    // Validar que NO sea gerencial
    if (esGerencial) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Las PreFacturas gerenciales no generan Comprobantes Electrónicos SUNAT",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await onGenerarComprobante();
      await cargarComprobantesGenerados();
    } catch (error) {
      console.error("Error al generar comprobante:", error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar el tipo de comprobante según tipoDocumentoId
  const getTipoComprobanteLabel = () => {
    if (tipoDocumentoId === 1) return "Factura";
    if (tipoDocumentoId === 3) return "Boleta";
    return "Comprobante";
  };

  // Validar si puede generar comprobante
  const puedeGenerar = preFacturaId && estadoId === 96 && !esGerencial;

  return (
    <div className="botones-generacion-comprobante">
      {/* Mostrar comprobantes ya generados */}
      {comprobantesGenerados.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold mb-2">Comprobantes Generados:</h4>
          <div className="flex flex-wrap gap-2">
            {comprobantesGenerados.map((comp) => (
              <Badge
                key={comp.id}
                value={`${comp.tipoComprobante?.descripcion || 'Comprobante'}: ${comp.numeroCompleto || comp.id}`}
                severity={comp.nubefactAceptadoPorSunat ? "success" : "warning"}
                size="large"
              />
            ))}
          </div>
        </div>
      )}

      {/* Botón único de generación */}
      <div className="flex gap-2">
        <Button
          label={`Generar Comprobante Electrónico (${getTipoComprobanteLabel()})`}
          icon="pi pi-file-check"
          className="p-button-success"
          onClick={handleGenerarClick}
          loading={loading}
          disabled={!puedeGenerar || loading}
          tooltip={
            !puedeGenerar
              ? "La PreFactura debe estar EMITIDA y no ser gerencial"
              : `Generar ${getTipoComprobanteLabel()} Electrónica y enviar a SUNAT`
          }
        />
      </div>

      {/* Información del estado */}
      {!puedeGenerar && preFacturaId && (
        <div className="mt-2">
          <small className="text-gray-600">
            {esGerencial && "⚠️ Las PreFacturas gerenciales no generan comprobantes SUNAT"}
            {!esGerencial && estadoId !== 96 && "⚠️ Primero debe facturar la PreFactura (estado EMITIDA)"}
          </small>
        </div>
      )}
    </div>
  );
};

export default BotonesGeneracionComprobante;