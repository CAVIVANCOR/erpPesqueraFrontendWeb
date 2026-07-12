import ExcelJS from 'exceljs';

export async function generarPreFacturasExcel(preFacturas) {
  const workbook = new ExcelJS.Workbook();
  
  // HOJA 1: CABECERA
  const wsCabecera = workbook.addWorksheet('PreFacturas');
  wsCabecera.views = [{ showGridLines: false }];

  const headersCabecera = [
    'ID', 'Código', 'Empresa', 'RUC Empresa', 'Cliente', 'Tipo Doc Cliente', 
    'Nro Doc Cliente', 'Contacto Cliente', 'Dir. Entrega', 'Dir. Fiscal',
    'Tipo Documento', 'Código Tipo Doc', 'Serie', 'Número Documento', 'Fecha Documento',
    'Fecha Contable', 'Periodo Contable', 'Resp. Ventas', 'Autoriza Venta',
    'Tipo Producto', 'Forma Pago', 'Banco', 'Moneda', 'Tipo Cambio',
    'Subtotal', 'Descuentos', 'IGV', 'Total', 'Monto Adelantado', '% Adelanto',
    'Estado', 'Motivo Rechazo', 'Fecha Aprobación', 'Aprobado Por',
    'Cotización Venta', 'Incoterm', 'Puerto Embarque', 'Puerto Destino', 'País Destino',
    'Agente Aduana', 'Nro Buque', 'Nro BL', 'Nro Contenedor', 'Tipo Contenedor',
    'Exonerado IGV', '% IGV', 'Tipo Op. SUNAT', 'Código Op. SUNAT',
    'Factor Export.', 'Factor Export. Real', 'Centro Costo', 'Contrato Servicio',
    'Mov. Salida Almacén', 'Unidad Negocio', 'Tipo Doc Final', 'Código Doc Final',
    'Serie Doc Final', 'Nro Doc Final', 'Fecha Facturación', 'Facturado', 'Es Gerencial',
    'Es Particionada', 'PreFactura Origen', 'Motivo NC/ND', 'Fecha Doc Afecto NC/ND',
    'ID Doc Afecto NC/ND', 'Nro Doc Afecto NC/ND', 'Aplica Imp. Renta', '% Imp. Renta',
    'Monto Imp. Renta', 'Aplica Detracción', 'Tipo Detracción', 'Código Detracción',
    '% Detracción', 'Monto Detracción', 'Aplica Retención', '% Retención', 'Monto Retención',
    'Aplica Percepción', '% Percepción', 'Monto Percepción', 'Tipo Afect. IGV',
    'Código Afect. IGV', 'Observaciones', 'URL PDF', 'URL Doc Ref', 'Fecha Creación',
    'Fecha Actualización', 'Creado Por', 'Actualizado Por'
  ];

  const headerRow = wsCabecera.getRow(1);
  headersCabecera.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  wsCabecera.columns = Array(headersCabecera.length).fill({ width: 15 });

  preFacturas.forEach((pf, index) => {
    const row = wsCabecera.getRow(index + 2);
    row.values = [
      pf.id,
      pf.codigo || '',
      pf.empresa?.razonSocial || '',
      pf.empresa?.ruc || '',
      pf.cliente?.razonSocial || '',
      pf.cliente?.tipoDocumentoIdentidad?.descripcion || '',
      pf.cliente?.numeroDocumento || '',
      pf.contactoCliente ? `${pf.contactoCliente.nombres} ${pf.contactoCliente.apellidos}` : '',
      pf.dirEntrega?.direccion || '',
      pf.dirFiscal?.direccion || '',
      pf.tipoDocumento?.descripcion || '',
      pf.tipoDocumento?.codigo || '',
      pf.serieDoc?.serie || '',
      pf.numeroDocumento || '',
      pf.fechaDocumento ? new Date(pf.fechaDocumento).toLocaleDateString('es-PE') : '',
      pf.fechaContable ? new Date(pf.fechaContable).toLocaleDateString('es-PE') : '',
      pf.periodoContable?.descripcion || '',
      pf.respVentas ? `${pf.respVentas.nombres} ${pf.respVentas.apellidos}` : '',
      pf.autorizaVenta ? `${pf.autorizaVenta.nombres} ${pf.autorizaVenta.apellidos}` : '',
      pf.tipoProducto?.nombre || '',
      pf.formaPago?.descripcion || '',
      pf.banco?.nombre || '',
      pf.moneda?.simbolo || '',
      Number(pf.tipoCambio || 0),
      Number(pf.subtotal || 0),
      Number(pf.totalDescuentos || 0),
      Number(pf.totalIGV || 0),
      Number(pf.total || 0),
      Number(pf.montoAdelantadoCliente || 0),
      Number(pf.porcentajeAdelanto || 0),
      pf.estado?.descripcion || '',
      pf.motivoRechazo || '',
      pf.fechaAprobacion ? new Date(pf.fechaAprobacion).toLocaleDateString('es-PE') : '',
      pf.aprobadoPor ? `${pf.aprobadoPor.nombres} ${pf.aprobadoPor.apellidos}` : '',
      pf.cotizacionVenta?.codigo || '',
      pf.incoterm?.codigo || '',
      pf.puertoEmbarque?.nombre || '',
      pf.puertoDestino?.nombre || '',
      pf.paisDestino?.nombre || '',
      pf.agenteAduana?.razonSocial || '',
      pf.numeroBuque || '',
      pf.numeroBL || '',
      pf.numContenedor || '',
      pf.tipoContenedor?.descripcion || '',
      pf.exoneradoIgv ? 'SÍ' : 'NO',
      Number(pf.porcentajeIgv || 0),
      pf.tipoOperacionSunat?.descripcion || '',
      pf.tipoOperacionSunat?.codigo || '',
      Number(pf.factorExportacion || 0),
      Number(pf.factorExportacionReal || 0),
      pf.centroCosto?.nombre || '',
      pf.contratoServicio?.codigo || '',
      pf.movSalidaAlmacen?.codigo || '',
      pf.unidadNegocio?.nombre || '',
      pf.tipoDocumentoFinal?.descripcion || '',
      pf.tipoDocumentoFinal?.codigo || '',
      pf.serieDocFinal?.serie || '',
      pf.numeroDocumentoFinal || '',
      pf.fechaFacturacion ? new Date(pf.fechaFacturacion).toLocaleDateString('es-PE') : '',
      pf.facturado ? 'SÍ' : 'NO',
      pf.esGerencial ? 'SÍ' : 'NO',
      pf.esParticionada ? 'SÍ' : 'NO',
      pf.preFacturaOrigen?.codigo || '',
      pf.motivoNotaCreditoDebito?.descripcion || '',
      pf.fechaDcmtoAfectoNCND ? new Date(pf.fechaDcmtoAfectoNCND).toLocaleDateString('es-PE') : '',
      pf.dcmtoAfectoNCNDId || '',
      pf.numeroDcmtoAfectoNCND || '',
      pf.aplicaImpuestoRenta ? 'SÍ' : 'NO',
      Number(pf.porcentajeImpuestoRenta || 0),
      Number(pf.montoImpuestoRenta || 0),
      pf.aplicaDetraccion ? 'SÍ' : 'NO',
      pf.tipoDetraccion?.nombre || '',
      pf.tipoDetraccion?.codigo || '',
      Number(pf.porcentajeDetraccion || 0),
      Number(pf.montoDetraccion || 0),
      pf.aplicaRetencion ? 'SÍ' : 'NO',
      Number(pf.porcentajeRetencion || 0),
      Number(pf.montoRetencion || 0),
      pf.aplicaPercepcion ? 'SÍ' : 'NO',
      Number(pf.porcentajePercepcion || 0),
      Number(pf.montoPercepcion || 0),
      pf.tipoAfectacionIGV?.nombre || '',
      pf.tipoAfectacionIGV?.codigo || '',
      pf.observaciones || '',
      pf.urlPreFacturaPdf || '',
      pf.urlDocumentoRef || '',
      pf.fechaCreacion ? new Date(pf.fechaCreacion).toLocaleDateString('es-PE') : '',
      pf.fechaActualizacion ? new Date(pf.fechaActualizacion).toLocaleDateString('es-PE') : '',
      pf.creadoPor || '',
      pf.actualizadoPor || ''
    ];

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      if ([24, 25, 26, 27, 28, 29, 30, 48, 49, 66, 67, 68, 72, 73, 75, 76, 78, 79, 81, 82].includes(colNumber)) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });
  });

  // HOJA 2: DETALLES
  const wsDetalles = workbook.addWorksheet('Detalles');
  wsDetalles.views = [{ showGridLines: false }];

  const headersDetalles = [
    'ID PreFactura', 'Código PreFactura', 'Número Documento', 'Línea',
    'Producto', 'Código Producto', 'Cantidad', 'Unidad', 'Precio Unitario',
    'Descuento', 'Subtotal', 'IGV', 'Total', 'Almacén', 'Centro Costo'
  ];

  const headerRowDet = wsDetalles.getRow(1);
  headersDetalles.forEach((header, index) => {
    const cell = headerRowDet.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  wsDetalles.columns = [
    { width: 12 }, { width: 15 }, { width: 18 }, { width: 8 }, { width: 40 },
    { width: 15 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 }, { width: 20 }
  ];

  let rowIndex = 2;
  preFacturas.forEach((pf) => {
    const detalles = pf.detalles || [];
    detalles.forEach((det, detIndex) => {
      const row = wsDetalles.getRow(rowIndex);
      row.values = [
        pf.id,
        pf.codigo || '',
        pf.numeroDocumento || '',
        det.numeroLinea || (detIndex + 1),
        det.producto?.descripcionBase || '',
        det.producto?.codigoInterno || '',
        Number(det.cantidad || 0),
        det.producto?.unidadMedida?.abreviatura || '',
        Number(det.precioUnitario || 0),
        Number(det.descuento || 0),
        Number(det.subtotal || 0),
        Number(det.igv || 0),
        Number(det.total || 0),
        det.almacen?.nombre || '',
        det.centroCosto?.nombre || ''
      ];

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };

        if ([7, 9, 10, 11, 12, 13].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          };
        }
      });

      rowIndex++;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}