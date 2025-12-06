#!/bin/bash

# IronPath Ship Script
# Usage: npm run ship "your commit message"

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚢 SHIPPING IRONPATH...${NC}\n"

# Check if commit message provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Commit message required${NC}"
  echo "Usage: npm run ship \"your commit message\""
  exit 1
fi

COMMIT_MSG="$1"

# Step 1: Git status
echo -e "${YELLOW}📊 Checking git status...${NC}"
git status --short

# Step 2: Add all changes
echo -e "\n${YELLOW}➕ Adding all changes...${NC}"
git add .

# Step 3: Commit
echo -e "\n${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Step 4: Push to remote
echo -e "\n${YELLOW}⬆️  Pushing to remote...${NC}"
BRANCH=$(git branch --show-current)
git push origin "$BRANCH"

# Step 5: Build check (optional)
if [ -f "package.json" ]; then
  echo -e "\n${YELLOW}🔨 Running build check...${NC}"
  npm run build
fi

# Success!
echo -e "\n${GREEN}✅ SHIPPED! 🚀${NC}"
echo -e "${GREEN}Branch: $BRANCH${NC}"
echo -e "${GREEN}Commit: $(git rev-parse --short HEAD)${NC}"
