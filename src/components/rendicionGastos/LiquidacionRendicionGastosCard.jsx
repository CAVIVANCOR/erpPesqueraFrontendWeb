import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputNumber } from "primereact/inputnumber";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirPDFLiquidacionEntregaARendir } from "../temporadaPesca/LiquidacionEntregaARendirPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const LiquidacionRendicionGastosCard = ({
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
  permisos = {},
}) => {
  const toast = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [liquidando, setLiquidando] = useState(false);

  const estaLiquidada = getValues("entregaARendirLiquidada");
  const urlLiquidacion = getValues("urlLiquidacionEntregaARendir");
  const rendicionGastosId = movimientoData?.documentoOrigenId;

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
      movimientoCompleto.empresa,
    );

    if (resultado.success && resultado.urlPdf) {
      setPdfUrl(resultado.urlPdf);

      setValue("urlLiquidacionEntregaARendir", resultado.urlPdf);

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
        "¿Está seguro de liquidar esta Rendición de Gastos? Esta acción cerrará todos los movimientos asociados y no se podrá revertir.",
      header: "Confirmar Liquidación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, Liquidar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: liquidarRendicionGastos,
    });
  };

  const liquidarRendicionGastos = async () => {
    try {
      setLiquidando(true);

      if (!rendicionGastosId) {
        throw new Error("No se encontró el ID de la Rendición de Gastos");
      }

      if (!pdfUrl) {
        throw new Error("Debe generar el PDF antes de liquidar");
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rendiciones-gastos/${rendicionGastosId}/liquidar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            urlLiquidacionPdf: pdfUrl,
            permitirRegeneracion: estaLiquidada && permisos.puedeReactivarDocs,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al liquidar la rendición de gastos",
        );
      }

      const resultado = await response.json();

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Rendición de Gastos liquidada correctamente. Se actualizaron ${resultado.movimientosActualizados} movimientos.`,
        life: 5000,
      });

      if (onLiquidacionExitosa) {
        await onLiquidacionExitosa();
      }
    } catch (error) {
      console.error("Error al liquidar rendición de gastos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al liquidar la rendición de gastos",
        life: 5000,
      });
    } finally {
      setLiquidando(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <Card title="Liquidación de Rendición de Gastos">
        <PDFGeneratedUploader
          generatePdfFunction={generarPdfWrapper}
          pdfData={getValues()}
          moduleName="liquidacion-entrega-rendir-pesca-industrial"
          entityId={detMovId}
          fileName={`liquidacion-rendicion-gastos-${detMovId}.pdf`}
          buttonLabel="Generar Liquidación"
          buttonIcon="pi pi-file-pdf"
          buttonClassName="p-button-success"
          disabled={!detMovId || readOnly || estaLiquidada}
          warningMessage={
            !detMovId
              ? "Debe guardar el movimiento antes de generar la liquidación"
              : estaLiquidada
                ? "Esta rendición de gastos ya está liquidada"
                : null
          }
          toast={toast}
          viewerHeight="600px"
          onGenerateComplete={(url) => setPdfUrl(url)}
          initialPdfUrl={urlLiquidacion}
          customControls={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {(!estaLiquidada || permisos.puedeReactivarDocs) && pdfUrl && (
                <Button
                  label={
                    estaLiquidada
                      ? "Regenerar Liquidación"
                      : "Liquidar Rendición de Gastos"
                  }
                  icon={estaLiquidada ? "pi pi-refresh" : "pi pi-check-circle"}
                  className={
                    estaLiquidada ? "p-button-warning" : "p-button-primary"
                  }
                  onClick={confirmarLiquidacion}
                  loading={liquidando}
                  disabled={!pdfUrl || liquidando}
                  style={{ width: "100%" }}
                  tooltip={
                    estaLiquidada
                      ? "Tiene permiso para regenerar esta liquidación"
                      : "Liquidar y cerrar esta rendición de gastos"
                  }
                  tooltipOptions={{ position: "top" }}
                />
              )}

              {estaLiquidada && !permisos.puedeReactivarDocs && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#d4edda",
                    border: "1px solid #c3e6cb",
                    borderRadius: "6px",
                    color: "#155724",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  ✅ Esta Rendición de Gastos ya está liquidada
                </div>
              )}

              {estaLiquidada && permisos.puedeReactivarDocs && pdfUrl && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "6px",
                    color: "#856404",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  ⚠️ Esta rendición ya está liquidada. Puede regenerar la
                  liquidación si es necesario.
                </div>
              )}
            </div>
          }
        />
      </Card>
    </>
  );
};

export default LiquidacionRendicionGastosCard;
