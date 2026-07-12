import ExcelJS from 'exceljs';

/**
 * Genera Excel de Productos con datos relacionados
 * @param {Array} productos - Array de Productos con includes
 * @returns {Promise<Blob>} - Blob del Excel generado
 */
export async function generarProductosExcel(productos) {
  const workbook = new ExcelJS.Workbook();
  
  const wsProductos = workbook.addWorksheet('Productos');
  wsProductos.views = [{ showGridLines: false }];

  const headersProductos = [
    'ID', 'Código', 'Descripción Base', 'Descripción Extendida', 'Descripción Armada',
    'Desc. Español Export.', 'Desc. Inglés Export.', 'Familia', 'Subfamilia', 
    'Unidad Medida', 'Unidad Comercial', 'Tipo Almacenamiento', 'Procedencia', 'Marca',
    'Estado Inicial', 'Empresa', 'Cliente', 'Tipo Material', 'Color', 'Especie',
    'Exonerado IGV', 'Exonerado Retención', 'Sujeto Detracción', '% Detracción',
    'Tipo Detracción', 'Tipo Afect. IGV', 'Cesado', 'Margen Mínimo %', 'Margen Objetivo %',
    'Cuenta Compras', 'Cuenta Inventario', 'Cuenta Costo Ventas', 'Cuenta Variación',
    'Aplica Subfamilia', 'Aplica Unidad Medida', 'Aplica Tipo Almacenamiento',
    'Aplica Procedencia', 'Aplica Marca', 'Aplica Tipo Material', 'Aplica Color',
    'Medida Diámetro', 'Unidad Diámetro', 'Medida Ancho', 'Unidad Ancho',
    'Medida Alto', 'Unidad Alto', 'Medida Largo', 'Unidad Largo',
    'Medida Espesor', 'Unidad Espesor', 'Medida Ángulo', 'Unidad Ángulo',
    'Desc. Medida Adicional', 'URL Ficha Técnica', 'URL Foto Producto',
    'Fecha Creación', 'Fecha Actualización'
  ];

  const headerRow = wsProductos.getRow(1);
  headersProductos.forEach((header, index) => {
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

  wsProductos.columns = [
    { width: 8 }, { width: 15 }, { width: 40 }, { width: 40 }, { width: 50 },
    { width: 40 }, { width: 40 }, { width: 20 }, { width: 20 }, { width: 15 },
    { width: 15 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 30 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 12 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 25 },
    { width: 20 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 20 },
    { width: 20 }, { width: 20 }, { width: 20 }, { width: 12 }, { width: 15 },
    { width: 20 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 12 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 30 }, { width: 30 }, { width: 30 },
    { width: 12 }, { width: 12 }
  ];

  productos.forEach((prod, index) => {
    const row = wsProductos.getRow(index + 2);
    row.values = [
      prod.id,
      prod.codigo || prod.codigoInterno || '',
      prod.descripcionBase || '',
      prod.descripcionExtendida || '',
      prod.descripcionArmada || '',
      prod.descripcionEspanolExportacion || '',
      prod.descripcionInglesExportacion || '',
      prod.familia?.nombre || '',
      prod.subfamilia?.nombre || '',
      prod.unidadMedida?.abreviatura || '',
      prod.unidadMedidaComercial?.abreviatura || '',
      prod.tipoAlmacenamiento?.nombre || '',
      prod.procedencia?.nombre || '',
      prod.marca?.nombre || '',
      prod.estadoInicial?.descripcion || '',
      prod.empresa?.razonSocial || '',
      prod.cliente?.razonSocial || '',
      prod.tipoMaterial?.nombre || '',
      prod.color?.nombre || '',
      prod.especie?.nombre || '',
      prod.exoneradoIgv ? 'SÍ' : 'NO',
      prod.exoneradoRetencion ? 'SÍ' : 'NO',
      prod.sujetoDetraccion ? 'SÍ' : 'NO',
      Number(prod.porcentajeDetraccion || 0),
      prod.tipoDetraccion?.nombre || '',
      prod.tipoAfectacionIGV?.nombre || '',
      prod.cesado ? 'SÍ' : 'NO',
      Number(prod.margenMinimoPermitido || 0),
      Number(prod.margenUtilidadObjetivo || 0),
      prod.cuentaCompras?.codigoCuenta || '',
      prod.cuentaInventario?.codigoCuenta || '',
      prod.cuentaCostoVentas?.codigoCuenta || '',
      prod.cuentaVariacion?.codigoCuenta || '',
      prod.aplicaSubfamilia ? 'SÍ' : 'NO',
      prod.aplicaUnidadMedida ? 'SÍ' : 'NO',
      prod.aplicaTipoAlmacenamiento ? 'SÍ' : 'NO',
      prod.aplicaProcedencia ? 'SÍ' : 'NO',
      prod.aplicaMarca ? 'SÍ' : 'NO',
      prod.aplicaTipoMaterial ? 'SÍ' : 'NO',
      prod.aplicaColor ? 'SÍ' : 'NO',
      prod.medidaDiametro || '',
      prod.unidadDiametro?.abreviatura || '',
      prod.medidaAncho || '',
      prod.unidadAncho?.abreviatura || '',
      prod.medidaAlto || '',
      prod.unidadAlto?.abreviatura || '',
      prod.medidaLargo || '',
      prod.unidadLargo?.abreviatura || '',
      prod.medidaEspesor || '',
      prod.unidadEspesor?.abreviatura || '',
      prod.medidaAngulo || '',
      prod.unidadAngulo?.abreviatura || '',
      prod.descripcionMedidaAdicional || '',
      prod.urlFichaTecnica || '',
      prod.urlFotoProducto || '',
      prod.fechaCreacion ? new Date(prod.fechaCreacion).toLocaleDateString('es-PE') : '',
      prod.fechaActualizacion ? new Date(prod.fechaActualizacion).toLocaleDateString('es-PE') : ''
    ];

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      if ([24, 28, 29].includes(colNumber)) {
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

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}