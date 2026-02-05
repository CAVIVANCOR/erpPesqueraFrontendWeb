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
import { DASHBOARD_TYPES } from "../../utils/utils";

// Esquema de validación profesional con Yup alineado al modelo Usuario de Prisma
const schema = Yup.object().shape({
  dashboardPorDefecto: Yup.string()
  .oneOf(["modular", "unidades"], "Debe seleccionar un dashboard válido")
  .required("El dashboard por defecto es obligatorio"),
  username: Yup.string().required("El nombre de usuario es obligatorio"),
  password: Yup.string().test("password-validation", function (value) {
    const { isEdit } = this.options.context || {};

    // En modo creación, password es obligatorio
    if (!isEdit) {
      if (!value || value.trim() === "") {
        return this.createError({ message: "La contraseña es obligatoria" });
      }
      if (value.length < 6) {
        return this.createError({ message: "Mínimo 6 caracteres" });
      }
    }

    // En modo edición, password es opcional
    // Si se proporciona, debe tener mínimo 6 caracteres
    if (isEdit && value && value.trim() !== "" && value.length < 6) {
      return this.createError({ message: "Mínimo 6 caracteres" });
    }

    return true;
  }),
  empresaId: Yup.number()
    .transform((value, originalValue) => {
      // Convertir string a number automáticamente
      return originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
        ? undefined
        : Number(originalValue);
    })
    .typeError("La empresa es obligatoria")
    .required("La empresa es obligatoria"),
  personalId: Yup.number()
    .transform((value, originalValue) => {
      // Convertir string a number automáticamente, permitir null
      return originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
        ? null
        : Number(originalValue);
    })
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
  readOnly = false,
  puedeCrear = false,
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
    context: { isEdit }, // Pasar isEdit como contexto a Yup
    defaultValues: {
      username: defaultValues.username || "",
      password: defaultValues.password || "",
      empresaId: defaultValues.empresaId || null,
      personalId: defaultValues.personalId || null,
      esSuperUsuario: defaultValues.esSuperUsuario || false,
      esAdmin: defaultValues.esAdmin || false,
      esUsuario:
        defaultValues.esUsuario !== undefined ? defaultValues.esUsuario : true,
      activo: defaultValues.activo !== undefined ? defaultValues.activo : true,
      dashboardPorDefecto: defaultValues.dashboardPorDefecto || "modular",
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
          mod.getEmpresas(),
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
        mod.getPersonal(empresaId),
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
                  placeholder="Seleccione empresa"
                  className={errors.empresaId ? "p-invalid" : ""}
                  filter
                  showClear
                  style={{ fontWeight: "bold" }}
                  disabled={readOnly}
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("personalId", null);
                    if (e.value) {
                      cargarPersonal(e.value);
                    } else {
                      setPersonal([]);
                    }
                  }}
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
                  disabled={!watch("empresaId") || readOnly}
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
                  disabled={readOnly}
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
                    disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
            />
          </div>
        </div>
        {/* Campo: Dashboard por Defecto */}
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <label htmlFor="dashboardPorDefecto">Dashboard por Defecto</label>
          <Controller
            name="dashboardPorDefecto"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="dashboardPorDefecto"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={DASHBOARD_TYPES}
                placeholder="Seleccione dashboard por defecto"
                className={errors.dashboardPorDefecto ? "p-invalid" : ""}
                disabled={readOnly}
                style={{ width: "100%", fontWeight: "bold" }}
              />
            )}
          />
          {errors.dashboardPorDefecto && (
            <small className="p-error">
              {errors.dashboardPorDefecto.message}
            </small>
          )}
          <small className="p-text-secondary">
            Define qué dashboard verá el usuario al iniciar sesión
          </small>
        </div>
        {/* Tabs para organizar información */}
        {isEdit && (
          <div style={{ marginTop: 2 }}>
            <TabView>
              <TabPanel header="Accesos a Módulos" leftIcon="pi pi-lock">
                <DetListaAccesosAModulosUsuario
                  accesos={accesos}
                  onChange={handleAccesosChange}
                  disabled={readOnly || loading}
                  esSuperUsuario={watch("esSuperUsuario")}
                  esAdmin={watch("esAdmin")}
                  esUsuario={watch("esUsuario")}
                  usuarioId={defaultValues.id}
                  puedeCrear={puedeCrear}
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
                        "dd/MM/yyyy HH:mm",
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
                        "dd/MM/yyyy HH:mm",
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
            {!readOnly && (
              <Button
                label={isEdit ? "Actualizar" : "Guardar"}
                icon="pi pi-check"
                type="submit"
                loading={loading || isSubmitting}
                className="p-button-success"
                severity="success"
                raised
                size="small"
                onClick={(e) => {
                  // Forzar validación manual para ver errores
                  handleSubmit(
                    (data) => {
                      handleFormSubmit(data);
                    },
                    (errors) => {
                      console.error("❌ ERRORES DE VALIDACIÓN:", errors);
                    },
                  )();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
