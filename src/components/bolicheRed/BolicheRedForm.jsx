/**
 * Formulario para gestión de Boliche Red
 *
 * Características implementadas:
 * - React Hook Form con Controller para manejo de formularios
 * - Validaciones con Yup para campos obligatorios y tipos de datos
 * - Normalización de datos antes del envío
 * - Campos: activoId, descripcion, estadoActivoId, largoContraido, largoExpandido, altoM, nroFlotadores, nroPlomos, urlBolicheRedPdf, cesado
 * - Integración con API usando funciones en español
 * - Feedback visual y manejo de errores
 * - Cumple estándar ERP Megui completo
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";


// Importar componentes de cards
import DatosGeneralesBolicheRedForm from "./DatosGeneralesBolicheRedForm";
import FichaTecnicaBolicheRedForm from "./FichaTecnicaBolicheRedForm";

// APIs para cargar datos de dropdowns
import { getActivos } from "../../api/activo";
import { getEstadosMultiFuncionPorTipoProvieneDe } from "../../api/estadoMultiFuncion";
import { crearBolicheRed, actualizarBolicheRed } from "../../api/bolicheRed";

// Esquema de validación YUP alineado al modelo Prisma
const esquemaValidacion = yup.object().shape({
  activoId: yup
    .number()
    .required("El activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  descripcion: yup.string().nullable().trim(),
  estadoActivoId: yup
    .number()
    .required("El estado activo es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  largoContraido: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  largoExpandido: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  altoM: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  nroFlotadores: yup
    .number()
    .nullable()
    .integer("Debe ser un número entero")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  nroPlomos: yup
    .number()
    .nullable()
    .integer("Debe ser un número entero")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  urlBolicheRedPdf: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  cesado: yup.boolean().default(false),
  paraPescaConsumo: yup.boolean().default(false),
  paraPescaIndustrial: yup.boolean().default(false),
});

export default function BolicheRedForm({ bolicheRed, onGuardar, onCancelar }) {
  const toast = useRef(null);
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [loading, setLoading] = useState(false);

  // Estados para los dropdowns - cargados desde APIs
  const [activos, setActivos] = useState([]);
  const [estadosActivo, setEstadosActivo] = useState([]);
  const esEdicion = !!bolicheRed;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(esquemaValidacion),
    defaultValues: {
      id: null,
      activoId: null,
      descripcion: "",
      estadoActivoId: null,
      largoContraido: null,
      largoExpandido: null,
      altoM: null,
      nroFlotadores: null,
      nroPlomos: null,
      urlBolicheRedPdf: "",
      cesado: false,
      paraPescaConsumo: false,
      paraPescaIndustrial: false,
    },
  });

  /**
   * Cargar datos para combos - igual que en el backup
   */
  const cargarCombos = async () => {
    try {
      console.log("BolicheRedForm - Cargando combos...");
      const activosData = await getActivos();
      console.log("BolicheRedForm - activosData:", activosData);
      setActivos(activosData);
      const estadosActivoData = await getEstadosMultiFuncionPorTipoProvieneDe();
      console.log("BolicheRedForm - estadosActivoData:", estadosActivoData);
      setEstadosActivo(estadosActivoData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
    }
  };

  // Efecto para cargar combos al montar el componente
  useEffect(() => {
    cargarCombos();
  }, []);

  // Cargar datos en modo edición
  useEffect(() => {
    if (bolicheRed && activos.length > 0 && estadosActivo.length > 0) {
      console.log("BolicheRedForm - Cargando datos del registro:", bolicheRed);
      setValue("id", bolicheRed.id);
      setValue("activoId", bolicheRed.activoId);
      console.log("BolicheRedForm - activoId setValue:", bolicheRed.activoId);
      setValue("descripcion", bolicheRed.descripcion || "");
      setValue("estadoActivoId", bolicheRed.estadoActivoId);
      console.log(
        "BolicheRedForm - estadoActivoId setValue:",
        bolicheRed.estadoActivoId
      );
      setValue("largoContraido", bolicheRed.largoContraido || null);
      setValue("largoExpandido", bolicheRed.largoExpandido || null);
      setValue("altoM", bolicheRed.altoM || null);
      setValue("nroFlotadores", bolicheRed.nroFlotadores || null);
      setValue("nroPlomos", bolicheRed.nroPlomos || null);
      setValue("urlBolicheRedPdf", bolicheRed.urlBolicheRedPdf || "");
      setValue("cesado", bolicheRed.cesado || false);
      setValue("paraPescaConsumo", bolicheRed.paraPescaConsumo || false);
      setValue("paraPescaIndustrial", bolicheRed.paraPescaIndustrial || false);
    } else if (!bolicheRed) {
      reset({
        activoId: null,
        descripcion: "",
        estadoActivoId: null,
        largoContraido: null,
        largoExpandido: null,
        altoM: null,
        nroFlotadores: null,
        nroPlomos: null,
        urlBolicheRedPdf: "",
        cesado: false,
        paraPescaConsumo: false,
        paraPescaIndustrial: false,
      });
    }
  }, [bolicheRed, setValue, reset, activos, estadosActivo]);

  const onSubmitForm = async (data) => {
    try {
      setLoading(true);

      // Crear un nuevo objeto solo con los campos necesarios
      const datosParaEnviar = {
        id: data.id,
        activoId: Number(data.activoId),
        descripcion: data.descripcion?.trim() || null,
        estadoActivoId: Number(data.estadoActivoId),
        largoContraido: data.largoContraido || null,
        largoExpandido: data.largoExpandido || null,
        altoM: data.altoM || null,
        nroFlotadores: data.nroFlotadores || null,
        nroPlomos: data.nroPlomos || null,
        urlBolicheRedPdf: data.urlBolicheRedPdf?.trim() || null,
        cesado: data.cesado || false,
        paraPescaConsumo: data.paraPescaConsumo || false,
        paraPescaIndustrial: data.paraPescaIndustrial || false,
      };
      if (datosParaEnviar.id) {
        await actualizarBolicheRed(datosParaEnviar.id, datosParaEnviar);
      } else {
        await crearBolicheRed(datosParaEnviar);
      }
      onGuardar();

      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: `Boliche Red ${
          esEdicion ? "actualizado" : "creado"
        } correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al guardar boliche red:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Error al guardar el boliche red",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    onCancelar();
  };

  // Función para navegar entre cards
  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  // Toolbar superior con navegación entre cards
  const toolbarStart = (
    <div className="flex flex-wrap gap-2">
      <ButtonGroup>
        <Button
          type="button"
          label="Datos Generales"
          icon="pi pi-info-circle"
          className={
            activeCard === "datos-generales"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("datos-generales")}
          size="small"
        />
        <Button
          type="button"
          label="PDF Boliche Red"
          icon="pi pi-file-pdf"
          className={
            activeCard === "pdf-boliche-red"
              ? "p-button-info"
              : "p-button-outlined"
          }
          onClick={() => handleNavigateToCard("pdf-boliche-red")}
          size="small"
        />
      </ButtonGroup>
    </div>
  );


  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-8">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <form className="p-fluid">
        <Toolbar center={toolbarStart} className="mb-4" />

        {/* Renderizado condicional de cards */}
        {activeCard === "datos-generales" && (
          <DatosGeneralesBolicheRedForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            activos={activos}
            estadosActivo={estadosActivo}
            defaultValues={bolicheRed || {}}
          />
        )}

        {activeCard === "pdf-boliche-red" && (
          <FichaTecnicaBolicheRedForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={bolicheRed || {}}
          />
        )}
        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={handleCancelar}
            disabled={loading}
            raised
            outlined
            size="small"
          />
          <Button
            type="submit"
            label={esEdicion ? "Actualizar" : "Crear"}
            icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
            loading={loading}
            className="p-button-success"
            raised
            outlined
            size="small"
            onClick={handleSubmit(onSubmitForm)}
          />
        </div>
      </form>
    </>
  );
}
