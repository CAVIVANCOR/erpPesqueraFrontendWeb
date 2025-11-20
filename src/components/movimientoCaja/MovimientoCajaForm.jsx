// src/components/movimientoCaja/MovimientoCajaForm.jsx
// Formulario profesional para MovimientoCaja con navegación por Cards
import React, { useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DatosGeneralesMovimientoCajaCard from "./DatosGeneralesMovimientoCajaCard";
import PdfComprobanteOperacionCard from "./PdfComprobanteOperacionCard";
import PdfDocumentoAfectoOperacionCard from "./PdfDocumentoAfectoOperacionCard";

export default function MovimientoCajaForm({
  isEdit,
  defaultValues,
  onSubmit,
  onCancel,
  onValidarMovimiento,
  onGenerarAsiento,
  loading,
  centrosCosto = [],
  modulos = [],
  personal = [],
  empresas = [],
  tipoMovEntregaRendir = [],
  monedas = [],
  tipoReferenciaMovimientoCaja = [],
  cuentasCorrientes = [],
  entidadesComerciales = [],
  cuentasEntidadComercial = [],
  estadosMultiFuncion = [],
  productos = [],
}) {
  const toast = useRef(null);
  
  // Estado para navegación de cards
  const [cardActiva, setCardActiva] = React.useState("datos"); // "datos" | "comprobante" | "documento"
  
  // Estado para filtro de familia de productos
  const [familiaFiltroId, setFamiliaFiltroId] = React.useState(null);

  // Estados del formulario
  const [empresaOrigenId, setEmpresaOrigenId] = React.useState(
    defaultValues.empresaOrigenId ? Number(defaultValues.empresaOrigenId) : ""
  );
  const [cuentaCorrienteOrigenId, setCuentaCorrienteOrigenId] = React.useState(
    defaultValues.cuentaCorrienteOrigenId
      ? Number(defaultValues.cuentaCorrienteOrigenId)
      : ""
  );
  const [empresaDestinoId, setEmpresaDestinoId] = React.useState(
    defaultValues.empresaDestinoId ? Number(defaultValues.empresaDestinoId) : ""
  );
  const [cuentaCorrienteDestinoId, setCuentaCorrienteDestinoId] =
    React.useState(
      defaultValues.cuentaCorrienteDestinoId
        ? Number(defaultValues.cuentaCorrienteDestinoId)
        : ""
    );
  const [fecha, setFecha] = React.useState(
    defaultValues.fecha ? new Date(defaultValues.fecha) : new Date()
  );
  const [tipoMovimientoId, setTipoMovimientoId] = React.useState(
    defaultValues.tipoMovimientoId ? Number(defaultValues.tipoMovimientoId) : ""
  );
  const [entidadComercialId, setEntidadComercialId] = React.useState(
    defaultValues.entidadComercialId
      ? Number(defaultValues.entidadComercialId)
      : ""
  );
  const [monto, setMonto] = React.useState(
    defaultValues.monto ? Number(defaultValues.monto) : 0
  );
  const [monedaId, setMonedaId] = React.useState(
    defaultValues.monedaId ? Number(defaultValues.monedaId) : ""
  );
  const [descripcion, setDescripcion] = React.useState(
    defaultValues.descripcion || ""
  );
  const [referenciaExtId, setReferenciaExtId] = React.useState(
    defaultValues.referenciaExtId || ""
  );
  const [tipoReferenciaId, setTipoReferenciaId] = React.useState(
    defaultValues.tipoReferenciaId ? Number(defaultValues.tipoReferenciaId) : ""
  );
  const [usuarioId, setUsuarioId] = React.useState(
    defaultValues.usuarioId ? Number(defaultValues.usuarioId) : ""
  );
  const [estadoId, setEstadoId] = React.useState(
    defaultValues.estadoId ? Number(defaultValues.estadoId) : ""
  );
  const [fechaCreacion, setFechaCreacion] = React.useState(
    defaultValues.fechaCreacion
      ? new Date(defaultValues.fechaCreacion)
      : new Date()
  );
  const [fechaActualizacion, setFechaActualizacion] = React.useState(
    defaultValues.fechaActualizacion
      ? new Date(defaultValues.fechaActualizacion)
      : new Date()
  );
  const [centroCostoId, setCentroCostoId] = React.useState(
    defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : ""
  );
  const [moduloOrigenMotivoOperacionId, setModuloOrigenMotivoOperacionId] =
    React.useState(
      defaultValues.moduloOrigenMovCajaId
        ? Number(defaultValues.moduloOrigenMovCajaId)
        : defaultValues.moduloOrigenMotivoOperacionId
        ? Number(defaultValues.moduloOrigenMotivoOperacionId)
        : ""
    );
  const [origenMotivoOperacionId, setOrigenMotivoOperacionId] = React.useState(
    defaultValues.origenMotivoOperacionId
      ? Number(defaultValues.origenMotivoOperacionId)
      : ""
  );
  const [fechaMotivoOperacion, setFechaMotivoOperacion] = React.useState(
    defaultValues.fechaMotivoOperacion
      ? new Date(defaultValues.fechaMotivoOperacion)
      : null
  );
  const [usuarioMotivoOperacionId, setUsuarioMotivoOperacionId] =
    React.useState(
      defaultValues.usuarioMotivoOperacionId
        ? Number(defaultValues.usuarioMotivoOperacionId)
        : ""
    );
  const [fechaOperacionMovCaja, setFechaOperacionMovCaja] = React.useState(
    defaultValues.fechaOperacionMovCaja
      ? new Date(defaultValues.fechaOperacionMovCaja)
      : new Date()
  );
  const [operacionSinFactura, setOperacionSinFactura] = React.useState(
    defaultValues.operacionSinFactura || false
  );
  const [cuentaDestinoEntidadComercialId, setCuentaDestinoEntidadComercialId] = React.useState(
    defaultValues.cuentaDestinoEntidadComercialId
      ? Number(defaultValues.cuentaDestinoEntidadComercialId)
      : ""
  );
  const [productoId, setProductoId] = React.useState(
    defaultValues.productoId ? Number(defaultValues.productoId) : ""
  );

  // NUEVOS ESTADOS PARA PDFs
  const [urlComprobanteOperacionMovCaja, setUrlComprobanteOperacionMovCaja] =
    React.useState(defaultValues.urlComprobanteOperacionMovCaja || "");
  const [urlDocumentoMovCaja, setUrlDocumentoMovCaja] = React.useState(
    defaultValues.urlDocumentoMovCaja || ""
  );

  React.useEffect(() => {
    setEmpresaOrigenId(
      defaultValues.empresaOrigenId ? Number(defaultValues.empresaOrigenId) : ""
    );
    setCuentaCorrienteOrigenId(
      defaultValues.cuentaCorrienteOrigenId
        ? Number(defaultValues.cuentaCorrienteOrigenId)
        : ""
    );
    setEmpresaDestinoId(
      defaultValues.empresaDestinoId
        ? Number(defaultValues.empresaDestinoId)
        : ""
    );
    setCuentaCorrienteDestinoId(
      defaultValues.cuentaCorrienteDestinoId
        ? Number(defaultValues.cuentaCorrienteDestinoId)
        : ""
    );
    setFecha(defaultValues.fecha ? new Date(defaultValues.fecha) : new Date());
    setTipoMovimientoId(
      defaultValues.tipoMovimientoId
        ? Number(defaultValues.tipoMovimientoId)
        : ""
    );
    setEntidadComercialId(
      defaultValues.entidadComercialId
        ? Number(defaultValues.entidadComercialId)
        : ""
    );
    setMonto(defaultValues.monto ? Number(defaultValues.monto) : 0);
    setMonedaId(defaultValues.monedaId ? Number(defaultValues.monedaId) : "");
    setDescripcion(defaultValues.descripcion || "");
    setReferenciaExtId(defaultValues.referenciaExtId || "");
    setTipoReferenciaId(
      defaultValues.tipoReferenciaId
        ? Number(defaultValues.tipoReferenciaId)
        : ""
    );
    setUsuarioId(
      defaultValues.usuarioId ? Number(defaultValues.usuarioId) : ""
    );
    setEstadoId(defaultValues.estadoId ? Number(defaultValues.estadoId) : "");
    setFechaCreacion(
      defaultValues.fechaCreacion
        ? new Date(defaultValues.fechaCreacion)
        : new Date()
    );
    setFechaActualizacion(
      defaultValues.fechaActualizacion
        ? new Date(defaultValues.fechaActualizacion)
        : new Date()
    );
    setCentroCostoId(
      defaultValues.centroCostoId ? Number(defaultValues.centroCostoId) : ""
    );
    setModuloOrigenMotivoOperacionId(
      defaultValues.moduloOrigenMotivoOperacionId
        ? Number(defaultValues.moduloOrigenMotivoOperacionId)
        : ""
    );
    setOrigenMotivoOperacionId(
      defaultValues.origenMotivoOperacionId
        ? Number(defaultValues.origenMotivoOperacionId)
        : ""
    );
    setFechaMotivoOperacion(
      defaultValues.fechaMotivoOperacion
        ? new Date(defaultValues.fechaMotivoOperacion)
        : null
    );
    setUsuarioMotivoOperacionId(
      defaultValues.usuarioMotivoOperacionId
        ? Number(defaultValues.usuarioMotivoOperacionId)
        : ""
    );
    setFechaOperacionMovCaja(
      defaultValues.fechaOperacionMovCaja
        ? new Date(defaultValues.fechaOperacionMovCaja)
        : new Date()
    );
    setOperacionSinFactura(defaultValues.operacionSinFactura || false);
    setCuentaDestinoEntidadComercialId(
      defaultValues.cuentaDestinoEntidadComercialId
        ? Number(defaultValues.cuentaDestinoEntidadComercialId)
        : ""
    );
    setUrlComprobanteOperacionMovCaja(
      defaultValues.urlComprobanteOperacionMovCaja || ""
    );
    setUrlDocumentoMovCaja(defaultValues.urlDocumentoMovCaja || "");
  }, [defaultValues]);

  const cuentasOrigenFiltradas = React.useMemo(() => {
    if (!empresaOrigenId) return [];
    return cuentasCorrientes.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(empresaOrigenId)
    );
  }, [cuentasCorrientes, empresaOrigenId]);

  const cuentasDestinoFiltradas = React.useMemo(() => {
    if (!empresaDestinoId) return [];
    return cuentasCorrientes.filter(
      (cuenta) => Number(cuenta.empresaId) === Number(empresaDestinoId)
    );
  }, [cuentasCorrientes, empresaDestinoId]);

  React.useEffect(() => {
    if (empresaOrigenId && cuentaCorrienteOrigenId) {
      const cuentaValida = cuentasOrigenFiltradas.find(
        (cuenta) => Number(cuenta.id) === Number(cuentaCorrienteOrigenId)
      );
      if (!cuentaValida) setCuentaCorrienteOrigenId("");
    }
  }, [empresaOrigenId, cuentaCorrienteOrigenId, cuentasOrigenFiltradas]);

  React.useEffect(() => {
    if (empresaDestinoId && cuentaCorrienteDestinoId) {
      const cuentaValida = cuentasDestinoFiltradas.find(
        (cuenta) => Number(cuenta.id) === Number(cuentaCorrienteDestinoId)
      );
      if (!cuentaValida) setCuentaCorrienteDestinoId("");
    }
  }, [empresaDestinoId, cuentaCorrienteDestinoId, cuentasDestinoFiltradas]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fechaActual = new Date();
    onSubmit({
      empresaOrigenId: empresaOrigenId ? Number(empresaOrigenId) : null,
      cuentaCorrienteOrigenId: cuentaCorrienteOrigenId
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
      tipoReferenciaId: tipoReferenciaId ? Number(tipoReferenciaId) : null,
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
      fechaOperacionMovCaja: new Date(),
      operacionSinFactura,
      urlComprobanteOperacionMovCaja: urlComprobanteOperacionMovCaja || null,
      urlDocumentoMovCaja: urlDocumentoMovCaja || null,
      cuentaDestinoEntidadComercialId: cuentaDestinoEntidadComercialId
        ? Number(cuentaDestinoEntidadComercialId)
        : null,
      productoId: productoId ? Number(productoId) : null,
    });
  };

  // Función para validar que existan los PDFs antes de validar el movimiento
  const handleValidarMovimiento = () => {
    // Validar que exista el comprobante de operación
    if (!urlComprobanteOperacionMovCaja) {
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
    if (!urlDocumentoMovCaja) {
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
        e.descripcion?.toUpperCase().includes("PENDIENTE")
    );
  const esValidado =
    isEdit &&
    estadosMultiFuncion.find(
      (e) =>
        Number(e.id) === Number(defaultValues.estadoId) &&
        e.descripcion?.toUpperCase().includes("VALIDADO")
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
          fecha={fecha}
          setFecha={setFecha}
          tipoMovimientoId={tipoMovimientoId}
          setTipoMovimientoId={setTipoMovimientoId}
          entidadComercialId={entidadComercialId}
          setEntidadComercialId={setEntidadComercialId}
          cuentaDestinoEntidadComercialId={cuentaDestinoEntidadComercialId}
          setCuentaDestinoEntidadComercialId={setCuentaDestinoEntidadComercialId}
          monto={monto}
          setMonto={setMonto}
          monedaId={monedaId}
          setMonedaId={setMonedaId}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          referenciaExtId={referenciaExtId}
          setReferenciaExtId={setReferenciaExtId}
          tipoReferenciaId={tipoReferenciaId}
          setTipoReferenciaId={setTipoReferenciaId}
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
          cuentasOrigenFiltradas={cuentasOrigenFiltradas}
          cuentasDestinoFiltradas={cuentasDestinoFiltradas}
          productos={productos}
          productoId={productoId}
          setProductoId={setProductoId}
          familiaFiltroId={familiaFiltroId}
          setFamiliaFiltroId={setFamiliaFiltroId}
        />
      </div>

      {/* Card de Comprobante de Operación */}
      <div style={{ display: cardActiva === "comprobante" ? "block" : "none" }}>
        <PdfComprobanteOperacionCard
          urlComprobanteOperacionMovCaja={urlComprobanteOperacionMovCaja}
          setUrlComprobanteOperacionMovCaja={setUrlComprobanteOperacionMovCaja}
          toast={toast}
          movimientoId={defaultValues.id}
        />
      </div>

      {/* Card de Documento Afecto */}
      <div style={{ display: cardActiva === "documento" ? "block" : "none" }}>
        <PdfDocumentoAfectoOperacionCard
          urlDocumentoMovCaja={urlDocumentoMovCaja}
          setUrlDocumentoMovCaja={setUrlDocumentoMovCaja}
          toast={toast}
          movimientoId={defaultValues.id}
        />
      </div>

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
        </div>

        {/* Grupo de botones de acción - Centro/Derecha */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {esPendiente && (
            <Button
              type="button"
              label="Validar Movimiento"
              icon="pi pi-check-circle"
              onClick={handleValidarMovimiento}
              disabled={loading}
              className="p-button-warning"
              severity="warning"
              raised
              outlined
              size="small"
            />
          )}
          {esValidado && (
            <Button
              type="button"
              label="Generar Asiento Contable"
              icon="pi pi-file-edit"
              onClick={() =>
                onGenerarAsiento && onGenerarAsiento(defaultValues)
              }
              disabled={loading}
              className="p-button-info"
              severity="info"
              raised
              outlined
              size="small"
            />
          )}
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
            className="p-button-success"
            severity="success"
            raised
            size="small"
          />
        </div>
      </div>
    </div>
  );
}