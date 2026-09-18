/**
 * VoucherConsolidadoTab.jsx - Tab para visualizar voucher contable
 *
 * Componente para mostrar el voucher contable (comprobante de diario) de un movimiento de caja.
 * Genera el PDF dinámicamente bajo demanda.
 *
 * @author ERP Megui
 * @version 3.0.0
 */

import React, { useState } from "react";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuthStore } from "../../../shared/stores/useAuthStore";

export default function VoucherConsolidadoTab({ movimiento, toast }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  const generarYMostrarVoucher = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL;
      const token = useAuthStore.getState().token;

      const response = await fetch(
        `${API_URL}/movimientos-caja/${movimiento.id}/generar-voucher-contable`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar el voucher contable');
      }

      // Crear URL del blob para mostrar el PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast?.current?.show({
        severity: 'success',
        summary: 'Voucher generado',
        detail: 'El voucher contable se generó correctamente',
        life: 3000
      });

    } catch (error) {
      console.error('Error al generar voucher:', error);
      setError(error.message);
      
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el voucher contable',
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!movimiento) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="info"
          text="No hay información del movimiento disponible"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <ProgressSpinner />
        <p className="mt-3">Generando voucher contable...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="error"
          text={`Error: ${error}`}
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          onClick={generarYMostrarVoucher}
          className="p-button-primary"
        />
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="info"
          text="Haga clic en el botón para generar el voucher contable"
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <Button
          label="Generar Voucher Contable"
          icon="pi pi-file-pdf"
          onClick={generarYMostrarVoucher}
          className="p-button-success"
        />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="m-0">📄 Voucher Contable (Comprobante de Diario)</h3>
          <Button
            label="Regenerar"
            icon="pi pi-refresh"
            onClick={generarYMostrarVoucher}
            className="p-button-sm p-button-outlined"
            tooltip="Generar nuevo voucher contable"
            tooltipOptions={{ position: 'left' }}
          />
        </div>
        
        <div style={{ 
          width: '100%', 
          height: '600px', 
          border: '1px solid #ddd', 
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <iframe
            src={pdfUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: '6px'
            }}
            title="Voucher Contable"
          />
        </div>
      </div>
    </div>
  );
}
