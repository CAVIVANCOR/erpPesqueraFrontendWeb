// src/components/conceptoPlanilla/ConceptoPlanillaForm.jsx
// Formulario de concepto de planilla: naturaleza, cálculo, afectaciones, PLAME y cuentas por categoría.
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";
import BooleanToggleButton from "../common/BooleanToggleButton";
import AuditoriaDialog from "../common/AuditoriaDialog";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getTiposDeudaPersonalActivos } from "../../api/tesoreria/tipoDeudaPersonal";

const NATURALEZAS = [
  { label: "Ingreso", value: "ingreso" },
  { label: "Descuento al trabajador", value: "descuento" },
  { label: "Aporte del empleador", value: "aporte" },
  { label: "Provisión", value: "provision" },
];

const FORMAS_CALCULO = [
  { label: "Rutina del sistema (estructura legal propia)", value: "motor" },
  { label: "Fórmula", value: "formula" },
  { label: "Valor manual (lo escribe la jefa de personal)", value: "manual" },
];

const ORIGENES = ["CONTRATO", "PLANILLA", "ASISTENCIA", "PESCA", "PRESTAMO", "MANUAL"].map((origen) => ({ label: origen, value: origen }));

const AFECTACIONES = [
  ["afectaAfpOnp", "Base AFP/ONP"],
  ["afectaEssalud", "Base EsSalud"],
  ["afectaQuintaCategoria", "Base 5ta categoría"],
  ["afectaSctr", "Base SCTR"],
  ["cuentaParaGratificacion", "Cuenta para gratificación"],
  ["cuentaParaCts", "Cuenta para CTS"],
  ["cuentaParaVacaciones", "Cuenta para vacaciones"],
];

// Categorías del trabajador para las cuentas contables (se deducen de Personal: cargo de pesca, esObrero)
const CATEGORIAS = [
  { clave: "empleado", etiqueta: "Empleado", esObrero: false, esPescador: false },
  { clave: "obrero", etiqueta: "Obrero", esObrero: true, esPescador: false },
  { clave: "pescador", etiqueta: "Pescador", esObrero: false, esPescador: true },
];

const aFecha = (valor) => (valor ? new Date(valor) : null);
const aNaturaleza = (c) => (c.esDescuento ? "descuento" : c.esAporteEmpleador ? "aporte" : c.esProvision ? "provision" : "ingreso");
const aForma = (c) => (c.claveMotor ? "motor" : c.formula ? "formula" : "manual");

const VALORES_INICIALES = {
  codigo: "",
  descripcion: "",
  naturaleza: "ingreso",
  formaCalculo: "formula",
  claveMotor: "",
  formula: "",
  condicionAplica: "",
  afectaAfpOnp: false,
  afectaEssalud: false,
  afectaQuintaCategoria: false,
  afectaSctr: false,
  cuentaParaGratificacion: false,
  cuentaParaCts: false,
  cuentaParaVacaciones: false,
  esRecurrente: false,
  origen: "MANUAL",
  codigoPlame: "",
  tipoDeudaId: null,
  pasivoEsDelTrabajador: true,
  visibleEnBoleta: true,
  orden: 0,
  vigenteDesde: null,
  vigenteHasta: null,
};

export default function ConceptoPlanillaForm({ concepto, personalAuditoria = [], onSave, onCancel, loading = false, readOnly = false }) {
  const usuario = useAuthStore((state) => state.usuario);
  const [tiposDeuda, setTiposDeuda] = useState([]);
  const [cuentas, setCuentas] = useState({ empleado: {}, obrero: {}, pescador: {} });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: VALORES_INICIALES, mode: "onTouched" });

  const formaCalculo = watch("formaCalculo");

  useEffect(() => {
    const cargar = async () => {
      try {
        setTiposDeuda(((await getTiposDeudaPersonalActivos()) || []).map((t) => ({ ...t, id: Number(t.id) })));
      } catch (error) {
        console.error("Error al cargar los tipos de deuda con personal:", error);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    if (!concepto) {
      reset(VALORES_INICIALES);
      setCuentas({ empleado: {}, obrero: {}, pescador: {} });
      return;
    }
    reset({
      ...VALORES_INICIALES,
      ...Object.fromEntries(AFECTACIONES.map(([campo]) => [campo, Boolean(concepto[campo])])),
      codigo: concepto.codigo,
      descripcion: concepto.descripcion,
      naturaleza: aNaturaleza(concepto),
      formaCalculo: aForma(concepto),
      claveMotor: concepto.claveMotor || "",
      formula: concepto.formula || "",
      condicionAplica: concepto.condicionAplica || "",
      esRecurrente: Boolean(concepto.esRecurrente),
      origen: concepto.origen || "MANUAL",
      codigoPlame: concepto.codigoPlame || "",
      tipoDeudaId: concepto.tipoDeudaId ? Number(concepto.tipoDeudaId) : null,
      pasivoEsDelTrabajador: concepto.pasivoEsDelTrabajador !== false,
      visibleEnBoleta: concepto.visibleEnBoleta !== false,
      orden: concepto.orden ?? 0,
      vigenteDesde: aFecha(concepto.vigenteDesde),
      vigenteHasta: aFecha(concepto.vigenteHasta),
    });
    const porCategoria = { empleado: {}, obrero: {}, pescador: {} };
    (concepto.cuentas || []).forEach((cuenta) => {
      const clave = cuenta.esPescador ? "pescador" : cuenta.esObrero ? "obrero" : "empleado";
      porCategoria[clave] = {
        cuentaGastoId: cuenta.cuentaGastoId ? Number(cuenta.cuentaGastoId) : null,
        cuentaPasivoId: cuenta.cuentaPasivoId ? Number(cuenta.cuentaPasivoId) : null,
      };
    });
    setCuentas(porCategoria);
  }, [concepto, reset]);

  const actualizarCuenta = (clave, campo, valor) =>
    setCuentas((actuales) => ({ ...actuales, [clave]: { ...actuales[clave], [campo]: valor ? Number(valor) : null } }));

  const onSubmit = (data) => {
    onSave({
      codigo: data.codigo.trim().toUpperCase(),
      descripcion: data.descripcion.trim(),
      esDescuento: data.naturaleza === "descuento",
      esAporteEmpleador: data.naturaleza === "aporte",
      esProvision: data.naturaleza === "provision",
      claveMotor: data.formaCalculo === "motor" ? data.claveMotor?.trim() || null : null,
      formula: data.formaCalculo === "formula" ? data.formula?.trim() || null : null,
      esManual: data.formaCalculo === "manual",
      condicionAplica: data.condicionAplica?.trim() || null,
      ...Object.fromEntries(AFECTACIONES.map(([campo]) => [campo, Boolean(data[campo])])),
      esRecurrente: Boolean(data.esRecurrente),
      origen: data.origen,
      codigoPlame: data.codigoPlame?.trim() || null,
      tipoDeudaId: data.tipoDeudaId ? Number(data.tipoDeudaId) : null,
      pasivoEsDelTrabajador: Boolean(data.pasivoEsDelTrabajador),
      visibleEnBoleta: Boolean(data.visibleEnBoleta),
      orden: Number(data.orden) || 0,
      // Fechas persistidas: ISO de la medianoche local (nunca texto YYYY-MM-DD)
      vigenteDesde: data.vigenteDesde.toISOString(),
      vigenteHasta: data.vigenteHasta ? data.vigenteHasta.toISOString() : null,
      cuentas: CATEGORIAS.map(({ clave, esObrero, esPescador }) => ({
        esObrero,
        esPescador,
        cuentaGastoId: cuentas[clave]?.cuentaGastoId || null,
        cuentaPasivoId: cuentas[clave]?.cuentaPasivoId || null,
      })),
    });
  };

  const bloqueado = readOnly || loading;
  const fila = { display: "flex", gap: 10, marginTop: 10, flexDirection: window.innerWidth < 768 ? "column" : "row" };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Código *</label>
          <Controller
            name="codigo"
            control={control}
            rules={{ required: "El código es obligatorio", pattern: { value: /^[A-Za-z0-9_]+$/, message: "Solo letras, números y guion bajo" } }}
            render={({ field }) => (
              <InputText
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                maxLength={30}
                placeholder="Ej: SUELDO, AFP_APORTE"
                className={classNames({ "p-invalid": errors.codigo })}
                style={{ fontWeight: "bold" }}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.codigo?.message}</small>
        </div>
        <div style={{ flex: 3 }}>
          <label>Descripción (nombre en la boleta) *</label>
          <Controller
            name="descripcion"
            control={control}
            rules={{ required: "La descripción es obligatoria" }}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value || ""}
                maxLength={150}
                className={classNames({ "p-invalid": errors.descripcion })}
                style={{ fontWeight: "bold" }}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.descripcion?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Naturaleza</label>
          <Controller
            name="naturaleza"
            control={control}
            render={({ field }) => (
              <Dropdown value={field.value} options={NATURALEZAS} onChange={(e) => field.onChange(e.value)} disabled={bloqueado} />
            )}
          />
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 2 }}>
          <label>Forma de cálculo</label>
          <Controller
            name="formaCalculo"
            control={control}
            render={({ field }) => (
              <Dropdown value={field.value} options={FORMAS_CALCULO} onChange={(e) => field.onChange(e.value)} disabled={bloqueado} />
            )}
          />
        </div>
        <div style={{ flex: 3 }}>
          {formaCalculo === "motor" && (
            <>
              <label>Clave de la rutina del sistema *</label>
              <Controller
                name="claveMotor"
                control={control}
                rules={{ validate: (v) => formaCalculo !== "motor" || !!v?.trim() || "Ingrese la clave de la rutina" }}
                render={({ field }) => (
                  <InputText {...field} value={field.value || ""} maxLength={60} placeholder="Ej: RENTA_5TA" disabled={bloqueado} />
                )}
              />
              <small className="p-error">{errors.claveMotor?.message}</small>
            </>
          )}
          {formaCalculo === "formula" && (
            <>
              <label>Fórmula *</label>
              <Controller
                name="formula"
                control={control}
                rules={{ validate: (v) => formaCalculo !== "formula" || !!v?.trim() || "Ingrese la fórmula" }}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Ej: MIN(basico * 0.05, 300)"
                    disabled={bloqueado}
                    style={{ fontFamily: "monospace" }}
                  />
                )}
              />
              <small className="p-error">{errors.formula?.message}</small>
            </>
          )}
          {formaCalculo === "manual" && (
            <small style={{ color: "#666" }}>El valor lo escribe la jefa de personal en cada periodo.</small>
          )}
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Condición para que aplique (fórmula sí/no; vacío = siempre)</label>
          <Controller
            name="condicionAplica"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value || ""}
                rows={2}
                placeholder="Ej: ASIGNACION_FAMILIAR_APLICA = 1"
                disabled={bloqueado}
                style={{ fontFamily: "monospace" }}
              />
            )}
          />
        </div>
      </div>

      <h4 style={{ marginTop: 16, marginBottom: 6 }}>Afectaciones</h4>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {AFECTACIONES.map(([campo, etiqueta]) => (
          <Controller
            key={campo}
            name={campo}
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue={etiqueta.toUpperCase()}
                labelFalse={etiqueta.toUpperCase()}
                severityTrue="success"
                severityFalse="secondary"
                disabled={bloqueado}
                style={{ width: "auto" }}
              />
            )}
          />
        ))}
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Origen del valor</label>
          <Controller
            name="origen"
            control={control}
            render={({ field }) => <Dropdown value={field.value} options={ORIGENES} onChange={(e) => field.onChange(e.value)} disabled={bloqueado} />}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Periodicidad del valor</label>
          <Controller
            name="esRecurrente"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="RECURRENTE (DEL CONTRATO)"
                labelFalse="VARIABLE DEL PERIODO"
                severityTrue="info"
                severityFalse="secondary"
                icon={field.value ? "pi-replay" : "pi-pencil"}
                disabled={bloqueado}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Código PLAME (tabla 22)</label>
          <Controller
            name="codigoPlame"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} maxLength={10} disabled={bloqueado} />}
          />
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 2 }}>
          <label>Tipo de deuda con personal que genera</label>
          <Controller
            name="tipoDeudaId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value ? Number(field.value) : null}
                options={tiposDeuda}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione el tipo de deuda"
                filter
                showClear
                onChange={(e) => field.onChange(e.value)}
                disabled={bloqueado}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Destino de la deuda</label>
          <Controller
            name="pasivoEsDelTrabajador"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="DEUDA CON EL TRABAJADOR"
                labelFalse="DEUDA CON UNA ENTIDAD (AFP, SUNAT, ESSALUD)"
                severityTrue="primary"
                severityFalse="warning"
                icon={field.value ? "pi-user" : "pi-building"}
                disabled={bloqueado}
              />
            )}
          />
        </div>
      </div>

      <div style={fila}>
        <div style={{ flex: 1 }}>
          <label>Vigente desde *</label>
          <Controller
            name="vigenteDesde"
            control={control}
            rules={{ required: "La fecha de inicio es obligatoria" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={classNames({ "p-invalid": errors.vigenteDesde })}
                disabled={bloqueado}
              />
            )}
          />
          <small className="p-error">{errors.vigenteDesde?.message}</small>
        </div>
        <div style={{ flex: 1 }}>
          <label>Vigente hasta (vacío = sin fin)</label>
          <Controller
            name="vigenteHasta"
            control={control}
            render={({ field }) => (
              <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon showButtonBar disabled={readOnly || loading} />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Orden</label>
          <Controller
            name="orden"
            control={control}
            render={({ field }) => (
              <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} useGrouping={false} disabled={readOnly || loading} />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Boleta</label>
          <Controller
            name="visibleEnBoleta"
            control={control}
            render={({ field }) => (
              <BooleanToggleButton
                value={field.value}
                onChange={field.onChange}
                labelTrue="VISIBLE EN BOLETA"
                labelFalse="OCULTO EN BOLETA"
                severityTrue="success"
                severityFalse="secondary"
                icon={field.value ? "pi-eye" : "pi-eye-slash"}
                disabled={readOnly || loading}
              />
            )}
          />
        </div>
      </div>

      <h4 style={{ marginTop: 16, marginBottom: 6 }}>Cuentas contables por categoría del trabajador</h4>
      <small style={{ color: "#666" }}>
        La categoría se deduce de Personal: pescador (cargo patrón, motorista, panguero o tripulante), obrero (marca Obrero) o empleado.
      </small>
      {CATEGORIAS.map(({ clave, etiqueta }) => (
        <div key={clave} style={{ ...fila, alignItems: "flex-end" }}>
          <div style={{ flex: 0.5, fontWeight: "bold" }}>{etiqueta}</div>
          <div style={{ flex: 2 }}>
            <PlanCuentaContableSelector
              value={cuentas[clave]?.cuentaGastoId || null}
              onChange={(id) => actualizarCuenta(clave, "cuentaGastoId", id)}
              label="Cuenta del Debe (gasto; en un descuento, la deuda con el trabajador)"
              placeholder="Elegir cuenta del Debe"
              disabled={bloqueado}
              required={false}
              showClearButton={true}
            />
          </div>
          <div style={{ flex: 2 }}>
            <PlanCuentaContableSelector
              value={cuentas[clave]?.cuentaPasivoId || null}
              onChange={(id) => actualizarCuenta(clave, "cuentaPasivoId", id)}
              label="Cuenta del Haber (por pagar; en un descuento, la entidad)"
              placeholder="Elegir cuenta del Haber"
              disabled={bloqueado}
              required={false}
              showClearButton={true}
            />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end", gap: 8, marginTop: 18 }}>
        {/* Auditoría (solo en edición) */}
        {concepto && (
          <div style={{ flex: 1 }}>
            <AuditoriaDialog
              data={concepto}
              fieldMapping={{
                fechaCreacion: "creadoEn",
                creadoPor: "creadoPor",
                fechaActualizacion: "actualizadoEn",
                actualizadoPor: "actualizadoPor",
              }}
              usuarios={personalAuditoria.map((p) => ({ label: `${p.nombres} ${p.apellidos}`.trim(), value: Number(p.id), urlFotoPersona: p.urlFotoPersona }))}
              esSuperUsuario={Boolean(usuario?.esSuperUsuario)}
              buttonProps={{
                label: usuario?.esSuperUsuario ? "Auditoría" : "Ver Auditoría",
                className: "p-button-info",
                style: { width: "100%" },
              }}
            />
          </div>
        )}
        <Button type="button" label="Cancelar" icon="pi pi-times" onClick={onCancel} disabled={loading} className="p-button-warning" severity="warning" raised size="small" />
        <Button
          type="submit"
          label={concepto ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          disabled={readOnly || loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </form>
  );
}
