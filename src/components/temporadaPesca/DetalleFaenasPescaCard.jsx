/**
 * DetalleFaenasPescaCard.jsx
 *
 * Card para mostrar y gestionar las faenas de pesca relacionadas con una temporada.
 * Incluye funcionalidad CRUD completa para FaenaPesca.
 *
 * @author ERP Megui
 * @version 1.0.0
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
import FaenaPescaForm from "../faenaPesca/FaenaPescaForm";

// APIs
import {
  getFaenasPesca,
  getFaenaPescaPorId,
  crearFaenaPesca,
  actualizarFaenaPesca,
  eliminarFaenaPesca,
} from "../../api/faenaPesca";
import { getCalasPorFaena } from "../../api/cala";
import { getDetalleCalaEspeciePorCala } from "../../api/detalleCalaEspecie";
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
  bolicheId: yup.number().required("El boliche es obligatorio"),
  urlReporteFaenaCalas: yup.string().url("Debe ser una URL válida").nullable(),
  urlDeclaracionDesembarqueArmador: yup
    .string()
    .url("Debe ser una URL válida")
    .nullable(),
  estadoFaenaId: yup.number().nullable(),
});

/**
 * Componente DetalleFaenasPescaCard
 * @param {Object} props - Props del componente
 * @param {number} props.temporadaPescaId - ID de la temporada de pesca
 * @param {Array} props.embarcaciones - Lista de embarcaciones disponibles
 * @param {Array} props.boliches - Lista de boliches disponibles
 * @param {Array} props.puertos - Lista de puertos disponibles
 * @param {Array} props.bahiasComerciales - Lista de bahías comerciales disponibles
 * @param {Array} props.motoristas - Lista de motoristas disponibles
 * @param {Array} props.patron - Lista de patrones disponibles
 * @param {Object} props.temporadaData - Datos de la temporada
 * @param {Function} props.onTemporadaDataChange - Callback para notificar cambios en datos de temporada
 * @param {Function} props.onFaenasChange - Callback para notificar cambios en faenas
 * @param {number} props.faenasUpdateTrigger - Trigger para actualizar faenas
 * @param {Function} props.setFaenasUpdateTrigger - Función para actualizar trigger
 */
const DetalleFaenasPescaCard = forwardRef(
  (
    {
      temporadaPescaId,
      embarcaciones = [],
      boliches = [],
      puertos = [],
      bahiasComerciales = [],
      motoristas = [],
      patrones = [],
      temporadaData = null,
      onTemporadaDataChange, // Callback para notificar cambios en datos de temporada
      onFaenasChange, // Callback para notificar cambios en faenas
      faenasUpdateTrigger,
      setFaenasUpdateTrigger,
    },
    ref
  ) => {
    // Estados principales
    const [faenas, setFaenas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingFaena, setEditingFaena] = useState(null);
    const [faenaCreatedSuccessfully, setFaenaCreatedSuccessfully] =
      useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [faenaToDelete, setFaenaToDelete] = useState(null);
    const [puertosData, setPuertosData] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [calasData, setCalasData] = useState({}); // Nuevo estado para calas por faena
    const [expandedCalasRows, setExpandedCalasRows] = useState({}); // Estado para expansión de calas
    const [detallesEspecieData, setDetallesEspecieData] = useState({}); // Estado para detalles de especie por cala

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
        bolicheId: null,
        urlReporteFaenaCalas: "",
        urlDeclaracionDesembarqueArmador: "",
        estadoFaenaId: null,
      },
    });

    /**
     * Cargar faenas de la temporada
     */
    const cargarFaenas = async () => {
      if (!temporadaPescaId) return;

      try {
        setLoading(true);
        const data = await getFaenasPesca();
        // Filtrar por temporada
        const faenasFiltradas = data.filter(
          (f) => f.temporadaId === temporadaPescaId
        );
        setFaenas(faenasFiltradas);
      } catch (error) {
        console.error("Error cargando faenas:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar las faenas de pesca",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    // Cargar faenas al montar o cambiar temporada
    useEffect(() => {
      cargarFaenas();
    }, [temporadaPescaId]);

    // Escuchar evento para refrescar faenas
    useEffect(() => {
      const handleRefreshFaenas = (event) => {
        if (event.detail?.temporadaId === temporadaPescaId) {
          cargarFaenas();
        }
      };

      window.addEventListener("refreshFaenas", handleRefreshFaenas);

      return () => {
        window.removeEventListener("refreshFaenas", handleRefreshFaenas);
      };
    }, [temporadaPescaId]);

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
     * Abrir diálogo para nueva faena
     */
    const handleNuevaFaena = () => {
      setEditingFaena(null);
      reset({
        descripcion: "",
        fechaSalida: null,
        fechaHoraFondeo: null,
        embarcacionId: null,
        bolicheId: null,
        urlReporteFaenaCalas: "",
        urlDeclaracionDesembarqueArmador: "",
        estadoFaenaId: null,
      });
      setDialogVisible(true);
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
      reset({
        descripcion: faena.descripcion || "",
        fechaSalida: faena.fechaSalida ? new Date(faena.fechaSalida) : null,
        fechaHoraFondeo: faena.fechaHoraFondeo
          ? new Date(faena.fechaHoraFondeo)
          : null,
        embarcacionId: faena.embarcacionId || null,
        bolicheRedId: faena.bolicheRedId || null,
        urlReporteFaenaCalas: faena.urlReporteFaenaCalas || "",
        urlDeclaracionDesembarqueArmador:
          faena.urlDeclaracionDesembarqueArmador || "",
        estadoFaenaId: faena.estadoFaenaId || null,
      });
      setDialogVisible(true);
    };

    /**
     * Guardar faena
     */
    const onSubmit = async (data) => {
      try {
        // Limpiar datos eliminando campos undefined y agregando campos requeridos
        const faenaData = {
          temporadaId: temporadaPescaId, // Campo obligatorio
          descripcion: data.descripcion || "",
          fechaSalida: data.fechaSalida ? data.fechaSalida.toISOString() : null,
          fechaHoraFondeo: data.fechaHoraFondeo
            ? data.fechaHoraFondeo.toISOString()
            : null,
          fechaDescarga: data.fechaDescarga
            ? data.fechaDescarga.toISOString()
            : null,
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
          urlReporteFaenaCalas: data.urlReporteFaenaCalas || "",
          urlDeclaracionDesembarqueArmador:
            data.urlDeclaracionDesembarqueArmador || "",
          urlInformeFaena: data.urlInformeFaena || null,
          // Campo de auditoría requerido por Prisma
          updatedAt: new Date().toISOString(),
        };
        // NO enviar createdAt ni observaciones - no existen en el esquema de Prisma
        let resultado;
        if (editingFaena) {
          resultado = await actualizarFaenaPesca(editingFaena.id, faenaData);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Faena actualizada correctamente",
            life: 3000,
          });
        } else {
          resultado = await crearFaenaPesca(faenaData);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Faena creada correctamente",
            life: 3000,
          });
          setFaenaCreatedSuccessfully(true);
        }

        // NO cerrar la ventana automáticamente - comentar setDialogVisible(false)
        // setDialogVisible(false);

        cargarFaenas();
        onFaenasChange?.(); // Notificar cambios en faenas
        handleFaenasChange(); // Actualizar trigger

        // Retornar el resultado para que FaenaPescaForm pueda obtener el ID
        return resultado;
      } catch (error) {
        console.error("Error guardando faena:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al guardar la faena",
          life: 3000,
        });
        throw error; // Re-lanzar el error para que FaenaPescaForm lo maneje
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
        await eliminarFaenaPesca(faenaToDelete.id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena eliminada correctamente",
          life: 3000,
        });
        cargarFaenas();
        onFaenasChange?.(); // Notificar cambios en faenas
        handleFaenasChange(); // Actualizar trigger
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
      const puerto = puertosData.find((p) => p.id === puertoId);
      return puerto ? puerto.nombre : "N/A";
    };

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
          const embarcacion = embarcaciones.find(
            (e) => Number(e.id) === Number(rowData.embarcacionId)
          );
          return embarcacion
            ? embarcacion.activo?.nombre || embarcacion.nombre || "Sin nombre"
            : "N/A";
        },
      },
      {
        field: "bolicheRedId",
        header: "Boliche",
        sortable: true,
        body: (rowData) => {
          const boliche = boliches.find(
            (b) => Number(b.id) === Number(rowData.bolicheRedId)
          );
          return boliche ? boliche.descripcion : "N/A";
        },
      },
      {
        field: "bahiaId",
        header: "Bahía",
        sortable: true,
        body: (rowData) => {
          const bahia = bahiasComerciales.find(
            (b) => Number(b.id) === Number(rowData.bahiaId)
          );
          return bahia ? `${bahia.nombres} ${bahia.apellidos}` : "N/A";
        },
      },
      {
        field: "patronId",
        header: "Patrón",
        sortable: true,
        body: (rowData) => {
          const patron = patrones.find(
            (p) => Number(p.id) === Number(rowData.patronId)
          );
          return patron ? `${patron.nombres} ${patron.apellidos}` : "N/A";
        },
      },
      {
        field: "motoristaId",
        header: "Motorista",
        sortable: true,
        body: (rowData) => {
          const motorista = motoristas.find(
            (m) => Number(m.id) === Number(rowData.motoristaId)
          );
          return motorista
            ? `${motorista.nombres} ${motorista.apellidos}`
            : "N/A";
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

    // Template de expansión para calas (tercer nivel)
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
                field="especie.nombre"
                header="Especie"
                sortable
                style={{ minWidth: "10rem" }}
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
                  // Mostrar directamente en toneladas
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

    // Template de expansión para faenas (segundo nivel)
    const rowExpansionTemplate = (data) => {
      const calas = calasData[data.id] || [];
      const formatearFecha = (fecha) => {
        if (!fecha) return "";
        return new Date(fecha).toLocaleString("es-ES", {
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

        // SIEMPRE recargar especies para obtener datos actualizados
        try {
          const especies = await getDetalleCalaEspeciePorCala(calaId);
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
            calas.map((cala, index) => (
              <div key={cala.id} style={{ marginBottom: "2rem" }}>
                {/* Título individual para cada cala */}
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

                {/* DataTable individual para cada cala */}
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
                      // Mostrar directamente en toneladas
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
          const calas = await getCalasPorFaena(faenaId);
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
              const calas = await getCalasPorFaena(faena.id);
              return { faenaId: faena.id, calas };
            } catch (error) {
              console.error(
                `Error cargando calas para faena ${faena.id}:`,
                error
              );
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

            // Solo cargar especies si no existen ya
            if (!detallesEspecieData[cala.id]) {
              especiesPromises.push(
                getDetalleCalaEspeciePorCala(cala.id)
                  .then((especies) => ({ calaId: cala.id, especies }))
                  .catch((error) => {
                    console.error(
                      `Error cargando especies para cala ${cala.id}:`,
                      error
                    );
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
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Todos los niveles contraídos correctamente",
        life: 3000,
      });
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
          <h2>Detalle Faenas de Pesca</h2>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            label="Nueva Faena"
            icon="pi pi-plus"
            onClick={handleNuevaFaena}
            disabled={
              !temporadaPescaId || !temporadaData?.temporadaPescaIniciada
            }
            raised
            outlined
            size="small"
            tooltip={
              !temporadaPescaId
                ? "Guarde la temporada para crear faenas"
                : !temporadaData?.temporadaPescaIniciada
                ? "Debe iniciar la temporada antes de crear faenas"
                : "Crear nueva faena"
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

    // Header del card
    const cardHeader = (
      <Toolbar
        start={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-anchor text-2xl"></i>
            <span className="text-xl font-bold">Faenas de Pesca</span>
          </div>
        }
        end={
          <div className="flex gap-2">
            <Button
              label="Nueva Faena"
              icon="pi pi-plus"
              onClick={handleNuevaFaena}
              disabled={
                !temporadaPescaId || !temporadaData?.temporadaPescaIniciada
              }
              tooltip={
                !temporadaPescaId
                  ? "Guarde la temporada para crear faenas"
                  : !temporadaData?.temporadaPescaIniciada
                  ? "Debe iniciar la temporada antes de crear faenas"
                  : "Crear nueva faena"
              }
              tooltipOptions={{ position: "bottom" }}
            />
          </div>
        }
      />
    );

    // Función para actualizar trigger de faenas
    const handleFaenasChange = () => {
      setFaenasUpdateTrigger((prevTrigger) => prevTrigger + 1);
    };

    // Función para mostrar porcentaje de juveniles con colores
    const porcentajeJuvenilesTemplate = (rowData) => {
      const templateData = createPorcentajeTemplate(
        rowData.porcentajeJuveniles,
        null,
        { decimales: 2 }
      );

      if (!templateData) return "-";

      return (
        <span style={templateData.estilos}>
          {templateData.valor}
          {templateData.sufijo}
        </span>
      );
    };

    return (
      <div className="card">
        <Toast ref={toast} />
        <ConfirmDialog
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          message="¿Está seguro de que desea eliminar esta faena?"
          header="Confirmar Eliminación"
          icon="pi pi-exclamation-triangle"
          accept={confirmarEliminacion}
          reject={() => setConfirmVisible(false)}
          acceptClassName="p-button-danger"
        />

        <Card>
          {!temporadaPescaId ? (
            <div className="text-center p-4">
              <i className="pi pi-info-circle text-4xl text-blue-500 mb-3"></i>
              <p className="text-lg">
                Guarde la temporada para gestionar las faenas de pesca
              </p>
            </div>
          ) : (
            <DataTable
              value={faenas}
              loading={loading}
              paginator
              rows={10}
              showGridlines
              stripedRows
              emptyMessage="No hay faenas registradas para esta temporada"
              className="p-datatable-sm"
              onRowClick={(e) => handleEditarFaena(e.data, e.originalEvent)}
              style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
              rowExpansionTemplate={rowExpansionTemplate}
              expandedRows={expandedRows}
              onRowToggle={(e) => setExpandedRows(e.data)}
              onRowExpand={onRowExpand}
              onRowCollapse={onRowCollapse}
              dataKey="id"
              header={header}
            >
              <Column expander style={{ width: "5rem" }} />
              {columns.map((column) => (
                <Column key={column.field} {...column} />
              ))}
            </DataTable>
          )}
        </Card>

        {/* Diálogo para crear/editar faena */}
        <Dialog
          visible={dialogVisible}
          style={{ width: "1300px" }}
          header={
            editingFaena ? "Editar Faena de Pesca" : "Nueva Faena de Pesca"
          }
          modal
          onHide={() => setDialogVisible(false)}
        >
          <FaenaPescaForm
            visible={dialogVisible}
            onHide={() => setDialogVisible(false)}
            isEdit={!!editingFaena}
            defaultValues={editingFaena || {}}
            onSubmit={onSubmit}
            loading={loading}
            onDataChange={cargarFaenas} // Callback para recargar faenas cuando cambien las toneladas
            temporadaData={temporadaData}
            onTemporadaDataChange={onTemporadaDataChange} // Callback para notificar cambios en datos de temporada
            onFaenasChange={onFaenasChange} // Callback para notificar cambios en faenas
            embarcacionesOptions={embarcaciones.map((e) => ({
              label: e.activo?.nombre || e.nombre || "Sin nombre",
              value: e.id,
            }))}
            bolichesOptions={boliches.map((b) => ({
              label: b.descripcion,
              value: b.id,
            }))}
            bahiasComercialesOptions={bahiasComerciales.map((b) => ({
              label: `${b.nombres} ${b.apellidos}`,
              value: b.id,
            }))}
            motoristasOptions={motoristas.map((m) => ({
              label: `${m.nombres} ${m.apellidos}`,
              value: m.id,
            }))}
            patronesOptions={patrones.map((p) => ({
              label: `${p.nombres} ${p.apellidos}`,
              value: p.id,
            }))}
            puertosOptions={puertosData.map((p) => ({
              label: p.nombre,
              value: p.id,
            }))}
            faenaCreatedSuccessfully={faenaCreatedSuccessfully}
            setFaenaCreatedSuccessfully={setFaenaCreatedSuccessfully}
          />
        </Dialog>
      </div>
    );
  }
);

DetalleFaenasPescaCard.displayName = "DetalleFaenasPescaCard";

export default DetalleFaenasPescaCard;
