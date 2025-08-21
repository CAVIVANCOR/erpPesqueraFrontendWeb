/**
 * Formulario para gestión de Embarcación con navegación por cards
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
import DatosGeneralesEmbarcacionForm from "./DatosGeneralesEmbarcacionForm";
import CertificadoDotacionMinimaSeguridadForm from "./CertificadoDotacionMinimaSeguridadForm";
import CertificadoMatriculaForm from "./CertificadoMatriculaForm";
import PermisoPescaForm from "./PermisoPescaForm";
import CertificadoArqueoForm from "./CertificadoArqueoForm";
import CertificadoFrancoBordoForm from "./CertificadoFrancoBordoForm";
import CertificadoCompasForm from "./CertificadoCompasForm";
import CertificadoRadioBalizaForm from "./CertificadoRadioBalizaForm";
import CertificadoSeguridadForm from "./CertificadoSeguridadForm";
import CertificadoHidroCarburosForm from "./CertificadoHidroCarburosForm";
import CertificadoAguasSuciasForm from "./CertificadoAguasSuciasForm";
import CertificadoBalsasSalvavidasForm from "./CertificadoBalsasSalvavidasForm";
import CertificadoPaqueteEmergenciaForm from "./CertificadoPaqueteEmergenciaForm";
import CertificadoExtinguidoresForm from "./CertificadoExtinguidoresForm";
import CertificadoFumigacionForm from "./CertificadoFumigacionForm";
import ConstanciaNoAdeudoFoncopesForm from "./ConstanciaNoAdeudoFoncopesForm";
import CertificadoSimtracForm from "./CertificadoSimtracForm";
import CertificadoGeolocalizadorForm from "./CertificadoGeolocalizadorForm";
import CertificadoSanitarioSanipesForm from "./CertificadoSanitarioSanipesForm";

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
}) {
  const toast = useRef(null);
  const [activeCard, setActiveCard] = useState("datos-generales");
  const [loading, setLoading] = useState(false);

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
      urlCertificadosDotacionMinimaSeguridad: "",
      urlCertificadoMatricula: "",
      urlPermisoPesca: "",
      urlCertificadoArqueo: "",
      urlCertificadoFrancoBordo: "",
      urlCertificadoCompas: "",
      urlCertificadoRadioBaliza: "",
      urlCertificadoSeguridad: "",
      urlCertificadoHidroCarburos: "",
      urlCertificadoAguasSucias: "",
      urlCertificadoBalsasSalvavidas: "",
      urlCertificadoPaqueteEmergencia: "",
      urlCertificadoExtinguidores: "",
      urlCertificadoFumigacion: "",
      urlConstanciaNoAdeudoFoncopes: "",
      urlCertificadoSimtrac: "",
      urlCertificadogeolocalizador: "",
      urlCertificadoSanitarioSanipes: "",
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
      setValue("tipoEmbarcacionId", Number(embarcacion.tipoEmbarcacionId) || null);
      setValue("capacidadBodegaTon", Number(embarcacion.capacidadBodegaTon) || null);
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
      setValue("urlCertificadosDotacionMinimaSeguridad", embarcacion.urlCertificadosDotacionMinimaSeguridad || "");
      setValue("urlCertificadoMatricula", embarcacion.urlCertificadoMatricula || "");
      setValue("urlPermisoPesca", embarcacion.urlPermisoPesca || "");
      setValue("urlCertificadoArqueo", embarcacion.urlCertificadoArqueo || "");
      setValue("urlCertificadoFrancoBordo", embarcacion.urlCertificadoFrancoBordo || "");
      setValue("urlCertificadoCompas", embarcacion.urlCertificadoCompas || "");
      setValue("urlCertificadoRadioBaliza", embarcacion.urlCertificadoRadioBaliza || "");
      setValue("urlCertificadoSeguridad", embarcacion.urlCertificadoSeguridad || "");
      setValue("urlCertificadoHidroCarburos", embarcacion.urlCertificadoHidroCarburos || "");
      setValue("urlCertificadoAguasSucias", embarcacion.urlCertificadoAguasSucias || "");
      setValue("urlCertificadoBalsasSalvavidas", embarcacion.urlCertificadoBalsasSalvavidas || "");
      setValue("urlCertificadoPaqueteEmergencia", embarcacion.urlCertificadoPaqueteEmergencia || "");
      setValue("urlCertificadoExtinguidores", embarcacion.urlCertificadoExtinguidores || "");
      setValue("urlCertificadoFumigacion", embarcacion.urlCertificadoFumigacion || "");
      setValue("urlConstanciaNoAdeudoFoncopes", embarcacion.urlConstanciaNoAdeudoFoncopes || "");
      setValue("urlCertificadoSimtrac", embarcacion.urlCertificadoSimtrac || "");
      setValue("urlCertificadogeolocalizador", embarcacion.urlCertificadogeolocalizador || "");
      setValue("urlCertificadoSanitarioSanipes", embarcacion.urlCertificadoSanitarioSanipes || "");
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

  // Configuración de cards
  const certificateCards = [
    {
      key: "cert-dotacion",
      label: "Certificado de Dotación Mínima de Seguridad",
      icon: "pi pi-shield",
    },
    {
      key: "cert-matricula",
      label: "Certificado de Matrícula",
      icon: "pi pi-id-card",
    },
    {
      key: "cert-permiso-pesca",
      label: "Certificado de Permiso de Pesca",
      icon: "pi pi-bookmark",
    },
    {
      key: "cert-arqueo",
      label: "Certificado de Arqueo",
      icon: "pi pi-calculator",
    },
    {
      key: "cert-franco-bordo",
      label: "Certificado de Franco Bordo",
      icon: "pi pi-compass",
    },
    {
      key: "cert-compas",
      label: "Certificado de Compás",
      icon: "pi pi-directions",
    },
    {
      key: "cert-radio-baliza",
      label: "Certificado de Radio Baliza",
      icon: "pi pi-wifi",
    },
    {
      key: "cert-seguridad",
      label: "Certificado de Seguridad",
      icon: "pi pi-lock",
    },
    {
      key: "cert-hidrocarburos",
      label: "Certificado de Hidrocarburos",
      icon: "pi pi-circle-fill",
    },
    {
      key: "cert-aguas-sucias",
      label: "Certificado de Aguas Sucias",
      icon: "pi pi-filter",
    },
    {
      key: "cert-balsas",
      label: "Certificado de Balsas Salvavidas",
      icon: "pi pi-shield",
    },
    {
      key: "cert-emergencia",
      label: "Certificado de Paquete Emergencia",
      icon: "pi pi-exclamation-triangle",
    },
    {
      key: "cert-extinguidores",
      label: "Certificado de Extinguidores",
      icon: "pi pi-bolt",
    },
    {
      key: "cert-fumigacion",
      label: "Certificado de Fumigación",
      icon: "pi pi-cloud",
    },
    {
      key: "cert-foncopes",
      label: "Certificado de No Adeudo FONCOPES",
      icon: "pi pi-check-circle",
    },
    {
      key: "cert-simtrac",
      label: "Certificado de SIMTRAC",
      icon: "pi pi-sitemap",
    },
    {
      key: "cert-geolocalizador",
      label: "Certificado de Geolocalizador",
      icon: "pi pi-map-marker",
    },
    {
      key: "cert-sanipes",
      label: "Certificado Sanitario SANIPES",
      icon: "pi pi-heart",
    },
  ];

  const toolbarStart = (
    <div className="flex flex-wrap gap-2">
      <ButtonGroup>
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
          tooltipOptions={{ position: "bottom" }}
        />
        {certificateCards.map((card) => (
          <Button
            key={card.key}
            type="button"
            icon={card.icon}
            className={
              activeCard === card.key ? "p-button-info" : "p-button-outlined"
            }
            onClick={() => handleNavigateToCard(card.key)}
            size="small"
            tooltip={card.label}
            tooltipOptions={{ position: "bottom" }}
          />
        ))}
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
      <form className="p-fluid" onSubmit={handleSubmit(onSubmitForm)}>
        <Toolbar center={toolbarStart} className="mb-4" />

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
          />
        )}

        {activeCard === "cert-dotacion" && (
          <CertificadoDotacionMinimaSeguridadForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-matricula" && (
          <CertificadoMatriculaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-permiso-pesca" && (
          <PermisoPescaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-arqueo" && (
          <CertificadoArqueoForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-franco-bordo" && (
          <CertificadoFrancoBordoForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-compas" && (
          <CertificadoCompasForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-radio-baliza" && (
          <CertificadoRadioBalizaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-seguridad" && (
          <CertificadoSeguridadForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-hidrocarburos" && (
          <CertificadoHidroCarburosForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-aguas-sucias" && (
          <CertificadoAguasSuciasForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-balsas" && (
          <CertificadoBalsasSalvavidasForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-emergencia" && (
          <CertificadoPaqueteEmergenciaForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-extinguidores" && (
          <CertificadoExtinguidoresForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-fumigacion" && (
          <CertificadoFumigacionForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-foncopes" && (
          <ConstanciaNoAdeudoFoncopesForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-simtrac" && (
          <CertificadoSimtracForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-geolocalizador" && (
          <CertificadoGeolocalizadorForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
          />
        )}

        {activeCard === "cert-sanipes" && (
          <CertificadoSanitarioSanipesForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={embarcacion || {}}
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
            onClick={onCancelar}
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
          />
        </div>
      </form>
    </>
  );
}
