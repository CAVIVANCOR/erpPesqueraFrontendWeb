// src/pages/RendicionGastos/RendicionGastosList.jsx
// Página principal del módulo de Rendición de Gastos
import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import DetMovsRendicionGastosForm from "../../components/rendicionGastos/DetMovsRendicionGastosForm";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import {
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getAllDetMovsEntregaRendir } from "../../api/detMovsEntregaRendir";
import { getPersonal } from "../../api/personal";
import { getCentrosCosto } from "../../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../../api/tipoMovEntregaRendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getMonedas } from "../../api/moneda";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getProductos } from "../../api/producto";
import { getAllCategoriaTipoMovEntregaRendir } from "../../api/categoriaTipoMovEntregaRendir";

export default function RendicionGastosList({ ruta }) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);

  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);

  // Estados locales para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroEntregaARendir, setFiltroEntregaARendir] = useState(null);
  const [filtroCategoriaMovimiento, setFiltroCategoriaMovimiento] =
    useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] =
    useState(null);
  const [filtroAsignacionSeleccionada, setFiltroAsignacionSeleccionada] =
    useState(null);

  // Estados para el dialog
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [saldosARendir, setSaldosARendir] = useState({});
  const [calculandoSaldos, setCalculandoSaldos] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        movimientosData,
        personalData,
        centrosCostoData,
        tiposMovimientoData,
        categoriasData,
        entidadesComercialesData,
        monedasData,
        tiposDocumentoData,
        productosData,
      ] = await Promise.all([
        getAllDetMovsEntregaRendir(),
        getPersonal(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getAllCategoriaTipoMovEntregaRendir(),
        getEntidadesComerciales(),
        getMonedas(),
        getTiposDocumento(),
        getProductos(),
      ]);

      setMovimientos(movimientosData || []);
      setPersonal(personalData || []);
      setCentrosCosto(centrosCostoData || []);
      setTiposMovimiento(tiposMovimientoData || []);
      setCategorias(categoriasData || []);
      setEntidadesComerciales(entidadesComercialesData || []);
      setMonedas(monedasData || []);
      setTiposDocumento(tiposDocumentoData || []);
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del módulo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular saldos A Rendir
  useEffect(() => {
    const calcularSaldos = () => {
      setCalculandoSaldos(true);
      const nuevosSaldos = {};

      const asignacionesOrigen = movimientos.filter(
        (mov) =>
          mov.formaParteCalculoEntregaARendir === true &&
          (mov.asignacionOrigenId === null ||
            mov.asignacionOrigenId === undefined ||
            Number(mov.asignacionOrigenId) === 0),
      );

      for (const asignacion of asignacionesOrigen) {
        const gastosAsociados = movimientos.filter(
          (mov) =>
            mov.asignacionOrigenId &&
            Number(mov.asignacionOrigenId) === Number(asignacion.id),
        );

        const totalGastos = gastosAsociados.reduce(
          (sum, gasto) => sum + Number(gasto.monto || 0),
          0,
        );

        const saldo = Number(asignacion.monto || 0) - totalGastos;
        nuevosSaldos[asignacion.id] = saldo;
      }

      setSaldosARendir(nuevosSaldos);
      setCalculandoSaldos(false);
    };

    if (movimientos && movimientos.length > 0) {
      calcularSaldos();
    } else {
      setSaldosARendir({});
      setCalculandoSaldos(false);
    }
  }, [movimientos]);

  // Filtrar movimientos que son asignaciones
  const movimientosAsignacionEntregaRendir = (movimientos || []).filter(
    (mov) =>
      mov.formaParteCalculoEntregaARendir === true &&
      (mov.asignacionOrigenId === null ||
        mov.asignacionOrigenId === undefined ||
        Number(mov.asignacionOrigenId) === 0) &&
      (!editingMovimiento || Number(mov.id) !== Number(editingMovimiento.id)),
  );

  // Función para obtener movimientos filtrados
  const obtenerMovimientosFiltrados = () => {
    let movimientosFiltrados = [...movimientos];

    if (filtroTipoMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.tipoMovimientoId) === Number(filtroTipoMovimiento),
      );
    }

    if (filtroCentroCosto) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => Number(mov.centroCostoId) === Number(filtroCentroCosto),
      );
    }

    if (filtroEntregaARendir !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.formaParteCalculoEntregaARendir === filtroEntregaARendir,
      );
    }

    if (filtroCategoriaMovimiento) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        const categoriaId =
          mov.tipoMovimiento?.categoria?.id || mov.tipoMovimiento?.categoriaId;
        return (
          categoriaId &&
          Number(categoriaId) === Number(filtroCategoriaMovimiento)
        );
      });
    }

    if (filtroValidacionTesoreria !== null) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) => mov.validadoTesoreria === filtroValidacionTesoreria,
      );
    }

    if (filtroAsignacionSeleccionada) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => {
        if (Number(mov.id) === Number(filtroAsignacionSeleccionada)) {
          return true;
        }
        if (
          mov.asignacionOrigenId &&
          Number(mov.asignacionOrigenId) ===
            Number(filtroAsignacionSeleccionada)
        ) {
          return true;
        }
        return false;
      });

      movimientosFiltrados.sort((a, b) => {
        if (Number(a.id) === Number(filtroAsignacionSeleccionada)) return -1;
        if (Number(b.id) === Number(filtroAsignacionSeleccionada)) return 1;
        return new Date(a.fechaMovimiento) - new Date(b.fechaMovimiento);
      });
    }

    return movimientosFiltrados;
  };

  // Funciones para filtros
  const limpiarFiltros = () => {
    setFiltroTipoMovimiento(null);
    setFiltroCentroCosto(null);
    setFiltroEntregaARendir(null);
    setFiltroCategoriaMovimiento(null);
    setFiltroValidacionTesoreria(null);
    setFiltroAsignacionSeleccionada(null);
  };

  const alternarFiltroEntregaARendir = () => {
    if (filtroEntregaARendir === null) {
      setFiltroEntregaARendir(true);
    } else if (filtroEntregaARendir === true) {
      setFiltroEntregaARendir(false);
    } else {
      setFiltroEntregaARendir(null);
    }
  };

  const alternarFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      setFiltroValidacionTesoreria(true);
    } else if (filtroValidacionTesoreria === true) {
      setFiltroValidacionTesoreria(false);
    } else {
      setFiltroValidacionTesoreria(null);
    }
  };

  const alternarFiltroGastosARendir = () => {
    if (filtroCategoriaMovimiento === 17) {
      setFiltroCategoriaMovimiento(null);
    } else {
      setFiltroCategoriaMovimiento(17);
    }
  };

  const obtenerPropiedadesFiltroEntregaARendir = () => {
    if (filtroEntregaARendir === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroEntregaARendir === true) {
      return { label: "Sí", severity: "success" };
    } else {
      return { label: "No", severity: "secondary" };
    }
  };

  const obtenerPropiedadesFiltroValidacionTesoreria = () => {
    if (filtroValidacionTesoreria === null) {
      return { label: "Todos", severity: "info" };
    } else if (filtroValidacionTesoreria === true) {
      return { label: "Validados", severity: "success" };
    } else {
      return { label: "Pendientes", severity: "danger" };
    }
  };

  const obtenerPropiedadesFiltroGastosARendir = () => {
    if (filtroCategoriaMovimiento === 17) {
      return { label: "Gastos a Rendir", severity: "success" };
    } else {
      return { label: "Todos los Gastos", severity: "secondary" };
    }
  };

  // Obtener asignaciones para el dropdown
  const obtenerAsignaciones = () => {
    return movimientos
      .filter((mov) => {
        const categoriaId =
          mov.tipoMovimiento?.categoria?.id || mov.tipoMovimiento?.categoriaId;
        return (
          categoriaId &&
          Number(categoriaId) === 17 &&
          (mov.asignacionOrigenId === null ||
            mov.asignacionOrigenId === undefined ||
            Number(mov.asignacionOrigenId) === 0)
        );
      })
      .map((asignacion) => {
        const moneda = monedas.find(
          (m) => Number(m.id) === Number(asignacion.monedaId),
        );
        return {
          value: Number(asignacion.id),
          label: `ID: ${asignacion.id} | ${asignacion.descripcion || "Sin descripción"} | ${moneda?.simbolo || ""} ${formatearNumero(asignacion.monto, 2)}`,
          id: asignacion.id,
          descripcion: asignacion.descripcion,
          monto: asignacion.monto,
          moneda: moneda,
        };
      });
  };

  // Handlers internos
  const handleNuevoMovimiento = () => {
    setEditingMovimiento(null);
    setShowMovimientoForm(true);
  };

  const handleEditarMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setShowMovimientoForm(true);
  };

  const handleGuardarMovimiento = async (data) => {
    try {
      if (editingMovimiento) {
        await actualizarDetMovsEntregaRendir(editingMovimiento.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado correctamente",
          life: 3000,
        });
        cargarDatos();
        return;
      } else {
        const movimientoCreado = await crearDetMovsEntregaRendir(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado correctamente",
          life: 3000,
        });
        setEditingMovimiento(movimientoCreado);
        cargarDatos();
        return;
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar movimiento",
        life: 3000,
      });
    }
  };

  const handleEliminarMovimiento = (movimiento) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el movimiento del ${new Date(
        movimiento.fechaMovimiento,
      ).toLocaleDateString()}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await eliminarDetMovsEntregaRendir(movimiento.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento eliminado correctamente",
            life: 3000,
          });
          cargarDatos();
        } catch (error) {
          console.error("Error al eliminar movimiento:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al eliminar movimiento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleSelectionChange = (e) => {
    setSelectedMovimientos(e.value);
  };

  // Templates para las columnas
  const fechaMovimientoTemplate = (rowData) => {
    return new Date(rowData.fechaMovimiento).toLocaleDateString("es-PE");
  };

  const montoTemplate = (rowData) => {
    const moneda = monedas.find(
      (m) => Number(m.id) === Number(rowData.monedaId),
    );

    const codigoMoneda = moneda?.codigoSunat || "PEN";
    let backgroundColor = "#fff9c4";
    if (codigoMoneda === "USD") {
      backgroundColor = "#c8e6c9";
    } else if (codigoMoneda !== "PEN") {
      backgroundColor = "#b3e5fc";
    }

    const montoFormateado = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: codigoMoneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rowData.monto);

    return (
      <div
        style={{
          backgroundColor: backgroundColor,
          padding: "4px 8px",
          borderRadius: "4px",
          fontWeight: "bold",
          textAlign: "right",
        }}
      >
        {montoFormateado}
      </div>
    );
  };

  const descripcionTemplate = (rowData) => {
    return rowData.descripcion || "N/A";
  };

  const tipoMovimientoTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId),
    );
    return tipo ? tipo.nombre : "N/A";
  };

  const entregaARendirTagTemplate = (rowData) => {
    return (
      <div className="text-center">
        {rowData.formaParteCalculoEntregaARendir ? (
          <Badge value="SÍ" severity="success" />
        ) : (
          <Badge value="NO" severity="secondary" />
        )}
      </div>
    );
  };

  const categoriaTemplate = (rowData) => {
    const tipo = tiposMovimiento.find(
      (t) => Number(t.id) === Number(rowData.tipoMovimientoId),
    );
    return tipo?.categoria?.nombre || "N/A";
  };

  const asignacionOrigenTemplate = (rowData) => {
    return rowData.asignacionOrigenId || "0";
  };

  const aRendirTemplate = (rowData) => {
    const esAsignacionOrigen =
      rowData.formaParteCalculoEntregaARendir === true &&
      (rowData.asignacionOrigenId === null ||
        rowData.asignacionOrigenId === undefined ||
        Number(rowData.asignacionOrigenId) === 0);

    if (!esAsignacionOrigen) {
      return "N/A";
    }

    if (calculandoSaldos) {
      return (
        <div style={{ textAlign: "right", fontStyle: "italic" }}>
          Calculando...
        </div>
      );
    }

    const saldo = saldosARendir[rowData.id] ?? 0;
    return (
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          color: saldo < 0 ? "red" : saldo === 0 ? "orange" : "green",
        }}
      >
        {rowData.moneda?.simbolo || ""} {formatearNumero(saldo, 2)}
      </div>
    );
  };

  const centroCostoTemplate = (rowData) => {
    const centro = centrosCosto.find(
      (c) => Number(c.id) === Number(rowData.centroCostoId),
    );
    return centro ? centro.Codigo + " - " + centro.Nombre : "N/A";
  };

  const entidadComercialTemplate = (rowData) => {
    if (!rowData.entidadComercialId) return "N/A";

    const entidad = entidadesComerciales.find(
      (e) => Number(e.id) === Number(rowData.entidadComercialId),
    );
    return entidad ? entidad.razonSocial : "N/A";
  };

  const gastoPlanificadoTemplate = (rowData) => {
    if (!rowData.enlaceGastoPlanificado) {
      return (
        <span style={{ color: "#999", fontStyle: "italic" }}>
          Sin gasto planificado
        </span>
      );
    }

    const descripcion =
      rowData.enlaceGastoPlanificado.producto?.descripcionArmada ||
      rowData.enlaceGastoPlanificado.producto?.nombre ||
      "N/A";

    return (
      <div style={{ fontSize: "0.85rem", color: "#666" }}>{descripcion}</div>
    );
  };

  const validacionTesoreriaTemplate = (rowData) => {
    return (
      <div className="text-center">
        <Badge
          value={rowData.validadoTesoreria ? "VALIDADO" : "PENDIENTE"}
          severity={rowData.validadoTesoreria ? "success" : "danger"}
        />
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm"
          onClick={() => handleEditarMovimiento(rowData)}
          aria-label="Editar"
          disabled={!permisos?.puedeEditar}
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para editar"
              : "Editar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger p-button-sm"
          onClick={() => handleEliminarMovimiento(rowData)}
          aria-label="Eliminar"
          disabled={!permisos?.puedeEditar}
          tooltip={
            !permisos?.puedeEditar
              ? "No tiene permisos para eliminar"
              : "Eliminar movimiento"
          }
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Toast ref={toast} />

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          border: "1px solid #dee2e6",
        }}
      >
        <h1
          style={{
            color: "#1E8449",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1.8rem",
          }}
        >
          <i className="pi pi-money-bill" style={{ fontSize: "1.8rem" }}></i>
          Rendición de Gastos
        </h1>
        <p style={{ margin: 0, color: "#6c757d" }}>
          Gestión de rendiciones de gastos y entregas a rendir
        </p>
      </div>

      <div className="mt-4">
        <DataTable
          key={`datatable-${Object.keys(saldosARendir).length}`}
          value={obtenerMovimientosFiltrados()}
          selection={selectedMovimientos}
          onSelectionChange={handleSelectionChange}
          selectionMode="single"
          onRowClick={(e) => handleEditarMovimiento(e.data)}
          dataKey="id"
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 40]}
          emptyMessage="No hay movimientos registrados"
          style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }}
          rowClassName={(rowData) =>
            rowData.formaParteCalculoEntregaARendir
              ? "p-selectable-row bg-green-50"
              : "p-selectable-row"
          }
          size="small"
          stripedRows
          showGridlines
          sortField="id"
          sortOrder={-1}
          header={
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "end",
                  marginTop: 18,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3>Detalle de Gastos</h3>
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    className="p-button-success"
                    severity="success"
                    onClick={handleNuevoMovimiento}
                    disabled={!permisos?.puedeCrear}
                    tooltip={
                      !permisos?.puedeCrear
                        ? "No tiene permisos para crear"
                        : "Crear nuevo movimiento"
                    }
                    tooltipOptions={{ position: "top" }}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Gastos a Rendir</label>
                  <Button
                    label={obtenerPropiedadesFiltroGastosARendir().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroGastosARendir}
                    severity={obtenerPropiedadesFiltroGastosARendir().severity}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Entrega a Rendir</label>
                  <Button
                    label={obtenerPropiedadesFiltroEntregaARendir().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroEntregaARendir}
                    severity={obtenerPropiedadesFiltroEntregaARendir().severity}
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <label htmlFor="">Validación Tesorería</label>
                  <Button
                    label={obtenerPropiedadesFiltroValidacionTesoreria().label}
                    icon="pi pi-filter"
                    onClick={alternarFiltroValidacionTesoreria}
                    severity={
                      obtenerPropiedadesFiltroValidacionTesoreria().severity
                    }
                    type="button"
                    raised
                  />
                </div>
                <div style={{ flex: 0.5 }}>
                  <Button
                    label="Limpiar"
                    icon="pi pi-filter-slash"
                    className="p-button-outlined"
                    onClick={limpiarFiltros}
                    type="button"
                    raised
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroAsignacionSeleccionada}
                    options={obtenerAsignaciones()}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar Asignación"
                    onChange={(e) => setFiltroAsignacionSeleccionada(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCategoriaMovimiento}
                    options={(() => {
                      const categoriasUnicas = tiposMovimiento
                        .filter((t) => t.categoria && t.categoria.tipo === true)
                        .map((t) => t.categoria)
                        .filter(
                          (cat, index, self) =>
                            index ===
                            self.findIndex(
                              (c) => String(c.id) === String(cat.id),
                            ),
                        );
                      return categoriasUnicas;
                    })()}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Categoría"
                    onChange={(e) => setFiltroCategoriaMovimiento(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroTipoMovimiento}
                    options={tiposMovimiento}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Filtrar por Tipo de Movimiento"
                    onChange={(e) => setFiltroTipoMovimiento(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    value={filtroCentroCosto}
                    options={centrosCosto.map((centro) => ({
                      ...centro,
                      displayLabel: centro.Codigo + " - " + centro.Nombre,
                    }))}
                    optionLabel="displayLabel"
                    optionValue="id"
                    placeholder="Filtrar por Centro de Costo"
                    onChange={(e) => setFiltroCentroCosto(e.value)}
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
              </div>
            </div>
          }
        >
          <Column
            selectionMode="single"
            headerStyle={{ width: "3rem" }}
          ></Column>
          <Column field="id" header="Id" sortable />
          <Column
            field="fechaMovimiento"
            header="Fecha"
            body={fechaMovimientoTemplate}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Categoría"
            body={categoriaTemplate}
            sortable
          />
          <Column
            field="tipoMovimientoId"
            header="Tipo"
            body={tipoMovimientoTemplate}
            sortable
          />
          <Column
            field="descripcion"
            header="Descripción"
            body={descripcionTemplate}
            sortable
          />
          <Column field="monto" header="Monto" body={montoTemplate} sortable />
          <Column
            field="validadoTesoreria"
            header="Validación Tesorería"
            body={validacionTesoreriaTemplate}
            sortable
          />
          <Column
            field="asignacionOrigenId"
            header="A/Origen"
            body={asignacionOrigenTemplate}
            sortable
          />
          <Column
            field="formaParteCalculoEntregaARendir"
            header="E/R"
            body={entregaARendirTagTemplate}
            sortable
            style={{ width: "50px", textAlign: "center" }}
          />
          <Column
            field="detalleGastosPlanificados"
            header="Gasto Planificado"
            body={gastoPlanificadoTemplate}
            sortable
          />
          <Column
            field="entidadComercialId"
            header="Entidad Comercial"
            body={entidadComercialTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            headerStyle={{ width: "8rem", textAlign: "center" }}
            bodyStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showMovimientoForm}
        style={{ width: "95vw" }}
        header={editingMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
        modal
        className="p-fluid"
        closable={false}
        maximizable
        maximized={true}
      >
        <DetMovsRendicionGastosForm
          movimiento={editingMovimiento}
          rendicionGastos={null}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          categorias={categorias}
          entidadesComerciales={entidadesComerciales}
          monedas={monedas}
          tiposDocumento={tiposDocumento}
          productos={productos}
          movimientosAsignacionEntregaRendir={
            movimientosAsignacionEntregaRendir
          }
          onGuardadoExitoso={handleGuardarMovimiento}
          onCancelar={() => {
            setShowMovimientoForm(false);
            setEditingMovimiento(null);
            cargarDatos();
          }}
          permisos={permisos}
        />
      </Dialog>
    </div>
  );
}
