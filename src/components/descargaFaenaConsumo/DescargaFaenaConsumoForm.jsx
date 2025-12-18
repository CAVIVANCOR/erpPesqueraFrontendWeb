// src/components/descargaFaenaConsumo/DescargaFaenaConsumoForm.jsx
// Formulario profesional para DescargaFaenaConsumo - ERP Megui
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
  crearDescargaFaenaConsumo,
  actualizarDescargaFaenaConsumo,
} from "../../api/descargaFaenaConsumo";
import {
  capturarGPS,
  descomponerDMS,
  convertirDMSADecimal,
} from "../../utils/gpsUtils";

/**
 * Formulario DescargaFaenaConsumoForm
 *
 * Formulario profesional para gestión de descargas de faena de pesca consumo.
 * Características:
 * - Validaciones robustas con react-hook-form
 * - Combos normalizados (IDs numéricos)
 * - Campos de fecha con validaciones
 * - Captura de GPS integrada
 * - Layout responsive siguiendo patrón DatosGeneralesFaenaPescaConsumo
 *
 * Props esperadas desde el componente padre:
 * - puertos: Array de puertos (todos los puertos disponibles)
 * - clientes: Array de clientes filtrados por EntidadComercial (empresaId, tipoEntidadId=8, esCliente=true, estado=true)
 * - especies: Array de especies (con precioPorKg y cubetaPesoKg)
 * - katanasTripulacion: Array de rangos de katana tripulación filtrados por empresaId
 * - empresaData: Objeto con datos de la empresa (opcional, para futuras funcionalidades)
 * - bahiaId: ID de bahía (valor fijo desde FaenaPescaConsumo)
 * - motoristaId: ID de motorista (valor fijo desde FaenaPescaConsumo)
 * - patronId: ID de patrón (valor fijo desde FaenaPescaConsumo)
 * - faenaPescaConsumoId: ID de faena de pesca consumo (valor fijo desde FaenaPescaConsumo)
 */
export default function DescargaFaenaConsumoForm({
  detalle,
  puertos = [],
  clientes = [],
  especies = [],
  katanasTripulacion = [],
  empresaData = null,
  bahiaId = null,
  motoristaId = null,
  patronId = null,
  faenaPescaConsumoId = null,
  onGuardadoExitoso,
  onCancelar,
}) {
  // Estados para loading
  const [loading, setLoading] = useState(false);

  // Ref para rastrear la especie anterior y evitar sobrescribir precio editado manualmente
  const especieAnteriorRef = useRef(null);

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
      faenaPescaConsumoId: faenaPescaConsumoId,
      puertoDescargaId: null,
      fechaHoraArriboPuerto: null,
      fechaHoraLlegadaPuerto: null,
      clienteId: null,
      numPlataformaDescarga: "",
      turnoPlataformaDescarga: "DIA",
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
      fechaHoraFondeo: null,
      latitudFondeo: 0,
      longitudFondeo: 0,
      puertoFondeoId: null,
      nroCubetas: 0,
      precioPorKgEspecie: 0,
      precioTotal: 0,
      katanaTripulacionId: null,
    },
  });

  // Observar cambios en coordenadas para mostrar formato DMS
  const latitud = watch("latitud");
  const longitud = watch("longitud");
  const latitudFondeo = watch("latitudFondeo");
  const longitudFondeo = watch("longitudFondeo");

  // Observar cambios para cálculos automáticos
  const especieIdWatched = watch("especieId");
  const toneladasWatched = watch("toneladas");
  const precioPorKgEspecieWatched = watch("precioPorKgEspecie");

  // Estados para formato DMS de descarga
  const [latGrados, setLatGrados] = useState(0);
  const [latMinutos, setLatMinutos] = useState(0);
  const [latSegundos, setLatSegundos] = useState(0);
  const [latDireccion, setLatDireccion] = useState("S");

  const [lonGrados, setLonGrados] = useState(0);
  const [lonMinutos, setLonMinutos] = useState(0);
  const [lonSegundos, setLonSegundos] = useState(0);
  const [lonDireccion, setLonDireccion] = useState("W");

  // Estados para formato DMS de fondeo
  const [latFondeoGrados, setLatFondeoGrados] = useState(0);
  const [latFondeoMinutos, setLatFondeoMinutos] = useState(0);
  const [latFondeoSegundos, setLatFondeoSegundos] = useState(0);
  const [latFondeoDireccion, setLatFondeoDireccion] = useState("S");

  const [lonFondeoGrados, setLonFondeoGrados] = useState(0);
  const [lonFondeoMinutos, setLonFondeoMinutos] = useState(0);
  const [lonFondeoSegundos, setLonFondeoSegundos] = useState(0);
  const [lonFondeoDireccion, setLonFondeoDireccion] = useState("W");

  // Normalizar opciones de combos
  const puertosNormalizados = puertos.map((p) => ({
    label: p.nombre || p.label,
    value: Number(p.id || p.value),
  }));

  const clientesNormalizados = clientes.map((c) => ({
    label: c.razonSocial || c.label,
    value: Number(c.id || c.value),
  }));

  const especiesNormalizadas = especies.map((e) => ({
    label: e.nombre || e.label,
    value: Number(e.id || e.value),
  }));

  const katanasTripulacionNormalizadas = katanasTripulacion.map((k) => ({
    label: `${k.rangoInicialTn || 0} - ${k.rangoFinaTn || 0} Tn (${
      k.kgOtorgadoCalculo || 0
    } Kg)`,
    value: Number(k.id || k.value),
  }));

  // Cargar datos del registro a editar cuando cambie detalle
  useEffect(() => {
    if (detalle) {
      reset({
        faenaPescaConsumoId: detalle.faenaPescaConsumoId
          ? Number(detalle.faenaPescaConsumoId)
          : faenaPescaConsumoId,
        puertoDescargaId: detalle.puertoDescargaId
          ? Number(detalle.puertoDescargaId)
          : null,
        fechaHoraArriboPuerto: detalle.fechaHoraArriboPuerto
          ? new Date(detalle.fechaHoraArriboPuerto)
          : null,
        fechaHoraLlegadaPuerto: detalle.fechaHoraLlegadaPuerto
          ? new Date(detalle.fechaHoraLlegadaPuerto)
          : null,
        clienteId: detalle.clienteId ? Number(detalle.clienteId) : null,
        numPlataformaDescarga: detalle.numPlataformaDescarga || "",
        turnoPlataformaDescarga: detalle.turnoPlataformaDescarga || "DIA",
        fechaHoraInicioDescarga: detalle.fechaHoraInicioDescarga
          ? new Date(detalle.fechaHoraInicioDescarga)
          : null,
        fechaHoraFinDescarga: detalle.fechaHoraFinDescarga
          ? new Date(detalle.fechaHoraFinDescarga)
          : null,
        numWinchaPesaje: detalle.numWinchaPesaje || "",
        urlComprobanteWincha: detalle.urlComprobanteWincha || "",
        patronId: detalle.patronId ? Number(detalle.patronId) : patronId,
        motoristaId: detalle.motoristaId
          ? Number(detalle.motoristaId)
          : motoristaId,
        bahiaId: detalle.bahiaId ? Number(detalle.bahiaId) : bahiaId,
        latitud: detalle.latitud || 0,
        longitud: detalle.longitud || 0,
        combustibleAbastecidoGalones: detalle.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: detalle.urlValeAbastecimiento || "",
        urlInformeDescargaProduce: detalle.urlInformeDescargaProduce || "",
        movIngresoAlmacenId: detalle.movIngresoAlmacenId
          ? Number(detalle.movIngresoAlmacenId)
          : null,
        observaciones: detalle.observaciones || "",
        especieId: detalle.especieId ? Number(detalle.especieId) : null,
        toneladas: detalle.toneladas ? detalle.toneladas * 1000 : 0, // Convertir toneladas a kilogramos para mostrar
        porcentajeJuveniles: detalle.porcentajeJuveniles || 0,
        fechaHoraFondeo: detalle.fechaHoraFondeo
          ? new Date(detalle.fechaHoraFondeo)
          : null,
        latitudFondeo: detalle.latitudFondeo || 0,
        longitudFondeo: detalle.longitudFondeo || 0,
        puertoFondeoId: detalle.puertoFondeoId
          ? Number(detalle.puertoFondeoId)
          : null,
        nroCubetas: detalle.nroCubetas || 0,
        precioPorKgEspecie: detalle.precioPorKgEspecie || 0,
        precioTotal: detalle.precioTotal || 0,
        katanaTripulacionId: detalle.katanaTripulacionId
          ? Number(detalle.katanaTripulacionId)
          : null,
      });
    } else {
      // Resetear para nuevo registro con valores fijos de faena
      reset({
        faenaPescaConsumoId: faenaPescaConsumoId,
        puertoDescargaId: null,
        fechaHoraArriboPuerto: null,
        fechaHoraLlegadaPuerto: null,
        clienteId: null,
        numPlataformaDescarga: "",
        turnoPlataformaDescarga: "DIA",
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
        fechaHoraFondeo: null,
        latitudFondeo: 0,
        longitudFondeo: 0,
        puertoFondeoId: null,
        nroCubetas: 0,
        precioPorKgEspecie: 0,
        precioTotal: 0,
        katanaTripulacionId: null,
      });
    }
  }, [detalle, reset, bahiaId, motoristaId, patronId, faenaPescaConsumoId]);

  // Sincronizar cambios de decimal a DMS para DESCARGA
  useEffect(() => {
    if (
      latitud !== "" &&
      latitud !== null &&
      latitud !== undefined &&
      latitud !== 0
    ) {
      const dms = descomponerDMS(Number(latitud), true);
      setLatGrados(dms.grados);
      setLatMinutos(dms.minutos);
      setLatSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatDireccion(dms.direccion);
    }
  }, [latitud]);

  useEffect(() => {
    if (
      longitud !== "" &&
      longitud !== null &&
      longitud !== undefined &&
      longitud !== 0
    ) {
      const dms = descomponerDMS(Number(longitud), false);
      setLonGrados(dms.grados);
      setLonMinutos(dms.minutos);
      setLonSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonDireccion(dms.direccion);
    }
  }, [longitud]);

  // Sincronizar cambios de decimal a DMS para FONDEO
  useEffect(() => {
    if (
      latitudFondeo !== "" &&
      latitudFondeo !== null &&
      latitudFondeo !== undefined &&
      latitudFondeo !== 0
    ) {
      const dms = descomponerDMS(Number(latitudFondeo), true);
      setLatFondeoGrados(dms.grados);
      setLatFondeoMinutos(dms.minutos);
      setLatFondeoSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLatFondeoDireccion(dms.direccion);
    }
  }, [latitudFondeo]);

  useEffect(() => {
    if (
      longitudFondeo !== "" &&
      longitudFondeo !== null &&
      longitudFondeo !== undefined &&
      longitudFondeo !== 0
    ) {
      const dms = descomponerDMS(Number(longitudFondeo), false);
      setLonFondeoGrados(dms.grados);
      setLonFondeoMinutos(dms.minutos);
      setLonFondeoSegundos(parseFloat(dms.segundos.toFixed(2)));
      setLonFondeoDireccion(dms.direccion);
    }
  }, [longitudFondeo]);

  // Cálculos automáticos al cambiar especie, toneladas o precio
  useEffect(() => {
    const realizarCalculos = () => {
      // Solo calcular si hay toneladas
      if (!toneladasWatched || toneladasWatched === 0) {
        return;
      }

      // 1. Obtener precio por Kg de la especie seleccionada (SOLO si cambió la especie)
      const especieSeleccionada = especies.find(
        (e) => Number(e.id) === Number(especieIdWatched)
      );
      const especiaCambio = especieAnteriorRef.current !== especieIdWatched;

      if (
        especieSeleccionada &&
        especieSeleccionada.precioPorKg &&
        especieIdWatched &&
        especiaCambio
      ) {
        const precioDB = Number(especieSeleccionada.precioPorKg);
        setValue("precioPorKgEspecie", precioDB);
        especieAnteriorRef.current = especieIdWatched; // Actualizar ref
        return; // Salir para que el useEffect se ejecute de nuevo con el nuevo precio
      }

      // Actualizar ref si aún no se ha hecho
      if (especiaCambio && especieIdWatched) {
        especieAnteriorRef.current = especieIdWatched;
      }

      // 2. Calcular número de cubetas usando cubetaPesoKg de la ESPECIE
      if (especieSeleccionada?.cubetaPesoKg && Number(especieSeleccionada.cubetaPesoKg) > 0) {
        const nroCubetas = toneladasWatched / Number(especieSeleccionada.cubetaPesoKg);
        setValue('nroCubetas', Number(nroCubetas.toFixed(2)));
      } else {
        setValue('nroCubetas', 0);
      }

      // 3. Encontrar katana según rango de toneladas (convertir Kg a Tn)
      const toneladasEnTn = toneladasWatched / 1000;

      const katanaEncontrada = katanasTripulacion.find((k) => {
        const rangoInicial = Number(k.rangoInicialTn || 0);
        const rangoFinal = Number(k.rangoFinaTn || 0);
        return toneladasEnTn >= rangoInicial && toneladasEnTn <= rangoFinal;
      });

      if (katanaEncontrada) {
        setValue("katanaTripulacionId", Number(katanaEncontrada.id));

        // 4. Calcular precio total usando el precio actual (manual o de especie)
        const kgOtorgado = Number(katanaEncontrada.kgOtorgadoCalculo || 0);
        const precioPorKg = Number(precioPorKgEspecieWatched || 0);

        if (precioPorKg > 0) {
          const precioTotal = (toneladasWatched - kgOtorgado) * precioPorKg;
          setValue("precioTotal", Number(precioTotal.toFixed(2)));
        } else {
          setValue("precioTotal", 0);
        }
      } else {
        setValue("katanaTripulacionId", null);
        setValue("precioTotal", 0);
      }
    };

    realizarCalculos();
  }, [
    especieIdWatched,
    toneladasWatched,
    precioPorKgEspecieWatched,
    especies,
    katanasTripulacion,
    empresaData,
    setValue,
  ]);

  // Funciones para actualizar decimal cuando cambia DMS - DESCARGA
  const actualizarLatitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latGrados,
      latMinutos,
      latSegundos,
      latDireccion
    );
    setValue("latitud", decimal);
  };

  const actualizarLongitudDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonGrados,
      lonMinutos,
      lonSegundos,
      lonDireccion
    );
    setValue("longitud", decimal);
  };

  // Funciones para actualizar decimal cuando cambia DMS - FONDEO
  const actualizarLatitudFondeoDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      latFondeoGrados,
      latFondeoMinutos,
      latFondeoSegundos,
      latFondeoDireccion
    );
    setValue("latitudFondeo", decimal);
  };

  const actualizarLongitudFondeoDesdeDMS = () => {
    const decimal = convertirDMSADecimal(
      lonFondeoGrados,
      lonFondeoMinutos,
      lonFondeoSegundos,
      lonFondeoDireccion
    );
    setValue("longitudFondeo", decimal);
  };

  /**
   * Maneja el guardado del formulario
   */
  const handleGuardar = async () => {
    // Obtener datos del formulario manualmente
    const data = getValues();

    try {
      setLoading(true);

      const payload = {
        faenaPescaConsumoId: data.faenaPescaConsumoId
          ? Number(data.faenaPescaConsumoId)
          : null,
        puertoDescargaId: data.puertoDescargaId
          ? Number(data.puertoDescargaId)
          : null,
        fechaHoraArriboPuerto: data.fechaHoraArriboPuerto
          ? data.fechaHoraArriboPuerto.toISOString()
          : null,
        fechaHoraLlegadaPuerto: data.fechaHoraLlegadaPuerto
          ? data.fechaHoraLlegadaPuerto.toISOString()
          : null,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        numPlataformaDescarga: data.numPlataformaDescarga?.trim() || null,
        turnoPlataformaDescarga: data.turnoPlataformaDescarga?.trim() || null,
        fechaHoraInicioDescarga: data.fechaHoraInicioDescarga
          ? data.fechaHoraInicioDescarga.toISOString()
          : null,
        fechaHoraFinDescarga: data.fechaHoraFinDescarga
          ? data.fechaHoraFinDescarga.toISOString()
          : null,
        numWinchaPesaje: data.numWinchaPesaje?.trim() || null,
        urlComprobanteWincha: data.urlComprobanteWincha?.trim() || null,
        patronId: data.patronId ? Number(data.patronId) : null,
        motoristaId: data.motoristaId ? Number(data.motoristaId) : null,
        bahiaId: data.bahiaId ? Number(data.bahiaId) : null,
        latitud: data.latitud || 0,
        longitud: data.longitud || 0,
        combustibleAbastecidoGalones: data.combustibleAbastecidoGalones || 0,
        urlValeAbastecimiento: data.urlValeAbastecimiento?.trim() || null,
        urlInformeDescargaProduce:
          data.urlInformeDescargaProduce?.trim() || null,
        movIngresoAlmacenId: data.movIngresoAlmacenId
          ? Number(data.movIngresoAlmacenId)
          : null,
        observaciones: data.observaciones?.trim() || null,
        especieId: data.especieId ? Number(data.especieId) : null,
        toneladas: data.toneladas ? Number(data.toneladas) / 1000 : 0, // Convertir kilogramos a toneladas para guardar
        porcentajeJuveniles: 0,
        fechaHoraFondeo: data.fechaHoraFondeo
          ? data.fechaHoraFondeo.toISOString()
          : null,
        latitudFondeo: data.latitudFondeo || 0,
        longitudFondeo: data.longitudFondeo || 0,
        puertoFondeoId: data.puertoFondeoId
          ? Number(data.puertoFondeoId)
          : null,
        nroCubetas: data.nroCubetas || 0,
        precioPorKgEspecie: data.precioPorKgEspecie || 0,
        precioTotal: data.precioTotal || 0,
        katanaTripulacionId: data.katanaTripulacionId
          ? Number(data.katanaTripulacionId)
          : null,
      };

      // 1. Guardar la descarga
      if (detalle?.id) {
        await actualizarDescargaFaenaConsumo(detalle.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Descarga actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearDescargaFaenaConsumo(payload);
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
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar la descarga",
        life: 3000,
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

  const handleCapturarGPSFondeo = async () => {
    try {
      await capturarGPS(
        (latitude, longitude, accuracy) => {
          // Callback de éxito
          setValue("latitudFondeo", latitude);
          setValue("longitudFondeo", longitude);

          toast.current?.show({
            severity: "success",
            summary: "GPS Fondeo capturado",
            detail: `GPS Fondeo capturado con precisión de ${accuracy.toFixed(
              1
            )}m`,
            life: 3000,
          });
        },
        (errorMessage) => {
          // Callback de error
          toast.current?.show({
            severity: "error",
            summary: "Error GPS Fondeo",
            detail: errorMessage,
            life: 3000,
          });
        }
      );
    } catch (error) {
      console.error("Error capturando GPS Fondeo:", error);
    }
  };

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
                options={puertosNormalizados}
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
          <Button
            type="button"
            label="Retorno a Puerto"
            icon="pi pi-clock"
            className="p-button-info"
            onClick={() => setValue("fechaHoraArriboPuerto", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraArriboPuerto" style={{ color: "#2c32d3" }}>
            Retorno a Puerto*
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
                className={classNames({
                  "p-invalid": errors.fechaHoraArriboPuerto,
                })}
              />
            )}
          />
          {errors.fechaHoraArriboPuerto && (
            <Message
              severity="error"
              text={errors.fechaHoraArriboPuerto.message}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Arribo a Puerto"
            icon="pi pi-clock"
            className="p-button-info"
            onClick={() => setValue("fechaHoraLlegadaPuerto", new Date())}
            disabled={loading}
            size="small"
            style={{ marginTop: "5px" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="fechaHoraLlegadaPuerto" style={{ color: "#2c32d3" }}>
            Arribo a Puerto*
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
                className={classNames({
                  "p-invalid": errors.fechaHoraLlegadaPuerto,
                })}
              />
            )}
          />
          {errors.fechaHoraLlegadaPuerto && (
            <Message
              severity="error"
              text={errors.fechaHoraLlegadaPuerto.message}
            />
          )}
        </div>
      </div>
      {/* Cuarta fila: Coordenadas GPS */}
      <div
        style={{
          border: "6px solid #0EA5E9",
          padding: "0.5rem",
          borderRadius: "8px",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "self-end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Capturar GPS Arribo"
            icon="pi pi-map-marker"
            className="p-button-info"
            onClick={handleCapturarGPS}
            disabled={loading}
            size="small"
          />
        </div>

        {/* Tabla compacta de coordenadas GPS */}
        <div style={{ flex: 3 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "2px solid #0EA5E9",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#0EA5E9", color: "white" }}>
                <th
                  style={{
                    padding: "4px",
                    border: "1px solid #0EA5E9",
                    fontSize: "12px",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  Formato
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "4px",
                    border: "1px solid #0EA5E9",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  Latitud
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "4px",
                    border: "1px solid #0EA5E9",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  Longitud
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila Decimal */}
              <tr>
                <td
                  style={{
                    padding: "4px",
                    border: "1px solid #0EA5E9",
                    fontWeight: "bold",
                    fontSize: "11px",
                    backgroundColor: "#e1f1f7",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  Decimal
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "2px", border: "1px solid #0EA5E9" }}
                >
                  <input
                    type="number"
                    value={latitud || ""}
                    onChange={(e) =>
                      setValue("latitud", parseFloat(e.target.value) || 0)
                    }
                    disabled={loading}
                    step="0.000001"
                    placeholder="-12.345678"
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  />
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "2px", border: "1px solid #0EA5E9" }}
                >
                  <input
                    type="number"
                    value={longitud || ""}
                    onChange={(e) =>
                      setValue("longitud", parseFloat(e.target.value) || 0)
                    }
                    disabled={loading}
                    step="0.000001"
                    placeholder="-77.123456"
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  />
                </td>
              </tr>

              {/* Fila GMS */}
              <tr>
                <td
                  style={{
                    padding: "4px",
                    border: "1px solid #0EA5E9",
                    fontWeight: "bold",
                    fontSize: "11px",
                    backgroundColor: "#e1f1f7",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  GMS
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latGrados}
                      onChange={(e) =>
                        setLatGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="90"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latMinutos}
                      onChange={(e) =>
                        setLatMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "50px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latSegundos}
                      onChange={(e) =>
                        setLatSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <select
                    value={latDireccion}
                    onChange={(e) => {
                      setLatDireccion(e.target.value);
                      setTimeout(actualizarLatitudDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonGrados}
                      onChange={(e) =>
                        setLonGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="180"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonMinutos}
                      onChange={(e) =>
                        setLonMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "50px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonSegundos}
                      onChange={(e) =>
                        setLonSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #0EA5E9" }}>
                  <select
                    value={lonDireccion}
                    onChange={(e) => {
                      setLonDireccion(e.target.value);
                      setTimeout(actualizarLongitudDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
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
        <div style={{ flex: 2 }}>
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
                options={clientesNormalizados}
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
              <Dropdown
                id="turnoPlataformaDescarga"
                {...field}
                value={field.value || "DIA"}
                options={[
                  { label: "DIA", value: "DIA" },
                  { label: "NOCHE", value: "NOCHE" },
                ]}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione turno"
                disabled={loading}
                style={{ fontWeight: "bold" }}
              />
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="combustibleAbastecidoGalones">Combustible*</label>
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
                className={classNames({
                  "p-invalid": errors.combustibleAbastecidoGalones,
                })}
              />
            )}
          />
          {errors.combustibleAbastecidoGalones && (
            <Message
              severity="error"
              text={errors.combustibleAbastecidoGalones.message}
            />
          )}
        </div>
      </div>

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
          <Button
            type="button"
            label="Inicia Descarga"
            icon="pi pi-clock"
            className="p-button-success"
            onClick={() => setValue("fechaHoraInicioDescarga", new Date())}
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
                className={classNames({
                  "p-invalid": errors.fechaHoraInicioDescarga,
                })}
              />
            )}
          />
          {errors.fechaHoraInicioDescarga && (
            <Message
              severity="error"
              text={errors.fechaHoraInicioDescarga.message}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
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
                className={classNames({
                  "p-invalid": errors.fechaHoraFinDescarga,
                })}
              />
            )}
          />
          {errors.fechaHoraFinDescarga && (
            <Message
              severity="error"
              text={errors.fechaHoraFinDescarga.message}
            />
          )}
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
      ></div>

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
                options={especiesNormalizadas}
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
          <label htmlFor="toneladas">Kilogramos*</label>
          <Controller
            name="toneladas"
            control={control}
            rules={{ required: "Los kilogramos son obligatorios" }}
            render={({ field }) => (
              <InputNumber
                id="toneladas"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={3}
                suffix=" Kg"
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
        <div style={{ flex: 0.5 }}>
          <label htmlFor="nroCubetas">Nro. Cubetas</label>
          <Controller
            name="nroCubetas"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="nroCubetas"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                min={0}
                inputStyle={{ fontWeight: "bold" }}
                disabled
                className={classNames({ "p-invalid": errors.nroCubetas })}
              />
            )}
          />
          {errors.nroCubetas && (
            <Message severity="error" text={errors.nroCubetas.message} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="precioPorKgEspecie">Precio por Kg</label>
          <Controller
            name="precioPorKgEspecie"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="precioPorKgEspecie"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                prefix="S/ "
                inputStyle={{ fontWeight: "bold" }}
                disabled={loading}
                className={classNames({
                  "p-invalid": errors.precioPorKgEspecie,
                })}
              />
            )}
          />
          {errors.precioPorKgEspecie && (
            <Message
              severity="error"
              text={errors.precioPorKgEspecie.message}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="precioTotal">Precio Total</label>
          <Controller
            name="precioTotal"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="precioTotal"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                prefix="S/ "
                inputStyle={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                disabled={true}
                className={classNames({ "p-invalid": errors.precioTotal })}
              />
            )}
          />
          {errors.precioTotal && (
            <Message severity="error" text={errors.precioTotal.message} />
          )}
        </div>
                <div style={{ flex: 1 }}>
          <label htmlFor="katanaTripulacionId">Katana Tripulación</label>
          <Controller
            name="katanaTripulacionId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="katanaTripulacionId"
                value={field.value}
                options={katanasTripulacionNormalizadas}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Seleccionado automáticamente"
                filter
                showClear
                disabled={true}
                style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}
                className={classNames({
                  "p-invalid": errors.katanaTripulacionId,
                })}
              />
            )}
          />
          {errors.katanaTripulacionId && (
            <Message
              severity="error"
              text={errors.katanaTripulacionId.message}
            />
          )}
        </div>
      </div>
      {/* Fila: Katana Tripulación */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >

      </div>

      {/* Fila: Observaciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 2 }}>
          <label htmlFor="observaciones">Observaciones</label>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observaciones"
                {...field}
                rows={1}
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
      {/* Quinta fila: Coordenadas GPS Fondeo */}
      <div
        style={{
          border: "6px solid #ff9800",
          padding: "0.5rem",
          borderRadius: "8px",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "self-end",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Fecha Hora Fondeo"
            icon="pi pi-clock"
            className="p-button-warning"
            onClick={() => setValue("fechaHoraFondeo", new Date())}
            disabled={loading}
            size="small"
            style={{ width: "100%", marginBottom: "4px" }}
          />
          <Controller
            name="fechaHoraFondeo"
            control={control}
            render={({ field }) => (
              <Calendar
                id="fechaHoraFondeo"
                {...field}
                showIcon
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                inputStyle={{ fontWeight: "bold" }}
                disabled={loading}
                className={classNames({ "p-invalid": errors.fechaHoraFondeo })}
                style={{ width: "100%" }}
              />
            )}
          />
          {errors.fechaHoraFondeo && (
            <Message severity="error" text={errors.fechaHoraFondeo.message} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <Button
            type="button"
            label="Capturar GPS"
            icon="pi pi-map-marker"
            className="p-button-warning"
            onClick={handleCapturarGPSFondeo}
            disabled={loading}
            size="small"
            style={{ width: "100%", marginBottom: "4px" }}
          />
          <Controller
            name="puertoFondeoId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="puertoFondeoId"
                {...field}
                value={field.value}
                options={puertosNormalizados}
                optionLabel="label"
                optionValue="value"
                placeholder="Puerto Fondeo"
                filter
                disabled={loading}
                className={classNames({ "p-invalid": errors.puertoFondeoId })}
                style={{ width: "100%" }}
              />
            )}
          />
          {errors.puertoFondeoId && (
            <Message severity="error" text={errors.puertoFondeoId.message} />
          )}
        </div>

        {/* Tabla compacta de coordenadas GPS FONDEO */}
        <div style={{ flex: 3 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "2px solid #F97316",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F97316", color: "white" }}>
                <th
                  style={{
                    padding: "4px",
                    border: "1px solid #F97316",
                    fontSize: "12px",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  Formato
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "4px",
                    border: "1px solid #F97316",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  Latitud
                </th>
                <th
                  colSpan="4"
                  style={{
                    padding: "4px",
                    border: "1px solid #F97316",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  Longitud
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila Decimal */}
              <tr>
                <td
                  style={{
                    padding: "4px",
                    border: "1px solid #F97316",
                    fontWeight: "bold",
                    fontSize: "11px",
                    backgroundColor: "#fff8e1",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  Decimal
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "2px", border: "1px solid #F97316" }}
                >
                  <input
                    type="number"
                    value={latitudFondeo || ""}
                    onChange={(e) =>
                      setValue("latitudFondeo", parseFloat(e.target.value) || 0)
                    }
                    disabled={loading}
                    step="0.000001"
                    placeholder="-12.345678"
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  />
                </td>
                <td
                  colSpan="4"
                  style={{ padding: "2px", border: "1px solid #F97316" }}
                >
                  <input
                    type="number"
                    value={longitudFondeo || ""}
                    onChange={(e) =>
                      setValue(
                        "longitudFondeo",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={loading}
                    step="0.000001"
                    placeholder="-77.123456"
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  />
                </td>
              </tr>

              {/* Fila GMS */}
              <tr>
                <td
                  style={{
                    padding: "4px",
                    border: "1px solid #F97316",
                    fontWeight: "bold",
                    fontSize: "11px",
                    backgroundColor: "#fff8e1",
                    width: "75px",
                    minWidth: "75px",
                    maxWidth: "75px",
                  }}
                >
                  GMS
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoGrados}
                      onChange={(e) =>
                        setLatFondeoGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="90"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoMinutos}
                      onChange={(e) =>
                        setLatFondeoMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "50px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={latFondeoSegundos}
                      onChange={(e) =>
                        setLatFondeoSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLatitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <select
                    value={latFondeoDireccion}
                    onChange={(e) => {
                      setLatFondeoDireccion(e.target.value);
                      setTimeout(actualizarLatitudFondeoDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoGrados}
                      onChange={(e) =>
                        setLonFondeoGrados(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="180"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      °
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoMinutos}
                      onChange={(e) =>
                        setLonFondeoMinutos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59"
                      style={{
                        width: "50px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      '
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={lonFondeoSegundos}
                      onChange={(e) =>
                        setLonFondeoSegundos(Number(e.target.value) || 0)
                      }
                      onBlur={actualizarLongitudFondeoDesdeDMS}
                      disabled={loading}
                      min="0"
                      max="59.99"
                      step="0.01"
                      style={{
                        width: "60px",
                        padding: "4px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      "
                    </span>
                  </div>
                </td>
                <td style={{ padding: "2px", border: "1px solid #F97316" }}>
                  <select
                    value={lonFondeoDireccion}
                    onChange={(e) => {
                      setLonFondeoDireccion(e.target.value);
                      setTimeout(actualizarLongitudFondeoDesdeDMS, 0);
                    }}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "4px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
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
