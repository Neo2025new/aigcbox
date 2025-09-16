# 自动扩展配置 - Vercel Functions 和 AWS 资源

# Vercel 函数自动扩展配置
locals {
  function_scaling = {
    "api/generate" = {
      min_instances     = 1
      max_instances     = 100
      target_cpu        = 70
      scale_in_cooldown = 60
      scale_out_cooldown = 30
    }
    "api/generate-image" = {
      min_instances     = 2
      max_instances     = 200
      target_cpu        = 60
      scale_in_cooldown = 120
      scale_out_cooldown = 15
    }
  }
}

# AWS Auto Scaling for ElastiCache
resource "aws_application_autoscaling_target" "redis_replica" {
  count              = var.environment == "production" ? 1 : 0
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "replication-group/${aws_elasticache_replication_group.redis[0].id}"
  scalable_dimension = "elasticache:replication-group:NodeGroups"
  service_namespace  = "elasticache"
}

resource "aws_application_autoscaling_policy" "redis_cpu" {
  count              = var.environment == "production" ? 1 : 0
  name               = "redis-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_application_autoscaling_target.redis_replica[0].resource_id
  scalable_dimension = aws_application_autoscaling_target.redis_replica[0].scalable_dimension
  service_namespace  = aws_application_autoscaling_target.redis_replica[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ElastiCacheDatabaseMemoryUsageCountedForEvictPercentage"
    }
    target_value = 75.0
  }
}

# ElastiCache Replication Group for Production
resource "aws_elasticache_replication_group" "redis" {
  count                      = var.environment == "production" ? 1 : 0
  replication_group_id       = "gemini-redis-cluster"
  description               = "Redis cluster for Gemini Image Toolbox"
  engine                    = "redis"
  node_type                 = "cache.r6g.large"
  port                      = 6379
  parameter_group_name      = aws_elasticache_parameter_group.redis.name
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  # 自动扩展的副本数量
  num_cache_clusters = 2
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # 自动备份
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"

  # 日志
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "slow-log"
  }

  tags = {
    Name        = "gemini-redis-production"
    Environment = var.environment
  }
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "gemini-high-cpu-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = "75"
  alarm_description  = "This metric monitors Redis CPU utilization"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.cluster_id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "gemini-high-memory-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "DatabaseMemoryUsagePercentage"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors Redis memory utilization"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.cluster_id
  }
}

# Cloudflare Load Balancer 健康检查和自动故障转移
resource "cloudflare_load_balancer_monitor" "health_check" {
  account_id     = var.cloudflare_account_id
  type          = "https"
  port          = 443
  method        = "GET"
  path          = "/api/health"
  interval      = 60
  timeout       = 5
  retries       = 2
  expected_codes = "200"
  
  header {
    header = "X-Health-Check"
    values = ["cloudflare"]
  }

  allow_insecure = false
  follow_redirects = false
}

# Cloudflare Rate Limiting with Auto Scaling
resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id = cloudflare_zone.main.id
  
  threshold = 100
  period    = 60
  
  match {
    request {
      url_pattern = "${var.domain_name}/api/*"
    }
  }
  
  action {
    mode    = "challenge"
    timeout = 3600
  }

  # 自动扩展阈值
  correlate {
    by = "nat"
  }

  disabled = false
  description = "API rate limiting with auto-scaling"
}

# Vercel 环境变量 - 用于动态扩展配置
resource "vercel_env_variable" "scaling_config" {
  for_each = local.function_scaling

  project_id = vercel_project.gemini_app.id
  key        = "SCALING_${upper(replace(each.key, "/", "_"))}"
  value      = jsonencode(each.value)
  target     = ["production"]
}

# AWS Lambda for Custom Scaling Logic
resource "aws_lambda_function" "auto_scaler" {
  filename         = "lambda/auto_scaler.zip"
  function_name    = "gemini-auto-scaler-${var.environment}"
  role            = aws_iam_role.lambda_scaler.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda/auto_scaler.zip")
  runtime         = "nodejs18.x"
  timeout         = 60

  environment {
    variables = {
      VERCEL_TOKEN        = var.vercel_api_token
      CLOUDFLARE_TOKEN    = var.cloudflare_api_token
      SCALING_METRICS_TABLE = aws_dynamodb_table.scaling_metrics.name
    }
  }
}

# CloudWatch Event Rule for Auto Scaling
resource "aws_cloudwatch_event_rule" "scaling_schedule" {
  name                = "gemini-scaling-schedule"
  description         = "Trigger auto scaling checks"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.scaling_schedule.name
  target_id = "AutoScalerLambda"
  arn       = aws_lambda_function.auto_scaler.arn
}

# DynamoDB for Scaling Metrics
resource "aws_dynamodb_table" "scaling_metrics" {
  name           = "gemini-scaling-metrics-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "metric_id"
  range_key      = "timestamp"

  attribute {
    name = "metric_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name        = "gemini-scaling-metrics"
    Environment = var.environment
  }
}

# SNS Topic for Scaling Alerts
resource "aws_sns_topic" "alerts" {
  name = "gemini-scaling-alerts-${var.environment}"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# 输出扩展配置
output "autoscaling_config" {
  value = {
    redis_min_capacity = var.environment == "production" ? aws_application_autoscaling_target.redis_replica[0].min_capacity : "N/A"
    redis_max_capacity = var.environment == "production" ? aws_application_autoscaling_target.redis_replica[0].max_capacity : "N/A"
    function_scaling   = local.function_scaling
    health_check_url   = "https://${var.domain_name}/api/health"
  }
  sensitive = false
}