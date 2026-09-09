import React, { useState } from 'react';
import { Button } from 'primereact/button';
import * as sireAPI from '../../api/sire';

/**
 * Componente genérico para descargar PDF de comprobantes desde SUNAT
 * Reutilizable en Compras y Ventas
 * 
 * @param {string} empresaId - ID de la empresa
 * @param {string} rucEmisorReceptor - RUC del proveedor (compras) o cliente (ventas)
 * @param {string|number} tipoDocCodigo - Código SUNAT del tipo de documento (01, 03, 07, 08)
 * @param {string} serie - Serie del comprobante (F001, B001, etc)
 * @param {string|number} numero - Número correlativo del comprobante
 * @param {Date|string} fechaEmision - Fecha de emisión del comprobante
 * @param {string|number} entityId - ID de la entidad (ordenCompraId, preFacturaId, etc)
 * @param {string} moduloDestino - Módulo destino: 'orden-compra' o 'pre-factura'
 * @param {function} onPDFDescargado - Callback cuando se descarga exitosamente (recibe pdfUrl)
 * @param {function} onError - Callback cuando hay error (recibe mensaje de error)
 * @param {boolean} disabled - Deshabilitar botón
 * @param {string} label - Texto del botón
 * @param {string} icon - Icono del botón
 * @param {string} className - Clase CSS del botón
 * @param {string} tooltip - Tooltip del botón
 */
export default function BotonDescargarPDFSunat({
  empresaId,
  rucEmisorReceptor,
  tipoDocCodigo,
  serie,
  numero,
  fechaEmision,
  entityId,
  moduloDestino = 'orden-compra',
  onPDFDescargado,
  onError,
  disabled = false,
  label = "Descargar PDF SUNAT",
  icon = "pi pi-download",
  className = "p-button-help",
  tooltip
}) {
  const [loading, setLoading] = useState(false);

  const handleDescargar = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔽 COMPONENTE - Iniciando descarga PDF SUNAT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Validaciones
      console.log('🔍 Validando parámetros...');
      console.log('   empresaId:', empresaId);
      console.log('   rucEmisorReceptor:', rucEmisorReceptor);
      console.log('   tipoDocCodigo:', tipoDocCodigo);
      console.log('   serie:', serie);
      console.log('   numero:', numero);
      console.log('   fechaEmision:', fechaEmision);
      console.log('   entityId:', entityId);
      console.log('   moduloDestino:', moduloDestino);

      if (!empresaId) {
        console.error('❌ Falta empresaId');
        onError?.('Falta el ID de la empresa');
        return;
      }

      if (!rucEmisorReceptor) {
        console.error('❌ Falta rucEmisorReceptor');
        onError?.('Falta el RUC del emisor/receptor');
        return;
      }

      if (!tipoDocCodigo) {
        console.error('❌ Falta tipoDocCodigo');
        onError?.('Falta el tipo de documento');
        return;
      }

      if (!serie) {
        console.error('❌ Falta serie');
        onError?.('Falta la serie del comprobante');
        return;
      }

      if (!numero) {
        console.error('❌ Falta numero');
        onError?.('Falta el número del comprobante');
        return;
      }

      if (!fechaEmision) {
        console.error('❌ Falta fechaEmision');
        onError?.('Falta la fecha de emisión');
        return;
      }

      if (!entityId) {
        console.error('❌ Falta entityId');
        onError?.('Falta el ID del documento');
        return;
      }

      console.log('✅ Validaciones pasadas');

      // Construir CAR
      console.log('\n📋 Construyendo CAR...');
      const ruc = String(rucEmisorReceptor).padStart(11, '0');
      const tipo = String(tipoDocCodigo).padStart(2, '0');
      const serieFormateada = String(serie).padStart(4, '0');
      const numeroFormateado = String(numero).padStart(10, '0');
      const car = `${ruc}${tipo}${serieFormateada}${numeroFormateado}`;
      console.log('   RUC:', ruc);
      console.log('   Tipo:', tipo);
      console.log('   Serie:', serieFormateada);
      console.log('   Número:', numeroFormateado);
      console.log('   CAR completo:', car);

      // Calcular periodo (YYYYMM)
      const fecha = new Date(fechaEmision);
      const periodo = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      console.log('   Periodo:', periodo);

      console.log('\n� Llamando a API...');
      console.log('   Módulo:', moduloDestino);
      console.log('   Parámetros:', { empresaId, periodo, car, entityId });

      setLoading(true);

      let resultado;
      
      if (moduloDestino === 'orden-compra') {
        resultado = await sireAPI.descargarPDFParaOrdenCompra(empresaId, periodo, car, entityId);
      } else {
        console.error('❌ Módulo no soportado:', moduloDestino);
        onError?.('Módulo no soportado aún');
        return;
      }

      console.log('\n📥 Respuesta de API:', resultado);

      if (resultado.success) {
        console.log('✅ PDF descargado exitosamente');
        console.log('   URL:', resultado.pdfUrl);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        onPDFDescargado?.(resultado.pdfUrl);
      } else {
        console.error('❌ Error en respuesta:', resultado.mensaje);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        onError?.(resultado.mensaje || 'No se pudo descargar el PDF');
      }
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ COMPONENTE - Error descargando PDF SUNAT');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      onError?.(error.message || 'Error al descargar PDF desde SUNAT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      label={label}
      icon={icon}
      className={className}
      onClick={handleDescargar}
      disabled={disabled || loading}
      loading={loading}
      tooltip={tooltip}
    />
  );
}