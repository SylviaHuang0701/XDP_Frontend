<!-- 日志记录页面实现 -->
<!-- 定义界面视觉结构 -->
<template>
  <el-card style="width: 960px;">
    <h2>日志记录</h2>
    <el-card shadow="never"> <!-- 内层不要阴影 -->
      <h3>日志列表</h3>
      <el-row :gutter="20" style="margin-bottom: 1em;">
        <!-- 按列 3:1(18:6)配比空间 -->
        <el-col :span="12">
          <!-- 时间范围选择器 -->
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%;"
          />
        </el-col>
        <el-col :span="12">
          <el-button type="primary" @click="fetchLogs">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-col>
      </el-row>

      <!-- 表格展示区配置 -->
      <el-table
        :data="logs"  
        style="width: 100%;min-height: 300px;" 
        :loading="loading"
      >
        <!-- 时间列 -->
        <!-- Date对象自动转换 ISO 时间为本地格式 -->
        <el-table-column prop="timestamp" label="时间">
          <template #default="{ row }">
            {{ new Date(row.timestamp).toLocaleString() }}
          </template>
        </el-table-column>

        <!-- 类型列 -->
        <el-table-column prop="level" label="类型" >
          <template #default="{ row }">
            <el-tag
              :type="getLogLevelType(row.level)"
              disable-transitions
            >
              {{ row.level }} <!-- 显示日志级别（INFO, WARNING, ERROR） -->
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 内容列---显示日志消息-->
        <el-table-column prop="message" label="内容" />
        
        <!-- 来源列---显示日志来源-->
        <el-table-column prop="source" label="来源" width="120" />
      </el-table>

      <!-- 
          分页控制区 
          total：页码总数
          page-size：每页能显示页数
          current-change：触发页码变更
      -->
      <!-- 调试信息 -->
      <div style="margin-top: 10px; font-size: 12px; color: #909399;">
        调试信息: 当前页 {{ currentPage }}, 总页数 {{ Math.ceil(totalLogs / pageSize) }}, 总记录数 {{ totalLogs }}
      </div>
      
      <el-pagination
        style="margin-top: 1em;"
        layout="prev, pager, next"
        :total="totalLogs"
        :page-size="pageSize"
        v-model:current-page="currentPage"
        @current-change="handlePageChange"
      />
    </el-card>
  </el-card>
</template>

<!-- 处理组件逻辑和数据管理 -->
<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL } from '../config.js'

export default {
  name: 'Logs',
  setup() {
    const logs = ref([])
    const dateRange = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 总日志数（从后端获取）
    const totalLogs = ref(0)

    const fetchLogs = async (resetPage = true) => {
      loading.value = true
      try {
        // 如果是刷新操作，重置到第一页
        if (resetPage) {
          currentPage.value = 1
        }
        
        let url = `${API_BASE_URL}/status/logs`
        const params = {
          page: currentPage.value,
          page_size: pageSize.value
        }
        
        if (dateRange.value && dateRange.value.length === 2) {
          params.from = dateRange.value[0].toISOString()
          params.to = dateRange.value[1].toISOString()
        }
        
        console.log('发送日志请求:', url, params)
        const response = await axios.get(url, { params })
        console.log('收到日志响应:', response.data)
        logs.value = response.data.logs || []
        totalLogs.value = response.data.total || 0
        console.log('当前页码:', currentPage.value, '总页数:', Math.ceil(totalLogs.value / pageSize.value))
        
        // 检查当前页是否超出范围，但不递归调用
        const maxPage = Math.ceil(totalLogs.value / pageSize.value)
        if (currentPage.value > maxPage && maxPage > 0) {
          currentPage.value = maxPage
          // 直接重新请求，避免递归
          const newParams = { ...params, page: currentPage.value }
          const newResponse = await axios.get(url, { params: newParams })
          logs.value = newResponse.data.logs || []
        }
      } catch (error) {
        console.error('获取日志失败:', error)
        ElMessage.error('获取日志失败')
      } finally {
        loading.value = false
      }
    }

    const resetFilter = () => {
      console.log('重置过滤器，当前页码:', currentPage.value)
      dateRange.value = []
      currentPage.value = 1 // 显式重置页码
      fetchLogs(true) // 重置到第一页
    }

    // 分页处理
    const handlePageChange = (page) => {
      console.log('页码变化:', page)
      currentPage.value = page
      fetchLogs(false) 
    }

    const getLogLevelType = (level) => {
      switch (level) {
        case 'INFO':
          return 'info'
        case 'WARNING':
          return 'warning'
        case 'ERROR':
          return 'danger'
        default:
          return 'info'
      }
    }

    onMounted(() => {
      fetchLogs()
    })

    return { 
      logs, 
      dateRange, 
      fetchLogs, 
      resetFilter,
      loading, 
      handlePageChange,
      currentPage,
      totalLogs,
      pageSize,
      getLogLevelType
    }
  }
}
</script>