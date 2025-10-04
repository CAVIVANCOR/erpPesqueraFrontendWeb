// src/pages/NovedadPescaConsumo.jsx
// Pantalla CRUD profesional para NovedadPescaConsumo. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
// - Filtros por empresa, bahía y estado
// - Templates especializados para fechas, toneladas y resoluciones
// - Indicadores visuales de novedades activas
// - Upload de archivos PDF para resoluciones
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { useAuthStore } from "../shared/stores/useAuthStore";
import {
  getAllNovedadPescaConsumo,
  deleteNovedadPescaConsumo,
  crearNovedadPescaConsumo,
  actualizarNovedadPescaConsumo,
} from "../api/novedadPescaConsumo";
import { getEmpresas } from "../api/empresa";
import { getEstadosMultiFuncionParaNovedadPescaConsumo } from "../api/estadoMultiFuncion";
import NovedadPescaConsumoForm from "../components/novedadPescaConsumo/NovedadPescaConsumoForm";
import { getResponsiveFontSize } from "../utils/utils";

/**
 * Componente principal para gestión de Novedades de Pesca para Consumo
 * Implementa patrón CRUD profesional con filtros dinámicos y validaciones ERP Megui
 */
const NovedadPescaConsumo = () => {
  // Estados principales de la tabla
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados para combos de filtro
  const [empresas, setEmpresas] = useState([]);
  const [estadosNovedad, setEstadosNovedad] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  const toast = useRef(null);
  const { usuario } = useAuthStore();

  useEffect(() => {
    cargarCombos();
    cargarNovedades();
  }, []);

  useEffect(() => {
    cargarNovedades();
  }, [filtroEmpresa, filtroEstado]);

  /**
   * Cargar combos de filtro
   */
  const cargarCombos = async () => {
    try {
      const [empresasData, estadosData] = await Promise.all([
        getEmpresas(),
        getEstadosMultiFuncionParaNovedadPescaConsumo(),
      ]);

      if (empresasData && Array.isArray(empresasData)) {
        setEmpresas(empresasData.map((e) => ({ ...e, id: Number(e.id) })));
      }

      if (estadosData && Array.isArray(estadosData)) {
        setEstadosNovedad(estadosData.map((e) => ({ ...e, id: Number(e.id) })));
      }
    } catch (error) {
      console.error("Error cargando combos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar filtros",
      });
    }
  };

  /**
   * Cargar novedades con filtros aplicados
   */
  const cargarNovedades = async () => {
    try {
      setLoading(true);
      const filtros = {};

      if (filtroEmpresa) filtros.empresaId = filtroEmpresa;
      if (filtroEstado !== null)
        filtros.estadoNovedadPescaConsumoId = filtroEstado;

      const data = await getAllNovedadPescaConsumo(filtros);

      // Normalizar IDs y procesar datos
      const novedadesNormalizadas = data.map((novedad) => ({
        ...novedad,
        id: Number(novedad.id),
        empresaId: Number(novedad.empresaId),
        BahiaId: Number(novedad.BahiaId),
        estadoNovedadPescaConsumoId: Number(
          novedad.estadoNovedadPescaConsumoId
        ),
      }));

      setNovedades(novedadesNormalizadas);
    } catch (error) {
      console.error("Error cargando novedades:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar novedades de pesca consumo",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abrir formulario para nueva novedad
   */
  const openNew = async () => {
    if (!filtroEmpresa) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
      });
      return;
    }

    try {
      const { getBahiaComercialUnicoPorEmpresa } = await import(
        "../api/personal"
      );
      const bahiaComercial = await getBahiaComercialUnicoPorEmpresa(
        filtroEmpresa
      );

      setEditingItem({
        empresaId: filtroEmpresa,
        BahiaId: Number(bahiaComercial.id),
      });
      setShowForm(true);
    } catch (error) {
      console.error("Error cargando Bahía Comercial:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al cargar Bahía Comercial",
      });
    }
  };
  /**
   * Abrir formulario para editar novedad
   */
  const openEdit = (novedad) => {
    setEditingItem(novedad);
    setShowForm(true);
  };

  /**
   * Cerrar formulario
   */
  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  /**
   * Actualizar datos del item en edición
   */
  const actualizarEditingItem = (nuevosDatos) => {
    setEditingItem((prev) => ({ ...prev, ...nuevosDatos }));
  };

  /**
   * Guardar novedad (crear o actualizar)
   */
  const saveItem = async (data) => {
    try {
      let resultado;
      if (editingItem?.id) {
        resultado = await actualizarNovedadPescaConsumo(editingItem.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Novedad actualizada correctamente",
        });
      } else {
        resultado = await crearNovedadPescaConsumo(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Novedad creada correctamente",
        });
      }

      // NO cerrar el formulario - mantener modo edición activo
      // closeForm();

      // Para nuevas novedades, actualizar editingItem con los datos guardados
      // para mantener el formulario en modo edición
      if (!editingItem?.id) {
        setEditingItem(resultado);
      }

      // Recargar datos para actualizar la tabla
      cargarNovedades();

      // Devolver el objeto resultado
      return resultado;
    } catch (error) {
      console.error("Error guardando novedad:", error);

      // Manejo específico de errores
      const { response } = error;
      const { status, data: errorData } = response || {};
      let mensajeError = "Error al guardar la novedad";

      if (status && errorData) {
        switch (status) {
          case 409: // Conflict
            if (
              errorData.mensaje &&
              errorData.mensaje.includes("fechas que se superponen")
            ) {
              mensajeError =
                "Ya existe una novedad con el mismo nombre para esta empresa en fechas que se superponen. Por favor, verifique las fechas de inicio y fin o cambie el nombre de la novedad.";
            } else if (
              errorData.mensaje &&
              errorData.mensaje.includes("faenas, entregas o liquidación")
            ) {
              mensajeError =
                "No se puede eliminar esta novedad porque tiene faenas, entregas o liquidaciones asociadas. Debe eliminar primero estos registros relacionados.";
            } else {
              mensajeError = errorData.mensaje || mensajeError;
            }
            break;
          case 400: // Bad Request
            mensajeError =
              errorData.mensaje ||
              "Datos inválidos. Verifique la información ingresada.";
            break;
          case 500: // Internal Server Error
            mensajeError =
              "Error interno del servidor. Contacte al administrador.";
            break;
          default:
            mensajeError = errorData.mensaje || mensajeError;
        }
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: mensajeError,
        life: 5000,
      });
      throw error;
    }
  };

  /**
   * Confirmar eliminación de novedad
   */
  const confirmarEliminacion = (novedad) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la novedad "${novedad.nombre}"?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarNovedad(novedad.id),
    });
  };

  /**
   * Eliminar novedad
   */
  const eliminarNovedad = async (id) => {
    try {
      await deleteNovedadPescaConsumo(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Novedad eliminada correctamente",
      });
      cargarNovedades();
    } catch (error) {
      console.error("Error eliminando novedad:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la novedad",
      });
    }
  };

  /**
   * Obtener razón social de empresa por ID
   */
  const getEmpresaRazonSocial = (id) => {
    const empresa = empresas.find((e) => Number(e.id) === Number(id));
    return empresa ? empresa.razonSocial : "Sin empresa";
  };

  /**
   * Obtener descripción de estado por ID
   */
  const getEstadoDescripcion = (id) => {
    const estado = estadosNovedad.find((e) => Number(e.id) === Number(id));
    return estado ? estado.descripcion : "Sin estado";
  };

  /**
   * Formatear fecha corta
   */
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * Formatear fecha completa con hora
   */
  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Template para fecha de inicio
   */
  const fechaInicioTemplate = (rowData) => {
    return formatearFecha(rowData.fechaInicio);
  };

  /**
   * Template para fecha de fin
   */
  const fechaFinTemplate = (rowData) => {
    return formatearFecha(rowData.fechaFin);
  };

  /**
   * Template para fecha de creación
   */
  const fechaCreacionTemplate = (rowData) => {
    return formatearFechaCompleta(rowData.fechaCreacion);
  };

  /**
   * Template para empresa
   */
  const empresaTemplate = (rowData) => {
    return getEmpresaRazonSocial(rowData.empresaId);
  };

  /**
   * Template para estado dinámico basado en fechas
   */
  const estadoTemplate = (rowData) => {
    const ahora = new Date();
    const inicio = new Date(rowData.fechaInicio);
    const fin = new Date(rowData.fechaFin);

    let estado = "Programada";
    let severity = "info";

    if (ahora >= inicio && ahora <= fin) {
      estado = "En Curso";
      severity = "success";
    } else if (ahora > fin) {
      estado = "Finalizada";
      severity = "secondary";
    }

    return <Tag value={estado} severity={severity} />;
  };

  /**
   * Template para duración de la novedad
   */
  const duracionTemplate = (rowData) => {
    if (!rowData.fechaInicio || !rowData.fechaFin) return "";

    const inicio = new Date(rowData.fechaInicio);
    const fin = new Date(rowData.fechaFin);
    const diferencia = fin - inicio;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    return `${dias} día${dias !== 1 ? "s" : ""}`;
  };

  /**
   * Template para toneladas capturadas
   */
  const toneladasTemplate = (rowData) => {
    if (!rowData.toneladasCapturadas) return "-";
    return `${Number(rowData.toneladasCapturadas).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Tn`;
  };

  /**
   * Template para resolución PDF
   */
  const resolucionTemplate = (rowData) => {
    if (!rowData.numeroResolucion) return "-";

    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{rowData.numeroResolucion}</span>
        {rowData.urlResolucionPdf && (
          <Button
            icon="pi pi-file-pdf"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(rowData.urlResolucionPdf, "_blank");
            }}
            tooltip="Ver PDF"
          />
        )}
      </div>
    );
  };

  /**
   * Template para acciones
   */
  const accionesTemplate = (rowData) => {
    const puedeEliminar = usuario?.esSuperUsuario || usuario?.esAdmin;

    return (
      <div className="flex gap-2">
        {puedeEliminar && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-text"
            onClick={(e) => {
              e.stopPropagation();
              confirmarEliminacion(rowData);
            }}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <div className="novedad-pesca-consumo-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="card">
        <DataTable
          value={novedades}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} novedades"
          emptyMessage="No se encontraron novedades."
          onRowClick={(e) => openEdit(e.data)}
          selectionMode="single"
          scrollable
          scrollHeight="600px"
          globalFilter={globalFilter}
          style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
          header={
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Novedad Pesca Consumo</h2>
              </div>
              <div style={{ flex: 1 }}>
                <Dropdown
                  value={filtroEmpresa}
                  options={empresas}
                  onChange={(e) => {
                    setFiltroEmpresa(e.value);
                  }}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Filtrar por empresa"
                  className="w-12rem"
                  showClear
                  filter // ← Agrega esto para habilitar búsqueda
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nueva Novedad"
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={openNew}
                  disabled={!filtroEmpresa}
                  tooltip={
                    !filtroEmpresa
                      ? "Seleccione una empresa para crear una nueva novedad"
                      : "Crear nueva novedad"
                  }
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Dropdown
                  value={filtroEstado}
                  options={estadosNovedad}
                  onChange={(e) => setFiltroEstado(e.value)}
                  optionLabel="descripcion"
                  optionValue="id"
                  placeholder="Filtrar por estado"
                  className="w-12rem"
                  showClear
                />
              </div>
            </div>
          }
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ width: "80px" }}
            frozen
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
            body={(rowData) => (
              <span className="font-semibold">{rowData.nombre}</span>
            )}
          />
          <Column
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="BahiaId"
            header="Bahía ID"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="fechaInicio"
            header="Fecha Inicio"
            body={fechaInicioTemplate}
            sortable
            style={{ width: "130px" }}
          />
          <Column
            field="fechaFin"
            header="Fecha Fin"
            body={fechaFinTemplate}
            sortable
            style={{ width: "130px" }}
          />
          <Column
            header="Duración"
            body={duracionTemplate}
            style={{ width: "100px" }}
            className="text-center"
          />
          <Column
            header="Estado"
            body={estadoTemplate}
            style={{ width: "120px" }}
            className="text-center"
          />
          <Column
            header="Toneladas"
            body={toneladasTemplate}
            style={{ width: "120px" }}
            className="text-right"
          />
          <Column
            header="Resolución"
            body={resolucionTemplate}
            style={{ width: "150px" }}
          />
          <Column
            field="fechaCreacion"
            header="F. Creación"
            body={fechaCreacionTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "100px" }}
            className="text-center"
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </div>

      <NovedadPescaConsumoForm
        visible={showForm}
        onHide={closeForm}
        onSave={saveItem}
        editingItem={editingItem}
        empresas={empresas}
        onNovedadDataChange={actualizarEditingItem}
      />
    </div>
  );
};

export default NovedadPescaConsumo;
