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
  propietarioStockId,
  almacenId,
  modo,
  esCustodia,
  familiaProductoId = null,
  soloConSaldo = true,
  toast,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const esIngreso = modo === "ingreso";

  useEffect(() => {
    if (visible && empresaId && propietarioStockId) {
      cargarDatos();
    } 
  }, [
    visible,
    empresaId,
    propietarioStockId,
    almacenId,
    modo,
    esCustodia,
    familiaProductoId,
    soloConSaldo,
  ]);

  /**
   * Carga datos con sistema de 3 niveles profesional:
   * Nivel 1: Productos con stock consolidado
   * Nivel 2: Stock por almacén (al hacer clic en producto)
   * Nivel 3: Stock con variables (al hacer clic en almacén)
   */
  const cargarDatos = async () => {

    if (!empresaId || !propietarioStockId) {
      return;
    }

    setLoading(true);
    try {
      // ⭐ NUEVO: Si es ingreso O si es egreso sin filtro de saldo, cargar todos los productos
      if (esIngreso || !soloConSaldo) {
        await cargarProductosConStockConsolidado();
      } else {
        // Solo cargar productos con saldo cuando soloConSaldo=true
        await cargarProductosConStock();
      }
    } catch (error) {
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
   * Para mercadería propia: Producto.propietarioStockId = Empresa.entidadComercialId
   * Para mercadería en custodia: Producto.propietarioStockId = propietarioStockId
   */
  const cargarProductosConStockConsolidado = async () => {

    // 1. Cargar productos activos de la empresa
    const filtrosProductos = {
      empresaId,
      clienteId: propietarioStockId,
      cesado: false,
    };
    const productosData = await getProductos(filtrosProductos);

    // 1.1. Filtrar productos según configuración
    let productosFiltrados = productosData;

    // Filtrar por familias según modo (ingreso/egreso)
    if (esIngreso) {
      // MODO INGRESO: Mostrar solo productos de familias con esParaIngresos = true
      productosFiltrados = productosData.filter(
        (producto) => producto.familia?.esParaIngresos === true
      );

      // Agrupar por familia para ver distribución
      const familias = productosFiltrados.reduce((acc, p) => {
        const famNombre = p.familia?.nombre || 'SIN FAMILIA';
        acc[famNombre] = (acc[famNombre] || 0) + 1;
        return acc;
      }, {});
    } else {
      // MODO EGRESO: Mostrar solo productos de familias con esParaEgresos = true
      productosFiltrados = productosData.filter(
        (producto) => producto.familia?.esParaEgresos === true
      );
    }

    // Filtro adicional por familia específica (si se proporciona)
    if (familiaProductoId) {
      productosFiltrados = productosFiltrados.filter(
        (producto) =>
          Number(producto.subfamilia?.familiaId) === Number(familiaProductoId),
      );
    }

    // 2. Cargar saldos generales desde SaldosProductoCliente (consolidado por producto)
    const filtrosSaldos = {
      empresaId,
      clienteId: propietarioStockId,
      custodia: esCustodia,
    };
    const saldosData = await getSaldosProductoClienteConFiltros(filtrosSaldos);

    // 3. Mapear productos con stock consolidado
    const productosConStock = productosFiltrados.map((producto) => {
      // Buscar todos los saldos de este producto en todos los almacenes
      const saldosProducto = saldosData.filter(
        (s) => Number(s.productoId) === Number(producto.id),
      );

      // Consolidar stock de todos los almacenes
      const stockTotal = saldosProducto.reduce(
        (sum, s) => sum + Number(s.saldoCantidad || 0),
        0,
      );
      const pesoTotal = saldosProducto.reduce(
        (sum, s) => sum + Number(s.saldoPeso || 0),
        0,
      );
      const costoPromedio =
        saldosProducto.length > 0
          ? saldosProducto.reduce(
            (sum, s) => sum + Number(s.costoUnitarioPromedio || 0),
            0,
          ) / saldosProducto.length
          : 0;

      return {
        producto: producto,
        productoId: producto.id,
        saldoCantidad: stockTotal,
        saldoPeso: pesoTotal,
        costoUnitarioPromedio: costoPromedio,
        cantidadAlmacenes: saldosProducto.length,
        stockDisponible: stockTotal,
        pesoDisponible: pesoTotal,
      };
    });

    setItems(productosConStock);
  };

  /**
   * NIVEL 1 (Egresos): Carga solo productos con stock disponible
   */
  const cargarProductosConStock = async () => {

    // CASO 1: Si es familia SERVICIOS (5), cargar desde catálogo de productos
    if (familiaProductoId && Number(familiaProductoId) === 5) {
      const filtrosProductos = {
        empresaId,
        clienteId: propietarioStockId,
        cesado: false,
      };
      const productosData = await getProductos(filtrosProductos);

      // Filtrar solo productos de familia SERVICIOS
      const servicios = productosData.filter(
        (producto) => Number(producto.subfamilia?.familiaId) === 5,
      );

      // Convertir a formato compatible con saldos (sin stock)
      const serviciosFormateados = servicios.map((producto) => ({
        producto: producto,
        productoId: producto.id,
        stockDisponible: 0, // Los servicios no tienen stock
        pesoDisponible: 0,
        costoUnitarioPromedio: 0,
        // Campos necesarios para compatibilidad
        empresaId,
        clienteId: propietarioStockId,
        almacenId,
      }));

      setItems(serviciosFormateados);
      return;
    }

    // CASO 2: Productos físicos con saldo (comportamiento normal)

    const filtros = {
      empresaId,
      almacenId,
      clienteId: propietarioStockId,
      custodia: esCustodia,
      soloConSaldo: true,
    };

    let saldosData = await getSaldosProductoClienteConFiltros(filtros);

    // CASO 3: Si hay filtro de familia (que NO sea SERVICIOS), aplicar filtro
    if (familiaProductoId && Number(familiaProductoId) !== 5) {
      saldosData = saldosData.filter((saldo) => {
        const familiaId = saldo.producto?.subfamilia?.familiaId;
        return Number(familiaId) === Number(familiaProductoId);
      });
    }

    setItems(saldosData);
  };

  return {
    items,
    loading,
    cargarDatos,
  };
};
