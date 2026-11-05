// src/components/contratoPersonal/ContratoPersonalForm.jsx
// Formulario de contrato de personal con sus líneas de pago (planilla u honorarios).
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { classNames } from "primereact/utils";
import { getPersonal } from "../../api/personal";
import BooleanToggleButton from "../common/BooleanToggleButton";
import AuditoriaDialog from "../common/AuditoriaDialog";
import EmpresaSelector from "../common/EmpresaSelector";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const PERIODICIDADES = [
  { label: "Semanal (7 días)", value: 7 },
  { label: "Quincenal (15 días)", value: 15 },
  { label: "Mensual (30 días)", value: 30 },
];

const FORMAS_LINEA = [
  { label: "Monto fijo", value: "monto" },
  { label: "Porcentaje", value: "porcentaje" },
  { label: "Calculada por la planilla", value: "calculada" },
  { label: "Saldo (lo que queda)", value: "saldo" },
];

const DESTINOS_LINEA = [
  { label: "Planilla", value: true },
  { label: "Honorarios", value: false },
];

const aFecha = (valor) => (valor ? new Date(valor) : null);

// La línea guardada usa cuatro campos excluyentes; en pantalla se edita con una "forma" y un valor
const lineaAFormulario = (linea) => ({
  esPlanilla: linea.esPlanilla !== false,
  forma: linea.esSaldo ? "saldo" : linea.esCalculada ? "calculada" : linea.porcentaje !== null && linea.porcentaje !== undefined ? "porcentaje" : "monto",
  valor: linea.monto !== null && linea.monto !== undefined ? Number(linea.monto) : linea.porcentaje !== null && linea.porcentaje !== undefined ? Number(linea.porcentaje) : null,
});

const formularioALinea = (linea) => ({
  esPlanilla: linea.esPlanilla,
  monto: linea.forma === "monto" ? Number(linea.valor) : null,
  porcentaje: linea.forma === "porcentaje" ? Number(linea.valor) : null,
  esCalculada: linea.forma === "calculada",
  esSaldo: linea.forma === "saldo",
});

export default function ContratoPersonalForm({ contrato, empresaFija, personalAuditoria = [], onSave, onCancel, readOnly = false, loading = false }) {
  const usuario = useAuthStore((state) => state.usuario);
  const [personal, setPersonal] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [errorLineas, setErrorLineas] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      empresaId: empresaFija ? Number(empresaFija) : null,
      personalId: null,
      esLocacionServicios: false,
      fechaInicio: null,
      fechaFin: null,
      remuneracionBasica: null,
      esJornal: false,
      periodicidadDias: 30,
      pagaPorTemporada: false,
      liquidaBeneficiosEnBoleta: false,
      activo: true,
    },
    mode: "onTouched",
  });

  const empresaId = watch("empresaId");
  const pagaPorTemporada = watch("pagaPorTemporada");
  const esLocacionServicios = watch("esLocacionServicios");

  // Trabajadores de la empresa del contrato
  useEffect(() => {
    const cargar = async () => {
      if (!empresaId) {
        setPersonal([]);
        return;
      }
      try {
        const data = await getPersonal(empresaId);
        setPersonal(
          (data || [])
            .filter((p) => !p.cesado || Number(p.id) === Number(contrato?.personalId))
            .map((p) => ({ id: Number(p.id), label: `${p.apellidos} ${p.nombres} - ${p.numeroDocumento}` })),
        );
      } catch (error) {
        console.error("Error al cargar el personal:", error);
      }
    };
    cargar();
  }, [empresaId, contrato?.personalId]);

  useEffect(() => {
    if (contrato) {
      reset({
        empresaId: Number(contrato.empresaId),
        personalId: Number(contrato.personalId),
        esLocacionServicios: Boolean(contrato.esLocacionServicios),
        fechaInicio: aFecha(contrato.fechaInicio),
        fechaFin: aFecha(contrato.fechaFin),
        remuneracionBasica: Number(contrato.remuneracionBasica),
        esJornal: Boolean(contrato.esJornal),
        periodicidadDias: contrato.periodicidadDias ?? null,
        pagaPorTemporada: Boolean(contrato.pagaPorTemporada),
        liquidaBeneficiosEnBoleta: Boolean(contrato.liquidaBeneficiosEnBoleta),
        activo: contrato.activo !== false,
      });
      setLineas((contrato.lineasPago || []).map(lineaAFormulario));
    } else if (empresaFija) {
      reset((valores) => ({ ...valores, empresaId: Number(empresaFija) }));
    }
  }, [contrato, empresaFija, reset]);

  // ── Líneas de pago ─────────────────────────────────────────

  const agregarLinea = () =>
    setLineas((actuales) => [...actuales, { esPlanilla: !esLocacionServicios, forma: "monto", valor: null }]);

  const actualizarLinea = (indice, cambios) =>
    setLineas((actuales) => actuales.map((l, i) => (i === indice ? { ...l, ...cambios } : l)));

  const quitarLinea = (indice) => setLineas((actuales) => actuales.filter((_, i) => i !== indice));

  const validarLineas = () => {
    for (let i = 0; i < lineas.length; i++) {
      const { forma, valor } = lineas[i];
      if ((forma === "monto" || forma === "porcentaje") && !(Number(valor) > 0)) {
        return `La línea ${i + 1} necesita un ${forma === "monto" ? "monto" : "porcentaje"} mayor a cero.`;
      }
      if (forma === "saldo" && i !== lineas.length - 1) return "La línea de saldo debe ser la última.";
    }
    if (lineas.filter((l) => l.forma === "saldo").length > 1) return "Solo puede haber una línea de saldo.";
    return "";
  };

  const onSubmit = (data) => {
    const mensaje = validarLineas();
    setErrorLineas(mensaje);
    if (mensaje) return;
    onSave({
      empresaId: Number(data.empresaId),
      personalId: Number(data.personalId),
      esLocacionServicios: Boolean(data.esLocacionServicios),
      // Fechas persistidas: ISO de la medianoche local (nunca texto YYYY-MM-DD)
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin ? data.fechaFin.toISOString() : null,
      remuneracionBasica: Number(data.remuneracionBasica),
      esJornal: Boolean(data.esJornal),
      periodicidadDias: data.pagaPorTemporada ? null : Number(data.periodicidadDias),
      pagaPorTemporada: Boolean(data.pagaPorTemporada),
      liquidaBeneficiosEnBoleta: Boolean(data.liquidaBeneficiosEnBoleta),
      activo: Boolean(data.activo),
      lineasPago: lineas.map(formularioALinea),
    });
  };

  const bloqueado = readOnly || loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div style={{ display: "flex", gap: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 2 }}>
          <label>Empresa *</label>
          <Controller
            name="empresaId"
            control={control}
            rules={{ required: "Seleccione la empresa del contrato" }}
            render={({ field }) => (
              <EmpresaSelector
                empresaId={field.value ? Number(field.value) : null}
                onEmpresaChange={(id) => {
                  field.onChange(id);
                  setValue("personalId", null);
                }}
                disabled={bloqueado || Boolean(contrato)}
              />
            )}
          />
          <small className="p-error">{errors.empresaId?.message}</small>
        </div>
        <div style={{ flex: 2 }}>
          <label>Trabajador *</label>
          <Controller
            name="personalId"
            control={control}
            rules={{ required: "Seleccione el trabajador" }}
            render={({ field }) => (
              <Dropdown
                value={field.value ? Number(field.value) : null}
                options={personal}
                optionLabel="label"
                optionValue="id"
                placeholder={empresaId ? "Seleccione el trabajador" : "Seleccione primero la empresa"}
                filter
                showClear
                onChange={(e) => field.onChange(e.value)}
                className={classNames({ "p-invalid": errors.personalId })}
                style={{ fontWeight: "bold" }}
                disabled={bloqueado || !empresaId || Boolean(contrato)}
              />
            )}
          />
          <small className="p-error">{errors.personalId?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Tipo de contrato</label>
          <Controller
            name="esLocacionServicios"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="LOCACIÓN DE SERVICIOS (HONORARIOS)"
                labelFalse="PLANILLA"
                severityTrue="warning"
                severityFalse="info"
                icon="pi-id-card"
                disabled={bloqueado}
              />
            )}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label>Fecha de inicio *</label>
          <Controller
            name="fechaInicio"
            control={control}
            rules={{ required: "La fecha de inicio es obligatoria" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": errors.fechaInicio })}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.fechaInicio?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Fecha de fin (vacío = vigente)</label>
          <Controller
            name="fechaFin"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                showButtonBar
                disabled={bloqueado}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Remuneración básica (S/) *</label>
          <Controller
            name="remuneracionBasica"
            control={control}
            rules={{ required: "La remuneración básica es obligatoria", min: { value: 0.01, message: "Debe ser mayor a cero" } }}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="PEN"
                locale="es-PE"
                className={classNames({ "p-invalid": errors.remuneracionBasica })}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.remuneracionBasica?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>La remuneración es</label>
          <Controller
            name="esJornal"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="JORNAL DIARIO"
                labelFalse="SUELDO MENSUAL"
                severityTrue="help"
                severityFalse="secondary"
                icon="pi-calendar"
                disabled={bloqueado}
              />
            )}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <label>Periodicidad de pago</label>
          <Controller
            name="periodicidadDias"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                options={PERIODICIDADES}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccione la periodicidad"
                disabled={bloqueado || pagaPorTemporada}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Pago por temporada</label>
          <Controller
            name="pagaPorTemporada"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="POR TEMPORADA O FAENA"
                labelFalse="PERIODICIDAD FIJA"
                severityTrue="info"
                severityFalse="secondary"
                icon="pi-clock"
                disabled={bloqueado}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Beneficios sociales</label>
          <Controller
            name="liquidaBeneficiosEnBoleta"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="SE LIQUIDAN EN CADA BOLETA"
                labelFalse="SE PROVISIONAN CADA MES"
                severityTrue="help"
                severityFalse="secondary"
                icon="pi-receipt"
                disabled={bloqueado}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Estado</label>
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="ACTIVO"
                labelFalse="INACTIVO"
                severityTrue="success"
                severityFalse="danger"
                icon={field.value ? "pi-check-circle" : "pi-times-circle"}
                disabled={bloqueado}
              />
            )}
          />
        </div>
      </div>

      {/* Líneas de pago */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h4 style={{ margin: 0 }}>Líneas de pago</h4>
          <Button
            type="button"
            label="Agregar línea"
            icon="pi pi-plus"
            size="small"
            severity="success"
            outlined
            onClick={agregarLinea}
            disabled={bloqueado}
          />
        </div>
        <small style={{ color: "#666" }}>
          Reparten lo que se paga entre planilla y honorarios. Sin líneas, todo el contrato se paga por su destino habitual. El saldo es una sola línea y va al final.
        </small>
        <DataTable value={lineas} size="small" showGridlines emptyMessage="Sin líneas de pago" style={{ marginTop: 8 }}>
          <Column header="#" body={(_, opciones) => opciones.rowIndex + 1} style={{ width: 50 }} />
          <Column
            header="Destino"
            body={(linea, opciones) => (
              <Dropdown
                value={linea.esPlanilla}
                options={DESTINOS_LINEA}
                onChange={(e) => actualizarLinea(opciones.rowIndex, { esPlanilla: e.value })}
                disabled={bloqueado}
              />
            )}
          />
          <Column
            header="Forma"
            body={(linea, opciones) => (
              <Dropdown
                value={linea.forma}
                options={FORMAS_LINEA}
                onChange={(e) =>
                  actualizarLinea(opciones.rowIndex, {
                    forma: e.value,
                    valor: e.value === "monto" || e.value === "porcentaje" ? linea.valor : null,
                  })
                }
                disabled={bloqueado}
              />
            )}
          />
          <Column
            header="Valor"
            body={(linea, opciones) =>
              linea.forma === "monto" || linea.forma === "porcentaje" ? (
                <InputNumber
                  value={linea.valor}
                  onValueChange={(e) => actualizarLinea(opciones.rowIndex, { valor: e.value })}
                  mode={linea.forma === "monto" ? "currency" : "decimal"}
                  currency="PEN"
                  locale="es-PE"
                  suffix={linea.forma === "porcentaje" ? " %" : undefined}
                  minFractionDigits={2}
                  disabled={bloqueado}
                />
              ) : (
                <span style={{ color: "#888" }}>-</span>
              )
            }
          />
          <Column
            body={(_, opciones) => (
              <Button
                type="button"
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                onClick={() => quitarLinea(opciones.rowIndex)}
                disabled={bloqueado}
              />
            )}
            style={{ width: 60 }}
          />
        </DataTable>
        {errorLineas && <small className="p-error">{errorLineas}</small>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end", gap: 8, marginTop: 18 }}>
        {/* Auditoría (solo en edición) */}
        {contrato && (
          <div style={{ flex: 1 }}>
            <AuditoriaDialog
              data={contrato}
              fieldMapping={{
                fechaCreacion: "creadoEn",
                creadoPor: "creadoPor",
                fechaActualizacion: "actualizadoEn",
                actualizadoPor: "actualizadoPor",
              }}
              usuarios={personalAuditoria.map((p) => ({ label: `${p.nombres} ${p.apellidos}`.trim(), value: Number(p.id) }))}
              esSuperUsuario={Boolean(usuario?.esSuperUsuario)}
              buttonProps={{
                label: usuario?.esSuperUsuario ? "Auditoría" : "Ver Auditoría",
                className: "p-button-info",
                style: { width: "100%" },
              }}
            />
          </div>
        )}
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          onClick={onCancel}
          disabled={loading}
          className="p-button-warning"
          severity="warning"
          raised
          size="small"
        />
        <Button
          type="submit"
          label={contrato ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={bloqueado}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
