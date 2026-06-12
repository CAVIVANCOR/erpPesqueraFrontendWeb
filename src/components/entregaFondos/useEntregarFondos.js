import { useState } from "react";
import { atenderAsignacion } from "../../api/tesoreria/entregaFondos";

const useEntregarFondos = ({ toast, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const entregarFondos = async (datos) => {
    try {
      setLoading(true);

      const resultado = await atenderAsignacion(datos);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado.message || "Fondos entregados exitosamente",
        life: 3000,
      });

      if (onSuccess) {
        onSuccess(resultado);
      }

      return resultado;
    } catch (error) {
      console.error("Error al entregar fondos:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al entregar fondos";

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
    entregarFondos,
    loading,
  };
};

export default useEntregarFondos;