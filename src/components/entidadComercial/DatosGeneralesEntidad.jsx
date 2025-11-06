/**
 * DatosGeneralesEntidad.jsx
 *
 * Componente Card para gestionar los datos generales de una entidad comercial.
 * Incluye campos básicos de identificación, configuración y estado.
 * Sigue el patrón profesional ERP Megui con React Hook Form.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { ButtonGroup } from "primereact/buttongroup"; // Importar ButtonGroup
import { Controller, useWatch } from "react-hook-form";
import { classNames } from "primereact/utils";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import {
  consultarReniec,
  consultarSunatRucFull,
} from "../../api/consultaExterna";
import { getUbigeos } from "../../api/ubigeo";
import { getDepartamentos } from "../../api/departamento";
import { getProvincias } from "../../api/provincia";
import { 
  crearDireccionEntidad, 
  actualizarDireccionEntidad,
  getDireccionesEntidad 
} from "../../api/direccionEntidad";

/**
 * Componente DatosGeneralesEntidad
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Array} props.empresas - Lista de empresas
 * @param {Array} props.tiposDocumento - Lista de tipos de documento
 * @param {Array} props.tiposEntidad - Lista de tipos de entidad
 * @param {Array} props.formasPago - Lista de formas de pago
 * @param {Array} props.agrupaciones - Lista de agrupaciones
 * @param {boolean} props.esEdicion - Indica si está en modo edición
 * @param {number} props.entidadComercialId - ID de la entidad comercial (para direcciones fiscales)
 * @param {Function} props.onDatosGeneralesChange - Callback para notificar cambios
 * @param {Function} props.setValue - Función setValue de React Hook Form
 * @param {Object} props.toast - Referencia al componente Toast
 * @param {Function} props.getValues - Función getValues de React Hook Form
 */
const DatosGeneralesEntidad = ({
  control,
  errors,
  empresas,
  tiposDocumento,
  tiposEntidad,
  formasPago,
  agrupaciones,
  esEdicion,
  entidadComercialId,
  onDatosGeneralesChange,
  setValue,
  toast,
  getValues,
  readOnly = false,
  loading = false,
}) => {
  // Referencias y estado
  const toastRef = useRef(null);
  const [buscandoDocumento, setBuscandoDocumento] = useState(false);
  const lastDataRef = useRef(null);

  // Observar cambios en los campos principales
  const watchedFields = useWatch({
    control,
    name: [
      "empresaId",
      "tipoDocumentoId",
      "tipoEntidadId",
      "numeroDocumento",
      "razonSocial",
      "nombreComercial",
      "formaPagoId",
      "agrupacionEntidadId",
      "esCliente",
      "esProveedor",
      "esCorporativo",
      "estado",
      "codigoErpFinanciero",
      "sujetoRetencion",
      "sujetoPercepcion",
      "estadoActivoSUNAT",
      "condicionHabidoSUNAT",
      "esAgenteRetencion",
    ],
  });

  // Observar cambios específicos en tipoDocumentoId y numeroDocumento
  const tipoDocumentoId = watchedFields?.tipoDocumentoId || useWatch({ control, name: "tipoDocumentoId" });
  const numeroDocumento = watchedFields?.numeroDocumento || useWatch({ control, name: "numeroDocumento" });

  /**
   * Buscar datos por DNI en RENIEC
   * @param {string} dni - Número de DNI
   */
  const buscarPorDNI = async (dni) => {
    try {
      setBuscandoDocumento(true);
      const datos = await consultarReniec(dni);

      // Asignar datos encontrados
      const nombreCompleto = [
        datos.first_name,
        datos.first_last_name,
        datos.second_last_name
      ].filter(Boolean).join(' ');

      setValue("razonSocial", nombreCompleto || "");

      toast?.current?.show({
        severity: "success",
        summary: "Consulta RENIEC",
        detail: `Datos encontrados para DNI: ${dni}`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error consultando RENIEC:", error);
      toast?.current?.show({
        severity: "warn",
        summary: "Consulta RENIEC",
        detail:
          error.message || "No se encontraron datos para el DNI ingresado",
        life: 4000,
      });
    } finally {
      setBuscandoDocumento(false);
    }
  };

  /**
   * Crear o actualizar dirección fiscal automáticamente con datos de SUNAT
   * @param {Object} datosSunat - Datos devueltos por la API de SUNAT
   */
  const crearActualizarDireccionFiscal = async (datosSunat) => {
    try {
      // Si no hay ID de entidad comercial, solo retornamos null (no creamos dirección)
      if (!entidadComercialId) {
        return null;
      }

      // 1. Buscar ubigeo por código SUNAT
      const ubigeos = await getUbigeos();
      const ubigeoEncontrado = ubigeos.find(u => u.codigo === datosSunat.ubigeo);
      
      if (!ubigeoEncontrado) {
        throw new Error(`No se encontró el ubigeo con código: ${datosSunat.ubigeo}`);
      }

      // 2. Buscar departamento y provincia para construir direccionArmada
      const [departamentos, provincias] = await Promise.all([
        getDepartamentos(),
        getProvincias()
      ]);

      const departamento = departamentos.find(d => Number(d.id) === Number(ubigeoEncontrado.departamentoId));
      const provincia = provincias.find(p => Number(p.id) === Number(ubigeoEncontrado.provinciaId));

      if (!departamento || !provincia) {
        throw new Error("No se encontraron datos completos de ubicación geográfica");
      }

      // 3. Construir direccionArmada
      const direccionArmada = [
        datosSunat.direccion,
        ubigeoEncontrado.nombreDistrito || "",
        departamento.nombre,
        provincia.nombre
      ].filter(Boolean).join(", ");

      // 4. Preparar datos para la dirección fiscal
      const datosDireccionFiscal = {
        entidadComercialId: Number(entidadComercialId),
        direccion: datosSunat.direccion,
        direccionArmada: direccionArmada,
        ubigeoId: Number(ubigeoEncontrado.id),
        fiscal: true,
        almacenPrincipal: false,
        activo: true
      };
      return datosDireccionFiscal;
      
    } catch (error) {
      console.error("Error en crearActualizarDireccionFiscal:", error);
      throw error;
    }
  };

  /**
   * Buscar datos por RUC en SUNAT
   * @param {string} ruc - Número de RUC
   */
  const buscarPorRUC = async (ruc) => {
    try {
      setBuscandoDocumento(true);
      const datos = await consultarSunatRucFull(ruc);

      // Asignar datos encontrados a campos principales
      setValue("razonSocial", datos.razon_social || "");
      setValue("nombreComercial", datos.razon_social || "");

      // Mapear campos SUNAT a campos de la entidad
      setValue("estadoActivoSUNAT", datos.estado === "ACTIVO");
      setValue("condicionHabidoSUNAT", datos.condicion === "HABIDO");
      setValue("esAgenteRetencion", Boolean(datos.es_agente_retencion));

      // Preparar dirección fiscal automática (solo si hay datos de dirección)
      let direccionFiscalAutomatica = null;
      if (datos.direccion && datos.ubigeo) {
        try {
          direccionFiscalAutomatica = await crearActualizarDireccionFiscal(datos);
        } catch (errorDireccion) {
          console.error("Error preparando dirección fiscal:", errorDireccion);
          toast?.current?.show({
            severity: "warn",
            summary: "Dirección Fiscal",
            detail: `Datos SUNAT obtenidos correctamente, pero hubo un problema preparando la dirección fiscal: ${errorDireccion.message}`,
            life: 8000,
          });
        }
      }

      // Notificar al componente padre con todos los datos (incluyendo dirección fiscal automática)
      const valoresActuales = getValues();
      
      const datosCompletos = {
        empresaId: valoresActuales.empresaId || watchedFields?.empresaId,
        tipoDocumentoId: valoresActuales.tipoDocumentoId || watchedFields?.tipoDocumentoId,
        tipoEntidadId: valoresActuales.tipoEntidadId || watchedFields?.tipoEntidadId,
        numeroDocumento: ruc,
        razonSocial: datos.razon_social || "",
        nombreComercial: datos.razon_social || "",
        formaPagoId: valoresActuales.formaPagoId || watchedFields?.formaPagoId,
        agrupacionEntidadId: valoresActuales.agrupacionEntidadId || watchedFields?.agrupacionEntidadId,
        esCliente: valoresActuales.esCliente ?? watchedFields?.esCliente ?? false,
        esProveedor: valoresActuales.esProveedor ?? watchedFields?.esProveedor ?? false,
        esCorporativo: valoresActuales.esCorporativo ?? watchedFields?.esCorporativo ?? false,
        estado: valoresActuales.estado ?? watchedFields?.estado ?? true,
        codigoErpFinanciero: valoresActuales.codigoErpFinanciero || watchedFields?.codigoErpFinanciero || "",
        sujetoRetencion: valoresActuales.sujetoRetencion ?? watchedFields?.sujetoRetencion ?? false,
        sujetoPercepcion: valoresActuales.sujetoPercepcion ?? watchedFields?.sujetoPercepcion ?? false,
        estadoActivoSUNAT: datos.estado === "ACTIVO",
        condicionHabidoSUNAT: datos.condicion === "HABIDO",
        esAgenteRetencion: Boolean(datos.es_agente_retencion),
        direccionFiscalAutomatica: direccionFiscalAutomatica // ← CLAVE: Pasar dirección fiscal al padre
      };

      onDatosGeneralesChange?.(datosCompletos);

      // Mostrar notificación de éxito
      const estadoInfo = datos.estado === "ACTIVO" ? "✅ Activo" : "❌ Inactivo";
      toast?.current?.show({
        severity: "success",
        summary: "Consulta SUNAT",
        detail: `${datos.razon_social}\nEstado: ${estadoInfo}${direccionFiscalAutomatica ? '\nDirección fiscal preparada automáticamente' : ''}`,
        life: 5000,
      });

    } catch (error) {
      console.error("Error consultando SUNAT:", error);
      toast?.current?.show({
        severity: "warn",
        summary: "Consulta SUNAT",
        detail: error.message || "No se encontraron datos para el RUC ingresado",
        life: 4000,
      });
    } finally {
      setBuscandoDocumento(false);
    }
  };

  /**
   * Manejar búsqueda manual cuando el usuario hace clic en el botón
   */
  const manejarBusquedaManual = async () => {
    if (!numeroDocumento || !tipoDocumentoId) {
      toast?.current?.show({
        severity: "warn",
        summary: "Búsqueda",
        detail: "Seleccione el tipo de documento e ingrese el número",
        life: 3000,
      });
      return;
    }

    // DNI (tipo documento = 1) - debe tener 8 dígitos
    if (
      Number(tipoDocumentoId) === 1 &&
      numeroDocumento.length === 8 &&
      /^\d+$/.test(numeroDocumento)
    ) {
      await buscarPorDNI(numeroDocumento);
    }

    // RUC (tipo documento = 2) - debe tener 11 dígitos
    else if (
      Number(tipoDocumentoId) === 2 &&
      numeroDocumento.length === 11 &&
      /^\d+$/.test(numeroDocumento)
    ) {
      await buscarPorRUC(numeroDocumento);
    } else {
      toast?.current?.show({
        severity: "warn",
        summary: "Búsqueda",
        detail: "Formato de documento inválido",
        life: 3000,
      });
    }
  };

  // Función estable para notificar cambios
  const notificarCambios = useCallback(
    (datos) => {
      if (onDatosGeneralesChange) {
        // Comparar con los datos anteriores para evitar llamadas innecesarias
        const datosString = JSON.stringify(datos);
        if (lastDataRef.current !== datosString) {
          lastDataRef.current = datosString;
          onDatosGeneralesChange(datos);
        }
      }
    },
    [onDatosGeneralesChange]
  );

  // Efecto para notificar cambios cuando los campos cambien
  useEffect(() => {
    const datos = {
      empresaId: watchedFields?.empresaId ?? getValues("empresaId"),
      tipoDocumentoId: watchedFields?.tipoDocumentoId ?? getValues("tipoDocumentoId"),
      tipoEntidadId: watchedFields?.tipoEntidadId ?? getValues("tipoEntidadId"),
      numeroDocumento: watchedFields?.numeroDocumento ?? getValues("numeroDocumento"),
      razonSocial: watchedFields?.razonSocial ?? getValues("razonSocial"),
      nombreComercial: watchedFields?.nombreComercial ?? getValues("nombreComercial"),
      formaPagoId: watchedFields?.formaPagoId ?? getValues("formaPagoId"),
      agrupacionEntidadId: watchedFields?.agrupacionEntidadId ?? getValues("agrupacionEntidadId"),
      esCliente: watchedFields?.esCliente ?? getValues("esCliente"),
      esProveedor: watchedFields?.esProveedor ?? getValues("esProveedor"),
      esCorporativo: watchedFields?.esCorporativo ?? getValues("esCorporativo"),
      estado: watchedFields?.estado ?? getValues("estado"),
      codigoErpFinanciero: watchedFields?.codigoErpFinanciero ?? getValues("codigoErpFinanciero"),
      sujetoRetencion: watchedFields?.sujetoRetencion ?? getValues("sujetoRetencion"),
      sujetoPercepcion: watchedFields?.sujetoPercepcion ?? getValues("sujetoPercepcion"),
      estadoActivoSUNAT: watchedFields?.estadoActivoSUNAT ?? getValues("estadoActivoSUNAT"),
      condicionHabidoSUNAT: watchedFields?.condicionHabidoSUNAT ?? getValues("condicionHabidoSUNAT"),
      esAgenteRetencion: watchedFields?.esAgenteRetencion ?? getValues("esAgenteRetencion"),
    };

    notificarCambios(datos);
  }, [watchedFields, notificarCambios]);

  /**
   * Obtiene la clase CSS para campos con errores
   * @param {string} fieldName - Nombre del campo
   * @returns {string} Clase CSS
   */
  const getFieldClass = (fieldName) => {
    return classNames({
      "p-invalid": errors[fieldName],
    });
  };

  /**
   * Obtiene mensaje de error de validación
   * @param {string} name - Nombre del campo
   * @returns {JSX.Element|null} Elemento de error o null
   */
  const getFormErrorMessage = (name) => {
    return errors[name] ? (
      <small className="p-error p-d-block">{errors[name].message}</small>
    ) : null;
  };

  // Preparar opciones para dropdowns con validaciones defensivas
  const empresasOptions = (empresas || []).map((empresa) => ({
    label: empresa.razonSocial,
    value: Number(empresa.id),
  }));

  const tiposDocumentoOptions = (tiposDocumento || []).map((tipo) => ({
    label: tipo.codigo,
    value: Number(tipo.id),
  }));

  const tiposEntidadOptions = (tiposEntidad || []).map((tipo) => ({
    label: tipo.nombre,
    value: Number(tipo.id),
  }));

  const formasPagoOptions = (formasPago || []).map((forma) => ({
    label: forma.nombre,
    value: Number(forma.id),
  }));

  const agrupacionesOptions = (agrupaciones || []).map((agrupacion) => ({
    label: agrupacion.nombre,
    value: Number(agrupacion.id),
  }));

  return (
    <Card title="Datos Generales de la Entidad" className="mb-4">
      <div className="p-fluid formgrid grid">
        {/* Primera fila: Empresa y Tipo Documento */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId">
              Empresa <span className="p-error">*</span>
            </label>
            <Controller
              name="empresaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="empresaId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={empresasOptions}
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("empresaId")}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("empresaId")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="agrupacionEntidadId">Agrupación</label>
            <Controller
              name="agrupacionEntidadId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="agrupacionEntidadId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={agrupacionesOptions}
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("agrupacionEntidadId")}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("agrupacionEntidadId")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoEntidadId">
              Tipo Entidad <span className="p-error">*</span>
            </label>
            <Controller
              name="tipoEntidadId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoEntidadId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposEntidadOptions}
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("tipoEntidadId")}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("tipoEntidadId")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="formaPagoId">Forma de Pago</label>
            <Controller
              name="formaPagoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="formaPagoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={formasPagoOptions}
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("formaPagoId")}
                  showClear
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("formaPagoId")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="codigoErpFinanciero">Cod. ERP Financiero</label>
            <Controller
              name="codigoErpFinanciero"
              control={control}
              render={({ field }) => (
                <InputText
                  id="codigoErpFinanciero"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={getFieldClass("codigoErpFinanciero")}
                  maxLength={20}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("codigoErpFinanciero")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoDocumentoId">
              Tipo Documento <span className="p-error">*</span>
            </label>
            <Controller
              name="tipoDocumentoId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipoDocumentoId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={tiposDocumentoOptions}
                  style={{ fontWeight: "bold" }}
                  className={getFieldClass("tipoDocumentoId")}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("tipoDocumentoId")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroDocumento">
              N°Documento <span className="p-error">*</span>
            </label>
            <div style={{ display: "flex", gap: "5px", alignItems: "stretch" }}>
              <Controller
                name="numeroDocumento"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="numeroDocumento"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    style={{
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                    className={getFieldClass("numeroDocumento")}
                    maxLength={20}
                    disabled={buscandoDocumento || readOnly || loading}
                  />
                )}
              />
              <Button
                type="button"
                icon={
                  buscandoDocumento ? "pi pi-spin pi-spinner" : "pi pi-search"
                }
                className="p-button-outlined p-button-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  manejarBusquedaManual();
                }}
                disabled={
                  buscandoDocumento || 
                  !numeroDocumento || 
                  !tipoDocumentoId ||
                  readOnly ||
                  loading
                }
                tooltip={
                  Number(tipoDocumentoId) === 1
                    ? "Buscar en RENIEC"
                    : Number(tipoDocumentoId) === 2
                    ? "Buscar en SUNAT"
                    : "Seleccione tipo de documento"
                }
                tooltipOptions={{ position: "top" }}
                style={{ minWidth: "40px" }}
              />
            </div>
            {buscandoDocumento && (
              <small className="p-text-secondary">
                <i
                  className="pi pi-spin pi-spinner"
                  style={{ fontSize: "0.8rem", marginRight: "5px" }}
                ></i>
                {Number(tipoDocumentoId) === 1
                  ? "Consultando RENIEC..."
                  : "Consultando SUNAT..."}
              </small>
            )}
            {getFormErrorMessage("numeroDocumento")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="razonSocial">
              Razón Social <span className="p-error">*</span>
            </label>
            <Controller
              name="razonSocial"
              control={control}
              render={({ field }) => (
                <InputText
                  id="razonSocial"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  className={getFieldClass("razonSocial")}
                  maxLength={255}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("razonSocial")}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="nombreComercial">Nombre Comercial</label>
            <Controller
              name="nombreComercial"
              control={control}
              render={({ field }) => (
                <InputText
                  id="nombreComercial"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  className={getFieldClass("nombreComercial")}
                  maxLength={255}
                  disabled={readOnly || loading}
                />
              )}
            />
            {getFormErrorMessage("nombreComercial")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <ButtonGroup>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="estado"
                  onLabel="ACTIVO"
                  offLabel="INACTIVO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("estado")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="esCliente"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="esCliente"
                  onLabel="CLIENTE"
                  offLabel="CLIENTE"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("esCliente")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="esProveedor"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="esProveedor"
                  onLabel="PROVEEDOR"
                  offLabel="PROVEEDOR"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("esProveedor")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="esCorporativo"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="esCorporativo"
                  onLabel="CORPORATIVO"
                  offLabel="CORPORATIVO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("esCorporativo")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
          </ButtonGroup>
        </div>

        {/* Sexta fila: ToggleButton de Tipo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            gap: 5,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <ButtonGroup>
            <Controller
              name="sujetoRetencion"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="sujetoRetencion"
                  onLabel="RETENCION"
                  offLabel="RETENCION"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("sujetoRetencion")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="sujetoPercepcion"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="sujetoPercepcion"
                  onLabel="PERCEPCION"
                  offLabel="PERCEPCION"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("sujetoPercepcion")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="estadoActivoSUNAT"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="estadoActivoSUNAT"
                  onLabel="SUNAT ACTIVO"
                  offLabel="SUNAT INACTIVO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("estadoActivoSUNAT")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="condicionHabidoSUNAT"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="condicionHabidoSUNAT"
                  onLabel="HABIDO"
                  offLabel="NO HABIDO"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("condicionHabidoSUNAT")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
            <Controller
              name="esAgenteRetencion"
              control={control}
              render={({ field }) => (
                <ToggleButton
                  id="esAgenteRetencion"
                  onLabel="AGENTE RETENCION"
                  offLabel="AGENTE RETENCION"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  className={`${getFieldClass("esAgenteRetencion")}`}
                  disabled={readOnly || loading}
                />
              )}
            />
          </ButtonGroup>
          {/* Mostrar errores de validación */}
          <div className="flex flex-wrap gap-2 mt-2">
            {getFormErrorMessage("esCliente")}
            {getFormErrorMessage("esProveedor")}
            {getFormErrorMessage("esCorporativo")}
            {getFormErrorMessage("estado")}
            {getFormErrorMessage("sujetoRetencion")}
            {getFormErrorMessage("sujetoPercepcion")}
            {getFormErrorMessage("estadoActivoSUNAT")}
            {getFormErrorMessage("condicionHabidoSUNAT")}
            {getFormErrorMessage("esAgenteRetencion")}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DatosGeneralesEntidad;
