/**
 * DetalleCotizacionCompra.jsx
 * Componente para editar el detalle de una cotización con edición inline
 */
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { confirmDialog } from "primereact/confirmdialog";
import {
  actualizarDetalleCotizacion,
  agregarProductoAlternativo,
  eliminarDetalleCotizacion,
  marcarSeleccionadoParaOC,
} from "../../api/cotizacionProveedor";
import { getProductos } from "../../api/producto";
import { formatearNumero } from "../../utils/utils";

export default function DetalleCotizacionCompra({
  cotizacion,
  visible,
  onHide,
  toast,
  puedeEditar,
}) {
  const [detalles, setDetalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialogProductoAlt, setShowDialogProductoAlt] = useState(false);
  const [showDialogEditarItem, setShowDialogEditarItem] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);
  const [mostrarSoloSeleccionados, setMostrarSoloSeleccionados] = useState(false);

  const [formProductoAlt, setFormProductoAlt] = useState({
    productoId: null,
    cantidad: 0,
    precioUnitario: 0,
    observaciones: "",
  });

  const [formEditarItem, setFormEditarItem] = useState({
    cantidad: 0,
    precioUnitario: 0,
  });

  useEffect(() => {
    if (cotizacion) {
      cargarDetalles();
      cargarProductos();
    }
  }, [cotizacion]);

  const cargarDetalles = () => {
    const detallesOrdenados = [...cotizacion.detalles].sort((a, b) => Number(a.id) - Number(b.id));
    const detallesFormateados = detallesOrdenados.map((d, index) => ({
      ...d,
      nroItem: index + 1,
      precioUnitario: Number(d.precioUnitario) || 0,
      cantidad: Number(d.cantidad) || 0,
      subtotal: Number(d.subtotal) || 0,
      descripcionProducto: d.producto?.descripcionArmada || d.producto?.nombre || "",
      unidadEmpaque: d.producto?.unidadMedida?.nombre || "",
      esSeleccionadoParaOrdenCompra: Boolean(d.esSeleccionadoParaOrdenCompra),
    }));
    setDetalles(detallesFormateados);
  };
  const cargarProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field } = e;
    const nuevos = [...detalles];
    const index = nuevos.findIndex((d) => d.nroItem === rowData.nroItem);

    if (index !== -1) {
      if (field === "productoId") {
        const productoSeleccionado = productos.find(
          (p) => Number(p.id) === Number(newValue)
        );
        if (productoSeleccionado) {
          nuevos[index].productoId = Number(newValue);
          nuevos[index].producto = productoSeleccionado;
          nuevos[index].descripcionProducto = productoSeleccionado.descripcionArmada || productoSeleccionado.nombre || "";
          nuevos[index].unidadEmpaque = productoSeleccionado.unidadMedida?.nombre || "";
          nuevos[index].esProductoAlternativo = true;
        }
      } else {
        nuevos[index][field] = newValue;
      }

      // Recalcular subtotal
      if (field === "cantidad" || field === "precioUnitario") {
        nuevos[index].cantidad = field === "cantidad" ? newValue : nuevos[index].cantidad;
        nuevos[index].precioUnitario = field === "precioUnitario" ? newValue : nuevos[index].precioUnitario;
        nuevos[index].subtotal =
          Number(nuevos[index].cantidad) *
          Number(nuevos[index].precioUnitario);
        
        // Guardar en backend inmediatamente
        try {
          await actualizarDetalleCotizacion(rowData.id, {
            cantidad: Number(nuevos[index].cantidad),
            precioUnitario: Number(nuevos[index].precioUnitario),
          });
          
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Cambio guardado",
            life: 1500,
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error al guardar el cambio",
            life: 3000,
          });
          return; // No actualizar el estado si falla
        }
      }

      setDetalles(nuevos);
    }
  };

  // Componente separado para el editor de números (cumple reglas de hooks)
  const NumberEditor = ({ value, onValueChange }) => {
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      // Seleccionar todo el texto cuando el input se monta
      if (inputRef.current) {
        const input = inputRef.current.getInput();
        if (input) {
          setTimeout(() => {
            input.select();
          }, 0);
        }
      }
    }, []);

    return (
      <InputNumber
        ref={inputRef}
        value={value}
        onValueChange={onValueChange}
        mode="decimal"
        minFractionDigits={2}
        maxFractionDigits={2}
        style={{ width: "100%" }}
        onFocus={(e) => {
          // Seleccionar todo al hacer focus
          setTimeout(() => {
            e.target.select();
          }, 0);
        }}
      />
    );
  };

  const numberEditor = (options) => {
    return (
      <NumberEditor
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
      />
    );
  };

  const handleGuardarCambios = async () => {
    try {
      setLoading(true);
      await Promise.all(
        detalles.map((d) =>
          actualizarDetalleCotizacion(d.id, {
            precioUnitario: d.precioUnitario,
            cantidad: d.cantidad,
          })
        )
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Cambios guardados correctamente",
      });
      onHide();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cambios",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProductoAlt = () => {
    setFormProductoAlt({
      productoId: null,
      cantidad: 0,
      precioUnitario: 0,
      observaciones: "Producto alternativo",
    });
    setShowDialogProductoAlt(true);
  };

  const handleGuardarProductoAlt = async () => {
    if (!formProductoAlt.productoId || !formProductoAlt.cantidad) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Complete los campos obligatorios",
      });
      return;
    }
    try {
      setLoading(true);
      await agregarProductoAlternativo(cotizacion.id, formProductoAlt);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto alternativo agregado",
      });
      setShowDialogProductoAlt(false);
      onHide();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al agregar producto",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarItem = (rowData) => {
    if (!rowData.id) {
      const nuevos = detalles.filter((d) => d.nroItem !== rowData.nroItem);
      setDetalles(nuevos);
      return;
    }

    confirmDialog({
      message: "¿Eliminar este item?",
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await eliminarDetalleCotizacion(rowData.id);
          toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Item eliminado",
          });
          const nuevos = detalles.filter((d) => d.nroItem !== rowData.nroItem);
          setDetalles(nuevos);
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.error || "Error al eliminar",
          });
        }
      },
    });
  };

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
  };

  const handleEditarItem = (rowData) => {
    setItemEditar(rowData);
    setFormEditarItem({
      cantidad: Number(rowData.cantidad) || 0,
      precioUnitario: Number(rowData.precioUnitario) || 0,
    });
    setShowDialogEditarItem(true);
  };

  const handleGuardarEdicionItem = async () => {
    try {
      setLoading(true);
      
      // Guardar en backend
      await actualizarDetalleCotizacion(itemEditar.id, {
        cantidad: formEditarItem.cantidad,
        precioUnitario: formEditarItem.precioUnitario,
      });
      
      // Actualizar estado local
      const nuevos = [...detalles];
      const index = nuevos.findIndex((d) => d.nroItem === itemEditar.nroItem);
      
      if (index !== -1) {
        nuevos[index].cantidad = formEditarItem.cantidad;
        nuevos[index].precioUnitario = formEditarItem.precioUnitario;
        nuevos[index].subtotal = Number(formEditarItem.cantidad) * Number(formEditarItem.precioUnitario);
        setDetalles(nuevos);
      }
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Item actualizado correctamente",
        life: 2000,
      });
      
      setShowDialogEditarItem(false);
      setItemEditar(null);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar el item",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeleccion = async (rowData) => {
    try {
      const nuevoEstado = !rowData.esSeleccionadoParaOrdenCompra;
      
      // Actualizar en backend
      await marcarSeleccionadoParaOC(rowData.id, nuevoEstado);
      
      // Actualizar localmente el objeto cotizacion
      const detallesActualizados = cotizacion.detalles.map((d) => 
        d.id === rowData.id 
          ? { ...d, esSeleccionadoParaOrdenCompra: nuevoEstado }
          : d
      );
      
      cotizacion.detalles = detallesActualizados;
      
      // Recargar detalles desde cotizacion actualizada
      cargarDetalles();
      
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: nuevoEstado ? "Item seleccionado para OC" : "Item desmarcado",
        life: 2000,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar selección",
      });
    }
  };

  const contarSeleccionados = () => {
    return detalles.filter((d) => d.esSeleccionadoParaOrdenCompra).length;
  };

  const detallesFiltrados = mostrarSoloSeleccionados
    ? detalles.filter((d) => d.esSeleccionadoParaOrdenCompra)
    : detalles;

  return (
    <>
      <Dialog
        header={`Editar Precios - ${cotizacion?.proveedor?.razonSocial}`}
        visible={visible}
        style={{ width: "95vw" }}
        maximizable
        onHide={onHide}
      >
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              label="Agregar Producto Alternativo"
              icon="pi pi-plus"
              className="p-button-success p-button-sm"
              onClick={handleAgregarProductoAlt}
              disabled={!puedeEditar}
            />
            <Button
              label={mostrarSoloSeleccionados ? "Mostrar Todos" : "Solo Seleccionados"}
              icon={mostrarSoloSeleccionados ? "pi pi-list" : "pi pi-filter"}
              className={mostrarSoloSeleccionados ? "p-button-info p-button-sm" : "p-button-outlined p-button-sm"}
              onClick={() => setMostrarSoloSeleccionados(!mostrarSoloSeleccionados)}
              disabled={contarSeleccionados() === 0}
              tooltip={contarSeleccionados() === 0 ? "No hay items seleccionados" : (mostrarSoloSeleccionados ? "Mostrar todos los items" : "Filtrar solo items seleccionados")}
            />
          </div>
          <div style={{ 
            padding: "0.5rem 1rem", 
            backgroundColor: contarSeleccionados() > 0 ? "#4caf50" : "#f8f9fa",
            color: contarSeleccionados() > 0 ? "white" : "#495057",
            borderRadius: "4px",
            fontWeight: "bold"
          }}>
            Items seleccionados para OC: {contarSeleccionados()} / {detalles.length}
          </div>
        </div>

        <DataTable
          value={detallesFiltrados}
          dataKey="id"
          editMode="cell"
          style={{ fontSize: "12px" }}
          scrollable
          scrollHeight="500px"
          paginator
          rows={10}
          emptyMessage="No hay items"
          showGridlines
          stripedRows
        >
          <Column
            header="Seleccionar"
            body={(row) => (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Checkbox
                  checked={Boolean(row.esSeleccionadoParaOrdenCompra)}
                  onChange={() => handleToggleSeleccion(row)}
                  disabled={!puedeEditar || Number(row.precioUnitario) === 0}
                  tooltip={Number(row.precioUnitario) === 0 ? "Debe ingresar precio primero" : "Seleccionar para Orden de Compra"}
                  tabIndex={0}
                />
              </div>
            )}
            style={{ width: "100px", textAlign: "center" }}
          />
          <Column
            field="nroItem"
            header="#"
            style={{ width: "60px", textAlign: "right" }}
          />
          <Column
            field="descripcionProducto"
            header="Producto"
            body={(row) => (
              <div style={{ whiteSpace: "normal", wordWrap: "break-word", fontWeight: "bold" }}>
                {row.producto?.descripcionArmada || row.descripcionProducto || row.producto?.nombre || ''}
              </div>
            )}
            style={{ minWidth: "250px" }}
          />
          <Column
            field="cantidad"
            header="Cantidad"
            editor={puedeEditar ? (options) => numberEditor(options) : null}
            onCellEditComplete={puedeEditar ? onCellEditComplete : null}
            body={(row) => formatearNumero(row.cantidad || 0)}
            style={{ width: "120px", textAlign: "right" }}
          />
          <Column
            field="unidadEmpaque"
            header="Unidad/Empaque"
            style={{ width: "200px" }}
          />
          <Column
            field="precioUnitario"
            header="Precio Unit. Compra"
            editor={puedeEditar ? (options) => numberEditor(options) : null}
            onCellEditComplete={puedeEditar ? onCellEditComplete : null}
            body={(row) => `S/ ${formatearNumero(row.precioUnitario || 0)}`}
            style={{ width: "150px", textAlign: "right" }}
          />
          <Column
            field="subtotal"
            header="Precio Total Compra"
            body={(row) => `S/ ${formatearNumero(row.subtotal || 0)}`}
            style={{ width: "150px", textAlign: "right" }}
          />
          <Column
            header="Acciones"
            body={(row) => (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                <Button
                  icon={puedeEditar ? "pi pi-pencil" : "pi pi-eye"}
                  className="p-button-sm p-button-rounded p-button-text p-button-info"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditarItem(row);
                  }}
                  tooltip={puedeEditar ? "Editar" : "Ver"}
                  tabIndex={-1}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-sm p-button-rounded p-button-text p-button-danger"
                  onClick={() => handleEliminarItem(row)}
                  tooltip="Eliminar"
                  disabled={!puedeEditar}
                  tabIndex={-1}
                />
              </div>
            )}
            style={{ width: "120px" }}
          />
        </DataTable>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            Total: {cotizacion?.moneda?.simbolo} {formatearNumero(calcularTotal())}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={onHide}
            />
            <Button
              label="Guardar Cambios"
              icon="pi pi-check"
              onClick={handleGuardarCambios}
              loading={loading}
              disabled={!puedeEditar}
            />
          </div>
        </div>
      </Dialog>

      {/* DIÁLOGO: PRODUCTO ALTERNATIVO */}
      <Dialog
        header="Agregar Producto Alternativo"
        visible={showDialogProductoAlt}
        style={{ width: "500px" }}
        onHide={() => setShowDialogProductoAlt(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label>Producto*</label>
            <Dropdown
              value={formProductoAlt.productoId}
              options={productos.map((p) => ({
                label: `${p.nombre} ${p.marca?.nombre || ""} ${
                  p.familia?.nombre || ""
                }`.trim(),
                value: Number(p.id),
              }))}
              onChange={(e) =>
                setFormProductoAlt({ ...formProductoAlt, productoId: e.value })
              }
              placeholder="Seleccionar"
              filter
            />
          </div>
          <div className="field">
            <label>Cantidad*</label>
            <InputNumber
              value={formProductoAlt.cantidad}
              onValueChange={(e) =>
                setFormProductoAlt({ ...formProductoAlt, cantidad: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
            />
          </div>
          <div className="field">
            <label>Precio Unitario</label>
            <InputNumber
              value={formProductoAlt.precioUnitario}
              onValueChange={(e) =>
                setFormProductoAlt({
                  ...formProductoAlt,
                  precioUnitario: e.value,
                })
              }
              mode="decimal"
              minFractionDigits={2}
            />
          </div>
          <div className="field">
            <label>Observaciones</label>
            <InputText
              value={formProductoAlt.observaciones}
              onChange={(e) =>
                setFormProductoAlt({
                  ...formProductoAlt,
                  observaciones: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setShowDialogProductoAlt(false)}
          />
          <Button
            label="Agregar"
            icon="pi pi-check"
            onClick={handleGuardarProductoAlt}
            loading={loading}
          />
        </div>
      </Dialog>

      {/* DIÁLOGO: EDITAR ITEM */}
      <Dialog
        header={`Editar Item - ${itemEditar?.producto?.descripcionArmada || itemEditar?.descripcionProducto || ''}`}
        visible={showDialogEditarItem}
        style={{ width: "500px" }}
        onHide={() => {
          setShowDialogEditarItem(false);
          setItemEditar(null);
        }}
      >
        <div className="p-fluid">
          <div className="field">
            <label>Producto</label>
            <div style={{ 
              padding: "0.75rem", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              {itemEditar?.producto?.descripcionArmada || itemEditar?.descripcionProducto || ''}
            </div>
          </div>
          <div className="field">
            <label>Unidad/Empaque</label>
            <div style={{ 
              padding: "0.75rem", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "4px"
            }}>
              {itemEditar?.unidadEmpaque || '-'}
            </div>
          </div>
          <div className="field">
            <label>Cantidad*</label>
            <InputNumber
              value={formEditarItem.cantidad}
              onValueChange={(e) =>
                setFormEditarItem({ ...formEditarItem, cantidad: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              style={{ width: "100%" }}
              disabled={!puedeEditar}
            />
          </div>
          <div className="field">
            <label>Precio Unitario*</label>
            <InputNumber
              value={formEditarItem.precioUnitario}
              onValueChange={(e) =>
                setFormEditarItem({ ...formEditarItem, precioUnitario: e.value })
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              prefix="S/ "
              style={{ width: "100%" }}
              disabled={!puedeEditar}
            />
          </div>
          <div className="field">
            <label>Subtotal</label>
            <div style={{ 
              padding: "0.75rem", 
              backgroundColor: "#e3f2fd", 
              borderRadius: "4px",
              fontWeight: "bold",
              fontSize: "1.1rem"
            }}>
              S/ {formatearNumero(Number(formEditarItem.cantidad) * Number(formEditarItem.precioUnitario))}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => {
              setShowDialogEditarItem(false);
              setItemEditar(null);
            }}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleGuardarEdicionItem}
            disabled={!puedeEditar}
          />
        </div>
      </Dialog>
    </>
  );
}