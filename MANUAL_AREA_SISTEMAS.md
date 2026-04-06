# 🖥️ MANUAL DE PROCEDIMIENTOS - ÁREA SISTEMAS / TI

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Configuración Inicial del Sistema](#configuración-inicial)
3. [Gestión de Usuarios y Permisos](#usuarios-y-permisos)
4. [Configuración de Datos Maestros](#datos-maestros)
5. [Checklist de Implementación](#checklist)
6. [Soporte y Mantenimiento](#soporte)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Sistemas/TI es responsable de:

- ✅ Configuración inicial del ERP
- ✅ Creación y gestión de usuarios
- ✅ Asignación de permisos por módulo
- ✅ Configuración de datos maestros del sistema
- ✅ Soporte técnico a usuarios
- ✅ Mantenimiento de la base de datos
- ✅ Respaldos y seguridad

---

## ⚙️ CONFIGURACIÓN INICIAL DEL SISTEMA {#configuración-inicial}

### **PASO 1: Configurar Empresas**

**Módulo:** Maestros → Empresas

**Datos requeridos:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| RUC | Número de RUC | 20123456789 |
| Razón Social | Nombre legal de la empresa | PESQUERA MEGUI SAC |
| Nombre Comercial | Nombre comercial | Megui |
| Dirección Fiscal | Dirección registrada en SUNAT | Av. Principal 123 |
| Teléfono | Teléfono principal | (01) 234-5678 |
| Email | Correo electrónico | contacto@megui.com |
| Representante Legal | Nombre del representante | Juan Pérez García |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Empresas**
2. Clic en botón **"Nuevo"**
3. Completar todos los campos obligatorios
4. Verificar que el RUC sea válido
5. Guardar

---

### **PASO 2: Registrar Sedes de Empresa**

**Módulo:** Maestros → Sedes Empresa

**Datos requeridos:**

| Campo | Descripción |
|-------|-------------|
| Empresa | Seleccionar empresa |
| Nombre Sede | Nombre de la sede |
| Dirección | Dirección física |
| Teléfono | Teléfono de contacto |
| Es Sede Principal | Marcar si es la sede principal |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Sedes Empresa**
2. Clic en **"Nuevo"**
3. Seleccionar la empresa
4. Completar información de la sede
5. Marcar "Es Sede Principal" si corresponde
6. Guardar

---

### **PASO 3: Configurar Monedas**

**Módulo:** Maestros → Monedas

**Monedas obligatorias:**

| Código | Nombre | Símbolo | Estado |
|--------|--------|---------|--------|
| PEN | Soles | S/. | ACTIVO |
| USD | Dólares Americanos | $ | ACTIVO |

**Procedimiento:**
1. Verificar que PEN y USD estén creadas
2. Si no existen, crear con los datos de la tabla
3. Asegurar que ambas estén en estado **ACTIVO**

---

### **PASO 4: Cargar Tipos de Cambio**

**Módulo:** Maestros → Tipo de Cambio

**Datos requeridos:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Fecha | Fecha del tipo de cambio | 31/12/2025 |
| Moneda Origen | Moneda base | USD |
| Moneda Destino | Moneda conversión | PEN |
| Tipo Cambio Compra | TC para compras | 3.7500 |
| Tipo Cambio Venta | TC para ventas | 3.7800 |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Tipo de Cambio**
2. Clic en **"Nuevo"**
3. Ingresar fecha (al menos 31/12/2025)
4. Seleccionar USD → PEN
5. Ingresar tipo de cambio compra y venta
6. Guardar
7. **Repetir para cada día hábil** del período de implementación

**⚠️ IMPORTANTE:** El sistema requiere tipos de cambio para todas las fechas donde se registren transacciones en moneda extranjera.

---

### **PASO 5: Configurar Estados del Sistema**

**Módulo:** Maestros → Estados Multifunción

**Estados obligatorios a verificar:**

#### **Períodos Contables:**
- **50** - ABIERTO
- **51** - CERRADO
- **52** - BLOQUEADO

#### **Cuentas por Cobrar:**
- **100** - PENDIENTE
- **101** - PAGO PARCIAL
- **102** - PAGADO
- **103** - VENCIDO
- **104** - ANULADO
- **105** - CANJEADO

#### **Cuentas por Pagar:**
- PENDIENTE
- PAGO PARCIAL
- PAGADO
- VENCIDO
- ANULADO

#### **Préstamos Bancarios:**
- ACTIVO
- PAGADO
- VENCIDO
- REFINANCIADO

**Procedimiento:**
1. Ingresar al módulo **Maestros → Estados Multifunción**
2. Verificar que todos los estados listados existan
3. Si falta alguno, contactar al proveedor del ERP

---

## 👥 GESTIÓN DE USUARIOS Y PERMISOS {#usuarios-y-permisos}

### **PASO 1: Registrar Personal**

**Módulo:** Maestros → Personal

**Datos requeridos:**

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Tipo Documento | DNI, CE, Pasaporte | ✅ |
| Número Documento | Número del documento | ✅ |
| Nombres | Nombres completos | ✅ |
| Apellido Paterno | Apellido paterno | ✅ |
| Apellido Materno | Apellido materno | ✅ |
| Email | Correo electrónico | ✅ |
| Teléfono | Teléfono de contacto | ❌ |
| Cargo | Cargo que desempeña | ✅ |
| Empresa | Empresa a la que pertenece | ✅ |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Personal**
2. Clic en **"Nuevo"**
3. Completar todos los campos obligatorios
4. Guardar

---

### **PASO 2: Crear Usuarios del Sistema**

**Módulo:** Seguridad → Usuarios

**Datos requeridos:**

| Campo | Descripción |
|-------|-------------|
| Personal | Seleccionar del registro de personal |
| Usuario | Nombre de usuario (login) |
| Contraseña | Contraseña inicial |
| Email | Correo electrónico |
| Estado | ACTIVO |

**Procedimiento:**
1. Ingresar al módulo **Seguridad → Usuarios**
2. Clic en **"Nuevo Usuario"**
3. Seleccionar el personal registrado
4. Asignar nombre de usuario (ej: jperez)
5. Generar contraseña temporal segura
6. Activar usuario
7. Guardar
8. **Entregar credenciales al usuario** de forma segura

**⚠️ IMPORTANTE:** 
- Las contraseñas deben tener mínimo 8 caracteres
- Incluir mayúsculas, minúsculas y números
- El usuario debe cambiar la contraseña en el primer acceso

---

### **PASO 3: Asignar Permisos por Módulo**

**Módulo:** Seguridad → Permisos

**Niveles de permiso:**

| Permiso | Descripción |
|---------|-------------|
| VER | Puede ver los registros |
| CREAR | Puede crear nuevos registros |
| EDITAR | Puede modificar registros |
| ELIMINAR | Puede eliminar registros |
| APROBAR | Puede aprobar transacciones |

**Matriz de permisos sugerida:**

| Rol | Módulos | Permisos |
|-----|---------|----------|
| **Administrador** | Todos | VER, CREAR, EDITAR, ELIMINAR, APROBAR |
| **Contador** | Contabilidad, Tesorería | VER, CREAR, EDITAR, APROBAR |
| **Tesorero** | Tesorería, Finanzas | VER, CREAR, EDITAR |
| **Almacenero** | Inventarios | VER, CREAR, EDITAR |
| **Vendedor** | Ventas | VER, CREAR |
| **Comprador** | Compras | VER, CREAR |

**Procedimiento:**
1. Ingresar al módulo **Seguridad → Permisos**
2. Seleccionar usuario
3. Seleccionar módulo
4. Marcar los permisos correspondientes
5. Guardar
6. **Repetir para cada módulo** que el usuario necesite acceder

---

## 📊 CONFIGURACIÓN DE DATOS MAESTROS {#datos-maestros}

### **Bancos**

**Módulo:** Tesorería → Bancos

**Bancos principales a registrar:**

| Banco | Código SWIFT | Código BCRP |
|-------|--------------|-------------|
| Banco de Crédito del Perú | BCPLPEPL | 002 |
| BBVA | BCONPEPL | 011 |
| Scotiabank | BSUDPEPL | 009 |
| Interbank | BINPPEPL | 003 |
| Banco de la Nación | BNACPEPL | 018 |

**Procedimiento:**
1. Ingresar al módulo **Tesorería → Bancos**
2. Clic en **"Nuevo"**
3. Ingresar nombre del banco
4. Ingresar código SWIFT (opcional)
5. Ingresar código BCRP (opcional)
6. Guardar

---

### **Medios de Pago**

**Módulo:** Maestros → Medio de Pago

**Medios de pago obligatorios:**

| Medio de Pago | Descripción |
|---------------|-------------|
| EFECTIVO | Pago en efectivo |
| TRANSFERENCIA | Transferencia bancaria |
| CHEQUE | Cheque bancario |
| DEPOSITO | Depósito en cuenta |
| TARJETA_CREDITO | Tarjeta de crédito |
| TARJETA_DEBITO | Tarjeta de débito |

**Procedimiento:**
1. Ingresar al módulo **Maestros → Medio de Pago**
2. Verificar que todos los medios estén creados
3. Si falta alguno, crear con el nombre exacto de la tabla
4. Guardar

---

### **Tipos de Documento de Identidad**

**Módulo:** Maestros → Tipos Documento Identidad

**Tipos obligatorios:**

| Código | Descripción | Longitud |
|--------|-------------|----------|
| DNI | Documento Nacional de Identidad | 8 |
| CE | Carné de Extranjería | 12 |
| PASAPORTE | Pasaporte | 12 |
| RUC | Registro Único de Contribuyentes | 11 |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Día 1: Configuración Básica**

```
□ Empresas creadas con todos los datos
□ Sedes de empresa registradas
□ Monedas PEN y USD activas
□ Tipos de cambio cargados (al menos 31/12/2025)
□ Estados del sistema verificados
```

### **Día 2: Usuarios y Seguridad**

```
□ Personal registrado en el sistema
□ Usuarios creados para todo el personal
□ Contraseñas temporales generadas
□ Permisos asignados por rol
□ Credenciales entregadas a usuarios
□ Primer acceso verificado
```

### **Día 3: Datos Maestros**

```
□ Bancos registrados
□ Medios de pago configurados
□ Tipos de documento de identidad creados
□ Tipos de cambio actualizados
```

### **Día 4: Verificación Final**

```
□ Todos los usuarios pueden acceder
□ Permisos funcionan correctamente
□ Datos maestros completos
□ Sistema listo para que otras áreas inicien
```

---

## 🛠️ SOPORTE Y MANTENIMIENTO {#soporte}

### **Respaldos de Base de Datos**

**Frecuencia:** Diaria (automática)

**Procedimiento manual:**
1. Contactar al administrador de base de datos
2. Solicitar respaldo completo
3. Verificar que el respaldo se completó exitosamente
4. Almacenar en ubicación segura

---

### **Gestión de Incidencias**

**Niveles de prioridad:**

| Nivel | Descripción | Tiempo de respuesta |
|-------|-------------|---------------------|
| CRÍTICO | Sistema caído, no se puede trabajar | Inmediato |
| ALTO | Funcionalidad importante no funciona | 2 horas |
| MEDIO | Error que tiene workaround | 1 día |
| BAJO | Mejora o consulta | 3 días |

**Procedimiento:**
1. Usuario reporta incidencia
2. Sistemas clasifica por prioridad
3. Se asigna ticket
4. Se resuelve según SLA
5. Se notifica al usuario
6. Se cierra ticket

---

### **Actualización de Tipos de Cambio**

**Frecuencia:** Diaria

**Procedimiento:**
1. Consultar tipo de cambio SUNAT del día
2. Ingresar al módulo **Maestros → Tipo de Cambio**
3. Crear nuevo registro con fecha del día
4. Ingresar TC Compra y TC Venta
5. Guardar

**Fuente oficial:** https://www.sunat.gob.pe/cl-at-ittipcam/tcS01Alias

---

### **Gestión de Usuarios Inactivos**

**Procedimiento:**
1. Revisar usuarios que no han accedido en 30 días
2. Contactar al área correspondiente
3. Si el usuario ya no trabaja en la empresa:
   - Cambiar estado a INACTIVO
   - NO eliminar el usuario (mantener trazabilidad)
4. Documentar el cambio

---

### **Monitoreo del Sistema**

**Actividades diarias:**

```
□ Verificar que el sistema esté accesible
□ Revisar logs de errores
□ Verificar espacio en disco del servidor
□ Verificar que los respaldos se ejecutaron
□ Revisar usuarios conectados
```

**Actividades semanales:**

```
□ Revisar rendimiento de consultas
□ Limpiar archivos temporales
□ Verificar integridad de la base de datos
□ Actualizar documentación de cambios
```

---

