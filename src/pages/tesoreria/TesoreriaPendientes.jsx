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
import EntregarFondosForm from "../../components/entregaFondos/EntregarFondosForm";

// Hooks
import usePendientesData from "./hooks/usePendientesData";
import useSaldosCuentas from "./hooks/useSaldosCuentas";
import useRegistrarPago from "./hooks/useRegistrarPago";
import useEntregarFondos from "../../components/entregaFondos/useEntregarFondos";

// APIs
import { getAllMonedas } from "../../api/moneda";
import { getMediosPago } from "../../api/medioPago";
import { getAllBancos } from "../../api/banco";
import { getEstadosMultiFuncion } from "../../api/estadoMultiFuncion";
import { getPeriodosContables } from "../../api/contabilidad/periodoContable";

// Utils
import { formatearNumero } from "../../utils/utils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const TesoreriaPendientes = () => {
  // Refs
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  // Estados
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [showEntregaFondosDialog, setShowEntregaFondosDialog] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    empresaId: null,
    tipo: null, // 'COBRAR' | 'PAGAR'
    vencimiento: null, // 'VENCIDOS' | 'HOY' | 'SEMANA'
    monedaId: null,
  });

  // Estados para catálogos
  const [monedas, setMonedas] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

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
        ] = await Promise.all([
          getAllMonedas(),
          getMediosPago(),
          getAllBancos(),
          getEstadosMultiFuncion(),
          getPeriodosContables(),
        ]);
        setMonedas(monedasData);
        setMediosPago(mediosPagoData);
        setBancos(bancosData);
        setEstados(estadosData);
        setPeriodosContables(periodosData);
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
      empresaId: null,
      tipo: null,
      vencimiento: null,
      monedaId: null,
    });
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

  const handleCancelarEntrega = () => {
    setShowEntregaFondosDialog(false);
    setAsignacionSeleccionada(null);
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <ConfirmDialog />
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
      />
      {/* Tabla de Pendientes */}
      <Card title="📋 Documentos Pendientes">
        <PendientesTable
          pendientes={pendientes}
          loading={loadingPendientes}
          onRegistrarPago={handleRegistrarPago}
          onEntregarFondos={handleEntregarFondos}
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
    </div>
  );
};

export default TesoreriaPendientes;
