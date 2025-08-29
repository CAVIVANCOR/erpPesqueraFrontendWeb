/**
 * DetalleFaenasPescaCard.jsx
 *
 * Card para mostrar y gestionar las faenas de pesca relacionadas con una temporada.
 * Incluye funcionalidad CRUD completa para FaenaPesca.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Controller, useForm } from "react-hook-form";
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
import { getTemporadaPescaPorId } from "../../api/temporadaPesca";
import { getPuertosPesca } from "../../api/puertoPesca";
import { getEmbarcaciones } from "../../api/embarcacion";
import { getAllBolicheRed } from "../../api/bolicheRed";
import { 
  getBahiasComerciales,
  getMotoristas,
  getPatrones 
} from "../../api/personal";
import { getResponsiveFontSize } from "../../utils/utils";


// Esquema de validación
const schema = yup.object().shape({
  descripcion: yup.string().required("La descripción es obligatoria"),
  fechaSalida: yup.date().required("La fecha de salida es obligatoria"),
  fechaRetorno: yup.date().required("La fecha de retorno es obligatoria"),
  embarcacionId: yup.number().required("La embarcación es obligatoria"),
  bolicheId: yup.number().required("El boliche es obligatorio"),
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
 * @param {Object} props.temporadaData - Data de la temporada de pesca
 */
const DetalleFaenasPescaCard = ({
  temporadaPescaId,
  embarcaciones = [],
  boliches = [],
  puertos = [],
  bahiasComerciales = [],
  motoristas = [],
  patrones = [],
  temporadaData,
}) => {
  // Estados
  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingFaena, setEditingFaena] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [faenaToDelete, setFaenaToDelete] = useState(null);
  const [puertosData, setPuertosData] = useState([]);

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
      fechaRetorno: null,
      embarcacionId: null,
      bolicheId: null,
      observaciones: "",
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
      fechaRetorno: null,
      embarcacionId: null,
      bolicheId: null,
      observaciones: "",
    });
    setDialogVisible(true);
  };

  /**
   * Abrir diálogo para editar faena
   */
  const handleEditarFaena = async (faena) => {
    try {
      const faenaCompleta = await getFaenaPescaPorId(faena.id);
      setEditingFaena(faenaCompleta);
      reset({
        descripcion: faenaCompleta.descripcion || "",
        fechaSalida: faenaCompleta.fechaSalida
          ? new Date(faenaCompleta.fechaSalida)
          : null,
        fechaRetorno: faenaCompleta.fechaRetorno
          ? new Date(faenaCompleta.fechaRetorno)
          : null,
        embarcacionId: faenaCompleta.embarcacionId,
        bolicheId: faenaCompleta.bolicheId,
        observaciones: faenaCompleta.observaciones || "",
      });
      setDialogVisible(true);
    } catch (error) {
      console.error("Error cargando faena:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los datos de la faena",
        life: 3000,
      });
    }
  };

  /**
   * Guardar faena
   */
  const onSubmit = async (data) => {
    console.log("DetalleFaenasPescaCard - onSubmit ejecutándose");
    console.log("Data recibida:", data);
    console.log("editingFaena:", editingFaena);
    
    try {
      const faenaData = {
        ...data,
        temporadaId: temporadaPescaId,
        fechaSalida: data.fechaSalida.toISOString(),
        fechaRetorno: data.fechaRetorno.toISOString(),
      };
      
      console.log("faenaData preparada:", faenaData);

      if (editingFaena) {
        console.log("Actualizando faena con ID:", editingFaena.id);
        await actualizarFaenaPesca(editingFaena.id, faenaData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena actualizada correctamente",
          life: 3000,
        });
      } else {
        console.log("Creando nueva faena");
        await crearFaenaPesca(faenaData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Faena creada correctamente",
          life: 3000,
        });
      }

      setDialogVisible(false);
      cargarFaenas();
    } catch (error) {
      console.error("Error guardando faena:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la faena",
        life: 3000,
      });
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
    const puerto = puertosData.find(p => p.id === puertoId);
    return puerto ? puerto.nombre : 'N/A';
  };

  // Configuración de columnas
  const columns = [
    {
      field: "descripcion",
      header: "Descripción",
      sortable: true,
    },
    {
      field: "fechaSalida",
      header: "Fecha Salida",
      sortable: true,
      body: (rowData) => rowData.fechaSalida ? new Date(rowData.fechaSalida).toLocaleDateString() : '-',
    },
    {
      field: "fechaRetorno",
      header: "Fecha Retorno",
      sortable: true,
      body: (rowData) => rowData.fechaRetorno ? new Date(rowData.fechaRetorno).toLocaleDateString() : '-',
    },
    {
      field: "embarcacionId",
      header: "Embarcación",
      sortable: true,
      body: (rowData) => {
        console.log("Embarcación rowData:", rowData.embarcacionId, "embarcaciones:", embarcaciones);
        const embarcacion = embarcaciones.find(e => Number(e.id) === Number(rowData.embarcacionId));
        return embarcacion ? embarcacion.activo?.nombre || 'Sin nombre' : 'N/A';
      },
    },
    {
      field: "bolicheRedId",
      header: "Boliche",
      sortable: true,
      body: (rowData) => {
        console.log("Boliche rowData:", rowData.bolicheRedId, "boliches:", boliches);
        const boliche = boliches.find(b => Number(b.id) === Number(rowData.bolicheRedId));
        return boliche ? boliche.descripcion : 'N/A';
      },
    },
    {
      field: "bahiaId",
      header: "Bahía",
      sortable: true,
      body: (rowData) => {
        console.log("Bahía rowData:", rowData.bahiaId, "bahiasComerciales:", bahiasComerciales);
        const bahia = bahiasComerciales.find(b => Number(b.id) === Number(rowData.bahiaId));
        return bahia ? `${bahia.nombres} ${bahia.apellidos}` : 'N/A';
      },
    },
    {
      field: "patronId",
      header: "Patrón",
      sortable: true,
      body: (rowData) => {
        console.log("Patrón rowData:", rowData.patronId, "patrones:", patrones);
        const patron = patrones.find(p => Number(p.id) === Number(rowData.patronId));
        return patron ? `${patron.nombres} ${patron.apellidos}` : 'N/A';
      },
    },
    {
      field: "motoristaId",
      header: "Motorista",
      sortable: true,
      body: (rowData) => {
        console.log("Motorista rowData:", rowData.motoristaId, "motoristas:", motoristas);
        const motorista = motoristas.find(m => Number(m.id) === Number(rowData.motoristaId));
        return motorista ? `${motorista.nombres} ${motorista.apellidos}` : 'N/A';
      },
    },
    {
      field: "puertoSalidaId",
      header: "Puerto Salida",
      sortable: true,
      body: (rowData) => obtenerNombrePuerto(rowData.puertoSalidaId),
    },
    {
      field: "puertoRetornoId",
      header: "Puerto Retorno",
      sortable: true,
      body: (rowData) => obtenerNombrePuerto(rowData.puertoRetornoId),
    },
    {
      field: "puertoDescargaId",
      header: "Puerto Descarga",
      sortable: true,
      body: (rowData) => obtenerNombrePuerto(rowData.puertoDescargaId),
    },
    {
      field: "estado",
      header: "Estado",
      sortable: true,
      body: (rowData) => (
        <Tag
          value={rowData.estado}
          severity={rowData.estado === "ACTIVO" ? "success" : "danger"}
        />
      ),
    },
    {
      header: "Acciones",
      body: (rowData) => (
        <div className="flex gap-2">
          <Button
            type="button"
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-warning"
            onClick={() => handleEditarFaena(rowData)}
            tooltip="Editar"
          />
          <Button
            type="button"
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleEliminarFaena(rowData)}
            tooltip="Eliminar"
          />
        </div>
      ),
    },
  ];

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
        <Button
          label="Nueva Faena"
          icon="pi pi-plus"
          onClick={handleNuevaFaena}
          disabled={!temporadaPescaId}
        />
      }
    />
  );

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

      <Card
        title={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-anchor text-2xl"></i>
            <span className="text-xl font-bold">Faenas de Pesca</span>
          </div>
        }
        className="shadow-2"
      >
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
            emptyMessage="No hay faenas registradas para esta temporada"
            className="p-datatable-sm"
            onRowClick={(e) => handleEditarFaena(e.data)}
            style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
          >
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
        header={editingFaena ? "Editar Faena de Pesca" : "Nueva Faena de Pesca"}
        modal
        onHide={() => setDialogVisible(false)}
      >
        <FaenaPescaForm
          isEdit={!!editingFaena}
          defaultValues={editingFaena || {}}
          onSubmit={onSubmit}
          onCancel={() => setDialogVisible(false)}
          loading={loading}
          temporadaData={temporadaData}
          embarcacionesOptions={embarcaciones.map((e) => ({ 
            label: e.activo?.nombre || e.nombre || 'Sin nombre', 
            value: e.id 
          }))}
          bolichesOptions={boliches.map((b) => ({ label: b.descripcion, value: b.id }))}
          bahiasComercialesOptions={bahiasComerciales.map((b) => ({ label: `${b.nombres} ${b.apellidos}`, value: b.id }))}
          motoristasOptions={motoristas.map((m) => ({ label: `${m.nombres} ${m.apellidos}`, value: m.id }))}
          patronesOptions={patrones.map((p) => ({ label: `${p.nombres} ${p.apellidos}`, value: p.id }))}
          puertosOptions={puertosData.map((p) => ({ label: p.nombre, value: p.id }))}
        />
      </Dialog>
    </div>
  );
};

export default DetalleFaenasPescaCard;
