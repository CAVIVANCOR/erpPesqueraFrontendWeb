// src/components/layout/AppHeader/UserAvatar.jsx
import { Avatar } from 'primereact/avatar';

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
  
  return (
    <Avatar
      image={foto}
      label={!foto ? iniciales : undefined}
      shape="circle"
      className="user-avatar"
      title={nombre && apellidos ? `${nombre} ${apellidos}` : usuario?.username || "Usuario"}
    />
  );
}