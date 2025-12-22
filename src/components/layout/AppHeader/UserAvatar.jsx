// src/components/layout/AppHeader/UserAvatar.jsx
import { Avatar } from 'primereact/avatar';
import { motion } from 'framer-motion';

export default function UserAvatar({ usuario }) {
  let nombre = usuario?.personal?.nombres || usuario?.nombres || "";
  let apellidos = usuario?.personal?.apellidos || usuario?.apellidos || "";
  let fotoUrl = usuario?.personal?.fotoUrl || usuario?.fotoUrl || null;
  let iniciales = "";
  
  if (nombre || apellidos) {
    iniciales = (nombre[0] || "").toUpperCase() + (apellidos[0] || "").toUpperCase();
  } else if (usuario?.username) {
    iniciales = usuario.username.slice(0, 2).toUpperCase();
  } else {
    iniciales = "US";
  }
  
  // El backend ya envía la URL completa en fotoUrl
  const foto = fotoUrl;
  
  // Formatear nombre en Camel Case
  const toCamelCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const nombreFormateado = nombre && apellidos 
    ? `${toCamelCase(nombre)} ${toCamelCase(apellidos)}` 
    : usuario?.username || "Usuario";
  
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="user-avatar-tooltip"
      data-pr-tooltip={nombreFormateado}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      title={nombreFormateado}
    >
      <Avatar
        image={foto}
        label={!foto ? iniciales : undefined}
        shape="circle"
        className="user-avatar"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </motion.div>
  );
}