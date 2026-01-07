// src/components/preFactura/PreFacturaForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import DatosGeneralesPreFacturaCard from "./DatosGeneralesPreFacturaCard";
import VerImpresionPreFacturaPDF from "./VerImpresionPreFacturaPDF";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import { getSeriesDoc } from "../../api/preFactura";
import BotonesGeneracionComprobante from "./BotonesGeneracionComprobante";

const PreFacturaForm = ({
  isEdit,
  defaultValues = null,
  onSubmit,
  onCancel,
  empresas = [],
  tiposDocumento = [],
  clientes: clientesProp = [],
  tiposProducto = [],
  formasPago = [],
  productos = [],
  personalOptions = [],
  estadosDoc = [],
  centrosCosto = [],
  monedas = [],
  incoterms = [],
  paises = [],
  puertos = [],
  tiposContenedor = [],
  agenteAduanas = [],
  operadoresLogisticos = [],
  navieras = [],
  bancos = [],
  empresaFija = null,
  permisos = {},
  readOnly = false,
  loading: loadingProp = false,
  toast: toastProp,
}) => {
  const [activeCard, setActiveCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useRef(toastProp || null);

  const [clientes, setClientes] = useState(clientesProp);
  const [seriesDoc, setSeriesDoc] = useState([]);
  const [detalles, setDetalles] = useState(defaultValues?.detalles || []);
  const [estadosPreFacturas, setEstadosPreFacturas] = useState([]);
  const [detallesCount, setDetallesCount] = useState(
    defaultValues?.detalles?.length || 0
  );
  const [totales, setTotales] = useState({ subtotal: 0, igv: 0, total: 0 });

  const responsablesVentas = personalOptions;
  const responsablesAutorizaVenta = personalOptions;
  const responsablesSupervisorCampo = personalOptions;

  const [formData, setFormData] = useState({
    id: defaultValues?.id || null,
    empresaId: defaultValues?.empresaId
      ? Number(defaultValues.empresaId)
      : empresaFija
      ? Number(empresaFija)
      : 1,
    tipoDocumentoId: defaultValues?.tipoDocumentoId
      ? Number(defaultValues.tipoDocumentoId)
      : 19,
    serieDocId: defaultValues?.serieDocId
      ? Number(defaultValues.serieDocId)
      : null,
    numSerieDoc: defaultValues?.numSerieDoc || "",
    numCorreDoc: defaultValues?.numCorreDoc || "",
    numeroDocumento: defaultValues?.numeroDocumento || "",
    fechaDocumento: defaultValues?.fechaDocumento
      ? new Date(defaultValues.fechaDocumento)
      : new Date(),
    fechaVencimiento: defaultValues?.fechaVencimiento
      ? new Date(defaultValues.fechaVencimiento)
      : null,
    cotizacionVentasOrigenId: defaultValues?.cotizacionVentasOrigenId
      ? Number(defaultValues.cotizacionVentasOrigenId)
      : null,
    ordenCompraCliente: defaultValues?.ordenCompraCliente || "",
    movSalidaAlmacenId: defaultValues?.movSalidaAlmacenId
      ? Number(defaultValues.movSalidaAlmacenId)
      : null,
    clienteId: defaultValues?.clienteId
      ? Number(defaultValues.clienteId)
      : null,
    estadoId: defaultValues?.estadoId ? Number(defaultValues.estadoId) : 45,
    formaPagoId: defaultValues?.formaPagoId
      ? Number(defaultValues.formaPagoId)
      : null,
    bancoId: defaultValues?.bancoId ? Number(defaultValues.bancoId) : null,
    monedaId: defaultValues?.monedaId ? Number(defaultValues.monedaId) : 1,
    tipoCambio: defaultValues?.tipoCambio || 3.75,
    esExportacion:
      defaultValues?.esExportacion !== undefined
        ? defaultValues.esExportacion
        : false,
    paisDestinoId: defaultValues?.paisDestinoId
      ? Number(defaultValues.paisDestinoId)
      : null,
    incotermId: defaultValues?.incotermId
      ? Number(defaultValues.incotermId)
      : null,
    puertoCargaId: defaultValues?.puertoCargaId
      ? Number(defaultValues.puertoCargaId)
      : null,
    puertoDescargaId: defaultValues?.puertoDescargaId
      ? Number(defaultValues.puertoDescargaId)
      : null,
    agenteAduanaId: defaultValues?.agenteAduanaId
      ? Number(defaultValues.agenteAduanaId)
      : null,
    numeroBuque: defaultValues?.numeroBuque || "",
    numeroBL: defaultValues?.numeroBL || "",
    numContenedor: defaultValues?.numContenedor || "",
    tipoContenedorId: defaultValues?.tipoContenedorId
      ? Number(defaultValues.tipoContenedorId)
      : null,
    exoneradoIgv:
      defaultValues?.exoneradoIgv !== undefined
        ? defaultValues.exoneradoIgv
        : false,
    porcentajeIgv: defaultValues?.porcentajeIgv || null,
    factorExportacion: defaultValues?.factorExportacion || null,
    factorExportacionReal: defaultValues?.factorExportacionReal || null,
    observaciones: defaultValues?.observaciones || "",
    urlPreFacturaPdf: defaultValues?.urlPreFacturaPdf || null,
    fechaTransfErpContable: defaultValues?.fechaTransfErpContable
      ? new Date(defaultValues.fechaTransfErpContable)
      : null,
    numIdTransfErpContable: defaultValues?.numIdTransfErpContable || "",
    personaRespTransfErpContable: defaultValues?.personaRespTransfErpContable
      ? Number(defaultValues.personaRespTransfErpContable)
      : null,
    centroCostoId: defaultValues?.centroCostoId
      ? Number(defaultValues.centroCostoId)
      : null,
    dirEntregaId: defaultValues?.dirEntregaId
      ? Number(defaultValues.dirEntregaId)
      : null,
    dirFiscalId: defaultValues?.dirFiscalId
      ? Number(defaultValues.dirFiscalId)
      : null,
    contratoServicioId: defaultValues?.contratoServicioId
      ? Number(defaultValues.contratoServicioId)
      : null,
    creadoPor: defaultValues?.creadoPor
      ? Number(defaultValues.creadoPor)
      : null,
    actualizadoPor: defaultValues?.actualizadoPor
      ? Number(defaultValues.actualizadoPor)
      : null,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { empresaId, tipoDocumentoId } = formData;

  useEffect(() => {
    if (empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(empresaId)
      );
      if (
        empresaSeleccionada &&
        empresaSeleccionada.porcentajeIgv !== undefined
      ) {
        handleChange("porcentajeIgv", empresaSeleccionada.porcentajeIgv);
      }
    }
  }, [formData.empresaId, empresas, isEdit]);

  useEffect(() => {
    if (formData.empresaId && empresas && empresas.length > 0 && !isEdit) {
      const empresaSeleccionada = empresas.find(
        (e) => Number(e.id) === Number(formData.empresaId)
      );
      if (formData.exoneradoIgv) {
        handleChange("porcentajeIgv", 0);
      } else {
        if (
          empresaSeleccionada &&
          empresaSeleccionada.porcentajeIgv !== undefined
        ) {
          handleChange("porcentajeIgv", empresaSeleccionada.porcentajeIgv);
        }
      }
    }
  }, [formData.exoneradoIgv, formData.empresaId, empresas, isEdit]);

  const handleSerieDocChange = (serieId) => {
    setFormData((prev) => ({ ...prev, serieDocId: Number(serieId) }));
    if (serieId) {
      const serie = seriesDoc.find((s) => Number(s.id) === Number(serieId));
      if (serie) {
        const proximoCorrelativo = Number(serie.correlativo) + 1;
        const numSerie = String(serie.serie).padStart(
          serie.numCerosIzqSerie,
          "0"
        );
        setFormData((prev) => ({
          ...prev,
          serieDocId: Number(serieId),
          numSerieDoc: numSerie,
          numCorreDoc: `Próximo: ${proximoCorrelativo}`,
          numeroDocumento: "Se generará al guardar",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        numSerieDoc: "",
        numCorreDoc: "",
        numeroDocumento: "",
      }));
    }
  };

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const estados = await getEstadosMultiFuncionPorTipoProviene(14);
        setEstadosPreFacturas(estados);
      } catch (err) {
        console.error("Error al cargar estados de pre-facturas:", err);
        setEstadosPreFacturas([]);
      }
    };
    cargarEstados();
  }, []);

  useEffect(() => {
    setClientes(clientesProp);
  }, [clientesProp]);

  useEffect(() => {
    const cargarSeriesDoc = async () => {
      if (empresaId && tipoDocumentoId) {
        try {
          const series = await getSeriesDoc(empresaId, tipoDocumentoId);
          setSeriesDoc(series);
        } catch (err) {
          console.error("Error al cargar series de documentos:", err);
          setSeriesDoc([]);
        }
      } else {
        setSeriesDoc([]);
      }
    };
    cargarSeriesDoc();
  }, [empresaId, tipoDocumentoId]);

  useEffect(() => {
    const calcularTotales = async () => {
      if (!detalles || detalles.length === 0) {
        setTotales({ subtotal: 0, igv: 0, total: 0 });
        return;
      }

      const subtotal = detalles.reduce((sum, det) => {
        const cantidad = Number(det.cantidad) || 0;
        const precio = Number(det.precioUnitario) || 0;
        return sum + cantidad * precio;
      }, 0);

      const porcentajeIGV = Number(formData.porcentajeIgv) || 0;
      const igv = formData.exoneradoIgv ? 0 : subtotal * (porcentajeIGV / 100);
      const total = subtotal + igv;

      setTotales({ subtotal, igv, total });
    };

    calcularTotales();
  }, [
    detalles,
    formData.monedaId,
    formData.tipoCambio,
    formData.porcentajeIgv,
    formData.exoneradoIgv,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        detalles,
        fechaDocumento: formData.fechaDocumento?.toISOString(),
        fechaVencimiento: formData.fechaVencimiento?.toISOString(),
        fechaTransfErpContable: formData.fechaTransfErpContable?.toISOString(),
      };
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error al guardar pre-factura:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleTabChange = (e) => {
    setActiveCard(e.index);
  };

  const estadosPreFacturasOptions = estadosPreFacturas.map((e) => ({
    ...e,
    id: Number(e.id),
    label: e.descripcion,
    value: Number(e.id),
  }));

  const seriesDocOptions = seriesDoc.map((s) => ({
    ...s,
    id: Number(s.id),
    label: `${s.serie} (Correlativo: ${Number(s.correlativo)})`,
    value: Number(s.id),
  }));

  return (
    <div className="pre-factura-form">
      <Toast
        ref={toast}
        position="top-center"
        appendTo={document.body}
        style={{ zIndex: 99999 }}
      />
      <form onSubmit={handleSubmit}>
        <TabView
          activeIndex={activeCard}
          onTabChange={handleTabChange}
          className="p-mb-4"
        >
          <TabPanel header="Datos Generales" leftIcon="pi pi-building">
            <DatosGeneralesPreFacturaCard
              formData={formData}
              handleChange={handleChange}
              handleSerieDocChange={handleSerieDocChange}
              empresaFija={empresaFija}
              disabled={loading || loadingProp}
              permisos={permisos}
              empresas={empresas}
              clientes={clientes}
              tiposDocumento={tiposDocumento}
              tiposProducto={tiposProducto}
              formasPago={formasPago}
              monedas={monedas}
              centrosCosto={centrosCosto}
              responsablesVentas={responsablesVentas}
              responsablesAutorizaVenta={responsablesAutorizaVenta}
              responsablesSupervisorCampo={responsablesSupervisorCampo}
              agenteAduanas={agenteAduanas}
              operadoresLogisticos={operadoresLogisticos}
              navieras={navieras}
              seriesDoc={seriesDoc}
              seriesDocOptions={seriesDocOptions}
              incoterms={incoterms}
              paises={paises}
              puertos={puertos}
              tiposContenedor={tiposContenedor}
              setSeriesDoc={setSeriesDoc}
              setClientes={setClientes}
              estadosPreFacturasOptions={estadosPreFacturasOptions}
              detalles={detalles}
              setDetalles={setDetalles}
              productos={productos}
              isEdit={isEdit}
              preFacturaId={defaultValues?.id}
              toast={toast}
              onCountChange={setDetallesCount}
              subtotal={totales.subtotal}
              totalIGV={totales.igv}
              total={totales.total}
              monedasOptions={monedas.map((m) => ({
                value: m.id,
                codigoSunat: m.codigoSunat || "PEN",
              }))}
              readOnly={readOnly}
            />
          </TabPanel>
          <TabPanel header="PDF Pre-Factura" leftIcon="pi pi-file-pdf">
            <VerImpresionPreFacturaPDF
              preFacturaId={formData.id}
              datosPreFactura={formData}
              detalles={detalles}
              toast={toast}
            />
          </TabPanel>
          <TabPanel header="Facturación Electrónica" leftIcon="pi pi-send">
            <div className="p-4">
              <h3 className="text-lg font-bold mb-3">
                Generar Comprobante Electrónico
              </h3>
              <p className="text-gray-600 mb-4">
                Desde esta PreFactura puede generar una Factura o Boleta
                Electrónica que será enviada a SUNAT.
              </p>
              <BotonesGeneracionComprobante
                preFacturaId={formData.id}
                empresaId={formData.empresaId}
                facturado={formData.facturado}
                toast={toast}
                onComprobanteGenerado={(resultado) => {
                  // Actualizar estado de facturado
                  handleChange("facturado", true);
                  handleChange("fechaFacturacion", new Date());
                }}
              />
            </div>
          </TabPanel>
        </TabView>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={handleCancel}
            disabled={loading || loadingProp}
          />
          <Button
            type="submit"
            label={defaultValues ? "Actualizar" : "Guardar"}
            icon="pi pi-save"
            className="p-button-primary"
            loading={loading || loadingProp}
            disabled={readOnly || !permisos.puedeEditar}
            tooltip={
              readOnly
                ? "Modo solo lectura"
                : !permisos.puedeEditar
                ? "No tiene permisos para editar"
                : ""
            }
          />
        </div>
      </form>
    </div>
  );
};

export default PreFacturaForm;
