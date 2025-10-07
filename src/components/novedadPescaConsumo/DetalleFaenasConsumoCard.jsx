/**
 * DetalleFaenasConsumoCard.jsx
 *
 * Card para mostrar y gestionar las faenas de pesca consumo relacionadas con una novedad.
 * Incluye funcionalidad CRUD completa para FaenaPescaConsumo.
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
import FaenaPescaConsumoForm from "../faenaPescaConsumo/FaenaPescaConsumoForm";

// APIs
import {
  getFaenasPescaConsumo,
  getFaenaPescaConsumoPorId,
  crearFaenaPescaConsumo,
  actualizarFaenaPescaConsumo,
  eliminarFaenaPescaConsumo,
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
  bolicheId: yup.number().required("El boliche es obligatorio"),
  urlReporteFaenaCalas: yup.string().url("Debe ser una URL válida").nullable(),
  urlDeclaracionDesembarqueArmador: yup
    .string()
    .url("Debe ser una URL válida")
    .nullable(),
  estadoFaenaId: yup.number().nullable(),
});

/**
 * Componente DetalleFaenasConsumoCard
 * @param {Object} props - Props del componente
 * @param {number} props.novedadPescaConsumo - objeto novedad de pesca consumo
 * @param {boolean} props.novedadPescaConsumoIniciada - Si la novedad está iniciada
 * @param {Array} props.embarcaciones - Lista de embarcaciones disponibles
 * @param {Array} props.boliches - Lista de boliches disponibles
 * @param {Array} props.puertos - Lista de puertos disponibles
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
      motoristas = [],
      patrones = [],
      bahiasComerciales = [], // ← AGREGAR
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
    const [faenaCreatedSuccessfully, setFaenaCreatedSuccessfully] =
      useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [faenaToDelete, setFaenaToDelete] = useState(null);
    const [puertosData, setPuertosData] = useState([]);

    // Ref para Toast
    const toast = useRef(null);

    // Configuración del formulario
    const {
      control,
      handleSubmit,
      reset,
      setValue,
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

    // Cargar datos iniciales
    useEffect(() => {
      cargarPuertos();
    }, []);

    // Cargar faenas cuando cambie el ID de novedad o el trigger
    useEffect(() => {
      if (novedadPescaConsumo.id) {
        cargarFaenas();
      }
    }, [novedadPescaConsumo.id, updateTrigger]);

    // Función para cargar puertos
    const cargarPuertos = async () => {
      try {
        const puertosResponse = await getPuertosPesca();
        setPuertosData(
          puertosResponse.map((p) => ({
            label: p.nombre,
            value: Number(p.id),
          }))
        );
      } catch (error) {
        console.error("Error al cargar puertos:", error);
      }
    };

    // Función para cargar faenas
    const cargarFaenas = async () => {
      if (!novedadPescaConsumo.id) return;

      try {
        setLoading(true);
        const faenasData = await getFaenasPescaConsumo();
        const faenasFiltradas = faenasData.filter(
          (faena) =>
            Number(faena.novedadPescaConsumoId) ===
            Number(novedadPescaConsumo.id)
        );
        setFaenas(faenasFiltradas);
      } catch (error) {
        console.error("Error al cargar faenas:", error);
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

    // Función para abrir dialog de nueva faena
    const handleNuevaFaena = () => {
      setEditingFaena(null);
      reset();
      setDialogVisible(true);
    };

    // Función para editar faena
    const handleEditarFaena = async (faena) => {
      try {
        const faenaCompleta = await getFaenaPescaConsumoPorId(faena.id);
        setEditingFaena(faenaCompleta);
        setDialogVisible(true);
      } catch (error) {
        console.error("Error al cargar faena:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar los datos de la faena",
          life: 3000,
        });
      }
    };

    // Función para eliminar faena
    const handleEliminarFaena = (faena) => {
      setFaenaToDelete(faena);
      setConfirmVisible(true);
    };

    // Confirmar eliminación
    const confirmarEliminacion = async () => {
      if (!faenaToDelete) return;

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
        console.error("Error al eliminar faena:", error);
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

    // Función para guardar faena
    const handleSubmitFaena = async (data) => {
      try {
        const faenaData = {
          ...data,
          novedadPescaConsumoId: Number(novedadPescaConsumo.id),
        };

        let resultado;
        if (editingFaena) {
          resultado = await actualizarFaenaPescaConsumo(
            editingFaena.id,
            faenaData
          );
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

        return resultado; // ← IMPORTANTE: Retornar el resultado para que el formulario obtenga el ID
      } catch (error) {
        console.error("Error al guardar faena:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.message || "Error al guardar la faena",
          life: 3000,
        });
        throw error; // ← Re-lanzar el error para que el formulario lo maneje
      }
    };

    // Template para columna de acciones
    const accionesTemplate = (rowData) => {
      return (
        <div className="flex gap-2">
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={() => handleEditarFaena(rowData)}
            tooltip="Editar faena"
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            onClick={() => handleEliminarFaena(rowData)}
            tooltip="Eliminar faena"
          />
        </div>
      );
    };

    // Template para fecha
    const fechaTemplate = (rowData, field) => {
      const fecha = rowData[field.field];
      return fecha ? new Date(fecha).toLocaleDateString("es-PE") : "-";
    };

    // Template para embarcación
    const embarcacionTemplate = (rowData) => {
      const embarcacion = embarcaciones.find(
        (e) => Number(e.id) === Number(rowData.embarcacionId)
      );
      return embarcacion ? embarcacion.nombre : "-";
    };

    // Template para boliche
    const bolicheTemplate = (rowData) => {
      const boliche = boliches.find(
        (b) => Number(b.id) === Number(rowData.bolicheId)
      );
      return boliche ? boliche.nombre : "-";
    };

    // Template para estado
    const estadoTemplate = (rowData) => {
      const estado = rowData.estadoFaena || "ACTIVO";
      const severity = estado === "ACTIVO" ? "success" : "warning";
      return <Tag value={estado} severity={severity} />;
    };

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
              La novedad debe estar iniciada para gestionar faenas de pesca
              consumo
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
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            className="p-datatable-sm"
            emptyMessage="No hay faenas registradas"
            style={{ fontSize: getResponsiveFontSize(), cursor: "pointer" }} // ← Agregar cursor: "pointer"
            onRowClick={(e) => handleEditarFaena(e.data)} // ← AGREGAR ESTA LÍNEA
            rowClassName={() => "p-selectable-row"} // ← AGREGAR ESTA LÍNEA
            header={
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "end",
                    marginTop: 18,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3>Detalle Faenas de Pesca Consumo</h3>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Button
                      label="Nueva Faena"
                      icon="pi pi-plus"
                      className="p-button-primary"
                      onClick={handleNuevaFaena}
                      disabled={!novedadPescaConsumoIniciada}
                      tooltip={
                        !novedadPescaConsumoIniciada
                          ? "La novedad debe estar iniciada para crear faenas"
                          : "Crear nueva faena"
                      }
                      size="small"
                      severity="success"
                      type="button"
                    />
                  </div>
                </div>
              </div>
            }
          >
            <Column field="id" header="ID" style={{ width: "80px" }} sortable />
            <Column
              field="descripcion"
              header="Descripción"
              sortable
              style={{ minWidth: "200px" }}
            />
            <Column
              field="fechaSalida"
              header="Fecha Salida"
              body={(rowData) =>
                fechaTemplate(rowData, { field: "fechaSalida" })
              }
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="fechaHoraFondeo"
              header="Fecha Fondeo"
              body={(rowData) =>
                fechaTemplate(rowData, { field: "fechaHoraFondeo" })
              }
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="embarcacionId"
              header="Embarcación"
              body={embarcacionTemplate}
              sortable
              style={{ minWidth: "150px" }}
            />
            <Column
              field="bolicheId"
              header="Boliche"
              body={bolicheTemplate}
              sortable
              style={{ minWidth: "150px" }}
            />
            <Column
              field="estadoFaena"
              header="Estado"
              body={estadoTemplate}
              sortable
              style={{ width: "100px" }}
            />
            <Column
              header="Acciones"
              body={accionesTemplate}
              style={{ width: "120px" }}
            />
          </DataTable>
        </Card>

        {/* Dialog para formulario de faena */}
        <Dialog
          visible={dialogVisible}
          style={{ width: "90vw", maxWidth: "1200px" }}
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
            onSubmit={handleSubmitFaena} // ← AGREGAR ESTA LÍNEA
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

        <Toast ref={toast} />
      </>
    );
  }
);

DetalleFaenasConsumoCard.displayName = "DetalleFaenasConsumoCard";

export default DetalleFaenasConsumoCard;
