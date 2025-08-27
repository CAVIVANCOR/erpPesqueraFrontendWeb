/**
 * DetalleAccionesPreviasForm.jsx
 *
 * Componente para mostrar y gestionar las acciones previas de faena de una temporada de pesca.
 * Sigue el patrón profesional ERP Megui basado en DetalleContactosEntidad.jsx.
 * Solo lectura - muestra los registros creados cuando se inicia la temporada.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { obtenerDetAccionesPreviasFaenaPorTemporada } from "../../api/detAccionesPreviasFaena";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Componente DetalleAccionesPreviasForm
 * @param {Object} props - Props del componente
 * @param {number} props.temporadaPescaId - ID de la temporada de pesca
 */
const DetalleAccionesPreviasForm = forwardRef(({ temporadaPescaId }, ref) => {
  // Estados del componente
  const [accionesPreviasData, setAccionesPreviasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Referencias
  const toast = useRef(null);
  const { usuario } = useAuthStore();

  // Función para cargar acciones previas desde la API
  const cargarAccionesPrevias = async () => {
    if (!temporadaPescaId) return;
    try {
      setLoading(true);
      const response = await obtenerDetAccionesPreviasFaenaPorTemporada(
        temporadaPescaId
      );
      setAccionesPreviasData(response);
    } catch (error) {
      console.error("❌ [FRONTEND] Error al cargar acciones previas:", error);
      setAccionesPreviasData([]);
      toast.current?.show({
        severity: "error",
        summary: "Error al Cargar",
        detail:
          error.response?.data?.message ||
          "Error al cargar las acciones previas desde el servidor",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Exponer función recargar mediante ref
  useImperativeHandle(ref, () => ({
    recargar: cargarAccionesPrevias,
  }));

  // Cargar acciones previas al montar el componente o cambiar temporadaPescaId
  useEffect(() => {
    cargarAccionesPrevias();
  }, [temporadaPescaId]);

  // Template para mostrar el estado de completado
  const completadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.cumplida ? "COMPLETADO" : "PENDIENTE"}
        severity={rowData.cumplida ? "success" : "warning"}
        style={{
          fontSize: getResponsiveFontSize(),
          fontWeight: "bold",
        }}
      />
    );
  };

  // Template para mostrar la acción previa
  const accionTemplate = (rowData) => {
    return (
      <span style={{ fontWeight: "bold" }}>
        {rowData.accionPrevia?.descripcion || "N/A"}
      </span>
    );
  };

  // Template para mostrar el responsable
  const responsableTemplate = (rowData) => {
    return rowData.responsable?.nombres || "Sin asignar";
  };

  // Template para mostrar el verificador
  const verificadorTemplate = (rowData) => {
    return rowData.verificador?.nombres || "Sin asignar";
  };

  // Template para mostrar fecha de creación
  const fechaCreacionTemplate = (rowData) => {
    return rowData.fechaCreacion
      ? new Date(rowData.fechaCreacion).toLocaleDateString("es-ES")
      : "N/A";
  };

  // Template para mostrar ID de faena
  const idFaenaTemplate = (rowData) => {
    return rowData.faenaPesca?.id || "-";
  };

  // Template para mostrar fecha de salida de faena
  const fechaSalidaFaenaTemplate = (rowData) => {
    return rowData.faenaPesca?.fechaSalida
      ? new Date(rowData.faenaPesca.fechaSalida).toLocaleDateString("es-ES")
      : "-";
  };

  // Template para mostrar fecha de retorno de faena
  const fechaRetornoFaenaTemplate = (rowData) => {
    return rowData.faenaPesca?.fechaRetorno
      ? new Date(rowData.faenaPesca.fechaRetorno).toLocaleDateString("es-ES")
      : "-";
  };

  // Template para mostrar nombre de la embarcación
  const nombreEmbarcacionTemplate = (rowData) => {
    return rowData.faenaPesca?.embarcacion?.activo?.nombre || "-";
  };

  // Header de la tabla con filtro global
  const header = (
    <Toolbar
      className="mb-4"
      start={
        <div className="flex align-items-center gap-2">
          <h5 className="m-0">Acciones Previas de Faena</h5>
          <Tag
            value={`${accionesPreviasData.length} registro${
              accionesPreviasData.length !== 1 ? "s" : ""
            }`}
            severity="info"
          />
        </div>
      }
      end={<div className="flex align-items-center gap-2"></div>}
    />
  );

  return (
    <div className="card">
      <DataTable
        value={accionesPreviasData}
        loading={loading}
        //</div>header={header}
        globalFilter={globalFilter}
        emptyMessage="No se encontraron acciones previas para esta temporada"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        size="small"
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              gap: 5,
              flexDirection: window.innerWidth < 768 ? "column" : "row",
            }}
          >
            <div style={{ flex: 2 }}>
              <h3 className="m-0">Acciones Previas de Faena</h3>
            </div>
            <div style={{ flex: 1 }}>
              <Tag
                value={`${accionesPreviasData.length} registro${
                  accionesPreviasData.length !== 1 ? "s" : ""
                }`}
                severity="info"
              />
            </div>
            <div style={{ flex: 2 }}>
              <span className="p-input-icon-left">
                <InputText
                  type="search"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar..."
                  style={{ width: "300px" }}
                />
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <Button
                icon="pi pi-refresh"
                className="p-button-outlined"
                onClick={cargarAccionesPrevias}
                tooltip="Actualizar lista"
                tooltipOptions={{ position: "top" }}
                type="button"
              />
            </div>
          </div>
        }
      >
        <Column
          field="accionPrevia.descripcion"
          header="Acción Previa"
          body={accionTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="cumplida"
          header="Estado"
          body={completadoTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="responsable.nombres"
          header="Responsable"
          body={responsableTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="verificador.nombres"
          header="Verificador"
          body={verificadorTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="faenaPesca.id"
          header="ID Faena"
          body={idFaenaTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          field="faenaPesca.fechaSalida"
          header="Fecha Salida"
          body={fechaSalidaFaenaTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="faenaPesca.fechaRetorno"
          header="Fecha Retorno"
          body={fechaRetornoFaenaTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="faenaPesca.embarcacion.activo.nombre"
          header="Embarcación"
          body={nombreEmbarcacionTemplate}
          sortable
          style={{ minWidth: "150px" }}
        />
      </DataTable>
      <Toast ref={toast} />
    </div>
  );
});

DetalleAccionesPreviasForm.displayName = "DetalleAccionesPreviasForm";

export default DetalleAccionesPreviasForm;
