import React, { useEffect, useState } from "react";
import { getCuentaPorPagarById } from "../../../api/cuentasPorCobrarPagar/cuentaPorPagar";
import PagarCuentaPorPagarEspecializadoDialog from "../../../components/pagoCuentaPorPagar/PagarCuentaPorPagarEspecializadoDialog";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PAGAR GASTO DIRECTO - DIÁLOGO ESPECIALIZADO
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Componente dedicado al pago de una CxP generada desde un Gasto Directo.
 *
 * Reutiliza internamente PagarCuentaPorPagarEspecializadoDialog (que ya maneja
 * el pago individual de CxP con movimientos de caja, asientos y vouchers), pero
 * le inyecta el contexto de Gasto Directo: título, pre-llenado del saldo
 * pendiente y seguimiento del origen DetMovsEntregaRendir.
 *
 * Acepta el ID de la CxP generada, la carga completa y luego delega el pago.
 */

const PagarGastoDirectoDialog = ({
  visible,
  onHide,
  cuentaPorPagarId,
  detMovsEntregaRendirId = null,
  tipoMovimientoIdHeredado = null,
  monedas = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  tiposMovimiento = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  periodosContables = [],
  empresas = [],
  proveedores = [],
  estadosCxP = [],
  toast,
  onSuccess,
}) => {
  const [cuentaPorPagar, setCuentaPorPagar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !cuentaPorPagarId) {
      setCuentaPorPagar(null);
      return;
    }

    const cargarCxP = async () => {
      setLoading(true);
      try {
        const cxp = await getCuentaPorPagarById(cuentaPorPagarId);
        setCuentaPorPagar(cxp);
      } catch (error) {
        console.error("Error al cargar CxP del gasto directo:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar la Cuenta por Pagar generada",
          life: 4000,
        });
        onHide?.();
      } finally {
        setLoading(false);
      }
    };

    cargarCxP();
  }, [visible, cuentaPorPagarId, toast, onHide]);

  const handleSuccess = (resultado) => {
    toast?.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Pago de Gasto Directo registrado correctamente",
      life: 3000,
    });
    onSuccess?.(resultado);
  };

  if (!visible) return null;

  return (
    <PagarCuentaPorPagarEspecializadoDialog
      visible={visible}
      onHide={onHide}
      cuentaPorPagar={cuentaPorPagar}
      monedas={monedas}
      mediosPago={mediosPago}
      bancos={bancos}
      cuentasCorrientes={cuentasCorrientes}
      tiposMovimiento={tiposMovimiento}
      tiposDetraccion={tiposDetraccion}
      tiposRetencionPercepcion={tiposRetencionPercepcion}
      periodosContables={periodosContables}
      empresas={empresas}
      proveedores={proveedores}
      estadosCxP={estadosCxP}
      toast={toast}
      onSuccess={handleSuccess}
      esGastoDirecto={true}
      detMovsEntregaRendirId={detMovsEntregaRendirId}
      tipoMovimientoIdHeredado={tipoMovimientoIdHeredado}
      loading={loading}
    />
  );
};

export default PagarGastoDirectoDialog;
