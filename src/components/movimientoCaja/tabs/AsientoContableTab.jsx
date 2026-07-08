// src/components/movimientoCaja/tabs/AsientoContableTab.jsx
import React, { useState, useEffect } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { formatearNumero } from "../../../utils/utils";

export default function AsientoContableTab({ movimiento, toast }) {
  const [asiento, setAsiento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (movimiento?.asientosGenerados) {
      fetchAsientoContable();
    }
  }, [movimiento]);

  const fetchAsientoContable = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar API para obtener asiento contable
      // const asientoData = await getAsientoByMovimiento(movimiento.id);
      // setAsiento(asientoData);
      
      // Simulación temporal
      setTimeout(() => {
        setAsiento({
          numero: "ASI-2026-00123",
          fecha: new Date(),
          detalles: [
            {
              cuenta: "10.1.1.01",
              descripcion: "Caja y Bancos - Banco BCP",
              debe: movimiento.monto,
              haber: 0
            },
            {
              cuenta: "12.1.1.01",
              descripcion: "Cuentas por Cobrar Comerciales",
              debe: 0,
              haber: movimiento.monto
            }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error al cargar asiento contable:", err);
      setError("Error al cargar el asiento contable");
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el asiento contable",
        life: 3000
      });
      setLoading(false);
    }
  };

  const calcularTotales = () => {
    if (!asiento?.detalles) return { totalDebe: 0, totalHaber: 0 };
    
    const totalDebe = asiento.detalles.reduce((sum, det) => sum + Number(det.debe || 0), 0);
    const totalHaber = asiento.detalles.reduce((sum, det) => sum + Number(det.haber || 0), 0);
    
    return { totalDebe, totalHaber };
  };

  const debeTemplate = (rowData) => {
    return (
      <div className="text-right">
        {rowData.debe > 0 ? formatearNumero(rowData.debe) : "-"}
      </div>
    );
  };

  const haberTemplate = (rowData) => {
    return (
      <div className="text-right">
        {rowData.haber > 0 ? formatearNumero(rowData.haber) : "-"}
      </div>
    );
  };

  if (!movimiento?.asientosGenerados) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="warn"
          text="Este movimiento aún no tiene asiento contable generado"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="error"
          text={error}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  const { totalDebe, totalHaber } = calcularTotales();

  return (
    <div className="grid">
      <div className="col-12">
        <Panel header="Información del Asiento Contable" className="mb-3">
          <div className="grid">
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Número de Asiento:</label>
                <p>{asiento?.numero || "-"}</p>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Fecha:</label>
                <p>{asiento?.fecha ? new Date(asiento.fecha).toLocaleDateString() : "-"}</p>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Estado:</label>
                <p>
                  <Tag
                    value={movimiento.asientosGenerados ? "Generado" : "Pendiente"}
                    severity={movimiento.asientosGenerados ? "success" : "warning"}
                    icon={movimiento.asientosGenerados ? "pi pi-check" : "pi pi-clock"}
                  />
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="col-12">
        <Panel header="Detalle del Asiento" className="mb-3">
          <DataTable
            value={asiento?.detalles || []}
            emptyMessage="No hay detalles del asiento"
            footer={
              <div className="grid">
                <div className="col-12 md:col-8 text-right font-bold">
                  TOTALES:
                </div>
                <div className="col-12 md:col-2 text-right font-bold text-primary">
                  {formatearNumero(totalDebe)}
                </div>
                <div className="col-12 md:col-2 text-right font-bold text-primary">
                  {formatearNumero(totalHaber)}
                </div>
              </div>
            }
          >
            <Column
              field="cuenta"
              header="Cuenta"
              style={{ width: "120px" }}
            />
            <Column
              field="descripcion"
              header="Descripción"
              style={{ minWidth: "300px" }}
            />
            <Column
              field="debe"
              header="Debe"
              body={debeTemplate}
              style={{ width: "150px" }}
            />
            <Column
              field="haber"
              header="Haber"
              body={haberTemplate}
              style={{ width: "150px" }}
            />
          </DataTable>

          {totalDebe !== totalHaber && (
            <Message
              severity="error"
              text={`El asiento está descuadrado. Diferencia: ${formatearNumero(Math.abs(totalDebe - totalHaber))}`}
              className="mt-3"
            />
          )}
        </Panel>
      </div>
    </div>
  );
}