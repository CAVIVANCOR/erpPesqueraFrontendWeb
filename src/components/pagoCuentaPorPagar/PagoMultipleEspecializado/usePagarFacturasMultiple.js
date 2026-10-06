import { useState } from "react";
import { pagarFacturasMultiple } from "../../../api/tesoreria/pagoEspecializadoCuentaPorPagar";

/**
 * Hook del pago múltiple (especializado) de facturas de un proveedor.
 * Mismo contrato que useEntregarFondos: devuelve el resultado completo del
 * backend para que el formulario genere vouchers y muestre la confirmación.
 */
const usePagarFacturasMultiple = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const pagarFacturas = async (datos) => {
    try {
      setLoading(true);

      const resultado = await pagarFacturasMultiple(datos);

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
      console.error("Error al pagar facturas:", error);

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
    pagarFacturas,
    loading,
  };
};

export default usePagarFacturasMultiple;
