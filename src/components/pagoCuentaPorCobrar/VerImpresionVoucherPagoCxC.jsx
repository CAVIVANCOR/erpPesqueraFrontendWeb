// src/components/pagoCuentaPorCobrar/VerImpresionVoucherPagoCxC.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import PDFGeneratedUploader from "../pdf/PDFGeneratedUploader";
import { generarYSubirVoucherConsolidado } from "./VoucherConsolidadoPagoCxCPDF";
import { generarYSubirVoucherMovimiento } from "./VoucherMovimientoCajaPDF";

const VerImpresionVoucherPagoCxC = ({
  pagoCuentaPorCobrarId,
  datosPago = {},
  empresa = {},
  cuentaPorCobrar = {},
  toast,
  onPdfGenerated,
}) => {
  const [pdfUrlConsolidado, setPdfUrlConsolidado] = useState(null);
  const [pdfUrlsMovimientos, setPdfUrlsMovimientos] = useState({});

  useEffect(() => {
    if (datosPago?.urlVoucherConsolidado) {
      setPdfUrlConsolidado(datosPago.urlVoucherConsolidado);
    }
  }, [datosPago?.urlVoucherConsolidado]);

  // Generar voucher consolidado
  const generarVoucherConsolidado = async () => {
    if (!datosPago?.id) {
      throw new Error("Debe guardar el pago antes de generar el PDF");
    }

    const resultado = await generarYSubirVoucherConsolidado(
      datosPago,
      datosPago.movimientos || {},
      datosPago.conceptosSunat || {},
      datosPago.resumen || {},
      empresa,
      cuentaPorCobrar
    );

    if (resultado.success && resultado.urlPdf) {
      setPdfUrlConsolidado(resultado.urlPdf);
      
      if (onPdfGenerated && typeof onPdfGenerated === "function") {
        onPdfGenerated(resultado.urlPdf, "consolidado");
      }

      if (toast?.current) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Voucher consolidado generado correctamente",
          life: 3000,
        });
      }
    }

    return resultado;
  };

  // Generar voucher individual de movimiento
  const generarVoucherMovimiento = async (movimiento, tipo) => {
    if (!movimiento?.id) {
      throw new Error("Movimiento inválido");
    }

    const resultado = await generarYSubirVoucherMovimiento(
      movimiento,
      empresa,
      cuentaPorCobrar
    );

    if (resultado.success && resultado.urlPdf) {
      setPdfUrlsMovimientos((prev) => ({
        ...prev,
        [tipo]: resultado.urlPdf,
      }));

      if (toast?.current) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: `Voucher de ${tipo} generado correctamente`,
          life: 3000,
        });
      }
    }

    return resultado;
  };

  return (
    <div className="grid">
      {/* Voucher Consolidado */}
      <div className="col-12">
        <Card title="Voucher Consolidado" className="mb-3">
          <PDFGeneratedUploader
            generatePdfFunction={generarVoucherConsolidado}
            pdfData={datosPago}
            moduleName="pago-cuenta-por-cobrar"
            entityId={pagoCuentaPorCobrarId}
            fileName={`voucher-consolidado-${datosPago.correlativo || pagoCuentaPorCobrarId}.pdf`}
            buttonLabel="Generar Voucher Consolidado"
            buttonIcon="pi pi-file-pdf"
            buttonClassName="p-button-success"
            disabled={!pagoCuentaPorCobrarId}
            warningMessage={
              !pagoCuentaPorCobrarId
                ? "Debe procesar el pago antes de generar el PDF"
                : null
            }
            toast={toast}
            viewerHeight="600px"
            onGenerateComplete={(url) => setPdfUrlConsolidado(url)}
            initialPdfUrl={datosPago?.urlVoucherConsolidado}
          />
        </Card>
      </div>

      {/* Vouchers Individuales */}
      {datosPago?.movimientos && (
        <div className="col-12">
          <Panel header="Vouchers Individuales por Movimiento" toggleable>
            <div className="grid">
              {/* Voucher Ingreso */}
              {datosPago.movimientos.ingreso && (
                <div className="col-12 md:col-6">
                  <Card title="Voucher Ingreso" className="mb-2">
                    <Button
                      label="Generar Voucher Ingreso"
                      icon="pi pi-file-pdf"
                      className="p-button-info p-button-sm"
                      onClick={() =>
                        generarVoucherMovimiento(
                          datosPago.movimientos.ingreso,
                          "ingreso"
                        )
                      }
                    />
                  </Card>
                </div>
              )}

              {/* Voucher ITF */}
              {datosPago.movimientos.itf && (
                <div className="col-12 md:col-6">
                  <Card title="Voucher ITF" className="mb-2">
                    <Button
                      label="Generar Voucher ITF"
                      icon="pi pi-file-pdf"
                      className="p-button-info p-button-sm"
                      onClick={() =>
                        generarVoucherMovimiento(
                          datosPago.movimientos.itf,
                          "ITF"
                        )
                      }
                    />
                  </Card>
                </div>
              )}

              {/* Voucher Comisión */}
              {datosPago.movimientos.comision && (
                <div className="col-12 md:col-6">
                  <Card title="Voucher Comisión" className="mb-2">
                    <Button
                      label="Generar Voucher Comisión"
                      icon="pi pi-file-pdf"
                      className="p-button-info p-button-sm"
                      onClick={() =>
                        generarVoucherMovimiento(
                          datosPago.movimientos.comision,
                          "Comisión"
                        )
                      }
                    />
                  </Card>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default VerImpresionVoucherPagoCxC;