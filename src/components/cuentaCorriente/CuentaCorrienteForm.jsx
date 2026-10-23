import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import {
  crearCuentaCorriente,
  actualizarCuentaCorriente,
} from "../../api/cuentaCorriente";
import { getEmpresas } from "../../api/empresa";
import { getBancos } from "../../api/banco";
import { getMonedas } from "../../api/moneda";
import { getAllTipoCuentaCorriente } from "../../api/tipoCuentaCorriente";
import PlanCuentaContableSelector from "../common/PlanCuentaContableSelector";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const CuentaCorrienteForm = ({ cuenta, isEdit, onClose, toast }) => {
  const user = useAuthStore((state) => state.user);

  // Estados del formulario
  const [empresaId, setEmpresaId] = useState(null);
  const [bancoId, setBancoId] = useState(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [numeroCuentaCCI, setNumeroCuentaCCI] = useState("");
  const [codigoSwift, setCodigoSwift] = useState("");
  const [tipoCuentaCorrienteId, setTipoCuentaCorrienteId] = useState(null);
  const [monedaId, setMonedaId] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [saldoMinimo, setSaldoMinimo] = useState(0);
  const [limiteCredito, setLimiteCredito] = useState(null);
  const [diaCierre, setDiaCierre] = useState(null);
  const [diaPago, setDiaPago] = useState(null);
  const [fechaApertura, setFechaApertura] = useState(null);
  const [fechaCierre, setFechaCierre] = useState(null);
  const [cuentaContableId, setCuentaContableId] = useState(null);
  const [activa, setActiva] = useState(true);

  // Catálogos
  const [empresas, setEmpresas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (isEdit && cuenta) {
      cargarDatosCuenta();
    }
  }, [isEdit, cuenta]);

  const cargarCatalogos = async () => {
    try {
      const [empresasData, bancosData, monedasData, tiposCuentaData] =
        await Promise.all([
          getEmpresas(),
          getBancos(),
          getMonedas(),
          getAllTipoCuentaCorriente(),
        ]);

      setEmpresas(empresasData);
      setBancos(bancosData);
      setMonedas(monedasData);
      setTiposCuenta(tiposCuentaData);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar catálogos",
        life: 3000,
      });
    }
  };

  const cargarDatosCuenta = () => {
    setEmpresaId(cuenta.empresaId ? Number(cuenta.empresaId) : null);
    setBancoId(cuenta.bancoId ? Number(cuenta.bancoId) : null);
    setNumeroCuenta(cuenta.numeroCuenta || "");
    setNumeroCuentaCCI(cuenta.numeroCuentaCCI || "");
    setCodigoSwift(cuenta.codigoSwift || "");
    setTipoCuentaCorrienteId(
      cuenta.tipoCuentaCorrienteId
        ? Number(cuenta.tipoCuentaCorrienteId)
        : null,
    );
    setMonedaId(cuenta.monedaId ? Number(cuenta.monedaId) : null);
    setDescripcion(cuenta.descripcion || "");
    setSaldoMinimo(cuenta.saldoMinimo ? Number(cuenta.saldoMinimo) : 0);
    setLimiteCredito(cuenta.limiteCredito ? Number(cuenta.limiteCredito) : null);
    setDiaCierre(cuenta.diaCierre ? Number(cuenta.diaCierre) : null);
    setDiaPago(cuenta.diaPago ? Number(cuenta.diaPago) : null);
    setFechaApertura(
      cuenta.fechaApertura ? new Date(cuenta.fechaApertura) : null,
    );
    setFechaCierre(cuenta.fechaCierre ? new Date(cuenta.fechaCierre) : null);
    setCuentaContableId(
      cuenta.cuentaContableId ? Number(cuenta.cuentaContableId) : null,
    );
    setActiva(cuenta.activa !== undefined ? cuenta.activa : true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!empresaId) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar una empresa",
        life: 3000,
      });
      return;
    }

    if (!bancoId) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar un banco",
        life: 3000,
      });
      return;
    }

    if (!numeroCuenta || numeroCuenta.trim() === "") {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe ingresar el número de cuenta",
        life: 3000,
      });
      return;
    }

    if (!tipoCuentaCorrienteId) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar el tipo de cuenta",
        life: 3000,
      });
      return;
    }

    if (!monedaId) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe seleccionar la moneda",
        life: 3000,
      });
      return;
    }

    if (!cuentaContableId) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Debe vincular con una cuenta contable del Plan de Cuentas",
        life: 3000,
      });
      return;
    }

    // La línea de crédito es la base del control de disponible de la tarjeta
    if (esTarjeta && !(Number(limiteCredito) > 0)) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Ingrese la línea de crédito de la tarjeta (monto mayor a cero)",
        life: 3000,
      });
      return;
    }

    // Advertencia formato CCI (20 dígitos) - No bloquea el guardado
    if (numeroCuentaCCI && numeroCuentaCCI.length !== 20) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: `El número CCI tiene ${numeroCuentaCCI.length} dígitos. Se recomienda que tenga 20 dígitos.`,
        life: 4000,
      });
      // No retorna, permite continuar con el guardado
    }

    // Advertencia formato SWIFT (8-11 caracteres) - No bloquea el guardado
    if (codigoSwift && (codigoSwift.length < 8 || codigoSwift.length > 11)) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: `El código SWIFT tiene ${codigoSwift.length} caracteres. Se recomienda que tenga entre 8 y 11 caracteres.`,
        life: 4000,
      });
      // No retorna, permite continuar con el guardado
    }

    const data = {
      empresaId: Number(empresaId),
      bancoId: Number(bancoId),
      numeroCuenta: numeroCuenta.trim().toUpperCase(),
      numeroCuentaCCI: numeroCuentaCCI ? numeroCuentaCCI.trim() : null,
      codigoSwift: codigoSwift ? codigoSwift.trim().toUpperCase() : null,
      tipoCuentaCorrienteId: Number(tipoCuentaCorrienteId),
      monedaId: Number(monedaId),
      descripcion: descripcion ? descripcion.trim().toUpperCase() : null,
      saldoMinimo: saldoMinimo ? Number(saldoMinimo) : 0,
      // Datos de tarjeta: solo se envían si el tipo de cuenta es tarjeta; si no, se limpian
      limiteCredito: esTarjeta && limiteCredito ? Number(limiteCredito) : null,
      diaCierre: esTarjeta && diaCierre ? Number(diaCierre) : null,
      diaPago: esTarjeta && diaPago ? Number(diaPago) : null,
      fechaApertura: fechaApertura || null,
      fechaCierre: fechaCierre || null,
      cuentaContableId: Number(cuentaContableId),
      activa: activa,
      creadoPorId: isEdit
        ? undefined
        : user?.personalId
          ? Number(user.personalId)
          : null,
      actualizadoPorId:
        isEdit && user?.personalId ? Number(user.personalId) : null,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await actualizarCuentaCorriente(cuenta.id, data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta corriente actualizada correctamente",
          life: 3000,
        });
      } else {
        await crearCuentaCorriente(data);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cuenta corriente creada correctamente",
          life: 3000,
        });
      }

      onClose(true);
    } catch (error) {
      console.error("Error al guardar cuenta:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.mensaje || "Error al guardar cuenta corriente",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Options para dropdowns
  const empresasOptions = empresas.map((e) => ({
    label: e.razonSocial,
    value: Number(e.id),
  }));

  const bancosOptions = bancos.map((b) => ({
    label: b.nombre,
    value: Number(b.id),
  }));

  const monedasOptions = monedas.map((m) => ({
    label: m.codigoSunat,
    value: Number(m.id),
  }));

  const tiposCuentaOptions = tiposCuenta.map((t) => ({
    label: t.nombre,
    value: Number(t.id),
  }));

  // El tipo de cuenta elegido define si se piden los datos de tarjeta de crédito
  const esTarjeta = Boolean(
    tiposCuenta.find((t) => Number(t.id) === Number(tipoCuentaCorrienteId))?.esTarjetaCredito,
  );

  // ✅ OPTIMIZADO: Obtener color de fondo de la moneda seleccionada
  const getMonedaColorFondo = () => {
    if (!monedaId) return "#ffffff";
    const monedaSeleccionada = monedas.find((m) => Number(m.id) === Number(monedaId));
    return monedaSeleccionada?.colorFondo || "#ffffff";
  };
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Sección 1: Datos de Identificación */}
        <div
          className="card"
          style={{ padding: "20px", backgroundColor: "#f9fafb" }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#1f2937" }}>
            <i className="pi pi-building" style={{ marginRight: "8px" }} />
            Datos de Identificación
          </h3>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1 }}>
              <label htmlFor="empresaId">Empresa *</label>
              <Dropdown
                id="empresaId"
                value={empresaId}
                options={empresasOptions}
                onChange={(e) => setEmpresaId(e.value)}
                filter
                disabled={isEdit}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="bancoId">Banco *</label>
              <Dropdown
                id="bancoId"
                value={bancoId}
                options={bancosOptions}
                onChange={(e) => setBancoId(e.value)}
                filter
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="descripcion">Descripción</label>
              <InputTextarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={1}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label htmlFor="numeroCuenta">Número de Cuenta *</label>
              <InputText
                id="numeroCuenta"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <label htmlFor="numeroCuentaCCI">Número CCI (20 dígitos)</label>
              <InputText
                id="numeroCuentaCCI"
                value={numeroCuentaCCI}
                onChange={(e) => setNumeroCuentaCCI(e.target.value)}
                maxLength={20}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                }}
              />
              <small style={{ color: "#6b7280" }}>
                Código de Cuenta Interbancaria
              </small>
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <label htmlFor="codigoSwift">
                Código SWIFT (8-11 caracteres)
              </label>
              <InputText
                id="codigoSwift"
                value={codigoSwift}
                onChange={(e) => setCodigoSwift(e.target.value)}
                maxLength={11}
                style={{
                  width: "100%",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              />
              <small style={{ color: "#6b7280" }}>
                Para transferencias internacionales
              </small>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="tipoCuentaCorrienteId">Tipo de Cuenta *</label>
            <Dropdown
              id="tipoCuentaCorrienteId"
              value={tipoCuentaCorrienteId}
              options={tiposCuentaOptions}
              onChange={(e) => setTipoCuentaCorrienteId(e.value)}
              style={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="monedaId">Moneda *</label>
            <Dropdown
              id="monedaId"
              value={monedaId}
              options={monedasOptions}
              onChange={(e) => setMonedaId(e.value)}
              disabled={isEdit}
              style={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
            {isEdit && (
              <small style={{ color: "#ef4444" }}>
                No se puede cambiar la moneda en edición
              </small>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="saldoMinimo">Saldo Mínimo</label>
            <InputNumber
              id="saldoMinimo"
              value={saldoMinimo}
              onValueChange={(e) => setSaldoMinimo(e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              placeholder="0.00"
              style={{
                width: "100%",
              }}
              inputStyle={{
                fontWeight: "bold",
                backgroundColor: getMonedaColorFondo(),
                fontSize: "16px",
              }}
            />
            <small style={{ color: "#6b7280" }}>
              Alertas cuando el saldo sea menor
            </small>
          </div>
        </div>

        {/* Sección tarjeta de crédito: solo para tipos de cuenta marcados como tarjeta */}
        {esTarjeta && (
          <div className="card" style={{ padding: "20px", backgroundColor: "#eef2ff" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#3730a3" }}>
              <i className="pi pi-credit-card" style={{ marginRight: "8px" }} />
              Datos de la Tarjeta de Crédito
            </h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label htmlFor="limiteCredito">Línea de Crédito *</label>
                <InputNumber
                  id="limiteCredito"
                  value={limiteCredito}
                  onValueChange={(e) => setLimiteCredito(e.value)}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  placeholder="0.00"
                  style={{ width: "100%" }}
                  inputStyle={{ fontWeight: "bold" }}
                />
                <small style={{ color: "#6b7280" }}>Monto máximo que puede gastarse con la tarjeta</small>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="diaCierre">Día de Cierre</label>
                <InputNumber
                  id="diaCierre"
                  value={diaCierre}
                  onValueChange={(e) => setDiaCierre(e.value)}
                  useGrouping={false}
                  min={1}
                  max={31}
                  placeholder="1 - 31"
                  style={{ width: "100%" }}
                />
                <small style={{ color: "#6b7280" }}>Día del mes en que cierra el estado de cuenta</small>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label htmlFor="diaPago">Día de Pago</label>
                <InputNumber
                  id="diaPago"
                  value={diaPago}
                  onValueChange={(e) => setDiaPago(e.value)}
                  useGrouping={false}
                  min={1}
                  max={31}
                  placeholder="1 - 31"
                  style={{ width: "100%" }}
                />
                <small style={{ color: "#6b7280" }}>Día del mes en que vence el pago</small>
              </div>
            </div>
          </div>
        )}

        {/* Sección 3: VinculacióFn Contable */}
        <div
          className="card"
          style={{ padding: "20px", backgroundColor: "#fef3c7" }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#92400e" }}>
            <i className="pi pi-link" style={{ marginRight: "8px" }} />
            Vinculación con Plan Contable (OBLIGATORIO)
          </h3>

          <div>
            <PlanCuentaContableSelector
              value={cuentaContableId ? Number(cuentaContableId) : null}
              onChange={(id) => setCuentaContableId(id)}
              label="Cuenta Contable *"
              placeholder="Seleccionar cuenta del Plan Contable"
              disabled={!empresaId}
              showClearButton={true}
            />
            <small style={{ color: "#92400e", fontWeight: "bold" }}>
              <i
                className="pi pi-exclamation-triangle"
                style={{ marginRight: "4px" }}
              />
              Requerido para generar asientos contables automáticamente. Ej: 104111 - BCP SOLES (cuenta bancaria) o 451103 - TARJETA DE CREDITO (tarjeta)
            </small>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <label htmlFor="fechaApertura">Fecha de Apertura</label>
            <Calendar
              id="fechaApertura"
              value={fechaApertura}
              onChange={(e) => setFechaApertura(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="fechaCierre">Fecha de Cierre</label>
            <Calendar
              id="fechaCierre"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
              style={{ width: "100%" }}
            />
            <small style={{ color: "#6b7280" }}>
              Solo si la cuenta está cerrada
            </small>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>
              Estado de la Cuenta
            </label>
            <Button
              type="button"
              label={activa ? "CUENTA ACTIVA" : "CUENTA INACTIVA"}
              icon={activa ? "pi pi-check-circle" : "pi pi-times-circle"}
              onClick={() => setActiva(!activa)}
              className={activa ? "p-button-success" : "p-button-danger"}
              style={{
                width: "100%",
                fontWeight: "bold",
              }}
              tooltip={
                activa
                  ? "Clic para desactivar la cuenta"
                  : "Clic para activar la cuenta"
              }
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>

        {/* Botones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={() => onClose(false)}
            className="p-button-secondary"
            type="button"
          />
          <Button
            label={isEdit ? "Actualizar" : "Guardar"}
            icon="pi pi-check"
            loading={loading}
            type="submit"
            className="p-button-success"
          />
        </div>
      </div>
    </form>
  );
};

export default CuentaCorrienteForm;
