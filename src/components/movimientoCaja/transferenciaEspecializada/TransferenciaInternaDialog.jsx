// src/components/movimientoCaja/transferenciaEspecializada/TransferenciaInternaDialog.jsx
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
import { FileUpload } from 'primereact/fileupload';
import CuentaCorrienteSelector from '../../common/CuentaCorrienteSelector';
import BooleanToggleButton from '../../common/BooleanToggleButton';
import { consultarTipoCambioSunat } from '../../../api/consultaExterna';
import {
  procesarTransferenciaInterna,
  actualizarUrlVoucherIndividual,
  actualizarUrlVoucherBancario,
  subirVoucherBancario
} from '../../../api/tesoreria/transferencias';
import { useAuthStore } from '../../../shared/stores/useAuthStore';
import { getResponsiveFontSize, formatearFecha, formatearNumero } from '../../../utils/utils';
import TipoMovimientoSelector from '../../common/TipoMovimientoSelector';
import { generarYSubirVoucherIndividual } from '../utils/VoucherIndividualMovimientoPDF';
import { generarYSubirVoucherContable } from '../utils/VoucherContableMovimientoPDF';
import ConfirmacionTransferenciaDialog from './ConfirmacionTransferenciaDialog';

/**
 * ════════════════════════════════════════════════════════════
 * COMPONENTE: TRANSFERENCIA INTERNA ESPECIALIZADA
 * ════════════════════════════════════════════════════════════
 * 
 * Diálogo especializado para procesar movimientos de caja con 3 flujos:
 * 
 * FLUJO 1: TRANSFERENCIA ENTRE CUENTAS (origen + destino)
 *   - 6 MovimientoCaja: egreso, ITF origen, comisión origen,
 *                       ingreso, ITF destino, comisión destino
 *   - 6 Asientos contables automáticos
 * 
 * FLUJO 2: INGRESO DIRECTO (solo destino, sin origen)
 *   - 3 MovimientoCaja: ingreso, ITF destino, comisión destino
 *   - 3 Asientos contables automáticos
 *   - Ejemplo: Préstamo de cambista → Caja dólares
 * 
 * FLUJO 3: EGRESO DIRECTO (solo origen, sin destino)
 *   - 3 MovimientoCaja: egreso, ITF origen, comisión origen
 *   - 3 Asientos contables automáticos
 *   - Ejemplo: Devolución a cambista, pago coimas (si esGerencial=true)
 * 
 * CARACTERÍSTICAS:
 * - Generación de correlativo único
 * - Manejo de tipo de cambio automático (SUNAT)
 * - ITF y comisiones opcionales
 * - Operaciones fiscales (blancas) o gerenciales (negras)
 * - Generación automática de vouchers PDF
 * - Actualización de saldos en cascada
 */

export default function TransferenciaInternaDialog({
  visible,
  onHide,
  monedas = [],
  mediosPago = [],
  bancos = [],
  cuentasCorrientes = [],
  tiposMovimiento = [],
  empresas = [],
  toast,
  onSuccess
}) {
  const usuario = useAuthStore((state) => state.usuario);

  // ════════════════════════════════════════════════════════════
  // REFERENCIAS PARA CONTROL DE CONSULTAS API
  // ════════════════════════════════════════════════════════════
  const ultimaConsultaTC = useRef(null);

  // ════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPALES
  // ════════════════════════════════════════════════════════════
  const [loading, setLoading] = useState(false);
  const [fechaTransferencia, setFechaTransferencia] = useState(new Date());
  const [descripcion, setDescripcion] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');

  // Estados para confirmación
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoTransferencia, setResultadoTransferencia] = useState(null);

  // Estado para operación gerencial (negra)
  const [esGerencial, setEsGerencial] = useState(false);

  // ════════════════════════════════════════════════════════════
  // ESTADOS CUENTA ORIGEN
  // ════════════════════════════════════════════════════════════
  const [cuentaOrigenId, setCuentaOrigenId] = useState(null);
  const [monedaOrigenSelector, setMonedaOrigenSelector] = useState(null); // Moneda del selector
  const [montoOrigen, setMontoOrigen] = useState(0); // ✅ Monto en moneda de origen
  const [medioPagoOrigenId, setMedioPagoOrigenId] = useState(null);
  const [numeroChequeOrigen, setNumeroChequeOrigen] = useState('');
  const [tipoMovimientoEgresoId, setTipoMovimientoEgresoId] = useState(null);
  const [itfOrigen, setItfOrigen] = useState(0);
  const [comisionOrigen, setComisionOrigen] = useState(0);

  // ════════════════════════════════════════════════════════════
  // ESTADOS CUENTA DESTINO
  // ════════════════════════════════════════════════════════════
  const [cuentaDestinoId, setCuentaDestinoId] = useState(null);
  const [monedaDestinoSelector, setMonedaDestinoSelector] = useState(null); // Moneda del selector
  const [montoDestino, setMontoDestino] = useState(0); // ✅ Monto en moneda de destino
  const [medioPagoDestinoId, setMedioPagoDestinoId] = useState(null);
  const [numeroChequeDestino, setNumeroChequeDestino] = useState('');
  const [tipoMovimientoIngresoId, setTipoMovimientoIngresoId] = useState(null);
  const [itfDestino, setItfDestino] = useState(0);
  const [comisionDestino, setComisionDestino] = useState(0);

  // ════════════════════════════════════════════════════════════
  // ESTADOS TIPO DE CAMBIO
  // ════════════════════════════════════════════════════════════
  const [tipoCambio, setTipoCambio] = useState(1);

  // ════════════════════════════════════════════════════════════
  // ESTADOS VOUCHERS BANCARIOS
  // ════════════════════════════════════════════════════════════
  const [voucherOrigenFile, setVoucherOrigenFile] = useState(null);
  const [voucherDestinoFile, setVoucherDestinoFile] = useState(null);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: OBTENER CUENTAS SELECCIONADAS
  // ════════════════════════════════════════════════════════════
  const cuentaOrigen = useMemo(() => {
    if (!cuentaOrigenId) return null;
    // Comparar convirtiendo ambos a número para evitar problemas de tipo
    const cuenta = cuentasCorrientes.find(c => Number(c.id) === Number(cuentaOrigenId));
    if (!cuenta) {
      console.warn('⚠️ Cuenta origen no encontrada en cuentasCorrientes:', cuentaOrigenId);
      // Retornar un objeto mínimo con la información que tenemos
      return {
        id: cuentaOrigenId,
        moneda: monedaOrigenSelector,
        saldoActual: 0 // No tenemos el saldo
      };
    }
    return cuenta;
  }, [cuentaOrigenId, cuentasCorrientes, monedaOrigenSelector]);

  const cuentaDestino = useMemo(() => {
    if (!cuentaDestinoId) return null;
    // Comparar convirtiendo ambos a número para evitar problemas de tipo
    const cuenta = cuentasCorrientes.find(c => Number(c.id) === Number(cuentaDestinoId));
    if (!cuenta) {
      console.warn('⚠️ Cuenta destino no encontrada en cuentasCorrientes:', cuentaDestinoId);
      // Retornar un objeto mínimo con la información que tenemos
      return {
        id: cuentaDestinoId,
        moneda: monedaDestinoSelector,
        saldoActual: 0 // No tenemos el saldo
      };
    }
    return cuenta;
  }, [cuentaDestinoId, cuentasCorrientes, monedaDestinoSelector]);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: DETECTAR SI HAY CAMBIO DE MONEDA
  // ════════════════════════════════════════════════════════════
  const hayDiferenciaMoneda = useMemo(() => {
    if (!monedaOrigenSelector || !monedaDestinoSelector) {
      return false;
    }
    return Number(monedaOrigenSelector.id) !== Number(monedaDestinoSelector.id);
  }, [monedaOrigenSelector, monedaDestinoSelector]);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: MONEDAS DE ORIGEN Y DESTINO
  // ════════════════════════════════════════════════════════════
  // Usar directamente las monedas del selector (fuente de verdad)
  const monedaOrigen = monedaOrigenSelector;
  const monedaDestino = monedaDestinoSelector;

  // ════════════════════════════════════════════════════════════
  // COMPUTED: TOTALES
  // ════════════════════════════════════════════════════════════
  const totalDebitado = useMemo(() => {
    return Number(montoOrigen) + Number(itfOrigen) + Number(comisionOrigen);
  }, [montoOrigen, itfOrigen, comisionOrigen]);

  const totalAcreditado = useMemo(() => {
    return Number(montoDestino) - Number(itfDestino) - Number(comisionDestino);
  }, [montoDestino, itfDestino, comisionDestino]);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: DETECTAR SI EL MEDIO DE PAGO ES CHEQUE
  // ════════════════════════════════════════════════════════════
  const esChequeOrigen = useMemo(() => {
    if (!medioPagoOrigenId || !mediosPago.length) return false;
    const medioPago = mediosPago.find(m => Number(m.id) === Number(medioPagoOrigenId));
    return medioPago?.nombre?.toUpperCase().includes('CHEQUE') || false;
  }, [medioPagoOrigenId, mediosPago]);

  const esChequeDestino = useMemo(() => {
    if (!medioPagoDestinoId || !mediosPago.length) return false;
    const medioPago = mediosPago.find(m => Number(m.id) === Number(medioPagoDestinoId));
    return medioPago?.nombre?.toUpperCase().includes('CHEQUE') || false;
  }, [medioPagoDestinoId, mediosPago]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      // Resetear formulario
      resetFormulario();
    }
  }, [visible, usuario]);

  // ════════════════════════════════════════════════════════════
  // EFECTO: CALCULAR MONTO DESTINO CUANDO CAMBIA MONTO ORIGEN O TC
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // Solo calcular si hay monto origen Y cuenta destino seleccionada
    if (!montoOrigen || montoOrigen <= 0 || !cuentaDestinoId) {
      setMontoDestino(0);
      return;
    }

    // Si es la misma moneda, el monto destino es igual al origen
    if (!hayDiferenciaMoneda) {
      setMontoDestino(Number(montoOrigen));
      return;
    }

    // Si hay diferencia de moneda, aplicar tipo de cambio según dirección
    if (tipoCambio > 0 && monedaOrigen && monedaDestino) {
      let montoConvertido = 0;

      if (monedaOrigen.codigoSunat === 'USD' && monedaDestino.codigoSunat === 'PEN') {
        // USD → PEN: multiplicar por TC
        montoConvertido = Number(montoOrigen) * Number(tipoCambio);
      } else if (monedaOrigen.codigoSunat === 'PEN' && monedaDestino.codigoSunat === 'USD') {
        // PEN → USD: dividir por TC
        montoConvertido = Number(montoOrigen) / Number(tipoCambio);
      } else {
        // Otras conversiones: multiplicar por TC (por defecto)
        montoConvertido = Number(montoOrigen) * Number(tipoCambio);
      }

      setMontoDestino(montoConvertido);
    }
  }, [montoOrigen, tipoCambio, hayDiferenciaMoneda, cuentaDestinoId, monedaOrigen, monedaDestino]);

  // ════════════════════════════════════════════════════════════
  // EFECTOS: CONSULTA TIPO DE CAMBIO
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const consultarTipoCambio = async () => {
      if (!fechaTransferencia || !visible) return;

      // ✅ EVITAR CONSULTAS DUPLICADAS
      const year = fechaTransferencia.getFullYear();
      const month = String(fechaTransferencia.getMonth() + 1).padStart(2, '0');
      const day = String(fechaTransferencia.getDate()).padStart(2, '0');
      const fechaISO = `${year}-${month}-${day}`;

      // Si ya consultamos esta fecha, no volver a consultar
      if (ultimaConsultaTC.current === fechaISO) {
        return;
      }

      try {
        const tipoCambioData = await consultarTipoCambioSunat({ date: fechaISO });

        if (tipoCambioData && tipoCambioData.sell_price) {
          // ✅ SIEMPRE USAR TC DE VENTA (sell_price)
          const tc = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tc);

          // ✅ Marcar como consultado
          ultimaConsultaTC.current = fechaISO;

          // ✅ Mostrar mensaje de éxito
          toast?.current?.show({
            severity: 'success',
            summary: '✅ Tipo de Cambio Actualizado',
            detail: `TC SUNAT ${fechaISO}: ${tc.toFixed(4)} (Venta)`,
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
  }, [fechaTransferencia, visible]);

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: RESETEAR FORMULARIO
  // ════════════════════════════════════════════════════════════
  const resetFormulario = () => {
    setFechaTransferencia(new Date());
    setDescripcion('');
    setNumeroOperacion('');
    setEsGerencial(false);
    setCuentaOrigenId(null);
    setMonedaOrigenSelector(null);
    setMontoOrigen(0);
    setMedioPagoOrigenId(null);
    setNumeroChequeOrigen('');
    setTipoMovimientoEgresoId(null);
    setItfOrigen(0);
    setComisionOrigen(0);
    setCuentaDestinoId(null);
    setMonedaDestinoSelector(null);
    setMontoDestino(0);
    setMedioPagoDestinoId(null);
    setNumeroChequeDestino('');
    setTipoMovimientoIngresoId(null);
    setItfDestino(0);
    setComisionDestino(0);
    // NO resetear tipoCambio - se consulta automáticamente de SUNAT
    setVoucherOrigenFile(null);
    setVoucherDestinoFile(null);
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: VALIDAR FORMULARIO CON BIFURCACIÓN PARA 3 FLUJOS
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    // ========================================
    // VALIDACIONES COMUNES A LOS 3 FLUJOS
    // ========================================
    if (!fechaTransferencia) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar la fecha de la operación',
        life: 3000
      });
      return false;
    }

    // Validar glosa obligatoria
    if (!descripcion || descripcion.trim() === '') {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar la glosa de la operación',
        life: 3000
      });
      return false;
    }

    // Validar número de operación obligatorio
    if (!numeroOperacion || numeroOperacion.trim() === '') {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar el número de operación',
        life: 3000
      });
      return false;
    }

    // ========================================
    // VALIDAR QUE EXISTA AL MENOS UNA CUENTA
    // ========================================
    if (!cuentaOrigenId && !cuentaDestinoId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar al menos una cuenta (origen o destino)',
        life: 3000
      });
      return false;
    }

    // ========================================
    // FLUJO 1: TRANSFERENCIA ENTRE CUENTAS
    // ========================================
    if (cuentaOrigenId && cuentaDestinoId) {
      // Validar que no sean la misma cuenta
      if (Number(cuentaOrigenId) === Number(cuentaDestinoId)) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'La cuenta de origen y destino no pueden ser la misma',
          life: 3000
        });
        return false;
      }

      // Validar cuenta origen
      if (!montoOrigen || montoOrigen <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'El monto de origen debe ser mayor a cero',
          life: 3000
        });
        return false;
      }

      if (!medioPagoOrigenId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el medio de pago de origen',
          life: 3000
        });
        return false;
      }

      // Validar número de cheque si el medio de pago es CHEQUE
      if (esChequeOrigen && (!numeroChequeOrigen || numeroChequeOrigen.trim() === '')) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de cheque de origen',
          life: 3000
        });
        return false;
      }

      if (!tipoMovimientoEgresoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento de egreso',
          life: 3000
        });
        return false;
      }

      // Validar cuenta destino
      if (!montoDestino || montoDestino <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'El monto de destino debe ser mayor a cero',
          life: 3000
        });
        return false;
      }

      if (!medioPagoDestinoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el medio de pago de destino',
          life: 3000
        });
        return false;
      }

      // Validar número de cheque si el medio de pago es CHEQUE
      if (esChequeDestino && (!numeroChequeDestino || numeroChequeDestino.trim() === '')) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de cheque de destino',
          life: 3000
        });
        return false;
      }

      if (!tipoMovimientoIngresoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento de ingreso',
          life: 3000
        });
        return false;
      }

      // Validar tipo de cambio si hay diferencia de moneda
      if (hayDiferenciaMoneda && (!tipoCambio || tipoCambio <= 0)) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar un tipo de cambio válido',
          life: 3000
        });
        return false;
      }

      // Validar saldo disponible
      if (cuentaOrigen && cuentaOrigen.saldo < totalDebitado) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Saldo Insuficiente',
          detail: `Saldo disponible: ${monedaOrigen?.simbolo} ${formatearNumero(cuentaOrigen.saldo)}. Requerido: ${monedaOrigen?.simbolo} ${formatearNumero(totalDebitado)}`,
          life: 5000
        });
        return false;
      }
    }
    // ========================================
    // FLUJO 2: INGRESO DIRECTO (solo destino)
    // ========================================
    else if (!cuentaOrigenId && cuentaDestinoId) {
      if (!montoDestino || montoDestino <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'El monto de ingreso debe ser mayor a cero',
          life: 3000
        });
        return false;
      }

      if (!medioPagoDestinoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el medio de pago',
          life: 3000
        });
        return false;
      }

      // Validar número de cheque si el medio de pago es CHEQUE
      if (esChequeDestino && (!numeroChequeDestino || numeroChequeDestino.trim() === '')) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de cheque',
          life: 3000
        });
        return false;
      }

      if (!tipoMovimientoIngresoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento de ingreso',
          life: 3000
        });
        return false;
      }
    }
    // ========================================
    // FLUJO 3: EGRESO DIRECTO (solo origen)
    // ========================================
    else if (cuentaOrigenId && !cuentaDestinoId) {
      if (!montoOrigen || montoOrigen <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'El monto de egreso debe ser mayor a cero',
          life: 3000
        });
        return false;
      }

      if (!medioPagoOrigenId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el medio de pago',
          life: 3000
        });
        return false;
      }

      // Validar número de cheque si el medio de pago es CHEQUE
      if (esChequeOrigen && (!numeroChequeOrigen || numeroChequeOrigen.trim() === '')) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe ingresar el número de cheque',
          life: 3000
        });
        return false;
      }

      if (!tipoMovimientoEgresoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento de egreso',
          life: 3000
        });
        return false;
      }

      // Validar saldo disponible
      if (cuentaOrigen && cuentaOrigen.saldo < totalDebitado) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Saldo Insuficiente',
          detail: `Saldo disponible: ${monedaOrigen?.simbolo} ${formatearNumero(cuentaOrigen.saldo)}. Requerido: ${monedaOrigen?.simbolo} ${formatearNumero(totalDebitado)}`,
          life: 5000
        });
        return false;
      }
    }

    return true;
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: PROCESAR TRANSFERENCIA
  // ════════════════════════════════════════════════════════════
  const handleProcesarTransferencia = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // ========================================
      // VALIDAR CUENTAS SEGÚN FLUJO
      // ========================================
      // FLUJO 1: Transferencia (ambas cuentas)
      if (cuentaOrigenId && cuentaDestinoId) {
        if (!cuentaOrigen || !cuentaDestino) {
          toast?.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos de las cuentas. Por favor, intente nuevamente.',
            life: 3000
          });
          setLoading(false);
          return;
        }
      }
      // FLUJO 2: Ingreso directo (solo destino)
      else if (!cuentaOrigenId && cuentaDestinoId) {
        if (!cuentaDestino) {
          toast?.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos de la cuenta de destino. Por favor, intente nuevamente.',
            life: 3000
          });
          setLoading(false);
          return;
        }
      }
      // FLUJO 3: Egreso directo (solo origen)
      else if (cuentaOrigenId && !cuentaDestinoId) {
        if (!cuentaOrigen) {
          toast?.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos de la cuenta de origen. Por favor, intente nuevamente.',
            life: 3000
          });
          setLoading(false);
          return;
        }
      }

      // ========================================
      // PREPARAR DATOS SEGÚN FLUJO (BIFURCACIONES INDEPENDIENTES)
      // ========================================
      // La descripción/glosa ya fue validada como obligatoria
      let datos = {};

      // ========================================
      // FLUJO 1: TRANSFERENCIA ENTRE CUENTAS
      // ========================================
      if (cuentaOrigenId && cuentaDestinoId) {
        datos = {
          fechaTransferencia: fechaTransferencia.toISOString(),
          monto: Number(montoOrigen),
          descripcion: descripcion,
          numeroOperacion: numeroOperacion,

          // Cuenta origen
          cuentaOrigenId: Number(cuentaOrigenId),
          medioPagoOrigenId: Number(medioPagoOrigenId),
          numeroChequeOrigen: numeroChequeOrigen || null,
          tipoMovimientoEgresoId: Number(tipoMovimientoEgresoId),
          itfOrigen: Number(itfOrigen || 0),
          comisionOrigen: Number(comisionOrigen || 0),

          // Cuenta destino
          cuentaDestinoId: Number(cuentaDestinoId),
          medioPagoDestinoId: Number(medioPagoDestinoId),
          numeroChequeDestino: numeroChequeDestino || null,
          tipoMovimientoIngresoId: Number(tipoMovimientoIngresoId),
          itfDestino: Number(itfDestino || 0),
          comisionDestino: Number(comisionDestino || 0),

          // Tipo de cambio y monto destino
          tipoCambio: Number(tipoCambio) || 1,
          montoDestino: Number(montoDestino),

          // Operación gerencial
          esGerencial: Boolean(esGerencial),

          // Usuario
          usuarioId: Number(usuario.id)
        };
      }
      // ========================================
      // FLUJO 2: INGRESO DIRECTO (solo destino)
      // ========================================
      else if (!cuentaOrigenId && cuentaDestinoId) {
        datos = {
          fechaTransferencia: fechaTransferencia.toISOString(),
          monto: Number(montoDestino),
          descripcion: descripcion,
          numeroOperacion: numeroOperacion,

          // Sin cuenta origen
          cuentaOrigenId: null,
          medioPagoOrigenId: null,
          numeroChequeOrigen: null,
          tipoMovimientoEgresoId: null,
          itfOrigen: 0,
          comisionOrigen: 0,

          // Cuenta destino
          cuentaDestinoId: Number(cuentaDestinoId),
          medioPagoDestinoId: Number(medioPagoDestinoId),
          numeroChequeDestino: numeroChequeDestino || null,
          tipoMovimientoIngresoId: Number(tipoMovimientoIngresoId),
          itfDestino: Number(itfDestino || 0),
          comisionDestino: Number(comisionDestino || 0),

          // Tipo de cambio
          tipoCambio: Number(tipoCambio) || 1,
          montoDestino: Number(montoDestino),

          // Operación gerencial
          esGerencial: Boolean(esGerencial),

          // Usuario
          usuarioId: Number(usuario.id)
        };
      }
      // ========================================
      // FLUJO 3: EGRESO DIRECTO (solo origen)
      // ========================================
      else if (cuentaOrigenId && !cuentaDestinoId) {
        datos = {
          fechaTransferencia: fechaTransferencia.toISOString(),
          monto: Number(montoOrigen),
          descripcion: descripcion,
          numeroOperacion: numeroOperacion,

          // Cuenta origen
          cuentaOrigenId: Number(cuentaOrigenId),
          medioPagoOrigenId: Number(medioPagoOrigenId),
          numeroChequeOrigen: numeroChequeOrigen || null,
          tipoMovimientoEgresoId: Number(tipoMovimientoEgresoId),
          itfOrigen: Number(itfOrigen || 0),
          comisionOrigen: Number(comisionOrigen || 0),

          // Sin cuenta destino
          cuentaDestinoId: null,
          medioPagoDestinoId: null,
          numeroChequeDestino: null,
          tipoMovimientoIngresoId: null,
          itfDestino: 0,
          comisionDestino: 0,

          // Tipo de cambio
          tipoCambio: Number(tipoCambio) || 1,
          montoDestino: 0,

          // Operación gerencial
          esGerencial: Boolean(esGerencial),

          // Usuario
          usuarioId: Number(usuario.id)
        };
      }

      console.log('📤 Enviando datos al backend:', datos);

      // 2. Procesar transferencia en backend
      const resultado = await procesarTransferenciaInterna(datos);

      if (!resultado.success) {
        throw new Error(resultado.message || 'Error al procesar la transferencia');
      }

      toast?.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: resultado.message,
        life: 3000
      });

      // 3. Generar vouchers PDF (en paralelo)
      await generarVouchers(resultado.data);

      // 4. Subir vouchers bancarios si existen
      if (voucherOrigenFile) {
        await subirVoucherBancario(voucherOrigenFile, resultado.data.movimientoEgresoId);
      }
      if (voucherDestinoFile) {
        await subirVoucherBancario(voucherDestinoFile, resultado.data.movimientoIngresoId);
      }

      // 5. Mostrar confirmación
      setResultadoTransferencia(resultado.data);
      setShowConfirmacion(true);

      // 6. Notificar éxito y refrescar
      onSuccess?.();

    } catch (error) {
      console.error('Error al procesar transferencia:', error);
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al procesar la transferencia',
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: GENERAR VOUCHERS PDF
  // ════════════════════════════════════════════════════════════
  const generarVouchers = async (resultado) => {
    try {
      // ✅ USAR MOVIMIENTOS COMPLETOS DEL BACKEND (con todas las relaciones)
      const movimientos = resultado.movimientos;

      // ═══════════════════════════════════════════════════════════
      // GENERAR VOUCHERS INDIVIDUALES
      // ═══════════════════════════════════════════════════════════
      // Cada movimiento usa la empresa de su cuenta asociada

      // 1. Voucher individual EGRESO
      if (movimientos.egreso) {
        try {
          const empresaEgreso = empresas.find(e => Number(e.id) === Number(movimientos.egreso.empresaId));
          const voucherEgreso = await generarYSubirVoucherIndividual(
            movimientos.egreso,
            null,
            empresaEgreso,
            null,
            usuario
          );
          if (voucherEgreso.success && voucherEgreso.urlPdf && voucherEgreso.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.egreso.id, voucherEgreso.urlPdf);
            resultado.movimientos.egreso.urlOperacionIndividualOperacionCaja = voucherEgreso.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher EGRESO:', error);
        }
      }

      // 2. Voucher individual ITF ORIGEN
      if (movimientos.itfOrigen) {
        try {
          const empresaITFOrigen = empresas.find(e => Number(e.id) === Number(movimientos.itfOrigen.empresaId));
          const voucherITFOrigen = await generarYSubirVoucherIndividual(
            movimientos.itfOrigen,
            null,
            empresaITFOrigen,
            null,
            usuario
          );
          if (voucherITFOrigen.success && voucherITFOrigen.urlPdf && voucherITFOrigen.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.itfOrigen.id, voucherITFOrigen.urlPdf);
            resultado.movimientos.itfOrigen.urlOperacionIndividualOperacionCaja = voucherITFOrigen.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher ITF ORIGEN:', error);
        }
      }

      // 3. Voucher individual COMISIÓN ORIGEN
      if (movimientos.comisionOrigen) {
        try {
          const empresaComisionOrigen = empresas.find(e => Number(e.id) === Number(movimientos.comisionOrigen.empresaId));
          const voucherComisionOrigen = await generarYSubirVoucherIndividual(
            movimientos.comisionOrigen,
            null,
            empresaComisionOrigen,
            null,
            usuario
          );
          if (voucherComisionOrigen.success && voucherComisionOrigen.urlPdf && voucherComisionOrigen.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.comisionOrigen.id, voucherComisionOrigen.urlPdf);
            resultado.movimientos.comisionOrigen.urlOperacionIndividualOperacionCaja = voucherComisionOrigen.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher COMISIÓN ORIGEN:', error);
        }
      }

      // 4. Voucher individual INGRESO
      if (movimientos.ingreso) {
        try {
          const empresaIngreso = empresas.find(e => Number(e.id) === Number(movimientos.ingreso.empresaId));
          const voucherIngreso = await generarYSubirVoucherIndividual(
            movimientos.ingreso,
            null,
            empresaIngreso,
            null,
            usuario
          );
          if (voucherIngreso.success && voucherIngreso.urlPdf && voucherIngreso.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.ingreso.id, voucherIngreso.urlPdf);
            resultado.movimientos.ingreso.urlOperacionIndividualOperacionCaja = voucherIngreso.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher INGRESO:', error);
        }
      }

      // 5. Voucher individual ITF DESTINO
      if (movimientos.itfDestino) {
        try {
          const empresaITFDestino = empresas.find(e => Number(e.id) === Number(movimientos.itfDestino.empresaId));
          const voucherITFDestino = await generarYSubirVoucherIndividual(
            movimientos.itfDestino,
            null,
            empresaITFDestino,
            null,
            usuario
          );
          if (voucherITFDestino.success && voucherITFDestino.urlPdf && voucherITFDestino.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.itfDestino.id, voucherITFDestino.urlPdf);
            resultado.movimientos.itfDestino.urlOperacionIndividualOperacionCaja = voucherITFDestino.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher ITF DESTINO:', error);
        }
      }

      // 6. Voucher individual COMISIÓN DESTINO
      if (movimientos.comisionDestino) {
        try {
          const empresaComisionDestino = empresas.find(e => Number(e.id) === Number(movimientos.comisionDestino.empresaId));
          const voucherComisionDestino = await generarYSubirVoucherIndividual(
            movimientos.comisionDestino,
            null,
            empresaComisionDestino,
            null,
            usuario
          );
          if (voucherComisionDestino.success && voucherComisionDestino.urlPdf && voucherComisionDestino.urlPdf.trim() !== '') {
            await actualizarUrlVoucherIndividual(movimientos.comisionDestino.id, voucherComisionDestino.urlPdf);
            resultado.movimientos.comisionDestino.urlOperacionIndividualOperacionCaja = voucherComisionDestino.urlPdf;
          }
        } catch (error) {
          console.error('❌ Error voucher COMISIÓN DESTINO:', error);
        }
      }

      // ═══════════════════════════════════════════════════════════
      // GENERAR VOUCHERS CONTABLES (ASIENTOS)
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
            `${import.meta.env.VITE_API_URL}/tesoreria/transferencias/movimiento/${movimientoId}/voucher-contable`,
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
        movimientos.ingreso
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
              null, // No hay cuentaPorPagar en transferencias
              usuario
            );

            if (voucherContable.success && voucherContable.urlPdf) {
              await actualizarUrlVoucherContable(movimiento.id, voucherContable.urlPdf);
              console.log(`✅ Voucher contable generado para movimiento ${movimiento.id}`);
            } else {
              console.error(`❌ Error generando voucher contable: ${voucherContable.error}`);
            }
          } else {
            console.warn(`⚠️ No se encontró asiento contable para movimiento ${movimiento.id}`);
          }
        } catch (error) {
          console.error(`❌ Error al generar voucher contable para movimiento ${movimiento.id}:`, error);
        }
      }

      console.log('✅ Vouchers generados exitosamente');

    } catch (error) {
      console.error('❌ Error al generar vouchers:', error);
      // No lanzar error para no interrumpir el flujo
      toast?.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La transferencia se procesó pero hubo un error al generar algunos vouchers',
        life: 5000
      });
    }
  };



  // ════════════════════════════════════════════════════════════
  // RENDER: HEADER DEL DIÁLOGO
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="pi pi-arrow-right-arrow-left" style={{ fontSize: '1.5rem' }}></i>
        <span style={{ fontSize: getResponsiveFontSize() }}>Transferencia Interna</span>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: FOOTER DEL DIÁLOGO
  // ════════════════════════════════════════════════════════════
  const renderFooter = () => {
    return (
      <div>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={() => {
            onHide();
            resetFormulario();
          }}
          className="p-button-text"
          disabled={loading}
        />
        <Button
          label="Procesar Transferencia"
          icon="pi pi-check"
          onClick={handleProcesarTransferencia}
          loading={loading}
          disabled={loading}
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
        onHide={() => {
          if (!loading) {
            onHide();
            resetFormulario();
          }
        }}
        header={renderHeader()}
        footer={renderFooter()}
        style={{ width: '95vw', maxWidth: '1400px' }}
        maximizable
        modal
        blockScroll
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* DATOS GENERALES */}
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="fecha" className="font-bold">Fecha de Transferencia *</label>
                <Calendar
                  id="fecha"
                  value={fechaTransferencia}
                  onChange={(e) => setFechaTransferencia(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación *</label>
                <InputText
                  id="numeroOperacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="Ingrese número de operación"
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="descripcion" className="font-bold">Glosa *</label>
                <InputText
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese glosa de la operación"
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              {/* Toggle Tipo de Operación */}
              <div style={{ flex: 1 }}>
                <label className="font-bold block mb-2">Operación</label>
                <BooleanToggleButton
                  value={esGerencial}
                  onChange={setEsGerencial}
                  labelTrue="GERENCIAL"
                  labelFalse="FISCAL"
                  severityTrue="help"
                  severityFalse="success"
                  icon={esGerencial ? "pi-eye-slash" : "pi-eye"}
                  disabled={loading}
                />
              </div>
            </div>

          {/* CUENTA ORIGEN - Opcional para ingreso directo */}
          <Panel
            header={
              <div className="flex align-items-center gap-2">
                <span>📤 Cuenta de Origen (EGRESO)</span>
                {!cuentaOrigenId && cuentaDestinoId && (
                  <Tag value="Opcional - Ingreso Directo" severity="info" />
                )}
              </div>
            }
            toggleable
            collapsed
          >
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 5,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="cuentaOrigen" className="font-bold">Cuenta Corriente *</label>
                <CuentaCorrienteSelector
                  value={cuentaOrigenId}
                  onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                    setCuentaOrigenId(cuentaCorrienteId);
                    setMonedaOrigenSelector(moneda); // Guardar moneda del selector
                  }}
                  label=""
                  placeholder="Seleccione cuenta de origen"
                  mostrarSaldo={true}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="medioPagoOrigen" className="font-bold">Medio de Pago *</label>
                <Dropdown
                  id="medioPagoOrigen"
                  value={medioPagoOrigenId}
                  options={mediosPago}
                  onChange={(e) => {
                    setMedioPagoOrigenId(e.value);
                    // 🔄 Sincronizar medio de pago destino si hay cuenta destino seleccionada
                    if (cuentaDestinoId) {
                      setMedioPagoDestinoId(e.value);
                    }
                  }}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione medio de pago"
                  disabled={loading}
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              {esChequeOrigen && (
                <div style={{ flex: 2 }}>
                  <label htmlFor="numeroChequeOrigen" className="font-bold">Nº Cheque *</label>
                  <InputText
                    id="numeroChequeOrigen"
                    value={numeroChequeOrigen}
                    onChange={(e) => setNumeroChequeOrigen(e.target.value)}
                    placeholder="Ingrese número de cheque"
                    disabled={loading}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
              <div style={{ flex: 2 }}>
                <TipoMovimientoSelector
                  tiposMovimiento={tiposMovimiento}
                  value={tipoMovimientoEgresoId}
                  onChange={(value) => {
                    setTipoMovimientoEgresoId(value);
                    
                    // Buscar contraparte en DESTINO si hay cuenta destino seleccionada
                    if (cuentaDestinoId && value) {
                      const tipoOrigen = tiposMovimiento.find(t => Number(t.id) === Number(value));
                      
                      if (tipoOrigen) {
                        // Buscar contrapartes con 2 criterios: esIngreso opuesto y mismo nombre
                        const contrapartes = tiposMovimiento.filter(t => 
                          t.esIngreso === !tipoOrigen.esIngreso &&
                          t.nombre === tipoOrigen.nombre
                        );

                        
                        if (contrapartes.length === 1) {
                          // Una sola coincidencia: asignar automáticamente
                          setTipoMovimientoIngresoId(contrapartes[0].id);
                        }
                      }
                    }
                  }}
                  esIngreso={false}
                  required={true}
                  placeholder="Buscar tipo de movimiento egreso..."
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="montoOrigen" className="font-bold">
                  Monto ({monedaOrigen?.simbolo || ''}) *
                </label>
                <InputNumber
                  id="montoOrigen"
                  value={montoOrigen}
                  onValueChange={(e) => setMontoOrigen(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading || !cuentaOrigenId}
                  placeholder={`Ingrese monto en ${monedaOrigen?.codigo || 'moneda de origen'}`}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="itfOrigen" className="font-bold">ITF</label>
                <InputNumber
                  id="itfOrigen"
                  value={itfOrigen}
                  onValueChange={(e) => setItfOrigen(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="comisionOrigen" className="font-bold">Comisión</label>
                <InputNumber
                  id="comisionOrigen"
                  value={comisionOrigen}
                  onValueChange={(e) => setComisionOrigen(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-bold">Total a Debitar:</span>
                  <Tag severity="danger" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                    {monedaOrigen?.simbolo} {formatearNumero(totalDebitado)}
                  </Tag>
                </div>
              </div>
            </div>

          </Panel>
          {/* TIPO DE CAMBIO */}
            <div
              style={{
                alignItems: "start",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="tipoCambio" className="font-bold">
                  Tipo de Cambio {hayDiferenciaMoneda ? '*' : '(Referencial)'}
                </label>
                <InputNumber
                  id="tipoCambio"
                  value={tipoCambio}
                  onValueChange={(e) => setTipoCambio(e.value)}
                  mode="decimal"
                  minFractionDigits={4}
                  maxFractionDigits={4}
                  disabled={loading}
                  style={{ width: "100%" }}
                  placeholder="Tipo de cambio SUNAT"
                />
                <small className="p-text-secondary">
                  {hayDiferenciaMoneda
                    ? 'Se aplicará para la conversión de moneda'
                    : 'Tipo de cambio del día (no se aplicará si las monedas son iguales)'}
                </small>
              </div>
              {hayDiferenciaMoneda && (
                <div style={{ flex: 1 }}>
                  <label className="font-bold">Conversión Automática</label>
                  <Tag severity="info" style={{ fontSize: '1rem', padding: '0.75rem 1rem', width: '100%', display: 'block' }}>
                    {monedaOrigen?.simbolo} {formatearNumero(montoOrigen)} × {tipoCambio} = {monedaDestino?.simbolo} {formatearNumero(montoDestino)}
                  </Tag>
                </div>
              )}
            </div>

          {/* CUENTA DESTINO - Opcional para egreso directo */}
          <Panel
            header={
              <div className="flex align-items-center gap-2">
                <span>📥 Cuenta de Destino (INGRESO)</span>
                {cuentaOrigenId && !cuentaDestinoId && (
                  <Tag value="Opcional - Egreso Directo" severity="warning" />
                )}
              </div>
            }
            toggleable
            collapsed
          >
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 5,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="cuentaDestino" className="font-bold">Cuenta Corriente *</label>
                <CuentaCorrienteSelector
                  value={cuentaDestinoId}
                  onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                    setCuentaDestinoId(cuentaCorrienteId);
                    setMonedaDestinoSelector(moneda); // Guardar moneda del selector
                    
                    // 🔄 Sincronizar medio de pago destino si ya hay medio de pago origen seleccionado
                    if (medioPagoOrigenId) {
                      setMedioPagoDestinoId(medioPagoOrigenId);
                    }
                    
                    // Sincronizar tipo de movimiento destino si ya hay tipo origen seleccionado
                    if (tipoMovimientoEgresoId) {
                      const tipoOrigen = tiposMovimiento.find(t => Number(t.id) === Number(tipoMovimientoEgresoId));
                      
                      if (tipoOrigen) {
                        // Buscar contrapartes con 2 criterios: esIngreso opuesto y mismo nombre
                        const contrapartes = tiposMovimiento.filter(t => 
                          t.esIngreso === !tipoOrigen.esIngreso &&
                          t.nombre === tipoOrigen.nombre
                        );
                        
                        if (contrapartes.length === 1) {
                          // Una sola coincidencia: asignar automáticamente
                          setTipoMovimientoIngresoId(contrapartes[0].id);
                        }
                      }
                    }
                  }}
                  label=""
                  placeholder="Seleccione cuenta de destino"
                  mostrarSaldo={true}
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 2 }}>
                <label htmlFor="medioPagoDestino" className="font-bold">Medio de Pago *</label>
                <Dropdown
                  id="medioPagoDestino"
                  value={medioPagoDestinoId}
                  options={mediosPago}
                  onChange={(e) => setMedioPagoDestinoId(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione medio de pago"
                  disabled={loading}
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              {esChequeDestino && (
                <div style={{ flex: 2 }}>
                  <label htmlFor="numeroChequeDestino" className="font-bold">Nº Cheque *</label>
                  <InputText
                    id="numeroChequeDestino"
                    value={numeroChequeDestino}
                    onChange={(e) => setNumeroChequeDestino(e.target.value)}
                    placeholder="Ingrese número de cheque"
                    disabled={loading}
                    style={{ width: "100%" }}
                  />
                </div>
              )}

              <div style={{ flex: 2 }}>
                <TipoMovimientoSelector
                  tiposMovimiento={tiposMovimiento}
                  value={tipoMovimientoIngresoId}
                  onChange={(value) => setTipoMovimientoIngresoId(value)}
                  esIngreso={true}
                  required={true}
                  placeholder="Buscar tipo de movimiento ingreso..."
                />
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="montoDestino" className="font-bold">
                  Monto a Recibir ({monedaDestino?.simbolo || ''}) *
                </label>
                <InputNumber
                  id="montoDestino"
                  value={montoDestino}
                  onValueChange={(e) => setMontoDestino(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading || !cuentaDestinoId || (hayDiferenciaMoneda && montoOrigen > 0)}
                  style={{ width: "100%" }}
                  placeholder={`${hayDiferenciaMoneda ? 'Calculado automáticamente' : 'Ingrese monto en ' + (monedaDestino?.codigo || 'moneda de destino')}`}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="itfDestino" className="font-bold">ITF</label>
                <InputNumber
                  id="itfDestino"
                  value={itfDestino}
                  onValueChange={(e) => setItfDestino(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="comisionDestino" className="font-bold">Comisión</label>
                <InputNumber
                  id="comisionDestino"
                  value={comisionDestino}
                  onValueChange={(e) => setComisionDestino(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-bold">Total a Acreditar:</span>
                  <Tag severity="success" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                    {monedaDestino?.simbolo} {formatearNumero(totalAcreditado)}
                  </Tag>
                </div>
              </div>

            </div>
          </Panel>

        </div>
      </Dialog>

      {/* Dialog de Confirmación */}
      <ConfirmacionTransferenciaDialog
        visible={showConfirmacion}
        onHide={() => {
          setShowConfirmacion(false);
          setResultadoTransferencia(null);
          onHide();
          resetFormulario();
        }}
        resultadoTransferencia={resultadoTransferencia}
        monedas={monedas}
        toast={toast}
      />
    </>
  );
}
