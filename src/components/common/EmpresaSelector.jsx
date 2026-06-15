import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { getEmpresas } from "../../api/empresa";

const COLORES_EMPRESAS = [
    "#2874A6", // Azul Oscuro
    "#1E8449", // Verde Oscuro
    "#5DADE2", // Azul Claro
    "#8E44AD", // Morado
    "#E74C3C", // Rojo
    "#F39C12", // Naranja
    "#16A085", // Verde Agua
    "#D35400", // Naranja Oscuro
    "#2C3E50", // Gris Azulado
    "#27AE60", // Verde
    "#C0392B", // Rojo Oscuro
    "#7D3C98", // Morado Oscuro
    "#117A65", // Verde Esmeralda
];

export default function EmpresaSelector({ empresaId, onEmpresaChange }) {
    const [empresas, setEmpresas] = useState([]);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [empresaId]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Cargar todas las empresas
            // Cargar todas las empresas y ordenar por ID
            const empresasData = await getEmpresas();
            setEmpresas(empresasData);
            // Si hay empresaId, preseleccionar la empresa
            if (empresaId) {
                const empresaUsuario = empresasData.find(
                    (e) => Number(e.id) === Number(empresaId)
                );
                if (empresaUsuario) {
                    setEmpresaSeleccionada(empresaUsuario);
                    // Notificar al padre con el ID numérico
                    if (onEmpresaChange) {
                        const idNumerico = Number(empresaUsuario.id);
                        onEmpresaChange(idNumerico);
                    }
                } else {
                    console.warn("⚠️ No se encontró empresa con ID:", empresaId);
                }
            } else {
                console.warn("⚠️ No se recibió empresaId");
            }
        } catch (error) {
            console.error("❌ Error al cargar empresas:", error);
        }
        setLoading(false);
    };

    const handleSeleccionarEmpresa = (empresa) => {
        setEmpresaSeleccionada(empresa);
        setDialogVisible(false);
        onEmpresaChange?.(Number(empresa.id));
    };

    const getColorEmpresa = (index) => {
        return COLORES_EMPRESAS[index % COLORES_EMPRESAS.length];
    };

    return (
        <>
            {/* Botón Principal */}
            <Button
                label={
                    empresaSeleccionada
                        ? empresaSeleccionada.razonSocial
                        : "Seleccionar Empresa"
                }
                icon="pi pi-building"
                iconPos="left"
                onClick={() => setDialogVisible(true)}
                className="p-button-outlined"
                style={{
                    width: "300px",
                    height: "50px",
                    justifyContent: "flex-start",
                    paddingLeft: "1rem",
                }}
                loading={loading}
            >
                <i
                    className="pi pi-chevron-down"
                    style={{ marginLeft: "auto", fontSize: "0.9rem" }}
                />
            </Button>

            {/* Dialog de Selección */}
            <Dialog
                visible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                header="Seleccionar Empresa"
                position="top"
                modal
                dismissableMask
                style={{ width: "800px", maxHeight: "600px" }}
                contentStyle={{ padding: "1.5rem" }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "16px",
                    }}
                >
                    {empresas.map((empresa, index) => {
                        const color = getColorEmpresa(index);
                        const isSelected = empresaSeleccionada?.id === empresa.id;

                        return (
                            <Button
                                key={empresa.id}
                                onClick={() => handleSeleccionarEmpresa(empresa)}
                                className={isSelected ? "" : "p-button-outlined"}
                                style={{
                                    height: "100px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    backgroundColor: isSelected ? color : "transparent",
                                    borderColor: color,
                                    borderWidth: isSelected ? "3px" : "2px",
                                    color: isSelected ? "#ffffff" : color,
                                    transition: "all 0.3s ease",
                                    opacity: isSelected ? 1 : 0.7,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.opacity = "1";
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.opacity = "0.7";
                                        e.currentTarget.style.transform = "scale(1)";
                                    }
                                }}
                            >
                                <i
                                    className="pi pi-building"
                                    style={{ fontSize: "1.5rem" }}
                                />
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: isSelected ? "700" : "500",
                                        textAlign: "center",
                                        lineHeight: "1.2",
                                    }}
                                >
                                    {empresa.razonSocial}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </Dialog>
        </>
    );
}