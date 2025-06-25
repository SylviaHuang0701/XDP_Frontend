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
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'Status',
  setup() {
    const loading = ref(true)
    const status = ref({ pass: 0, abort: 0, drop: 0, bandwidth: 0 })
    const ruleMatches = ref([])
    const topIp = ref([])
    const tcpConnections = ref([])

    // API请求函数
    const fetchData = async () => {
      try {
        loading.value = true
        
        // 假设API端点路径如下（根据实际API修改）
        const endpoints = {
          status: '/api/status',
          rules: '/api/rules/matches',
          topip: '/api/top-ip',
          tcp: '/api/tcp-connections'
        }

        // 并发请求所有数据
        const [statusRes, rulesRes, topipRes, tcpRes] = await Promise.all([
          axios.get(endpoints.status),
          axios.get(endpoints.rules),
          axios.get(endpoints.topip),
          axios.get(endpoints.tcp)
        ])

        // 更新数据，请求到的数据分别赋值给对应响应式数据
        status.value = statusRes.data
        ruleMatches.value = rulesRes.data
        topIp.value = topipRes.data
        tcpConnections.value = tcpRes.data

      }
      // 捕获过程错误处理
      catch (error)
      {
        console.error('API请求失败:', error)
        ElMessage.error('数据加载失败: ' + (error.response?.data?.message || error.message))
      }
      finally
      {
        loading.value = false
      }
    }

    // 轮询函数
    const startPolling = () => {
      // 每30秒刷新一次数据(执行 fetchData)
      const interval = setInterval(fetchData, 30000) /* 定时器 ID */
      
      // 组件卸载时清除定时器
      onUnmounted(() => {
        clearInterval(interval)
      })
    }

    // onMounted(() => {
    //   fetchData()
    //   startPolling()
    // })
    // 临时使用模拟数据测试
    onMounted(() => {
      status.value = { pass: 123, abort: 45, drop: 67, bandwidth: 8910 }
      ruleMatches.value = [{time: '2023-01-01', rule_desc: 'test', src_ip: '1.1.1.1', dst_ip: '2.2.2.2', action: 'pass'}]
      topIp.value = [{ip: '3.3.3.3', bytes: 1000, packets: 10}]
      tcpConnections.value = [{src_ip: '4.4.4.4', src_port: 1234, dst_ip: '5.5.5.5', dst_port: 80, state: 'ESTABLISHED'}]
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