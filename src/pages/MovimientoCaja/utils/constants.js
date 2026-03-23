// CONFIGURACIÓN DE MOVIMIENTOS DE CAJA

// MÓDULOS ORIGEN POR TIPO
export const MODULOS_ORIGEN = {
  industrial: 2,
  consumo: 3,
  compras: 4,
  ventas: 5,
  almacen: 6,
  servicios: 7,
  otMantenimiento: 8
};

// ESTADOS POR ID
export const ESTADOS = {
  PENDIENTE: 20,
  VALIDADO: 21,
  APROBADO: 77,
  RECHAZADO: 78,
  ANULADO: 79
};

// CONFIGURACIÓN DE PAGINACIÓN
export const PAGINACION = {
  ROWS_DEFAULT: 50,
  ROWS_OPTIONS: [50, 100, 250, 500]
};

// MONEDA DEFAULT
export const MONEDA_DEFAULT = "PEN";

// TIPOS DE MOVIMIENTO
export const TIPOS_MOVIMIENTO = {
  ENTREGA_A_RENDIR: 1,
  REEMBOLSO: 2,
  PRESTAMO: 3,
  PAGO_PROVEEDOR: 4,
  TRANSFERENCIA: 5,
  OTROS: 6
};

// COLORES DE ESTADO
export const ESTADO_COLORS = {
  [ESTADOS.PENDIENTE]: "warning",
  [ESTADOS.VALIDADO]: "info",
  [ESTADOS.APROBADO]: "success",
  [ESTADOS.RECHAZADO]: "danger",
  [ESTADOS.ANULADO]: "secondary"
};

// MENSAJES DE VALIDACIÓN
export const VALIDATION_MESSAGES = {
  REQUIRED: "Este campo es obligatorio",
  INVALID_AMOUNT: "Monto inválido",
  INVALID_DATE: "Fecha inválida",
  INVALID_ACCOUNT: "Cuenta inválida",
  INSUFFICIENT_BALANCE: "Saldo insuficiente",
  DUPLICATE_REFERENCE: "Referencia duplicada"
};

// OPCIONES DE DIÁLOGOS
export const DIALOG_OPTIONS = {
  CREAR: {
    header: "Nuevo Movimiento de Caja",
    width: "1200px",
    height: "auto"
  },
  EDITAR: {
    header: "Editar Movimiento de Caja",
    width: "1200px",
    height: "auto"
  },
  APROBAR: {
    header: "Aprobar Movimiento de Caja",
    width: "500px",
    height: "auto"
  },
  RECHAZAR: {
    header: "Rechazar Movimiento de Caja",
    width: "500px",
    height: "auto"
  },
  REVERTIR: {
    header: "Revertir Movimiento de Caja",
    width: "500px",
    height: "auto"
  }
};

// CONFIGURACIÓN DE TABLA
export const TABLE_CONFIG = {
  RESPONSIVE: true,
  SCROLLABLE: true,
  SCROLL_HEIGHT: "400px",
  SELECTION_MODE: "single",
  PAGINATION: true,
  SORT_MODE: "single",
  FILTER_MODE: "strict"
};

// COLUMNAS DE TABLA (CONFIGURACIÓN BASE)
export const TABLE_COLUMNS = {
  ID: {
    field: "id",
    header: "ID",
    sortable: true,
    filterable: true,
    width: "80px"
  },
  FECHA: {
    field: "fecha",
    header: "Fecha",
    sortable: true,
    filterable: true,
    width: "120px",
    dataType: "date"
  },
  TIPO_MOVIMIENTO: {
    field: "tipoMovimiento.nombre",
    header: "Tipo Movimiento",
    sortable: true,
    filterable: true,
    width: "150px"
  },
  MONTO: {
    field: "monto",
    header: "Monto",
    sortable: true,
    filterable: true,
    width: "120px",
    dataType: "currency",
    align: "right"
  },
  DESCRIPCION: {
    field: "descripcion",
    header: "Descripción",
    sortable: true,
    filterable: true,
    width: "200px"
  },
  EMPRESA_ORIGEN: {
    field: "empresaOrigen.razonSocial",
    header: "Empresa Origen",
    sortable: true,
    filterable: true,
    width: "150px"
  },
  EMPRESA_DESTINO: {
    field: "empresaDestino.razonSocial",
    header: "Empresa Destino",
    sortable: true,
    filterable: true,
    width: "150px"
  },
  ESTADO: {
    field: "estado.descripcion",
    header: "Estado",
    sortable: true,
    filterable: true,
    width: "120px"
  },
  ACCIONES: {
    field: "acciones",
    header: "Acciones",
    sortable: false,
    filterable: false,
    width: "150px"
  }
};

// PERMISOS REQUERIDOS
export const PERMISOS_REQUERIDOS = {
  CREAR: "crear_movimiento_caja",
  EDITAR: "editar_movimiento_caja",
  ELIMINAR: "eliminar_movimiento_caja",
  APROBAR: "aprobar_documentos",
  RECHAZAR: "rechazar_documentos",
  REVERTIR: "reactivar_documentos",
  VER_REPORTES: "ver_reportes_movimiento_caja"
};

// EXPORTAR TODAS LAS CONSTANTES
export default {
  MODULOS_ORIGEN,
  ESTADOS,
  PAGINACION,
  MONEDA_DEFAULT,
  TIPOS_MOVIMIENTO,
  ESTADO_COLORS,
  VALIDATION_MESSAGES,
  DIALOG_OPTIONS,
  TABLE_CONFIG,
  TABLE_COLUMNS,
  PERMISOS_REQUERIDOS
};
