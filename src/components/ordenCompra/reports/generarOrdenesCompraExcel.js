import ExcelJS from 'exceljs';

export async function generarOrdenesCompraExcel(ordenesCompra) {
  const workbook = new ExcelJS.Workbook();
  
  // HOJA 1: CABECERA
  const wsCabecera = workbook.addWorksheet('OrdenesCompra');
  wsCabecera.views = [{ showGridLines: false }];

  const headersCabecera = [
    'ID', 'Empresa', 'RUC Empresa', 'Proveedor', 'Tipo Doc Proveedor', 
    'Nro Doc Proveedor', 'Contacto Proveedor', 'Dir. Recepción Almacén',
    'Tipo Documento', 'Código Tipo Doc', 'Serie', 'Nro Serie', 'Nro Correlativo',
    'Número Documento', 'Fecha Documento', 'Fecha Contable', 'Periodo Contable',
    'Req. Compra', 'Forma Pago', 'Moneda', 'Tipo Cambio', 'Fecha Entrega',
    'Fecha Recepción', 'Solicitante', 'Aprobado Por', 'Estado',
    'Centro Costo', 'Mov. Ingreso Almacén', 'Subtotal', 'Descuentos', 'IGV',
    'Total', '% IGV', 'Tipo Op. SUNAT', 'Código Op. SUNAT', 'Exonerado IGV',
    'Pagos Previos SI', 'Tipo Doc Final', 'Código Doc Final', 'Nro Doc Final',
    'Nro Serie Final', 'Nro Corr. Final', 'Comprobante Recibido', 'Fecha Recep. Comprobante',
    'Facturado', 'Fecha Facturación', 'Fecha Vencimiento', 'Es Gerencial',
    'OC Origen', 'Es Particionada', 'Unidad Negocio', 'Motivo NC/ND',
    'Fecha Doc Afecto NC/ND', 'ID Doc Afecto NC/ND', 'Nro Doc Afecto NC/ND',
    'Aplica Imp. Renta', '% Imp. Renta', 'Monto Imp. Renta', 'Aplica Detracción',
    'Tipo Detracción', 'Código Detracción', '% Detracción', 'Monto Detracción',
    'Aplica Retención', '% Retención', 'Monto Retención', 'Aplica Percepción',
    '% Percepción', 'Monto Percepción', 'Observaciones', 'URL PDF', 'URL Doc Ref',
    'Fecha Creación', 'Fecha Actualización', 'Creado Por', 'Actualizado Por'
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

  ordenesCompra.forEach((oc, index) => {
    const row = wsCabecera.getRow(index + 2);
    row.values = [
      oc.id,
      oc.empresa?.razonSocial || '',
      oc.empresa?.ruc || '',
      oc.proveedor?.razonSocial || '',
      oc.proveedor?.tipoDocumentoIdentidad?.descripcion || '',
      oc.proveedor?.numeroDocumento || '',
      oc.contactoProveedor ? `${oc.contactoProveedor.nombres} ${oc.contactoProveedor.apellidos}` : '',
      oc.direccionRecepcionAlmacen?.direccion || '',
      oc.tipoDocumento?.descripcion || '',
      oc.tipoDocumento?.codigo || '',
      oc.serieDoc?.serie || '',
      oc.numSerieDoc || '',
      oc.numCorreDoc || '',
      oc.numeroDocumento || '',
      oc.fechaDocumento ? new Date(oc.fechaDocumento).toLocaleDateString('es-PE') : '',
      oc.fechaContable ? new Date(oc.fechaContable).toLocaleDateString('es-PE') : '',
      oc.periodoContable?.descripcion || '',
      oc.requerimientoCompra?.codigo || '',
      oc.formaPago?.descripcion || '',
      oc.moneda?.simbolo || '',
      Number(oc.tipoCambio || 0),
      oc.fechaEntrega ? new Date(oc.fechaEntrega).toLocaleDateString('es-PE') : '',
      oc.fechaRecepcion ? new Date(oc.fechaRecepcion).toLocaleDateString('es-PE') : '',
      oc.solicitante ? `${oc.solicitante.nombres} ${oc.solicitante.apellidos}` : '',
      oc.aprobadoPor ? `${oc.aprobadoPor.nombres} ${oc.aprobadoPor.apellidos}` : '',
      oc.estado?.descripcion || '',
      oc.centroCosto?.nombre || '',
      oc.movIngresoAlmacen?.codigo || '',
      Number(oc.subtotal || 0),
      Number(oc.totalDescuentos || 0),
      Number(oc.totalIGV || 0),
      Number(oc.total || 0),
      Number(oc.porcentajeIGV || 0),
      oc.tipoOperacionSunat?.descripcion || '',
      oc.tipoOperacionSunat?.codigo || '',
      oc.esExoneradoAlIGV ? 'SÍ' : 'NO',
      Number(oc.pagosPreviosSI || 0),
      oc.tipoDocumentoFinal?.descripcion || '',
      oc.tipoDocumentoFinal?.codigo || '',
      oc.numeroDocumentoFinal || '',
      oc.numSerieDocFinal || '',
      oc.numCorreDocFinal || '',
      oc.comprobanteRecibido ? 'SÍ' : 'NO',
      oc.fechaRecepcionComprobante ? new Date(oc.fechaRecepcionComprobante).toLocaleDateString('es-PE') : '',
      oc.facturado ? 'SÍ' : 'NO',
      oc.fechaFacturacion ? new Date(oc.fechaFacturacion).toLocaleDateString('es-PE') : '',
      oc.fechaVencimiento ? new Date(oc.fechaVencimiento).toLocaleDateString('es-PE') : '',
      oc.esGerencial ? 'SÍ' : 'NO',
      oc.ordenCompraOrigen?.numeroDocumento || '',
      oc.esParticionada ? 'SÍ' : 'NO',
      oc.unidadNegocio?.nombre || '',
      oc.motivoNotaCreditoDebito?.descripcion || '',
      oc.fechaDcmtoAfectoNCND ? new Date(oc.fechaDcmtoAfectoNCND).toLocaleDateString('es-PE') : '',
      oc.dcmtoAfectoNCNDId || '',
      oc.numeroDcmtoAfectoNCND || '',
      oc.aplicaImpuestoRenta ? 'SÍ' : 'NO',
      Number(oc.porcentajeImpuestoRenta || 0),
      Number(oc.montoImpuestoRenta || 0),
      oc.aplicaDetraccion ? 'SÍ' : 'NO',
      oc.tipoDetraccion?.nombre || '',
      oc.tipoDetraccion?.codigo || '',
      Number(oc.porcentajeDetraccion || 0),
      Number(oc.montoDetraccion || 0),
      oc.aplicaRetencion ? 'SÍ' : 'NO',
      Number(oc.porcentajeRetencion || 0),
      Number(oc.montoRetencion || 0),
      oc.aplicaPercepcion ? 'SÍ' : 'NO',
      Number(oc.porcentajePercepcion || 0),
      Number(oc.montoPercepcion || 0),
      oc.observaciones || '',
      oc.urlOrdenCompraPdf || '',
      oc.urlDocumentoRef || '',
      oc.creadoEn ? new Date(oc.creadoEn).toLocaleDateString('es-PE') : '',
      oc.actualizadoEn ? new Date(oc.actualizadoEn).toLocaleDateString('es-PE') : '',
      oc.creadoPor || '',
      oc.actualizadoPor || ''
    ];

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      if ([21, 29, 30, 31, 32, 33, 37, 57, 58, 59, 62, 63, 65, 66, 68, 69].includes(colNumber)) {
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
    'ID OrdenCompra', 'Número Documento', 'Línea', 'Producto', 'Código Producto',
    'Cantidad', 'Unidad', 'Precio Unitario', 'Descuento', 'Subtotal', 'IGV', 'Total',
    'Almacén', 'Centro Costo'
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
    { width: 12 }, { width: 18 }, { width: 8 }, { width: 40 }, { width: 15 },
    { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 20 }, { width: 20 }
  ];

  let rowIndex = 2;
  ordenesCompra.forEach((oc) => {
    const detalles = oc.detalles || [];
    detalles.forEach((det, detIndex) => {
      const row = wsDetalles.getRow(rowIndex);
      row.values = [
        oc.id,
        oc.numeroDocumento || '',
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

        if ([6, 8, 9, 10, 11, 12].includes(colNumber)) {
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