/**
 * DetallePlataformasRecepcion.jsx
 * 
 * Componente principal modularizado para gestionar plataformas de recepción.
 * Orquesta los componentes hijos y maneja el estado global.
 * 
 * @author ERP Megui
 * @version 1.0.0
 */

import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { confirmDialog } from "primereact/confirmdialog";
import PlataformaRecepcionTable from "./plataformasRecepcion/PlataformaRecepcionTable";
import PlataformaRecepcionDialog from "./plataformasRecepcion/PlataformaRecepcionDialog";
import { usePlataformasRecepcion } from "./plataformasRecepcion/usePlataformasRecepcion";

const DetallePlataformasRecepcion = forwardRef(
  (
    {
      entidadComercialId,
      readOnly = false,
      permisos = {},
    },
    ref
  ) => {
    const toast = useRef(null);
    
    // Estados locales
    const [dialogVisible, setDialogVisible] = useState(false);
    const [plataformaSeleccionada, setPlataformaSeleccionada] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");

    // Custom hook con toda la lógica de negocio
    const {
      plataformasData,
      loading,
      puertosOptions,
      crear,
      actualizar,
      eliminar,
      recargar,
    } = usePlataformasRecepcion(entidadComercialId, toast);

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar,
    }));

    /**
     * Abre el diálogo para crear nueva plataforma
     */
    const abrirDialogoNuevo = () => {
      setPlataformaSeleccionada(null);
      setDialogVisible(true);
    };

    /**
     * Abre el diálogo para editar plataforma existente
     */
    const abrirDialogoEdicion = (plataforma) => {
      setPlataformaSeleccionada(plataforma);
      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setPlataformaSeleccionada(null);
    };

    /**
     * Maneja el submit del formulario (crear o actualizar)
     */
    const handleSubmit = async (data) => {
      let success = false;

      if (plataformaSeleccionada && plataformaSeleccionada.id) {
        // Actualizar
        success = await actualizar(plataformaSeleccionada.id, data, plataformaSeleccionada);
      } else {
        // Crear
        success = await crear(data);
      }

      if (success) {
        cerrarDialogo();
      }
    };

    /**
     * Confirma eliminación de plataforma
     */
    const confirmarEliminacion = (plataforma) => {
      confirmDialog({
        message: `¿Está seguro de eliminar la plataforma "${
          plataforma.nombre || "esta plataforma"
        }"?`,
        header: "Confirmar Eliminación",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: () => eliminar(plataforma.id),
        reject: () => {},
      });
    };

    return (
      <div className="p-4">
        <Toast ref={toast} />
        <ConfirmDialog />
        
        <PlataformaRecepcionTable
          data={plataformasData}
          loading={loading}
          onEdit={abrirDialogoEdicion}
          onDelete={confirmarEliminacion}
          onNew={abrirDialogoNuevo}
          globalFilter={globalFilter}
          onGlobalFilterChange={(e) => setGlobalFilter(e.target.value)}
          puertosOptions={puertosOptions}
          permisos={permisos}
          readOnly={readOnly}
        />

        <PlataformaRecepcionDialog
          visible={dialogVisible}
          plataforma={plataformaSeleccionada}
          puertosOptions={puertosOptions}
          onHide={cerrarDialogo}
          onSubmit={handleSubmit}
          loading={loading}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

DetallePlataformasRecepcion.displayName = "DetallePlataformasRecepcion";

export default DetallePlataformasRecepcion;