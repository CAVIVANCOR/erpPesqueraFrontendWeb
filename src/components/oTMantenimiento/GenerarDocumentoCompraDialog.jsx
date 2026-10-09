/**
 * GenerarDocumentoCompraDialog.jsx
 *
 * Diálogo para generar un documento de compra (OrdenCompra + CxP + asientos)
 * desde un presupuesto de contratista (DetContratistasOT) de una OT de Mantenimiento.
 *
 * - Gerencial: OC interna tipo 17 serie 002, proveedor = contratista del presupuesto.
 * - Fiscal: comprobante recibido (Factura/Boleta/Recibo por Honorarios) con
 *   tipo de documento, serie, correlativo y RUC del proveedor.
 * - Los ítems se editan SOLO EN MEMORIA (cantidad, precio y producto equivalente
 *   de la empresa seleccionada); el presupuesto aprobado no se modifica.
 *
 * @author ERP Megui
 */

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { RadioButton } from "primereact/radiobutton";
import { getEmpresas } from "../../api/empresa";
import { getTiposDocumento } from "../../api/tipoDocumento";
import { getEntidadesComerciales } from "../../api/entidadComercial";
import EntidadComercialSelector from "../common/EntidadComercialSelector";
import ProductoSelector from "../common/ProductoSelector";
import {
  getProductosEquivalentes,
  generarDocumentoCompra,
} from "../../api/detContratistasOT";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { formatearNumero } from "../../utils/utils";

// Códigos SUNAT admitidos como comprobante fiscal de compra
const CODIGOS_FISCALES = ["01", "03", "02"]; // Factura, Boleta, Recibo por Honorarios

export default function GenerarDocumentoCompraDialog({
  visible,
  onHide,
  presupuesto,
  empresaIdOt,
  monedas = [],
  onGenerated,
}) {
  const toast = useRef(null);
  const usuario = useAuthStore((state) => state.usuario);

  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [modo, setModo] = useState("GERENCIAL");
  const [empresas, setEmpresas] = useState([]);
  const [tiposDocumentoFiscal, setTiposDocumentoFiscal] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [equivalencias, setEquivalencias] = useState({}); // detRepuestoId -> [{id, codigo, descripcionArmada}]

  const [formData, setFormData] = useState({
    empresaId: null,
    monedaId: null,
    fechaDocumento: new Date(),
    proveedorId: null,
    rucProveedor: "",
    tipoDocumentoFinalId: null,
    numSerieDocFinal: "",
    numCorreDocFinal: "",
    observaciones: "",
  });

  // Ítems en memoria (no alteran el presupuesto)
  const [items, setItems] = useState([]);

  // Cargar combos al abrir
  useEffect(() => {
    if (!visible || !presupuesto) return;
    setModo("GERENCIAL");
    setFormData({
      empresaId: empresaIdOt ? Number(empresaIdOt) : null,
      monedaId: Number(presupuesto.monedaId),
      fechaDocumento: new Date(),
      proveedorId: null,
      rucProveedor: "",
      tipoDocumentoFinalId: null,
      numSerieDocFinal: "",
      numCorreDocFinal: "",
      observaciones: "",
    });
    setItems(
      (presupuesto.repuestos || []).map((r) => ({
        detRepuestoId: Number(r.id),
        seleccionado: true,
        productoId: Number(r.productoId),
        descripcion: r.descripcion,
        cantidad: Number(r.cantidad),
        precioUnitario: Number(r.precioUnitario),
      })),
    );
    setEquivalencias({});
    cargarCombos();
  }, [visible, presupuesto]);

  // Buscar productos equivalentes al cambiar la empresa
  useEffect(() => {
    if (!visible || !presupuesto || !formData.empresaId) return;
    cargarEquivalencias();
  }, [formData.empresaId]);

  const cargarCombos = async () => {
    try {
      setLoading(true);
      const [empresasData, tiposData, entidadesData] = await Promise.all([
        getEmpresas(),
        getTiposDocumento(),
        getEntidadesComerciales(),
      ]);
      setEmpresas(empresasData);
      setTiposDocumentoFiscal(
        tiposData.filter((t) => CODIGOS_FISCALES.includes(t.codigoSunat)),
      );
      setEntidades(entidadesData || []);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos del formulario",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEquivalencias = async () => {
    try {
      const resultado = await getProductosEquivalentes(
        presupuesto.id,
        formData.empresaId,
      );
      const mapa = {};
      for (const r of resultado) {
        mapa[Number(r.detRepuestoId)] = r.equivalentes || [];
      }
      setEquivalencias(mapa);
      // Cambiar el productoId solo en memoria al equivalente de la empresa
      setItems((prev) =>
        prev.map((it) => {
          const eq = mapa[it.detRepuestoId] || [];
          const productoEsDeEmpresa = eq.some(
            (e) => Number(e.id) === Number(it.productoId),
          );
          return productoEsDeEmpresa
            ? it
            : { ...it, productoId: eq.length > 0 ? Number(eq[0].id) : null };
        }),
      );
    } catch (error) {
      console.error("Error al buscar productos equivalentes:", error);
    }
  };

  const actualizarItem = (index, campo, valor) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)),
    );
  };

  const itemsSeleccionados = items.filter(
    (i) => i.seleccionado && i.productoId && Number(i.cantidad) > 0,
  );
  const totalDocumento = itemsSeleccionados.reduce(
    (suma, i) => suma + Number(i.cantidad) * Number(i.precioUnitario),
    0,
  );
  const monedaSel = monedas.find(
    (m) => Number(m.id) === Number(formData.monedaId),
  );

  const validar = () => {
    if (!formData.empresaId) return "Debe seleccionar la empresa que factura";
    if (!formData.monedaId) return "Debe seleccionar la moneda del documento";
    if (itemsSeleccionados.length === 0)
      return "Debe seleccionar al menos un ítem con producto de la empresa";
    if (modo === "FISCAL") {
      if (!formData.proveedorId)
        return "Debe seleccionar el proveedor del comprobante";
      if (!formData.tipoDocumentoFinalId)
        return "Debe seleccionar el tipo de comprobante";
      if (!formData.numSerieDocFinal?.trim() || !formData.numCorreDocFinal)
        return "Debe ingresar serie y correlativo del comprobante";
    }
    return null;
  };

  const handleGenerar = async () => {
    const mensaje = validar();
    if (mensaje) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: mensaje,
        life: 3500,
      });
      return;
    }
    try {
      setGenerando(true);
      const resultado = await generarDocumentoCompra(presupuesto.id, {
        esGerencial: modo === "GERENCIAL",
        empresaId: formData.empresaId,
        monedaId: formData.monedaId,
        fechaDocumento: formData.fechaDocumento,
        rucProveedor: formData.rucProveedor?.trim() || undefined,
        tipoDocumentoFinalId: formData.tipoDocumentoFinalId || undefined,
        numSerieDocFinal: formData.numSerieDocFinal?.trim() || undefined,
        numCorreDocFinal: formData.numCorreDocFinal || undefined,
        observaciones: formData.observaciones?.trim() || undefined,
        usuarioId: usuario?.id,
        items: itemsSeleccionados.map((i) => ({
          productoId: i.productoId,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: resultado?.message || "Documento generado correctamente",
        life: 3000,
      });
      if (onGenerated) onGenerated(resultado);
      setTimeout(() => onHide(), 800);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.mensaje ||
          error?.response?.data?.message ||
          "No se pudo generar el documento de compra",
        life: 5000,
      });
    } finally {
      setGenerando(false);
    }
  };

  // Templates de la tabla de ítems
  const seleccionTemplate = (rowData, { rowIndex }) => (
    <Checkbox
      checked={rowData.seleccionado}
      onChange={(e) => actualizarItem(rowIndex, "seleccionado", e.checked)}
    />
  );

  const productoTemplate = (rowData, { rowIndex }) => (
    <ProductoSelector
      value={rowData.productoId}
      onChange={(productoId) =>
        actualizarItem(rowIndex, "productoId", productoId)
      }
      empresaIdPreseleccionada={formData.empresaId}
      placeholder="Seleccione producto/servicio"
      required={true}
    />
  );

  const cantidadTemplate = (rowData, { rowIndex }) => (
    <InputNumber
      value={rowData.cantidad}
      onValueChange={(e) => actualizarItem(rowIndex, "cantidad", e.value)}
      mode="decimal"
      minFractionDigits={2}
      maxFractionDigits={4}
      inputStyle={{ width: "100%" }}
    />
  );

  const precioTemplate = (rowData, { rowIndex }) => (
    <InputNumber
      value={rowData.precioUnitario}
      onValueChange={(e) => actualizarItem(rowIndex, "precioUnitario", e.value)}
      mode="decimal"
      minFractionDigits={2}
      maxFractionDigits={6}
      inputStyle={{ width: "100%" }}
    />
  );

  const subtotalTemplate = (rowData) =>
    formatearNumero(Number(rowData.cantidad) * Number(rowData.precioUnitario));

  const footer = (
    <div className="flex justify-content-between align-items-center">
      <div className="text-lg font-bold">
        Total del documento: {monedaSel?.simbolo || ""}{" "}
        {formatearNumero(totalDocumento)}
      </div>
      <div className="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onHide}
          disabled={generando}
        />
        <Button
          label="Generar Documento"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleGenerar}
          loading={generando}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Generar Documento de Compra — Presupuesto N° ${presupuesto?.numeroLinea ?? ""} (${presupuesto?.contratista?.razonSocial ?? ""})`}
      style={{ width: "95vw", maxWidth: "1200px" }}
      modal
      className="p-fluid"
      footer={footer}
    >
      <Toast ref={toast} />
      <Message
        severity="info"
        className="mb-3"
        text="Los cambios en los ítems se aplican solo a este documento; el presupuesto aprobado no se modifica."
      />

      {/* Modo del documento */}
      <div className="flex gap-4 align-items-center mb-3">
        <span className="font-medium">Tipo de operación:</span>
        <div className="flex align-items-center gap-2">
          <RadioButton
            inputId="modoGerencial"
            value="GERENCIAL"
            checked={modo === "GERENCIAL"}
            onChange={() => setModo("GERENCIAL")}
          />
          <label htmlFor="modoGerencial">Gerencial (interno)</label>
        </div>
        <div className="flex align-items-center gap-2">
          <RadioButton
            inputId="modoFiscal"
            value="FISCAL"
            checked={modo === "FISCAL"}
            onChange={() => setModo("FISCAL")}
          />
          <label htmlFor="modoFiscal">Fiscal (comprobante recibido)</label>
        </div>
      </div>

      {/* Datos del documento */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <label className="block font-medium mb-2">Empresa que factura *</label>
          <Dropdown
            value={formData.empresaId}
            options={empresas}
            optionLabel="razonSocial"
            optionValue="id"
            onChange={(e) =>
              setFormData({ ...formData, empresaId: e.value })
            }
            placeholder="Seleccione empresa"
            filter
          />
        </div>
        <div className="col-12 md:col-3">
          <label className="block font-medium mb-2">Fecha del documento *</label>
          <Calendar
            value={formData.fechaDocumento}
            onChange={(e) =>
              setFormData({ ...formData, fechaDocumento: e.value })
            }
            dateFormat="dd/mm/yy"
            showIcon
          />
        </div>
        <div className="col-12 md:col-3">
          <label className="block font-medium mb-2">Moneda *</label>
          <Dropdown
            value={formData.monedaId}
            options={monedas}
            optionLabel="codigoSunat"
            optionValue="id"
            onChange={(e) => setFormData({ ...formData, monedaId: e.value })}
            placeholder="Seleccione moneda"
          />
        </div>
        {modo === "GERENCIAL" && (
          <div className="col-12 md:col-2 flex align-items-end">
            <Tag
              severity="warning"
              value={`Proveedor: ${presupuesto?.contratista?.razonSocial ?? "contratista del presupuesto"}`}
            />
          </div>
        )}
      </div>

      {/* Datos del comprobante fiscal */}
      {modo === "FISCAL" && (
        <div className="grid mt-1">
          <div className="col-12 md:col-3">
            <EntidadComercialSelector
              value={formData.proveedorId}
              onChange={(id) => {
                const entidad = entidades.find(
                  (e) => Number(e.id) === Number(id),
                );
                setFormData({
                  ...formData,
                  proveedorId: id ? Number(id) : null,
                  rucProveedor: entidad?.numeroDocumento || "",
                });
              }}
              tipoEntidadFiltro="PROVEEDOR"
              label="Proveedor *"
              placeholder="Seleccione el proveedor del comprobante"
              required={true}
            />
          </div>
          <div className="col-12 md:col-3">
            <label className="block font-medium mb-2">
              Tipo de comprobante *
            </label>
            <Dropdown
              value={formData.tipoDocumentoFinalId}
              options={tiposDocumentoFiscal}
              optionLabel="descripcion"
              optionValue="id"
              onChange={(e) =>
                setFormData({ ...formData, tipoDocumentoFinalId: e.value })
              }
              placeholder="Factura / Boleta / R. Honorarios"
            />
          </div>
          <div className="col-6 md:col-2">
            <label className="block font-medium mb-2">Serie *</label>
            <InputText
              value={formData.numSerieDocFinal}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numSerieDocFinal: e.target.value.toUpperCase(),
                })
              }
              maxLength={4}
              placeholder="F001"
            />
          </div>
          <div className="col-6 md:col-2">
            <label className="block font-medium mb-2">Correlativo *</label>
            <InputNumber
              value={Number(formData.numCorreDocFinal) || null}
              onValueChange={(e) =>
                setFormData({ ...formData, numCorreDocFinal: e.value })
              }
              useGrouping={false}
              placeholder="123"
            />
          </div>
        </div>
      )}

      {/* Ítems editables en memoria */}
      <div className="mt-3">
        <label className="block font-medium mb-2">
          Ítems del documento (edición en memoria)
        </label>
        <DataTable
          value={items}
          loading={loading}
          size="small"
          showGridlines
          stripedRows
          emptyMessage="El presupuesto no tiene ítems"
        >
          <Column
            header="Sel."
            body={seleccionTemplate}
            style={{ width: "60px", textAlign: "center" }}
          />
          <Column header="Producto (empresa)" body={productoTemplate} />
          <Column
            header="Cantidad"
            body={cantidadTemplate}
            style={{ width: "130px" }}
          />
          <Column
            header="P. Unitario"
            body={precioTemplate}
            style={{ width: "130px" }}
          />
          <Column
            header="Total"
            body={subtotalTemplate}
            style={{ width: "120px", textAlign: "right" }}
          />
        </DataTable>
      </div>

      {/* Observaciones */}
      <div className="mt-3">
        <label className="block font-medium mb-2">Observaciones</label>
        <InputTextarea
          value={formData.observaciones}
          onChange={(e) =>
            setFormData({ ...formData, observaciones: e.target.value })
          }
          rows={2}
          placeholder={`OT ${presupuesto?.otMantenimiento?.numeroCompleto ?? ""} - ${presupuesto?.servicioDescripcion ?? ""}`}
        />
      </div>
    </Dialog>
  );
}
