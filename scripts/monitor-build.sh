#!/bin/bash

# Monitor GitHub Actions Build Status
# Usage: ./scripts/monitor-build.sh

echo "🔍 Monitoring GitHub Actions Build Status..."
echo "=============================================="

# Get the latest run
LATEST_RUN=$(gh run list --limit 1 --json number,status,conclusion,workflowName,headBranch,event,createdAt,updatedAt)

# Check if we got valid data
if [ -z "$LATEST_RUN" ] || [ "$LATEST_RUN" = "[]" ]; then
    echo "❌ No recent builds found. Make sure you have GitHub CLI installed and are authenticated."
    echo "   Run: gh auth login"
    exit 1
fi

# Extract run number
RUN_NUMBER=$(echo "$LATEST_RUN" | jq -r '.[0].number')
STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
WORKFLOW=$(echo "$LATEST_RUN" | jq -r '.[0].workflowName')
BRANCH=$(echo "$LATEST_RUN" | jq -r '.[0].headBranch')
CREATED=$(echo "$LATEST_RUN" | jq -r '.[0].createdAt')

# Validate we got the data
if [ "$RUN_NUMBER" = "null" ] || [ -z "$RUN_NUMBER" ]; then
    echo "❌ Failed to get build information. Check your GitHub CLI setup."
    exit 1
fi

echo "📊 Build Details:"
echo "   Run #: $RUN_NUMBER"
echo "   Workflow: $WORKFLOW"
echo "   Branch: $BRANCH"
echo "   Status: $STATUS"
echo "   Conclusion: $CONCLUSION"
echo "   Created: $CREATED"
echo ""

if [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; then
    echo "🔄 Build is currently running or queued..."
    echo "   View live logs: https://github.com/theChristopher16/pack1703-portal/actions/runs/$RUN_NUMBER"
    echo ""
    echo "⏳ Waiting for completion..."
    
    # Wait and check again
    while [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; do
        sleep 10
        LATEST_RUN=$(gh run list --limit 1 --json number,status,conclusion,workflowName,headBranch,event,createdAt,updatedAt)
        STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
        CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
        
        if [ "$STATUS" = "completed" ]; then
            echo ""
            echo "✅ Build completed!"
            echo "   Conclusion: $CONCLUSION"
            
            if [ "$CONCLUSION" = "success" ]; then
                echo "🎉 Deployment successful!"
                echo "   Your app is live at: https://pack-1703-portal.web.app"
            else
                echo "❌ Deployment failed!"
                echo "   Check logs: https://github.com/theChristopher16/pack1703-portal/actions/runs/$RUN_NUMBER"
            fi
            break
        fi
        
        echo "   Still running... ($(date '+%H:%M:%S'))"
    done
else
    echo "📋 Build Status: $STATUS"
    if [ "$CONCLUSION" = "success" ]; then
        echo "✅ Deployment successful!"
        echo "   Your app is live at: https://pack-1703-portal.web.app"
    elif [ "$CONCLUSION" = "failure" ]; then
        echo "❌ Deployment failed!"
        echo "   Check logs: https://github.com/theChristopher16/pack1703-portal/actions/runs/$RUN_NUMBER"
    fi
fi

echo ""
echo "🔗 Quick Links:"
echo "   GitHub Actions: https://github.com/theChristopher16/pack1703-portal/actions"
echo "   Live App: https://pack-1703-portal.web.app"
echo "   Firebase Console: https://console.firebase.google.com/project/pack-1703-portal"
