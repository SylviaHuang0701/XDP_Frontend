<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
            <el-card class="stat-card">
                <div class="stat-content">
                    <div class="stat-icon">
                        <el-icon><DataLine /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ formatBytes(stats.bandwidth) }}/s</div>
                        <div class="stat-label">实时带宽</div>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card class="stat-card">
                <div class="stat-content">
                    <div class="stat-icon">
                        <el-icon><Connection /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.connections }}</div>
                        <div class="stat-label">活跃连接</div>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card class="stat-card">
                <div class="stat-content">
                    <div class="stat-icon">
                        <el-icon><Warning /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.alerts }}</div>
                        <div class="stat-label">告警数量</div>
                    </div>
                </div>
            </el-card>
        </el-col>
        <el-col :span="6">
            <el-card class="stat-card">
                <div class="stat-content">
                    <div class="stat-icon">
                        <el-icon><Monitor /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.activeRules }}</div>
                        <div class="stat-label">活跃规则</div>
                    </div>
                </div>
        </el-card>
        </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：流量图表和Top IP -->
      <el-col :span="16">
        <!-- 流量趋势图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>流量趋势</span>
              <el-button-group>
                <el-button size="small" :type="timeRange === '1h' ? 'primary' : ''" @click="setTimeRange('1h')">1小时</el-button>
                <el-button size="small" :type="timeRange === '6h' ? 'primary' : ''" @click="setTimeRange('6h')">6小时</el-button>
                <el-button size="small" :type="timeRange === '24h' ? 'primary' : ''" @click="setTimeRange('24h')">24小时</el-button>
              </el-button-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="trafficChart" class="chart"></div>
          </div>
        </el-card>

        <!-- Top IP 列表 -->
        <el-card class="top-ip-card">
          <template #header>
            <div class="card-header">
              <span>Top IP 流量排行</span>
              <el-button size="small" @click="refreshTopIp">刷新</el-button>
            </div>
          </template>
          <el-table :data="topIpList" style="width: 100%" :show-header="false">
            <el-table-column width="50">
              <template #default="scope">
                <div class="rank-badge" :class="`rank-${scope.$index + 1}`">{{ scope.$index + 1 }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP地址">
              <template #default="scope">
                <div class="ip-info">
                  <div class="ip-address">{{ scope.row.ip }}</div>
                  <div class="ip-stats">
                    <span class="bytes">{{ formatBytes(scope.row.bytes) }}</span>
                    <span class="packets">{{ scope.row.packets }} 包</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="100">
              <template #default="scope">
                <el-progress 
                  :percentage="getPercentage(scope.row.bytes)" 
                  :color="getProgressColor(scope.$index)"
                  :show-text="false"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：连接状态和告警 -->
      <el-col :span="8">
        <!-- 连接状态 -->
        <el-card class="connections-card">
          <template #header>
            <div class="card-header">
              <span>连接状态</span>
              <el-tag :type="connectionStatus.type">{{ connectionStatus.text }}</el-tag>
            </div>
          </template>
          <div class="connection-stats">
            <div class="connection-item">
              <span class="label">ESTABLISHED:</span>
              <span class="value">{{ connectionStats.established }}</span>
            </div>
            <div class="connection-item">
              <span class="label">SYN_SENT:</span>
              <span class="value">{{ connectionStats.synSent }}</span>
            </div>
            <div class="connection-item">
              <span class="label">TIME_WAIT:</span>
              <span class="value">{{ connectionStats.timeWait }}</span>
            </div>
            <div class="connection-item">
              <span class="label">CLOSE_WAIT:</span>
              <span class="value">{{ connectionStats.closeWait }}</span>
            </div>
          </div>
        </el-card>

        <!-- 实时告警 -->
        <el-card class="alerts-card">
          <template #header>
            <div class="card-header">
              <span>实时告警</span>
              <el-button size="small" @click="clearAlerts">清空</el-button>
            </div>
          </template>
          <div class="alerts-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="`alert-${alert.level}`">
              <div class="alert-header">
                <span class="alert-time">{{ formatTime(alert.time) }}</span>
                <el-tag :type="getAlertType(alert.level)" size="small">{{ alert.level.toUpperCase() }}</el-tag>
              </div>
              <div class="alert-content">{{ alert.message }}</div>
            </div>
            <div v-if="alerts.length === 0" class="no-alerts">
              暂无告警
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警弹窗 -->
    <el-dialog
      v-model="showAlertDialog"
      title="安全告警"
      width="500px"
      :show-close="false"
      :close-on-click-modal="false"
    >
      <div class="alert-dialog-content">
        <el-icon class="alert-icon" :class="`alert-${currentAlert.level}`">
          <Warning v-if="currentAlert.level === 'warning'" />
          <CircleClose v-else-if="currentAlert.level === 'error'" />
          <InfoFilled v-else />
        </el-icon>
        <div class="alert-message">{{ currentAlert.message }}</div>
      </div>
      <template #footer>
        <el-button @click="acknowledgeAlert">确认</el-button>
        <el-button type="primary" @click="viewDetails">查看详情</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine, Connection, Warning, Monitor, InfoFilled, CircleClose } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'Dashboard',
  components: {
    DataLine,
    Connection,
    Warning,
    Monitor,
    InfoFilled,
    CircleClose
  },
  setup() {
    // 响应式数据
    const stats = ref({
      bandwidth: 0,
      connections: 0,
      alerts: 0,
      activeRules: 0
    })
    
    const topIpList = ref([])
    const connectionStats = ref({
      established: 0,
      synSent: 0,
      timeWait: 0,
      closeWait: 0
    })
    
    const alerts = ref([])
    const timeRange = ref('1h')
    const trafficChart = ref(null)
    
    // 弹窗相关
    const showAlertDialog = ref(false)
    const currentAlert = ref({})
    
    // 定时器
    let updateTimer = null
    let alertCheckTimer = null
    
    // 计算属性
    const connectionStatus = ref({
      type: 'success',
      text: '正常'
    })
    
    // 格式化函数
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString()
    }
    
    const getPercentage = (bytes) => {
      if (topIpList.value.length === 0) return 0
      const maxBytes = Math.max(...topIpList.value.map(ip => ip.bytes))
      return (bytes / maxBytes) * 100
    }
    
    const getProgressColor = (index) => {
      const colors = ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399']
      return colors[index] || '#909399'
    }
    
    const getAlertType = (level) => {
      const types = {
        info: 'info',
        warning: 'warning',
        error: 'danger'
      }
      return types[level] || 'info'
    }
    
    // API 请求函数
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/status/')
        stats.value = {
          ...response.data,
          connections: Math.floor(Math.random() * 1000) + 100, // 模拟数据
          alerts: alerts.value.length,
          activeRules: Math.floor(Math.random() * 50) + 10 // 模拟数据
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }
    
    const fetchTopIp = async () => {
      try {
        const response = await axios.get('http://localhost:3000/status/top_ip?col=bytes')
        topIpList.value = response.data.top || []
      } catch (error) {
        console.error('获取Top IP失败:', error)
      }
    }
    
    const fetchConnections = async () => {
      try {
        const response = await axios.get('http://localhost:3000/status/tcp_connections')
        const connections = response.data.connections || []
        
        // 统计连接状态
        connectionStats.value = {
          established: connections.filter(c => c.state === 'ESTABLISHED').length,
          synSent: connections.filter(c => c.state === 'SYN_SENT').length,
          timeWait: connections.filter(c => c.state === 'TIME_WAIT').length,
          closeWait: connections.filter(c => c.state === 'CLOSE_WAIT').length
        }
        
        // 更新连接状态
        const total = Object.values(connectionStats.value).reduce((a, b) => a + b, 0)
        if (total > 1000) {
          connectionStatus.value = { type: 'warning', text: '繁忙' }
        } else if (total > 500) {
          connectionStatus.value = { type: 'info', text: '正常' }
        } else {
          connectionStatus.value = { type: 'success', text: '空闲' }
        }
      } catch (error) {
        console.error('获取连接状态失败:', error)
      }
    }
    
    // 告警相关函数
    const addAlert = (level, message) => {
      const alert = {
        id: Date.now(),
        time: new Date().toISOString(),
        level,
        message
      }
      alerts.value.unshift(alert)
      
      // 限制告警数量
      if (alerts.value.length > 50) {
        alerts.value = alerts.value.slice(0, 50)
      }
      
      // 显示弹窗
      if (level === 'error' || level === 'warning') {
        currentAlert.value = alert
        showAlertDialog.value = true
      }
    }
    
    const clearAlerts = () => {
      alerts.value = []
    }
    
    const acknowledgeAlert = () => {
      showAlertDialog.value = false
    }
    
    const viewDetails = () => {
      showAlertDialog.value = false
      // 这里可以跳转到详细页面
      ElMessage.info('跳转到告警详情页面')
    }
    
    // 模拟告警生成
    const generateRandomAlert = () => {
      const alertTypes = [
        { level: 'info', message: '系统运行正常' },
        { level: 'warning', message: '检测到异常流量模式' },
        { level: 'error', message: '发现恶意IP访问' },
        { level: 'warning', message: '连接数接近上限' }
      ]
      
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      if (Math.random() < 0.1) {
        addAlert(randomType.level, randomType.message)
      }
    }
    
    // 时间范围设置
    const setTimeRange = (range) => {
      timeRange.value = range
      // 这里可以重新获取对应时间范围的数据
    }
    
    const refreshTopIp = () => {
      fetchTopIp()
      ElMessage.success('Top IP 数据已刷新')
    }
    
    // 初始化
    const init = () => {
      fetchStats()
      fetchTopIp()
      fetchConnections()
      
      // 启动定时更新
      updateTimer = setInterval(() => {
        fetchStats()
        fetchTopIp()
        fetchConnections()
      }, 5000) // 每5秒更新一次
      
      // 启动告警检查
      alertCheckTimer = setInterval(() => {
        generateRandomAlert()
      }, 10000) // 每10秒检查一次
    }
    
    // 生命周期
    onMounted(() => {
      init()
    })
    
    onUnmounted(() => {
      if (updateTimer) clearInterval(updateTimer)
      if (alertCheckTimer) clearInterval(alertCheckTimer)
    })
    
    return {
      stats,
      topIpList,
      connectionStats,
      connectionStatus,
      alerts,
      timeRange,
      trafficChart,
      showAlertDialog,
      currentAlert,
      formatBytes,
      formatTime,
      getPercentage,
      getProgressColor,
      getAlertType,
      setTimeRange,
      refreshTopIp,
      clearAlerts,
      acknowledgeAlert,
      viewDetails
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 2.5em;
  color: #409eff;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  margin-top: 5px;
}

.main-content {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.top-ip-card {
  margin-bottom: 20px;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.rank-1 { background: #f56c6c; }
.rank-2 { background: #e6a23c; }
.rank-3 { background: #409eff; }
.rank-4, .rank-5 { background: #67c23a; }

.ip-info {
  display: flex;
  flex-direction: column;
}

.ip-address {
  font-weight: bold;
  color: #303133;
}

.ip-stats {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.bytes {
  margin-right: 10px;
}

.connections-card {
  margin-bottom: 20px;
}

.connection-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.connection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.connection-item:last-child {
  border-bottom: none;
}

.connection-item .label {
  color: #606266;
}

.connection-item .value {
  font-weight: bold;
  color: #303133;
}

.alerts-card {
  margin-bottom: 20px;
}

.alerts-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  border-left: 4px solid;
}

.alert-info {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.alert-warning {
  background: #fef7e0;
  border-left-color: #e6a23c;
}

.alert-error {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

.alert-content {
  color: #303133;
  font-size: 14px;
}

.no-alerts {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.alert-dialog-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.alert-icon {
  font-size: 2em;
}

.alert-icon.alert-info {
  color: #409eff;
}

.alert-icon.alert-warning {
  color: #e6a23c;
}

.alert-icon.alert-error {
  color: #f56c6c;
}

.alert-message {
  flex: 1;
  font-size: 16px;
  color: #303133;
}
</style>