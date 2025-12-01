<div align="center">

#  Serverless Image Resizing Pipeline

<img src="https://compote.slate.com/images/2119ff95-86f2-4546-a8fd-7b70ec58c9c6.jpeg?crop=1560%2C1040%2Cx0%2Cy0&width=370" alt="AWS Serverless" width="600"/>

### Proyecto serverless construido con **AWS CDK** que implementa un pipeline automático de procesamiento de imágenes utilizando **Amazon S3**, **AWS Lambda**, y **Sharp**.

[![AWS](https://img.shields.io/badge/AWS-CDK-orange?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com/cdk/)
[![Lambda](https://img.shields.io/badge/AWS-Lambda-orange?style=for-the-badge&logo=awslambda)](https://aws.amazon.com/lambda/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Sharp](https://img.shields.io/badge/Sharp-0.34.5-99CC00?style=for-the-badge)](https://sharp.pixelplumbing.com/)

</div>

---

## 📋 Overview

Este repositorio contiene un proyecto en el cual se construye un sistema serverless de procesamiento de imágenes en AWS utilizando Infrastructure as Code (IaC) con CDK. El proyecto implementa un patrón event-driven donde las imágenes subidas a un bucket S3 son automáticamente procesadas y redimensionadas por una función Lambda.

**Flujo de trabajo:**
1. Usuario sube una imagen `.jpeg` al bucket de origen
2. S3 dispara automáticamente un evento de creación de objeto
3. Lambda recibe el evento, descarga la imagen, y la redimensiona a 150px de ancho usando Sharp
4. Lambda guarda la imagen procesada en el bucket de destino con el sufijo `-small.jpeg`

## 🏗️ Arquitectura & Tecnologías

### **Core Technologies**

- **AWS CDK v2.230.0** - Infrastructure as Code framework para definir recursos AWS
- **AWS Lambda** - Función serverless para procesamiento de imágenes
- **Amazon S3** - Almacenamiento de imágenes originales y procesadas
- **Sharp v0.34.5** - Librería de alto rendimiento para procesamiento de imágenes
- **CloudWatch** - Monitoreo, logs estructurados y métricas
- **Node.js 20.x** - Runtime para la función Lambda
- **JavaScript** - Lenguaje de desarrollo (CDK y Lambda)

### **AWS Services**

- **Amazon S3** - Dos buckets: origen (imágenes originales) y destino (imágenes procesadas)
- **AWS Lambda** - Función serverless con 1024 MB de memoria y timeout de 30 segundos
- **Lambda Layers** - Capa personalizada con Sharp y sus dependencias nativas
- **S3 Event Notifications** - Integración nativa entre S3 y Lambda
- **CloudWatch Logs** - Almacenamiento de logs estructurados (JSON)
- **IAM** - Roles y permisos automáticos para lectura/escritura de S3

### **Development Tools**

- **Jest** - Framework de testing para pruebas unitarias
- **AWS CDK CLI** - Herramienta de línea de comandos para despliegue
- **CloudFormation** - Motor subyacente para el aprovisionamiento de recursos
- **AWS SDK v3** - Cliente modular de S3 (`@aws-sdk/client-s3`)

## 📁 Estructura del Proyecto

```
s3-lambda-images/
├── bin/
│   └── s3-lambda-images.js           # Punto de entrada de la aplicación CDK
├── lib/
│   └── s3-lambda-images-stack.js     # Definición del stack CDK (infraestructura)
├── lambda/
│   ├── index.js                      # Código de la función Lambda
│   ├── package.json                  # Dependencias Lambda (AWS SDK v3)
│   └── node_modules/                 # Dependencias instaladas (runtime Lambda)
├── layers/
│   └── sharp/
│       └── nodejs/
│           ├── package.json          # Dependencias del layer (Sharp)
│           └── node_modules/         # Sharp y dependencias nativas (layer)
├── test/
│   └── s3-lambda-images.test.js      # Tests unitarios del stack
├── cdk.json                          # Configuración del CDK Toolkit
├── cdk.out/                          # Templates CloudFormation sintetizados
├── package.json                      # Dependencias CDK (desarrollo)
├── node_modules/                     # Dependencias CDK (desarrollo)
├── jest.config.js                    # Configuración de Jest
└── README.md                         # Documentación del proyecto
```

## 🗂️ ¿Por qué node_modules separados?

> [!IMPORTANT]
> Este proyecto tiene **TRES** directorios `node_modules` independientes con propósitos completamente diferentes:

### **1️⃣ node_modules del proyecto CDK** (raíz: `./node_modules/`)

**Ubicación**: `s3-lambda-images/node_modules/`

**Propósito**: Dependencias para **desarrollo local** con AWS CDK.

**Contiene**:
- `aws-cdk-lib` - Librería de construcciones de CDK
- `constructs` - Base de construcciones de CDK
- `jest` - Framework de testing
- `aws-cdk` - CLI de CDK (devDependency)

**Se usa para**:
- Ejecutar `cdk synth`, `cdk deploy`, `cdk destroy`
- Correr tests unitarios con Jest
- Desarrollo local en tu máquina

**NO se despliega a AWS**: Estas dependencias solo se usan durante el desarrollo.

---

### **2️⃣ node_modules de la función Lambda** (`lambda/node_modules/`)

**Ubicación**: `s3-lambda-images/lambda/node_modules/`

**Propósito**: Dependencias de **runtime** necesarias para la función Lambda en AWS.

**Contiene**:
- `@aws-sdk/client-s3` - Cliente modular de S3 para AWS SDK v3

**Se usa para**:
- Interactuar con S3 desde la función Lambda
- Descargar imágenes del bucket origen
- Subir imágenes procesadas al bucket destino

**SÍ se despliega a AWS**: CDK empaqueta este directorio completo (`lambda/` folder) y lo sube como código de la función Lambda.

**¿Por qué necesita su propio package.json?**
- El código Lambda se ejecuta en un runtime aislado en AWS
- Necesita declarar sus propias dependencias independientemente del proyecto CDK
- Permite usar `"type": "module"` para habilitar sintaxis ESM (import/export)

---

### **3️⃣ node_modules de la Lambda Layer** (`layers/sharp/nodejs/node_modules/`)

**Ubicación**: `s3-lambda-images/layers/sharp/nodejs/node_modules/`

**Propósito**: Dependencias **compiladas para Linux x64** (runtime de Lambda) que se comparten entre funciones.

**Contiene**:
- `sharp` - Librería de procesamiento de imágenes con **binarios nativos** para Amazon Linux

**Se usa para**:
- Redimensionar imágenes en la función Lambda
- Proveer librerías nativas (libvips) compiladas para el entorno Lambda

**SÍ se despliega a AWS**: CDK empaqueta este directorio como Lambda Layer y lo vincula a la función.

**¿Por qué necesita su propio package.json?**
- Sharp requiere compilación nativa específica para Linux x64 (Amazon Linux)
- Lambda Layers tienen una estructura de carpetas específica (`nodejs/node_modules/`)
- Permite **reutilizar** Sharp entre múltiples funciones Lambda sin duplicar el código
- Debe instalarse con Docker en Windows para garantizar compatibilidad binaria:
  ```bash
  docker run --rm \
    --entrypoint /bin/bash \
    -v "${PWD}:/var/task" \
    -w /var/task \
    public.ecr.aws/lambda/nodejs:20 \
    -c "cd layers/sharp/nodejs && npm install sharp --no-bin-links"
  ```

---

### **📊 Resumen Visual**

| Directorio | Propósito | Se despliega a AWS | Entorno de ejecución |
|------------|-----------|-------------------|----------------------|
| `./node_modules/` | Desarrollo con CDK | ❌ No | Tu máquina local |
| `lambda/node_modules/` | Runtime de Lambda | ✅ Sí | AWS Lambda (Node.js 20) |
| `layers/sharp/nodejs/node_modules/` | Lambda Layer compartido | ✅ Sí | AWS Lambda (Linux x64) |

### **⚠️ Errores comunes**

1. **Instalar Sharp en el node_modules raíz**: 
   - ❌ **Incorrecto**: `npm install sharp` (en la raíz)
   - ✅ **Correcto**: Docker build en `layers/sharp/nodejs/`

2. **No usar Docker en Windows**:
   - ❌ `npm install sharp --platform=linux` (no funciona en Windows)
   - ✅ Usar Docker con imagen `public.ecr.aws/lambda/nodejs:20`

3. **Mezclar dependencias**:
   - ❌ Agregar `sharp` a `lambda/package.json` (debe estar en el layer)
   - ✅ Lambda usa `@aws-sdk/client-s3`, Layer provee `sharp`

## ✨ Componentes Clave

### **1️⃣ Punto de Entrada CDK** (`bin/s3-lambda-images.js`)

```javascript
const app = new cdk.App();

new S3LambdaImagesStack(app, 'S3LambdaImagesStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

**Responsabilidades:**
- Inicializa la aplicación CDK
- Instancia el stack principal con configuración de región y cuenta
- Utiliza variables de entorno por defecto de AWS CLI

---

### **2️⃣ Buckets S3** (`lib/s3-lambda-images-stack.js`)

```javascript
const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const destinationBucket = new s3.Bucket(this, 'DestinationBucket', {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

**Características:**

#### **Source Bucket (Origen)**
- **Propósito**: Almacena imágenes originales subidas por usuarios
- **Removal Policy**: `DESTROY` - se elimina al destruir el stack (ideal para desarrollo)
- **Auto Delete Objects**: `true` - elimina objetos automáticamente antes de destruir el bucket
- **Evento**: Dispara notificación cuando se crea un objeto `.jpeg`

#### **Destination Bucket (Destino)**
- **Propósito**: Almacena imágenes procesadas/redimensionadas
- **Removal Policy**: `DESTROY` - se elimina al destruir el stack
- **Auto Delete Objects**: `true` - limpieza automática
- **Acceso**: Lambda tiene permisos de escritura

**⚠️ Advertencia de Producción:**
Para ambientes productivos, cambiar `RemovalPolicy` a `RETAIN` para evitar pérdida de datos.

---

### **3️⃣ Lambda Layer con Sharp**

```javascript
const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
  code: lambda.Code.fromAsset(
    path.join(__dirname, '../layers/sharp')
  ),
  compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
  description: 'Layer con Sharp para redimensionar imágenes',
});
```

**¿Por qué un Layer?**
- **Sharp** requiere librerías nativas (libvips) que deben ser compiladas para el runtime de Lambda
- Los layers permiten compartir dependencias entre múltiples funciones Lambda
- Reduce el tamaño del deployment package de la función Lambda
- Facilita actualizaciones y reutilización

**Estructura del Layer:**
```
layers/sharp/nodejs/
├── package.json (sharp: ^0.34.5)
└── node_modules/
    └── sharp/ (con binarios nativos para Lambda)
```

**Instalación del Layer:**
```bash
cd layers/sharp/nodejs
npm install --platform=linux --arch=x64 sharp
```

> [!WARNING]
> **Importante para usuarios de Windows**: El comando `npm install --platform=linux --arch=x64 sharp` puede no funcionar correctamente en Windows. En su lugar, debes usar Docker con la imagen oficial de AWS Lambda (ver sección siguiente).

---

### **🔧 Construcción de la Lambda Layer con Sharp (Windows + AWS Lambda)**

Esta aplicación usa Sharp en una Lambda Layer. Como Lambda corre sobre **Linux x64 (Amazon Linux)**, es necesario que la dependencia de `sharp` esté compilada para esa plataforma, **no para Windows**.

Si no se hace esto, verás errores como:

```
Error: Could not load the "sharp" module using the linux-x64 runtime
```

#### **📋 Requisitos**

- **Docker Desktop** instalado y corriendo
- **Node.js 20+**
- **AWS CDK v2**
- **PowerShell** (recomendado para estos comandos en Windows)

La layer vive en: `layers/sharp/nodejs`

#### **🔁 Pasos para reconstruir la layer de Sharp**

Siempre que clones el repo en una máquina nueva o notes errores de Sharp, seguí estos pasos:

**1️⃣ Borrar node_modules de la layer**

Desde la raíz del proyecto:

```powershell
rm -r -fo .\layers\sharp\nodejs\node_modules
```

**2️⃣ Instalar Sharp usando Docker (Linux x64) sin bin-links**

```powershell
docker run --rm `
  --entrypoint /bin/bash `
  -v "${PWD}:/var/task" `
  -w /var/task `
  public.ecr.aws/lambda/nodejs:20 `
  -c "cd layers/sharp/nodejs && npm install sharp --no-bin-links"
```

**¿Qué hace este comando?**

- Usa la imagen oficial de Lambda Node.js 20 (mismo entorno que en AWS)
- Ejecuta `npm install sharp` dentro de `layers/sharp/nodejs` en **Linux x64**
- La opción `--no-bin-links` evita crear symlinks en `node_modules/.bin`, que dan problemas en Windows cuando CDK hace el empaquetado

**3️⃣ Desplegar el stack**

```bash
cdk deploy S3LambdaImagesStack
```

#### **🧪 Verificación rápida**

1. Subir una imagen al bucket de origen (S3)
2. Confirmar que aparece la versión `-small` en el bucket de destino
3. En CloudWatch Logs, en `/aws/lambda/S3LambdaImagesStack-ResizeFunction...`, verificar que:
   - ❌ **NO** aparece el error de `Could not load the "sharp" module`
   - ✅ Se ven logs tipo `"Resizing image"` y `"Image successfully resized and uploaded"`

**💡 Ejemplo de logs exitosos:**

```json
{
  "level": "info",
  "requestId": "abc-123-xyz",
  "message": "Resizing image",
  "resizeWidth": 150
}
{
  "level": "info",
  "requestId": "abc-123-xyz",
  "message": "Image successfully resized and uploaded",
  "destinationBucket": "s3lambdaimagesstack-destinationbucket-xyz",
  "newKey": "photo-small.jpeg"
}
```

---

### **4️⃣ CloudWatch Log Group**

> [!NOTE]
> **Estado Actual**: El stack actual **NO** crea explícitamente un LogGroup. Lambda automáticamente crea uno al ejecutarse por primera vez con retención indefinida. Para mejor control, se recomienda agregar un LogGroup explícito.

**Implementación Recomendada (no incluida actualmente):**

```javascript
const logs = require('aws-cdk-lib/aws-logs');

const resizeFnLogGroup = new logs.LogGroup(this, 'ResizeFnLogGroup', {
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: RemovalPolicy.DESTROY,
});
```

**Características Recomendadas:**
- **Retention**: 7 días (optimiza costos en desarrollo)
- **Removal Policy**: `DESTROY` - se limpia al destruir el stack
- **Logs Estructurados**: La Lambda emite logs en formato JSON
- **Forma Moderna**: Creación explícita del LogGroup (mejor control)

**Ventajas del enfoque moderno:**
- ✅ Control total sobre retención y políticas
- ✅ Evita problemas de permisos con custom resources
- ✅ Consistencia con IaC (todo en CDK)

**Estado Actual:**
- ⚠️ Lambda crea LogGroup automáticamente con retención indefinida
- ⚠️ LogGroup no se elimina automáticamente al hacer `cdk destroy`

---

### **5️⃣ Función Lambda** (`lib/s3-lambda-images-stack.js`)

```javascript
const resizeFn = new lambda.Function(this, 'ResizeFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(
    path.join(__dirname, '../lambda')
  ),
  timeout: Duration.seconds(30),
  memorySize: 1024,
  layers: [sharpLayer],
  environment: {
    DESTINATION_BUCKET: destinationBucket.bucketName,
  },
  // logGroup: resizeFnLogGroup, // ⚠️ NO CONFIGURADO actualmente
});
```

**Configuración:**
- **Runtime**: Node.js 20.x (LTS, soporte hasta Abril 2026)
- **Handler**: `index.handler` (exportación `handler` en `index.js`)
- **Timeout**: 30 segundos (suficiente para imágenes grandes)
- **Memory**: 1024 MB (Sharp es intensivo en CPU/RAM)
- **Layer**: Incluye Sharp precompilado
- **Environment Variables**: `DESTINATION_BUCKET` (nombre del bucket de destino)

**Permisos IAM:**
```javascript
sourceBucket.grantRead(resizeFn);       // Leer imágenes originales
destinationBucket.grantWrite(resizeFn); // Escribir imágenes procesadas
```

---

### **6️⃣ Código Lambda** (`lambda/index.js`)

**Importaciones (ESM):**
```javascript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({ region: process.env.AWS_REGION });
```

**Handler Principal:**
```javascript
export const handler = async (event, context) => {
  const requestId = context.awsRequestId;
  
  // 1. Extraer información del evento S3
  const { bucket, object } = event.Records[0].s3;
  const key = decodeURIComponent(object.key.replace(/\+/g, " "));
  
  // 2. Descargar imagen del bucket origen
  const { Body } = await s3.send(new GetObjectCommand({ 
    Bucket: bucket.name, 
    Key: key 
  }));
  
  // 3. Redimensionar imagen con Sharp (150px ancho)
  const resizedImage = await sharp(await Body.transformToByteArray())
    .resize(150)
    .toBuffer();
  
  // 4. Generar nuevo nombre (ej: foto.jpeg -> foto-small.jpeg)
  const newKey = key.replace(".jpeg", "-small.jpeg");
  
  // 5. Subir imagen procesada al bucket destino
  await s3.send(new PutObjectCommand({
    Bucket: process.env.DESTINATION_BUCKET,
    Key: newKey,
    Body: resizedImage,
    ContentType: "image/jpeg"
  }));
  
  return { status: "success", bucket: destinationBucket, key: newKey };
};
```

**Características del Código:**
- ✅ **Logs estructurados (JSON)**: Facilita análisis con CloudWatch Insights
- ✅ **Request ID tracking**: Cada log incluye `awsRequestId` para trazabilidad
- ✅ **Manejo de errores**: Try-catch con logs de error detallados
- ✅ **URL decoding**: Maneja correctamente nombres de archivo con espacios/caracteres especiales
- ✅ **AWS SDK v3**: Cliente modular (reduce bundle size)
- ✅ **ESM (ES Modules)**: Sintaxis moderna con `import/export`

**Ejemplo de Log Estructurado:**
```json
{
  "level": "info",
  "requestId": "abc-123-xyz",
  "message": "Image successfully resized and uploaded",
  "destinationBucket": "s3lambdaimagesstack-destinationbucket-xyz",
  "newKey": "photo-small.jpeg"
}
```

---

### **7️⃣ S3 Event Notification**

```javascript
sourceBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(resizeFn)
  // ⚠️ IMPORTANTE: El stack actual NO incluye filtro de sufijo
  // Para agregar filtro solo para .jpeg, descomentar:
  // , { suffix: '.jpeg' }
);
```

**Configuración Actual:**
- **Evento**: `OBJECT_CREATED` (cualquier tipo: Put, Post, Copy, Multipart Upload)
- **Destino**: Función Lambda `resizeFn`
- **Filtro**: ⚠️ **NINGUNO** - procesa **CUALQUIER** archivo subido
- **Integración**: Nativa (sin necesidad de EventBridge o SNS)

> [!WARNING]
> **Configuración Actual**: El stack NO tiene filtro de sufijo configurado. Esto significa que la Lambda se ejecutará para **CUALQUIER** archivo subido al bucket (incluyendo .png, .txt, .pdf, etc.), lo cual puede causar errores. Se recomienda agregar `{ suffix: '.jpeg' }` como tercer parámetro de `addEventNotification`.

**Eventos Capturados:**
- ✅ `s3:ObjectCreated:Put`
- ✅ `s3:ObjectCreated:Post`
- ✅ `s3:ObjectCreated:Copy`
- ✅ `s3:ObjectCreated:CompleteMultipartUpload`

---

## ☁️ Recursos AWS Creados

Al ejecutar `npx cdk deploy`, se crean los siguientes recursos en tu cuenta de AWS:

| Recurso | Tipo AWS | Propósito | Costo Estimado |
|---------|----------|-----------|----------------|
| **Source Bucket** | `AWS::S3::Bucket` | Almacenamiento de imágenes originales | $0.023/GB almacenado |
| **Destination Bucket** | `AWS::S3::Bucket` | Almacenamiento de imágenes procesadas | $0.023/GB almacenado |
| **Lambda Function** | `AWS::Lambda::Function` | Procesamiento y redimensionado de imágenes | Gratis (1M invocaciones/mes) |
| **Lambda Layer** | `AWS::Lambda::LayerVersion` | Librería Sharp con dependencias nativas | Incluido |
| **Lambda Execution Role** | `AWS::IAM::Role` | Permisos para leer S3 origen y escribir S3 destino | Gratis |
| **CloudWatch Log Group** | `AWS::Logs::LogGroup` | Logs de Lambda (retención 7 días) | $0.50/GB almacenado |
| **S3 Notification Config** | `AWS::S3::BucketNotification` | Trigger de S3 a Lambda | Gratis |

**💰 Costo Total Estimado**: 
- **Free Tier**: Completamente gratis (1M invocaciones Lambda + 5GB S3 + 5GB logs)
- **Post Free Tier**: ~$0.50-$2/mes con uso ligero (100 imágenes/día)

**Desglose de Costos (Post Free Tier):**
- Lambda: $0.20 por 1 millón de invocaciones + $0.0000166667 por GB-segundo
- S3: $0.023 por GB almacenado
- CloudWatch Logs: $0.50 por GB almacenado
- Data Transfer: $0.09 por GB (solo si descargas desde S3)

---

## 🔄 Flujo de Funcionamiento

### **Escenario Completo: Procesamiento de Imagen**

```
┌─────────┐   Sube        ┌──────────┐   Evento      ┌────────┐   Descarga   ┌──────────┐
│         │  foto.jpeg    │          │  S3 Created   │        │   imagen     │          │
│ Usuario │ ──────────▶   │ S3 Bucket│ ────────────▶ │ Lambda │ ───────────▶ │ S3 Origin│
│         │               │ (Origin) │               │        │              │          │
└─────────┘               └──────────┘               └────┬───┘              └──────────┘
                                                           │
                                                           │ Procesa con Sharp
                                                           │ (Resize 150px)
                                                           │
                                                           ▼
                                                      ┌─────────────┐
                                                      │   Sharp     │
                                                      │ (Layer)     │
                                                      │ Redimensiona│
                                                      └─────┬───────┘
                                                            │
                                                            │ Imagen
                                                            │ procesada
                                                            ▼
                                                      ┌──────────┐
                                                      │ S3 Bucket│
                                                      │  (Dest)  │
                                                      │foto-small│
                                                      │  .jpeg   │
                                                      └──────────┘
```

**Paso a Paso:**

1. **Upload** (0ms): Usuario sube `vacation.jpeg` (2MB, 4000x3000px) a `SourceBucket`
2. **Event** (~50ms): S3 dispara evento `ObjectCreated` a Lambda
3. **Invocation** (~100ms): Lambda arranca (cold start si es primera ejecución)
4. **Download** (~200ms): Lambda descarga `vacation.jpeg` desde S3
5. **Processing** (~500ms): Sharp redimensiona imagen a 150px ancho (~50KB)
6. **Upload** (~100ms): Lambda sube `vacation-small.jpeg` a `DestinationBucket`
7. **Complete** (~950ms total): Proceso completo, logs en CloudWatch

**Latencias Típicas:**
- **Cold Start**: ~1-2 segundos (primera invocación o después de inactividad)
- **Warm Execution**: ~500ms-1s (Lambda ya inicializada)
- **Procesamiento Sharp**: ~200-800ms (depende del tamaño de imagen)

---

## 🚀 Comandos Útiles

### **Instalación Inicial**

```bash
# Instalar dependencias del proyecto CDK
npm install

# Instalar AWS CDK CLI globalmente (si no lo tienes)
npm install -g aws-cdk

# Instalar dependencias de la función Lambda
cd lambda
npm install
cd ..

# Instalar Sharp en el Layer (para Linux Lambda)
cd layers/sharp/nodejs
npm install --platform=linux --arch=x64 sharp
cd ../../..
```

### **Development & Testing**

```bash
# Sintetizar CloudFormation template (ver infraestructura generada)
npx cdk synth

# Ver diferencias con el stack desplegado en AWS
npx cdk diff

# Listar todos los stacks
npx cdk list

# Ejecutar tests unitarios
npm run test

# Ejecutar tests en modo watch
npm run test -- --watch
```

### **Deployment**

```bash
# Bootstrap de CDK (solo primera vez en una cuenta/región)
npx cdk bootstrap

# Desplegar stack a AWS
npx cdk deploy

# Desplegar sin confirmación (para CI/CD)
npx cdk deploy --require-approval never

# Destruir todos los recursos creados
npx cdk destroy
```

**⚠️ Advertencia**: `cdk destroy` eliminará todos los buckets y las imágenes almacenadas.

### **Testing del Sistema Desplegado**

```bash
# Obtener nombre del bucket origen desde CloudFormation outputs
aws cloudformation describe-stacks --stack-name S3LambdaImagesStack \
  --query 'Stacks[0].Outputs[?OutputKey==`SourceBucketName`].OutputValue' \
  --output text

# Subir una imagen de prueba
aws s3 cp test-image.jpeg s3://BUCKET-NAME/test-image.jpeg

# Verificar que se procesó correctamente
aws s3 ls s3://DESTINATION-BUCKET-NAME/ --recursive

# Descargar imagen procesada
aws s3 cp s3://DESTINATION-BUCKET-NAME/test-image-small.jpeg ./downloaded-small.jpeg

# Ver logs de CloudWatch
aws logs tail /aws/lambda/S3LambdaImagesStack-ResizeFunction-XXX --follow
```

### **Monitoreo con CloudWatch Insights**

```bash
# Query para buscar errores
fields @timestamp, requestId, message, error
| filter level = "error"
| sort @timestamp desc
| limit 20

# Query para analizar tiempos de procesamiento
fields @timestamp, requestId, message
| filter message = "Image successfully resized and uploaded"
| stats count() by bin(5m)
```

---

## 💡 Ventajas del Proyecto

| Ventaja | Descripción |
|---------|-------------|
| **🚀 Serverless** | Sin servidores que administrar, pago solo por uso real |
| **📈 Escalabilidad Automática** | AWS escala de 0 a 1000s de invocaciones concurrentes automáticamente |
| **⚡ Event-Driven** | Procesamiento en tiempo real al subir imagen (latencia ~1s) |
| **💰 Bajo Costo** | Free Tier cubre 1M invocaciones Lambda + 5GB S3 mensualmente |
| **📝 Infrastructure as Code** | Infraestructura reproducible, versionable y auditable |
| **🔍 Observabilidad** | Logs estructurados en JSON para análisis con CloudWatch Insights |
| **🎨 High Performance** | Sharp es 4-5x más rápido que ImageMagick/GraphicsMagick |
| **🔒 Seguridad** | IAM roles con permisos mínimos (least privilege) |
| **♻️ Reutilizable** | Lambda Layer permite compartir Sharp entre múltiples funciones |
| **🌍 Multi-región** | Fácil replicación en diferentes regiones AWS con CDK |

---

## 📚 Casos de Uso

Este patrón arquitectónico es ideal para:

| Caso de Uso | Descripción | Ejemplo |
|-------------|-------------|---------|
| 🖼️ **Thumbnails** | Generar miniaturas automáticamente | Perfiles de usuario, galerías de productos |
| 📱 **Responsive Images** | Crear múltiples tamaños para web/móvil | Imágenes `srcset` (150px, 300px, 600px, 1200px) |
| 🎨 **Marca de Agua** | Aplicar watermarks a imágenes subidas | Protección de copyright en plataformas de contenido |
| 🔄 **Formato Conversion** | Convertir JPEG a WebP/AVIF | Optimización de ancho de banda (50-70% reducción) |
| 📊 **Metadata Extraction** | Extraer EXIF, geolocalización, dimensiones | Organización automática de fotos |
| 🔍 **Image Analysis** | Integrar Rekognition para detección de contenido | Moderación de contenido, etiquetado automático |
| 📦 **Batch Processing** | Procesar grandes volúmenes de imágenes legacy | Migración de galería antigua con 100K+ fotos |

---

## 🛠️ Próximos Pasos Sugeridos

### **Nivel Básico**
- [ ] Agregar soporte para más formatos (`.png`, `.webp`, `.gif`)
- [ ] Generar múltiples tamaños (thumbnails de 50px, 150px, 300px)
- [ ] Implementar validación de tipo MIME (evitar archivos maliciosos)
- [ ] Agregar CloudFormation Outputs para nombres de buckets

### **Nivel Intermedio**
- [ ] **Conversión de Formato**: Convertir automáticamente JPEG a WebP (mejor compresión)
- [ ] **Metadata Preservation**: Preservar EXIF, orientación de cámara
- [ ] **Error Handling**: Dead Letter Queue (SQS) para reintentos
- [ ] **Monitoring**: CloudWatch Alarms para errores y latencias altas
- [ ] **Optimización**: Ajustar memoria Lambda según análisis de CloudWatch Insights
- [ ] **Caching**: CloudFront para servir imágenes procesadas
- [ ] **API**: API Gateway + Lambda para redimensionado bajo demanda

### **Nivel Avanzado**
- [ ] **Multi-Size Pipeline**: Generar 4-5 tamaños en una sola invocación
- [ ] **Rekognition Integration**: Detectar contenido inapropiado antes de publicar
- [ ] **Watermarking**: Aplicar marca de agua con texto/logo personalizado
- [ ] **CI/CD**: Pipeline con GitHub Actions para deploy automático
- [ ] **Multi-Stage**: Ambientes separados (dev, staging, prod)
- [ ] **Cost Optimization**: 
  - Arm64 (Graviton2) para ~20% reducción de costos
  - Reserved Concurrency para predecir costos
  - S3 Intelligent-Tiering para archivos antiguos
- [ ] **Security**:
  - S3 Bucket Encryption (SSE-S3 o KMS)
  - VPC Endpoints para S3 (evitar tráfico público)
  - WAF si se expone vía API Gateway
- [ ] **Testing**:
  - Tests de integración con LocalStack
  - Performance testing con diferentes tamaños de imagen
  - Snapshot testing de outputs CDK

---

## 🎨 Extensión: Múltiples Tamaños

**Código Lambda Modificado:**
```javascript
const sizes = [
  { width: 50, suffix: '-thumb' },
  { width: 150, suffix: '-small' },
  { width: 300, suffix: '-medium' },
  { width: 600, suffix: '-large' },
];

for (const { width, suffix } of sizes) {
  const resized = await sharp(imageBuffer)
    .resize(width)
    .toBuffer();
  
  const newKey = key.replace('.jpeg', `${suffix}.jpeg`);
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.DESTINATION_BUCKET,
    Key: newKey,
    Body: resized,
    ContentType: 'image/jpeg',
  }));
}
```

**Resultado:**
- `photo.jpeg` (original) → `photo-thumb.jpeg` (50px)
- `photo.jpeg` (original) → `photo-small.jpeg` (150px)
- `photo.jpeg` (original) → `photo-medium.jpeg` (300px)
- `photo.jpeg` (original) → `photo-large.jpeg` (600px)

---

## 📖 Recursos Adicionales

### **Documentación Oficial**
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

### **Tutoriales**
- [AWS CDK Workshop](https://cdkworkshop.com/)
- [Serverless Image Handler (AWS Solution)](https://aws.amazon.com/solutions/implementations/serverless-image-handler/)
- [Sharp Performance Tips](https://sharp.pixelplumbing.com/performance)

### **Best Practices**
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [S3 Performance Guidelines](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)

---

## 🔧 Configuración del Proyecto

### **cdk.json**

Define cómo el CDK Toolkit ejecuta la aplicación:

```json
{
  "app": "node bin/s3-lambda-images.js",
  "context": {
    // Feature flags para comportamientos específicos de CDK
  }
}
```

### **package.json (CDK)**

```json
{
  "name": "s3-lambda-images",
  "version": "0.1.0",
  "scripts": {
    "build": "echo \"No build step required for JavaScript\" && exit 0",
    "cdk": "cdk",
    "test": "jest"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.230.0",
    "constructs": "^10.4.3"
  },
  "devDependencies": {
    "aws-cdk": "2.1033.0",
    "jest": "^29.7.0"
  }
}
```

### **lambda/package.json**

```json
{
  "name": "lambda",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.940.0"
  }
}
```

**Características clave**:
- `"type": "module"` - Habilita sintaxis ESM (import/export) en Node.js
- `@aws-sdk/client-s3` - Cliente modular de S3 (más liviano que SDK v2)
- **NO incluye `sharp`** - Sharp está en el Layer, no en el código Lambda

### **layers/sharp/nodejs/package.json**

```json
{
  "name": "nodejs",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "sharp": "^0.34.5"
  }
}
```

**Características clave**:
- Nombre `"nodejs"` - Convención requerida para Lambda Layers
- `sharp` - Debe instalarse con Docker para compilar binarios Linux x64
- **Estructura de carpetas crítica**: `layers/sharp/nodejs/node_modules/sharp`

---

## ⚠️ Troubleshooting

### **Problema: Lambda falla con "Cannot find module 'sharp'" o "Could not load the 'sharp' module using the linux-x64 runtime"**

**Causa**: Sharp no está instalado correctamente en el Layer, o está compilado para Windows en lugar de Linux.

**Solución para Windows (RECOMENDADA)**:

Usar Docker para compilar Sharp para Linux x64:

```powershell
# 1. Borrar node_modules existente
rm -r -fo .\layers\sharp\nodejs\node_modules

# 2. Compilar Sharp con Docker para Linux x64
docker run --rm `
  --entrypoint /bin/bash `
  -v "${PWD}:/var/task" `
  -w /var/task `
  public.ecr.aws/lambda/nodejs:20 `
  -c "cd layers/sharp/nodejs && npm install sharp --no-bin-links"

# 3. Re-desplegar
cdk deploy S3LambdaImagesStack
```

**Solución para Linux/Mac**:

```bash
cd layers/sharp/nodejs
rm -rf node_modules package-lock.json
npm install --platform=linux --arch=x64 sharp
cd ../../..
cdk deploy S3LambdaImagesStack
```

> [!IMPORTANT]
> En Windows, el comando `npm install --platform=linux --arch=x64 sharp` **NO funciona correctamente**. Siempre usá Docker con la imagen oficial de AWS Lambda.

---

### **Problema: "Access Denied" al leer/escribir en S3**

**Causa**: Permisos IAM incorrectos.

**Verificación**:
```javascript
// En s3-lambda-images-stack.js
sourceBucket.grantRead(resizeFn);       // ✅ Debe estar presente
destinationBucket.grantWrite(resizeFn); // ✅ Debe estar presente
```

---

### **Problema: Timeout en Lambda al procesar imágenes grandes**

**Causa**: Timeout de 30s insuficiente para imágenes muy grandes (>10MB).

**Solución**:
```javascript
timeout: Duration.seconds(60), // Aumentar a 60s
memorySize: 2048,              // Aumentar RAM para más CPU
```

---

### **Problema: Cold start muy lento (~3-5 segundos)**

**Causa**: Sharp tiene dependencias nativas pesadas.

**Soluciones**:
1. **Provisioned Concurrency**: Mantener 1-2 instancias "calientes"
```javascript
resizeFn.addAlias('prod', {
  provisionedConcurrentExecutions: 2,
});
```

2. **Aumentar memoria**: Más RAM = más CPU = arranque más rápido
```javascript
memorySize: 2048, // De 1024 a 2048
```

---

## 🤝 Contribuciones

Este es un proyecto educativo. Si encuentras mejoras o tienes sugerencias:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/MultipleImageSizes`)
3. Commit tus cambios (`git commit -m 'Add multiple image sizes support'`)
4. Push a la rama (`git push origin feature/MultipleImageSizes`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible para fines educativos.

---
