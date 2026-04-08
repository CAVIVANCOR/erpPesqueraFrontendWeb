// src/components/movimientoCaja/MovimientoCajaForm.jsx
// Formulario profesional para MovimientoCaja con navegación por Cards
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DatosGeneralesMovimientoCajaCard from "./DatosGeneralesMovimientoCajaCard";
import PdfComprobanteOperacionCard from "./PdfComprobanteOperacionCard";
import PdfDocumentoAfectoOperacionCard from "./PdfDocumentoAfectoOperacionCard";
import DetallesGeneradosCard from "./DetallesGeneradosCard";
import CardAsientoContable from "../common/CardAsientoContable";

const MovimientoCajaForm = ({
  isEdit = false,
  defaultValues = {},
  onSubmit,
  onCancel,
  loading = false,
  empresas = [],
  monedas = [],
  tipoMovEntregaRendir = [],
  tipoReferenciaMovimientoCaja = [],
  cuentasCorrientes = [],
  entidadesComerciales = [],
  cuentasEntidadComercial = [],
  centrosCosto = [],
  personal = [],
  modulos = [],
  productos = [],
  estadosMultiFuncion = [],
  cuentasOrigenFiltradas = [],
  cuentasDestinoFiltradas = [],
  onValidarMovimiento,
  onGenerarAsiento,
  readOnly = false,
  permisos = { puedeVer: true, puedeEditar: true },
}) => {
  const toast = useRef(null);
  // React Hook Form para componentes PDF
  const {
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      urlComprobanteOperacionMovCaja:
        defaultValues?.urlComprobanteOperacionMovCaja || "",
      urlDocumentoMovCaja: defaultValues?.urlDocumentoMovCaja || "",
    },
  });

  // Estado para navegación de cards
  const [cardActiva, setCardActiva] = React.useState("datos");
  // Estado para filtro de familia de productos
  const [familiaFiltroId, setFamiliaFiltroId] = React.useState(null);

  // Estados del formulario
  const [empresaOrigenId, setEmpresaOrigenId] = React.useState(
    defaultValues?.empresaOrigenId ? Number(defaultValues.empresaOrigenId) : "",
  );
  const [cuentaCorrienteOrigenId, setCuentaCorrienteOrigenId] = React.useState(
    defaultValues?.cuentaCorrienteOrigenId
      ? Number(defaultValues.cuentaCorrienteOrigenId)
      : "",
  );
  const [empresaDestinoId, setEmpresaDestinoId] = React.useState(
    defaultValues?.empresaDestinoId
      ? Number(defaultValues.empresaDestinoId)
      : "",
  );
  const [cuentaCorrienteDestinoId, setCuentaCorrienteDestinoId] =
    React.useState(
      defaultValues?.cuentaCorrienteDestinoId
        ? Number(defaultValues.cuentaCorrienteDestinoId)
        : "",
    );
  const [fechaOperacionMovCaja, setFechaOperacionMovCaja] = React.useState(
    defaultValues?.fechaOperacionMovCaja
      ? new Date(defaultValues.fechaOperacionMovCaja)
      : new Date(),
  );
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(
    defaultValues?.tipoMovimientoId
      ? Number(defaultValues.tipoMovimientoId)
      : "",
  );
  const [entidadComercialId, setEntidadComercialId] = React.useState(
    defaultValues?.entidadComercialId
      ? Number(defaultValues.entidadComercialId)
      : "",
  );
  const [monto, setMonto] = React.useState(
    defaultValues?.monto ? Number(defaultValues.monto) : 0,
  );
  const [monedaId, setMonedaId] = React.useState(
    defaultValues?.monedaId ? Number(defaultValues.monedaId) : "",
  );
  const [descripcion, setDescripcion] = React.useState(
    defaultValues?.descripcion || "",
  );
  const [referenciaExtId, setReferenciaExtId] = React.useState(
    defaultValues?.referenciaExtId || "",
  );
  const [medioPagoId, setMedioPagoId] = React.useState(
    defaultValues?.medioPagoId
      ? Number(defaultValues.medioPagoId)
      : "",
  );
  const [usuarioId, setUsuarioId] = React.useState(
    defaultValues?.usuarioId ? Number(defaultValues.usuarioId) : "",
  );
  const [estadoId, setEstadoId] = React.useState(
    defaultValues?.estadoId
      ? Number(defaultValues.estadoId)
      : !isEdit
        ? 20
        : "",
  );
  const [fechaCreacion, setFechaCreacion] = React.useState(
    defaultValues?.fechaCreacion
      ? new Date(defaultValues.fechaCreacion)
      : new Date(),
  );
  const [fechaActualizacion, setFechaActualizacion] = React.useState(
    defaultValues?.fechaActualizacion
      ? new Date(defaultValues.fechaActualizacion)
      : new Date(),
  );
  const [centroCostoId, setCentroCostoId] = React.useState(
    defaultValues?.centroCostoId ? Number(defaultValues.centroCostoId) : "",
  );
  const [moduloOrigenMotivoOperacionId, setModuloOrigenMotivoOperacionId] =
    React.useState(
      defaultValues?.moduloOrigenMotivoOperacionId
        ? Number(defaultValues.moduloOrigenMotivoOperacionId)
        : "",
    );
  const [origenMotivoOperacionId, setOrigenMotivoOperacionId] = React.useState(
    defaultValues?.origenMotivoOperacionId
      ? Number(defaultValues.origenMotivoOperacionId)
      : "",
  );
  const [fechaMotivoOperacion, setFechaMotivoOperacion] = React.useState(
    defaultValues.fechaMotivoOperacion
      ? new Date(defaultValues.fechaMotivoOperacion)
      : null,
  );
  const [usuarioMotivoOperacionId, setUsuarioMotivoOperacionId] =
    React.useState(
      defaultValues.usuarioMotivoOperacionId
        ? Number(defaultValues.usuarioMotivoOperacionId)
        : "",
    );
  const [
    origenReferenciaIngresoMovCajaId,
    setOrigenReferenciaIngresoMovCajaId,
  ] = React.useState(
    defaultValues.origenReferenciaIngresoMovCajaId
      ? Number(defaultValues.origenReferenciaIngresoMovCajaId)
      : "",
  );
  const [operacionSinFactura, setOperacionSinFactura] = React.useState(
    defaultValues.operacionSinFactura || false,
  );
  const [cuentaDestinoEntidadComercialId, setCuentaDestinoEntidadComercialId] =
    React.useState(
      defaultValues.cuentaDestinoEntidadComercialId
        ? Number(defaultValues.cuentaDestinoEntidadComercialId)
        : "",
    );
  const [productoId, setProductoId] = React.useState(
    defaultValues.productoId ? Number(defaultValues.productoId) : "",
  );

  // NUEVOS ESTADOS PARA PDFs
  const [urlComprobanteOperacionMovCaja, setUrlComprobanteOperacionMovCaja] =
    React.useState(defaultValues.urlComprobanteOperacionMovCaja || "");
  const [urlDocumentoMovCaja, setUrlDocumentoMovCaja] = React.useState(
    defaultValues.urlDocumentoMovCaja || "",
  );

  // NUEVOS ESTADOS PARA WORKFLOW Y CONFIGURACIÓN CONTABLE/FISCAL
  const [generarAsientoContable, setGenerarAsientoContable] = React.useState(
    defaultValues.generarAsientoContable !== undefined
      ? defaultValues.generarAsientoContable
      : true,
  );
  const [incluirEnReporteFiscal, setIncluirEnReporteFiscal] = React.useState(
    defaultValues.incluirEnReporteFiscal !== undefined
      ? defaultValues.incluirEnReporteFiscal
      : true,
  );
  const [motivoSinFactura, setMotivoSinFactura] = React.useState(
    defaultValues.motivoSinFactura || "",
  );

  // ESTADOS WORKFLOW DE APROBACIÓN
  const [aprobadoPorId, setAprobadoPorId] = React.useState(
    defaultValues?.aprobadoPorId || null,
  );
  const [fechaAprobacion, setFechaAprobacion] = React.useState(
    defaultValues?.fechaAprobacion || null,
  );
  const [rechazadoPorId, setRechazadoPorId] = React.useState(
    defaultValues?.rechazadoPorId || null,
  );
  const [fechaRechazo, setFechaRechazo] = React.useState(
    defaultValues?.fechaRechazo || null,
  );
  const [motivoRechazo, setMotivoRechazo] = React.useState(
    defaultValues?.motivoRechazo || "",
  );

  // ESTADOS DE REVERSIÓN
  const [esReversion, setEsReversion] = React.useState(
    defaultValues?.esReversion || false,
  );
  const [movimientoRevertidoId, setMovimientoRevertidoId] = React.useState(
    defaultValues?.movimientoRevertidoId || null,
  );
  const [motivoReversion, setMotivoReversion] = React.useState(
    defaultValues?.motivoReversion || "",
  );

  // ESTADO DE INTEGRACIÓN CONTABLE
  const [asientosGenerados, setAsientosGenerados] = React.useState(
    defaultValues?.asientosGenerados || false,
  );

  React.useEffect(() => {

    setEmpresaOrigenId(
      defaultValues.empresaOrigenId
        ? Number(defaultValues.empresaOrigenId)
        : "",
    );
    setCuentaCorrienteOrigenId(
      defaultValues.cuentaCorrienteOrigenId
        ? Number(defaultValues.cuentaCorrienteOrigenId)
        : "",
    );
    setEmpresaDestinoId(
      defaultValues.empresaDestinoId
        ? Number(defaultValues.empresaDestinoId)
        : "",
    );
    setCuentaCorrienteDestinoId(
      defaultValues.cuentaCorrienteDestinoId
        ? Number(defaultValues.cuentaCorrienteDestinoId)
        : "",
    );
    setFechaOperacionMovCaja(
      defaultValues.fechaOperacionMovCaja
        ? new Date(defaultValues.fechaOperacionMovCaja)
        : new Date(),
    );
    setTipoMovimientoId(
      defaultValues.tipoMovimientoId
        ? Number(defaultValues.tipoMovimientoId)
        : "",
    );
    setEntidadComercialId(
      defaultValues.entidadComercialId
        ? Number(defaultValues.entidadComercialId)
        : "",
    );
    setMonto(defaultValues.monto ? Number(defaultValues.monto) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : "");
    setDescripcion(defaultValues.descripcion || "");
    setReferenciaExtId(defaultValues.referenciaExtId || "");
    setMedioPagoId(
      defaultValues.medioPagoId
        ? Number(defaultValues.medioPagoId)
        : "",
    );
    setUsuarioId(
      defaultValues.usuarioId ? Number(defaultValues.usuarioId) : "",
    );
    setEstadoId(
      defaultValues.estadoId
        ? Number(defaultValues.estadoId)
        : !isEdit
          ? 20
          : "",
    );
    setFechaCreacion(
      defaultValues.fechaCreacion
        ? new Date(defaultValues.fechaCreacion)
        : new Date(),
    );
    setFechaActualizacion(
      defaultValues.fechaActualizacion
        ? new Date(defaultValues.fechaActualizacion)
        : new Date(),
    );
    setCentroCostoId(
      defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : "",
    );
    setModuloOrigenMotivoOperacionId(
      defaultValues.moduloOrigenMotivoOperacionId
        ? Number(defaultValues.moduloOrigenMotivoOperacionId)
        : "",
    );
    setOrigenMotivoOperacionId(
      defaultValues.origenMotivoOperacionId
        ? Number(defaultValues.origenMotivoOperacionId)
        : "",
    );
    setFechaMotivoOperacion(
      defaultValues.fechaMotivoOperacion
        ? new Date(defaultValues.fechaMotivoOperacion)
        : null,
    );
    setUsuarioMotivoOperacionId(
      defaultValues.usuarioMotivoOperacionId
        ? Number(defaultValues.usuarioMotivoOperacionId)
        : "",
    );
    setOrigenReferenciaIngresoMovCajaId(
      defaultValues.origenReferenciaIngresoMovCajaId
        ? Number(defaultValues.origenReferenciaIngresoMovCajaId)
        : "",
    );
    setFechaOperacionMovCaja(
      defaultValues.fechaOperacionMovCaja
        ? new Date(defaultValues.fechaOperacionMovCaja)
        : new Date(),
    );
    setOperacionSinFactura(defaultValues.operacionSinFactura || false);
    setCuentaDestinoEntidadComercialId(
      defaultValues.cuentaDestinoEntidadComercialId
        ? Number(defaultValues.cuentaDestinoEntidadComercialId)
        : "",
    );
    setUrlComprobanteOperacionMovCaja(
      defaultValues.urlComprobanteOperacionMovCaja || "",
    );
    setUrlDocumentoMovCaja(defaultValues.urlDocumentoMovCaja || "");
    setValue(
      "urlComprobanteOperacionMovCaja",
      defaultValues.urlComprobanteOperacionMovCaja || "",
    );
    setValue("urlDocumentoMovCaja", defaultValues.urlDocumentoMovCaja || "");

    // CARGAR ESTADOS WORKFLOW
    setAprobadoPorId(defaultValues?.aprobadoPorId || null);
    setFechaAprobacion(defaultValues?.fechaAprobacion || null);
    setRechazadoPorId(defaultValues?.rechazadoPorId || null);
    setFechaRechazo(defaultValues?.fechaRechazo || null);
    setMotivoRechazo(defaultValues?.motivoRechazo || "");
    setEsReversion(defaultValues?.esReversion || false);
    setMovimientoRevertidoId(defaultValues?.movimientoRevertidoId || null);
    setMotivoReversion(defaultValues?.motivoReversion || "");
    setAsientosGenerados(defaultValues?.asientosGenerados || false);
  }, [defaultValues]);

  const cuentasOrigenFiltradasCalculadas = React.useMemo(() => {
    if (!empresaOrigenId) return [];
    return cuentasCorrientes.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(empresaOrigenId),
    );
  }, [cuentasCorrientes, empresaOrigenId]);

  const cuentasDestinoFiltradasCalculadas = React.useMemo(() => {
    if (!empresaDestinoId) return [];
    return cuentasCorrientes.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(empresaDestinoId),
    );
  }, [cuentasCorrientes, empresaDestinoId]);

  React.useEffect(() => {
    if (empresaOrigenId && cuentaCorrienteOrigenId) {
      const cuentaValida = cuentasOrigenFiltradasCalculadas.find(
        (cuenta) => Number(cuenta.id) === Number(cuentaCorrienteOrigenId),
      );
      if (!cuentaValida) setCuentaCorrienteOrigenId("");
    }
  }, [
    empresaOrigenId,
    cuentaCorrienteOrigenId,
    cuentasOrigenFiltradasCalculadas,
  ]);

  React.useEffect(() => {
    if (empresaDestinoId && cuentaCorrienteDestinoId) {
      const cuentaValida = cuentasDestinoFiltradasCalculadas.find(
        (cuenta) => Number(cuenta.id) === Number(cuentaCorrienteDestinoId),
      );
      if (!cuentaValida) setCuentaCorrienteDestinoId("");
    }
  }, [
    empresaDestinoId,
    cuentaCorrienteDestinoId,
    cuentasDestinoFiltradasCalculadas,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fechaActual = new Date();
    onSubmit({
      empresaOrigenId: empresaOrigenId ? Number(empresaOrigenId) : null,
      cuentaCorrienteOrigenId:
        cuentaCorrienteOrigenId && cuentaCorrienteOrigenId !== ""
          ? Number(cuentaCorrienteOrigenId)
          : null,
      empresaDestinoId: empresaDestinoId ? Number(empresaDestinoId) : null,
      cuentaCorrienteDestinoId: cuentaCorrienteDestinoId
        ? Number(cuentaCorrienteDestinoId)
        : null,
      tipoMovimientoId: tipoMovimientoId ? Number(tipoMovimientoId) : null,
      entidadComercialId: entidadComercialId
        ? Number(entidadComercialId)
        : null,
      monto,
      monedaId: monedaId ? Number(monedaId) : null,
      descripcion,
      referenciaExtId,
      medioPagoId: medioPagoId ? Number(medioPagoId) : null,
      usuarioId: usuarioId ? Number(usuarioId) : null,
      estadoId: estadoId ? Number(estadoId) : null,
      fechaCreacion: isEdit ? fechaCreacion : new Date(),
      fechaActualizacion: fechaActual,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      moduloOrigenMotivoOperacionId: moduloOrigenMotivoOperacionId
        ? Number(moduloOrigenMotivoOperacionId)
        : null,
      origenMotivoOperacionId: origenMotivoOperacionId
        ? Number(origenMotivoOperacionId)
        : null,
      fechaMotivoOperacion,
      usuarioMotivoOperacionId: usuarioMotivoOperacionId
        ? Number(usuarioMotivoOperacionId)
        : null,
      origenReferenciaIngresoMovCajaId: origenReferenciaIngresoMovCajaId
        ? Number(origenReferenciaIngresoMovCajaId)
        : null,
      fechaOperacionMovCaja: fechaOperacionMovCaja,
      operacionSinFactura,
      urlComprobanteOperacionMovCaja:
        getValues("urlComprobanteOperacionMovCaja") || null,
      urlDocumentoMovCaja: getValues("urlDocumentoMovCaja") || null,
      cuentaDestinoEntidadComercialId: cuentaDestinoEntidadComercialId
        ? Number(cuentaDestinoEntidadComercialId)
        : null,
      productoId: productoId ? Number(productoId) : null,
      // Nuevos campos de workflow y configuración contable/fiscal
      generarAsientoContable,
      incluirEnReporteFiscal,
      motivoSinFactura: motivoSinFactura || null,
      // Campos workflow de aprobación
      aprobadoPorId,
      fechaAprobacion,
      rechazadoPorId,
      fechaRechazo,
      motivoRechazo: motivoRechazo || null,
      // Campos de reversión
      esReversion,
      movimientoRevertidoId,
      motivoReversion: motivoReversion || null,
      // Integración contable
      asientosGenerados,
    });
  };

  // Función para validar que existan los PDFs antes de validar el movimiento
  const handleValidarMovimiento = () => {
    // Validar que exista el comprobante de operación
    if (!getValues("urlComprobanteOperacionMovCaja")) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación Requerida",
        detail: "Debe capturar el comprobante de la Operación en PDF",
        life: 4000,
      });
      // Cambiar a la card de comprobante para que el usuario lo capture
      setCardActiva("comprobante");
      return;
    }

    // Validar que exista el documento afecto
    if (!getValues("urlDocumentoMovCaja")) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación Requerida",
        detail: "Debe Capturar el Documento afecto a esta Operación",
        life: 4000,
      });
      // Cambiar a la card de documento para que el usuario lo capture
      setCardActiva("documento");
      return;
    }

    // Si ambos PDFs existen, proceder con la validación
    if (onValidarMovimiento) {
      onValidarMovimiento(defaultValues);
    }
  };

  const esPendiente =
    isEdit &&
    estadosMultiFuncion.find(
      (e) =>
        Number(e.id) === Number(defaultValues.estadoId) &&
        e.descripcion?.toUpperCase().includes("PENDIENTE"),
    );
  const esValidado =
    isEdit &&
    estadosMultiFuncion.find(
      (e) =>
        Number(e.id) === Number(defaultValues.estadoId) &&
        e.descripcion?.toUpperCase().includes("VALIDADO"),
    );

  return (
    <div>
      <Toast ref={toast} />

      {/* Card de Datos Generales */}
      <div style={{ display: cardActiva === "datos" ? "block" : "none" }}>
        <DatosGeneralesMovimientoCajaCard
          empresaOrigenId={empresaOrigenId}
          setEmpresaOrigenId={setEmpresaOrigenId}
          cuentaCorrienteOrigenId={cuentaCorrienteOrigenId}
          setCuentaCorrienteOrigenId={setCuentaCorrienteOrigenId}
          empresaDestinoId={empresaDestinoId}
          setEmpresaDestinoId={setEmpresaDestinoId}
          cuentaCorrienteDestinoId={cuentaCorrienteDestinoId}
          setCuentaCorrienteDestinoId={setCuentaCorrienteDestinoId}
          fechaOperacionMovCaja={fechaOperacionMovCaja}
          setFechaOperacionMovCaja={setFechaOperacionMovCaja}
          tipoMovimientoId={tipoMovimientoId}
          setTipoMovimientoId={setTipoMovimientoId}
          entidadComercialId={entidadComercialId}
          setEntidadComercialId={setEntidadComercialId}
          cuentaDestinoEntidadComercialId={cuentaDestinoEntidadComercialId}
          setCuentaDestinoEntidadComercialId={
            setCuentaDestinoEntidadComercialId
          }
          monto={monto}
          setMonto={setMonto}
          monedaId={monedaId}
          setMonedaId={setMonedaId}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          referenciaExtId={referenciaExtId}
          setReferenciaExtId={setReferenciaExtId}
          medioPagoId={medioPagoId}
          setMedioPagoId={setMedioPagoId}
          usuarioId={usuarioId}
          setUsuarioId={setUsuarioId}
          estadoId={estadoId}
          setEstadoId={setEstadoId}
          fechaCreacion={fechaCreacion}
          fechaActualizacion={fechaActualizacion}
          centroCostoId={centroCostoId}
          setCentroCostoId={setCentroCostoId}
          moduloOrigenMotivoOperacionId={moduloOrigenMotivoOperacionId}
          origenMotivoOperacionId={origenMotivoOperacionId}
          fechaMotivoOperacion={fechaMotivoOperacion}
          usuarioMotivoOperacionId={usuarioMotivoOperacionId}
          operacionSinFactura={operacionSinFactura}
          setOperacionSinFactura={setOperacionSinFactura}
          generarAsientoContable={generarAsientoContable}
          setGenerarAsientoContable={setGenerarAsientoContable}
          incluirEnReporteFiscal={incluirEnReporteFiscal}
          setIncluirEnReporteFiscal={setIncluirEnReporteFiscal}
          motivoSinFactura={motivoSinFactura}
          setMotivoSinFactura={setMotivoSinFactura}
          loading={loading}
          centrosCosto={centrosCosto}
          modulos={modulos}
          personal={personal}
          empresas={empresas}
          tipoMovEntregaRendir={tipoMovEntregaRendir}
          monedas={monedas}
          tipoReferenciaMovimientoCaja={tipoReferenciaMovimientoCaja}
          cuentasCorrientes={cuentasCorrientes}
          entidadesComerciales={entidadesComerciales}
          cuentasEntidadComercial={cuentasEntidadComercial}
          estadosMultiFuncion={estadosMultiFuncion}
          cuentasOrigenFiltradas={cuentasOrigenFiltradasCalculadas}
          cuentasDestinoFiltradas={cuentasDestinoFiltradasCalculadas}
          productos={productos}
          productoId={productoId}
          setProductoId={setProductoId}
          familiaFiltroId={familiaFiltroId}
          setFamiliaFiltroId={setFamiliaFiltroId}
          readOnly={readOnly}
        />
      </div>

      {/* Card de Comprobante de Operación */}
      <div style={{ display: cardActiva === "comprobante" ? "block" : "none" }}>
        <PdfComprobanteOperacionCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{}}
          movimientoId={defaultValues.id}
          readOnly={readOnly}
        />
      </div>

      {/* Card de Documento Afecto */}
      <div style={{ display: cardActiva === "documento" ? "block" : "none" }}>
        <PdfDocumentoAfectoOperacionCard
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{}}
          movimientoId={defaultValues.id}
          readOnly={readOnly}
        />
      </div>

      {/* Card de Detalles Generados */}
      <div style={{ display: cardActiva === "detalles" ? "block" : "none" }}>
        <DetallesGeneradosCard
          movimientoId={defaultValues.id}
          refreshTrigger={defaultValues.fechaActualizacion}
          readOnly={readOnly}
        />
      </div>

      {/* Card de Asiento Contable */}
      {isEdit && (
        <div style={{ display: cardActiva === "asiento" ? "block" : "none" }}>
          <CardAsientoContable
            asientoContableId={defaultValues?.asientoContableId}
            onGenerarAsiento={() => onGenerarAsiento(defaultValues)}
            disabled={loading}
            loading={loading}
            tituloCard="Asiento Contable"
          />
        </div>
      )}

      {/* Botones de navegación y acciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "0.5rem",
          alignItems: "center",
          marginTop: "0.5rem",
          justifyContent: "space-between",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        {/* Grupo de botones de navegación - Izquierda */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            icon="pi pi-file-edit"
            className={
              cardActiva === "datos" ? "p-button-primary" : "p-button-outlined"
            }
            onClick={() => setCardActiva("datos")}
            size="small"
            tooltip="Datos Generales"
            raised
          />
          <Button
            icon="pi pi-receipt"
            className={
              cardActiva === "comprobante"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("comprobante")}
            size="small"
            tooltip="Comprobante Operación"
            raised
          />
          <Button
            icon="pi pi-file-pdf"
            className={
              cardActiva === "documento"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("documento")}
            size="small"
            tooltip="Documento Afecto"
            raised
          />
          <Button
            icon="pi pi-list"
            className={
              cardActiva === "detalles"
                ? "p-button-primary"
                : "p-button-outlined"
            }
            onClick={() => setCardActiva("detalles")}
            size="small"
            tooltip="Detalles Generados"
            raised
          />
          {isEdit && (
            <Button
              icon="pi pi-book"
              className={
                cardActiva === "asiento"
                  ? "p-button-primary"
                  : "p-button-outlined"
              }
              onClick={() => setCardActiva("asiento")}
              size="small"
              tooltip="Asiento Contable"
              raised
            />
          )}
        </div>

        {/* Grupo de botones de acción - Centro/Derecha */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button
            type="button"
            label="Validar Movimiento"
            icon="pi pi-check-circle"
            onClick={handleValidarMovimiento}
            disabled={!esPendiente || !permisos.puedeEditar || readOnly || loading}
            tooltip={
              !esPendiente
                ? "Solo se puede validar movimientos en estado PENDIENTE"
                : !permisos.puedeEditar
                  ? "No tiene permisos para validar"
                  : readOnly
                    ? "Modo solo lectura"
                    : "Validar movimiento"
            }
            tooltipOptions={{ position: 'top' }}
            className="p-button-warning"
            severity="warning"
            raised
            outlined
            size="small"
          />
          <Button
            type="button"
            label="Cancelar"
            onClick={onCancel}
            disabled={loading}
            className="p-button-warning"
            severity="warning"
            raised
            size="small"
          />
          <Button
            type="button"
            label={isEdit ? "Actualizar" : "Crear"}
            icon="pi pi-save"
            loading={loading}
            onClick={handleSubmit}
            disabled={readOnly || !permisos.puedeEditar}
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEditar
                  ? "No tiene permisos para editar"
                  : ""
            }
            tooltipOptions={{ position: 'top' }}
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default MovimientoCajaForm;