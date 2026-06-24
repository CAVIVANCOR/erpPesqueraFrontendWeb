// src/components/common/ValidadorStockMultiProducto.jsx
// Componente genérico reutilizable para validar stock de múltiples productos
// Basado en el patrón de ConsultaStockForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { getSaldosDetProductoCliente } from "../../api/saldosDetProductoCliente";
import { getEmpresas } from "../../api/empresa";
import { getResponsiveFontSize } from "../../utils/utils";

/**
 * Componente genérico para validar stock de múltiples productos
 * y asignar cantidades a retirar por lote
 * 
 * @param {boolean} visible - Controla la visibilidad del diálogo
 * @param {function} onHide - Función para cerrar el diálogo
 * @param {number} empresaId - ID de empresa
 * @param {Array} detalles - Array de productos a validar: [{ productoId, cantidad }]
 * @param {function} onConfirmar - Callback con las asignaciones: (asignaciones) => {}
 * 
 * Ejemplo de uso:
 * <ValidadorStockMultiProducto
 *   visible={showValidador}
 *   onHide={() => setShowValidador(false)}
 *   empresaId={10}
 *   detalles={[
 *     { productoId: 101, cantidad: 1000 },
 *     { productoId: 102, cantidad: 500 }
 *   ]}
 *   onConfirmar={(asignaciones) => {
 *   }}
 * />
 */
export default function ValidadorStockMultiProducto({
    visible,
    onHide,
    empresaId,
    detalles = [],
    onConfirmar,
}) {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);

    // Datos de catálogos
    const [empresas, setEmpresas] = useState([]);
    const [almacenesDisponibles, setAlmacenesDisponibles] = useState([]);

    // Filtros
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

    // Datos de stock por producto
    const [stockPorProducto, setStockPorProducto] = useState([]);
    const [productosRequeridos, setProductosRequeridos] = useState([]);

    // Estado de asignaciones (cantidades a retirar por cada fila de stock)
    const [asignaciones, setAsignaciones] = useState({});

    // Resumen de validación
    const [resumenValidacion, setResumenValidacion] = useState({
        totalProductos: 0,
        productosCompletos: 0,
        productosIncompletos: 0,
        productosSinStock: 0,
    });

    useEffect(() => {
        if (visible) {
            cargarDatosIniciales();
        }
    }, [visible]);

    useEffect(() => {
        if (visible && empresaId && detalles.length > 0) {
            cargarStockDisponible();
        }
    }, [visible, empresaId, detalles, almacenSeleccionado]);

    useEffect(() => {
        calcularResumen();
    }, [asignaciones, productosRequeridos]);

    const cargarDatosIniciales = async () => {
        try {
            const empresasData = await getEmpresas();
            setEmpresas(empresasData);
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudieron cargar los datos iniciales",
            });
        }
    };

    const cargarStockDisponible = async () => {
        if (!empresaId || detalles.length === 0) return;

        setLoading(true);
        try {
            // Obtener IDs de productos a validar
            const productosIds = detalles.map((d) => d.productoId);

            // Consultar stock detallado para todos los productos
            const params = {
                empresaId: empresaId,
                esCustodia: false,
                soloConSaldo: true,
            };

            if (almacenSeleccionado) {
                params.almacenId = almacenSeleccionado;
            }

            const stockData = await getSaldosDetProductoCliente(params);

            // Filtrar solo los productos que necesitamos validar
            const stockFiltrado = stockData.filter((item) =>
                productosIds.includes(Number(item.productoId))
            );

            setStockPorProducto(stockFiltrado);

            // Extraer almacenes únicos
            const almacenesUnicos = [];
            const idsVistos = new Set();
            stockFiltrado.forEach((item) => {
                if (item.almacenId && !idsVistos.has(Number(item.almacenId))) {
                    idsVistos.add(Number(item.almacenId));
                    almacenesUnicos.push({
                        id: item.almacenId,
                        nombre: item.almacen?.nombre || `Almacén ${item.almacenId}`,
                    });
                }
            });
            setAlmacenesDisponibles(
                almacenesUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre))
            );

            // Procesar productos requeridos con su stock disponible
            const productosConStock = detalles.map((detalle) => {
                const stockDelProducto = stockFiltrado.filter(
                    (s) => Number(s.productoId) === Number(detalle.productoId)
                );

                const stockTotal = stockDelProducto.reduce(
                    (sum, s) => sum + Number(s.saldoCantidad || 0),
                    0
                );

                const producto = stockDelProducto[0]?.producto || {};

                return {
                    productoId: detalle.productoId,
                    productoNombre:
                        producto.descripcionArmada ||
                        producto.descripcion ||
                        `Producto ${detalle.productoId}`,
                    unidadMedida: producto.unidadMedida?.simbolo || "unid",
                    cantidadRequerida: detalle.cantidad,
                    stockDisponible: stockTotal,
                    diferencia: stockTotal - detalle.cantidad,
                    estado:
                        stockTotal >= detalle.cantidad
                            ? "SUFICIENTE"
                            : stockTotal > 0
                                ? "INSUFICIENTE"
                                : "SIN_STOCK",
                    lotesDisponibles: stockDelProducto,
                };
            });

            setProductosRequeridos(productosConStock);

            // Inicializar asignaciones vacías
            const asignacionesIniciales = {};
            stockFiltrado.forEach((item) => {
                const key = `${item.productoId}_${item.id}`;
                asignacionesIniciales[key] = {
                    kardexId: item.id,
                    productoId: item.productoId,
                    almacenId: item.almacenId,
                    almacenNombre: item.almacen?.nombre,
                    lote: item.lote,
                    fechaIngreso: item.fechaIngreso,
                    fechaVencimiento: item.fechaVencimiento,
                    fechaProduccion: item.fechaProduccion,
                    estadoId: item.estadoId,
                    estadoNombre: item.estado?.descripcion,
                    estadoCalidadId: item.estadoCalidadId,
                    numContenedor: item.numContenedor,
                    nroSerie: item.nroSerie,
                    ubicacionFisicaId: item.ubicacionFisicaId,
                    stockDisponible: Number(item.saldoCantidad || 0),
                    cantidadAsignada: 0,
                };
            });
            setAsignaciones(asignacionesIniciales);
        } catch (error) {
            console.error("Error al cargar stock:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo cargar el stock disponible",
            });
        }
        setLoading(false);
    };

    const asignarAutomaticamente = () => {
        const nuevasAsignaciones = { ...asignaciones };

        productosRequeridos.forEach((producto) => {
            const cantidadRequerida = producto.cantidadRequerida;
            let cantidadRestante = cantidadRequerida;

            // Ordenar lotes por FIFO (fecha de ingreso más antigua primero)
            const lotesOrdenados = [...producto.lotesDisponibles].sort((a, b) => {
                const fechaA = new Date(a.fechaIngreso || 0);
                const fechaB = new Date(b.fechaIngreso || 0);
                return fechaA - fechaB;
            });

            // Asignar cantidades siguiendo FIFO
            lotesOrdenados.forEach((lote) => {
                if (cantidadRestante <= 0) return;

                const key = `${producto.productoId}_${lote.id}`;
                const stockDisponible = Number(lote.saldoCantidad || 0);
                const cantidadAAsignar = Math.min(cantidadRestante, stockDisponible);

                if (nuevasAsignaciones[key]) {
                    nuevasAsignaciones[key].cantidadAsignada = cantidadAAsignar;
                    cantidadRestante -= cantidadAAsignar;
                }
            });
        });

        setAsignaciones(nuevasAsignaciones);

        toast.current?.show({
            severity: "success",
            summary: "Asignación Automática",
            detail: "Se asignaron las cantidades usando FIFO",
        });
    };

    const limpiarAsignaciones = () => {
        const asignacionesLimpias = {};
        Object.keys(asignaciones).forEach((key) => {
            asignacionesLimpias[key] = {
                ...asignaciones[key],
                cantidadAsignada: 0,
            };
        });
        setAsignaciones(asignacionesLimpias);

        toast.current?.show({
            severity: "info",
            summary: "Asignaciones Limpiadas",
            detail: "Se limpiaron todas las asignaciones",
        });
    };

    const handleCantidadChange = (key, valor) => {
        const asignacion = asignaciones[key];
        if (!asignacion) return;

        const valorNumerico = Number(valor) || 0;
        const stockDisponible = asignacion.stockDisponible;

        // Validar que no exceda el stock disponible
        if (valorNumerico > stockDisponible) {
            toast.current?.show({
                severity: "warn",
                summary: "Cantidad Excedida",
                detail: `No puede asignar más de ${stockDisponible} unidades`,
            });
            return;
        }

        setAsignaciones({
            ...asignaciones,
            [key]: {
                ...asignacion,
                cantidadAsignada: valorNumerico,
            },
        });
    };

    const calcularResumen = () => {
        const resumen = {
            totalProductos: productosRequeridos.length,
            productosCompletos: 0,
            productosIncompletos: 0,
            productosSinStock: 0,
        };

        productosRequeridos.forEach((producto) => {
            const asignacionesDelProducto = Object.values(asignaciones).filter(
                (a) => Number(a.productoId) === Number(producto.productoId)
            );

            const totalAsignado = asignacionesDelProducto.reduce(
                (sum, a) => sum + Number(a.cantidadAsignada || 0),
                0
            );

            if (totalAsignado >= producto.cantidadRequerida) {
                resumen.productosCompletos++;
            } else if (totalAsignado > 0) {
                resumen.productosIncompletos++;
            } else {
                resumen.productosSinStock++;
            }
        });

        setResumenValidacion(resumen);
    };

    const handleConfirmar = () => {
        // Filtrar solo asignaciones con cantidad > 0
        const asignacionesValidas = Object.values(asignaciones).filter(
            (a) => a.cantidadAsignada > 0
        );

        if (asignacionesValidas.length === 0) {
            toast.current?.show({
                severity: "warn",
                summary: "Sin Asignaciones",
                detail: "Debe asignar al menos una cantidad",
            });
            return;
        }

        // Agrupar por producto
        const asignacionesPorProducto = productosRequeridos.map((producto) => {
            const asignacionesDelProducto = asignacionesValidas.filter(
                (a) => Number(a.productoId) === Number(producto.productoId)
            );

            const totalAsignado = asignacionesDelProducto.reduce(
                (sum, a) => sum + Number(a.cantidadAsignada),
                0
            );

            return {
                productoId: producto.productoId,
                productoNombre: producto.productoNombre,
                cantidadRequerida: producto.cantidadRequerida,
                cantidadAsignada: totalAsignado,
                esValido: totalAsignado >= producto.cantidadRequerida,
                asignaciones: asignacionesDelProducto,
            };
        });

        onConfirmar?.(asignacionesPorProducto);
        onHide();
    };

    // Templates para columnas
    const productoTemplate = (rowData) => {
        return (
            rowData.producto?.descripcionArmada ||
            rowData.producto?.descripcion ||
            "-"
        );
    };

    const almacenTemplate = (rowData) => {
        return rowData.almacen?.nombre || "-";
    };

    const fechaTemplate = (rowData, field) => {
        return rowData[field]
            ? new Date(rowData[field]).toLocaleDateString("es-PE")
            : "-";
    };

    const estadoTemplate = (rowData) => rowData.estado?.descripcion || "-";

    const stockTemplate = (rowData) => {
        const stock = Number(rowData.saldoCantidad || 0);
        return stock.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const asignacionTemplate = (rowData) => {
        const key = `${rowData.productoId}_${rowData.id}`;
        const asignacion = asignaciones[key];
        if (!asignacion) return null;

        return (
            <InputNumber
                value={asignacion.cantidadAsignada}
                onValueChange={(e) => handleCantidadChange(key, e.value)}
                min={0}
                max={asignacion.stockDisponible}
                showButtons
                buttonLayout="horizontal"
                decrementButtonClassName="p-button-danger"
                incrementButtonClassName="p-button-success"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                style={{ width: "150px" }}
                disabled={loading}
            />
        );
    };

    const estadoProductoTemplate = (producto) => {
        const severity =
            producto.estado === "SUFICIENTE"
                ? "success"
                : producto.estado === "INSUFICIENTE"
                    ? "warning"
                    : "danger";

        return <Tag value={producto.estado} severity={severity} />;
    };

    const dialogFooter = (
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button
                label="Cancelar"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label="Limpiar"
                icon="pi pi-trash"
                onClick={limpiarAsignaciones}
                className="p-button-secondary"
                disabled={loading}
            />
            <Button
                label="Asignar Automático (FIFO)"
                icon="pi pi-bolt"
                onClick={asignarAutomaticamente}
                className="p-button-warning"
                disabled={loading}
            />
            <Button
                label="Confirmar"
                icon="pi pi-check"
                onClick={handleConfirmar}
                disabled={loading || resumenValidacion.productosCompletos === 0}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                onHide={onHide}
                header="Validación y Asignación de Stock"
                style={{ width: "95vw", maxWidth: "1600px" }}
                maximizable
                modal
                footer={dialogFooter}
            >
                <div className="p-fluid">
                    {/* Filtros */}
                    <div
                        style={{
                            alignItems: "end",
                            display: "flex",
                            gap: 10,
                            flexDirection: window.innerWidth < 768 ? "column" : "row",
                        }}
                    >
                        <div style={{ flex: 2 }}>
                            <label htmlFor="almacen">Almacén</label>
                            <Dropdown
                                id="almacen"
                                value={almacenSeleccionado}
                                options={almacenesDisponibles.map((a) => ({
                                    label: a.nombre,
                                    value: Number(a.id),
                                }))}
                                onChange={(e) => setAlmacenSeleccionado(e.value)}
                                placeholder="Todos los almacenes"
                                optionLabel="label"
                                optionValue="value"
                                showClear
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Resumen de Validación */}
                    <div
                        style={{
                            display: "flex",
                            gap: "15px",
                            marginBottom: "20px",
                            padding: "15px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "5px",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <strong>Total Productos:</strong> {resumenValidacion.totalProductos}
                        </div>
                        <div style={{ flex: 1, color: "#22c55e" }}>
                            <strong>Completos:</strong> {resumenValidacion.productosCompletos}
                        </div>
                        <div style={{ flex: 1, color: "#f59e0b" }}>
                            <strong>Incompletos:</strong> {resumenValidacion.productosIncompletos}
                        </div>
                        <div style={{ flex: 1, color: "#ef4444" }}>
                            <strong>Sin Stock:</strong> {resumenValidacion.productosSinStock}
                        </div>
                    </div>

                    {/* Resumen por Producto */}
                    <h4>Resumen por Producto</h4>
                    <DataTable
                        value={productosRequeridos}
                        loading={loading}
                        stripedRows
                        style={{ fontSize: getResponsiveFontSize(), marginBottom: "20px" }}
                        emptyMessage="No hay productos para validar"
                    >
                        <Column field="productoNombre" header="Producto" sortable />
                        <Column
                            field="cantidadRequerida"
                            header="Cantidad Requerida"
                            sortable
                            style={{ textAlign: "right" }}
                        />
                        <Column field="unidadMedida" header="U.M." />
                        <Column
                            field="stockDisponible"
                            header="Stock Disponible"
                            sortable
                            style={{ textAlign: "right" }}
                        />
                        <Column
                            field="diferencia"
                            header="Diferencia"
                            sortable
                            style={{ textAlign: "right" }}
                            body={(rowData) => (
                                <span
                                    style={{
                                        color: rowData.diferencia >= 0 ? "#22c55e" : "#ef4444",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {rowData.diferencia >= 0 ? "+" : ""}
                                    {rowData.diferencia}
                                </span>
                            )}
                        />
                        <Column
                            field="estado"
                            header="Estado"
                            body={estadoProductoTemplate}
                        />
                    </DataTable>

                    {/* Tabla de Stock Detallado con Asignaciones */}
                    <h4>Stock Detallado por Lote - Asignar Cantidades</h4>
                    <DataTable
                        value={stockPorProducto}
                        loading={loading}
                        paginator
                        rows={20}
                        dataKey="id"
                        style={{ fontSize: getResponsiveFontSize() }}
                        emptyMessage="No hay stock disponible"
                        scrollable
                        scrollHeight="400px"
                    >
                        <Column
                            field="producto"
                            header="Producto"
                            body={productoTemplate}
                            frozen
                            style={{ minWidth: "200px" }}
                        />
                        <Column
                            field="almacen"
                            header="Almacén"
                            body={almacenTemplate}
                            sortable
                        />
                        <Column field="lote" header="Lote" sortable />
                        <Column
                            field="fechaIngreso"
                            header="F. Ingreso"
                            body={(rowData) => fechaTemplate(rowData, "fechaIngreso")}
                            sortable
                        />
                        <Column
                            field="fechaVencimiento"
                            header="F. Vencimiento"
                            body={(rowData) => fechaTemplate(rowData, "fechaVencimiento")}
                            sortable
                        />
                        <Column
                            field="estado"
                            header="Estado"
                            body={estadoTemplate}
                            sortable
                        />
                        <Column
                            field="saldoCantidad"
                            header="Stock Disponible"
                            body={stockTemplate}
                            sortable
                            style={{ textAlign: "right" }}
                        />
                        <Column
                            header="Cantidad a Retirar"
                            body={asignacionTemplate}
                            style={{ minWidth: "180px" }}
                        />
                    </DataTable>
                </div>
            </Dialog>
        </>
    );
}