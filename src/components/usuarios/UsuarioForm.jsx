// src/components/usuarios/UsuarioForm.jsx
// Formulario modular y reutilizable para alta y edición de usuarios en el ERP Megui.
// Usa react-hook-form y Yup para validación profesional y desacoplada.
// Cumple SRP y puede integrarse en cualquier modal/dialog.
import React, { useState, useEffect } from "react"; // Importación necesaria para estados y efectos en React
import { useForm, Controller } from "react-hook-form"; // Importación de Controller para formularios controlados
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import DetListaAccesosAModulosUsuario from "./DetListaAccesosAModulosUsuario";

// Esquema de validación profesional con Yup alineado al modelo Usuario de Prisma
const schema = Yup.object().shape({
  username: Yup.string().required("El nombre de usuario es obligatorio"),
  password: Yup.string()
    .min(6, "Mínimo 6 caracteres")
    .when("isEdit", {
      is: false,
      then: (schema) => schema.required("La contraseña es obligatoria"),
      otherwise: (schema) => schema.notRequired(),
    }),
  empresaId: Yup.number()
    .typeError("La empresa es obligatoria")
    .required("La empresa es obligatoria"),
  personalId: Yup.number()
    .typeError("El personal debe ser un número")
    .nullable(),
  esSuperUsuario: Yup.boolean(),
  esAdmin: Yup.boolean(),
  esUsuario: Yup.boolean(),
  activo: Yup.boolean(),
  intentosFallidos: Yup.number().min(0).default(0),
  bloqueadoHasta: Yup.date().nullable(),
  motivoInactivacion: Yup.string().nullable(),
  inactivadoPor: Yup.number().nullable(),
  fechaInactivacion: Yup.date().nullable(),
});

/**
 * Componente de formulario de usuario.
 * @param {Object} props
 * @param {boolean} props.isEdit Si es edición o alta
 * @param {Object} props.defaultValues Valores iniciales
 * @param {function} props.onSubmit Callback al guardar
 * @param {function} props.onCancel Callback al cancelar
 * @param {boolean} props.loading Estado de loading
 */
import { format } from "date-fns";

/**
 * Valida si un valor es una fecha válida para evitar errores de formateo.
 * Soporta strings, Date y null/undefined.
 * Retorna true solo si la fecha es válida.
 */
function esFechaValida(fecha) {
  if (!fecha) return false;
  const d = new Date(fecha);
  return d instanceof Date && !isNaN(d.getTime());
}

export default function UsuarioForm({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading,
}) {
  // Importa y usa watch y setValue de react-hook-form
  // Agrega 'control' de useForm para uso con Controller (formularios controlados)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: defaultValues.username || "",
      password: defaultValues.password || "",
      empresaId: defaultValues.empresaId || null,
      personalId: defaultValues.personalId || null,
      esSuperUsuario: defaultValues.esSuperUsuario || false,
      esAdmin: defaultValues.esAdmin || false,
      esUsuario: defaultValues.esUsuario !== undefined ? defaultValues.esUsuario : true,
      activo: defaultValues.activo !== undefined ? defaultValues.activo : true,
    },
  });

  // Estados locales para empresas y personal
  const [empresas, setEmpresas] = useState([]);
  const [personal, setPersonal] = useState([]);

  // Estado para accesos del usuario
  const [accesos, setAccesos] = useState(defaultValues.accesosUsuario || []);

  // Carga empresas al montar el formulario
  useEffect(() => {
    async function cargarEmpresas() {
      try {
        const data = await import("../../api/empresa").then((mod) =>
          mod.getEmpresas()
        );
        setEmpresas(data);
      } catch (err) {
        // Manejo profesional de errores
        setEmpresas([]);
      }
    }
    cargarEmpresas();
  }, []);

  // Carga personal dependiente al cambiar empresa
  const cargarPersonal = async (empresaId) => {
    if (!empresaId) {
      setPersonal([]);
      return;
    }
    try {
      const data = await import("../../api/personal").then((mod) =>
        mod.getPersonal(empresaId)
      );
      setPersonal(data);
    } catch (err) {
      setPersonal([]);
    }
  };

  // Si hay empresa seleccionada en defaultValues, carga personal correspondiente
  useEffect(() => {
    if (defaultValues.empresaId) {
      cargarPersonal(defaultValues.empresaId);
    } else {
      setPersonal([]);
    }
    
    setAccesos(defaultValues.accesosUsuario || []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manejador para cambios en accesos
  const handleAccesosChange = (nuevosAccesos) => {
    setAccesos(nuevosAccesos);
  };

  // Wrapper del onSubmit para incluir accesos
  const handleFormSubmit = (data) => {
    onSubmit({ ...data, accesosUsuario: accesos });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="p-fluid">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 2 }}>
            {/* Campo: Empresa (empresaId) como combo profesional */}
            <label htmlFor="empresaId">Empresa</label>
            {/*
            Combo profesional de empresa usando Controller para integración total con react-hook-form y PrimeReact.
            Solo limpia personalId y recarga personal si la empresa realmente cambia.
          */}
            <Controller
              name="empresaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value}
                  options={empresas}
                  optionLabel="razonSocial"
                  optionValue="id"
                  placeholder="Seleccione una empresa"
                  className={errors.empresaId ? "p-invalid" : ""}
                  onChange={(e) => {
                    if (field.value !== e.value) {
                      field.onChange(e.value);
                      setValue("personalId", null); // Solo limpia si cambia
                      cargarPersonal(e.value);
                    }
                  }}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>
          <div style={{ flex: 2 }}>
            {/* Campo: Personal relacionado (personalId) como combo dependiente */}
            <label htmlFor="personalId">Personal</label>
            {/*
            Se mapea el array de personal para agregar la propiedad nombreCompleto,
            que concatena nombres, apellidos y cargo si existe, para mostrarlo en el combo.
          */}
            {/*
            Combo profesional de personal usando Controller para integración total con react-hook-form y PrimeReact.
            El evento onChange actualiza correctamente el valor seleccionado incluso al hacer clic sobre el texto.
          */}
            <Controller
              name="personalId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="personalId"
                  value={field.value}
                  options={personal.map((p) => ({
                    ...p,
                    nombreCompleto: `${p.nombres} ${p.apellidos}${
                      p.cargo ? " - " + p.cargo.descripcion : ""
                    }`,
                  }))}
                  optionLabel="nombreCompleto"
                  optionValue="id"
                  placeholder="Seleccione personal"
                  className={errors.personalId ? "p-invalid" : ""}
                  disabled={!watch("empresaId")}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
            {errors.personalId && (
              <small className="p-error">{errors.personalId.message}</small>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Campo: Nombre de usuario (username) */}
            <label htmlFor="username">Nombre de usuario</label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <InputText
                  id="username"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={errors.username ? "p-invalid" : ""}
                  autoFocus
                  autoComplete="off"
                  style={{ fontWeight: "bold", backgroundColor: "#FFF82A" }}
                />
              )}
            />
            {errors.username && (
              <small className="p-error">{errors.username.message}</small>
            )}
          </div>
          {!isEdit && (
            <div style={{ flex: 1 }}>
              {/* Campo: Contraseña (solo en alta) */}
              <label htmlFor="password">Contraseña</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="password"
                    type="password"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={errors.password ? "p-invalid" : ""}
                    autoComplete="new-password"
                  />
                )}
              />
              {errors.password && (
                <small className="p-error">{errors.password.message}</small>
              )}
            </div>
          )}

          <div style={{ flex: 1 }}>
            {/* Campo: ¿Superusuario? */}
            <Button
              type="button"
              label="SUPERUSUARIO"
              icon={watch("esSuperUsuario") ? "pi pi-check" : "pi pi-times"}
              className={
                watch("esSuperUsuario")
                  ? "p-button-success"
                  : "p-button-secondary"
              }
              severity={watch("esSuperUsuario") ? "success" : "secondary"}
              onClick={() =>
                setValue("esSuperUsuario", !watch("esSuperUsuario"))
              }
              style={{ width: "100%" }}
              size="small"
              raised
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* Campo: ¿Administrador? */}
            <Button
              type="button"
              label="ADMINISTRADOR"
              icon={watch("esAdmin") ? "pi pi-check" : "pi pi-times"}
              className={
                watch("esAdmin") ? "p-button-warning" : "p-button-secondary"
              }
              severity={watch("esAdmin") ? "warning" : "secondary"}
              onClick={() => setValue("esAdmin", !watch("esAdmin"))}
              style={{ width: "100%" }}
              size="small"
              raised
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* Campo: ¿Usuario? */}
            <Button
              type="button"
              label="USUARIO"
              icon={watch("esUsuario") ? "pi pi-check" : "pi pi-times"}
              className={
                watch("esUsuario") ? "p-button-primary" : "p-button-secondary"
              }
              severity={watch("esUsuario") ? "primary" : "secondary"}
              onClick={() => setValue("esUsuario", !watch("esUsuario"))}
              style={{ width: "100%" }}
              size="small"
              raised
            />
          </div>
          <div style={{ flex: 1 }}>
            {/* Campo: ¿Activo? */}
            <Button
              type="button"
              label="ACTIVO"
              icon={watch("activo") ? "pi pi-check" : "pi pi-times"}
              className={
                watch("activo") ? "p-button-primary" : "p-button-secondary"
              }
              severity={watch("activo") ? "primary" : "secondary"}
              onClick={() => setValue("activo", !watch("activo"))}
              style={{ width: "100%" }}
              size="small"
              raised
            />
          </div>
        </div>

        {/* Campos de seguridad y auditoría */}
        {isEdit && (
          <div
            style={{
              marginTop: 5,
              padding: 5,
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
              border: "1px solid #dee2e6",
            }}
          >
            <h4 style={{ marginTop: 0, color: "#495057" }}>
              Información de Seguridad y Auditoría
            </h4>

            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              {/* Password Hash - Protegido con asteriscos */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <label htmlFor="passwordHash">Contraseña (Hash)</label>
                <InputText
                  id="passwordHash"
                  value="********************"
                  disabled
                  style={{ fontWeight: "bold", backgroundColor: "#e9ecef" }}
                />
              </div>

              {/* Intentos Fallidos */}
              <div style={{ flex: 0.5, textAlign: "center" }}>
                <label htmlFor="intentosFallidos">Intentos Fallidos</label>
                <InputText
                  id="intentosFallidos"
                  value={defaultValues.intentosFallidos || 0}
                  disabled
                  style={{
                    fontWeight: "bold",
                    color:
                      defaultValues.intentosFallidos > 0
                        ? "#d32f2f"
                        : "inherit",
                    backgroundColor: "#e9ecef",
                  }}
                />
              </div>

              {/* Bloqueado Hasta */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <label htmlFor="bloqueadoHasta">Bloqueado Hasta</label>
                <InputText
                  id="bloqueadoHasta"
                  value={
                    defaultValues.bloqueadoHasta &&
                    esFechaValida(defaultValues.bloqueadoHasta)
                      ? format(
                          new Date(defaultValues.bloqueadoHasta),
                          "dd/MM/yyyy HH:mm"
                        )
                      : "No bloqueado"
                  }
                  disabled
                  style={{
                    fontWeight: "bold",
                    color: defaultValues.bloqueadoHasta ? "#d32f2f" : "inherit",
                    backgroundColor: "#e9ecef",
                  }}
                />
              </div>

              {/* Motivo de Inactivación */}
              <div style={{ flex: 2, textAlign: "center" }}>
                <label htmlFor="motivoInactivacion">
                  Motivo de Inactivación
                </label>
                <InputText
                  id="motivoInactivacion"
                  value={defaultValues.motivoInactivacion || "Sin motivo"}
                  disabled
                  style={{ backgroundColor: "#e9ecef" }}
                />
              </div>

              {/* Inactivado Por */}
              <div style={{ flex: 0.5, textAlign: "center" }}>
                <label htmlFor="inactivadoPor">Inactivado Por</label>
                <InputText
                  id="inactivadoPor"
                  value={defaultValues.inactivadoPor || "N/A"}
                  disabled
                  style={{ backgroundColor: "#e9ecef" }}
                />
              </div>

              {/* Fecha de Inactivación */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <label htmlFor="fechaInactivacion">Fecha de Inactivación</label>
                <InputText
                  id="fechaInactivacion"
                  value={
                    defaultValues.fechaInactivacion &&
                    esFechaValida(defaultValues.fechaInactivacion)
                      ? format(
                          new Date(defaultValues.fechaInactivacion),
                          "dd/MM/yyyy HH:mm"
                        )
                      : "No inactivado"
                  }
                  disabled
                  style={{ backgroundColor: "#e9ecef" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs para organizar información */}
        {isEdit && (
          <div style={{ marginTop: 2 }}>
            <TabView>
              <TabPanel header="Accesos a Módulos" leftIcon="pi pi-lock">
                <DetListaAccesosAModulosUsuario
                  accesos={accesos}
                  onChange={handleAccesosChange}
                  disabled={loading}
                  esSuperUsuario={watch("esSuperUsuario")}
                  esAdmin={watch("esAdmin")}
                  esUsuario={watch("esUsuario")}
                  usuarioId={defaultValues.id}
                />
              </TabPanel>
            </TabView>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <div style={{ flex: 2 }}>
            {/*
          Campos informativos de fechas solo en edición.
          Se muestran en formato profesional usando date-fns.
          Documentado en español técnico para mantenibilidad.
        */}
            {isEdit && (
              <div className="p-field">
                <label>Fecha de creación:</label>
                <span>
                  {esFechaValida(defaultValues.fechaCreacion)
                    ? format(
                        new Date(defaultValues.fechaCreacion),
                        "dd/MM/yyyy HH:mm"
                      )
                    : "No disponible"}
                </span>
              </div>
            )}
            {isEdit && (
              <div className="p-field">
                <label>Último acceso:</label>
                <span>
                  {esFechaValida(defaultValues.fechaUltimoAcceso)
                    ? format(
                        new Date(defaultValues.fechaUltimoAcceso),
                        "dd/MM/yyyy HH:mm"
                      )
                    : "No disponible"}
                </span>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              type="button"
              onClick={onCancel}
              disabled={loading || isSubmitting}
              className="p-button-warning"
              severity="warning"
              raised
              size="small"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              label={isEdit ? "Actualizar" : "Guardar"}
              icon="pi pi-check"
              type="submit"
              loading={loading || isSubmitting}
              className="p-button-success"
              severity="success"
              raised
              size="small"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
