#!/bin/bash
# Firebase Integration Verification Script
# Checks that all files are in place and properly configured

echo "🔥 Firebase Integration Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $1 missing"
        ((CHECKS_FAILED++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/ exists"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $1/ missing"
        ((CHECKS_FAILED++))
    fi
}

# Function to check environment variable
check_env() {
    if grep -q "$1" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 configured in .env"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} $1 not in .env (may be optional)"
    fi
}

# Check directory
cd backend 2>/dev/null || { echo -e "${RED}Error: Run from project root${NC}"; exit 1; }

echo "📁 Files Check"
echo "==============  "
check_file "firebaseAdmin.js"
check_file "firebaseStore.js"
check_file "server.js"
check_file "simulator.js"
check_file "package.json"
check_file ".env"
check_file ".gitignore"
check_file "test-firebase-setup.js"

echo ""
echo "📦 Dependencies Check"
echo "===================="
if grep -q "firebase-admin" package.json; then
    echo -e "${GREEN}✓${NC} firebase-admin in package.json"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} firebase-admin not in package.json"
    ((CHECKS_FAILED++))
fi

echo ""
echo "🔑 Environment Check"
echo "==================="
check_env "GOOGLE_APPLICATION_CREDENTIALS"
check_env "NODE_ENV"
check_env "PORT"

echo ""
echo "🔐 Security Check"
echo "================="
if grep -q "serviceAccountKey.json" .gitignore; then
    echo -e "${GREEN}✓${NC} serviceAccountKey.json in .gitignore"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} serviceAccountKey.json not in .gitignore"
fi

if [ -f "serviceAccountKey.json" ]; then
    echo -e "${YELLOW}⚠${NC} serviceAccountKey.json exists (keep secure!)"
else
    echo -e "${GREEN}✓${NC} serviceAccountKey.json not present (download when ready)"
fi

echo ""
echo "===================================="
echo "✅ Checks Passed: $CHECKS_PASSED"
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Checks Failed: $CHECKS_FAILED${NC}"
else
    echo "❌ Checks Failed: 0"
fi
echo "===================================="

echo ""
echo "📝 Next Steps:"
echo "============="
echo "1. Create Firebase project: https://console.firebase.google.com/"
echo "2. Enable Firestore Database"
echo "3. Generate service account key"
echo "4. Download serviceAccountKey.json"
echo "5. Place in backend/serviceAccountKey.json"
echo "6. Run: npm install firebase-admin"
echo "7. Run: npm start"
echo ""
echo "📚 Documentation:"
echo "================"
echo "- FIREBASE_QUICK_START.md"
echo "- FIREBASE_SETUP.md"
echo "- README_FIREBASE.md"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
else
    echo -e "${RED}❌ Some checks failed. Please review above.${NC}"
fi
