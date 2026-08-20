// src/components/common/CuentaPorCobrarInfoButton.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { getCuentaPorCobrarById } from "../../api/cuentasPorCobrarPagar/cuentaPorCobrar";
import { formatearFecha, formatearNumero } from "../../utils/utils";
import CuentaPorCobrarForm from "../cuentaPorCobrar/CuentaPorCobrarForm";
import { getEmpresaPorId } from "../../api/empresa";
import { getEntidadComercialPorId } from "../../api/entidadComercial";
import { getMonedaPorId } from "../../api/moneda";
import { getEstadoMultiFuncionPorId } from "../../api/estadoMultiFuncion";
import { getPeriodoContableById } from "../../api/contabilidad/periodoContable";
import { getMediosPago } from "../../api/medioPago";
import { getAllBancos } from "../../api/banco";
import { getAllCuentaCorriente } from "../../api/cuentaCorriente";
import { getTipoProductoPorId } from "../../api/tipoProducto";

const CuentaPorCobrarInfoButton = ({
  cuentaPorCobrarId,
  onButtonClick,
  outlined = true,
  className = "",
  style = {},
}) => {
  const [cuentaPorCobrar, setCuentaPorCobrar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodosContables, setPeriodosContables] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, [cuentaPorCobrarId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const cxcData = await getCuentaPorCobrarById(cuentaPorCobrarId);
      setCuentaPorCobrar(cxcData);

      const tipoProductoId = cxcData.preFactura?.tipoProductoId;

      const [
        empresaData,
        clienteData,
        monedaData,
        estadoData,
        periodoData,
        tipoProductoData,
        mediosData,
        bancosData,
        cuentasData,
      ] = await Promise.all([
        cxcData.empresaId ? getEmpresaById(cxcData.empresaId) : null,
        cxcData.clienteId ? getEntidadComercialPorId(cxcData.clienteId) : null,
        cxcData.monedaId ? getMonedaById(cxcData.monedaId) : null,
        cxcData.estadoId ? getEstadoMultiFuncionById(cxcData.estadoId) : null,
        cxcData.periodoContableId ? getPeriodoContableById(cxcData.periodoContableId) : null,
        tipoProductoId ? getTipoProductoPorId(tipoProductoId) : null,
        getAllMediosPago(),
        getAllBancos(),
        getAllCuentasCorrientes(),
      ]);

      setEmpresas(empresaData ? [empresaData] : []);
      setClientes(clienteData ? [clienteData] : []);
      setMonedas(monedaData ? [monedaData] : []);
      setEstados(estadoData ? [estadoData] : []);
      setPeriodosContables(periodoData ? [periodoData] : []);
      setTiposProducto(tipoProductoData ? [tipoProductoData] : []);
      setMediosPago(mediosData || []);
      setBancos(bancosData || []);
      setCuentasCorrientes(cuentasData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const determinarImpuesto = () => {
    if (!cuentaPorCobrar) return { tipo: "N/A", monto: 0, severity: "secondary" };

    if (cuentaPorCobrar.tieneDetraccion) {
      return {
        tipo: "Detracción",
        monto: cuentaPorCobrar.montoDetraccionTotal || 0,
        severity: "danger",
      };
    }
    if (cuentaPorCobrar.tieneRetencion) {
      return {
        tipo: "Retención",
        monto: cuentaPorCobrar.montoRetencionTotal || 0,
        severity: "warning",
      };
    }
    if (cuentaPorCobrar.tienePercepcion) {
      return {
        tipo: "Percepción",
        monto: cuentaPorCobrar.montoPercepcionTotal || 0,
        severity: "info",
      };
    }

    return { tipo: "N/A", monto: 0, severity: "secondary" };
  };

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick({
        cuentaPorCobrarId,
        cuentaPorCobrarCompleta: cuentaPorCobrar,
      });
    } else {
      setShowDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  if (loading) {
    return (
      <Button
        label="Cargando..."
        icon="pi pi-spin pi-spinner"
        disabled
        outlined={outlined}
        className={className}
        style={{ width: "100%", ...style }}
      />
    );
  }

  if (!cuentaPorCobrar) {
    return (
      <Button
        label="Error al cargar datos"
        icon="pi pi-exclamation-triangle"
        severity="danger"
        outlined={outlined}
        className={className}
        style={{ width: "100%", ...style }}
      />
    );
  }

  const simboloMoneda = cuentaPorCobrar.moneda?.simbolo || "S/";
  const impuesto = determinarImpuesto();
  const tipoProducto = cuentaPorCobrar.preFactura?.tipoProducto?.nombre || "N/A";

  const renderButtonLabel = () => {
    const isSmallScreen = window.innerWidth < 768;
    const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1200;

    if (isSmallScreen) {
      return (
        <div style={{ width: "100%", padding: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Cliente:</span>
              <Tag value={cuentaPorCobrar.cliente?.razonSocial || "N/A"} severity="info" style={{ fontSize: "0.75rem" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>F.Emisión:</span>
              <Tag value={formatearFecha(cuentaPorCobrar.fechaEmision)} severity="info" style={{ fontSize: "0.75rem" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>F.Venc:</span>
              <Tag value={formatearFecha(cuentaPorCobrar.fechaVencimiento)} severity="warning" style={{ fontSize: "0.75rem" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Producto:</span>
              <Tag value={tipoProducto} severity="danger" style={{ fontSize: "0.75rem", fontWeight: "bold" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Total:</span>
              <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoTotal || 0)}`} severity="info" style={{ fontSize: "0.75rem", fontWeight: "600" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Pagado:</span>
              <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoPagado || 0)}`} severity="success" style={{ fontSize: "0.75rem", fontWeight: "600" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Saldo:</span>
              <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.saldoPendiente || 0)}`} severity="warning" style={{ fontSize: "0.75rem", fontWeight: "600" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Imp.SUNAT:</span>
              <Tag value={impuesto.tipo} severity={impuesto.severity} style={{ fontSize: "0.75rem" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>Monto Imp:</span>
              <Tag value={`${simboloMoneda} ${formatearNumero(impuesto.monto)}`} severity={impuesto.severity} style={{ fontSize: "0.75rem", fontWeight: "600" }} />
            </div>
          </div>
        </div>
      );
    }

    if (isMediumScreen) {
      return (
        <div style={{ width: "100%", padding: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Cliente</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>F.Emisión</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>F.Venc</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Producto</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Total</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "8px" }}>
            <Tag value={cuentaPorCobrar.cliente?.razonSocial || "N/A"} severity="info" style={{ fontSize: "0.8rem" }} />
            <Tag value={formatearFecha(cuentaPorCobrar.fechaEmision)} severity="info" style={{ fontSize: "0.8rem" }} />
            <Tag value={formatearFecha(cuentaPorCobrar.fechaVencimiento)} severity="warning" style={{ fontSize: "0.8rem" }} />
            <Tag value={tipoProducto} severity="danger" style={{ fontSize: "0.8rem", fontWeight: "bold" }} />
            <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoTotal || 0)}`} severity="info" style={{ fontSize: "0.8rem", fontWeight: "600" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Pagado</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Saldo</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Imp.SUNAT</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>Monto Imp</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoPagado || 0)}`} severity="success" style={{ fontSize: "0.8rem", fontWeight: "600" }} />
            <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.saldoPendiente || 0)}`} severity="warning" style={{ fontSize: "0.8rem", fontWeight: "600" }} />
            <Tag value={impuesto.tipo} severity={impuesto.severity} style={{ fontSize: "0.8rem" }} />
            <Tag value={`${simboloMoneda} ${formatearNumero(impuesto.monto)}`} severity={impuesto.severity} style={{ fontSize: "0.8rem", fontWeight: "600" }} />
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", padding: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Cliente</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>F.Emisión</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>F.Venc</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Producto</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Total</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Pagado</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Saldo</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Imp.SUNAT</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", textAlign: "center" }}>Monto Imp</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "8px" }}>
          <Tag value={cuentaPorCobrar.cliente?.razonSocial || "N/A"} severity="info" style={{ fontSize: "0.85rem" }} />
          <Tag value={formatearFecha(cuentaPorCobrar.fechaEmision)} severity="info" style={{ fontSize: "0.85rem" }} />
          <Tag value={formatearFecha(cuentaPorCobrar.fechaVencimiento)} severity="warning" style={{ fontSize: "0.85rem" }} />
          <Tag value={tipoProducto} severity="danger" style={{ fontSize: "0.85rem", fontWeight: "bold" }} />
          <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoTotal || 0)}`} severity="info" style={{ fontSize: "0.85rem", fontWeight: "600" }} />
          <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.montoPagado || 0)}`} severity="success" style={{ fontSize: "0.85rem", fontWeight: "600" }} />
          <Tag value={`${simboloMoneda} ${formatearNumero(cuentaPorCobrar.saldoPendiente || 0)}`} severity="warning" style={{ fontSize: "0.85rem", fontWeight: "600" }} />
          <Tag value={impuesto.tipo} severity={impuesto.severity} style={{ fontSize: "0.85rem" }} />
          <Tag value={`${simboloMoneda} ${formatearNumero(impuesto.monto)}`} severity={impuesto.severity} style={{ fontSize: "0.85rem", fontWeight: "600" }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        label={renderButtonLabel()}
        onClick={handleClick}
        outlined={outlined}
        className={className}
        style={{ width: "100%", height: "auto", padding: "0", ...style }}
      />

      {!onButtonClick && (
        <Dialog
          header={`Cuenta por Cobrar #${cuentaPorCobrar.id}`}
          visible={showDialog}
          style={{ width: "95vw", maxWidth: "1400px" }}
          onHide={handleCloseDialog}
          modal
          maximizable
        >
          <CuentaPorCobrarForm
            isEdit={true}
            empresas={empresas}
            clientes={clientes}
            monedas={monedas}
            estados={estados}
            periodosContables={periodosContables}
            mediosPago={mediosPago}
            bancos={bancos}
            cuentasCorrientes={cuentasCorrientes}
            defaultValues={{
              ...cuentaPorCobrar,
              fechaEmision: cuentaPorCobrar.fechaEmision ? new Date(cuentaPorCobrar.fechaEmision) : null,
              fechaVencimiento: cuentaPorCobrar.fechaVencimiento ? new Date(cuentaPorCobrar.fechaVencimiento) : null,
              fechaContable: cuentaPorCobrar.fechaContable ? new Date(cuentaPorCobrar.fechaContable) : null,
            }}
            onSubmit={() => { }}
            onCancel={handleCloseDialog}
            loading={false}
            readOnly={true}
            permisos={{}}
          />
        </Dialog>
      )}
    </>
  );
};

export default CuentaPorCobrarInfoButton;