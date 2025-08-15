// src/components/producto/ProductoForm.jsx
// Formulario profesional para Producto. Cumple la regla transversal ERP Megui.
import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { ButtonGroup } from "primereact/buttongroup";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toUpperCaseSafe } from "../../utils/utils";
import { Tag } from "primereact/tag"; // Importar Tag de PrimeReact

// Importar componentes de cards
import DatosGeneralesProductoForm from "./DatosGeneralesProductoForm";
import DimensionesProductoForm from "./DimensionesProductoForm";
import FichaTecnicaProductoForm from "./FichaTecnicaProductoForm";

// Esquema de validación YUP alineado al modelo Prisma
const schema = yup.object().shape({
  codigo: yup
    .string()
    .nullable()
    .max(40, "Código no puede exceder 40 caracteres")
    .transform((value) => toUpperCaseSafe(value)),
  descripcionBase: yup
    .string()
    .required("Descripción base es obligatoria")
    .max(120, "Descripción base no puede exceder 120 caracteres")
    .transform((value) => toUpperCaseSafe(value)),
  descripcionExtendida: yup
    .string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : toUpperCaseSafe(value);
    }),
  descripcionArmada: yup
    .string()
    .required("Descripción armada es obligatoria")
    .transform((value) => toUpperCaseSafe(value)),
  familiaId: yup
    .number()
    .required("Familia es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  subfamiliaId: yup
    .number()
    .required("Subfamilia es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadMedidaId: yup
    .number()
    .required("Unidad de medida es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tipoAlmacenamientoId: yup
    .number()
    .required("Tipo de almacenamiento es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  procedenciaId: yup
    .number()
    .required("Procedencia es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  marcaId: yup
    .number()
    .required("Marca es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  estadoInicialId: yup
    .number()
    .required("Estado inicial es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  empresaId: yup
    .number()
    .required("Empresa es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  clienteId: yup
    .number()
    .required("Cliente es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  tipoMaterialId: yup
    .number()
    .required("Tipo de material es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  colorId: yup
    .number()
    .required("Color es obligatorio")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadAnguloId: yup
    .number()
    .required("Unidad de ángulo es obligatoria")
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  // Campos opcionales
  unidadDiametroId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadAnchoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadAltoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadLargoId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  unidadEspesorId: yup
    .number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    }),
  porcentajeDetraccion: yup
    .number()
    .nullable()
    .min(0, "Porcentaje no puede ser negativo")
    .max(100, "Porcentaje no puede exceder 100"),
  medidaDiametro: yup
    .string()
    .nullable()
    .max(20, "Medida diámetro no puede exceder 20 caracteres"),
  medidaAncho: yup
    .string()
    .nullable()
    .max(20, "Medida ancho no puede exceder 20 caracteres"),
  medidaAlto: yup
    .string()
    .nullable()
    .max(20, "Medida alto no puede exceder 20 caracteres"),
  medidaLargo: yup
    .string()
    .nullable()
    .max(20, "Medida largo no puede exceder 20 caracteres"),
  medidaEspesor: yup
    .string()
    .nullable()
    .max(20, "Medida espesor no puede exceder 20 caracteres"),
  medidaAngulo: yup
    .string()
    .nullable()
    .max(20, "Medida ángulo no puede exceder 20 caracteres"),
  descripcionMedidaAdicional: yup.string().nullable(),
  exoneradoIgv: yup.boolean().default(false),
  exoneradoRetencion: yup.boolean().default(false),
  sujetoDetraccion: yup.boolean().default(false),
  aplicaSubfamilia: yup.boolean().default(false),
  aplicaUnidadMedida: yup.boolean().default(false),
  aplicaTipoAlmacenamiento: yup.boolean().default(false),
  aplicaProcedencia: yup.boolean().default(false),
  aplicaMarca: yup.boolean().default(false),
  aplicaTipoMaterial: yup.boolean().default(false),
  aplicaColor: yup.boolean().default(false),
});

export default function ProductoForm({
  producto,
  familias = [],
  subfamilias = [],
  unidadesMedida = [],
  unidadesMetricas = [],
  tiposMaterial = [],
  colores = [],
  empresas = [],
  clientes = [],
  tiposAlmacenamiento = [],
  paises = [],
  marcas = [],
  estadosIniciales = [],
  unidadMetricaDefault,
  onGuardar,
  onCancelar,
  modoEdicion = false,
  loading = false,
  setLoading,
}) {
  const toast = useRef(null);
  const [activeCard, setActiveCard] = useState("datos-generales");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: producto?.id ? Number(producto.id) : null, // Agregar id para habilitar funcionalidades que requieren ID existente
      codigo: producto?.codigo || "",
      descripcionBase: producto?.descripcionBase || "",
      descripcionExtendida: producto?.descripcionExtendida || "",
      descripcionArmada: producto?.descripcionArmada || "",
      familiaId: producto?.familiaId ? Number(producto.familiaId) : null,
      subfamiliaId: producto?.subfamiliaId
        ? Number(producto.subfamiliaId)
        : null,
      unidadMedidaId: producto?.unidadMedidaId
        ? Number(producto.unidadMedidaId)
        : null,
      tipoAlmacenamientoId: producto?.tipoAlmacenamientoId
        ? Number(producto.tipoAlmacenamientoId)
        : 1,
      procedenciaId: producto?.procedenciaId
        ? Number(producto.procedenciaId)
        : 1,
      marcaId: producto?.marcaId ? Number(producto.marcaId) : 1,
      estadoInicialId: producto?.estadoInicialId
        ? Number(producto.estadoInicialId)
        : Number(
            estadosIniciales.find(
              (e) =>
                e.descripcion?.toUpperCase() === "LIBERADO" &&
                e.tipoProvieneDe?.descripcion?.toUpperCase() === "PRODUCTOS"
            )?.id
          ) || null,
      empresaId: producto?.empresaId ? Number(producto.empresaId) : null,
      clienteId: producto?.clienteId ? Number(producto.clienteId) : null,
      tipoMaterialId: producto?.tipoMaterialId
        ? Number(producto.tipoMaterialId)
        : 1,
      colorId: producto?.colorId ? Number(producto.colorId) : 1,
      unidadDiametroId: Number(producto?.unidadDiametroId)
        ? Number(producto.unidadDiametroId)
        : Number(unidadMetricaDefault?.id) || null,
      unidadAnchoId: Number(producto?.unidadAnchoId)
        ? Number(producto.unidadAnchoId)
        : Number(unidadMetricaDefault?.id) || null,
      unidadAltoId: Number(producto?.unidadAltoId)
        ? Number(producto.unidadAltoId)
        : Number(unidadMetricaDefault?.id) || null,
      unidadLargoId: Number(producto?.unidadLargoId)
        ? Number(producto.unidadLargoId)
        : Number(unidadMetricaDefault?.id) || null,
      unidadEspesorId: Number(producto?.unidadEspesorId)
        ? Number(producto.unidadEspesorId)
        : Number(unidadMetricaDefault?.id) || null,
      unidadAnguloId: Number(producto?.unidadAnguloId)
        ? Number(producto.unidadAnguloId)
        : Number(unidadMetricaDefault?.id) || null,
      exoneradoIgv: Number(producto?.exoneradoIgv) || false,
      porcentajeDetraccion: Number(producto?.porcentajeDetraccion) || 0,
      medidaDiametro: producto?.medidaDiametro || "",
      medidaAncho: producto?.medidaAncho || "",
      medidaAlto: producto?.medidaAlto || "",
      medidaLargo: producto?.medidaLargo || "",
      medidaEspesor: producto?.medidaEspesor || "",
      medidaAngulo: producto?.medidaAngulo || "",
      descripcionMedidaAdicional: producto?.descripcionMedidaAdicional || "",
      exoneradoRetencion: producto?.exoneradoRetencion || false,
      sujetoDetraccion: producto?.sujetoDetraccion || false,
      aplicaSubfamilia: producto?.aplicaSubfamilia || false,
      aplicaUnidadMedida: producto?.aplicaUnidadMedida || false,
      aplicaTipoAlmacenamiento: producto?.aplicaTipoAlmacenamiento || false,
      aplicaProcedencia: producto?.aplicaProcedencia || false,
      aplicaMarca: producto?.aplicaMarca || false,
      aplicaTipoMaterial: producto?.aplicaTipoMaterial || false,
      aplicaColor: producto?.aplicaColor || false,
      urlFichaTecnica: producto?.urlFichaTecnica || "",
      urlFotoProducto: producto?.urlFotoProducto || "",
    },
  });

  const familiaIdWatch = watch("familiaId");

  // Opciones normalizadas para dropdowns
  const familiasOptions = familias.map((f) => ({
    label: f.nombre,
    value: Number(f.id),
  }));

  const subfamiliasOptions = subfamilias
    .filter((s) => Number(s.familiaId) === Number(familiaIdWatch))
    .map((s) => ({
      label: s.nombre,
      value: Number(s.id),
    }));

  const unidadesMedidaOptions = unidadesMedida.map((u) => ({
    label: `${u.nombre} (${u.simbolo})`,
    value: Number(u.id),
  }));

  const unidadesMetricasOptions = unidadesMetricas.map((u) => ({
    label: `${u.nombre} (${u.simbolo})`,
    value: Number(u.id),
  }));

  const tiposMaterialOptions = tiposMaterial.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const coloresOptions = colores.map((c) => ({
    label: c.nombre,
    value: Number(c.id),
  }));

  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const clientesOptions = clientes
    .filter((c) => c.esCliente === true)
    .map((c) => ({
      label: c.razonSocial,
      value: Number(c.id),
    }));

  const tiposAlmacenamientoOptions = tiposAlmacenamiento.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  const paisesOptions = paises.map((p) => ({
    label: p.gentilicio,
    value: Number(p.id),
  }));

  const marcasOptions = marcas.map((m) => ({
    label: m.nombre,
    value: Number(m.id),
  }));

  const estadosInicialesOptions = estadosIniciales.map((e) => ({
    label: e.descripcion,
    value: Number(e.id),
  }));

  // Limpiar subfamilia cuando cambie la familia
  useEffect(() => {
    if (familiaIdWatch) {
      const subfamiliaActual = watch("subfamiliaId");
      const subfamiliaValida = subfamilias.find(
        (s) =>
          Number(s.id) === Number(subfamiliaActual) &&
          Number(s.familiaId) === Number(familiaIdWatch)
      );
      if (!subfamiliaValida) {
        setValue("subfamiliaId", null);
      }
    }
  }, [familiaIdWatch, subfamilias, setValue, watch]);

  // Establecer estado inicial LIBERADO para productos nuevos
  useEffect(() => {
    if (!modoEdicion && estadosIniciales.length > 0) {
      const estadoLiberado = estadosIniciales.find(
        (e) =>
          e.descripcion?.toUpperCase() === "LIBERADO" &&
          e.tipoProvieneDe?.descripcion?.toUpperCase() === "PRODUCTOS"
      );

      if (estadoLiberado) {
        const estadoLiberadoId = Number(estadoLiberado.id);
        const currentValue = watch("estadoInicialId");

        if (Number(currentValue) !== estadoLiberadoId) {
          setValue("estadoInicialId", estadoLiberadoId);
        }
      }
    }
  }, [estadosIniciales, modoEdicion, setValue, watch]);

  // Establecer valores por defecto para unidades de dimensiones cuando se carga unidadMetricaDefault
  useEffect(() => {
    if (!modoEdicion && unidadMetricaDefault?.id) {
      const defaultId = Number(unidadMetricaDefault.id);
      // Solo establecer si los campos están vacíos (null)
      if (!watch("unidadDiametroId")) setValue("unidadDiametroId", defaultId);
      if (!watch("unidadAnchoId")) setValue("unidadAnchoId", defaultId);
      if (!watch("unidadAltoId")) setValue("unidadAltoId", defaultId);
      if (!watch("unidadLargoId")) setValue("unidadLargoId", defaultId);
      if (!watch("unidadEspesorId")) setValue("unidadEspesorId", defaultId);
      if (!watch("unidadAnguloId")) setValue("unidadAnguloId", defaultId);
    }
  }, [unidadMetricaDefault, modoEdicion, setValue, watch]);

  // Función para armar descripcionArmada según especificación del usuario
  const armarDescripcionArmada = () => {
    const formData = watch();
    let descripcionArmada = "";

    // 1. Descripción base según aplicaSubfamilia
    if (formData.aplicaSubfamilia) {
      const subfamilia = subfamilias.find(
        (s) => Number(s.id) === Number(formData.subfamiliaId)
      );
      if (subfamilia) {
        descripcionArmada =
          subfamilia.nombre +
          " " +
          (formData.descripcionBase || "") +
          " " +
          (formData.descripcionExtendida || "");
      } else {
        descripcionArmada =
          (formData.descripcionBase || "") +
          " " +
          (formData.descripcionExtendida || "");
      }
    } else {
      descripcionArmada =
        (formData.descripcionBase || "") +
        " " +
        (formData.descripcionExtendida || "");
    }

    // 2. Tipo Material si tipoMaterialId > 1
    if (Number(formData.tipoMaterialId) > 1) {
      const tipoMaterial = tiposMaterial.find(
        (t) => Number(t.id) === Number(formData.tipoMaterialId)
      );
      if (tipoMaterial) {
        descripcionArmada += " " + tipoMaterial.nombre;
      }
    }

    // 3. Medidas si alguna es diferente de ""
    const tieneMedidas =
      formData.medidaDiametro ||
      formData.medidaAncho ||
      formData.medidaAlto ||
      formData.medidaLargo ||
      formData.medidaEspesor ||
      formData.medidaAngulo;

    if (tieneMedidas) {
      descripcionArmada += " ";

      // Diámetro
      if (formData.medidaDiametro) {
        const unidadDiametro = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadDiametroId)
        );
        descripcionArmada +=
          " " + formData.medidaDiametro + " " + (unidadDiametro?.simbolo || "");
      }

      // Ancho
      if (formData.medidaAncho) {
        const unidadAncho = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadAnchoId)
        );
        descripcionArmada +=
          " " + formData.medidaAncho + " " + (unidadAncho?.simbolo || "");
      }

      // Alto
      if (formData.medidaAlto) {
        const unidadAlto = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadAltoId)
        );
        descripcionArmada +=
          " " + formData.medidaAlto + " " + (unidadAlto?.simbolo || "");
      }

      // Largo
      if (formData.medidaLargo) {
        const unidadLargo = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadLargoId)
        );
        descripcionArmada +=
          " " + formData.medidaLargo + " " + (unidadLargo?.simbolo || "");
      }

      // Espesor
      if (formData.medidaEspesor) {
        const unidadEspesor = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadEspesorId)
        );
        descripcionArmada +=
          " " + formData.medidaEspesor + " " + (unidadEspesor?.simbolo || "");
      }

      // Ángulo
      if (formData.medidaAngulo) {
        const unidadAngulo = unidadesMetricas.find(
          (u) => Number(u.id) === Number(formData.unidadAnguloId)
        );
        descripcionArmada +=
          " " + formData.medidaAngulo + " " + (unidadAngulo?.simbolo || "");
      }
      if (formData.descripcionMedidaAdicional) {
        descripcionArmada += " " + formData.descripcionMedidaAdicional;
      }
    }

    // 4. Marca si marcaId > 0 y aplicaMarca = true
    if (Number(formData.marcaId) > 0 && formData.aplicaMarca) {
      const marca = marcas.find(
        (m) => Number(m.id) === Number(formData.marcaId)
      );
      if (marca) {
        descripcionArmada += " " + marca.nombre;
      }
    }

    // 5. Color si colorId > 1 y aplicaColor = true
    if (Number(formData.colorId) > 1 && formData.aplicaColor) {
      const color = colores.find(
        (c) => Number(c.id) === Number(formData.colorId)
      );
      if (color) {
        descripcionArmada += " " + color.nombre;
      }
    }

    // 6. Unidad de medida si aplicaUnidadMedida = true
    if (formData.aplicaUnidadMedida) {
      const unidadMedida = unidadesMedida.find(
        (u) => Number(u.id) === Number(formData.unidadMedidaId)
      );
      if (unidadMedida) {
        descripcionArmada += " " + unidadMedida.simbolo;
      }
    }

    // 7. Tipo de almacenamiento si aplicaTipoAlmacenamiento = true
    if (formData.aplicaTipoAlmacenamiento) {
      const tipoAlmacenamiento = tiposAlmacenamiento.find(
        (t) => Number(t.id) === Number(formData.tipoAlmacenamientoId)
      );
      if (tipoAlmacenamiento) {
        descripcionArmada += " " + tipoAlmacenamiento.nombre;
      }
    }

    // 8. Procedencia si aplicaProcedencia = true
    if (formData.aplicaProcedencia) {
      const pais = paises.find(
        (p) => Number(p.id) === Number(formData.procedenciaId)
      );
      if (pais) {
        descripcionArmada += " " + pais.gentilicio;
      }
    }

    // Limpiar espacios múltiples y actualizar el campo
    descripcionArmada = descripcionArmada.replace(/\s+/g, " ").trim();
    setValue("descripcionArmada", descripcionArmada);

    return descripcionArmada;
  };

  const handleCancelar = () => {
    onCancelar();
  };

  // Función para navegar entre cards
  const handleNavigateToCard = (cardName) => {
    setActiveCard(cardName);
  };

  const onSubmitForm = async (data) => {
    try {
      setLoading(true);

      // Crear un nuevo objeto solo con los campos necesarios
      const datosParaEnviar = {
        id: data.id,
        codigo: data.codigo,
        descripcionBase: data.descripcionBase,
        descripcionExtendida: data.descripcionExtendida,
        descripcionArmada: data.descripcionArmada,
        familiaId: Number(data.familiaId),
        subfamiliaId: Number(data.subfamiliaId),
        unidadMedidaId: Number(data.unidadMedidaId),
        tipoAlmacenamientoId: Number(data.tipoAlmacenamientoId),
        procedenciaId: Number(data.procedenciaId),
        marcaId: Number(data.marcaId),
        estadoInicialId: Number(data.estadoInicialId),
        empresaId: Number(data.empresaId),
        clienteId: Number(data.clienteId),
        tipoMaterialId: Number(data.tipoMaterialId),
        colorId: Number(data.colorId),
        unidadDiametroId: Number(data.unidadDiametroId),
        unidadAnchoId: Number(data.unidadAnchoId),
        unidadAltoId: Number(data.unidadAltoId),
        unidadLargoId: Number(data.unidadLargoId),
        unidadEspesorId: Number(data.unidadEspesorId),
        unidadAnguloId: Number(data.unidadAnguloId),
        medidaDiametro: data.medidaDiametro,
        medidaAncho: data.medidaAncho,
        medidaAlto: data.medidaAlto,
        medidaLargo: data.medidaLargo,
        medidaEspesor: data.medidaEspesor,
        medidaAngulo: data.medidaAngulo,
        descripcionMedidaAdicional: data.descripcionMedidaAdicional,
        porcentajeDetraccion: data.porcentajeDetraccion,
        exoneradoIgv: data.exoneradoIgv,
        exoneradoRetencion: data.exoneradoRetencion,
        sujetoDetraccion: data.sujetoDetraccion,
        aplicaSubfamilia: data.aplicaSubfamilia,
        aplicaUnidadMedida: data.aplicaUnidadMedida,
        aplicaTipoAlmacenamiento: data.aplicaTipoAlmacenamiento,
        aplicaProcedencia: data.aplicaProcedencia,
        aplicaMarca: data.aplicaMarca,
        aplicaTipoMaterial: data.aplicaTipoMaterial,
        aplicaColor: data.aplicaColor,
        urlFichaTecnica: data.urlFichaTecnica,
        urlFotoProducto: data.urlFotoProducto
      };

      // Eliminar propiedades que son null o undefined
      Object.keys(datosParaEnviar).forEach(key => {
        if (datosParaEnviar[key] === null || datosParaEnviar[key] === undefined) {
          delete datosParaEnviar[key];
        }
      });

      await onGuardar(datosParaEnviar);
      
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: `Producto ${modoEdicion ? "actualizado" : "creado"} correctamente`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error al guardar producto:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || error.message || "Error al guardar el producto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      {/* Mostrar descripción armada con Tag de PrimeReact */}
      <div className="flex justify-content-center mb-4">
        <Tag 
          value={watch('descripcionArmada') || 'Nuevo Producto'}
          severity="info"
          style={{
            fontSize: '1.1rem',
            padding: '0.75rem 1.25rem',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            textAlign: 'center',
            width: '100%',
          }}
          pt={{
            root: { className: 'shadow-2' }
          }}
        />
      </div>

      {/* Sistema de navegación con botones de iconos */}
      <Toolbar
        center={
          <ButtonGroup>
            <Button
              icon="pi pi-info-circle"
              tooltip="Datos Generales - Información básica del producto"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "datos-generales"
                  ? "p-button-primary"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("datos-generales")}
              type="button"
            />
            <Button
              icon="pi pi-arrows-alt"
              tooltip="Dimensiones - Medidas y características físicas"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "dimensiones"
                  ? "p-button-success"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("dimensiones")}
              type="button"
            />
            <Button
              icon="pi pi-file-pdf"
              tooltip="Ficha Técnica - Documentación y especificaciones"
              tooltipOptions={{ position: "bottom" }}
              className={
                activeCard === "ficha-tecnica"
                  ? "p-button-warning"
                  : "p-button-outlined"
              }
              onClick={() => handleNavigateToCard("ficha-tecnica")}
              type="button"
            />
          </ButtonGroup>
        }
      />

      <form onSubmit={handleSubmit(onSubmitForm)}>
        {activeCard === "datos-generales" && (
          <DatosGeneralesProductoForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={getValues()} // Agregar defaultValues para acceso al id del producto
            familias={familias}
            subfamilias={subfamilias}
            unidadesMedida={unidadesMedida}
            tiposAlmacenamiento={tiposAlmacenamiento}
            paises={paises}
            marcas={marcas}
            estadosIniciales={estadosIniciales}
            empresas={empresas}
            clientes={clientes}
            tiposMaterial={tiposMaterial}
            colores={colores}
            unidadMetricaDefault={unidadMetricaDefault}
          />
        )}

        {activeCard === "dimensiones" && (
          <DimensionesProductoForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            unidadesMetricas={unidadesMetricas}
            tiposMaterial={tiposMaterial}
            colores={colores}
            marcas={marcas}
            tipoMaterialDefault={tiposMaterial[0]}
            colorDefault={colores[0]}
            marcaDefault={marcas[0]}
            unidadMetricaDefault={unidadMetricaDefault}
            modoEdicion={modoEdicion}
          />
        )}

        {activeCard === "ficha-tecnica" && (
          <FichaTecnicaProductoForm
            control={control}
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
            defaultValues={getValues()} // Agregar defaultValues para acceso al id del producto
          />
        )}

        <div
          style={{
            marginTop: "1rem",
            alignItems: "center",
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={handleCancelar}
            disabled={loading}
          />
          <Button
            type="submit"
            label={modoEdicion ? "Actualizar" : "Crear"}
            icon={modoEdicion ? "pi pi-check" : "pi pi-plus"}
            className="p-button-success"
            loading={loading}
          />
        </div>

        {loading && (
          <div className="flex justify-content-center mt-3">
            <ProgressSpinner />
          </div>
        )}
      </form>
    </div>
  );
}
