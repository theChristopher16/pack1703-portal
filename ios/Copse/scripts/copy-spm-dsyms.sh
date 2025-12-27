#!/bin/bash

# Script to copy dSYMs from Swift Package Manager dependencies
# This fixes the "Upload Symbols Failed" warnings for SPM frameworks

set -e

echo "🔍 Copying dSYMs from Swift Package Manager dependencies..."

# Find the archive's dSYM folder
ARCHIVE_DSYM_FOLDER="${DWARF_DSYM_FOLDER_PATH}"

if [ -z "$ARCHIVE_DSYM_FOLDER" ]; then
    echo "⚠️  DWARF_DSYM_FOLDER_PATH not set, skipping dSYM copy"
    exit 0
fi

# Find SPM checkouts directory
SPM_CHECKOUTS="${BUILD_DIR%/Build/*}/SourcePackages/checkouts"
if [ ! -d "$SPM_CHECKOUTS" ]; then
    # Try alternative location
    SPM_CHECKOUTS="${PROJECT_DIR}/build/SourcePackages/checkouts"
fi

if [ ! -d "$SPM_CHECKOUTS" ]; then
    echo "⚠️  Could not find SPM checkouts directory, skipping dSYM copy"
    exit 0
fi

# List of frameworks that need dSYMs (from the error messages)
FRAMEWORKS=(
    "FirebaseAnalytics"
    "FirebaseFirestoreInternal"
    "GoogleAdsOnDeviceConversion"
    "GoogleAppMeasurement"
    "GoogleAppMeasurementIdentitySupport"
    "absl"
    "grpc"
    "grpcpp"
    "openssl_grpc"
)

COPIED=0

# Search for dSYMs in SPM packages
for framework in "${FRAMEWORKS[@]}"; do
    # Find dSYM files matching the framework name
    find "$SPM_CHECKOUTS" -name "${framework}.framework.dSYM" -o -name "*${framework}*.dSYM" | while read dsym_path; do
        if [ -d "$dsym_path" ]; then
            framework_name=$(basename "$dsym_path" .dSYM)
            dest_path="${ARCHIVE_DSYM_FOLDER}/${framework_name}.dSYM"
            
            if [ ! -d "$dest_path" ]; then
                echo "📦 Copying ${framework_name}.dSYM..."
                cp -R "$dsym_path" "$dest_path"
                COPIED=$((COPIED + 1))
            fi
        fi
    done
done

# Also try to find dSYMs in DerivedData
DERIVED_DATA="${BUILD_DIR%/Build/Products/*}"
if [ -d "$DERIVED_DATA" ]; then
    find "$DERIVED_DATA" -name "*.framework.dSYM" -type d | while read dsym_path; do
        framework_name=$(basename "$dsym_path")
        dest_path="${ARCHIVE_DSYM_FOLDER}/${framework_name}"
        
        if [ ! -d "$dest_path" ]; then
            # Check if this is one of our target frameworks
            for framework in "${FRAMEWORKS[@]}"; do
                if [[ "$framework_name" == *"${framework}"* ]]; then
                    echo "📦 Copying ${framework_name} from DerivedData..."
                    cp -R "$dsym_path" "$dest_path"
                    COPIED=$((COPIED + 1))
                    break
                fi
            done
        fi
    done
fi

if [ $COPIED -eq 0 ]; then
    echo "ℹ️  No additional dSYMs found to copy (this is normal for SPM packages)"
else
    echo "✅ Copied $COPIED dSYM(s)"
fi


