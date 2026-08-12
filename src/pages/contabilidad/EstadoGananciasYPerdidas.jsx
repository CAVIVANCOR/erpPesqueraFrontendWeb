import React, { useRef, useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { usePermissions } from "../../hooks/usePermissions";
import { getBalanceComprobacion, exportarSUNATEstadoGyP } from "../../api/contabilidad/balanceComprobacion";
import { getEmpresas } from "../../api/empresa";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getMonedas } from "../../api/moneda";
import { formatearNumero } from "../../utils/utils";
import EmpresaSelector from "../../components/common/EmpresaSelector";
import BooleanToggleButton from "../../components/common/BooleanToggleButton";
import TemporaryPDFViewer from "../../components/reports/TemporaryPDFViewer";
import TemporaryExcelViewer from "../../components/reports/TemporaryExcelViewer";
import { generarEstadoGyPExcel } from "../../components/contabilidad/reports/generarEstadoGyPExcel";
import { generarEstadoGyPPDF } from "../../components/contabilidad/reports/generarEstadoGyPPDF";

const EstadoGananciasYPerdidas = ({ ruta }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const permisos = usePermissions(ruta);
  const toast = useRef(null);
  const menuExport = useRef(null);

  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // ========================================
  // ESTADOS - COPIADO DEL BALANCE GENERAL
  // ========================================
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [monedas, setMonedas] = useState([]);

  const [empresaIdSelector, setEmpresaIdSelector] = useState(usuario?.empresaId || null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [rangoFechas, setRangoFechas] = useState(null);
  const [filtroEsGerencial, setFiltroEsGerencial] = useState(false);
  const [monedaIdFiltro, setMonedaIdFiltro] = useState(null);
  const [nivelDetalle, setNivelDetalle] = useState(6); // ✅ IGUAL QUE BALANCE GENERAL
  const [filtroSaldoInicial, setFiltroSaldoInicial] = useState('TODOS');
  const [periodoAnteriorId, setPeriodoAnteriorId] = useState(null);
  const [buscarCuenta, setBuscarCuenta] = useState('');

  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [reportData, setReportData] = useState(null);

  // ========================================
  // COMPUTED
  // ========================================
  const periodosFiltrados = useMemo(() => {
    if (!empresaIdSelector) return [];
    const añoActual = new Date().getFullYear();
    return periodos.filter(p => {
      const año = p.año || p.anio || p.periodo?.substring(0, 4);
      return Number(p.empresaId) === Number(empresaIdSelector) && Number(año) === añoActual;
    });
  }, [periodos, empresaIdSelector]);

  const monedasOptions = useMemo(() => {
    return monedas.map(m => ({
      ...m,
      simbolo: `${m.simbolo} - ${m.nombreLargo}`
    }));
  }, [monedas]);

  const cuentasGyP = useMemo(() => {
    
    const filtradas = cuentas.filter(c => {
      const tipo = c.tipoCuenta;
      if (tipo !== 'INGRESO' && tipo !== 'GASTO') return false;
      if (buscarCuenta && !c.codigoCuenta?.includes(buscarCuenta) && !c.nombreCuenta?.toLowerCase().includes(buscarCuenta.toLowerCase())) {
        return false;
      }
      return true;
    });

    return filtradas;
  }, [cuentas, buscarCuenta]);

  const totales = useMemo(() => {
    const totalIngresos = cuentasGyP.reduce((sum, c) => {
      if (c.tipoCuenta === 'INGRESO') {
        // Usar saldoFinalHaber para incluir saldos iniciales
        return sum + (c.saldoFinalHaber || 0);
      }
      return sum;
    }, 0);

    const totalGastos = cuentasGyP.reduce((sum, c) => {
      if (c.tipoCuenta === 'GASTO') {
        // Usar saldoFinalDebe para incluir saldos iniciales
        return sum + (c.saldoFinalDebe || 0);
      }
      return sum;
    }, 0);

    return {
      totalIngresos,
      totalGastos,
      utilidad: totalIngresos - totalGastos
    };
  }, [cuentasGyP]);

  // ========================================
  // EFFECTS - COPIADO DEL BALANCE GENERAL
  // ========================================
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
    filtroEsGerencial,
    monedaIdFiltro,
    nivelDetalle,
    filtroSaldoInicial,
  ]);

  // Detectar periodo anterior automáticamente
  useEffect(() => {
    if (periodoSeleccionado && periodos.length > 0) {
      const periodoActual = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));
      if (periodoActual) {
        const año = periodoActual.año || periodoActual.anio;
        const mes = periodoActual.mes;
        
        // Buscar periodo anterior (mes anterior o diciembre del año anterior)
        let periodoAnterior;
        if (mes > 1) {
          periodoAnterior = periodos.find(p => 
            (p.año === año || p.anio === año) && 
            Number(p.mes) === Number(mes) - 1 &&
            Number(p.empresaId) === Number(empresaIdSelector)
          );
        } else {
          periodoAnterior = periodos.find(p => 
            (Number(p.año) === Number(año) - 1 || Number(p.anio) === Number(año) - 1) && 
            Number(p.mes) === 12 &&
            Number(p.empresaId) === Number(empresaIdSelector)
          );
        }
        
        setPeriodoAnteriorId(periodoAnterior?.id || null);
      }
    }
  }, [periodoSeleccionado, periodos, empresaIdSelector]);

  useEffect(() => {
    // Solo establecer periodo inicial si no hay uno seleccionado
    if (periodosFiltrados.length > 0 && !periodoSeleccionado) {
      const mesActual = new Date().getMonth() + 1;
      const periodoActual = periodosFiltrados.find(p => Number(p.mes) === mesActual);
      if (periodoActual) {
        setPeriodoSeleccionado(periodoActual.id);
      } else {
        setPeriodoSeleccionado(periodosFiltrados[0].id);
      }
    }
  }, [periodosFiltrados]);

  // ========================================
  // FUNCIONES DE CARGA - COPIADO DEL BALANCE GENERAL
  // ========================================
  const cargarCatalogos = async () => {
    try {
      const [empresasData, periodosData, monedasData] = await Promise.all([
        getEmpresas(),
        getPeriodosContables(),
        getMonedas(),
      ]);

      setEmpresas(empresasData);
      setPeriodos(periodosData);
      setMonedas(monedasData);
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
    if (!empresaIdSelector || !periodoSeleccionado) return;

    setLoading(true);

    try {
      // Si es "SOLO_SALDOS" y hay periodo anterior, usar el periodo anterior completo
      const periodoAUsar = (filtroSaldoInicial === 'SOLO_SALDOS' && periodoAnteriorId) 
        ? periodoAnteriorId 
        : periodoSeleccionado;

      const params = {
        empresaId: empresaIdSelector,
        periodoContableId: periodoAUsar,
        esGerencial: filtroEsGerencial,
        nivelDetalle: nivelDetalle,
        monedaId: monedaIdFiltro,
      };

      if (rangoFechas?.[0]) params.fechaDesde = rangoFechas[0];
      if (rangoFechas?.[1]) params.fechaHasta = rangoFechas[1];
      
      // Si es "SOLO_SALDOS" y NO hay periodo anterior, mostrar mensaje
      if (filtroSaldoInicial === 'SOLO_SALDOS' && !periodoAnteriorId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se encontró periodo anterior. Mostrando datos del periodo actual.",
          life: 5000,
        });
      }


      const response = await getBalanceComprobacion(params);

      setCuentas(response.cuentas || []);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Se cargaron ${response.cuentas?.length || 0} cuentas`,
        life: 3000,
      });
    } catch (error) {
      console.error("❌ Error al consultar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al cargar datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FUNCIONES DE FILTROS
  // ========================================
  const limpiarFiltros = () => {
    setRangoFechas(null);
    setMonedaIdFiltro(null);
    setBuscarCuenta('');
    setFiltroEsGerencial(false);
    setFiltroSaldoInicial('TODOS');
    setNivelDetalle(6);
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
      case 'TODOS':
        return { label: '📊 Periodo Actual', severity: 'info' };
      case 'SOLO_SALDOS':
        return { label: '📄 Estado G&P Apertura (Periodo Anterior)', severity: 'warning' };
      case 'SIN_SALDOS':
        return { label: '🚫 Sin Saldos Iniciales', severity: 'danger' };
      default:
        return { label: '📊 Periodo Actual', severity: 'info' };
    }
  };

  const buttonConfig = getSaldoInicialButtonConfig();

  // ========================================
  // FUNCIONES DE EXPORTACIÓN
  // ========================================
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

    const empresaData = empresas.find(e => Number(e.id) === Number(empresaIdSelector));
    const periodoData = periodos.find(p => Number(p.id) === Number(periodoSeleccionado));
    const monedaData = monedas.find(m => Number(m.id) === Number(monedaIdFiltro)) || { nombreLargo: "SOLES", codigoSunat: "PEN" };

    if (tipo === 'sunat') {
      try {
        const blob = await exportarSUNATEstadoGyP({
          empresaId: empresaIdSelector,
          periodoContableId: periodoSeleccionado,
          monedaId: monedaIdFiltro,
        });

        const ruc = empresaData?.ruc || '00000000000';
        const año = periodoData?.año || periodoData?.anio || new Date().getFullYear();
        const mes = String(periodoData?.mes || 1).padStart(2, '0');
        const filename = `LE${ruc}${año}${mes}00032000001111.txt`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Archivo SUNAT descargado correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error al exportar SUNAT:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.message || "Error al exportar SUNAT",
          life: 3000,
        });
      }
      return;
    }

    if (cuentasGyP.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin datos",
        detail: "No hay cuentas para exportar",
        life: 3000,
      });
      return;
    }

    const data = {
      empresa: empresaData,
      periodo: periodoData,
      moneda: monedaData,
      cuentas: cuentasGyP,
      totales
    };

    setReportData(data);

    if (tipo === 'excel') {
      setShowExcelViewer(true);
    } else if (tipo === 'pdf') {
      setShowPDFViewer(true);
    }
  };

  const menuExportItems = [
    {
      label: 'Excel',
      icon: 'pi pi-file-excel',
      command: () => handleExportar('excel')
    },
    {
      label: 'PDF',
      icon: 'pi pi-file-pdf',
      command: () => handleExportar('pdf')
    },
    {
      label: 'SUNAT TXT',
      icon: 'pi pi-file',
      command: () => handleExportar('sunat')
    }
  ];

  // ========================================
  // TEMPLATES
  // ========================================
  const montoTemplate = (rowData) => {
    // Usar saldoFinal para incluir saldos iniciales
    const monto = rowData.tipoCuenta === 'INGRESO' 
      ? (rowData.saldoFinalHaber || 0) 
      : (rowData.saldoFinalDebe || 0);
    
    if (monto === 0) return <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>-</span>;
    const color = rowData.tipoCuenta === 'INGRESO' ? '#10B981' : '#EF4444';
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color }}>
        {formatearNumero(monto, 2)}
      </span>
    );
  };

  const footerTemplate = () => {
    const utilidadColor = totales.utilidad >= 0 ? '#10B981' : '#EF4444';
    const utilidadLabel = totales.utilidad >= 0 ? 'Utilidad' : 'Pérdida';
    return (
      <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.75rem', backgroundColor: '#FFFF00', padding: '0.5rem' }}>
        Ingresos: {formatearNumero(totales.totalIngresos, 2)} | 
        Gastos: {formatearNumero(totales.totalGastos, 2)} | 
        <span style={{ color: utilidadColor }}>
          {utilidadLabel}: {formatearNumero(Math.abs(totales.utilidad), 2)}
        </span>
      </div>
    );
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div>
      <style>{`
        .p-datatable .p-datatable-tbody > tr > td {
          padding: 0.25rem 0.5rem !important;
          line-height: 1.2 !important;
        }

        .p-datatable .p-datatable-thead > tr > th {
          padding: 0.4rem 0.5rem !important;
        }
      `}</style>

      <Toast ref={toast} />
      <Menu model={menuExportItems} popup ref={menuExport} />

      <div className="card">
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
            <h2>💰 Estado de Ganancias y Pérdidas</h2>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Empresa*</label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => setEmpresaIdSelector(id)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Periodo*</label>
            <Dropdown
              value={periodoSeleccionado}
              options={periodosFiltrados}
              onChange={(e) => setPeriodoSeleccionado(e.value)}
              optionLabel="nombrePeriodo"
              optionValue="id"
              placeholder="Seleccione"
              style={{ width: "100%" }}
              filter
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Rango Fechas</label>
            <Calendar
              value={rangoFechas}
              onChange={(e) => setRangoFechas(e.value)}
              selectionMode="range"
              dateFormat="dd/mm/yy"
              placeholder="Opcional"
              style={{ width: "100%" }}
              showIcon
              readOnlyInput
            />
          </div>

          <div style={{ flex: 0.25 }}>
            <Button
              icon="pi pi-filter-slash"
              outlined
              severity="secondary"
              onClick={limpiarFiltros}
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <Button
              label="Exportar"
              icon="pi pi-download"
              severity="success"
              onClick={(e) => menuExport.current.toggle(e)}
              disabled={!empresaIdSelector || !periodoSeleccionado}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1.5, minWidth: '250px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Periodo a Mostrar</label>
            <Button
              label={buttonConfig.label}
              severity={buttonConfig.severity}
              onClick={toggleFiltroSaldoInicial}
              size="small"
              style={{ width: '100%', fontSize: '0.75rem' }}
              tooltip={filtroSaldoInicial === 'SOLO_SALDOS' ? 'Muestra el Estado G&P del periodo anterior para presentar como Apertura' : ''}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Tipo Asiento</label>
            <BooleanToggleButton
              value={filtroEsGerencial}
              onChange={setFiltroEsGerencial}
              labelTrue="🟢 GERENCIAL"
              labelFalse="📘 FISCAL"
              severityTrue="success"
              severityFalse="info"
              size="small"
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>Moneda</label>
            <Dropdown
              value={monedaIdFiltro}
              options={monedasOptions}
              onChange={(e) => setMonedaIdFiltro(e.value)}
              optionLabel="simbolo"
              optionValue="id"
              placeholder="Todas"
              style={{ width: "100%" }}
              showClear
            />
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ fontWeight: "bold", fontSize: '0.9rem' }}>🔍 Buscar Cuenta</label>
            <InputText
              value={buscarCuenta}
              onChange={(e) => setBuscarCuenta(e.target.value)}
              placeholder="Código o nombre..."
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <DataTable
          value={cuentasGyP}
          loading={loading}
          size="small"
          stripedRows
          showGridlines
          footer={footerTemplate}
          emptyMessage="No hay datos para mostrar"
          scrollable
          scrollHeight="calc(100vh - 400px)"
        >
          <Column
            field="codigoCuenta"
            header="Código"
            style={{ width: '100px', fontSize: '0.7rem' }}
            headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
          />
          <Column
            field="nombreCuenta"
            header="Denominación"
            style={{ fontSize: '0.7rem' }}
            headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
          />
          <Column
            field="tipoCuenta"
            header="Tipo"
            style={{ width: '100px', fontSize: '0.7rem' }}
            headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
          />
          <Column
            header="Monto"
            body={montoTemplate}
            align="right"
            style={{ width: '150px' }}
            headerStyle={{ fontSize: '0.85rem', fontWeight: 'bold' }}
          />
        </DataTable>
      </div>

      {showExcelViewer && reportData && (
        <TemporaryExcelViewer
          visible={showExcelViewer}
          onHide={() => setShowExcelViewer(false)}
          generateExcel={generarEstadoGyPExcel}
          data={reportData}
          fileName={`Estado_GyP_${reportData.periodo?.nombrePeriodo || 'reporte'}.xlsx`}
          title="Estado de Ganancias y Pérdidas"
        />
      )}

      {showPDFViewer && reportData && (
        <TemporaryPDFViewer
          visible={showPDFViewer}
          onHide={() => setShowPDFViewer(false)}
          generatePDF={generarEstadoGyPPDF}
          data={reportData}
          fileName={`Estado_GyP_${reportData.periodo?.nombrePeriodo || 'reporte'}.pdf`}
          title="Estado de Ganancias y Pérdidas"
        />
      )}
    </div>
  );
};

export default EstadoGananciasYPerdidas;
