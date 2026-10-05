import { useState } from "react";
import { pagarDeudasTributariasMultiple } from "../../../api/tesoreria/pagoDeudaTributaria";

/**
 * Hook del pago múltiple (especializado) de deudas tributarias.
 * Mismo contrato que useEntregarFondos: devuelve el resultado completo del
 * backend para que el formulario genere vouchers y muestre la confirmación.
 */
const usePagarDeudasTributariasMultiple = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const pagarDeudas = async (datos) => {
    try {
      setLoading(true);

      const resultado = await pagarDeudasTributariasMultiple(datos);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.message || "Pago registrado exitosamente",
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (error) {
      console.error("Error al pagar deudas tributarias:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al procesar el pago";

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

  return {
    pagarDeudas,
    loading,
  };
};

export default usePagarDeudasTributariasMultiple;
