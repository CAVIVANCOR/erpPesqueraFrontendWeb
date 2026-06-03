import { useState, useEffect } from "react";
import { getSaldosCuentas, getSaldoConsolidado } from "../../../api/tesoreria/saldosCuentas";

/**
 * Hook para cargar saldos de cuentas corrientes
 */
const useSaldosCuentas = (empresaId) => {
  const [saldosCuentas, setSaldosCuentas] = useState([]);
  const [saldoConsolidado, setSaldoConsolidado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarSaldos = async () => {
    setLoading(true);
    setError(null);

    try {
      const filtros = {
        empresaId,
        soloActivas: true,
      };

      const [dataSaldos, dataConsolidado] = await Promise.all([
        getSaldosCuentas(filtros),
        getSaldoConsolidado(empresaId),
      ]);

      setSaldosCuentas(dataSaldos || []);
      setSaldoConsolidado(dataConsolidado || null);
    } catch (err) {
      console.error("Error al cargar saldos:", err);
      setError(err.response?.data?.error || "Error al cargar saldos de cuentas");
      setSaldosCuentas([]);
      setSaldoConsolidado(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, [empresaId]);

  return {
    saldosCuentas,
    saldoConsolidado,
    loading,
    error,
    recargarSaldos: cargarSaldos,
  };
};

export default useSaldosCuentas;
