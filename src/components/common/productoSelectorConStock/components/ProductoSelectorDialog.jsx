// src/components/movimientoAlmacen/ProductoSelectorDialog.jsx
import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { crearProducto } from "../../../../api/producto";
import { obtenerPrecioVentaVigente } from "../../../../api/precioEntidad";
import { consultarTipoCambioSunat } from "../../../../api/consultaExterna";
import { getEmpresas } from "../../../../api/empresa";
import { getEntidadesComerciales } from "../../../../api/entidadComercial";
import { getColores } from "../../../../api/color";
import { getEstadosMultiFuncion } from "../../../../api/estadoMultiFuncion";
import { getUnidadesMedida } from "../../../../api/unidadMedida";
import StockPorAlmacenDialog from "./StockPorAlmacenDialog";
import ProductoForm from "../../../producto/ProductoForm";

// Hooks personalizados
import { useCatalogos } from "../hooks/useCatalogos";
import { useProductoSelectorData } from "../hooks/useProductoSelectorData";
import { useProductoSelectorFilters } from "../hooks/useProductoSelectorFilters";
import { usePermissions } from "../../../../hooks/usePermissions";

// Componentes modularizados
import { ProductoSelectorHeader } from "./ProductoSelectorHeader";
import { ProductoSelectorCarouselFilters } from "./ProductoSelectorCarouselFilters";
import { ProductoSelectorTable } from "./ProductoSelectorTable";

/**
 * Componente para selección de productos o saldos
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {string} modo - "ingreso" | "egreso" | "transferencia"
 * @param {boolean} esCustodia - Si es mercadería en custodia
 * @param {number} empresaId - ID de la empresa
 * @param {number} propietarioStockId - ID del propietario del stock (empresa.entidadComercialId o entidadComercialId)
 * @param {number} almacenId - ID del almacén (para egresos/transferencias)
 * @param {number} estadoMercaderiaDefault - Estado de mercadería por defecto (6 = LIBERADO)
 * @param {number} estadoCalidadDefault - Estado de calidad por defecto (10 = CALIDAD A)
 * @param {number|number[]|null} familiaProductoId - Familia(s) de producto fija(s) o null para permitir selección
 * @param {number|null} filtroFamiliaInicial - Familia inicial seleccionada cuando familiaProductoId es null
 * @param {function} onSelect - Callback al seleccionar (data) => void
 */
export default function ProductoSelectorDialog({
  visible,
  onHide,
  modo = "ingreso",
  esCustodia = false,
  empresaId,
  propietarioStockId,
  almacenId,
  estadoMercaderiaDefault = 6,
  estadoCalidadDefault = 10,
  familiaProductoId = null,
  filtroFamiliaInicial = null,
  productoIdSeleccionado = null,
  // ⭐ NUEVOS PROPS PARA PREFACTURA
  clienteId = null,
  empresaEntidadComercialId = null,
  monedaId = null,
  fechaDocumento = null,
  buscarPrecioVenta = false, // Flag para activar búsqueda de precio
  onSelect,
}) {
  const toast = useRef(null);
  const esIngreso = modo === "ingreso";
  const [soloConSaldo, setSoloConSaldo] = useState(modo !== "ingreso");

  // Custom Hooks
  const catalogos = useCatalogos(visible, toast);
  const { items, loading, cargarDatos } = useProductoSelectorData({
    visible,
    empresaId,
    propietarioStockId,
    almacenId,
    modo,
    esCustodia,
    familiaProductoId,
    soloConSaldo,
    toast,
  });

  const {
    filtros,
    setFamiliaId,
    setSubfamiliaId,
    setMarcaId,
    setProcedenciaId,
    setTipoAlmacenamientoId,
    setTipoMaterialId,
    setUnidadMedidaId,
    setEspecieId,
    setAlmacenId,
    setBusqueda,
    filteredItems,
    opcionesDinamicas,
    limpiarFiltros,
   } = useProductoSelectorFilters(items, catalogos, modo, filtroFamiliaInicial);

  // ⭐ NUEVO: Limpiar filtros cuando se abre el diálogo
  useEffect(() => {
    if (visible) {
      limpiarFiltros();
    }
  }, [visible]); // Solo cuando cambia visible
  // Permisos para crear productos
  const permisosProducto = usePermissions("productos");

  // Estados locales
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showStockPorAlmacen, setShowStockPorAlmacen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estados para ProductoForm
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [colores, setColores] = useState([]);
  const [estadosIniciales, setEstadosIniciales] = useState([]);
  const [unidadesMetricas, setUnidadesMetricas] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);

  /**
   * Maneja clic en fila: Abre Nivel 2 (Stock por Almacén) en TODOS los modos
   * - INGRESO: Ver stock consolidado por almacén (referencia)
   * - EGRESO/TRANSFERENCIA: Ver y seleccionar stock específico por almacén
   */
  const handleRowClick = (e) => {
    const rowData = e.data;

    if (esIngreso) {
      // INGRESO: Abrir Nivel 2 si tiene stock en algún almacén
      if (rowData.stockDisponible > 0 && rowData.cantidadAlmacenes > 0) {
        setProductoSeleccionado(rowData);
        setShowStockPorAlmacen(true);
      }
    } else {
      // EGRESO/TRANSFERENCIA: Siempre abrir Nivel 2 para ver detalle
      // Construir objeto producto compatible con StockPorAlmacenDialog
      const productoParaNivel2 = {
        ...rowData.producto,
        stockDisponible: rowData.saldoCantidad,
        pesoDisponible: rowData.saldoPeso,
      };
      setProductoSeleccionado(productoParaNivel2);
      setShowStockPorAlmacen(true);
    }
  };

    /**
   * Maneja botón Seleccionar
   */
  const handleSelect = async (rowData) => {
    if (esIngreso) {
      // INGRESO: Seleccionar producto directamente (SIN búsqueda de precio)
      onSelect({
        tipo: "producto",
        productoId: rowData.productoId,
        producto: rowData.producto,
        estadoMercaderiaId: estadoMercaderiaDefault,
        estadoCalidadId: estadoCalidadDefault,
        precioUnitario: 0,
      });
      onHide();
    } else {
      // EGRESO/VENTA: Buscar precio automático si está habilitado
      let precioUnitario = 0;

      if (buscarPrecioVenta && fechaDocumento && empresaEntidadComercialId) {
        try {
          const fechaISO = new Date(fechaDocumento).toISOString().split("T")[0];
          const precioEncontrado = await obtenerPrecioVentaVigente(
            rowData.productoId,
            clienteId,
            empresaEntidadComercialId,
            fechaISO,
          );

          if (precioEncontrado) {
            let precioFinal = Number(precioEncontrado.precioUnitario);

            // Convertir moneda si es necesario
            if (monedaId && Number(precioEncontrado.monedaId) !== Number(monedaId)) {
              try {
                const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });
                if (tipoCambioData && tipoCambioData.compra) {
                  const tc = Number(tipoCambioData.compra);
                  const monedaPrecio = precioEncontrado.moneda?.codigoSunat;
                  
                  if (monedaPrecio === "USD" && Number(monedaId) === 2) {
                    // USD → PEN
                    precioFinal = precioFinal * tc;
                  } else if (monedaPrecio === "PEN" && Number(monedaId) === 1) {
                    // PEN → USD
                    precioFinal = precioFinal / tc;
                  }
                }
              } catch (tcError) {
                console.warn("No se pudo obtener tipo de cambio:", tcError);
              }
            }

            precioUnitario = precioFinal;
          }
        } catch (error) {
          console.error("Error al buscar precio de venta:", error);
          toast.current?.show({
            severity: "warn",
            summary: "Advertencia",
            detail: "No se pudo obtener el precio automático. Ingrese manualmente.",
            life: 3000,
          });
        }
      }

      // EGRESO: Retornar saldo completo con precio
      onSelect({
        tipo: "saldo",
        productoId: rowData.productoId,
        producto: rowData.producto,
        saldo: rowData,
        precioUnitario: precioUnitario,
      });
      onHide();
    }
  };

  /**
   * Maneja cambio de filtros
   */
  const handleFiltroChange = (filtro, valor) => {
    const setters = {
      familiaId: setFamiliaId,
      subfamiliaId: setSubfamiliaId,
      marcaId: setMarcaId,
      procedenciaId: setProcedenciaId,
      tipoAlmacenamientoId: setTipoAlmacenamientoId,
      tipoMaterialId: setTipoMaterialId,
      unidadMedidaId: setUnidadMedidaId,
      especieId: setEspecieId,
      almacenId: setAlmacenId,
      busqueda: setBusqueda,
    };
    setters[filtro]?.(valor);
  };

  /**
   * Abre formulario de nuevo producto
   */
  const handleNuevoProducto = async () => {
    // Validar permisos antes de abrir el formulario
    if (!permisosProducto.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear productos.",
        life: 3000,
      });
      return;
    }

    try {
      const [
        empresasData,
        clientesData,
        coloresData,
        estadosData,
        unidadesMetricasData,
      ] = await Promise.all([
        getEmpresas(),
        getEntidadesComerciales(),
        getColores(),
        getEstadosMultiFuncion(),
        getUnidadesMedida(),
      ]);

      setEmpresas(empresasData);
      setClientes(clientesData);
      setColores(coloresData);
      const estadosProducto = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado,
      );
      setEstadosIniciales(estadosProducto);

      // Buscar unidad métrica por defecto (MILIMETROS o la primera disponible)
      const unidadMetricaDefault =
        unidadesMetricasData.find(
          (u) =>
            u.simbolo === "MM" || u.nombre?.toUpperCase().includes("MILIMETRO"),
        ) || unidadesMetricasData[0];

      setUnidadesMetricas(unidadesMetricasData);
      setShowProductoForm(true);
    } catch (error) {
      console.error("Error al cargar datos para ProductoForm:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del formulario",
      });
    }
  };

  /**
   * Maneja creación de producto
   */
  const handleProductoCreado = async (nuevoProducto) => {
    try {
      const resultado = await crearProducto(nuevoProducto);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto creado correctamente",
        life: 3000,
      });

      setShowProductoForm(false);
      await cargarDatos();
    } catch (error) {
      console.error(
        "❌ [handleProductoCreado] Error al crear producto:",
        error,
      );
      console.error(
        "❌ [handleProductoCreado] Detalles del error:",
        error.response?.data,
      );

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Error al crear producto",
        life: 5000,
      });
    }
  };

  // Header de la tabla
  const tableHeader = (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <ProductoSelectorHeader
        modo={modo}
        esCustodia={esCustodia}
        filteredItemsCount={filteredItems.length}
        esIngreso={esIngreso}
        soloConSaldo={soloConSaldo}
        onToggleSaldo={() => {
          setSoloConSaldo(!soloConSaldo);
        }}
      />
      <ProductoSelectorCarouselFilters
        filtros={filtros}
        opcionesDinamicas={opcionesDinamicas}
        onFiltroChange={handleFiltroChange}
        onLimpiar={limpiarFiltros}
        familiaProductoId={familiaProductoId}
        filtroFamiliaInicial={filtroFamiliaInicial}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={`Seleccionar ${esIngreso ? "Producto" : "Producto con Saldo"}`}
        visible={visible}
        style={{ width: "95vw", maxWidth: "1400px" }}
        onHide={onHide}
        modal
        maximizable
      >
        <ProductoSelectorTable
          items={filteredItems}
          loading={loading}
          esIngreso={esIngreso}
          header={tableHeader}
          onRowClick={handleRowClick}
          onSelect={handleSelect}
          productoIdSeleccionado={productoIdSeleccionado} // ⭐ NUEVO
        />
      </Dialog>

      {/* Diálogo para crear nuevo producto */}
      {showProductoForm && (
        <Dialog
          header="Crear Nuevo Producto"
          visible={showProductoForm}
          style={{ width: "95vw", maxWidth: "1200px" }}
          onHide={() => setShowProductoForm(false)}
          modal
          maximizable
        >
          <ProductoForm
            producto={{ empresaId, propietarioStockId }}
            familias={catalogos.familias}
            subfamilias={catalogos.subfamilias}
            unidadesMedida={catalogos.unidadesMedida}
            unidadesMetricas={unidadesMetricas}
            tiposMaterial={catalogos.tiposMaterial}
            colores={colores}
            empresas={empresas}
            clientes={clientes}
            tiposAlmacenamiento={catalogos.tiposAlmacenamiento}
            paises={catalogos.paises}
            marcas={catalogos.marcas}
            estadosIniciales={estadosIniciales}
            unidadMetricaDefault={null}
            especies={catalogos.especies}
            onGuardar={handleProductoCreado}
            onCancelar={() => setShowProductoForm(false)}
            modoEdicion={false}
            loading={loadingForm}
            setLoading={setLoadingForm}
            permisos={permisosProducto}
            readOnly={false}
          />
        </Dialog>
      )}

      {/* Diálogo Nivel 2: Stock por Almacén */}
      {showStockPorAlmacen && productoSeleccionado && (
        <StockPorAlmacenDialog
          visible={showStockPorAlmacen}
          onHide={() => setShowStockPorAlmacen(false)}
          producto={productoSeleccionado}
          empresaId={empresaId}
          propietarioStockId={propietarioStockId}
          esCustodia={esCustodia}
          estadoMercaderiaDefault={estadoMercaderiaDefault}
          estadoCalidadDefault={estadoCalidadDefault}
          onSelect={(data) => {
            onSelect(data);
            setShowStockPorAlmacen(false);
            onHide();
          }}
        />
      )}
    </>
  );
}