import { useState } from "react";
import { pagarDeudaPersonal } from "../../../api/tesoreria/pagoDeudaPersonal";

/**
 * Hook para pagar deudas personales desde Tesorería Pendientes
 */
const usePagarDeudaPersonal = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const pagarDeuda = async (deudaId, datosPago) => {
    setLoading(true);

    try {
      const resultado = await pagarDeudaPersonal(deudaId, datosPago);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago de deuda personal registrado correctamente",
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (err) {
      console.error("Error al pagar deuda personal:", err);
      
      const errorMsg = err.response?.data?.error || err.message || "Error al procesar el pago";
      
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
    pagarDeuda,
    loading,
  };
};

export default usePagarDeudaPersonal;