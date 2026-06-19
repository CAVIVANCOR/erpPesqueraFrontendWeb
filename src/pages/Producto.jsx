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
import EmpresaSelector from "../components/common/EmpresaSelector";

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

    // Aplicar filtros como en AccesoInstalacion
    if (selectedEmpresa) {
      resultado = resultado.filter(
        (p) => Number(p.empresaId) === Number(selectedEmpresa.id)
      );
    }

    if (selectedCliente) {
      resultado = resultado.filter(
        (p) => Number(p.clienteId) === Number(selectedCliente.id)
      );
    }

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

    // Clientes únicos (filtrados por empresa si hay una seleccionada)
    let clientesUnicos = [...new Map(
      productosParaOpciones
        .filter(p => p.cliente)
        .filter(p => !selectedEmpresa || Number(p.empresaId) === Number(selectedEmpresa.id))
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

    return {
      empresasUnicas,
      clientesUnicos,
      familiasUnicas,
      subfamiliasUnicas,
      especiesUnicas,
      tiposAlmacenamientoUnicos,
      unidadesMedidaUnicas
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
    // ❌ NO tocar los catálogos completos (familiasCatalogo, subfamiliasCatalogo, etc.)

    // ⭐ Filtrar clientes por empresa seleccionada
    if (selectedEmpresa) {
      // Filtrar TODAS las entidades comerciales que pertenecen a la empresa seleccionada
      // (sin importar si tienen productos o no)
      const clientesFiltrados = clientesCatalogo.filter(
        c => Number(c.empresaId) === Number(selectedEmpresa.id)
      );
      setClientes(clientesFiltrados);
    } else {
      // Si no hay empresa seleccionada, mostrar todos los clientes
      setClientes(clientesCatalogo);
    }

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
  }, [productosFiltrados, productos, selectedEmpresa, selectedFamilia, especiesCatalogo, clientesCatalogo]);

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
    globalFilterValue,
  ]);

  const abrirDialogoNuevo = () => {
    // Pre-cargar empresa y cliente seleccionados en los filtros
    const productoInicial = {
      empresaId: selectedEmpresa ? Number(selectedEmpresa.id) : null,
      clienteId: selectedCliente ? Number(selectedCliente.id) : null,
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
        summary: "Error",
        detail: "Error al eliminar producto",
        life: 3000,
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

  const empresaTemplate = (rowData) => {
    return (
      <span style={{ whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.empresa?.razonSocial || "N/A"}
      </span>
    );
  };

  const clienteTemplate = (rowData) => {
    return (
      <span style={{ fontStyle: "italic", whiteSpace: "normal", wordWrap: "break-word", display: "block" }}>
        {rowData.cliente?.razonSocial || "N/A"}
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
    // Deshabilitar el botón Nuevo hasta que se seleccione empresa y cliente, o sin permisos
    const isNuevoDisabled = !permisos.puedeCrear || !selectedEmpresa || !selectedCliente;

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
          <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => {
                setEmpresaIdSelector(id);
                const empresaObj = empresas.find(e => Number(e.id) === Number(id));
                setSelectedEmpresa(empresaObj || null);
                setSelectedCliente(null);
              }}
            />
          </div>
          <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedCliente}
              options={clientes}
              optionLabel="razonSocial"
              placeholder="Cliente"
              showClear
              onChange={onClienteFilterChange}
              className="w-15rem"
              disabled={!selectedEmpresa}
              filter
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className={
                isNuevoDisabled
                  ? "p-button-outlined p-button-sm"
                  : "p-button-success p-button-sm"
              }
              onClick={abrirDialogoNuevo}
              disabled={isNuevoDisabled}
              tooltip={
                !permisos.puedeCrear
                  ? "No tiene permisos para crear"
                  : !selectedEmpresa || !selectedCliente
                    ? "Seleccione empresa y cliente para crear un producto"
                    : "Crear nuevo producto"
              }
              tooltipOptions={{ position: "top" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Button
              icon="pi pi-refresh"
              className="p-button-outlined p-button-info p-button-sm"
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
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Button
              label="Limpiar Filtros"
              icon="pi pi-filter-slash"
              className="p-button-outlined p-button-secondary p-button-sm"
              onClick={limpiarFiltros}
              disabled={
                !selectedEmpresa &&
                !selectedCliente &&
                !selectedFamilia &&
                !selectedSubfamilia &&
                !selectedEspecie &&
                !selectedTipoAlmacenamiento &&
                !selectedUnidadMedida &&
                !globalFilterValue
              }
              tooltip="Limpiar todos los filtros aplicados"
              tooltipOptions={{ position: "top" }}
            />
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
            <span className="p-input-icon-left">
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Buscar..."
                className="p-inputtext-sm"
                style={{ fontWeight: "bold" }}
              />
            </span>
          </div>
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
              style={{ fontWeight: "bold" }}
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
              style={{ fontWeight: "bold" }}
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
              style={{ fontWeight: "bold" }}
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
              style={{ fontWeight: "bold" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedUnidadMedida}
              options={unidadesMedida}
              optionLabel="nombre"
              placeholder="Unidad Medida"
              showClear
              onChange={onUnidadMedidaFilterChange}
              className="w-15rem"
              filter
              style={{ fontWeight: "bold" }}
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
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => abrirDialogoEdicion(e.data)
            : undefined
        }
        selectionMode="single"
        scrollable
        scrollHeight="flex"
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        stripedRows
        size="small"
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          sortable
          body={empresaTemplate}
          style={{ width: "60px", whiteSpace: "normal", wordWrap: "break-word" }}
        />
        <Column
          field="cliente.razonSocial"
          header="Cliente"
          sortable
          body={clienteTemplate}
          style={{ width: "60px", whiteSpace: "normal", wordWrap: "break-word" }}
        />
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
          header="Unidad Medida Kardex"
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
          field="tipoAlmacenamiento.nombre"
          header="Almacena"
          sortable
          body={tipoAlmacenamientoTemplate}
          style={{ width: "60px" }}
        />

        <Column
          header="Estado"
          body={cesadoTemplate}
          style={{ width: "60px", textAlign: "center" }}
        />
        <Column
          body={accionesTemplate}
          style={{ width: "100px", textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "1350px", maxWidth: "95vw" }}
        header={
          productoSeleccionado && productoSeleccionado.id
            ? `Editar Producto - ID: ${productoSeleccionado.id}`
            : "Nuevo Producto"
        }
        modal
        maximizable
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
          permisos={permisos}
          readOnly={!!productoSeleccionado && !!productoSeleccionado.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default Producto;
