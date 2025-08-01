// src/components/accesoInstalacion/TicketPrinter.jsx
// Componente para generar e imprimir tickets de acceso a instalaciones
// Usa pdf-lib para generar PDF de alta calidad con logo de empresa y código QR
// Documentado en español técnico.

import React from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

/**
 * Componente para generar e imprimir tickets de acceso a instalaciones
 * @param {Object} datosAcceso - Datos completos del acceso a la instalación
 * @param {Function} onTicketGenerado - Callback cuando se genera el ticket
 * @param {Object} toast - Referencia al componente Toast para notificaciones
 * @param {Object} buttonStyle - Estilos personalizados para el botón
 * @param {string} buttonLabel - Texto personalizado para el botón
 */
const TicketPrinter = ({ 
  datosAcceso, 
  onTicketGenerado, 
  toast, 
  buttonStyle = {}, 
  buttonLabel = "Imprimir Ticket" 
}) => {

  /**
   * Genera un ticket PDF de alta calidad usando pdf-lib
   * Maneja imágenes sin compresión y con resolución nativa
   */
  const generarTicketConPdfLib = async (datosAcceso) => {    
    try {
      // Crear documento PDF con pdf-lib
      const pdfDoc = await PDFDocument.create();
      
      // Configurar página para ticket térmico (80mm de ancho)
      const pageWidth = 226; // 80mm en puntos (80 * 2.83)
      const pageHeight = 566; // Alto inicial, se ajustará dinámicamente
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const { width, height } = page.getSize();
      
      // Cargar fuentes
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let yPosition = height - 50; // Punto medio: no muy arriba ni muy abajo
      const leftMargin = 10;
      const centerX = width / 2;
            
      // ===== LOGO DE EMPRESA (ALTA CALIDAD) =====
      if (datosAcceso.empresa?.logo) {
        try {          
          // Construir URL del logo
          const logoUrl = `${import.meta.env.VITE_API_URL}/empresas-logo/${datosAcceso.empresa.id}/logo`;
          
          // Fetch de la imagen directamente
          const logoResponse = await fetch(logoUrl);
          const logoBytes = await logoResponse.arrayBuffer();
          
          // Detectar formato y embebder imagen SIN COMPRESIÓN
          let logoImage;
          if (datosAcceso.empresa.logo.toLowerCase().includes('.png')) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
          
          // Obtener dimensiones originales
          const logoDims = logoImage.size();
          
          // Calcular tamaño proporcional para ticket
          const maxLogoWidth = width * 0.8; // 80% del ancho
          const maxLogoHeight = 60; // Alto máximo
          
          const aspectRatio = logoDims.width / logoDims.height;
          let finalWidth, finalHeight;
          
          if (aspectRatio > (maxLogoWidth / maxLogoHeight)) {
            finalWidth = maxLogoWidth;
            finalHeight = maxLogoWidth / aspectRatio;
          } else {
            finalHeight = maxLogoHeight;
            finalWidth = maxLogoHeight * aspectRatio;
          }
          
          // Dibujar logo CENTRADO con RESOLUCIÓN ORIGINAL
          const logoX = (width - finalWidth) / 2;
          
          // Calcular posición Y correcta: desde yPosition hacia abajo, restando la altura del logo
          const logoY = yPosition - finalHeight;
          
          page.drawImage(logoImage, {
            x: logoX,
            y: logoY, // Posición calculada correctamente
            width: finalWidth,
            height: finalHeight,
          });
          yPosition -= finalHeight + 15;
          
        } catch (logoError) {
          // Continuar sin logo
        }
      }
      
      // ===== ENCABEZADO CORPORATIVO =====
      // Razón social
      page.drawText(datosAcceso.empresa.razonSocial, {
        x: centerX - (datosAcceso.empresa.razonSocial.length * 3),
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      // RUC
      page.drawText(`RUC: ${datosAcceso.empresa.ruc}`, {
        x: centerX - (`RUC: ${datosAcceso.empresa.ruc}`.length * 2.5),
        y: yPosition,
        size: 7, // Más pequeño
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 12;
      
      // Dirección
      if (datosAcceso.empresa.direccion) {
        page.drawText(datosAcceso.empresa.direccion, {
          x: centerX - (datosAcceso.empresa.direccion.length * 1.5),
          y: yPosition,
          size: 6, // Más pequeño
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 12;
      }
      
      // Teléfonos
      if (datosAcceso.empresa.telefono) {
        page.drawText(`Tel: ${datosAcceso.empresa.telefono}`, {
          x: centerX - (`Tel: ${datosAcceso.empresa.telefono}`.length * 1.5),
          y: yPosition,
          size: 6, // Más pequeño
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 12;
      }
      
      // Email
      if (datosAcceso.empresa.email) {
        page.drawText(datosAcceso.empresa.email, {
          x: centerX - (datosAcceso.empresa.email.length * 1.5),
          y: yPosition,
          size: 6, // Más pequeño
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      }
      
      // ===== GENERAR CÓDIGO QR CON DATOS ESENCIALES =====
      // Reducir datos para mejor legibilidad del QR
      const qrData = {
        id: datosAcceso.id,
        fecha: new Date(datosAcceso.fechaHora).toLocaleDateString('es-PE'),
        hora: new Date(datosAcceso.fechaHora).toLocaleTimeString('es-PE', { hour12: false }),
        persona: datosAcceso.nombrePersona,
        documento: datosAcceso.numeroDocumento,
        empresa: datosAcceso.empresa.razonSocial,
        sede: datosAcceso.sede?.nombre || '',
        destino: {
          area: datosAcceso.areaDestino?.label || '',
          persona: datosAcceso.personaDestino || ''
        }
      };
      
      // Generar QR como imagen base64 con configuración optimizada
      let qrImageBase64 = null;
      try {
        const qrDataString = JSON.stringify(qrData);
        qrImageBase64 = await QRCode.toDataURL(qrDataString, {
          width: 200, // Aumentar resolución
          margin: 2,  // Aumentar margen
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M' // Nivel de corrección medio
        });
      } catch (qrError) {
        console.error('Error generando QR:', qrError);
      }

      // ===== CÓDIGO QR =====
      if (qrImageBase64) {
        try {
          // Convertir base64 a bytes
          const qrImageBytes = Uint8Array.from(atob(qrImageBase64.split(',')[1]), c => c.charCodeAt(0));
          const qrImage = await pdfDoc.embedPng(qrImageBytes);
          
          // Dimensiones del QR más grandes para mejor legibilidad
          const qrSize = 80; // Aumentar tamaño del QR
          const qrX = centerX - (qrSize / 2); // Centrado
          
          page.drawImage(qrImage, {
            x: qrX,
            y: yPosition - qrSize,
            width: qrSize,
            height: qrSize,
          });
          yPosition -= qrSize + 15;
          
        } catch (qrError) {
          console.error('Error embebiendo QR en PDF:', qrError);
          // Fallback al código de barras de texto
          const codigoBarras = `*${datosAcceso.id.toString().padStart(8, '0')}*`;
          page.drawText(codigoBarras, {
            x: centerX - (codigoBarras.length * 2.5),
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= 25;
        }
      } else {
        // Fallback al código de barras de texto si falla el QR
        const codigoBarras = `*${datosAcceso.id.toString().padStart(8, '0')}*`;
        page.drawText(codigoBarras, {
          x: centerX - (codigoBarras.length * 2.5),
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;
      }
      
      // ===== ID VISIBLE PARA DIGITACIÓN MANUAL =====
      const idTexto = `ID: ${datosAcceso.id.toString().padStart(8, '0')}`;
      page.drawText(idTexto, {
        x: centerX - (idTexto.length * 2.5),
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      // ===== TÍTULOS PRINCIPALES =====
      page.drawText('CONTROL DE ACCESO A INSTALACIONES', {
        x: centerX - ('CONTROL DE ACCESO A INSTALACIONES'.length * 1.8),
        y: yPosition,
        size: 8, // Más pequeño
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      
      page.drawText('TICKET DE INGRESO', {
        x: centerX - ('TICKET DE INGRESO'.length * 2.5),
        y: yPosition,
        size: 10, // Más pequeño
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      // ===== FUNCIONES AUXILIARES =====
      const agregarLinea = (etiqueta, valor, tamaño = 7) => { // Tamaño por defecto más pequeño
        const texto = `${etiqueta}: ${valor}`;
        page.drawText(texto, {
          x: leftMargin,
          y: yPosition,
          size: tamaño,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 12; // Espaciado más compacto
      };
      
      const agregarTitulo = (titulo) => {
        page.drawText(titulo, {
          x: leftMargin,
          y: yPosition,
          size: 8, // Más pequeño
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15; // Espaciado más compacto
      };
      
      // ===== INFORMACIÓN GENERAL =====
      agregarLinea('Empresa', datosAcceso.empresa.razonSocial);
      if (datosAcceso.sede?.nombre) {
        agregarLinea('Sede', datosAcceso.sede.nombre);
      }
      agregarLinea('Fecha y Hora', new Date(datosAcceso.fechaHora).toLocaleString('es-PE'));
      
      yPosition -= 10;
      
      // ===== DATOS DEL VISITANTE =====
      agregarTitulo('DATOS DEL VISITANTE');
      agregarLinea('Nombres', datosAcceso.nombrePersona);
      
      // Tipo y número de documento
      const tipoDoc = datosAcceso.tipoDocIdentidad?.nombre || 'DNI';
      agregarLinea('Tipo Documento', tipoDoc);
      agregarLinea('Nro Documento', datosAcceso.numeroDocumento);
      
      if (datosAcceso.tipoPersona?.nombre) {
        agregarLinea('Tipo Persona', datosAcceso.tipoPersona.nombre);
      }
      
      yPosition -= 10;
      
      // ===== DATOS VEHÍCULO =====
      if (datosAcceso.vehiculoNroPlaca) {
        agregarTitulo('DATOS VEHICULO');
        agregarLinea('Placa', datosAcceso.vehiculoNroPlaca);
        if (datosAcceso.vehiculoMarca) {
          agregarLinea('Marca', datosAcceso.vehiculoMarca);
        }
        if (datosAcceso.vehiculoModelo) {
          agregarLinea('Modelo', datosAcceso.vehiculoModelo);
        }
        if (datosAcceso.vehiculoColor) {
          agregarLinea('Color', datosAcceso.vehiculoColor);
        }
        yPosition -= 10;
      }
      
      // ===== EQUIPOS =====
      if (datosAcceso.equipoDescripcion || datosAcceso.tipoEquipo?.nombre) {
        agregarTitulo('EQUIPOS');
        if (datosAcceso.tipoEquipo?.nombre) {
          agregarLinea('Tipo Equipo', datosAcceso.tipoEquipo.nombre);
        }
        if (datosAcceso.equipoMarca) {
          agregarLinea('Marca', datosAcceso.equipoMarca);
        }
        if (datosAcceso.equipoSerie) {
          agregarLinea('Serie', datosAcceso.equipoSerie);
        }
        yPosition -= 10;
      }
      
      // ===== DESTINO =====
      agregarTitulo('DESTINO');
      if (datosAcceso.areaDestino?.label) {
        agregarLinea('Área Física Destino', datosAcceso.areaDestino.label);
      } else {
        agregarLinea('Área Física Destino', '___________________');
      }
      if (datosAcceso.personaDestino) {
        agregarLinea('Persona Destino', datosAcceso.personaDestino);
      } else {
        agregarLinea('Persona Destino', '___________________');
      }
      yPosition -= 15;
      
      // ===== ESPACIO PARA FIRMA =====
      yPosition -= 20; // Espacio adicional más compacto
      
      // Línea para firma
      const lineaFirmaY = yPosition;
      const lineaFirmaStart = leftMargin + 20;
      const lineaFirmaEnd = width - 30;
      
      // Dibujar línea horizontal para firma
      page.drawLine({
        start: { x: lineaFirmaStart, y: lineaFirmaY },
        end: { x: lineaFirmaEnd, y: lineaFirmaY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      // Texto "Firma y/o Sello Persona Destino"
      yPosition -= 12;
      page.drawText('Firma y/o Sello Persona Destino', {
        x: centerX - ('Firma y/o Sello Persona Destino'.length * 2),
        y: yPosition,
        size: 7,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 20;
      
      // ===== FINALIZAR PDF =====
      // Ajustar altura de página al contenido
      const finalHeight = height - yPosition + 40;
      page.setSize(pageWidth, finalHeight);
      
      // Serializar PDF
      const pdfBytes = await pdfDoc.save();
      
      // Crear blob y abrir para impresión
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Abrir ventana de impresión
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      return { success: true, url, size: pdfBytes.length };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Genera el PDF del ticket de ingreso
   */
  const generarTicketPDF = async () => {
    try {
      // Verificar condiciones específicas
      // Generar PDF con pdf-lib
      const resultado = await generarTicketConPdfLib(datosAcceso);
      
      if (resultado.success) {
        // Notificar éxito
        toast.current?.show({
          severity: 'success',
          summary: 'Ticket Generado',
          detail: 'El ticket de ingreso se ha generado correctamente'
        });
        
        // Callback opcional
        if (onTicketGenerado) {
          onTicketGenerado(resultado.url);
        }
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el ticket de ingreso'
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el ticket de ingreso'
      });
    }
  };

  return (
    <Button
      type="button"
      label={buttonLabel}
      icon="pi pi-print"
      className={`p-button-success p-button-sm ${buttonStyle.className || ''}`}
      style={buttonStyle.style || {}}
      onClick={generarTicketPDF}
      tooltip="Generar e imprimir ticket de ingreso"
    />
  );
};

export default TicketPrinter;
