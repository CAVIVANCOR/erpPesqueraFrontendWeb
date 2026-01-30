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
      tipoLinea: null,
      montoAprobado: 0,
      monedaId: null,
      tasaInteres: 0,
      comisionMantenimiento: null,
      comisionUtilizacion: null,
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
    const [prestamos, setPrestamos] = useState([]);

    const tiposLinea = [
      { label: "Revolvente", value: "REVOLVENTE" },
      { label: "Carta de Crédito", value: "CARTA_CREDITO" },
      { label: "Garantía Bancaria", value: "GARANTIA_BANCARIA" },
      { label: "Sobregiro", value: "SOBREGIRO" },
    ];

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
          tipoLinea: lineaCredito.tipoLinea,
          montoAprobado: parseFloat(lineaCredito.montoAprobado) || 0,
          monedaId: lineaCredito.monedaId,
          tasaInteres: parseFloat(lineaCredito.tasaInteres) || 0,
          comisionMantenimiento: lineaCredito.comisionMantenimiento
            ? parseFloat(lineaCredito.comisionMantenimiento)
            : null,
          comisionUtilizacion: lineaCredito.comisionUtilizacion
            ? parseFloat(lineaCredito.comisionUtilizacion)
            : null,
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

        // Cargar préstamos asociados si existe la línea de crédito
        if (lineaCredito?.prestamos) {
          setPrestamos(lineaCredito.prestamos);
        }
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

        if (lineaCredito?.id) {
          await updateLineaCredito(lineaCredito.id, dataToSend);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Línea de crédito actualizada",
            life: 3000,
          });
        } else {
          await createLineaCredito(dataToSend);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Línea de crédito creada",
            life: 3000,
          });
        }

        if (onSave) onSave();
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
      if (!formData.tipoLinea) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Seleccione el tipo de línea",
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
            <label htmlFor="tipoLinea">Tipo de Línea *</label>
            <Dropdown
              id="tipoLinea"
              value={formData.tipoLinea}
              options={tiposLinea}
              onChange={(e) => setFormData({ ...formData, tipoLinea: e.value })}
              placeholder="Seleccione tipo de línea"
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
            <label htmlFor="comisionMantenimiento">
              Comisión Mantenimiento
            </label>
            <InputNumber
              id="comisionMantenimiento"
              value={formData.comisionMantenimiento}
              onValueChange={(e) =>
                setFormData({ ...formData, comisionMantenimiento: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="comisionUtilizacion">
              Comisión Utilización (%)
            </label>
            <InputNumber
              id="comisionUtilizacion"
              value={formData.comisionUtilizacion}
              onValueChange={(e) =>
                setFormData({ ...formData, comisionUtilizacion: e.value })
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
        <div className="grid">
          <div className="col-12 md:col-6"></div>

          <div className="col-12 md:col-6"></div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="observaciones">Observaciones</label>
              <InputTextarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sección de Préstamos Asociados - Solo en modo edición */}
        {lineaCredito && prestamos && prestamos.length > 0 && (
          <Panel
            header={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="pi pi-list" style={{ fontSize: "1.2rem" }}></i>
                <span style={{ fontWeight: "bold" }}>
                  Préstamos Asociados a esta Línea de Crédito (
                  {prestamos.length})
                </span>
              </div>
            }
            toggleable
            collapsed={false}
            style={{ marginTop: 20, marginBottom: 20 }}
          >
            <DataTable
              value={[...prestamos].sort((a, b) => {
                const fechaA = a.fechaDesembolso ? new Date(a.fechaDesembolso) : new Date(0);
                const fechaB = b.fechaDesembolso ? new Date(b.fechaDesembolso) : new Date(0);
                return fechaB - fechaA; // Más reciente primero por defecto
              })}
              size="small"
              stripedRows
              showGridlines
              emptyMessage="No hay préstamos asociados"
              paginator={prestamos.length > 10}
              rows={30}
              rowsPerPageOptions={[30, 60, 90]}
              sortMode="multiple"
              removableSort
            >
                           <Column
                field="numeroPrestamo"
                header="Número Préstamo"
                style={{ fontWeight: "bold", minWidth: "150px" }}
                sortable
              />
              <Column
                field="moneda.codigoSunat"
                header="Moneda"
                body={(rowData) => (
                  <Tag
                    value={rowData.moneda?.codigoSunat || "N/A"}
                    severity={
                      rowData.moneda?.codigoSunat === "USD" ? "success" : "info"
                    }
                  />
                )}
                style={{ minWidth: "100px" }}
                sortable
                sortField="moneda.codigoSunat"
              />
              <Column
                field="montoDesembolsado"
                header="Monto Desembolsado"
                body={(rowData) => {
                  const moneda = rowData.moneda?.codigoSunat || "USD";
                  const monto = parseFloat(rowData.montoDesembolsado || 0);
                  return new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: moneda === "PEN" ? "PEN" : "USD",
                    minimumFractionDigits: 2,
                  }).format(monto);
                }}
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  minWidth: "150px",
                }}
                sortable
              />
              <Column
                header={`Monto en ${lineaCredito.moneda?.codigoSunat || 'USD'}`}
                body={(rowData) => {
                  const monedaLinea = lineaCredito.moneda?.codigoSunat || "USD";
                  const monedaPrestamo = rowData.moneda?.codigoSunat || "USD";
                  const monto = parseFloat(rowData.montoDesembolsado || 0);
                  
                  // Si es la misma moneda, no hay conversión
                  if (monedaLinea === monedaPrestamo) {
                    return new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency: monedaLinea === "PEN" ? "PEN" : "USD",
                      minimumFractionDigits: 2,
                    }).format(monto);
                  }
                  
                  // Si necesita conversión, usar TC 3.8 (default)
                  const tc = 3.8;
                  let montoConvertido = monto;
                  
                  if (monedaLinea === "USD" && monedaPrestamo === "PEN") {
                    montoConvertido = monto / tc;
                  } else if (monedaLinea === "PEN" && monedaPrestamo === "USD") {
                    montoConvertido = monto * tc;
                  }
                  
                  return new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: monedaLinea === "PEN" ? "PEN" : "USD",
                    minimumFractionDigits: 2,
                  }).format(montoConvertido);
                }}
                style={{ textAlign: "right", fontWeight: "bold", minWidth: "180px", backgroundColor: "#e3f2fd" }}
                sortable
                sortField="montoDesembolsado"
                footer={() => {
                  const monedaLinea = lineaCredito.moneda?.codigoSunat || "USD";
                  let total = 0;
                  
                  prestamos.forEach((prestamo) => {
                    const monedaPrestamo = prestamo.moneda?.codigoSunat || "USD";
                    const monto = parseFloat(prestamo.montoDesembolsado || 0);
                    const tc = 3.8;
                    
                    if (monedaLinea === monedaPrestamo) {
                      total += monto;
                    } else if (monedaLinea === "USD" && monedaPrestamo === "PEN") {
                      total += monto / tc;
                    } else if (monedaLinea === "PEN" && monedaPrestamo === "USD") {
                      total += monto * tc;
                    }
                  });
                  
                  return (
                    <div style={{ textAlign: "right", fontWeight: "bold", fontSize: "1.1rem", color: "#1976d2" }}>
                      {new Intl.NumberFormat("es-PE", {
                        style: "currency",
                        currency: monedaLinea === "PEN" ? "PEN" : "USD",
                        minimumFractionDigits: 2,
                      }).format(total)}
                    </div>
                  );
                }}
              />
              <Column
                header="TC Usado"
                body={(rowData) => {
                  const monedaLinea = lineaCredito.moneda?.codigoSunat || "USD";
                  const monedaPrestamo = rowData.moneda?.codigoSunat || "USD";
                  
                  // Si es la misma moneda, no hay TC
                  if (monedaLinea === monedaPrestamo) {
                    return <Tag value="N/A" severity="secondary" />;
                  }
                  
                  // TC por defecto
                  const tc = 3.8;
                  return (
                    <Tag 
                      value={tc.toFixed(4)} 
                      severity="warning"
                      style={{ fontWeight: "bold" }}
                    />
                  );
                }}
                style={{ textAlign: "center", minWidth: "100px" }}
              />
              <Column
                field="fechaDesembolso"
                header="Fecha Desembolso"
                body={(rowData) => {
                  if (!rowData.fechaDesembolso) return "N/A";
                  return new Date(rowData.fechaDesembolso).toLocaleDateString(
                    "es-PE",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    },
                  );
                }}
                style={{ minWidth: "120px" }}
                sortable
              />
              <Column
                field="fechaContrato"
                header="Fecha Contrato"
                body={(rowData) => {
                  if (!rowData.fechaContrato) return "N/A";
                  return new Date(rowData.fechaContrato).toLocaleDateString(
                    "es-PE",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    },
                  );
                }}
                style={{ minWidth: "120px" }}
                sortable
              />
            </DataTable>

            {/* Resumen de totales */}
            <div
              style={{
                marginTop: 15,
                padding: 15,
                backgroundColor: "#f8f9fa",
                borderRadius: 5,
              }}
            >
              {/* Totales por moneda */}
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                  marginBottom: 15,
                  paddingBottom: 15,
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666", fontWeight: "bold" }}>
                    Total Préstamos en SOLES (PEN):
                  </small>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      color: "#00897B",
                    }}
                  >
                    {new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency: "PEN",
                      minimumFractionDigits: 2,
                    }).format(
                      prestamos
                        .filter((p) => p.moneda?.codigoSunat === "PEN")
                        .reduce(
                          (sum, p) =>
                            sum + parseFloat(p.montoDesembolsado || 0),
                          0
                        )
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666", fontWeight: "bold" }}>
                    Total Préstamos en DÓLARES (USD):
                  </small>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      color: "#1976D2",
                    }}
                  >
                    {new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    }).format(
                      prestamos
                        .filter((p) => p.moneda?.codigoSunat === "USD")
                        .reduce(
                          (sum, p) =>
                            sum + parseFloat(p.montoDesembolsado || 0),
                          0
                        )
                    )}
                  </div>
                </div>
              </div>

              {/* Totales de la línea de crédito */}
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666" }}>
                    Total Desembolsado en {lineaCredito.moneda?.codigoSunat || "USD"}:
                  </small>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency:
                        lineaCredito.moneda?.codigoSunat === "PEN"
                          ? "PEN"
                          : "USD",
                      minimumFractionDigits: 2,
                    }).format(lineaCredito.montoUtilizado || 0)}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666" }}>Monto Aprobado:</small>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#4CAF50",
                    }}
                  >
                    {new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency:
                        lineaCredito.moneda?.codigoSunat === "PEN"
                          ? "PEN"
                          : "USD",
                      minimumFractionDigits: 2,
                    }).format(parseFloat(lineaCredito.montoAprobado || 0))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666" }}>Disponible:</small>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#FF9800",
                    }}
                  >
                    {new Intl.NumberFormat("es-PE", {
                      style: "currency",
                      currency:
                        lineaCredito.moneda?.codigoSunat === "PEN"
                          ? "PEN"
                          : "USD",
                      minimumFractionDigits: 2,
                    }).format(lineaCredito.montoDisponible || 0)}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <small style={{ color: "#666" }}>% Utilizado:</small>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#E91E63",
                    }}
                  >
                    {(
                      (lineaCredito.montoUtilizado /
                        parseFloat(lineaCredito.montoAprobado || 1)) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>
            </div>
          </Panel>
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
