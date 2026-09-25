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
 * Diálogo especializado para procesar transferencias entre cuentas propias:
 * - Generación de correlativo
 * - 2 MovimientoCaja (Egreso origen + Ingreso destino)
 * - Manejo de tipo de cambio
 * - ITF y comisiones en ambas cuentas
 * - Generación de vouchers PDF
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
  const [empresaId, setEmpresaId] = useState(null);
  const [fechaTransferencia, setFechaTransferencia] = useState(new Date());
  const [descripcion, setDescripcion] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');

  // Estados para confirmación
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [resultadoTransferencia, setResultadoTransferencia] = useState(null);

  // ════════════════════════════════════════════════════════════
  // ESTADOS CUENTA ORIGEN
  // ════════════════════════════════════════════════════════════
  const [cuentaOrigenId, setCuentaOrigenId] = useState(null);
  const [montoOrigen, setMontoOrigen] = useState(0); // ✅ Monto en moneda de origen
  const [medioPagoOrigenId, setMedioPagoOrigenId] = useState(null);
  const [tipoMovimientoEgresoId, setTipoMovimientoEgresoId] = useState(null);
  const [itfOrigen, setItfOrigen] = useState(0);
  const [comisionOrigen, setComisionOrigen] = useState(0);

  // ════════════════════════════════════════════════════════════
  // ESTADOS CUENTA DESTINO
  // ════════════════════════════════════════════════════════════
  const [cuentaDestinoId, setCuentaDestinoId] = useState(null);
  const [montoDestino, setMontoDestino] = useState(0); // ✅ Monto en moneda de destino
  const [medioPagoDestinoId, setMedioPagoDestinoId] = useState(null);
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
    return cuentasCorrientes.find(c => Number(c.id) === Number(cuentaOrigenId));
  }, [cuentaOrigenId, cuentasCorrientes]);

  const cuentaDestino = useMemo(() => {
    if (!cuentaDestinoId) return null;
    // Comparar convirtiendo ambos a número para evitar problemas de tipo
    return cuentasCorrientes.find(c => Number(c.id) === Number(cuentaDestinoId));
  }, [cuentaDestinoId, cuentasCorrientes]);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: DETECTAR SI HAY CAMBIO DE MONEDA
  // ════════════════════════════════════════════════════════════
  const hayDiferenciaMoneda = useMemo(() => {
    if (!cuentaOrigen || !cuentaDestino) return false;
    return Number(cuentaOrigen.monedaId) !== Number(cuentaDestino.monedaId);
  }, [cuentaOrigen, cuentaDestino]);

  // ════════════════════════════════════════════════════════════
  // COMPUTED: MONEDAS DE ORIGEN Y DESTINO
  // ════════════════════════════════════════════════════════════
  const monedaOrigen = useMemo(() => {
    if (!cuentaOrigen || !cuentaOrigen.moneda) return null;
    return cuentaOrigen.moneda;
  }, [cuentaOrigen]);

  const monedaDestino = useMemo(() => {
    if (!cuentaDestino || !cuentaDestino.moneda) return null;
    return cuentaDestino.moneda;
  }, [cuentaDestino]);

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
  // EFECTOS: INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      // Inicializar empresa del usuario
      if (usuario?.empresaId) {
        setEmpresaId(usuario.empresaId);
      }

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
    setCuentaOrigenId(null);
    setMontoOrigen(0);
    setMedioPagoOrigenId(null);
    setTipoMovimientoEgresoId(null);
    setItfOrigen(0);
    setComisionOrigen(0);
    setCuentaDestinoId(null);
    setMontoDestino(0);
    setMedioPagoDestinoId(null);
    setTipoMovimientoIngresoId(null);
    setItfDestino(0);
    setComisionDestino(0);
    // NO resetear tipoCambio - se consulta automáticamente de SUNAT
    setVoucherOrigenFile(null);
    setVoucherDestinoFile(null);
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: VALIDAR FORMULARIO
  // ════════════════════════════════════════════════════════════
  const validarFormulario = () => {
    if (!empresaId) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una empresa',
        life: 3000
      });
      return false;
    }

    if (!fechaTransferencia) {
      toast?.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe ingresar la fecha de transferencia',
        life: 3000
      });
      return false;
    }
    if (cuentaOrigenId) {
      if (!montoOrigen || montoOrigen <= 0) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'El monto de origen debe ser mayor a cero',
          life: 3000
        });
        return false;
      }
      if (Number(cuentaOrigenId) === Number(cuentaDestinoId)) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'La cuenta de origen y destino no pueden ser la misma',
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
      if (!tipoMovimientoEgresoId) {
        toast?.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar el tipo de movimiento de egreso',
          life: 3000
        });
        return false;
      }

    }

    if (cuentaDestinoId) {
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

    /*
        if (!cuentaOrigenId) {
          toast?.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe seleccionar la cuenta de origen',
            life: 3000
          });
          return false;
        }
    
        if (!cuentaDestinoId) {
          toast?.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe seleccionar la cuenta de destino',
            life: 3000
          });
          return false;
        }
    */






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

    return true;
  };

  // ════════════════════════════════════════════════════════════
  // FUNCIÓN: PROCESAR TRANSFERENCIA
  // ════════════════════════════════════════════════════════════
  const handleProcesarTransferencia = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // Validar que tengamos las cuentas cargadas
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

      // 1. Preparar datos siguiendo el patrón de pagos especializados
      const datos = {
        empresaId: Number(empresaId),
        fechaTransferencia: fechaTransferencia.toISOString(),
        monto: Number(montoOrigen),
        descripcion: descripcion || `Transferencia de ${cuentaOrigen.banco?.nombre} a ${cuentaDestino.banco?.nombre}`,
        numeroOperacion: numeroOperacion || null,

        // Cuenta origen
        cuentaOrigenId: Number(cuentaOrigenId),
        medioPagoOrigenId: Number(medioPagoOrigenId),
        tipoMovimientoEgresoId: Number(tipoMovimientoEgresoId),
        itfOrigen: Number(itfOrigen || 0),
        comisionOrigen: Number(comisionOrigen || 0),

        // Cuenta destino
        cuentaDestinoId: Number(cuentaDestinoId),
        medioPagoDestinoId: Number(medioPagoDestinoId),
        tipoMovimientoIngresoId: Number(tipoMovimientoIngresoId),
        itfDestino: Number(itfDestino || 0),
        comisionDestino: Number(comisionDestino || 0),

        // Tipo de cambio y monto destino
        tipoCambio: hayDiferenciaMoneda ? Number(tipoCambio) : 1,
        montoDestino: Number(montoDestino),

        // Usuario
        usuarioId: Number(usuario.id)
      };

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
      const empresaData = empresas.find(e => Number(e.id) === Number(empresaId));

      // ✅ USAR MOVIMIENTOS COMPLETOS DEL BACKEND (con todas las relaciones)
      const movimientos = resultado.movimientos;

      // ═══════════════════════════════════════════════════════════
      // GENERAR VOUCHERS INDIVIDUALES (Siguiendo el patrón)
      // ═══════════════════════════════════════════════════════════

      // 1. Voucher individual EGRESO
      if (movimientos.egreso) {
        try {
          const voucherEgreso = await generarYSubirVoucherIndividual(
            movimientos.egreso,
            null,
            empresaData,
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
          const voucherITFOrigen = await generarYSubirVoucherIndividual(
            movimientos.itfOrigen,
            null,
            empresaData,
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
          const voucherComisionOrigen = await generarYSubirVoucherIndividual(
            movimientos.comisionOrigen,
            null,
            empresaData,
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
          const voucherIngreso = await generarYSubirVoucherIndividual(
            movimientos.ingreso,
            null,
            empresaData,
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
          const voucherITFDestino = await generarYSubirVoucherIndividual(
            movimientos.itfDestino,
            null,
            empresaData,
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
          const voucherComisionDestino = await generarYSubirVoucherIndividual(
            movimientos.comisionDestino,
            null,
            empresaData,
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
          <Panel header="📋 Datos Generales" toggleable>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="empresa" className="font-bold">Empresa *</label>
                <Dropdown
                  id="empresa"
                  value={empresaId}
                  options={empresas}
                  onChange={(e) => setEmpresaId(e.value)}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione empresa"
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
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
                <label htmlFor="numeroOperacion" className="font-bold">Nº Operación</label>
                <InputText
                  id="numeroOperacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label htmlFor="descripcion" className="font-bold">Descripción</label>
                <InputText
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </Panel>

          {/* CUENTA ORIGEN */}
          <Panel header="📤 Cuenta de Origen" toggleable>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 5,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 3 }}>
                <label htmlFor="cuentaOrigen" className="font-bold">Cuenta Corriente *</label>
                <CuentaCorrienteSelector
                  empresaIdPreseleccionada={empresaId}
                  value={cuentaOrigenId}
                  onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                    setCuentaOrigenId(cuentaCorrienteId);
                  }}
                  label=""
                  placeholder="Seleccione cuenta de origen"
                />
              </div>
              {cuentaOrigen && monedaOrigen && (
                <div style={{ flex: 2 }}>
                  <Tag severity="info" style={{ fontSize: '1rem', width: "100%", padding: '1.0rem 1rem' }}>
                    Saldo Disponible: {monedaOrigen.simbolo} {formatearNumero(cuentaOrigen.saldoActual || 0)}
                  </Tag>
                </div>
              )}
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
                  onChange={(e) => setMedioPagoOrigenId(e.value)}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione medio de pago"
                  disabled={loading}
                  filter
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <TipoMovimientoSelector
                  tiposMovimiento={tiposMovimiento}
                  value={tipoMovimientoEgresoId}
                  onChange={(value) => setTipoMovimientoEgresoId(value)}
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
          <Panel header="💱 Tipo de Cambio" toggleable>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
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
                  className="w-full"
                  placeholder="Tipo de cambio SUNAT"
                />
                <small className="p-text-secondary">
                  {hayDiferenciaMoneda
                    ? 'Se aplicará para la conversión de moneda'
                    : 'Tipo de cambio del día (no se aplicará si las monedas son iguales)'}
                </small>
              </div>
              {hayDiferenciaMoneda && (
                <>
                  <div>
                    <label className="font-bold">Conversión Automática</label>
                    <Tag severity="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem', width: '100%', display: 'block', marginTop: '0.5rem' }}>
                      {monedaOrigen?.simbolo} {formatearNumero(montoOrigen)} × {tipoCambio} = {monedaDestino?.simbolo} {formatearNumero(montoDestino)}
                    </Tag>
                  </div>
                </>
              )}
            </div>
          </Panel>

          {/* CUENTA DESTINO */}
          <Panel header="📥 Cuenta de Destino" toggleable>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                gap: 5,
                marginBottom: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 3 }}>
                <label htmlFor="cuentaDestino" className="font-bold">Cuenta Corriente *</label>
                <CuentaCorrienteSelector
                  empresaIdPreseleccionada={empresaId}
                  value={cuentaDestinoId}
                  onChange={({ cuentaCorrienteId, bancoId, moneda }) => {
                    setCuentaDestinoId(cuentaCorrienteId);
                  }}
                  label=""
                  placeholder="Seleccione cuenta de destino"
                />
              </div>
              {cuentaDestino && monedaDestino && (
                <div style={{ flex: 2 }}>
                  <Tag severity="info" style={{ fontSize: '1rem', width: "100%", padding: '1.0rem 1rem' }}>
                    Saldo Actual: {monedaDestino.simbolo} {formatearNumero(cuentaDestino.saldoActual || 0)}
                  </Tag>
                </div>
              )}
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

              <div style={{ flex: 2 }}>
                <TipoMovimientoSelector
                  tiposMovimiento={tiposMovimiento}
                  value={tipoMovimientoIngresoId}
                  onChange={(value) => setTipoMovimientoIngresoId(value)}
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

          {/* RESUMEN */}
          <Panel header="📊 Resumen de la Transferencia" toggleable collapsed>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Cuenta Origen */}
                <div style={{ border: '1px solid #dee2e6', borderRadius: '6px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>📤 Cuenta Origen</h4>
                  {cuentaOrigen && monedaOrigen && (
                    <>
                      <p><strong>Banco:</strong> {cuentaOrigen.banco?.nombre}</p>
                      <p><strong>Cuenta:</strong> {cuentaOrigen.numeroCuenta}</p>
                      <p><strong>Saldo Actual:</strong> {monedaOrigen.simbolo} {formatearNumero(cuentaOrigen.saldoActual || 0)}</p>
                      <Divider />
                      <p><strong>Monto:</strong> {monedaOrigen.simbolo} {formatearNumero(montoOrigen)}</p>
                      <p><strong>ITF:</strong> {monedaOrigen.simbolo} {formatearNumero(itfOrigen)}</p>
                      <p><strong>Comisión:</strong> {monedaOrigen.simbolo} {formatearNumero(comisionOrigen)}</p>
                      <Divider />
                      <p style={{ fontSize: '1.1rem' }}><strong>Total Debitado:</strong> <span style={{ color: '#dc3545' }}>{monedaOrigen.simbolo} {formatearNumero(totalDebitado)}</span></p>
                      <p style={{ fontSize: '1.1rem' }}><strong>Nuevo Saldo:</strong> <span style={{ color: '#28a745' }}>{monedaOrigen.simbolo} {formatearNumero(Number(cuentaOrigen.saldoActual || 0) - Number(totalDebitado))}</span></p>
                    </>
                  )}
                </div>

                {/* Cuenta Destino */}
                <div style={{ border: '1px solid #dee2e6', borderRadius: '6px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>📥 Cuenta Destino</h4>
                  {cuentaDestino && monedaDestino && (
                    <>
                      <p><strong>Banco:</strong> {cuentaDestino.banco?.nombre}</p>
                      <p><strong>Cuenta:</strong> {cuentaDestino.numeroCuenta}</p>
                      <p><strong>Saldo Actual:</strong> {monedaDestino.simbolo} {formatearNumero(cuentaDestino.saldoActual || 0)}</p>
                      <Divider />
                      <p><strong>Monto Recibido:</strong> {monedaDestino.simbolo} {formatearNumero(montoDestino)}</p>
                      <p><strong>ITF:</strong> {monedaDestino.simbolo} {formatearNumero(itfDestino)}</p>
                      <p><strong>Comisión:</strong> {monedaDestino.simbolo} {formatearNumero(comisionDestino)}</p>
                      <Divider />
                      <p style={{ fontSize: '1.1rem' }}><strong>Total Acreditado:</strong> <span style={{ color: '#28a745' }}>{monedaDestino.simbolo} {formatearNumero(totalAcreditado)}</span></p>
                      <p style={{ fontSize: '1.1rem' }}><strong>Nuevo Saldo:</strong> <span style={{ color: '#28a745' }}>{monedaDestino.simbolo} {formatearNumero(Number(cuentaDestino.saldoActual || 0) + Number(totalAcreditado))}</span></p>
                    </>
                  )}
                </div>

              </div>

              {/* Costo Total */}
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '1.2rem' }}>
                  <strong>💰 Costo Total de la Operación:</strong>{' '}
                  <span style={{ color: '#dc3545' }}>
                    {monedaOrigen?.simbolo} {formatearNumero(Number(itfOrigen) + Number(comisionOrigen))}
                    {hayDiferenciaMoneda && ` + ${monedaDestino?.simbolo} ${formatearNumero(Number(itfDestino) + Number(comisionDestino))}`}
                  </span>
                </p>
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
