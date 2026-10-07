// src/pages/PagoCuentaPorPagar.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import PagoCuentaPorPagarForm from "../components/pagoCuentaPorPagar/PagoCuentaPorPagarForm";
import EmpresaSelector from "../components/common/EmpresaSelector";
import {
  getPago,
  getPagoById,
  createPagoCuentaPorPagar,
  updatePagoCuentaPorPagar,
  deletePagoCuentaPorPagar,
} from "../api/cuentasPorCobrarPagar/pago";
import { getCuentaPorPagar } from "../api/cuentasPorCobrarPagar/cuentaPorPagar";
import { getMonedas } from "../api/moneda";
import { getMediosPago } from "../api/medioPago";
import { getBancos } from "../api/banco";
import { getAllCuentaCorriente } from "../api/cuentaCorriente";
import { getEstadosMultiFuncion } from "../api/estadoMultiFuncion";
import { getPeriodosContables } from "../api/contabilidad/periodoContable";
import { useAuthStore } from "../shared/stores/useAuthStore";
import { getResponsiveFontSize, formatearFecha, formatearNumero } from "../utils/utils";

export default function PagoCuentaPorPagar() {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const [pagos, setPagos] = useState([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);

  const [selectedPago, setSelectedPago] = useState(null);
  const [pagoDialog, setPagoDialog] = useState(false);
  const [deletePagoDialog, setDeletePagoDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const [formData, setFormData] = useState({});

  // ═══════════════════════════════════════════════════════════
  // ESTADOS DE FILTROS
  // ═══════════════════════════════════════════════════════════
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [medioPagoSeleccionado, setMedioPagoSeleccionado] = useState(null);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState(null);
  const [cuentaCorrienteSeleccionada, setCuentaCorrienteSeleccionada] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [nroDocumentoBusqueda, setNroDocumentoBusqueda] = useState("");
  const [pagosFiltrados, setPagosFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [mediosPagoUnicos, setMediosPagoUnicos] = useState([]);
  const [monedasUnicas, setMonedasUnicas] = useState([]);
  const [cuentasCorrientesUnicas, setCuentasCorrientesUnicas] = useState([]);
  const [periodosUnicos, setPeriodosUnicos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        pagosData,
        cuentasData,
        monedasData,
        mediosPagoData,
        bancosData,
        cuentasCorrientesData,
        estadosData,
        periodosData,
      ] = await Promise.all([
        getPago(),
        getCuentaPorPagar(),
        getMonedas(),
        getMediosPago(),
        getBancos(),
        getAllCuentaCorriente(),
        getEstadosMultiFuncion(),
        getPeriodosContables(),
      ]);

      // El listado consolidado trae pagos de CxC y de CxP: aquí solo interesan los de CxP
      setPagos(pagosData?.filter((p) => p.tipoPago === "PAGAR") || []);

      const cuentasPendientes = cuentasData?.filter(
        (c) => Number(c.saldoPendiente || 0) > 0
      ) || [];
      setCuentasPorPagar(cuentasPendientes);

      setMonedas(monedasData || []);
      setMediosPago(mediosPagoData || []);
      setBancos(bancosData || []);
      setCuentasCorrientes(cuentasCorrientesData || []);
      setEstados(estadosData || []);
      setPeriodosContables(periodosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
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

  // ═══════════════════════════════════════════════════════════
  // EFECTO: GENERAR OPCIONES ÚNICAS PARA FILTROS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const datosParaOpciones = empresaSeleccionada
      ? pagosFiltrados.filter((p) => Number(p.empresaId) === Number(empresaSeleccionada))
      : pagosFiltrados;

    const unicos = (obtener) => [
      ...new Map(
        datosParaOpciones
          .map(obtener)
          .filter(Boolean)
          .map((item) => [item.id, item])
      ).values(),
    ];

    const proveedores = unicos((p) => p.cuentaPorPagar?.proveedor);
    const medios = unicos((p) => p.medioPago);
    const monedasPago = unicos((p) => p.monedaPago);
    const cuentas = unicos((p) => p.cuentaBancaria);
    const periodos = unicos((p) => p.periodoContable);

    setProveedoresUnicos(proveedores);
    setMediosPagoUnicos(medios);
    setMonedasUnicas(monedasPago);
    setCuentasCorrientesUnicas(cuentas);
    setPeriodosUnicos(periodos);

    // Limpiar selecciones que ya no existen
    const existe = (lista, id) => lista.find((item) => Number(item.id) === Number(id));
    if (proveedorSeleccionado && !existe(proveedores, proveedorSeleccionado)) setProveedorSeleccionado(null);
    if (medioPagoSeleccionado && !existe(medios, medioPagoSeleccionado)) setMedioPagoSeleccionado(null);
    if (monedaSeleccionada && !existe(monedasPago, monedaSeleccionada)) setMonedaSeleccionada(null);
    if (cuentaCorrienteSeleccionada && !existe(cuentas, cuentaCorrienteSeleccionada)) setCuentaCorrienteSeleccionada(null);
    if (periodoSeleccionado && !existe(periodos, periodoSeleccionado)) setPeriodoSeleccionado(null);
  }, [
    pagosFiltrados,
    empresaSeleccionada,
    proveedorSeleccionado,
    medioPagoSeleccionado,
    monedaSeleccionada,
    cuentaCorrienteSeleccionada,
    periodoSeleccionado,
  ]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO: APLICAR FILTROS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    let filtrados = pagos;

    if (empresaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.empresaId) === Number(empresaSeleccionada)
      );
    }

    if (proveedorSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.cuentaPorPagar?.proveedorId) === Number(proveedorSeleccionado)
      );
    }

    // Filtro por rango de fechas (fechaPago)
    if (rangoFechas && rangoFechas[0]) {
      filtrados = filtrados.filter((item) => {
        const fechaPago = new Date(item.fechaPago);
        const fechaIni = new Date(rangoFechas[0]);
        fechaIni.setHours(0, 0, 0, 0);

        if (rangoFechas[1]) {
          const fechaFinDia = new Date(rangoFechas[1]);
          fechaFinDia.setHours(23, 59, 59, 999);
          return fechaPago >= fechaIni && fechaPago <= fechaFinDia;
        }
        return fechaPago >= fechaIni;
      });
    }

    if (medioPagoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.medioPagoId) === Number(medioPagoSeleccionado)
      );
    }

    if (monedaSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.monedaPagoId) === Number(monedaSeleccionada)
      );
    }

    if (cuentaCorrienteSeleccionada) {
      filtrados = filtrados.filter(
        (item) => Number(item.cuentaBancariaId) === Number(cuentaCorrienteSeleccionada)
      );
    }

    if (periodoSeleccionado) {
      filtrados = filtrados.filter(
        (item) => Number(item.periodoContableId) === Number(periodoSeleccionado)
      );
    }

    // Filtro por N° de documento (OC de la CxP) o N° de operación bancaria
    if (nroDocumentoBusqueda && nroDocumentoBusqueda.trim() !== "") {
      const busqueda = nroDocumentoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter((item) => {
        const nroDocumento = item.cuentaPorPagar?.numeroOrdenCompra || "";
        const nroOperacion = item.numeroOperacion || "";
        return (
          nroDocumento.toLowerCase().includes(busqueda) ||
          nroOperacion.toLowerCase().includes(busqueda)
        );
      });
    }

    setPagosFiltrados(filtrados);
  }, [
    pagos,
    empresaSeleccionada,
    proveedorSeleccionado,
    rangoFechas,
    medioPagoSeleccionado,
    monedaSeleccionada,
    cuentaCorrienteSeleccionada,
    periodoSeleccionado,
    nroDocumentoBusqueda,
  ]);

  const limpiarFiltros = () => {
    setEmpresaSeleccionada(null);
    setProveedorSeleccionado(null);
    setRangoFechas(null);
    setMedioPagoSeleccionado(null);
    setMonedaSeleccionada(null);
    setCuentaCorrienteSeleccionada(null);
    setPeriodoSeleccionado(null);
    setNroDocumentoBusqueda("");
  };

  const openNew = () => {
    setFormData({});
    setSelectedPago(null);
    setIsEdit(false);
    setPagoDialog(true);
  };

  const hideDialog = () => {
    setPagoDialog(false);
    setFormData({});
    setSelectedPago(null);
  };

  const editPago = async (pago) => {
    try {
      setLoading(true);
      const pagoCompleto = await getPagoById(pago.id, 'PAGAR');

      const dataParaEdicion = {
        ...pagoCompleto,
        cuentaPorPagarId: Number(pagoCompleto.cuentaPorPagarId),
        monedaPagoId: Number(pagoCompleto.monedaPagoId),
        medioPagoId: Number(pagoCompleto.medioPagoId),
        bancoId: pagoCompleto.bancoId ? Number(pagoCompleto.bancoId) : null,
        cuentaBancariaId: pagoCompleto.cuentaBancariaId ? Number(pagoCompleto.cuentaBancariaId) : null,
      };

      setFormData(dataParaEdicion);
      setSelectedPago(pago);
      setIsEdit(true);
      setPagoDialog(true);
    } catch (error) {
      console.error("Error al cargar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const savePago = async (data) => {
    try {
      setLoading(true);

      if (isEdit && selectedPago) {
        await updatePagoCuentaPorPagar(selectedPago.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado correctamente",
          life: 3000,
        });
      } else {
        await createPagoCuentaPorPagar(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago registrado correctamente",
          life: 3000,
        });
      }

      hideDialog();
      loadData();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeletePago = (pago) => {
    setSelectedPago(pago);
    setDeletePagoDialog(true);
  };

  const deletePagoConfirmed = async () => {
    try {
      setLoading(true);
      await deletePagoCuentaPorPagar(selectedPago.id);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente",
        life: 3000,
      });

      setDeletePagoDialog(false);
      setSelectedPago(null);
      loadData();
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al eliminar pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const hideDeletePagoDialog = () => {
    setDeletePagoDialog(false);
    setSelectedPago(null);
  };

  // ═══════════════════════════════════════════════════════════
  // TEMPLATES DE COLUMNAS
  // ═══════════════════════════════════════════════════════════
  const empresaBodyTemplate = (rowData) =>
    rowData.empresa?.razonSocial || rowData.empresaNombre || "-";

  const cuentaPorPagarBodyTemplate = (rowData) => {
    const cuenta = cuentasPorPagar.find((c) => Number(c.id) === Number(rowData.cuentaPorPagarId));
    return (
      rowData.cuentaPorPagar?.numeroOrdenCompra ||
      cuenta?.numeroOrdenCompra ||
      rowData.cuentaPorPagarId ||
      "-"
    );
  };

  const proveedorBodyTemplate = (rowData) => {
    if (rowData.cuentaPorPagar?.proveedor) {
      return rowData.cuentaPorPagar.proveedor.razonSocial;
    }
    const cuenta = cuentasPorPagar.find((c) => Number(c.id) === Number(rowData.cuentaPorPagarId));
    return cuenta?.proveedor?.razonSocial || "-";
  };

  const monedaBodyTemplate = (rowData) => {
    const moneda =
      rowData.monedaPago ||
      monedas.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
    return moneda?.codigoSunat || "-";
  };

  const medioPagoBodyTemplate = (rowData) => {
    const medio =
      rowData.medioPago ||
      mediosPago.find((m) => Number(m.id) === Number(rowData.medioPagoId));
    return medio?.nombre || "-";
  };

  const cuentaCorrienteBodyTemplate = (rowData) => {
    const cuenta =
      rowData.cuentaBancaria ||
      cuentasCorrientes.find((c) => Number(c.id) === Number(rowData.cuentaBancariaId));
    if (!cuenta) return "-";
    const banco =
      rowData.banco ||
      bancos.find((b) => Number(b.id) === Number(cuenta.bancoId));
    return [banco?.nombre, cuenta.numeroCuenta, cuenta.descripcion]
      .filter(Boolean)
      .join(" - ");
  };

  const periodoContableBodyTemplate = (rowData) => {
    const periodo =
      rowData.periodoContable ||
      periodosContables.find((p) => Number(p.id) === Number(rowData.periodoContableId));
    return periodo?.nombrePeriodo || "-";
  };

  const fechaBodyTemplate = (rowData, field) => formatearFecha(rowData[field], "-");

  // Monto en la moneda real del pago, resaltado con el color de la moneda
  const montoPagadoBodyTemplate = (rowData) => {
    const moneda =
      rowData.monedaPago ||
      monedas.find((m) => Number(m.id) === Number(rowData.monedaPagoId));
    return (
      <span
        style={{
          backgroundColor: moneda?.colorFondo || "#ffffff",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block",
          width: "100%",
          textAlign: "right",
        }}
      >
        {moneda?.simbolo} {formatearNumero(rowData.montoPagado, 2)}
      </span>
    );
  };

  const tipoCambioBodyTemplate = (rowData) =>
    rowData.tipoCambio ? formatearNumero(rowData.tipoCambio, 3) : "-";

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editPago(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmDeletePago(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          label="Nuevo Pago"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openNew}
        />
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          className="p-button-info"
          onClick={loadData}
          loading={loading}
        />
        <Button
          label="Limpiar Filtros"
          icon="pi pi-filter-slash"
          className="p-button-secondary"
          outlined
          onClick={limpiarFiltros}
          disabled={loading}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    );
  };

  const deletePagoDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeletePagoDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deletePagoConfirmed}
        loading={loading}
      />
    </>
  );

  const filtroDropdown = (id, etiqueta, value, onChange, opciones, placeholder = "Todos") => (
    <div style={{ flex: 2 }}>
      <label htmlFor={id} style={{ fontWeight: "bold" }}>
        {etiqueta}
      </label>
      <Dropdown
        id={id}
        value={value}
        options={opciones}
        onChange={(e) => onChange(e.value)}
        placeholder={placeholder}
        optionLabel="label"
        optionValue="value"
        showClear
        filter
        disabled={loading}
        style={{ width: "100%" }}
      />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />

      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            <h2>Pagos de Cuentas por Pagar</h2>
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontWeight: "bold" }}>Empresa</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaSeleccionada(id)}
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
          {filtroDropdown(
            "proveedorFiltro",
            "Proveedor",
            proveedorSeleccionado,
            setProveedorSeleccionado,
            proveedoresUnicos.map((p) => ({ label: p.razonSocial, value: Number(p.id) }))
          )}
          <div style={{ flex: 2 }}>
            <label htmlFor="rangoFechas" style={{ fontWeight: "bold" }}>
              Rango de Fechas (Pago)
            </label>
            <Calendar
              id="rangoFechas"
              value={rangoFechas}
              onChange={(e) => setRangoFechas(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Seleccionar rango..."
              style={{ width: "100%" }}
              disabled={loading}
              readOnlyInput
            />
          </div>
          {filtroDropdown(
            "medioPagoFiltro",
            "Medio de Pago",
            medioPagoSeleccionado,
            setMedioPagoSeleccionado,
            mediosPagoUnicos.map((m) => ({ label: m.nombre, value: Number(m.id) }))
          )}
          {filtroDropdown(
            "monedaFiltro",
            "Moneda",
            monedaSeleccionada,
            setMonedaSeleccionada,
            monedasUnicas.map((m) => ({ label: m.codigoSunat, value: Number(m.id) })),
            "Todas"
          )}
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
          {filtroDropdown(
            "cuentaCorrienteFiltro",
            "Cuenta Corriente",
            cuentaCorrienteSeleccionada,
            setCuentaCorrienteSeleccionada,
            cuentasCorrientesUnicas.map((c) => {
              const banco = bancos.find((b) => Number(b.id) === Number(c.bancoId));
              return {
                label: [banco?.nombre, c.numeroCuenta, c.descripcion].filter(Boolean).join(" - "),
                value: Number(c.id),
              };
            })
          )}
          {filtroDropdown(
            "periodoFiltro",
            "Período Contable",
            periodoSeleccionado,
            setPeriodoSeleccionado,
            periodosUnicos.map((p) => ({ label: p.nombrePeriodo, value: Number(p.id) }))
          )}
          <div style={{ flex: 2 }}>
            <label htmlFor="nroDocumentoInput" style={{ fontWeight: "bold" }}>
              N° Documento / Operación
            </label>
            <InputText
              id="nroDocumentoInput"
              value={nroDocumentoBusqueda}
              onChange={(e) => setNroDocumentoBusqueda(e.target.value)}
              placeholder="Buscar por N° Documento u Operación..."
              style={{ width: "100%" }}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <Toolbar
        className="mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        value={pagosFiltrados}
        dataKey="id"
        loading={loading}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron pagos"
        paginator
        rows={25}
        rowsPerPageOptions={[25, 50, 100, 150]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pagos"
        stripedRows
        showGridlines
        size="small"
        style={{ fontSize: getResponsiveFontSize() }}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: "80px" }} />

        <Column
          header="Empresa"
          body={empresaBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Proveedor"
          body={proveedorBodyTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          header="N° Dcmto Origen"
          body={cuentaPorPagarBodyTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Fecha Pago"
          body={(rowData) => fechaBodyTemplate(rowData, "fechaPago")}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Moneda"
          body={monedaBodyTemplate}
          sortable
          style={{ minWidth: "90px" }}
        />
        <Column
          header="Monto Pagado"
          body={montoPagadoBodyTemplate}
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          header="T.C."
          body={tipoCambioBodyTemplate}
          sortable
          style={{ minWidth: "80px", textAlign: "right" }}
        />
        <Column
          header="Medio de Pago"
          body={medioPagoBodyTemplate}
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          header="Cuenta Corriente"
          body={cuentaCorrienteBodyTemplate}
          sortable
          style={{ minWidth: "220px" }}
        />
        <Column
          field="numeroOperacion"
          header="N° Operación Bancaria"
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          header="Período Contable"
          body={periodoContableBodyTemplate}
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="refOperacionEspecializadaMovCaja"
          header="ID Op/Caja E."
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="movimientoCajaId"
          header="Mov. Caja"
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="prestamoBancarioId"
          header="Préstamo Bancario"
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          header="Acciones"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "120px" }}
        />
      </DataTable>

      <Dialog
        visible={pagoDialog}
        style={{ width: "90vw", maxWidth: "1200px" }}
        header={isEdit ? "Editar Pago" : "Registrar Nuevo Pago"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <PagoCuentaPorPagarForm
          isEdit={isEdit}
          defaultValues={formData}
          cuentasPorPagar={cuentasPorPagar}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={cuentasCorrientes}
          estados={estados}
          periodosContables={periodosContables}
          onSubmit={savePago}
          onCancel={hideDialog}
          loading={loading}
        />
      </Dialog>

      <Dialog
        visible={deletePagoDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deletePagoDialogFooter}
        onHide={hideDeletePagoDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedPago && (
            <span>
              ¿Está seguro de eliminar el pago de{" "}
              <b>{formatearNumero(selectedPago.montoPagado, 2)}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
