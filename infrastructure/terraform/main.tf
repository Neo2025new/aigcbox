terraform {
  required_version = ">= 1.0"
  
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.16"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Terraform Cloud 后端存储
  backend "remote" {
    organization = "your-org"
    workspaces {
      name = "gemini-image-toolbox"
    }
  }
}

# 变量定义
variable "environment" {
  description = "部署环境"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "主域名"
  type        = string
  default     = "yourdomain.com"
}

variable "regions" {
  description = "部署区域"
  type        = list(string)
  default     = ["hnd1", "sin1", "sfo1", "iad1", "fra1"]
}

# Vercel 项目配置
resource "vercel_project" "gemini_app" {
  name      = "gemini-image-toolbox-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "your-username/gemini-image-toolbox"
  }

  build_command    = "npm run build"
  output_directory = ".next"
  root_directory   = "/"

  environment = [
    {
      key    = "GEMINI_API_KEY"
      value  = var.gemini_api_key
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_CLOUDFLARE_R2_URL"
      value  = cloudflare_r2_bucket.images.bucket_url
      target = ["production"]
    },
    {
      key    = "REDIS_URL"
      value  = aws_elasticache_cluster.redis.cache_nodes[0].address
      target = ["production"]
    }
  ]

  # 函数配置
  functions = {
    "api/generate/route.ts" = {
      memory       = 1024
      maxDuration  = 60
      regions      = var.regions
    }
    "api/generate-image/route.ts" = {
      memory       = 2048
      maxDuration  = 60
      regions      = var.regions
    }
  }
}

# Vercel 域名配置
resource "vercel_project_domain" "main" {
  project_id = vercel_project.gemini_app.id
  domain     = var.domain_name
}

resource "vercel_project_domain" "www" {
  project_id = vercel_project.gemini_app.id
  domain     = "www.${var.domain_name}"
  redirect   = var.domain_name
}

# Cloudflare Zone
resource "cloudflare_zone" "main" {
  account_id = var.cloudflare_account_id
  zone       = var.domain_name
  plan       = "enterprise"
  type       = "full"
}

# Cloudflare DNS 记录
resource "cloudflare_record" "vercel_cname" {
  zone_id = cloudflare_zone.main.id
  name    = "@"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "www" {
  zone_id = cloudflare_zone.main.id
  name    = "www"
  value   = var.domain_name
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

# Cloudflare R2 存储桶
resource "cloudflare_r2_bucket" "images" {
  account_id = var.cloudflare_account_id
  name       = "gemini-images-${var.environment}"
  location   = "APAC"
}

# Cloudflare Workers KV
resource "cloudflare_workers_kv_namespace" "image_cache" {
  account_id = var.cloudflare_account_id
  title      = "gemini-image-cache-${var.environment}"
}

resource "cloudflare_workers_kv_namespace" "rate_limits" {
  account_id = var.cloudflare_account_id
  title      = "gemini-rate-limits-${var.environment}"
}

# Cloudflare Worker
resource "cloudflare_worker_script" "image_optimizer" {
  account_id = var.cloudflare_account_id
  name       = "gemini-image-optimizer-${var.environment}"
  content    = file("../edge-functions/image-optimizer.js")

  kv_namespace_binding {
    name         = "IMAGE_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.image_cache.id
  }

  r2_bucket_binding {
    name        = "R2_BUCKET"
    bucket_name = cloudflare_r2_bucket.images.name
  }

  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
}

# Cloudflare Worker 路由
resource "cloudflare_worker_route" "image_optimizer" {
  zone_id     = cloudflare_zone.main.id
  pattern     = "${var.domain_name}/images/*"
  script_name = cloudflare_worker_script.image_optimizer.name
}

# Cloudflare 页面规则
resource "cloudflare_page_rule" "static_cache" {
  zone_id  = cloudflare_zone.main.id
  target   = "${var.domain_name}/_next/static/*"
  priority = 1

  actions {
    cache_level       = "cache_everything"
    edge_cache_ttl    = 2592000  # 30天
    browser_cache_ttl = 31536000 # 1年
  }
}

resource "cloudflare_page_rule" "api_bypass" {
  zone_id  = cloudflare_zone.main.id
  target   = "${var.domain_name}/api/*"
  priority = 2

  actions {
    cache_level = "bypass"
    disable_performance = true
  }
}

# Cloudflare 负载均衡器
resource "cloudflare_load_balancer" "main" {
  zone_id     = cloudflare_zone.main.id
  name        = "gemini-lb-${var.environment}"
  default_pool_ids = [cloudflare_load_balancer_pool.vercel.id]
  fallback_pool_id = cloudflare_load_balancer_pool.vercel.id
  proxied     = true
  
  region_pools {
    region   = "APAC"
    pool_ids = [cloudflare_load_balancer_pool.vercel_apac.id]
  }
  
  region_pools {
    region   = "ENAM"
    pool_ids = [cloudflare_load_balancer_pool.vercel_us.id]
  }

  pop_pools {
    pop      = "HKG"
    pool_ids = [cloudflare_load_balancer_pool.vercel_apac.id]
  }

  session_affinity = "cookie"
  session_affinity_ttl = 1800
}

# Cloudflare 负载均衡池
resource "cloudflare_load_balancer_pool" "vercel" {
  account_id = var.cloudflare_account_id
  name       = "vercel-pool-global"
  
  origins {
    name    = "vercel-primary"
    address = "${vercel_project.gemini_app.id}.vercel.app"
    weight  = 1
    enabled = true
  }

  check_regions = ["WNAM", "ENAM", "WEU", "SEAS"]
  minimum_origins = 1
}

resource "cloudflare_load_balancer_pool" "vercel_apac" {
  account_id = var.cloudflare_account_id
  name       = "vercel-pool-apac"
  
  origins {
    name    = "vercel-tokyo"
    address = "${vercel_project.gemini_app.id}-hnd1.vercel.app"
    weight  = 1
    enabled = true
  }
  
  origins {
    name    = "vercel-singapore"
    address = "${vercel_project.gemini_app.id}-sin1.vercel.app"
    weight  = 1
    enabled = true
  }

  check_regions = ["SEAS", "NEAS"]
  minimum_origins = 1
}

resource "cloudflare_load_balancer_pool" "vercel_us" {
  account_id = var.cloudflare_account_id
  name       = "vercel-pool-us"
  
  origins {
    name    = "vercel-us-west"
    address = "${vercel_project.gemini_app.id}-sfo1.vercel.app"
    weight  = 1
    enabled = true
  }
  
  origins {
    name    = "vercel-us-east"
    address = "${vercel_project.gemini_app.id}-iad1.vercel.app"
    weight  = 1
    enabled = true
  }

  check_regions = ["WNAM", "ENAM"]
  minimum_origins = 1
}

# Cloudflare WAF 规则
resource "cloudflare_ruleset" "waf_custom" {
  zone_id = cloudflare_zone.main.id
  name    = "Custom WAF Rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action = "block"
    expression = "(http.request.uri.path contains \"/api/generate\" and http.request.body.size > 10485760)"
    description = "Block large uploads"
  }

  rules {
    action = "challenge"
    expression = "(http.request.uri.path contains \"/api/\" and rate.limit < 100)"
    description = "Rate limit API"
    ratelimit {
      threshold = 100
      period    = 60
    }
  }
}

# AWS ElastiCache Redis (用于会话和缓存)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "gemini-cache-${var.environment}"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = {
    Name        = "gemini-image-toolbox-cache"
    Environment = var.environment
  }
}

# AWS S3 备份桶
resource "aws_s3_bucket" "backup" {
  bucket = "gemini-backup-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "gemini-image-toolbox-backup"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "archive-old-backups"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# CloudWatch 监控
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "gemini-image-toolbox-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["Vercel", "FunctionInvocations", { stat = "Sum" }],
            ["Vercel", "FunctionErrors", { stat = "Sum" }],
            ["Vercel", "FunctionDuration", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Vercel Function Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Cloudflare", "Requests", { stat = "Sum" }],
            ["Cloudflare", "Bandwidth", { stat = "Sum" }],
            ["Cloudflare", "CacheHitRate", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Cloudflare CDN Metrics"
        }
      }
    ]
  })
}

# 输出
output "vercel_url" {
  value = "https://${vercel_project.gemini_app.id}.vercel.app"
}

output "cloudflare_domain" {
  value = "https://${var.domain_name}"
}

output "r2_bucket_url" {
  value = cloudflare_r2_bucket.images.bucket_url
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.image_cache.id
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}