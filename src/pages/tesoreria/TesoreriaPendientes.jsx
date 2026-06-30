import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";

// Components
import PendientesHeader from "./components/PendientesHeader";
import PendientesTable from "./components/PendientesTable";
import SaldosCuentasPanel from "./components/SaldosCuentasPanel";
import PagoCuentaPorCobrarForm from "../../components/pagoCuentaPorCobrar/PagoCuentaPorCobrarForm";
import PagarCuentaPorCobrarEspecializadoDialog from "../../components/pagoCuentaPorCobrar/PagarCuentaPorCobrarEspecializadoDialog";
import EntregarFondosForm from "../../components/entregaFondos/EntregarFondosForm";
import PagarDeudaPersonalDialog from "../../components/tesoreria/PagarDeudaPersonalDialog";
import EmpresaSelector from "../../components/common/EmpresaSelector";  // ✅ AGREGAR
import PagarDeudaTributariaDialog from "../../components/tesoreria/PagarDeudaTributariaDialog";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
// Hooks
import usePendientesData from "./hooks/usePendientesData";
import useSaldosCuentas from "./hooks/useSaldosCuentas";
import useRegistrarPago from "./hooks/useRegistrarPago";
import useEntregarFondos from "../../components/entregaFondos/useEntregarFondos";
import usePagarDeudaPersonal from "./hooks/usePagarDeudaPersonal";
import usePagarDeudaTributaria from "./hooks/usePagarDeudaTributaria";
// APIs
import { getAllMonedas } from "../../api/moneda";
import { getMediosPago } from "../../api/medioPago";
import { getAllBancos } from "../../api/banco";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";
import { getAllEmpresas } from "../../api/empresa";  // ✅ AGREGAR AL INICIO
import {
  TIPO_FILTRO_TESORERIA,
  TIPO_DEUDA_TESORERIA,
  TIPO_VENCIMIENTO_TESORERIA,
  TIPO_OPERACION_TESORERIA,
} from "../../utils/tesoreria.constants";
// Utils
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getTiposMovimiento } from "../../api/tipoMovimiento";
import { getTiposDetraccion } from "../../api/tesoreria/tipoDetraccion";
import { getTiposRetencionPercepcion } from "../../api/tesoreria/tipoRetencionPercepcion";

const TesoreriaPendientes = () => {
  // Refs
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [showEntregaFondosDialog, setShowEntregaFondosDialog] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [showPagoDeudaPersonalDialog, setShowPagoDeudaPersonalDialog] = useState(false);
  const [deudaPersonalSeleccionada, setDeudaPersonalSeleccionada] = useState(null);
  const [showPagoDeudaTributariaDialog, setShowPagoDeudaTributariaDialog] = useState(false);
  const [deudaTributariaSeleccionada, setDeudaTributariaSeleccionada] = useState(null);
  const [showPagoEspecializadoDialog, setShowPagoEspecializadoDialog] = useState(false);
  const [cuentaPorCobrarEspecializada, setCuentaPorCobrarEspecializada] = useState(null);
  // 🆕 Estados para diálogos de operaciones
  const [showTransferenciaInternaDialog, setShowTransferenciaInternaDialog] = useState(false);
  const [showPagoProveedorDialog, setShowPagoProveedorDialog] = useState(false);
  const [showRetiroDineroDialog, setShowRetiroDineroDialog] = useState(false);
  const [showIngresoDineroDialog, setShowIngresoDineroDialog] = useState(false);
  const [showGastoUrgenteDialog, setShowGastoUrgenteDialog] = useState(false);

  const [filtros, setFiltros] = useState({
    empresaId: usuario?.empresaId || null,
    tipo: TIPO_FILTRO_TESORERIA.TODOS,
    vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
    monedaId: null,
    tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
  });
  // Estados para catálogos
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estadosCxC, setEstadosCxC] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [empresas, setEmpresas] = useState([]);  // ✅ AGREGAR
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [tiposDetraccion, setTiposDetraccion] = useState([]);
  const [tiposRetencionPercepcion, setTiposRetencionPercepcion] = useState([]);
  // Hooks personalizados
  const {
    pendientes,
    resumen,
    loading: loadingPendientes,
    error: errorPendientes,
    recargarPendientes,
    permisos,
  } = usePendientesData(filtros);

  const {
    saldosCuentas,
    saldoConsolidado,
    loading: loadingSaldos,
    error: errorSaldos,
    recargarSaldos,
  } = useSaldosCuentas(filtros.empresaId);

  const { registrarPago, loading: loadingPago } = useRegistrarPago({
    toast,
    onSuccess: () => {
      setShowPagoDialog(false);
      setDocumentoSeleccionado(null);
      recargarPendientes();
      recargarSaldos();
    },
  });


  const { entregarFondos, loading: loadingEntrega } = useEntregarFondos({
    toast,
    onSuccess: () => {
      setShowEntregaFondosDialog(false);
      setAsignacionSeleccionada(null);
      recargarPendientes();
      recargarSaldos();
    },
  });

  // Línea 95 - AGREGAR
  const { pagarDeuda, loading: loadingPagoDeuda } = usePagarDeudaPersonal({
    toast,
    onSuccess: () => {
      setShowPagoDeudaPersonalDialog(false);
      setDeudaPersonalSeleccionada(null);
      recargarPendientes();
      recargarSaldos();
    },
  });

  const { pagarDeuda: pagarDeudaTributaria, loading: loadingPagoDeudaTributaria } = usePagarDeudaTributaria({
    toast,
    onSuccess: () => {
      setShowPagoDeudaTributariaDialog(false);
      setDeudaTributariaSeleccionada(null);
      recargarPendientes();
      recargarSaldos();
    },
  });

  // Verificar acceso
  if (!permisos.tieneAcceso || !permisos.puedeVer) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setLoadingCatalogos(true);
        const [
          monedasData,
          mediosPagoData,
          bancosData,
          estadosData,
          periodosData,
          empresasData,
          tiposMovimientoData,
          tiposDetraccionData,
          tiposRetencionPercepcionData,
          clientesData,
          estadosCxCData,
        ] = await Promise.all([
          getAllMonedas(),
          getMediosPago(),
          getAllBancos(),
          getEstadosMultiFuncion(),
          getPeriodosContables(),
          getAllEmpresas(),
          getTiposMovimiento(),
          getTiposDetraccion(),
          getTiposRetencionPercepcion(),
          getEntidadesComerciales(),
          getEstadosMultiFuncionPorTipoProviene(24), // Estados de Cuenta por Cobrar
        ]);
        setMonedas(monedasData);
        setMediosPago(mediosPagoData);
        setBancos(bancosData);
        setEstados(estadosData);
        setPeriodosContables(periodosData);
        setEmpresas(empresasData || []);
        setTiposMovimiento(tiposMovimientoData || []);
        setTiposDetraccion(tiposDetraccionData || []);
        setTiposRetencionPercepcion(tiposRetencionPercepcionData || []);
        setClientes(clientesData || []);
        setEstadosCxC(estadosCxCData || []);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar catálogos necesarios",
          life: 3000,
        });
      } finally {
        setLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
  }, []);

  // Effects
  useEffect(() => {
    if (errorPendientes) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorPendientes,
        life: 3000,
      });
    }
  }, [errorPendientes]);

  useEffect(() => {
    if (errorSaldos) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorSaldos,
        life: 3000,
      });
    }
  }, [errorSaldos]);

  // Handlers
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      empresaId: usuario?.empresaId || null,
      tipo: TIPO_FILTRO_TESORERIA.TODOS,
      vencimiento: TIPO_VENCIMIENTO_TESORERIA.TODOS,
      monedaId: null,
      tipoDeuda: TIPO_DEUDA_TESORERIA.NINGUNO,
    });
  };


  const handlePagarDeudaTributaria = (deuda) => {
    setDeudaTributariaSeleccionada(deuda);
    setShowPagoDeudaTributariaDialog(true);
  };

  const handleGuardarPagoDeudaTributaria = async (formData) => {
    try {
      await pagarDeudaTributaria(deudaTributariaSeleccionada.id, {
        ...formData,
        usuarioId: usuario?.id,
      });
    } catch (error) {
      console.error("Error al guardar pago deuda tributaria:", error);
    }
  };

  const handleCancelarPagoDeudaTributaria = () => {
    setShowPagoDeudaTributariaDialog(false);
    setDeudaTributariaSeleccionada(null);
  };

  const handleRegistrarPago = (documento) => {
    setDocumentoSeleccionado(documento);
    setShowPagoDialog(true);
  };

  const handleGuardarPago = async (formData) => {
    // El formData ya viene con el formato correcto desde PagoCuentaPorCobrarForm
    // Solo necesitamos agregar campos específicos de Tesorería Pendientes
    const datosPago = {
      ...formData,
      tipo: documentoSeleccionado.tipo === "INGRESO" ? "COBRAR" : "PAGAR",
      cuentaPorCobrarId:
        documentoSeleccionado.tipo === "INGRESO"
          ? documentoSeleccionado.origenId
          : null,
      cuentaPorPagarId:
        documentoSeleccionado.tipo === "EGRESO"
          ? documentoSeleccionado.origenId
          : null,
      empresaId: documentoSeleccionado.empresa?.id,
    };

    await registrarPago(datosPago);
  };

  const handleCancelarPago = () => {
    setShowPagoDialog(false);
    setDocumentoSeleccionado(null);
  };


  const handleEntregarFondos = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setShowEntregaFondosDialog(true);
  };

  const handleGuardarEntrega = async (formData) => {
    await entregarFondos(formData);
  };

  const handlePagoEspecializado = (documento) => {
    // Convertir documento de pendientes a formato de cuenta por cobrar
    const cuentaPorCobrar = {
      id: documento.origenId,
      empresaId: documento.empresa?.id,
      numeroPreFactura: documento.documentoNumero,
      fechaEmision: documento.fechaEmision,
      monedaId: documento.moneda?.id,
      montoTotal: documento.montoTotal,
      montoPagado: documento.montoPagado || 0,
      saldoPendiente: documento.saldoPendiente,
      cliente: documento.entidadComercial,
      moneda: documento.moneda,
      estado: documento.estado,
    };

    setCuentaPorCobrarEspecializada(cuentaPorCobrar);
    setShowPagoEspecializadoDialog(true);
  };

  const handleCancelarPagoEspecializado = () => {
    setShowPagoEspecializadoDialog(false);
    setCuentaPorCobrarEspecializada(null);
  };

  const handleSuccessPagoEspecializado = () => {
    setShowPagoEspecializadoDialog(false);
    setCuentaPorCobrarEspecializada(null);
    recargarPendientes();
    recargarSaldos();
  };

  const handleCancelarEntrega = () => {
    setShowEntregaFondosDialog(false);
    setAsignacionSeleccionada(null);
  };
  // Línea 225 - AGREGAR
  const handlePagarDeudaPersonal = (deuda) => {
    setDeudaPersonalSeleccionada(deuda);
    setShowPagoDeudaPersonalDialog(true);
  };

  const handleGuardarPagoDeuda = async (formData) => {
    await pagarDeuda(deudaPersonalSeleccionada.origenId, formData);
  };

  const handleCancelarPagoDeuda = () => {
    setShowPagoDeudaPersonalDialog(false);
    setDeudaPersonalSeleccionada(null);
  };

  // 🆕 Handler para operaciones
  const handleOperacion = (operacion) => {
    switch (operacion) {
      case TIPO_OPERACION_TESORERIA.TRANSFERENCIA_INTERNA:
        setShowTransferenciaInternaDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.PAGO_PROVEEDOR:
        setShowPagoProveedorDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.RETIRO_DINERO:
        setShowRetiroDineroDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.INGRESO_DINERO:
        setShowIngresoDineroDialog(true);
        break;
      case TIPO_OPERACION_TESORERIA.GASTO_URGENTE:
        setShowGastoUrgenteDialog(true);
        break;
      default:
        console.warn("Operación no reconocida:", operacion);
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />
      {/* ✅ AGREGAR: Selector de Empresa */}
      <Card className="mb-3">
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="empresa" className="font-bold">
              🏢 Empresa
            </label>
            <EmpresaSelector
              empresaId={usuario?.empresaId}
              onEmpresaChange={(id) => handleFiltroChange("empresaId", id)}
            />
          </div>
        </div>
      </Card>
      {/* Panel de Saldos de Cuentas Corrientes */}
      <SaldosCuentasPanel
        saldosCuentas={saldosCuentas}
        saldoConsolidado={saldoConsolidado}
        loading={loadingSaldos}
        empresaId={filtros.empresaId}
      />
      {/* Header con filtros */}
      <PendientesHeader
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onLimpiarFiltros={handleLimpiarFiltros}
        resumen={resumen}
        loading={loadingPendientes}
        permisos={permisos}
        onOperacion={handleOperacion} // ✅ NUEVO
      />
      {/* Tabla de Pendientes */}
      <Card title="📋 Documentos Pendientes">
        <PendientesTable
          pendientes={pendientes}
          loading={loadingPendientes}
          onRegistrarPago={handleRegistrarPago}
          onEntregarFondos={handleEntregarFondos}
          onPagarDeudaPersonal={handlePagarDeudaPersonal}
          onPagarDeudaTributaria={handlePagarDeudaTributaria}
          onPagoEspecializado={handlePagoEspecializado}
          permisos={permisos}
        />
      </Card>

      {/* Diálogo para registrar pago/cobro */}
      {documentoSeleccionado && (
        <Dialog
          header={`${documentoSeleccionado.tipo === "INGRESO" ? "💰 Registrar Cobro" : "💸 Registrar Pago"} - ${documentoSeleccionado.documentoNumero}`}
          visible={showPagoDialog}
          style={{ width: "90vw", maxWidth: "1200px" }}
          onHide={handleCancelarPago}
          modal
          maximizable
        >
          {/* Formulario de pago */}
          <PagoCuentaPorCobrarForm
            isEdit={false}
            defaultValues={{
              cuentaPorCobrarId:
                documentoSeleccionado.tipo === "INGRESO"
                  ? documentoSeleccionado.origenId
                  : null,
              empresaId: documentoSeleccionado.empresa?.id,
              monedaPagoId: documentoSeleccionado.moneda?.id,
              monedaDeudaId: documentoSeleccionado.moneda?.id,
              // ✅ Campos eliminados para permitir lógica automática:
              // - montoPagado: Usuario lo ingresa manualmente
              // - montoAplicadoDeuda: Se calcula automáticamente
              // - tipoCambio: Se consulta automáticamente vía API SUNAT cuando cambia fechaPago
            }}
            cuentasPorCobrar={
              documentoSeleccionado.tipo === "INGRESO"
                ? [
                  {
                    id: documentoSeleccionado.origenId,
                    numeroPreFactura: documentoSeleccionado.documentoNumero,
                    fechaEmision: documentoSeleccionado.fechaEmision,
                    clienteId: documentoSeleccionado.entidadComercial?.id,
                    empresaId: documentoSeleccionado.empresa?.id,
                    monedaId: documentoSeleccionado.moneda?.id,
                    montoTotal: documentoSeleccionado.montoTotal,
                    saldoPendiente: documentoSeleccionado.saldoPendiente,
                  },
                ]
                : []
            }
            monedas={monedas}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={saldosCuentas}
            estados={estados}
            periodosContables={periodosContables}
            onSubmit={handleGuardarPago}
            onCancel={handleCancelarPago}
            loading={loadingPago}
            readOnly={false}
            hideCuentaField={false}
            toast={toast}
            empresaIdCuenta={documentoSeleccionado.empresa?.id}
            clienteIdCuenta={documentoSeleccionado.entidadComercial?.id}
          />
        </Dialog>
      )}

      {/* Diálogo para entregar fondos (Asignaciones) */}
      {asignacionSeleccionada && (
        <Dialog
          header={`💵 Entregar Fondos - ${asignacionSeleccionada.entidadComercial?.razonSocial || 'N/A'}`}
          visible={showEntregaFondosDialog}
          style={{ width: "90vw", maxWidth: "900px" }}
          onHide={handleCancelarEntrega}
          modal
          maximizable
        >
          <EntregarFondosForm
            asignacion={asignacionSeleccionada}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            onSubmit={handleGuardarEntrega}
            onCancel={handleCancelarEntrega}
            loading={loadingEntrega}
          />
        </Dialog>
      )}

      {/* Diálogo para pagar deuda personal */}
      {deudaPersonalSeleccionada && (
        <Dialog
          header={`💵 Pagar Deuda Personal - ${deudaPersonalSeleccionada.entidadComercial?.razonSocial || 'N/A'}`}
          visible={showPagoDeudaPersonalDialog}
          style={{ width: "90vw", maxWidth: "900px" }}
          onHide={handleCancelarPagoDeuda}
          modal
          maximizable
        >
          <PagarDeudaPersonalDialog
            deuda={{
              ...deudaPersonalSeleccionada,
              empresaId: deudaPersonalSeleccionada.empresa?.id,
              personalId: deudaPersonalSeleccionada.entidadComercial?.id,
              personal: {
                nombres: deudaPersonalSeleccionada.entidadComercial?.razonSocial?.split(' ')[0] || '',
                apellidoPaterno: deudaPersonalSeleccionada.entidadComercial?.razonSocial?.split(' ')[1] || '',
                apellidoMaterno: deudaPersonalSeleccionada.entidadComercial?.razonSocial?.split(' ')[2] || '',
              },
              tipoDeuda: {
                nombre: deudaPersonalSeleccionada.tipoMovimiento?.nombre || 'N/A',
              },
              montoOriginal: deudaPersonalSeleccionada.montoTotal,
              montoPagado: deudaPersonalSeleccionada.montoPagado || 0,
              saldoPendiente: deudaPersonalSeleccionada.saldoPendiente,
              moneda: deudaPersonalSeleccionada.moneda,
              estado: deudaPersonalSeleccionada.estado,
            }}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            onSubmit={handleGuardarPagoDeuda}
            onCancel={handleCancelarPagoDeuda}
            loading={loadingPagoDeuda}
            toast={toast}
          />
        </Dialog>
      )}
      {/* Diálogo para pagar deuda tributaria */}
      {deudaTributariaSeleccionada && (
        <Dialog
          header={`🏛️ Pagar Deuda Tributaria - ${deudaTributariaSeleccionada.tipoDeuda?.nombre || 'N/A'}`}
          visible={showPagoDeudaTributariaDialog}
          style={{ width: "90vw", maxWidth: "900px" }}
          onHide={handleCancelarPagoDeudaTributaria}
          modal
          maximizable
        >
          <PagarDeudaTributariaDialog
            deuda={deudaTributariaSeleccionada}
            cuentasCorrientes={saldosCuentas}
            mediosPago={mediosPago}
            onSubmit={handleGuardarPagoDeudaTributaria}
            onCancel={handleCancelarPagoDeudaTributaria}
            loading={loadingPagoDeudaTributaria}
            toast={toast}
          />
        </Dialog>
      )}


      {/* Diálogo para pago especializado de cuenta por cobrar */}
      {cuentaPorCobrarEspecializada && (
        <PagarCuentaPorCobrarEspecializadoDialog
          visible={showPagoEspecializadoDialog}
          onHide={handleCancelarPagoEspecializado}
          cuentaPorCobrar={cuentaPorCobrarEspecializada}
          monedas={monedas}
          mediosPago={mediosPago}
          bancos={bancos}
          cuentasCorrientes={saldosCuentas}
          tiposMovimiento={tiposMovimiento}
          tiposDetraccion={tiposDetraccion}
          tiposRetencionPercepcion={tiposRetencionPercepcion}
          periodosContables={periodosContables}
          empresas={empresas}
          clientes={clientes}
          estadosCxC={estadosCxC}
          toast={toast}
          onSuccess={handleSuccessPagoEspecializado}
        />
      )}

      {/* 🆕 Diálogos de Operaciones (Placeholders) */}
      <Dialog
        header="🔄 Transferencia Interna"
        visible={showTransferenciaInternaDialog}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setShowTransferenciaInternaDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="💸 Pago a Proveedor"
        visible={showPagoProveedorDialog}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setShowPagoProveedorDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="💵 Retiro de Dinero"
        visible={showRetiroDineroDialog}
        style={{ width: "90vw", maxWidth: "700px" }}
        onHide={() => setShowRetiroDineroDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="💰 Ingreso de Dinero"
        visible={showIngresoDineroDialog}
        style={{ width: "90vw", maxWidth: "700px" }}
        onHide={() => setShowIngresoDineroDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>

      <Dialog
        header="🚨 Gasto Directo Urgente"
        visible={showGastoUrgenteDialog}
        style={{ width: "90vw", maxWidth: "900px" }}
        onHide={() => setShowGastoUrgenteDialog(false)}
        modal
      >
        <p>Funcionalidad en desarrollo...</p>
      </Dialog>


    </div>
  );
};

export default TesoreriaPendientes;
