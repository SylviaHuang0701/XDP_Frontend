<!-- 日志记录页面实现 -->
<!-- 定义界面视觉结构 -->
<template>
  <el-card>
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
      <!-- 绑定分页后的数据源 paginatedLogs -->
      <el-table
        :data="logs"  
        style="width: 100%" 
        :loading="loading"
      >
        <!-- 时间列 -->
        <!-- Date对象自动转换 ISO 时间为本地格式 -->
        <el-table-column prop="time" label="时间">
          <template #default="{ row }">
            {{ new Date(row.time).toLocaleString() }}
          </template>
        </el-table-column>

        <!-- 类型列 -->
        <el-table-column prop="type" label="类型" >
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'pass' ? 'success' : 'danger'"
              disable-transitions
            >
              {{ row.type }} <!-- 直接显示原始数据（pass/drop） -->
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 内容列---直接显示原始日志内容-->
        <el-table-column prop="content" label="内容" />
      </el-table>

      <!-- 
          分页控制区 
          total：页码总数
          page-size：每页能显示页数
          current-change：触发页码变更
      -->
      <el-pagination
        style="margin-top: 1em;"
        layout="prev, pager, next"
        :total="totalLogs"
        :page-size="pageSize"
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

export default {
  name: 'Logs',
  setup() {
    const logs = ref([])
    const dateRange = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)

    // 计算总日志数
    const totalLogs = computed(() => logs.value.length)
    
    // 计算分页后的日志
    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return logs.value.slice(start, end)
    })

    const fetchLogs = async () => {
      try {
        let url = 'http://localhost:3000/status/logs'
        const params = {}
        
        if (dateRange.value && dateRange.value.length === 2) {
          params.from = dateRange.value[0].toISOString()
          params.to = dateRange.value[1].toISOString()
        }
        
        const response = await axios.get(url, { params })
        logs.value = response.data.logs || []
      } catch (error) {
        console.error('获取日志失败:', error)
        ElMessage.error('获取日志失败')
      } finally {
        loading.value = false
      }
    }

    const resetFilter = () => {
      dateRange.value = []
      fetchLogs()
    }

    // 分页处理
    const handlePageChange = (page) => {
      currentPage.value = page
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
      totalLogs,
      pageSize,
      paginatedLogs
    }
  }
}
</script>