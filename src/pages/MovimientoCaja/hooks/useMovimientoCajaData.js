import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../../shared/stores/useAuthStore";
import { usePermissions } from "../../../hooks/usePermissions";

// APIs
import { getAllMovimientoCaja } from "../../../api/movimientoCaja.js";
import { getEmpresas } from "../../../api/empresa.js";
import { getMonedas } from "../../../api/moneda.js";
import { getAllTipoMovEntregaRendir } from "../../../api/tipoMovEntregaRendir.js";
import { getAllTipoReferenciaMovimientoCaja } from "../../../api/tipoReferenciaMovimientoCaja.js";
import { getAllCuentaCorriente } from "../../../api/cuentaCorriente.js";
import { getEntidadesComerciales } from "../../../api/entidadComercial.js";
import { getCtasCteEntidad } from "../../../api/ctaCteEntidad.js";
import { getCentrosCosto } from "../../../api/centroCosto.js";
import { getModulos } from "../../../api/moduloSistema.js";
import { getPersonal } from "../../../api/personal.js";
import { getProductos } from "../../../api/producto.js";
import { getEstadosMultiFuncion } from "../../../api/estadoMultiFuncion.js";

const useMovimientoCajaData = () => {
  // ✅ CORRECCIÓN: Pasar 'movimientoCaja' a usePermissions
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions('movimientoCaja');

  // States principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States de datos
  const [movimientos, setMovimientos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tipoMovEntregaRendir, setTipoMovEntregaRendir] = useState([]);
  const [tipoReferenciaMovimientoCaja, setTipoReferenciaMovimientoCaja] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [cuentasEntidadComercial, setCuentasEntidadComercial] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadosMultiFuncion, setEstadosMultiFuncion] = useState([]);

  // States derivados/filtrados
  const [cuentasOrigenFiltradas, setCuentasOrigenFiltradas] = useState([]);
  const [cuentasDestinoFiltradas, setCuentasDestinoFiltradas] = useState([]);

  // Cargar datos principales
  const cargarDatosPrincipales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        movimientosRes,
        empresasRes,
        monedasRes,
        tipoMovRes,
        tipoRefRes,
        cuentasRes,
        entidadesRes,
        centrosCostoRes,
        personalRes,
        modulosRes,
        productosRes,
        estadosRes,
      ] = await Promise.all([
        getAllMovimientoCaja(),
        getEmpresas(),
        getMonedas(),
        getAllTipoMovEntregaRendir(),
        getAllTipoReferenciaMovimientoCaja(),
        getAllCuentaCorriente(),
        getEntidadesComerciales(),
        getCentrosCosto(),
        getPersonal(),
        getModulos(),
        getProductos(),
        getEstadosMultiFuncion(),
      ]);

      // ✅ CORRECCIÓN: Filtrar estados ANTES de usarlos
      const estadosFiltrados = estadosRes?.filter(
        (estado) => Number(estado.tipoProvieneDeId) === 6,
      ) || [];

      setMovimientos(movimientosRes || []);
      setEmpresas(empresasRes || []);
      setMonedas(monedasRes || []);
      setTipoMovEntregaRendir(tipoMovRes || []);
      setTipoReferenciaMovimientoCaja(tipoRefRes || []);
      setCuentasCorrientes(cuentasRes || []);
      setEntidadesComerciales(entidadesRes || []);
      setEstadosMultiFuncion(estadosFiltrados);

      setCentrosCosto(centrosCostoRes || []);
      setPersonal(personalRes || []);
      setModulos(modulosRes || []);
      setProductos(productosRes || []);
    } catch (err) {
      console.error("❌ Error cargando datos principales:", err);
      setError("Error al cargar los datos. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar cuentas de entidades comerciales
  const cargarCuentasEntidadComercial = useCallback(async () => {
    try {
      const data = await getCtasCteEntidad();
      setCuentasEntidadComercial(data || []);
    } catch (err) {
      console.error("❌ Error cargando cuentas entidad comercial:", err);
    }
  }, []);

  // ✅ CORRECCIÓN: Effect con usuario correcto
  useEffect(() => {
    if (!usuario || !usuario.empresaId) {
      return;
    }
    cargarDatosPrincipales();
    cargarCuentasEntidadComercial();
  }, [usuario?.empresaId, cargarDatosPrincipales, cargarCuentasEntidadComercial]);

  // Función para recargar datos
  const recargarDatos = useCallback(() => {
    cargarDatosPrincipales();
    cargarCuentasEntidadComercial();
  }, [cargarDatosPrincipales, cargarCuentasEntidadComercial]);

  return {
    // Datos principales
    movimientos,
    empresas,
    monedas,
    tipoMovEntregaRendir,
    tipoReferenciaMovimientoCaja,
    cuentasCorrientes,
    entidadesComerciales,
    cuentasEntidadComercial,
    centrosCosto,
    personal,
    modulos,
    productos,
    estadosMultiFuncion,

    // Datos derivados
    cuentasOrigenFiltradas,
    cuentasDestinoFiltradas,

    // Estados y permisos
    loading,
    error,
    permisos, // ✅ CORRECCIÓN: Retornar directamente userPermissions

    // Acciones
    recargarDatos,
  };
};

export default useMovimientoCajaData;