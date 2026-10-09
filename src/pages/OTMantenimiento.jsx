/**
 * Pantalla CRUD profesional para OTMantenimiento (Órdenes de Trabajo de Mantenimiento)
 * Implementa el patrón estándar ERP Megui con DataTable, modal, confirmación y feedback.
 * Incluye edición por clic en fila y eliminación con control de roles.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";
import { Calendar } from "primereact/calendar";
import {
  getOrdenesTrabajoMantenimiento,
  crearOrdenTrabajo,
  actualizarOrdenTrabajo,
  eliminarOrdenTrabajo,
  getOrdenTrabajoPorId,
} from "../api/oTMantenimiento";
import { getEmpresas } from "../api/empresa";
import { getSedes } from "../api/sedes";
import { getActivos } from "../api/activo";
import { getTiposMantenimiento } from "../api/tipoMantenimiento";
import { getMotivosOrigenOT } from "../api/motivoOriginoOT";
import { getEstadosMultiFuncionPorTipoProviene } from "../api/estadoMultiFuncion";
import { getPersonal } from "../api/personal";
import { getContratistas } from "../api/contratista";
import { getProductos } from "../api/producto";
import { getAlmacenes } from "../api/almacen";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getSeriesDoc } from "../api/serieDoc";
import { getMonedas } from "../api/moneda";
import { getCentrosCosto } from "../api/centroCosto";
import { getAllTipoMovEntregaRendir } from "../api/tipoMovEntregaRendir";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import OTMantenimientoForm from "../components/oTMantenimiento/OTMantenimientoForm";
import { formatearFecha } from "../utils/utils";
import { getResponsiveFontSize } from "../utils/utils";
import EmpresaSelector from "../components/common/EmpresaSelector";

/**
 * Componente OTMantenimiento
 * Pantalla principal para gestión de órdenes de trabajo de mantenimiento
 */
const OTMantenimiento = ({ ruta }) => {
  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Estados del componente
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros específicos
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [empresaIdSelector, setEmpresaIdSelector] = useState(null);
  const [tipoMantenimientoFiltro, setTipoMantenimientoFiltro] = useState(null);
  const [motivoFiltro, setMotivoFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  // Filtros avanzados (temporales hasta aplicar)
  const [tipoMantenimientoFiltroTemp, setTipoMantenimientoFiltroTemp] =
    useState(null);
  const [motivoFiltroTemp, setMotivoFiltroTemp] = useState(null);
  const [estadoFiltroTemp, setEstadoFiltroTemp] = useState(null);
  const [rangoFechasFiltro, setRangoFechasFiltro] = useState(null);
  const [rangoFechasFiltroTemp, setRangoFechasFiltroTemp] = useState(null);
  const [contratistasFiltro, setContratistasFiltro] = useState([]);
  const [productosFiltro, setProductosFiltro] = useState([]);
  const [contratistasFiltroTemp, setContratistasFiltroTemp] = useState([]);
  const [productosFiltroTemp, setProductosFiltroTemp] = useState([]);
  const opFiltrosAvanzados = useRef(null);

  // Estados para catálogos
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [motivosOrigen, setMotivosOrigen] = useState([]);
  const [estadosDoc, setEstadosDoc] = useState([]);
  const [estadosTarea, setEstadosTarea] = useState([]);
  const [estadosInsumo, setEstadosInsumo] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [contratistas, setContratistas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [seriesDocs, setSeriesDocs] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  /**
   * Carga las órdenes de trabajo desde la API
   */
  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const filtros = {};
      if (empresaSeleccionada) filtros.empresaId = empresaSeleccionada;
      if (tipoMantenimientoFiltro)
        filtros.tipoMantenimientoId = tipoMantenimientoFiltro;
      if (motivoFiltro) filtros.motivoOriginoId = motivoFiltro;
      if (estadoFiltro) filtros.estadoId = estadoFiltro;

      const data = await getOrdenesTrabajoMantenimiento(filtros);
      // Normalizar IDs según regla ERP Megui
      const ordenesNormalizadas = data.map((orden) => ({
        ...orden,
        id: Number(orden.id),
        empresaId: Number(orden.empresaId),
        sedeId: orden.sedeId ? Number(orden.sedeId) : null,
        activoId: orden.activoId ? Number(orden.activoId) : null,
        tipoMantenimientoId: Number(orden.tipoMantenimientoId),
        motivoOriginoId: Number(orden.motivoOriginoId),
        solicitanteId: orden.solicitanteId ? Number(orden.solicitanteId) : null,
        responsableId: orden.responsableId ? Number(orden.responsableId) : null,
        autorizadoPorId: orden.autorizadoPorId
          ? Number(orden.autorizadoPorId)
          : null,
      }));

      // Aplicar filtros de fecha en frontend
      let ordenesFiltradas = ordenesNormalizadas;

      if (tipoMantenimientoFiltro) {
        ordenesFiltradas = ordenesFiltradas.filter(
          (item) => Number(item.tipoMantenimientoId) === Number(tipoMantenimientoFiltro),
        );
      }

      if (motivoFiltro) {
        ordenesFiltradas = ordenesFiltradas.filter(
          (item) => Number(item.motivoOriginoId) === Number(motivoFiltro),
        );
      }

      if (estadoFiltro) {
        ordenesFiltradas = ordenesFiltradas.filter(
          (item) => Number(item.estadoId) === Number(estadoFiltro),
        );
      }

      if (fechaInicio) {
        ordenesFiltradas = ordenesFiltradas.filter((item) => {
          const fechaDoc = new Date(item.fechaProgramada || item.fechaCreacion);
          const fechaIni = new Date(fechaInicio);
          fechaIni.setHours(0, 0, 0, 0);
          return fechaDoc >= fechaIni;
        });
      }

      if (fechaFin) {
        ordenesFiltradas = ordenesFiltradas.filter((item) => {
          const fechaDoc = new Date(item.fechaProgramada || item.fechaCreacion);
          const fechaFinDia = new Date(fechaFin);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaDoc <= fechaFinDia;
        });
      }

      // Filtro por contratista (múltiple)
      if (contratistasFiltro && contratistasFiltro.length > 0) {
        const ids = contratistasFiltro.map(Number);
        ordenesFiltradas = ordenesFiltradas.filter((item) =>
          item.contratistas?.some((c) => ids.includes(Number(c.contratistaId))),
        );
      }

      // Filtro por producto/servicio (múltiple)
      if (productosFiltro && productosFiltro.length > 0) {
        const ids = productosFiltro.map(Number);
        ordenesFiltradas = ordenesFiltradas.filter((item) =>
          item.contratistas?.some((c) =>
            c.repuestos?.some((r) => ids.includes(Number(r.productoId))),
          ),
        );
      }

      setOrdenesTrabajo(ordenesFiltradas);
    } catch (error) {
      console.error("Error al cargar órdenes de trabajo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las órdenes de trabajo",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga los catálogos necesarios para el formulario
   */
  const cargarCatalogos = async () => {
    try {
      const [
        empresasData,
        sedesData,
        almacenesData,
        activosData,
        tiposData,
        motivosData,
        estadosDocData,
        estadosTareaData,
        estadosInsumoData,
        personalData,
        contratistasData,
        productosData,
        tiposDocumentoData,
        seriesDocsData,
        monedasData,
        centrosCostoData,
        tiposMovimientoData,
        entidadesComercialesData,
      ] = await Promise.all([
        getEmpresas(),
        getSedes(),
        getAlmacenes(),
        getActivos(),
        getTiposMantenimiento(),
        getMotivosOrigenOT(),
        getEstadosMultiFuncionPorTipoProviene(15), // Orden Trabajo Mantenimiento
        getEstadosMultiFuncionPorTipoProviene(16), // Tarea OT Mantenimiento
        getEstadosMultiFuncionPorTipoProviene(17), // Insumo Tarea OT Mantenimiento
        getPersonal(),
        getContratistas(),
        getProductos(),
        getTiposDocumento(),
        getSeriesDoc(),
        getMonedas(),
        getCentrosCosto(),
        getAllTipoMovEntregaRendir(),
        getEntidadesComerciales(),
      ]);

      // Normalizar IDs
      setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      setSedes(sedesData.map((s) => ({ ...s, id: Number(s.id) })));
      setAlmacenes(almacenesData.map((a) => ({ ...a, id: Number(a.id) })));
      setActivos(activosData.map((a) => ({ ...a, id: Number(a.id) })));
      setTiposMantenimiento(tiposData.map((t) => ({ ...t, id: Number(t.id) })));
      setMotivosOrigen(motivosData.map((m) => ({ ...m, id: Number(m.id) })));
      const estadosDocNormalizados = estadosDocData.map((e) => ({
        ...e,
        id: Number(e.id),
      }));
      setEstadosDoc(estadosDocNormalizados);
      setEstadosTarea(
        estadosTareaData.map((e) => ({ ...e, id: Number(e.id) })),
      );
      setEstadosInsumo(
        estadosInsumoData.map((e) => ({ ...e, id: Number(e.id) })),
      );
      setPersonalOptions(personalData.map((p) => ({ ...p, id: Number(p.id) })));
      setContratistas(
        contratistasData.map((c) => ({ ...c, id: Number(c.id) })),
      );
      setProductos(productosData.map((p) => ({ ...p, id: Number(p.id) })));
      setTiposDocumento(
        tiposDocumentoData.map((t) => ({ ...t, id: Number(t.id) })),
      );
      setSeriesDocs(seriesDocsData.map((s) => ({ ...s, id: Number(s.id) })));
      setMonedas(monedasData.map((m) => ({ ...m, id: Number(m.id) })));
      setCentrosCosto(
        centrosCostoData.map((c) => ({ ...c, id: Number(c.id) })),
      );
      setTiposMovimiento(
        tiposMovimientoData.map((t) => ({ ...t, id: Number(t.id) })),
      );
      setEntidadesComerciales(
        entidadesComercialesData.map((e) => ({ ...e, id: Number(e.id) })),
      );
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los catálogos",
      });
    }
  };

  /**
   * Efecto para cargar catálogos al montar el componente
   */
  useEffect(() => {
    cargarCatalogos();
  }, []);

  /**
   * Efecto para recargar órdenes cuando cambian los filtros
   */
  useEffect(() => {
    cargarOrdenes();
  }, [
    empresaSeleccionada,
    tipoMantenimientoFiltro,
    motivoFiltro,
    estadoFiltro,
    fechaInicio,
    fechaFin,
    contratistasFiltro,
    productosFiltro,
  ]);

  // Opciones dinámicas para filtros avanzados: solo contratistas/productos que existen en los registros mostrados
  const contratistasDisponibles = useMemo(() => {
    const map = new Map();
    ordenesTrabajo.forEach((orden) =>
      orden.contratistas?.forEach((c) => {
        if (c.contratista) {
          map.set(Number(c.contratista.id), c.contratista);
        }
      }),
    );
    return Array.from(map.values());
  }, [ordenesTrabajo]);

  const productosDisponibles = useMemo(() => {
    const map = new Map();
    ordenesTrabajo.forEach((orden) =>
      orden.contratistas?.forEach((c) =>
        c.repuestos?.forEach((r) => {
          if (r.producto) {
            map.set(Number(r.producto.id), r.producto);
          }
        }),
      ),
    );
    return Array.from(map.values());
  }, [ordenesTrabajo]);

  const tiposMantenimientoDisponibles = useMemo(() => {
    const map = new Map();
    ordenesTrabajo.forEach((orden) => {
      if (orden.tipoMantenimiento) {
        map.set(Number(orden.tipoMantenimiento.id), orden.tipoMantenimiento);
      }
    });
    return Array.from(map.values());
  }, [ordenesTrabajo]);

  const motivosDisponibles = useMemo(() => {
    const map = new Map();
    ordenesTrabajo.forEach((orden) => {
      if (orden.motivoOrigino) {
        map.set(Number(orden.motivoOrigino.id), orden.motivoOrigino);
      }
    });
    return Array.from(map.values());
  }, [ordenesTrabajo]);

  const estadosDisponibles = useMemo(() => {
    const map = new Map();
    ordenesTrabajo.forEach((orden) => {
      if (orden.estado) {
        map.set(Number(orden.estado.id), orden.estado);
      }
    });
    return Array.from(map.values());
  }, [ordenesTrabajo]);

  const filtrosActivosCount = useMemo(() => {
    let count = 0;
    if (tipoMantenimientoFiltro) count++;
    if (motivoFiltro) count++;
    if (estadoFiltro) count++;
    if (rangoFechasFiltro && (rangoFechasFiltro[0] || rangoFechasFiltro[1])) count++;
    count += (contratistasFiltro || []).length;
    count += (productosFiltro || []).length;
    return count;
  }, [
    tipoMantenimientoFiltro,
    motivoFiltro,
    estadoFiltro,
    rangoFechasFiltro,
    contratistasFiltro,
    productosFiltro,
  ]);

  /**
   * Abre el diálogo para crear nueva orden de trabajo
   */
  const abrirDialogoNuevo = () => {
    if (!empresaSeleccionada) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
      });
      return;
    }
    setOrdenSeleccionada(null);
    setIsEditing(false);
    setDialogoVisible(true);
  };

  /**
   * Abre el diálogo para editar orden de trabajo (clic en fila)
   */
  const abrirDialogoEdicion = (orden) => {
    setOrdenSeleccionada(orden);
    setIsEditing(true);
    setDialogoVisible(true);
  };

  /**
   * Cierra el diálogo
   */
  const cerrarDialogo = () => {
    setDialogoVisible(false);
    setOrdenSeleccionada(null);
    setIsEditing(false);
  };

  /**
   * Maneja el guardado de la orden de trabajo
   */
  const handleGuardarOrden = async (datos) => {
    const esEdicion = ordenSeleccionada && ordenSeleccionada.id;

    // Validar permisos antes de guardar
    if (esEdicion && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!esEdicion && !permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (esEdicion) {
        await actualizarOrdenTrabajo(ordenSeleccionada.id, datos);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail:
            "Orden de trabajo actualizada. Puedes seguir agregando detalles.",
        });

        // Recargar la orden actualizada
        const ordenActualizada = await getOrdenTrabajoPorId(
          ordenSeleccionada.id,
        );
        setOrdenSeleccionada(ordenActualizada);
        setRefreshKey((prev) => prev + 1);
      } else {
        const resultado = await crearOrdenTrabajo(datos);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: `Orden de trabajo creada con código: ${resultado.numeroCompleto}. Ahora puedes agregar detalles.`,
          life: 5000,
        });

        // Cargar la orden recién creada
        const ordenCompleta = await getOrdenTrabajoPorId(resultado.id);
        setOrdenSeleccionada(ordenCompleta);
        setIsEditing(true);
        setRefreshKey((prev) => prev + 1);
      }

      cargarOrdenes();
    } catch (err) {
      console.error("Error al guardar orden de trabajo:", err);

      // Si el backend devuelve campos faltantes, mostrar lista
      if (
        err.response?.data?.camposFaltantes &&
        Array.isArray(err.response.data.camposFaltantes)
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Campos Obligatorios Faltantes",
          detail: (
            <div>
              <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Los siguientes campos son obligatorios:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {err.response.data.camposFaltantes.map((campo, index) => (
                  <li key={index}>{campo}</li>
                ))}
              </ul>
            </div>
          ),
          life: 8000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail:
            err.response?.data?.message ||
            "Error al guardar la orden de trabajo",
          life: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirma la eliminación de una orden de trabajo
   */
  const confirmarEliminacion = (orden) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
      });
      return;
    }

    confirmDialog({
      message: `¿Está seguro de eliminar la orden de trabajo "${orden.numeroCompleto}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarOrden(orden.id),
    });
  };

  /**
   * Elimina una orden de trabajo
   */
  const eliminarOrden = async (id) => {
    try {
      await eliminarOrdenTrabajo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Orden de trabajo eliminada correctamente",
      });
      await cargarOrdenes();
    } catch (error) {
      console.error("Error al eliminar orden de trabajo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          "Error al eliminar la orden de trabajo",
      });
    }
  };

  /**
   * Maneja el clic en fila
   */
  const onRowClick = (event) => {
    if (permisos.puedeVer || permisos.puedeEditar) {
      abrirDialogoEdicion(event.data);
    }
  };

  /**
   * Limpia todos los filtros
   */
  const limpiarFiltros = () => {
    setTipoMantenimientoFiltro(null);
    setMotivoFiltro(null);
    setEstadoFiltro(null);
    setFechaInicio(null);
    setFechaFin(null);
    setRangoFechasFiltro(null);
    setContratistasFiltro([]);
    setProductosFiltro([]);
    setTipoMantenimientoFiltroTemp(null);
    setMotivoFiltroTemp(null);
    setEstadoFiltroTemp(null);
    setRangoFechasFiltroTemp(null);
    setContratistasFiltroTemp([]);
    setProductosFiltroTemp([]);
  };

  const abrirFiltrosAvanzados = (e) => {
    setTipoMantenimientoFiltroTemp(tipoMantenimientoFiltro);
    setMotivoFiltroTemp(motivoFiltro);
    setEstadoFiltroTemp(estadoFiltro);
    setRangoFechasFiltroTemp(rangoFechasFiltro);
    setContratistasFiltroTemp(contratistasFiltro || []);
    setProductosFiltroTemp(productosFiltro || []);
    opFiltrosAvanzados.current?.toggle(e);
  };

  const aplicarFiltrosAvanzados = () => {
    setTipoMantenimientoFiltro(tipoMantenimientoFiltroTemp);
    setMotivoFiltro(motivoFiltroTemp);
    setEstadoFiltro(estadoFiltroTemp);
    setRangoFechasFiltro(rangoFechasFiltroTemp);

    if (rangoFechasFiltroTemp && rangoFechasFiltroTemp[0]) {
      setFechaInicio(rangoFechasFiltroTemp[0]);
    } else {
      setFechaInicio(null);
    }
    if (rangoFechasFiltroTemp && rangoFechasFiltroTemp[1]) {
      setFechaFin(rangoFechasFiltroTemp[1]);
    } else {
      setFechaFin(null);
    }

    setContratistasFiltro(contratistasFiltroTemp || []);
    setProductosFiltro(productosFiltroTemp || []);
    opFiltrosAvanzados.current?.hide();
  };

  const cancelarFiltrosAvanzados = () => {
    setTipoMantenimientoFiltroTemp(tipoMantenimientoFiltro);
    setMotivoFiltroTemp(motivoFiltro);
    setEstadoFiltroTemp(estadoFiltro);
    setRangoFechasFiltroTemp(rangoFechasFiltro);
    setContratistasFiltroTemp(contratistasFiltro || []);
    setProductosFiltroTemp(productosFiltro || []);
    opFiltrosAvanzados.current?.hide();
  };

  const limpiarFiltrosAvanzados = () => {
    setTipoMantenimientoFiltroTemp(null);
    setMotivoFiltroTemp(null);
    setEstadoFiltroTemp(null);
    setRangoFechasFiltroTemp(null);
    setContratistasFiltroTemp([]);
    setProductosFiltroTemp([]);
  };


  /**
   * Template para prioridad
   */
  const prioridadTemplate = (rowData) => {
    return rowData.prioridadAlta ? (
      <Tag value="ALTA" severity="danger" />
    ) : (
      <Tag value="NORMAL" severity="info" />
    );
  };

  /**
   * Template para tipo de mantenimiento
   */
  const tipoMantenimientoTemplate = (rowData) => {
    return rowData.tipoMantenimiento?.nombre || "-";
  };

  /**
   * Template para motivo de origen
   */
  const motivoOrigenTemplate = (rowData) => {
    return rowData.motivoOrigino?.nombre || "-";
  };

  /**
   * Template para responsable
   */
  const responsableTemplate = (rowData) => {
    return rowData.responsable?.nombres || "-";
  };

  /**
   * Template para estado
   */
  const estadoTemplate = (rowData) => {
    if (!rowData.estado) return "N/A";
    const severity = rowData.estado.severityColor || "secondary";
    return <Tag value={rowData.estado.descripcion} severity={severity} />;
  };

  /**
   * Template para acciones
   */
  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            abrirDialogoEdicion(rowData);
          }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={(e) => {
            e.stopPropagation();
            confirmarEliminacion(rowData);
          }}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  return (
    <div className="crud-demo">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h3>Ordenes de Trabajo Mantenimiento</h3>
        </div>

        <DataTable
          value={ordenesTrabajo}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={10}
          rowsPerPageOptions={[10, 20, 40, 80]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
          emptyMessage="No se encontraron órdenes de trabajo"
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar ? onRowClick : undefined
          }
          selectionMode="single"
          scrollable
          scrollHeight="600px"
          sortField="id"
          sortOrder={-1}
          style={{
            fontSize: getResponsiveFontSize(),
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          }}
          header={
            <div>
              <div
                style={{
                  alignItems: "end",
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 2 }}>
                  <h2>Ordenes de Trabajo</h2>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: "bold" }}>
                    Empresa*
                  </label>
                  <EmpresaSelector
                    empresaId={usuario?.empresaId}
                    onEmpresaChange={(id) => {
                      setEmpresaIdSelector(id);
                      setEmpresaSeleccionada(id);
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Nuevo"
                    icon="pi pi-plus"
                    onClick={abrirDialogoNuevo}
                    className="p-button-primary"
                    disabled={
                      !permisos.puedeCrear || loading || !empresaIdSelector
                    }
                    tooltip={
                      !empresaIdSelector
                        ? "Seleccione una empresa primero"
                        : !permisos.puedeCrear
                          ? "No tiene permisos para crear"
                          : "Nueva Orden de Trabajo"
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    icon="pi pi-refresh"
                    className="p-button-outlined p-button-info"
                    onClick={async () => {
                      await cargarOrdenes();
                      toast.current?.show({
                        severity: "success",
                        summary: "Actualizado",
                        detail:
                          "Datos actualizados correctamente desde el servidor",
                        life: 3000,
                      });
                    }}
                    loading={loading}
                    tooltip="Actualizar todos los datos desde el servidor"
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    className="p-button-secondary"
                    outlined
                    onClick={limpiarFiltros}
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: "bold" }}>
                    Filtros Avanzados
                  </label>
                  <Button
                    label="Filtros"
                    icon="pi pi-filter"
                    onClick={abrirFiltrosAvanzados}
                    className="p-button-outlined"
                    badge={
                      filtrosActivosCount > 0 ? String(filtrosActivosCount) : null
                    }
                    badgeClassName="p-badge-info"
                    style={{
                      width: "100%",
                      fontWeight: "bold",
                      justifyContent: "flex-start",
                    }}
                    disabled={loading}
                    tooltip={
                      filtrosActivosCount > 0
                        ? `${filtrosActivosCount} filtros activos`
                        : "Filtrar por tipo, motivo, estado, fecha, contratista y producto"
                    }
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
              <OverlayPanel ref={opFiltrosAvanzados} style={{ width: "450px" }}>
                <div style={{ padding: "10px" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50" }}>
                    <i className="pi pi-filter" style={{ marginRight: "8px" }}></i>
                    Filtros Avanzados
                  </h3>

                  {/* Tipo Mantenimiento */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="tipoMantenimientoFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Tipo Mantenimiento
                    </label>
                    <Dropdown
                      id="tipoMantenimientoFiltroTemp"
                      value={tipoMantenimientoFiltroTemp}
                      options={tiposMantenimientoDisponibles.map((t) => ({
                        label: t.nombre,
                        value: Number(t.id),
                      }))}
                      onChange={(e) => setTipoMantenimientoFiltroTemp(e.value)}
                      placeholder="Todos"
                      optionLabel="label"
                      optionValue="value"
                      showClear
                      style={{ width: "100%" }}
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                      {tiposMantenimientoDisponibles.length} tipo(s) disponible(s)
                    </small>
                  </div>

                  {/* Motivo */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="motivoFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Motivo Origen
                    </label>
                    <Dropdown
                      id="motivoFiltroTemp"
                      value={motivoFiltroTemp}
                      options={motivosDisponibles.map((m) => ({
                        label: m.nombre,
                        value: Number(m.id),
                      }))}
                      onChange={(e) => setMotivoFiltroTemp(e.value)}
                      placeholder="Todos"
                      optionLabel="label"
                      optionValue="value"
                      showClear
                      style={{ width: "100%" }}
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                      {motivosDisponibles.length} motivo(s) disponible(s)
                    </small>
                  </div>

                  {/* Estado */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="estadoFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Estado
                    </label>
                    <Dropdown
                      id="estadoFiltroTemp"
                      value={estadoFiltroTemp}
                      options={estadosDisponibles.map((e) => ({
                        label: e.descripcion,
                        value: Number(e.id),
                      }))}
                      onChange={(e) => setEstadoFiltroTemp(e.value)}
                      placeholder="Todos"
                      optionLabel="label"
                      optionValue="value"
                      showClear
                      style={{ width: "100%" }}
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                      {estadosDisponibles.length} estado(s) disponible(s)
                    </small>
                  </div>

                  {/* Rango de Fechas */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="rangoFechasFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Rango de Fechas
                    </label>
                    <Calendar
                      id="rangoFechasFiltroTemp"
                      value={rangoFechasFiltroTemp}
                      onChange={(e) => setRangoFechasFiltroTemp(e.value)}
                      selectionMode="range"
                      placeholder="Seleccionar rango de fechas"
                      dateFormat="dd/mm/yy"
                      showIcon
                      showButtonBar
                      style={{ width: "100%" }}
                    />
                  </div>

                  {/* Contratista */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="contratistasFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Contratista
                    </label>
                    <MultiSelect
                      id="contratistasFiltroTemp"
                      value={contratistasFiltroTemp}
                      options={contratistasDisponibles.map((c) => ({
                        label: `${c.numeroDocumento || ""} - ${c.razonSocial || ""}`,
                        value: Number(c.id),
                      }))}
                      onChange={(e) => setContratistasFiltroTemp(e.value || [])}
                      placeholder="Seleccionar contratistas"
                      optionLabel="label"
                      optionValue="value"
                      display="chip"
                      filter
                      showSelectAll
                      selectAllLabel="Seleccionar Todos"
                      style={{ width: "100%" }}
                      maxSelectedLabels={3}
                      emptyMessage="No hay contratistas disponibles"
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                      {contratistasDisponibles.length} contratista(s) disponible(s)
                    </small>
                  </div>

                  {/* Producto / Servicio */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      htmlFor="productosFiltroTemp"
                      style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}
                    >
                      Producto / Servicio
                    </label>
                    <MultiSelect
                      id="productosFiltroTemp"
                      value={productosFiltroTemp}
                      options={productosDisponibles.map((p) => ({
                        label: `${p.codigo || ""} - ${p.descripcionArmada || p.descripcionBase || ""}`,
                        value: Number(p.id),
                      }))}
                      onChange={(e) => setProductosFiltroTemp(e.value || [])}
                      placeholder="Seleccionar productos/servicios"
                      optionLabel="label"
                      optionValue="value"
                      display="chip"
                      filter
                      showSelectAll
                      selectAllLabel="Seleccionar Todos"
                      style={{ width: "100%" }}
                      maxSelectedLabels={3}
                      emptyMessage="No hay productos disponibles"
                    />
                    <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                      {productosDisponibles.length} producto(s) disponible(s)
                    </small>
                  </div>

                  {/* Botones */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                      borderTop: "1px solid #dee2e6",
                      paddingTop: "15px",
                    }}
                  >
                    <Button
                      label="Limpiar"
                      icon="pi pi-times"
                      onClick={limpiarFiltrosAvanzados}
                      className="p-button-text p-button-secondary"
                    />
                    <Button
                      label="Cancelar"
                      icon="pi pi-ban"
                      onClick={cancelarFiltrosAvanzados}
                      className="p-button-text"
                    />
                    <Button
                      label="Aplicar"
                      icon="pi pi-check"
                      onClick={aplicarFiltrosAvanzados}
                      className="p-button-success"
                    />
                  </div>
                </div>
              </OverlayPanel>
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            sortable
            frozen
            style={{ width: "80px", verticalAlign: "top" }}
          />

          <Column
            field="numeroCompleto"
            header="Número OT"
            sortable
            style={{ width: "160px", verticalAlign: "top", fontWeight: "bold" }}
          />

          <Column
            field="tipoMantenimiento.nombre"
            header="Tipo Mantenimiento"
            body={tipoMantenimientoTemplate}
            sortable
            style={{ width: "180px", verticalAlign: "top" }}
          />

          <Column
            field="motivoOrigino.nombre"
            header="Motivo Origen"
            body={motivoOrigenTemplate}
            sortable
            style={{ width: "150px", verticalAlign: "top" }}
          />

          <Column
            field="prioridadAlta"
            header="Prioridad"
            body={prioridadTemplate}
            sortable
            style={{ width: "100px", verticalAlign: "top" }}
            className="text-center"
          />

          <Column
            field="responsable.nombres"
            header="Responsable"
            body={responsableTemplate}
            sortable
            style={{ width: "150px", verticalAlign: "top" }}
          />

          <Column
            field="estado.descripcion"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ width: "120px", verticalAlign: "top" }}
            className="text-center"
          />

          <Column
            field="descripcionProblema"
            header="Descripción"
            sortable
            style={{ width: "200px", verticalAlign: "top" }}
          />

          <Column
            body={accionesTemplate}
            header="Acciones"
            frozen
            alignFrozen="right"
            style={{ width: "100px" }}
            className="text-center"
          />
        </DataTable>

      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "1300px" }}
        header={
          isEditing
            ? `Editar Orden de Trabajo: ${ordenSeleccionada?.numeroCompleto || ""}`
            : "Nueva Orden de Trabajo"
        }
        modal
        className="p-fluid"
        onHide={cerrarDialogo}
        maximizable
        maximized={true}
      >
        <OTMantenimientoForm
          key={refreshKey}
          isEdit={isEditing}
          defaultValues={ordenSeleccionada}
          onSubmit={handleGuardarOrden}
          onCancel={cerrarDialogo}
          empresas={empresas}
          tiposMantenimiento={tiposMantenimiento}
          motivosOrigen={motivosOrigen}
          estadosDoc={estadosDoc}
          estadosTarea={estadosTarea}
          estadosInsumo={estadosInsumo}
          activos={activos}
          sedes={sedes}
          almacenes={almacenes}
          personalOptions={personalOptions}
          contratistas={contratistas}
          productos={productos}
          tiposDocumento={tiposDocumento}
          seriesDocs={seriesDocs}
          monedas={monedas}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales}
          permisos={permisos}
          readOnly={
            !!ordenSeleccionada &&
            !!ordenSeleccionada.numeroCompleto &&
            !permisos.puedeEditar
          }
          loading={loading}
          toast={toast}
          empresaFija={empresaSeleccionada}
        />
      </Dialog>
    </div>
  );
};

export default OTMantenimiento;
