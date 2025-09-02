#!/bin/bash

# Monitor GitHub Actions deployment
# Usage: ./scripts/monitor-deployment.sh [workflow_name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default workflow name
WORKFLOW_NAME=${1:-"Production Pipeline"}

echo -e "${BLUE}🔍 Monitoring GitHub Actions deployment for: ${WORKFLOW_NAME}${NC}"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to get the latest run
get_latest_run() {
    gh run list --workflow="$WORKFLOW_NAME" --limit 1 --json databaseId,status,conclusion,createdAt,headBranch,headSha,url
}

# Function to get run status
get_run_status() {
    local run_id=$1
    gh run view "$run_id" --json status,conclusion,url
}

# Function to format timestamp
format_timestamp() {
    local timestamp=$1
    if command -v jq >/dev/null 2>&1; then
        echo "$timestamp" | jq -r 'fromdateiso8601 | strftime("%Y-%m-%d %H:%M:%S")'
    else
        echo "$timestamp"
    fi
}

# Main monitoring loop
while true; do
    # Get latest run
    latest_run=$(get_latest_run)
    
    if [ -z "$latest_run" ]; then
        echo -e "${YELLOW}⚠️  No runs found for workflow: $WORKFLOW_NAME${NC}"
        sleep 10
        continue
    fi
    
    # Extract run ID and status
    run_id=$(echo "$latest_run" | jq -r '.[0].databaseId')
    status=$(echo "$latest_run" | jq -r '.[0].status')
    conclusion=$(echo "$latest_run" | jq -r '.[0].conclusion')
    created_at=$(echo "$latest_run" | jq -r '.[0].createdAt')
    branch=$(echo "$latest_run" | jq -r '.[0].headBranch')
    sha=$(echo "$latest_run" | jq -r '.[0].headSha')
    url=$(echo "$latest_run" | jq -r '.[0].url')
    
    # Format timestamp
    formatted_time=$(format_timestamp "$created_at")
    
    # Display status
    echo -e "${BLUE}📋 Run ID: ${run_id}${NC}"
    echo -e "${BLUE}📅 Created: ${formatted_time}${NC}"
    echo -e "${BLUE}🌿 Branch: ${branch}${NC}"
    echo -e "${BLUE}🔗 URL: ${url}${NC}"
    
    case $status in
        "completed")
            case $conclusion in
                "success")
                    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
                    echo -e "${GREEN}🎉 Your changes are now live in production!${NC}"
                    exit 0
                    ;;
                "failure"|"cancelled"|"timed_out")
                    echo -e "${RED}❌ Deployment failed with conclusion: ${conclusion}${NC}"
                    echo -e "${YELLOW}🔍 Check the logs at: ${url}${NC}"
                    echo -e "${YELLOW}📋 Run 'gh run view ${run_id} --log-failed' for detailed error logs${NC}"
                    exit 1
                    ;;
                *)
                    echo -e "${YELLOW}⚠️  Deployment completed with unknown conclusion: ${conclusion}${NC}"
                    exit 1
                    ;;
            esac
            ;;
        "in_progress"|"queued"|"waiting")
            echo -e "${YELLOW}⏳ Deployment is ${status}...${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Unknown status: ${status}${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}🔄 Checking again in 30 seconds...${NC}"
    echo "----------------------------------------"
    sleep 30
done
