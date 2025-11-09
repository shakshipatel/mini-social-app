#!/bin/bash

################################################################################
# Mini Social App - One-Click Deployment Script
# 
# This script automates the entire deployment process:
# 1. Checks prerequisites
# 2. Sets up environment
# 3. Builds Docker images
# 4. Starts services with docker-compose
# 5. Verifies deployment
#
# Usage: bash deploy.sh [development|production]
#        bash deploy.sh                    # defaults to development
################################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_LOG="${SCRIPT_DIR}/deploy.log"

# Timestamp for logs
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

################################################################################
# Logging Functions
################################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_warn() {
  echo -e "${YELLOW}[⚠]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_section() {
  echo "" | tee -a "$DEPLOY_LOG"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$DEPLOY_LOG"
  echo -e "${BLUE}$1${NC}" | tee -a "$DEPLOY_LOG"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$DEPLOY_LOG"
}

################################################################################
# Check Prerequisites
################################################################################

check_prerequisites() {
  log_section "1️⃣  CHECKING PREREQUISITES"

  # Check Docker
  if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Please install Docker."
    exit 1
  fi
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | cut -d',' -f1)
  log_success "Docker installed: $DOCKER_VERSION"

  # Check Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose not found. Please install Docker Compose."
    exit 1
  fi
  DOCKER_COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | cut -d',' -f1)
  log_success "Docker Compose installed: $DOCKER_COMPOSE_VERSION"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js 18+."
    exit 1
  fi
  NODE_VERSION=$(node -v)
  log_success "Node.js installed: $NODE_VERSION"

  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm not found. Please install npm."
    exit 1
  fi
  NPM_VERSION=$(npm -v)
  log_success "npm installed: $NPM_VERSION"

  # Check MongoDB (will be in Docker, but user should know if it's needed locally for testing)
  if [ "$ENVIRONMENT" == "development" ]; then
    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
      log_warn "MongoDB CLI not found (optional for local development)"
    else
      log_success "MongoDB CLI available"
    fi
  fi

  log_success "All prerequisites met!"
}

################################################################################
# Setup Environment
################################################################################

setup_environment() {
  log_section "2️⃣  SETTING UP ENVIRONMENT"

  cd "$SCRIPT_DIR"

  # Check if .env exists, if not create from example
  if [ "$ENVIRONMENT" == "production" ]; then
    ENV_FILE=".env.production"
    ENV_EXAMPLE=".env.production.example"
  else
    ENV_FILE=".env"
    ENV_EXAMPLE=".env.example"
  fi

  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
      log_info "Creating $ENV_FILE from $ENV_EXAMPLE..."
      cp "$ENV_EXAMPLE" "$ENV_FILE"
      log_warn "⚠ Please edit $ENV_FILE with your production values before launching"
    else
      log_warn "$ENV_EXAMPLE not found, proceeding without it"
    fi
  else
    log_success "$ENV_FILE already exists"
  fi

  # Backend environment
  if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
      log_info "Creating backend/.env..."
      cp "backend/.env.example" "backend/.env"
    fi
  fi

  # Frontend environment
  if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
      log_info "Creating frontend/.env..."
      cp "frontend/.env.example" "frontend/.env"
    fi
  fi

  log_success "Environment setup complete"
}

################################################################################
# Install Dependencies
################################################################################

install_dependencies() {
  log_section "3️⃣  INSTALLING DEPENDENCIES"

  # Backend
  log_info "Installing backend dependencies..."
  cd "$SCRIPT_DIR/backend"
  npm install --quiet
  log_success "Backend dependencies installed"

  # Frontend
  log_info "Installing frontend dependencies..."
  cd "$SCRIPT_DIR/frontend"
  npm install --quiet
  log_success "Frontend dependencies installed"

  cd "$SCRIPT_DIR"
}

################################################################################
# Run Tests
################################################################################

run_tests() {
  log_section "4️⃣  RUNNING TESTS"

  log_info "Running backend tests..."
  cd "$SCRIPT_DIR/backend"
  
  if npm test 2>&1 | tee -a "$DEPLOY_LOG"; then
    log_success "All tests passed!"
  else
    log_error "Tests failed! Check log: $DEPLOY_LOG"
    exit 1
  fi

  cd "$SCRIPT_DIR"
}

################################################################################
# Build Frontend
################################################################################

build_frontend() {
  log_section "5️⃣  BUILDING FRONTEND"

  log_info "Building frontend for production..."
  cd "$SCRIPT_DIR/frontend"
  
  npm run build --quiet
  
  if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | awk '{print $1}')
    log_success "Frontend built successfully (Size: $DIST_SIZE)"
  else
    log_error "Frontend build failed"
    exit 1
  fi

  cd "$SCRIPT_DIR"
}

################################################################################
# Build Docker Images
################################################################################

build_docker_images() {
  log_section "6️⃣  BUILDING DOCKER IMAGES"

  cd "$SCRIPT_DIR"

  # Backend image
  log_info "Building backend Docker image..."
  if docker build -t mini-social-backend:latest ./backend > /dev/null 2>&1; then
    log_success "Backend image built: mini-social-backend:latest"
  else
    log_error "Failed to build backend image"
    exit 1
  fi

  # Frontend image
  log_info "Building frontend Docker image..."
  if docker build -t mini-social-frontend:latest ./frontend > /dev/null 2>&1; then
    log_success "Frontend image built: mini-social-frontend:latest"
  else
    log_error "Failed to build frontend image"
    exit 1
  fi

  # Show images
  log_info "Docker images created:"
  docker images | grep mini-social | tee -a "$DEPLOY_LOG"
}

################################################################################
# Start Services
################################################################################

start_services() {
  log_section "7️⃣  STARTING SERVICES"

  cd "$SCRIPT_DIR"

  if [ "$ENVIRONMENT" == "production" ]; then
    log_info "Starting services in PRODUCTION mode..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  else
    log_info "Starting services in DEVELOPMENT mode..."
    docker-compose up -d
  fi

  # Wait for services to be ready
  log_info "Waiting for services to be ready..."
  sleep 5

  log_success "Services started!"
}

################################################################################
# Verify Deployment
################################################################################

verify_deployment() {
  log_section "8️⃣  VERIFYING DEPLOYMENT"

  cd "$SCRIPT_DIR"

  # Check if containers are running
  log_info "Checking container status..."
  docker-compose ps | tee -a "$DEPLOY_LOG"

  # Check backend health
  log_info "Checking backend health..."
  if curl -s http://localhost:4000/health | grep -q "healthy"; then
    log_success "Backend is healthy ✓"
  else
    log_warn "Backend health check pending (may take a moment)..."
  fi

  # Show service URLs
  log_info "Service URLs:"
  if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}Frontend:${NC} https://your-domain.com" | tee -a "$DEPLOY_LOG"
    echo -e "${YELLOW}Backend:${NC} https://your-domain.com/api" | tee -a "$DEPLOY_LOG"
  else
    echo -e "${YELLOW}Frontend:${NC} http://localhost:3000" | tee -a "$DEPLOY_LOG"
    echo -e "${YELLOW}Backend:${NC} http://localhost:4000" | tee -a "$DEPLOY_LOG"
    echo -e "${YELLOW}MongoDB:${NC} localhost:27017" | tee -a "$DEPLOY_LOG"
  fi

  log_success "Deployment verified!"
}

################################################################################
# Show Logs
################################################################################

show_logs() {
  log_section "📋 DEPLOYMENT LOGS"

  log_info "Recent logs from services:"
  docker-compose logs --tail=20 | tee -a "$DEPLOY_LOG"
}

################################################################################
# Cleanup on Error
################################################################################

cleanup_on_error() {
  log_error "Deployment failed!"
  log_info "Cleaning up..."
  docker-compose down 2>/dev/null || true
  exit 1
}

trap cleanup_on_error ERR

################################################################################
# Main Deployment Flow
################################################################################

main() {
  # Initialize log file
  echo "=== Deployment Log ===" > "$DEPLOY_LOG"
  echo "Timestamp: $TIMESTAMP" >> "$DEPLOY_LOG"
  echo "Environment: $ENVIRONMENT" >> "$DEPLOY_LOG"
  echo "" >> "$DEPLOY_LOG"

  log_info "Starting deployment process..."
  log_info "Environment: $ENVIRONMENT"
  log_info "Logs saved to: $DEPLOY_LOG"

  check_prerequisites
  setup_environment
  install_dependencies
  run_tests
  build_frontend
  build_docker_images
  start_services
  verify_deployment

  log_section "✨ DEPLOYMENT COMPLETE!"

  log_success "Your Mini Social App has been successfully deployed!"
  log_info "Environment: $ENVIRONMENT"

  if [ "$ENVIRONMENT" == "production" ]; then
    log_info "Configure your domain in docker-compose.prod.yml and restart:"
    log_info "docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
  else
    log_info "Access the application:"
    log_info "  Frontend: http://localhost:3000"
    log_info "  Backend:  http://localhost:4000"
  fi

  log_info "View logs with: docker-compose logs -f"
  log_info "Stop services with: docker-compose down"
  log_info "Full deployment log: $DEPLOY_LOG"
}

################################################################################
# Entry Point
################################################################################

# Show usage if --help is passed
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: bash deploy.sh [environment]"
  echo ""
  echo "Arguments:"
  echo "  development  - Deploy in development mode (default)"
  echo "  production   - Deploy in production mode"
  echo "  --help       - Show this help message"
  echo ""
  echo "Examples:"
  echo "  bash deploy.sh                # Deploy to development"
  echo "  bash deploy.sh development    # Deploy to development"
  echo "  bash deploy.sh production     # Deploy to production"
  exit 0
fi

# Validate environment argument
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
  log_error "Invalid environment: $ENVIRONMENT"
  log_error "Valid options: development, production"
  exit 1
fi

# Run main deployment
main

# Show final logs
show_logs

log_success "Deployment process completed successfully! 🚀"
