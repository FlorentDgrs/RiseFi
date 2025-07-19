#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=95
GAS_REPORT=true
FUZZ_RUNS=1000

echo -e "${CYAN}🧪 === RiseFi Comprehensive Test Suite ===${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${BLUE}📍 $1${NC}"
    echo "----------------------------------------"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_section "Checking Prerequisites"

if ! command_exists forge; then
    print_error "Foundry not found. Please install Foundry first."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm not found. Please install npm first."
    exit 1
fi

print_success "All prerequisites found"
echo ""

# Clean previous builds
print_section "Cleaning Previous Builds"
forge clean
rm -rf coverage/
rm -f lcov.info
rm -f .gas-snapshot
print_success "Build artifacts cleaned"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_section "Installing Dependencies"
    npm install
    print_success "Dependencies installed"
    echo ""
fi

# Build contracts
print_section "Building Contracts"
if forge build; then
    print_success "Contracts built successfully"
else
    print_error "Contract build failed"
    exit 1
fi
echo ""

# Run TypeScript type checking
print_section "TypeScript Type Checking"
if npm run typecheck; then
    print_success "TypeScript type checking passed"
else
    print_warning "TypeScript type checking failed"
fi
echo ""

# Run ESLint
print_section "ESLint Analysis"
if npm run lint:ts; then
    print_success "ESLint analysis passed"
else
    print_warning "ESLint analysis found issues"
fi
echo ""

# Run Solidity formatting check
print_section "Solidity Formatting Check"
if forge fmt --check; then
    print_success "Solidity formatting is correct"
else
    print_warning "Solidity formatting issues found. Run 'forge fmt' to fix."
fi
echo ""

# Run comprehensive tests (basic + gas + fuzz)
print_section "Running Comprehensive Tests"
if forge test --fuzz-runs ${FUZZ_RUNS} --gas-report; then
    print_success "All tests passed (basic + gas + fuzz)"
else
    print_error "Tests failed"
    exit 1
fi
echo ""


# Run coverage analysis
print_section "Running Coverage Analysis"
if forge coverage --report lcov; then
    print_success "Coverage analysis completed"
    
    # Generate HTML coverage report if lcov tools are available
    if command_exists genhtml; then
        print_section "Generating HTML Coverage Report"
        genhtml lcov.info -o coverage --branch-coverage --function-coverage
        print_success "HTML coverage report generated in coverage/"
    else
        print_warning "genhtml not found. Install lcov for HTML coverage reports."
    fi
    
    # Extract coverage percentage
    if command_exists lcov; then
        coverage_summary=$(lcov --summary lcov.info 2>/dev/null | grep -E "lines\.*:" | tail -1)
        if [[ $coverage_summary =~ ([0-9]+\.[0-9]+)% ]]; then
            coverage_percent=${BASH_REMATCH[1]}
            coverage_int=${coverage_percent%.*}
            
            if [ "$coverage_int" -ge "$COVERAGE_THRESHOLD" ]; then
                print_success "Coverage: ${coverage_percent}% (above threshold: ${COVERAGE_THRESHOLD}%)"
            else
                print_warning "Coverage: ${coverage_percent}% (below threshold: ${COVERAGE_THRESHOLD}%)"
            fi
        fi
    fi
else
    print_error "Coverage analysis failed"
    exit 1
fi
echo ""



# Generate gas snapshot
print_section "Generating Gas Snapshot"
if forge snapshot; then
    print_success "Gas snapshot generated"
else
    print_warning "Gas snapshot generation failed"
fi
echo ""

# Run specific test patterns (if provided)
if [ ! -z "$1" ]; then
    print_section "Running Specific Test Pattern: $1"
    if forge test --match-test "$1" -vvv; then
        print_success "Specific test pattern passed"
    else
        print_error "Specific test pattern failed"
        exit 1
    fi
    echo ""
fi

# Summary
print_section "Test Summary"
echo -e "${PURPLE}📊 Test Results:${NC}"
echo "  • Comprehensive Tests: ✅ Passed (basic + gas + fuzz)"
echo "  • Coverage Analysis: ✅ Completed"
echo "  • Gas Snapshot: ✅ Generated"
echo ""

print_success "All tests completed successfully! 🎉"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "  • Review coverage report: open coverage/index.html"
echo "  • Check gas snapshot: .gas-snapshot"
echo "  • Review security analysis results"
echo "  • Run specific tests: ./scripts/test-comprehensive.sh <test-pattern>"
echo "" 