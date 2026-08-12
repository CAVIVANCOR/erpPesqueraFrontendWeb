/**
 * Configuración dinámica de anexos para el Balance General
 * Cada anexo define su estructura, cuentas asociadas y formato de visualización
 */

export const ANEXOS_CONFIG = {
  'N°01': {
    numero: 'N°01',
    titulo: 'CAJA Y BANCOS',
    cuentas: ['10'],
    tipo: 'detalle_bancario',
    columnas: [
      { field: 'entidadFinanciera', header: 'ENTIDAD FINANCIERA', width: '40%', align: 'left' },
      { field: 'moneda', header: 'MONEDA', width: '15%', align: 'center' },
      { field: 'numeroCuenta', header: 'NRO DE CUENTA', width: '25%', align: 'left' },
      { field: 'saldo', header: 'SALDO EN CUENTAS', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        entidadFinanciera: cuenta.nombreCuenta || '',
        moneda: cuenta.monedaCodigo || 'MN',
        numeroCuenta: cuenta.descripcion || 'Efectivo',
        saldo: calcularSaldoNeto(cuenta, 'ACTIVO')
      }));
    }
  },

  'N°02': {
    numero: 'N°02',
    titulo: 'CUENTAS POR COBRAR COMERCIALES',
    cuentas: ['12'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '50%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '25%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL POR COBRAR', width: '25%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      // Agrupar por tercero/cliente
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const cliente = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[cliente]) {
          agrupado[cliente] = {
            razonSocial: cliente,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'ACTIVO');
        agrupado[cliente].detalles.push({
          descripcion: cuenta.descripcion || 'Facturas Varias',
          monto: saldo
        });
        agrupado[cliente].total += saldo;
      });

      // Convertir a array con estructura jerárquica
      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          razonSocial: grupo.razonSocial,
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            razonSocial: `  ${detalle.descripcion}`,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°03': {
    numero: 'N°03',
    titulo: 'CUENTAS POR COBRAR AL PERSONAL',
    cuentas: ['14'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'documento', header: 'RUC O DNI', width: '15%', align: 'center' },
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '45%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const persona = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[persona]) {
          agrupado[persona] = {
            documento: cuenta.terceroDocumento || '',
            razonSocial: persona,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'ACTIVO');
        agrupado[persona].detalles.push({
          descripcion: cuenta.descripcion || 'A rendir',
          monto: saldo
        });
        agrupado[persona].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          documento: grupo.documento,
          razonSocial: grupo.razonSocial,
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            documento: '',
            razonSocial: `  ${detalle.descripcion}`,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°04': {
    numero: 'N°04',
    titulo: 'CUENTAS POR COBRAR ACCIONISTAS, DIRECTORES Y GERENTES',
    cuentas: ['16'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'documento', header: 'RUC O DNI', width: '15%', align: 'center' },
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '45%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const persona = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[persona]) {
          agrupado[persona] = {
            documento: cuenta.terceroDocumento || '',
            razonSocial: persona,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'ACTIVO');
        agrupado[persona].detalles.push({
          descripcion: cuenta.descripcion || 'Préstamo',
          monto: saldo
        });
        agrupado[persona].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          documento: grupo.documento,
          razonSocial: grupo.razonSocial,
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            documento: '',
            razonSocial: `  ${detalle.descripcion}`,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°05': {
    numero: 'N°05',
    titulo: 'CUENTAS POR COBRAR DIVERSAS',
    cuentas: ['18', '19'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'documento', header: 'RUC', width: '15%', align: 'center' },
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '45%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const tercero = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[tercero]) {
          agrupado[tercero] = {
            documento: cuenta.terceroDocumento || '',
            razonSocial: tercero,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'ACTIVO');
        agrupado[tercero].detalles.push({
          descripcion: cuenta.descripcion || 'Anticipo',
          monto: saldo
        });
        agrupado[tercero].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          documento: grupo.documento,
          razonSocial: grupo.razonSocial,
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            documento: '',
            razonSocial: `  ${detalle.descripcion}`,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°06': {
    numero: 'N°06',
    titulo: 'EXISTENCIAS',
    cuentas: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'],
    tipo: 'detalle_inventario',
    columnas: [
      { field: 'cantidad', header: 'CANTIDAD', width: '15%', align: 'right', tipo: 'cantidad' },
      { field: 'descripcion', header: 'DESCRIPCIÓN', width: '45%', align: 'left' },
      { field: 'costoUnitario', header: 'COSTO UNITARIO S/', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'costoTotal', header: 'COSTO TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => {
        const saldo = calcularSaldoNeto(cuenta, 'ACTIVO');
        const cantidad = cuenta.cantidad || 1;
        const costoUnitario = cantidad > 0 ? saldo / cantidad : saldo;
        
        return {
          cantidad: cantidad,
          descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
          costoUnitario: costoUnitario,
          costoTotal: saldo
        };
      });
    }
  },

  'N°07': {
    numero: 'N°07',
    titulo: 'GASTOS PAGADOS POR ANTICIPADO',
    cuentas: ['18'],
    tipo: 'detalle_simple',
    columnas: [
      { field: 'descripcion', header: 'DESCRIPCIÓN', width: '60%', align: 'left' },
      { field: 'fechaInicio', header: 'FECHA DE INICIO', width: '20%', align: 'center' },
      { field: 'importe', header: 'IMPORTE', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        fechaInicio: cuenta.fechaInicio || cuenta.periodo || '',
        importe: calcularSaldoNeto(cuenta, 'ACTIVO')
      }));
    }
  },

  'N°08': {
    numero: 'N°08',
    titulo: 'INMUEBLES, MAQUINARIA Y EQUIPO (NETO DE DEPRECIACIÓN ACUMULADA)',
    cuentas: ['33', '34'],
    tipo: 'detalle_activo_fijo',
    columnas: [
      { field: 'cantidad', header: 'CANT.', width: '8%', align: 'center' },
      { field: 'descripcion', header: 'DESCRIPCIÓN DEL ACTIVO FIJO', width: '37%', align: 'left' },
      { field: 'valorBruto', header: 'VALOR BRUTO', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'tasa', header: 'TASA %', width: '10%', align: 'center', tipo: 'porcentaje' },
      { field: 'depreciacion', header: 'DEPRECIACIÓN ACUMULADA', width: '25%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => {
        const valorBruto = Number(cuenta.saldoFinalDebe || 0);
        const depreciacion = Number(cuenta.depreciacionAcumulada || cuenta.saldoFinalHaber || 0);
        
        return {
          cantidad: cuenta.cantidad || 1,
          descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
          valorBruto: valorBruto,
          tasa: cuenta.tasaDepreciacion || 10,
          depreciacion: -depreciacion
        };
      });
    }
  },

  'N°09': {
    numero: 'N°09',
    titulo: 'OTROS ACTIVOS CORRIENTES',
    cuentas: ['39', '40'],
    tipo: 'detalle_simple',
    columnas: [
      { field: 'descripcion', header: 'DENOMINACIÓN', width: '50%', align: 'left' },
      { field: 'periodo', header: 'PERIODO', width: '20%', align: 'center' },
      { field: 'importe', header: 'IMPORTE', width: '30%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        periodo: cuenta.periodo || '',
        importe: calcularSaldoNeto(cuenta, 'ACTIVO')
      }));
    }
  },

  'N°10': {
    numero: 'N°10',
    titulo: 'TRIBUTOS Y APORTES SISTEMA DE PENSIÓN Y SALUD POR PAGAR',
    cuentas: ['40'],
    tipo: 'detalle_simple',
    columnas: [
      { field: 'descripcion', header: 'DENOMINACIÓN', width: '50%', align: 'left' },
      { field: 'periodo', header: 'PERIODO', width: '20%', align: 'center' },
      { field: 'importe', header: 'IMPORTE', width: '30%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        periodo: cuenta.periodo || '',
        importe: calcularSaldoNeto(cuenta, 'PASIVO')
      }));
    }
  },

  'N°11': {
    numero: 'N°11',
    titulo: 'REMUNERACIÓN Y PARTICIPACIÓN POR PAGAR',
    cuentas: ['41'],
    tipo: 'detalle_simple',
    columnas: [
      { field: 'descripcion', header: 'DESCRIPCIÓN', width: '50%', align: 'left' },
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '30%', align: 'left' },
      { field: 'saldo', header: 'SALDO FINAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || '',
        razonSocial: cuenta.terceroNombre || 'Varios - personal',
        saldo: calcularSaldoNeto(cuenta, 'PASIVO')
      }));
    }
  },

  'N°12': {
    numero: 'N°12',
    titulo: 'CUENTAS POR PAGAR COMERCIALES - TERCEROS',
    cuentas: ['42'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '50%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '25%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL POR PAGAR', width: '25%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const proveedor = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[proveedor]) {
          agrupado[proveedor] = {
            razonSocial: proveedor,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'PASIVO');
        agrupado[proveedor].detalles.push({
          descripcion: cuenta.descripcion || 'Facturas Varias',
          monto: saldo
        });
        agrupado[proveedor].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          razonSocial: grupo.razonSocial,
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            razonSocial: `  ${detalle.descripcion}`,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°13': {
    numero: 'N°13',
    titulo: 'CUENTAS POR PAGAR FINANCIERAS - CORTO PLAZO',
    cuentas: ['45'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '40%', align: 'left' },
      { field: 'documento', header: 'DOCUMENTO', width: '20%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const entidad = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[entidad]) {
          agrupado[entidad] = {
            razonSocial: entidad,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'PASIVO');
        agrupado[entidad].detalles.push({
          documento: cuenta.numeroDocumento || cuenta.descripcion || 'PRÉSTAMO',
          monto: saldo
        });
        agrupado[entidad].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          razonSocial: grupo.razonSocial,
          documento: '',
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            razonSocial: '',
            documento: detalle.documento,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°14': {
    numero: 'N°14',
    titulo: 'CUENTAS POR PAGAR DIVERSAS - TERCEROS - CORTO PLAZO',
    cuentas: ['46', '47'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '40%', align: 'left' },
      { field: 'documento', header: 'DOCUMENTO', width: '20%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const tercero = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[tercero]) {
          agrupado[tercero] = {
            razonSocial: tercero,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'PASIVO');
        agrupado[tercero].detalles.push({
          documento: cuenta.descripcion || 'Habilitación',
          monto: saldo
        });
        agrupado[tercero].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          razonSocial: grupo.razonSocial,
          documento: '',
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            razonSocial: '',
            documento: detalle.documento,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°15': {
    numero: 'N°15',
    titulo: 'CUENTAS POR PAGAR FINANCIERAS Y DIVERSAS - TERCEROS - LARGO PLAZO',
    cuentas: ['45', '46', '47'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '40%', align: 'left' },
      { field: 'documento', header: 'DOCUMENTO', width: '20%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      const agrupado = {};
      
      cuentas.forEach(cuenta => {
        const entidad = cuenta.terceroNombre || cuenta.nombreCuenta || 'VARIOS';
        if (!agrupado[entidad]) {
          agrupado[entidad] = {
            razonSocial: entidad,
            detalles: [],
            total: 0
          };
        }
        
        const saldo = calcularSaldoNeto(cuenta, 'PASIVO');
        agrupado[entidad].detalles.push({
          documento: cuenta.descripcion || 'PAGARÉ GARANTÍA',
          monto: saldo
        });
        agrupado[entidad].total += saldo;
      });

      const resultado = [];
      Object.values(agrupado).forEach(grupo => {
        resultado.push({
          razonSocial: grupo.razonSocial,
          documento: '',
          subTotal: null,
          total: grupo.total,
          esGrupo: true
        });
        
        grupo.detalles.forEach(detalle => {
          resultado.push({
            razonSocial: '',
            documento: detalle.documento,
            subTotal: detalle.monto,
            total: null,
            esDetalle: true
          });
        });
      });

      return resultado;
    }
  },

  'N°16': {
    numero: 'N°16',
    titulo: 'CAPITAL',
    cuentas: ['50'],
    tipo: 'detalle_capital',
    columnas: [
      { field: 'documento', header: 'DOC. DE IDENTIDAD Nº', width: '15%', align: 'center' },
      { field: 'razonSocial', header: 'APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL', width: '40%', align: 'left' },
      { field: 'tipoAcciones', header: 'TIPO DE ACCIONES', width: '15%', align: 'center' },
      { field: 'numeroAcciones', header: 'NÚMERO DE ACCIONES', width: '15%', align: 'right', tipo: 'cantidad' },
      { field: 'porcentaje', header: 'PORCENTAJE', width: '15%', align: 'right', tipo: 'porcentaje' }
    ],
    procesarDatos: (cuentas) => {
      const totalCapital = cuentas.reduce((sum, c) => sum + calcularSaldoNeto(c, 'PATRIMONIO'), 0);
      
      return cuentas.map(cuenta => {
        const saldo = calcularSaldoNeto(cuenta, 'PATRIMONIO');
        const porcentaje = totalCapital > 0 ? (saldo / totalCapital) * 100 : 0;
        
        return {
          documento: cuenta.terceroDocumento || '',
          razonSocial: cuenta.terceroNombre || cuenta.nombreCuenta || '',
          tipoAcciones: 'nominales',
          numeroAcciones: saldo,
          porcentaje: porcentaje
        };
      });
    },
    encabezadoAdicional: (cuentas) => {
      const totalCapital = cuentas.reduce((sum, c) => sum + calcularSaldoNeto(c, 'PATRIMONIO'), 0);
      return {
        capitalSocial: totalCapital,
        valorNominal: 1.00,
        numeroAccionesSuscritas: totalCapital,
        numeroAccionesPagadas: totalCapital,
        numeroAccionistas: cuentas.length
      };
    }
  },

  'N°17': {
    numero: 'N°17',
    titulo: 'EXCEDENTE DE REVALUACIÓN',
    cuentas: ['57'],
    tipo: 'detalle_activo_fijo',
    columnas: [
      { field: 'cantidad', header: 'CANT.', width: '8%', align: 'center' },
      { field: 'descripcion', header: 'DESCRIPCIÓN DEL ACTIVO FIJO', width: '47%', align: 'left' },
      { field: 'excedente', header: 'IMPORTE DEL EXCEDENTE REVALUACIÓN', width: '25%', align: 'right', tipo: 'monto' },
      { field: 'fechaTasacion', header: 'FECHA DE TASACIÓN', width: '20%', align: 'center' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        cantidad: cuenta.cantidad || 1,
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        excedente: calcularSaldoNeto(cuenta, 'PATRIMONIO'),
        fechaTasacion: cuenta.fechaTasacion || cuenta.fecha || ''
      }));
    }
  },

  'N°18': {
    numero: 'N°18',
    titulo: 'UTILIDAD DEL EJERCICIO',
    cuentas: ['59'],
    tipo: 'detalle_simple',
    columnas: [
      { field: 'descripcion', header: 'DESCRIPCIÓN', width: '60%', align: 'left' },
      { field: 'periodo', header: 'PERIODO', width: '20%', align: 'center' },
      { field: 'importe', header: 'IMPORTE', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      return cuentas.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || 'Utilidad del ejercicio',
        periodo: cuenta.periodo || '',
        importe: calcularSaldoNeto(cuenta, 'PATRIMONIO')
      }));
    }
  }
};

/**
 * Función auxiliar para calcular saldo neto según tipo de cuenta
 */
function calcularSaldoNeto(cuenta, tipoCuenta) {
  const debe = Number(cuenta.saldoFinalDebe || 0);
  const haber = Number(cuenta.saldoFinalHaber || 0);
  
  if (tipoCuenta === 'ACTIVO') {
    return debe - haber;
  } else {
    return haber - debe;
  }
}

/**
 * Obtiene la configuración de un anexo por su número
 */
export function getAnexoConfig(numeroAnexo) {
  return ANEXOS_CONFIG[numeroAnexo] || null;
}

/**
 * Obtiene todas las cuentas que pertenecen a un anexo
 */
export function getCuentasParaAnexo(numeroAnexo, todasLasCuentas) {
  const config = getAnexoConfig(numeroAnexo);
  if (!config) return [];
  
  return todasLasCuentas.filter(cuenta => {
    const codigoClase = cuenta.codigoCuenta.substring(0, 2);
    return config.cuentas.includes(codigoClase);
  });
}

/**
 * Procesa los datos de un anexo según su configuración
 */
export function procesarDatosAnexo(numeroAnexo, cuentas) {
  const config = getAnexoConfig(numeroAnexo);
  if (!config || !config.procesarDatos) return [];
  
  return config.procesarDatos(cuentas);
}

/**
 * Lista de todos los anexos disponibles en orden
 */
export const ANEXOS_DISPONIBLES = [
  'N°01', 'N°02', 'N°03', 'N°04', 'N°05', 'N°06', 'N°07', 'N°08', 'N°09',
  'N°10', 'N°11', 'N°12', 'N°13', 'N°14', 'N°15', 'N°16', 'N°17', 'N°18'
];
