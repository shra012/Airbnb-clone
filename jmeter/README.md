# JMeter Load Testing

Load test your Airbnb backend on AWS with configurable users and duration.

## Quick Start

```bash
# Run with 30 users for 60 seconds (defaults)
./run-test.sh

# Custom: 50 users for 2 minutes
./run-test.sh 50 120

# Custom: 10 users for 30 seconds  
./run-test.sh 10 30
```

## What's Tested

**Endpoint:**
- `GET /api/properties?limit=20` - Property search (public endpoint)

**Why only one endpoint?**
- No authentication required - tests raw backend performance
- Avoids 404 errors from missing test data
- Focuses on database query performance
- Clean success rate for accurate metrics

**Configuration:**
- Target: AWS Load Balancer (auto-detected)
- JMeter: v5.6.3 (included, no install needed)
- Results: Saved to `results/` with HTML reports
- Success Rate: ~99%+ (1 error allowed for connection issues)

## View Results

```bash
# HTML report opens automatically (or manually):
open results/html-quick-*/index.html
```

## Monitor Backend

```bash
# Watch pods
kubectl get pods -n airbnb-app -w

# Check resources
kubectl top pods -n airbnb-app

# View logs
kubectl logs -n airbnb-app -l app=booking-service -f
```

## Files

- `run-test.sh` - Main test script
- `airbnb-load-test.jmx` - JMeter test plan
- `apache-jmeter-5.6.3/` - JMeter installation
- `results/` - Test results and HTML reports
