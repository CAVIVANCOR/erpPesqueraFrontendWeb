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

const Producto = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "empresa.id": { value: null, matchMode: FilterMatchMode.EQUALS },
    "cliente.id": { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Estados para catálogos
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [unidadesMetricas, setUnidadesMetricas] = useState([]);
  const [tiposMaterial, setTiposMaterial] = useState([]);
  const [colores, setColores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiposAlmacenamiento, setTiposAlmacenamiento] = useState([]);
  const [paises, setPaises] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [estadosIniciales, setEstadosIniciales] = useState([]);
  const [unidadMetricaDefault, setUnidadMetricaDefault] = useState(null);

  // Estados para los selectores de filtro
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedFamilia, setSelectedFamilia] = useState(null);
  const [selectedSubfamilia, setSelectedSubfamilia] = useState(null);
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
        familiasData,
        subfamiliasData,
        unidadesData,
        unidadesMetricasData,
        tiposMaterialData,
        coloresData,
        empresasData,
        entidadesData,
        estadosData,
        tiposAlmacenamientoData,
        paisesData,
        marcasData,
        unidadMetricaDefaultData,
      ] = await Promise.all([
        getFamiliasProducto(),
        getSubfamiliasProducto(),
        getUnidadesMedida(),
        getUnidadesMedidaMetricas(),
        getTiposMaterial(),
        getColores(),
        getEmpresas(),
        getEntidadesComerciales(),
        getEstadosMultiFuncionParaProductos(),
        getTiposAlmacenamiento(),
        getPaises(),
        getMarcas(),
        getUnidadMetricaDefault(),
      ]);

      setFamilias(familiasData);
      setSubfamilias(subfamiliasData);
      setUnidadesMedida(unidadesData);
      setUnidadesMetricas(unidadesMetricasData);
      setTiposMaterial(tiposMaterialData);
      setColores(coloresData);
      setEmpresas(empresasData);
      setClientes(entidadesData.filter((e) => e.esCliente === true));
      setEstadosIniciales(estadosData);
      setTiposAlmacenamiento(tiposAlmacenamientoData);
      setPaises(paisesData);
      setMarcas(marcasData);
      setUnidadMetricaDefault(unidadMetricaDefaultData);
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
      const [familiasData, tiposAlmacenamientoData, unidadesMedidaData] =
        await Promise.all([
          getFamiliasProducto(),
          getTiposAlmacenamiento(),
          getUnidadesMedida(),
        ]);

      setFamilias(familiasData);
      setTiposAlmacenamiento(tiposAlmacenamientoData);
      setUnidadesMedida(unidadesMedidaData);
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
        (p) => Number(p.tipoAlmacenamientoId) === Number(selectedTipoAlmacenamiento.id)
      );
    }

    if (selectedUnidadMedida) {
      resultado = resultado.filter(
        (p) => Number(p.unidadMedidaId) === Number(selectedUnidadMedida.id)
      );
    }

    // Búsqueda global
    if (globalFilterValue) {
      const busqueda = globalFilterValue.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          (p.codigo && p.codigo.toLowerCase().includes(busqueda)) ||
          (p.descripcionBase && p.descripcionBase.toLowerCase().includes(busqueda)) ||
          (p.familia?.nombre && p.familia.nombre.toLowerCase().includes(busqueda))
      );
    }

    setProductosFiltrados(resultado);
  };

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
    selectedTipoAlmacenamiento,
    selectedUnidadMedida,
    globalFilterValue,
  ]);

  useEffect(() => {
    const cargarSubfamilias = async () => {
      if (selectedFamilia) {
        try {
          const subfamiliasData = await getSubfamiliasProducto(
            selectedFamilia.id
          );
          setSubfamilias(subfamiliasData);
        } catch (error) {
          console.error("Error cargando subfamilias:", error);
        }
      } else {
        setSubfamilias([]);
        setSelectedSubfamilia(null);
      }
    };

    cargarSubfamilias();
  }, [selectedFamilia]);

  useEffect(() => {
    const cargarClientes = async () => {
      if (selectedEmpresa) {
        try {
          const clientesData = await getEntidadesComerciales();
          setClientes(clientesData.filter((e) => e.esCliente === true));
        } catch (error) {
          console.error("Error cargando clientes:", error);
        }
      } else {
        setClientes([]);
        setSelectedCliente(null);
      }
    };

    cargarClientes();
  }, [selectedEmpresa]);

  const abrirDialogoNuevo = () => {
    setProductoSeleccionado(null);
    setDialogVisible(true);
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
    if (productoSeleccionado) {
      await actualizarProducto(productoSeleccionado.id, data);
    } else {
      await crearProducto(data);
    }
    cargarProductos();
    cerrarDialogo();
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail: productoSeleccionado
        ? "Producto actualizado correctamente"
        : "Producto creado correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (producto) => {
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
    aplicarFiltros();
  };

  const onClienteFilterChange = (e) => {
    setSelectedCliente(e.value);
    aplicarFiltros();
  };

  const onFamiliaFilterChange = (e) => {
    setSelectedFamilia(e.value);
    setSelectedSubfamilia(null);
    aplicarFiltros();
  };

  const onSubfamiliaFilterChange = (e) => {
    setSelectedSubfamilia(e.value);
    aplicarFiltros();
  };

  const onTipoAlmacenamientoFilterChange = (e) => {
    setSelectedTipoAlmacenamiento(e.value);
    aplicarFiltros();
  };

  const onUnidadMedidaFilterChange = (e) => {
    setSelectedUnidadMedida(e.value);
    aplicarFiltros();
  };

  const codigoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.codigo}
      </span>
    );
  };

  const descripcionTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "500" }}>{rowData.descripcionArmada}</span>
    );
  };

  const familiaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "400", color: "#6b7280" }}>
        {rowData.familia?.nombre}
      </span>
    );
  };

  const subfamiliaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "400", color: "#6b7280" }}>
        {rowData.subfamilia?.nombre}
      </span>
    );
  };

  const tipoAlmacenamientoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "400", color: "#6b7280" }}>
        {rowData.tipoAlmacenamiento?.nombre || "N/A"}
      </span>
    );
  };

  const unidadMedidaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "400" }}>
        {rowData.unidadMedida?.nombre || "N/A"}
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
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        {(usuario?.esSuperUsuario || usuario?.esAdmin) && (
          <Button
            icon="pi pi-trash"
            className="p-button-text p-button-danger"
            onClick={() => confirmarEliminacion(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const renderHeader = () => {
    // Deshabilitar el botón Nuevo hasta que se seleccione empresa y cliente
    const isNuevoDisabled = !selectedEmpresa || !selectedCliente;

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
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedEmpresa}
              options={empresas}
              optionLabel="razonSocial"
              placeholder="Empresa"
              showClear
              onChange={onEmpresaFilterChange}
              className="w-15rem"
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Dropdown
              value={selectedCliente}
              options={clientes}
              optionLabel="razonSocial"
              placeholder="Cliente"
              showClear
              onChange={onClienteFilterChange}
              className="w-15rem"
              disabled={!selectedEmpresa}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              className={
                isNuevoDisabled
                  ? "p-button-outlined p-button-sm"
                  : "p-button-primary p-button-sm"
              }
              onClick={abrirDialogoNuevo}
              disabled={isNuevoDisabled}
              tooltip={
                isNuevoDisabled
                  ? "Seleccione empresa y cliente para crear un nuevo producto"
                  : "Crear nuevo producto"
              }
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
        message={`¿Está seguro de eliminar el producto "${
          productoAEliminar?.descripcionBase || ""
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
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        loading={loading}
        header={renderHeader()}
        emptyMessage="No se encontraron productos"
        className="p-datatable-sm p-datatable-hover"
        onRowClick={(e) => abrirDialogoEdicion(e.data)}
        selectionMode="single"
        scrollable
        scrollHeight="flex"
        resizableColumns
        showGridlines
        stripedRows
        size="small"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ width: "80px" }} />
        <Column
          field="codigo"
          header="Código"
          sortable
          body={codigoTemplate}
          style={{ minWidth: "80px" }}
        />
        <Column
          field="descripcionArmada"
          header="Descripción"
          sortable
          body={descripcionTemplate}
          style={{ minWidth: "250px" }}
        />
        <Column
          field="familia.nombre"
          header="Familia"
          sortable
          body={familiaTemplate}
          style={{ minWidth: "150px" }}
        />
        <Column
          field="subfamilia.nombre"
          header="Subfamilia"
          sortable
          body={subfamiliaTemplate}
          style={{ minWidth: "150px" }}
        />
        <Column
          field="tipoAlmacenamiento.nombre"
          header="Almacenamiento"
          sortable
          body={tipoAlmacenamientoTemplate}
          style={{ minWidth: "80px" }}
        />
        <Column
          field="unidadMedida.nombre"
          header="Unidad Medida"
          sortable
          body={unidadMedidaTemplate}
          style={{ minWidth: "120px" }}
        />
        <Column
          body={accionesTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        visible={dialogVisible}
        style={{ width: "80vw", maxWidth: "1200px" }}
        header={
          productoSeleccionado
            ? `Editar Producto - ID: ${productoSeleccionado.id}`
            : "Nuevo Producto"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
      >
        <ProductoForm
          producto={productoSeleccionado}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          modoEdicion={!!productoSeleccionado}
          loading={loading}
          setLoading={setLoading}
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
          unidadMetricaDefault={unidadMetricaDefault}
        />
      </Dialog>
    </div>
  );
};

export default Producto;
