import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Menu } from "primereact/menu";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getLineasDiarioContable, exportarSUNAT51, exportarExcel, exportarPDF } from "../../api/contabilidad/diarioContable";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getCentrosCosto } from "../../api/centroCosto";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getMonedas } from "../../api/moneda";
import { getActivos } from "../../api/activo";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import ColorTag from "../../components/shared/ColorTag";

const DiarioContable = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);
  const menuExport = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [activos, setActivos] = useState([]);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [tipoLibroFiltro, setTipoLibroFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [numeroAsientoFiltro, setNumeroAsientoFiltro] = useState('');
  const [codigoCuentaFiltro, setCodigoCuentaFiltro] = useState('');
  const [soloCuadrados, setSoloCuadrados] = useState(false);
  const [soloDescuadrados, setSoloDescuadrados] = useState(false);
  const [soloConEntidad, setSoloConEntidad] = useState(false);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS'); // TODOS | SOLO_SALDOS | SIN_SALDOS

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
  });

  // ✅ FILTRAR PERIODOS POR EMPRESA Y AÑO ACTUAL
  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];
    
    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  // ✅ FILTRAR ESTADOS DE ASIENTO CONTABLE (76, 77, 78)
  const estadosAsiento = useMemo(() => {
    return estados.filter(e => [76, 77, 78].includes(Number(e.id)));
  }, [estados]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // ✅ RECARGAR DATOS CUANDO CAMBIA CUALQUIER FILTRO
  useEffect(() => {
    if (empresaIdSelector && periodoSeleccionado) {
      cargarDatos();
    }
  }, [
    empresaIdSelector,
    periodoSeleccionado,
    rangoFechas,
    tipoLibroFiltro,
    estadoFiltro,
    numeroAsientoFiltro,
    codigoCuentaFiltro,
    soloCuadrados,
    soloDescuadrados,
    soloConEntidad,
    filtroSaldoInicial,
  ]);

  // ✅ SELECCIONAR AUTOMÁTICAMENTE PERIODO DEL MES ACTUAL CUANDO CAMBIA LA EMPRESA
  useEffect(() => {
    if (periodosFiltrados.length > 0) {
      const mesActual = new Date().getMonth() + 1;
      const periodoActual = periodosFiltrados.find(p => Number(p.mes) === mesActual);
      
      if (periodoActual) {
        setPeriodoSeleccionado(periodoActual.id);
      } else {
        setPeriodoSeleccionado(periodosFiltrados[0].id);
      }
    } else {
      setPeriodoSeleccionado(null);
    }
  }, [periodosFiltrados]);

  const cargarCatalogos = async () => {
    try {
      const [
        empresasData,
        periodosData,
        estadosData,
        cuentasData,
        entidadesData,
        centrosData,
        tiposDocData,
        monedasData,
        activosData,
      ] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getEstadosMultiFuncion(),
        getPlanCuentasContable(),
        getEntidadesComerciales(),
        getCentrosCosto(),
        getTiposDocumento(),
        getMonedas(),
        getActivos(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setEstados(estadosData);
      setCuentas(cuentasData);
      setEntidades(entidadesData);
      setCentrosCosto(centrosData);
      setTiposDoc(tiposDocData);
      setMonedas(monedasData);
      setActivos(activosData);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
        life: 3000,
      });
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = {
        empresaId: empresaIdSelector,
        periodoContableId: periodoSeleccionado,
        fechaDesde: rangoFechas?.[0],
        fechaHasta: rangoFechas?.[1],
        numeroAsiento: numeroAsientoFiltro,
        estadoAsientoId: estadoFiltro,
        tipoLibro: tipoLibroFiltro,
        codigoCuentaInicia: codigoCuentaFiltro,
        soloCuadrados: soloCuadrados,
        soloDescuadrados: soloDescuadrados,
        soloConEntidad: soloConEntidad,
        soloSaldosIniciales: filtroSaldoInicial === 'SOLO_SALDOS',
        page: 1,
        limit: 10000,
      };

      const response = await getLineasDiarioContable(params);
      
      let lineasFiltradas = response.lineas || [];
      
      // ✅ FILTRAR EN FRONTEND SI ES "SIN_SALDOS"
      if (filtroSaldoInicial === 'SIN_SALDOS') {
        lineasFiltradas = lineasFiltradas.filter(linea => !linea.asientoContable?.esSaldoInicial);
      }
      
      setLineas(lineasFiltradas);
      setTotales(response.totales || { totalDebe: 0, totalHaber: 0 });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEmpresaIdSelector(usuario?.empresaId || null);
    setPeriodoSeleccionado(null);
    setRangoFechas(null);
    setTipoLibroFiltro(null);
    setEstadoFiltro(null);
    setNumeroAsientoFiltro('');
    setCodigoCuentaFiltro('');
    setSoloCuadrados(false);
    setSoloDescuadrados(false);
    setSoloConEntidad(false);
    setFiltroSaldoInicial('TODOS');
    setLineas([]);
  };

  const handleExportar = async (tipo) => {
    if (!empresaIdSelector || !periodoSeleccionado) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar Empresa y Periodo",
        life: 3000,
      });
      return;
    }

    try {
      const params = {
        empresaId: empresaIdSelector,
        periodoContableId: periodoSeleccionado,
        tipoLibro: tipoLibroFiltro || 'FISCAL',
      };

      let blob;
      let filename;

      if (tipo === 'sunat') {
        blob = await exportarSUNAT51(params);
        filename = `LE_DIARIO_${params.empresaId}_${params.periodoContableId}.txt`;
      } else if (tipo === 'excel') {
        blob = await exportarExcel(params);
        filename = `DiarioContable_${params.empresaId}_${params.periodoContableId}.xlsx`;
      } else if (tipo === 'pdf') {
        blob = await exportarPDF(params);
        filename = `DiarioContable_${params.empresaId}_${params.periodoContableId}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.current?.show({
        severity: "success",
        summary: "Exportado",
        detail: "Archivo generado correctamente",
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al exportar",
        life: 3000,
      });
    }
  };

  const toggleFiltroSaldoInicial = () => {
    if (filtroSaldoInicial === 'TODOS') {
      setFiltroSaldoInicial('SOLO_SALDOS');
    } else if (filtroSaldoInicial === 'SOLO_SALDOS') {
      setFiltroSaldoInicial('SIN_SALDOS');
    } else {
      setFiltroSaldoInicial('TODOS');
    }
  };

  const getSaldoInicialButtonConfig = () => {
    switch (filtroSaldoInicial) {
      case 'SOLO_SALDOS':
        return { label: '✅ Solo Saldos Iniciales', severity: 'success' };
      case 'SIN_SALDOS':
        return { label: '❌ Sin Saldos Iniciales', severity: 'danger' };
      default:
        return { label: '📋 Todos los Asientos', severity: 'secondary' };
    }
  };

  const menuExportItems = [
    {
      label: 'Formato SUNAT 5.1 (TXT)',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    },
    {
      label: 'Excel Detallado',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF Libro Diario',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    }
  ];

  const asientoTemplate = (rowData) => (
    <span style={{ fontFamily: 'monospace', fontSize: getResponsiveFontSize() }}>{rowData.asientoContable?.numeroAsiento}</span>
  );

  const fechaTemplate = (rowData) => (
    <span style={{ fontSize: getResponsiveFontSize() }}>{formatearFecha(rowData.asientoContable?.fechaAsiento)}</span>
  );

  const cuentaTemplate = (rowData) => (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: getResponsiveFontSize(), fontWeight: 'bold' }}>{rowData.planCuenta?.codigoCuenta}</div>
      <div style={{ fontSize: '0.85rem', color: '#666' }}>{rowData.planCuenta?.nombreCuenta}</div>
    </div>
  );

  const entidadTemplate = (rowData) => {
    if (!rowData.entidadComercial) return null;
    return (
      <div>
        <div style={{ fontSize: getResponsiveFontSize() }}>{rowData.entidadComercial.razonSocial}</div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{rowData.entidadComercial.ruc}</div>
      </div>
    );
  };

  const montoTemplate = (rowData, field) => {
    const monto = Number(rowData[field]);
    if (monto === 0) return null;
    const moneda = rowData.moneda;
    return (
      <Tag
        value={`${moneda?.simbolo || ''} ${formatearNumero(monto, 2)}`}
        style={{ backgroundColor: moneda?.colorFondo || '#fff', color: '#000', fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const estadoTemplate = (rowData) => (
    <ColorTag estado={rowData.asientoContable?.estado} />
  );

  const tipoLibroTemplate = (rowData) => (
    <Tag
      value={rowData.asientoContable?.tipoLibro}
      severity={rowData.asientoContable?.tipoLibro === 'FISCAL' ? 'info' : 'secondary'}
      style={{ fontSize: getResponsiveFontSize() }}
    />
  );

  const saldoInicialTemplate = (rowData) => {
    if (!rowData.asientoContable?.esSaldoInicial) return null;
    return (
      <Tag
        value="SALDO INICIAL"
        severity="warning"
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const buttonConfig = getSaldoInicialButtonConfig();

  return (
    <div>
      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
        <DataTable
          value={lineas}
          loading={loading}
          dataKey="id"
          paginator
          size="small"
          showGridlines
          stripedRows
          rows={50}
          rowsPerPageOptions={[25, 50, 100, 200]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} líneas"
          sortField="id"
          sortOrder={-1}
          style={{ fontSize: getResponsiveFontSize() }}
          emptyMessage="Seleccione Empresa y Periodo para ver datos"
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
                <div style={{ flex: 1 }}>
                  <h2>📘 Diario Contable</h2>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Empresa*</label>
                  <EmpresaSelector
                    empresaId={usuario?.empresaId}
                    onEmpresaChange={(id) => setEmpresaIdSelector(id)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Periodo*</label>
                  <Dropdown
                    value={periodoSeleccionado}
                    options={periodosFiltrados}
                    onChange={(e) => setPeriodoSeleccionado(e.value)}
                    optionLabel="nombrePeriodo"
                    optionValue="id"
                    placeholder="Seleccione periodo"
                    style={{ width: "100%" }}
                    filter
                  />
                </div>

                <div style={{ flex: 0.25 }}>
                  <Button
                    icon="pi pi-filter-slash"
                    className="p-button-secondary"
                    outlined
                    onClick={limpiarFiltros}
                    disabled={loading}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Button
                    label="Exportar"
                    icon="pi pi-download"
                    className="p-button-success"
                    onClick={(e) => menuExport.current.toggle(e)}
                    disabled={!empresaIdSelector || !periodoSeleccionado}
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
                  <label style={{ fontWeight: "bold" }}>Rango de Fechas</label>
                  <Calendar
                    value={rangoFechas}
                    onChange={(e) => setRangoFechas(e.value)}
                    selectionMode="range"
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione rango"
                    style={{ width: "100%" }}
                    showIcon
                    readOnlyInput
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Tipo Libro</label>
                  <Dropdown
                    value={tipoLibroFiltro}
                    options={[
                      { label: 'Todos', value: null },
                      { label: 'FISCAL', value: 'FISCAL' },
                      { label: 'GERENCIAL', value: 'GERENCIAL' }
                    ]}
                    onChange={(e) => setTipoLibroFiltro(e.value)}
                    placeholder="Todos"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Estado</label>
                  <Dropdown
                    value={estadoFiltro}
                    options={estadosAsiento}
                    onChange={(e) => setEstadoFiltro(e.value)}
                    optionLabel="descripcion"
                    optionValue="id"
                    placeholder="Todos"
                    style={{ width: "100%" }}
                    showClear
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Nº Asiento</label>
                  <InputText
                    value={numeroAsientoFiltro}
                    onChange={(e) => setNumeroAsientoFiltro(e.target.value)}
                    placeholder="Buscar asiento"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Código Cuenta</label>
                  <InputText
                    value={codigoCuentaFiltro}
                    onChange={(e) => setCodigoCuentaFiltro(e.target.value)}
                    placeholder="Ej: 10, 40, 62"
                    style={{ width: "100%" }}
                    tooltip="Busca cuentas que INICIEN con este código"
                  />
                </div>
              </div>

              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: 15,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    inputId="soloCuadrados"
                    checked={soloCuadrados}
                    onChange={(e) => setSoloCuadrados(e.checked)}
                  />
                  <label htmlFor="soloCuadrados" style={{ marginLeft: "0.5rem", fontSize: getResponsiveFontSize() }}>Solo Cuadrados</label>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    inputId="soloDescuadrados"
                    checked={soloDescuadrados}
                    onChange={(e) => setSoloDescuadrados(e.checked)}
                  />
                  <label htmlFor="soloDescuadrados" style={{ marginLeft: "0.5rem", fontSize: getResponsiveFontSize() }}>Solo Descuadrados</label>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    inputId="soloConEntidad"
                    checked={soloConEntidad}
                    onChange={(e) => setSoloConEntidad(e.checked)}
                  />
                  <label htmlFor="soloConEntidad" style={{ marginLeft: "0.5rem", fontSize: getResponsiveFontSize() }}>Solo con Entidad</label>
                </div>

                <Button
                  label={buttonConfig.label}
                  severity={buttonConfig.severity}
                  onClick={toggleFiltroSaldoInicial}
                  style={{ fontSize: getResponsiveFontSize() }}
                  size="small"
                />

                <Tag value={`${lineas.length} líneas`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
                <Tag value={`Debe: S/ ${formatearNumero(totales.totalDebe, 2)}`} severity="success" style={{ fontSize: getResponsiveFontSize() }} />
                <Tag value={`Haber: S/ ${formatearNumero(totales.totalHaber, 2)}`} severity="warning" style={{ fontSize: getResponsiveFontSize() }} />
              </div>
            </div>
          }
        >
          <Column field="asientoContable.numeroAsiento" header="Asiento" body={asientoTemplate} style={{ width: '120px' }} sortable />
          <Column field="asientoContable.fechaAsiento" header="Fecha" body={fechaTemplate} style={{ width: '100px' }} sortable />
          <Column field="numeroLinea" header="Línea" style={{ width: '70px' }} sortable />
          <Column field="glosa" header="Glosa" style={{ minWidth: '250px' }} />
          <Column field="tipoDocumentoOrigen.codigo" header="Tipo Doc" style={{ width: '90px' }} />
          <Column field="numeroDocumentoOrigen" header="Nº Doc" style={{ width: '130px' }} />
          <Column header="Cuenta" body={cuentaTemplate} style={{ minWidth: '200px' }} />
          <Column header="Entidad" body={entidadTemplate} style={{ minWidth: '200px' }} />
          <Column header="Debe" body={(rowData) => montoTemplate(rowData, 'debe')} style={{ width: '120px' }} align="right" />
          <Column header="Haber" body={(rowData) => montoTemplate(rowData, 'haber')} style={{ width: '120px' }} align="right" />
          <Column header="Tipo Libro" body={tipoLibroTemplate} style={{ width: '110px' }} />
          <Column header="Estado" body={estadoTemplate} style={{ width: '110px' }} />
          <Column header="Saldo Inicial" body={saldoInicialTemplate} style={{ width: '130px' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default DiarioContable;