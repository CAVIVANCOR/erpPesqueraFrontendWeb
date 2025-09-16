// src/components/descargaFaenaPesca/DescargaFaenaPescaForm.jsx
// Formulario profesional para DescargaFaenaPesca - ERP Megui
// Maneja creación y edición con validaciones, combos dependientes y reglas de negocio
// Documentado en español técnico para mantenibilidad

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import {
  crearDescargaFaenaPesca,
  actualizarDescargaFaenaPesca,
} from "../../api/descargaFaenaPesca";
import { 
  capturarGPS, 
  formatearCoordenadas, 
  convertirDecimalADMS,
  crearInputCoordenadas 
} from "../../utils/gpsUtils";

/**
 * Formulario DescargaFaenaPescaForm
 *
 * Formulario profesional para gestión de descargas de faena de pesca.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Captura de GPS integrada
 * - Layout responsive siguiendo patrón DatosGeneralesFaenaPesca
 * 
 * Props esperadas desde el componente padre:
 * - puertos: Array de puertos (todos los puertos disponibles)
 * - clientes: Array de clientes filtrados por EntidadComercial (empresaId, tipoEntidadId=8, esCliente=true, estado=true)
 * - especies: Array de especies
 * - bahiaId: ID de bahía (valor fijo desde FaenaPesca)
 * - motoristaId: ID de motorista (valor fijo desde FaenaPesca)
 * - patronId: ID de patrón (valor fijo desde FaenaPesca)
 * - faenaPescaId: ID de faena de pesca (valor fijo desde FaenaPesca)
 * - temporadaPescaId: ID de temporada de pesca (valor fijo desde FaenaPesca)
 */
export default function DescargaFaenaPescaForm({
  detalle,
  puertos = [],
  clientes = [],
  especies = [],
  bahiaId = null,
  motoristaId = null,
  patronId = null,
  faenaPescaId = null,
  temporadaPescaId = null,
  onGuardadoExitoso,
  onCancelar,
}) {
  // Estados para loading
  const [loading, setLoading] = useState(false);

  // Configuración del formulario
  const {
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      faenaPescaId: faenaPescaId,
      temporadaPescaId: temporadaPescaId,
      puertoDescargaId: null,
      fechaHoraArriboPuerto: null,
      fechaHoraLlegadaPuerto: null,
      clienteId: null,
      numPlataformaDescarga: "",
      turnoPlataformaDescarga: "",
      fechaHoraInicioDescarga: null,
      fechaHoraFinDescarga: null,
      numWinchaPesaje: "",
      urlComprobanteWincha: "",
      patronId: patronId,
      motoristaId: motoristaId,
      bahiaId: bahiaId,
      latitud: 0,
      longitud: 0,
      combustibleAbastecidoGalones: 0,
      urlValeAbastecimiento: "",
      urlInformeDescargaProduce: "",
      movIngresoAlmacenId: null,
      observaciones: "",
      especieId: null,
      toneladas: 0,
      porcentajeJuveniles: 0,
      numReporteRecepcion: "",
    },
  });

  // Observar cambios en coordenadas para mostrar formato DMS
  const latitud = watch("latitud");
  const longitud = watch("longitud");

  // Cargar datos del registro a editar cuando cambie detalle
  useEffect(() => {
    if (detalle) {
      reset({
        faenaPescaId: detalle.faenaPescaId ? Number(detalle.faenaPescaId) : faenaPescaId,
        temporadaPescaId: detalle.temporadaPescaId ? Number(detalle.temporadaPescaId) : temporadaPescaId,
        puertoDescargaId: detalle.puertoDescargaId ? Number(detalle.puertoDescargaId) : null,
        fechaHoraArriboPuerto: detalle.fechaHoraArriboPuerto ? new Date(detalle.fechaHoraArriboPuerto) : null,
        fechaHoraLlegadaPuerto: detalle.fechaHoraLlegadaPuerto ? new Date(detalle.fechaHoraLlegadaPuerto) : null,
        clienteId: detalle.clienteId ? Number(detalle.clienteId) : null,
        numPlataformaDescarga: detalle.numPlataformaDescarga || "",
        turnoPlataformaDescarga: detalle.turnoPlataformaDescarga || "",
        fechaHoraInicioDescarga: detalle.fechaHoraInicioDescarga ? new Date(detalle.fechaHoraInicioDescarga) : null,
        fechaHoraFinDescarga: detalle.fechaHoraFinDescarga ? new Date(detalle.fechaHoraFinDescarga) : null,
        numWinchaPesaje: detalle.numWinchaPesaje || "",
        urlComprobanteWincha: detalle.urlComprobanteWincha || "",
        patronId: detalle.patronId ? Number(detalle.patronId) : patronId,
        motoristaId: detalle.motoristaId ? Number(detalle.motoristaId) : motoristaId,
        bahiaId: detalle.bahiaId ? Number(detalle.bahiaId) : bahiaId,
        latitud: detalle.latitud || 0,
        longitud: detalle.longitud || 0,
        combustibleAbastecidoGalones: detalle.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: detalle.urlValeAbastecimiento || "",
        urlInformeDescargaProduce: detalle.urlInformeDescargaProduce || "",
        movIngresoAlmacenId: detalle.movIngresoAlmacenId ? Number(detalle.movIngresoAlmacenId) : null,
        observaciones: detalle.observaciones || "",
        especieId: detalle.especieId ? Number(detalle.especieId) : null,
        toneladas: detalle.toneladas || 0,
        porcentajeJuveniles: detalle.porcentajeJuveniles || 0,
        numReporteRecepcion: detalle.numReporteRecepcion || "",
      });
    } else {
      // Resetear para nuevo registro con valores fijos de faena
      reset({
        faenaPescaId: faenaPescaId,
        temporadaPescaId: temporadaPescaId,
        puertoDescargaId: null,
        fechaHoraArriboPuerto: null,
        fechaHoraLlegadaPuerto: null,
        clienteId: null,
        numPlataformaDescarga: "",
        turnoPlataformaDescarga: "",
        fechaHoraInicioDescarga: null,
        fechaHoraFinDescarga: null,
        numWinchaPesaje: "",
        urlComprobanteWincha: "",
        patronId: patronId,
        motoristaId: motoristaId,
        bahiaId: bahiaId,
        latitud: 0,
        longitud: 0,
        combustibleAbastecidoGalones: 0,
        urlValeAbastecimiento: "",
        urlInformeDescargaProduce: "",
        movIngresoAlmacenId: null,
        observaciones: "",
        especieId: null,
        toneladas: 0,
        porcentajeJuveniles: 0,
        numReporteRecepcion: "",
      });
    }
  }, [detalle, reset, bahiaId, motoristaId, patronId, faenaPescaId, temporadaPescaId]);

  /**
   * Maneja el guardado del formulario
   */
  const handleGuardar = async () => {
    // Obtener datos del formulario manualmente
    const data = getValues();
    
    try {
      setLoading(true);

      const payload = {
        faenaPescaId: data.faenaPescaId ? Number(data.faenaPescaId) : null,
        temporadaPescaId: data.temporadaPescaId ? Number(data.temporadaPescaId) : null,
        puertoDescargaId: data.puertoDescargaId ? Number(data.puertoDescargaId) : null,
        fechaHoraArriboPuerto: data.fechaHoraArriboPuerto ? data.fechaHoraArriboPuerto.toISOString() : null,
        fechaHoraLlegadaPuerto: data.fechaHoraLlegadaPuerto ? data.fechaHoraLlegadaPuerto.toISOString() : null,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        numPlataformaDescarga: data.numPlataformaDescarga?.trim() || null,
        turnoPlataformaDescarga: data.turnoPlataformaDescarga?.trim() || null,
        fechaHoraInicioDescarga: data.fechaHoraInicioDescarga ? data.fechaHoraInicioDescarga.toISOString() : null,
        fechaHoraFinDescarga: data.fechaHoraFinDescarga ? data.fechaHoraFinDescarga.toISOString() : null,
        numWinchaPesaje: data.numWinchaPesaje?.trim() || null,
        urlComprobanteWincha: data.urlComprobanteWincha?.trim() || null,
        patronId: data.patronId ? Number(data.patronId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        latitud: data.latitud || 0,
        longitud: data.longitud || 0,
        combustibleAbastecidoGalones: data.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: data.urlValeAbastecimiento?.trim() || null,
        urlInformeDescargaProduce: data.urlInformeDescargaProduce?.trim() || null,
        movIngresoAlmacenId: data.movIngresoAlmacenId ? Number(data.movIngresoAlmacenId) : null,
        observaciones: data.observaciones?.trim() || null,
        especieId: data.especieId ? Number(data.especieId) : null,
        toneladas: data.toneladas || 0,
        porcentajeJuveniles: data.porcentajeJuveniles || 0,
        numReporteRecepcion: data.numReporteRecepcion?.trim() || null,
      };

      if (detalle?.id) {
        await actualizarDescargaFaenaPesca(detalle.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaPesca(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito", 
          detail: "Descarga creada correctamente",
          life: 3000,
        });
      }

      onGuardadoExitoso?.();
    } catch (error) {
      console.error("Error al guardar descarga:", error);
      // Extraer mensaje de error del backend
      let errorMessage = "Error desconocido al guardar la descarga";
      
      if (error?.response?.data?.mensaje) {
        // Error del backend con campo 'mensaje'
        errorMessage = error.response.data.mensaje;
      } else if (error?.response?.data?.message) {
        // Error del backend con campo 'message'
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        // Algunos backends envían el error en 'error'
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        // Error de axios o JavaScript
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        // Error como string directo
        errorMessage = error;
      }
    
      toast.current?.show({
        severity: "error",
        summary: "Error de Validación",
        detail: errorMessage,
        life: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toast = useRef(null);

  /**
   * Maneja la captura de GPS usando las funciones genéricas
   */
  const handleCapturarGPS = async () => {
    try {
      await capturarGPS(
        (latitude, longitude, accuracy) => {
          // Callback de éxito
          setValue("latitud", latitude);
          setValue("longitud", longitude);
          
          toast.current?.show({
            severity: "success",
            summary: "GPS capturado",
            detail: `GPS capturado con precisión de ${accuracy.toFixed(1)}m`,
            life: 3000,
          });
        },
        (errorMessage) => {
          // Callback de error
          toast.current?.show({
            severity: "error",
            summary: "Error GPS",
            detail: errorMessage,
            life: 3000,
          });
        }
      );
    } catch (error) {
      console.error("Error capturando GPS:", error);
    }
  };

  // Crear configuración de inputs de coordenadas usando utilidad genérica
  const coordenadasConfig = crearInputCoordenadas({
    latitud,
    longitud,
    onLatitudChange: (valor) => setValue("latitud", valor),
    onLongitudChange: (valor) => setValue("longitud", valor),
    disabled: true, // Solo lectura, se captura por GPS
    mostrarDMS: true,
  });

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      
      {/* Primera fila: Datos básicos */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="puertoDescargaId">Puerto Descarga*</label>
          <Controller
            name="puertoDescargaId"
            control={control}
            rules={{ required: "El puerto de descarga es obligatorio" }}
            render={({ field }) => (
              <Dropdown
                id="puertoDescargaId"
                {...field}
                value={field.value}
                options={puertos}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione puerto"
                disabled={loading}
                className={classNames({ "p-invalid": errors.puertoDescargaId })}
              />
            )}
          />
          {errors.puertoDescargaId && (
            <Message severity="error" text={errors.puertoDescargaId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="clienteId">Cliente*</label>
          <Controller
            name="clienteId"
            control={control}
            rules={{ required: "El cliente es obligatorio" }}
            render={({ field }) => (
              <Dropdown
                id="clienteId"
                {...field}
                value={field.value}
                options={clientes}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione cliente"
                disabled={loading}
                className={classNames({ "p-invalid": errors.clienteId })}
              />
            )}
          />
          {errors.clienteId && (
            <Message severity="error" text={errors.clienteId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="numPlataformaDescarga">Plataforma</label>
          <Controller
            name="numPlataformaDescarga"
            control={control}
            render={({ field }) => (
              <InputText
                id="numPlataformaDescarga"
                {...field}
                placeholder="Número plataforma"
                disabled={loading}
                style={{ fontWeight: "bold" }}
                maxLength={20}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="turnoPlataformaDescarga">Turno</label>
          <Controller
            name="turnoPlataformaDescarga"
            control={control}
            render={({ field }) => (
              <InputText
                id="turnoPlataformaDescarga"
                {...field}
                placeholder="Turno plataforma"
                disabled={loading}
                style={{ fontWeight: "bold" }}
                maxLength={20}
              />
            )}
          />
        </div>
      </div>

      {/* Segunda fila: Fechas y horas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraArriboPuerto" style={{ color: "#2c32d3" }}>
            Arribo Puerto*
          </label>
          <Controller
            name="fechaHoraArriboPuerto"
            control={control}
            rules={{ required: "La fecha de arribo es obligatoria" }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraArriboPuerto"
                {...field}
                showIcon
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.fechaHoraArriboPuerto })}
              />
            )}
          />
          {errors.fechaHoraArriboPuerto && (
            <Message severity="error" text={errors.fechaHoraArriboPuerto.message} />
          )}
          <Button
            type="button"
            label="Arribar a Puerto"
            icon="pi pi-clock"
            className="p-button-info"
            onClick={() => setValue("fechaHoraArriboPuerto", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraLlegadaPuerto" style={{ color: "#2c32d3" }}>
            Llegada Puerto*
          </label>
          <Controller
            name="fechaHoraLlegadaPuerto"
            control={control}
            rules={{ required: "La fecha de llegada es obligatoria" }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraLlegadaPuerto"
                {...field}
                showIcon
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#2c32d3" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.fechaHoraLlegadaPuerto })}
              />
            )}
          />
          {errors.fechaHoraLlegadaPuerto && (
            <Message severity="error" text={errors.fechaHoraLlegadaPuerto.message} />
          )}
          <Button
            type="button"
            label="Llego a Puerto"
            icon="pi pi-clock"
            className="p-button-info"
            onClick={() => setValue("fechaHoraLlegadaPuerto", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraInicioDescarga" style={{ color: "#21962e" }}>
            Inicio Descarga*
          </label>
          <Controller
            name="fechaHoraInicioDescarga"
            control={control}
            rules={{ required: "La fecha de inicio es obligatoria" }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraInicioDescarga"
                {...field}
                showIcon
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#21962e" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.fechaHoraInicioDescarga })}
              />
            )}
          />
          {errors.fechaHoraInicioDescarga && (
            <Message severity="error" text={errors.fechaHoraInicioDescarga.message} />
          )}
          <Button
            type="button"
            label="Iniciar Descarga"
            icon="pi pi-clock"
            className="p-button-success"
            onClick={() => setValue("fechaHoraInicioDescarga", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraFinDescarga" style={{ color: "#21962e" }}>
            Fin Descarga*
          </label>
          <Controller
            name="fechaHoraFinDescarga"
            control={control}
            rules={{ required: "La fecha de fin es obligatoria" }}
            render={({ field }) => (
              <Calendar
                id="fechaHoraFinDescarga"
                {...field}
                showIcon
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold", color: "#21962e" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.fechaHoraFinDescarga })}
              />
            )}
          />
          {errors.fechaHoraFinDescarga && (
            <Message severity="error" text={errors.fechaHoraFinDescarga.message} />
          )}
          <Button
            type="button"
            label="Fin Descarga"
            icon="pi pi-clock"
            className="p-button-success"
            onClick={() => setValue("fechaHoraFinDescarga", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
      </div>

      {/* Tercera fila: Datos numéricos */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="combustibleAbastecidoGalones">Combustible (Gal)*</label>
          <Controller
            name="combustibleAbastecidoGalones"
            control={control}
            rules={{ required: "El combustible es obligatorio" }}
            render={({ field }) => (
              <InputNumber
                id="combustibleAbastecidoGalones"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                suffix=" Gal"
                inputStyle={{ fontWeight: "bold" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.combustibleAbastecidoGalones })}
              />
            )}
          />
          {errors.combustibleAbastecidoGalones && (
            <Message severity="error" text={errors.combustibleAbastecidoGalones.message} />
          )}
        </div>
      </div>

      {/* Cuarta fila: Coordenadas GPS */}
      <div
        style={{
          border: "6px solid #1fad2f",
          backgroundColor: "#edf9f2",
          padding: "0.5rem",
          borderRadius: "8px",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Capturar GPS"
            icon="pi pi-map-marker"
            className="p-button-success"
            onClick={handleCapturarGPS}
            disabled={loading}
            size="large"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Latitud
          </label>
          <input {...coordenadasConfig.inputLatitud} />
          <small style={{ color: "#666" }}>
            Formato decimal (+ Norte, - Sur)
          </small>
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Longitud
          </label>
          <input {...coordenadasConfig.inputLongitud} />
          <small style={{ color: "#666" }}>
            Formato decimal (+ Este, - Oeste)
          </small>
        </div>
        <div style={{ flex: 1 }}>
          {/* Conversión a formato DMS para referencia */}
          {(latitud !== 0 || longitud !== 0) && coordenadasConfig.formatoDMS && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#f3fce8",
                borderRadius: "4px",
              }}
            >
              <strong>📐 Formato DMS (Marítimo):</strong>
              <div style={{ marginTop: "5px", fontSize: "14px" }}>
                <div>
                  <strong>Lat:</strong> {coordenadasConfig.formatoDMS.latitudDMS}
                </div>
                <div>
                  <strong>Lon:</strong> {coordenadasConfig.formatoDMS.longitudDMS}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quinta fila: Especie */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="especieId">Especie*</label>
          <Controller
            name="especieId"
            control={control}
            rules={{ required: "La especie es obligatoria" }}
            render={({ field }) => (
              <Dropdown
                id="especieId"
                {...field}
                value={field.value}
                options={especies}
                optionLabel="label"
                optionValue="value"
                style={{ fontWeight: "bold" }}
                placeholder="Seleccione especie"
                disabled={loading}
                className={classNames({ "p-invalid": errors.especieId })}
              />
            )}
          />
          {errors.especieId && (
            <Message severity="error" text={errors.especieId.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="toneladas">Toneladas*</label>
          <Controller
            name="toneladas"
            control={control}
            rules={{ required: "Las toneladas son obligatorias" }}
            render={({ field }) => (
              <InputNumber
                id="toneladas"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                suffix=" Ton"
                inputStyle={{ fontWeight: "bold" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.toneladas })}
              />
            )}
          />
          {errors.toneladas && (
            <Message severity="error" text={errors.toneladas.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="porcentajeJuveniles">Porcentaje Juveniles*</label>
          <Controller
            name="porcentajeJuveniles"
            control={control}
            rules={{ required: "El porcentaje de juveniles es obligatorio" }}
            render={({ field }) => (
              <InputNumber
                id="porcentajeJuveniles"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                suffix=" %"
                inputStyle={{ fontWeight: "bold" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.porcentajeJuveniles })}
              />
            )}
          />
          {errors.porcentajeJuveniles && (
            <Message severity="error" text={errors.porcentajeJuveniles.message} />
          )}
        </div>
      </div>

      {/* Sexta fila: Observaciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="observaciones">Observaciones</label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                rows={2}
                placeholder="Observaciones adicionales"
                style={{
                  fontWeight: "bold",
                  color: "red",
                  fontStyle: "italic",
                  textTransform: "uppercase",
                }}
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Séptima fila: Reporte de recepción */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="numReporteRecepcion">Número de reporte de recepción</label>
          <Controller
            name="numReporteRecepcion"
            control={control}
            render={({ field }) => (
              <InputText
                id="numReporteRecepcion"
                {...field}
                placeholder="Número de reporte de recepción"
                disabled={loading}
                style={{ fontWeight: "bold" }}
                maxLength={20}
              />
            )}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-warning"
          onClick={onCancelar}
          disabled={loading}
          severity="warning"
          raised
          size="small"
        />
        <Button
          onClick={handleGuardar}
          label={detalle?.id ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          loading={loading}
          className="p-button-success"
          severity="success"
          raised
          size="small"
        />
      </div>
    </div>
  );
}
