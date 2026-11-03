// src/components/movimientoCaja/tabs/DatosGeneralesTab.jsx
import React, { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import BooleanToggleButton from "../../common/BooleanToggleButton";
import CuentaCorrienteSelector from "../../common/CuentaCorrienteSelector";
import TipoMovimientoSelector from "../../common/TipoMovimientoSelector";
import EntidadComercialSelector from "../../common/EntidadComercialSelector";
import CentroCostoSelector from "../../common/CentroCostoSelector";
import ProductoSelector from "../../common/ProductoSelector";
import { formatearFecha, formatearNumero, getResponsiveFontSize } from "../../../utils/utils";
import { mensajeDeError } from "../../../utils/mensajeError";
import { getMovimientosPorCorrelativo, getOrigenMovimientoCaja } from "../../../api/movimientoCaja";
import { getAllTipoMovEntregaRendir } from "../../../api/tipoMovEntregaRendir";

// ============================================================
// PRESENTACIÓN COMÚN
// ============================================================
const CAJA_VALOR = {
  padding: "0.75rem",
  border: "1px solid #ced4da",
  borderRadius: "6px",
  backgroundColor: "#f8f9fa",
  fontWeight: "bold",
};

const etiqueta = { fontWeight: "bold", fontSize: getResponsiveFontSize(), display: "block", marginBottom: 4 };

// Fila de campos: en pantallas angostas se apilan
const Fila = ({ children, primera = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      flexDirection: window.innerWidth < 768 ? "column" : "row",
      marginTop: primera ? 0 : "1rem",
    }}
  >
    {children}
  </div>
);

// Campo de solo lectura con su etiqueta
const Campo = ({ label, flex = 1, children, estilo = {} }) => (
  <div style={{ flex, minWidth: 0, width: window.innerWidth < 768 ? "100%" : undefined }}>
    <label style={etiqueta}>{label}</label>
    <div style={{ ...CAJA_VALOR, ...estilo }}>{children}</div>
  </div>
);

// Los selectores genéricos traen su propia etiqueta: solo se les da el espacio
const Espacio = ({ flex = 1, children }) => (
  <div style={{ flex, minWidth: 0, width: window.innerWidth < 768 ? "100%" : undefined }}>{children}</div>
);

// Nombre de un campo del documento de origen: "numeroPrestamo" -> "Numero Prestamo"
const nombreLegible = (clave) =>
  clave
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const REGEX_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T/;

const valorLegible = (valor) => {
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "string" && REGEX_FECHA_ISO.test(valor)) return formatearFecha(valor, "");
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
};

export default function DatosGeneralesTab({ movimiento, empresas, toast, onFieldChange, readOnly }) {
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [showOperacionCompleta, setShowOperacionCompleta] = useState(false);
  const [movimientosOperacion, setMovimientosOperacion] = useState([]);
  const [loadingOperacion, setLoadingOperacion] = useState(false);
  const [origen, setOrigen] = useState(null);
  const [loadingOrigen, setLoadingOrigen] = useState(false);
  const [showDocumentoOrigen, setShowDocumentoOrigen] = useState(false);

  const mostrarError = (error, accionFallida) =>
    toast?.current?.show({
      severity: "error",
      summary: "Error",
      detail: mensajeDeError(error, accionFallida),
      life: 6000,
    });

  // Catálogo de tipos de movimiento para el selector genérico (solo lectura)
  useEffect(() => {
    getAllTipoMovEntregaRendir()
      .then((datos) => setTiposMovimiento(datos || []))
      .catch((error) => mostrarError(error, "No se pudieron cargar los tipos de movimiento"));
  }, []);

  // Módulo y documento que originaron el movimiento
  useEffect(() => {
    setOrigen(null);
    if (!movimiento?.id || !movimiento?.moduloOrigenMotivoOperacionId) return;
    let vigente = true;
    setLoadingOrigen(true);
    getOrigenMovimientoCaja(movimiento.id)
      .then((datos) => vigente && setOrigen(datos))
      .catch((error) => vigente && mostrarError(error, "No se pudo consultar el origen del movimiento"))
      .finally(() => vigente && setLoadingOrigen(false));
    return () => {
      vigente = false;
    };
  }, [movimiento?.id, movimiento?.moduloOrigenMotivoOperacionId]);

  const handleVerOperacionCompleta = async () => {
    if (!movimiento.refOperacionEspecializadaMovCaja) {
      toast?.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Este movimiento no tiene correlativo de operación",
        life: 3000,
      });
      return;
    }

    try {
      setLoadingOperacion(true);
      const movimientos = await getMovimientosPorCorrelativo(movimiento.refOperacionEspecializadaMovCaja);
      setMovimientosOperacion(movimientos);
      setShowOperacionCompleta(true);
    } catch (error) {
      console.error("Error al cargar operación completa:", error);
      mostrarError(error, "No se pudo cargar la operación completa");
    } finally {
      setLoadingOperacion(false);
    }
  };

  // ------------------------------------------------------------
  // Datos derivados
  // ------------------------------------------------------------
  const moneda = movimiento.moneda;
  const simbolo = moneda?.simbolo || "";
  const codigoMoneda = moneda?.codigoSunat || "";
  const colorMoneda = moneda?.colorFondo || undefined;
  const esMonedaExtranjera = Boolean(codigoMoneda) && codigoMoneda !== "PEN";
  const tipoCambio = Number(movimiento.tipoCambio || 0);

  const cuentaOrigenId = movimiento.cuentaCorrienteOrigenId ?? movimiento.cuentaCorrienteOrigen?.id ?? null;
  const cuentaDestinoId = movimiento.cuentaCorrienteDestinoId ?? movimiento.cuentaCorrienteDestino?.id ?? null;
  const entidadComercialId = movimiento.entidadComercialId ?? movimiento.entidadComercial?.id ?? null;
  const centroCostoId = movimiento.centroCostoId ?? movimiento.centroCosto?.id ?? null;
  const productoId = movimiento.productoId ?? movimiento.producto?.id ?? null;

  const hayImpuesto = Boolean(
    movimiento.numeroOperacionPagoBancoImpuesto ||
      movimiento.fechaOperacionPagoBancoImpuesto ||
      movimiento.detraccionId ||
      movimiento.retencionId ||
      movimiento.percepcionId,
  );
  // El bloque de impuesto solo se muestra si se realizó el pago (si hay datos), tanto en consulta como al editar
  const mostrarImpuesto = hayImpuesto;

  const hayClasificacion = Boolean(entidadComercialId || centroCostoId || productoId);
  const documentoOrigen = origen?.documento || null;
  const camposDocumento = documentoOrigen
    ? Object.entries(documentoOrigen)
        .filter(([, valor]) => valor !== null && valor !== undefined && valor !== "")
        .map(([clave, valor]) => ({ campo: nombreLegible(clave), valor: valorLegible(valor) }))
    : [];

  const campoEditable = ({ id, label, tipo = "texto", campo, placeholder, valorLectura }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={etiqueta} htmlFor={id}>
        {label}
      </label>
      {readOnly ? (
        <div id={id} style={CAJA_VALOR}>
          {valorLectura || "-"}
        </div>
      ) : tipo === "fecha" ? (
        <Calendar
          id={id}
          value={movimiento[campo] ? new Date(movimiento[campo]) : null}
          onChange={(e) => onFieldChange?.(campo, e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          placeholder={placeholder}
          style={{ width: "100%" }}
        />
      ) : (
        <InputText
          id={id}
          value={movimiento[campo] || ""}
          onChange={(e) => onFieldChange?.(campo, e.target.value)}
          placeholder={placeholder}
          maxLength={50}
          style={{ width: "100%" }}
        />
      )}
    </div>
  );

  return (
    <div className="fluid dg-tab">
      {/* Los selectores genéricos traen su propia etiqueta: aquí se muestra encima del componente, igual que las demás */}
      <style>{`
        .dg-tab .field { display: flex; flex-direction: column; align-items: stretch; margin-bottom: 0; }
        .dg-tab .field > label { display: block; width: 100%; margin: 0 0 4px 0; font-weight: bold; font-size: ${getResponsiveFontSize()}; }
        /* El valor del selector va en UNA sola línea; si no cabe se recorta con puntos suspensivos */
        .dg-tab .field .p-button { max-width: 100%; overflow: hidden; white-space: nowrap; }
        .dg-tab .field .p-button > span:not(.p-button-icon) { flex-wrap: nowrap !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      `}</style>
      {/* ============================================ */}
      {/* SECCIÓN 1: INFORMACIÓN DEL MOVIMIENTO */}
      {/* ============================================ */}
      <Panel header="📄 Información del Movimiento" toggleable>
        <Fila primera>
          <Campo label="Empresa" flex={2} estilo={{ textTransform: "uppercase" }}>
            {movimiento.empresa?.razonSocial || movimiento.empresa?.nombreComercial || "-"}
          </Campo>
          <Campo label="Fecha Operación">{formatearFecha(movimiento.fechaOperacionMovCaja, "") || "-"}</Campo>
          {(!readOnly || movimiento.numeroOperacionPagoBanco) &&
            campoEditable({
              id: "numeroOperacionPagoBanco",
              label: "N° Operación Bancaria",
              campo: "numeroOperacionPagoBanco",
              placeholder: "Ej: 4444444444444444",
              valorLectura: movimiento.numeroOperacionPagoBanco,
            })}
          <Campo label="Estado" estilo={{ display: "flex", alignItems: "center" }}>
            <Tag
              value={movimiento.estadoMovimientoCaja?.descripcion || "Sin estado"}
              severity={movimiento.estadoMovimientoCaja?.severityColor?.toLowerCase() || "secondary"}
            />
          </Campo>
          <Campo label="Naturaleza" estilo={{ display: "flex", alignItems: "center" }}>
            {movimiento.tipoMovimiento ? (
              <Tag
                value={movimiento.tipoMovimiento.esIngreso ? "INGRESO" : "EGRESO"}
                severity={movimiento.tipoMovimiento.esIngreso ? "success" : "danger"}
              />
            ) : (
              "-"
            )}
          </Campo>
          {/* Gerencial / Fiscal: mismo botón que se usa al operar, en solo lectura (sin cambiar el aspecto del botón) */}
          <Espacio>
            <label style={etiqueta}>Operación</label>
            <BooleanToggleButton
              value={Boolean(movimiento.esGerencial)}
              labelTrue="GERENCIAL"
              labelFalse="FISCAL"
              severityTrue="help"
              severityFalse="success"
              icon={movimiento.esGerencial ? "pi-eye-slash" : "pi-eye"}
              disabled
              style={{ opacity: 1, cursor: "default", padding: "0.75rem" }}
            />
          </Espacio>
        </Fila>

        <Fila>
          <Espacio flex={4}>
            <TipoMovimientoSelector
              tiposMovimiento={tiposMovimiento}
              value={movimiento.tipoMovimientoId ?? movimiento.tipoMovimiento?.id ?? null}
              esIngreso={Boolean(movimiento.tipoMovimiento?.esIngreso)}
              soloLectura
            />
          </Espacio>
          <Campo
            label="Monto"
            estilo={{
              backgroundColor: colorMoneda || "#e3f2fd",
              color: "#000",
              fontSize: "1.2rem",
              textAlign: "right",
            }}
          >
            {simbolo} {formatearNumero(movimiento.monto, 2)}
          </Campo>
          {tipoCambio > 0 && (
            <Campo label="Tipo de Cambio" estilo={{ textAlign: "right" }}>
              {formatearNumero(tipoCambio, 3)}
            </Campo>
          )}
          {esMonedaExtranjera && tipoCambio > 0 && (
            <Campo label="Equivalente en Soles" estilo={{ textAlign: "right" }}>
              S/ {formatearNumero(Number(movimiento.monto || 0) * tipoCambio, 2)}
            </Campo>
          )}
        </Fila>

        {/* Clasificación del movimiento: Entidad Comercial, Centro de Costo y Producto, en una sola línea bajo el Tipo de Movimiento */}
        {hayClasificacion && (
          <Fila>
            {entidadComercialId && (
              <Espacio flex={1}>
                <EntidadComercialSelector label="Entidad Comercial" value={entidadComercialId} mostrarInactivas soloLectura />
              </Espacio>
            )}
            {centroCostoId && (
              <Espacio flex={1}>
                <CentroCostoSelector label="Centro de Costo" value={centroCostoId} empresaId={movimiento.empresaId} soloLectura showClearButton={false} />
              </Espacio>
            )}
            {productoId && (
              <Espacio flex={1}>
                <ProductoSelector value={productoId} empresaIdPreseleccionada={movimiento.empresaId} soloLectura />
              </Espacio>
            )}
          </Fila>
        )}

        <Fila>
          <Campo label="Descripción" flex={1} estilo={{ minHeight: "3rem", fontWeight: "normal" }}>
            {movimiento.descripcion || "-"}
          </Campo>
        </Fila>

      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 2: CUENTAS Y MEDIO DE PAGO */}
      {/* ============================================ */}
      <Panel header="🏦 Cuentas y Medio de Pago" toggleable style={{ marginTop: "1rem" }}>
        <Fila primera>
          {cuentaOrigenId && (
            <Espacio flex={2}>
              <CuentaCorrienteSelector
                label="Cuenta Origen"
                value={cuentaOrigenId}
                empresaIdPreseleccionada={movimiento.empresaId}
                mostrarInactivas
                soloLectura
              />
            </Espacio>
          )}
          {cuentaDestinoId && (
            <Espacio flex={2}>
              <CuentaCorrienteSelector
                label="Cuenta Destino"
                value={cuentaDestinoId}
                empresaIdPreseleccionada={movimiento.empresaId}
                mostrarInactivas
                soloLectura
              />
            </Espacio>
          )}
          {!cuentaOrigenId && !cuentaDestinoId && (
            <Campo label="Cuenta" flex={2} estilo={{ fontWeight: "normal", color: "#6c757d" }}>
              Operación sin cuenta bancaria ni caja
            </Campo>
          )}
          <Campo label="Medio de Pago" estilo={{ textTransform: "uppercase" }}>
            {movimiento.medioPago?.nombre || movimiento.medioPago?.descripcion || "-"}
          </Campo>
        </Fila>
      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 3: ORIGEN Y CLASIFICACIÓN */}
      {/* ============================================ */}
      <Panel header="📋 Origen y Clasificación" toggleable style={{ marginTop: "1rem" }}>
        <Fila primera>
          <Campo label="N° Operación Especializada (correlativo)" estilo={{ display: "flex", alignItems: "center", gap: 10 }}>
            {movimiento.refOperacionEspecializadaMovCaja ? (
              <>
                <Tag value={`#${movimiento.refOperacionEspecializadaMovCaja}`} severity="info" style={{ fontSize: "1rem" }} />
                <Button
                  type="button"
                  label="Ver Operación Completa"
                  icon="pi pi-eye"
                  onClick={handleVerOperacionCompleta}
                  loading={loadingOperacion}
                  className="p-button-sm p-button-outlined p-button-info"
                />
              </>
            ) : (
              <span style={{ fontWeight: "normal", color: "#6c757d" }}>Movimiento individual (sin operación agrupada)</span>
            )}
          </Campo>
          <Campo label="Origen del Movimiento" estilo={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {!movimiento.moduloOrigenMotivoOperacionId ? (
              <span style={{ fontWeight: "normal", color: "#6c757d" }}>Sin origen registrado</span>
            ) : loadingOrigen ? (
              <span style={{ fontWeight: "normal", color: "#6c757d" }}>Consultando origen...</span>
            ) : (
              <>
                <Tag value={(origen?.origen?.nombre || `Módulo ${movimiento.moduloOrigenMotivoOperacionId}`).toUpperCase()} severity="info" />
                {movimiento.origenMotivoOperacionId && (
                  <span style={{ color: "#D32F2F" }}>ID: {String(movimiento.origenMotivoOperacionId)}</span>
                )}
                {documentoOrigen && (
                  <Button
                    type="button"
                    label="Ver Documento"
                    icon="pi pi-external-link"
                    onClick={() => setShowDocumentoOrigen(true)}
                    className="p-button-sm p-button-outlined"
                  />
                )}
              </>
            )}
          </Campo>
        </Fila>

      </Panel>

      {/* ============================================ */}
      {/* SECCIÓN 4: DATOS DE OPERACIONES BANCARIAS */}
      {/* ============================================ */}
      {mostrarImpuesto && (
        <Panel header="💳 Datos de Operaciones Bancarias" toggleable style={{ marginTop: "1rem" }}>
          <h4 style={{ color: "#495057", borderBottom: "2px solid #dee2e6", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            🏛️ Pago de Impuesto (Detracción/Retención/Percepción)
          </h4>
          <Fila primera>
            {campoEditable({
              id: "numeroOperacionPagoBancoImpuesto",
              label: "Número de Constancia SUNAT",
              campo: "numeroOperacionPagoBancoImpuesto",
              placeholder: "Ej: AUTO-20260911-4444444444444444",
              valorLectura: movimiento.numeroOperacionPagoBancoImpuesto,
            })}
            {campoEditable({
              id: "fechaOperacionPagoBancoImpuesto",
              label: "Fecha del Depósito/Pago",
              tipo: "fecha",
              campo: "fechaOperacionPagoBancoImpuesto",
              placeholder: "Seleccione fecha",
              valorLectura: formatearFecha(movimiento.fechaOperacionPagoBancoImpuesto, ""),
            })}
          </Fila>
        </Panel>
      )}

      {/* Dialog Operación Completa */}
      <Dialog
        visible={showOperacionCompleta}
        onHide={() => setShowOperacionCompleta(false)}
        header={`Operación Completa - Correlativo #${movimiento.refOperacionEspecializadaMovCaja}`}
        style={{ width: "90vw" }}
        modal
        maximizable
      >
        <DataTable
          value={movimientosOperacion}
          loading={loadingOperacion}
          size="small"
          showGridlines
          stripedRows
          rowClassName={(fila) => (String(fila.id) === String(movimiento.id) ? "fila-movimiento-actual" : "")}
        >
          <Column field="id" header="ID" style={{ width: "80px" }} sortable />
          <Column field="tipoMovimiento.nombre" header="Tipo" style={{ minWidth: "200px" }} sortable />
          <Column field="descripcion" header="Descripción" sortable />
          <Column
            header="Cuenta"
            body={(fila) => {
              const cuenta = fila.cuentaCorrienteOrigen || fila.cuentaCorrienteDestino;
              const sentido = fila.cuentaCorrienteOrigen ? "Origen" : "Destino";
              return cuenta ? `${sentido}: ${cuenta.banco?.nombre || ""} - ${cuenta.numeroCuenta || ""}` : "-";
            }}
            style={{ minWidth: "220px" }}
          />
          <Column
            field="monto"
            header="Monto"
            body={(fila) => (
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  color: "#000",
                  backgroundColor: fila.moneda?.colorFondo || undefined,
                  padding: "0.25rem 0.5rem",
                  borderRadius: 4,
                }}
              >
                {fila.moneda?.simbolo || ""} {formatearNumero(fila.monto, 2)}
              </div>
            )}
            style={{ width: "170px", textAlign: "right" }}
            sortable
          />
          <Column
            field="urlOperacionIndividualOperacionCaja"
            header="Voucher"
            body={(fila) =>
              fila.urlOperacionIndividualOperacionCaja ? (
                <Tag value="Disponible" severity="success" icon="pi pi-check" />
              ) : (
                <Tag value="No disponible" severity="secondary" />
              )
            }
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
        <style>{`.fila-movimiento-actual { background-color: #e8f5e9 !important; }`}</style>
      </Dialog>

      {/* Dialog Documento de Origen */}
      <Dialog
        visible={showDocumentoOrigen}
        onHide={() => setShowDocumentoOrigen(false)}
        header={`Documento de Origen - ${origen?.origen?.nombre || ""} (ID ${String(movimiento.origenMotivoOperacionId || "")})`}
        style={{ width: "60vw" }}
        modal
        maximizable
      >
        <DataTable value={camposDocumento} size="small" showGridlines stripedRows emptyMessage="El documento no tiene datos para mostrar">
          <Column field="campo" header="Campo" style={{ width: "40%", fontWeight: "bold" }} />
          <Column field="valor" header="Valor" />
        </DataTable>
      </Dialog>
    </div>
  );
}
