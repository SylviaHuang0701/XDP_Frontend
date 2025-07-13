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
                <el-button size="small" :type="timeRange === '5min' ? 'primary' : ''" @click="setTimeRange('5min')">5分钟</el-button>
                <el-button size="small" :type="timeRange === '1h' ? 'primary' : ''" @click="setTimeRange('1h')">1小时</el-button>
                <el-button size="small" :type="timeRange === '24h' ? 'primary' : ''" @click="setTimeRange('24h')">24小时</el-button>
              </el-button-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="trafficChart" style="width: 100%; height: 400px;"></div>
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
                    <span class="connections">{{ scope.row.connections }} 连接</span>
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
                <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine, Connection, Warning, Monitor, InfoFilled, CircleClose } from '@element-plus/icons-vue'
import axios from 'axios'
import { API_BASE_URL } from '../config.js'
import * as echarts from 'echarts'

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
      closeWait: 0,
      others: 0
    })
    
    const alerts = ref([])
    const timeRange = ref('5min')
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
    
    const timeRangeOptions = {
      '5min': { interval: '5s', limit: 60 },  // 5分钟(60个5秒间隔)
      '1h': { interval: '1m', limit: 72 },    // 60分钟
      '24h': { interval: '1h', limit: 24 }    // 24小时
    }
    
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
        const globalStatus = response.data
        
        // 获取活跃规则数量
        const rulesResponse = await axios.get(`${API_BASE_URL}/rules/`)
        const activeRules = rulesResponse.data.rules ? rulesResponse.data.rules.length : 0
        
        stats.value = {
          bandwidth: globalStatus.bandwidth || 0,
          connections: globalStatus.connections || 0,
          alerts: alerts.value.length,
          activeRules: activeRules
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }
    
    const fetchTopIp = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/top_ip?col=bytes&limit=3`)
        topIpList.value = response.data.top || []
      } catch (error) {
        console.error('获取Top IP失败:', error)
      }
    }
    
    // 解析 interval 字符串为毫秒
    function parseInterval(interval) {
      if (interval.endsWith('s')) return parseInt(interval) * 1000
      if (interval.endsWith('m')) return parseInt(interval) * 60 * 1000
      if (interval.endsWith('h')) return parseInt(interval) * 60 * 60 * 1000
      if (interval.endsWith('d')) return parseInt(interval) * 24 * 60 * 60 * 1000
      return 0
    }
    
    async function fetchTrafficTrend() {
      try {
        const { interval, limit } = timeRangeOptions[timeRange.value]
        const res = await axios.get(`${API_BASE_URL}/status/traffic_trend`, {
          params: { interval, limit }
        })
        const trend = res.data
        const intervalMs = parseInterval(trend.interval)
        const lastTime = new Date(trend.timestamp).getTime()
        const n = trend.bytes.length
        const arr = []
        for (let i = 0; i < n; i++) {
          const t = lastTime - (n - 1 - i) * intervalMs
          const dateObj = new Date(t)
          let timeLabel = ''
          if (timeRange.value === '5min') {
            // 5分钟模式下显示秒数
            timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
          } else if (intervalMs < 60 * 60 * 1000) {
            timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          } else {
            timeLabel = dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit', hour12: false }) + ' ' + 
                      dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          }
          arr.push({
            timestamp: t,
            bytes: trend.bytes[i],
            packets: trend.packets[i],
            timeLabel
          })
        }
        trafficData.value = arr
        drawTrafficChart()
      } catch (error) {
        console.error('获取流量趋势失败:', error)
      }
    }


    // const drawTrafficChart = () => {
    //   nextTick(() => {
    //     if (!trafficChart.value) return
        
    //     const chart = echarts.init(trafficChart.value)
    //     chart.setOption({
    //       tooltip: {
    //         trigger: 'axis',
    //         formatter: params => {
    //           let str = `<div>时间: ${params[0].axisValue}</div>`
    //           params.forEach(item => {
    //             if (item.seriesName === '字节数') {
    //               str += `<div>${item.marker}${item.seriesName}: ${formatBytes(item.data[1])}</div>`
    //             } else {
    //               str += `<div>${item.marker}${item.seriesName}: ${item.data[1]}</div>`
    //             }
    //           })
    //           return str
    //         }
    //       },
    //       xAxis: {
    //         type: 'category',
    //         data: trafficData.value.map(d => d.timeLabel),
    //         axisLabel: { 
    //           rotate: 45,
    //           // 只在5分钟模式下显示更密集的标签
    //           interval: timeRange.value === '5min' ? 5 : 0
    //         }
    //       },
    //       yAxis: [
    //         { type: 'value', name: '字节数' },
    //         { type: 'value', name: '包数' }
    //       ],
    //       series: [
    //         {
    //           name: '字节数',
    //           type: 'line',
    //           data: trafficData.value.map(d => [d.timeLabel, d.bytes]),
    //           // 添加标记点配置
    //           markPoint: timeRange.value === '5min' ? {
    //             data: [
    //               { type: 'max', name: '最大值' },
    //               { type: 'min', name: '最小值' }
    //             ],
    //             symbolSize: 40,
    //             label: {
    //               formatter: '{b}'
    //             }
    //           } : null,
    //           // 添加标记线配置
    //           markLine: timeRange.value === '5min' ? {
    //             data: [
    //               { type: 'average', name: '平均值' }
    //             ]
    //           } : null,
    //           // 显示数据点
    //           showSymbol: timeRange.value === '5min',
    //           symbol: 'circle',
    //           symbolSize: 6
    //         },
    //         {
    //           name: '包数',
    //           type: 'line',
    //           yAxisIndex: 1,
    //           data: trafficData.value.map(d => [d.timeLabel, d.packets]),
    //           // 同上配置
    //           markPoint: timeRange.value === '5min' ? {
    //             data: [
    //               { type: 'max', name: '最大值' },
    //               { type: 'min', name: '最小值' }
    //             ],
    //             symbolSize: 40,
    //             label: {
    //               formatter: '{b}'
    //             }
    //           } : null,
    //           markLine: timeRange.value === '5min' ? {
    //             data: [
    //               { type: 'average', name: '平均值' }
    //             ]
    //           } : null,
    //           showSymbol: timeRange.value === '5min',
    //           symbol: 'circle',
    //           symbolSize: 6
    //         }
    //       ]
    //     })
    //   })
    // }
    const drawTrafficChart = () => {
      nextTick(() => {
        if (!trafficChart.value) return
        
        let chart = echarts.getInstanceByDom(trafficChart.value)
        if (!chart) {
          chart = echarts.init(trafficChart.value)
        }
        
        // Calculate interval to show approximately 5 labels
        const dataLength = trafficData.value.length
        const labelInterval = Math.max(1, Math.floor(dataLength / 5))
        
        const markConfig = {
          '5min': {
            showMarkPoint: false, // Disabled mark points
            showMarkLine: true,
            showSymbol: true,
          },
          '1h': {
            showMarkPoint: false,
            showMarkLine: true,
            showSymbol: false,
          },
          '24h': {
            showMarkPoint: false,
            showMarkLine: false,
            showSymbol: false,
          }
        }
        
        const config = markConfig[timeRange.value] || markConfig['5min']
        
        // Calculate average speed (bytes per second)
        const totalBytes = trafficData.value.reduce((sum, d) => sum + d.bytes, 0)
        const avgBytesPerSecond = totalBytes / trafficData.value.length
        
        chart.setOption({
          grid: {
            top: '15%',
            bottom: '25%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: params => {
              let str = `<div>时间: ${params[0].axisValue}</div>`
              params.forEach(item => {
                let value = Array.isArray(item.data) ? item.data[1] : item.data
                if (item.seriesName === '字节数') {
                  str += `<div>${item.marker}${item.seriesName}: ${formatBytes(value)}/s</div>`
                } else {
                  str += `<div>${item.marker}${item.seriesName}: ${value}</div>`
                }
              })
              return str
            }
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              start: 0,
              end: 100
            }
          ],
          xAxis: {
            type: 'category',
            data: trafficData.value.map(d => d.timeLabel),
            axisLabel: { 
              interval: labelInterval, // Show approximately 5 labels
              margin: 15
            },
            axisTick: {
              alignWithLabel: true
            }
          },
          yAxis: [
            { 
              type: 'value', 
              name: '字节数/s',
              axisLabel: {
                margin: 15,
                formatter: function(value) {
                  return formatBytes(value, true) + '/s';
                }
              },
              splitLine: {
                show: true
              }
            },
            { 
              type: 'value', 
              name: '包数',
              axisLabel: {
                margin: 15
              },
              splitLine: {
                show: false
              }
            }
          ],
          series: [
            {
              name: '字节数',
              type: 'line',
              data: trafficData.value.map(d => [d.timeLabel, d.bytes]),
              markPoint: {
                // Show average speed with bubble background at 10% position
                data: config.showMarkLine ? [
                  {
                    name: '平均速度',
                    coord: [Math.floor(trafficData.value.length * 0.1), avgBytesPerSecond],
                    symbol: 'roundRect',
                    symbolSize: [80, 30],
                    itemStyle: {
                      color: 'rgba(64, 158, 255, 0.3)',
                      borderColor: '#409EFF',
                      borderWidth: 2,
                      shadowBlur: 10,
                      shadowColor: 'rgba(0, 0, 0, 0.3)'
                    },
                    label: {
                      show: true,
                      formatter: function(params) {
                        return formatBytes(avgBytesPerSecond) + '/s';
                      },
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 'bold',
                      position: 'inside'
                    }
                  }
                ] : [],
              },
              markLine: config.showMarkLine ? {
                data: [
                  {
                    yAxis: avgBytesPerSecond,
                    name: '平均速度',
                    lineStyle: {
                      type: 'dashed',
                      color: '#409EFF',
                      width: 2
                    },
                    label: {
                      show: false // Hide line label since we show it in markPoint
                    }
                  }
                ],
                silent: true
              } : null,
              showSymbol: config.showSymbol,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2
              },
              areaStyle: timeRange.value === '24h' ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ])
              } : null
            },
            {
              name: '包数',
              type: 'line',
              yAxisIndex: 1,
              data: trafficData.value.map(d => [d.timeLabel, d.packets]),
              markPoint: null, // Disabled for packets series
              markLine: null, // Disabled for packets series
              showSymbol: config.showSymbol,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2
              },
              areaStyle: timeRange.value === '24h' ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
                  { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
                ])
              } : null
            }
          ]
        })
        
        window.addEventListener('resize', function() {
          chart.resize()
        })
      })
    }
    
    const fetchConnections = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/tcp_connections`)
        const connections = response.data.connections || []
        
        // 统计连接状态
        const stateCounts = {}
        connections.forEach(conn => {
          const state = conn.state || 'UNKNOWN'
          stateCounts[state] = (stateCounts[state] || 0) + 1
        })
        
        connectionStats.value = {
          established: stateCounts['ESTABLISHED'] || 0,
          synSent: stateCounts['SYN_SENT'] || 0,
          timeWait: stateCounts['TIME_WAIT'] || 0,
          closeWait: stateCounts['CLOSE_WAIT'] || 0,
          others: connections.length - (stateCounts['ESTABLISHED'] || 0) - (stateCounts['SYN_SENT'] || 0) - (stateCounts['TIME_WAIT'] || 0) - (stateCounts['CLOSE_WAIT'] || 0)
        }
        
        // 更新连接状态
        const total = connections.length
        if (total > 1000) {
          connectionStatus.value = { type: 'warning', text: '繁忙' }
        } else if (total > 500) {
          connectionStatus.value = { type: 'info', text: '正常' }
        } else {
          connectionStatus.value = { type: 'success', text: '空闲' }
        }
        
        // 更新全局统计中的连接数
        stats.value.connections = total
      } catch (error) {
        console.error('获取连接状态失败:', error)
      }
    }
    
    // 获取日志作为告警
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/logs?page=1&page_size=20`)
        const logs = response.data.logs || []
        
        // 将日志转换为告警
        alerts.value = logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level || 'info',
          message: log.message
        }))
        
        // 更新告警数量
        stats.value.alerts = alerts.value.length
      } catch (error) {
        console.error('获取日志失败:', error)
      }
    }
    
    // 告警相关函数
    const addAlert = (level, message) => {
      const alert = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level,
        message
      }
      alerts.value.unshift(alert)
      
      // 限制告警数量
      if (alerts.value.length > 50) {
        alerts.value = alerts.value.slice(0, 50)
      }
      
      // 显示弹窗
      if (level === 'warning') {
        currentAlert.value = alert
        showAlertDialog.value = true
      }
    }
    
    const clearAlerts = () => {
      alerts.value = []
      stats.value.alerts = 0
    }
    
    const acknowledgeAlert = () => {
      showAlertDialog.value = false
    }
    
    const viewDetails = () => {
      showAlertDialog.value = false
      // 这里可以跳转到详细页面
      ElMessage.info('跳转到告警详情页面')
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
      fetchLogs()
      
      // 启动定时更新
      updateTimer = setInterval(() => {
        fetchStats()
        fetchTopIp()
        fetchConnections()
        fetchLogs()
      }, 5000) // 每5秒更新一次基础数据
      
      // 流量趋势数据更新更频繁
      let trafficTimer = null
      trafficTimer = setInterval(() => {
        fetchTrafficTrend()
      }, 2000) // 每2s刷新一次
      
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

      nextTick(() => {
        if (trafficChart.value) {
          drawTrafficChart()
        }
      })
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
      viewDetails,
      fetchTrafficTrend
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px; /* Set your desired fixed width */
  margin: 0 auto; /* Center the dashboard */
}

.stats-row {
  margin-bottom: 20px;
  width: 960px;
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