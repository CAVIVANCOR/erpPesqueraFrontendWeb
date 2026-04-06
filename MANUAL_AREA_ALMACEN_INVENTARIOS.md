# 📦 MANUAL DE PROCEDIMIENTOS - ÁREA ALMACÉN E INVENTARIOS

**ERP MEGUI - Sistema de Gestión Empresarial**  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## 📋 ÍNDICE

1. [Responsabilidades del Área](#responsabilidades)
2. [Configuración de Almacenes](#configuracion-almacenes)
3. [Registro de Productos](#registro-productos)
4. [Inventario Inicial](#inventario-inicial)
5. [Movimientos de Almacén](#movimientos-almacen)
6. [Control de Kardex](#control-kardex)
7. [Inventario Físico](#inventario-fisico)
8. [Reportes de Inventarios](#reportes)
9. [Checklist de Implementación](#checklist)

---

## 🎯 RESPONSABILIDADES DEL ÁREA {#responsabilidades}

El área de Almacén e Inventarios es responsable de:

- ✅ Configurar almacenes y ubicaciones físicas
- ✅ Registrar productos y servicios
- ✅ Registrar inventario inicial
- ✅ Gestionar ingresos y salidas de almacén
- ✅ Mantener kardex actualizado
- ✅ Realizar inventarios físicos periódicos
- ✅ Controlar stock mínimo y máximo
- ✅ Reportar estado de inventarios
- ✅ Verificar asientos contables de movimientos

---

## 🏢 CONFIGURACIÓN DE ALMACENES {#configuracion-almacenes}

### **PASO 1: Crear Tipos de Almacén**

**Módulo:** Inventarios → Tipos de Almacén

**Tipos comunes:**

| Tipo | Descripción | Uso |
|------|-------------|-----|
| GENERAL | Almacén general | Productos terminados |
| MATERIA_PRIMA | Materias primas | Insumos de producción |
| PRODUCTOS_TERMINADOS | Productos terminados | Listos para venta |
| TRANSITO | En tránsito | Mercadería en camino |
| CONSIGNACION | En consignación | Mercadería de terceros |
| FRIO | Cámara frigorífica | Productos refrigerados |

---

### **PASO 2: Crear Almacenes**

**Módulo:** Inventarios → Almacenes

**Datos requeridos:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Código | Código único | ALM-001 |
| Nombre | Nombre del almacén | Almacén Central |
| Tipo Almacén | Tipo | GENERAL |
| Empresa | Empresa propietaria | PESQUERA MEGUI SAC |
| Sede | Sede física | Sede Principal |
| Responsable | Encargado | Juan Almacenero |
| Dirección | Ubicación física | Av. Industrial 123 |
| Capacidad | Capacidad máxima | 1000 TM |
| Estado | ACTIVO | ACTIVO |

**Procedimiento:**
1. Ingresar al módulo **Inventarios → Almacenes**
2. Clic en **"Nuevo Almacén"**
3. Completar todos los campos
4. Asignar responsable
5. Guardar

---

### **PASO 3: Crear Ubicaciones Físicas**

**Módulo:** Inventarios → Ubicaciones Físicas

**Estructura de ubicaciones:**

```
ALMACÉN CENTRAL
├── ZONA A (Productos secos)
│   ├── ESTANTE A1
│   ├── ESTANTE A2
│   └── ESTANTE A3
├── ZONA B (Productos refrigerados)
│   ├── CÁMARA B1
│   └── CÁMARA B2
└── ZONA C (Materias primas)
    ├── PALLET C1
    ├── PALLET C2
    └── PALLET C3
```

**Datos de ubicación:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Almacén | Almacén padre | Almacén Central |
| Código | Código de ubicación | A1-01 |
| Descripción | Descripción | Estante A1 - Nivel 1 |
| Capacidad | Capacidad | 50 cajas |
| Estado | ACTIVO | ACTIVO |

---

## 📦 REGISTRO DE PRODUCTOS {#registro-productos}

### **PASO 1: Crear Familias de Productos**

**Módulo:** Maestros → Familia Producto

**Ejemplos:**

| Código | Nombre | Descripción |
|--------|--------|-------------|
| FAM-001 | Harina de Pescado | Productos derivados de pescado |
| FAM-002 | Aceite de Pescado | Aceites y grasas |
| FAM-003 | Conservas | Productos enlatados |
| FAM-004 | Insumos | Materias primas |

---

### **PASO 2: Crear Subfamilias**

**Módulo:** Maestros → Subfamilia Producto

**Ejemplos:**

| Familia | Código | Nombre |
|---------|--------|--------|
| Harina de Pescado | SUB-001 | Harina Prime |
| Harina de Pescado | SUB-002 | Harina Standard |
| Aceite de Pescado | SUB-003 | Aceite Crudo |
| Conservas | SUB-004 | Atún en Aceite |

---

### **PASO 3: Registrar Productos**

**Módulo:** Maestros → Productos y Servicios

**Datos del producto:**

#### **A. IDENTIFICACIÓN**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Código | Código único | PROD-001 |
| Nombre | Nombre del producto | Harina de Pescado Prime |
| Descripción | Descripción detallada | Harina de pescado alta calidad |
| Familia | Familia | Harina de Pescado |
| Subfamilia | Subfamilia | Harina Prime |
| Tipo | BIEN / SERVICIO | BIEN |

#### **B. UNIDADES DE MEDIDA**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Unidad Base | Unidad principal | TM (Tonelada Métrica) |
| Unidad Compra | Para compras | TM |
| Unidad Venta | Para ventas | TM |
| Unidad Inventario | Para almacén | TM |

#### **C. INFORMACIÓN COMERCIAL**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Precio Compra | Costo unitario | S/. 2,500.00 |
| Precio Venta | Precio de venta | S/. 3,200.00 |
| Moneda | PEN / USD | PEN |
| Aplica IGV | Sí / No | Sí |

#### **D. CONTROL DE INVENTARIO**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Controla Stock | Sí / No | Sí |
| Stock Mínimo | Cantidad mínima | 10 TM |
| Stock Máximo | Cantidad máxima | 200 TM |
| Punto Reorden | Punto de pedido | 30 TM |
| Almacén Principal | Almacén por defecto | Almacén Central |

#### **E. CONTABILIDAD**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Cuenta Compra | Cuenta de compra | 60111 |
| Cuenta Venta | Cuenta de venta | 70111 |
| Cuenta Costo | Cuenta de costo | 69111 |
| Cuenta Inventario | Cuenta de almacén | 20111 |

---

### **PASO 4: Procedimiento de Registro**

1. Ingresar al módulo **Maestros → Productos y Servicios**
2. Clic en **"Nuevo Producto"**
3. Completar todas las secciones
4. Configurar cuentas contables
5. Establecer stock mínimo y máximo
6. Guardar
7. **Repetir para cada producto**

---

## 📊 INVENTARIO INICIAL {#inventario-inicial}

### **PASO 1: Realizar Inventario Físico al 31/12/2025**

**Procedimiento:**

1. **Planificar inventario:**
   - Definir fecha: 31/12/2025
   - Asignar responsables por zona
   - Preparar formatos de conteo
   - Coordinar cierre temporal

2. **Ejecutar conteo:**
   - Contar físicamente cada producto
   - Registrar en formato de inventario
   - Doble conteo para verificación
   - Documentar diferencias

3. **Formato de conteo:**

```
INVENTARIO FÍSICO - 31/12/2025
Almacén: Almacén Central
Zona: A - Productos Secos
─────────────────────────────────────────────────────────────
Producto            | Ubicación | Cant. | UM  | Contado por
─────────────────────────────────────────────────────────────
Harina Pescado Prime| A1-01     | 150.5 | TM  | Juan P.
Harina Pescado Std  | A1-02     | 80.0  | TM  | María G.
Aceite Pescado      | A2-01     | 45.2  | TM  | Carlos L.
─────────────────────────────────────────────────────────────
```

---

### **PASO 2: Valorizar Inventario**

**Preparar Excel con inventario valorizado:**

| Almacén | Producto | Unidad | Cantidad | Costo Unitario | **Valor Total** | Moneda |
|---------|----------|--------|----------|----------------|-----------------|--------|
| Almacén Central | Harina Pescado Prime | TM | 150.50 | S/. 2,500.00 | **S/. 376,250.00** | PEN |
| Almacén Central | Harina Pescado Std | TM | 80.00 | S/. 2,200.00 | **S/. 176,000.00** | PEN |
| Almacén Frío | Conservas Atún | Caja | 5,000 | S/. 45.00 | **S/. 225,000.00** | PEN |
| Almacén Central | Aceite Pescado | TM | 45.20 | S/. 3,800.00 | **S/. 171,760.00** | PEN |

**Columnas obligatorias:**
- Almacén
- Producto
- Unidad de medida
- Cantidad física al 31/12/2025
- Costo unitario
- **Valor total** (Cantidad × Costo)
- Moneda

---

### **PASO 3: Registrar Inventario Inicial**

**Módulo:** Inventarios → Movimientos Almacén

**Datos del movimiento:**

| Campo | Descripción | Valor |
|-------|-------------|-------|
| Tipo Movimiento | Tipo | INGRESO POR SALDO INICIAL |
| Fecha | Fecha del movimiento | 31/12/2025 |
| Almacén | Almacén destino | Almacén Central |
| Concepto | Concepto | Saldo Inicial Inventario |
| Observaciones | Descripción | "Inventario inicial ejercicio 2026" |
| Estado | Estado | APROBADO |

**Detalle por producto:**

| Producto | Cantidad | Costo Unitario | Valor Total |
|----------|----------|----------------|-------------|
| Harina Pescado Prime | 150.50 TM | S/. 2,500.00 | S/. 376,250.00 |
| Harina Pescado Std | 80.00 TM | S/. 2,200.00 | S/. 176,000.00 |

**Procedimiento:**
1. Ingresar al módulo **Inventarios → Movimientos Almacén**
2. Clic en **"Nuevo Movimiento"**
3. Seleccionar Tipo: **"Ingreso por Saldo Inicial"**
4. Completar datos del encabezado
5. Agregar cada producto:
   - Seleccionar producto
   - Ingresar cantidad
   - Ingresar costo unitario
   - El sistema calcula valor total
6. Verificar totales
7. Guardar

**Asiento automático generado:**

```
20111 - Mercaderías (DEBE)  376,250.00
  591 - Resultados Acumulados (HABER)  376,250.00

Glosa: Saldo inicial inventario - Harina Pescado Prime
```

8. **Repetir para cada almacén**

---

### **Verificación:**

```
□ Inventario físico realizado
□ Todos los productos contados
□ Cantidades verificadas (doble conteo)
□ Costos unitarios correctos
□ Inventario valorizado
□ Movimientos registrados en el sistema
□ Asientos automáticos generados
□ Total Inventario en Balance = Suma de valores
```

---

## 📋 MOVIMIENTOS DE ALMACÉN {#movimientos-almacen}

### **Tipos de Movimientos**

| Tipo | Categoría | Afecta Stock | Ejemplo |
|------|-----------|--------------|---------|
| **INGRESO** | Entrada | ✅ Aumenta | Compra de mercadería |
| **SALIDA** | Salida | ✅ Disminuye | Venta de producto |
| **TRANSFERENCIA** | Movimiento | ✅ Ambos | Entre almacenes |
| **AJUSTE POSITIVO** | Ajuste | ✅ Aumenta | Sobrante en inventario |
| **AJUSTE NEGATIVO** | Ajuste | ✅ Disminuye | Faltante en inventario |
| **MERMA** | Salida | ✅ Disminuye | Pérdida por deterioro |
| **DEVOLUCIÓN** | Entrada/Salida | ✅ Depende | Devolución cliente/proveedor |

---

### **INGRESO por Compra**

**Módulo:** Inventarios → Movimientos Almacén

**Datos:**

| Campo | Valor |
|-------|-------|
| Tipo Movimiento | INGRESO POR COMPRA |
| Fecha | Fecha de recepción |
| Almacén | Almacén destino |
| Proveedor | Proveedor |
| Orden Compra | Nro OC (si aplica) |
| Guía Remisión | Nro guía del proveedor |
| Factura | Nro factura |

**Detalle:**

| Producto | Cantidad | Costo Unitario | Total |
|----------|----------|----------------|-------|
| Harina Pescado | 50 TM | S/. 2,500.00 | S/. 125,000.00 |

**Asiento automático:**
```
20111 - Mercaderías (DEBE)  125,000.00
  4212 - Facturas por Pagar (HABER)  125,000.00
```

---

### **SALIDA por Venta**

**Módulo:** Inventarios → Movimientos Almacén

**Datos:**

| Campo | Valor |
|-------|-------|
| Tipo Movimiento | SALIDA POR VENTA |
| Fecha | Fecha de despacho |
| Almacén | Almacén origen |
| Cliente | Cliente |
| Pre-Factura | Nro pre-factura |
| Guía Remisión | Nro guía propia |

**Detalle:**

| Producto | Cantidad | Costo Unitario | Total |
|----------|----------|----------------|-------|
| Harina Pescado | 30 TM | S/. 2,500.00 | S/. 75,000.00 |

**Asiento automático:**
```
69111 - Costo de Ventas (DEBE)  75,000.00
  20111 - Mercaderías (HABER)  75,000.00
```

---

### **TRANSFERENCIA entre Almacenes**

**Módulo:** Inventarios → Movimientos Almacén

**Datos:**

| Campo | Valor |
|-------|-------|
| Tipo Movimiento | TRANSFERENCIA |
| Fecha | Fecha de transferencia |
| Almacén Origen | Almacén Central |
| Almacén Destino | Almacén Sucursal |
| Motivo | Reposición de stock |

**Detalle:**

| Producto | Cantidad |
|----------|----------|
| Harina Pescado | 20 TM |

**Asientos automáticos:**
```
SALIDA Almacén Central:
20112 - Mercaderías Sucursal (DEBE)  50,000.00
  20111 - Mercaderías Central (HABER)  50,000.00
```

---

### **AJUSTE de Inventario**

**Módulo:** Inventarios → Movimientos Almacén

**Casos:**

#### **Ajuste Positivo (Sobrante):**
```
Tipo: AJUSTE POSITIVO
Motivo: Sobrante en inventario físico
Cantidad: +5 TM

Asiento:
20111 - Mercaderías (DEBE)  12,500.00
  779 - Otros Ingresos (HABER)  12,500.00
```

#### **Ajuste Negativo (Faltante):**
```
Tipo: AJUSTE NEGATIVO
Motivo: Faltante en inventario físico
Cantidad: -3 TM

Asiento:
659 - Otras Cargas de Gestión (DEBE)  7,500.00
  20111 - Mercaderías (HABER)  7,500.00
```

---

## 📈 CONTROL DE KARDEX {#control-kardex}

### **¿Qué es el Kardex?**

El Kardex es el registro detallado de todos los movimientos de cada producto:
- Entradas
- Salidas
- Saldo actual

---

### **Métodos de Valorización**

| Método | Descripción | Uso |
|--------|-------------|-----|
| **PEPS** | Primero en Entrar, Primero en Salir | Productos perecederos |
| **PROMEDIO** | Costo Promedio Ponderado | Productos no perecederos |
| **IDENTIFICADO** | Costo Específico | Productos únicos |

**⚠️ IMPORTANTE:** El sistema usa **PROMEDIO PONDERADO** por defecto.

---

### **Ejemplo de Kardex**

**Producto:** Harina de Pescado Prime

| Fecha | Tipo | Entrada | Salida | Saldo | Costo Unit. | Valor |
|-------|------|---------|--------|-------|-------------|-------|
| 31/12/2025 | Saldo Inicial | 150.5 TM | - | 150.5 TM | S/. 2,500.00 | S/. 376,250.00 |
| 05/01/2026 | Compra | 50.0 TM | - | 200.5 TM | S/. 2,550.00 | S/. 511,275.00 |
| 10/01/2026 | Venta | - | 30.0 TM | 170.5 TM | S/. 2,550.00 | S/. 434,775.00 |
| 15/01/2026 | Venta | - | 25.0 TM | 145.5 TM | S/. 2,550.00 | S/. 371,025.00 |

**Cálculo de Costo Promedio:**
```
Saldo Inicial: 150.5 TM × S/. 2,500 = S/. 376,250
Compra:         50.0 TM × S/. 2,600 = S/. 130,000
─────────────────────────────────────────────────
Total:         200.5 TM           = S/. 506,250

Costo Promedio = S/. 506,250 / 200.5 TM = S/. 2,525.94
```

---

### **Consultar Kardex**

**Módulo:** Inventarios → Kardex

**Filtros:**

| Filtro | Descripción |
|--------|-------------|
| Producto | Producto específico |
| Almacén | Almacén específico |
| Fecha Inicio | Desde fecha |
| Fecha Fin | Hasta fecha |

**Procedimiento:**
1. Ingresar al módulo **Inventarios → Kardex**
2. Seleccionar producto
3. Seleccionar almacén
4. Definir rango de fechas
5. Generar reporte
6. Exportar a Excel si es necesario

---

## 🔍 INVENTARIO FÍSICO {#inventario-fisico}

### **Frecuencia de Inventarios**

| Tipo | Frecuencia | Alcance |
|------|------------|---------|
| **Inventario General** | Anual | Todos los productos |
| **Inventario Rotativo** | Mensual | Productos de alta rotación |
| **Inventario Selectivo** | Trimestral | Productos críticos |
| **Conteo Cíclico** | Semanal | Por zonas |

---

### **Procedimiento de Inventario Físico**

#### **1. Planificación:**
```
□ Definir fecha y hora
□ Asignar responsables por zona
□ Preparar formatos de conteo
□ Coordinar cierre de operaciones
□ Comunicar a todas las áreas
```

#### **2. Preparación:**
```
□ Ordenar almacén
□ Etiquetar productos
□ Agrupar por familia
□ Preparar herramientas (balanzas, contadores)
□ Imprimir listados de productos
```

#### **3. Ejecución:**
```
□ Contar físicamente cada producto
□ Registrar en formato
□ Doble conteo para verificación
□ Documentar diferencias
□ Firmar responsables
```

#### **4. Conciliación:**
```
□ Comparar físico vs sistema
□ Investigar diferencias
□ Documentar causas
□ Aprobar ajustes
□ Registrar en el sistema
```

---

### **Formato de Inventario Físico**

```
INVENTARIO FÍSICO
Fecha: _______________  Almacén: _______________
Zona: _______________   Responsable: _______________

┌────────────────────────────────────────────────────────────┐
│ Producto | Ubicación | Stock Sistema | Conteo 1 | Conteo 2 │
├────────────────────────────────────────────────────────────┤
│          |           |               |          |          │
│          |           |               |          |          │
│          |           |               |          |          │
└────────────────────────────────────────────────────────────┘

Diferencias encontradas:
_____________________________________________________________

Contado por: ____________  Verificado por: ____________
Fecha: ____________        Fecha: ____________
```

---

## 📊 REPORTES DE INVENTARIOS {#reportes}

### **Reportes Principales**

| Reporte | Descripción | Frecuencia |
|---------|-------------|------------|
| **Stock Actual** | Existencias por producto | Diario |
| **Kardex** | Movimientos detallados | Según necesidad |
| **Valorización** | Inventario valorizado | Mensual |
| **Stock Mínimo** | Productos bajo mínimo | Semanal |
| **Productos Sin Movimiento** | Sin rotación | Mensual |
| **Análisis ABC** | Clasificación de productos | Trimestral |

---

### **Reporte de Stock Actual**

**Módulo:** Inventarios → Reportes → Stock Actual

**Formato:**

| Producto | Almacén | Stock Actual | UM | Stock Mín | Stock Máx | Estado |
|----------|---------|--------------|----|-----------|-----------| -------|
| Harina Prime | Central | 145.5 TM | TM | 30 TM | 200 TM | ✅ OK |
| Aceite Pescado | Central | 25.0 TM | TM | 30 TM | 100 TM | ⚠️ BAJO |
| Conservas Atún | Frío | 8,500 Caja | Caja | 5,000 | 15,000 | ✅ OK |

---

### **Análisis ABC de Inventarios**

**Clasificación:**

| Clase | Criterio | % Valor | Acción |
|-------|----------|---------|--------|
| **A** | Alta rotación, alto valor | 80% | Control estricto |
| **B** | Rotación media, valor medio | 15% | Control normal |
| **C** | Baja rotación, bajo valor | 5% | Control básico |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### **Semana 1: Configuración**

```
□ Tipos de almacén creados
□ Almacenes registrados
□ Ubicaciones físicas definidas
□ Responsables asignados
□ Familias de productos creadas
□ Subfamilias creadas
```

### **Semana 2: Productos**

```
□ Productos registrados
□ Unidades de medida configuradas
□ Precios de compra y venta ingresados
□ Stock mínimo y máximo definidos
□ Cuentas contables asignadas
```

### **Semana 3: Inventario Inicial**

```
□ Inventario físico realizado
□ Cantidades verificadas
□ Costos unitarios definidos
□ Excel de inventario valorizado
□ Inventario inicial registrado
□ Asientos automáticos verificados
```

### **Semana 4: Operación**

```
□ Procedimientos de movimientos implementados
□ Formatos de documentos preparados
□ Kardex funcionando
□ Reportes configurados
□ Personal capacitado
□ ¡Sistema operativo!
```


**FIN DEL MANUAL - ÁREA ALMACÉN E INVENTARIOS**
