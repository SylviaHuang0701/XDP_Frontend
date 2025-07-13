<template>
  <el-card style="width: 960px;">
    <h2>状态监控</h2>
    <el-row :gutter="20" style="margin-bottom: 1em;">
      <el-col :span="8">
        <el-statistic title="Pass" :value="status.pass" />
      </el-col>
      <!-- <el-col :span="6">
        <el-statistic title="Abort" :value="status.abort" />
      </el-col> -->
      <el-col :span="8">
        <el-statistic title="Drop" :value="status.drop" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="Bandwidth" :value="formatBytes(status.bandwidth)+'/s'" />
      </el-col>
    </el-row>
    <el-divider />
    
    <!-- 加载状态 -->
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="text" style="width: 30%" />
        <el-skeleton-item variant="text" />
        <el-skeleton-item variant="text" style="width: 60%" />
      </template>
      
      <template #default>
        <!-- 表一：规则匹配表 --> 
        <el-card shadow="never" style="margin-bottom: 1em;">
          <template #header>
            <div class="card-header">
              <span>规则匹配</span>
              <el-button size="small" @click="refreshRuleMatches" :loading="ruleMatchLoading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table 
            :data="ruleMatches" 
            style="width: 100%" 
            v-loading="ruleMatchLoading"
          >
            <el-table-column prop="time" label="时间">
              <template #default="{ row }">
                {{ new Date(row.time).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="rule_desc" label="规则" />
            <el-table-column prop="src_ip" label="源IP" />
            <el-table-column prop="dst_ip" label="目的IP" />
            <el-table-column prop="action" label="动作" >
              <template #default="{ row }">
                <el-tag
                  :type="row.action === 'pass' ? 'success' : 'danger'"
                  disable-transitions
                >
                  {{ row.action }} <!-- 直接显示原始数据（pass/drop） -->
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 规则匹配分页 -->
          <el-pagination
            style="margin-top: 1em;"
            layout="total, prev, pager, next"
            :total="ruleMatchTotal"
            :page-size="ruleMatchPageSize"
            :current-page="ruleMatchPage"
            @current-change="handleRuleMatchPageChange"
          />
        </el-card>

        <!-- 表二：流量最高 IP --> 
        <el-card shadow="never" style="margin-bottom: 1em;">
          <template #header>
            <div class="card-header">
              <span>Top IP Source</span>
              <el-button size="small" @click="refreshTopIp" :loading="topIpLoading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table 
            :data="topIp" 
            style="width: 100%" 
            v-loading="topIpLoading"
          >
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="bytes" label="流量">
              <template #default="{ row }">
                {{ formatBytes(row.bytes) }}
              </template>
            </el-table-column>
            <el-table-column prop="packets" label="包数" />
            <el-table-column prop="connections" label="连接数" width="100" />
          </el-table>
        </el-card>

        <!-- 表三：TCP 连接状态 --> 
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>TCP Connections</span>
              <div class="header-actions">
                <el-switch
                  v-model="autoRefresh"
                  active-text="自动刷新"
                  inactive-text="手动刷新"
                  size="small"
                  style="margin-right: 10px;"
                />
                <el-button size="small" @click="refreshTcpConnections" :loading="tcpLoading">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-table 
            :data="tcpConnections" 
            style="width: 100%" 
            v-loading="tcpLoading"
          >
            <el-table-column prop="src_ip" label="源地址" />
            <el-table-column prop="src_port" label="源端口" />
            <el-table-column prop="dst_ip" label="目的地址" />
            <el-table-column prop="dst_port" label="目的端口" />
            <el-table-column prop="state" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStateType(row.state)">
                  {{ row.state }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="bytes" label="流量" width="100">
              <template #default="{ row }">
                {{ formatBytes(row.bytes) }}
              </template>
            </el-table-column>
            <el-table-column prop="packets" label="包数" width="80" />
          </el-table>
          
          <!-- 显示连接总数 -->
          <div style="margin-top: 1em; text-align: right; color: #909399;">
            共 {{ tcpConnections.length }} 个连接
          </div>
        </el-card>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { API_BASE_URL } from '../config.js'

export default {
  name: 'Status',
  setup() {
    const loading = ref(true)
    const tcpLoading = ref(false)
    const topIpLoading = ref(false)
    const ruleMatchLoading = ref(false)
    const autoRefresh = ref(false)
    let autoRefreshTimer = null
    const status = ref({ pass: 0, abort: 0, drop: 0, bandwidth: 0 })
    const ruleMatches = ref([])
    const topIp = ref([])
    const tcpConnections = ref([])
    
    // 规则匹配分页
    const ruleMatchPage = ref(1)
    const ruleMatchPageSize = ref(10)
    const ruleMatchTotal = ref(0)

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/`)
        status.value = response.data
      } catch (error) {
        console.error('获取状态失败:', error)
      }
    }

    const fetchRuleMatches = async (resetPage = false) => {
      ruleMatchLoading.value = true
      try {
        // 如果是刷新操作，重置到第一页
        if (resetPage) {
          ruleMatchPage.value = 1
        }
        
        const response = await axios.get(`${API_BASE_URL}/status/rule_match`, {
          params: {
            page: ruleMatchPage.value,
            page_size: ruleMatchPageSize.value
          }
        })
        ruleMatches.value = response.data.matches || []
        ruleMatchTotal.value = response.data.total || 0
        
        // 检查当前页是否超出范围
        const maxPage = Math.ceil(ruleMatchTotal.value / ruleMatchPageSize.value)
        if (ruleMatchPage.value > maxPage && maxPage > 0) {
          ruleMatchPage.value = maxPage
          // 重新获取数据
          await fetchRuleMatches(false)
        }
      } catch (error) {
        console.error('获取规则匹配失败:', error)
        ElMessage.error('获取规则匹配失败')
      } finally {
        ruleMatchLoading.value = false
      }
    }

    const refreshRuleMatches = async () => {
      await fetchRuleMatches(true) 
    }

    const fetchTopIp = async () => {
      topIpLoading.value = true
      try {
        const response = await axios.get(`${API_BASE_URL}/status/top_ip?col=bytes`)
        topIp.value = response.data.top || []
      } catch (error) {
        console.error('获取Top IP失败:', error)
        ElMessage.error('获取Top IP失败')
      } finally {
        topIpLoading.value = false
      }
    }

    const refreshTopIp = async () => {
      await fetchTopIp()
      ElMessage.success('Top IP数据已刷新')
    }

    const fetchTcpConnections = async () => {
      tcpLoading.value = true
      try {
        const response = await axios.get(`${API_BASE_URL}/status/tcp_connections`)
        tcpConnections.value = response.data.connections || []
      } catch (error) {
        console.error('获取TCP连接失败:', error)
        ElMessage.error('获取TCP连接失败')
      } finally {
        tcpLoading.value = false
      }
    }

    const refreshTcpConnections = async () => {
      await fetchTcpConnections()
      ElMessage.success('TCP连接数据已刷新')
    }

    // 规则匹配分页处理
    const handleRuleMatchPageChange = (page) => {
      ruleMatchPage.value = page
      fetchRuleMatches(false) // 不重置页码
    }
    
    // 格式化字节数
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 获取连接状态的颜色类型
    const getStateType = (state) => {
      const stateMap = {
        'ESTABLISHED': 'success',
        'SYN_SENT': 'warning',
        'SYN_RECV': 'warning',
        'FIN_WAIT1': 'info',
        'FIN_WAIT2': 'info',
        'TIME_WAIT': 'info',
        'CLOSE_WAIT': 'danger',
        'CLOSED': 'danger'
      }
      return stateMap[state] || 'info'
    }

    // 监听自动刷新开关
    watch(autoRefresh, (newVal) => {
      if (newVal) {
        // 开启自动刷新，每5秒刷新一次TCP连接
        autoRefreshTimer = setInterval(() => {
          if (!tcpLoading.value) {
            fetchTcpConnections()
          }
        }, 5000)
      } else {
        // 关闭自动刷新
        if (autoRefreshTimer) {
          clearInterval(autoRefreshTimer)
          autoRefreshTimer = null
        }
      }
    })

    onMounted(() => {
      fetchStatus()
      fetchRuleMatches(true)
      fetchTopIp()
      fetchTcpConnections()
      loading.value = false
    })

    onUnmounted(() => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
      }
    })

    return { 
      loading,
      tcpLoading,
      topIpLoading,
      ruleMatchLoading,
      autoRefresh,
      status, 
      ruleMatches, 
      topIp, 
      tcpConnections,
      ruleMatchPage,
      ruleMatchPageSize,
      ruleMatchTotal,
      handleRuleMatchPageChange,
      refreshTcpConnections,
      refreshTopIp,
      refreshRuleMatches,
      formatBytes,
      getStateType
    }
  }
}
</script>

<style scoped>
.el-card {
  margin-bottom: 1.5em;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: bold;
  font-size: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>