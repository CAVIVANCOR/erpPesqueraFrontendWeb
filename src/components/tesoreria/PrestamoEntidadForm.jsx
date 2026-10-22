// src/components/tesoreria/PrestamoEntidadForm.jsx
// Préstamo con accionista o tercero. Mismo formulario que PrestamoRelacionadoForm.jsx.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  createPrestamoEntidad,
  updatePrestamoEntidad,
  getAsientosAperturaPrestamoEntidad,
  generarAsientoAperturaPrestamoEntidad,
  eliminarAsientosAperturaPrestamoEntidad,
} from "../../api/tesoreria/prestamosEntidad";
import { getMonedas } from "../../api/moneda";
import { getResponsiveFontSize, formatearNumero } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";
import BooleanToggleButton from "../common/BooleanToggleButton";
import PartesPrestamoEntidad from "./PartesPrestamoEntidad";
import { esIngresoMovimiento } from "../../utils/naturalezaMovimientoCaja";

const etiqueta = { fontWeight: "bold", fontSize: getResponsiveFontSize() };

const nombreCuenta = (cuenta) =>
  cuenta ? `${cuenta.banco?.nombreCorto || cuenta.banco?.nombre || "BANCO"} CTA. ${cuenta.numeroCuenta || cuenta.id}` : null;

/**
 * Movimientos de caja de una operación de Tesorería (movimiento principal, ITF y comisión).
 * Se usa en el desembolso del préstamo y en cada devolución.
 */
function MovimientosCajaTabla({ movimientos = [] }) {
  return (
    <DataTable
      value={movimientos}
      size="small"
      stripedRows
      showGridlines
      dataKey="id"
      emptyMessage="No se encontraron los movimientos de caja de esta operación."
      style={{ fontSize: getResponsiveFontSize() }}
    >
      <Column field="id" header="ID Mov." style={{ width: 80 }} />
      <Column
        header="Tipo"
        style={{ width: 210 }}
        body={(m) => {
          const ingreso = esIngresoMovimiento(m);
          return (
            <span>
              <Tag
                value={ingreso === true ? "INGRESO" : ingreso === false ? "EGRESO" : "-"}
                severity={ingreso === true ? "success" : ingreso === false ? "danger" : "info"}
                style={{ marginRight: 6 }}
              />
              {m.tipoMovimiento?.nombre || "-"}
            </span>
          );
        }}
      />
      <Column header="Empresa" body={(m) => m.empresa?.razonSocial || "-"} />
      <Column
        header="Cuenta (origen / destino)"
        body={(m) => (
          <div>
            {m.cuentaCorrienteOrigen && <div>Origen: {nombreCuenta(m.cuentaCorrienteOrigen)}</div>}
            {m.cuentaCorrienteDestino && <div>Destino: {nombreCuenta(m.cuentaCorrienteDestino)}</div>}
            {!m.cuentaCorrienteOrigen && !m.cuentaCorrienteDestino && "-"}
          </div>
        )}
      />
      <Column header="Medio de pago" style={{ width: 130 }} body={(m) => m.medioPago?.nombre || "-"} />
      <Column header="N° Op. banco" style={{ width: 110 }} body={(m) => m.numeroOperacionPagoBanco || "-"} />
      <Column
        header="Monto"
        style={{ textAlign: "right", width: 140 }}
        body={(m) => `${m.moneda?.simbolo || ""} ${formatearNumero(Number(m.monto), 2)}`}
      />
      <Column
        header="Fecha"
        style={{ width: 100 }}
        body={(m) => (m.fechaOperacionMovCaja ? new Date(m.fechaOperacionMovCaja).toLocaleDateString("es-PE") : "-")}
      />
    </DataTable>
  );
}

export default function PrestamoEntidadForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  readOnly = false,
  puedeCrear = false,
  puedeEliminar = false,
}) {
  const toast = useRef(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [monedas, setMonedas] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [procesandoAsiento, setProcesandoAsiento] = useState(false);
  const [filasExpandidas, setFilasExpandidas] = useState(null);
  const [pagosExpandidos, setPagosExpandidos] = useState(null);

  // Préstamo generado desde Tesorería, con pagos o que no es saldo inicial: solo datos básicos
  const generadoDesdeTesoreria = Boolean(defaultValues?.movimientoCajaDesembolsoId);
  const cantidadPagos = defaultValues?.pagos?.length || 0;
  const esSaldoInicialSinCaja = isEdit && Boolean(defaultValues?.esSaldoInicial) && !generadoDesdeTesoreria;
  // Con asiento de apertura, los montos, la empresa y la contraparte ya no se pueden cambiar
  const soloDatosBasicos =
    isEdit && (!defaultValues?.esSaldoInicial || generadoDesdeTesoreria || cantidadPagos > 0 || asientos.length > 0);

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      empresaId: defaultValues?.empresaId ? Number(defaultValues.empresaId) : null,
      sentido: defaultValues?.sentido || "RECIBIDO",
      esAccionista: defaultValues?.esAccionista === undefined ? true : Boolean(defaultValues.esAccionista),
      entidadComercialId: defaultValues?.entidadComercialId ? Number(defaultValues.entidadComercialId) : null,
      monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : null,
      montoDesembolsado: Number(defaultValues?.montoDesembolsado || 0),
      montoPagadoAnterior: Number(defaultValues?.montoPagadoAnterior || 0),
      tipoCambioAplicado: defaultValues?.tipoCambioAplicado ? Number(defaultValues.tipoCambioAplicado) : null,
      fechaDesembolso: defaultValues?.fechaDesembolso ? new Date(defaultValues.fechaDesembolso) : null,
      fechaVencimiento: defaultValues?.fechaVencimiento ? new Date(defaultValues.fechaVencimiento) : null,
      fechaContable: defaultValues?.fechaContable ? new Date(defaultValues.fechaContable) : null,
      esGerencial: Boolean(defaultValues?.esGerencial),
      observaciones: defaultValues?.observaciones || "",
    },
  });

  const monedaIdWatch = watch("monedaId");
  const montoWatch = watch("montoDesembolsado");
  const pagadoAnteriorWatch = watch("montoPagadoAnterior");
  const esAccionistaWatch = watch("esAccionista");
  const sentidoWatch = watch("sentido");
  const empresaIdWatch = watch("empresaId");
  const entidadIdWatch = watch("entidadComercialId");

  useEffect(() => {
    (async () => {
      try {
        setMonedas(await getMonedas());
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "No se pudieron cargar los catálogos",
          detail: mensajeDeError(error, "Error al cargar empresas y monedas"),
          life: 8000,
        });
      } finally {
        setCargandoDatos(false);
      }
    })();
  }, []);

  const cargarAsientos = async () => {
    if (!esSaldoInicialSinCaja || !defaultValues?.id) return;
    try {
      setAsientos(await getAsientosAperturaPrestamoEntidad(Number(defaultValues.id)));
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudieron cargar los asientos de apertura",
        detail: mensajeDeError(error, "Error al consultar los asientos de apertura"),
        life: 8000,
      });
    }
  };

  useEffect(() => {
    cargarAsientos();
  }, [defaultValues?.id]);

  const generarAsiento = async () => {
    setProcesandoAsiento(true);
    try {
      await generarAsientoAperturaPrestamoEntidad(Number(defaultValues.id));
      toast.current?.show({
        severity: "success",
        summary: "Asiento de apertura generado",
        detail: "Se generó el asiento de apertura del préstamo.",
        life: 4000,
      });
      await cargarAsientos();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "No se pudo generar el asiento de apertura",
        detail: mensajeDeError(error, "Error al generar el asiento de apertura"),
        life: 12000,
      });
    } finally {
      setProcesandoAsiento(false);
    }
  };

  const confirmarEliminarAsientos = () =>
    confirmDialog({
      message: "Se eliminará el asiento de apertura pendiente del préstamo. ¿Desea continuar?",
      header: "Eliminar asiento de apertura",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setProcesandoAsiento(true);
        try {
          await eliminarAsientosAperturaPrestamoEntidad(Number(defaultValues.id));
          toast.current?.show({ severity: "success", summary: "Asiento eliminado", detail: "El asiento de apertura fue eliminado.", life: 3000 });
          await cargarAsientos();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "No se pudo eliminar el asiento",
            detail: mensajeDeError(error, "Error al eliminar el asiento de apertura"),
            life: 12000,
          });
        } finally {
          setProcesandoAsiento(false);
        }
      },
    });

  const lineasAsientoTemplate = (asiento) => (
    <DataTable value={asiento.detalles || []} size="small" showGridlines>
      <Column field="numeroLinea" header="#" style={{ width: 50 }} />
      <Column header="Cuenta" body={(d) => `${d.planCuenta?.codigoCuenta} - ${d.planCuenta?.nombreCuenta}`} />
      <Column header="Debe" body={(d) => formatearNumero(Number(d.debe), 2)} style={{ textAlign: "right", width: 120 }} />
      <Column header="Haber" body={(d) => formatearNumero(Number(d.haber), 2)} style={{ textAlign: "right", width: 120 }} />
    </DataTable>
  );

  const monedasOptions = monedas.map((m) => ({ label: m.codigoSunat, value: Number(m.id) }));
  const monedaSeleccionada = useMemo(
    () => monedas.find((m) => Number(m.id) === Number(monedaIdWatch)),
    [monedas, monedaIdWatch],
  );
  const simbolo = monedaSeleccionada?.simbolo || defaultValues?.moneda?.simbolo || "";
  const saldoCalculado = Math.max(0, Number(montoWatch || 0) - Number(pagadoAnteriorWatch || 0));
  const otraParte = sentidoWatch === "OTORGADO" ? "Deudor" : "Prestamista";

  const validar = (data) => {
    const faltantes = [];
    if (!data.empresaId) faltantes.push("Empresa");
    if (!data.entidadComercialId) faltantes.push(`${data.sentido === "OTORGADO" ? "Deudor" : "Prestamista"} (${data.esAccionista ? "accionista" : "tercero"})`);
    if (!soloDatosBasicos) {
      if (!data.sentido) faltantes.push("Rol de la empresa (Prestamista o Deudor)");
      if (!data.monedaId) faltantes.push("Moneda");
      if (!(Number(data.montoDesembolsado) > 0)) faltantes.push("Monto desembolsado");
      if (!data.fechaDesembolso) faltantes.push("Fecha de desembolso");
    }
    if (faltantes.length > 0) {
      toast.current?.show({
        severity: "error",
        summary: "Dato obligatorio",
        detail: `Complete los campos obligatorios: ${faltantes.join(", ")}.`,
        life: 6000,
      });
      return false;
    }
    return true;
  };

  const onSubmitForm = async (data) => {
    if (!validar(data)) return;
    setGuardando(true);
    try {
      const aIso = (fecha) => (fecha?.toISOString ? fecha.toISOString() : fecha || null);
      const dataToSend = {
        empresaId: data.empresaId,
        entidadComercialId: data.entidadComercialId,
        sentido: data.sentido,
        esAccionista: data.esAccionista,
        monedaId: data.monedaId,
        montoDesembolsado: data.montoDesembolsado,
        montoPagadoAnterior: data.montoPagadoAnterior || 0,
        tipoCambioAplicado: data.tipoCambioAplicado || null,
        fechaDesembolso: aIso(data.fechaDesembolso),
        fechaVencimiento: aIso(data.fechaVencimiento),
        fechaContable: aIso(data.fechaContable),
        esGerencial: data.esGerencial,
        observaciones: data.observaciones,
      };
      const resultado = isEdit
        ? await updatePrestamoEntidad(Number(defaultValues.id), dataToSend)
        : await createPrestamoEntidad(dataToSend);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: isEdit ? "Préstamo actualizado correctamente" : "Préstamo registrado correctamente",
        life: 3000,
      });
      onSubmit?.(resultado);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: isEdit ? "No se pudo actualizar el préstamo" : "No se pudo registrar el préstamo",
        detail: mensajeDeError(error, "Error al guardar el préstamo con accionista o tercero"),
        life: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const bloqueado = (basico = false) => readOnly || guardando || (basico ? false : soloDatosBasicos);

  if (cargandoDatos) return <div>Cargando...</div>;

  return (
    <div>
      <Toast ref={toast} />

      {!isEdit && (
        <Message
          severity="info"
          style={{ width: "100%", marginBottom: 10 }}
          text="Use este formulario solo para registrar préstamos anteriores al sistema (saldo inicial). Los préstamos nuevos y sus devoluciones se registran en Tesorería Pendientes, en la operación Préstamos Accionistas / Terceros."
        />
      )}
      {isEdit && generadoDesdeTesoreria && (
        <Message
          severity="info"
          style={{ width: "100%", marginBottom: 10 }}
          text={`Préstamo generado desde Tesorería${
            defaultValues?.refOperacionEspecializadaMovCaja ? ` (operación #${defaultValues.refOperacionEspecializadaMovCaja})` : ""
          }: solo puede modificar el vencimiento y las observaciones. Para anularlo, revierta la operación en Tesorería Pendientes.`}
        />
      )}
      {isEdit && !generadoDesdeTesoreria && soloDatosBasicos && (
        <Message
          severity="warn"
          style={{ width: "100%", marginBottom: 10 }}
          text="El préstamo ya tiene devoluciones o asiento de apertura registrados: solo puede modificar el vencimiento y las observaciones. Para cambiar montos, la empresa o el Prestamista y el Deudor, elimine primero el asiento de apertura."
        />
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 0.6 }}>
          <label htmlFor="numeroPrestamo" style={etiqueta}>N° del Préstamo</label>
          <InputText
            id="numeroPrestamo"
            value={isEdit ? defaultValues?.numeroPrestamo || "" : ""}
            placeholder="Se genera al guardar"
            disabled
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.4 }}>
          <label style={etiqueta}>Estado</label>
          <div style={{ paddingTop: 8 }}>
            {isEdit ? (
              <Tag
                value={defaultValues?.estado?.descripcion || "N/A"}
                severity={defaultValues?.estado?.severityColor}
                style={{ fontWeight: "bold" }}
              />
            ) : (
              <Tag value="VIGENTE" severity="info" style={{ fontWeight: "bold" }} />
            )}
          </div>
        </div>
      </div>

      <PartesPrestamoEntidad
        esPrestamista={sentidoWatch === "OTORGADO"}
        onRolChange={(v) => setValue("sentido", v ? "OTORGADO" : "RECIBIDO")}
        empresaId={empresaIdWatch}
        onEmpresaChange={(id) => setValue("empresaId", id)}
        esAccionista={esAccionistaWatch}
        onTipoChange={(v) => setValue("esAccionista", v)}
        entidadId={entidadIdWatch}
        onEntidadChange={(id) => setValue("entidadComercialId", id)}
        disabled={bloqueado()}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 0.5 }}>
          <label htmlFor="monedaId" style={etiqueta}>Moneda *</label>
          <Controller
            name="monedaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="monedaId"
                value={field.value}
                options={monedasOptions}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione moneda"
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoDesembolsado" style={etiqueta}>Monto Desembolsado *</label>
          <Controller
            name="montoDesembolsado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="montoDesembolsado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix={simbolo ? `${simbolo} ` : undefined}
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="montoPagadoAnterior" style={etiqueta}>Devuelto antes del sistema</label>
          <Controller
            name="montoPagadoAnterior"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="montoPagadoAnterior"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix={simbolo ? `${simbolo} ` : undefined}
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={etiqueta}>Saldo de Capital</label>
          <InputNumber
            value={isEdit ? Number(defaultValues?.saldoCapital || 0) : saldoCalculado}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            prefix={simbolo ? `${simbolo} ` : undefined}
            disabled
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 0.6 }}>
          <label htmlFor="tipoCambioAplicado" style={etiqueta}>T/C del desembolso</label>
          <Controller
            name="tipoCambioAplicado"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="tipoCambioAplicado"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={4}
                maxFractionDigits={4}
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaDesembolso" style={etiqueta}>Fecha de Desembolso *</label>
          <Controller
            name="fechaDesembolso"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaDesembolso"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaVencimiento" style={etiqueta}>Fecha de Vencimiento</label>
          <Controller
            name="fechaVencimiento"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaVencimiento"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
                disabled={bloqueado(true)}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaContable" style={etiqueta}>Fecha Contable</label>
          <Controller
            name="fechaContable"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaContable"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                disabled={bloqueado()}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 0.7 }}>
          <label htmlFor="esGerencial" style={etiqueta}>Tipo de Libro</label>
          <Controller
            name="esGerencial"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                labelTrue="Gerencial"
                labelFalse="Fiscal"
                severityTrue="warning"
                severityFalse="success"
                value={field.value}
                onChange={field.onChange}
                disabled={bloqueado()}
              />
            )}
          />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label htmlFor="observaciones" style={etiqueta}>Observaciones</label>
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id="observaciones"
              {...field}
              rows={2}
              autoResize
              disabled={bloqueado(true)}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>

      {isEdit && generadoDesdeTesoreria && (
        <div style={{ marginBottom: 10 }}>
          <label style={etiqueta}>
            Movimientos de caja del desembolso
            {defaultValues?.refOperacionEspecializadaMovCaja ? ` (operación #${defaultValues.refOperacionEspecializadaMovCaja})` : ""}
          </label>
          <MovimientosCajaTabla movimientos={defaultValues?.movimientosDesembolso || []} />
        </div>
      )}

      {isEdit && (
        <div style={{ marginBottom: 10 }}>
          <label style={etiqueta}>
            Devoluciones registradas ({cantidadPagos}) - despliegue una fila para ver sus movimientos de caja
          </label>
          <DataTable
            value={defaultValues?.pagos || []}
            size="small"
            stripedRows
            showGridlines
            dataKey="id"
            expandedRows={pagosExpandidos}
            onRowToggle={(e) => setPagosExpandidos(e.data)}
            rowExpansionTemplate={(p) => <MovimientosCajaTabla movimientos={p.movimientos || []} />}
            emptyMessage="Aún no tiene devoluciones."
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column expander style={{ width: 40 }} />
            <Column
              field="fechaPago"
              header="Fecha"
              body={(p) => new Date(p.fechaPago).toLocaleDateString("es-PE")}
              style={{ width: 110 }}
            />
            <Column field="refOperacionEspecializadaMovCaja" header="Operación" body={(p) => (p.refOperacionEspecializadaMovCaja ? `#${p.refOperacionEspecializadaMovCaja}` : "-")} style={{ width: 100 }} />
            <Column
              field="montoAplicado"
              header="Capital aplicado"
              body={(p) => `${simbolo} ${formatearNumero(Number(p.montoAplicado), 2)}`}
              style={{ textAlign: "right", width: 150 }}
            />
            <Column header="Medio de pago" body={(p) => p.medioPago?.nombre || "-"} style={{ width: 150 }} />
            <Column field="numeroOperacion" header="N° Operación" body={(p) => p.numeroOperacion || "-"} style={{ width: 130 }} />
            <Column
              field="tipoCambio"
              header="T/C"
              body={(p) => Number(p.tipoCambio || 1).toFixed(4)}
              style={{ textAlign: "center", width: 90 }}
            />
          </DataTable>
        </div>
      )}

      {esSaldoInicialSinCaja && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
            <label style={{ ...etiqueta, flex: 1 }}>Asiento contable de apertura ({asientos.length})</label>
            <Button
              type="button"
              label="Generar Asiento de Apertura"
              icon="pi pi-book"
              severity="success"
              onClick={generarAsiento}
              loading={procesandoAsiento}
              disabled={asientos.length > 0 || !puedeCrear || procesandoAsiento || Number(defaultValues?.estadoId) === 85}
              tooltip={asientos.length > 0 ? "El préstamo ya tiene asiento de apertura" : "Genera el asiento del saldo pendiente contra 591101 (utilidades acumuladas)"}
            />
            <Button
              type="button"
              label="Eliminar Asiento"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={confirmarEliminarAsientos}
              disabled={asientos.length === 0 || !puedeEliminar || procesandoAsiento}
            />
          </div>
          <DataTable
            value={asientos}
            size="small"
            stripedRows
            showGridlines
            dataKey="id"
            expandedRows={filasExpandidas}
            onRowToggle={(e) => setFilasExpandidas(e.data)}
            rowExpansionTemplate={lineasAsientoTemplate}
            emptyMessage="Aún no se generó el asiento de apertura de este saldo inicial."
            style={{ fontSize: getResponsiveFontSize() }}
          >
            <Column expander style={{ width: 40 }} />
            <Column field="empresa.razonSocial" header="Empresa" />
            <Column field="numeroAsiento" header="N° Asiento" style={{ width: 150 }} />
            <Column field="fechaAsiento" header="Fecha" body={(a) => new Date(a.fechaAsiento).toLocaleDateString("es-PE")} style={{ width: 110 }} />
            <Column field="glosa" header="Glosa" />
            <Column header="Total (S/)" body={(a) => formatearNumero(Number(a.detalles?.[0] ? a.detalles.reduce((s, d) => s + Number(d.debe), 0) : 0), 2)} style={{ textAlign: "right", width: 120 }} />
            <Column header="Estado" body={(a) => <Tag value={a.estado?.descripcion || "N/A"} severity={a.estado?.severityColor} />} style={{ width: 110 }} />
          </DataTable>
        </div>
      )}

      <ConfirmDialog />

      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
          <Button label="Cancelar" icon="pi pi-times" severity="secondary" onClick={onCancel} outlined disabled={guardando} />
          <Button
            label={isEdit ? "Actualizar Préstamo" : "Registrar Préstamo"}
            icon="pi pi-save"
            severity="success"
            onClick={handleSubmit(onSubmitForm)}
            loading={guardando}
          />
        </div>
      )}
    </div>
  );
}
