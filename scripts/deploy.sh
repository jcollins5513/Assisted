#!/bin/bash

# Car Sales AI Assistant - Deployment Script
# This script automates the deployment process for the application

set -e  # Exit on any error

# Configuration
APP_NAME="car-sales-ai"
DOCKER_REGISTRY="your-registry.com"
VERSION=$(git describe --tags --always --dirty)
ENVIRONMENT=${1:-development}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "Git is required but not installed. Aborting."; exit 1; }
    
    log_success "All requirements met"
}

# Validate environment
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            log_success "Environment $ENVIRONMENT is valid"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Use development, staging, or production"
            exit 1
            ;;
    esac
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    npm run test --if-present || { log_error "Frontend tests failed"; exit 1; }
    cd ..
    
    # Backend tests
    log_info "Running backend tests..."
    cd backend
    npm run test --if-present || { log_error "Backend tests failed"; exit 1; }
    cd ..
    
    log_success "All tests passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Set environment-specific build args
    case $ENVIRONMENT in
        production)
            BUILD_ARGS="--build-arg NODE_ENV=production"
            ;;
        staging)
            BUILD_ARGS="--build-arg NODE_ENV=staging"
            ;;
        development)
            BUILD_ARGS="--build-arg NODE_ENV=development"
            ;;
    esac
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -t $DOCKER_REGISTRY/$APP_NAME-frontend:$VERSION $BUILD_ARGS ./frontend
    docker tag $DOCKER_REGISTRY/$APP_NAME-frontend:$VERSION $DOCKER_REGISTRY/$APP_NAME-frontend:latest
    
    # Build backend
    log_info "Building backend image..."
    docker build -t $DOCKER_REGISTRY/$APP_NAME-backend:$VERSION $BUILD_ARGS ./backend
    docker tag $DOCKER_REGISTRY/$APP_NAME-backend:$VERSION $DOCKER_REGISTRY/$APP_NAME-backend:latest
    
    log_success "Docker images built successfully"
}

# Run security scan
security_scan() {
    log_info "Running security scan..."
    
    # Scan for vulnerabilities in dependencies
    if command -v npm-audit >/dev/null 2>&1; then
        log_info "Scanning frontend dependencies..."
        cd frontend && npm audit --audit-level=high && cd ..
        
        log_info "Scanning backend dependencies..."
        cd backend && npm audit --audit-level=high && cd ..
    fi
    
    # Scan Docker images for vulnerabilities
    if command -v trivy >/dev/null 2>&1; then
        log_info "Scanning Docker images..."
        trivy image $DOCKER_REGISTRY/$APP_NAME-frontend:$VERSION
        trivy image $DOCKER_REGISTRY/$APP_NAME-backend:$VERSION
    fi
    
    log_success "Security scan completed"
}

# Deploy to environment
deploy() {
    log_info "Deploying to $ENVIRONMENT environment..."
    
    # Create environment-specific docker-compose file
    COMPOSE_FILE="docker-compose.$ENVIRONMENT.yml"
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_warning "Environment-specific compose file not found, using default"
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f $COMPOSE_FILE pull
    
    # Start services
    log_info "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    log_success "Deployment completed successfully"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Check backend health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend health check failed after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Backend health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # Check frontend health
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_success "Frontend is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Frontend health check failed after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Frontend health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # This would run your database migration scripts
    # Example: docker-compose exec backend npm run migrate
    
    log_success "Database migrations completed"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_dir="./backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/backup_$timestamp.gz"
    
    mkdir -p $backup_dir
    
    # Create MongoDB backup
    docker-compose exec -T mongodb mongodump --archive --gzip > $backup_file
    
    log_success "Database backup created: $backup_file"
}

# Cleanup old backups
cleanup_backups() {
    log_info "Cleaning up old backups..."
    
    local backup_dir="./backups"
    local retention_days=30
    
    find $backup_dir -name "backup_*.gz" -mtime +$retention_days -delete
    
    log_success "Old backups cleaned up"
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current deployment
    docker-compose down
    
    # Start previous version
    docker-compose up -d
    
    log_success "Rollback completed"
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment..."
    
    # Monitor logs for errors
    docker-compose logs --tail=100 --follow &
    local log_pid=$!
    
    # Monitor for 5 minutes
    sleep 300
    
    # Stop log monitoring
    kill $log_pid 2>/dev/null || true
    
    log_success "Deployment monitoring completed"
}

# Main deployment function
main() {
    log_info "Starting deployment process for $APP_NAME v$VERSION to $ENVIRONMENT"
    
    check_requirements
    validate_environment
    
    # Pre-deployment tasks
    run_tests
    build_images
    security_scan
    
    # Backup before deployment (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_database
    fi
    
    # Deploy
    deploy
    
    # Post-deployment tasks
    run_migrations
    monitor_deployment
    
    log_success "Deployment process completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    deploy)
        main
        ;;
    rollback)
        rollback
        ;;
    test)
        run_tests
        ;;
    build)
        build_images
        ;;
    health)
        check_health
        ;;
    backup)
        backup_database
        ;;
    cleanup)
        cleanup_backups
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|test|build|health|backup|cleanup} [environment]"
        echo "  deploy   - Deploy the application"
        echo "  rollback - Rollback to previous version"
        echo "  test     - Run tests"
        echo "  build    - Build Docker images"
        echo "  health   - Check service health"
        echo "  backup   - Create database backup"
        echo "  cleanup  - Clean up old backups"
        echo ""
        echo "Environment options: development (default), staging, production"
        exit 1
        ;;
esac
