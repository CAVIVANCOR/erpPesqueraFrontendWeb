# 📋 Componente: Registro de Impuesto SUNAT

## 🎯 Descripción

Componente genérico, reutilizable e independiente para visualizar información de impuestos SUNAT (Detracción, Retención o Percepción) asociados a Cuentas por Cobrar o Cuentas por Pagar.

## 🏗️ Arquitectura

```
RegistroImpuestoSunat/
├── RegistroImpuestoSunatPanel.jsx  (Componente Maestro)
├── ImpuestoSunatCard.jsx           (Tarjeta Visual)
├── ImpuestoSunatModal.jsx          (Modal con Formulario)
├── impuestoSunatUtils.js           (Utilidades)
└── index.js                        (Exportaciones)
```

## 📦 Componentes

### 1. **RegistroImpuestoSunatPanel** (Maestro)

Componente principal que:
- Detecta automáticamente el tipo de impuesto
- Renderiza la tarjeta visual
- Gestiona el modal de detalle

### 2. **ImpuestoSunatCard** (Tarjeta Visual)

Tarjeta clickeable que muestra:
- Tipo de impuesto
- Tasa
- Fecha (depósito o emisión)
- Total
- Requerido/Retenido/Percibido
- Pagado
- Saldo

### 3. **ImpuestoSunatModal** (Modal)

Modal que muestra el formulario completo en modo solo lectura:
- DetraccionForm
- RetencionForm
- PercepcionForm

## 🚀 Uso

### Básico

```jsx
import { RegistroImpuestoSunatPanel } from '../common/RegistroImpuestoSunat';

<RegistroImpuestoSunatPanel
  documento={cuentaPorCobrar || cuentaPorPagar}
  monedas={monedas}
  tiposDetraccion={tiposDetraccion}
  tiposRetencionPercepcion={tiposRetencionPercepcion}
  periodosContables={periodosContables}
  empresas={empresas}
  entidadesComerciales={clientes || proveedores}
  estadosDetraccion={estadosDetraccion}
  estadosRetencion={estadosRetencion}
  estadosPercepcion={estadosPercepcion}
  toast={toast}
  permisos={{}}
/>
```

### Con opciones avanzadas

```jsx
<RegistroImpuestoSunatPanel
  documento={cuentaPorCobrar}
  monedas={monedas}
  tiposDetraccion={tiposDetraccion}
  tiposRetencionPercepcion={tiposRetencionPercepcion}
  periodosContables={periodosContables}
  empresas={empresas}
  entidadesComerciales={clientes}
  estadosDetraccion={estadosDetraccion}
  estadosRetencion={estadosRetencion}
  estadosPercepcion={estadosPercepcion}
  toast={toast}
  permisos={permisos}
  compact={false}
  showPanel={true}
  onUpdate={(updatedData) => {
    console.log('Datos actualizados:', updatedData);
  }}
/>
```

## 📋 Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `documento` | `object` | ✅ | CuentaPorCobrar o CuentaPorPagar con preFactura |
| `monedas` | `array` | ✅ | Array de monedas |
| `tiposDetraccion` | `array` | ✅ | Array de tipos de detracción |
| `tiposRetencionPercepcion` | `array` | ✅ | Array de tipos de retención/percepción |
| `periodosContables` | `array` | ✅ | Array de períodos contables |
| `empresas` | `array` | ✅ | Array de empresas |
| `entidadesComerciales` | `array` | ✅ | Array de clientes o proveedores |
| `estadosDetraccion` | `array` | ✅ | Array de estados para detracción |
| `estadosRetencion` | `array` | ✅ | Array de estados para retención |
| `estadosPercepcion` | `array` | ✅ | Array de estados para percepción |
| `toast` | `object` | ❌ | Ref de Toast |
| `permisos` | `object` | ❌ | Objeto de permisos |
| `compact` | `boolean` | ❌ | Modo compacto (sin panel wrapper) |
| `showPanel` | `boolean` | ❌ | Mostrar panel wrapper |
| `onUpdate` | `function` | ❌ | Callback al actualizar |

## 🎨 Características

### ✅ Detección Automática

El componente detecta automáticamente el tipo de impuesto:
1. Detracción (prioridad 1)
2. Retención (prioridad 2)
3. Percepción (prioridad 3)

### ✅ Adaptación Dinámica

Los campos se adaptan según el tipo:

| Campo | Detracción | Retención | Percepción |
|-------|-----------|-----------|------------|
| **Fecha** | Fecha Emisión | Fecha Emisión | Fecha Emisión |
| **Requerido** | Requerido | Retenido | Percibido |

### ✅ Colores Diferenciados

Cada tipo tiene su esquema de colores:
- **Detracción**: Azul claro
- **Retención**: Morado claro
- **Percepción**: Verde menta claro

### ✅ Responsive

Se adapta a dispositivos móviles y desktop.

### ✅ Solo Lectura

Los formularios se muestran en modo solo lectura (`readOnly: true`).

## 🔧 Utilidades

### `getColorConfig(tipo)`

Obtiene la configuración de colores según el tipo.

```javascript
import { getColorConfig } from './impuestoSunatUtils';

const colors = getColorConfig('DETRACCION');
// { tipo: {...}, tasa: {...}, ... }
```

### `getFieldConfig(tipo, registro)`

Obtiene la configuración de campos según el tipo.

```javascript
import { getFieldConfig } from './impuestoSunatUtils';

const fields = getFieldConfig('DETRACCION', detraccion);
// { tipo: {...}, tasa: {...}, ... }
```

### `detectarImpuesto(documento, estadosDetraccion, estadosRetencion, estadosPercepcion)`

Detecta el tipo de impuesto desde un documento.

```javascript
import { detectarImpuesto } from './impuestoSunatUtils';

const impuesto = detectarImpuesto(cuentaPorCobrar, estadosDetraccion, estadosRetencion, estadosPercepcion);
// { tipo: 'DETRACCION', registro: {...}, estados: [...] }
```

### `formatearNumero(num)`

Formatea un número con separadores de miles.

```javascript
import { formatearNumero } from './impuestoSunatUtils';

formatearNumero(1234.56); // "1,234.56"
```

### `formatearFecha(fecha)`

Formatea una fecha en formato dd/mm/yyyy.

```javascript
import { formatearFecha } from './impuestoSunatUtils';

formatearFecha('2026-09-23'); // "23/09/2026"
```

## 📝 Ejemplos de Uso

### En CuentaPorCobrar

```jsx
const renderRegistroImpuestoSunat = () => {
  return (
    <RegistroImpuestoSunatPanel
      documento={cuentaPorCobrar}
      monedas={monedas}
      tiposDetraccion={tiposDetraccion}
      tiposRetencionPercepcion={tiposRetencionPercepcion}
      periodosContables={periodosContables}
      empresas={empresas}
      entidadesComerciales={clientes}
      estadosDetraccion={estadosDetraccion}
      estadosRetencion={estadosRetencion}
      estadosPercepcion={estadosPercepcion}
      toast={toast}
      permisos={{}}
    />
  );
};
```

### En CuentaPorPagar

```jsx
const renderRegistroImpuestoSunat = () => {
  return (
    <RegistroImpuestoSunatPanel
      documento={cuentaPorPagar}
      monedas={monedas}
      tiposDetraccion={tiposDetraccion}
      tiposRetencionPercepcion={tiposRetencionPercepcion}
      periodosContables={periodosContables}
      empresas={empresas}
      entidadesComerciales={proveedores}
      estadosDetraccion={estadosDetraccion}
      estadosRetencion={estadosRetencion}
      estadosPercepcion={estadosPercepcion}
      toast={toast}
      permisos={{}}
    />
  );
};
```

## 🛡️ Seguridad

- ✅ Modo solo lectura en formularios
- ✅ No permite edición accidental
- ✅ Validación de props
- ✅ Manejo seguro de datos nulos

## 📌 Notas Importantes

1. **Detección Automática**: El componente detecta automáticamente el tipo de impuesto, no es necesario especificarlo.

2. **Estados Específicos**: Cada tipo de impuesto tiene sus propios estados (estadosDetraccion, estadosRetencion, estadosPercepcion).

3. **Formularios Existentes**: Reutiliza los formularios existentes (DetraccionForm, RetencionForm, PercepcionForm).

4. **Props Completas**: Asegúrate de pasar todas las props necesarias para que los formularios funcionen correctamente.

## 🔄 Migración desde VerRegistroImpuestoSunat

### Antes:

```jsx
const renderRegistroImpuestoSunat = () => {
  if (!cuentaPorCobrar?.preFactura) return null;

  const preFactura = cuentaPorCobrar.preFactura;
  let tipoImpuesto = null;
  let registroGenerado = null;
  let estadosImpuesto = [];

  if (preFactura.aplicaDetraccion && preFactura.detraccion) {
    tipoImpuesto = 'DETRACCION';
    registroGenerado = preFactura.detraccion;
    estadosImpuesto = estadosDetraccion;
  } else if (preFactura.aplicaRetencion && preFactura.retencion) {
    tipoImpuesto = 'RETENCION';
    registroGenerado = preFactura.retencion;
    estadosImpuesto = estadosRetencion;
  } else if (preFactura.aplicaPercepcion && preFactura.percepcion) {
    tipoImpuesto = 'PERCEPCION';
    registroGenerado = preFactura.percepcion;
    estadosImpuesto = estadosPercepcion;
  }

  if (!tipoImpuesto || !registroGenerado) return null;

  return (
    <Panel header="📋 Registro de Impuesto SUNAT Generado" className="mb-3">
      <VerRegistroImpuestoSunat
        registro={registroGenerado}
        tipo={tipoImpuesto}
        monedas={monedas}
        tiposDetraccion={tiposDetraccion}
        tiposRetencionPercepcion={tiposRetencionPercepcion}
        periodosContables={periodosContables}
        empresas={empresas}
        entidadesComerciales={clientes}
        estadosPago={estadosImpuesto}
        compact={false}
        toast={toast}
        permisos={{}}
        onUpdate={(updatedData) => {}}
      />
    </Panel>
  );
};
```

### Después:

```jsx
const renderRegistroImpuestoSunat = () => {
  return (
    <RegistroImpuestoSunatPanel
      documento={cuentaPorCobrar}
      monedas={monedas}
      tiposDetraccion={tiposDetraccion}
      tiposRetencionPercepcion={tiposRetencionPercepcion}
      periodosContables={periodosContables}
      empresas={empresas}
      entidadesComerciales={clientes}
      estadosDetraccion={estadosDetraccion}
      estadosRetencion={estadosRetencion}
      estadosPercepcion={estadosPercepcion}
      toast={toast}
      permisos={{}}
    />
  );
};
```

## 📞 Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Fecha**: 2026-09-23  
**Estado**: ✅ Producción
