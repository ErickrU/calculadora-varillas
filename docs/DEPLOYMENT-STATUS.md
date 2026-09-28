# Estado del despliegue AWS

## Despliegue vigente

| Campo | Valor |
|---|---|
| Aplicación | [https://d1or4j0yth4d72.cloudfront.net](https://d1or4j0yth4d72.cloudfront.net) |
| Fecha de despliegue | 2026-09-28 |
| Entorno | `prod` |
| Región del stack y bucket | `us-east-1` |
| Stack CloudFormation | `calculadora-varillas-web` |
| Distribución CloudFront | `E1DLNTC2M2VOWA` |
| Price class | `PriceClass_100` |
| HTTP | `http2and3` |
| Plantilla SHA-256 | `b2a66993b4d1dcb11b4c4564c4b97d57cb80700d3bc731d12746e8e6043b1847` |
| Commit inicial desplegado | `e285c13` |

El ID de cuenta, StackId completo y nombre físico del bucket se omiten deliberadamente del repositorio. Se pueden recuperar con los outputs de CloudFormation si se poseen credenciales autorizadas.

## Evidencia de verificación

Realizada después de completar la invalidación de CloudFront:

| Control | Resultado observado |
|---|---|
| Stack CloudFormation | `CREATE_COMPLETE` |
| Protección de terminación | Activa |
| Stack policy | Impide `Update:Replace`/`Update:Delete` del bucket y la distribución |
| Estado CloudFront | `Deployed`, distribución habilitada |
| Protocolo del viewer | HTTP responde `301` hacia HTTPS |
| HTTPS | `200 text/html; charset=utf-8` |
| Acceso directo a `s3://.../index.html` | `403` sin credenciales |
| S3 Block Public Access | Cuatro controles en `true` |
| Estado público del bucket | `IsPublic: false` |
| Object Ownership | `BucketOwnerEnforced` |
| Cifrado en reposo | `AES256` (SSE-S3) |
| Versionado | `Enabled` |
| Objetos publicados | 13, todos pertenecen a la allowlist |
| Origen CloudFront | Endpoint regional S3 + OAC |
| Cabeceras | CSP, HSTS, `nosniff`, `DENY`, Referrer y Permissions Policy |
| Manifest | Válido, sin errores reportados por Chrome |
| Service worker | Activado, cache `calculadora-varillas-shell-v2` |
| Cálculo en AWS | 30 × 50, 1 %, 5/8" → 8 barras |
| Vista móvil | Sin desborde horizontal |
| Modo offline | Recarga y cálculo 25 × 25, 1 %, 1/2" → 6 barras |
| Consola del navegador | Sin excepciones ni errores de aplicación |

## Recuperar outputs (solo lectura)

```bash
aws cloudformation describe-stacks \
  --profile <perfil> \
  --region us-east-1 \
  --stack-name calculadora-varillas-web \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Actualizaciones

Antes de publicar otra versión:

1. valida localmente;
2. incrementa `VERSION` en `sw.js` si cambió el app shell;
3. ejecuta `deploy-aws.sh` sin `--apply`;
4. verifica cuenta, región, StackId y SHA;
5. ejecuta con las confirmaciones exactas;
6. repite las pruebas de esta página y actualiza fecha/commit.

## Riesgos residuales aceptados

- El dominio predeterminado de CloudFront usa una política TLS administrada por AWS; para fijar TLS 1.2 o posterior hace falta dominio propio y certificado ACM.
- Los logs de acceso no están activos; deben diseñarse junto con retención, privacidad y presupuesto si el proyecto pasa a operación sostenida.
- La publicación está ordenada (recursos antes de HTML), pero no usa nombres de assets con hash; un corte durante la carga puede requerir repetir el despliegue.
- El bucket conserva versiones y tiene `DeletionPolicy: Retain`; esto protege datos, pero puede acumular costo hasta una limpieza aprobada.
