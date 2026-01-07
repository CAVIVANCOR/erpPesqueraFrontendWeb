// src/components/preFactura/BotonesGeneracionComprobante.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { generarFacturaDesdePreFactura, generarBoletaDesdePreFactura, getSeriesDoc } from "../../api/preFactura";
import { getComprobantesByPreFactura } from "../../api/facturacionElectronica/comprobanteElectronico";

/**
 * Componente de botones para generar Factura o Boleta desde PreFactura
 * Muestra comprobantes ya generados y permite crear nuevos
 */
const BotonesGeneracionComprobante = ({ preFacturaId, empresaId, facturado, toast, onComprobanteGenerado }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState(null); // 'factura' o 'boleta'
  const [seriesDisponibles, setSeriesDisponibles] = useState([]);
  const [serieSeleccionada, setSerieSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comprobantesGenerados, setComprobantesGenerados] = useState([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);

  // Cargar comprobantes ya generados
  useEffect(() => {
    if (preFacturaId) {
      cargarComprobantesGenerados();
    }
  }, [preFacturaId]);

  const cargarComprobantesGenerados = async () => {
    try {
      setLoadingComprobantes(true);
      const comprobantes = await getComprobantesByPreFactura(preFacturaId);
      setComprobantesGenerados(comprobantes || []);
    } catch (error) {
      console.error("Error al cargar comprobantes generados:", error);
      setComprobantesGenerados([]);
    } finally {
      setLoadingComprobantes(false);
    }
  };

  const abrirDialogoGeneracion = async (tipo) => {
    setTipoComprobante(tipo);
    setSerieSeleccionada(null);
    
    // Cargar series según el tipo de comprobante
    const tipoDocumentoId = tipo === 'factura' ? 1 : 3; // 01=Factura, 03=Boleta
    
    try {
      setLoading(true);
      const series = await getSeriesDoc(empresaId, tipoDocumentoId);
      setSeriesDisponibles(series || []);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar series:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las series de documentos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarComprobante = async () => {
    if (!serieSeleccionada) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una serie de documento",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      
      const datos = {
        serieDocFinalId: Number(serieSeleccionada),
        tipoDocumentoFinalId: tipoComprobante === 'factura' ? 1 : 3,
      };

      let resultado;
      if (tipoComprobante === 'factura') {
        resultado = await generarFacturaDesdePreFactura(preFacturaId, datos);
      } else {
        resultado = await generarBoletaDesdePreFactura(preFacturaId, datos);
      }

      toast?.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `${tipoComprobante === 'factura' ? 'Factura' : 'Boleta'} generada: ${resultado.comprobante?.numeroCompleto || 'OK'}`,
        life: 5000,
      });

      setShowDialog(false);
      cargarComprobantesGenerados();
      
      if (onComprobanteGenerado) {
        onComprobanteGenerado(resultado);
      }
    } catch (error) {
      console.error("Error al generar comprobante:", error);
      toast?.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "No se pudo generar el comprobante",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const seriesOptions = seriesDisponibles.map((s) => ({
    label: `${s.serie} (Correlativo: ${Number(s.correlativo)})`,
    value: Number(s.id),
  }));

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

      {/* Botones de generación */}
      <div className="flex gap-2">
        <Button
          label="Generar Factura"
          icon="pi pi-file"
          className="p-button-success"
          onClick={() => abrirDialogoGeneracion('factura')}
          disabled={!preFacturaId || loading}
          tooltip="Generar Factura Electrónica desde esta PreFactura"
        />
        <Button
          label="Generar Boleta"
          icon="pi pi-file-edit"
          className="p-button-info"
          onClick={() => abrirDialogoGeneracion('boleta')}
          disabled={!preFacturaId || loading}
          tooltip="Generar Boleta Electrónica desde esta PreFactura"
        />
      </div>

      {/* Dialog de selección de serie */}
      <Dialog
        header={`Generar ${tipoComprobante === 'factura' ? 'Factura' : 'Boleta'} Electrónica`}
        visible={showDialog}
        style={{ width: '450px' }}
        onHide={() => setShowDialog(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            />
            <Button
              label="Generar"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleGenerarComprobante}
              loading={loading}
              disabled={!serieSeleccionada}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="serie">Serie de Documento *</label>
            <Dropdown
              id="serie"
              value={serieSeleccionada}
              options={seriesOptions}
              onChange={(e) => setSerieSeleccionada(e.value)}
              placeholder="Seleccione una serie"
              disabled={loading}
            />
            <small className="text-gray-600">
              Seleccione la serie para el {tipoComprobante === 'factura' ? 'factura' : 'boleta'} electrónica
            </small>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BotonesGeneracionComprobante;