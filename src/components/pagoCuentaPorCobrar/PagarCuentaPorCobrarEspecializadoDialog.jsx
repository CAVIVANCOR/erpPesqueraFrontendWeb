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
import { procesarPagoEspecializado } from '../../api/tesoreria/pagoEspecializadoCuentaPorCobrar';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { getResponsiveFontSize } from '../../utils/utils';
import ConfirmacionPagoDialog from './ConfirmacionPagoDialog';
import TipoMovimientoSelector from '../common/TipoMovimientoSelector';
import CuentaPorCobrarInfoButton from '../common/CuentaPorCobrarInfoButton';

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
  // EFECTOS: INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible && cuentaPorCobrar) {
      // Inicializar moneda de pago con la moneda de la deuda
      setMonedaPagoId(cuentaPorCobrar.monedaId);

      // Inicializar monto sugerido con el saldo pendiente
      setMontoPagado(Number(cuentaPorCobrar.saldoPendiente || 0));
      setMontoAplicadoDeuda(Number(cuentaPorCobrar.saldoPendiente || 0));

      // Inicializar importes de conceptos SUNAT
      setImporteTotalDetraccion(Number(cuentaPorCobrar.saldoPendiente || 0));
      setImporteTotalRetencion(Number(cuentaPorCobrar.saldoPendiente || 0));
      setImporteTotalPercepcion(Number(cuentaPorCobrar.saldoPendiente || 0));
    }
  }, [visible, cuentaPorCobrar]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CONSULTA TIPO DE CAMBIO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaPago || !monedaPagoId || !cuentaPorCobrar?.monedaId) return;

      const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
      const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar.monedaId));

      // Si ambas monedas son iguales, tipo de cambio = 1
      if (monedaPago?.codigo === monedaDeuda?.codigo) {
        setTipoCambio(1);
        return;
      }

      // Si una es USD y la otra PEN, consultar SUNAT
      if (
        (monedaPago?.codigo === 'USD' && monedaDeuda?.codigo === 'PEN') ||
        (monedaPago?.codigo === 'PEN' && monedaDeuda?.codigo === 'USD')
      ) {
        try {
          const fechaISO = fechaPago.toISOString().split('T')[0];
          const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });

          // Usar buy_price (precio de compra del dólar)
          if (tipoCambioData && tipoCambioData.buy_price) {
            const tc = parseFloat(tipoCambioData.buy_price);
            setTipoCambio(tc);

            toast?.current?.show({
              severity: 'success',
              summary: 'Tipo de Cambio',
              detail: `T/C SUNAT: S/ ${tc.toFixed(3)} por USD (${fechaISO})`,
              life: 3000
            });
          } else {
            toast?.current?.show({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'No se encontró tipo de cambio para la fecha seleccionada.',
              life: 5000
            });
          }
        } catch (error) {
          console.error('Error al consultar tipo de cambio:', error);
          toast?.current?.show({
            severity: 'warn',
            summary: 'Advertencia',
            detail: error.message || 'No se pudo consultar el tipo de cambio de SUNAT. Ingrese manualmente.',
            life: 5000
          });
        }
      } else {
        // Para otras combinaciones de monedas, establecer en 1
        setTipoCambio(1);
      }
    };

    consultarTipoCambio();
  }, [fechaPago, monedaPagoId, cuentaPorCobrar?.monedaId, monedas, toast]);
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
    if (monedaPago?.codigo !== monedaDeuda?.codigo) {
      if (monedaPago?.codigo === 'USD' && monedaDeuda?.codigo === 'PEN') {
        montoConvertido = Number(montoPagado) * Number(tipoCambio);
      } else if (monedaPago?.codigo === 'PEN' && monedaDeuda?.codigo === 'USD') {
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
    const montoBruto = Number(montoPagado || 0);
    const itf = Number(montoITF || 0);
    const comision = Number(montoComision || 0);
    const detraccion = aplicaDetraccion ? Number(importeDetraido || 0) : 0;
    const retencion = aplicaRetencion ? Number(importeRetenido || 0) : 0;
    const percepcion = aplicaPercepcion ? Number(importePercibido || 0) : 0;

    const montoNetoCaja = montoBruto - itf - comision;
    const deudaCancelada = Number(montoAplicadoDeuda || 0);
    const saldoPendiente = Number(cuentaPorCobrar?.saldoPendiente || 0) - deudaCancelada;

    return {
      montoBruto,
      itf,
      comision,
      detraccion,
      retencion,
      percepcion,
      montoNetoCaja,
      deudaCancelada,
      saldoPendiente: saldoPendiente > 0 ? saldoPendiente : 0
    };
  }, [
    montoPagado,
    montoITF,
    montoComision,
    aplicaDetraccion,
    importeDetraido,
    aplicaRetencion,
    importeRetenido,
    aplicaPercepcion,
    importePercibido,
    montoAplicadoDeuda,
    cuentaPorCobrar?.saldoPendiente
  ]);

  // ════════════════════════════════════════════════════════════
  // FUNCIONES: VALIDACIÓN
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    if (!fechaPago) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar la fecha de pago.',
        life: 3000
      });
      return false;
    }

    if (!montoPagado || Number(montoPagado) <= 0) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'El monto pagado debe ser mayor a cero.',
        life: 3000
      });
      return false;
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

    if (Number(montoAplicadoDeuda) > Number(cuentaPorCobrar?.saldoPendiente || 0)) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'El monto aplicado no puede ser mayor al saldo pendiente.',
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
      const dataPago = {
        cuentaPorCobrarId: cuentaPorCobrar.id,
        empresaId: cuentaPorCobrar.empresaId,
        fechaPago: fechaPago.toISOString(),
        montoPagado: Number(montoPagado),
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
        periodoContableId: periodoContableId ? Number(periodoContableId) : null
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
        setResultadoPago(response.data);
        setShowConfirmacion(true);

        toast?.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: response.message || 'Pago procesado exitosamente.',
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
          {/* Información resumida con Tags */}
          <div style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <div>
              <label className="font-bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                Cliente:
              </label>
              <Tag
                value={cuentaPorCobrar.cliente?.razonSocial || 'N/A'}
                severity="info"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            <div>
              <label className="font-bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                Monto Total:
              </label>
              <Tag
                value={`${simboloMoneda} ${Number(cuentaPorCobrar.montoTotal || 0).toFixed(2)}`}
                severity="info"
                style={{ fontSize: "0.9rem", fontWeight: "600" }}
              />
            </div>

            <div>
              <label className="font-bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                Monto Pagado:
              </label>
              <Tag
                value={`${simboloMoneda} ${Number(cuentaPorCobrar.montoPagado || 0).toFixed(2)}`}
                severity="success"
                style={{ fontSize: "0.9rem", fontWeight: "600" }}
              />
            </div>

            <div>
              <label className="font-bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                Saldo Pendiente:
              </label>
              <Tag
                value={`${simboloMoneda} ${Number(cuentaPorCobrar.saldoPendiente || 0).toFixed(2)}`}
                severity="warning"
                style={{ fontSize: "0.9rem", fontWeight: "600" }}
              />
            </div>
          </div>

          {/* Botón para ver detalles completos - Solo si hay datos disponibles */}
          {empresas?.length > 0 && clientes?.length > 0 && estadosCxC?.length > 0 ? (
            <CuentaPorCobrarInfoButton
              cuentaPorCobrar={cuentaPorCobrar}
              monedas={monedas}
              empresas={empresas}
              clientes={clientes}
              estados={estadosCxC}
              periodosContables={periodosContables}
              mediosPago={mediosPago}
              bancos={bancos}
              cuentasCorrientes={cuentasCorrientes}
              toast={toast}
              buttonLabel="Ver Detalles Completos de la Cuenta por Cobrar"
              buttonIcon="pi pi-eye"
              buttonSeverity="secondary"
              outlined={true}
            />
          ) : null}
        </div>
      </Panel>
    );
  };
  // ════════════════════════════════════════════════════════════
  // RENDER: DATOS DE PAGO
  // ════════════════════════════════════════════════════════════
  const renderDatosPago = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar?.monedaId));

    return (
      <Panel header="💰 Datos de Pago" className="mb-3">
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
                onChange={({ cuentaCorrienteId, bancoId }) => {
                  setCuentaBancariaId(cuentaCorrienteId);
                  setBancoId(bancoId); // ← Banco se asigna automáticamente
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
                Moneda de Pago <span className="text-red-500">*</span>
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
              <label htmlFor="montoPagado" className="font-bold">
                Monto Pagado <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="montoPagado"
                value={montoPagado}
                onValueChange={(e) => setMontoPagado(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                className="w-full"
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
              <label htmlFor="tipoCambio" className="font-bold">
                Tipo de Cambio
              </label>
              <InputNumber
                id="tipoCambio"
                value={tipoCambio}
                onValueChange={(e) => setTipoCambio(e.value)}
                mode="decimal"
                minFractionDigits={4}
                maxFractionDigits={4}
                className="w-full"
                disabled={monedaPago?.codigo === monedaDeuda?.codigo}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="montoAplicadoDeuda" className="font-bold">
                Monto Aplicado a la Deuda
              </label>
              <InputNumber
                id="montoAplicadoDeuda"
                value={montoAplicadoDeuda}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix={monedaDeuda?.simbolo ? `${monedaDeuda.simbolo} ` : ''}
                className="w-full"
                disabled
              />
            </div>
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
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="bancoId" className="font-bold">
                Banco
              </label>
              <Dropdown
                id="bancoId"
                value={bancoId}
                options={bancosOptions}
                onChange={(e) => setBancoId(e.value)}
                placeholder="Seleccione banco"
                className="w-full"
                showClear
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="numeroOperacion" className="font-bold">
                Número de Operación
              </label>
              <InputText
                id="numeroOperacion"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                className="w-full"
                placeholder="Ingrese número de operación"
              />
            </div>
          </div>
          <TipoMovimientoSelector
            tiposMovimiento={tiposMovimiento}
            value={tipoMovimientoIngresoId}
            onChange={(value) => setTipoMovimientoIngresoId(value)}
            required={true}
            placeholder="Buscar tipo de movimiento de ingreso..."
            filterFunction={(tipo) => tipo.esIngreso === true}
          />
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CARGOS BANCARIOS
  // ════════════════════════════════════════════════════════════
  const renderCargosBancarios = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));

    return (
      <Panel header="🏦 Cargos Bancarios" className="mb-3" toggleable collapsed>
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="montoITF" className="font-bold">
                ITF (Impuesto a las Transacciones Financieras)
              </label>
              <InputNumber
                id="montoITF"
                value={montoITF}
                onValueChange={(e) => setMontoITF(e.value)}
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
              <label htmlFor="montoComision" className="font-bold">
                Comisión Bancaria
              </label>
              <InputNumber
                id="montoComision"
                value={montoComision}
                onValueChange={(e) => setMontoComision(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix={monedaPago?.simbolo ? `${monedaPago.simbolo} ` : ''}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Panel>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: CONCEPTOS SUNAT - DETRACCIÓN
  // ════════════════════════════════════════════════════════════
  const renderDetraccion = () => {
    const monedaPago = monedas.find(m => Number(m.id) === Number(monedaPagoId));

    return (
      <Panel header="📋 Detracción SUNAT" className="mb-3" toggleable collapsed>
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <BooleanToggleButton
                value={aplicaDetraccion}
                onChange={setAplicaDetraccion}
                trueLabel="Aplica Detracción"
                falseLabel="No Aplica Detracción"
                size="small"
              />
            </div>
          </div>

          {aplicaDetraccion && (
            <>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="numeroConstanciaDetraccion" className="font-bold">
                    Número de Constancia <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="numeroConstanciaDetraccion"
                    value={numeroConstanciaDetraccion}
                    onChange={(e) => setNumeroConstanciaDetraccion(e.target.value)}
                    className="w-full"
                    placeholder="Ingrese número de constancia"
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="fechaDepositoDetraccion" className="font-bold">
                    Fecha de Depósito <span className="text-red-500">*</span>
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
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tipoDetraccionId" className="font-bold">
                    Tipo de Detracción
                  </label>
                  <Dropdown
                    id="tipoDetraccionId"
                    value={tipoDetraccionId}
                    options={tiposDetraccionOptions}
                    onChange={(e) => setTipoDetraccionId(e.value)}
                    placeholder="Seleccione tipo de detracción"
                    className="w-full"
                    showClear
                    filter
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="tasaDetraccion" className="font-bold">
                    Tasa de Detracción (%) <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    id="tasaDetraccion"
                    value={tasaDetraccion}
                    onValueChange={(e) => setTasaDetraccion(e.value)}
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
                  <label htmlFor="importeTotalDetraccion" className="font-bold">
                    Importe Total
                  </label>
                  <InputNumber
                    id="importeTotalDetraccion"
                    value={importeTotalDetraccion}
                    onValueChange={(e) => setImporteTotalDetraccion(e.value)}
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
                  <label htmlFor="importeDetraido" className="font-bold">
                    Importe Detraído
                  </label>
                  <InputNumber
                    id="importeDetraido"
                    value={importeDetraido}
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
                trueLabel="Aplica Retención"
                falseLabel="No Aplica Retención"
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
                trueLabel="Aplica Percepción"
                falseLabel="No Aplica Percepción"
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
    const monedaDeuda = monedas.find(m => Number(m.id) === Number(cuentaPorCobrar?.monedaId));

    return (
      <Panel header="📊 Resumen de Operación" className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">Monto Bruto:</label>
              <div>
                <Tag
                  value={`${monedaPago?.simbolo || ''} ${resumenOperacion.montoBruto.toFixed(2)}`}
                  severity="info"
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">ITF:</label>
              <div>
                <Tag
                  value={`${monedaPago?.simbolo || ''} ${resumenOperacion.itf.toFixed(2)}`}
                  severity="warning"
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">Comisión:</label>
              <div>
                <Tag
                  value={`${monedaPago?.simbolo || ''} ${resumenOperacion.comision.toFixed(2)}`}
                  severity="warning"
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-4">
            <div className="field">
              <label className="font-bold">Monto Neto en Caja:</label>
              <div>
                <Tag
                  value={`${monedaPago?.simbolo || ''} ${resumenOperacion.montoNetoCaja.toFixed(2)}`}
                  severity="success"
                  style={{ fontSize: getResponsiveFontSize() }}
                />
              </div>
            </div>
          </div>

          {aplicaDetraccion && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Detracción:</label>
                <div>
                  <Tag
                    value={`${monedaPago?.simbolo || ''} ${resumenOperacion.detraccion.toFixed(2)}`}
                    severity="contrast"
                    style={{ fontSize: getResponsiveFontSize() }}
                  />
                </div>
              </div>
            </div>
          )}

          {aplicaRetencion && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Retención:</label>
                <div>
                  <Tag
                    value={`${monedaPago?.simbolo || ''} ${resumenOperacion.retencion.toFixed(2)}`}
                    severity="contrast"
                    style={{ fontSize: getResponsiveFontSize() }}
                  />
                </div>
              </div>
            </div>
          )}

          {aplicaPercepcion && (
            <div className="col-12 md:col-6 lg:col-4">
              <div className="field">
                <label className="font-bold">Percepción:</label>
                <div>
                  <Tag
                    value={`${monedaPago?.simbolo || ''} ${resumenOperacion.percepcion.toFixed(2)}`}
                    severity="contrast"
                    style={{ fontSize: getResponsiveFontSize() }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <Divider />
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold text-lg">Deuda Cancelada:</label>
              <div>
                <Tag
                  value={`${monedaDeuda?.simbolo || ''} ${resumenOperacion.deudaCancelada.toFixed(2)}`}
                  severity="success"
                  style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold text-lg">Saldo Pendiente:</label>
              <div>
                <Tag
                  value={`${monedaDeuda?.simbolo || ''} ${resumenOperacion.saldoPendiente.toFixed(2)}`}
                  severity={resumenOperacion.saldoPendiente > 0 ? 'warning' : 'success'}
                  style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
                />
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
          {renderDatosPago()}
          {renderCargosBancarios()}
          {renderDetraccion()}
          {renderRetencion()}
          {renderPercepcion()}
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
        toast={toast}
      />
    </>
  );
}