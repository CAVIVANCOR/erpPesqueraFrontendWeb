// src/components/ordenCompra/OrdenCompraForm.jsx
import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import DatosGeneralesTab from "./DatosGeneralesTab";
import DatosAdicionalesTab from "./DatosAdicionalesTab";
import VerImpresionOrdenCompraPDF from "./VerImpresionOrdenCompraPDF";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { consultarTipoCambioSunat } from "../../api/consultaExterna";
import { obtenerDireccionesPorEntidad } from "../../api/direccionEntidad";
import { obtenerContactosPorEntidad } from "../../api/contactoEntidad";

export default function OrdenCompraForm({
  isEdit,
  defaultValues,
  empresas,
  proveedores,
  formasPago,
  productos,
  personalOptions,
  requerimientos,
  monedas,
  centrosCosto,
  unidadesNegocio = [],
  tiposDocumento,
  seriesDoc,
  estadosOrden,
  empresaFija,
  onSubmit,
  onCancel,
  onAprobar,
  onAnular,
  onGenerarKardex,
  onGenerarDesdeRequerimiento,
  onIrAlOrigen,
  onIrAMovimientoAlmacen,
  loading,
  toast,
  permisos = {},
  readOnly = false,
  onRecargarRegistro,
}) {
  const { usuario } = useAuthStore();

  const [empresaId, setEmpresaId] = useState(
    defaultValues?.empresaId || empresaFija || null,
  );
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    defaultValues?.tipoDocumentoId || 17,
  );
  const [serieDocId, setSerieDocId] = useState(
    defaultValues?.serieDocId || null,
  );
  const [numSerieDoc, setNumSerieDoc] = useState(
    defaultValues?.numSerieDoc || "",
  );
  const [numCorreDoc, setNumCorreDoc] = useState(
    defaultValues?.numCorreDoc || "",
  );
  const [numeroDocumento, setNumeroDocumento] = useState(
    defaultValues?.numeroDocumento || "",
  );
  const [fechaDocumento, setFechaDocumento] = useState(
    defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
  );
  const [requerimientoCompraId, setRequerimientoCompraId] = useState(
    defaultValues?.requerimientoCompraId || null,
  );
  const [proveedorId, setProveedorId] = useState(
    defaultValues?.proveedorId || null,
  );
  const [formaPagoId, setFormaPagoId] = useState(
    defaultValues?.formaPagoId || null,
  );
  const [monedaId, setMonedaId] = useState(defaultValues?.monedaId || null);
  const [tipoCambio, setTipoCambio] = useState(
    defaultValues?.tipoCambio || null,
  );
  const [fechaEntrega, setFechaEntrega] = useState(
    defaultValues?.fechaEntrega ? new Date(defaultValues.fechaEntrega) : null,
  );
  const [fechaRecepcion, setFechaRecepcion] = useState(
    defaultValues?.fechaRecepcion
      ? new Date(defaultValues.fechaRecepcion)
      : null,
  );
  const [solicitanteId, setSolicitanteId] = useState(
    defaultValues?.solicitanteId || null,
  );
  const [aprobadoPorId, setAprobadoPorId] = useState(
    defaultValues?.aprobadoPorId || null,
  );
  const [estadoId, setEstadoId] = useState(
    defaultValues?.estadoId ? Number(defaultValues.estadoId) : null,
  );
  const [centroCostoId, setCentroCostoId] = useState(
    defaultValues?.centroCostoId || null,
  );
  const [unidadNegocioId, setUnidadNegocioId] = useState(
    defaultValues?.unidadNegocioId || null,
  );
  const [movIngresoAlmacenId, setMovIngresoAlmacenId] = useState(
    defaultValues?.movIngresoAlmacenId || null,
  );
  const [observaciones, setObservaciones] = useState(
    defaultValues?.observaciones || "",
  );
  const [porcentajeIGV, setPorcentajeIGV] = useState(
    defaultValues?.porcentajeIGV || null,
  );
  const [esExoneradoAlIGV, setEsExoneradoAlIGV] = useState(
    defaultValues?.esExoneradoAlIGV || false,
  );
  const [direccionRecepcionAlmacenId, setDireccionRecepcionAlmacenId] =
    useState(defaultValues?.direccionRecepcionAlmacenId || null);
  const [contactoProveedorId, setContactoProveedorId] = useState(
    defaultValues?.contactoProveedorId || null,
  );
  const [facturado, setFacturado] = useState(defaultValues?.facturado || false);
  const [fechaFacturacion, setFechaFacturacion] = useState(
    defaultValues?.fechaFacturacion
      ? new Date(defaultValues.fechaFacturacion)
      : null,
  );
  const [esGerencial, setEsGerencial] = useState(
    defaultValues?.esGerencial || false,
  );
  const [ordenCompraOrigenId, setOrdenCompraOrigenId] = useState(
    defaultValues?.ordenCompraOrigenId || null,
  );
  const [esParticionada, setEsParticionada] = useState(
    defaultValues?.esParticionada || false,
  );
  const [direccionesEmpresa, setDireccionesEmpresa] = useState([]);
  const [contactosProveedor, setContactosProveedor] = useState([]);

  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [detallesCount, setDetallesCount] = useState(0);
  const [datosAdicionalesCount, setDatosAdicionalesCount] = useState(0);
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });
  const [fechaDocumentoInicial, setFechaDocumentoInicial] = useState(null);

  useEffect(() => {
    if (proveedores && proveedores.length > 0 && empresaId) {
      const proveedoresPorEmpresa = proveedores.filter(
        (p) => Number(p.empresaId) === Number(empresaId),
      );
      setProveedoresFiltrados(proveedoresPorEmpresa);
    } else {
      setProveedoresFiltrados([]);
    }
  }, [proveedores, empresaId]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      setEmpresaId(
        defaultValues.empresaId
          ? Number(defaultValues.empresaId)
          : empresaFija
            ? Number(empresaFija)
            : null,
      );
      setTipoDocumentoId(
        defaultValues.tipoDocumentoId
          ? Number(defaultValues.tipoDocumentoId)
          : 17,
      );
      setSerieDocId(
        defaultValues.serieDocId ? Number(defaultValues.serieDocId) : null,
      );
      setNumSerieDoc(defaultValues.numSerieDoc || "");
      setNumCorreDoc(defaultValues.numCorreDoc || "");
      setNumeroDocumento(defaultValues.numeroDocumento || "");
      setFechaDocumento(
        defaultValues.fechaDocumento
          ? new Date(defaultValues.fechaDocumento)
          : new Date(),
      );
      setRequerimientoCompraId(
        defaultValues.requerimientoCompraId
          ? Number(defaultValues.requerimientoCompraId)
          : null,
      );
      setProveedorId(
        defaultValues.proveedorId ? Number(defaultValues.proveedorId) : null,
      );
      setFormaPagoId(
        defaultValues.formaPagoId ? Number(defaultValues.formaPagoId) : null,
      );
      setMonedaId(
        defaultValues.monedaId ? Number(defaultValues.monedaId) : null,
      );
      setTipoCambio(defaultValues.tipoCambio || null);
      setFechaEntrega(
        defaultValues.fechaEntrega
          ? new Date(defaultValues.fechaEntrega)
          : null,
      );
      setFechaRecepcion(
        defaultValues.fechaRecepcion
          ? new Date(defaultValues.fechaRecepcion)
          : null,
      );
      setSolicitanteId(
        defaultValues.solicitanteId
          ? Number(defaultValues.solicitanteId)
          : null,
      );
      setAprobadoPorId(
        defaultValues.aprobadoPorId
          ? Number(defaultValues.aprobadoPorId)
          : null,
      );
      setEstadoId(
        defaultValues.estadoId ? Number(defaultValues.estadoId) : null,
      );
      setCentroCostoId(
        defaultValues.centroCostoId
          ? Number(defaultValues.centroCostoId)
          : null,
      );
      setUnidadNegocioId(
        defaultValues.unidadNegocioId
          ? Number(defaultValues.unidadNegocioId)
          : null,
      );
      setMovIngresoAlmacenId(
        defaultValues.movIngresoAlmacenId
          ? Number(defaultValues.movIngresoAlmacenId)
          : null,
      );
      setObservaciones(defaultValues.observaciones || "");
      setPorcentajeIGV(defaultValues.porcentajeIGV || null);
      setEsExoneradoAlIGV(defaultValues.esExoneradoAlIGV || false);
      setDireccionRecepcionAlmacenId(
        defaultValues.direccionRecepcionAlmacenId
          ? Number(defaultValues.direccionRecepcionAlmacenId)
          : null,
      );
      setContactoProveedorId(
        defaultValues.contactoProveedorId
          ? Number(defaultValues.contactoProveedorId)
          : null,
      );
      setFacturado(defaultValues.facturado || false);
      setFechaFacturacion(
        defaultValues.fechaFacturacion
          ? new Date(defaultValues.fechaFacturacion)
          : null,
      );
      setEsGerencial(defaultValues.esGerencial || false);
      setOrdenCompraOrigenId(
        defaultValues.ordenCompraOrigenId
          ? Number(defaultValues.ordenCompraOrigenId)
          : null,
      );
      setEsParticionada(defaultValues.esParticionada || false);
    }
  }, [defaultValues, empresaFija]);

  useEffect(() => {
    if (!isEdit && usuario?.personalId && !solicitanteId) {
      setSolicitanteId(Number(usuario.personalId));

      if (toast?.current) {
        setTimeout(() => {
          toast.current.show({
            severity: "info",
            summary: "Solicitante Asignado",
            detail:
              "Se ha asignado automáticamente como solicitante de la orden",
            life: 3000,
          });
        }, 500);
      }
    }
  }, [isEdit, usuario?.personalId, toast]);

  useEffect(() => {
    if (fechaDocumento && fechaDocumentoInicial === null) {
      setFechaDocumentoInicial(fechaDocumento);
    }
  }, [fechaDocumento, fechaDocumentoInicial]);

  useEffect(() => {
    const cargarTipoCambio = async () => {
      if (!fechaDocumento || fechaDocumentoInicial === null) return;

      const fechaActualISO = new Date(fechaDocumento).toISOString();
      const fechaInicialISO = new Date(fechaDocumentoInicial).toISOString();

      if (fechaActualISO === fechaInicialISO) return;

      try {
        const fecha = new Date(fechaDocumento);
        const fechaISO = fecha.toISOString().split("T")[0];
        const tipoCambioData = await consultarTipoCambioSunat({
          date: fechaISO,
        });

        if (tipoCambioData && tipoCambioData.sell_price) {
          const tipoCambioVenta = parseFloat(tipoCambioData.sell_price);
          setTipoCambio(tipoCambioVenta.toFixed(3));
          setFechaDocumentoInicial(fechaDocumento);

          toast?.current?.show({
            severity: "success",
            summary: "Tipo de Cambio Actualizado",
            detail: `Tipo de cambio SUNAT: S/ ${tipoCambioVenta.toFixed(
              3,
            )} por USD`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error al cargar tipo de cambio SUNAT:", error);
      }
    };

    cargarTipoCambio();
  }, [fechaDocumento, fechaDocumentoInicial]);

  useEffect(() => {
    const calcularTotales = async () => {
      if (!defaultValues?.id || !isEdit) return;

      try {
        const { getDetallesOrdenCompra } =
          await import("../../api/detalleOrdenCompra");
        const detalles = await getDetallesOrdenCompra(defaultValues.id);

        const subtotalCalc = detalles.reduce(
          (sum, det) => sum + (Number(det.subtotal) || 0),
          0,
        );
        const igvCalc = esExoneradoAlIGV
          ? 0
          : subtotalCalc * (Number(porcentajeIGV) / 100);
        const totalCalc = subtotalCalc + igvCalc;

        setTotales({ subtotal: subtotalCalc, igv: igvCalc, total: totalCalc });
      } catch (err) {
        console.error("Error al calcular totales:", err);
      }
    };

    calcularTotales();
  }, [
    detallesCount,
    porcentajeIGV,
    esExoneradoAlIGV,
    isEdit,
    defaultValues?.id,
  ]);

  useEffect(() => {
    const cargarDireccionesEmpresa = async () => {
      if (empresaId) {
        try {
          const empresa = empresas.find(
            (e) => Number(e.id) === Number(empresaId),
          );
          if (empresa && empresa.entidadComercialId) {
            const direcciones = await obtenerDireccionesPorEntidad(
              Number(empresa.entidadComercialId),
            );
            setDireccionesEmpresa(direcciones || []);
          }
        } catch (error) {
          console.error("Error al cargar direcciones de empresa:", error);
          setDireccionesEmpresa([]);
        }
      } else {
        setDireccionesEmpresa([]);
      }
    };

    cargarDireccionesEmpresa();
  }, [empresaId, empresas]);

  useEffect(() => {
    const cargarContactosProveedor = async () => {
      if (proveedorId) {
        try {
          const contactos = await obtenerContactosPorEntidad(
            Number(proveedorId),
          );
          setContactosProveedor(contactos || []);
        } catch (error) {
          console.error("Error al cargar contactos de proveedor:", error);
          setContactosProveedor([]);
        }
      } else {
        setContactosProveedor([]);
      }
    };

    cargarContactosProveedor();
  }, [proveedorId]);

  const handleSerieChange = (serieId) => {
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const correlativoActual = Number(serie.correlativo);
        const proximoCorrelativo = correlativoActual + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0",
        );

        setSerieDocId(serieId);
        setNumSerieDoc(numSerie);
        setNumCorreDoc(`PRÓXIMO: ${proximoCorrelativo}`);
        setNumeroDocumento("Se generará al guardar");
      }
    } else {
      setSerieDocId(null);
      setNumSerieDoc("");
      setNumCorreDoc("");
      setNumeroDocumento("");
    }
  };

  const handleChange = (field, value) => {
    const setters = {
      empresaId: setEmpresaId,
      tipoDocumentoId: setTipoDocumentoId,
      serieDocId: setSerieDocId,
      numSerieDoc: setNumSerieDoc,
      numCorreDoc: setNumCorreDoc,
      numeroDocumento: setNumeroDocumento,
      fechaDocumento: setFechaDocumento,
      requerimientoCompraId: setRequerimientoCompraId,
      proveedorId: setProveedorId,
      formaPagoId: setFormaPagoId,
      monedaId: setMonedaId,
      tipoCambio: setTipoCambio,
      fechaEntrega: setFechaEntrega,
      fechaRecepcion: setFechaRecepcion,
      solicitanteId: setSolicitanteId,
      aprobadoPorId: setAprobadoPorId,
      estadoId: setEstadoId,
      centroCostoId: setCentroCostoId,
      unidadNegocioId: setUnidadNegocioId,
      movIngresoAlmacenId: setMovIngresoAlmacenId,
      observaciones: setObservaciones,
      porcentajeIGV: setPorcentajeIGV,
      esExoneradoAlIGV: setEsExoneradoAlIGV,
      facturado: setFacturado,
      fechaFacturacion: setFechaFacturacion,
      esGerencial: setEsGerencial,
      ordenCompraOrigenId: setOrdenCompraOrigenId,
      esParticionada: setEsParticionada,
    };

    const setter = setters[field];
    if (setter) {
      setter(value);
    }
  };

  const handleSubmit = () => {
    const data = {
      empresaId: empresaId ? Number(empresaId) : null,
      tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
      serieDocId: serieDocId ? Number(serieDocId) : null,
      numSerieDoc,
      numCorreDoc,
      numeroDocumento,
      fechaDocumento,
      requerimientoCompraId: requerimientoCompraId
        ? Number(requerimientoCompraId)
        : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
      formaPagoId: formaPagoId ? Number(formaPagoId) : null,
      monedaId: monedaId ? Number(monedaId) : null,
      tipoCambio,
      fechaEntrega,
      fechaRecepcion,
      solicitanteId: solicitanteId ? Number(solicitanteId) : null,
      aprobadoPorId: aprobadoPorId ? Number(aprobadoPorId) : null,
      estadoId: estadoId ? Number(estadoId) : null,
      centroCostoId: centroCostoId ? Number(centroCostoId) : null,
      unidadNegocioId: unidadNegocioId ? Number(unidadNegocioId) : null,
      movIngresoAlmacenId: movIngresoAlmacenId
        ? Number(movIngresoAlmacenId)
        : null,
      observaciones,
      porcentajeIGV,
      esExoneradoAlIGV,
      direccionRecepcionAlmacenId: direccionRecepcionAlmacenId
        ? Number(direccionRecepcionAlmacenId)
        : null,
      contactoProveedorId: contactoProveedorId
        ? Number(contactoProveedorId)
        : null,
      facturado: facturado || false,
      fechaFacturacion: fechaFacturacion,
      esGerencial: esGerencial || false,
      ordenCompraOrigenId: ordenCompraOrigenId
        ? Number(ordenCompraOrigenId)
        : null,
      esParticionada: esParticionada || false,
    };

    if (!data.empresaId || !data.proveedorId) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete los campos obligatorios (Empresa, Proveedor)",
      });
      return;
    }

    onSubmit(data);
  };

  const handleAprobarClick = () => {
    if (!defaultValues?.id) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe guardar la orden antes de aprobar",
      });
      return;
    }

    if (detallesCount === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un detalle antes de aprobar",
      });
      return;
    }

    onAprobar(defaultValues.id);
  };

  const handleAnularClick = () => {
    if (!defaultValues?.id) return;

    confirmDialog({
      message:
        "¿Está seguro de anular esta orden de compra? Esta acción eliminará el movimiento de almacén y el kardex asociado si existen.",
      header: "Confirmar Anulación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, anular",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => {
        onAnular(defaultValues.id);
      },
    });
  };

  const handleGenerarKardexClick = () => {
    if (!defaultValues?.id) return;

    if (detallesCount === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un detalle antes de generar el kardex",
      });
      return;
    }

    onGenerarKardex(defaultValues.id);
  };

  const handlePdfGenerated = (urlPdf) => {
    if (defaultValues) {
      defaultValues.urlOrdenCompraPdf = urlPdf;
    }
  };

  const formData = {
    empresaId,
    tipoDocumentoId,
    serieDocId,
    numSerieDoc,
    numCorreDoc,
    numeroDocumento,
    fechaDocumento,
    requerimientoCompraId,
    proveedorId,
    formaPagoId,
    monedaId,
    tipoCambio,
    fechaEntrega,
    fechaRecepcion,
    solicitanteId,
    aprobadoPorId,
    estadoId,
    centroCostoId,
    unidadNegocioId,
    movIngresoAlmacenId,
    observaciones,
    porcentajeIGV,
    esExoneradoAlIGV,
  };

  const estaPendiente = Number(estadoId) === 38 || !estadoId;
  const estaAprobado = Number(estadoId) === 39;
  const estaAnulado = Number(estadoId) === 40;
  const estaParticionada = Number(estadoId) === 50;
  const kardexGenerado = !!movIngresoAlmacenId;
  const puedeEditar = estaPendiente && !loading;
  const puedeEditarDatosAdicionales = !loading;

  const tiposDocumentoOptions = (tiposDocumento || []).map((t) => ({
    ...t,
    id: Number(t.id),
    label: t.descripcion || t.nombre,
    value: Number(t.id),
  }));

  const seriesDocOptions = (seriesDoc || []).map((s) => {
    const correlativoActual = Number(s.correlativo);
    return {
      ...s,
      id: Number(s.id),
      label: `${s.serie} (Correlativo: ${correlativoActual})`,
      value: Number(s.id),
    };
  });

  const estadosOrdenOptions = (estadosOrden || []).map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion || e.nombre,
    value: Number(e.id),
  }));

  const unidadesNegocioOptions = unidadesNegocio.map((unidad) => ({
    label: unidad.nombre,
    value: Number(unidad.id),
  }));

  return (
    <div className="p-fluid">
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        <TabPanel header="Datos Generales" leftIcon="pi pi-file">
          <DatosGeneralesTab
            formData={formData}
            onChange={handleChange}
            onSerieChange={handleSerieChange}
            empresas={empresas}
            proveedores={proveedoresFiltrados}
            formasPago={formasPago}
            personalOptions={personalOptions}
            monedas={monedas}
            centrosCosto={centrosCosto}
            unidadesNegocioOptions={unidadesNegocioOptions}
            tiposDocumentoOptions={tiposDocumentoOptions}
            seriesDocOptions={seriesDocOptions}
            estadosOrdenOptions={estadosOrdenOptions}
            isEdit={isEdit}
            puedeEditar={puedeEditar}
            detallesCount={detallesCount}
            ordenCompraId={defaultValues?.id}
            productos={productos}
            toast={toast}
            onCountChange={setDetallesCount}
            subtotal={totales.subtotal}
            totalIGV={totales.igv}
            total={totales.total}
            monedaOrden={defaultValues?.moneda}
            readOnly={readOnly}
            permisos={permisos}
            onIrAlOrigen={onIrAlOrigen}
            onIrAMovimientoAlmacen={onIrAMovimientoAlmacen}
            direccionRecepcionAlmacenId={direccionRecepcionAlmacenId}
            onDireccionRecepcionChange={setDireccionRecepcionAlmacenId}
            direccionesEmpresa={direccionesEmpresa}
            contactoProveedorId={contactoProveedorId}
            onContactoProveedorChange={setContactoProveedorId}
            contactosProveedor={contactosProveedor}
            facturado={facturado}
            onFacturadoChange={setFacturado}
            fechaFacturacion={fechaFacturacion}
            onFechaFacturacionChange={setFechaFacturacion}
            esGerencial={esGerencial}
            onEsGerencialChange={setEsGerencial}
            ordenCompraOrigenId={ordenCompraOrigenId}
            onOrdenCompraOrigenIdChange={setOrdenCompraOrigenId}
            esParticionada={esParticionada}
            onEsParticionadaChange={setEsParticionada}
          />
        </TabPanel>

        <TabPanel
          header={`Datos Adicionales ${
            datosAdicionalesCount > 0 ? `(${datosAdicionalesCount})` : ""
          }`}
          leftIcon="pi pi-paperclip"
          disabled={!isEdit}
        >
          <DatosAdicionalesTab
            ordenCompraId={defaultValues?.id}
            puedeEditar={puedeEditarDatosAdicionales}
            toast={toast}
            onCountChange={setDatosAdicionalesCount}
            readOnly={readOnly}
            permisos={permisos}
            estadoId={estadoId}
            onRecargarRegistro={onRecargarRegistro}
          />
        </TabPanel>

        <TabPanel
          header="Impresión PDF"
          leftIcon="pi pi-file-pdf"
          disabled={!isEdit}
        >
          <VerImpresionOrdenCompraPDF
            ordenCompraId={defaultValues?.id}
            datosOrdenCompra={defaultValues}
            toast={toast}
            personalOptions={personalOptions}
            onPdfGenerated={handlePdfGenerated}
            onRecargarRegistro={onRecargarRegistro}
          />
        </TabPanel>
      </TabView>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
        }}
      >
        <div style={{ flex: 1 }}>
          {isEdit && (
            <Button
              label="Aprobar"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleAprobarClick}
              disabled={
                readOnly ||
                loading ||
                !permisos.puedeEditar ||
                estaAprobado ||
                estaAnulado ||
                kardexGenerado
              }
              tooltip={
                estaAprobado
                  ? "La orden ya está aprobada"
                  : kardexGenerado
                    ? "La orden ya tiene kardex generado"
                    : estaAnulado
                      ? "No se puede aprobar una orden anulada"
                      : readOnly
                        ? "Modo solo lectura"
                        : !permisos.puedeEditar
                          ? "No tiene permisos para aprobar"
                          : "Aprobar orden de compra"
              }
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          {isEdit && (
            <Button
              label="Generar Kardex"
              icon="pi pi-database"
              className="p-button-info"
              onClick={handleGenerarKardexClick}
              disabled={
                readOnly ||
                loading ||
                !permisos.puedeEditar ||
                (!estaAprobado && !kardexGenerado) ||
                estaAnulado
              }
              tooltip={
                !estaAprobado && !kardexGenerado
                  ? "Solo se puede generar kardex en órdenes aprobadas"
                  : estaAnulado
                    ? "No se puede generar kardex en orden anulada"
                    : kardexGenerado
                      ? "Regenerar kardex (eliminar y crear nuevo movimiento)"
                      : readOnly
                        ? "Modo solo lectura"
                        : !permisos.puedeEditar
                          ? "No tiene permisos para generar kardex"
                          : "Generar movimiento de almacén y kardex"
              }
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          {isEdit && (
            <Button
              label="Anular"
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={handleAnularClick}
              disabled={
                readOnly || loading || !permisos.puedeEliminar || estaAnulado
              }
              tooltip={
                estaAnulado
                  ? "La orden ya está anulada"
                  : readOnly
                    ? "Modo solo lectura"
                    : !permisos.puedeEliminar
                      ? "No tiene permisos para anular"
                      : "Anular orden de compra"
              }
            />
          )}
        </div>

        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 1 }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onCancel}
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Guardar"
            icon="pi pi-save"
            onClick={handleSubmit}
            disabled={readOnly || loading || !puedeEditar}
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !puedeEditar
                  ? "No se puede editar"
                  : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
