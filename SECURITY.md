# Seguridad

## Reportar una vulnerabilidad

No publiques detalles sensibles en un issue. Usa la opción **Report a vulnerability** de la pestaña Security del repositorio para enviar un reporte privado. Incluye impacto, pasos de reproducción y una prueba de concepto mínima que no afecte sistemas ajenos.

## Modelo de seguridad

La aplicación es estática y ejecuta todos los cálculos en el navegador:

- no tiene backend, base de datos, cuentas de usuario ni analítica;
- no transmite los valores del formulario;
- no usa dependencias JavaScript de terceros ni recursos de CDN;
- el service worker solo intercepta solicitudes `GET` del mismo origen;
- no se deben introducir secretos en HTML, JavaScript, el manifest ni Git.

El despliegue AWS propuesto agrega:

- bucket S3 privado con los cuatro controles de Block Public Access;
- acceso al contenido exclusivamente mediante CloudFront Origin Access Control (OAC);
- cifrado en reposo, versionado y denegación de transporte no seguro;
- redirección HTTP→HTTPS, certificado administrado por CloudFront y cabeceras de seguridad;
- protección de retención para que eliminar el stack no borre el contenido automáticamente.

Consulta [`docs/AWS-DEPLOYMENT.md`](docs/AWS-DEPLOYMENT.md) para el procedimiento y las responsabilidades operativas.

## Alcance y datos

Los resultados son orientativos y académicos. Una discrepancia de ingeniería debe reportarse como defecto funcional con un cálculo manual reproducible; no es, por sí sola, una vulnerabilidad de seguridad.

Versiones con soporte: la rama `main` y el último despliegue documentado.
