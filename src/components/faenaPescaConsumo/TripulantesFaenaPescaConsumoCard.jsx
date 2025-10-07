/**
 * TripulantesFaenaPescaConsumoCard.jsx
 *
 * Componente para mostrar y gestionar los tripulantes de una faena de pesca consumo.
 * Permite listar y ver detalles de tripulantes (solo lectura).
 * Los tripulantes se crean automáticamente al iniciar la novedad.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Avatar } from "primereact/avatar";
import { getResponsiveFontSize } from "../../utils/utils";
import TripulanteFaenaConsumoForm from "./TripulanteFaenaConsumoForm";
import {
  getTripulantesPorFaena,
  updateTripulanteFaenaConsumo,
  regenerarTripulantes,
} from "../../api/tripulanteFaenaConsumo";

const TripulantesFaenaPescaConsumoCard = ({
  faenaPescaConsumoId,
  novedadData,
  personal = [],
  loading = false,
  onDataChange,
  onTripulantesChange, // Callback para notificar cambios
  onFaenasChange, // Callback para notificar cambios en faenas
}) => {
  const [tripulantes, setTripulantes] = useState([]);
  const [selectedTripulante, setSelectedTripulante] = useState(null);
  const [tripulanteDialog, setTripulanteDialog] = useState(false);
  const [editingTripulante, setEditingTripulante] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loadingTripulantes, setLoadingTripulantes] = useState(false);
  const toast = useRef(null);

  // Cargar tripulantes al montar el componente o cambiar faenaPescaConsumoId
  useEffect(() => {
    if (faenaPescaConsumoId) {
      cargarTripulantes();
    }
  }, [faenaPescaConsumoId]);

  const cargarTripulantes = async () => {
    if (!faenaPescaConsumoId) return;

    setLoadingTripulantes(true);
    try {
      const data = await getTripulantesPorFaena(faenaPescaConsumoId);
      setTripulantes(data || []);

      // Notificar cambios al componente padre
      if (onTripulantesChange) {
        onTripulantesChange(data || []);
      }
    } catch (error) {
      console.error("Error al cargar tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los tripulantes de la faena",
        life: 3000,
      });
    } finally {
      setLoadingTripulantes(false);
    }
  };

  const handleRegenerarTripulantes = async () => {
    if (!faenaPescaConsumoId) return;

    setLoadingTripulantes(true);
    try {
      const resultado = await regenerarTripulantes(faenaPescaConsumoId);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Tripulantes actualizados: ${resultado.creados} creados, ${resultado.actualizados} actualizados`,
        life: 5000,
      });

      // Recargar tripulantes
      await cargarTripulantes();
    } catch (error) {
      console.error("Error al regenerar tripulantes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al regenerar los tripulantes de la faena",
        life: 3000,
      });
    } finally {
      setLoadingTripulantes(false);
    }
  };

  const handleVerTripulante = (tripulante) => {
    setEditingTripulante(tripulante);
    setTripulanteDialog(true);
  };

  const handleGuardarTripulante = async (datosActualizados) => {
    try {
      await updateTripulanteFaenaConsumo(
        editingTripulante.id,
        datosActualizados
      );

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Observaciones del tripulante actualizadas correctamente",
        life: 3000,
      });

      // Recargar datos
      await cargarTripulantes();
      setTripulanteDialog(false);
      setEditingTripulante(null);

      // Notificar cambios
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error al actualizar tripulante:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar las observaciones del tripulante",
        life: 3000,
      });
    }
  };

  // Template para mostrar el cargo
  const cargoBodyTemplate = (rowData) => {
    const cargoMap = {
      14: { label: "Motorista", severity: "info" },
      21: { label: "Tripulante", severity: "success" },
      22: { label: "Patrón", severity: "warning" },
    };

    const cargo = cargoMap[rowData.cargoId] || {
      label: "Sin Cargo",
      severity: "secondary",
    };

    return (
      <Tag
        value={cargo.label}
        severity={cargo.severity}
        style={{ fontSize: getResponsiveFontSize() }}
      />
    );
  };

  // Template para mostrar nombre completo
  const nombreCompletoBodyTemplate = (rowData) => {
    return (
      `${rowData.apellidos || ""} ${rowData.nombres || ""}`.trim() ||
      "Sin nombre"
    );
  };

  // Template para observaciones
  const observacionesBodyTemplate = (rowData) => {
    if (!rowData.observaciones) {
      return (
        <span style={{ color: "#6c757d", fontStyle: "italic" }}>
          Sin observaciones
        </span>
      );
    }

    const texto =
      rowData.observaciones.length > 50
        ? `${rowData.observaciones.substring(0, 50)}...`
        : rowData.observaciones;

    return <span title={rowData.observaciones}>{texto}</span>;
  };

  // Template para fecha de creación
  const fechaCreacionBodyTemplate = (rowData) => {
    return rowData.createdAt
      ? new Date(rowData.createdAt).toLocaleString("es-PE")
      : "-";
  };

  // Template para avatar
  const avatarBodyTemplate = (rowData) => {
    const nombres = rowData.nombres || "";
    const apellidos = rowData.apellidos || "";
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    // Construir URL completa igual que en Personal.jsx
    const urlFoto = rowData.personal?.urlFotoPersona
      ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${
          rowData.personal.urlFotoPersona
        }`
      : undefined;

    // Si hay foto, muestra el avatar con imagen; si no, iniciales
    if (urlFoto) {
      return (
        <span data-pr-tooltip={nombreCompleto} data-pr-position="right">
          <Avatar
            image={urlFoto}
            shape="circle"
            size="large"
            alt="Foto"
            style={{ width: "40px", height: "40px" }}
            onImageError={(e) => {
              console.error("Error cargando imagen avatar:", urlFoto, e);
            }}
          />
        </span>
      );
    } else {
      // Avatar con iniciales si no hay foto
      const iniciales = `${nombres.charAt(0)}${apellidos.charAt(
        0
      )}`.toUpperCase();
      return (
        <span data-pr-tooltip={nombreCompleto} data-pr-position="right">
          <Avatar
            label={iniciales}
            shape="circle"
            size="large"
            style={{
              backgroundColor: "#2196F3",
              color: "#fff",
              width: "40px",
              height: "40px",
              fontWeight: "bold",
              fontSize: 16,
            }}
          />
        </span>
      );
    }
  };

  // Template para tipo documento
  const tipoDocumentoBodyTemplate = (rowData) => {
    return rowData.personal?.tipoDocIdentidad?.codigo || "Sin tipo";
  };

  // Template para número documento
  const numeroDocumentoBodyTemplate = (rowData) => {
    return rowData.personal?.numeroDocumento || "Sin número";
  };

  // Template para teléfono
  const telefonoBodyTemplate = (rowData) => {
    return rowData.personal?.telefono || "Sin teléfono";
  };

  return (
    <div className="tripulantes-faena-card">
      <Toast ref={toast} />
      <Card>
        {!faenaPescaConsumoId ? (
          <div className="text-center p-4">
            <i className="pi pi-info-circle text-4xl text-blue-500 mb-3"></i>
            <p className="text-lg">
              Seleccione una faena para ver sus tripulantes
            </p>
          </div>
        ) : (
          <DataTable
            value={tripulantes}
            loading={loadingTripulantes || loading}
            paginator
            rows={20}
            showGridlines
            emptyMessage="No hay tripulantes registrados para esta faena"
            className="p-datatable-sm"
            onRowClick={(e) => handleVerTripulante(e.data)}
            style={{ cursor: "pointer", fontSize: getResponsiveFontSize() }}
            globalFilter={globalFilter}
            header={
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2 className="m-0">Tripulantes de la Faena</h2>
                </div>
                <div style={{ flex: 1 }}>
                  <InputText
                    type="search"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar tripulante..."
                    size="small"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Button
                    label="Actualizar"
                    icon="pi pi-refresh"
                    className="p-button-outlined"
                    onClick={handleRegenerarTripulantes}
                    size="small"
                    loading={loadingTripulantes}
                  />
                </div>
              </div>
            }
            dataKey="id"
          >
            <Column
              field="avatar"
              header="Avatar"
              body={avatarBodyTemplate}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              field="cargoId"
              header="Cargo"
              body={cargoBodyTemplate}
              sortable
              style={{ width: "120px" }}
            />
            <Column
              header="Nombre Completo"
              body={nombreCompletoBodyTemplate}
              sortable
              style={{ minWidth: "200px" }}
            />
            <Column
              field="tipoDocumentoId"
              header="Tipo Documento"
              body={tipoDocumentoBodyTemplate}
              sortable
              style={{ width: "150px" }}
            />
            <Column
              field="numeroDocumento"
              header="Número Documento"
              body={numeroDocumentoBodyTemplate}
              sortable
              style={{ width: "150px" }}
            />
            <Column
              field="telefono"
              header="Teléfono"
              body={telefonoBodyTemplate}
              sortable
              style={{ width: "150px" }}
            />
            <Column
              field="observaciones"
              header="Observaciones"
              body={observacionesBodyTemplate}
              style={{ minWidth: "200px" }}
            />
            <Column
              field="createdAt"
              header="Fecha Registro"
              body={fechaCreacionBodyTemplate}
              sortable
              style={{ width: "150px" }}
            />
          </DataTable>
        )}
      </Card>

      {/* Diálogo para ver/editar tripulante */}
      <Dialog
        visible={tripulanteDialog}
        style={{ width: "600px" }}
        header="Detalles del Tripulante"
        modal
        onHide={() => {
          setTripulanteDialog(false);
          setEditingTripulante(null);
        }}
      >
        {editingTripulante && (
          <TripulanteFaenaConsumoForm
            tripulante={editingTripulante}
            personal={personal}
            onGuardadoExitoso={handleGuardarTripulante}
            onCancelar={() => {
              setTripulanteDialog(false);
              setEditingTripulante(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
};

export default TripulantesFaenaPescaConsumoCard;
