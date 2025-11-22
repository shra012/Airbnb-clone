# Kubernetes Deployment Guide

Complete guide for deploying the Airbnb Clone application to AWS EKS.

## Prerequisites

All prerequisites are met:
- EKS Cluster: `serious-folk-goose` (running)
- Worker Nodes: 3 x t2.large (Ready)
- kubectl configured
- Helm 3.x installed
- AWS CLI configured
- ECR repositories created

## Deployment Steps

### Step 1: Build and Push Docker Images

Build all service images and push them to ECR:

```bash
./scripts/build-and-push.sh
```

This will:
- Login to AWS ECR
- Build images for traveler, owner, property, booking, agent, and frontend services
- Tag images with ECR registry URL
- Push all images to ECR

**Estimated time:** 10-15 minutes

### Step 2: Verify Images in ECR

```bash
aws ecr list-images --repository-name airbnb-traveler
aws ecr list-images --repository-name airbnb-owner
aws ecr list-images --repository-name airbnb-property
aws ecr list-images --repository-name airbnb-booking
aws ecr list-images --repository-name airbnb-agent
aws ecr list-images --repository-name airbnb-frontend
```

### Step 3: Deploy to Kubernetes

Deploy using Helm:

```bash
./scripts/deploy-helm.sh
```

This will:
- Read secrets from `backend/.env`
- Create `airbnb-app` namespace
- Deploy all services with secrets
- Wait for deployments to be ready

**Estimated time:** 5-10 minutes

### Step 4: Verify Deployment

Check pods are running:

```bash
kubectl get pods -n airbnb-app
```

Expected output:
```
NAME                                READY   STATUS    RESTARTS   AGE
traveler-service-xxxx-yyyy          1/1     Running   0          2m
owner-service-xxxx-yyyy             1/1     Running   0          2m
property-service-xxxx-yyyy          1/1     Running   0          2m
booking-service-xxxx-yyyy           1/1     Running   0          2m
agent-service-xxxx-yyyy             1/1     Running   0          2m
frontend-xxxx-yyyy                  1/1     Running   0          2m
```

Check services:

```bash
kubectl get svc -n airbnb-app
```

### Step 5: Access the Application

Get the frontend LoadBalancer URL:

```bash
kubectl get svc frontend -n airbnb-app
```

Or use ingress (if configured):

```bash
kubectl get ingress -n airbnb-app
```

Wait for the LoadBalancer to provision (~2-3 minutes), then access:

```bash
FRONTEND_URL=$(kubectl get svc frontend -n airbnb-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Application available at: http://${FRONTEND_URL}"
```

## Monitoring and Debugging

### View Logs

```bash
# All pods in namespace
kubectl logs -f -l app=traveler-service -n airbnb-app

# Specific service
kubectl logs -f deployment/traveler-service -n airbnb-app

# Previous logs (if pod crashed)
kubectl logs --previous <pod-name> -n airbnb-app
```

### Describe Resources

```bash
# Pod details
kubectl describe pod <pod-name> -n airbnb-app

# Deployment details
kubectl describe deployment traveler-service -n airbnb-app

# Service details
kubectl describe svc traveler-service -n airbnb-app
```

### Check Events

```bash
kubectl get events -n airbnb-app --sort-by='.lastTimestamp'
```

### Port Forwarding (for testing)

```bash
# Forward traveler service to localhost
kubectl port-forward svc/traveler-service 4000:4000 -n airbnb-app

# Forward frontend
kubectl port-forward svc/frontend 8080:80 -n airbnb-app
```

## Scaling

### Manual Scaling

```bash
# Scale a specific service
kubectl scale deployment traveler-service --replicas=5 -n airbnb-app

# Scale all backend services
kubectl scale deployment traveler-service owner-service property-service booking-service --replicas=3 -n airbnb-app
```

### Auto-scaling Status

Check HPA status:

```bash
kubectl get hpa -n airbnb-app
```

Expected output:
```
NAME                    REFERENCE                         TARGETS         MINPODS   MAXPODS   REPLICAS
traveler-service-hpa    Deployment/traveler-service       50%/70%         1         3         2
owner-service-hpa       Deployment/owner-service          45%/70%         1         3         2
```

## Configuration Updates

### Update Image Version

```bash
# Update a specific service
helm upgrade airbnb ./k8s/helm/airbnb \
  --set travelerService.image.tag=v1.1.0 \
  -n airbnb-app

# Update all services
helm upgrade airbnb ./k8s/helm/airbnb \
  --set global.imageTag=v1.1.0 \
  -n airbnb-app
```

### Update Environment Variables

```bash
# Update from new .env file
./scripts/deploy-helm.sh
```

### Update Resource Limits

Create `custom-values.yaml`:

```yaml
travelerService:
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

Apply:

```bash
helm upgrade airbnb ./k8s/helm/airbnb \
  -f custom-values.yaml \
  -n airbnb-app
```

## Rolling Updates

Helm automatically performs rolling updates:

```bash
# Update with new image
helm upgrade airbnb ./k8s/helm/airbnb \
  --set travelerService.image.tag=v1.2.0 \
  -n airbnb-app

# Watch rollout status
kubectl rollout status deployment/traveler-service -n airbnb-app

# Rollback if needed
kubectl rollout undo deployment/traveler-service -n airbnb-app
```

## Helm Management

### List Releases

```bash
helm list -n airbnb-app
```

### Helm History

```bash
helm history airbnb -n airbnb-app
```

### Rollback Release

```bash
# Rollback to previous version
helm rollback airbnb -n airbnb-app

# Rollback to specific revision
helm rollback airbnb 2 -n airbnb-app
```

### Uninstall

```bash
# Uninstall the application
helm uninstall airbnb -n airbnb-app

# Delete namespace
kubectl delete namespace airbnb-app
```

## Troubleshooting

### Pods Not Starting

**Check pod status:**
```bash
kubectl get pods -n airbnb-app
kubectl describe pod <pod-name> -n airbnb-app
```

**Common issues:**
- Image pull errors: Verify ECR login
- CrashLoopBackOff: Check logs for application errors
- Pending: Check node resources

### Image Pull Errors

```bash
# Re-login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  171158266231.dkr.ecr.us-east-1.amazonaws.com

# Verify image exists
aws ecr describe-images --repository-name airbnb-traveler
```

### Database Connection Issues

```bash
# Verify secrets
kubectl get secrets -n airbnb-app
kubectl describe secret mongo-session -n airbnb-app
kubectl describe secret supabase-postgres -n airbnb-app

# Check environment variables in pod
kubectl exec -it <pod-name> -n airbnb-app -- env | grep -E "MONGO|DATABASE"
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n airbnb-app

# Check if pods are ready
kubectl get pods -n airbnb-app

# Test internal service
kubectl run test-pod --rm -it --image=curlimages/curl -n airbnb-app -- \
  curl http://traveler-service:4000/health
```

### LoadBalancer Pending

```bash
# Check service
kubectl describe svc frontend -n airbnb-app

# Check events
kubectl get events -n airbnb-app | grep frontend

# Verify AWS Load Balancer Controller is running
kubectl get pods -n kube-system | grep aws-load-balancer
```

## Performance Testing

### Load Testing with JMeter

```bash
# Create test plan (see performance/ directory)
# Run JMeter tests
jmeter -n -t performance/airbnb-lab2.jmx \
  -l results.jtl \
  -Jhostname=${FRONTEND_URL}
```

### Metrics

```bash
# Pod resource usage
kubectl top pods -n airbnb-app

# Node resource usage
kubectl top nodes

# HPA metrics
kubectl get hpa -n airbnb-app --watch
```

## Maintenance

### Update Node Group

```bash
# Update desired capacity
aws eks update-nodegroup-config \
  --cluster-name serious-folk-goose \
  --nodegroup-name airbnb-workers \
  --scaling-config desiredSize=5
```

### Drain Node for Maintenance

```bash
# Drain node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon when ready
kubectl uncordon <node-name>
```

### Backup

```bash
# Export current Helm values
helm get values airbnb -n airbnb-app > backup-values.yaml

# Export Kubernetes resources
kubectl get all -n airbnb-app -o yaml > backup-k8s.yaml
```

## Success Criteria

- All pods in `Running` state
- All services have endpoints
- LoadBalancer has external IP
- Application accessible via browser
- Health checks passing
- HPA configured and monitoring

## Next Steps

1. **Configure DNS** - Point your domain to the LoadBalancer
2. **Enable HTTPS** - Install cert-manager and configure TLS
3. **Set up monitoring** - Install Prometheus and Grafana
4. **Configure alerts** - Set up AlertManager
5. **CI/CD** - Automate builds and deployments
6. **Backup strategy** - Regular database and configuration backups

## Support

For issues:
1. Check pod logs
2. Review events
3. Verify secrets and ConfigMaps
4. Test service connectivity
5. Check resource limits

Documentation: See `/docs` directory
Issues: GitHub repository
