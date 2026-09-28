# Infraestructura

`cloudformation.yaml` crea el alojamiento AWS de la PWA:

- bucket S3 privado, cifrado y versionado;
- Block Public Access completo y Object Ownership sin ACL;
- CloudFront Origin Access Control con firma SigV4;
- distribución CloudFront que redirige HTTP a HTTPS;
- Content Security Policy, HSTS y otras cabeceras;
- política que limita `s3:GetObject` al ARN de la distribución.

El bucket usa `DeletionPolicy: Retain` y `UpdateReplacePolicy: Retain`. Borrar o reemplazar el stack no borra datos automáticamente.

No ejecutes la plantilla directamente sin leer [`../docs/AWS-DEPLOYMENT.md`](../docs/AWS-DEPLOYMENT.md). El punto de entrada recomendado es:

```bash
./scripts/deploy-aws.sh --profile <perfil> --region <region> --stack <nombre> --environment <entorno>
```

Ese comando, sin `--apply`, solo revisa. La escritura requiere confirmar el ID exacto de cuenta.

## Certificado y TLS

La configuración inicial usa el dominio y certificado predeterminados de CloudFront. AWS fija la política mínima de ese certificado; CloudFormation no permite endurecerla para `cloudfront.net`. Para controlar el mínimo TLS, configura un dominio propio, un certificado ACM en `us-east-1`, `Aliases`, `AcmCertificateArn`, `SslSupportMethod: sni-only` y `MinimumProtocolVersion`.
