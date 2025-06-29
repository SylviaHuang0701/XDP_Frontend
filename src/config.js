// 后端API配置
export const API_BASE_URL = '/api'; // 使用本地代理

// API端点
export const API_ENDPOINTS = {
  // 状态相关
  STATUS: '/status',
  STATUS_RULE_MATCH: '/status/rule_match',
  STATUS_TOP_IP: '/status/top_ip',
  STATUS_TCP_CONNECTIONS: '/status/tcp_connections',
  STATUS_LOGS: '/status/logs',
  
  // 规则相关
  RULES: '/rules',
  RULES_DEFAULT: '/rules/default',
  
  // 健康检查
  HEALTH: '/health'
}; 