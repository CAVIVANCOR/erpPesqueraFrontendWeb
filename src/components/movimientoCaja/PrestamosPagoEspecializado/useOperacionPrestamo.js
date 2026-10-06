import { useState } from "react";
import {
  pagarCuotasPrestamo,
  desembolsarPrestamo,
} from "../../../api/tesoreria/operacionPrestamo";

/**
 * Hook de las operaciones especializadas del préstamo bancario (pago de cuotas y desembolso).
 * Mismo contrato que usePagarDeudasTributariasMultiple: devuelve el resultado completo del
 * backend para que el formulario genere vouchers y muestre la confirmación.
 */
const useOperacionPrestamo = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const ejecutar = async (servicio, datos, mensajeError) => {
    try {
      setLoading(true);

      const resultado = await servicio(datos);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.message || "Operación registrada exitosamente",
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (error) {
      console.error(mensajeError, error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al procesar la operación";

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 5000,
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const pagarCuotas = (datos) => ejecutar(pagarCuotasPrestamo, datos, "Error al pagar cuotas:");
  const desembolsar = (datos) => ejecutar(desembolsarPrestamo, datos, "Error al registrar el desembolso:");

  return {
    pagarCuotas,
    desembolsar,
    loading,
  };
};

export default useOperacionPrestamo;
