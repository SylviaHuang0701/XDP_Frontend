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
import { API_BASE_URL } from '../config.js'

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
    const trafficData = ref([])
    
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
        const response = await axios.get(`${API_BASE_URL}/status/`)
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
        const response = await axios.get(`${API_BASE_URL}/status/top_ip?col=bytes`)
        topIpList.value = response.data.top || []
      } catch (error) {
        console.error('获取Top IP失败:', error)
      }
    }
    
    const fetchTrafficTrend = async () => {
      try {
        // 根据时间范围设置间隔
        let interval = '5m'
        let limit = 100
        
        switch (timeRange.value) {
          case '1h':
            interval = '1m'
            limit = 60
            break
          case '6h':
            interval = '5m'
            limit = 72
            break
          case '24h':
            interval = '1h'
            limit = 24
            break
        }
        
        const response = await axios.get(`${API_BASE_URL}/status/traffic_trend?interval=${interval}&limit=${limit}`)
        trafficData.value = response.data.points || []
        renderTrafficChart()
      } catch (error) {
        console.error('获取流量趋势失败:', error)
      }
    }
    
    const renderTrafficChart = () => {
      if (!trafficChart.value || trafficData.value.length === 0) return
      
      // 计算统计数据
      const totalInBytes = trafficData.value.reduce((sum, point) => sum + point.bytes, 0)
      const totalOutBytes = trafficData.value.reduce((sum, point) => sum + (point.bytes * 0.8), 0) // 模拟出站流量
      const totalInPackets = trafficData.value.reduce((sum, point) => sum + point.in_packets, 0)
      const totalOutPackets = trafficData.value.reduce((sum, point) => sum + (point.in_packets * 0.8), 0) // 模拟出站包数
      
      const avgInBytes = totalInBytes / trafficData.value.length
      const avgOutBytes = totalOutBytes / trafficData.value.length
      
      // 创建Canvas折线图
      const chartElement = trafficChart.value
      chartElement.innerHTML = `
        <div style="height: 100%; padding: 20px; color: #303133;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">实时流量趋势</div>
            <div style="font-size: 12px; color: #909399;">
              时间范围: ${timeRange.value} | 数据点: ${trafficData.value.length}
            </div>
          </div>
          
          <canvas id="trafficCanvas" width="600" height="300" style="width: 100%; height: 200px; border: 1px solid #e4e7ed; border-radius: 6px; margin-bottom: 15px;"></canvas>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; border-left: 4px solid #409eff;">
              <div style="font-size: 12px; color: #409eff; margin-bottom: 5px;">入站流量</div>
              <div style="font-size: 16px; font-weight: bold;">${formatBytes(avgInBytes)}/s</div>
              <div style="font-size: 11px; color: #909399;">总计: ${formatBytes(totalInBytes)}</div>
            </div>
            <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; border-left: 4px solid #67c23a;">
              <div style="font-size: 12px; color: #67c23a; margin-bottom: 5px;">出站流量</div>
              <div style="font-size: 16px; font-weight: bold;">${formatBytes(avgOutBytes)}/s</div>
              <div style="font-size: 11px; color: #909399;">总计: ${formatBytes(totalOutBytes)}</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #fef7e0; padding: 10px; border-radius: 6px; border-left: 4px solid #e6a23c;">
              <div style="font-size: 12px; color: #e6a23c; margin-bottom: 5px;">入站包数</div>
              <div style="font-size: 16px; font-weight: bold;">${totalInPackets.toLocaleString()}</div>
              <div style="font-size: 11px; color: #909399;">平均: ${Math.round(totalInPackets / trafficData.value.length)}/s</div>
            </div>
            <div style="background: #fef7e0; padding: 10px; border-radius: 6px; border-left: 4px solid #f56c6c;">
              <div style="font-size: 12px; color: #f56c6c; margin-bottom: 5px;">出站包数</div>
              <div style="font-size: 16px; font-weight: bold;">${totalOutPackets.toLocaleString()}</div>
              <div style="font-size: 11px; color: #909399;">平均: ${Math.round(totalOutPackets / trafficData.value.length)}/s</div>
            </div>
          </div>
          
          <div style="margin-top: 15px; padding: 10px; background: #f5f7fa; border-radius: 6px; font-size: 11px; color: #606266;">
            <div style="margin-bottom: 5px;"><strong>时间范围:</strong> ${trafficData.value.length > 0 ? new Date(trafficData.value[0].timestamp).toLocaleString() : 'N/A'} 至 ${trafficData.value.length > 0 ? new Date(trafficData.value[trafficData.value.length - 1].timestamp).toLocaleString() : 'N/A'}</div>
            <div><strong>数据间隔:</strong> ${trafficData.value.length > 1 ? Math.round((new Date(trafficData.value[1].timestamp) - new Date(trafficData.value[0].timestamp)) / 1000 / 60) : 'N/A'} 分钟</div>
          </div>
        </div>
      `
      
      // 绘制折线图
      setTimeout(() => {
        drawTrafficChart()
      }, 100)
    }
    
    const drawTrafficChart = () => {
      const canvas = document.getElementById('trafficCanvas')
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height
      
      // 清空画布
      ctx.clearRect(0, 0, width, height)
      
      if (trafficData.value.length === 0) return
      
      // 设置图表边距
      const margin = { top: 20, right: 30, bottom: 40, left: 60 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom
      
      // 计算数据范围
      const inBytesData = trafficData.value.map(point => point.bytes)
      const outBytesData = trafficData.value.map(point => point.bytes * 0.8) // 模拟出站流量
      const maxInBytes = Math.max(...inBytesData)
      const maxOutBytes = Math.max(...outBytesData)
      const maxValue = Math.max(maxInBytes, maxOutBytes)
      
      // 计算缩放比例
      const xScale = chartWidth / (trafficData.value.length - 1)
      const yScale = chartHeight / maxValue
      
      // 绘制网格
      ctx.strokeStyle = '#f0f0f0'
      ctx.lineWidth = 1
      
      // 水平网格线
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(margin.left, y)
        ctx.lineTo(width - margin.right, y)
        ctx.stroke()
      }
      
      // 垂直网格线
      for (let i = 0; i <= 10; i++) {
        const x = margin.left + (chartWidth / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, margin.top)
        ctx.lineTo(x, height - margin.bottom)
        ctx.stroke()
      }
      
      // 绘制入站流量线
      ctx.strokeStyle = '#409eff'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      trafficData.value.forEach((point, index) => {
        const x = margin.left + index * xScale
        const y = height - margin.bottom - (point.bytes * yScale)
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
      
      // 绘制出站流量线
      ctx.strokeStyle = '#67c23a'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      trafficData.value.forEach((point, index) => {
        const x = margin.left + index * xScale
        const y = height - margin.bottom - (point.bytes * 0.8 * yScale) // 模拟出站流量
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
      
      // 绘制图例
      ctx.fillStyle = '#409eff'
      ctx.fillRect(width - margin.right - 80, margin.top - 15, 15, 10)
      ctx.fillStyle = '#303133'
      ctx.font = '12px Arial'
      ctx.fillText('入站', width - margin.right - 60, margin.top - 5)
      
      ctx.fillStyle = '#67c23a'
      ctx.fillRect(width - margin.right - 80, margin.top, 15, 10)
      ctx.fillStyle = '#303133'
      ctx.fillText('出站', width - margin.right - 60, margin.top + 10)
      
      // 绘制Y轴标签
      ctx.fillStyle = '#909399'
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i
        const value = maxValue - (maxValue / 5) * i
        ctx.fillText(formatBytes(value), margin.left - 10, y + 3)
      }
      
      // 绘制X轴标签（时间）
      ctx.textAlign = 'center'
      const timeLabels = []
      const step = Math.max(1, Math.floor(trafficData.value.length / 6))
      
      for (let i = 0; i < trafficData.value.length; i += step) {
        if (i < trafficData.value.length) {
          const x = margin.left + i * xScale
          const time = new Date(trafficData.value[i].timestamp)
          const label = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          ctx.fillText(label, x, height - margin.bottom + 20)
        }
      }
    }
    
    const fetchConnections = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/tcp_connections`)
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
      fetchTrafficTrend()
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
      fetchTrafficTrend()
      
      // 启动定时更新
      updateTimer = setInterval(() => {
        fetchStats()
        fetchTopIp()
        fetchConnections()
      }, 5000) // 每5秒更新一次基础数据
      
      // 流量趋势数据更新更频繁
      const trafficTimer = setInterval(() => {
        fetchTrafficTrend()
      }, 2000) // 每2秒更新一次流量趋势
      
      // 启动告警检查
      alertCheckTimer = setInterval(() => {
        generateRandomAlert()
      }, 10000) // 每10秒检查一次
      
      // 清理定时器
      onUnmounted(() => {
        if (updateTimer) clearInterval(updateTimer)
        if (trafficTimer) clearInterval(trafficTimer)
        if (alertCheckTimer) clearInterval(alertCheckTimer)
      })
    }
    
    // 生命周期
    onMounted(() => {
      init()
    })
    
    return {
      stats,
      topIpList,
      connectionStats,
      connectionStatus,
      alerts,
      timeRange,
      trafficChart,
      trafficData,
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