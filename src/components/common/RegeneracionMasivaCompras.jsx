// src/components/common/RegeneracionMasivaCompras.jsx
import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { generarBorradorAsiento, guardarAsientoContable, eliminarAsientoContable } from "../../api/ordenCompra";
import { ESTADO_ASIENTO_CONTABLE } from "../../utils/estados.constants";

/**
 * Componente genérico para regeneración masiva de CxP y Asientos Contables
 * Proceso en 4 FASES ATÓMICAS SECUENCIALES:
 * FASE 1: Aprobar TODAS las PENDIENTES
 * FASE 2: Generar CxP TODAS
 * FASE 3: Regenerar TODAS las CxP
 * FASE 4: Regenerar TODOS los Asientos
 * 
 * Cada fase actualiza la BD y recarga los registros para trabajar con datos actualizados
 */
export default function RegeneracionMasivaCompras({
  visible,
  onHide,
  registros = [],
  onComplete,
  toast,
  aprobarOrdenCompra,
  generarCuentaPorPagar,
}) {
  const { usuario } = useAuthStore();
  const [etapa, setEtapa] = useState("confirmacion");
  const [fase, setFase] = useState(1);
  const [progreso, setProgreso] = useState({
    total: 0,
    procesados: 0,
    exitosos: 0,
    errores: 0,
    tiempoInicio: null
  });
  const [log, setLog] = useState([]);
  const [resultados, setResultados] = useState([]);

  const contarPorTipo = () => {
    const gerenciales = registros.filter(r => r.esGerencial === true).length;
    const fiscales = registros.filter(r => r.esGerencial === false).length;
    const pendientes = registros.filter(r => Number(r.estadoId) === 38).length;
    return { total: registros.length, gerenciales, fiscales, pendientes };
  };

  // Función para recargar un registro desde el backend
  const recargarRegistro = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ordenes-compra/${id}`,
        {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`
          }
        }
      );
      if (!response.ok) throw new Error("Error al recargar registro");
      return await response.json();
    } catch (error) {
      console.error(`Error recargando registro ${id}:`, error);
      return null;
    }
  };

  // Función para recargar todos los registros desde el backend
  const recargarTodosLosRegistros = async (registrosActuales) => {
    const registrosActualizados = [];
    for (const registro of registrosActuales) {
      const registroActualizado = await recargarRegistro(registro.id);
      if (registroActualizado) {
        registrosActualizados.push(registroActualizado);
      } else {
        registrosActualizados.push(registro);
      }
    }
    return registrosActualizados;
  };

  const iniciarRegeneracion = async () => {
    setEtapa("procesando");
    setFase(1);
    setProgreso({
      total: registros.length,
      procesados: 0,
      exitosos: 0,
      errores: 0,
      tiempoInicio: new Date()
    });
    setLog([]);
    setResultados([]);

    const resultadosTemp = [];
    let registrosActualizados = [...registros];

    // ═══════════════════════════════════════════════════════
    // FASE 1: APROBAR TODAS LAS PENDIENTES
    // ═══════════════════════════════════════════════════════
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);
    setLog(prev => [...prev, "🔄 FASE 1: APROBANDO PENDIENTES..."]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);

    const pendientes = registrosActualizados.filter(r => Number(r.estadoId) === 38);
    setLog(prev => [...prev, `📊 Total registros: ${registrosActualizados.length}`]);
    setLog(prev => [...prev, `📊 Registros PENDIENTES (38): ${pendientes.length}`]);
    setLog(prev => [...prev, `📊 Estados encontrados: ${[...new Set(registrosActualizados.map(r => r.estadoId))].join(', ')}`]);
    setLog(prev => [...prev, ""]);

    for (let i = 0; i < pendientes.length; i++) {
      const registro = pendientes[i];

      setProgreso(prev => ({
        ...prev,
        procesados: i + 1,
        total: pendientes.length
      }));

      try {
        await aprobarOrdenCompra(registro.id);
      } catch (error) {
        setLog(prev => [...prev, `  ❌ OrdenCompra #${registro.id} - ${error.response?.data?.mensaje || error.message}`]);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setLog(prev => [...prev, ""]);
    setLog(prev => [...prev, `✅ FASE 1 COMPLETADA - ${pendientes.length} registros procesados`]);
    setLog(prev => [...prev, ""]);

    // RECARGAR REGISTROS DESPUÉS DE FASE 1
    if (pendientes.length > 0) {
      setLog(prev => [...prev, "🔄 Recargando registros desde BD..."]);
      registrosActualizados = await recargarTodosLosRegistros(registrosActualizados);

      const estadosDespuesRecarga = registrosActualizados.slice(0, 5).map(r => `#${r.id}:${r.estadoId}`).join(', ');
      setLog(prev => [...prev, `📊 Estados después de recargar (primeros 5): ${estadosDespuesRecarga}`]);
      setLog(prev => [...prev, `📊 PENDIENTES después de recargar: ${registrosActualizados.filter(r => Number(r.estadoId) === 38).length}`]);
      setLog(prev => [...prev, `📊 APROBADAS después de recargar: ${registrosActualizados.filter(r => Number(r.estadoId) === 39).length}`]);

      setLog(prev => [...prev, "✅ Registros actualizados desde BD"]);
      setLog(prev => [...prev, ""]);
    }

    // ═══════════════════════════════════════════════════════
    // FASE 2: GENERAR CxP TODAS
    // ═══════════════════════════════════════════════════════
    setFase(2);
    setProgreso(prev => ({
      ...prev,
      procesados: 0,
      total: registrosActualizados.length
    }));

    setLog(prev => [...prev, "═══════════════════════════════════════════"]);
    setLog(prev => [...prev, "🔄 FASE 2: GENERANDO CxP..."]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);

    const noGeneradas = registrosActualizados.filter(r => Number(r.estadoId) < 40);
    setLog(prev => [...prev, `📊 Registros por generar CxP: ${noGeneradas.length}`]);
    setLog(prev => [...prev, `📊 Estados actuales: ${[...new Set(registrosActualizados.map(r => r.estadoId))].join(', ')}`]);
    setLog(prev => [...prev, ""]);

    for (let i = 0; i < registrosActualizados.length; i++) {
      const registro = registrosActualizados[i];

      setProgreso(prev => ({
        ...prev,
        procesados: i + 1
      }));

      try {
        if (Number(registro.estadoId) < 40) {
          await generarCuentaPorPagar(registro.id);
        }
      } catch (error) {
        setLog(prev => [...prev, `  ❌ OrdenCompra #${registro.id} - ${error.response?.data?.mensaje || error.message}`]);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setLog(prev => [...prev, ""]);
    setLog(prev => [...prev, `✅ FASE 2 COMPLETADA - ${registrosActualizados.length} registros procesados`]);
    setLog(prev => [...prev, ""]);

    // RECARGAR REGISTROS DESPUÉS DE FASE 2
    if (noGeneradas.length > 0) {
      setLog(prev => [...prev, "🔄 Recargando registros desde BD..."]);
      registrosActualizados = await recargarTodosLosRegistros(registrosActualizados);

      const estadosDespuesRecarga = registrosActualizados.slice(0, 5).map(r => `#${r.id}:${r.estadoId}`).join(', ');
      setLog(prev => [...prev, `📊 Estados después de recargar (primeros 5): ${estadosDespuesRecarga}`]);

      setLog(prev => [...prev, "✅ Registros actualizados desde BD"]);
      setLog(prev => [...prev, ""]);
    }

    // ═══════════════════════════════════════════════════════
    // FASE 3: REGENERAR TODAS LAS CxP
    // ═══════════════════════════════════════════════════════
    setFase(3);
    setProgreso(prev => ({
      ...prev,
      procesados: 0,
      exitosos: 0,
      errores: 0
    }));

    setLog(prev => [...prev, "═══════════════════════════════════════════"]);
    setLog(prev => [...prev, "🔄 FASE 3: REGENERANDO CxP..."]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);

    for (let i = 0; i < registrosActualizados.length; i++) {
      const registro = registrosActualizados[i];

      setProgreso(prev => ({
        ...prev,
        procesados: i + 1
      }));

      try {
        await generarCuentaPorPagar(registro.id);
      } catch (error) {
        setLog(prev => [...prev, `  ❌ OrdenCompra #${registro.id} - ${error.response?.data?.mensaje || error.message}`]);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setLog(prev => [...prev, ""]);
    setLog(prev => [...prev, `✅ FASE 3 COMPLETADA - ${registrosActualizados.length} CxP regeneradas`]);
    setLog(prev => [...prev, ""]);

    // RECARGAR REGISTROS DESPUÉS DE FASE 3
    setLog(prev => [...prev, "🔄 Recargando registros desde BD..."]);
    registrosActualizados = await recargarTodosLosRegistros(registrosActualizados);
    setLog(prev => [...prev, "✅ Registros actualizados desde BD"]);
    setLog(prev => [...prev, ""]);

    // ═══════════════════════════════════════════════════════
    // FASE 4: REGENERAR TODOS LOS ASIENTOS
    // ═══════════════════════════════════════════════════════
    setFase(4);
    setProgreso(prev => ({
      ...prev,
      procesados: 0
    }));

    setLog(prev => [...prev, "═══════════════════════════════════════════"]);
    setLog(prev => [...prev, "🔄 FASE 4: REGENERANDO ASIENTOS..."]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);

    for (let i = 0; i < registrosActualizados.length; i++) {
      const registro = registrosActualizados[i];

      setProgreso(prev => ({
        ...prev,
        procesados: i + 1
      }));

      try {
        const registroCompleto = await recargarRegistro(registro.id);
        const asientosExistentes = registroCompleto?.asientosContables || [];

        const asientosAEliminar = asientosExistentes.filter(a =>
          Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.PENDIENTE ||
          Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.ANULADO
        );

        const asientosAprobados = asientosExistentes.filter(a =>
          Number(a.estadoId) === ESTADO_ASIENTO_CONTABLE.APROBADO
        );

        if (asientosAEliminar.length > 0) {
          for (const asiento of asientosAEliminar) {
            await eliminarAsientoContable(registro.id, asiento.id);
          }
        }

        const borrador = await generarBorradorAsiento(registro.id);
        await guardarAsientoContable(registro.id, borrador, usuario?.personalId || 1);

        setLog(prev => [...prev, `  ✅ #${registro.id} - Asiento regenerado`]);
        setProgreso(prev => ({
          ...prev,
          exitosos: prev.exitosos + 1
        }));

      } catch (error) {
        const errorMsg = error.response?.data?.mensaje || error.message || "Error desconocido";

        resultadosTemp.push({
          id: registro.id,
          numeroDocumento: registro.numeroDocumento,
          mensaje: errorMsg
        });

        setLog(prev => [...prev, `  ❌ OrdenCompra #${registro.id} - ${errorMsg}`]);
        setProgreso(prev => ({
          ...prev,
          errores: prev.errores + 1
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setLog(prev => [...prev, ""]);
    setLog(prev => [...prev, `✅ FASE 4 COMPLETADA - ${registrosActualizados.length} Asientos regenerados`]);
    setLog(prev => [...prev, ""]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);
    setLog(prev => [...prev, "🎉 PROCESO COMPLETO FINALIZADO"]);
    setLog(prev => [...prev, "═══════════════════════════════════════════"]);

    setResultados(resultadosTemp);
    setEtapa("resultados");

    if (onComplete) {
      onComplete(resultadosTemp);
    }
  };

  const handleClose = () => {
    if (etapa !== "procesando") {
      setEtapa("confirmacion");
      setFase(1);
      setProgreso({ total: 0, procesados: 0, exitosos: 0, errores: 0, tiempoInicio: null });
      setLog([]);
      setResultados([]);
      onHide();
    }
  };

  const renderConfirmacion = () => {
    const { total, gerenciales, fiscales, pendientes } = contarPorTipo();

    return (
      <div className="p-fluid">
        <div className="mb-4">
          <h3 style={{ marginTop: 0 }}>📊 Resumen de Operación:</h3>
          <div style={{ backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "6px", marginBottom: "1rem" }}>
            <p style={{ margin: "0.5rem 0" }}>• <strong>Total de registros:</strong> {total}</p>
            <p style={{ margin: "0.5rem 0" }}>• <strong>Órdenes Pendientes:</strong> {pendientes}</p>
            <p style={{ margin: "0.5rem 0" }}>• <strong>Órdenes Gerenciales:</strong> {gerenciales}</p>
            <p style={{ margin: "0.5rem 0" }}>• <strong>Órdenes Fiscales:</strong> {fiscales}</p>
          </div>

          <div style={{ backgroundColor: "#fff3cd", padding: "1rem", borderRadius: "6px", border: "1px solid #ffc107" }}>
            <h4 style={{ marginTop: 0, color: "#856404" }}>⚠️ PROCESO EN 4 FASES SECUENCIALES:</h4>

            <p style={{ margin: "0.5rem 0", fontSize: "14px", fontWeight: "bold" }}>FASE 1: Aprobar PENDIENTES</p>
            <p style={{ margin: "0 0 0.5rem 1.5rem", fontSize: "13px" }}>• {pendientes} Órdenes PENDIENTES serán aprobadas</p>

            <p style={{ margin: "0.5rem 0", fontSize: "14px", fontWeight: "bold" }}>FASE 2: Generar CxP TODAS</p>
            <p style={{ margin: "0 0 0.5rem 1.5rem", fontSize: "13px" }}>• {total} Cuentas por Pagar serán generadas</p>

            <p style={{ margin: "0.5rem 0", fontSize: "14px", fontWeight: "bold" }}>FASE 3: Regenerar CxP</p>
            <p style={{ margin: "0 0 0.5rem 1.5rem", fontSize: "13px" }}>• {total} Cuentas por Pagar serán regeneradas</p>

            <p style={{ margin: "0.5rem 0", fontSize: "14px", fontWeight: "bold" }}>FASE 4: Regenerar Asientos</p>
            <p style={{ margin: "0 0 0.5rem 1.5rem", fontSize: "13px" }}>• {total} Asientos Contables serán regenerados</p>

            <p style={{ margin: "1rem 0 0.5rem 0", fontSize: "14px", fontWeight: "bold", color: "#d32f2f" }}>
              ❌ NO se procesarán Órdenes con CxP que tengan pagos registrados
            </p>
          </div>

          <p style={{ marginTop: "1rem", fontSize: "14px", color: "#666" }}>
            ⏱️ Tiempo estimado: ~1 segundo por registro x 4 fases = ~{Math.ceil(total * 4 / 60)} minutos
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={handleClose}
          />
          <Button
            label="Iniciar Regeneración"
            icon="pi pi-check"
            className="p-button-warning"
            onClick={iniciarRegeneracion}
          />
        </div>
      </div>
    );
  };

  const renderProcesando = () => {
    const porcentaje = Math.round((progreso.procesados / progreso.total) * 100);

    return (
      <div className="p-fluid">
        <div className="mb-3">
          <h4>FASE {fase}/4 - Progreso: {progreso.procesados}/{progreso.total} ({porcentaje}%)</h4>
          <div style={{ width: "100%", backgroundColor: "#e0e0e0", borderRadius: "4px", height: "30px", overflow: "hidden" }}>
            <div
              style={{
                width: `${porcentaje}%`,
                backgroundColor: fase === 1 ? "#2196f3" : fase === 2 ? "#ff9800" : fase === 3 ? "#9c27b0" : "#4caf50",
                height: "100%",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold"
              }}
            >
              {porcentaje}%
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h4>📋 Registro de Actividad:</h4>
          <div style={{ maxHeight: "300px", overflowY: "auto", backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace" }}>
            {log.map((logEntry, index) => (
              <div key={index} style={{ marginBottom: "0.25rem" }}>{logEntry}</div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
          ⚠️ No cierre esta ventana hasta que finalice
        </p>
      </div>
    );
  };

  const renderResultados = () => {
    const errores = resultados;
    const exitosos = progreso.exitosos;

    return (
      <div className="p-fluid">
        <div className="mb-4">
          <h3 style={{ marginTop: 0 }}>📊 Resumen Final:</h3>
          <div style={{ backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "6px", marginBottom: "1rem" }}>
            <p style={{ margin: "0.5rem 0" }}>• <strong>Total procesados:</strong> {progreso.total}</p>
            <p style={{ margin: "0.5rem 0", color: "#4caf50" }}>• <strong>✅ Exitosos:</strong> {exitosos}</p>
            <p style={{ margin: "0.5rem 0", color: "#f44336" }}>• <strong>❌ Errores:</strong> {errores.length}</p>
          </div>
        </div>

        {errores.length > 0 && (
          <div className="mb-4">
            <h4 style={{ color: "#f44336" }}>❌ Registros con Errores:</h4>
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #f44336", borderRadius: "6px" }}>
              {errores.map((resultado, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.75rem",
                    borderBottom: index < errores.length - 1 ? "1px solid #fdd" : "none",
                    backgroundColor: "#fef5f5"
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "0.25rem" }}>
                    #{resultado.id} - {resultado.numeroDocumento}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {resultado.mensaje}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            label="Cerrar"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={handleClose}
          />
        </div>
      </div>
    );
  };

  const getHeader = () => {
    if (etapa === "confirmacion") return "⚠️ Regeneración Masiva de CxP y Asientos";
    if (etapa === "procesando") return `🔄 Regenerando - FASE ${fase}/4`;
    return "✅ Regeneración Masiva Completada";
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={getHeader()}
      style={{ width: etapa === "resultados" ? "800px" : "700px" }}
      modal
      closable={etapa !== "procesando"}
    >
      {etapa === "confirmacion" && renderConfirmacion()}
      {etapa === "procesando" && renderProcesando()}
      {etapa === "resultados" && renderResultados()}
    </Dialog>
  );
}