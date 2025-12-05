// src/components/common/ConsultaStockForm.jsx
// Componente independiente para consulta de stock con dos tabs
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { getSaldosProductoCliente } from "../../api/saldosProductoCliente";
import { getSaldosDetProductoCliente } from "../../api/saldosDetProductoCliente";
import { getEmpresas } from "../../api/empresa";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getResponsiveFontSize } from "../../utils/utils";
import KardexProductoDialog from "../movimientoAlmacen/KardexProductoDialog";

/**
 * Componente independiente para consulta de stock
 * Puede ser llamado desde cualquier módulo del sistema
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Función para cerrar el diálogo
 * @param {number} empresaIdInicial - ID de empresa seleccionada por defecto
 */
export default function ConsultaStockForm({
  visible,
  onHide,
  empresaIdInicial,
}) {
  const toast = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Datos para filtros
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Filtros Tab 1 - Saldos Generales
  const [filtroEmpresa1, setFiltroEmpresa1] = useState(
    empresaIdInicial || null
  );
  const [filtroCliente1, setFiltroCliente1] = useState(null);
  const [filtroAlmacen1, setFiltroAlmacen1] = useState(null);
  const [filtroCustodia1, setFiltroCustodia1] = useState(false);

  // Filtros Tab 2 - Saldos Detallados
  const [filtroEmpresa2, setFiltroEmpresa2] = useState(
    empresaIdInicial || null
  );
  const [filtroCliente2, setFiltroCliente2] = useState(null);
  const [filtroAlmacen2, setFiltroAlmacen2] = useState(null);
  const [filtroCustodia2, setFiltroCustodia2] = useState(false);

  // Datos de las tablas
  const [saldosGenerales, setSaldosGenerales] = useState([]);
  const [saldosDetallados, setSaldosDetallados] = useState([]);

  // Datos filtrados
  const [saldosGeneralesFiltrados, setSaldosGeneralesFiltrados] = useState([]);
  const [saldosDetalladosFiltrados, setSaldosDetalladosFiltrados] = useState([]);

  // Almacenes dinámicos
  const [almacenesDisponibles1, setAlmacenesDisponibles1] = useState([]);
  const [almacenesDisponibles2, setAlmacenesDisponibles2] = useState([]);

  // Estados para Kardex
  const [showKardex, setShowKardex] = useState(false);
  const [kardexData, setKardexData] = useState({
    empresaId: null,
    almacenId: null,
    productoId: null,
    esCustodia: false,
    clienteId: null,
    productoNombre: "",
  });

  useEffect(() => {
    if (visible) {
      cargarDatosIniciales();
    }
  }, [visible]);

  useEffect(() => {
    if (empresaIdInicial) {
      setFiltroEmpresa1(empresaIdInicial);
      setFiltroEmpresa2(empresaIdInicial);
    }
  }, [empresaIdInicial]);

  useEffect(() => {
    if (filtroEmpresa1) {
      cargarSaldosGenerales();
    }
  }, [filtroEmpresa1]);

  useEffect(() => {
    if (filtroEmpresa2) {
      cargarSaldosDetallados();
    }
  }, [filtroEmpresa2]);

  const cargarDatosIniciales = async () => {
    try {
      const [empresasData, clientesData] = await Promise.all([
        getEmpresas(),
        getEntidadesComerciales(),
      ]);
      setEmpresas(empresasData);
      setClientes(clientesData);

      // Cargar datos iniciales si hay empresa seleccionada
      if (empresaIdInicial) {
        await Promise.all([cargarSaldosGenerales(), cargarSaldosDetallados()]);
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos iniciales",
      });
    }
  };

  const cargarSaldosGenerales = async () => {
    if (!filtroEmpresa1) return;

    setLoading(true);
    try {
      const params = {
        empresaId: filtroEmpresa1,
        custodia: filtroCustodia1,
      };
      if (filtroCliente1) {
        params.clienteId = filtroCliente1;
      }
      const data = await getSaldosProductoCliente(params);
      setSaldosGenerales(data);

      // Extraer almacenes únicos
      const almacenesUnicos = [];
      const idsVistos = new Set();
      data.forEach((item) => {
        if (item.almacenId && !idsVistos.has(Number(item.almacenId))) {
          idsVistos.add(Number(item.almacenId));
          almacenesUnicos.push({
            id: item.almacenId,
            descripcion:
              item.almacen?.nombre ||
              `Almacén ${item.almacenId}`,
          });
        }
      });
      setAlmacenesDisponibles1(
        almacenesUnicos.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      );

      // Aplicar filtro inicial
      aplicarFiltroLocal1(data, filtroAlmacen1);
    } catch (error) {
      console.error("Error al cargar saldos generales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los saldos generales",
      });
    }
    setLoading(false);
  };

  const cargarSaldosDetallados = async () => {
    if (!filtroEmpresa2) return;

    setLoading(true);
    try {
      const params = {
        empresaId: filtroEmpresa2,
        esCustodia: filtroCustodia2,
      };
      if (filtroCliente2) {
        params.clienteId = filtroCliente2;
      }
      const data = await getSaldosDetProductoCliente(params);
      setSaldosDetallados(data);

      // Extraer almacenes únicos
      const almacenesUnicos = [];
      const idsVistos = new Set();
      data.forEach((item) => {
        if (item.almacenId && !idsVistos.has(Number(item.almacenId))) {
          idsVistos.add(Number(item.almacenId));
          almacenesUnicos.push({
            id: item.almacenId,
            descripcion:
              item.almacen?.nombre ||
              `Almacén ${item.almacenId}`,
          });
        }
      });
      setAlmacenesDisponibles2(
        almacenesUnicos.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
      );

      // Aplicar filtro inicial
      aplicarFiltroLocal2(data, filtroAlmacen2);
    } catch (error) {
      console.error("Error al cargar saldos detallados:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los saldos detallados",
      });
    }
    setLoading(false);
  };

  const aplicarFiltroLocal1 = (datos, almacenId) => {
    if (!almacenId) {
      setSaldosGeneralesFiltrados(datos);
    } else {
      const filtrados = datos.filter(
        (item) => Number(item.almacenId) === Number(almacenId)
      );
      setSaldosGeneralesFiltrados(filtrados);
    }
  };

  const aplicarFiltroLocal2 = (datos, almacenId) => {
    if (!almacenId) {
      setSaldosDetalladosFiltrados(datos);
    } else {
      const filtrados = datos.filter(
        (item) => Number(item.almacenId) === Number(almacenId)
      );
      setSaldosDetalladosFiltrados(filtrados);
    }
  };

  const limpiarFiltros1 = () => {
    setFiltroCliente1(null);
    setFiltroAlmacen1(null);
    setFiltroCustodia1(false);
    setSaldosGeneralesFiltrados(saldosGenerales);
  };

  const limpiarFiltros2 = () => {
    setFiltroCliente2(null);
    setFiltroAlmacen2(null);
    setFiltroCustodia2(false);
    setSaldosDetalladosFiltrados(saldosDetallados);
  };

  // Función para abrir el Kardex desde Saldos Generales
  const handleRowClickGenerales = (e) => {
    const rowData = e.data;
    setKardexData({
      empresaId: rowData.empresaId,
      almacenId: rowData.almacenId,
      productoId: rowData.productoId,
      esCustodia: rowData.custodia || false,
      clienteId: rowData.clienteId || null,
      productoNombre:
        rowData.producto?.descripcionArmada ||
        rowData.producto?.descripcion ||
        "Producto",
    });
    setShowKardex(true);
  };

  // Función para abrir el Kardex desde Saldos Detallados
  const handleRowClickDetallados = (e) => {
    const rowData = e.data;
    setKardexData({
      empresaId: rowData.empresaId,
      almacenId: rowData.almacenId,
      productoId: rowData.productoId,
      esCustodia: rowData.esCustodia || false,
      clienteId: rowData.clienteId || null,
      productoNombre:
        rowData.producto?.descripcionArmada ||
        rowData.producto?.descripcion ||
        "Producto",
    });
    setShowKardex(true);
  };

  // Templates para columnas - Acceso directo a las propiedades de las relaciones
  const empresaTemplate = (rowData) => {
    // Intentar diferentes formas de acceder a la empresa
    return (
      rowData.empresa?.razonSocial ||
      rowData.Empresa?.razonSocial ||
      rowData.empresaId ||
      "-"
    );
  };

  const clienteTemplate = (rowData) => {
    return (
      rowData.cliente?.razonSocial ||
      rowData.Cliente?.razonSocial ||
      rowData.clienteId ||
      "-"
    );
  };

  const almacenTemplate = (rowData) => {
    return (
      rowData.almacen?.nombre ||
      rowData.Almacen?.nombre ||
      rowData.almacenId ||
      "-"
    );
  };

  const productoTemplate = (rowData) => {
    return (
      rowData.producto?.descripcionArmada ||
      rowData.producto?.descripcion ||
      rowData.producto?.nombre ||
      rowData.Producto?.descripcionArmada ||
      rowData.Producto?.descripcion ||
      rowData.Producto?.nombre ||
      rowData.productoId ||
      "-"
    );
  };

  const unidadMedidaTemplate = (rowData) => {
    return (
      rowData.producto?.unidadMedida?.abreviatura ||
      rowData.producto?.unidadMedida?.simbolo ||
      rowData.Producto?.unidadMedida?.abreviatura ||
      rowData.Producto?.unidadMedida?.simbolo ||
      rowData.producto?.UnidadMedida?.abreviatura ||
      "-"
    );
  };

  const decimalTemplate = (rowData, field) => {
    const valor = Number(rowData[field]) || 0;
    return valor.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fechaTemplate = (rowData, field) => {
    return rowData[field]
      ? new Date(rowData[field]).toLocaleDateString("es-PE")
      : "-";
  };

  const estadoTemplate = (rowData) => rowData.estado?.descripcion || "-";
  const estadoCalidadTemplate = (rowData) =>
    rowData.estadoCalidad?.descripcion || "-";

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Consulta de Stock"
        style={{ width: "95vw", maxWidth: "1400px" }}
        maximizable
        modal
      >
        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          {/* TAB 1: SALDOS GENERALES */}
          <TabPanel header="Saldos Generales">
            <div className="p-fluid">
              {/* Filtros */}

              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 3 }}>
                  <label htmlFor="empresa1">Empresa*</label>
                  <Dropdown
                    id="empresa1"
                    value={filtroEmpresa1}
                    options={empresas.map((e) => ({
                      label: e.razonSocial,
                      value: Number(e.id),
                    }))}
                    onChange={(e) => setFiltroEmpresa1(e.value)}
                    placeholder="Seleccionar empresa"
                    optionLabel="label"
                    optionValue="value"
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 3 }}>
                  <label htmlFor="cliente1">Cliente</label>
                  <Dropdown
                    id="cliente1"
                    value={filtroCliente1}
                    options={clientes.map((c) => ({
                      label: c.razonSocial,
                      value: Number(c.id),
                    }))}
                    onChange={(e) => setFiltroCliente1(e.value)}
                    placeholder="Todos los clientes"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="almacen1">Almacén</label>
                  <Dropdown
                    id="almacen1"
                    value={filtroAlmacen1}
                    options={almacenesDisponibles1.map((a) => ({
                      label: a.descripcion,
                      value: Number(a.id),
                    }))}
                    onChange={(e) => {
                      setFiltroAlmacen1(e.value);
                      aplicarFiltroLocal1(saldosGenerales, e.value);
                    }}
                    placeholder="Todos los almacenes"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="custodia1">Mercadería</label>
                  <Button
                    label={filtroCustodia1 ? "EN CUSTODIA" : "PROPIA"}
                    icon={filtroCustodia1 ? "pi pi-users" : "pi pi-home"}
                    className={
                      filtroCustodia1 ? "p-button-warning" : "p-button-success"
                    }
                    onClick={() => setFiltroCustodia1(!filtroCustodia1)}
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Actualizar"
                    icon="pi pi-refresh"
                    onClick={cargarSaldosGenerales}
                    disabled={loading || !filtroEmpresa1}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-times"
                    className="p-button-secondary"
                    onClick={limpiarFiltros1}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tabla de Saldos Generales */}
              <DataTable
                value={saldosGeneralesFiltrados}
                loading={loading}
                paginator
                rows={20}
                dataKey="id"
                style={{ fontSize: getResponsiveFontSize() }}
                emptyMessage="No hay datos para mostrar"
                onRowClick={handleRowClickGenerales}
                selectionMode="single"
                rowClassName={() => "cursor-pointer"}
              >
                <Column
                  field="empresa"
                  header="Empresa"
                  body={empresaTemplate}
                  sortable
                />
                <Column
                  field="cliente"
                  header="Cliente"
                  body={clienteTemplate}
                  sortable
                />
                <Column
                  field="almacen"
                  header="Almacén"
                  body={almacenTemplate}
                  sortable
                />
                <Column
                  field="producto"
                  header="Producto"
                  body={productoTemplate}
                  sortable
                />
                <Column
                  field="unidadMedida"
                  header="U.M."
                  body={unidadMedidaTemplate}
                />
                <Column
                  field="saldoCantidad"
                  header="Saldo Cantidad"
                  body={(rowData) => decimalTemplate(rowData, "saldoCantidad")}
                  sortable
                  style={{ textAlign: "right" }}
                />
                <Column
                  field="costoUnitarioPromedio"
                  header="Costo Unit. Promedio"
                  body={(rowData) =>
                    decimalTemplate(rowData, "costoUnitarioPromedio")
                  }
                  sortable
                  style={{ textAlign: "right" }}
                />
                <Column
                  field="costoTotalPromedio"
                  header="Costo Total Promedio"
                  body={(rowData) => {
                    const cantidad = Number(rowData.saldoCantidad) || 0;
                    const costoUnit =
                      Number(rowData.costoUnitarioPromedio) || 0;
                    const total = cantidad * costoUnit;
                    return total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                  }}
                  sortable
                  style={{ textAlign: "right" }}
                />
                <Column
                  field="saldoPeso"
                  header="Saldo Peso"
                  body={(rowData) => decimalTemplate(rowData, "saldoPeso")}
                  sortable
                  style={{ textAlign: "right" }}
                />
              </DataTable>
            </div>
          </TabPanel>

          {/* TAB 2: SALDOS DETALLADOS */}
          <TabPanel header="Saldos Detallados">
            <div className="p-fluid">
              {/* Filtros */}
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 3 }}>
                  <label htmlFor="empresa2">Empresa*</label>
                  <Dropdown
                    id="empresa2"
                    value={filtroEmpresa2}
                    options={empresas.map((e) => ({
                      label: e.razonSocial,
                      value: Number(e.id),
                    }))}
                    onChange={(e) => setFiltroEmpresa2(e.value)}
                    placeholder="Seleccionar empresa"
                    optionLabel="label"
                    optionValue="value"
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 3 }}>
                  <label htmlFor="cliente2">Cliente</label>
                  <Dropdown
                    id="cliente2"
                    value={filtroCliente2}
                    options={clientes.map((c) => ({
                      label: c.razonSocial,
                      value: Number(c.id),
                    }))}
                    onChange={(e) => setFiltroCliente2(e.value)}
                    placeholder="Todos los clientes"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label htmlFor="almacen2">Almacén</label>
                  <Dropdown
                    id="almacen2"
                    value={filtroAlmacen2}
                    options={almacenesDisponibles2.map((a) => ({
                      label: a.descripcion,
                      value: Number(a.id),
                    }))}
                    onChange={(e) => {
                      setFiltroAlmacen2(e.value);
                      aplicarFiltroLocal2(saldosDetallados, e.value);
                    }}
                    placeholder="Todos los almacenes"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="custodia2">Mercadería</label>
                  <Button
                    label={filtroCustodia2 ? "EN CUSTODIA" : "PROPIA"}
                    icon={filtroCustodia2 ? "pi pi-users" : "pi pi-home"}
                    className={
                      filtroCustodia2 ? "p-button-warning" : "p-button-success"
                    }
                    onClick={() => setFiltroCustodia2(!filtroCustodia2)}
                    disabled={loading}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Actualizar"
                    icon="pi pi-refresh"
                    onClick={cargarSaldosDetallados}
                    disabled={loading || !filtroEmpresa2}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-times"
                    className="p-button-secondary"
                    onClick={limpiarFiltros2}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tabla de Saldos Detallados */}
              <DataTable
                value={saldosDetalladosFiltrados}
                loading={loading}
                paginator
                rows={20}
                dataKey="id"
                style={{ fontSize: getResponsiveFontSize() }}
                emptyMessage="No hay datos para mostrar"
                scrollable
                scrollHeight="500px"
                onRowClick={handleRowClickDetallados}
                selectionMode="single"
                rowClassName={() => "cursor-pointer"}
              >
                <Column
                  field="empresa"
                  header="Empresa"
                  body={empresaTemplate}
                  sortable
                  frozen
                />
                <Column
                  field="cliente"
                  header="Cliente"
                  body={clienteTemplate}
                  sortable
                />
                <Column
                  field="almacen"
                  header="Almacén"
                  body={almacenTemplate}
                  sortable
                />
                <Column
                  field="producto"
                  header="Producto"
                  body={productoTemplate}
                  sortable
                  style={{ minWidth: "200px" }}
                />
                <Column
                  field="unidadMedida"
                  header="U.M."
                  body={unidadMedidaTemplate}
                />
                <Column field="lote" header="Lote" sortable />
                <Column
                  field="fechaVencimiento"
                  header="F. Vencimiento"
                  body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
                  sortable
                />
                <Column
                  field="fechaProduccion"
                  header="F. Producción"
                  body={(rowData) => fechaTemplate(rowData, "fechaProduccion")}
                  sortable
                />
                <Column
                  field="fechaIngreso"
                  header="F. Ingreso"
                  body={(rowData) => fechaTemplate(rowData, "fechaIngreso")}
                  sortable
                />
                <Column field="numContenedor" header="Contenedor" sortable />
                <Column field="nroSerie" header="Nº Serie" sortable />
                <Column
                  field="estado"
                  header="Estado"
                  body={estadoTemplate}
                  sortable
                />
                <Column
                  field="estadoCalidad"
                  header="Estado Calidad"
                  body={estadoCalidadTemplate}
                  sortable
                />
                <Column
                  field="saldoCantidad"
                  header="Saldo Cantidad"
                  body={(rowData) => decimalTemplate(rowData, "saldoCantidad")}
                  sortable
                  style={{ textAlign: "right" }}
                />
                <Column
                  field="saldoPeso"
                  header="Saldo Peso"
                  body={(rowData) => decimalTemplate(rowData, "saldoPeso")}
                  sortable
                  style={{ textAlign: "right" }}
                />
              </DataTable>
            </div>
          </TabPanel>
        </TabView>
      </Dialog>

      {/* Diálogo de Kardex */}
      <KardexProductoDialog
        visible={showKardex}
        onHide={() => setShowKardex(false)}
        empresaId={kardexData.empresaId}
        almacenId={kardexData.almacenId}
        productoId={kardexData.productoId}
        esCustodia={kardexData.esCustodia}
        clienteId={kardexData.clienteId}
        productoNombre={kardexData.productoNombre}
      />
    </>
  );
}