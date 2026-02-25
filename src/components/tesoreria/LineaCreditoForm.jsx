import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import { getAllEmpresas } from "../../api/empresa";
import { getAllBancos } from "../../api/banco";
import { getAllMonedas } from "../../api/moneda";
import { getEstadosMultiFuncionPorTipoProviene } from "../../api/estadoMultiFuncion";
import {
  createLineaCredito,
  updateLineaCredito,
} from "../../api/tesoreria/lineaCredito";
import SublineaCreditoList from './SublineaCreditoList';

const LineaCreditoForm = forwardRef(
  (
    { lineaCredito, empresaFija = null, onSave, onCancel, readOnly = false },
    ref,
  ) => {
    const toast = useRef(null);
    const [formData, setFormData] = useState({
      empresaId: empresaFija ? Number(empresaFija) : null,
      bancoId: null,
      numeroLinea: "",
      montoAprobado: 0,
      monedaId: null,
      tasaInteres: 0,
      fechaAprobacion: null,
      fechaVencimiento: null,
      estadoId: null,
      observaciones: "",
      urlDocumentoPDF: "",
    });

    const [empresas, setEmpresas] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      cargarDatos();
    }, []);

    useEffect(() => {
      if (lineaCredito) {
        setFormData({
          empresaId: lineaCredito.empresaId
            ? lineaCredito.empresaId
            : empresaFija
              ? Number(empresaFija)
              : null,
          bancoId: lineaCredito.bancoId,
          numeroLinea: lineaCredito.numeroLinea || "",
          montoAprobado: parseFloat(lineaCredito.montoAprobado) || 0,
          monedaId: lineaCredito.monedaId,
          tasaInteres: parseFloat(lineaCredito.tasaInteres) || 0,
          fechaAprobacion: lineaCredito.fechaAprobacion
            ? new Date(lineaCredito.fechaAprobacion)
            : null,
          fechaVencimiento: lineaCredito.fechaVencimiento
            ? new Date(lineaCredito.fechaVencimiento)
            : null,
          estadoId: lineaCredito.estadoId,
          observaciones: lineaCredito.observaciones || "",
          urlDocumentoPDF: lineaCredito.urlDocumentoPDF || "",
        });
      }
    }, [lineaCredito]);

    const cargarDatos = async () => {
      try {
        const [empresasData, bancosData, monedasData, estadosData] =
          await Promise.all([
            getAllEmpresas(),
            getAllBancos(),
            getAllMonedas(),
            getEstadosMultiFuncionPorTipoProviene(22),
          ]);

        setEmpresas(
          empresasData.map((e) => ({ label: e.razonSocial, value: e.id })),
        );
        setBancos(bancosData.map((b) => ({ label: b.nombre, value: b.id })));
        setMonedas(
          monedasData.map((m) => ({ label: m.codigoSunat, value: m.id })),
        );
        setEstados(
          estadosData.map((e) => ({
            label: e.descripcion || e.estado,
            value: e.id,
          })),
        );
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar datos",
          life: 3000,
        });
      }
    };

        const handleSubmit = async () => {
      if (!validarFormulario()) return;

      setLoading(true);
      try {
        const dataToSend = {
          ...formData,
          fechaAprobacion: formData.fechaAprobacion?.toISOString(),
          fechaVencimiento: formData.fechaVencimiento?.toISOString(),
        };

        let lineaGuardada;
        if (lineaCredito?.id) {
          lineaGuardada = await updateLineaCredito(lineaCredito.id, dataToSend);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Línea de crédito actualizada",
            life: 3000,
          });
        } else {
          lineaGuardada = await createLineaCredito(dataToSend);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Línea de crédito creada",
            life: 3000,
          });
        }

        // Pasar el ID de la línea guardada al callback
        if (onSave) onSave(lineaGuardada?.id || lineaCredito?.id);
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            error.response?.data?.message ||
            "Error al guardar línea de crédito",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    const validarFormulario = () => {
      if (!formData.empresaId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Seleccione una empresa",
          life: 3000,
        });
        return false;
      }
      if (!formData.bancoId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Seleccione un banco",
          life: 3000,
        });
        return false;
      }
      if (!formData.numeroLinea) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Ingrese el número de línea",
          life: 3000,
        });
        return false;
      }
      if (!formData.montoAprobado || formData.montoAprobado <= 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Ingrese un monto aprobado válido",
          life: 3000,
        });
        return false;
      }
      if (!formData.monedaId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Seleccione una moneda",
          life: 3000,
        });
        return false;
      }
      if (!formData.fechaAprobacion) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Ingrese la fecha de aprobación",
          life: 3000,
        });
        return false;
      }
      if (!formData.fechaVencimiento) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Ingrese la fecha de vencimiento",
          life: 3000,
        });
        return false;
      }
      if (!formData.estadoId) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Seleccione un estado",
          life: 3000,
        });
        return false;
      }
      return true;
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div className="p-fluid">
        <Toast ref={toast} />
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="empresaId">Empresa *</label>
            <Dropdown
              id="empresaId"
              value={formData.empresaId}
              options={empresas}
              onChange={(e) => setFormData({ ...formData, empresaId: e.value })}
              placeholder="Seleccione una empresa"
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="bancoId">Banco *</label>
            <Dropdown
              id="bancoId"
              value={formData.bancoId}
              options={bancos}
              onChange={(e) => setFormData({ ...formData, bancoId: e.value })}
              placeholder="Seleccione un banco"
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="numeroLinea">Número de Línea *</label>
            <InputText
              id="numeroLinea"
              value={formData.numeroLinea}
              onChange={(e) =>
                setFormData({ ...formData, numeroLinea: e.target.value })
              }
              placeholder="Ej: LC-2025-001"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="monedaId">Moneda *</label>
            <Dropdown
              id="monedaId"
              value={formData.monedaId}
              options={monedas}
              onChange={(e) => setFormData({ ...formData, monedaId: e.value })}
              placeholder="Seleccione moneda"
              filter
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="montoAprobado">Monto Aprobado *</label>
            <InputNumber
              id="montoAprobado"
              value={formData.montoAprobado}
              onValueChange={(e) =>
                setFormData({ ...formData, montoAprobado: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="tasaInteres">Tasa de Interés (%) *</label>
            <InputNumber
              id="tasaInteres"
              value={formData.tasaInteres}
              onValueChange={(e) =>
                setFormData({ ...formData, tasaInteres: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              suffix="%"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaAprobacion">Fecha de Aprobación *</label>
            <Calendar
              id="fechaAprobacion"
              value={formData.fechaAprobacion}
              onChange={(e) =>
                setFormData({ ...formData, fechaAprobacion: e.value })
              }
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaVencimiento">Fecha de Vencimiento *</label>
            <Calendar
              id="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={(e) =>
                setFormData({ ...formData, fechaVencimiento: e.value })
              }
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="estadoId">Estado *</label>
            <Dropdown
              id="estadoId"
              value={formData.estadoId}
              options={estados}
              onChange={(e) => setFormData({ ...formData, estadoId: e.value })}
              placeholder="Seleccione un estado"
            />
          </div>
        </div>

        {/* Sublíneas de Crédito - Solo mostrar si la línea ya existe */}
        {lineaCredito && lineaCredito.id && (
          <div className="col-12 mt-4">
            <SublineaCreditoList
              lineaCreditoId={lineaCredito.id}
              lineaCredito={lineaCredito}
              onSublineasChange={(sublineas) => {
                // Opcional: actualizar estado si necesitas hacer algo con las sublíneas
                console.log("Sublíneas actualizadas:", sublineas);
              }}
            />
          </div>
        )}


        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-button-warning"
            severity="warning"
            raised
            size="small"
            outlined
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            type="button"
            loading={loading}
            disabled={readOnly || loading}
            className="p-button-success"
            severity="success"
            raised
            size="small"
            outlined
            onClick={handleSubmit}
          />
        </div>
      </div>
    );
  },
);

LineaCreditoForm.displayName = "LineaCreditoForm";

export default LineaCreditoForm;
