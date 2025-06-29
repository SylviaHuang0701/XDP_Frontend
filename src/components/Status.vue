<template>
  <el-card>
    <h2>状态监控</h2>
    <el-row :gutter="20" style="margin-bottom: 1em;">
      <el-col :span="6">
        <el-statistic title="Pass" :value="status.pass" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="Abort" :value="status.abort" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="Drop" :value="status.drop" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="Bandwidth" :value="status.bandwidth" suffix="MB/s" />
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
          <h3>规则匹配</h3>
          <el-table 
            :data="ruleMatches" 
            style="width: 100%" 
            v-loading="loading"
          >
            <el-table-column prop="time" label="时间" />
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
        </el-card>

        <!-- 表二：流量最高 IP --> 
        <el-card shadow="never" style="margin-bottom: 1em;">
          <h3>Top IP Source</h3>
          <el-table 
            :data="topIp" 
            style="width: 100%" 
            v-loading="loading"
          >
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="bytes" label="流量(Bytes)" />
            <el-table-column prop="packets" label="包数" />
          </el-table>
        </el-card>

        <!-- 表三：TCP 连接状态 --> 
        <el-card shadow="never">
          <h3>TCP Connections</h3>
          <el-table 
            :data="tcpConnections" 
            style="width: 100%" 
            v-loading="loading"
          >
            <el-table-column prop="src_ip" label="源地址" />
            <el-table-column prop="src_port" label="源端口" />
            <el-table-column prop="dst_ip" label="目的地址" />
            <el-table-column prop="dst_port" label="目的端口" />
            <el-table-column prop="state" label="状态" />
          </el-table>
        </el-card>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { API_BASE_URL } from '../config.js'

export default {
  name: 'Status',
  setup() {
    const loading = ref(true)
    const status = ref({ pass: 0, abort: 0, drop: 0, bandwidth: 0 })
    const ruleMatches = ref([])
    const topIp = ref([])
    const tcpConnections = ref([])

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/`)
        status.value = response.data
      } catch (error) {
        console.error('获取状态失败:', error)
      }
    }

    const fetchRuleMatches = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/rule_match?page=1`)
        ruleMatches.value = response.data.matches || []
      } catch (error) {
        console.error('获取规则匹配失败:', error)
      }
    }

    const fetchTopIp = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/top_ip?col=bytes`)
        topIp.value = response.data.top || []
      } catch (error) {
        console.error('获取Top IP失败:', error)
      }
    }

    const fetchTcpConnections = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/tcp_connections`)
        tcpConnections.value = response.data.connections || []
      } catch (error) {
        console.error('获取TCP连接失败:', error)
      }
    }

    onMounted(() => {
      fetchStatus()
      fetchRuleMatches()
      fetchTopIp()
      fetchTcpConnections()
      loading.value = false
    })

    return { 
      loading,
      status, 
      ruleMatches, 
      topIp, 
      tcpConnections 
    }
  }
}
</script>

<style scoped>
.el-card {
  margin-bottom: 1.5em;
}
</style>