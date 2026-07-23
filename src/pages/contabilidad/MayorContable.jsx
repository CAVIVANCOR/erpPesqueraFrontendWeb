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
import { Accordion, AccordionTab } from "primereact/accordion";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getLineasMayorContable } from "../../api/contabilidad/mayorContable";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPlanCuentasContable } from "../../api/contabilidad/planCuentasContable";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import ColorTag from "../../components/shared/ColorTag";

const MayorContable = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [planCuentas, setPlanCuentas] = useState([]);
  const [entidades, setEntidades] = useState([]);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [tipoLibroFiltro, setTipoLibroFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [cuentaFiltro, setCuentaFiltro] = useState(null);
  const [codigoCuentaFiltro, setCodigoCuentaFiltro] = useState('');
  const [soloConEntidad, setSoloConEntidad] = useState(false);
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
    saldoFinal: 0,
  });

  const [activeIndex, setActiveIndex] = useState(null);

  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];
    
    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  const estadosAsiento = useMemo(() => {
    return estados.filter(e => [76, 77, 78].includes(Number(e.id)));
  }, [estados]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

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
    cuentaFiltro,
    codigoCuentaFiltro,
    soloConEntidad,
    filtroSaldoInicial,
  ]);

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
      ] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getEstadosMultiFuncion(),
        getPlanCuentasContable(),
        getEntidadesComerciales(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setEstados(estadosData);
      setPlanCuentas(cuentasData);
      setEntidades(entidadesData);
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
        estadoAsientoId: estadoFiltro,
        tipoLibro: tipoLibroFiltro,
        planCuentaId: cuentaFiltro,
        codigoCuentaInicia: codigoCuentaFiltro,
        soloConEntidad: soloConEntidad,
        soloSaldosIniciales: filtroSaldoInicial === 'SOLO_SALDOS',
      };

      const response = await getLineasMayorContable(params);
      
      let cuentasFiltradas = response.cuentas || [];
      
      if (filtroSaldoInicial === 'SIN_SALDOS') {
        cuentasFiltradas = cuentasFiltradas.map(cuenta => ({
          ...cuenta,
          movimientos: cuenta.movimientos.filter(mov => !mov.asientoContable?.esSaldoInicial)
        })).filter(cuenta => cuenta.movimientos.length > 0);
      }
      
      setCuentas(cuentasFiltradas);
      setTotales(response.totales || { totalDebe: 0, totalHaber: 0, saldoFinal: 0 });
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
    setCuentaFiltro(null);
    setCodigoCuentaFiltro('');
    setSoloConEntidad(false);
    setFiltroSaldoInicial('TODOS');
    setCuentas([]);
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
        return { label: '📋 Todos los Movimientos', severity: 'secondary' };
    }
  };

  const expandirTodas = () => {
    setActiveIndex(cuentas.map((_, i) => i));
  };

  const contraerTodas = () => {
    setActiveIndex([]);
  };

  const fechaTemplate = (rowData) => (
    <span style={{ fontSize: getResponsiveFontSize() }}>{formatearFecha(rowData.asientoContable?.fechaAsiento)}</span>
  );

  const asientoTemplate = (rowData) => (
    <span style={{ fontFamily: 'monospace', fontSize: getResponsiveFontSize() }}>{rowData.asientoContable?.numeroAsiento}</span>
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

  const saldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoAcumulado || 0);
    const moneda = rowData.moneda;
    const severity = saldo >= 0 ? 'success' : 'danger';
    return (
      <Tag
        value={`${moneda?.simbolo || ''} ${formatearNumero(Math.abs(saldo), 2)}`}
        severity={severity}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  const tipoSaldoTemplate = (rowData) => {
    const saldo = Number(rowData.saldoAcumulado || 0);
    const tipo = saldo >= 0 ? 'Deudor' : 'Acreedor';
    const severity = saldo >= 0 ? 'info' : 'warning';
    return (
      <Tag
        value={tipo}
        severity={severity}
        style={{ fontSize: getResponsiveFontSize() }}
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

  const totalMovimientos = cuentas.reduce((sum, c) => sum + c.movimientos.length, 0);

  return (
    <div>
      <Toast ref={toast} />

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>📗 Libro Mayor</h2>
        </div>

        {/* FILTROS */}
        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
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

          <div style={{ flex: 0.25 }}>
            <Button
              icon="pi pi-filter-slash"
              className="p-button-secondary"
              outlined
              onClick={limpiarFiltros}
              disabled={loading}
            />
          </div>
        </div>

        <div
          style={{
            alignItems: "end",
            display: "flex",
            gap: 10,
            marginBottom: 15,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
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
            <label style={{ fontWeight: "bold" }}>Cuenta Específica</label>
            <Dropdown
              value={cuentaFiltro}
              options={planCuentas}
              onChange={(e) => setCuentaFiltro(e.value)}
              optionLabel={(option) => `${option.codigoCuenta} - ${option.nombreCuenta}`}
              optionValue="id"
              placeholder="Todas las cuentas"
              style={{ width: "100%" }}
              filter
              showClear
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
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
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

          <Button
            label="Expandir Todas"
            icon="pi pi-angle-double-down"
            onClick={expandirTodas}
            size="small"
            outlined
          />

          <Button
            label="Contraer Todas"
            icon="pi pi-angle-double-up"
            onClick={contraerTodas}
            size="small"
            outlined
          />

          <Tag value={`${cuentas.length} cuentas`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`${totalMovimientos} movimientos`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Debe: S/ ${formatearNumero(totales.totalDebe, 2)}`} severity="success" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Haber: S/ ${formatearNumero(totales.totalHaber, 2)}`} severity="warning" style={{ fontSize: getResponsiveFontSize() }} />
          <Tag value={`Saldo: S/ ${formatearNumero(totales.saldoFinal, 2)}`} severity="info" style={{ fontSize: getResponsiveFontSize() }} />
        </div>

        {/* ACCORDION POR CUENTA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Cargando...</p>
          </div>
        ) : cuentas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Seleccione Empresa y Periodo para ver datos
          </div>
        ) : (
          <Accordion multiple activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
            {cuentas.map((cuenta, index) => {
              const saldoFinalCuenta = cuenta.totales.saldo;
              const tipoSaldo = saldoFinalCuenta >= 0 ? 'Deudor' : 'Acreedor';
              const colorSaldo = saldoFinalCuenta >= 0 ? '#4caf50' : '#f44336';

              return (
                <AccordionTab
                  key={cuenta.cuentaId}
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '1rem' }}>
                      <div>
                        <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{cuenta.codigoCuenta}</strong>
                        <span style={{ marginLeft: '1rem', fontSize: '1rem' }}>{cuenta.nombreCuenta}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Tag value={`${cuenta.movimientos.length} mov.`} severity="info" />
                        <Tag value={`Debe: S/ ${formatearNumero(cuenta.totales.debe, 2)}`} severity="success" />
                        <Tag value={`Haber: S/ ${formatearNumero(cuenta.totales.haber, 2)}`} severity="warning" />
                        <Tag 
                          value={`Saldo: S/ ${formatearNumero(Math.abs(saldoFinalCuenta), 2)} ${tipoSaldo}`}
                          style={{ backgroundColor: colorSaldo, color: '#fff', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                  }
                >
                  <DataTable
                    value={cuenta.movimientos}
                    size="small"
                    showGridlines
                    stripedRows
                    style={{ fontSize: getResponsiveFontSize() }}
                  >
                    <Column field="asientoContable.fechaAsiento" header="Fecha" body={fechaTemplate} style={{ width: '100px' }} />
                    <Column field="asientoContable.numeroAsiento" header="Asiento" body={asientoTemplate} style={{ width: '120px' }} />
                    <Column field="glosa" header="Glosa" style={{ minWidth: '250px' }} />
                    <Column field="tipoDocumentoOrigen.codigo" header="Tipo Doc" style={{ width: '90px' }} />
                    <Column field="numeroDocumentoOrigen" header="Nº Doc" style={{ width: '130px' }} />
                    <Column header="Entidad" body={entidadTemplate} style={{ minWidth: '200px' }} />
                    <Column header="Debe" body={(rowData) => montoTemplate(rowData, 'debe')} style={{ width: '120px' }} align="right" />
                    <Column header="Haber" body={(rowData) => montoTemplate(rowData, 'haber')} style={{ width: '120px' }} align="right" />
                    <Column header="Saldo" body={saldoTemplate} style={{ width: '120px' }} align="right" />
                    <Column header="Tipo" body={tipoSaldoTemplate} style={{ width: '100px' }} />
                    <Column header="Estado" body={estadoTemplate} style={{ width: '110px' }} />
                    <Column header="Saldo Inicial" body={saldoInicialTemplate} style={{ width: '130px' }} />
                  </DataTable>
                </AccordionTab>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default MayorContable;