// src/components/pagoCuentaPorCobrar/PagarCuentaPorCobrarEspecializadoDialog.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import BooleanToggleButton from '../common/BooleanToggleButton';
import CuentaCorrienteSelector from '../common/CuentaCorrienteSelector';
import { consultarTipoCambioSunat } from '../../api/consultaExterna';
import {
  procesarPagoEspecializado,
  actualizarUrlVoucherConsolidado,
  actualizarUrlVoucherIndividual,
  actualizarUrlVoucherConsolidadoPago
} from '../../api/tesoreria/pagoEspecializadoCuentaPorCobrar';
import { getEstadosMultiFuncionPorTipoProviene } from '../../api/estadoMultiFuncion';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { getResponsiveFontSize, formatearFecha, formatearNumero } from '../../utils/utils';
import ConfirmacionPagoDialog from './ConfirmacionPagoDialog';
import TipoMovimientoSelector from '../common/TipoMovimientoSelector';
import IrACxCEditar from '../common/IrACxCEditar';
import { RegistroImpuestoSunatPanel } from '../common/RegistroImpuestoSunat';
import { generarYSubirVoucherConsolidado } from './VoucherConsolidadoPagoCxCPDF';
import { generarYSubirVoucherIndividual } from '../movimientoCaja/utils/VoucherIndividualMovimientoPDF';
import { generarYSubirVoucherContable } from '../movimientoCaja/utils/VoucherContableMovimientoPDF';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: PAGAR CUENTA POR COBRAR ESPECIALIZADO
 * ════════════════════════════════════════════════════════════
 * 
 * Diálogo especializado para procesar pagos de cuentas por cobrar
 * con operaciones de caja completas:
 * - Generación de correlativo
 * - Múltiples MovimientoCaja (Ingreso, ITF, Comisión)
 * - Conceptos SUNAT (Detracción, Retención, Percepción)
 * - Generación de vouchers PDF
 */

export default function PagarCuentaPorCobrarEspecializadoDialog({
  visible,
  onHide,
  cuentaPorCobrar,
  monedas = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  tiposMovimiento = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  periodosContables = [],
  empresas = [],
  clientes = [],
  estadosCxC = [],
  toast,
  onSuccess
}) {
  const usuario = useAuthStore((state) => state.usuario);

  // Estados para catálogos de impuestos SUNAT
  const [estadosDetraccion, setEstadosDetraccion] = useState([]);
  const [estadosRetencion, setEstadosRetencion] = useState([]);
  const [estadosPercepcion, setEstadosPercepcion] = useState([]);

  // ════════════════════════════════════════════════════════════
  // ESTADOS: PAGO SEPARADO NETO Y DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  const [montoNetoIngresado, setMontoNetoIngresado] = useState(0);
  const [montoDetraccionIngresado, setMontoDetraccionIngresado] = useState(0);
  const [numeroOperacionBN, setNumeroOperacionBN] = useState('');
  const [esAutodetraccion, setEsAutodetraccion] = useState(false);
  const [cuentaBancariaOrigenAutodetraccion, setCuentaBancariaOrigenAutodetraccion] = useState(null);

  // ════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPALES
  // ════════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState(new Date());
  const [montoPagado, setMontoPagado] = useState(0);
  const [monedaPagoId, setMonedaPagoId] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(1);
  const [montoAplicadoDeuda, setMontoAplicadoDeuda] = useState(0);

  // ════════════════════════════════════════════════════════════
  // ESTADOS MEDIO DE PAGO
  // ════════════════════════════════════════════════════════════
  const [medioPagoId, setMedioPagoId] = useState(null);
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [bancoId, setBancoId] = useState(null);
  const [cuentaBancariaId, setCuentaBancariaId] = useState(null);
  const [tipoMovimientoIngresoId, setTipoMovimientoIngresoId] = useState(null);

  // ════════════════════════════════════════════════════════════
  // ESTADOS CARGOS BANCARIOS
  // ════════════════════════════════════════════════════════════
  const [montoITF, setMontoITF] = useState(0);
  const [montoComision, setMontoComision] = useState(0);

  // ════════════════════════════════════════════════════════════
  // ESTADOS DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  const [aplicaDetraccion, setAplicaDetraccion] = useState(false);
  const [tipoDetraccionId, setTipoDetraccionId] = useState(null);
  const [tasaDetraccion, setTasaDetraccion] = useState(0);
  const [importeTotalDetraccion, setImporteTotalDetraccion] = useState(0);
  const [importeDetraido, setImporteDetraido] = useState(0);
  const [numeroConstanciaDetraccion, setNumeroConstanciaDetraccion] = useState('');
  const [fechaDepositoDetraccion, setFechaDepositoDetraccion] = useState(new Date());
  const [cuentaSunatId, setCuentaSunatId] = useState(null);

  // ════════════════════════════════════════════════════════════
  // ESTADOS RETENCIÓN
  // ════════════════════════════════════════════════════════════
  const [aplicaRetencion, setAplicaRetencion] = useState(false);
  const [tipoRetencionId, setTipoRetencionId] = useState(null);
  const [tasaRetencion, setTasaRetencion] = useState(0);
  const [importeTotalRetencion, setImporteTotalRetencion] = useState(0);
  const [importeRetenido, setImporteRetenido] = useState(0);
  const [numeroDocumentoRetencion, setNumeroDocumentoRetencion] = useState('');
  const [fechaEmisionRetencion, setFechaEmisionRetencion] = useState(new Date());

  // ════════════════════════════════════════════════════════════
  // ESTADOS PERCEPCIÓN
  // ════════════════════════════════════════════════════════════
  const [aplicaPercepcion, setAplicaPercepcion] = useState(false);
  const [tipoPercepcionId, setTipoPercepcionId] = useState(null);
  const [tasaPercepcion, setTasaPercepcion] = useState(0);
  const [importeTotalPercepcion, setImporteTotalPercepcion] = useState(0);
  const [importePercibido, setImportePercibido] = useState(0);
  const [numeroDocumentoPercepcion, setNumeroDocumentoPercepcion] = useState('');
  const [fechaEmisionPercepcion, setFechaEmisionPercepcion] = useState(new Date());

  // ════════════════════════════════════════════════════════════
  // ESTADOS CONTABILIDAD
  // ════════════════════════════════════════════════════════════
  const [periodoContableId, setPeriodoContableId] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // ════════════════════════════════════════════════════════════
  // ESTADOS CONFIRMACIÓN
  // ════════════════════════════════════════════════════════════
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoPago, setResultadoPago] = useState(null);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CARGAR ESTADOS DE IMPUESTOS SUNAT
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const cargarEstadosImpuestos = async () => {
      try {
        const [detraccionData, retencionData, percepcionData] = await Promise.all([
          getEstadosMultiFuncionPorTipoProviene(28), // Detracción
          getEstadosMultiFuncionPorTipoProviene(29), // Retención
          getEstadosMultiFuncionPorTipoProviene(30), // Percepción
        ]);
        setEstadosDetraccion(detraccionData || []);
        setEstadosRetencion(retencionData || []);
        setEstadosPercepcion(percepcionData || []);
      } catch (error) {
        console.error('Error al cargar estados de impuestos:', error);
      }
    };

    if (visible) {
      cargarEstadosImpuestos();
    }
  }, [visible]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible && cuentaPorCobrar) {
      // Inicializar moneda de pago con la moneda de la deuda
      setMonedaPagoId(Number(cuentaPorCobrar.monedaId));

      // Inicializar montos en CERO
      setMontoPagado(0);
      setMontoAplicadoDeuda(0);
      setMontoNetoIngresado(0);
      setMontoDetraccionIngresado(0);

      // Inicializar importes de conceptos SUNAT
      setImporteTotalDetraccion(Number(cuentaPorCobrar.saldoPendiente || 0));
      setImporteTotalRetencion(Number(cuentaPorCobrar.saldoPendiente || 0));
      setImporteTotalPercepcion(Number(cuentaPorCobrar.saldoPendiente || 0));

      // Auto-activar y pre-llenar datos SUNAT si el documento los tiene
      if (cuentaPorCobrar.tieneDetraccion) {
        setAplicaDetraccion(true);
        setTasaDetraccion(Number(cuentaPorCobrar.porcentajeDetraccion || 0));
        setImporteTotalDetraccion(Number(cuentaPorCobrar.saldoPendiente || 0));
      } else {
        setAplicaDetraccion(false);
      }

      if (cuentaPorCobrar.tieneRetencion) {
        setAplicaRetencion(true);
        setTasaRetencion(Number(cuentaPorCobrar.porcentajeRetencion || 0));
        setImporteTotalRetencion(Number(cuentaPorCobrar.saldoPendiente || 0));
      } else {
        setAplicaRetencion(false);
      }

      if (cuentaPorCobrar.tienePercepcion) {
        setAplicaPercepcion(true);
        setTasaPercepcion(Number(cuentaPorCobrar.porcentajePercepcion || 0));
        setImporteTotalPercepcion(Number(cuentaPorCobrar.saldoPendiente || 0));
      } else {
        setAplicaPercepcion(false);
      }

      // Preseleccionar período contable según fecha de pago
      const periodoEncontrado = periodosContables.find(p => {
        if (Number(p.empresaId) !== Number(cuentaPorCobrar.empresaId)) return false;
        const fechaInicio = new Date(p.fechaInicio);
        const fechaFin = new Date(p.fechaFin);
        const fechaPagoActual = fechaPago || new Date();
        return fechaPagoActual >= fechaInicio && fechaPagoActual <= fechaFin;
      });

      if (periodoEncontrado) {
        setPeriodoContableId(Number(periodoEncontrado.id));
      }
    }
  }, [visible, cuentaPorCobrar, fechaPago, periodosContables]);

  // ════════════════════════════════════════════════════════════
  // NOTA: ITF NO SE CALCULA AUTOMÁTICAMENTE
  // ════════════════════════════════════════════════════════════
  // El usuario debe ingresar manualmente el ITF si aplica
  // Por defecto siempre es 0

  // ════════════════════════════════════════════════════════════
  // EFECTOS: DETECCIÓN DE AUTODETRACCIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!cuentaPorCobrar) return;

    const totalFactura = Number(cuentaPorCobrar.saldoPendiente || 0);
    const montoNeto = Number(montoNetoIngresado || 0);

    // Calcular el neto esperado (total - detracción pendiente)
    const preFactura = cuentaPorCobrar.preFactura;
    let netoEsperado = totalFactura;
    let detraccionPendiente = 0;

    if (preFactura?.aplicaDetraccion && preFactura.detraccion) {
      detraccionPendiente = Number(preFactura.detraccion.saldoPendiente || 0);
      netoEsperado = totalFactura - detraccionPendiente;
    }

    // 🔍 DEBUG
    console.log('🔍 DEBUG Autodetracción:');
    console.log('  totalFactura:', totalFactura);
    console.log('  montoNeto:', montoNeto);
    console.log('  detraccionPendiente:', detraccionPendiente);
    console.log('  netoEsperado:', netoEsperado);
    console.log('  montoNeto > netoEsperado:', montoNeto > netoEsperado);
    console.log('  detraccionPendiente > 0:', detraccionPendiente > 0);
    console.log('  ¿Se activará autodetracción?:', montoNeto > netoEsperado && detraccionPendiente > 0);

    // ✅ AUTODETRACCIÓN: Solo si el cliente paga MÁS que el neto esperado
    // (es decir, pagó el total bruto incluyendo la detracción)
    if (montoNeto > netoEsperado && detraccionPendiente > 0) {
      // Autodetracción detectada
      setEsAutodetraccion(true);

      // Calcular monto de detracción automáticamente
      const montoDetAuto = detraccionPendiente;
      setMontoDetraccionIngresado(montoDetAuto);

      // Auto-generar número de constancia y operación
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const autoNumero = `AUTO-${fecha}-${numeroOperacion || 'TEMP'}`;
      setNumeroConstanciaDetraccion(autoNumero);
      setNumeroOperacionBN(autoNumero);

      // Mostrar toast informativo
      toast?.current?.show({
        severity: 'info',
        summary: 'Autodetracción Detectada',
        detail: `El cliente pagó el total (${montoNeto.toFixed(2)}) sin separar la detracción. Se realizará autodetracción automática.`,
        life: 5000
      });
    } else {
      setEsAutodetraccion(false);
    }

    // Toast de sobrepago
    if (montoNeto > totalFactura && totalFactura > 0) {
      toast?.current?.show({
        severity: 'warn',
        summary: 'Sobrepago Detectado',
        detail: `El monto ingresado (${montoNeto.toFixed(2)}) supera el total de la factura (${totalFactura.toFixed(2)}). Verifique con el cliente.`,
        life: 5000
      });
    }
  }, [montoNetoIngresado, cuentaPorCobrar, numeroOperacion, toast]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR MONTO APLICADO A LA DEUDA
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // Calcular monto aplicado a la deuda
    if (esAutodetraccion) {
      // En autodetracción: el cliente pagó el total, pero solo el neto cancela la CxC
      const saldoCxC = Number(cuentaPorCobrar?.saldoPendiente || 0);
      setMontoAplicadoDeuda(saldoCxC);
    } else {
      // Pago normal: solo el monto neto cancela la deuda de la CxC
      setMontoAplicadoDeuda(Number(montoNetoIngresado || 0));
    }
  }, [montoNetoIngresado, esAutodetraccion, cuentaPorCobrar]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CONSULTA TIPO DE CAMBIO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaPago || !visible) return;

      if (monedaPagoId === cuentaPorCobrar?.monedaId) {
        setTipoCambio(1);
        return;
      }

      try {
        const year = fechaPago.getFullYear();
        const month = String(fechaPago.getMonth() + 1).padStart(2, '0');
        const day = String(fechaPago.getDate()).padStart(2, '0');
        const fechaISO = `${year}-${month}-${day}`;

        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });

        if (tipoCambioData && tipoCambioData.buy_price) {
          const tc = parseFloat(tipoCambioData.buy_price);
          setTipoCambio(tc);
        }
      } catch (error) {
        console.error('Error al consultar tipo de cambio:', error);
      }
    };

    consultarTipoCambio();
  }, [fechaPago, visible, monedaPagoId, cuentaPorCobrar?.monedaId]);
  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR MONTO APLICADO A LA DEUDA
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!montoPagado || !tipoCambio || !monedaPagoId || !cuentaPorCobrar?.monedaId) {
      setMontoAplicadoDeuda(0);
      return;
    }

    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar.monedaId));

    let montoConvertido = Number(montoPagado);

    // Convertir si las monedas son diferentes
    if (monedaPago?.codigoSunat !== monedaDeuda?.codigoSunat) {
      if (monedaPago?.codigoSunat === 'USD' && monedaDeuda?.codigoSunat === 'PEN') {
        montoConvertido = Number(montoPagado) * Number(tipoCambio);
      } else if (monedaPago?.codigoSunat === 'PEN' && monedaDeuda?.codigoSunat === 'USD') {
        montoConvertido = Number(montoPagado) / Number(tipoCambio);
      }
    }

    setMontoAplicadoDeuda(montoConvertido);
  }, [montoPagado, tipoCambio, monedaPagoId, cuentaPorCobrar?.monedaId, monedas]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR IMPORTE DETRAÍDO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (aplicaDetraccion && tasaDetraccion && importeTotalDetraccion) {
      const detraido = (Number(importeTotalDetraccion) * Number(tasaDetraccion)) / 100;
      setImporteDetraido(detraido);
    } else {
      setImporteDetraido(0);
    }
  }, [aplicaDetraccion, tasaDetraccion, importeTotalDetraccion]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR IMPORTE RETENIDO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (aplicaRetencion && tasaRetencion && importeTotalRetencion) {
      const retenido = (Number(importeTotalRetencion) * Number(tasaRetencion)) / 100;
      setImporteRetenido(retenido);
    } else {
      setImporteRetenido(0);
    }
  }, [aplicaRetencion, tasaRetencion, importeTotalRetencion]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR IMPORTE PERCIBIDO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (aplicaPercepcion && tasaPercepcion && importeTotalPercepcion) {
      const percibido = (Number(importeTotalPercepcion) * Number(tasaPercepcion)) / 100;
      setImportePercibido(percibido);
    } else {
      setImportePercibido(0);
    }
  }, [aplicaPercepcion, tasaPercepcion, importeTotalPercepcion]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: EXCLUSIVIDAD MUTUA CONCEPTOS SUNAT
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (aplicaDetraccion) {
      setAplicaRetencion(false);
      setAplicaPercepcion(false);
    }
  }, [aplicaDetraccion]);

  useEffect(() => {
    if (aplicaRetencion) {
      setAplicaDetraccion(false);
      setAplicaPercepcion(false);
    }
  }, [aplicaRetencion]);

  useEffect(() => {
    if (aplicaPercepcion) {
      setAplicaDetraccion(false);
      setAplicaRetencion(false);
    }
  }, [aplicaPercepcion]);

  // ════════════════════════════════════════════════════════════
  // MEMOS: OPCIONES DE DROPDOWNS
  // ════════════════════════════════════════════════════════════
  const monedasOptions = useMemo(() => {
    return monedas.map(m => ({
      label: m.simbolo,
      value: Number(m.id),
      ...m
    }));
  }, [monedas]);

  const mediosPagoOptions = useMemo(() => {
    return mediosPago.map(mp => ({
      label: mp.nombre,
      value: Number(mp.id),
      ...mp
    }));
  }, [mediosPago]);

  const bancosOptions = useMemo(() => {
    return bancos.map(b => ({
      label: b.nombre,
      value: Number(b.id),
      ...b
    }));
  }, [bancos]);

  const tiposMovimientoOptions = useMemo(() => {
    // Filtrar solo tipos de movimiento de INGRESO
    return tiposMovimiento
      .filter(tm => tm.tipo === 'INGRESO')
      .map(tm => ({
        label: `${tm.categoria?.nombre || ''} - ${tm.nombre}`,
        value: Number(tm.id),
        ...tm
      }));
  }, [tiposMovimiento]);

  const tiposDetraccionOptions = useMemo(() => {
    return tiposDetraccion.map(td => ({
      label: `${td.codigo} - ${td.descripcion}`,
      value: Number(td.id),
      ...td
    }));
  }, [tiposDetraccion]);

  const tiposRetencionOptions = useMemo(() => {
    return tiposRetencionPercepcion
      .filter(t => t.tipo === 'RETENCION')
      .map(tr => ({
        label: `${tr.codigo} - ${tr.descripcion}`,
        value: Number(tr.id),
        ...tr
      }));
  }, [tiposRetencionPercepcion]);

  const tiposPercepcionOptions = useMemo(() => {
    return tiposRetencionPercepcion
      .filter(t => t.tipo === 'PERCEPCION')
      .map(tp => ({
        label: `${tp.codigo} - ${tp.descripcion}`,
        value: Number(tp.id),
        ...tp
      }));
  }, [tiposRetencionPercepcion]);

  const periodosContablesOptions = useMemo(() => {
    return periodosContables.map(pc => ({
      label: `${pc.anio} - ${pc.mes}`,
      value: Number(pc.id),
      ...pc
    }));
  }, [periodosContables]);

  // ════════════════════════════════════════════════════════════
  // MEMOS: CÁLCULOS DE RESUMEN
  // ════════════════════════════════════════════════════════════
  const resumenOperacion = useMemo(() => {
    // Monto Bruto = solo el pago neto (no incluye detracción)
    const montoBruto = Number(montoNetoIngresado || 0);
    const itf = Number(montoITF || 0);
    const comision = Number(montoComision || 0);
    const detraccion = Number(montoDetraccionIngresado || 0);

    const montoNetoCaja = montoBruto - itf - comision;
    const deudaCancelada = Number(montoAplicadoDeuda || 0);
    const saldoPendiente = Number(cuentaPorCobrar?.saldoPendiente || 0) - deudaCancelada;

    return {
      montoBruto,
      itf,
      comision,
      detraccion,
      montoNetoCaja,
      deudaCancelada,
      saldoPendiente: saldoPendiente > 0 ? saldoPendiente : 0
    };
  }, [
    montoNetoIngresado,
    montoDetraccionIngresado,
    montoITF,
    montoComision,
    montoAplicadoDeuda,
    cuentaPorCobrar?.saldoPendiente
  ]);

  // ════════════════════════════════════════════════════════════
  // FUNCIONES: VALIDACIÓN
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    // Validar que al menos un monto esté ingresado
    if (Number(montoNetoIngresado) === 0 && Number(montoDetraccionIngresado) === 0) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar al menos un monto (neto o detracción).',
        life: 3000
      });
      return false;
    }

    if (!fechaPago) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar la fecha de pago.',
        life: 3000
      });
      return false;
    }

    // Validar N° Operación si hay pago neto
    if (Number(montoNetoIngresado) > 0 && !numeroOperacion) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar el N° de Operación del pago neto.',
        life: 3000
      });
      return false;
    }

    // Validar campos de detracción si hay pago de detracción (y NO es autodetracción)
    if (Number(montoDetraccionIngresado) > 0 && !esAutodetraccion) {
      if (!numeroConstanciaDetraccion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el N° de Constancia de la detracción.',
          life: 3000
        });
        return false;
      }

      if (!numeroOperacionBN) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el N° de Operación del Banco de la Nación.',
          life: 3000
        });
        return false;
      }
    }

    if (!monedaPagoId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar la moneda de pago.',
        life: 3000
      });
      return false;
    }

    if (!medioPagoId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar el medio de pago.',
        life: 3000
      });
      return false;
    }

    if (!tipoMovimientoIngresoId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar el tipo de movimiento de ingreso.',
        life: 3000
      });
      return false;
    }

    // Validar detracción SOLO si se está pagando detracción (monto > 0)
    if (Number(montoDetraccionIngresado) > 0) {
      if (!numeroConstanciaDetraccion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de constancia de detracción.',
          life: 3000
        });
        return false;
      }

      if (!fechaDepositoDetraccion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar la fecha de depósito de detracción.',
          life: 3000
        });
        return false;
      }

      if (!tasaDetraccion || Number(tasaDetraccion) <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'La tasa de detracción debe ser mayor a cero.',
          life: 3000
        });
        return false;
      }
    }

    // Validar retención
    if (aplicaRetencion) {
      if (!numeroDocumentoRetencion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de comprobante de retención.',
          life: 3000
        });
        return false;
      }

      if (!fechaEmisionRetencion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar la fecha de emisión de retención.',
          life: 3000
        });
        return false;
      }

      if (!tasaRetencion || Number(tasaRetencion) <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'La tasa de retención debe ser mayor a cero.',
          life: 3000
        });
        return false;
      }
    }

    // Validar percepción
    if (aplicaPercepcion) {
      if (!numeroDocumentoPercepcion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de comprobante de percepción.',
          life: 3000
        });
        return false;
      }

      if (!fechaEmisionPercepcion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar la fecha de emisión de percepción.',
          life: 3000
        });
        return false;
      }

      if (!tasaPercepcion || Number(tasaPercepcion) <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'La tasa de percepción debe ser mayor a cero.',
          life: 3000
        });
        return false;
      }
    }

    return true;
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIONES: PROCESAR PAGO
  // ════════════════════════════════════════════════════════════
  const handleProcesarPago = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // Preparar datos del pago
      const dataPago = {
        cuentaPorCobrarId: cuentaPorCobrar.id,
        empresaId: cuentaPorCobrar.empresaId,
        fechaPago: fechaPago.toISOString(),
        // montoPagado debe ser solo el monto neto (el que genera el movimiento de ingreso)
        montoPagado: Number(montoNetoIngresado) || 0,
        monedaPagoId: Number(monedaPagoId),
        tipoCambio: Number(tipoCambio),
        montoAplicadoDeuda: Number(montoAplicadoDeuda),
        monedaDeudaId: Number(cuentaPorCobrar.monedaId),
        medioPagoId: Number(medioPagoId),
        tipoMovimientoIngresoId: Number(tipoMovimientoIngresoId),
        numeroOperacion: numeroOperacion || null,
        bancoId: bancoId ? Number(bancoId) : null,
        cuentaBancariaId: cuentaBancariaId ? Number(cuentaBancariaId) : null,
        montoITF: montoITF ? Number(montoITF) : 0,
        montoComision: montoComision ? Number(montoComision) : 0,
        observaciones: observaciones || null,
        periodoContableId: periodoContableId ? Number(periodoContableId) : null,
        usuarioId: usuario.id,
        // Nuevos campos para detracción separada
        montoNetoIngresado: Number(montoNetoIngresado) || 0,
        montoDetraccionIngresado: Number(montoDetraccionIngresado) || 0,
        numeroOperacionBN: numeroOperacionBN || null,
        numeroConstanciaDetraccion: numeroConstanciaDetraccion || null,
        esAutodetraccion: esAutodetraccion || false,
        cuentaBancariaOrigenAutodetraccion: cuentaBancariaOrigenAutodetraccion || null
      };

      // Agregar detracción SOLO si se está pagando detracción (monto > 0)
      if (Number(montoDetraccionIngresado) > 0) {
        dataPago.aplicaDetraccion = true;
        dataPago.detraccion = {
          numeroConstancia: numeroConstanciaDetraccion,
          fechaDeposito: fechaDepositoDetraccion.toISOString(),
          tipoDetraccionId: tipoDetraccionId ? Number(tipoDetraccionId) : null,
          tasaDetraccion: Number(tasaDetraccion),
          importeTotal: Number(importeTotalDetraccion),
          importeDetraido: Number(importeDetraido),
          cuentaSunatId: cuentaSunatId ? Number(cuentaSunatId) : null,
          observaciones: observaciones || null
        };
      }

      // Agregar retención si aplica
      if (aplicaRetencion) {
        dataPago.aplicaRetencion = true;
        dataPago.retencion = {
          numeroDocumento: numeroDocumentoRetencion,
          fechaEmision: fechaEmisionRetencion.toISOString(),
          tipoRetencionId: tipoRetencionId ? Number(tipoRetencionId) : null,
          tasaRetencion: Number(tasaRetencion),
          importeTotal: Number(importeTotalRetencion),
          importeRetenido: Number(importeRetenido)
        };
      }

      // Agregar percepción si aplica
      if (aplicaPercepcion) {
        dataPago.aplicaPercepcion = true;
        dataPago.percepcion = {
          numeroDocumento: numeroDocumentoPercepcion,
          fechaEmision: fechaEmisionPercepcion.toISOString(),
          tipoPercepcionId: tipoPercepcionId ? Number(tipoPercepcionId) : null,
          tasaPercepcion: Number(tasaPercepcion),
          importeTotal: Number(importeTotalPercepcion),
          importePercibido: Number(importePercibido),
          observaciones: observaciones || null
        };
      }

      // Procesar pago
      const response = await procesarPagoEspecializado(dataPago);

      if (response.success) {
        const { pagoCuentaPorCobrar, movimientos, conceptosSunat, resumen } = response.data;


        const empresaData = empresas.find(e => Number(e.id) === Number(cuentaPorCobrar.empresaId));

        // Generar voucher consolidado automáticamente
        const voucherConsolidado = await generarYSubirVoucherConsolidado(
          pagoCuentaPorCobrar,
          movimientos || {},
          conceptosSunat || {},
          resumen || {},
          empresaData,
          cuentaPorCobrar,
          usuario  // ✅ Pasar usuario logueado
        );

        if (voucherConsolidado.success && voucherConsolidado.urlPdf) {
          // ✅ Actualizar URL en PagoCuentaPorCobrar (tabla correcta)
          await actualizarUrlVoucherConsolidadoPago(pagoCuentaPorCobrar.id, voucherConsolidado.urlPdf);
          // También actualizar en MovimientoCaja para compatibilidad
          await actualizarUrlVoucherConsolidado(movimientos.ingreso.id, voucherConsolidado.urlPdf);
          // ✅ Actualizar en el objeto de respuesta para que se muestre en ConfirmacionPagoDialog
          response.data.pagoCuentaPorCobrar.urlVoucherOperacionConsolidado = voucherConsolidado.urlPdf;
        }

        // ═══════════════════════════════════════════════════════════
        // GENERAR VOUCHERS INDIVIDUALES AUTOMÁTICAMENTE
        // ═══════════════════════════════════════════════════════════

        // Voucher individual del movimiento de ingreso
        if (movimientos.ingreso) {
          try {
            const voucherIngreso = await generarYSubirVoucherIndividual(
              movimientos.ingreso,
              pagoCuentaPorCobrar,
              empresaData,
              cuentaPorCobrar,
              usuario
            );
            if (voucherIngreso.success && voucherIngreso.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.ingreso.id, voucherIngreso.urlPdf);
              // ✅ Actualizar en el objeto de respuesta para que se muestre en ConfirmacionPagoDialog
              response.data.movimientos.ingreso.urlOperacionIndividualOperacionCaja = voucherIngreso.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de ingreso:', error);
          }
        }

        // Voucher individual del movimiento de ITF
        if (movimientos.itf) {
          try {
            const voucherITF = await generarYSubirVoucherIndividual(
              movimientos.itf,
              pagoCuentaPorCobrar,
              empresaData,
              cuentaPorCobrar,
              usuario
            );
            if (voucherITF.success && voucherITF.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.itf.id, voucherITF.urlPdf);
              // ✅ Actualizar en el objeto de respuesta
              response.data.movimientos.itf.urlOperacionIndividualOperacionCaja = voucherITF.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de ITF:', error);
          }
        }

        // Voucher individual del movimiento de comisión
        if (movimientos.comision) {
          try {
            const voucherComision = await generarYSubirVoucherIndividual(
              movimientos.comision,
              pagoCuentaPorCobrar,
              empresaData,
              cuentaPorCobrar,
              usuario
            );
            if (voucherComision.success && voucherComision.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.comision.id, voucherComision.urlPdf);
              // ✅ Actualizar en el objeto de respuesta
              response.data.movimientos.comision.urlOperacionIndividualOperacionCaja = voucherComision.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de comisión:', error);
          }
        }

        // ✅ Voucher individual de autodetracción EGRESO (retiro de cuenta empresa)
        if (movimientos.autodetraccionEgreso) {
          try {
            const voucherAutodetEgreso = await generarYSubirVoucherIndividual(
              movimientos.autodetraccionEgreso,
              pagoCuentaPorCobrar,
              empresaData,
              cuentaPorCobrar,
              usuario
            );
            if (voucherAutodetEgreso.success && voucherAutodetEgreso.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.autodetraccionEgreso.id, voucherAutodetEgreso.urlPdf);
              // ✅ Actualizar en el objeto de respuesta
              response.data.movimientos.autodetraccionEgreso.urlOperacionIndividualOperacionCaja = voucherAutodetEgreso.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de autodetracción egreso:', error);
          }
        }

        // ✅ Voucher individual de autodetracción INGRESO (abono a Banco de la Nación)
        if (movimientos.autodetraccionIngreso) {
          try {
            const voucherAutodetIngreso = await generarYSubirVoucherIndividual(
              movimientos.autodetraccionIngreso,
              pagoCuentaPorCobrar,
              empresaData,
              cuentaPorCobrar,
              usuario
            );
            if (voucherAutodetIngreso.success && voucherAutodetIngreso.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.autodetraccionIngreso.id, voucherAutodetIngreso.urlPdf);
              // ✅ Actualizar en el objeto de respuesta
              response.data.movimientos.autodetraccionIngreso.urlOperacionIndividualOperacionCaja = voucherAutodetIngreso.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de autodetracción ingreso:', error);
          }
        }


        // ═══════════════════════════════════════════════════════════
        // GENERAR VOUCHERS CONTABLES (ASIENTOS) AUTOMÁTICAMENTE
        // ═══════════════════════════════════════════════════════════

        // Función auxiliar para obtener asiento contable de un movimiento
        const obtenerAsientoContable = async (movimientoId) => {
          try {
            const token = useAuthStore.getState().token;
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/asiento-contable/por-movimiento/${movimientoId}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.error('Error al obtener asiento:', error);
            return null;
          }
        };

        // Función auxiliar para actualizar URL del voucher contable
        const actualizarUrlVoucherContable = async (movimientoId, urlPdf) => {
          try {
            const token = useAuthStore.getState().token;
            await fetch(
              `${import.meta.env.VITE_API_URL}/pago-especializado-cuenta-por-cobrar/movimiento/${movimientoId}/voucher-contable`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ urlPdf })
              }
            );
          } catch (error) {
            console.error('Error al actualizar URL voucher contable:', error);
          }
        };

        // Generar voucher contable para cada movimiento con asiento
        const movimientosConAsiento = [
          movimientos.ingreso,
          movimientos.detraccionIngreso,
          movimientos.autodetraccion
        ].filter(Boolean);


        for (const movimiento of movimientosConAsiento) {
          try {

            // Obtener asiento contable del movimiento
            const asiento = await obtenerAsientoContable(movimiento.id);

            if (asiento) {

              const voucherContable = await generarYSubirVoucherContable(
                movimiento,
                asiento,
                empresaData,
                cuentaPorCobrar,
                usuario
              );

              if (voucherContable.success && voucherContable.urlPdf) {
                await actualizarUrlVoucherContable(movimiento.id, voucherContable.urlPdf);
              } else {
                console.error(`❌ Error generando PDF: ${voucherContable.error}`);
              }
            } else {
              console.warn(`⚠️ No se encontró asiento contable para movimiento ${movimiento.id}`);
            }
          } catch (error) {
            console.error(`❌ Error al generar voucher contable para movimiento ${movimiento.id}:`, error);
          }
        }

        setResultadoPago(response.data);
        setShowConfirmacion(true);

        toast?.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pago procesado y todos los vouchers generados exitosamente.',
          life: 5000
        });
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Error al procesar el pago.';

      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIONES: LIMPIAR FORMULARIO
  // ════════════════════════════════════════════════════════════
  const limpiarFormulario = () => {
    setFechaPago(new Date());
    setMontoPagado(0);
    setMonedaPagoId(null);
    setTipoCambio(1);
    setMontoAplicadoDeuda(0);
    setMedioPagoId(null);
    setNumeroOperacion('');
    setBancoId(null);
    setCuentaBancariaId(null);
    setTipoMovimientoIngresoId(null);
    setMontoITF(0);
    setMontoComision(0);
    setAplicaDetraccion(false);
    setTipoDetraccionId(null);
    setTasaDetraccion(0);
    setImporteTotalDetraccion(0);
    setImporteDetraido(0);
    setNumeroConstanciaDetraccion('');
    setFechaDepositoDetraccion(new Date());
    setCuentaSunatId(null);
    setAplicaRetencion(false);
    setTipoRetencionId(null);
    setTasaRetencion(0);
    setImporteTotalRetencion(0);
    setImporteRetenido(0);
    setNumeroDocumentoRetencion('');
    setFechaEmisionRetencion(new Date());
    setAplicaPercepcion(false);
    setTipoPercepcionId(null);
    setTasaPercepcion(0);
    setImporteTotalPercepcion(0);
    setImportePercibido(0);
    setNumeroDocumentoPercepcion('');
    setFechaEmisionPercepcion(new Date());
    setPeriodoContableId(null);
    setObservaciones('');
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIONES: CERRAR DIÁLOGO
  // ════════════════════════════════════════════════════════════
  const handleCerrar = () => {
    limpiarFormulario();
    onHide();
  };

  const handleConfirmacionCerrar = () => {
    setShowConfirmacion(false);
    limpiarFormulario();
    onHide();

    if (onSuccess) {
      onSuccess();
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: INFORMACIÓN DEL DOCUMENTO
  // ════════════════════════════════════════════════════════════
  const renderInfoDocumento = () => {
    if (!cuentaPorCobrar) return null;

    const moneda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar.monedaId));
    const simboloMoneda = moneda?.simbolo || '';

    return (
      <Panel header="📄 Información del Documento" className="mb-3">
        <div className="p-fluid">
          <IrACxCEditar
            preFacturaId={cuentaPorCobrar.preFacturaId}
            preFactura={cuentaPorCobrar.preFactura}
            empresas={empresas}
            clientes={[cuentaPorCobrar.cliente]}
            monedas={monedas}
            estados={[cuentaPorCobrar.estado]}
            periodosContables={periodosContables}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={cuentasCorrientes}
            permisos={{}}
            compact={false}
          />
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: REGISTRO IMPUESTO SUNAT GENERADO
  // ════════════════════════════════════════════════════════════
  const renderRegistroImpuestoSunat = () => {
    return (
      <RegistroImpuestoSunatPanel
        documento={cuentaPorCobrar}
        monedas={monedas}
        tiposDetraccion={tiposDetraccion}
        tiposRetencionPercepcion={tiposRetencionPercepcion}
        periodosContables={periodosContables}
        empresas={empresas}
        entidadesComerciales={clientes}
        estadosDetraccion={estadosDetraccion}
        estadosRetencion={estadosRetencion}
        estadosPercepcion={estadosPercepcion}
        toast={toast}
        permisos={{}}
        compact={false}
        showPanel={true}
        onUpdate={(updatedData) => {
          // Callback opcional para actualizar datos
        }}
      />
    );
  };
  // ════════════════════════════════════════════════════════════
  // RENDER: DATOS DE PAGO
  // ════════════════════════════════════════════════════════════
  const renderDatosPago = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar?.monedaId));

    const preFactura = cuentaPorCobrar?.preFactura;
    let netoEsperado = Number(cuentaPorCobrar?.saldoPendiente || 0);

    if (preFactura?.aplicaDetraccion && preFactura.detraccion) {
      netoEsperado = netoEsperado - Number(preFactura.detraccion.saldoPendiente || 0);
    }

    return (
      <Panel header="💵 1. PAGO DEL NETO" className="mb-3">
        <div className="p-fluid">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="cuentaBancariaId" className="font-bold">
                Cuenta Corriente
              </label>
              <CuentaCorrienteSelector
                empresaIdPreseleccionada={cuentaPorCobrar?.empresaId}
                value={cuentaBancariaId}
                onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                  setCuentaBancariaId(cuentaCorrienteId);
                  setBancoId(bancoId);

                  // Auto-seleccionar moneda de pago según la cuenta
                  if (moneda?.id) {
                    setMonedaPagoId(Number(moneda.id));
                  }
                }}
                label=""
                placeholder="Seleccione cuenta corriente"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaPago" className="font-bold">
                Fecha de Pago <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fechaPago"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoCambio" className="font-bold">
                Tipo de Cambio <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="tipoCambio"
                value={tipoCambio}
                onValueChange={(e) => setTipoCambio(e.value || 1)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                style={{ width: "100%" }}
                placeholder="1.0000"
                tooltip="Tipo de cambio SUNAT (se actualiza automáticamente)"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="monedaPagoId" className="font-bold">
                Moneda <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="monedaPagoId"
                value={monedaPagoId}
                options={monedasOptions}
                onChange={(e) => setMonedaPagoId(e.value)}
                placeholder="Seleccione moneda"
                className="w-full"
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="montoNetoIngresado" className="font-bold">
                Monto Pagado Neto <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="montoNetoIngresado"
                value={montoNetoIngresado}
                onValueChange={(e) => setMontoNetoIngresado(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder={`Neto esperado: ${monedaPago?.simbolo || ''} ${netoEsperado.toFixed(2)}`}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="medioPagoId" className="font-bold">
                Medio de Pago <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="medioPagoId"
                value={medioPagoId}
                options={mediosPagoOptions}
                onChange={(e) => setMedioPagoId(e.value)}
                placeholder="Seleccione medio de pago"
                className="w-full"
                filter
                showClear
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroOperacion" className="font-bold">
                N° Operación
              </label>
              <InputText
                id="numeroOperacion"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de operación"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TipoMovimientoSelector
                tiposMovimiento={tiposMovimiento}
                value={tipoMovimientoIngresoId}
                onChange={(value) => setTipoMovimientoIngresoId(value)}
                required={true}
                placeholder="Buscar tipo de movimiento..."
              />
            </div>
          </div>

          <Divider />

          <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
            <strong>🏦 Cargos Bancarios (Solo para pago neto)</strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="montoITF" className="font-bold">
                ITF
              </label>
              <InputNumber
                id="montoITF"
                value={montoITF}
                onValueChange={(e) => setMontoITF(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="montoComision" className="font-bold">
                Comisión Bancaria
              </label>
              <InputNumber
                id="montoComision"
                value={montoComision}
                onValueChange={(e) => setMontoComision(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </Panel>
    );
  };



  // ════════════════════════════════════════════════════════════
  // RENDER: PAGO DE LA DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  const renderPagoDetraccion = () => {
    if (!cuentaPorCobrar?.preFactura?.aplicaDetraccion) return null;

    const preFactura = cuentaPorCobrar.preFactura;
    const detraccion = preFactura.detraccion;
    if (!detraccion) return null;

    console.log('🔍 DEBUG Render Detracción:');
    console.log('  esAutodetraccion:', esAutodetraccion);
    console.log('  montoDetraccionIngresado:', montoDetraccionIngresado);

    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const montoDetEsperado = Number(detraccion.saldoPendiente || 0);

    // Obtener cuenta BN automáticamente
    const cuentaBN = detraccion.cuentaBNSunatPropia;
    const cuentaBNTexto = cuentaBN
      ? `${cuentaBN.banco?.nombre || 'Banco Nación'} - ${cuentaBN.numeroCuenta}`
      : 'No configurada';

    return (
      <Panel header="🏦 2. PAGO DE LA DETRACCIÓN" className="mb-3">
        <div className="p-fluid">
          {esAutodetraccion && (
            <div style={{ backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>⚙️ AUTODETRACCIÓN AUTOMÁTICA</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Los campos se han completado automáticamente. El sistema generará los movimientos de caja necesarios.
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="cuentaBNTexto" className="font-bold">
                Cuenta BN (Automático)
              </label>
              <InputText
                id="cuentaBNTexto"
                value={cuentaBNTexto}
                disabled
                className="w-full"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaDepositoDetraccion" className="font-bold">
                Fecha Depósito
              </label>
              <Calendar
                id="fechaDepositoDetraccion"
                value={fechaDepositoDetraccion}
                onChange={(e) => setFechaDepositoDetraccion(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
                disabled={esAutodetraccion}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="montoDetraccionIngresado" className="font-bold">
                Monto Pagado Detracción
              </label>
              <InputNumber
                id="montoDetraccionIngresado"
                value={montoDetraccionIngresado}
                onValueChange={(e) => setMontoDetraccionIngresado(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder={`Detracción esperada: S/. ${montoDetEsperado.toFixed(2)}`}
                disabled={esAutodetraccion}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroConstanciaDetraccion" className="font-bold">
                N° Constancia
              </label>
              <InputText
                id="numeroConstanciaDetraccion"
                value={numeroConstanciaDetraccion}
                onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de constancia"
                disabled={esAutodetraccion}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroOperacionBN" className="font-bold">
                N° Operación BN
              </label>
              <InputText
                id="numeroOperacionBN"
                value={numeroOperacionBN}
                onChange={(e) => setNumeroOperacionBN(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de operación"
                disabled={esAutodetraccion}
              />
            </div>
          </div>

          {esAutodetraccion && (
            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="cuentaOrigenAutodetraccion" className="font-bold">
                💳 Cuenta Origen (desde donde se pagará la detracción)
              </label>
              <CuentaCorrienteSelector
                empresaIdPreseleccionada={cuentaPorCobrar?.empresaId}
                value={cuentaBancariaOrigenAutodetraccion}
                onChange={({ cuentaCorrienteId }) => {
                  setCuentaBancariaOrigenAutodetraccion(cuentaCorrienteId);
                }}
                label=""
                placeholder="Seleccione cuenta origen para autodetracción"
              />
              <small className="p-text-secondary">
                Puede ser la misma cuenta donde el cliente depositó o cualquier otra cuenta de la empresa
              </small>
            </div>
          )}

          <Divider />

          <div style={{ backgroundColor: '#e7f3ff', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
            ℹ️ La detracción NO genera ITF ni comisión bancaria
          </div>
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONCEPTOS SUNAT - RETENCIÓN
  // ════════════════════════════════════════════════════════════
  const renderRetencion = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));

    return (
      <Panel header="📋 Retención SUNAT" className="mb-3" toggleable collapsed>
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <BooleanToggleButton
                value={aplicaRetencion}
                onChange={setAplicaRetencion}
                labelTrue="Aplica Retención"
                labelFalse="No Aplica Retención"
                size="small"
              />
            </div>
          </div>

          {aplicaRetencion && (
            <>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="numeroDocumentoRetencion" className="font-bold">
                    Número de Comprobante <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="numeroDocumentoRetencion"
                    value={numeroDocumentoRetencion}
                    onChange={(e) => setNumeroDocumentoRetencion(e.target.value)}
                    className="w-full"
                    placeholder="Ingrese número de comprobante"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="fechaEmisionRetencion" className="font-bold">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </label>
                  <Calendar
                    id="fechaEmisionRetencion"
                    value={fechaEmisionRetencion}
                    onChange={(e) => setFechaEmisionRetencion(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tipoRetencionId" className="font-bold">
                    Tipo de Retención
                  </label>
                  <Dropdown
                    id="tipoRetencionId"
                    value={tipoRetencionId}
                    options={tiposRetencionOptions}
                    onChange={(e) => setTipoRetencionId(e.value)}
                    placeholder="Seleccione tipo de retención"
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tasaRetencion" className="font-bold">
                    Tasa de Retención (%) <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    id="tasaRetencion"
                    value={tasaRetencion}
                    onValueChange={(e) => setTasaRetencion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="importeTotalRetencion" className="font-bold">
                    Importe Total
                  </label>
                  <InputNumber
                    id="importeTotalRetencion"
                    value={importeTotalRetencion}
                    onValueChange={(e) => setImporteTotalRetencion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="importeRetenido" className="font-bold">
                    Importe Retenido
                  </label>
                  <InputNumber
                    id="importeRetenido"
                    value={importeRetenido}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                    className="w-full"
                    disabled
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONCEPTOS SUNAT - PERCEPCIÓN
  // ════════════════════════════════════════════════════════════
  const renderPercepcion = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));

    return (
      <Panel header="📋 Percepción SUNAT" className="mb-3" toggleable collapsed>
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <BooleanToggleButton
                value={aplicaPercepcion}
                onChange={setAplicaPercepcion}
                labelTrue="Aplica Percepción"
                labelFalse="No Aplica Percepción"
                size="small"
              />
            </div>
          </div>

          {aplicaPercepcion && (
            <>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="numeroDocumentoPercepcion" className="font-bold">
                    Número de Comprobante <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="numeroDocumentoPercepcion"
                    value={numeroDocumentoPercepcion}
                    onChange={(e) => setNumeroDocumentoPercepcion(e.target.value)}
                    className="w-full"
                    placeholder="Ingrese número de comprobante"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="fechaEmisionPercepcion" className="font-bold">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </label>
                  <Calendar
                    id="fechaEmisionPercepcion"
                    value={fechaEmisionPercepcion}
                    onChange={(e) => setFechaEmisionPercepcion(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tipoPercepcionId" className="font-bold">
                    Tipo de Percepción
                  </label>
                  <Dropdown
                    id="tipoPercepcionId"
                    value={tipoPercepcionId}
                    options={tiposPercepcionOptions}
                    onChange={(e) => setTipoPercepcionId(e.value)}
                    placeholder="Seleccione tipo de percepción"
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tasaPercepcion" className="font-bold">
                    Tasa de Percepción (%) <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    id="tasaPercepcion"
                    value={tasaPercepcion}
                    onValueChange={(e) => setTasaPercepcion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    suffix=" %"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="importeTotalPercepcion" className="font-bold">
                    Importe Total
                  </label>
                  <InputNumber
                    id="importeTotalPercepcion"
                    value={importeTotalPercepcion}
                    onValueChange={(e) => setImporteTotalPercepcion(e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="importePercibido" className="font-bold">
                    Importe Percibido
                  </label>
                  <InputNumber
                    id="importePercibido"
                    value={importePercibido}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                    className="w-full"
                    disabled
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: RESUMEN DE OPERACIÓN
  // ════════════════════════════════════════════════════════════
  const renderResumen = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const simbolo = monedaPago?.simbolo || 'S/.';

    return (
      <Panel header="📊 Resumen de Operación" className="mb-3">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          padding: '0.5rem'
        }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Monto Bruto</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0d6efd' }}>
              {simbolo} {resumenOperacion.montoBruto.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>ITF</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fd7e14' }}>
              {simbolo} {resumenOperacion.itf.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Comisión</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fd7e14' }}>
              {simbolo} {resumenOperacion.comision.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Neto en Caja</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#198754' }}>
              {simbolo} {resumenOperacion.montoNetoCaja.toFixed(2)}
            </div>
          </div>

          {resumenOperacion.detraccion > 0 && (
            <div style={{ textAlign: 'center', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Detracción</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#6c757d' }}>
                {simbolo} {resumenOperacion.detraccion.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: OBSERVACIONES Y CONTABILIDAD
  // ════════════════════════════════════════════════════════════
  const renderObservaciones = () => {
    return (
      <Panel header="📝 Observaciones y Contabilidad" className="mb-3" toggleable collapsed>
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="periodoContableId" className="font-bold">
                Período Contable
              </label>
              <Dropdown
                id="periodoContableId"
                value={periodoContableId}
                options={periodosContablesOptions}
                onChange={(e) => setPeriodoContableId(e.value)}
                placeholder="Seleccione período contable"
                className="w-full"
                showClear
              />
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="observaciones" className="font-bold">
                Observaciones
              </label>
              <InputTextarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Ingrese observaciones adicionales"
              />
            </div>
          </div>
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FOOTER CON BOTONES
  // ════════════════════════════════════════════════════════════
  const renderFooter = () => {
    return (
      <div className="flex justify-content-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={handleCerrar}
          className="p-button-secondary"
          disabled={loading}
        />
        <Button
          label="Procesar Pago"
          icon="pi pi-check"
          onClick={handleProcesarPago}
          className="p-button-success"
          loading={loading}
        />
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <Dialog
        visible={visible}
        onHide={handleCerrar}
        header="💳 Pagar Cuenta Por Cobrar - Operación Especializada"
        style={{ width: '95vw', maxWidth: '1400px' }}
        maximizable
        modal
        footer={renderFooter()}
      >
        <div className="p-fluid">
          {renderInfoDocumento()}
          {renderRegistroImpuestoSunat()}
          {renderDatosPago()}
          {renderPagoDetraccion()}
          {renderResumen()}
          {renderObservaciones()}
        </div>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <ConfirmacionPagoDialog
        visible={showConfirmacion}
        onHide={handleConfirmacionCerrar}
        resultadoPago={resultadoPago}
        cuentaPorCobrar={cuentaPorCobrar}
        monedas={monedas}
        empresas={empresas}
        toast={toast}
      />
    </>
  );
}