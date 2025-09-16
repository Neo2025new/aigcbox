#!/bin/bash

# Gemini Image Toolbox 部署脚本
# 用途：本地部署辅助脚本

set -e  # 遇到错误时立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 显示帮助信息
show_help() {
    cat << EOF
Gemini Image Toolbox 部署脚本

用法: $0 [OPTIONS] ENVIRONMENT

环境:
    staging     部署到 staging 环境
    production  部署到 production 环境

选项:
    -h, --help              显示帮助信息
    -c, --check-only        仅执行检查，不进行部署
    -f, --force             强制部署，跳过确认
    -v, --verbose           详细输出
    --skip-tests           跳过测试（不推荐）
    --skip-build           跳过构建（不推荐）

示例:
    $0 staging                    # 部署到 staging
    $0 production --check-only    # 检查 production 部署条件
    $0 staging --force            # 强制部署到 staging

EOF
}

# 检查必要的工具
check_dependencies() {
    log "检查依赖工具..."
    
    local missing_tools=()
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v vercel &> /dev/null; then
        missing_tools+=("vercel")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "缺少必要工具: ${missing_tools[*]}"
        echo "请安装缺少的工具后重试"
        exit 1
    fi
    
    success "所有依赖工具检查通过"
}

# 检查 Git 状态
check_git_status() {
    log "检查 Git 状态..."
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        warning "检测到未提交的更改"
        if [ "$FORCE" != "true" ]; then
            read -p "是否继续? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    # 检查当前分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log "当前分支: $current_branch"
    
    if [ "$ENVIRONMENT" = "production" ] && [ "$current_branch" != "main" ]; then
        error "生产环境部署必须在 main 分支"
        exit 1
    fi
    
    success "Git 状态检查通过"
}

# 检查环境变量
check_environment_variables() {
    log "检查环境变量..."
    
    local env_file=".env.$ENVIRONMENT"
    
    if [ ! -f "$env_file" ]; then
        warning "环境配置文件 $env_file 不存在"
    fi
    
    # 检查必要的环境变量
    if [ -z "$VERCEL_TOKEN" ]; then
        error "VERCEL_TOKEN 环境变量未设置"
        exit 1
    fi
    
    success "环境变量检查通过"
}

# 运行测试
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warning "跳过测试（不推荐）"
        return
    fi
    
    log "运行测试..."
    
    # 单元测试
    npm test -- --coverage --watchAll=false
    
    # 类型检查
    npm run type-check
    
    # 代码质量检查
    npm run lint
    
    success "所有测试通过"
}

# 构建应用
build_application() {
    if [ "$SKIP_BUILD" = "true" ]; then
        warning "跳过构建（不推荐）"
        return
    fi
    
    log "构建应用..."
    
    # 清理之前的构建
    npm run clean
    
    # 安装依赖
    npm ci
    
    # 构建
    npm run build
    
    success "应用构建完成"
}

# 执行部署
deploy_to_vercel() {
    log "部署到 Vercel ($ENVIRONMENT)..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # 生产环境部署
        vercel --prod
    else
        # Staging 环境部署
        vercel
    fi
    
    success "部署完成"
}

# 部署后验证
verify_deployment() {
    log "验证部署..."
    
    local base_url
    if [ "$ENVIRONMENT" = "production" ]; then
        base_url="https://your-production-domain.com"
    else
        base_url="https://your-staging-domain.vercel.app"
    fi
    
    # 等待部署生效
    sleep 30
    
    # 健康检查
    if curl -f "$base_url/api/health" > /dev/null 2>&1; then
        success "健康检查通过"
    else
        error "健康检查失败"
        exit 1
    fi
    
    # 基本功能检查
    if curl -f "$base_url/" > /dev/null 2>&1; then
        success "主页访问正常"
    else
        error "主页访问失败"
        exit 1
    fi
    
    success "部署验证完成"
}

# 主部署流程
deploy() {
    log "开始部署到 $ENVIRONMENT 环境"
    
    # 预部署检查
    check_dependencies
    check_git_status
    check_environment_variables
    
    if [ "$CHECK_ONLY" = "true" ]; then
        success "预部署检查完成，无问题"
        exit 0
    fi
    
    # 确认部署
    if [ "$FORCE" != "true" ]; then
        echo
        warning "即将部署到 $ENVIRONMENT 环境"
        read -p "确认继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "部署取消"
            exit 0
        fi
    fi
    
    # 执行部署流程
    run_tests
    build_application
    deploy_to_vercel
    verify_deployment
    
    success "🚀 部署完成！"
    
    # 显示部署信息
    echo
    log "部署信息:"
    echo "  环境: $ENVIRONMENT"
    echo "  时间: $(date)"
    echo "  分支: $(git rev-parse --abbrev-ref HEAD)"
    echo "  提交: $(git rev-parse --short HEAD)"
}

# 解析命令行参数
ENVIRONMENT=""
CHECK_ONLY="false"
FORCE="false"
VERBOSE="false"
SKIP_TESTS="false"
SKIP_BUILD="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--check-only)
            CHECK_ONLY="true"
            shift
            ;;
        -f|--force)
            FORCE="true"
            shift
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查必要参数
if [ -z "$ENVIRONMENT" ]; then
    error "请指定部署环境 (staging 或 production)"
    show_help
    exit 1
fi

# 启用详细输出
if [ "$VERBOSE" = "true" ]; then
    set -x
fi

# 开始部署
deploy