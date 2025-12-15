// src/pages/ContratoServicio.jsx
// Pantalla CRUD profesional para ContratoServicio. Cumple regla transversal ERP Megui:
// - Edición por clic en fila, borrado seguro con roles, ConfirmDialog, Toast
// - Autenticación JWT desde Zustand, normalización de IDs, documentación en español
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { useAuthStore } from "../shared/stores/useAuthStore";
import {
  getAllContratosServicio,
  getContratoServicioPorId,
  deleteContratoServicio,
  crearContratoServicio,
  actualizarContratoServicio,
} from "../api/contratoServicio";
import ContratoServicioForm from "../components/contratoServicio/ContratoServicioForm";
import { formatearFecha, formatearNumero } from "../utils/utils";
import { getEmpresas } from "../api/empresa";
import { getSedes } from "../api/sedes";
import { getActivos } from "../api/activo";
import { getAlmacenes } from "../api/almacen";
import { getEntidadesComerciales } from "../api/entidadComercial";
import { getContactosEntidad } from "../api/contactoEntidad";
import { getPersonal } from "../api/personal";
import { getTiposDocumento } from "../api/tipoDocumento";
import { getMonedas } from "../api/moneda";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getProductos } from "../api/producto";
import { getCentrosAlmacen } from "../api/centrosAlmacen";
import { getCentrosCosto } from "../api/centroCosto";
import { getTiposMovimiento } from "../api/tipoMovimiento";
import { usePermissions } from "../hooks/usePermissions";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import ColorTag from "../components/shared/ColorTag";

/**
 * Componente ContratoServicio
 * Gestión CRUD de contratos de servicio con patrón profesional ERP Megui
 */
const ContratoServicio = ({ ruta }) => {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const [contratos, setContratos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estadosContrato, setEstadosContrato] = useState([]);
  const [productos, setProductos] = useState([]);
  const [centrosAlmacen, setCentrosAlmacen] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    cargarContratos();
    cargarDatos();
  }, []);

  const cargarContratos = async () => {
    try {
      setLoading(true);
      const data = await getAllContratosServicio();
      setContratos(data);
    } catch (error) {
      console.error("Error al cargar contratos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al cargar contratos: ${
          error.response?.data?.message || error.message
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        empresasData,
        sedesData,
        activosData,
        almacenesData,
        clientesData,
        contactosData,
        personalData,
        tiposDocData,
        monedasData,
        estadosData,
        productosData,
        centrosAlmacenData,
        centrosCostoData,
        tiposMovimientoData,
      ] = await Promise.all([
        getEmpresas(),
        getSedes(),
        getActivos(),
        getAlmacenes(),
        getEntidadesComerciales(),
        getContactosEntidad(),
        getPersonal(),
        getTiposDocumento(),
        getMonedas(),
        getEstadosMultiFuncion(),
        getProductos(),
        getCentrosAlmacen(),
        getCentrosCosto(),
        getTiposMovimiento(),
      ]);

      setEmpresas(empresasData);
      setSedes(sedesData);
      setActivos(activosData);
      setAlmacenes(almacenesData);
      setClientes(clientesData);
      setContactos(contactosData);

      // Mapear personal con nombreCompleto
      const personalConNombres = personalData.map((p) => ({
        ...p,
        nombreCompleto: `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
      }));
      setPersonalOptions(personalConNombres);

      setTiposDocumento(tiposDocData);
      setMonedas(monedasData);

      // Filtrar estados de contratos (tipoProvieneDeId = 18 para CONTRATOS DE SERVICIOS)
      const estadosContratoFiltrados = estadosData.filter(
        (e) => Number(e.tipoProvieneDeId) === 18 && !e.cesado
      );
      setEstadosContrato(estadosContratoFiltrados);

      setProductos(productosData);
      setCentrosAlmacen(centrosAlmacenData);
      setCentrosCosto(centrosCostoData);
      setTiposMovimiento(tiposMovimientoData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar los datos.",
      });
    }
    setLoading(false);
  };

  // Filtrar clientes por empresa seleccionada
  const clientesFiltrados = empresaSeleccionada
    ? clientes.filter((c) => Number(c.empresaId) === Number(empresaSeleccionada))
    : clientes;

  // Filtrar estados dinámicamente (solo mostrar estados que existan en los contratos)
  const estadosDisponibles = estadosContrato.filter((estado) =>
    contratos.some((c) => Number(c.estadoContratoId) === Number(estado.id))
  );

  // Limpiar cliente seleccionado cuando cambie la empresa
  useEffect(() => {
    if (empresaSeleccionada && clienteSeleccionado) {
      const clienteValido = clientesFiltrados.some(
        (c) => Number(c.id) === Number(clienteSeleccionado)
      );
      if (!clienteValido) {
        setClienteSeleccionado(null);
      }
    }
  }, [empresaSeleccionada, clientesFiltrados, clienteSeleccionado]);

  // Filtrar contratos cuando cambien los filtros
  useEffect(() => {
    let filtrados = contratos;

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    if (clienteSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.clienteId) === Number(clienteSeleccionado)
      );
    }

    if (estadoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoContratoId) === Number(estadoSeleccionado)
      );
    }

    if (fechaInicio) {
      filtrados = filtrados.filter((item) => {
        const fechaCelebracion = new Date(item.fechaCelebracion);
        const fechaIni = new Date(fechaInicio);
        fechaIni.setHours(0, 0, 0, 0);
        return fechaCelebracion >= fechaIni;
      });
    }

    if (fechaFin) {
      filtrados = filtrados.filter((item) => {
        const fechaCelebracion = new Date(item.fechaCelebracion);
        const fechaFinDia = new Date(fechaFin);
        fechaFinDia.setHours(23, 59, 59, 999);
        return fechaCelebracion <= fechaFinDia;
      });
    }

    setContratosFiltrados(filtrados);
  }, [
    empresaSeleccionada,
    clienteSeleccionado,
    estadoSeleccionado,
    fechaInicio,
    fechaFin,
    contratos,
  ]);

  const abrirDialogoNuevo = async () => {
    try {
      // Obtener aprobadorId desde ParametroAprobador
      let aprobadorId = null;
      if (empresaSeleccionada) {
        const { getParametrosAprobadorPorModulo } = await import(
          "../api/parametroAprobador"
        );
        const parametros = await getParametrosAprobadorPorModulo(
          empresaSeleccionada,
          5
        ); // 5 = VENTAS (Contratos de Servicios son ventas de servicios)

        // Filtrar por cesado=false y tomar el primero
        const parametroActivo = parametros.find((p) => p.cesado === false);
        if (parametroActivo) {
          aprobadorId = parametroActivo.personalRespId;
        } else {
          console.warn(
            `[ContratoServicio] No se encontró ParametroAprobador activo para empresa ${empresaSeleccionada}, módulo VENTAS`
          );
        }
      }

      // Obtener responsableId del usuario logueado
      const responsableId = usuario?.personalId || null;

      // Crear objeto inicial con aprobadorId y responsableId pre-cargados
      const contratoInicial = {
        aprobadorId,
        responsableId,
      };

      setSelectedContrato(contratoInicial);
      setIsEditing(false);
      setDialogVisible(true);
    } catch (error) {
      console.error("Error al obtener parámetro aprobador:", error);
      // Abrir diálogo sin aprobadorId si hay error
      setSelectedContrato(null);
      setIsEditing(false);
      setDialogVisible(true);
    }
  };

  const abrirDialogoEditar = (contrato) => {
    setSelectedContrato(contrato);
    setIsEditing(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setSelectedContrato(null);
    setIsEditing(false);
  };

  const handleGuardar = async (data) => {
    // Validar permisos antes de guardar
    if (isEditing && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para editar registros.",
        life: 3000,
      });
      return;
    }
    if (!isEditing && !permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }

    try {
      if (isEditing) {
        // Actualizar contrato existente
        await actualizarContratoServicio(selectedContrato.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contrato actualizado correctamente",
        });
        // Recargar el contrato actualizado
        const contratoActualizado = await getContratoServicioPorId(selectedContrato.id);
        setSelectedContrato(contratoActualizado);
        cargarContratos();
      } else {
        // Crear nuevo contrato
        const contratoCreado = await crearContratoServicio(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Contrato creado correctamente. Ahora puede agregar los servicios.",
        });
        // Cambiar a modo edición con el contrato recién creado
        setSelectedContrato(contratoCreado);
        setIsEditing(true);
        // Mantener el diálogo abierto
        cargarContratos();
      }
    } catch (error) {
      console.error("Error al guardar contrato:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al guardar: ${
          error.response?.data?.message || error.message
        }`,
      });
    }
  };

  const confirmarEliminar = (contrato) => {
    // Validar permisos de eliminación
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    confirmDialog({
      message: `¿Está seguro de eliminar el contrato ${contrato.numeroCompleto}?`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      accept: () => eliminarContrato(contrato.id),
    });
  };

  const eliminarContrato = async (id) => {
    try {
      await deleteContratoServicio(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Contrato eliminado correctamente",
      });
      cargarContratos();
    } catch (error) {
      console.error("Error al eliminar contrato:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Error al eliminar: ${
          error.response?.data?.message || error.message
        }`,
      });
    }
  };

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setClienteSeleccionado(null);
    setEstadoSeleccionado(null);
    setFechaInicio(null);
    setFechaFin(null);
  };

  // Templates de columnas
  const numeroTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.numeroCompleto || ""}
      </span>
    );
  };

  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || "";
  };

  const sedeTemplate = (rowData) => {
    return rowData.sede?.nombre || "";
  };

  const clienteTemplate = (rowData) => {
    return rowData.cliente?.razonSocial || "";
  };

  const fechaCelebracionTemplate = (rowData) => {
    return formatearFecha(rowData.fechaCelebracion);
  };

  const fechaInicioTemplate = (rowData) => {
    return formatearFecha(rowData.fechaInicioContrato);
  };

  const fechaFinTemplate = (rowData) => {
    return formatearFecha(rowData.fechaFinContrato);
  };

  const estadoTemplate = (rowData) => {
    const estado = rowData.estadoContrato;
    if (!estado) return "";

    const severity = estado.severityColor || "info";
    const descripcion = estado.descripcion || "";

    return <Tag value={descripcion} severity={severity} />;
  };

  const montoTemplate = (rowData) => {
    return formatearNumero(rowData.montoTotal || 0, 2);
  };

  const accionesTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-warning"
          onClick={() => abrirDialogoEditar(rowData)}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmarEliminar(rowData)}
          disabled={!permisos.puedeEliminar}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0 }}>
          <i className="pi pi-file-edit" style={{ marginRight: "0.5rem" }}></i>
          Contratos de Servicio
        </h2>
        <Button
          label="Nuevo Contrato"
          icon="pi pi-plus"
          onClick={abrirDialogoNuevo}
          className="p-button-success"
          disabled={!permisos.puedeCrear || !empresaSeleccionada}
          tooltip={
            !permisos.puedeCrear
              ? "No tiene permisos para crear"
              : !empresaSeleccionada
              ? "Seleccione una empresa para crear un contrato"
              : "Nuevo Contrato"
          }
          tooltipOptions={{ position: "left" }}
        />
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Empresa
          </label>
          <Dropdown
            value={empresaSeleccionada}
            options={empresas}
            onChange={(e) => setEmpresaSeleccionada(e.value)}
            optionLabel="razonSocial"
            optionValue="id"
            placeholder="Todas"
            showClear
            filter
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Cliente
          </label>
          <Dropdown
            value={clienteSeleccionado}
            options={clientesFiltrados}
            onChange={(e) => setClienteSeleccionado(e.value)}
            optionLabel="razonSocial"
            optionValue="id"
            placeholder="Todos"
            showClear
            filter
            style={{ width: "100%" }}
            disabled={!empresaSeleccionada}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Estado
          </label>
          <Dropdown
            value={estadoSeleccionado}
            options={estadosDisponibles.length > 0 ? estadosDisponibles : estadosContrato}
            onChange={(e) => setEstadoSeleccionado(e.value)}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Todos"
            showClear
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Fecha Desde
          </label>
          <Calendar
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.value)}
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar"
            showIcon
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Fecha Hasta
          </label>
          <Calendar
            value={fechaFin}
            onChange={(e) => setFechaFin(e.value)}
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar"
            showIcon
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Button
            label="Limpiar Filtros"
            icon="pi pi-filter-slash"
            onClick={limpiarFiltros}
            className="p-button-secondary"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        value={contratosFiltrados}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No se encontraron contratos"
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => abrirDialogoEditar(e.data)
            : undefined
        }
        selectionMode="single"
        style={{
          fontSize: "12px",
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
        }}
        stripedRows
      >
        <Column field="numeroCompleto" header="Número" body={numeroTemplate} sortable />
        <Column field="empresa.razonSocial" header="Empresa" body={empresaTemplate} sortable />
        <Column field="sede.nombre" header="Sede" body={sedeTemplate} sortable />
        <Column field="cliente.razonSocial" header="Cliente" body={clienteTemplate} sortable filter />
        <Column field="fechaCelebracion" header="F. Celebración" body={fechaCelebracionTemplate} sortable />
        <Column field="fechaInicioContrato" header="F. Inicio" body={fechaInicioTemplate} sortable />
        <Column field="fechaFinContrato" header="F. Fin" body={fechaFinTemplate} sortable />
        <Column field="estadoContrato.nombre" header="Estado" body={estadoTemplate} sortable />
        <Column field="montoTotal" header="Monto Total" body={montoTemplate} sortable />
        <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
      </DataTable>

      {/* Dialog del Formulario */}
      <Dialog
        visible={dialogVisible}
        onHide={cerrarDialogo}
        header={isEditing ? "Editar Contrato" : "Nuevo Contrato"}
        style={{ width: "95vw", maxWidth: "1400px" }}
        maximizable
        modal
      >
        <ContratoServicioForm
          contrato={selectedContrato}
          onGuardar={handleGuardar}
          onCancelar={cerrarDialogo}
          empresas={empresas}
          sedes={sedes}
          activos={activos}
          almacenes={almacenes}
          clientes={clientes}
          contactos={contactos}
          personalOptions={personalOptions}
          tiposDocumento={tiposDocumento}
          monedas={monedas}
          estadosContrato={estadosContrato}
          productos={productos}
          centrosAlmacen={centrosAlmacen}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={clientes}
          empresaFija={empresaSeleccionada}
          toast={toast}
          isEdit={isEditing}
          permisos={permisos}
          readOnly={!!selectedContrato && !!selectedContrato.id && !permisos.puedeEditar}
        />
      </Dialog>
    </div>
  );
};

export default ContratoServicio;
