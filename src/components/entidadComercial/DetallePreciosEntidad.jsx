/**
 * DetallePreciosEntidad.jsx
 * 
 * Componente principal modularizado para gestionar precios especiales.
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
import PrecioEntidadTable from "./preciosEntidad/PrecioEntidadTable";
import PrecioEntidadDialog from "./preciosEntidad/PrecioEntidadDialog";
import { usePreciosEntidad } from "./preciosEntidad/usePreciosEntidad";

const DetallePreciosEntidad = forwardRef(
  (
    {
      entidadComercialId,
      empresaId,
      monedas = [],
      readOnly = false,
      permisos = {},
    },
    ref
  ) => {
    const toast = useRef(null);
    
    // Estados locales
    const [dialogVisible, setDialogVisible] = useState(false);
    const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");

    // Custom hook con toda la lógica de negocio
    const {
      preciosData,
      loading,
      productosOptions,
      monedasOptions,
      crear,
      actualizar,
      eliminar,
      recargar,
    } = usePreciosEntidad(entidadComercialId, empresaId, monedas, toast);

    // Exponer función recargar mediante ref
    useImperativeHandle(ref, () => ({
      recargar,
    }));

    /**
     * Abre el diálogo para crear nuevo precio
     */
    const abrirDialogoNuevo = () => {
      setPrecioSeleccionado(null);
      setDialogVisible(true);
    };

    /**
     * Abre el diálogo para editar precio existente
     */
    const abrirDialogoEdicion = (precio) => {
      setPrecioSeleccionado(precio);
      setDialogVisible(true);
    };

    /**
     * Cierra el diálogo
     */
    const cerrarDialogo = () => {
      setDialogVisible(false);
      setPrecioSeleccionado(null);
    };

    /**
     * Maneja el submit del formulario (crear o actualizar)
     */
    const handleSubmit = async (data) => {
      let success = false;

      if (precioSeleccionado && precioSeleccionado.id) {
        // Actualizar
        success = await actualizar(precioSeleccionado.id, data, precioSeleccionado);
      } else {
        // Crear
        success = await crear(data);
      }

      if (success) {
        cerrarDialogo();
      }
    };

    /**
     * Confirma eliminación de precio
     */
    const confirmarEliminacion = (precio) => {
      confirmDialog({
        message: `¿Está seguro de eliminar el precio especial para ${
          precio.producto?.descripcionArmada || "este producto"
        }?`,
        header: "Confirmar Eliminación",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: () => eliminar(precio.id),
        reject: () => {},
      });
    };

    return (
      <div className="p-4">
        <Toast ref={toast} />
        <ConfirmDialog />
        
        <PrecioEntidadTable
          data={preciosData}
          loading={loading}
          onEdit={abrirDialogoEdicion}
          onDelete={confirmarEliminacion}
          onNew={abrirDialogoNuevo}
          globalFilter={globalFilter}
          onGlobalFilterChange={(e) => setGlobalFilter(e.target.value)}
          productosOptions={productosOptions}
          monedasOptions={monedasOptions}
          monedas={monedas}
          permisos={permisos}
          readOnly={readOnly}
        />

        <PrecioEntidadDialog
          visible={dialogVisible}
          precio={precioSeleccionado}
          productosOptions={productosOptions}
          monedasOptions={monedasOptions}
          onHide={cerrarDialogo}
          onSubmit={handleSubmit}
          loading={loading}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

DetallePreciosEntidad.displayName = "DetallePreciosEntidad";

export default DetallePreciosEntidad;