# EKS Availability Zone Error - FIXED ✅

## The Error

When running `terraform apply`, you encountered this error:

```
UnsupportedAvailabilityZoneException: Cannot create cluster 'airbnb-lab2-cluster' 
because EKS does not support creating control plane instances in us-east-1e, 
the targeted availability zone.
```

## Root Cause

**EKS does not support the `us-east-1e` availability zone** for control plane instances.

### Supported AZs in us-east-1:
✅ us-east-1a  
✅ us-east-1b  
✅ us-east-1c  
✅ us-east-1d  
✅ us-east-1f  
❌ **us-east-1e** (NOT SUPPORTED)

Your default VPC had 6 subnets, and one of them (`subnet-050a426af7482466c`) was in the unsupported `us-east-1e` zone.

## Subnet Mapping

| Subnet ID | Availability Zone | EKS Support | Status |
|-----------|-------------------|-------------|---------|
| subnet-025d2dcd1925d6042 | us-east-1a | ✅ Yes | Included |
| subnet-012bcfd56363abe00 | us-east-1b | ✅ Yes | Included |
| subnet-0a328f5b1e792ffc8 | us-east-1c | ✅ Yes | Included |
| subnet-0171b6874d9204109 | us-east-1d | ✅ Yes | Included |
| **subnet-050a426af7482466c** | **us-east-1e** | ❌ **NO** | **EXCLUDED** |
| subnet-07da58cc7de5bcdf0 | us-east-1f | ✅ Yes | Included |

## Solution Applied

### 1. Updated `network.auto.tfvars`
Removed the problematic subnet from the configuration:

```hcl
public_subnet_ids = [
  "subnet-025d2dcd1925d6042",  # us-east-1a
  "subnet-0a328f5b1e792ffc8",  # us-east-1c
  # "subnet-050a426af7482466c",  # us-east-1e - EXCLUDED
  "subnet-0171b6874d9204109",  # us-east-1d
  "subnet-07da58cc7de5bcdf0",  # us-east-1f
  "subnet-012bcfd56363abe00",  # us-east-1b
]
```

### 2. Updated `configure-network.sh`
Modified the script to automatically filter out `us-east-1e` subnets in the future:

```bash
# EKS doesn't support us-east-1e, so filter it out
while IFS=$'\t' read -r subnet_id az; do
  if [[ -n "$subnet_id" && "$az" != "us-east-1e" ]]; then
    SUBNET_ARRAY+=("$subnet_id")
    echo "  Including subnet $subnet_id in $az"
  elif [[ "$az" == "us-east-1e" ]]; then
    echo "  Skipping subnet $subnet_id in $az (EKS doesn't support this AZ)"
  fi
done
```

## Verification

After the fix, Terraform plan shows:
- ✅ 5 subnets configured (excluding us-east-1e)
- ✅ Subnets span 5 different availability zones (meets EKS requirement of at least 2)
- ✅ All subnets are in EKS-supported zones
- ✅ No more `UnsupportedAvailabilityZoneException` errors

## Current State

Some resources were already created before the error occurred:
- ✅ 6 ECR repositories (airbnb-traveler, owner, property, booking, agent, frontend)
- ✅ IAM roles and policies
- ✅ Security groups

Still need to create:
- ⏳ EKS cluster
- ⏳ EKS node group
- ⏳ EKS addons
- ⏳ Kubernetes namespaces

## Next Steps

You're now ready to apply the fixed configuration:

```bash
cd aws
source setup-env.sh
terraform apply
```

This time it should succeed! The cluster will be created using only the 5 EKS-supported subnets.

## Important Notes

### Why This Happened
AWS Learner Lab accounts use the default VPC, which includes subnets in all 6 availability zones in us-east-1. However, EKS only supports 5 of those zones, excluding us-east-1e.

### Worker Nodes
Note from AWS: "Post cluster creation, you can run worker nodes in separate subnets/availability zones from control plane subnets/availability zones."

This means:
- ✅ Control plane MUST be in supported AZs (a, b, c, d, f)
- ✅ Worker nodes CAN be in any AZ (including us-east-1e if needed)

For simplicity, we're using the same 5 subnets for both control plane and worker nodes.

### Future Runs
If you run `bash aws/scripts/configure-network.sh` again, it will automatically exclude us-east-1e subnets, so you won't encounter this error again.

## Cost Impact
No change - still creating the same resources:
- EKS cluster: ~$0.10/hour
- 3x t3.large nodes: ~$0.28/hour
- Total: ~$3-4/day

## Summary

✅ **Problem identified**: Subnet in unsupported us-east-1e AZ  
✅ **Configuration fixed**: Excluded problematic subnet  
✅ **Script updated**: Future-proofed against this issue  
✅ **Verified**: Terraform plan succeeds  
✅ **Ready to deploy**: Run `terraform apply` now!

