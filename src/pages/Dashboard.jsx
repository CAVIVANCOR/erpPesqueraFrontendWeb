/**
 * Página Dashboard (Inicio)
 *
 * Módulo principal del ERP Megui. Muestra información general y accesos rápidos.
 * Protegido por autenticación.
 */
import React from "react";

export default function Dashboard() {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <h2>¡Bienvenido al ERP Megui!</h2>
      <p>Selecciona un módulo en el menú para comenzar.</p>
    </div>
  );
}
