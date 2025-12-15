/**
 * Formulario para gestión de Embarcación con navegación por cards
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Importar componentes de cards
import DatosGeneralesEmbarcacionForm from "./DatosGeneralesEmbarcacionForm";
import DetalleDocsEmbarcacionCard from "./DetalleDocsEmbarcacionCard";

// APIs
import { getActivos } from "../../api/activo";
import { getTiposEmbarcacion } from "../../api/tipoEmbarcacion";
import { getEstadosMultiFuncionPorTipoProvieneDe } from "../../api/estadoMultiFuncion";
import { crearEmbarcacion, actualizarEmbarcacion } from "../../api/embarcacion";

// Esquema de validación
const esquemaValidacion = yup.object().shape({
  activoId: yup.number().required("El activo es obligatorio"),
  matricula: yup.string().required("La matrícula es obligatoria"),
  tipoEmbarcacionId: yup
    .number()
    .required("El tipo de embarcación es obligatorio"),
  estadoActivoId: yup.number().required("El estado activo es obligatorio"),
});

export default function EmbarcacionForm({
  embarcacion,
  onGuardar,
  onCancelar,
  readOnly = false,
}) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState("datos-generales");

  // Estados para dropdowns
  const [activos, setActivos] = useState([]);
  const [tiposEmbarcacion, setTiposEmbarcacion] = useState([]);
  const [estadosActivo, setEstadosActivo] = useState([]);
  const esEdicion = !!embarcacion;

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
      matricula: "",
      tipoEmbarcacionId: null,
      capacidadBodegaTon: null,
      esloraM: null,
      mangaM: null,
      puntalM: null,
      motorMarca: "",
      motorPotenciaHp: null,
      anioFabricacion: null,
      proveedorGpsId: null,
      tabletMarca: "",
      tabletModelo: "",
      estadoActivoId: null,
      urlFotoEmbarcacion: "",
    },
  });

  const cargarCombos = async () => {
    try {
      const [activosData, tiposEmbarcacionData, estadosActivoData] =
        await Promise.all([
          getActivos(),
          getTiposEmbarcacion(),
          getEstadosMultiFuncionPorTipoProvieneDe(),
        ]);
      setActivos(activosData);
      setTiposEmbarcacion(tiposEmbarcacionData);
      setEstadosActivo(estadosActivoData);
    } catch (error) {
      console.error("Error al cargar combos:", error);
    }
  };

  useEffect(() => {
    cargarCombos();
  }, []);

  useEffect(() => {
    if (
      embarcacion &&
      activos.length > 0 &&
      tiposEmbarcacion.length > 0 &&
      estadosActivo.length > 0
    ) {
      setValue("id", embarcacion.id);
      setValue("activoId", Number(embarcacion.activoId) || null);
      setValue("matricula", embarcacion.matricula || "");
      setValue(
        "tipoEmbarcacionId",
        Number(embarcacion.tipoEmbarcacionId) || null
      );
      setValue(
        "capacidadBodegaTon",
        Number(embarcacion.capacidadBodegaTon) || null
      );
      setValue("esloraM", Number(embarcacion.esloraM) || null);
      setValue("mangaM", Number(embarcacion.mangaM) || null);
      setValue("puntalM", Number(embarcacion.puntalM) || null);
      setValue("motorMarca", embarcacion.motorMarca || "");
      setValue("motorPotenciaHp", Number(embarcacion.motorPotenciaHp) || null);
      setValue("anioFabricacion", Number(embarcacion.anioFabricacion) || null);
      setValue("proveedorGpsId", Number(embarcacion.proveedorGpsId) || null);
      setValue("tabletMarca", embarcacion.tabletMarca || "");
      setValue("tabletModelo", embarcacion.tabletModelo || "");
      setValue("estadoActivoId", Number(embarcacion.estadoActivoId) || null);
      setValue("urlFotoEmbarcacion", embarcacion.urlFotoEmbarcacion || "");
    } else if (!embarcacion) {
      reset();
    }
  }, [embarcacion, setValue, reset, activos, tiposEmbarcacion, estadosActivo]);

  const onSubmitForm = async (data) => {
    try {
      setLoading(true);
      const datosParaEnviar = { ...data };

      if (datosParaEnviar.id) {
        await actualizarEmbarcacion(datosParaEnviar.id, datosParaEnviar);
      } else {
        await crearEmbarcacion(datosParaEnviar);
      }

      onGuardar();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Embarcación ${
          esEdicion ? "actualizada" : "creada"
        } correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al guardar embarcación:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Error al guardar la embarcación",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  const toolbarStart = <div className="flex flex-wrap gap-2"></div>;

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
      <form className="p-fluid" onSubmit={handleSubmit(onSubmitForm)}>
        {/* Renderizado condicional de cards */}
        {activeCard === "datos-generales" && (
          <DatosGeneralesEmbarcacionForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            activosOptions={activos}
            tiposEmbarcacionOptions={tiposEmbarcacion}
            estadosActivoOptions={estadosActivo}
            defaultValues={embarcacion || {}}
            readOnly={readOnly}
          />
        )}

        {activeCard === "documentacion" && (
          <DetalleDocsEmbarcacionCard embarcacionId={embarcacion?.id} />
        )}

        {/* Botones de acción */}
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            marginTop: "0.5rem",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              icon="pi pi-info-circle"
              className={
                activeCard === "datos-generales"
                  ? "p-button-info"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("datos-generales")}
              size="small"
              tooltip="Datos Generales"
            />
            <Button
              type="button"
              icon="pi pi-folder"
              className={
                activeCard === "documentacion"
                  ? "p-button-info"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("documentacion")}
              size="small"
              tooltip="Documentación"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={onCancelar}
              disabled={loading}
              raised
              outlined
              size="small"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              type="submit"
              label={esEdicion ? "Actualizar" : "Crear"}
              icon={esEdicion ? "pi pi-check" : "pi pi-plus"}
              loading={loading}
              disabled={readOnly}
              className="p-button-success"
              raised
              outlined
              size="small"
            />
          </div>
        </div>
      </form>
    </>
  );
}
