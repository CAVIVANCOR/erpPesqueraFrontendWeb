import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { formatearNumero, formatearFecha } from "../../../utils/utils";
import { getResponsiveFontSize } from "../../../utils/utils";
import {
  ORIGEN_DOCUMENTO_TESORERIA,
  TIPO_DEUDA_TESORERIA,
  TIPO_FILTRO_TESORERIA,
} from "../../../utils/tesoreria.constants";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE COLUMNAS POR CASO (TABLA ESPECIALIZADA)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Cada caso de la sección "Atenciones" define QUÉ columnas se muestran y en
 * QUÉ orden. Las claves hacen referencia al catálogo `definicionesColumnas`
 * que se construye dentro del componente (necesita los templates y callbacks).
 *
 * Para personalizar un caso basta con editar su lista aquí; no hay que tocar
 * el render del DataTable.
 *
 * Claves disponibles:
 *   tipo, origen, documento, tipoDeuda, entidad, personal, saldoInicial,
 *   fechaEmision, fechaVencimiento, saldo, impuesto, estado, acciones
 */
const COLUMNAS_BASE = [
  "tipo",
  "origen",
  "documento",
  "entidad",
  "fechaEmision",
  "fechaVencimiento",
  "saldo",
  "estado",
  "acciones",
];

// Inserta "Imp. Trib." justo después del saldo del documento
const conColumnasImpuesto = (c) => (c === "saldo" ? [c, "impuesto"] : [c]);

const COLUMNAS_POR_CASO = {
  // Sin filtro específico (CxC + CxP + Asignaciones + Gastos Directos)
  TODOS: COLUMNAS_BASE,
  // Cuentas por Cobrar: se agrega la casilla de selección para el cobro múltiple de facturas
  // de un cliente ("Cobrar seleccionados"); se conserva "acciones" para el cobro individual.
  // También "Imp. Trib." (igual que Cuentas por Pagar)
  COBRAR: ["seleccion", ...COLUMNAS_BASE.flatMap(conColumnasImpuesto)],
  // Cuentas por Pagar: se agrega "Imp. Trib." (% de detracción, retención o percepción)
  // para identificar a simple vista los documentos con impuesto, y la casilla de selección
  // para el pago múltiple de facturas de un proveedor ("Pagar seleccionados");
  // se conserva "acciones" para el pago individual
  PAGAR: ["seleccion", ...COLUMNAS_BASE.flatMap(conColumnasImpuesto)],
  // Asignaciones de fondos (Entregas a Rendir):
  // la contraparte es el responsable (trabajador), por eso se muestra "Personal"
  ASIGNACIONES: COLUMNAS_BASE.map((c) => (c === "entidad" ? "personal" : c)),
  // Gastos directos (entregas con entidad comercial)
  GASTOS_DIRECTOS: COLUMNAS_BASE,
  // Deudas con Personal (tabla DeudaConPersonal):
  // se reemplaza "Documento" por el Tipo de Deuda y "Entidad Comercial" por "Personal"
  // Sin "acciones": el pago se hace con "Pagar seleccionados" (pago múltiple especializado)
  DEUDAS_PERSONAL: [
    "seleccion",
    "tipo",
    "origen",
    "tipoDeuda",
    "personal",
    "fechaEmision",
    "fechaVencimiento",
    "saldo",
    "saldoInicial",
    "estado",
  ],
  // Deudas Tributarias (tabla DeudaTributaria):
  // se reemplaza "Documento" por el Tipo de Deuda tributaria y se omite la
  // columna de entidad (el backend la envía fija como SUNAT)
  // y se agrega "S. Inicial" antes del estado.
  // Sin "acciones": el pago se hace con "Pagar seleccionados" (pago múltiple especializado)
  // y se agrega la casilla de selección al inicio.
  DEUDAS_TRIBUTARIAS: [
    "seleccion",
    ...COLUMNAS_BASE.filter((c) => c !== "entidad" && c !== "acciones")
      .map((c) => (c === "documento" ? "tipoDeuda" : c))
      .flatMap((c) => (c === "estado" ? ["saldoInicial", c] : [c])),
  ],
  // Préstamos - Cuotas (tabla CuotaPrestamo): egreso. La entidad es el banco y se agrega la
  // composición de la cuota (capital / interés / otros) y "S. Inicial".
  // Sin "acciones": el pago se hace con "Pagar seleccionados" (cuotas de UN mismo préstamo)
  PRESTAMOS_CUOTAS: [
    "seleccion",
    "tipo",
    "origen",
    "documento",
    "entidad",
    "fechaVencimiento",
    "composicion",
    "saldo",
    "saldoInicial",
    "estado",
  ],
  // Préstamos - Desembolsos (tabla PrestamoBancario): ingreso. "F. Emisión" = fecha del contrato y
  // "F. Vencimiento" = fecha prevista de desembolso.
  // Sin "acciones": el ingreso se registra con "Registrar desembolso"
  PRESTAMOS_DESEMBOLSOS: [
    "seleccion",
    "tipo",
    "origen",
    "documento",
    "fechaEmision",
    "fechaVencimiento",
    "composicion",
    "saldo",
    "estado",
  ],
};

/**
 * Resuelve el caso activo. `tipoDeuda` y `tipo` son filtros mutuamente
 * excluyentes: si hay una deuda seleccionada, esta tiene prioridad.
 */
const resolverCaso = (tipo, tipoDeuda) => {
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_PERSONAL) return "DEUDAS_PERSONAL";
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_TRIBUTARIAS) return "DEUDAS_TRIBUTARIAS";
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_CUOTAS) return "PRESTAMOS_CUOTAS";
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.PRESTAMOS_DESEMBOLSOS) return "PRESTAMOS_DESEMBOLSOS";
  if (tipo === TIPO_FILTRO_TESORERIA.COBRAR) return "COBRAR";
  if (tipo === TIPO_FILTRO_TESORERIA.PAGAR) return "PAGAR";
  if (tipo === TIPO_FILTRO_TESORERIA.ASIGNACIONES) return "ASIGNACIONES";
  if (tipo === TIPO_FILTRO_TESORERIA.GASTOS_DIRECTOS) return "GASTOS_DIRECTOS";
  return "TODOS";
};

const PendientesTable = ({
  pendientes,
  loading,
  onRegistrarPago,
  onEntregarFondos,
  onPagarDeudaPersonal,
  onPagarDeudaTributaria,
  onPagoEspecializado,
  onPagoEspecializadoCxP,
  onProcesarGastoDirecto,
  permisos,
  tipo,
  tipoDeuda,
  seleccion = [],
  onSeleccionChange,
}) => {
  // Templates
  const tipoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.tipo}
        severity={rowData.tipo === "INGRESO" ? "success" : "danger"}
        icon={
          rowData.tipo === "INGRESO" ? "pi pi-arrow-down" : "pi pi-arrow-up"
        }
      />
    );
  };

  const documentoTemplate = (rowData) => {
    // Desembolsos de préstamo: mostrar info rica en una sola línea (patrón CuentaCorrienteSelector)
    if (rowData.esDesembolsoPrestamo) {
      return (
        <span style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "700", color: "#1565C0" }}>
            {rowData.prestamo?.numeroPrestamo || rowData.documentoNumero}
          </span>
          <span style={{ color: "#999" }}>-</span>
          <span style={{ color: "#1976D2", fontWeight: "600" }}>
            {rowData.entidadComercial?.razonSocial || "Sin banco"}
          </span>
          <span style={{ color: "#999" }}>-</span>
          <span style={{ color: "#2E7D32", fontWeight: "600" }}>
            {rowData.moneda?.codigoSunat || "N/A"}
          </span>
          {rowData.prestamo?.tipoPrestamo && (
            <>
              <span style={{ color: "#999" }}>-</span>
              <span style={{ color: "#F57C00", fontWeight: "500" }}>
                {rowData.prestamo.tipoPrestamo}
              </span>
            </>
          )}
        </span>
      );
    }
    return (
      <div>
        <div className="text-sm text-gray-600">{rowData.documentoNumero}</div>
      </div>
    );
  };

  const tipoDeudaTemplate = (rowData) => {
    return (
      <div>
        <div className="text-sm text-gray-600">{rowData.tipoDeuda?.nombre}</div>
      </div>
    );
  };

  const entidadTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold">{rowData.entidadComercial?.razonSocial}</div>
      </div>
    );
  };

  // Columna "Personal" (Deudas con Personal y Asignaciones): el backend arma
  // entidadComercial con el nombre completo del trabajador/responsable;
  // `personal` / `responsable` se usan como respaldo
  const personalTemplate = (rowData) => {
    return (
      <div>
        <div className="font-bold">
          {rowData.entidadComercial?.razonSocial ||
            rowData.personal?.nombreCompleto ||
            rowData.responsable?.nombreCompleto}
        </div>
      </div>
    );
  };

  const montoTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-bold text-lg">
          {rowData.moneda?.simbolo} {formatearNumero(rowData.saldoPendiente)}
        </div>
      </div>
    );
  };

  // Impuesto tributario unificado (mismo criterio que OrdenCompra.jsx): solo uno aplica por
  // documento. Prioridad: Detracción > Retención > Percepción
  const impuestoTemplate = (rowData) => {
    const impuesto = rowData.impuestoTributario;
    if (!impuesto) return <span style={{ color: "#999" }}>-</span>;

    const porcentaje = Number(impuesto.porcentaje || 0).toFixed(2);
    const presentacion = {
      DETRACCION: { texto: `📊 Detrac ${porcentaje}%`, severity: "warning" },
      RETENCION: { texto: `💰 Reten ${porcentaje}%`, severity: "help" },
      PERCEPCION: { texto: `📈 Percep ${porcentaje}%`, severity: "info" },
    }[impuesto.tipo];
    if (!presentacion) return <span style={{ color: "#999" }}>-</span>;

    return (
      <div style={{ textAlign: "center" }}>
        <Tag value={presentacion.texto} severity={presentacion.severity} style={{ fontSize: "0.75rem" }} />
      </div>
    );
  };

  const fechaEmisionTemplate = (rowData) => {
    return (
      <div style={{ fontSize: "0.875rem" }}>
        {formatearFecha(rowData.fechaEmision)}
      </div>
    );
  };

  const fechaVencimientoTemplate = (rowData) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(rowData.fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const vencido = vencimiento < hoy;

    return (
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: vencido ? "bold" : "normal",
          color: vencido ? "#dc2626" : "inherit",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {formatearFecha(rowData.fechaVencimiento)}
        {vencido && (
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "0.875rem", color: "#dc2626" }}
          />
        )}
      </div>
    );
  };

  // Indicador SI/NO de saldo inicial (DeudaConPersonal / DeudaTributaria .esSaldoInicial)
  const saldoInicialTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.esSaldoInicial ? "SI" : "NO"}
        severity={rowData.esSaldoInicial ? "warning" : "secondary"}
      />
    );
  };

  // Composición de la cuota (capital / interés / otros) o tipo de préstamo del desembolso
  const composicionTemplate = (rowData) => {
    if (rowData.cuota) {
      const simbolo = rowData.moneda?.simbolo;
      const otros =
        Number(rowData.cuota.montoComision || 0) + Number(rowData.cuota.montoSeguro || 0);
      return (
        <div style={{ fontSize: "0.8rem", lineHeight: 1.35 }}>
          <div>Capital: {simbolo} {formatearNumero(rowData.cuota.montoCapital)}</div>
          <div>Interés: {simbolo} {formatearNumero(rowData.cuota.montoInteres)}</div>
          {otros > 0 && <div>Com./Seg.: {simbolo} {formatearNumero(otros)}</div>}
        </div>
      );
    }
    return (
      <div style={{ fontSize: "0.8rem" }}>
        {rowData.prestamo?.tipoPrestamo || "-"}
        {rowData.prestamo?.esFactoring && (
          <Tag value="FACTORING" severity="info" style={{ fontSize: "0.65rem", marginLeft: 6 }} />
        )}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const severityColor = rowData.estado?.severityColor || "secondary";
    return (
      <div className="flex flex-column gap-1 align-items-start">
        <Tag
          value={rowData.estado?.descripcion}
          severity={severityColor}
        />
        {/* Cuota de préstamo que vence antes del corte del saldo inicial y aún no está marcada como histórica */}
        {rowData.vencidaAntesDelCorte && (
          <Tag
            value="ANTES DEL CORTE"
            severity="warning"
            icon="pi pi-exclamation-triangle"
            style={{ fontSize: "0.65rem" }}
            tooltip="Vence antes del 01/01/2026. Si ya se pagó el año pasado, márquela como histórica (saldo inicial) en el cronograma del préstamo antes de pagarla aquí."
          />
        )}
      </div>
    );
  };

  const accionesTemplate = (rowData) => {
    if (!permisos.puedeCrear) return null;

    // Si es una asignación, mostrar botón "Entregar Fondos"
    if (rowData.esAsignacion === true && rowData.origen === ORIGEN_DOCUMENTO_TESORERIA.ASIGNACION_RENDIR) {
      return (
        <Button
          label="Entregar Fondos"
          icon="pi pi-money-bill"
          className="p-button-sm p-button-info"
          onClick={() => onEntregarFondos(rowData)}
          tooltip="Entregar fondos al responsable"
          tooltipOptions={{ position: "left" }}
        />
      );
    }

    // Gastos directos: abrir formulario de rendición para completar datos y generar documentos
    if (rowData.origen === "Gasto Directo") {
      return (
        <Button
          label="Procesar Gasto"
          icon="pi pi-file-edit"
          className="p-button-sm p-button-warning"
          onClick={() => onProcesarGastoDirecto?.(rowData)}
          tooltip="Completar datos y generar OC, CxP y asientos"
          tooltipOptions={{ position: "left" }}
        />
      );
    }
    // AGREGAR ESTE BLOQUE DESPUÉS DE LA ASIGNACIÓN
    // Si es una deuda personal, mostrar botón específico
    if (rowData.origen === ORIGEN_DOCUMENTO_TESORERIA.DEUDA_PERSONAL) {
      return (
        <Button
          label="Pagar Deuda"
          icon="pi pi-user"
          className="p-button-sm p-button-warning"
          onClick={() => onPagarDeudaPersonal(rowData)}
          tooltip="Pagar deuda al personal"
          tooltipOptions={{ position: "left" }}
        />
      );
    }
    // Si es una deuda tributaria, mostrar botón específico
    if (rowData.origen === ORIGEN_DOCUMENTO_TESORERIA.DEUDA_TRIBUTARIA) {
      return (
        <Button
          label="Pagar Deuda"
          icon="pi pi-building"
          className="p-button-sm p-button-warning"
          onClick={() => onPagarDeudaTributaria(rowData)}
          tooltip="Pagar deuda tributaria"
          tooltipOptions={{ position: "left" }}
        />
      );
    }

    // Para CxC con opciones especiales
    if (rowData.origen === ORIGEN_DOCUMENTO_TESORERIA.CUENTAS_POR_COBRAR) {
      return (
        <Button
          label="Cobrar Cuenta"
          icon="pi pi-briefcase"
          className="p-button-sm p-button-success"
          onClick={() => onPagoEspecializado(rowData)}
          tooltip="Cobro especializado con SUNAT (Detracción/Retención/Percepción)"
          tooltipOptions={{ position: "left" }}
        />
      );
    }

    // Para CxP con opciones especiales
    if (rowData.origen === ORIGEN_DOCUMENTO_TESORERIA.CUENTAS_POR_PAGAR) {
      return (
        <Button
          label="Pagar Proveedor"
          icon="pi pi-briefcase"
          className="p-button-sm p-button-danger"
          onClick={() => onPagoEspecializadoCxP(rowData)}
          tooltip="Pago especializado a proveedor con SUNAT (Detracción/Retención/Percepción)"
          tooltipOptions={{ position: "left" }}
        />
      );
    }

    // Para el resto (Gastos Directos, etc.), mostrar botón normal
    return (
      <Button
        label="Registrar Pago"
        icon="pi pi-dollar"
        className="p-button-sm p-button-success"
        onClick={() => onRegistrarPago(rowData)}
        tooltip={tipo === "COBRAR" ? "Registrar Cobro" : "Registrar Pago"}
        tooltipOptions={{ position: "left" }}
      />
    );
  };

  // Caso activo (define las columnas y los pies de tabla)
  const claveCaso = resolverCaso(tipo, tipoDeuda);
  const esDeudasPersonal = claveCaso === "DEUDAS_PERSONAL";

  // Nombre que se muestra en la columna "Personal" (mismo criterio que personalTemplate)
  const nombrePersonal = (rowData) =>
    rowData.entidadComercial?.razonSocial ||
    rowData.personal?.nombreCompleto ||
    rowData.responsable?.nombreCompleto ||
    "";

  // Ordenamiento por el nombre visible, sin distinguir mayúsculas ni tildes
  const ordenarPorPersonal = (e) =>
    [...e.data].sort(
      (a, b) =>
        e.order *
        nombrePersonal(a).localeCompare(nombrePersonal(b), "es", { sensitivity: "base" }),
    );

  // Ordenamiento numérico del saldo (el valor puede llegar como texto)
  const ordenarPorSaldo = (e) =>
    [...e.data].sort(
      (a, b) => e.order * ((Number(a.saldoPendiente) || 0) - (Number(b.saldoPendiente) || 0)),
    );

  // Sumatoria del saldo pendiente de TODAS las filas de la lista, agrupada por moneda
  // (no se mezclan monedas distintas); se acumula en céntimos para evitar errores de redondeo
  const totalesSaldoPorMoneda = () => {
    const totales = new Map();
    (pendientes || []).forEach((fila) => {
      const simbolo = fila.moneda?.simbolo || "";
      const centimos = Math.round((Number(fila.saldoPendiente) || 0) * 100);
      totales.set(simbolo, (totales.get(simbolo) || 0) + centimos);
    });
    return [...totales.entries()].map(([simbolo, centimos]) => ({ simbolo, total: centimos / 100 }));
  };

  const saldoFooterTemplate = () => (
    <div className="text-right font-bold">
      {totalesSaldoPorMoneda().map(({ simbolo, total }) => (
        <div key={simbolo || "sin-moneda"}>
          {simbolo} {formatearNumero(total)}
        </div>
      ))}
    </div>
  );

  // Catálogo de columnas disponibles (props de <Column> por clave)
  const definicionesColumnas = {
    // Casilla de selección (pago múltiple de Deudas con Personal)
    seleccion: { selectionMode: "multiple", headerStyle: { width: "3rem" }, style: { width: "3rem" } },
    tipo: { field: "tipo", header: "Tipo", body: tipoTemplate, sortable: true, style: { width: "100px" } },
    origen: { field: "origen", header: "Origen", sortable: true, style: { width: "150px" } },
    documento: { field: "documentoNumero", header: "Documento", body: documentoTemplate, sortable: true, style: { width: "200px" } },
    tipoDeuda: { header: "Tipo de Deuda", body: tipoDeudaTemplate, style: { width: "200px" } },
    entidad: { field: "entidadComercial.razonSocial", header: "Entidad Comercial", body: entidadTemplate, sortable: true, style: { width: "250px" } },
    personal: {
      header: "Personal",
      body: personalTemplate,
      field: "entidadComercial.razonSocial",
      sortable: true,
      sortFunction: ordenarPorPersonal,
      style: { width: "250px" },
      // Deudas con Personal: etiqueta del pie con la cantidad de deudas listadas
      ...(esDeudasPersonal
        ? { footer: `TOTAL (${(pendientes || []).length} deudas)`, footerStyle: { fontWeight: "bold" } }
        : {}),
    },
    fechaEmision: {
      header: "F. Emisión",
      body: fechaEmisionTemplate,
      style: { width: "110px", textAlign: "center" },
      sortable: true,
      field: "fechaEmision",
    },
    fechaVencimiento: {
      header: "F. Vencimiento",
      body: fechaVencimientoTemplate,
      style: { width: "130px", textAlign: "center" },
      sortable: true,
      field: "fechaVencimiento",
    },
    saldo: {
      header: "Saldo Pendiente",
      body: montoTemplate,
      field: "saldoPendiente",
      sortable: true,
      sortFunction: ordenarPorSaldo,
      style: { width: "180px" },
      // Deudas con Personal: sumatoria del saldo pendiente por moneda
      ...(esDeudasPersonal ? { footer: saldoFooterTemplate } : {}),
    },
    impuesto: {
      header: "Imp. Trib.",
      body: impuestoTemplate,
      style: { width: "120px", textAlign: "center" },
    },
    saldoInicial: {
      header: "S. Inicial",
      body: saldoInicialTemplate,
      style: { width: "100px", textAlign: "center" },
    },
    composicion: { header: "Composición", body: composicionTemplate, style: { width: "190px" } },
    estado: { header: "Estado", body: estadoTemplate, style: { width: "120px" } },
    acciones: {
      header: "Acciones",
      body: accionesTemplate,
      style: { width: "180px" },
      frozen: true,
      alignFrozen: "right",
    },
  };

  // Columnas del caso activo (si faltara el caso, se usa el layout base)
  const columnasActivas = COLUMNAS_POR_CASO[claveCaso] || COLUMNAS_BASE;

  return (
    <DataTable
      value={pendientes}
      loading={loading}
      {...(claveCaso === "DEUDAS_PERSONAL" || claveCaso === "DEUDAS_TRIBUTARIAS" || claveCaso === "COBRAR" || claveCaso === "PAGAR" || claveCaso === "PRESTAMOS_CUOTAS" || claveCaso === "PRESTAMOS_DESEMBOLSOS"
        ? { selection: seleccion, onSelectionChange: (e) => onSeleccionChange?.(e.value), dataKey: "id" }
        : {})}
      paginator
      rows={20}
      rowsPerPageOptions={[10, 20, 50, 100]}
      emptyMessage="No hay documentos pendientes"
      stripedRows
      showGridlines
      size="small"
      style={{ fontSize: getResponsiveFontSize() }}
    >
      {/* Columnas según el caso activo (ver COLUMNAS_POR_CASO) */}
      {columnasActivas.map((clave) => (
        <Column key={`${claveCaso}-${clave}`} {...definicionesColumnas[clave]} />
      ))}
    </DataTable>
  );
};

export default PendientesTable;
