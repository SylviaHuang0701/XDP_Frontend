<!-- 日志记录页面实现 -->
<!-- 定义界面视觉结构 -->
<template>
  <el-card>
    <h2>日志记录</h2>
    <el-card shadow="never"> <!-- 内层不要阴影 -->
      <h3>日志列表</h3>
      <el-row :gutter="20" style="margin-bottom: 1em;">
        <!-- 按列 3:1(18:6)配比空间 -->
        <el-col :span="18">
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
        <el-col :span="6" style="display: flex; gap: 10px; padding-left: 20px;">
          <!-- 操作按钮设置 (筛选 && 重置) -->
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-col>
      </el-row>

      <!-- 表格展示区配置 -->
      <!-- 绑定分页后的数据源 paginatedLogs -->
      <el-table
        :data="paginatedLogs"  
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
import { ElMessage } from 'element-plus'

export default {
  name: 'Logs',
  setup() {
    // 初始化默认时间范围（最近7天）
    const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]) // 默认最近7天
    const allLogs = ref([])        // 原始日志数据存储
    const filteredLogs = ref([])   // 筛选后的日志数据
    const loading = ref(false)     // 加载状态控制
    const currentPage = ref(1)     // 当前页码
    const pageSize = ref(10)       // 每页显示条数

    // 计算总日志数
    const totalLogs = computed(() => filteredLogs.value.length)
    
    // 计算分页后的日志
    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredLogs.value.slice(start, end)
    })

    // 模拟获取日志数据
    const fetchLogs = () => {
      return [
        { time: '2024-06-01T12:34:56Z', type: 'drop', content: '192.168.1.100 -> 8.8.8.8:80 被规则3阻断' },
        { time: '2024-06-01T12:35:56Z', type: 'pass', content: '192.168.1.101 -> 8.8.4.4:443 放行' },
        { time: '2024-06-02T08:15:30Z', type: 'drop', content: '192.168.1.102 -> 1.1.1.1:53 被规则5阻断' },
        { time: '2024-05-30T14:22:10Z', type: 'pass', content: '192.168.1.103 -> 9.9.9.9:53 放行' },
        { time: '2024-06-03T09:45:12Z', type: 'drop', content: '192.168.1.104 -> 8.8.8.8:443 被规则2阻断' },
        { time: '2024-05-28T16:30:45Z', type: 'pass', content: '192.168.1.105 -> 8.8.4.4:80 放行' },
        { time: '2024-06-04T11:20:33Z', type: 'drop', content: '192.168.1.106 -> 1.0.0.1:53 被规则7阻断' },
        { time: '2024-05-25T13:10:22Z', type: 'pass', content: '192.168.1.107 -> 9.9.9.9:443 放行' },
        { time: '2024-06-05T10:05:18Z', type: 'drop', content: '192.168.1.108 -> 8.8.8.8:53 被规则1阻断' },
        { time: '2024-05-20T17:40:56Z', type: 'pass', content: '192.168.1.109 -> 1.1.1.1:80 放行' },
        { time: '2024-06-06T15:25:47Z', type: 'drop', content: '192.168.1.110 -> 9.9.9.9:80 被规则4阻断' },
        { time: '2024-05-15T19:55:38Z', type: 'pass', content: '192.168.1.111 -> 8.8.4.4:53 放行' }
      ]
    }

    // 筛选日志
    const filterLogs = () => {
      if (!dateRange.value || dateRange.value.length !== 2) {
        return allLogs.value
      }

      // 获取时间范围
      const startTime = dateRange.value[0].getTime()
      const endTime = dateRange.value[1].getTime()
      
      return allLogs.value.filter(log => {
        const logTime = new Date(log.time).getTime()
        return logTime >= startTime && logTime <= endTime
      })
    }

    // 处理筛选
    const handleFilter = () => {
      // 检查
      if (!dateRange.value || dateRange.value.length !== 2) {
        ElMessage.warning('请选择时间范围')
        return
      }
      
      loading.value = true
      setTimeout(() => {
        filteredLogs.value = filterLogs()
        currentPage.value = 1 // 重置到第一页
        loading.value = false
      }, 500)
    }

    // 重置筛选
    const resetFilter = () => {
      dateRange.value = [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]
      handleFilter()
    }

    // 分页处理
    const handlePageChange = (page) => {
      currentPage.value = page
    }

    // 生命周期钩子，执行
    onMounted(async () => {
      loading.value = true
      try {
        // 假设 fetchLogs 返回 Promise
        allLogs.value = await fetchLogs()
        filteredLogs.value = filterLogs()
      } catch (error) {
        // 错误处理
        console.error("加载日志失败:", error)
      } finally {
        loading.value = false
      }
    })

    return { 
      paginatedLogs, 
      dateRange, 
      handleFilter, 
      resetFilter,
      loading, 
      handlePageChange,
      totalLogs,
      pageSize
    }
  }
}
</script>