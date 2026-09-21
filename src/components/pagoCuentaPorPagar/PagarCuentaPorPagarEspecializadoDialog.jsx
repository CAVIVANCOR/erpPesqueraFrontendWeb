// src/components/pagoCuentaPorPagar/PagarCuentaPorPagarEspecializadoDialog.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from '../../api/tesoreria/pagoEspecializadoCuentaPorPagar';
import { getEstadosMultiFuncionPorTipoProviene } from '../../api/estadoMultiFuncion';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { getResponsiveFontSize, formatearFecha, formatearNumero } from '../../utils/utils';
import ConfirmacionPagoDialog from './ConfirmacionPagoCxPDialog';
import TipoMovimientoSelector from '../common/TipoMovimientoSelector';
import IrACxPEditar from '../common/IrACxPEditar';
import VerRegistroImpuestoSunat from '../common/VerRegistroImpuestoSunat';
import { generarYSubirVoucherConsolidado } from './VoucherConsolidadoPagoCxPPDF';
import { generarYSubirVoucherIndividual } from '../movimientoCaja/utils/VoucherIndividualMovimientoPDF';
import { generarYSubirVoucherContable } from '../movimientoCaja/utils/VoucherContableMovimientoPDF';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: PAGAR CUENTA POR PAGAR ESPECIALIZADO
 * ════════════════════════════════════════════════════════════
 * 
 * Diálogo especializado para procesar pagos a proveedores
 * con operaciones de caja completas:
 * - Generación de correlativo
 * - Múltiples MovimientoCaja (Egreso, ITF, Comisión)
 * - Conceptos SUNAT (Detracción, Retención, Percepción)
 * - Generación de vouchers PDF
 */

export default function PagarCuentaPorPagarEspecializadoDialog({
  visible,
  onHide,
  cuentaPorPagar,
  monedas = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  tiposMovimiento = [],
  tiposDetraccion = [],
  tiposRetencionPercepcion = [],
  periodosContables = [],
  empresas = [],
  proveedores = [],
  estadosCxP = [],
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
  // REFERENCIAS PARA CONTROL DE CONSULTAS API
  // ════════════════════════════════════════════════════════════
  const ultimaConsultaTCNeto = useRef(null);
  const ultimaConsultaTCDetraccion = useRef(null);

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
  const [tipoMovimientoEgresoId, setTipoMovimientoEgresoId] = useState(null);

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
  
  // Estados adicionales para el pago de la detracción
  const [cuentaBancariaDetraccionId, setCuentaBancariaDetraccionId] = useState(null);
  const [medioPagoDetraccionId, setMedioPagoDetraccionId] = useState(null);
  const [monedaDetraccionId, setMonedaDetraccionId] = useState(null);
  const [tipoCambioDetraccion, setTipoCambioDetraccion] = useState(1);
  const [itfDetraccion, setItfDetraccion] = useState(0);
  const [comisionDetraccion, setComisionDetraccion] = useState(0);
  const [tipoMovimientoDetraccionId, setTipoMovimientoDetraccionId] = useState(null);

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
    if (visible && cuentaPorPagar) {
      // Inicializar moneda de pago con la moneda de la deuda
      setMonedaPagoId(Number(cuentaPorPagar.monedaId));

      // Inicializar montos en CERO
      setMontoPagado(0);
      setMontoAplicadoDeuda(0);
      setMontoNetoIngresado(0);
      setMontoDetraccionIngresado(0);
      
      // Inicializar estados de pago de detracción
      setCuentaBancariaDetraccionId(null);
      setMedioPagoDetraccionId(null);
      setMonedaDetraccionId(1); // ✅ SIEMPRE SOLES (PEN) - ID: 1
      setTipoCambioDetraccion(1); // Tipo de cambio por defecto
      setItfDetraccion(0);
      setComisionDetraccion(0);
      setTipoMovimientoDetraccionId(null);

      // Inicializar importes de conceptos SUNAT
      setImporteTotalDetraccion(Number(cuentaPorPagar.saldoPendiente || 0));
      setImporteTotalRetencion(Number(cuentaPorPagar.saldoPendiente || 0));
      setImporteTotalPercepcion(Number(cuentaPorPagar.saldoPendiente || 0));

      // Auto-activar y pre-llenar datos SUNAT si el documento los tiene
      if (cuentaPorPagar.tieneDetraccion) {
        setAplicaDetraccion(true);
        setTasaDetraccion(Number(cuentaPorPagar.porcentajeDetraccion || 0));
        setImporteTotalDetraccion(Number(cuentaPorPagar.saldoPendiente || 0));
      } else {
        setAplicaDetraccion(false);
      }

      if (cuentaPorPagar.tieneRetencion) {
        setAplicaRetencion(true);
        setTasaRetencion(Number(cuentaPorPagar.porcentajeRetencion || 0));
        setImporteTotalRetencion(Number(cuentaPorPagar.saldoPendiente || 0));
      } else {
        setAplicaRetencion(false);
      }

      if (cuentaPorPagar.tienePercepcion) {
        setAplicaPercepcion(true);
        setTasaPercepcion(Number(cuentaPorPagar.porcentajePercepcion || 0));
        setImporteTotalPercepcion(Number(cuentaPorPagar.saldoPendiente || 0));
      } else {
        setAplicaPercepcion(false);
      }

      // Preseleccionar período contable según fecha de pago
      const periodoEncontrado = periodosContables.find(p => {
        if (Number(p.empresaId) !== Number(cuentaPorPagar.empresaId)) return false;
        const fechaInicio = new Date(p.fechaInicio);
        const fechaFin = new Date(p.fechaFin);
        const fechaPagoActual = fechaPago || new Date();
        return fechaPagoActual >= fechaInicio && fechaPagoActual <= fechaFin;
      });

      if (periodoEncontrado) {
        setPeriodoContableId(Number(periodoEncontrado.id));
      }
    }
  }, [visible, cuentaPorPagar, fechaPago, periodosContables]);

  // ════════════════════════════════════════════════════════════
  // NOTA: ITF NO SE CALCULA AUTOMÁTICAMENTE
  // ════════════════════════════════════════════════════════════
  // El usuario debe ingresar manualmente el ITF si aplica
  // Por defecto siempre es 0

  // ════════════════════════════════════════════════════════════
  // EFECTOS: DETECCIÓN DE AUTODETRACCIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!cuentaPorPagar) return;

    const totalFactura = Number(cuentaPorPagar.saldoPendiente || 0);
    const montoNeto = Number(montoNetoIngresado || 0);

    if (montoNeto >= totalFactura && totalFactura > 0) {
      // Autodetracción detectada
      setEsAutodetraccion(true);
      
      // Calcular monto de detracción automáticamente
      const preFactura = cuentaPorPagar.preFactura;
      if (preFactura?.aplicaDetraccion && preFactura.detraccion) {
        const montoDetAuto = Number(preFactura.detraccion.saldoPendiente || 0);
        setMontoDetraccionIngresado(montoDetAuto);
        
        // Auto-generar número de constancia y operación
        const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const autoNumero = `AUTO-${fecha}-${numeroOperacion || 'TEMP'}`;
        setNumeroConstanciaDetraccion(autoNumero);
        setNumeroOperacionBN(autoNumero);
      }

      // Mostrar toast informativo
      toast?.current?.show({
        severity: 'info',
        summary: 'Autodetracción Detectada',
        detail: 'El proveedor pagó el total sin separar. Se realizará autodetracción automática.',
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
        detail: `El monto ingresado (${montoNeto.toFixed(2)}) supera el total de la factura (${totalFactura.toFixed(2)}). Verifique con el proveedor.`,
        life: 5000
      });
    }
  }, [montoNetoIngresado, cuentaPorPagar, numeroOperacion, toast]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CONSULTA TIPO DE CAMBIO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaPago || !visible || !monedaPagoId || !cuentaPorPagar?.monedaId) return;

      // Si misma moneda, TC = 1 (sin consultar API)
      if (monedaPagoId === cuentaPorPagar?.monedaId) {
        setTipoCambio(1);
        return;
      }

      // ✅ EVITAR CONSULTAS DUPLICADAS
      const year = fechaPago.getFullYear();
      const month = String(fechaPago.getMonth() + 1).padStart(2, '0');
      const day = String(fechaPago.getDate()).padStart(2, '0');
      const fechaISO = `${year}-${month}-${day}`;
      const claveConsulta = `${fechaISO}-${monedaPagoId}-${cuentaPorPagar.monedaId}`;
      
      // Si ya consultamos esta combinación, no volver a consultar
      if (ultimaConsultaTCNeto.current === claveConsulta) {
        return;
      }

      try {
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });

        if (tipoCambioData && tipoCambioData.sell_price) {
          // ✅ SIEMPRE USAR TC DE VENTA (sell_price)
          const tc = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tc);
          
          // ✅ Marcar como consultado
          ultimaConsultaTCNeto.current = claveConsulta;
          
          // ✅ Mostrar mensaje de éxito
          toast?.current?.show({
            severity: 'success',
            summary: '✅ Tipo de Cambio Actualizado',
            detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta) - Pago Neto`,
            life: 3000
          });
        }
      } catch (error) {
        console.error('Error al consultar tipo de cambio:', error);
        
        // ✅ Mostrar mensaje de error
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el tipo de cambio de SUNAT',
          life: 4000
        });
      }
    };

    consultarTipoCambio();
  }, [fechaPago, visible, monedaPagoId, cuentaPorPagar?.monedaId]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: PRE-SELECCIONAR TIPO DE MOVIMIENTO SUNAT PARA DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!visible || !tiposMovimiento || tiposMovimiento.length === 0) return;
    
    // Buscar tipo de movimiento SUNAT (NO hardcodeado)
    const tipoSunat = tiposMovimiento.find(tm => 
      tm.nombre && tm.nombre.toUpperCase().includes('SUNAT')
    );
    
    if (tipoSunat && !tipoMovimientoDetraccionId) {
      setTipoMovimientoDetraccionId(Number(tipoSunat.id));
      console.log('✅ Tipo de movimiento SUNAT pre-seleccionado:', tipoSunat.nombre, 'ID:', tipoSunat.id);
    }
  }, [visible, tiposMovimiento, tipoMovimientoDetraccionId]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CONSULTA TIPO DE CAMBIO DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const consultarTipoCambioDetraccion = async () => {
      if (!fechaDepositoDetraccion || !visible || !monedaDetraccionId || !cuentaPorPagar?.monedaId) return;

      // Si misma moneda, TC = 1 (sin consultar API)
      if (monedaDetraccionId === cuentaPorPagar?.monedaId) {
        setTipoCambioDetraccion(1);
        return;
      }

      // ✅ EVITAR CONSULTAS DUPLICADAS
      const year = fechaDepositoDetraccion.getFullYear();
      const month = String(fechaDepositoDetraccion.getMonth() + 1).padStart(2, '0');
      const day = String(fechaDepositoDetraccion.getDate()).padStart(2, '0');
      const fechaISO = `${year}-${month}-${day}`;
      const claveConsulta = `${fechaISO}-${monedaDetraccionId}-${cuentaPorPagar.monedaId}`;
      
      // Si ya consultamos esta combinación, no volver a consultar
      if (ultimaConsultaTCDetraccion.current === claveConsulta) {
        return;
      }

      try {
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });

        if (tipoCambioData && tipoCambioData.sell_price) {
          // ✅ SIEMPRE USAR TC DE VENTA (sell_price)
          const tc = parseFloat(tipoCambioData.sell_price);
          setTipoCambioDetraccion(tc);
          
          // ✅ Marcar como consultado
          ultimaConsultaTCDetraccion.current = claveConsulta;
          
          // ✅ Mostrar mensaje de éxito
          toast?.current?.show({
            severity: 'success',
            summary: '✅ Tipo de Cambio Actualizado',
            detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta) - Pago Detracción`,
            life: 3000
          });
        }
      } catch (error) {
        console.error('Error al consultar tipo de cambio de detracción:', error);
        
        // ✅ Mostrar mensaje de error
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el tipo de cambio de SUNAT para detracción',
          life: 4000
        });
      }
    };

    consultarTipoCambioDetraccion();
  }, [fechaDepositoDetraccion, visible, monedaDetraccionId, cuentaPorPagar?.monedaId]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CALCULAR MONTO APLICADO A LA DEUDA CON CONVERSIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // Si no hay monto neto ingresado, el monto aplicado es 0
    if (!montoNetoIngresado || !tipoCambio || !monedaPagoId || !cuentaPorPagar?.monedaId) {
      setMontoAplicadoDeuda(0);
      return;
    }

    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorPagar.monedaId));

    let montoConvertido = Number(montoNetoIngresado);

    // ✅ Convertir si las monedas son diferentes
    if (monedaPago?.codigoSunat !== monedaDeuda?.codigoSunat) {
      if (monedaPago?.codigoSunat === 'USD' && monedaDeuda?.codigoSunat === 'PEN') {
        // USD → PEN: multiplicar por TC
        montoConvertido = Number(montoNetoIngresado) * Number(tipoCambio);
      } else if (monedaPago?.codigoSunat === 'PEN' && monedaDeuda?.codigoSunat === 'USD') {
        // PEN → USD: dividir por TC
        montoConvertido = Number(montoNetoIngresado) / Number(tipoCambio);
      }
    }

    setMontoAplicadoDeuda(montoConvertido);
  }, [montoNetoIngresado, tipoCambio, monedaPagoId, cuentaPorPagar?.monedaId, monedas]);

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
    // Filtrar solo tipos de movimiento de EGRESO
    return tiposMovimiento
      .filter(tm => tm.tipo === 'EGRESO')
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
    
    // ✅ SUMAR ITF y Comisión de AMBAS operaciones (neto + detracción)
    const itf = Number(montoITF || 0) + Number(itfDetraccion || 0);
    const comision = Number(montoComision || 0) + Number(comisionDetraccion || 0);
    const detraccion = Number(montoDetraccionIngresado || 0);

    const montoNetoCaja = montoBruto - itf - comision;
    const deudaCancelada = Number(montoAplicadoDeuda || 0);
    const saldoPendiente = Number(cuentaPorPagar?.saldoPendiente || 0) - deudaCancelada;

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
    itfDetraccion,
    comisionDetraccion,
    montoAplicadoDeuda,
    cuentaPorPagar?.saldoPendiente
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

    // ✅ VALIDAR CAMPOS DE DETRACCIÓN SI HAY PAGO DE DETRACCIÓN
    if (Number(montoDetraccionIngresado) > 0) {
      if (!cuentaBancariaDetraccionId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar la cuenta corriente origen para el pago de detracción.',
          life: 3000
        });
        return false;
      }

      if (!fechaDepositoDetraccion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar la fecha de depósito de la detracción.',
          life: 3000
        });
        return false;
      }

      if (!monedaDetraccionId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar la moneda del pago de detracción.',
          life: 3000
        });
        return false;
      }

      if (!medioPagoDetraccionId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el medio de pago de la detracción.',
          life: 3000
        });
        return false;
      }

      if (!numeroConstanciaDetraccion) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el N° de Constancia SUNAT de la detracción.',
          life: 3000
        });
        return false;
      }

      if (!tipoMovimientoDetraccionId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento para la detracción.',
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

    if (!tipoMovimientoEgresoId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar el tipo de movimiento de egreso.',
        life: 3000
      });
      return false;
    }

    // Validar detracción
    if (aplicaDetraccion) {
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
      // ✅ DEBUG: Verificar valores antes de enviar
      console.log('🔍 [handleProcesarPago] Valores calculados:', {
        montoNetoIngresado,
        montoDetraccionIngresado,
        montoAplicadoDeuda,
        tipoCambio,
        monedaPagoId,
        monedaDeudaId: cuentaPorPagar.monedaId
      });

      const dataPago = {
        cuentaPorPagarId: cuentaPorPagar.id,
        empresaId: cuentaPorPagar.empresaId,
        fechaPago: fechaPago.toISOString(),
        // montoPagado debe ser solo el monto neto (el que genera el movimiento de egreso)
        montoPagado: Number(montoNetoIngresado) || 0,
        monedaPagoId: Number(monedaPagoId),
        tipoCambio: Number(tipoCambio),
        montoAplicadoDeuda: Number(montoAplicadoDeuda),
        monedaDeudaId: Number(cuentaPorPagar.monedaId),
        medioPagoId: Number(medioPagoId),
        tipoMovimientoEgresoId: Number(tipoMovimientoEgresoId),
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

      // Agregar detracción si aplica
      if (aplicaDetraccion) {
        dataPago.aplicaDetraccion = true;
        dataPago.detraccion = {
          numeroConstancia: numeroConstanciaDetraccion,
          fechaDeposito: fechaDepositoDetraccion.toISOString(),
          tipoDetraccionId: tipoDetraccionId ? Number(tipoDetraccionId) : null,
          tasaDetraccion: Number(tasaDetraccion),
          importeTotal: Number(importeTotalDetraccion),
          importeDetraido: Number(importeDetraido),
          cuentaSunatId: cuentaSunatId ? Number(cuentaSunatId) : null,
          observaciones: observaciones || null,
          // ✅ NUEVOS CAMPOS PARA PAGO DE DETRACCIÓN
          cuentaBancariaDetraccionId: cuentaBancariaDetraccionId ? Number(cuentaBancariaDetraccionId) : null,
          medioPagoDetraccionId: medioPagoDetraccionId ? Number(medioPagoDetraccionId) : null,
          monedaDetraccionId: monedaDetraccionId ? Number(monedaDetraccionId) : null,
          tipoCambioDetraccion: Number(tipoCambioDetraccion) || 1,
          montoDetraccion: Number(montoDetraccionIngresado) || 0,
          itfDetraccion: Number(itfDetraccion) || 0,
          comisionDetraccion: Number(comisionDetraccion) || 0,
          tipoMovimientoDetraccionId: tipoMovimientoDetraccionId ? Number(tipoMovimientoDetraccionId) : null,
          numeroOperacionDetraccion: numeroOperacionBN || null
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
        const { pagoCuentaPorPagar, movimientos, conceptosSunat, resumen } = response.data;
        
       
        const empresaData = empresas.find(e => Number(e.id) === Number(cuentaPorPagar.empresaId));

        // Generar voucher consolidado automáticamente
        const voucherConsolidado = await generarYSubirVoucherConsolidado(
          pagoCuentaPorPagar,
          movimientos || {},
          conceptosSunat || {},
          resumen || {},
          empresaData,
          cuentaPorPagar,
          usuario  // ✅ Pasar usuario logueado
        );

        if (voucherConsolidado.success && voucherConsolidado.urlPdf) {
          // ✅ Actualizar URL en PagoCuentaPorPagar (tabla correcta)
          await actualizarUrlVoucherConsolidadoPago(pagoCuentaPorPagar.id, voucherConsolidado.urlPdf);
          // También actualizar en MovimientoCaja para compatibilidad
          await actualizarUrlVoucherConsolidado(movimientos.egreso.id, voucherConsolidado.urlPdf);
          // ✅ Actualizar en el objeto de respuesta para que se muestre en ConfirmacionPagoDialog
          response.data.pagoCuentaPorPagar.urlVoucherOperacionConsolidado = voucherConsolidado.urlPdf;
        }

        // ═══════════════════════════════════════════════════════════
        // GENERAR VOUCHERS INDIVIDUALES AUTOMÁTICAMENTE
        // ═══════════════════════════════════════════════════════════
        
        // Voucher individual del movimiento de egreso
        if (movimientos.egreso) {
          try {
            const voucherEgreso = await generarYSubirVoucherIndividual(
              movimientos.egreso,
              pagoCuentaPorPagar,
              empresaData,
              cuentaPorPagar,
              usuario
            );
            if (voucherEgreso.success && voucherEgreso.urlPdf) {
              await actualizarUrlVoucherIndividual(movimientos.egreso.id, voucherEgreso.urlPdf);
              // ✅ Actualizar en el objeto de respuesta para que se muestre en ConfirmacionPagoDialog
              response.data.movimientos.egreso.urlOperacionIndividualOperacionCaja = voucherEgreso.urlPdf;
            }
          } catch (error) {
            console.error('❌ Error al generar voucher de egreso:', error);
          }
        }

        // Voucher individual del movimiento de ITF
        if (movimientos.itf) {
          try {
            const voucherITF = await generarYSubirVoucherIndividual(
              movimientos.itf,
              pagoCuentaPorPagar,
              empresaData,
              cuentaPorPagar,
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
              pagoCuentaPorPagar,
              empresaData,
              cuentaPorPagar,
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
              pagoCuentaPorPagar,
              empresaData,
              cuentaPorPagar,
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

        // ✅ Voucher individual de autodetracción EGRESO (abono a Banco de la Nación)
        if (movimientos.autodetraccionEgreso) {
          try {
            const voucherAutodetEgreso = await generarYSubirVoucherIndividual(
              movimientos.autodetraccionEgreso,
              pagoCuentaPorPagar,
              empresaData,
              cuentaPorPagar,
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
          movimientos.egreso,
          movimientos.detraccionEgreso,
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
                cuentaPorPagar,
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
    // ✅ Limpiar referencias de control de consultas API
    ultimaConsultaTCNeto.current = null;
    ultimaConsultaTCDetraccion.current = null;
    
    setFechaPago(new Date());
    setMontoPagado(0);
    setMonedaPagoId(null);
    setTipoCambio(1);
    setMontoAplicadoDeuda(0);
    setMedioPagoId(null);
    setNumeroOperacion('');
    setBancoId(null);
    setCuentaBancariaId(null);
    setTipoMovimientoEgresoId(null);
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
    if (!cuentaPorPagar) return null;

    const moneda = monedas.find(m => Number(m.id) === Number(cuentaPorPagar.monedaId));
    const simboloMoneda = moneda?.simbolo || '';

    return (
      <Panel header="📄 Información del Documento" className="mb-3">
        <div className="p-fluid">
          <IrACxPEditar
            ordenCompraId={cuentaPorPagar.ordenCompraId}
            ordenCompra={cuentaPorPagar.ordenCompra}
            empresas={empresas}
            proveedores={[cuentaPorPagar.proveedor]}
            monedas={monedas}
            estados={[cuentaPorPagar.estado]}
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
    if (!cuentaPorPagar?.preFactura) return null;

    const preFactura = cuentaPorPagar.preFactura;
    let tipoImpuesto = null;
    let registroGenerado = null;
    let estadosImpuesto = [];

    if (preFactura.aplicaDetraccion && preFactura.detraccion) {
      tipoImpuesto = 'DETRACCION';
      registroGenerado = preFactura.detraccion;
      estadosImpuesto = estadosDetraccion;
    } else if (preFactura.aplicaRetencion && preFactura.retencion) {
      tipoImpuesto = 'RETENCION';
      registroGenerado = preFactura.retencion;
      estadosImpuesto = estadosRetencion;
    } else if (preFactura.aplicaPercepcion && preFactura.percepcion) {
      tipoImpuesto = 'PERCEPCION';
      registroGenerado = preFactura.percepcion;
      estadosImpuesto = estadosPercepcion;
    }

    if (!tipoImpuesto || !registroGenerado) return null;

    return (
      <Panel header="📋 Registro de Impuesto SUNAT Generado" className="mb-3">
        <VerRegistroImpuestoSunat
          registro={registroGenerado}
          tipo={tipoImpuesto}
          monedas={monedas}
          tiposDetraccion={tiposDetraccion}
          tiposRetencionPercepcion={tiposRetencionPercepcion}
          periodosContables={periodosContables}
          cuentasCorrientes={cuentasCorrientes}
          empresas={empresas}
          entidadesComerciales={proveedores}
          estadosPago={estadosImpuesto}
          compact={false}
          toast={toast}
          permisos={{}}
          onUpdate={(updatedData) => {
          }}
        />
      </Panel>
    );
  };
  // ════════════════════════════════════════════════════════════
  // RENDER: DATOS DE PAGO
  // ════════════════════════════════════════════════════════════
  const renderDatosPago = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorPagar?.monedaId));

    const preFactura = cuentaPorPagar?.preFactura;
    let netoEsperado = Number(cuentaPorPagar?.saldoPendiente || 0);
    
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
                empresaIdPreseleccionada={cuentaPorPagar?.empresaId}
                value={cuentaBancariaId}
                onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                  setCuentaBancariaId(cuentaCorrienteId);
                  setBancoId(bancoId);
                  // ✅ NO auto-seleccionar moneda - mantener la moneda del documento
                  // El usuario puede cambiar la moneda manualmente si lo necesita
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
                min={0.0001}
              />
              <small className="p-text-secondary">
                {monedaDeuda?.codigo} → {monedaPago?.codigo}
              </small>
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
                value={tipoMovimientoEgresoId}
                onChange={(value) => setTipoMovimientoEgresoId(value)}
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
    // ⭐ CORRECCIÓN: CxP usa ordenCompra, no preFactura
    if (!cuentaPorPagar?.ordenCompra?.aplicaDetraccion) return null;

    const ordenCompra = cuentaPorPagar.ordenCompra;
    const detraccion = ordenCompra.detraccion;
    if (!detraccion) return null;

    const monedaDetraccion = monedas.find(m => Number(m.id) === Number(monedaDetraccionId));
    const montoDetEsperado = Number(detraccion.saldoPendiente || 0);

    return (
      <Panel header="🏦 2. PAGO DE LA DETRACCIÓN (Depósito a SUNAT)" className="mb-3">
        <div className="p-fluid">
          {esAutodetraccion && (
            <div style={{ backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>⚙️ AUTODETRACCIÓN AUTOMÁTICA</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Los campos se han completado automáticamente. El sistema generará un EGRESO desde tu cuenta.
              </p>
            </div>
          )}

          {/* Cuenta Corriente Origen */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="cuentaBancariaDetraccionId" className="font-bold">
                Cuenta Corriente Origen <span className="text-red-500">*</span>
              </label>
              <CuentaCorrienteSelector
                empresaIdPreseleccionada={cuentaPorPagar?.empresaId}
                value={cuentaBancariaDetraccionId}
                onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                  setCuentaBancariaDetraccionId(cuentaCorrienteId);
                  // ✅ NO auto-seleccionar moneda - mantener la moneda del documento
                  // El usuario puede cambiar la moneda manualmente si lo necesita
                }}
                label=""
                placeholder="Seleccione cuenta desde donde pagará la detracción"
              />
            </div>
          </div>

          {/* Fecha, Moneda, Monto */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="fechaDepositoDetraccion" className="font-bold">
                Fecha Depósito <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fechaDepositoDetraccion"
                value={fechaDepositoDetraccion}
                onChange={(e) => setFechaDepositoDetraccion(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="monedaDetraccionId" className="font-bold">
                Moneda <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="monedaDetraccionId"
                value={monedaDetraccionId}
                options={monedasOptions}
                onChange={(e) => setMonedaDetraccionId(e.value)}
                placeholder="Seleccione moneda"
                className="w-full"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="tipoCambioDetraccion" className="font-bold">
                Tipo de Cambio <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="tipoCambioDetraccion"
                value={tipoCambioDetraccion}
                onValueChange={(e) => setTipoCambioDetraccion(e.value || 1)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                style={{ width: "100%" }}
                placeholder="1.0000"
                min={0.0001}
              />
              <small className="p-text-secondary">
                {monedas.find(m => Number(m.id) === Number(cuentaPorPagar?.monedaId))?.codigo} → {monedaDetraccion?.codigo}
              </small>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="montoDetraccionIngresado" className="font-bold">
                Monto Pagado Detracción <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="montoDetraccionIngresado"
                value={montoDetraccionIngresado}
                onValueChange={(e) => setMontoDetraccionIngresado(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder={`Detracción esperada: ${monedaDetraccion?.simbolo || ''} ${montoDetEsperado.toFixed(2)}`}
              />
            </div>
          </div>

          {/* Medio de Pago, N° Operación, Tipo Movimiento */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="medioPagoDetraccionId" className="font-bold">
                Medio de Pago <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="medioPagoDetraccionId"
                value={medioPagoDetraccionId}
                options={mediosPagoOptions}
                onChange={(e) => setMedioPagoDetraccionId(e.value)}
                placeholder="Seleccione medio de pago"
                className="w-full"
                filter
                showClear
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroConstanciaDetraccion" className="font-bold">
                N° Constancia SUNAT <span className="text-red-500">*</span>
              </label>
              <InputText
                id="numeroConstanciaDetraccion"
                value={numeroConstanciaDetraccion}
                onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de constancia"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroOperacionBN" className="font-bold">
                N° Operación
              </label>
              <InputText
                id="numeroOperacionBN"
                value={numeroOperacionBN}
                onChange={(e) => setNumeroOperacionBN(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de operación"
              />
            </div>
          </div>

          {/* Tipo de Movimiento */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <TipoMovimientoSelector
                tiposMovimiento={tiposMovimiento}
                value={tipoMovimientoDetraccionId}
                onChange={(value) => setTipoMovimientoDetraccionId(value)}
                required={true}
                placeholder="Buscar tipo de movimiento para detracción..."
              />
            </div>
          </div>

          <Divider />

          {/* Cargos Bancarios */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
            <strong>🏦 Cargos Bancarios (Pago de Detracción)</strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="itfDetraccion" className="font-bold">
                ITF
              </label>
              <InputNumber
                id="itfDetraccion"
                value={itfDetraccion}
                onValueChange={(e) => setItfDetraccion(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="comisionDetraccion" className="font-bold">
                Comisión Bancaria
              </label>
              <InputNumber
                id="comisionDetraccion"
                value={comisionDetraccion}
                onValueChange={(e) => setComisionDetraccion(e.value || 0)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </div>
          </div>

          <Divider />

          <div style={{ backgroundColor: '#e7f3ff', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
            ℹ️ <strong>Importante:</strong> Este pago es un EGRESO desde tu cuenta corriente hacia SUNAT. Genera ITF y comisión bancaria según tu banco.
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
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorPagar?.monedaId));
    const monedaDetraccion = monedas.find(m => Number(m.id) === Number(monedaDetraccionId));
    
    const simboloPago = monedaPago?.simbolo || 'S/.';
    const simboloDeuda = monedaDeuda?.simbolo || 'S/.';
    
    // Calcular descuento de deuda en moneda original
    const montoNetoEnMonedaPago = Number(montoNetoIngresado || 0);
    const montoDetraccionEnMonedaPago = Number(montoDetraccionIngresado || 0);
    
    // Convertir a moneda de deuda
    let descontoNetoEnDeuda = montoNetoEnMonedaPago;
    let descontoDetraccionEnDeuda = montoDetraccionEnMonedaPago;
    
    if (monedaPago?.codigoSunat !== monedaDeuda?.codigoSunat) {
      if (monedaPago?.codigoSunat === 'USD' && monedaDeuda?.codigoSunat === 'PEN') {
        descontoNetoEnDeuda = montoNetoEnMonedaPago * Number(tipoCambio);
        descontoDetraccionEnDeuda = montoDetraccionEnMonedaPago * Number(tipoCambioDetraccion);
      } else if (monedaPago?.codigoSunat === 'PEN' && monedaDeuda?.codigoSunat === 'USD') {
        descontoNetoEnDeuda = montoNetoEnMonedaPago / Number(tipoCambio);
        descontoDetraccionEnDeuda = montoDetraccionEnMonedaPago / Number(tipoCambioDetraccion);
      }
    }
    
    const totalDescontoDeuda = descontoNetoEnDeuda + descontoDetraccionEnDeuda;
    const saldoPendienteDeuda = Number(cuentaPorPagar?.saldoPendiente || 0) - totalDescontoDeuda;

    return (
      <Panel header="📊 Resumen de Operación" className="mb-3">
        {/* Resumen en moneda de pago */}
        <div style={{ marginBottom: '1rem' }}>
          <strong style={{ fontSize: '0.9rem', color: '#495057' }}>💵 Pagos realizados ({monedaPago?.codigo || 'PEN'}):</strong>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            padding: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Pago Neto</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0d6efd' }}>
                {simboloPago} {montoNetoEnMonedaPago.toFixed(2)}
              </div>
            </div>

            {montoDetraccionEnMonedaPago > 0 && (
              <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Detracción</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#6c757d' }}>
                  {monedaDetraccion?.simbolo || simboloPago} {montoDetraccionEnMonedaPago.toFixed(2)}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>ITF</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fd7e14' }}>
                {simboloPago} {resumenOperacion.itf.toFixed(2)}
              </div>
            </div>

            <div style={{ textAlign: 'center', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Comisión</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fd7e14' }}>
                {simboloPago} {resumenOperacion.comision.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Resumen en moneda de deuda */}
        <div>
          <strong style={{ fontSize: '0.9rem', color: '#495057' }}>📋 Aplicación a la deuda ({monedaDeuda?.codigo || 'USD'}):</strong>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            padding: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Descuento Neto</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0d6efd' }}>
                {simboloDeuda} {descontoNetoEnDeuda.toFixed(2)}
              </div>
              {monedaPago?.codigoSunat !== monedaDeuda?.codigoSunat && (
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  TC: {tipoCambio.toFixed(4)}
                </div>
              )}
            </div>

            {montoDetraccionEnMonedaPago > 0 && (
              <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Descuento Detracción</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#6c757d' }}>
                  {simboloDeuda} {descontoDetraccionEnDeuda.toFixed(2)}
                </div>
                {monedaDetraccion?.codigoSunat !== monedaDeuda?.codigoSunat && (
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    TC: {tipoCambioDetraccion.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', borderRight: '1px solid #dee2e6', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Total Descontado</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#198754' }}>
                {simboloDeuda} {totalDescontoDeuda.toFixed(2)}
              </div>
            </div>

            <div style={{ textAlign: 'center', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>Saldo Pendiente</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: saldoPendienteDeuda > 0 ? '#dc3545' : '#198754' }}>
                {simboloDeuda} {saldoPendienteDeuda.toFixed(2)}
              </div>
            </div>
          </div>
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
        cuentaPorPagar={cuentaPorPagar}
        monedas={monedas}
        empresas={empresas}
        toast={toast}
      />
    </>
  );
}