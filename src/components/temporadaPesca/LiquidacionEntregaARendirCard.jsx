import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFLiquidacionEntregaARendir } from "./LiquidacionEntregaARendirPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const LiquidacionEntregaARendirCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  detMovId,
  readOnly = false,
  movimientoData = {},
  onLiquidacionExitosa,
  onGuardarMovimiento,
}) => {
  const toast = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [liquidando, setLiquidando] = useState(false);

  const esAsignacionOrigen = !getValues("asignacionOrigenId");
  const esEntregaARendir = getValues("formaParteCalculoEntregaARendir");
  const estaLiquidada = getValues("entregaARendirLiquidada");
  const urlLiquidacion = getValues("urlLiquidacionEntregaARendir");
  const entregaARendirId = movimientoData?.entregaARendirId;

  useEffect(() => {
    if (urlLiquidacion) {
      setPdfUrl(urlLiquidacion);
    }
  }, [urlLiquidacion]);

  const generarPdfWrapper = async () => {
    if (!detMovId) {
      throw new Error(
        "Debe guardar el movimiento antes de generar la liquidación",
      );
    }

    // Obtener datos frescos del backend
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir/${detMovId}/con-gastos`,
      {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error al obtener datos del movimiento");
    }

    const movimientoCompleto = await response.json();

    // Construir nombre completo del responsable
    const responsableNombre = movimientoCompleto.responsable
      ? `${movimientoCompleto.responsable.nombres || ""} ${movimientoCompleto.responsable.apellidos || ""}`.trim()
      : "-";

    const gastosAsociados = movimientoCompleto.gastosAsociados || [];
    const montoAsignado = Number(movimientoCompleto.monto) || 0;
    const totalGastado = gastosAsociados.reduce(
      (sum, gasto) => sum + Number(gasto.monto || 0),
      0,
    );
    const saldo = montoAsignado - totalGastado;

    const liquidacionData = {
      ...movimientoCompleto,
      responsable: {
        ...movimientoCompleto.responsable,
        nombreCompleto: responsableNombre,
      },
      totales: {
        montoAsignado,
        totalGastado,
        saldo,
      },
    };

    const resultado = await generarYSubirPDFLiquidacionEntregaARendir(
      liquidacionData,
      movimientoCompleto.entregaARendir?.temporadaPesca?.empresa,
    );

    if (resultado.success && resultado.urlPdf) {
      setPdfUrl(resultado.urlPdf);

      // Actualizar el formulario con la URL del PDF generado
      setValue("urlLiquidacionEntregaARendir", resultado.urlPdf);

      // Guardar automáticamente el movimiento con la URL del PDF
      if (onGuardarMovimiento) {
        await onGuardarMovimiento();
      }

      if (toast?.current) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "PDF de liquidación generado y guardado correctamente",
          life: 3000,
        });
      }
    }
    return resultado;
  };

  const confirmarLiquidacion = () => {
    if (!pdfUrl) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe generar el PDF antes de liquidar",
        life: 3000,
      });
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de liquidar esta Entrega a Rendir? Esta acción cerrará todos los movimientos asociados y no se podrá revertir.",
      header: "Confirmar Liquidación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Liquidar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => liquidarEntregaARendir(),
    });
  };

  const liquidarEntregaARendir = async () => {
    try {
      setLiquidando(true);

      if (!entregaARendirId) {
        throw new Error("No se encontró el ID de la Entrega a Rendir");
      }

      if (!pdfUrl) {
        throw new Error("Debe generar el PDF antes de liquidar");
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/entrega-a-rendir/${entregaARendirId}/liquidar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            urlLiquidacionPdf: pdfUrl,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al liquidar la entrega a rendir",
        );
      }

      const resultado = await response.json();

      setValue("entregaARendirLiquidada", true);
      setValue("fechaLiquidacionEntregaARendir", new Date());
      setValue("urlLiquidacionEntregaARendir", pdfUrl);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Entrega a Rendir liquidada correctamente. Se actualizaron ${resultado.movimientosActualizados} movimientos.`,
        life: 5000,
      });

      // Notificar al componente padre para recargar datos
      if (onLiquidacionExitosa) {
        onLiquidacionExitosa();
      }
    } catch (error) {
      console.error("Error al liquidar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al liquidar la entrega a rendir",
        life: 5000,
      });
    } finally {
      setLiquidando(false);
    }
  };

  if (!esAsignacionOrigen || !esEntregaARendir) {
    return (
      <Card title="Liquidación de Entrega a Rendir">
        <div className="text-center p-4">
          <i
            className="pi pi-info-circle"
            style={{ fontSize: "2rem", color: "#6c757d" }}
          ></i>
          <p className="mt-3 text-600">
            Esta funcionalidad solo está disponible para registros de Asignación
            Origen que forman parte del cálculo de entrega a rendir.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card title="Liquidación de Entrega a Rendir">
        <PDFGeneratedUploader
          generatePdfFunction={generarPdfWrapper}
          pdfData={getValues()}
          moduleName="liquidacion-entrega-rendir-pesca-industrial"
          entityId={detMovId}
          fileName={`liquidacion-entrega-rendir-${detMovId}.pdf`}
          buttonLabel="Generar Liquidación"
          buttonIcon="pi pi-file-pdf"
          buttonClassName="p-button-success"
          disabled={!detMovId || readOnly || estaLiquidada}
          warningMessage={
            !detMovId
              ? "Debe guardar el movimiento antes de generar la liquidación"
              : estaLiquidada
                ? "Esta entrega a rendir ya está liquidada"
                : null
          }
          toast={toast}
          viewerHeight="600px"
          onGenerateComplete={(url) => setPdfUrl(url)}
          initialPdfUrl={urlLiquidacion}
          customControls={
            !estaLiquidada &&
            pdfUrl && (
              <Button
                label="Liquidar Entrega a Rendir"
                icon="pi pi-check-circle"
                className="p-button-primary"
                onClick={confirmarLiquidacion}
                loading={liquidando}
                disabled={!pdfUrl}
                style={{ width: "100%" }}
              />
            )
          }
        />
      </Card>
    </>
  );
};

export default LiquidacionEntregaARendirCard;
