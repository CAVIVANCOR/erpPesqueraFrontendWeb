import ExcelJS from 'exceljs';

/**
 * Genera Excel de PreFacturas con datos relacionados
 * @param {Array} preFacturas - Array de PreFacturas con includes
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarPreFacturasExcel(preFacturas) {
  const workbook = new ExcelJS.Workbook();

  // HOJA 1: CABECERA
  const wsCabecera = workbook.addWorksheet('PreFacturas');
  wsCabecera.views = [{ showGridLines: false }];

  // Encabezados
  const headersCabecera = [
    'ID', 'Código', 'Empresa', 'RUC Empresa', 'Cliente', 'Tipo Doc Cliente',
    'Nro Doc Cliente', 'Tipo Documento', 'Número Documento', 'Fecha Documento',
    'Fecha Contable', 'Moneda', 'Subtotal', 'IGV', 'Total', 'Estado',
    'Centro Costo', 'Forma Pago', 'Tipo Op. SUNAT', 'Tipo Afect. IGV',
    'Exonerado IGV', 'Es Gerencial', 'Tipo Doc Final', 'Nro Doc Final', 'Fecha Facturación',
    'Unidad Negocio', 'Motivo NC/ND', 'Fecha Doc Afecto', 'ID Doc Afecto', 'Nro Doc Afecto',
    'Aplica Imp. Renta', '% Imp. Renta', 'Monto Imp. Renta', 'Aplica Detracción',
    'Aplica Retención', 'Aplica Percepción'
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

  // Anchos de columnas
  wsCabecera.columns = [
    { width: 8 }, { width: 15 }, { width: 35 }, { width: 12 }, { width: 35 },
    { width: 15 }, { width: 15 }, { width: 18 }, { width: 18 }, { width: 12 },
    { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 15 }, { width: 20 }, { width: 15 }, { width: 20 }, { width: 18 },
    { width: 12 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 12 },
    { width: 20 }, { width: 20 }, { width: 12 }, { width: 12 }, { width: 18 },
    { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 },
    { width: 12 }, { width: 12 }
  ];

  // Datos
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
      pf.tipoDocumento?.descripcion || '',
      pf.numeroDocumento || '',
      pf.fechaDocumento ? new Date(pf.fechaDocumento).toLocaleDateString('es-PE') : '',
      pf.fechaContable ? new Date(pf.fechaContable).toLocaleDateString('es-PE') : '',
      pf.moneda?.simbolo || '',
      Number(pf.subtotal || 0),
      Number(pf.totalIGV || 0),
      Number(pf.total || 0),
      pf.estadoDocumento?.descripcion || '',
      pf.centroCosto?.nombre || '',
      pf.formaPago?.descripcion || '',
      pf.tipoOperacionSunat?.descripcion || '',
      pf.tipoAfectacionIGV?.nombre || '',
      pf.exoneradoIgv ? 'SÍ' : 'NO',
      pf.esGerencial ? 'SÍ' : 'NO',
      pf.tipoDocumentoFinal?.descripcion || '',
      pf.numeroDocumentoFinal || '',
      pf.fechaFacturacion ? new Date(pf.fechaFacturacion).toLocaleDateString('es-PE') : '',
      pf.unidadNegocio?.nombre || '',
      pf.motivoNotaCreditoDebito?.descripcion || '',
      pf.fechaDcmtoAfectoNCND ? new Date(pf.fechaDcmtoAfectoNCND).toLocaleDateString('es-PE') : '',
      pf.dcmtoAfectoNCNDId || '',
      pf.numeroDcmtoAfectoNCND || '',
      pf.aplicaImpuestoRenta ? 'SÍ' : 'NO',
      Number(pf.porcentajeImpuestoRenta || 0),
      Number(pf.montoImpuestoRenta || 0),
      pf.aplicaDetraccion ? 'SÍ' : 'NO',
      pf.aplicaRetencion ? 'SÍ' : 'NO',
      pf.aplicaPercepcion ? 'SÍ' : 'NO'
    ];

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      // Formato números
      if ([13, 14, 15, 32, 33].includes(colNumber)) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Fondo alternado
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
    'Subtotal', 'IGV', 'Total', 'Almacén', 'Centro Costo'
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
    { width: 12 }, { width: 12 }, { width: 20 }, { width: 20 }
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

        if ([7, 9, 10, 11, 12].includes(colNumber)) {
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