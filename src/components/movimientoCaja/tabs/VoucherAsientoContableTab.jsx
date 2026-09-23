/**
 * VoucherAsientoContableTab.jsx - Tab para visualizar y regenerar voucher del asiento contable
 *
 * Componente para mostrar el voucher contable (comprobante de diario) de un movimiento de caja.
 * Usa PDFDocumentManager para consistencia, pero con URL dinámica si no hay guardada.
 * Permite regenerar el voucher cuando sea necesario.
 *
 * @author ERP Megui
 * @version 10.0.0
 */

import React, { useState } from "react";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { useForm } from "react-hook-form";
import { regenerarVoucherContable } from "../../../api/movimientoCaja";

export default function VoucherAsientoContableTab({ movimiento, toast, onMovimientoActualizado }) {
  const [regenerando, setRegenerando] = useState(false);
  
  // ✅ Si no hay URL guardada, usar endpoint dinámico
  const urlPdfInicial = movimiento?.urlDocumentoMovCaja || 
    `/api/movimientos-caja/${movimiento?.id}/generar-voucher-contable`;
  
  const [urlPdf, setUrlPdf] = useState(urlPdfInicial);

  const { control, setValue, watch, getValues } = useForm({
    defaultValues: {
      urlDocumentoMovCaja: urlPdfInicial
    }
  });

  // ✅ Validar que el movimiento tenga ID
  if (!movimiento?.id) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="warn"
          text="No se puede generar el voucher: Movimiento no válido"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  /**
   * Maneja la regeneración del voucher contable
   */
  const handleRegenerarVoucher = () => {
    confirmDialog({
      message: (
        <div>
          <p className="mb-2">¿Está seguro de regenerar el voucher contable?</p>
          <p className="text-600 text-sm mb-0">
            Esto generará un nuevo PDF con los datos actuales del asiento contable y lo guardará en el servidor.
          </p>
        </div>
      ),
      header: "⚠️ Confirmar Regeneración",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Regenerar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-warning",
      accept: async () => {
        setRegenerando(true);
        
        try {
          const response = await regenerarVoucherContable(movimiento.id);

          if (response.success) {
            toast?.current?.show({
              severity: "success",
              summary: "✅ Voucher Regenerado",
              detail: response.message,
              life: 3000,
            });

            // Actualizar URL del PDF con la nueva URL guardada
            const nuevaUrl = response.data.urlDocumentoMovCaja;
            setUrlPdf(nuevaUrl);
            setValue("urlDocumentoMovCaja", nuevaUrl);

            // Notificar al componente padre si existe callback
            if (onMovimientoActualizado) {
              onMovimientoActualizado(response.data);
            }
          }
        } catch (error) {
          console.error("Error al regenerar voucher:", error);
          
          const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.error ||
            "Error al regenerar el voucher contable";

          toast?.current?.show({
            severity: "error",
            summary: "❌ Error",
            detail: errorMessage,
            life: 5000,
          });
        } finally {
          setRegenerando(false);
        }
      },
    });
  };

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          {/* Header con botón de regenerar */}
          <div className="flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-2 flex align-items-center">
                <i className="pi pi-file-pdf mr-2 text-primary"></i>
                Voucher del Asiento Contable
              </h5>
              <p className="text-600 text-sm m-0">
                Comprobante de diario generado automáticamente desde el asiento contable del movimiento.
              </p>
            </div>
            <Button
              label="Regenerar y Guardar"
              icon={regenerando ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
              className="p-button-warning"
              onClick={handleRegenerarVoucher}
              disabled={regenerando}
              tooltip="Regenera el PDF con los datos actuales del asiento contable y lo guarda en el servidor"
              tooltipOptions={{ position: "left" }}
            />
          </div>

          {/* Mensaje informativo durante regeneración */}
          {regenerando && (
            <Message
              severity="info"
              text="Regenerando voucher contable, por favor espere..."
              className="mb-3"
            />
          )}

          {/* Componente genérico de gestión de PDF */}
          <PDFDocumentManager
            moduleName="movimiento-caja-voucher-contable"
            fieldName="urlDocumentoMovCaja"
            entityId={movimiento?.id}
            title="Voucher Contable del Movimiento"
            dialogTitle="Voucher Contable"
            uploadButtonLabel="Subir Voucher"
            viewButtonLabel="Ver"
            downloadButtonLabel="Descargar"
            emptyMessage="No hay voucher contable cargado"
            emptyDescription="No hay voucher contable disponible para este movimiento"
            control={control}
            errors={{}}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={{ urlDocumentoMovCaja: urlPdf }}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
