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

  /**
   * ANEXO N°04: CUENTAS POR COBRAR ACCIONISTAS, DIRECTORES Y GERENTES
   * 
   * IMPORTANTE - CUENTA 16 EXCEPTO 1624:
   * -------------------------------------
   * Este anexo debe mostrar la cuenta 16 EXCEPTO la subcuenta 1624 (Depósitos en Garantía)
   * porque la cuenta 1624 ya está incluida en el Anexo N°09.
   * 
   * SUBCUENTAS INCLUIDAS:
   * • 161 - Préstamos
   * • 162 - Reclamaciones a terceros (EXCEPTO 1624)
   *   - 1621 - Letras por cobrar
   *   - 1622 - Anticipos de contratos
   *   - 1623 - Adelantos al personal
   * • 163 - Intereses, regalías y dividendos
   * • 169 - Otras cuentas por cobrar diversas
   * 
   * SUBCUENTA EXCLUIDA:
   * • 1624 - Depósitos en Garantía ← YA EN ANEXO N°09
   */
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
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR CUENTA 16 EXCEPTO SUBCUENTA 1624
      // ═══════════════════════════════════════════════════════════════════════
      const cuentasFiltradas = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        
        // Incluir todas las cuentas que empiecen con 16
        if (!codigoCuenta.startsWith('16')) {
          return false;
        }
        
        // EXCLUIR la subcuenta 1624 (ya está en Anexo N°09)
        if (codigoCuenta.startsWith('1624')) {
          return false;
        }
        
        // Incluir todas las demás subcuentas de la cuenta 16
        return true;
      });
      
      const agrupado = {};
      
      cuentasFiltradas.forEach(cuenta => {
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

  /**
   * ANEXO N°08: INMUEBLES, MAQUINARIA Y EQUIPO (NETO DE DEPRECIACIÓN)
   * 
   * LÓGICA ESPECIAL:
   * ----------------
   * Este anexo muestra el cálculo del VALOR NETO de los activos fijos:
   * 
   * VALOR NETO = CUENTA 33 (Costo Histórico) - CUENTA 39 (Depreciación Acumulada)
   * 
   * Columnas:
   * 1. Descripción: Nombre del activo fijo
   * 2. Costo Histórico (Cuenta 33): Valor de adquisición - SE SUMA
   * 3. Depreciación Acumulada (Cuenta 39): Desgaste acumulado - SE RESTA
   * 4. Valor Neto: Resultado de (Cuenta 33 - Cuenta 39)
   * 
   * Ejemplo:
   *   Edificaciones (33): S/ 780,847.93
   *   Deprec. Edif. (39): S/ 150,000.00
   *   Valor Neto:         S/ 630,847.93
   */
  'N°08': {
    numero: 'N°08',
    titulo: 'INMUEBLES, MAQUINARIA Y EQUIPO (NETO DE DEPRECIACIÓN ACUMULADA)',
    cuentas: ['33'],  // Solo cuenta 33 (costo histórico)
    cuentasRestar: ['39'],  // Cuenta 39 (depreciación acumulada) - SE RESTA
    tipo: 'detalle_activo_fijo_neto',
    columnas: [
      { field: 'descripcion', header: 'DESCRIPCIÓN DEL ACTIVO FIJO', width: '40%', align: 'left' },
      { field: 'costoHistorico', header: 'COSTO HISTÓRICO (Cta 33)', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'depreciacionAcumulada', header: 'DEPRECIACIÓN ACUM. (Cta 39)', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'valorNeto', header: 'VALOR NETO (33 - 39)', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas, todasLasCuentas) => {
      // Agrupar por tipo de activo (subcuentas de nivel 3)
      const agrupado = {};
      
      // PASO 1: Procesar cuentas 33 (Costo Histórico)
      cuentas.forEach(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        const subcuenta = codigoCuenta.substring(0, 3); // Ej: 331, 332, 333
        const nombreActivo = cuenta.nombreCuenta || cuenta.descripcion || 'Sin descripción';
        
        if (!agrupado[subcuenta]) {
          agrupado[subcuenta] = {
            descripcion: nombreActivo,
            costoHistorico: 0,
            depreciacionAcumulada: 0,
            valorNeto: 0
          };
        }
        
        // Sumar costo histórico (debe - haber de cuenta 33)
        const debe = Number(cuenta.saldoFinalDebe || 0);
        const haber = Number(cuenta.saldoFinalHaber || 0);
        agrupado[subcuenta].costoHistorico += (debe - haber);
      });
      
      // PASO 2: Procesar cuentas 39 (Depreciación Acumulada)
      if (todasLasCuentas) {
        const cuentas39 = todasLasCuentas.filter(c => {
          const codigo = c.codigoCuenta || '';
          return codigo.startsWith('39');
        });
        
        cuentas39.forEach(cuenta => {
          const codigoCuenta = cuenta.codigoCuenta || '';
          // Mapear 391X a 33X (ej: 3912 -> 332)
          const subcuentaRelacionada = '33' + codigoCuenta.charAt(3);
          
          if (agrupado[subcuentaRelacionada]) {
            // Depreciación acumulada tiene naturaleza acreedora (haber - debe)
            const debe = Number(cuenta.saldoFinalDebe || 0);
            const haber = Number(cuenta.saldoFinalHaber || 0);
            agrupado[subcuentaRelacionada].depreciacionAcumulada += (haber - debe);
          }
        });
      }
      
      // PASO 3: Calcular valor neto y convertir a array
      const resultado = Object.keys(agrupado)
        .sort()
        .map(subcuenta => {
          const item = agrupado[subcuenta];
          item.valorNeto = item.costoHistorico - item.depreciacionAcumulada;
          return item;
        })
        .filter(item => Math.abs(item.costoHistorico) >= 0.01); // Solo mostrar si tiene costo
      
      return resultado;
    }
  },

  /**
   * ANEXO N°09: OTROS ACTIVOS NO CORRIENTES
   * 
   * IMPORTANTE - SOLO CUENTA 1624:
   * --------------------------------
   * Este anexo debe mostrar ÚNICAMENTE la cuenta 1624 (Depósitos en Garantía).
   * 
   * Cuenta 1624: Depósitos en Garantía
   * - Subcuenta de la cuenta 16 (Cuentas por Cobrar Diversas - Terceros)
   * - Representa: Depósitos entregados como garantía (alquileres, servicios, etc.)
   * - Naturaleza: DEUDORA (Activo)
   * - Clasificación: ACTIVO NO CORRIENTE (largo plazo)
   * 
   * Ejemplo:
   *   Depósito en garantía por alquiler de local: S/ 10,000.00
   *   Depósito en garantía por servicios:        S/  5,000.00
   *   TOTAL ANEXO N°09:                          S/ 15,000.00
   * 
   * NOTA: Otras cuentas de activos no corrientes (34, 35, 36, 37, 38) NO se incluyen
   * en este anexo, solo la cuenta 1624.
   */
  'N°09': {
    numero: 'N°09',
    titulo: 'OTROS ACTIVOS NO CORRIENTES - DEPÓSITOS EN GARANTÍA',
    cuentas: ['16'],  // Cuenta 16, pero filtraremos solo 1624 en procesarDatos
    tipo: 'detalle_depositos_garantia',
    columnas: [
      { field: 'descripcion', header: 'DENOMINACIÓN', width: '50%', align: 'left' },
      { field: 'tercero', header: 'TERCERO / ENTIDAD', width: '30%', align: 'left' },
      { field: 'importe', header: 'IMPORTE', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR SOLO CUENTA 1624 (Depósitos en Garantía)
      // ═══════════════════════════════════════════════════════════════════════
      const cuentas1624 = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        // Solo incluir cuentas que empiecen con 1624
        return codigoCuenta.startsWith('1624');
      });
      
      // Si no hay cuentas 1624, retornar array vacío
      if (cuentas1624.length === 0) return [];
      
      // Mapear cuentas 1624 a formato del anexo
      return cuentas1624.map(cuenta => ({
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || 'Depósito en Garantía',
        tercero: cuenta.terceroNombre || 'No especificado',
        importe: calcularSaldoNeto(cuenta, 'ACTIVO')
      }));
    }
  },

  /**
   * ANEXO N°10: TRIBUTOS, APORTES Y REMUNERACIONES POR PAGAR
   * 
   * CUENTAS INCLUIDAS:
   * ------------------
   * 1. CUENTA 40 (COMPLETA): Tributos, Contraprestaciones y Aportes al Sistema 
   *    de Pensiones y de Salud por Pagar
   *    - 401: Gobierno central (IGV, IR, etc.)
   *    - 403: Instituciones públicas (ESSALUD, ONP, etc.)
   *    - 405: Gobiernos locales (Impuesto predial, arbitrios, etc.)
   *    - 407: Administradoras de fondos de pensiones (AFP)
   *    - 408: Empresas prestadoras de servicios de salud (EPS)
   *    - 409: Otros costos administrativos e intereses
   * 
   * 2. CUENTA 4171: Remuneraciones por pagar
   *    - Subcuenta de la cuenta 41 (Remuneraciones y Participaciones por Pagar)
   *    - Representa: Sueldos y salarios pendientes de pago al personal
   *    - Se incluye SOLO la subcuenta 4171, no toda la cuenta 41
   * 
   * NATURALEZA: PASIVO CORRIENTE (Acreedora)
   * 
   * Ejemplo:
   *   IGV por pagar (401):                S/ 50,000.00
   *   ESSALUD por pagar (403):            S/ 15,000.00
   *   AFP por pagar (407):                S/ 10,000.00
   *   Remuneraciones por pagar (4171):    S/ 80,000.00
   *   TOTAL ANEXO N°10:                   S/ 155,000.00
   */
  'N°10': {
    numero: 'N°10',
    titulo: 'TRIBUTOS, APORTES AL SISTEMA DE PENSIONES Y SALUD, Y REMUNERACIONES POR PAGAR',
    cuentas: ['40', '41'],  // Cuenta 40 completa + Cuenta 41 (se filtrará solo 4171)
    tipo: 'detalle_tributos_remuneraciones',
    columnas: [
      { field: 'codigoCuenta', header: 'CÓDIGO', width: '12%', align: 'center' },
      { field: 'descripcion', header: 'DENOMINACIÓN', width: '48%', align: 'left' },
      { field: 'periodo', header: 'PERIODO', width: '15%', align: 'center' },
      { field: 'importe', header: 'IMPORTE', width: '25%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR CUENTAS:
      // - Toda la cuenta 40 (sin filtros)
      // - Solo la subcuenta 4171 de la cuenta 41
      // ═══════════════════════════════════════════════════════════════════════
      const cuentasFiltradas = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        
        // Incluir toda la cuenta 40
        if (codigoCuenta.startsWith('40')) {
          return true;
        }
        
        // Incluir SOLO la subcuenta 4171 (Remuneraciones por pagar)
        if (codigoCuenta.startsWith('4171')) {
          return true;
        }
        
        // Excluir cualquier otra cuenta
        return false;
      });
      
      // Mapear cuentas filtradas a formato del anexo
      return cuentasFiltradas.map(cuenta => ({
        codigoCuenta: cuenta.codigoCuenta || '',
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        periodo: cuenta.periodo || formatearPeriodo(cuenta),
        importe: calcularSaldoNeto(cuenta, 'PASIVO')
      }));
    }
  },

  /**
   * ANEXO N°11: OTRAS REMUNERACIONES Y PARTICIPACIONES POR PAGAR
   * 
   * IMPORTANTE - CUENTA 41 COMPLETA EXCEPTO 4171:
   * ----------------------------------------------
   * Este anexo debe mostrar TODA la cuenta 41 EXCEPTO la subcuenta 4171
   * (que ya fue incluida en el Anexo N°10).
   * 
   * SUBCUENTAS INCLUIDAS EN ESTE ANEXO:
   * ------------------------------------
   * • 411 - Remuneraciones por pagar:
   *   - 4111: Sueldos y salarios por pagar
   *   - 4119: Otras remuneraciones por pagar
   * 
   * • 413 - Participaciones de los trabajadores por pagar:
   *   - Participación en las utilidades (8% o 10% según ley)
   *   - Se paga anualmente después del cierre del ejercicio
   * 
   * • 415 - Beneficios sociales de los trabajadores por pagar:
   *   - 4151: Compensación por Tiempo de Servicios (CTS)
   *   - 4152: Adelanto de CTS
   *   - 4153: Pensiones y jubilaciones
   * 
   * • 417 - Otras remuneraciones y participaciones por pagar:
   *   - 4179: Otras remuneraciones (NO incluye 4171)
   * 
   * • 419 - Otras remuneraciones y participaciones por pagar
   * 
   * SUBCUENTA EXCLUIDA:
   * -------------------
   * • 4171 - Remuneraciones por pagar ← YA INCLUIDA EN ANEXO N°10
   * 
   * NATURALEZA: PASIVO CORRIENTE (Acreedora)
   * 
   * Ejemplo:
   *   CTS por pagar (4151):              S/ 25,000.00
   *   Participaciones por pagar (413):   S/ 15,000.00
   *   Gratificaciones por pagar (4111):  S/ 30,000.00
   *   Vacaciones por pagar (4119):       S/ 10,000.00
   *   TOTAL ANEXO N°11:                  S/ 80,000.00
   * 
   * NOTA: La cuenta 4171 NO aparece aquí porque ya está en el Anexo N°10
   * junto con los tributos y aportes del mes.
   */
  'N°11': {
    numero: 'N°11',
    titulo: 'OTRAS REMUNERACIONES Y PARTICIPACIONES POR PAGAR',
    cuentas: ['41'],  // Cuenta 41 completa, se filtrará para excluir 4171
    tipo: 'detalle_remuneraciones_participaciones',
    columnas: [
      { field: 'codigoCuenta', header: 'CÓDIGO', width: '12%', align: 'center' },
      { field: 'descripcion', header: 'DESCRIPCIÓN', width: '48%', align: 'left' },
      { field: 'beneficiario', header: 'BENEFICIARIO / PERSONAL', width: '25%', align: 'left' },
      { field: 'saldo', header: 'SALDO FINAL', width: '15%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR CUENTA 41 COMPLETA EXCEPTO SUBCUENTA 4171
      // ═══════════════════════════════════════════════════════════════════════
      const cuentasFiltradas = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        
        // Incluir todas las cuentas que empiecen con 41
        if (!codigoCuenta.startsWith('41')) {
          return false;
        }
        
        // EXCLUIR la subcuenta 4171 (ya está en Anexo N°10)
        if (codigoCuenta.startsWith('4171')) {
          return false;
        }
        
        // Incluir todas las demás subcuentas de la cuenta 41
        return true;
      });
      
      // Mapear cuentas filtradas a formato del anexo
      return cuentasFiltradas.map(cuenta => ({
        codigoCuenta: cuenta.codigoCuenta || '',
        descripcion: cuenta.nombreCuenta || cuenta.descripcion || '',
        beneficiario: cuenta.terceroNombre || cuenta.trabajadorNombre || 'Personal - Varios',
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

  /**
   * ANEXO N°13: CUENTAS POR PAGAR FINANCIERAS - CORTO PLAZO
   * 
   * CUENTA INCLUIDA:
   * ----------------
   * • CUENTA 45 COMPLETA: Obligaciones Financieras
   *   - 451: Préstamos de instituciones financieras
   *   - 452: Contratos de arrendamiento financiero
   *   - 453: Obligaciones emitidas
   *   - 454: Otros instrumentos financieros por pagar
   *   - 455: Costos de financiación por pagar
   * 
   * NATURALEZA: PASIVO CORRIENTE (Acreedora)
   */
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

  /**
   * ANEXO N°14: CUENTAS POR PAGAR DIVERSAS - TERCEROS - CORTO PLAZO
   * 
   * CUENTAS INCLUIDAS:
   * ------------------
   * 1. CUENTA 46 COMPLETA: Cuentas por Pagar Diversas - Terceros
   *    (EXCEPTO 469904 que va en Anexo N°15)
   * 
   * 2. CUENTA 469903: Subcuenta específica incluida
   * 
   * NATURALEZA: PASIVO CORRIENTE (Acreedora)
   */
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
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR CUENTAS:
      // - Toda la cuenta 46 (incluye 469903)
      // - Toda la cuenta 47
      // - EXCLUIR 469904 (va en Anexo N°15)
      // ═══════════════════════════════════════════════════════════════════════
      const cuentasFiltradas = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        
        // EXCLUIR 469904 (va en Anexo N°15)
        if (codigoCuenta.startsWith('469904')) {
          return false;
        }
        
        // Incluir todo lo demás
        return true;
      });
      
      const agrupado = {};
      
      cuentasFiltradas.forEach(cuenta => {
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

  /**
   * ANEXO N°15: CUENTAS POR PAGAR DIVERSAS - LARGO PLAZO
   * 
   * IMPORTANTE - SOLO CUENTA 469904:
   * ---------------------------------
   * Este anexo debe mostrar ÚNICAMENTE la cuenta 469904.
   * 
   * Cuenta 469904: Subcuenta específica de largo plazo
   * - Parte de la cuenta 4699 (Otras cuentas por pagar diversas)
   * - Representa: Obligaciones de largo plazo con terceros
   * - Naturaleza: ACREEDORA (Pasivo)
   * - Clasificación: PASIVO NO CORRIENTE (largo plazo)
   * 
   * NOTA: El resto de la cuenta 46 está en el Anexo N°14
   */
  'N°15': {
    numero: 'N°15',
    titulo: 'CUENTAS POR PAGAR DIVERSAS - TERCEROS - LARGO PLAZO',
    cuentas: ['4699'],
    tipo: 'detalle_agrupado',
    columnas: [
      { field: 'razonSocial', header: 'DENOMINACIÓN O RAZÓN SOCIAL', width: '40%', align: 'left' },
      { field: 'documento', header: 'DOCUMENTO', width: '20%', align: 'left' },
      { field: 'subTotal', header: 'SUB TOTAL', width: '20%', align: 'right', tipo: 'monto' },
      { field: 'total', header: 'TOTAL', width: '20%', align: 'right', tipo: 'monto' }
    ],
    procesarDatos: (cuentas) => {
      // ═══════════════════════════════════════════════════════════════════════
      // FILTRAR SOLO CUENTA 469904
      // ═══════════════════════════════════════════════════════════════════════
      const cuentasFiltradas = cuentas.filter(cuenta => {
        const codigoCuenta = cuenta.codigoCuenta || '';
        // Solo incluir cuentas que empiecen con 469904
        return codigoCuenta.startsWith('469904');
      });
      
      const agrupado = {};
      
      cuentasFiltradas.forEach(cuenta => {
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
 * Función auxiliar para formatear el periodo de una cuenta
 * Intenta extraer el periodo de diferentes campos posibles
 */
function formatearPeriodo(cuenta) {
  // Si tiene campo periodo, usarlo
  if (cuenta.periodo) return cuenta.periodo;
  
  // Si tiene fecha, extraer mes/año
  if (cuenta.fecha) {
    try {
      const fecha = new Date(cuenta.fecha);
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const año = fecha.getFullYear();
      return `${mes}/${año}`;
    } catch (e) {
      return '';
    }
  }
  
  // Si tiene mes y año por separado
  if (cuenta.mes && cuenta.año) {
    const mes = String(cuenta.mes).padStart(2, '0');
    return `${mes}/${cuenta.año}`;
  }
  
  return '';
}

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
 * 
 * @param {string} numeroAnexo - Número del anexo (ej: 'N°08')
 * @param {Array} cuentas - Cuentas filtradas para este anexo
 * @param {Array} todasLasCuentas - TODAS las cuentas disponibles (para anexos que necesitan cuentas relacionadas)
 * @returns {Array} - Datos procesados según la configuración del anexo
 */
export function procesarDatosAnexo(numeroAnexo, cuentas, todasLasCuentas = null) {
  const config = getAnexoConfig(numeroAnexo);
  if (!config || !config.procesarDatos) return [];
  
  // Para el Anexo N°08, pasar todas las cuentas para poder acceder a la cuenta 39
  if (numeroAnexo === 'N°08' && todasLasCuentas) {
    return config.procesarDatos(cuentas, todasLasCuentas);
  }
  
  return config.procesarDatos(cuentas);
}

/**
 * Lista de todos los anexos disponibles en orden
 */
export const ANEXOS_DISPONIBLES = [
  'N°01', 'N°02', 'N°03', 'N°04', 'N°05', 'N°06', 'N°07', 'N°08', 'N°09',
  'N°10', 'N°11', 'N°12', 'N°13', 'N°14', 'N°15', 'N°16', 'N°17', 'N°18'
];
