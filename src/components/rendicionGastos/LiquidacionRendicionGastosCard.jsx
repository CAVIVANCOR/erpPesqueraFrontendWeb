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

  // Estados locales para valores de liquidación (se actualizan inmediatamente)
  const [saldoInicialLocal, setSaldoInicialLocal] = useState(0);
  const [saldoFinalLocal, setSaldoFinalLocal] = useState(0);
  const [fechaLiquidacionLocal, setFechaLiquidacionLocal] = useState(null);
  const [estaLiquidadaLocal, setEstaLiquidadaLocal] = useState(false);

  const estaLiquidada = getValues("entregaARendirLiquidada");
  const urlLiquidacion = getValues("urlLiquidacionEntregaARendir");
  const rendicionGastosId = movimientoData?.documentoOrigenId;

  // Usar valores locales si existen, sino usar movimientoData, sino formulario
  const saldoInicial = saldoInicialLocal > 0
    ? saldoInicialLocal
    : (movimientoData?.saldoInicialAsignacion
      ? Number(movimientoData.saldoInicialAsignacion)
      : Number(getValues("saldoInicialAsignacion") || 0));

  const saldoFinal = saldoFinalLocal > 0
    ? saldoFinalLocal
    : (movimientoData?.saldoFinalAsignacion
      ? Number(movimientoData.saldoFinalAsignacion)
      : Number(getValues("saldoFinalAsignacion") || 0));
  const fechaLiquidacion = fechaLiquidacionLocal || movimientoData?.fechaLiquidacionEntregaARendir || getValues("fechaLiquidacionEntregaARendir");

  console.log('💰 VALORES CALCULADOS:');
  console.log('saldoInicial:', saldoInicial);
  console.log('saldoFinal:', saldoFinal);
  console.log('saldoInicialLocal:', saldoInicialLocal);
  console.log('movimientoData?.saldoInicialAsignacion:', movimientoData?.saldoInicialAsignacion);

  useEffect(() => {
    if (urlLiquidacion) {
      setPdfUrl(urlLiquidacion);
    }
  }, [urlLiquidacion]);

  // Inicializar estados locales desde movimientoData cuando se carga el componente
  useEffect(() => {
    console.log('🔍 DEBUG SALDO INICIAL - useEffect movimientoData');
    console.log('movimientoData:', movimientoData);
    console.log('movimientoData.saldoInicialAsignacion:', movimientoData?.saldoInicialAsignacion);
    console.log('movimientoData.saldoFinalAsignacion:', movimientoData?.saldoFinalAsignacion);

    if (movimientoData) {
      // Cargar SIEMPRE, no solo si está liquidada

      const liquidada = movimientoData.entregaARendirLiquidada;
      setSaldoInicialLocal(Number(movimientoData.saldoInicialAsignacion || 0));
      setSaldoFinalLocal(Number(movimientoData.saldoFinalAsignacion || 0));
      setFechaLiquidacionLocal(movimientoData.fechaLiquidacionEntregaARendir);
      setEstaLiquidadaLocal(true);

    }
  }, [movimientoData]);

  // También actualizar cuando cambian los valores del formulario
  useEffect(() => {
    const liquidada = getValues("entregaARendirLiquidada");
    if (liquidada && !estaLiquidadaLocal) {
      setSaldoInicialLocal(Number(getValues("saldoInicialAsignacion") || 0));
      setSaldoFinalLocal(Number(getValues("saldoFinalAsignacion") || 0));
      setFechaLiquidacionLocal(getValues("fechaLiquidacionEntregaARendir"));
      setEstaLiquidadaLocal(true);
    }
  }, [estaLiquidada]);

  // 🔄 ESTADO PARA SALDO FINAL REAL (después de todos los gastos)
  const [saldoFinalReal, setSaldoFinalReal] = useState(null);

  // 🔄 CARGAR SALDO FINAL REAL cuando está liquidada
  useEffect(() => {
    const cargarSaldoFinalReal = async () => {
      // Solo cargar si está liquidada y tenemos detMovId
      if (!(estaLiquidada || estaLiquidadaLocal) || !detMovId) {
        setSaldoFinalReal(null);
        return;
      }

      try {
        // Obtener movimiento completo con gastos asociados
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir/${detMovId}/con-gastos`,
          {
            headers: {
              Authorization: `Bearer ${useAuthStore.getState().token}`,
            },
          },
        );

        if (!response.ok) {
          console.error("Error al obtener gastos asociados");
          setSaldoFinalReal(saldoFinal);
          return;
        }

        const movimientoCompleto = await response.json();
        const gastosAsociados = movimientoCompleto.gastosAsociados || [];

        // Si no hay gastos, el saldo final real es el de la asignación
        if (gastosAsociados.length === 0) {
          setSaldoFinalReal(saldoFinal);
          return;
        }

        // Ordenar gastos por fecha e ID (ascendente)
        const gastosOrdenados = [...gastosAsociados].sort((a, b) => {
          const fechaA = new Date(a.fechaMovimiento);
          const fechaB = new Date(b.fechaMovimiento);

          if (fechaA.getTime() !== fechaB.getTime()) {
            return fechaA - fechaB; // Ascendente
          }

          return Number(a.id) - Number(b.id); // Ascendente
        });

        // Obtener el último gasto
        const ultimoGasto = gastosOrdenados[gastosOrdenados.length - 1];

        // Establecer el saldo final del último gasto
        setSaldoFinalReal(Number(ultimoGasto.saldoFinalAsignacion || 0));
      } catch (error) {
        console.error("Error al cargar saldo final real:", error);
        setSaldoFinalReal(saldoFinal);
      }
    };

    cargarSaldoFinalReal();
  }, [estaLiquidada, estaLiquidadaLocal, detMovId, saldoFinal]);

  // Valor a mostrar: saldoFinalReal si está cargado, sino saldoFinal
  const valorSaldoFinalMostrar = saldoFinalReal !== null ? saldoFinalReal : saldoFinal;


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

      if (!detMovId) {
        throw new Error(
          "No se encontró el ID del movimiento de entrega a rendir",
        );
      }

      if (!pdfUrl) {
        throw new Error("Debe generar el PDF antes de liquidar");
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/det-movs-entrega-rendir/${detMovId}/liquidar`,
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

      // Construir mensaje detallado con los cálculos
      let mensajeDetalle = "Rendición de Gastos liquidada correctamente.\n\n";

      if (resultado.detallesCalculo) {
        const {
          saldoInicial,
          montoAsignado,
          totalGastos,
          totalDevoluciones,
          saldoFinal,
        } = resultado.detallesCalculo;

        mensajeDetalle += `📊 Detalles del Cálculo:\n`;
        mensajeDetalle += `• Saldo Inicial: S/. ${saldoInicial.toFixed(2)}\n`;
        mensajeDetalle += `• Monto Asignado: S/. ${montoAsignado.toFixed(2)}\n`;
        mensajeDetalle += `• Total Gastado: S/. ${totalGastos.toFixed(2)}\n`;
        mensajeDetalle += `• Devoluciones: S/. ${totalDevoluciones.toFixed(2)}\n`;
        mensajeDetalle += `• Saldo Final: S/. ${saldoFinal.toFixed(2)}`;
      }

      // Actualizar estados locales INMEDIATAMENTE para re-render
      setSaldoInicialLocal(Number(resultado.saldoInicialAsignacion || 0));
      setSaldoFinalLocal(Number(resultado.saldoFinalAsignacion || 0));
      setFechaLiquidacionLocal(resultado.fechaLiquidacionEntregaARendir);
      setEstaLiquidadaLocal(true);

      // Actualizar los campos del formulario con los valores retornados
      if (resultado.saldoInicialAsignacion !== undefined) {
        setValue("saldoInicialAsignacion", resultado.saldoInicialAsignacion);
      }
      if (resultado.saldoFinalAsignacion !== undefined) {
        setValue("saldoFinalAsignacion", resultado.saldoFinalAsignacion);
      }
      if (resultado.entregaARendirLiquidada !== undefined) {
        setValue("entregaARendirLiquidada", resultado.entregaARendirLiquidada);
      }
      if (resultado.fechaLiquidacionEntregaARendir !== undefined) {
        setValue(
          "fechaLiquidacionEntregaARendir",
          resultado.fechaLiquidacionEntregaARendir,
        );
      }
      if (resultado.urlLiquidacionEntregaARendir !== undefined) {
        setValue(
          "urlLiquidacionEntregaARendir",
          resultado.urlLiquidacionEntregaARendir,
        );
      }

      toast.current?.show({
        severity: "success",
        summary: "✅ Liquidación Exitosa",
        detail: mensajeDetalle,
        life: 8000,
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
        {/* ========================================
            SECCIÓN: INFORMACIÓN DE LIQUIDACIÓN
            ======================================== */}
        {(estaLiquidada || estaLiquidadaLocal) && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "2px solid #28a745",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem 0",
                color: "#28a745",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              ✅ Liquidación Completada
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Saldo Inicial */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#495057",
                  }}
                >
                  💰 Saldo Inicial
                </label>
                <InputNumber
                  value={saldoInicial}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  prefix="S/. "
                  inputStyle={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    textAlign: "right",
                  }}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Saldo Final */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#495057",
                  }}
                >
                  💵 Saldo Final
                </label>
                <InputNumber
                  value={valorSaldoFinalMostrar}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled
                  prefix="S/. "
                  inputStyle={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    backgroundColor: valorSaldoFinalMostrar >= 0 ? "#e8f5e9" : "#ffebee",
                    color: valorSaldoFinalMostrar >= 0 ? "#2e7d32" : "#c62828",
                    textAlign: "right",
                  }}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Fecha de Liquidación */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#495057",
                  }}
                >
                  📅 Fecha de Liquidación
                </label>
                <input
                  type="text"
                  value={
                    fechaLiquidacion
                      ? new Date(fechaLiquidacion).toLocaleString("es-PE", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "N/A"
                  }
                  disabled
                  style={{
                    padding: "0.75rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    border: "1px solid #ffc107",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                />
              </div>

              {/* Estado de Liquidación */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    color: "#495057",
                  }}
                >
                  📊 Estado
                </label>
                <div
                  style={{
                    padding: "0.75rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    border: "2px solid #28a745",
                    borderRadius: "4px",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="pi pi-check-circle" />
                  LIQUIDADA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            SECCIÓN: GENERACIÓN Y VISUALIZACIÓN DE PDF
            ======================================== */}
        <PDFGeneratedUploader
          generatePdfFunction={generarPdfWrapper}
          pdfData={getValues()}
          moduleName="liquidacion-entrega-rendir-pesca-industrial"
          entityId={detMovId}
          fileName={`liquidacion-rendicion-gastos-${detMovId}.pdf`}
          buttonLabel={
            estaLiquidada && permisos.puedeReactivarDocs
              ? "Regenerar PDF de Liquidación"
              : "Generar Liquidación"
          }
          buttonIcon="pi pi-file-pdf"
          buttonClassName="p-button-success"
          disabled={
            !detMovId ||
            readOnly ||
            (estaLiquidada && !permisos.puedeReactivarDocs)
          }
          warningMessage={
            !detMovId
              ? "Debe guardar el movimiento antes de generar la liquidación"
              : estaLiquidada && !permisos.puedeReactivarDocs
                ? "Esta rendición de gastos ya está liquidada. No tiene permiso para regenerar."
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
