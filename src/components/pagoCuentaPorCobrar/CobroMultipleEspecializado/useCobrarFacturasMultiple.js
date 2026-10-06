import { useState } from "react";
import { cobrarFacturasMultiple } from "../../../api/tesoreria/pagoEspecializadoCuentaPorCobrar";

/**
 * Hook del cobro múltiple (especializado) de facturas de un cliente.
 * Mismo contrato que useEntregarFondos: devuelve el resultado completo del
 * backend para que el formulario genere vouchers y muestre la confirmación.
 */
const useCobrarFacturasMultiple = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const cobrarFacturas = async (datos) => {
    try {
      setLoading(true);

      const resultado = await cobrarFacturasMultiple(datos);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.message || "Cobro registrado exitosamente",
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (error) {
      console.error("Error al cobrar facturas:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al procesar el cobro";

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
    cobrarFacturas,
    loading,
  };
};

export default useCobrarFacturasMultiple;
