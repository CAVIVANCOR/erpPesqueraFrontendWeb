/**
 * Card de Datos Generales para Cotización de Ventas
 *
 * Incluye:
 * - Datos de empresa y cliente
 * - Datos del documento
 * - Datos comerciales
 * - Datos de exportación
 * - Responsables
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { getClientesPorEmpresa } from "../../api/entidadComercial";

const DatosGeneralesCotizacionCard = ({
  // formData y handlers (patrón DatosGeneralesTab)
  formData,
  onChange,
  onSerieChange,
  // Estados individuales
  empresaId,
  setEmpresaId,
  clienteId,
  setClienteId,
  tipoDocumentoId,
  setTipoDocumentoId,
  serieDocId,
  setSerieDocId,
  numSerieDoc,
  setNumSerieDoc,
  numCorreDoc,
  setNumCorreDoc,
  numeroDocumento,
  setNumeroDocumento,
  empresaFija,
  // Catálogos
  empresas,
  clientes,
  setClientes,
  tiposDocumento,
  seriesDocOptions,
  monedas,
  formasPago,
  incoterms,
  tiposProducto,
  puertos,
  bancos,
  paises,
  personal,
  estados,
  centrosCosto,
  tiposEstadoProducto,
  destinosProducto,
  formasTransaccion,
  modosDespacho,
  responsablesVentas,
  responsablesEmbarque,
  responsablesProduccion,
  responsablesAlmacen,
  loading,
}) => {
  const esExportacion = formData.esExportacion;

  // Cargar clientes cuando cambia la empresa
  useEffect(() => {
    const cargarClientes = async () => {
      if (empresaId) {
        try {
          const clientesData = await getClientesPorEmpresa(empresaId);
          setClientes(clientesData);
        } catch (error) {
          console.error("Error al cargar clientes:", error);
          setClientes([]);
        }
      } else {
        setClientes([]);
        setClienteId(null);
      }
    };
    cargarClientes();
  }, [empresaId, setClientes, setClienteId]);

  return (
    <div className="card">
      <h3>Datos Generales de la Cotización</h3>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 3 }}>
          <label htmlFor="empresaId" style={{ fontWeight: "bold" }}>
            Empresa *
          </label>
          <Dropdown
            id="empresaId"
            value={empresaId}
            options={empresas.map((e) => ({
              label: e.razonSocial,
              value: Number(e.id),
            }))}
            onChange={(e) => {
              setEmpresaId(e.value);
              onChange("empresaId", e.value);
            }}
            placeholder="Seleccionar empresa"
            filter
            showClear
            disabled={loading || empresaFija !== null}
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </div>
        <div style={{ flex: 1.5 }}>
          <label htmlFor="fechaDocumento" style={{ fontWeight: "bold" }}>
            Fecha Documento *
          </label>
          <Calendar
            id="fechaDocumento"
            value={formData.fechaDocumento}
            onChange={(e) => onChange("fechaDocumento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1.5 }}>
          <label htmlFor="tipoDocumentoId" style={{ fontWeight: "bold" }}>
            Tipo Documento *
          </label>
          <Dropdown
            id="tipoDocumentoId"
            value={formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null}
            options={tiposDocumento.map((t) => ({
              label: t.descripcion || t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => onChange("tipoDocumentoId", e.value)}
            placeholder="Tipo documento"
            disabled={true}
            style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* NÚMERO DOCUMENTO */}
          <label htmlFor="numeroDocumento">Número de Documento</label>
          <InputText
            id="numeroDocumento"
            value={formData.numeroDocumento || ""}
            disabled
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="estadoId" style={{ fontWeight: "bold" }}>
            Estado *
          </label>
          <Dropdown
            id="estadoId"
            value={formData.estadoId ? Number(formData.estadoId) : null}
            options={estados.map((e) => ({
              label: e.descripcion,
              value: Number(e.id),
            }))}
            onChange={(e) => onChange("estadoId", e.value)}
            placeholder="Seleccionar estado"
            filter
            showClear
            disabled={loading}
          />
        </div>
        <div style={{ flex: 3 }}>
          <label htmlFor="clienteId" style={{ fontWeight: "bold" }}>
            Cliente *
          </label>
          <Dropdown
            id="clienteId"
            value={formData.clienteId ? Number(formData.clienteId) : null}
            options={clientes.map((c) => ({
              label: c.razonSocial,
              value: Number(c.id),
            }))}
            onChange={(e) => onChange("clienteId", e.value)}
            placeholder="Seleccionar cliente"
            filter
            showClear
            disabled={loading || !empresaId}
          />
        </div>
      </div>
      <div
        style={{
          alignItems: "end",
          display: "flex",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* SERIE DOCUMENTO */}
          <label htmlFor="serieDocId">Serie de Documento*</label>
          <Dropdown
            id="serieDocId"
            value={formData.serieDocId ? Number(formData.serieDocId) : null}
            options={seriesDocOptions}
            onChange={(e) => onSerieChange(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar serie"
            disabled={
              !puedeEditar || !formData.tipoDocumentoId || !!formData.serieDocId
            }
            required
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />
        </div>
      </div>





      <div className="grid">
        {/* SECCIÓN 2: DATOS DEL DOCUMENTO */}
        <div className="col-12">
          <h4
            style={{
              borderBottom: "2px solid #dee2e6",
              paddingBottom: "0.5rem",
              marginTop: "1rem",
            }}
          >
            Datos del Documento
          </h4>
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="fechaVencimiento" style={{ fontWeight: "bold" }}>
            Fecha Vencimiento *
          </label>
          <Calendar
            id="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={(e) => onChange("fechaVencimiento", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={loading}
          />
        </div>

        {/* SECCIÓN 3: DATOS COMERCIALES */}
        <div className="col-12">
          <h4
            style={{
              borderBottom: "2px solid #dee2e6",
              paddingBottom: "0.5rem",
              marginTop: "1rem",
            }}
          >
            Datos Comerciales
          </h4>
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="tipoProductoId" style={{ fontWeight: "bold" }}>
            Tipo Producto *
          </label>
          <Dropdown
            id="tipoProductoId"
            value={formData.tipoProductoId ? Number(formData.tipoProductoId) : null}
            options={tiposProducto.map((t) => ({
              label: t.nombre,
              value: Number(t.id),
            }))}
            onChange={(e) => onChange("tipoProductoId", e.value)}
            placeholder="Seleccionar tipo"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="formaPagoId" style={{ fontWeight: "bold" }}>
            Forma de Pago *
          </label>
          <Dropdown
            id="formaPagoId"
            value={formData.formaPagoId ? Number(formData.formaPagoId) : null}
            options={formasPago.map((f) => ({
              label: f.nombre,
              value: Number(f.id),
            }))}
            onChange={(e) => onChange("formaPagoId", e.value)}
            placeholder="Seleccionar forma"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="bancoId" style={{ fontWeight: "bold" }}>
            Banco
          </label>
          <Dropdown
            id="bancoId"
            value={formData.bancoId ? Number(formData.bancoId) : null}
            options={bancos.map((b) => ({
              label: b.nombre,
              value: Number(b.id),
            }))}
            onChange={(e) => onChange("bancoId", e.value)}
            placeholder="Seleccionar banco"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="monedaId" style={{ fontWeight: "bold" }}>
            Moneda *
          </label>
          <Dropdown
            id="monedaId"
            value={formData.monedaId ? Number(formData.monedaId) : null}
            options={monedas.map((m) => ({
              label: `${m.codigo} - ${m.nombre}`,
              value: Number(m.id),
            }))}
            onChange={(e) => onChange("monedaId", e.value)}
            placeholder="Seleccionar moneda"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="tipoCambio" style={{ fontWeight: "bold" }}>
            Tipo de Cambio *
          </label>
          <InputNumber
            id="tipoCambio"
            value={formData.tipoCambio}
            onValueChange={(e) => onChange("tipoCambio", e.value)}
            minFractionDigits={2}
            maxFractionDigits={6}
            min={0.01}
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="fechaEntregaEstimada" style={{ fontWeight: "bold" }}>
            Fecha Entrega Estimada *
          </label>
          <Calendar
            id="fechaEntregaEstimada"
            value={formData.fechaEntregaEstimada}
            onChange={(e) => onChange("fechaEntregaEstimada", e.value)}
            dateFormat="dd/mm/yy"
            showIcon
            disabled={loading}
          />
        </div>

        {/* SECCIÓN 4: DATOS DE EXPORTACIÓN */}
        <div className="col-12">
          <h4
            style={{
              borderBottom: "2px solid #dee2e6",
              paddingBottom: "0.5rem",
              marginTop: "1rem",
            }}
          >
            Datos de Exportación
          </h4>
        </div>

        <div className="col-12 md:col-3">
          <div className="field-checkbox">
            <Checkbox
              inputId="esExportacion"
              checked={formData.esExportacion}
              onChange={(e) => onChange("esExportacion", e.checked)}
              disabled={loading}
            />
            <label
              htmlFor="esExportacion"
              style={{ fontWeight: "bold", marginLeft: "0.5rem" }}
            >
              Es Exportación
            </label>
          </div>
        </div>

        {esExportacion && (
          <>
            <div className="col-12 md:col-3">
              <label htmlFor="paisDestinoId" style={{ fontWeight: "bold" }}>
                País Destino
              </label>
              <Dropdown
                id="paisDestinoId"
                value={formData.paisDestinoId ? Number(formData.paisDestinoId) : null}
                options={paises.map((p) => ({
                  label: p.nombre,
                  value: Number(p.id),
                }))}
                onChange={(e) => onChange("paisDestinoId", e.value)}
                placeholder="Seleccionar país"
                filter
                showClear
                disabled={loading}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="incotermsId" style={{ fontWeight: "bold" }}>
                Incoterm
              </label>
              <Dropdown
                id="incotermsId"
                value={formData.incotermsId ? Number(formData.incotermsId) : null}
                options={incoterms.map((i) => ({
                  label: `${i.codigo} - ${i.nombre}`,
                  value: Number(i.id),
                }))}
                onChange={(e) => onChange("incotermsId", e.value)}
                placeholder="Seleccionar incoterm"
                filter
                showClear
                disabled={loading}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="puertoCargaId" style={{ fontWeight: "bold" }}>
                Puerto Carga
              </label>
              <Dropdown
                id="puertoCargaId"
                value={formData.puertoCargaId ? Number(formData.puertoCargaId) : null}
                options={puertos.map((p) => ({
                  label: `${p.codigo} - ${p.nombre}`,
                  value: Number(p.id),
                }))}
                onChange={(e) => onChange("puertoCargaId", e.value)}
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={loading}
              />
            </div>

            <div className="col-12 md:col-3">
              <label htmlFor="puertoDescargaId" style={{ fontWeight: "bold" }}>
                Puerto Descarga
              </label>
              <Dropdown
                id="puertoDescargaId"
                value={formData.puertoDescargaId ? Number(formData.puertoDescargaId) : null}
                options={puertos.map((p) => ({
                  label: `${p.codigo} - ${p.nombre}`,
                  value: Number(p.id),
                }))}
                onChange={(e) => onChange("puertoDescargaId", e.value)}
                placeholder="Seleccionar puerto"
                filter
                showClear
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* SECCIÓN 5: RESPONSABLES */}
        <div className="col-12">
          <h4
            style={{
              borderBottom: "2px solid #dee2e6",
              paddingBottom: "0.5rem",
              marginTop: "1rem",
            }}
          >
            Responsables
          </h4>
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="respVentasId" style={{ fontWeight: "bold" }}>
            Responsable Ventas *
          </label>
          <Dropdown
            id="respVentasId"
            value={formData.respVentasId ? Number(formData.respVentasId) : null}
            options={personal.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("respVentasId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="autorizaVentaId" style={{ fontWeight: "bold" }}>
            Autoriza Venta *
          </label>
          <Dropdown
            id="autorizaVentaId"
            value={formData.autorizaVentaId ? Number(formData.autorizaVentaId) : null}
            options={personal.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("autorizaVentaId", e.value)}
            placeholder="Seleccionar autorizador"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="respEmbarqueId" style={{ fontWeight: "bold" }}>
            Responsable Embarque
          </label>
          <Dropdown
            id="respEmbarqueId"
            value={formData.respEmbarqueId ? Number(formData.respEmbarqueId) : null}
            options={personal.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("respEmbarqueId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="respProduccionId" style={{ fontWeight: "bold" }}>
            Responsable Producción
          </label>
          <Dropdown
            id="respProduccionId"
            value={formData.respProduccionId ? Number(formData.respProduccionId) : null}
            options={personal.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("respProduccionId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="respAlmacenId" style={{ fontWeight: "bold" }}>
            Responsable Almacén
          </label>
          <Dropdown
            id="respAlmacenId"
            value={formData.respAlmacenId ? Number(formData.respAlmacenId) : null}
            options={personal.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: Number(p.id),
            }))}
            onChange={(e) => onChange("respAlmacenId", e.value)}
            placeholder="Seleccionar responsable"
            filter
            showClear
            disabled={loading}
          />
        </div>

        {/* SECCIÓN 6: OTROS DATOS */}
        <div className="col-12">
          <h4
            style={{
              borderBottom: "2px solid #dee2e6",
              paddingBottom: "0.5rem",
              marginTop: "1rem",
            }}
          >
            Otros Datos
          </h4>
        </div>

        <div className="col-12 md:col-4">

        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="centroCostoId" style={{ fontWeight: "bold" }}>
            Centro de Costo
          </label>
          <Dropdown
            id="centroCostoId"
            value={formData.centroCostoId ? Number(formData.centroCostoId) : null}
            options={centrosCosto.map((c) => ({
              label: `${c.codigo} - ${c.nombre}`,
              value: Number(c.id),
            }))}
            onChange={(e) => onChange("centroCostoId", e.value)}
            placeholder="Seleccionar centro"
            filter
            showClear
            disabled={loading}
          />
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="margenUtilidadPorcentaje"
            style={{ fontWeight: "bold" }}
          >
            Margen Utilidad (%)
          </label>
          <InputNumber
            id="margenUtilidadPorcentaje"
            value={formData.margenUtilidadPorcentaje}
            onValueChange={(e) => onChange("margenUtilidadPorcentaje", e.value)}
            minFractionDigits={2}
            maxFractionDigits={2}
            suffix="%"
            disabled={loading}
          />
        </div>

        <div className="col-12">
          <label htmlFor="observaciones" style={{ fontWeight: "bold" }}>
            Observaciones
          </label>
          <InputTextarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => onChange("observaciones", e.target.value)}
            rows={3}
            placeholder="OBSERVACIONES GENERALES"
            style={{ textTransform: "uppercase" }}
            disabled={loading}
          />
        </div>

        <div className="col-12">
          <label htmlFor="observacionesInternas" style={{ fontWeight: "bold" }}>
            Observaciones Internas
          </label>
          <InputTextarea
            id="observacionesInternas"
            value={formData.observacionesInternas}
            onChange={(e) => onChange("observacionesInternas", e.target.value)}
            rows={3}
            placeholder="OBSERVACIONES INTERNAS (NO SE IMPRIMEN)"
            style={{ textTransform: "uppercase" }}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default DatosGeneralesCotizacionCard;