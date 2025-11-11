// src/components/movimientoAlmacen/ProductoSelectorDialog.jsx
// Componente inteligente para selección de productos o saldos según tipo de movimiento
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import { getProductos, crearProducto } from "../../api/producto";
import { getSaldosDetProductoClienteConFiltros } from "../../api/saldosDetProductoCliente";
import { getSaldosProductoClienteConFiltros } from "../../api/saldosProductoCliente";
import StockPorAlmacenDialog from "./StockPorAlmacenDialog";
import { getFamiliasProducto } from "../../api/familiaProducto";
import { getSubfamiliasProducto } from "../../api/subfamiliaProducto";
import { getMarcas } from "../../api/marca";
import { getPaises } from "../../api/pais";
import { getTiposAlmacenamiento } from "../../api/tipoAlmacenamiento";
import { getTiposMaterial } from "../../api/tipoMaterial";
import { getUnidadesMedida } from "../../api/unidadMedida";
import { getEspecies } from "../../api/especie";
import { getEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getColores } from "../../api/color";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import ProductoForm from "../producto/ProductoForm";
import { getResponsiveFontSize } from "../../utils/utils";

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
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  
  // Filtros
  const [familiaId, setFamiliaId] = useState(null);
  const [subfamiliaId, setSubfamiliaId] = useState(null);
  const [marcaId, setMarcaId] = useState(null);
  const [procedenciaId, setProcedenciaId] = useState(null);
  const [tipoAlmacenamientoId, setTipoAlmacenamientoId] = useState(null);
  const [tipoMaterialId, setTipoMaterialId] = useState(null);
  const [unidadMedidaId, setUnidadMedidaId] = useState(null);
  const [especieId, setEspecieId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Catálogos
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [paises, setPaises] = useState([]);
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [especies, setEspecies] = useState([]);

  // Opciones dinámicas (solo valores que existen en items actuales)
  const [opcionesDinamicas, setOpcionesDinamicas] = useState({
    familias: [],
    subfamilias: [],
    marcas: [],
    procedencias: [],
    tiposAlmacenamiento: [],
    tiposMaterial: [],
    unidadesMedida: [],
    especies: [],
  });

  // Diálogo de crear producto
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [colores, setColores] = useState([]);
  const [estadosIniciales, setEstadosIniciales] = useState([]);
  const [unidadesMetricas, setUnidadesMetricas] = useState([]);

  // Estado para Nivel 2: Stock por almacén
  const [showStockPorAlmacen, setShowStockPorAlmacen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Determinar si es ingreso (muestra productos) o egreso/transferencia (muestra saldos)
  const esIngreso = modo === "ingreso";

  useEffect(() => {
    if (visible) {
      cargarCatalogos();
      cargarDatos();
    }
  }, [visible, empresaId, clienteId, almacenId, modo, esCustodia]);

  useEffect(() => {
    calcularOpcionesDinamicas();
  }, [items, familias, subfamilias, marcas, paises, tiposAlmacenamiento, tiposMaterial, unidadesMedida, especies]);

  useEffect(() => {
    aplicarFiltros();
  }, [
    items,
    familiaId,
    subfamiliaId,
    marcaId,
    procedenciaId,
    tipoAlmacenamientoId,
    tipoMaterialId,
    unidadMedidaId,
    especieId,
    busqueda,
  ]);

  const cargarCatalogos = async () => {
    try {
      const [
        familiasData,
        subfamiliasData,
        marcasData,
        paisesData,
        tiposAlmData,
        tiposMatData,
        unidadesData,
        especiesData,
      ] = await Promise.all([
        getFamiliasProducto(),
        getSubfamiliasProducto(),
        getMarcas(),
        getPaises(),
        getTiposAlmacenamiento(),
        getTiposMaterial(),
        getUnidadesMedida(),
        getEspecies(),
      ]);

      setFamilias(familiasData);
      setSubfamilias(subfamiliasData);
      setMarcas(marcasData);
      setPaises(paisesData);
      setTiposAlmacenamiento(tiposAlmData);
      setTiposMaterial(tiposMatData);
      setUnidadesMedida(unidadesData);
      setEspecies(especiesData);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
      });
    }
  };


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
      clienteId, // Ya viene correcto desde el padre (entidadComercialId para propia)
      cesado: false,
    };
    const productosData = await getProductos(filtrosProductos);

    // 2. Cargar saldos generales desde SaldosProductoCliente (consolidado por producto)
    const filtrosSaldos = {
      empresaId,
      clienteId, // Mismo clienteId correcto
      custodia: esCustodia,
    };
    const saldosData = await getSaldosProductoClienteConFiltros(filtrosSaldos);

    // 3. Mapear productos con stock consolidado
    const productosConStock = productosData.map((producto) => {
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
      const costoPromedio = saldosProducto.length > 0
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
        cantidadAlmacenes: saldosProducto.length, // Cuántos almacenes tienen stock
      };
    });

    setItems(productosConStock);
  };

  /**
   * NIVEL 1 (Egresos): Carga solo productos con stock disponible
   */
  const cargarProductosConStock = async () => {
    // Para egresos, solo mostrar productos con stock en el almacén específico
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

  const calcularOpcionesDinamicas = () => {
    if (items.length === 0) {
      setOpcionesDinamicas({
        familias: [],
        subfamilias: [],
        marcas: [],
        procedencias: [],
        tiposAlmacenamiento: [],
        tiposMaterial: [],
        unidadesMedida: [],
        especies: [],
      });
      return;
    }

    const idsUnicos = {
      familias: new Set(),
      subfamilias: new Set(),
      marcas: new Set(),
      procedencias: new Set(),
      tiposAlmacenamiento: new Set(),
      tiposMaterial: new Set(),
      unidadesMedida: new Set(),
      especies: new Set(),
    };

    items.forEach((item) => {
      const prod = esIngreso ? item : item.producto;
      if (prod) {
        if (prod.familiaId) idsUnicos.familias.add(Number(prod.familiaId));
        if (prod.subfamiliaId) idsUnicos.subfamilias.add(Number(prod.subfamiliaId));
        if (prod.marcaId) idsUnicos.marcas.add(Number(prod.marcaId));
        if (prod.procedenciaId) idsUnicos.procedencias.add(Number(prod.procedenciaId));
        if (prod.tipoAlmacenamientoId) idsUnicos.tiposAlmacenamiento.add(Number(prod.tipoAlmacenamientoId));
        if (prod.tipoMaterialId) idsUnicos.tiposMaterial.add(Number(prod.tipoMaterialId));
        if (prod.unidadMedidaId) idsUnicos.unidadesMedida.add(Number(prod.unidadMedidaId));
        if (prod.especieId) idsUnicos.especies.add(Number(prod.especieId));
      }
    });

    setOpcionesDinamicas({
      familias: familias.filter((f) => idsUnicos.familias.has(Number(f.id))),
      subfamilias: subfamilias.filter((s) => idsUnicos.subfamilias.has(Number(s.id))),
      marcas: marcas.filter((m) => idsUnicos.marcas.has(Number(m.id))),
      procedencias: paises.filter((p) => idsUnicos.procedencias.has(Number(p.id))),
      tiposAlmacenamiento: tiposAlmacenamiento.filter((t) => idsUnicos.tiposAlmacenamiento.has(Number(t.id))),
      tiposMaterial: tiposMaterial.filter((t) => idsUnicos.tiposMaterial.has(Number(t.id))),
      unidadesMedida: unidadesMedida.filter((u) => idsUnicos.unidadesMedida.has(Number(u.id))),
      especies: especies.filter((e) => idsUnicos.especies.has(Number(e.id))),
    });
  };

  const aplicarFiltros = () => {
    let filtered = [...items];

    // Filtros de producto (aplican tanto a productos como a saldos)
    if (familiaId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.familiaId) === Number(familiaId);
      });
    }

    if (subfamiliaId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.subfamiliaId) === Number(subfamiliaId);
      });
    }

    if (marcaId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.marcaId) === Number(marcaId);
      });
    }

    if (procedenciaId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.procedenciaId) === Number(procedenciaId);
      });
    }

    if (tipoAlmacenamientoId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.tipoAlmacenamientoId) === Number(tipoAlmacenamientoId);
      });
    }

    if (tipoMaterialId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.tipoMaterialId) === Number(tipoMaterialId);
      });
    }

    if (unidadMedidaId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.unidadMedidaId) === Number(unidadMedidaId);
      });
    }

    if (especieId) {
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return Number(prod?.especieId) === Number(especieId);
      });
    }

    // Búsqueda por texto
    if (busqueda && busqueda.trim() !== "") {
      const searchTerm = busqueda.toLowerCase();
      filtered = filtered.filter((item) => {
        const prod = esIngreso ? item : item.producto;
        return (
          prod?.descripcionArmada?.toLowerCase().includes(searchTerm) ||
          prod?.codigo?.toLowerCase().includes(searchTerm) ||
          item?.lote?.toLowerCase().includes(searchTerm)
        );
      });
    }

    setFilteredItems(filtered);
  };

  /**
   * Maneja clic en fila: Abre Nivel 2 si tiene stock
   */
  const handleRowClick = (e) => {
    const rowData = e.data;
    if (esIngreso && rowData.stockDisponible > 0 && rowData.cantidadAlmacenes > 0) {
      // Si tiene stock, abrir Nivel 2 (Stock por Almacén)
      setProductoSeleccionado(rowData);
      setShowStockPorAlmacen(true);
    }
  };

  /**
   * Maneja botón Seleccionar: Selecciona el producto directamente
   */
  const handleSelect = (rowData) => {
    if (esIngreso) {
      // INGRESO: Seleccionar producto directamente (sin importar si tiene stock)
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

  const handleNuevoProducto = async () => {
    try {
      // Cargar datos necesarios para ProductoForm
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
      // Filtrar estados iniciales (tipoProvieneDeId = 2 para PRODUCTOS)
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

  const handleProductoCreado = async (nuevoProducto) => {
    try {
      await crearProducto(nuevoProducto);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto creado correctamente",
      });
      setShowProductoForm(false);
      // Recargar productos
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

  const limpiarFiltros = () => {
    setFamiliaId(null);
    setSubfamiliaId(null);
    setMarcaId(null);
    setProcedenciaId(null);
    setTipoAlmacenamientoId(null);
    setTipoMaterialId(null);
    setUnidadMedidaId(null);
    setEspecieId(null);
    setBusqueda("");
  };

  // Templates
  const productoTemplate = (rowData) => {
    const prod = esIngreso ? rowData : rowData.producto;
    return prod?.descripcionArmada || "-";
  };

  const unidadMedidaTemplate = (rowData) => {
    const prod = esIngreso ? rowData : rowData.producto;
    return prod?.unidadMedida?.nombre || "-";
  };

  const saldoTemplate = (rowData) => {
    if (esIngreso) return null;
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "bold", color: "#1976d2" }}>
          {Number(rowData.saldoCantidad).toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        {rowData.saldoPeso && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            {Number(rowData.saldoPeso).toLocaleString("es-PE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            kg
          </div>
        )}
      </div>
    );
  };

  const loteTemplate = (rowData) => {
    if (esIngreso) return null;
    return rowData.lote || "-";
  };

  const fechasTemplate = (rowData) => {
    if (esIngreso) return null;
    return (
      <div style={{ fontSize: "0.85em" }}>
        {rowData.fechaProduccion && (
          <div>
            <strong>Prod:</strong>{" "}
            {new Date(rowData.fechaProduccion).toLocaleDateString()}
          </div>
        )}
        {rowData.fechaVencimiento && (
          <div>
            <strong>Venc:</strong>{" "}
            {new Date(rowData.fechaVencimiento).toLocaleDateString()}
          </div>
        )}
        {rowData.fechaIngreso && (
          <div>
            <strong>Ing:</strong>{" "}
            {new Date(rowData.fechaIngreso).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const stockTemplate = (rowData) => {
    if (!esIngreso) return null;
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: "bold", color: "#1976d2" }}>
          {Number(rowData.stockDisponible || 0).toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        {rowData.pesoDisponible > 0 && (
          <div style={{ fontSize: "0.85em", color: "#666" }}>
            {Number(rowData.pesoDisponible).toLocaleString("es-PE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            kg
          </div>
        )}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-check"
        label="Seleccionar"
        className="p-button-sm p-button-success"
        onClick={() => handleSelect(rowData)}
      />
    );
  };

  const header = (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Información del modo */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <Tag
          value={esIngreso ? "INGRESO" : modo.toUpperCase()}
          severity={esIngreso ? "success" : modo === "egreso" ? "danger" : "info"}
        />
        <Tag
          value={esCustodia ? "CUSTODIA" : "PROPIA"}
          severity={esCustodia ? "warning" : "info"}
        />
        {!esIngreso && (
          <Tag
            value={`${filteredItems.length} productos con saldo`}
            severity="info"
          />
        )}
      </div>

      {/* Filtros */}
      <Panel header="Filtros" toggleable collapsed={false}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <label htmlFor="busqueda" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Búsqueda
            </label>
            <InputText
              id="busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
              placeholder="BUSCAR..."
              style={{ width: "100%", textTransform: "uppercase" }}
            />
          </div>

          <div>
            <label htmlFor="familiaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Familia
            </label>
            <Dropdown
              id="familiaId"
              value={familiaId}
              options={opcionesDinamicas.familias.map((f) => ({
                label: f.nombre,
                value: Number(f.id),
              }))}
              onChange={(e) => setFamiliaId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="subfamiliaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Subfamilia
            </label>
            <Dropdown
              id="subfamiliaId"
              value={subfamiliaId}
              options={opcionesDinamicas.subfamilias.map((s) => ({
                label: s.nombre,
                value: Number(s.id),
              }))}
              onChange={(e) => setSubfamiliaId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="marcaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Marca
            </label>
            <Dropdown
              id="marcaId"
              value={marcaId}
              options={opcionesDinamicas.marcas.map((m) => ({
                label: m.nombre,
                value: Number(m.id),
              }))}
              onChange={(e) => setMarcaId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="procedenciaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Procedencia
            </label>
            <Dropdown
              id="procedenciaId"
              value={procedenciaId}
              options={opcionesDinamicas.procedencias.map((p) => ({
                label: p.gentilicio,
                value: Number(p.id),
              }))}
              onChange={(e) => setProcedenciaId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="tipoAlmacenamientoId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Tipo Almacenamiento
            </label>
            <Dropdown
              id="tipoAlmacenamientoId"
              value={tipoAlmacenamientoId}
              options={opcionesDinamicas.tiposAlmacenamiento.map((t) => ({
                label: t.nombre,
                value: Number(t.id),
              }))}
              onChange={(e) => setTipoAlmacenamientoId(e.value)}
              placeholder="Todos"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="tipoMaterialId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Tipo Material
            </label>
            <Dropdown
              id="tipoMaterialId"
              value={tipoMaterialId}
              options={opcionesDinamicas.tiposMaterial.map((t) => ({
                label: t.nombre,
                value: Number(t.id),
              }))}
              onChange={(e) => setTipoMaterialId(e.value)}
              placeholder="Todos"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="unidadMedidaId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Unidad Medida
            </label>
            <Dropdown
              id="unidadMedidaId"
              value={unidadMedidaId}
              options={opcionesDinamicas.unidadesMedida.map((u) => ({
                label: u.nombre,
                value: Number(u.id),
              }))}
              onChange={(e) => setUnidadMedidaId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="especieId" style={{ fontWeight: "bold", fontSize: "0.9em" }}>
              Especie
            </label>
            <Dropdown
              id="especieId"
              value={especieId}
              options={opcionesDinamicas.especies.map((e) => ({
                label: e.nombre,
                value: Number(e.id),
              }))}
              onChange={(e) => setEspecieId(e.value)}
              placeholder="Todas"
              showClear
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            className="p-button-sm p-button-secondary"
            onClick={limpiarFiltros}
          />
          {esIngreso && (
            <Button
              label="Nuevo Producto"
              icon="pi pi-plus"
              className="p-button-sm p-button-success"
              onClick={handleNuevoProducto}
            />
          )}
        </div>
      </Panel>
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
        <DataTable
          value={filteredItems}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          header={header}
          emptyMessage={`No se encontraron ${esIngreso ? "productos" : "productos con saldo"}`}
          onRowClick={handleRowClick}
          onRowDoubleClick={(e) => handleSelect(e.data)}
          selectionMode="single"
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
        >
          <Column
            field="id"
            header="ID"
            style={{ width: "80px" }}
            body={(rowData) => (esIngreso ? rowData.id : rowData.productoId)}
          />
          <Column
            header="Producto"
            body={productoTemplate}
            style={{ minWidth: "300px" }}
          />
          <Column
            header="Unidad"
            body={unidadMedidaTemplate}
            style={{ width: "120px" }}
          />
          {esIngreso && (
            <Column
              header="Stock Disponible"
              body={stockTemplate}
              style={{ width: "150px" }}
            />
          )}
          {!esIngreso && (
            <>
              <Column
                header="Saldo"
                body={saldoTemplate}
                style={{ width: "120px" }}
              />
              <Column header="Lote" body={loteTemplate} style={{ width: "120px" }} />
              <Column
                header="Fechas"
                body={fechasTemplate}
                style={{ width: "150px" }}
              />
            </>
          )}
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
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
            producto={{
              empresaId,
              clienteId,
            }}
            familias={familias}
            subfamilias={subfamilias}
            unidadesMedida={unidadesMedida}
            unidadesMetricas={unidadesMetricas}
            tiposMaterial={tiposMaterial}
            colores={colores}
            empresas={empresas}
            clientes={clientes}
            tiposAlmacenamiento={tiposAlmacenamiento}
            paises={paises}
            marcas={marcas}
            estadosIniciales={estadosIniciales}
            unidadMetricaDefault={null}
            especies={especies}
            onGuardar={handleProductoCreado}
            onCancelar={() => setShowProductoForm(false)}
            modoEdicion={false}
            loading={loading}
            setLoading={setLoading}
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