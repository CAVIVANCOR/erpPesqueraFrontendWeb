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

  const [lineasFlat, setLineasFlat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [entidades, setEntidades] = useState([]);

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
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');

  const [totales, setTotales] = useState({
    totalDebe: 0,
    totalHaber: 0,
  });

  const [estadisticas, setEstadisticas] = useState({
    totalAsientos: 0,
    totalLineas: 0,
  });

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
    numeroAsientoFiltro,
    codigoCuentaFiltro,
    soloCuadrados,
    soloDescuadrados,
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
      setCuentas(cuentasData);
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
        numeroAsiento: numeroAsientoFiltro,
        estadoAsientoId: estadoFiltro,
        tipoLibro: tipoLibroFiltro,
        codigoCuentaInicia: codigoCuentaFiltro,
        soloCuadrados: soloCuadrados,
        soloDescuadrados: soloDescuadrados,
        soloConEntidad: soloConEntidad,
        soloSaldosIniciales: filtroSaldoInicial === 'SOLO_SALDOS',
      };

      const response = await getLineasDiarioContable(params);
      
      let asientosFiltrados = response.asientos || [];
      
      if (filtroSaldoInicial === 'SIN_SALDOS') {
        asientosFiltrados = asientosFiltrados.filter(asiento => !asiento.esSaldoInicial);
      }
      
      // Convertir a formato plano con filas especiales
      const flat = [];
      asientosFiltrados.forEach((asiento, asientoIndex) => {
        // FILA HEADER DEL ASIENTO
        flat.push({
          _tipo: 'HEADER',
          _asientoIndex: asientoIndex,
          numeroAsiento: asiento.numeroAsiento,
          fechaAsiento: asiento.fechaAsiento,
          glosaAsiento: asiento.glosaAsiento,
          tipoLibro: asiento.tipoLibro,
          estado: asiento.estado,
          estaCuadrado: asiento.estaCuadrado,
          esSaldoInicial: asiento.esSaldoInicial,
          totales: asiento.totales,
        });
        
        // FILAS DE LÍNEAS
        asiento.lineas.forEach(linea => {
          flat.push({
            _tipo: 'LINEA',
            _asientoIndex: asientoIndex,
            ...linea,
          });
        });
        
        // FILA FOOTER CON TOTALES
        flat.push({
          _tipo: 'FOOTER',
          _asientoIndex: asientoIndex,
          totales: asiento.totales,
          estaCuadrado: asiento.estaCuadrado,
        });
        
        // FILA SEPARADOR
        flat.push({
          _tipo: 'SEPARADOR',
          _asientoIndex: asientoIndex,
        });
      });
      
      setLineasFlat(flat);
      setTotales(response.totales || { totalDebe: 0, totalHaber: 0 });
      setEstadisticas({
        totalAsientos: asientosFiltrados.length,
        totalLineas: response.totalLineas || 0,
      });
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
    setLineasFlat([]);
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

  // TEMPLATES PARA DIFERENTES TIPOS DE FILA
  const rowClassName = (rowData) => {
    if (rowData._tipo === 'HEADER') return 'diario-header';
    if (rowData._tipo === 'FOOTER') return 'diario-footer';
    if (rowData._tipo === 'SEPARADOR') return 'diario-separador';
    return 'diario-linea';
  };

  const lineaTemplate = (rowData) => {
    if (rowData._tipo !== 'LINEA') return null;
    return <span style={{ fontFamily: 'monospace' }}>L{rowData.numeroLinea}</span>;
  };

  const cuentaTemplate = (rowData) => {
    if (rowData._tipo !== 'LINEA') return null;
    return (
      <div>
        <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{rowData.planCuenta?.codigoCuenta}</div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{rowData.planCuenta?.nombreCuenta}</div>
      </div>
    );
  };

  const glosaTemplate = (rowData) => {
    if (rowData._tipo === 'HEADER') {
      return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontWeight: 'bold' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>ASIENTO: {rowData.numeroAsiento}</span>
          <span>|</span>
          <span>FECHA: {formatearFecha(rowData.fechaAsiento)}</span>
          <span>|</span>
          <span>GLOSA: {rowData.glosaAsiento}</span>
          {rowData.esSaldoInicial && <Tag value="SALDO INICIAL" severity="warning" />}
          <ColorTag estado={rowData.estado} />
        </div>
      );
    }
    if (rowData._tipo === 'FOOTER') {
      return <strong>TOTALES DEL ASIENTO</strong>;
    }
    if (rowData._tipo === 'SEPARADOR') {
      return null;
    }
    return rowData.glosa;
  };

  const documentoTemplate = (rowData) => {
    if (rowData._tipo !== 'LINEA') return null;
    if (!rowData.tipoDocumentoOrigen && !rowData.numeroDocumentoOrigen) return null;
    return (
      <div>
        <div>{rowData.tipoDocumentoOrigen?.codigo}</div>
        <div style={{ fontSize: '0.85rem' }}>{rowData.numeroDocumentoOrigen}</div>
      </div>
    );
  };

  const entidadTemplate = (rowData) => {
    if (rowData._tipo !== 'LINEA') return null;
    if (!rowData.entidadComercial) return null;
    return (
      <div>
        <div>{rowData.entidadComercial.razonSocial}</div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{rowData.entidadComercial.ruc}</div>
      </div>
    );
  };

  const debeTemplate = (rowData) => {
    if (rowData._tipo === 'FOOTER') {
      return (
        <Tag
          value={`S/ ${formatearNumero(rowData.totales.debe, 2)}`}
          severity="success"
          style={{ fontWeight: 'bold', fontSize: '1rem' }}
        />
      );
    }
    if (rowData._tipo !== 'LINEA') return null;
    
    const monto = Number(rowData.debe);
    if (monto === 0) return null;
    return (
      <Tag
        value={`${rowData.moneda?.simbolo || ''} ${formatearNumero(monto, 2)}`}
        style={{ backgroundColor: rowData.moneda?.colorFondo || '#fff', color: '#000' }}
      />
    );
  };

  const haberTemplate = (rowData) => {
    if (rowData._tipo === 'FOOTER') {
      return (
        <Tag
          value={`S/ ${formatearNumero(rowData.totales.haber, 2)}`}
          severity="warning"
          style={{ fontWeight: 'bold', fontSize: '1rem' }}
        />
      );
    }
    if (rowData._tipo !== 'LINEA') return null;
    
    const monto = Number(rowData.haber);
    if (monto === 0) return null;
    return (
      <Tag
        value={`${rowData.moneda?.simbolo || ''} ${formatearNumero(monto, 2)}`}
        style={{ backgroundColor: rowData.moneda?.colorFondo || '#fff', color: '#000' }}
      />
    );
  };

  const cuadreTemplate = (rowData) => {
    if (rowData._tipo === 'FOOTER') {
      const diferencia = Math.abs(rowData.totales.diferencia);
      return rowData.estaCuadrado ? (
        <Tag value="✅ CUADRADO" severity="success" style={{ fontWeight: 'bold' }} />
      ) : (
        <Tag value={`❌ DESC. (${formatearNumero(diferencia, 2)})`} severity="danger" style={{ fontWeight: 'bold' }} />
      );
    }
    return null;
  };

  const buttonConfig = getSaldoInicialButtonConfig();

  return (
    <div>
      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2>📘 Libro Diario</h2>
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
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              inputId="soloCuadrados"
              checked={soloCuadrados}
              onChange={(e) => setSoloCuadrados(e.checked)}
            />
            <label htmlFor="soloCuadrados" style={{ marginLeft: "0.5rem" }}>Solo Cuadrados</label>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              inputId="soloDescuadrados"
              checked={soloDescuadrados}
              onChange={(e) => setSoloDescuadrados(e.checked)}
            />
            <label htmlFor="soloDescuadrados" style={{ marginLeft: "0.5rem" }}>Solo Descuadrados</label>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              inputId="soloConEntidad"
              checked={soloConEntidad}
              onChange={(e) => setSoloConEntidad(e.checked)}
            />
            <label htmlFor="soloConEntidad" style={{ marginLeft: "0.5rem" }}>Solo con Entidad</label>
          </div>

          <Button
            label={buttonConfig.label}
            severity={buttonConfig.severity}
            onClick={toggleFiltroSaldoInicial}
            size="small"
          />

          <Tag value={`${estadisticas.totalAsientos} asientos`} severity="info" />
          <Tag value={`${estadisticas.totalLineas} líneas`} severity="info" />
          <Tag value={`Debe: S/ ${formatearNumero(totales.totalDebe, 2)}`} severity="success" />
          <Tag value={`Haber: S/ ${formatearNumero(totales.totalHaber, 2)}`} severity="warning" />
        </div>

        {/* DATATABLE CONTINUA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Cargando...</p>
          </div>
        ) : lineasFlat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Seleccione Empresa y Periodo para ver datos
          </div>
        ) : (
          <DataTable
            value={lineasFlat}
            size="small"
            showGridlines
            paginator
            rows={100}
            rowsPerPageOptions={[50, 100, 200, 500]}
            rowClassName={rowClassName}
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column body={lineaTemplate} header="Línea" style={{ width: '70px' }} />
            <Column body={cuentaTemplate} header="Cuenta" style={{ minWidth: '200px' }} />
            <Column body={glosaTemplate} header="Glosa / Detalle" style={{ minWidth: '350px' }} />
            <Column body={documentoTemplate} header="Documento" style={{ width: '120px' }} />
            <Column body={entidadTemplate} header="Entidad" style={{ minWidth: '200px' }} />
            <Column body={debeTemplate} header="Debe" style={{ width: '130px' }} align="right" />
            <Column body={haberTemplate} header="Haber" style={{ width: '130px' }} align="right" />
            <Column body={cuadreTemplate} header="Cuadre" style={{ width: '150px' }} align="center" />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default DiarioContable;