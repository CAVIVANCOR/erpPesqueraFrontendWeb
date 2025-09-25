/**
 * EntregasARendirTemporadaCard.jsx
 *
 * Card para gestionar la entrega a rendir única por temporada de pesca.
 * Muestra el registro único de EntregaARendir y permite gestionar sus movimientos detallados.
 * Se habilita solo cuando TemporadaPesca.temporadaPescaIniciada = true.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { Badge } from "primereact/badge"; // Import Badge
import EntregaARendirForm from "./EntregaARendirForm";
import DetEntregaRendirPescaIndustrial from "./DetEntregaRendirPescaIndustrial";
import { getResponsiveFontSize } from "../../utils/utils";
import {
  getAllEntregaARendir,
  crearEntregaARendir,
  actualizarEntregaARendir,
  eliminarEntregaARendir,
} from "../../api/entregaARendir";
import {
  getAllDetMovsEntregaRendir,
  crearDetMovsEntregaRendir,
  actualizarDetMovsEntregaRendir,
  eliminarDetMovsEntregaRendir,
} from "../../api/detMovsEntregaRendir";
import { getEntidadesComerciales } from "../../api/entidadComercial";

const EntregasARendirTemporadaCard = ({
  temporadaPescaId,
  temporadaPescaIniciada = false,
  personal = [],
  centrosCosto = [],
  tiposMovimiento = [],
  onDataChange,
}) => {
  const toast = useRef(null);

  // Estados para EntregaARendir
  const [entregaARendir, setEntregaARendir] = useState(null);
  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  const [responsableEntrega, setResponsableEntrega] = useState(null);
  const [centroCostoEntrega, setCentroCostoEntrega] = useState(null);
  const [entidadesComerciales, setEntidadesComerciales] = useState([]);

  // Estados para cálculos automáticos
  const [totalAsignacionesEntregasRendir, setTotalAsignacionesEntregasRendir] =
    useState(0);
  const [totalGastosEntregasRendir, setTotalGastosEntregasRendir] = useState(0);
  const [totalSaldoEntregasRendir, setTotalSaldoEntregasRendir] = useState(0);

  // Estados para DetMovsEntregaRendir
  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Estados para filtros de movimientos
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState(null);
  const [filtroCentroCosto, setFiltroCentroCosto] = useState(null);
  const [filtroIngresoEgreso, setFiltroIngresoEgreso] = useState(null);
  const [filtroValidacionTesoreria, setFiltroValidacionTesoreria] = useState(null);

  const cargarEntidadesComerciales = async () => {
    try {
      const data = await getEntidadesComerciales();
      setEntidadesComerciales(data);
    } catch (error) {
      console.error("Error al cargar entidades comerciales:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las entidades comerciales",
      });
    }
  };

  // Cargar entrega a rendir de la temporada
  const cargarEntregaARendir = async () => {
    if (!temporadaPescaId) return;

    try {
      setLoadingEntrega(true);
      const entregasData = await getAllEntregaARendir();
      const entregaTemporada = entregasData.find(
        (entrega) =>
          Number(entrega.temporadaPescaId) === Number(temporadaPescaId)
      );
      setEntregaARendir(entregaTemporada || null);
    } catch (error) {
      console.error("Error al cargar entrega a rendir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar entrega a rendir",
        life: 3000,
      });
    } finally {
      setLoadingEntrega(false);
    }
  };

  // Cargar movimientos de la entrega
  const cargarMovimientos = async () => {
    if (!entregaARendir?.id) return;

    try {
      setLoadingMovimientos(true);
      const movimientosData = await getAllDetMovsEntregaRendir();
      const movimientosEntrega = movimientosData.filter(
        (mov) => Number(mov.entregaARendirId) === Number(entregaARendir.id)
      );
      setMovimientos(movimientosEntrega);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar movimientos de entrega",
        life: 3000,
      });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  // Efectos
  useEffect(() => {
    cargarEntregaARendir();
    cargarEntidadesComerciales(); // Nueva llamada
  }, [temporadaPescaId]);

  useEffect(() => {
    if (entregaARendir) {
      cargarMovimientos();
    }
  }, [entregaARendir]);

  useEffect(() => {
    obtenerResponsableEntrega();
    obtenerCentroCostoEntrega();
  }, [entregaARendir, personal, centrosCosto]);

  // Handlers para EntregaARendir
  const handleEditarEntrega = () => {
    setShowEntregaForm(true);
  };

  const handleGuardarEntrega = async (data) => {
    try {
      if (entregaARendir) {
        await actualizarEntregaARendir(entregaARendir.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega a rendir actualizada correctamente",
          life: 3000,
        });
      } else {
        const nuevaEntrega = await crearEntregaARendir({
          ...data,
          temporadaPescaId: Number(temporadaPescaId),
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Entrega a rendir creada correctamente",
          life: 3000,
        });
      }

      setShowEntregaForm(false);
      cargarEntregaARendir();
      onDataChange?.();
    } catch (error) {
      console.error("Error al guardar entrega:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar entrega a rendir",
        life: 3000,
      });
    }
  };

  // Función para obtener el responsable específico de la entrega a rendir
  // Actualiza el estado responsableEntrega
  const obtenerResponsableEntrega = () => {
    if (!entregaARendir?.respEntregaRendirId || !personal.length) {
      setResponsableEntrega(null);
      return;
    }

    const responsable = personal.find(
      (p) => Number(p.id) === Number(entregaARendir.respEntregaRendirId)
    );

    if (!responsable) {
      setResponsableEntrega(null);
      return;
    }

    const responsableNormalizado = {
      id: Number(responsable.id),
      label: `${responsable.nombres} ${responsable.apellidos}`.trim(),
    };

    setResponsableEntrega(responsableNormalizado);
  };

  /**
   * Función para obtener el centro de costo específico de la entrega a rendir
   * Actualiza el estado centroCostoEntrega
   */
  const obtenerCentroCostoEntrega = () => {
    if (!entregaARendir?.centroCostoId || !centrosCosto.length) {
      setCentroCostoEntrega(null);
      return;
    }

    const centroCosto = centrosCosto.find(
      (c) => Number(c.id) === Number(entregaARendir.centroCostoId)
    );

    if (!centroCosto) {
      setCentroCostoEntrega(null);
      return;
    }

    const centroCostoNormalizado = {
      id: Number(centroCosto.id),
      label: centroCosto.Codigo + " - " + centroCosto.Nombre || "N/A",
    };
    setCentroCostoEntrega(centroCostoNormalizado);
  };

  // Renderizado condicional si la temporada no está iniciada
  if (!temporadaPescaIniciada) {
    return (
      <Card title="Entregas a Rendir" className="mb-4">
        <Message
          severity="info"
          text="La temporada de pesca debe estar iniciada para gestionar entregas a rendir"
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        {/* Sección de EntregaARendir */}
        <div className="mb-4">
          <h2 className="text-900 font-medium mb-3">
            {entregaARendir
              ? `Entrega a Rendir ID: ${entregaARendir.id}`
              : "Entrega a Rendir"}
          </h2>
          {entregaARendir ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexDirection: window.innerWidth < 768 ? "column" : "row",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Responsable
                </label>
                <Dropdown
                  value={responsableEntrega?.id}
                  options={responsableEntrega ? [responsableEntrega] : []}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Sin responsable asignado"
                  disabled
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Estado
                </label>
                <Button
                  label={
                    entregaARendir.entregaLiquidada
                      ? "TEMPORADA LIQUIDADA"
                      : "PENDIENTE LIQUIDACION"
                  }
                  severity={
                    entregaARendir.entregaLiquidada ? "success" : "danger"
                  }
                  className="w-full"
                  disabled
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Fecha Liquidación
                </label>
                <InputText
                  value={
                    entregaARendir.fechaLiquidacion
                      ? new Date(
                          entregaARendir.fechaLiquidacion
                        ).toLocaleDateString("es-PE")
                      : "N/A"
                  }
                  readOnly
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-900 font-medium mb-2">
                  Centro de Costo
                </label>
                <Dropdown
                  value={centroCostoEntrega?.id}
                  options={centroCostoEntrega ? [centroCostoEntrega] : []}
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Sin centro de costo asignado"
                  disabled
                  className="w-full"
                  style={{ fontWeight: "bold" }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Message
                severity="warn"
                text="No se ha creado la entrega a rendir para esta temporada"
              />
              <Button
                label="Crear Entrega"
                icon="pi pi-plus"
                className="mt-3"
                onClick={() => setShowEntregaForm(true)}
              />
            </div>
          )}
        </div>

        {entregaARendir && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              marginTop: 20,
              padding: 15,
              backgroundColor: "#d4edda",
              borderRadius: 8,
              border: "1px solid #c3e6cb",
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Total Asignaciones
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalAsignacionesEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: "#155724",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Total Gastos
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalGastosEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: "#155724",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-900 font-medium mb-2">
                Saldo Total
              </label>
              <InputText
                value={new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalSaldoEntregasRendir)}
                readOnly
                className="w-full"
                style={{
                  fontWeight: "bold",
                  backgroundColor: "#d4edda",
                  border: "1px solid #28a745",
                  color: totalSaldoEntregasRendir >= 0 ? "#155724" : "#721c24",
                }}
              />
            </div>
          </div>
        )}

        <Divider />

        {/* Sección de DetMovsEntregaRendir */}
        <DetEntregaRendirPescaIndustrial
          entregaARendir={entregaARendir}
          movimientos={movimientos}
          personal={personal}
          centrosCosto={centrosCosto}
          tiposMovimiento={tiposMovimiento}
          entidadesComerciales={entidadesComerciales} // Nueva prop
          temporadaPescaIniciada={temporadaPescaIniciada}
          loading={loadingMovimientos}
          selectedMovimientos={selectedMovimientos}
          onSelectionChange={(e) => setSelectedMovimientos(e.value)}
          onDataChange={() => {
            cargarMovimientos();
            onDataChange?.();
          }}
        />
      </Card>

      <Toast ref={toast} />
    </>
  );
};

export default EntregasARendirTemporadaCard;
