import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import CuentaCorrienteForm from "../components/cuentaCorriente/CuentaCorrienteForm";
import {
  getAllCuentaCorriente,
  eliminarCuentaCorriente,
  verificarMovimientosCuenta,
} from "../api/cuentaCorriente";
import { getUltimoSaldoCuenta } from "../api/saldoCuentaCorriente";
import { getEmpresas } from "../api/empresa";
import { getBancos } from "../api/banco";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { usePermissions } from "../hooks/usePermissions";
import { getResponsiveFontSize } from "../utils/utils";
// Agregar después de los otros imports
import ReportesCuentaCorriente from "../components/cuentaCorriente/ReportesCuentaCorriente";

const CuentaCorriente = ({ ruta }) => {
  const toast = useRef(null);
  const user = useAuthStore((state) => state.user);
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  // Agregar con los otros estados (alrededor de la línea 30)
  const [showReportesDialog, setShowReportesDialog] = useState(false);
  // Verificar acceso al módulo
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [cuentas, setCuentas] = useState([]);
  const [todasLasCuentas, setTodasLasCuentas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [cuentaEditadaId, setCuentaEditadaId] = useState(null);

  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState(null);
  const [bancoFiltro, setBancoFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [filtroSaldo, setFiltroSaldo] = useState("CON_SALDO"); // ✅ NUEVO: Por defecto muestra con saldo
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (empresas.length > 0) {
      cargarCuentas();
    }
  }, [empresas.length]);

  useEffect(() => {
    if (todasLasCuentas.length > 0) {
      aplicarFiltros();
    }
  }, [empresaFiltro, bancoFiltro, estadoFiltro, filtroSaldo]); // ✅ Agregado filtroSaldo

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [empresasData, bancosData] = await Promise.all([
        getEmpresas(),
        getBancos(),
      ]);
      setEmpresas(empresasData);
      setBancos(bancosData);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos iniciales",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      // ✅ El backend YA envía saldoActual calculado
      const cuentasData = await getAllCuentaCorriente();

      setTodasLasCuentas(cuentasData);
      aplicarFiltros(cuentasData);
    } catch (error) {
      console.error("Error al cargar cuentas:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar cuentas corrientes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (cuentasBase = todasLasCuentas) => {
    let cuentasFiltradas = [...cuentasBase];

    // Aplicar filtros
    if (empresaFiltro) {
      cuentasFiltradas = cuentasFiltradas.filter(
        (c) => Number(c.empresaId) === Number(empresaFiltro),
      );
    }

    if (bancoFiltro) {
      cuentasFiltradas = cuentasFiltradas.filter(
        (c) => Number(c.bancoId) === Number(bancoFiltro),
      );
    }

    if (estadoFiltro === "ACTIVAS") {
      cuentasFiltradas = cuentasFiltradas.filter(
        (c) => c.activa === true && !c.fechaCierre,
      );
    } else if (estadoFiltro === "CERRADAS") {
      cuentasFiltradas = cuentasFiltradas.filter((c) => c.fechaCierre !== null);
    } else if (estadoFiltro === "INACTIVAS") {
      cuentasFiltradas = cuentasFiltradas.filter((c) => c.activa === false);
    }

    // ✅ NUEVO: Filtro por saldo
    if (filtroSaldo === "CON_SALDO") {
      cuentasFiltradas = cuentasFiltradas.filter(
        (c) => Number(c.saldoActual || 0) > 0,
      );
    } else if (filtroSaldo === "SIN_SALDO") {
      cuentasFiltradas = cuentasFiltradas.filter(
        (c) => Number(c.saldoActual || 0) <= 0,
      );
    }
    // Si es "TODAS", no filtra

    setCuentas(cuentasFiltradas);

    // Mostrar mensaje con cantidad de registros
    if (empresaFiltro || bancoFiltro || estadoFiltro !== "TODOS") {
      toast.current.show({
        severity: "info",
        summary: "Filtros Aplicados",
        detail: `Se encontraron ${cuentasFiltradas.length} registro(s)`,
        life: 2000,
      });
    }
  };


  // ✅ NUEVO: Función para ciclar entre estados del filtro de saldo
  const toggleFiltroSaldo = () => {
    const estados = ["CON_SALDO", "SIN_SALDO", "TODAS"];
    const indiceActual = estados.indexOf(filtroSaldo);
    const siguienteIndice = (indiceActual + 1) % estados.length;
    setFiltroSaldo(estados[siguienteIndice]);
  };

  // ✅ NUEVO: Configuración del botón según el estado
  const getConfigFiltroSaldo = () => {
    switch (filtroSaldo) {
      case "CON_SALDO":
        return {
          label: "Con Saldo",
          icon: "pi pi-check-circle",
          severity: "success",
          tooltip: "Mostrando cuentas con saldo > 0. Click para ver sin saldo",
        };
      case "SIN_SALDO":
        return {
          label: "Sin Saldo",
          icon: "pi pi-times-circle",
          severity: "danger",
          tooltip: "Mostrando cuentas con saldo ≤ 0. Click para ver todas",
        };
      case "TODAS":
        return {
          label: "Todas",
          icon: "pi pi-list",
          severity: "info",
          tooltip: "Mostrando todas las cuentas. Click para ver solo con saldo",
        };
      default:
        return {
          label: "Con Saldo",
          icon: "pi pi-check-circle",
          severity: "success",
          tooltip: "Mostrando cuentas con saldo > 0",
        };
    }
  };


  const handleNuevo = () => {
    if (!permisos.puedeCrear) {
      toast.current.show({
        severity: "warn",
        summary: "Sin Permisos",
        detail: "No tiene permisos para crear cuentas corrientes",
        life: 3000,
      });
      return;
    }
    setSelectedCuenta(null);
    setIsEdit(false);
    setShowForm(true);
  };

  const handleEdit = (cuenta) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current.show({
        severity: "warn",
        summary: "Sin Permisos",
        detail: "No tiene permisos para ver o editar cuentas corrientes",
        life: 3000,
      });
      return;
    }
    setSelectedCuenta(cuenta);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDelete = async (cuenta) => {
    if (!permisos.puedeEliminar) {
      toast.current.show({
        severity: "warn",
        summary: "Sin Permisos",
        detail: "No tiene permisos para eliminar cuentas corrientes",
        life: 3000,
      });
      return;
    }

    try {
      // Verificar si tiene movimientos
      const tieneMovimientos = await verificarMovimientosCuenta(cuenta.id);

      if (tieneMovimientos) {
        toast.current.show({
          severity: "error",
          summary: "No se puede eliminar",
          detail:
            "La cuenta tiene movimientos registrados. No se puede eliminar.",
          life: 5000,
        });
        return;
      }

      // Verificar si tiene saldo > 0
      if (cuenta.saldoActual > 0) {
        confirmDialog({
          message: `La cuenta tiene un saldo de ${cuenta.moneda?.simbolo} ${cuenta.saldoActual.toLocaleString(
            "es-PE",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          )}. ¿Está seguro de eliminar?`,
          header: "Advertencia - Cuenta con Saldo",
          icon: "pi pi-exclamation-triangle",
          acceptClassName: "p-button-danger",
          accept: () => confirmarEliminacion(cuenta.id),
        });
        return;
      }

      // Confirmar eliminación normal
      confirmDialog({
        message: `¿Está seguro de eliminar la cuenta ${cuenta.numeroCuenta} del banco ${cuenta.banco?.nombre}?`,
        header: "Confirmar Eliminación",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: () => confirmarEliminacion(cuenta.id),
      });
    } catch (error) {
      console.error("Error al verificar cuenta:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al verificar la cuenta",
        life: 3000,
      });
    }
  };

  const confirmarEliminacion = async (id) => {
    try {
      await eliminarCuentaCorriente(id);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cuenta corriente eliminada correctamente",
        life: 3000,
      });
      cargarCuentas();
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.mensaje || "Error al eliminar cuenta",
        life: 3000,
      });
    }
  };

  const handleLimpiarFiltros = () => {
    setEmpresaFiltro(null);
    setBancoFiltro(null);
    setEstadoFiltro("TODOS");
    setFiltroSaldo("CON_SALDO"); // ✅ Resetear a valor por defecto
    toast.current.show({
      severity: "success",
      summary: "Filtros Limpiados",
      detail: `Mostrando todos los registros (${todasLasCuentas.length})`,
      life: 2000,
    });
  };

  const handleFormClose = async (reload, cuentaId = null) => {
    setShowForm(false);
    const cuentaEditada = selectedCuenta;
    setSelectedCuenta(null);
    setIsEdit(false);

    if (reload) {
      if (cuentaEditada && isEdit) {
        // Si es edición, actualizar solo ese registro sin recargar toda la lista
        try {
          setLoading(true);
          const cuentaActualizada = await getAllCuentaCorriente();
          const cuentaConSaldo = cuentaActualizada.find(
            (c) => c.id === cuentaEditada.id,
          );

          if (cuentaConSaldo) {
            // Cargar saldo actualizado
            try {
              const ultimoSaldo = await getUltimoSaldoCuenta(cuentaConSaldo.id);
              cuentaConSaldo.saldoActual = ultimoSaldo?.saldoActual || 0;
            } catch (error) {
              console.error("Error al cargar saldo:", error);
              cuentaConSaldo.saldoActual = 0;
            }

            // Actualizar en todasLasCuentas
            const nuevasTodasCuentas = todasLasCuentas.map((c) =>
              c.id === cuentaEditada.id ? cuentaConSaldo : c,
            );
            setTodasLasCuentas(nuevasTodasCuentas);

            // Actualizar en cuentas (lista filtrada) manteniendo el orden
            const nuevasCuentas = cuentas.map((c) =>
              c.id === cuentaEditada.id ? cuentaConSaldo : c,
            );
            setCuentas(nuevasCuentas);

            // Resaltar el registro editado
            setCuentaEditadaId(cuentaEditada.id);
            setTimeout(() => {
              setCuentaEditadaId(null);
            }, 3000);

            toast.current.show({
              severity: "success",
              summary: "Actualizado",
              detail: "Cuenta corriente actualizada correctamente",
              life: 2000,
            });
          }
        } catch (error) {
          console.error("Error al actualizar cuenta:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Error al actualizar la cuenta",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Si es creación, recargar toda la lista
        cargarCuentas();
      }
    }
  };

  // Función para resaltar la fila editada
  const rowClassName = (rowData) => {
    return rowData.id === cuentaEditadaId ? "row-edited-highlight" : "";
  };

  // Templates
  const empresaTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.empresa?.razonSocial || "-"}
      </span>
    );
  };

  const bancoTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>
        {rowData.banco?.nombre || "-"}
      </span>
    );
  };

  const numeroCuentaTemplate = (rowData) => {
    return (
      <div>
        {rowData.descripcion && (
          <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1f2937", textTransform: "uppercase" }}>
            {rowData.descripcion}
          </div>
        )}
        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#111827" }}>
          {rowData.numeroCuenta}
        </div>
        {rowData.numeroCuentaCCI && (
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
            CCI: {rowData.numeroCuentaCCI}
          </div>
        )}
      </div>
    );
  };

  const monedaTemplate = (rowData) => {
    // ✅ OPTIMIZADO: Usar colorFondo dinámico desde base de datos
    const colorFondo = rowData.moneda?.colorFondo || "#e2e3e5";

    return (
      <Tag
        value={rowData.moneda?.simbolo || "-"}
        style={{
          backgroundColor: colorFondo,
          color: "#000",
          fontWeight: "bold",
          border: `1px solid ${colorFondo}`,
        }}
      />
    );
  };

  const saldoActualTemplate = (rowData) => {
    const saldo = Number(rowData.saldoActual || 0);
    const saldoMin = Number(rowData.saldoMinimo || 0);

    // ✅ OPTIMIZADO: Usar colorFondo dinámico desde base de datos
    const colorFondo = rowData.moneda?.colorFondo || "#e2e3e5";

    let color = "#22c55e";
    let icon = "pi-check-circle";
    let severity = "success";

    if (saldo < saldoMin) {
      color = "#ef4444";
      icon = "pi-exclamation-triangle";
      severity = "danger";
    } else if (saldo < saldoMin * 1.2) {
      color = "#f59e0b";
      icon = "pi-info-circle";
      severity = "warning";
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end", // ✅ AGREGAR: Alinea el contenido a la derecha
          gap: "8px",
          backgroundColor: colorFondo,
          padding: "8px 12px",
          borderRadius: "6px",
          border: `2px solid ${colorFondo}`,
        }}
      >
        <i className={`pi ${icon}`} style={{ color, fontSize: "1.1rem" }} />
        <span style={{ color, fontWeight: "bold", fontSize: "18px" }}>
          {rowData.moneda?.simbolo}{" "}
          {saldo.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    if (rowData.fechaCierre) {
      return (
        <Tag
          value="CERRADA"
          severity="danger"
          icon="pi pi-lock"
          style={{ fontWeight: "bold" }}
        />
      );
    }
    if (!rowData.activa) {
      return (
        <Tag
          value="INACTIVA"
          severity="warning"
          icon="pi pi-pause"
          style={{ fontWeight: "bold" }}
        />
      );
    }
    return (
      <Tag
        value="ACTIVA"
        severity="success"
        icon="pi pi-check"
        style={{ fontWeight: "bold" }}
      />
    );
  };

  const cuentaContableTemplate = (rowData) => {
    if (rowData.cuentaContable) {
      return (
        <div>
          <i
            className="pi pi-check-circle"
            style={{ color: "#22c55e", marginRight: "8px" }}
          />
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>
            {rowData.cuentaContable.codigoCuenta}
          </span>
        </div>
      );
    }
    return (
      <div>
        <i
          className="pi pi-exclamation-triangle"
          style={{ color: "#f59e0b", marginRight: "8px" }}
        />
        <span style={{ fontSize: "11px", color: "#6b7280" }}>Sin vincular</span>
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div
        style={{ display: "flex", gap: "8px", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => handleEdit(rowData)}
          tooltip={permisos.puedeEditar ? "Editar" : "Ver"}
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={!permisos.puedeEliminar}
        />
      </div>
    );
  };

  // Options para filtros dinámicos
  const empresasOptions = [
    { label: "Todas las empresas", value: null },
    ...empresas.map((e) => ({
      label: e.razonSocial,
      value: Number(e.id),
    })),
  ];

  // Filtrar bancos dinámicamente según empresa seleccionada
  const getBancosDisponibles = () => {
    if (!empresaFiltro) {
      return bancos;
    }
    const bancosIds = new Set(
      todasLasCuentas
        .filter((c) => Number(c.empresaId) === Number(empresaFiltro))
        .map((c) => Number(c.bancoId)),
    );
    return bancos.filter((b) => bancosIds.has(Number(b.id)));
  };

  const bancosOptions = [
    { label: "Todos los bancos", value: null },
    ...getBancosDisponibles().map((b) => ({
      label: b.nombre,
      value: Number(b.id),
    })),
  ];

  // Filtrar estados dinámicamente según filtros aplicados
  const getEstadosDisponibles = () => {
    let cuentasParaEstados = todasLasCuentas;

    if (empresaFiltro) {
      cuentasParaEstados = cuentasParaEstados.filter(
        (c) => Number(c.empresaId) === Number(empresaFiltro),
      );
    }

    if (bancoFiltro) {
      cuentasParaEstados = cuentasParaEstados.filter(
        (c) => Number(c.bancoId) === Number(bancoFiltro),
      );
    }

    const tieneActivas = cuentasParaEstados.some(
      (c) => c.activa === true && !c.fechaCierre,
    );
    const tieneCerradas = cuentasParaEstados.some(
      (c) => c.fechaCierre !== null,
    );
    const tieneInactivas = cuentasParaEstados.some((c) => c.activa === false);

    const estados = [{ label: "Todos", value: "TODOS" }];
    if (tieneActivas) estados.push({ label: "Activas", value: "ACTIVAS" });
    if (tieneCerradas) estados.push({ label: "Cerradas", value: "CERRADAS" });
    if (tieneInactivas)
      estados.push({ label: "Inactivas", value: "INACTIVAS" });

    return estados;
  };

  const estadosOptions = getEstadosDisponibles();

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        {/* Header */}
        {/* Filtros */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
            alignItems: "end",
            fontSize: getResponsiveFontSize(),
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <h2>
              <i className="pi pi-wallet" />
              Cuentas Corrientes
            </h2>

            <span
              style={{
                marginRight: "1rem",
                fontSize: "small",
                fontWeight: "bold",
              }}
            >
              <i className="pi pi-list" /> Registros mostrados {cuentas.length}
            </span>
            {(empresaFiltro || bancoFiltro || estadoFiltro !== "TODOS") && (
              <Tag
                severity="info"
                value={`Total sin filtros: ${todasLasCuentas.length}`}
                icon="pi pi-filter"
              />
            )}
          </div>
          <div style={{ flex: 0.5 }}>
            <Button
              label="Nuevo"
              icon="pi pi-plus"
              severity="success"
              onClick={handleNuevo}
              disabled={!permisos.puedeCrear}
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="globalFilter">Buscar</label>
            <span className="p-input-icon-left" style={{ width: "100%" }}>
              <InputText
                id="globalFilter"
                value={globalFilterValue}
                onChange={(e) => setGlobalFilterValue(e.target.value)}
                placeholder="Buscar por cuenta, descripción o CCI..."
                style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              />
            </span>
          </div>

          <div style={{ flex: 0.5 }}>
            {/* ⭐ NUEVO BOTÓN REPORTES */}
            <Button
              label="Reportes"
              icon="pi pi-file-pdf"
              severity="info"
              onClick={() => setShowReportesDialog(true)}
              disabled={!permisos.puedeVer}
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="empresaFiltro"
            >
              Filtrar por Empresa
            </label>
            <Dropdown
              id="empresaFiltro"
              value={empresaFiltro}
              options={empresasOptions}
              onChange={(e) => setEmpresaFiltro(e.value)}
              placeholder="Seleccionar empresa"
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              filter
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="bancoFiltro"
            >
              Filtrar por Banco
            </label>
            <Dropdown
              id="bancoFiltro"
              value={bancoFiltro}
              options={bancosOptions}
              onChange={(e) => setBancoFiltro(e.value)}
              placeholder="Todos los bancos"
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              filter
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="estadoFiltro"
            >
              Filtrar por Estado
            </label>
            <Dropdown
              id="estadoFiltro"
              value={estadoFiltro}
              options={estadosOptions}
              onChange={(e) => setEstadoFiltro(e.value)}
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label={getConfigFiltroSaldo().label}
              icon={getConfigFiltroSaldo().icon}
              onClick={toggleFiltroSaldo}
              severity={getConfigFiltroSaldo().severity}
              tooltip={getConfigFiltroSaldo().tooltip}
              tooltipOptions={{ position: "top" }}
              style={{ width: "100%", fontWeight: "bold", fontSize: getResponsiveFontSize() }}
            />
          </div>
          <div style={{ flex: 0.1 }}>
            <Button
              icon="pi pi-filter-slash"
              onClick={handleLimpiarFiltros}
              severity="secondary"
              tooltip="Limpiar todos los filtros"
              tooltipOptions={{ position: "top" }}
              size="small"
            />
          </div>
          <div style={{ flex: 0.1 }}>
            <Button
              icon="pi pi-refresh"
              onClick={cargarCuentas}
              severity="info"
              tooltip="Actualizar"
              tooltipOptions={{ position: "top" }}
              size="small"
            />
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          value={cuentas}
          loading={loading}
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 80, 120]}
          emptyMessage="No hay cuentas corrientes registradas"
          globalFilter={globalFilterValue}
          globalFilterFields={[
            "numeroCuenta",
            "descripcion",
            "numeroCuentaCCI",
            "banco.nombre",
            "empresa.razonSocial",
          ]}
          style={{
            fontSize: getResponsiveFontSize(),
            cursor:
              permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          }}
          stripedRows
          showGridlines
          selectionMode="single"
          onRowClick={
            permisos.puedeVer || permisos.puedeEditar
              ? (e) => handleEdit(e.data)
              : undefined
          }
          rowHover
          className={
            permisos.puedeVer || permisos.puedeEditar ? "cursor-pointer" : ""
          }
          rowClassName={rowClassName}
          size="small"
        >
          <Column field="id" header="ID" sortable />
          <Column
            field="empresa.razonSocial"
            header="Empresa"
            body={empresaTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="tipoCuentaCorriente.nombre"
            header="Tipo Cuenta"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="banco.nombre"
            header="Banco"
            body={bancoTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="numeroCuenta"
            header="Número Cuenta"
            body={numeroCuentaTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="moneda.simbolo"
            header="Moneda"
            body={monedaTemplate}
            sortable
            style={{ width: "100px", textAlign: "center" }}
          />
          <Column
            field="saldoActual"
            header="Saldo Actual"
            body={saldoActualTemplate}
            sortable
            style={{ minWidth: "150px", textAlign: "right" }}
          />
          <Column
            field="cuentaContable"
            header="Cta. Contable"
            body={cuentaContableTemplate}
            style={{ width: "130px", textAlign: "center" }}
          />
          <Column
            field="activa"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "200px", textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Formulario */}
      <Dialog
        visible={showForm}
        onHide={() => handleFormClose(false)}
        header={isEdit ? "Editar Cuenta Corriente" : "Nueva Cuenta Corriente"}
        style={{ width: "90vw", maxWidth: "1200px" }}
        maximizable
      >
        <CuentaCorrienteForm
          cuenta={selectedCuenta}
          isEdit={isEdit}
          onClose={handleFormClose}
          toast={toast}
        />
      </Dialog>
      {/* ⭐ COMPONENTE DE REPORTES */}
      <ReportesCuentaCorriente
        visible={showReportesDialog}
        onHide={() => setShowReportesDialog(false)}
        cuentas={cuentas}
        empresas={empresas}
        bancos={bancos}
        filtros={{
          empresaFiltro,
          bancoFiltro,
          estadoFiltro,
        }}
      />
    </div>
  );
};

export default CuentaCorriente;

// Estilos CSS para resaltar la fila editada
const style = document.createElement("style");
style.textContent = `
  .row-edited-highlight {
    background-color: #d1fae5 !important;
    animation: highlight-fade 3s ease-in-out;
  }
  
  @keyframes highlight-fade {
    0% {
      background-color: #10b981;
    }
    50% {
      background-color: #d1fae5;
    }
    100% {
      background-color: transparent;
    }
  }
  
  .row-edited-highlight td {
    font-weight: bold !important;
  }
`;
if (!document.querySelector("style[data-cuenta-corriente-highlight]")) {
  style.setAttribute("data-cuenta-corriente-highlight", "true");
  document.head.appendChild(style);
}
