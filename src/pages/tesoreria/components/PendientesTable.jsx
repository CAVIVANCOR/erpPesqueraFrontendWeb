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
 *   fechaEmision, fechaVencimiento, saldo, estado, acciones
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

const COLUMNAS_POR_CASO = {
  // Sin filtro específico (CxC + CxP + Asignaciones + Gastos Directos)
  TODOS: COLUMNAS_BASE,
  // Cuentas por Cobrar
  COBRAR: COLUMNAS_BASE,
  // Cuentas por Pagar
  PAGAR: COLUMNAS_BASE,
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
};

/**
 * Resuelve el caso activo. `tipoDeuda` y `tipo` son filtros mutuamente
 * excluyentes: si hay una deuda seleccionada, esta tiene prioridad.
 */
const resolverCaso = (tipo, tipoDeuda) => {
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_PERSONAL) return "DEUDAS_PERSONAL";
  if (tipoDeuda === TIPO_DEUDA_TESORERIA.DEUDAS_TRIBUTARIAS) return "DEUDAS_TRIBUTARIAS";
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

  const estadoTemplate = (rowData) => {
    const severityColor = rowData.estado?.severityColor || "secondary";
    return (
      <Tag
        value={rowData.estado?.descripcion}
        severity={severityColor}
      />
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

  // Catálogo de columnas disponibles (props de <Column> por clave)
  const definicionesColumnas = {
    // Casilla de selección (pago múltiple de Deudas con Personal)
    seleccion: { selectionMode: "multiple", headerStyle: { width: "3rem" }, style: { width: "3rem" } },
    tipo: { field: "tipo", header: "Tipo", body: tipoTemplate, style: { width: "100px" } },
    origen: { field: "origen", header: "Origen", style: { width: "150px" } },
    documento: { header: "Documento", body: documentoTemplate, style: { width: "200px" } },
    tipoDeuda: { header: "Tipo de Deuda", body: tipoDeudaTemplate, style: { width: "200px" } },
    entidad: { header: "Entidad Comercial", body: entidadTemplate, style: { width: "250px" } },
    personal: { header: "Personal", body: personalTemplate, style: { width: "250px" } },
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
    saldo: { header: "Saldo Pendiente", body: montoTemplate, style: { width: "180px" } },
    saldoInicial: {
      header: "S. Inicial",
      body: saldoInicialTemplate,
      style: { width: "100px", textAlign: "center" },
    },
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
  const claveCaso = resolverCaso(tipo, tipoDeuda);
  const columnasActivas = COLUMNAS_POR_CASO[claveCaso] || COLUMNAS_BASE;

  return (
    <DataTable
      value={pendientes}
      loading={loading}
      {...(claveCaso === "DEUDAS_PERSONAL" || claveCaso === "DEUDAS_TRIBUTARIAS"
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
