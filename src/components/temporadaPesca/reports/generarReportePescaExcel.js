// src/components/temporadaPesca/reports/generarReportePescaExcel.js
import ExcelJS from 'exceljs';

/**
 * Función helper para generar todas las fechas entre dos fechas
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Array<Date>} Array de fechas
 */
function generarRangoFechas(fechaInicio, fechaFin) {
  const fechas = [];
  const fechaActual = new Date(fechaInicio);
  fechaActual.setHours(0, 0, 0, 0);

  const fechaLimite = new Date(fechaFin);
  fechaLimite.setHours(0, 0, 0, 0);

  while (fechaActual <= fechaLimite) {
    fechas.push(new Date(fechaActual));
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return fechas;
}

/**
 * Función helper para comparar si dos fechas son del mismo día
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {boolean}
 */
function esMismoDia(fecha1, fecha2) {
  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);
  return (
    f1.getFullYear() === f2.getFullYear() &&
    f1.getMonth() === f2.getMonth() &&
    f1.getDate() === f2.getDate()
  );
}

export async function generarReportePescaExcel(data) {
  const { temporada, cuotas, descargas, diasSinFaena = [] } = data;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte Pesca');

  worksheet.views = [{ showGridLines: false }];

  // ⭐ AJUSTAR ANCHOS DE COLUMNAS (11 columnas ahora)
  worksheet.getColumn(1).width = 5;    // N°
  worksheet.getColumn(2).width = 18;   // Fecha I/D (nueva)
  worksheet.getColumn(3).width = 12;   // Especie
  worksheet.getColumn(4).width = 30;   // Cliente
  worksheet.getColumn(5).width = 14;   // Puerto
  worksheet.getColumn(6).width = 16;   // Plataforma
  worksheet.getColumn(7).width = 20;   // Observaciones (ampliada para días sin faena)
  worksheet.getColumn(8).width = 12;   // Reporte
  worksheet.getColumn(9).width = 14;   // Petroleo Gal.
  worksheet.getColumn(10).width = 10;  // Toneladas (reducida)
  worksheet.getColumn(11).width = 12;  // % Juveniles

  const TOTAL_COLS = 11;
  const lastCol = 'K';

  let currentRow = 1;

  const noBorder = {
    top: { style: 'none' }, left: { style: 'none' },
    bottom: { style: 'none' }, right: { style: 'none' }
  };

  const borderCeleste = {
    top: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    left: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    bottom: { style: 'thin', color: { argb: 'FF8EC8DA' } },
    right: { style: 'thin', color: { argb: 'FF8EC8DA' } }
  };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };

  const fillCeleste = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } };
  const fillNone = { type: 'pattern', pattern: 'none' };

  const limpiarFila = (row) => {
    for (let i = 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(row, i);
      cell.border = noBorder;
      cell.fill = fillNone;
      cell.value = null;
    }
  };

  // ─── ENCABEZADO EMPRESA ───────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const empresaCell = worksheet.getCell(`A${currentRow}`);
  empresaCell.value = temporada.empresa?.razonSocial || "EMPRESA";
  empresaCell.font = { bold: true, size: 12 };
  empresaCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const rucCell = worksheet.getCell(`A${currentRow}`);
  rucCell.value = `RUC: ${temporada.empresa?.ruc || "-"}`;
  rucCell.font = { size: 10 };
  rucCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 16;
  currentRow++;

  if (temporada.empresa?.direccion) {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const dirCell = worksheet.getCell(`A${currentRow}`);
    dirCell.value = `Dirección: ${temporada.empresa.direccion}`;
    dirCell.font = { size: 10 };
    dirCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  }

  currentRow++;

  // ─── TÍTULO ───────────────────────────────────────────────────────
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const tituloCell = worksheet.getCell(`A${currentRow}`);
  tituloCell.value = "REPORTE DE PESCA INDUSTRIAL";
  tituloCell.font = { bold: true, size: 12 };
  tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tituloCell.border = noBorder;
  worksheet.getRow(currentRow).height = 20;
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  const nombreCell = worksheet.getCell(`A${currentRow}`);
  nombreCell.value = temporada.nombre || "TEMPORADA";
  nombreCell.font = { bold: true, size: 16 };
  nombreCell.alignment = { horizontal: 'center', vertical: 'middle' };
  nombreCell.border = noBorder;
  worksheet.getRow(currentRow).height = 26;
  currentRow++;

  currentRow++;

  // ─── TABLA CUOTAS ─────────────────────────────────────────────────
  const cuotaHeadersData = ["N°", "Zona", "Tipo Cuota", "Nombre", "Estado Op.", "Precio/Ton", "PMCE (%)"];
  cuotaHeadersData.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.mergeCells(currentRow, 8, currentRow, 11);
  const limiteTonHeader = worksheet.getCell(currentRow, 8);
  limiteTonHeader.value = "Limite Ton.";
  limiteTonHeader.font = { bold: true, size: 8 };
  limiteTonHeader.fill = fillCeleste;
  limiteTonHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  limiteTonHeader.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  const limiteMaximo = Number(temporada.limiteMaximoCapturaTn || 0);
  let totalCalculado = 0;

  cuotas.forEach((cuota, index) => {
    const porcentaje = Number(cuota.porcentajeCuota || 0);
    const limiteTon = (porcentaje / 100) * limiteMaximo;
    totalCalculado += limiteTon;

    const rowData = [
      index + 1,
      cuota.zona || "-",
      cuota.cuotaPropia ? "PROPIA" : "ALQUILADA",
      cuota.nombre || "-",
      cuota.esAlquiler ? "ALQUILER" : "PESCA",
      Number(cuota.precioPorTonDolares || 0),
      porcentaje
    ];

    const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';
    rowData.forEach((value, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 1);
      cell.value = value;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = borderThin;
      cell.font = { size: 8 };
      if (colIndex === 0 || colIndex === 1 || colIndex === 2 || colIndex === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colIndex === 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colIndex === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
      } else if (colIndex === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.000000';
      }
    });
    worksheet.mergeCells(currentRow, 8, currentRow, 11);
    const limiteTonCell = worksheet.getCell(currentRow, 8);
    limiteTonCell.value = limiteTon;
    limiteTonCell.numFmt = '#,##0.000';
    limiteTonCell.font = { size: 8 };
    limiteTonCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    limiteTonCell.alignment = { horizontal: 'right', vertical: 'middle' };
    limiteTonCell.border = borderThin;
    worksheet.getRow(currentRow).height = 16;
    currentRow++;
  });

  // Fila TOTAL cuotas celeste
  for (let i = 1; i <= 7; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillCeleste;
    cell.font = { bold: true, size: 8 };
    cell.border = borderCeleste;
    cell.value = i === 7 ? "TOTAL" : "";
    if (i === 7) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  worksheet.mergeCells(currentRow, 8, currentRow, 11);
  const totalCuotaCell = worksheet.getCell(currentRow, 8);
  totalCuotaCell.value = totalCalculado;
  totalCuotaCell.numFmt = '#,##0.000';
  totalCuotaCell.font = { bold: true, size: 8 };
  totalCuotaCell.fill = fillCeleste;
  totalCuotaCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalCuotaCell.border = borderCeleste;
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO SALDO CUOTA ───────────────────────────────────────────
  const rowSaldo = worksheet.getRow(currentRow);
  rowSaldo.height = 22;
  for (let i = 1; i <= TOTAL_COLS; i++) { rowSaldo.getCell(i).style = {}; }
  worksheet.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
  const saldoTituloCell = rowSaldo.getCell(1);
  saldoTituloCell.style = {
    font: { bold: true, size: 13 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  saldoTituloCell.value = `SALDO CUOTA ${temporada.nombre || ""}`;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── CUADRO RESUMEN ───────────────────────────────────────────────
  const avanceTotal = (descargas ?? []).reduce((sum, d) => sum + Number(d.toneladas || 0), 0);
  const saldoTotal = totalCalculado - avanceTotal;
  const porcentajeAvanzado = totalCalculado > 0 ? (avanceTotal / totalCalculado) * 100 : 0;

  // Headers resumen: A-D celeste, E-K limpias
  const resumenHeaders = ["Cuota Total", "Avance", "Saldo", "% Avanzado"];
  resumenHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.fill = fillCeleste;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  for (let i = 5; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Datos resumen: A-D con borde, E-K limpias
  const resumenData = [
    { val: totalCalculado, fmt: '#,##0.000 "Ton."' },
    { val: avanceTotal, fmt: '#,##0.000 "Ton."' },
    { val: saldoTotal, fmt: '#,##0.000 "Ton."' },
    { val: porcentajeAvanzado / 100, fmt: '0.00%' }
  ];
  resumenData.forEach(({ val, fmt }, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = val;
    cell.numFmt = fmt;
    cell.font = { size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  });
  for (let i = 5; i <= TOTAL_COLS; i++) {
    const cell = worksheet.getCell(currentRow, i);
    cell.fill = fillNone;
    cell.border = noBorder;
    cell.value = null;
  }
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 10;
  currentRow++;

  // ─── TÍTULO DETALLE DESCARGA ──────────────────────────────────────
  const rowDetalle = worksheet.getRow(currentRow);
  rowDetalle.height = 22;
  for (let i = 1; i <= TOTAL_COLS; i++) { rowDetalle.getCell(i).style = {}; }
  worksheet.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
  const detalleTituloCell = rowDetalle.getCell(1);
  detalleTituloCell.style = {
    font: { bold: true, size: 13 },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  detalleTituloCell.value = "DETALLE DE DESCARGA EN TN";
  currentRow++;

  // Fila vacía limpia
  limpiarFila(currentRow);
  worksheet.getRow(currentRow).height = 6;
  currentRow++;

  // ─── HEADERS TABLA DESCARGA ───────────────────────────────────────
  const descargaHeaders = ["N°", "Fecha I/D", "Especie", "Cliente", "Puerto", "Plataforma", "Observaciones", "Reporte", "Petroleo Gal.", "Toneladas", "% Juveniles"];
  descargaHeaders.forEach((header, i) => {
    const cell = worksheet.getCell(currentRow, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 8 };
    cell.fill = fillCeleste;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderCeleste;
  });
  worksheet.getRow(currentRow).height = 18;
  currentRow++;

  // ⭐ NUEVA LÓGICA: Generar array agrupado por faena (carga inicial + descargas + días sin faena)
  let registrosCompletos = [];

  const { faenas } = data;

  // ⭐ PASO 1: Agrupar descargas por faenaPescaId
  const descargasPorFaena = {};
  if (descargas && descargas.length > 0) {
    descargas.forEach((descarga) => {
      const faenaId = descarga.faenaPescaId;
      if (!descargasPorFaena[faenaId]) {
        descargasPorFaena[faenaId] = [];
      }
      descargasPorFaena[faenaId].push(descarga);
    });
  }

  // ⭐ PASO 2: Ordenar faenas por fechaSalida (ascendente - más antigua primero)
  const faenasOrdenadas =
    faenas && faenas.length > 0
      ? [...faenas].sort((a, b) => {
          const fechaA = a.fechaSalida ? new Date(a.fechaSalida) : new Date(0);
          const fechaB = b.fechaSalida ? new Date(b.fechaSalida) : new Date(0);
          return fechaA - fechaB;
        })
      : [];

  // ⭐ PASO 3: Para cada faena, agregar carga inicial (si existe) + sus descargas
  if (faenasOrdenadas.length > 0) {
    faenasOrdenadas.forEach((faena) => {
      // 3.1: Agregar carga inicial si tiene combustible > 0
      if (
        faena.combustibleAbastecidoGalones &&
        Number(faena.combustibleAbastecidoGalones) > 0
      ) {
        registrosCompletos.push({
          tipo: "cargaInicial",
          fecha: faena.fechaSalida
            ? new Date(faena.fechaSalida)
            : new Date(temporada.fechaInicio),
          data: faena,
          faenaId: faena.id,
        });
      }

      // 3.2: Agregar descargas de esta faena (ordenadas por fecha)
      const descargasDeFaena = descargasPorFaena[faena.id] || [];
      if (descargasDeFaena.length > 0) {
        // Ordenar descargas por fechaHoraInicioDescarga
        const descargasOrdenadas = [...descargasDeFaena].sort((a, b) => {
          const fechaA = a.fechaHoraInicioDescarga
            ? new Date(a.fechaHoraInicioDescarga)
            : new Date(0);
          const fechaB = b.fechaHoraInicioDescarga
            ? new Date(b.fechaHoraInicioDescarga)
            : new Date(0);
          return fechaA - fechaB;
        });

        descargasOrdenadas.forEach((descarga) => {
          registrosCompletos.push({
            tipo: "descarga",
            fecha: descarga.fechaHoraInicioDescarga
              ? new Date(descarga.fechaHoraInicioDescarga)
              : new Date(),
            data: descarga,
            faenaId: faena.id,
          });
        });
      }
    });
  }

  // ⭐ PASO 4: Agregar días sin faena (si existen y tienen rango de fechas)
  if (
    temporada.fechaInicio &&
    temporada.fechaFin &&
    diasSinFaena &&
    diasSinFaena.length > 0
  ) {
    const todasLasFechas = generarRangoFechas(
      new Date(temporada.fechaInicio),
      new Date(temporada.fechaFin),
    );

    todasLasFechas.forEach((fecha) => {
      // Buscar si hay día sin faena en esta fecha
      const diaSinFaena = diasSinFaena.find(
        (dsf) => dsf.fecha && esMismoDia(dsf.fecha, fecha),
      );

      if (diaSinFaena) {
        // Verificar que no haya descarga en esta fecha
        const hayDescargaEnFecha =
          descargas &&
          descargas.some(
            (d) =>
              d.fechaHoraInicioDescarga &&
              esMismoDia(d.fechaHoraInicioDescarga, fecha),
          );

        if (!hayDescargaEnFecha) {
          registrosCompletos.push({
            tipo: "sinFaena",
            fecha: fecha,
            data: diaSinFaena,
          });
        }
      }
    });
  }

  // ─── FILAS DESCARGA, CARGA INICIAL Y DÍAS SIN FAENA ───────────────
  if (registrosCompletos.length > 0) {
    let totalToneladas = 0;
    let totalGalones = 0;

    registrosCompletos.forEach((registro, index) => {
      let rowData;
      let esDiaSinFaena = registro.tipo === "sinFaena";
      let esCargaInicial = registro.tipo === "cargaInicial";

      if (registro.tipo === "descarga") {
        const descarga = registro.data;
        const fechaInicioDescarga = descarga.fechaHoraInicioDescarga
          ? new Date(descarga.fechaHoraInicioDescarga).toLocaleString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-";
        const especieNombre = descarga.especie?.nombre || "-";
        const clienteNombre = descarga.cliente?.razonSocial || descarga.cliente?.nombre || "-";
        const puertoNombre = descarga.puertoDescarga?.nombre || "-";
        const plataforma = descarga.numPlataformaDescarga || "-";
        const observaciones = descarga.observaciones || "-";
        const reporte = descarga.numReporteRecepcion || "-";
        const galones = Number(descarga.combustibleAbastecidoGalones || 0);
        const toneladas = Number(descarga.toneladas || 0);
        const porcentajeJuveniles = descarga.porcentajeJuveniles
          ? Number(descarga.porcentajeJuveniles) / 100
          : null;

        totalToneladas += toneladas;
        totalGalones += galones;

        rowData = [
          index + 1, fechaInicioDescarga, especieNombre, clienteNombre, puertoNombre,
          plataforma, observaciones, reporte, galones, toneladas, porcentajeJuveniles
        ];
      } else if (registro.tipo === "cargaInicial") {
        // ⭐ NUEVA FILA: Carga inicial de petróleo
        const faena = registro.data;
        const fechaSalida = faena.fechaSalida
          ? new Date(faena.fechaSalida).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "-";
        const combustibleInicial = Number(faena.combustibleAbastecidoGalones);

        totalGalones += combustibleInicial;

        rowData = [
          index + 1,
          fechaSalida,
          "-",
          "-",
          "-",
          "-",
          "Petroleo INI",
          "-",
          combustibleInicial,
          "-",
          "-",
        ];
      } else {
        // ⭐ Día sin faena
        const diaSinFaena = registro.data;
        const fechaSinFaena =
          new Date(diaSinFaena.fecha).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }) + " -";
        const motivoDescripcion =
          diaSinFaena.motivoSinFaena?.descripcion || "SIN FAENA";
        const observacionesDia = diaSinFaena.observaciones || "-";

        rowData = [
          index + 1,
          fechaSinFaena,
          "-",
          motivoDescripcion,
          "-",
          "-",
          observacionesDia,
          "-",
          "-",
          "-",
          "-",
        ];
      }

      const bgColor = index % 2 === 0 ? 'FFF0F6F8' : 'FFFFFFFF';
      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value !== null ? value : "";
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = borderThin;
        
        // ⭐ Usar negrita y color específico según tipo de registro
        if (esDiaSinFaena) {
          cell.font = { size: 8, bold: true, color: { argb: 'FF990000' } }; // Rojo oscuro
        } else if (esCargaInicial) {
          cell.font = { size: 8, bold: true, color: { argb: 'FF008000' } }; // Verde oscuro
        } else {
          cell.font = { size: 8 };
        }

        // Alineaciones
        if (colIndex === 0 || colIndex === 7) {
          // N° y Reporte centrados
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIndex === 1) {
          // ⭐ Fecha SIEMPRE alineada a la izquierda
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIndex >= 2 && colIndex <= 6) {
          // Especie, Cliente, Puerto, Plataforma, Observaciones a la izquierda
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIndex === 8) {
          // Petroleo Gal. a la derecha
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (!esDiaSinFaena && value !== "-") cell.numFmt = '#,##0.00';
        } else if (colIndex === 9) {
          // Toneladas a la derecha
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (!esDiaSinFaena && !esCargaInicial && value !== "-") cell.numFmt = '#,##0.000';
        } else if (colIndex === 10) {
          // % Juveniles a la derecha
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (!esDiaSinFaena && !esCargaInicial && value !== null) cell.numFmt = '0.00%';
        }
      });
      worksheet.getRow(currentRow).height = 16;
      currentRow++;
    });

    // Fila TOTALES celeste
    for (let i = 1; i <= TOTAL_COLS; i++) {
      const cell = worksheet.getCell(currentRow, i);
      cell.fill = fillCeleste;
      cell.font = { bold: true, size: 8 };
      cell.border = borderCeleste;
      cell.value = "";
      if (i === 7) {
        cell.value = "TOTALES";
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (i === 9) {
        cell.value = totalGalones;
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (i === 10) {
        cell.value = totalToneladas;
        cell.numFmt = '#,##0.000 "Ton."';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }
    worksheet.getRow(currentRow).height = 18;
  } else {
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const noDataCell = worksheet.getCell(`A${currentRow}`);
    noDataCell.value = "No hay descargas registradas para esta temporada";
    noDataCell.font = { italic: true, size: 9 };
    noDataCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}