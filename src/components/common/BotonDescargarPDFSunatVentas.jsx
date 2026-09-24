import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import * as ventasAPI from '../../api/ventas';

/**
 * Componente genérico para descargar PDFs de comprobantes de venta desde SUNAT vía json.pe
 * 
 * @param {Object} props
 * @param {number} props.empresaId - ID de la empresa emisora
 * @param {number} props.entityId - ID de la entidad (preFacturaId)
 * @param {string} props.tipoDoc - Código SUNAT del tipo de documento (01, 03, etc.)
 * @param {string} props.serie - Serie del comprobante
 * @param {string} props.correlativo - Número correlativo del comprobante
 * @param {function} props.onSuccess - Callback cuando se descarga exitosamente (recibe pdfUrl)
 * @param {function} props.onError - Callback cuando hay un error (recibe error)
 * @param {Object} props.toastRef - Referencia al componente Toast para mostrar mensajes
 */
const BotonDescargarPDFSunatVentas = ({
  empresaId,
  entityId,
  tipoDoc,
  serie,
  correlativo,
  onSuccess,
  onError,
  toastRef
}) => {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 COMPONENTE - Iniciando descarga de PDF SUNAT (Ventas)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Empresa ID:', empresaId);
      console.log('PreFactura ID:', entityId);
      console.log('Tipo Doc:', tipoDoc);
      console.log('Serie:', serie);
      console.log('Correlativo:', correlativo);

      // Validar datos requeridos
      if (!empresaId || !entityId || !tipoDoc || !serie || !correlativo) {
        const mensaje = 'Faltan datos requeridos para descargar el PDF';
        console.error('❌', mensaje);
        
        if (toastRef?.current) {
          toastRef.current.show({
            severity: 'error',
            summary: 'Error',
            detail: mensaje,
            life: 3000
          });
        }
        
        if (onError) {
          onError(new Error(mensaje));
        }
        return;
      }

      setDescargando(true);

      // Llamar a la API
      const resultado = await ventasAPI.descargarPDFParaPreFactura(
        empresaId,
        entityId,
        tipoDoc,
        serie,
        correlativo
      );

      if (resultado.success && resultado.pdfUrl) {
        console.log('✅ PDF descargado exitosamente:', resultado.pdfUrl);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (toastRef?.current) {
          toastRef.current.show({
            severity: 'success',
            summary: '✅ PDF Descargado',
            detail: `El comprobante ${serie}-${correlativo} fue descargado exitosamente desde SUNAT y guardado en el sistema`,
            life: 5000
          });
        }

        if (onSuccess) {
          onSuccess(resultado.pdfUrl);
        }
      } else {
        throw new Error(resultado.message || 'Error descargando PDF');
      }

    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ COMPONENTE - Error descargando PDF SUNAT');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('Mensaje:', error.response?.data?.message || error.message);
      console.error('Stack:', error.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const mensajeError = error.response?.data?.message || error.message || 'Error desconocido';
      let detalleError = '';

      // Mensajes más específicos según el tipo de error
      if (mensajeError.includes('422') || mensajeError.includes('Unprocessable Entity')) {
        detalleError = `El comprobante ${serie}-${correlativo} no fue encontrado en SUNAT. Verifique que el documento haya sido enviado correctamente a SUNAT.`;
      } else if (mensajeError.includes('401') || mensajeError.includes('Unauthorized')) {
        detalleError = 'Credenciales SOL incorrectas. Verifique el usuario y contraseña SOL de la empresa.';
      } else if (mensajeError.includes('Token')) {
        detalleError = 'Token de json.pe no configurado o inválido. Contacte al administrador del sistema.';
      } else if (mensajeError.includes('Credenciales SOL')) {
        detalleError = 'Las credenciales SOL no están configuradas para esta empresa. Configure el usuario y contraseña SOL en los datos de la empresa.';
      } else {
        detalleError = `Error al descargar el PDF del comprobante ${serie}-${correlativo}: ${mensajeError}`;
      }

      if (toastRef?.current) {
        toastRef.current.show({
          severity: 'error',
          summary: '❌ Error al Descargar PDF',
          detail: detalleError,
          life: 8000
        });
      }

      if (onError) {
        onError(error);
      }
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button
      label="Descargar PDF SUNAT"
      icon="pi pi-download"
      className="p-button-outlined p-button-info"
      onClick={handleDescargar}
      loading={descargando}
      disabled={descargando}
      tooltip="Descarga el PDF del comprobante desde SUNAT"
      tooltipOptions={{ position: 'top' }}
    />
  );
};

export default BotonDescargarPDFSunatVentas;
