// src/components/layout/AppHeader/UserAvatar.jsx
import { Avatar } from 'primereact/avatar';

export default function UserAvatar({ usuario }) {
  let nombre = usuario?.personal?.nombres || usuario?.nombres || "";
  let apellidos = usuario?.personal?.apellidos || usuario?.apellidos || "";
  let fotoUrl = usuario?.personal?.urlFotoPersona || usuario?.urlFotoPersona || null;
  let iniciales = "";
  
  // DEBUG: Ver qué datos llegan
  console.log('🔍 UserAvatar DEBUG:', {
    usuario,
    'usuario.personal': usuario?.personal,
    'usuario.personal.urlFotoPersona': usuario?.personal?.urlFotoPersona,
    'usuario.urlFotoPersona': usuario?.urlFotoPersona,
    fotoUrl
  });
  
  if (nombre || apellidos) {
    iniciales = (nombre[0] || "").toUpperCase() + (apellidos[0] || "").toUpperCase();
  } else if (usuario?.username) {
    iniciales = usuario.username.slice(0, 2).toUpperCase();
  } else {
    iniciales = "US";
  }
  
  // Construir URL completa para la foto (igual que en Personal.jsx)
  const foto = fotoUrl 
    ? `${import.meta.env.VITE_UPLOADS_URL}/personal/${fotoUrl}` 
    : undefined;
  
  console.log('📸 Foto URL construida:', foto);
  
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