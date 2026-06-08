// src/pages/contabilidad/AsientoContable.jsx
import React, { useRef, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import AsientoContableForm from "../../components/contabilidad/asientoContable/AsientoContableForm";
import {
  getAsientoContable,
  getAsientoContableById,
  deleteAsientoContable,
  aprobarAsiento,
  anularAsiento,
  unirAsientos,
} from "../../api/contabilidad/asientoContable";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getMonedas } from "../../api/moneda";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getResponsiveFontSize } from "../../utils/utils";
import { generarKardexValorizado } from "../../api/contabilidad/kardexValorizado";

export default function AsientoContable({ ruta }) {
  const { usuario } = useAuthStore();
  const permisos = usePermissions(ruta);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const toast = useRef(null);
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState(null);
  const [periodoFilter, setPeriodoFilter] = useState(null);
  const [periodosFiltrados, setPeriodosFiltrados] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmState, setConfirmState] = useState({
    visible: false,
    row: null,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexAnio, setKardexAnio] = useState(new Date().getFullYear());
  const [kardexMes, setKardexMes] = useState(new Date().getMonth() + 1);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [showUnirDialog, setShowUnirDialog] = useState(false);
  const [validacionUnir, setValidacionUnir] = useState(null);
  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarItems();
  }, [items, empresaFilter, periodoFilter, estadoFilter, rangoFechas]);

  useEffect(() => {
    filtrarPeriodosPorEmpresa();
  }, [empresaFilter, periodos]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [
        asientosData,
        empresasData,
        periodosData,
        estadosData,
        monedasData,
      ] = await Promise.all([
        getAsientoContable(),
        getEmpresas(),
        getPeriodosContables(),
        getEstadosMultiFuncionPorTipoProviene(20),
        getMonedas(),
      ]);
      setItems(asientosData);
      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setEstados(estadosData);
      setMonedas(monedasData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrarPeriodosPorEmpresa = () => {
    if (empresaFilter) {
      const periodosDeLaEmpresa = periodos.filter(
        (p) => Number(p.empresaId) === Number(empresaFilter),
      );
      setPeriodosFiltrados(periodosDeLaEmpresa);
    } else {
      setPeriodosFiltrados(periodos);
    }
  };

  const filtrarItems = () => {
    let filtrados = [...items];

    if (empresaFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaFilter),
      );
    }

    if (periodoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.periodoContableId) === Number(periodoFilter),
      );
    }

    if (estadoFilter) {
      filtrados = filtrados.filter(
        (item) => Number(item.estadoId) === Number(estadoFilter),
      );
    }

    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaAsiento = new Date(item.fechaAsiento);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        // Si hay fecha fin, filtrar por rango
        if (rangoFechas[1]) {
          const fechaFinDia = new Date(rangoFechas[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaAsiento >= fechaIni && fechaAsiento <= fechaFinDia;
        }

        // Si solo hay fecha inicio, filtrar desde esa fecha
        return fechaAsiento >= fechaIni;
      });
    }
    setItemsFiltrados(filtrados);
  };

  const onNew = () => {
    if (!permisos.puedeCrear) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para crear registros.",
        life: 3000,
      });
      return;
    }
    if (!empresaFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
        life: 3000,
      });
      return;
    }
    if (!periodoFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un período contable primero",
        life: 3000,
      });
      return;
    }
    setSelected(null);
    setIsEdit(false);
    setShowDialog(true);
  };

  const onEdit = async (rowData) => {
    if (!permisos.puedeVer && !permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para ver o editar registros.",
        life: 3000,
      });
      return;
    }

    try {
      const asientoCompleto = await getAsientoContableById(rowData.id);
      setSelected(asientoCompleto);
      setIsEdit(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error al cargar asiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el asiento contable",
        life: 3000,
      });
    }
  };

  const recargarAsientoActual = async () => {
    if (!selected?.id) return;

    try {
      const asientoActualizado = await getAsientoContableById(selected.id);
      setSelected(asientoActualizado);
      await cargarDatos();
    } catch (error) {
      console.error("Error al recargar asiento:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al recargar el asiento contable",
        life: 3000,
      });
    }
  };

  const onDelete = (rowData) => {
    if (!permisos.puedeEliminar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para eliminar registros.",
        life: 3000,
      });
      return;
    }
    setConfirmState({ visible: true, row: rowData });
  };

  const handleConfirmDelete = async () => {
    const row = confirmState.row;
    if (!row) return;
    setConfirmState({ visible: false, row: null });
    setLoading(true);
    try {
      await deleteAsientoContable(row.id);
      toast.current?.show({
        severity: "success",
        summary: "Asiento eliminado",
        detail: `El asiento ${row.numeroAsiento} fue eliminado correctamente.`,
        life: 3000,
      });
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          "No se pudo eliminar el asiento contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = async () => {
    setShowDialog(false);
    setSelected(null);
    setIsEdit(false);
    // Recargar la lista al cerrar para reflejar los cambios guardados
    await cargarDatos();
  };

  const onSubmit = async (data) => {
    if (isEdit && !permisos.puedeEditar) {
      return;
    }
    if (!isEdit && !permisos.puedeCrear) {
      return;
    }

    setLoading(true);
    try {
      await data;
      toast.current?.show({
        severity: "success",
        summary: isEdit ? "Asiento actualizado" : "Asiento creado",
        detail: isEdit
          ? "El asiento contable fue actualizado correctamente."
          : "El asiento contable fue creado correctamente.",
        life: 3000,
      });

      // Cerrar diálogo y recargar lista tanto en creación como en edición
      setShowDialog(false);
      setSelected(null);
      setIsEdit(false);
      await cargarDatos();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el asiento contable.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para aprobar asientos.",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "aprobar",
    });
  };

  const handleAnular = async (item) => {
    if (!permisos.puedeEditar) {
      toast.current?.show({
        severity: "warn",
        summary: "Acceso Denegado",
        detail: "No tiene permisos para anular asientos.",
        life: 3000,
      });
      return;
    }

    setConfirmState({
      visible: true,
      row: item,
      action: "anular",
    });
  };

  const handleConfirmAction = async () => {
    const { row, action } = confirmState;
    if (!row) return;

    setConfirmState({ visible: false, row: null });
    setLoading(true);

    try {
      if (action === "aprobar") {
        await aprobarAsiento(row.id, usuario.personalId);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Asiento contable aprobado correctamente",
          life: 3000,
        });
      } else if (action === "anular") {
        await anularAsiento(row.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Asiento contable anulado correctamente",
          life: 3000,
        });
      }

      // Recargar lista
      await cargarDatos();

      // Si estamos en el formulario, recargar el asiento actual
      if (selected?.id === row.id) {
        await recargarAsientoActual();
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || `Error al ${action} asiento`,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaFilter(null);
    setPeriodoFilter(null);
    setEstadoFilter(null);
    setRangoFechas(null);
    setGlobalFilter("");
  };

  const validarAsientosParaUnir = (asientos) => {
    // Validación 1: Cantidad mínima
    if (!asientos || asientos.length < 2) {
      return {
        valido: false,
        errores: ["Debe seleccionar al menos 2 asientos para unir."],
      };
    }

    const errores = [];
    const primer = asientos[0];

    // Validación 2: Estados
    const asientosNoPendientes = asientos.filter(
      (a) => a.estado?.descripcion !== "PENDIENTE",
    );
    if (asientosNoPendientes.length > 0) {
      errores.push(
        `Estados: ${asientosNoPendientes.map((a) => `#${a.numeroAsiento} es ${a.estado?.descripcion}`).join(", ")} (debe ser PENDIENTE)`,
      );
    }

    // Validación 3: Empresas
    const asientosDiferenteEmpresa = asientos.filter(
      (a) => Number(a.empresaId) !== Number(primer.empresaId),
    );
    if (asientosDiferenteEmpresa.length > 0) {
      errores.push(
        `Empresas: ${asientosDiferenteEmpresa.map((a) => `#${a.numeroAsiento} es ${a.empresa?.razonSocial}`).join(", ")} (debe ser ${primer.empresa?.razonSocial})`,
      );
    }

    // Validación 4: Períodos
    const asientosDiferentePeriodo = asientos.filter(
      (a) => Number(a.periodoContableId) !== Number(primer.periodoContableId),
    );
    if (asientosDiferentePeriodo.length > 0) {
      errores.push(
        `Períodos: ${asientosDiferentePeriodo.map((a) => `#${a.numeroAsiento} es ${a.periodoContable?.nombrePeriodo}`).join(", ")} (debe ser ${primer.periodoContable?.nombrePeriodo})`,
      );
    }

    // Validación 5: Glosas
    const asientosDiferenteGlosa = asientos.filter(
      (a) => a.glosa !== primer.glosa,
    );
    if (asientosDiferenteGlosa.length > 0) {
      errores.push(
        `Glosas: ${asientosDiferenteGlosa.map((a) => `#${a.numeroAsiento} es "${a.glosa}"`).join(", ")} (debe ser "${primer.glosa}")`,
      );
    }

    return {
      valido: errores.length === 0,
      errores,
      asientoPrincipal: primer,
      asientosAEliminar: asientos.slice(1),
      totalDetalles: asientos.reduce(
        (sum, a) => sum + (a.detalles?.length || 0),
        0,
      ),
    };
  };

  const handleUnirAsientos = () => {
    if (asientosSeleccionados.length < 2) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar al menos 2 asientos para unir",
        life: 3000,
      });
      return;
    }

    const validacion = validarAsientosParaUnir(asientosSeleccionados);
    setValidacionUnir(validacion);
    setShowUnirDialog(true);
  };

  const handleConfirmUnir = async () => {
    if (!validacionUnir || !validacionUnir.valido) {
      return;
    }

    setShowUnirDialog(false);
    setLoading(true);

    try {
      const asientoIds = asientosSeleccionados.map((a) => Number(a.id));
      await unirAsientos(asientoIds, usuario.personalId);

      toast.current?.show({
        severity: "success",
        summary: "Asientos Unidos",
        detail: `Se unieron ${asientosSeleccionados.length} asientos exitosamente. ${validacionUnir.totalDetalles} detalles ahora en Asiento #${validacionUnir.asientoPrincipal.numeroAsiento}`,
        life: 5000,
      });

      setAsientosSeleccionados([]);
      setValidacionUnir(null);
      await cargarDatos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al unir asientos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarKardexValorizado = () => {
    if (!empresaFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa primero",
        life: 3000,
      });
      return;
    }
    if (!periodoFilter) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un período contable primero",
        life: 3000,
      });
      return;
    }
    setShowKardexDialog(true);
  };

  const handleConfirmKardexValorizado = async () => {
    setShowKardexDialog(false);
    setKardexLoading(true);

    try {
      const resultado = await generarKardexValorizado({
        empresaId: empresaFilter,
        anio: kardexAnio,
        mes: kardexMes,
      });

      toast.current?.show({
        severity: "success",
        summary: "Kardex Valorizado Generado",
        detail: `Se generó el asiento de valorización para ${kardexMes}/${kardexAnio}`,
        life: 3000,
      });

      await cargarDatos();

      if (resultado.asientoId) {
        const asientoGenerado = await getAsientoContableById(
          resultado.asientoId,
        );
        setSelected(asientoGenerado);
        setIsEdit(true);
        setShowDialog(true);
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al generar kardex valorizado",
        life: 3000,
      });
    } finally {
      setKardexLoading(false);
    }
  };

  const estadoBodyTemplate = (rowData) => {
    const estado = rowData.estado?.descripcion || "";
    let severity = "info";
    if (estado === "PENDIENTE") severity = "warning";
    if (estado === "APROBADO") severity = "success";
    if (estado === "ANULADO") severity = "danger";

    return <Tag value={estado} severity={severity} />;
  };

  const cuadradoBodyTemplate = (rowData) => {
    const diferencia = Number(rowData.diferencia || 0);
    const estaCuadrado = rowData.estaCuadrado;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Tag
          value={estaCuadrado ? "CUADRADO" : "DESCUADRADO"}
          severity={estaCuadrado ? "success" : "danger"}
          icon={estaCuadrado ? "pi pi-check-circle" : "pi pi-times-circle"}
          style={{ fontWeight: "bold" }}
        />
        {!estaCuadrado && diferencia !== 0 && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "#ef4444",
              fontWeight: "bold",
            }}
          >
            Dif:{" "}
            {new Intl.NumberFormat("es-PE", {
              style: "currency",
              currency: "PEN",
            }).format(Math.abs(diferencia))}
          </span>
        )}
      </div>
    );
  };

  const montoBodyTemplate = (rowData, field) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: rowData.moneda?.codigoSunat || "PEN",
    }).format(rowData[field] || 0);
  };

  const fechaBodyTemplate = (rowData) => {
    if (!rowData.fechaAsiento) return "-";
    return new Date(rowData.fechaAsiento).toLocaleDateString("es-PE");
  };

  const actionBodyTemplate = (rowData) => {
    const estadoDesc = rowData.estado?.descripcion || "";
    const esPendiente = estadoDesc === "PENDIENTE";
    const esAprobado = estadoDesc === "APROBADO";
    const esAnulado = estadoDesc === "ANULADO";

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-mr-2"
          disabled={!permisos.puedeVer && !permisos.puedeEditar}
          onClick={() => {
            if (permisos.puedeVer || permisos.puedeEditar) {
              onEdit(rowData);
            }
          }}
          tooltip={
            esAprobado
              ? "Editar (volverá a PENDIENTE)"
              : permisos.puedeEditar
                ? "Editar"
                : "Ver"
          }
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          disabled={!permisos.puedeEliminar || !esPendiente}
          onClick={() => {
            if (permisos.puedeEliminar) {
              onDelete(rowData);
            }
          }}
          tooltip="Eliminar"
        />
        {permisos.puedeEditar && esPendiente && rowData.estaCuadrado && (
          <Button
            icon="pi pi-check"
            className="p-button-text p-button-success"
            onClick={() => handleAprobar(rowData)}
            tooltip="Aprobar"
          />
        )}
        {permisos.puedeEditar && esAprobado && (
          <Button
            icon="pi pi-ban"
            className="p-button-text p-button-danger"
            onClick={() => handleAnular(rowData)}
            tooltip="Anular"
          />
        )}
      </div>
    );
  };

  const handleEmpresaChange = (value) => {
    setEmpresaFilter(value);
    setPeriodoFilter(null);
  };

  return (
    <div className="p-m-4">
      <Toast ref={toast} />
      <Dialog
        visible={showKardexDialog}
        onHide={() => setShowKardexDialog(false)}
        header="Generar Kardex Valorizado Mensual"
        style={{ width: "550px" }}
        modal
        className="p-fluid"
        closable={!kardexLoading}
        closeOnEscape={!kardexLoading}
      >
        <div style={{ padding: "10px 0" }}>
          <p style={{ marginBottom: 20, fontSize: "1.05em" }}>
            Configure los parámetros para generar el <b>Kardex Valorizado</b>:
          </p>

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="kardexEmpresa"
              style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
            >
              Empresa
            </label>
            <InputText
              id="kardexEmpresa"
              value={
                empresas.find((e) => Number(e.id) === empresaFilter)
                  ?.razonSocial || ""
              }
              disabled
              style={{ width: "100%", backgroundColor: "#f5f5f5" }}
            />
          </div>

          <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="kardexAnio"
                style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
              >
                Año <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="kardexAnio"
                value={kardexAnio}
                options={Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return { label: year.toString(), value: year };
                })}
                onChange={(e) => setKardexAnio(e.value)}
                placeholder="Seleccionar año"
                style={{ width: "100%" }}
                disabled={kardexLoading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="kardexMes"
                style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
              >
                Mes <span style={{ color: "red" }}>*</span>
              </label>
              <Dropdown
                id="kardexMes"
                value={kardexMes}
                options={[
                  { label: "Enero", value: 1 },
                  { label: "Febrero", value: 2 },
                  { label: "Marzo", value: 3 },
                  { label: "Abril", value: 4 },
                  { label: "Mayo", value: 5 },
                  { label: "Junio", value: 6 },
                  { label: "Julio", value: 7 },
                  { label: "Agosto", value: 8 },
                  { label: "Septiembre", value: 9 },
                  { label: "Octubre", value: 10 },
                  { label: "Noviembre", value: 11 },
                  { label: "Diciembre", value: 12 },
                ]}
                onChange={(e) => setKardexMes(e.value)}
                placeholder="Seleccionar mes"
                style={{ width: "100%" }}
                disabled={kardexLoading}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff3e0",
              padding: 12,
              borderRadius: 4,
              border: "1px solid #ffb74d",
              marginBottom: 15,
            }}
          >
            <p style={{ margin: 0, color: "#e65100", fontSize: "0.95em" }}>
              <i
                className="pi pi-exclamation-triangle"
                style={{ marginRight: 8 }}
              ></i>
              <b>Importante:</b> Se generarán asientos contables de valorización
              de inventarios para el período seleccionado.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: 12,
              borderRadius: 4,
              border: "1px solid #64b5f6",
            }}
          >
            <p style={{ margin: 0, color: "#1565c0", fontSize: "0.9em" }}>
              <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
              Si ya existe un asiento de kardex valorizado para este período, se
              eliminará y regenerará automáticamente.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
            paddingTop: 15,
            borderTop: "1px solid #dee2e6",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={() => setShowKardexDialog(false)}
            disabled={kardexLoading}
          />
          <Button
            label="Generar Kardex"
            icon="pi pi-calculator"
            className="p-button-info"
            onClick={handleConfirmKardexValorizado}
            loading={kardexLoading}
            disabled={!kardexAnio || !kardexMes}
          />
        </div>
      </Dialog>

      <Dialog
        visible={showUnirDialog}
        onHide={() => setShowUnirDialog(false)}
        header={
          validacionUnir?.valido
            ? "⚠️ Confirmar Unión de Asientos"
            : "❌ No se pueden Unir los Asientos"
        }
        style={{ width: validacionUnir?.valido ? "650px" : "650px" }}
        modal
        className="p-fluid"
        closable={!loading}
        closeOnEscape={!loading}
      >
        {validacionUnir && !validacionUnir.valido && (
          <div style={{ padding: "10px 0" }}>
            <p
              style={{ marginBottom: 15, fontSize: "1.05em", color: "#d32f2f" }}
            >
              Los asientos seleccionados tienen los siguientes errores:
            </p>

            <div
              style={{
                backgroundColor: "#ffebee",
                padding: 15,
                borderRadius: 6,
                border: "1px solid #ef5350",
                marginBottom: 15,
              }}
            >
              {validacionUnir.errores.map((error, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom:
                      index < validacionUnir.errores.length - 1 ? 10 : 0,
                    fontSize: "0.95em",
                  }}
                >
                  <i
                    className="pi pi-times-circle"
                    style={{ color: "#d32f2f", marginRight: 8, marginTop: 2 }}
                  ></i>
                  <span style={{ color: "#b71c1c", flex: 1 }}>{error}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #64b5f6",
              }}
            >
              <p style={{ margin: 0, color: "#1565c0", fontSize: "0.9em" }}>
                <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
                <b>Sugerencia:</b> Deseleccione los asientos que no cumplen con
                los requisitos y vuelva a intentar.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
                paddingTop: 15,
                borderTop: "1px solid #dee2e6",
              }}
            >
              <Button
                label="Entendido"
                icon="pi pi-check"
                className="p-button-secondary"
                onClick={() => setShowUnirDialog(false)}
              />
            </div>
          </div>
        )}

        {validacionUnir && validacionUnir.valido && (
          <div style={{ padding: "10px 0" }}>
            <div
              style={{
                backgroundColor: "#e8f5e9",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #66bb6a",
                marginBottom: 20,
              }}
            >
              <p style={{ margin: 0, color: "#2e7d32", fontSize: "0.95em" }}>
                <i
                  className="pi pi-check-circle"
                  style={{ marginRight: 8, fontWeight: "bold" }}
                ></i>
                <b>Validación exitosa:</b> {asientosSeleccionados.length}{" "}
                asientos compatibles
              </p>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#2e7d32",
                }}
              >
                📌 Permanecerá:
              </label>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: 12,
                  borderRadius: 4,
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Asiento #{validacionUnir.asientoPrincipal?.numeroAsiento}
                </div>
                <div style={{ fontSize: "0.9em", color: "#666" }}>
                  {validacionUnir.asientoPrincipal?.empresa?.razonSocial} |{" "}
                  {
                    validacionUnir.asientoPrincipal?.periodoContable
                      ?.nombrePeriodo
                  }{" "}
                  | "{validacionUnir.asientoPrincipal?.glosa}" |{" "}
                  {validacionUnir.asientoPrincipal?.detalles?.length || 0}{" "}
                  detalles
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#d32f2f",
                }}
              >
                ❌ Se eliminarán:
              </label>
              <div
                style={{
                  backgroundColor: "#fff3e0",
                  padding: 12,
                  borderRadius: 4,
                  border: "1px solid #ffb74d",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                {validacionUnir.asientosAEliminar?.map((asiento, index) => (
                  <div
                    key={asiento.id}
                    style={{
                      marginBottom:
                        index < validacionUnir.asientosAEliminar.length - 1
                          ? 8
                          : 0,
                      fontSize: "0.9em",
                    }}
                  >
                    - Asiento #{asiento.numeroAsiento} (
                    {asiento.detalles?.length || 0} detalles) → Transferidos a #
                    {validacionUnir.asientoPrincipal?.numeroAsiento}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #64b5f6",
                marginBottom: 15,
              }}
            >
              <p style={{ margin: 0, color: "#1565c0", fontSize: "0.95em" }}>
                <i className="pi pi-info-circle" style={{ marginRight: 8 }}></i>
                <b>Resultado:</b> Asiento #
                {validacionUnir.asientoPrincipal?.numeroAsiento} tendrá{" "}
                {validacionUnir.totalDetalles} detalles en total
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#ffebee",
                padding: 12,
                borderRadius: 4,
                border: "1px solid #ef5350",
              }}
            >
              <p style={{ margin: 0, color: "#b71c1c", fontSize: "0.9em" }}>
                <i
                  className="pi pi-exclamation-triangle"
                  style={{ marginRight: 8 }}
                ></i>
                <b>Advertencia:</b> Esta acción NO se puede deshacer
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
                paddingTop: 15,
                borderTop: "1px solid #dee2e6",
              }}
            >
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={() => setShowUnirDialog(false)}
                disabled={loading}
              />
              <Button
                label="✓ Confirmar Unión"
                icon="pi pi-link"
                className="p-button-warning"
                onClick={handleConfirmUnir}
                loading={loading}
              />
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        visible={confirmState.visible}
        onHide={() => setConfirmState({ visible: false, row: null })}
        message={
          <span style={{ color: "#b71c1c", fontWeight: 600 }}>
            {confirmState.action === "aprobar" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>aprobar</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
              </>
            )}
            {confirmState.action === "anular" && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>anular</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
                <br />
                <span style={{ fontWeight: 400, color: "#b71c1c" }}>
                  Esta acción no se puede deshacer.
                </span>
              </>
            )}
            {!confirmState.action && (
              <>
                ¿Está seguro que desea{" "}
                <span style={{ color: "#b71c1c" }}>eliminar</span> el asiento{" "}
                <b>{confirmState.row?.numeroAsiento}</b>?
                <br />
                <span style={{ fontWeight: 400, color: "#b71c1c" }}>
                  Esta acción no se puede deshacer.
                </span>
              </>
            )}
          </span>
        }
        header={
          <span style={{ color: "#b71c1c" }}>
            {confirmState.action === "aprobar" && "Confirmar Aprobación"}
            {confirmState.action === "anular" && "Confirmar Anulación"}
            {!confirmState.action && "Confirmar eliminación"}
          </span>
        }
        icon="pi pi-exclamation-triangle"
        acceptClassName="p-button-danger"
        acceptLabel={
          confirmState.action === "aprobar"
            ? "Aprobar"
            : confirmState.action === "anular"
              ? "Anular"
              : "Eliminar"
        }
        rejectLabel="Cancelar"
        accept={confirmState.action ? handleConfirmAction : handleConfirmDelete}
        reject={() => setConfirmState({ visible: false, row: null })}
        style={{ minWidth: 400 }}
      />
      <DataTable
        value={itemsFiltrados}
        loading={loading}
        size="small"
        stripedRows
        showGridlines
        paginator
        rows={40}
        rowsPerPageOptions={[40, 80, 160, 320]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asientos"
        sortField="id"
        sortOrder={-1}
        selectionMode="checkbox"
        selection={asientosSeleccionados}
        onSelectionChange={(e) => setAsientosSeleccionados(e.value)}
        onRowDoubleClick={
          permisos.puedeVer || permisos.puedeEditar
            ? (e) => onEdit(e.data)
            : undefined
        }
        globalFilter={globalFilter}
        globalFilterFields={["numeroAsiento", "glosa"]}
        emptyMessage="No se encontraron registros que coincidan con la búsqueda."
        style={{
          cursor:
            permisos.puedeVer || permisos.puedeEditar ? "pointer" : "default",
          fontSize: getResponsiveFontSize(),
        }}
        header={
          <div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 5,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2>Asientos Contables</h2>
                <small style={{ color: "#666", fontWeight: "normal" }}>
                  Total de registros: {itemsFiltrados.length}
                </small>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="empresaFilter">Filtrar por Empresa</label>
                <Dropdown
                  id="empresaFilter"
                  value={empresaFilter}
                  options={empresas.map((e) => ({
                    label: e.razonSocial,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => handleEmpresaChange(e.value)}
                  placeholder="Seleccionar empresa"
                  showClear
                  filter
                  style={{ width: "100%" }}
                  onClear={() => handleEmpresaChange(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="periodoFilter">Filtrar por Período</label>
                <Dropdown
                  id="periodoFilter"
                  value={periodoFilter}
                  options={periodosFiltrados.map((p) => ({
                    label: p.nombrePeriodo,
                    value: Number(p.id),
                  }))}
                  onChange={(e) => setPeriodoFilter(e.value)}
                  placeholder="Seleccionar período"
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setPeriodoFilter(null)}
                  disabled={!empresaFilter}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Nuevo"
                  icon="pi pi-plus"
                  className="p-button-success"
                  raised
                  disabled={
                    !permisos.puedeCrear || !empresaFilter || !periodoFilter
                  }
                  tooltip="Nuevo Asiento Contable"
                  onClick={onNew}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  label="Unir Asientos"
                  icon="pi pi-link"
                  className="p-button-warning"
                  raised
                  onClick={handleUnirAsientos}
                  disabled={
                    !permisos.puedeEditar ||
                    asientosSeleccionados.length < 2 ||
                    loading
                  }
                  tooltip={`Unir ${asientosSeleccionados.length} asientos seleccionados`}
                  tooltipOptions={{ position: "top" }}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <Button
                  label="Genera Asiento Kardex"
                  icon="pi pi-calculator"
                  className="p-button-info"
                  raised
                  onClick={handleGenerarKardexValorizado}
                  disabled={
                    !empresaFilter || !periodoFilter || loading || kardexLoading
                  }
                  loading={kardexLoading}
                  tooltip="Generar asientos de valorización de inventarios del período seleccionado"
                  tooltipOptions={{ position: "top" }}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="rangoFechas">Rango de Fechas</label>
                <Calendar
                  id="rangoFechas"
                  value={rangoFechas}
                  onChange={(e) => setRangoFechas(e.value)}
                  selectionMode="range"
                  dateFormat="dd/mm/yy"
                  showIcon
                  showButtonBar
                  readOnlyInput
                  placeholder="Seleccionar rango"
                  style={{ width: "100%" }}
                  onClearButtonClick={() => setRangoFechas(null)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="estadoFilter">Filtrar por Estado</label>
                <Dropdown
                  id="estadoFilter"
                  value={estadoFilter}
                  options={estados.map((e) => ({
                    label: e.descripcion,
                    value: Number(e.id),
                  }))}
                  onChange={(e) => setEstadoFilter(e.value)}
                  placeholder="Seleccionar estado"
                  showClear
                  style={{ width: "100%" }}
                  onClear={() => setEstadoFilter(null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="globalFilter">Buscar</label>
                <InputText
                  id="globalFilter"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar..."
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Recargar BD"
                  icon="pi pi-refresh"
                  className="p-button-outlined p-button-info"
                  onClick={async () => {
                    await cargarDatos();
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
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 0.5 }}>
                <Button
                  label="Limpiar"
                  icon="pi pi-filter-slash"
                  className="p-button-secondary"
                  outlined
                  onClick={limpiarFiltros}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        }
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="id" header="ID" sortable />
        <Column
          field="empresa.razonSocial"
          header="Empresa"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="periodoContable.nombrePeriodo"
          header="Periodo"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column field="numeroAsiento" header="Número" sortable />
        <Column
          field="fechaAsiento"
          header="Fecha"
          body={fechaBodyTemplate}
          sortable
        />
        <Column field="glosa" header="Glosa" sortable />
        <Column
          field="totalDebe"
          header="Total Debe"
          body={(rowData) => montoBodyTemplate(rowData, "totalDebe")}
          sortable
        />
        <Column
          field="totalHaber"
          header="Total Haber"
          body={(rowData) => montoBodyTemplate(rowData, "totalHaber")}
          sortable
        />
        <Column
          field="estaCuadrado"
          header="Cuadre"
          body={cuadradoBodyTemplate}
          sortable
        />
        <Column
          field="estado.descripcion"
          header="Estado"
          body={estadoBodyTemplate}
          sortable
        />
        <Column body={actionBodyTemplate} header="Acciones" />
      </DataTable>
      <Dialog
        header={
          isEdit
            ? permisos.puedeEditar
              ? "Editar Asiento Contable"
              : "Ver Asiento Contable"
            : "Nuevo Asiento Contable"
        }
        visible={showDialog}
        style={{ width: "1300px" }}
        modal
        maximizable
        maximized={true}
        onHide={onCancel}
        closeOnEscape
      >
        <AsientoContableForm
          key={selected?.id || 'new'}
          isEdit={isEdit}
          defaultValues={selected || {}}
          empresaFija={empresaFilter}
          periodoFijo={periodoFilter}
          empresas={empresas}
          periodos={periodos}
          estados={estados}
          monedas={monedas}
          onSubmit={onSubmit}
          onCancel={onCancel}
          loading={loading}
          readOnly={isEdit && !permisos.puedeEditar}
          onAprobar={handleAprobar}
          onAnular={handleAnular}
          onRecargar={recargarAsientoActual}
        />
      </Dialog>
    </div>
  );
}
