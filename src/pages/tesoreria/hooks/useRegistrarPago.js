import { useState } from "react";
import { registrarPagoCuentaPorCobrar, registrarPagoCuentaPorPagar } from "../../../api/tesoreria/registrarPago";

/**
 * Hook para registrar pagos (crea MovimientoCaja + Pago en transacción)
 */
const useRegistrarPago = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const registrarPago = async (datosPago) => {
    setLoading(true);

    try {
      let resultado;

      if (datosPago.tipo === 'COBRAR') {
        resultado = await registrarPagoCuentaPorCobrar(datosPago);
      } else if (datosPago.tipo === 'PAGAR') {
        resultado = await registrarPagoCuentaPorPagar(datosPago);
      } else {
        throw new Error('Tipo de pago no válido');
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `${datosPago.tipo === 'COBRAR' ? 'Cobro' : 'Pago'} registrado correctamente`,
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (err) {
      console.error("Error al registrar pago:", err);
      
      const errorMsg = err.response?.data?.error || err.message || "Error al registrar el pago";
      
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMsg,
        life: 5000,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    registrarPago,
    loading,
  };
};

export default useRegistrarPago;
