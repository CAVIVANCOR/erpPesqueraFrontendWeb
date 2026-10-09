/**
 * AsignarCampoMasaProductoButton.jsx
 *
 * Botón autónomo para asignar un campo en masa a los productos seleccionados.
 * Incluye el botón, el diálogo, el toast y la llamada a la API.
 *
 * Campos soportados:
 * - Tipo de Afectación IGV
 * - Tipo de Detracción
 * - Cuenta Compras
 * - Cuenta Inventario
 * - Cuenta Costo de Ventas
 * - Cuenta de Variación
 * - Cuenta Ventas
 *
 * Para las cuentas contables utiliza PlanCuentaContableSelector.
 */

import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import PlanCuentaContableSelector from "./PlanCuentaContableSelector";
import { actualizarCampoMasaProductos } from "../../api/producto";
import { getTiposAfectacionIGVActivos } from "../../api/facturacionElectronica/tipoAfectacionIGV";
import { getTiposDetraccionActivos } from "../../api/tipoDetraccion";

const CAMPOS_CONFIG = [
  {
    key: "tipoAfectacionIGVId",
    label: "Tipo de Afectación IGV",
    tipo: "dropdown",
    loader: getTiposAfectacionIGVActivos,
    optionLabel: (item) => `${item.codigo} - ${item.nombre}`,
    optionValue: (item) => Number(item.id),
    placeholder: "Seleccione tipo de afectación IGV",
  },
  {
    key: "tipoDetraccionId",
    label: "Tipo de Detracción",
    tipo: "dropdown",
    loader: getTiposDetraccionActivos,
    optionLabel: (item) => `${item.codigo} - ${item.nombre}`,
    optionValue: (item) => Number(item.id),
    placeholder: "Seleccione tipo de detracción",
  },
  {
    key: "cuentaComprasId",
    label: "Cuenta Compras",
    tipo: "cuenta",
    placeholder: "Elegir cuenta contable de compras",
  },
  {
    key: "cuentaInventarioId",
    label: "Cuenta Inventario",
    tipo: "cuenta",
    placeholder: "Elegir cuenta contable de inventario",
  },
  {
    key: "cuentaCostoVentasId",
    label: "Cuenta Costo de Ventas",
    tipo: "cuenta",
    placeholder: "Elegir cuenta contable de costo de ventas",
  },
  {
    key: "cuentaVariacionId",
    label: "Cuenta Variación",
    tipo: "cuenta",
    placeholder: "Elegir cuenta contable de variación",
  },
  {
    key: "cuentaVentasId",
    label: "Cuenta Ventas",
    tipo: "cuenta",
    placeholder: "Elegir cuenta contable de ventas",
  },
];

export default function AsignarCampoMasaProductoButton({
  selectedIds = [],
  disabled = false,
  onExito,
  label = "Asignar en Masa",
  className = "",
  icon = "pi pi-pencil",
  entidadNombre = "Producto(s)",
}) {
  const toast = useRef(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [campoKey, setCampoKey] = useState(null);
  const [valorSeleccionado, setValorSeleccionado] = useState(null);
  const [opcionesDropdown, setOpcionesDropdown] = useState([]);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [loadingAplicar, setLoadingAplicar] = useState(false);

  const campoConfig = CAMPOS_CONFIG.find((c) => c.key === campoKey);

  useEffect(() => {
    setValorSeleccionado(null);
    setOpcionesDropdown([]);

    if (!campoConfig || campoConfig.tipo !== "dropdown") {
      return;
    }

    let cancelled = false;
    const cargarOpciones = async () => {
      setLoadingOpciones(true);
      try {
        const data = await campoConfig.loader();
        if (!cancelled) {
          setOpcionesDropdown(
            (data || []).map((item) => ({
              label: campoConfig.optionLabel(item),
              value: campoConfig.optionValue(item),
              raw: item,
            }))
          );
        }
      } catch (error) {
        console.error("Error cargando opciones:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar las opciones del catálogo",
          life: 3000,
        });
      } finally {
        if (!cancelled) setLoadingOpciones(false);
      }
    };

    cargarOpciones();
    return () => {
      cancelled = true;
    };
  }, [campoKey]);

  const handleAbrir = () => {
    setCampoKey(null);
    setValorSeleccionado(null);
    setDialogVisible(true);
  };

  const handleCerrar = () => {
    setDialogVisible(false);
    setCampoKey(null);
    setValorSeleccionado(null);
    setOpcionesDropdown([]);
  };

  const normalizarValor = (valor) => {
    if (valor === undefined || valor === null || valor === "" || valor === 0) {
      return null;
    }
    return Number(valor);
  };

  const handleAplicar = async () => {
    if (!campoKey) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar el campo a modificar",
        life: 3000,
      });
      return;
    }

    const valorFinal = normalizarValor(valorSeleccionado);

    if (selectedIds.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay productos seleccionados",
        life: 3000,
      });
      return;
    }

    setLoadingAplicar(true);
    try {
      const resultado = await actualizarCampoMasaProductos(
        selectedIds,
        campoKey,
        valorFinal
      );

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail:
          resultado.mensaje ||
          `${resultado.actualizados} registro(s) actualizado(s)`,
        life: 3000,
      });

      if (onExito) {
        await onExito();
      }

      handleCerrar();
    } catch (error) {
      console.error("Error aplicando cambio masivo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Error al actualizar los productos seleccionados",
        life: 5000,
      });
    } finally {
      setLoadingAplicar(false);
    }
  };

  const renderSelectorValor = () => {
    if (!campoConfig) {
      return (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            color: "#666",
            textAlign: "center",
          }}
        >
          Seleccione primero el campo que desea modificar
        </div>
      );
    }

    if (campoConfig.tipo === "cuenta") {
      return (
        <PlanCuentaContableSelector
          value={valorSeleccionado}
          onChange={(value) => setValorSeleccionado(value)}
          label={campoConfig.label}
          placeholder={campoConfig.placeholder}
          required
        />
      );
    }

    return (
      <Dropdown
        value={valorSeleccionado}
        options={opcionesDropdown}
        optionLabel="label"
        optionValue="value"
        onChange={(e) => setValorSeleccionado(e.value)}
        placeholder={campoConfig.placeholder}
        loading={loadingOpciones}
        filter
        filterBy="label"
        showClear
        style={{ width: "100%" }}
      />
    );
  };

  const camposOptions = CAMPOS_CONFIG.map((c) => ({
    label: c.label,
    value: c.key,
  }));

  return (
    <>
      <Toast ref={toast} />
      <Button
        label={label}
        icon={icon}
        className={className || "p-button-warning"}
        disabled={disabled || selectedIds.length === 0}
        tooltip={
          selectedIds.length === 0
            ? "Seleccione productos para asignar en masa"
            : `Asignar campo a ${selectedIds.length} producto(s)`
        }
        tooltipOptions={{ position: "top" }}
        onClick={handleAbrir}
      />

      <Dialog
        visible={dialogVisible}
        style={{ width: "600px" }}
        header="Asignar valor en masa"
        modal
        onHide={handleCerrar}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={handleCerrar}
              className="p-button-secondary"
              disabled={loadingAplicar}
            />
            <Button
              label="Aplicar"
              icon="pi pi-check"
              onClick={handleAplicar}
              loading={loadingAplicar}
              disabled={!campoKey}
            />
          </div>
        }
      >
        <div className="p-fluid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#E3F2FD",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i
              className="pi pi-info-circle"
              style={{ color: "#1976D2" }}
            />
            <strong>
              {entidadNombre}: {selectedIds.length} seleccionado(s)
            </strong>
          </div>

          <div className="field">
            <label htmlFor="campo" style={{ fontWeight: "bold" }}>
              Campo a modificar <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              id="campo"
              value={campoKey}
              options={camposOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => setCampoKey(e.value)}
              placeholder="Seleccione campo a modificar"
              filter
              filterBy="label"
              style={{ width: "100%" }}
            />
          </div>

          <div className="field">
            <label htmlFor="valor" style={{ fontWeight: "bold" }}>
              Nuevo valor <span style={{ color: "red" }}>*</span>
            </label>
            {renderSelectorValor()}
          </div>
        </div>
      </Dialog>
    </>
  );
}
