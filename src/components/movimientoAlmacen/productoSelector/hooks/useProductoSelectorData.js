// src/components/movimientoAlmacen/productoSelector/hooks/useProductoSelectorData.js
import { useState, useEffect } from "react";
import { getProductos } from "../../../../api/producto";
import { getSaldosProductoClienteConFiltros } from "../../../../api/saldosProductoCliente";

/**
 * Custom hook para cargar y gestionar datos de productos/saldos
 * @param {Object} params - Parámetros de configuración
 * @returns {Object} Datos y funciones de carga
 */
export const useProductoSelectorData = ({
  visible,
  empresaId,
  clienteId,
  almacenId,
  modo,
  esCustodia,
  toast,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const esIngreso = modo === "ingreso";

  useEffect(() => {
    if (visible && empresaId && clienteId) {
      cargarDatos();
    }
  }, [visible, empresaId, clienteId, almacenId, modo, esCustodia]);

  /**
   * Carga datos con sistema de 3 niveles profesional:
   * Nivel 1: Productos con stock consolidado
   * Nivel 2: Stock por almacén (al hacer clic en producto)
   * Nivel 3: Stock con variables (al hacer clic en almacén)
   */
  const cargarDatos = async () => {
    if (!empresaId || !clienteId) {
      return;
    }

    setLoading(true);
    try {
      if (esIngreso) {
        await cargarProductosConStockConsolidado();
      } else {
        await cargarProductosConStock();
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * NIVEL 1: Carga productos con stock consolidado de todos los almacenes
   * Para mercadería propia: Producto.clienteId = Empresa.entidadComercialId
   * Para mercadería en custodia: Producto.clienteId = clienteId
   */
  const cargarProductosConStockConsolidado = async () => {
    // 1. Cargar productos activos de la empresa
    const filtrosProductos = {
      empresaId,
      clienteId,
      cesado: false,
    };
    const productosData = await getProductos(filtrosProductos);

    // 1.1. Filtrar solo productos cuya subfamilia lleva kardex
    const productosFiltrados = productosData.filter(
      (producto) => producto.subfamilia?.llevaKardex === true
    );

    // 2. Cargar saldos generales desde SaldosProductoCliente (consolidado por producto)
    const filtrosSaldos = {
      empresaId,
      clienteId,
      custodia: esCustodia,
    };
    const saldosData = await getSaldosProductoClienteConFiltros(filtrosSaldos);

    // 3. Mapear productos con stock consolidado
    const productosConStock = productosFiltrados.map((producto) => {
      // Buscar todos los saldos de este producto en todos los almacenes
      const saldosProducto = saldosData.filter(
        (s) => Number(s.productoId) === Number(producto.id)
      );

      // Consolidar stock de todos los almacenes
      const stockTotal = saldosProducto.reduce(
        (sum, s) => sum + Number(s.saldoCantidad || 0),
        0
      );
      const pesoTotal = saldosProducto.reduce(
        (sum, s) => sum + Number(s.saldoPeso || 0),
        0
      );
      const costoPromedio =
        saldosProducto.length > 0
          ? saldosProducto.reduce(
              (sum, s) => sum + Number(s.costoUnitarioPromedio || 0),
              0
            ) / saldosProducto.length
          : 0;

      return {
        ...producto,
        stockDisponible: stockTotal,
        pesoDisponible: pesoTotal,
        costoUnitarioPromedio: costoPromedio,
        cantidadAlmacenes: saldosProducto.length,
      };
    });

    setItems(productosConStock);
  };

  /**
   * NIVEL 1 (Egresos): Carga solo productos con stock disponible
   */
  const cargarProductosConStock = async () => {
    const filtros = {
      empresaId,
      almacenId,
      clienteId,
      custodia: esCustodia,
      soloConSaldo: true,
    };
    const saldosData = await getSaldosProductoClienteConFiltros(filtros);
    setItems(saldosData);
  };

  return {
    items,
    loading,
    cargarDatos,
  };
};