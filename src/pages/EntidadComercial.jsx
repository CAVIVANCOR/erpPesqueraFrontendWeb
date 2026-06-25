/**
 * Pantalla CRUD para gestión de Entidades Comerciales
 *
 * Características implementadas:
 * - Edición profesional por clic en fila (abre modal de edición)
 * - Botón eliminar visible solo para superusuario/admin (usuario?.esSuperUsuario || usuario?.esAdmin)
 * - Confirmación de borrado con ConfirmDialog visual rojo y mensajes claros
 * - Feedback visual con Toast para éxito/error
 * - Filtros profesionales: Empresa, Tipo de Entidad, Forma de Pago, Agentes de Retención
 * - Cumple regla transversal ERP Megui completa
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import {
  getEntidadesComerciales,
  eliminarEntidadComercial,
} from "../api/entidadComercial";
import { getEmpresas } from "../api/empresa";
import { getTiposEntidad } from "../api/tipoEntidad";
import { getFormasPago } from "../api/formaPago";
import { useAuthStore } from "../shared/stores/useAuthStore";
import EntidadComercialForm from "../components/entidadComercial/EntidadComercialForm";
import { getResponsiveFontSize } from "../utils/utils";
import { InputText } from "primereact/inputtext";
import { usePermissions } from "../hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { useNavigateWithReturn } from "../shared/hooks/useNavigateWithReturn";
import { confirmDialog } from "primereact/confirmdialog";
import { Message } from "primereact/message";

const EntidadComercial = ({ ruta }) => {
  const permisos = usePermissions(ruta);
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);
  const [entidadesFiltradas, setEntidadesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para filtros
  const [empresas, setEmpresas] = useState([]);
  const [tiposEntidad, setTiposEntidad] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState(1); // Siempre filtrar por MEGUI
  const [empresaIdSelector] = useState(1); // Siempre MEGUI (id=1)
  const [filtroTipoEntidad, setFiltroTipoEntidad] = useState(null);
  const [filtroFormaPago, setFiltroFormaPago] = useState(null);
  const [filtroAgenteRetencion, setFiltroAgenteRetencion] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const toast = useRef(null);
  const { usuario } = useAuthStore();
  const { markActionCompleted } = useNavigateWithReturn();

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [
    entidadesComerciales,
    filtroEmpresa,
    filtroTipoEntidad,
    filtroFormaPago,
    filtroAgenteRetencion,
  ]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar entidades comerciales
      const dataEntidades = await getEntidadesComerciales();
      setEntidadesComerciales(dataEntidades);
      setEntidadesFiltradas(dataEntidades);

      // Cargar datos para filtros
      const [dataEmpresas, dataTiposEntidad, dataFormasPago] =
        await Promise.all([getEmpresas(), getTiposEntidad(), getFormasPago()]);

      setEmpresas(dataEmpresas);
      setTiposEntidad(dataTiposEntidad);
      setFormasPago(dataFormasPago);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEntidadesComerciales = async () => {
    try {
      setLoading(true);
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entidades comerciales",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...entidadesComerciales];

    // Filtro por empresa
    if (filtroEmpresa !== null) {
      resultado = resultado.filter(
        (e) => Number(e.empresaId) === Number(filtroEmpresa),
      );
    }

    // Filtro por tipo de entidad
    if (filtroTipoEntidad !== null) {
      resultado = resultado.filter(
        (e) => Number(e.tipoEntidadId) === Number(filtroTipoEntidad),
      );
    }

    // Filtro por forma de pago
    if (filtroFormaPago !== null) {
      resultado = resultado.filter(
        (e) => Number(e.formaPagoId) === Number(filtroFormaPago),
      );
    }

    // Filtro por agente de retención
    if (filtroAgenteRetencion !== null) {
      resultado = resultado.filter(
        (e) => e.esAgenteRetencion === filtroAgenteRetencion,
      );
    }

    setEntidadesFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEmpresa(null);
    setFiltroTipoEntidad(null);
    setFiltroFormaPago(null);
    setFiltroAgenteRetencion(null);
    setGlobalFilter("");
  };

  const abrirDialogoNuevo = () => {
    // Pre-cargar empresa seleccionada en el filtro
    const entidadInicial = filtroEmpresa
      ? { empresaId: Number(filtroEmpresa) }
      : null;
    setEntidadSeleccionada(entidadInicial);
    setModoEdicion(false);
    setDialogVisible(true);
  };

  const abrirDialogoEdicion = (entidad) => {
    setEntidadSeleccionada(entidad);
    setModoEdicion(true);
    setDialogVisible(true);
  };

  const cerrarDialogo = () => {
    setDialogVisible(false);
    setEntidadSeleccionada(null);
    setModoEdicion(false);
  };

  const onGuardarExitoso = (entidad) => {
    cargarEntidadesComerciales();

    // ✅ MARCAR ACCIÓN COMPLETADA PARA RETORNO
    // const { markActionCompleted } = useNavigateWithReturn(); Eliminado

    // Verificar si es creación nueva (entidad sin id previo o recién creada)
    const esNuevaEntidad = entidad && entidad.id && !modoEdicion;

    if (esNuevaEntidad) {
      // Marcar que se completó la creación de proveedor
      markActionCompleted("proveedorCreado", { id: entidad.id });
    }

    // Mostrar mensaje de éxito sin cerrar el diálogo
    toast.current.show({
      severity: "success",
      summary: "Éxito",
      detail:
        entidad && entidad.id
          ? "Entidad comercial actualizada correctamente"
          : "Entidad comercial creada correctamente",
      life: 3000,
    });
  };

  const confirmarEliminacion = (entidad) => {
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
      message: `¿Está seguro de eliminar la entidad comercial "${entidad.razonSocial}"?\n\nSe eliminarán también: contactos, direcciones, precios, vehículos, líneas de crédito y cuentas corrientes asociadas.`,
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: () => {
        handleEliminarEntidadComercial(entidad.id);
      },
    });
  };

  const handleEliminarEntidadComercial = async (id) => {
    try {
      const resultado = await eliminarEntidadComercial(id);

      // Construir mensaje detallado con DATOS REALES del backend
      const { resultados } = resultado;

      let mensajeDetalle = "Registros eliminados:\n";
      if (resultados.contactos > 0) mensajeDetalle += `• ${resultados.contactos} contacto(s)\n`;
      if (resultados.direcciones > 0) mensajeDetalle += `• ${resultados.direcciones} dirección(es)\n`;
      if (resultados.precios > 0) mensajeDetalle += `• ${resultados.precios} precio(s)\n`;
      if (resultados.vehiculos > 0) mensajeDetalle += `• ${resultados.vehiculos} vehículo(s)\n`;
      if (resultados.lineasCredito > 0) mensajeDetalle += `• ${resultados.lineasCredito} línea(s) de crédito\n`;
      if (resultados.ctaCteEntidad > 0) mensajeDetalle += `• ${resultados.ctaCteEntidad} cuenta(s) corriente(s)\n`;
      mensajeDetalle += `• ${resultados.entidadComercial} entidad comercial`;

      // Recargar datos
      await cargarEntidadesComerciales();

      toast.current?.show({
        severity: "success",
        summary: "Eliminación Exitosa",
        detail: mensajeDetalle,
        life: 6000,
      });

    } catch (error) {
      console.error("Error al eliminar entidad comercial:", error);

      // Si el error tiene detalleUso, significa que tiene operaciones
      if (error.detalleUso && error.totalOperaciones > 0) {
        const { detalleUso, totalOperaciones, mensaje } = error;

        let mensajeDetalle = `${mensaje}\n\n📦 REGISTROS OPERACIONALES (${totalOperaciones}):\n\n`;

        // 🔍 ALMACÉN E INVENTARIO
        if (detalleUso.movimientosAlmacen) mensajeDetalle += `• ${detalleUso.movimientosAlmacen} Movimiento(s) de Almacén\n`;
        if (detalleUso.kardexAlmacenes) mensajeDetalle += `• ${detalleUso.kardexAlmacenes} Registro(s) de Kardex\n`;
        if (detalleUso.saldosDetProductoCliente) mensajeDetalle += `• ${detalleUso.saldosDetProductoCliente} Saldo(s) Detallado(s) Producto-Cliente\n`;
        if (detalleUso.saldosProductoCliente) mensajeDetalle += `• ${detalleUso.saldosProductoCliente} Saldo(s) Producto-Cliente\n`;

        // 🔍 COMPRAS
        if (detalleUso.requerimientosCompra) mensajeDetalle += `• ${detalleUso.requerimientosCompra} Requerimiento(s) de Compra\n`;
        if (detalleUso.detallesReqCompra) mensajeDetalle += `• ${detalleUso.detallesReqCompra} Detalle(s) de Requerimiento de Compra\n`;
        if (detalleUso.cotizacionesProveedores) mensajeDetalle += `• ${detalleUso.cotizacionesProveedores} Cotización(es) de Proveedor\n`;
        if (detalleUso.ordenesCompra) mensajeDetalle += `• ${detalleUso.ordenesCompra} Orden(es) de Compra\n`;

        // 🔍 VENTAS Y EXPORTACIÓN
        if (detalleUso.cotizacionesVentas) mensajeDetalle += `• ${detalleUso.cotizacionesVentas} Cotización(es) de Venta\n`;
        if (detalleUso.preFacturas) mensajeDetalle += `• ${detalleUso.preFacturas} Pre-Factura(s)\n`;
        if (detalleUso.costosExportacionCotizacion) mensajeDetalle += `• ${detalleUso.costosExportacionCotizacion} Costo(s) Exportación en Cotización\n`;
        if (detalleUso.costosExportacionPorIncoterm) mensajeDetalle += `• ${detalleUso.costosExportacionPorIncoterm} Costo(s) Exportación por Incoterm\n`;

        // 🔍 CAJA Y TESORERÍA
        if (detalleUso.movimientosCaja) mensajeDetalle += `• ${detalleUso.movimientosCaja} Movimiento(s) de Caja\n`;
        if (detalleUso.detalleMovsEntregaRendir) mensajeDetalle += `• ${detalleUso.detalleMovsEntregaRendir} Detalle(s) Movimiento Entregar/Rendir\n`;

        // 🔍 PESCA
        if (detalleUso.descargasFaenaPesca) mensajeDetalle += `• ${detalleUso.descargasFaenaPesca} Descarga(s) de Faena Pesca\n`;
        if (detalleUso.descargasFaenaConsumo) mensajeDetalle += `• ${detalleUso.descargasFaenaConsumo} Descarga(s) de Faena Consumo\n`;
        if (detalleUso.comisionesFidelizacion) mensajeDetalle += `• ${detalleUso.comisionesFidelizacion} Comisión(es) de Fidelización\n`;
        if (detalleUso.detCuotasPesca) mensajeDetalle += `• ${detalleUso.detCuotasPesca} Detalle(s) Cuota de Pesca\n`;
        if (detalleUso.temporadasPesca) mensajeDetalle += `• ${detalleUso.temporadasPesca} Temporada(s) de Pesca\n`;

        // 🔍 MÓDULO FINANCIERO
        if (detalleUso.comprobantesElectronicos) mensajeDetalle += `• ${detalleUso.comprobantesElectronicos} Comprobante(s) Electrónico(s)\n`;
        if (detalleUso.cuentasPorCobrar) mensajeDetalle += `• ${detalleUso.cuentasPorCobrar} Cuenta(s) por Cobrar\n`;
        if (detalleUso.cuentasPorPagar) mensajeDetalle += `• ${detalleUso.cuentasPorPagar} Cuenta(s) por Pagar\n`;
        if (detalleUso.letrasCambio) mensajeDetalle += `• ${detalleUso.letrasCambio} Letra(s) de Cambio\n`;
        if (detalleUso.endososLetra) mensajeDetalle += `• ${detalleUso.endososLetra} Endoso(s) de Letra\n`;
        if (detalleUso.retenciones) mensajeDetalle += `• ${detalleUso.retenciones} Retención(es)\n`;
        if (detalleUso.percepciones) mensajeDetalle += `• ${detalleUso.percepciones} Percepción(es)\n`;
        if (detalleUso.detallesAsientos) mensajeDetalle += `• ${detalleUso.detallesAsientos} Detalle(s) de Asiento Contable\n`;
        if (detalleUso.tiposDeudaTributaria) mensajeDetalle += `• ${detalleUso.tiposDeudaTributaria} Tipo(s) de Deuda Tributaria\n`;

        // 🔍 OTROS MÓDULOS
        if (detalleUso.contratosServicio) mensajeDetalle += `• ${detalleUso.contratosServicio} Contrato(s) de Servicio\n`;
        if (detalleUso.accesosInstalacion) mensajeDetalle += `• ${detalleUso.accesosInstalacion} Acceso(s) a Instalación\n`;
        if (detalleUso.personalEnlazado) mensajeDetalle += `• ${detalleUso.personalEnlazado} Personal Enlazado\n`;
        if (detalleUso.tarifasRutaProveedor) mensajeDetalle += `• ${detalleUso.tarifasRutaProveedor} Tarifa(s) de Ruta Proveedor\n`;
        if (detalleUso.detContratistasOT) mensajeDetalle += `• ${detalleUso.detContratistasOT} Detalle(s) Contratista OT\n`;

        mensajeDetalle += `\n💡 Debe eliminar estos registros primero para poder eliminar la Entidad Comercial.`;

        toast.current?.show({
          severity: "warn",
          summary: "No se puede eliminar",
          detail: mensajeDetalle,
          life: 15000,
        });
      } else {
        // Error genérico
        const mensajeError = error.mensaje || error.message || "Error desconocido al eliminar";

        toast.current?.show({
          severity: "error",
          summary: "Error al Eliminar",
          detail: `No se pudo eliminar la Entidad Comercial.\n\n${mensajeError}`,
          life: 6000,
        });
      }
    }
  };

  const numeroDocumentoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", color: "#2563eb" }}>
        {rowData.numeroDocumento}
      </span>
    );
  };

  const razonSocialTemplate = (rowData) => {
    return (
      <span style={{ fontSize: "small", fontWeight: "bold" }}>
        {rowData.razonSocial}
      </span>
    );
  };

  const tipoTemplate = (rowData) => {
    const tipos = [];
    if (rowData.esCliente) tipos.push("Cliente");
    if (rowData.esProveedor) tipos.push("Proveedor");
    if (rowData.esCorporativo) tipos.push("Corporativo");

    return tipos.length > 0 ? tipos.join(", ") : "N/A";
  };

  const empresaTemplate = (rowData) => {
    return rowData.empresa?.razonSocial || rowData.empresa?.nombre || "N/A";
  };

  const tipoEntidadTemplate = (rowData) => {
    return rowData.tipoEntidad.nombre;
  };

  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado ? "Activo" : "Inactivo"}
        severity={rowData.estado ? "success" : "danger"}
      />
    );
  };

  const estadoActivoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estadoActivoSUNAT ? "Activo" : "Inactivo"}
        severity={rowData.estadoActivoSUNAT ? "success" : "danger"}
      />
    );
  };

  const condicionHabidoSUNATTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.condicionHabidoSUNAT ? "Habido" : "No Habido"}
        severity={rowData.condicionHabidoSUNAT ? "success" : "warning"}
      />
    );
  };

  const esAgenteRetencionTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esAgenteRetencion ? "Sí" : "No"}
        severity={rowData.esAgenteRetencion ? "danger" : "secondary"}
      />
    );
  };

  const accionesTemplate = (rowData) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        style={{ marginRight: 8 }}
        disabled={!permisos.puedeVer && !permisos.puedeEditar}
        onClick={() => {
          if (permisos.puedeVer || permisos.puedeEditar) {
            abrirDialogoEdicion(rowData);
          }
        }}
        tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        disabled={!permisos.puedeEliminar}
        onClick={() => {
          if (permisos.puedeEliminar) {
            confirmarEliminacion(rowData);
          }
        }}
        tooltip="Eliminar"
      />
    </div>
  );

  // Normalizar opciones para dropdowns
  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial || e.nombre,
    value: Number(e.id),
  }));

  const tiposEntidadOptions = tiposEntidad.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const formasPagoOptions = formasPago.map((f) => ({
    label: f.nombre,
    value: Number(f.id),
  }));

  const agenteRetencionOptions = [
    { label: "Todos", value: null },
    { label: "Sí", value: true },
    { label: "No", value: false },
  ];

  const header = (
    <div>
      <div
        style={{
          display: "flex",
          alignItems:"end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2>Entidades Comerciales</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nuevo"
            icon="pi pi-plus"
            raised
            tooltip="Nueva Entidad Comercial"
            className="p-button-success"
            onClick={abrirDialogoNuevo}
            disabled={!permisos.puedeCrear}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.25 }}>
          <Button
            icon="pi pi-refresh"
            onClick={async () => {
              await cargarDatosIniciales();
              toast.current?.show({
                severity: "success",
                summary: "Actualizado",
                detail: "Datos actualizados correctamente desde el servidor",
                life: 3000,
              });
            }}
            loading={loading}
            tooltip="Actualizar todos los datos desde el servidor"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.25 }}>
          <Button
            icon="pi pi-filter-slash"
            onClick={limpiarFiltros}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="filtroTipoEntidad">Filtro Tipo Entidad</label>
          <Dropdown
            value={filtroTipoEntidad}
            onChange={(e) => setFiltroTipoEntidad(e.value)}
            options={tiposEntidadOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por Tipo Entidad"
            showClear
            filter
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="filtroFormaPago">Filtro Forma Pago</label>
          <Dropdown
            value={filtroFormaPago}
            onChange={(e) => setFiltroFormaPago(e.value)}
            options={formasPagoOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por Forma Pago"
            showClear
            style={{ width: "100%" }}
            filter
          />
        </div>
                <div style={{ flex: 1, alignItems: "center", flexDirection: "column" }}>
          <label>Agente Retención</label>
          <Button
            label={
              filtroAgenteRetencion === null
                ? "Todos"
                : filtroAgenteRetencion === true
                ? "A/Retención"
                : "No A/Retención"
            }
            icon={
              filtroAgenteRetencion === null
                ? "pi pi-list"
                : filtroAgenteRetencion === true
                ? "pi pi-check-circle"
                : "pi pi-times-circle"
            }
            severity={
              filtroAgenteRetencion === null
                ? "secondary"
                : filtroAgenteRetencion === true
                ? "success"
                : "danger"
            }
            onClick={() => {
              if (filtroAgenteRetencion === null) {
                setFiltroAgenteRetencion(true);
              } else if (filtroAgenteRetencion === true) {
                setFiltroAgenteRetencion(false);
              } else {
                setFiltroAgenteRetencion(null);
              }
            }}
            style={{ width: "100%", fontWeight: "bold" }}
            raised
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <DataTable
        value={entidadesFiltradas}
        loading={loading}
        size="small"
        showGridlines
        stripedRows
        paginator
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 320]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos de contrato"
        sortField="id"
        sortOrder={-1}
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        onRowClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => abrirDialogoEdicion(e.data)
            : undefined
        }
        selectionMode="single"
        emptyMessage="No se encontraron entidades comerciales"
        header={header}
        globalFilter={globalFilter}
        scrollable
      >
        <Column field="id" header="ID" sortable />
        <Column
          field="empresaId"
          header="Empresa"
          body={empresaTemplate}
          sortable
        />
        <Column
          field="tipoEntidadId"
          header="Tipo Entidad"
          body={tipoEntidadTemplate}
          style={{ width: "5rem" }}
          sortable
        />
        <Column
          field="numeroDocumento"
          header="N° Documento"
          body={numeroDocumentoTemplate}
          sortable
        />
        <Column
          field="razonSocial"
          header="Razón Social"
          body={razonSocialTemplate}
          style={{ width: "15rem" }}
          sortable
        />
        <Column header="Tipo" body={tipoTemplate} sortable />
        <Column field="estado" header="Estado" body={estadoTemplate} sortable />
        <Column
          field="estadoActivoSUNAT"
          header="Activo SUNAT"
          body={estadoActivoSUNATTemplate}
          sortable
        />
        <Column
          field="condicionHabidoSUNAT"
          header="Habido SUNAT"
          body={condicionHabidoSUNATTemplate}
          sortable
        />
        <Column
          field="esAgenteRetencion"
          header="Agente Retención"
          body={esAgenteRetencionTemplate}
          sortable
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem" }}
        />
      </DataTable>

      <Dialog
        header={
          entidadSeleccionada && entidadSeleccionada.id
            ? `Editar Entidad Comercial - ID: ${entidadSeleccionada.id}`
            : "Nueva Entidad Comercial"
        }
        visible={dialogVisible}
        onHide={cerrarDialogo}
        style={{ width: "1350px" }}
        modal
      >
        <EntidadComercialForm
          entidadComercial={entidadSeleccionada}
          empresaIdForzada={empresaIdSelector}
          onGuardar={onGuardarExitoso}
          onCancelar={cerrarDialogo}
          toast={toast}
          modoEdicion={modoEdicion}
          readOnly={
            (modoEdicion && !permisos.puedeEditar) ||
            (!modoEdicion && !permisos.puedeCrear)
          }
          loading={formLoading}
          permisos={permisos}
        />
      </Dialog>
      <ConfirmDialog />
    </div>
  );
};

export default EntidadComercial;
