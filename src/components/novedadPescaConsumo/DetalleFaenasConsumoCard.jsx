/**
 * DetalleFaenasConsumoCard.jsx
 *
 * Card para mostrar y gestionar las faenas de pesca consumo relacionadas con una novedad.
 * Incluye funcionalidad CRUD completa para FaenaPescaConsumo.
 * Replica el patrón de DetalleFaenasPescaCard.jsx con expansión de 3 niveles.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FaenaPescaConsumoForm from "../faenaPescaConsumo/FaenaPescaConsumoForm";
import ResumenCreacionFaenaConsumoDialog from "../faenaPescaConsumo/ResumenCreacionFaenaConsumoDialog";

// APIs
import {
  getFaenasPescaConsumo,
  getFaenaPescaConsumoPorId,
  crearFaenaPescaConsumo,
  actualizarFaenaPescaConsumo,
  eliminarFaenaPescaConsumo,
  crearFaenaConsumoCompleta,
} from "../../api/faenaPescaConsumo";
import { getCalasFaenaConsumoPorFaena } from "../../api/calaFaenaConsumo";
import { getDetCalaPescaConsumoPorCala } from "../../api/detCalaPescaConsumo";
import { getPuertosPesca } from "../../api/puertoPesca";
import {
  getResponsiveFontSize,
  createPorcentajeTemplate,
} from "../../utils/utils";

// Esquema de validación
const schema = yup.object().shape({
  descripcion: yup.string().required("La descripción es obligatoria"),
  fechaSalida: yup.date().required("La fecha de salida es obligatoria"),
  fechaHoraFondeo: yup.date().nullable(),
  embarcacionId: yup.number().required("La embarcación es obligatoria"),
  bolicheRedId: yup.number().required("El boliche es obligatorio"),
  estadoFaenaId: yup.number().nullable(),
});

/**
 * Componente DetalleFaenasConsumoCard
 * @param {Object} props - Props del componente
 * @param {Object} props.novedadPescaConsumo - Objeto novedad de pesca consumo
 * @param {boolean} props.novedadPescaConsumoIniciada - Si la novedad está iniciada
 * @param {Array} props.embarcaciones - Lista de embarcaciones disponibles
 * @param {Array} props.boliches - Lista de boliches disponibles
 * @param {Array} props.puertos - Lista de puertos disponibles
 * @param {Array} props.bahiasComerciales - Lista de bahías comerciales disponibles
 * @param {Array} props.motoristas - Lista de motoristas disponibles
 * @param {Array} props.patrones - Lista de patrones disponibles
 * @param {Function} props.onDataChange - Callback para notificar cambios
 * @param {number} props.updateTrigger - Trigger para actualizar faenas
 */
const DetalleFaenasConsumoCard = forwardRef(
  (
    {
      novedadPescaConsumo,
      novedadPescaConsumoIniciada = false,
      embarcaciones = [],
      boliches = [],
      puertos = [],
      bahiasComerciales = [],
      motoristas = [],
      patrones = [],
      onDataChange,
      updateTrigger,
    },
    ref
  ) => {
    // Estados principales
    const [faenas, setFaenas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingFaena, setEditingFaena] = useState(null);
    const [faenaCreatedSuccessfully, setFaenaCreatedSuccessfully] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [faenaToDelete, setFaenaToDelete] = useState(null);
    const [puertosData, setPuertosData] = useState([]);
    
    // Estados para modal de resumen de creación
    const [showResumenCreacion, setShowResumenCreacion] = useState(false);
    const [resumenCreacionData, setResumenCreacionData] = useState(null);
    const [creandoFaenaCompleta, setCreandoFaenaCompleta] = useState(false);
    
    // Estados para expansión de 3 niveles
    const [expandedRows, setExpandedRows] = useState({});
    const [calasData, setCalasData] = useState({}); // Calas por faena
    const [expandedCalasRows, setExpandedCalasRows] = useState({}); // Expansión de calas
    const [detallesEspecieData, setDetallesEspecieData] = useState({}); // Especies por cala

    // Refs
    const toast = useRef(null);

    // Form
    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(schema),
      defaultValues: {
        descripcion: "",
        fechaSalida: null,
        fechaHoraFondeo: null,
        embarcacionId: null,
        bolicheRedId: null,
        estadoFaenaId: null,
      },
    });

    /**
     * Cargar faenas de la novedad
     */
    const cargarFaenas = async () => {
      if (!novedadPescaConsumo?.id) return;

      try {
        setLoading(true);
        const data = await getFaenasPescaConsumo();
        // Filtrar por novedad
        const faenasFiltradas = data.filter(
          (f) => Number(f.novedadPescaConsumoId) === Number(novedadPescaConsumo.id)
        );
        setFaenas(faenasFiltradas);
      } catch (error) {
        console.error("Error cargando faenas:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar las faenas de pesca consumo",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Cargar faenas al montar o cambiar novedad
    useEffect(() => {
      cargarFaenas();
    }, [novedadPescaConsumo?.id]);

    // Escuchar evento para refrescar faenas
    useEffect(() => {
      const handleRefreshFaenas = (event) => {
        if (event.detail?.novedadId === novedadPescaConsumo?.id) {
          cargarFaenas();
        }
      };

      window.addEventListener("refreshFaenasConsumo", handleRefreshFaenas);

      return () => {
        window.removeEventListener("refreshFaenasConsumo", handleRefreshFaenas);
      };
    }, [novedadPescaConsumo?.id]);

    // Cargar puertos al montar el componente
    useEffect(() => {
      const cargarPuertos = async () => {
        try {
          const data = await getPuertosPesca();
          setPuertosData(data);
        } catch (error) {
          console.error("Error cargando puertos:", error);
        }
      };
      cargarPuertos();
    }, []);

    /**
     * Crear nueva faena completa con todos sus registros asociados
     * Replica la lógica de "Iniciar Novedad Pesca Consumo"
     */
    const handleNuevaFaena = async () => {
      if (!novedadPescaConsumo?.id) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe guardar la novedad antes de crear faenas",
          life: 3000,
        });
        return;
      }

      if (!novedadPescaConsumoIniciada) {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "Debe iniciar la novedad antes de crear faenas",
          life: 3000,
        });
        return;
      }

      try {
        setCreandoFaenaCompleta(true);
        
        const resultado = await crearFaenaConsumoCompleta(novedadPescaConsumo.id);
        
        // Mostrar modal de resumen
        setResumenCreacionData(resultado.resumen);
        setShowResumenCreacion(true);
        
        // Recargar faenas
        await cargarFaenas();
        
        // Notificar cambios
        onDataChange?.();
        
        // Disparar evento para refrescar otros componentes
        window.dispatchEvent(
          new CustomEvent("refreshFaenasConsumo", {
            detail: { novedadId: novedadPescaConsumo.id },
          })
        );
        
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena de pesca consumo creada exitosamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error creando faena completa:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.error || "Error al crear la faena de pesca consumo",
          life: 5000,
        });
      } finally {
        setCreandoFaenaCompleta(false);
      }
    };

    /**
     * Abrir diálogo para editar faena
     */
    const handleEditarFaena = (faena, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setEditingFaena(faena);
      setDialogVisible(true);
    };

    /**
     * Guardar faena
     */
    const handleSubmitFaena = async (data) => {
      try {
        const faenaData = {
          novedadPescaConsumoId: Number(novedadPescaConsumo.id),
          descripcion: data.descripcion || "",
          fechaSalida: data.fechaSalida ? data.fechaSalida.toISOString() : null,
          fechaHoraFondeo: data.fechaHoraFondeo ? data.fechaHoraFondeo.toISOString() : null,
          fechaDescarga: data.fechaDescarga ? data.fechaDescarga.toISOString() : null,
          embarcacionId: data.embarcacionId || null,
          bolicheRedId: data.bolicheRedId || null,
          patronId: data.patronId || null,
          motoristaId: data.motoristaId || null,
          puertoSalidaId: data.puertoSalidaId || null,
          puertoFondeoId: data.puertoFondeoId || null,
          puertoDescargaId: data.puertoDescargaId || null,
          bahiaId: data.bahiaId || null,
          estadoFaenaId: data.estadoFaenaId || null,
          toneladasCapturadasFaena: data.toneladasCapturadasFaena || null,
          urlInformeFaena: data.urlInformeFaena || null,
          updatedAt: new Date().toISOString(),
        };

        let resultado;
        if (editingFaena) {
          resultado = await actualizarFaenaPescaConsumo(editingFaena.id, faenaData);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Faena actualizada correctamente",
            life: 3000,
          });
        } else {
          resultado = await crearFaenaPescaConsumo(faenaData);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Faena creada correctamente",
            life: 3000,
          });
          setFaenaCreatedSuccessfully(true);
        }

        cargarFaenas();
        onDataChange?.();

        return resultado;
      } catch (error) {
        console.error("Error guardando faena:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al guardar la faena",
          life: 3000,
        });
        throw error;
      }
    };

    /**
     * Confirmar eliminación
     */
    const handleEliminarFaena = (faena) => {
      setFaenaToDelete(faena);
      setConfirmVisible(true);
    };

    /**
     * Eliminar faena
     */
    const confirmarEliminacion = async () => {
      try {
        await eliminarFaenaPescaConsumo(faenaToDelete.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena eliminada correctamente",
          life: 3000,
        });
        cargarFaenas();
        onDataChange?.();
      } catch (error) {
        console.error("Error eliminando faena:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar la faena",
          life: 3000,
        });
      } finally {
        setConfirmVisible(false);
        setFaenaToDelete(null);
      }
    };

    /**
     * Obtener nombre del puerto por ID
     */
    const obtenerNombrePuerto = (puertoId) => {
      const puerto = puertosData.find((p) => Number(p.id) === Number(puertoId));
      return puerto ? puerto.nombre : "N/A";
    };

    // Template de expansión para especies (tercer nivel)
    const calaExpansionTemplate = (calaData) => {
      const detallesEspecie = detallesEspecieData[calaData.id] || [];
      return (
        <div className="p-3">
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <Tag
              value={`Especies de la Cala ${calaData.id}`}
              severity="info"
              style={{
                width: "100%",
                color: "white",
              }}
            />
          </div>
          {detallesEspecie.length === 0 ? (
            <p>No hay especies registradas para esta cala</p>
          ) : (
            <DataTable
              value={detallesEspecie}
              dataKey="id"
              className="datatable-responsive"
              style={{ cursor: "no-drop", fontSize: getResponsiveFontSize() }}
            >
              <Column
                field="id"
                header="ID"
                sortable
                style={{ minWidth: "4rem" }}
              />
              <Column
                field="especieId"
                header="Especie"
                sortable
                style={{ minWidth: "10rem" }}
                body={(rowData) => {
                  // Mostrar el nombre de la especie desde la relación
                  return rowData.especie?.nombre || `ID: ${rowData.especieId}`;
                }}
              />
              <Column
                field="porcentajeJuveniles"
                header="% Juveniles"
                sortable
                style={{ minWidth: "8rem" }}
                body={porcentajeJuvenilesTemplate}
              />
              <Column
                field="toneladas"
                header="Toneladas"
                sortable
                style={{ minWidth: "8rem" }}
                body={(rowData) => {
                  const tons = rowData.toneladas
                    ? parseFloat(rowData.toneladas).toFixed(3)
                    : "0.000";
                  return `${tons} t`;
                }}
              />
            </DataTable>
          )}
        </div>
      );
    };

    // Template de expansión para calas (segundo nivel)
    const rowExpansionTemplate = (data) => {
      const calas = calasData[data.id] || [];
      const formatearFecha = (fecha) => {
        if (!fecha) return "";
        return new Date(fecha).toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      // Función para expandir calas y cargar especies
      const onCalaRowExpand = async (event) => {
        const calaId = event.data.id;

        try {
          const especies = await getDetCalaPescaConsumoPorCala(calaId);
          setDetallesEspecieData((prevData) => ({
            ...prevData,
            [calaId]: especies,
          }));
          toast.current?.show({
            severity: "success",
            summary: "Especies Actualizadas",
            detail: `Datos actualizados para Cala ${calaId}`,
            life: 2000,
          });
        } catch (error) {
          console.error("❌ Error cargando especies:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al cargar las especies de la cala",
            life: 3000,
          });
        }
      };

      const onCalaRowCollapse = (event) => {
        toast.current?.show({
          severity: "success",
          summary: "Cala Contraída",
          detail: `Cala ${event.data.id}`,
          life: 3000,
        });
      };

      return (
        <div className="p-3">
          {calas.length === 0 ? (
            <p>No hay calas registradas para esta faena</p>
          ) : (
            calas.map((cala) => (
              <div key={cala.id} style={{ marginBottom: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <Tag
                    value={`Cala ${cala.id} de Faena ${data.id}`}
                    severity="warning"
                    style={{
                      width: "100%",
                      color: "black",
                      fontSize: "1rem",
                      padding: "0.5rem",
                    }}
                  />
                </div>

                <DataTable
                  value={[cala]}
                  dataKey="id"
                  className="datatable-responsive"
                  style={{
                    cursor: "no-drop",
                    fontSize: getResponsiveFontSize(),
                  }}
                  rowExpansionTemplate={calaExpansionTemplate}
                  expandedRows={expandedCalasRows}
                  onRowToggle={(e) => setExpandedCalasRows(e.data)}
                  onRowExpand={onCalaRowExpand}
                  onRowCollapse={onCalaRowCollapse}
                >
                  <Column expander style={{ width: "5rem" }} />
                  <Column
                    field="id"
                    header="ID"
                    sortable
                    style={{ minWidth: "4rem" }}
                  />
                  <Column
                    field="fechaHoraInicio"
                    header="Fecha Inicio"
                    body={(rowData) => formatearFecha(rowData.fechaHoraInicio)}
                    sortable
                    style={{ minWidth: "10rem" }}
                  />
                  <Column
                    field="fechaHoraFin"
                    header="Fecha Fin"
                    body={(rowData) => formatearFecha(rowData.fechaHoraFin)}
                    sortable
                    style={{ minWidth: "10rem" }}
                  />
                  <Column
                    field="latitud"
                    header="Latitud"
                    sortable
                    style={{ minWidth: "8rem" }}
                  />
                  <Column
                    field="longitud"
                    header="Longitud"
                    sortable
                    style={{ minWidth: "8rem" }}
                  />
                  <Column
                    field="toneladasCapturadas"
                    header="Toneladas"
                    sortable
                    style={{ minWidth: "8rem" }}
                    body={(rowData) => {
                      const tons = rowData.toneladasCapturadas
                        ? parseFloat(rowData.toneladasCapturadas).toFixed(3)
                        : "0.000";
                      return `${tons} t`;
                    }}
                  />
                </DataTable>
              </div>
            ))
          )}
        </div>
      );
    };

    // Funciones para expandir y contraer filas
    const onRowExpand = async (event) => {
      const faenaId = event.data.id;
      if (!calasData[faenaId]) {
        try {
          const calas = await getCalasFaenaConsumoPorFaena(faenaId);
          setCalasData((prevCalasData) => ({
            ...prevCalasData,
            [faenaId]: calas,
          }));
          toast.current?.show({
            severity: "success",
            summary: "Calas Cargadas",
            detail: `Calas para faena ${faenaId}`,
            life: 3000,
          });
        } catch (error) {
          console.error("❌ Error cargando calas:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al cargar las calas de la faena",
            life: 3000,
          });
        }
      }
      toast.current?.show({
        severity: "info",
        summary: "Faena Expandida",
        detail: `Faena ${event.data.id}`,
        life: 3000,
      });
    };

    const onRowCollapse = (event) => {
      toast.current?.show({
        severity: "success",
        summary: "Faena Contraída",
        detail: `Faena ${event.data.id}`,
        life: 3000,
      });
    };

    // Botones para expandir y contraer todas las filas
    const expandAll = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        // Expandir todas las faenas
        let _expandedRows = {};
        faenas.forEach((faena) => (_expandedRows[`${faena.id}`] = true));
        setExpandedRows(_expandedRows);

        // Cargar calas para todas las faenas
        const calasPromises = faenas.map(async (faena) => {
          if (!calasData[faena.id]) {
            try {
              const calas = await getCalasFaenaConsumoPorFaena(faena.id);
              return { faenaId: faena.id, calas };
            } catch (error) {
              console.error(`Error cargando calas para faena ${faena.id}:`, error);
              return { faenaId: faena.id, calas: [] };
            }
          }
          return { faenaId: faena.id, calas: calasData[faena.id] };
        });

        const calasResults = await Promise.all(calasPromises);

        // Actualizar estado de calas
        const newCalasData = { ...calasData };
        calasResults.forEach(({ faenaId, calas }) => {
          newCalasData[faenaId] = calas;
        });
        setCalasData(newCalasData);

        // Expandir todas las calas y cargar especies
        let _expandedCalasRows = {};
        const especiesPromises = [];

        calasResults.forEach(({ faenaId, calas }) => {
          calas.forEach((cala) => {
            _expandedCalasRows[`${cala.id}`] = true;

            if (!detallesEspecieData[cala.id]) {
              especiesPromises.push(
                getDetCalaPescaConsumoPorCala(cala.id)
                  .then((especies) => ({ calaId: cala.id, especies }))
                  .catch((error) => {
                    console.error(`Error cargando especies para cala ${cala.id}:`, error);
                    return { calaId: cala.id, especies: [] };
                  })
              );
            }
          });
        });

        setExpandedCalasRows(_expandedCalasRows);

        // Cargar todas las especies
        if (especiesPromises.length > 0) {
          const especiesResults = await Promise.all(especiesPromises);
          const newDetallesEspecieData = { ...detallesEspecieData };

          especiesResults.forEach(({ calaId, especies }) => {
            newDetallesEspecieData[calaId] = especies;
          });

          setDetallesEspecieData(newDetallesEspecieData);
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Todos los niveles expandidos correctamente",
          life: 3000,
        });
      } catch (error) {
        console.error("Error expandiendo todos los niveles:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al expandir todos los niveles",
          life: 3000,
        });
      }
    };

    const collapseAll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setExpandedRows({});
      setExpandedCalasRows({});
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Todos los niveles contraídos correctamente",
        life: 3000,
      });
    };

    // Función para mostrar porcentaje de juveniles con colores
    const porcentajeJuvenilesTemplate = (rowData) => {
      const templateData = createPorcentajeTemplate(
        rowData.porcentajeJuveniles,
        null,
        null
      );
      return templateData;
    };

    // Header con botones de expansión
    const header = (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexDirection: window.innerWidth < 768 ? "column" : "row",
        }}
      >
        <div style={{ flex: 3 }}>
          <h2>Detalle Faenas de Pesca Consumo</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label={creandoFaenaCompleta ? "Creando..." : "Nueva Faena"}
            icon={creandoFaenaCompleta ? "pi pi-spin pi-spinner" : "pi pi-plus"}
            onClick={handleNuevaFaena}
            disabled={!novedadPescaConsumo?.id || !novedadPescaConsumoIniciada || creandoFaenaCompleta}
            loading={creandoFaenaCompleta}
            raised
            outlined
            size="small"
            tooltip={
              !novedadPescaConsumo?.id
                ? "Guarde la novedad para crear faenas"
                : !novedadPescaConsumoIniciada
                ? "Debe iniciar la novedad antes de crear faenas"
                : creandoFaenaCompleta
                ? "Creando faena con todos sus registros..."
                : "Crear nueva faena con todos sus registros asociados"
            }
            tooltipOptions={{ position: "bottom" }}
            className="p-button-success"
            severity="success"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Expandir Todo"
            icon="pi pi-plus"
            onClick={expandAll}
            raised
            outlined
            size="small"
            tooltip="Expandir Todas"
            tooltipOptions={{ position: "bottom" }}
            className="p-button-warning"
            severity="warning"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Contraer Todo"
            icon="pi pi-minus"
            onClick={collapseAll}
            text
            size="small"
            tooltip="Contraer Todas"
            tooltipOptions={{ position: "bottom" }}
            className="p-button-success"
            severity="success"
          />
        </div>
      </div>
    );

    // Configuración de columnas
    const columns = [
      {
        field: "id",
        header: "ID Faena",
        sortable: true,
      },
      {
        field: "embarcacionId",
        header: "Embarcación",
        sortable: true,
        body: (rowData) => {
          if (!rowData.embarcacionId) return "N/A";
          const embarcacion = embarcaciones.find(
            (e) => Number(e.value) === Number(rowData.embarcacionId)
          );
          return embarcacion ? embarcacion.label : `ID: ${rowData.embarcacionId}`;
        },
      },
      {
        field: "bolicheRedId",
        header: "Boliche",
        sortable: true,
        body: (rowData) => {
          if (!rowData.bolicheRedId) return "N/A";
          const boliche = boliches.find(
            (b) => Number(b.value) === Number(rowData.bolicheRedId)
          );
          return boliche ? boliche.label : `ID: ${rowData.bolicheRedId}`;
        },
      },
      {
        field: "bahiaId",
        header: "Bahía",
        sortable: true,
        body: (rowData) => {
          if (!rowData.bahiaId) return "N/A";
          const bahia = bahiasComerciales.find(
            (b) => Number(b.value) === Number(rowData.bahiaId)
          );
          return bahia ? bahia.label : `ID: ${rowData.bahiaId}`;
        },
      },
      {
        field: "patronId",
        header: "Patrón",
        sortable: true,
        body: (rowData) => {
          if (!rowData.patronId) return "N/A";
          const patron = patrones.find(
            (p) => Number(p.value) === Number(rowData.patronId)
          );
          return patron ? patron.label : `ID: ${rowData.patronId}`;
        },
      },
      {
        field: "motoristaId",
        header: "Motorista",
        sortable: true,
        body: (rowData) => {
          if (!rowData.motoristaId) return "N/A";
          const motorista = motoristas.find(
            (m) => Number(m.value) === Number(rowData.motoristaId)
          );
          return motorista ? motorista.label : `ID: ${rowData.motoristaId}`;
        },
      },
      {
        field: "fechaSalida",
        header: "Fecha Zarpe",
        sortable: true,
        body: (rowData) =>
          rowData.fechaSalida
            ? new Date(rowData.fechaSalida).toLocaleDateString('es-PE')
            : "-",
      },
      {
        field: "puertoSalidaId",
        header: "Puerto Zarpe",
        sortable: true,
        body: (rowData) => obtenerNombrePuerto(rowData.puertoSalidaId),
      },
      {
        field: "fechaRetorno",
        header: "Fecha Retorno",
        sortable: true,
        body: (rowData) =>
          rowData.fechaRetorno
            ? new Date(rowData.fechaRetorno).toLocaleDateString('es-PE')
            : "-",
      },
      {
        field: "fechaHoraFondeo",
        header: "Fecha Fondeo",
        sortable: true,
        body: (rowData) =>
          rowData.fechaHoraFondeo
            ? new Date(rowData.fechaHoraFondeo).toLocaleDateString('es-PE')
            : "-",
      },
      {
        field: "puertoFondeoId",
        header: "Puerto Fondeo",
        sortable: true,
        body: (rowData) => obtenerNombrePuerto(rowData.puertoFondeoId),
      },
      {
        field: "toneladasCapturadasFaena",
        header: "Toneladas",
        sortable: true,
        body: (rowData) => {
          const tons = rowData.toneladasCapturadasFaena
            ? parseFloat(rowData.toneladasCapturadasFaena).toFixed(3)
            : "0.000";
          return `${tons} t`;
        },
      },
      {
        header: "Acciones",
        body: (rowData) => (
          <div className="flex gap-2">
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-success p-button-text"
              onClick={(e) => handleEditarFaena(rowData, e)}
              tooltip="Editar faena"
            />
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-danger p-button-text"
              onClick={() => handleEliminarFaena(rowData)}
              tooltip="Eliminar faena"
            />
          </div>
        ),
      },
    ];

    // Si la novedad no está iniciada, mostrar mensaje
    if (!novedadPescaConsumoIniciada) {
      return (
        <Card title="Faenas de Pesca Consumo" className="mb-4">
          <div className="text-center p-4">
            <i
              className="pi pi-info-circle text-blue-500 mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <p className="text-600 mb-0">
              La novedad debe estar iniciada para gestionar faenas de pesca consumo
            </p>
          </div>
        </Card>
      );
    }

    return (
      <>
        <Card className="mb-4">
        <DataTable
            value={faenas}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            className="datatable-responsive"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            emptyMessage="No hay faenas registradas"
            size="small"
            onRowClick={(e) => handleEditarFaena(e.data, e.originalEvent)}
            style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
            header={header}
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            onRowExpand={onRowExpand}
            onRowCollapse={onRowCollapse}
            dataKey="id"
          >
            <Column expander style={{ width: "5rem" }} />
              {columns.map((column) => (
                <Column key={column.field} {...column} />
              ))}
          </DataTable>
        </Card>

        {/* Dialog para formulario de faena */}
        <Dialog
          visible={dialogVisible}
          style={{ width: "90vw", maxWidth: "1400px" }}
          header={editingFaena ? "Editar Faena" : "Nueva Faena"}
          modal
          onHide={() => setDialogVisible(false)}
          className="p-fluid"
        >
          <FaenaPescaConsumoForm
            visible={dialogVisible}
            onHide={() => setDialogVisible(false)}
            isEdit={!!editingFaena}
            defaultValues={editingFaena || {}}
            novedadData={novedadPescaConsumo}
            embarcacionesOptions={embarcaciones}
            bolichesOptions={boliches}
            bahiasComercialesOptions={bahiasComerciales}
            motoristasOptions={motoristas}
            patronesOptions={patrones}
            puertosOptions={puertosData}
            onSubmit={handleSubmitFaena}
            onDataChange={cargarFaenas}
            faenaCreatedSuccessfully={faenaCreatedSuccessfully}
            setFaenaCreatedSuccessfully={setFaenaCreatedSuccessfully}
          />
        </Dialog>

        {/* Dialog de confirmación */}
        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message="¿Está seguro de eliminar esta faena?"
          header="Confirmar Eliminación"
          icon="pi pi-exclamation-triangle"
          accept={confirmarEliminacion}
          reject={() => setConfirmVisible(false)}
          acceptLabel="Sí, Eliminar"
          rejectLabel="Cancelar"
          acceptClassName="p-button-danger"
        />

        {/* Modal de resumen de creación de faena */}
        <ResumenCreacionFaenaConsumoDialog
          visible={showResumenCreacion}
          onHide={() => setShowResumenCreacion(false)}
          resumen={resumenCreacionData}
        />

        <Toast ref={toast} />
      </>
    );
  }
);

DetalleFaenasConsumoCard.displayName = "DetalleFaenasConsumoCard";

export default DetalleFaenasConsumoCard;