// src/components/movimientoAlmacen/ProductoSelectorDialog.jsx
import React, { useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { crearProducto } from "../../api/producto";
import { getEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getColores } from "../../api/color";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getUnidadesMedida } from "../../api/unidadMedida";
import StockPorAlmacenDialog from "./StockPorAlmacenDialog";
import ProductoForm from "../producto/ProductoForm";

// Hooks personalizados
import { useCatalogos } from "./productoSelector/hooks/useCatalogos";
import { useProductoSelectorData } from "./productoSelector/hooks/useProductoSelectorData";
import { useProductoSelectorFilters } from "./productoSelector/hooks/useProductoSelectorFilters";

// Componentes modularizados
import { ProductoSelectorHeader } from "./productoSelector/components/ProductoSelectorHeader";
import { ProductoSelectorFilters } from "./productoSelector/components/ProductoSelectorFilters";
import { ProductoSelectorTable } from "./productoSelector/components/ProductoSelectorTable";

/**
 * Componente para selección de productos o saldos
 * @param {boolean} visible - Visibilidad del diálogo
 * @param {function} onHide - Callback al cerrar
 * @param {string} modo - "ingreso" | "egreso" | "transferencia"
 * @param {boolean} esCustodia - Si es mercadería en custodia
 * @param {number} empresaId - ID de la empresa
 * @param {number} clienteId - ID del cliente (empresa.entidadComercialId o entidadComercialId)
 * @param {number} almacenId - ID del almacén (para egresos/transferencias)
 * @param {number} estadoMercaderiaDefault - Estado de mercadería por defecto (6 = LIBERADO)
 * @param {number} estadoCalidadDefault - Estado de calidad por defecto (10 = CALIDAD A)
 * @param {function} onSelect - Callback al seleccionar (data) => void
 */
export default function ProductoSelectorDialog({
  visible,
  onHide,
  modo = "ingreso",
  esCustodia = false,
  empresaId,
  clienteId,
  almacenId,
  estadoMercaderiaDefault = 6,
  estadoCalidadDefault = 10,
  onSelect,
}) {
  const toast = useRef(null);
  const esIngreso = modo === "ingreso";

  // Custom Hooks
  const catalogos = useCatalogos(visible, toast);
  const { items, loading, cargarDatos } = useProductoSelectorData({
    visible,
    empresaId,
    clienteId,
    almacenId,
    modo,
    esCustodia,
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
  } = useProductoSelectorFilters(items, catalogos, modo);

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
  const handleSelect = (rowData) => {
    if (esIngreso) {
      // INGRESO: Seleccionar producto directamente
      onSelect({
        tipo: "producto",
        productoId: rowData.id,
        producto: rowData,
        estadoMercaderiaId: estadoMercaderiaDefault,
        estadoCalidadId: estadoCalidadDefault,
      });
      onHide();
    } else {
      // EGRESO/TRANSFERENCIA: Retornar saldo completo
      onSelect({
        tipo: "saldo",
        productoId: rowData.productoId,
        producto: rowData.producto,
        saldo: rowData,
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
    try {
      const [empresasData, clientesData, coloresData, estadosData, unidadesMetricasData] =
        await Promise.all([
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
        (e) => Number(e.tipoProvieneDeId) === 2 && !e.cesado
      );
      setEstadosIniciales(estadosProducto);
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
      await crearProducto(nuevoProducto);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto creado correctamente",
      });
      setShowProductoForm(false);
      await cargarDatos();
    } catch (error) {
      console.error("Error al crear producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al crear producto",
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
      />
      <ProductoSelectorFilters
        filtros={filtros}
        opcionesDinamicas={opcionesDinamicas}
        onFiltroChange={handleFiltroChange}
        onLimpiar={limpiarFiltros}
        onNuevoProducto={handleNuevoProducto}
        esIngreso={esIngreso}
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
            producto={{ empresaId, clienteId }}
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
          clienteId={clienteId}
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