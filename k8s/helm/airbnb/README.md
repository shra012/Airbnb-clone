# Airbnb Helm Chart

This Helm chart deploys the complete Airbnb clone application stack to Kubernetes.

## Prerequisites

- Kubernetes 1.28+
- Helm 3.0+
- kubectl configured to communicate with your cluster
- AWS ECR access for pulling images
- Backend .env file with required secrets

## Architecture

The chart deploys the following services:

1. **Traveler Service** (Port 4000) - Traveler-specific API endpoints
2. **Owner Service** (Port 4001) - Property owner API endpoints  
3. **Property Service** (Port 4002) - Property listing management
4. **Booking Service** (Port 4003) - Booking and reservation management
5. **Agent Service** (Port 8000) - AI concierge (FastAPI + LangChain)
6. **Frontend** (Port 80) - React SPA

## Quick Start

### 1. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  171158266231.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
cd backend && docker build -t 171158266231.dkr.ecr.us-east-1.amazonaws.com/airbnb-traveler:latest .
docker push 171158266231.dkr.ecr.us-east-1.amazonaws.com/airbnb-traveler:latest

# Repeat for other services...
```

### 2. Deploy with Helm

Using the provided script:

```bash
./scripts/deploy-helm.sh
```

Or manually:

```bash
helm install airbnb ./k8s/helm/airbnb \
  --namespace airbnb-app \
  --create-namespace \
  --set secrets.mongo.sessionUri="mongodb+srv://..." \
  --set secrets.supabase.databaseUrl="postgresql://..." \
  --set secrets.session.secret="your-secret-key"
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n airbnb-app

# Check services
kubectl get svc -n airbnb-app

# Get frontend URL
kubectl get svc frontend -n airbnb-app
```

## Configuration

### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Kubernetes namespace | `airbnb-app` |
| `global.imageRegistry` | ECR registry URL | `171158266231.dkr.ecr.us-east-1.amazonaws.com` |
| `global.imagePullPolicy` | Image pull policy | `IfNotPresent` |

### Secrets

| Parameter | Description | Required |
|-----------|-------------|----------|
| `secrets.mongo.sessionUri` | MongoDB connection string | Yes |
| `secrets.supabase.databaseUrl` | PostgreSQL connection string | Yes |
| `secrets.session.secret` | Express session secret | Yes |

### Service Configuration

Each service can be configured with:

- `enabled`: Enable/disable the service
- `replicaCount`: Number of replicas
- `image.repository`: Image repository name
- `image.tag`: Image tag
- `resources`: CPU/memory requests and limits
- `env`: Environment variables

Example:

```yaml
travelerService:
  enabled: true
  replicaCount: 3
  image:
    tag: "v1.2.0"
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment traveler-service --replicas=5 -n airbnb-app
```

### Auto-scaling (HPA)

Horizontal Pod Autoscalers are configured for all services:

- Min replicas: 1
- Max replicas: 3
- Target CPU: 70%
- Target Memory: 80%

## Monitoring

```bash
# Watch pods
kubectl get pods -n airbnb-app -w

# View logs
kubectl logs -f deployment/traveler-service -n airbnb-app

# Describe pod for troubleshooting
kubectl describe pod <pod-name> -n airbnb-app
```

## Uninstall

```bash
helm uninstall airbnb -n airbnb-app
kubectl delete namespace airbnb-app
```

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name> -n airbnb-app
kubectl logs <pod-name> -n airbnb-app
```

### Image pull errors

Ensure you're logged into ECR:

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  171158266231.dkr.ecr.us-east-1.amazonaws.com
```

### Database connection issues

Verify secrets are set correctly:

```bash
kubectl get secrets -n airbnb-app
kubectl describe secret mongo-session -n airbnb-app
```

## Advanced Usage

### Custom Values File

Create `my-values.yaml`:

```yaml
travelerService:
  replicaCount: 5
  resources:
    requests:
      memory: "1Gi"
      cpu: "1000m"
```

Deploy with custom values:

```bash
helm upgrade airbnb ./k8s/helm/airbnb \
  -f my-values.yaml \
  -n airbnb-app
```

### Rolling Updates

```bash
helm upgrade airbnb ./k8s/helm/airbnb \
  --set travelerService.image.tag=v1.1.0 \
  -n airbnb-app
```

### Rollback

```bash
# List releases
helm history airbnb -n airbnb-app

# Rollback to previous version
helm rollback airbnb -n airbnb-app
```

## Support

For issues and questions, please refer to the main project documentation.
