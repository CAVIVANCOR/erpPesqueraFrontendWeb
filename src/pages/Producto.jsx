/**
 * Pantalla CRUD para gestión de Productos
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Búsqueda global por código, descripción, familia, etc.
 * - Templates profesionales para visualización de datos
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";
import {
  getProductos,
  eliminarProducto,
  crearProducto,
  actualizarProducto,
} from "../api/producto";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import ProductoForm from "../components/producto/ProductoForm";
import { getResponsiveFontSize } from "../utils/utils";
import { mensajeDeError } from "../utils/mensajeError";
import { getFamiliasProducto } from "../api/familiaProducto";
import { getSubfamiliasProducto } from "../api/subfamiliaProducto";
import {
  getUnidadesMedida,
  getUnidadesMedidaMetricas,
  getUnidadMetricaDefault,
} from "../api/unidadMedida";
import { getTiposMaterial } from "../api/tipoMaterial";
import { getColores } from "../api/color";
import { getEmpresas } from "../api/empresa";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getEstadosMultiFuncionParaProductos } from "../api/estadoMultiFuncion";
import { getTiposAlmacenamiento } from "../api/tipoAlmacenamiento";
import { getPaises } from "../api/pais";
import { getMarcas } from "../api/marca";
import { getEspecies } from "../api/especie";
import { getTiposDetraccionActivos } from "../api/tipoDetraccion";
import { getTiposAfectacionIGVActivos } from "../api/facturacionElectronica/tipoAfectacionIGV";
import { generarProductosExcel } from "../components/producto/reports/generarProductosExcel";
import AsignarCampoMasaProductoButton from "../components/common/AsignarCampoMasaProductoButton";
import ReemplazarProductoMasivoButton from "../components/common/ReemplazarProductoMasivoButton";

const Producto = ({ ruta }) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [clientesCatalogo, setClientesCatalogo] = useState([]); // Catálogo completo

  // Productos seleccionados en la tabla (para la asignación masiva)
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "empresa.id": { value: null, matchMode: FilterMatchMode.EQUALS },
    "cliente.id": { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  // Estados para catálogos (FILTROS de la lista)
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [especiesFiltradas, setEspeciesFiltradas] = useState([]);
  const [tiposAfectacionIGVFiltrados, setTiposAfectacionIGVFiltrados] = useState([]); // AGREGADO

  // Estados para catálogos COMPLETOS (FORMULARIO)
  const [familiasCatalogo, setFamiliasCatalogo] = useState([]);
  const [subfamiliasCatalogo, setSubfamiliasCatalogo] = useState([]);
  const [unidadesMedidaCatalogo, setUnidadesMedidaCatalogo] = useState([]);
  const [tiposAlmacenamientoCatalogo, setTiposAlmacenamientoCatalogo] = useState([]);
  const [especiesCatalogo, setEspeciesCatalogo] = useState([]);
  const [tiposMaterialCatalogo, setTiposMaterialCatalogo] = useState([]);
  const [coloresCatalogo, setColoresCatalogo] = useState([]);
  const [paisesCatalogo, setPaisesCatalogo] = useState([]);
  const [marcasCatalogo, setMarcasCatalogo] = useState([]);
  const [tiposDetraccionCatalogo, setTiposDetraccionCatalogo] = useState([]);
  const [tiposAfectacionIGVCatalogo, setTiposAfectacionIGVCatalogo] = useState([]);
  // Estados para catálogos que NO se filtran
  const [unidadesMetricas, setUnidadesMetricas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estadosIniciales, setEstadosIniciales] = useState([]);
  const [unidadMetricaDefault, setUnidadMetricaDefault] = useState(null);

  // Estados para los selectores de filtro
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaIdSelector, setEmpresaIdSelector] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedFamilia, setSelectedFamilia] = useState(null);
  const [selectedSubfamilia, setSelectedSubfamilia] = useState(null);
  const [selectedEspecie, setSelectedEspecie] = useState(null); // ⭐ AGREGAR
  const [selectedTipoAlmacenamiento, setSelectedTipoAlmacenamiento] =
    useState(null);
  const [selectedUnidadMedida, setSelectedUnidadMedida] = useState(null);
  const [selectedTipoAfectacionIGV, setSelectedTipoAfectacionIGV] = useState(null); // AGREGADO
  // Filtros por destino del producto: null = todos, true = solo los marcados, false = solo los no marcados
  const [filtroParaCompras, setFiltroParaCompras] = useState(null);
  const [filtroParaVentas, setFiltroParaVentas] = useState(null);

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
    cargarOpcionesFiltros();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [
        unidadesData,
        unidadesMetricasData,
        tiposMaterialData,
        coloresData,
        estadosData,
        paisesData,
        marcasData,
        unidadMetricaDefaultData,
        especiesData,
        tiposDetraccionData,
        tiposAfectacionIGVData,
      ] = await Promise.all([
        getUnidadesMedida(),
        getUnidadesMedidaMetricas(),
        getTiposMaterial(),
        getColores(),
        getEstadosMultiFuncionParaProductos(),
        getPaises(),
        getMarcas(),
        getUnidadMetricaDefault(),
        getEspecies().catch((err) => {
          return []; // Retornar array vacío si falla
        }),
        getTiposDetraccionActivos().catch((err) => {
          return []; // Retornar array vacío si falla
        }),
        getTiposAfectacionIGVActivos().catch((err) => {
          return []; // Retornar array vacío si falla
        }),
      ]);

      // Guardar catálogos COMPLETOS para el formulario
      setUnidadesMedidaCatalogo(unidadesData);
      setUnidadesMetricas(unidadesMetricasData);
      setTiposMaterialCatalogo(tiposMaterialData);
      setColoresCatalogo(coloresData);
      setEstadosIniciales(estadosData);
      setPaisesCatalogo(paisesData);
      setMarcasCatalogo(marcasData);
      setUnidadMetricaDefault(unidadMetricaDefaultData);
      setEspeciesCatalogo(especiesData);
      setTiposDetraccionCatalogo(tiposDetraccionData);
      setTiposAfectacionIGVCatalogo(tiposAfectacionIGVData);

      // Los filtros dinámicos se cargarán desde obtenerOpcionesDinamicas()
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
        life: 3000,
      });
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);

      // Cargar todos los productos sin filtros
      const data = await getProductos({});
      setProductos(data);
      setProductosFiltrados(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los productos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarOpcionesFiltros = async () => {
    try {
      const [empresasData, clientesData, familiasData, tiposAlmacenamientoData, unidadesMedidaData] =
        await Promise.all([
          getEmpresas(),
          getEntidadesComerciales(),
          getFamiliasProducto(),
          getTiposAlmacenamiento(),
          getUnidadesMedida(),
        ]);

      setEmpresas(empresasData);
      setClientesCatalogo(clientesData);
      setFamiliasCatalogo(familiasData);
      setTiposAlmacenamientoCatalogo(tiposAlmacenamientoData);
      setUnidadesMedidaCatalogo(unidadesMedidaData);
      setSubfamiliasCatalogo(await getSubfamiliasProducto());
    } catch (error) {
      console.error("Error cargando opciones de filtros:", error);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...productos];

    // Producto es un maestro único (MEGUI): Producto.empresaId y Producto.clienteId están depreciados,
    // por eso ya no se filtra por empresa ni por cliente.
    if (selectedFamilia) {
      resultado = resultado.filter(
        (p) => Number(p.familiaId) === Number(selectedFamilia.id)
      );
    }

    if (selectedSubfamilia) {
      resultado = resultado.filter(
        (p) => Number(p.subfamiliaId) === Number(selectedSubfamilia.id)
      );
    }

    if (selectedTipoAlmacenamiento) {
      resultado = resultado.filter(
        (p) =>
          Number(p.tipoAlmacenamientoId) ===
          Number(selectedTipoAlmacenamiento.id)
      );
    }

    if (selectedUnidadMedida) {
      resultado = resultado.filter(
        (p) => Number(p.unidadMedidaId) === Number(selectedUnidadMedida.id)
      );
    }
    // ⭐ AGREGAR FILTRO DE ESPECIE
    if (selectedEspecie) {
      resultado = resultado.filter(
        (p) => Number(p.especieId) === Number(selectedEspecie.id)
      );
    }
    // AGREGADO: Filtro de tipo afectación IGV
    if (selectedTipoAfectacionIGV) {
      resultado = resultado.filter(
        (p) => Number(p.tipoAfectacionIGVId) === Number(selectedTipoAfectacionIGV.id)
      );
    }
    // Destino del producto: se ofrece en Compras / en Ventas
    if (filtroParaCompras !== null) {
      resultado = resultado.filter((p) => Boolean(p.esParaCompras) === filtroParaCompras);
    }
    if (filtroParaVentas !== null) {
      resultado = resultado.filter((p) => Boolean(p.esParaVentas) === filtroParaVentas);
    }
    // Búsqueda global
    if (globalFilterValue) {
      const busqueda = globalFilterValue.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          (p.codigo && p.codigo.toLowerCase().includes(busqueda)) ||
          (p.descripcionBase &&
            p.descripcionBase.toLowerCase().includes(busqueda)) ||
          (p.familia?.nombre &&
            p.familia.nombre.toLowerCase().includes(busqueda))
      );
    }

    setProductosFiltrados(resultado);
  };

  // Obtener opciones únicas de los productos filtrados
  const obtenerOpcionesDinamicas = () => {
    const productosParaOpciones = productosFiltrados;
    // Empresas únicas
    const empresasUnicas = [...new Map(
      productosParaOpciones
        .filter(p => p.empresa)
        .map(p => [p.empresa.id, p.empresa])
    ).values()];

    // ✅ Clientes únicos (SIN filtrar por empresa - clientes globales)
    let clientesUnicos = [...new Map(
      productosParaOpciones
        .filter(p => p.cliente)
        .map(p => [p.cliente.id, p.cliente])
    ).values()];

    // Familias únicas
    const familiasUnicas = [...new Map(
      productosParaOpciones
        .filter(p => p.familia)
        .map(p => [p.familia.id, p.familia])
    ).values()];

    // Subfamilias únicas (filtradas por familia si hay una seleccionada)
    const subfamiliasUnicas = [...new Map(
      productosParaOpciones
        .filter(p => p.subfamilia)
        .filter(p => !selectedFamilia || Number(p.familiaId) === Number(selectedFamilia.id))
        .map(p => [p.subfamilia.id, p.subfamilia])
    ).values()];

    // Especies únicas - Extraer de productos con fallback al catálogo
    const especiesIdsUnicos = [...new Set(
      productosParaOpciones
        .filter(p => p.especieId)
        .map(p => Number(p.especieId))
    )];

    const especiesUnicas = especiesIdsUnicos
      .map(especieId => {
        const especieCatalogo = especiesCatalogo.find(e => Number(e.id) === especieId);
        if (especieCatalogo) {
          return especieCatalogo;
        }
        // Fallback: crear objeto mínimo si no está en catálogo
        return {
          id: especieId,
          nombre: `Especie ${especieId}`
        };
      })
      .filter(e => e !== null);

    // Tipos de almacenamiento únicos
    const tiposAlmacenamientoUnicos = [...new Map(
      productosParaOpciones
        .filter(p => p.tipoAlmacenamiento)
        .map(p => [p.tipoAlmacenamiento.id, p.tipoAlmacenamiento])
    ).values()];

    // Unidades de medida únicas
    const unidadesMedidaUnicas = [...new Map(
      productosParaOpciones
        .filter(p => p.unidadMedida)
        .map(p => [p.unidadMedida.id, p.unidadMedida])
    ).values()];

    // AGREGADO: Tipos de afectación IGV únicos
    const tiposAfectacionIGVIdsUnicos = [...new Set(
      productosParaOpciones
        .filter(p => p.tipoAfectacionIGVId)
        .map(p => Number(p.tipoAfectacionIGVId))
    )];

    const tiposAfectacionIGVUnicos = tiposAfectacionIGVIdsUnicos
      .map(tipoId => {
        const tipoCatalogo = tiposAfectacionIGVCatalogo.find(t => Number(t.id) === tipoId);
        if (tipoCatalogo) {
          return tipoCatalogo;
        }
        return {
          id: tipoId,
          nombre: `Tipo ${tipoId}`
        };
      })
      .filter(t => t !== null);

    return {
      empresasUnicas,
      clientesUnicos,
      familiasUnicas,
      subfamiliasUnicas,
      especiesUnicas,
      tiposAlmacenamientoUnicos,
      unidadesMedidaUnicas,
      tiposAfectacionIGVUnicos // AGREGADO
    };
  };

  // Actualizar opciones de filtros basadas en productos visibles
  useEffect(() => {
    const opciones = obtenerOpcionesDinamicas();

    // Actualizar estados con opciones dinámicas
    // ❌ NO actualizar empresas ni clientes (se cargan del catálogo completo)
    // setEmpresas(opciones.empresasUnicas);  ← ELIMINAR
    // setClientes(opciones.clientesUnicos);  ← ELIMINAR
    // ✅ SOLO actualizar filtros de la lista (NO catálogos del formulario)
    setFamilias(opciones.familiasUnicas);
    setSubfamilias(opciones.subfamiliasUnicas);
    setEspeciesFiltradas(opciones.especiesUnicas);
    setTiposAlmacenamiento(opciones.tiposAlmacenamientoUnicos);
    setUnidadesMedida(opciones.unidadesMedidaUnicas);
    setTiposAfectacionIGVFiltrados(opciones.tiposAfectacionIGVUnicos); // AGREGADO

    // ❌ NO tocar los catálogos completos (familiasCatalogo, subfamiliasCatalogo, etc.)

    // ✅ CLIENTES GLOBALES: Mostrar TODOS los clientes sin filtrar por empresa
    // EntidadComercial.empresaId está DEPRECIADO
    setClientes(clientesCatalogo);

    // Limpiar selecciones que ya no existen en las opciones
    if (selectedCliente && !clientes.find(c => Number(c.id) === Number(selectedCliente.id))) {
      setSelectedCliente(null);
    }
    if (selectedFamilia && !opciones.familiasUnicas.find(f => Number(f.id) === Number(selectedFamilia.id))) {
      setSelectedFamilia(null);
    }
    if (selectedSubfamilia && !opciones.subfamiliasUnicas.find(s => Number(s.id) === Number(selectedSubfamilia.id))) {
      setSelectedSubfamilia(null);
    }
    if (selectedEspecie && opciones.especiesUnicas.length > 0 && !opciones.especiesUnicas.find(e => Number(e.id) === Number(selectedEspecie.id))) {
      setSelectedEspecie(null);
    }
    if (selectedTipoAlmacenamiento && !opciones.tiposAlmacenamientoUnicos.find(t => Number(t.id) === Number(selectedTipoAlmacenamiento.id))) {
      setSelectedTipoAlmacenamiento(null);
    }
    if (selectedUnidadMedida && !opciones.unidadesMedidaUnicas.find(u => Number(u.id) === Number(selectedUnidadMedida.id))) {
      setSelectedUnidadMedida(null);
    }
    if (selectedTipoAfectacionIGV && opciones.tiposAfectacionIGVUnicos.length > 0 && !opciones.tiposAfectacionIGVUnicos.find(t => Number(t.id) === Number(selectedTipoAfectacionIGV.id))) {
      setSelectedTipoAfectacionIGV(null);
    }
  }, [productosFiltrados, productos, selectedEmpresa, selectedFamilia, especiesCatalogo, clientesCatalogo, tiposAfectacionIGVCatalogo]);

  // Efecto para aplicar filtros cuando cambian los filtros o los productos
  useEffect(() => {
    if (productos.length > 0) {
      aplicarFiltros();
    }
  }, [
    productos,
    selectedEmpresa,
    selectedCliente,
    selectedFamilia,
    selectedSubfamilia,
    selectedEspecie,
    selectedTipoAlmacenamiento,
    selectedUnidadMedida,
    selectedTipoAfectacionIGV,
    filtroParaCompras,
    filtroParaVentas,
    globalFilterValue,
  ]);
  const handleExportarExcel = async () => {
    try {
      setLoading(true);
      const response = await getProductos();
      const blob = await generarProductosExcel(response);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.current.show({
        severity: 'success',
        summary: 'Exportado',
        detail: 'Excel generado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al generar Excel',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  const abrirDialogoNuevo = () => {
    // Maestro único: todo producto nace en MEGUI (empresa 1) con la entidad comercial de esa empresa.
    // El servidor vuelve a fijar estos dos valores al guardar.
    const empresaMaestro = empresas.find((e) => Number(e.id) === 1);
    const productoInicial = {
      empresaId: 1,
      clienteId: empresaMaestro?.entidadComercialId ? Number(empresaMaestro.entidadComercialId) : null,
    };
    setProductoSeleccionado(productoInicial);
    setDialogVisible(true);
  };

  const limpiarFiltros = () => {
    setSelectedEmpresa(null);
    setSelectedCliente(null);
    setSelectedFamilia(null);
    setSelectedSubfamilia(null);
    setSelectedEspecie(null);
    setSelectedTipoAfectacionIGV(null); // AGREGADO
    setFiltroParaCompras(null);
    setFiltroParaVentas(null);
    setSelectedTipoAlmacenamiento(null);
    setSelectedUnidadMedida(null);
    setGlobalFilterValue("");
  };

  const abrirDialogoEdicion = (producto) => {
    setProductoSeleccionado(producto);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setProductoSeleccionado(null);
  };

  const onGuardarExitoso = async (data) => {
    const esEdicion = productoSeleccionado && productoSeleccionado.id;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para editar registros.',
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para crear registros.',
        life: 3000,
      });
      return;
    }

    if (esEdicion) {
      await actualizarProducto(productoSeleccionado.id, data);
    } else {
      await crearProducto(data);
    }
    cargarProductos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail:
        esEdicion
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (producto) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'No tiene permisos para eliminar registros.',
        life: 3000,
      });
      return;
    }
    setProductoAEliminar(producto);
    setConfirmVisible(true);
  };

  const eliminar = async () => {
    try {
      await eliminarProducto(productoAEliminar.id);
      setProductos(
        productos.filter((p) => Number(p.id) !== Number(productoAEliminar.id))
      );
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto eliminado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "No se pudo eliminar el producto",
        detail: mensajeDeError(error, "No se pudo eliminar el producto"),
        life: 15000,
      });
    } finally {
      setConfirmVisible(false);
      setProductoAEliminar(null);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    aplicarFiltros();
  };

  const onEmpresaFilterChange = (e) => {
    setSelectedEmpresa(e.value);
    setSelectedCliente(null);
  };

  const onClienteFilterChange = (e) => {
    setSelectedCliente(e.value);
  };

  const onFamiliaFilterChange = (e) => {
    setSelectedFamilia(e.value);
    setSelectedSubfamilia(null);
    // El useEffect de líneas 268-281 aplicará los filtros automáticamente
  };

  const onSubfamiliaFilterChange = (e) => {
    setSelectedSubfamilia(e.value);
  };

  const onTipoAlmacenamientoFilterChange = (e) => {
    setSelectedTipoAlmacenamiento(e.value);
  };
  const onEspecieFilterChange = (e) => {
    setSelectedEspecie(e.value);
  };

  // AGREGADO: Handler para filtro de tipo afectación IGV
  const onTipoAfectacionIGVFilterChange = (e) => {
    setSelectedTipoAfectacionIGV(e.value);
  };
  const onUnidadMedidaFilterChange = (e) => {
    setSelectedUnidadMedida(e.value);
  };

  const descripcionTemplate = (rowData) => {
    return (
      <span
        style={{
          fontWeight: "bold",
          whiteSpace: "normal",
          wordWrap: "break-word",
          display: "block"
        }}
      >
        {rowData.descripcionArmada}
      </span>
    );
  };

  const familiaTemplate = (rowData) => {
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.familia?.nombre}
      </span>
    );
  };

  const subfamiliaTemplate = (rowData) => {
    return (
      <span
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          display: "block",
        }}
      >
        {rowData.subfamilia?.nombre}
      </span>
    );
  };

  const tipoAlmacenamientoTemplate = (rowData) => {
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.tipoAlmacenamiento?.nombre || "N/A"}
      </span>
    );
  };

  const unidadMedidaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.unidadMedida?.nombre || "N/A"}
      </span>
    );
  };

  const unidadMedidaComercialTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.unidadMedidaComercial?.nombre || "-"}
      </span>
    );
  };

  const especieTemplate = (rowData) => {
    const especie = especiesCatalogo.find(
      (e) => Number(e.id) === Number(rowData.especieId)
    );
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {especie?.nombre || "N/A"}
      </span>
    );
  };

  const cesadoTemplate = (rowData) => {
    return rowData.cesado ? (
      <span
        style={{
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        CESADO
      </span>
    ) : (
      <span
        style={{
          backgroundColor: "#dcfce7",
          color: "#166534",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
        ACTIVO
      </span>
    );
  };

  const tipoAfectacionIGVTemplate = (rowData) => {
    const tipo = rowData.tipoAfectacionIGV;
    if (!tipo) {
      return <span style={{ color: "#999", fontStyle: "italic" }}>Sin asignar</span>;
    }
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {tipo.codigo} - {tipo.nombre}
      </span>
    );
  };

  const tipoDetraccionTemplate = (rowData) => {
    const tipo = rowData.tipoDetraccion;
    if (!tipo) {
      return <span style={{ color: "#999", fontStyle: "italic" }}>Sin asignar</span>;
    }
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {tipo.codigo} - {tipo.nombre}
      </span>
    );
  };

  const cuentaContableTemplate = (rowData, field) => {
    const cuenta = rowData[field];
    if (!cuenta) {
      return <span style={{ color: "#999", fontStyle: "italic" }}>Sin asignar</span>;
    }
    return (
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Tag
          value={cuenta.codigoCuenta}
          severity="info"
          style={{ fontSize: "0.75rem" }}
        />
        <span style={{ fontSize: "0.85rem" }}>{cuenta.nombreCuenta}</span>
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          onClick={(ev) => {
            ev.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? 'Editar' : 'Ver'}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={() => confirmarEliminacion(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const renderHeader = () => {
    // Deshabilitar el botón Nuevo sin permisos o si MEGUI no tiene entidad comercial asignada (dato que se asigna al producto)
    const entidadMaestro = empresas.find((e) => Number(e.id) === 1)?.entidadComercialId;
    const isNuevoDisabled = !permisos.puedeCrear || !entidadMaestro;

    return (
      <div className="flex align-items-center gap-2">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h2>Gestión Productos y Servicios</h2>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <small className="text-500">
              {productosFiltrados.length} registro
              {productosFiltrados.length !== 1 ? "s" : ""}
              {(selectedEmpresa || selectedCliente) && (
                <span className="text-primary">
                  {selectedEmpresa &&
                    ` | Empresa: ${selectedEmpresa.razonSocial || "N/A"}`}
                  {selectedCliente &&
                    ` | Cliente: ${selectedCliente.razonSocial || "N/A"}`}
                </span>
              )}
            </small>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1}}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className={
                isNuevoDisabled
                  ? "p-button-outlined"
                  : "p-button-success"
              }
              onClick={abrirDialogoNuevo}
              disabled={isNuevoDisabled}
              tooltip={
                !permisos.puedeCrear
                  ? "No tiene permisos para crear"
                  : !entidadMaestro
                    ? "MEGUI no tiene entidad comercial asignada: asígnela en Empresas"
                    : "Crear nuevo producto"
              }
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 0.25}}>
            <Button
              icon="pi pi-refresh"
              onClick={async () => {
                await cargarProductos();
                await cargarCatalogos();
                toast.current?.show({
                  severity: "success",
                  summary: "Actualizado",
                  detail: "Datos actualizados correctamente desde el servidor",
                  life: 3000,
                });
              }}
              loading={loading}
              tooltip="Actualizar todos los datos desde el servidor"
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 0.25 }}>
            <Button
              icon="pi pi-filter-slash"
              onClick={limpiarFiltros}
              disabled={
                !selectedEmpresa &&
                !selectedCliente &&
                !selectedFamilia &&
                !selectedSubfamilia &&
                !selectedEspecie &&
                !selectedTipoAlmacenamiento &&
                !selectedUnidadMedida &&
                !selectedTipoAfectacionIGV && // AGREGADO
                filtroParaCompras === null &&
                filtroParaVentas === null &&
                !globalFilterValue
              }
              tooltip="Limpiar todos los filtros aplicados"
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <AsignarCampoMasaProductoButton
              selectedIds={productosSeleccionados.map((p) => p.id)}
              disabled={!permisos.puedeEditar}
              onExito={cargarProductos}
              label="Asignar"
              icon="pi pi-pencil"
              className="p-button-warning"
            />
          </div>
          <div style={{ flex: 1 }}>
            <ReemplazarProductoMasivoButton
              modo="GLOBAL"
              productoOrigen={productosSeleccionados.length === 1 ? { id: productosSeleccionados[0].id } : null}
              totalSeleccionados={productosSeleccionados.length}
              disabled={!permisos.puedeEditar}
              onExito={cargarProductos}
              label="Reemplazar"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label="A Excel"
              icon="pi pi-file-excel"
              className="p-button-success"
              onClick={handleExportarExcel}
              disabled={loading}
              tooltip="Exportar todos los Productos a Excel"
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1}}>
            <span className="p-input-icon-left">
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Buscar..."
                className="p-inputtext-sm"
                style={{ fontWeight: "bold", width: "100%" }}
              />
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedFamilia}
              options={familias}
              optionLabel="nombre"
              placeholder="Familia"
              showClear
              onChange={onFamiliaFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedSubfamilia}
              options={subfamilias}
              optionLabel="nombre"
              placeholder="Subfamilia"
              showClear
              onChange={onSubfamiliaFilterChange}
              className="w-15rem"
              disabled={!selectedFamilia}
              filter
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedEspecie}
              options={especiesFiltradas}
              optionLabel="nombre"
              placeholder="Especie"
              showClear
              onChange={onEspecieFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold", width: "100%" }}
              emptyMessage="No hay especies en los productos filtrados"
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedTipoAlmacenamiento}
              options={tiposAlmacenamiento}
              optionLabel="nombre"
              placeholder="Tipo Almacenamiento"
              showClear
              onChange={onTipoAlmacenamientoFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedUnidadMedida}
              options={unidadesMedida}
              optionLabel="nombre"
              placeholder="Presentación"
              showClear
              onChange={onUnidadMedidaFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedTipoAfectacionIGV}
              options={tiposAfectacionIGVFiltrados}
              optionLabel="nombre"
              placeholder="Tipo Afectación IGV"
              showClear
              onChange={onTipoAfectacionIGVFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold", width: "100%" }}
              emptyMessage="No hay tipos de afectación en los productos filtrados"
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={filtroParaCompras}
              options={[{ label: "Para Compras: SÍ", value: true }, { label: "Para Compras: NO", value: false }]}
              placeholder="Para Compras"
              showClear
              onChange={(e) => setFiltroParaCompras(e.value === undefined ? null : e.value)}
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={filtroParaVentas}
              options={[{ label: "Para Ventas: SÍ", value: true }, { label: "Para Ventas: NO", value: false }]}
              placeholder="Para Ventas"
              showClear
              onChange={(e) => setFiltroParaVentas(e.value === undefined ? null : e.value)}
              style={{ fontWeight: "bold", width: "100%" }}
            />
          </div>
          

        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        message={`¿Está seguro de eliminar el producto "${productoAEliminar?.descripcionBase || ""
          }"?`}
        header="Confirmar eliminación"
        icon="pi pi-exclamation-triangle"
        accept={eliminar}
        reject={() => setConfirmVisible(false)}
        acceptClassName="p-button-danger"
      />

      <DataTable
        value={productosFiltrados}
        paginator
        rows={30}
        rowsPerPageOptions={[30, 60, 120, 200, 300, 500]}
        loading={loading}
        header={renderHeader()}
        emptyMessage="No se encontraron productos"
        className="p-datatable-sm p-datatable-hover"
        sortField="id"
        sortOrder={-1}
        selection={productosSeleccionados}
        onSelectionChange={(e) => setProductosSeleccionados(e.value)}
        dataKey="id"
        scrollable
        scrollHeight="flex"
        style={{
          fontSize: getResponsiveFontSize(),
        }}
        stripedRows
        size="small"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          field="familia.nombre"
          header="Familia"
          sortable
          body={familiaTemplate}
          style={{ width: "80px" }}
        />
        <Column
          field="subfamilia.nombre"
          header="Subfamilia"
          sortable
          body={subfamiliaTemplate}
          style={{ width: "80px" }}
        />
        <Column
          header="Especie"
          body={especieTemplate}
          style={{ width: "80px" }}
        />
        <Column
          field="descripcionArmada"
          header="Descripción"
          sortable
          body={descripcionTemplate}
          style={{ width: "200px", whiteSpace: "normal", wordWrap: "break-word" }}
        />
        <Column
          field="unidadMedida.nombre"
          header="Presentación"
          sortable
          body={unidadMedidaTemplate}
          style={{ width: "150px", whiteSpace: "normal", wordWrap: "break-word" }}
        />
        <Column
          field="unidadMedidaComercial.nombre"
          header="U.M. Comercial"
          sortable
          body={unidadMedidaComercialTemplate}
          style={{ width: "150px", whiteSpace: "normal", wordWrap: "break-word" }}
        />
        <Column
          field="tipoAfectacionIGV.nombre"
          header="Afectación IGV"
          sortable
          body={tipoAfectacionIGVTemplate}
          style={{ width: "140px" }}
        />
        <Column
          field="tipoDetraccion.nombre"
          header="Detracción"
          sortable
          body={tipoDetraccionTemplate}
          style={{ width: "160px" }}
        />
        <Column
          field="esParaCompras"
          header="Compras"
          sortable
          body={(rowData) => (
            <Tag value={rowData.esParaCompras ? "SÍ" : "NO"} severity={rowData.esParaCompras ? "success" : "secondary"} />
          )}
          style={{ width: "90px", textAlign: "center" }}
        />
        <Column
          field="esParaVentas"
          header="Ventas"
          sortable
          body={(rowData) => (
            <Tag value={rowData.esParaVentas ? "SÍ" : "NO"} severity={rowData.esParaVentas ? "success" : "secondary"} />
          )}
          style={{ width: "90px", textAlign: "center" }}
        />
        <Column
          field="cuentaCompras.codigoCuenta"
          header="Cuenta Compras"
          sortable
          body={(rowData) => cuentaContableTemplate(rowData, "cuentaCompras")}
          style={{ width: "170px" }}
        />
        <Column
          field="cuentaInventario.codigoCuenta"
          header="Cuenta Inventario"
          sortable
          body={(rowData) => cuentaContableTemplate(rowData, "cuentaInventario")}
          style={{ width: "170px" }}
        />
        <Column
          field="cuentaCostoVentas.codigoCuenta"
          header="Cuenta Costo Ventas"
          sortable
          body={(rowData) => cuentaContableTemplate(rowData, "cuentaCostoVentas")}
          style={{ width: "170px" }}
        />
        <Column
          field="cuentaVariacion.codigoCuenta"
          header="Cuenta Variación"
          sortable
          body={(rowData) => cuentaContableTemplate(rowData, "cuentaVariacion")}
          style={{ width: "170px" }}
        />
        <Column
          field="cuentaVentas.codigoCuenta"
          header="Cuenta Ventas"
          sortable
          body={(rowData) => cuentaContableTemplate(rowData, "cuentaVentas")}
          style={{ width: "170px" }}
        />
        <Column
          body={accionesTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1300px" }}
        header={
          productoSeleccionado && productoSeleccionado.id
            ? `Editar Producto - ID: ${productoSeleccionado.id}`
            : "Nuevo Producto"
        }
        modal
        maximizable
        maximized={true}
        onHide={cerrarDialogo}
      >
        <ProductoForm
          producto={productoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          modoEdicion={!!(productoSeleccionado && productoSeleccionado.id)}
          loading={loading}
          setLoading={setLoading}
          familias={familiasCatalogo}
          subfamilias={subfamiliasCatalogo}
          unidadesMedida={unidadesMedidaCatalogo}
          unidadesMetricas={unidadesMetricas}
          tiposMaterial={tiposMaterialCatalogo}
          colores={coloresCatalogo}
          empresas={empresas}
          clientes={clientesCatalogo}
          tiposAlmacenamiento={tiposAlmacenamientoCatalogo}
          paises={paisesCatalogo}
          marcas={marcasCatalogo}
          estadosIniciales={estadosIniciales}
          unidadMetricaDefault={unidadMetricaDefault}
          especies={especiesCatalogo}
          tiposDetraccion={tiposDetraccionCatalogo}
          tiposAfectacionIGV={tiposAfectacionIGVCatalogo}
          permisos={permisos}
          readOnly={!!productoSeleccionado && !!productoSeleccionado.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default Producto;
