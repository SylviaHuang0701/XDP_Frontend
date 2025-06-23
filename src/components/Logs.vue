<template>
  <el-card>
    <h2>日志记录</h2>
    <el-card shadow="never">
      <h3>日志列表</h3>
      <el-row :gutter="20" style="margin-bottom: 1em;">
        <el-col :span="12">
          <el-date-picker type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 100%;" />
        </el-col>
        <el-col :span="12">
          <el-button type="primary">筛选</el-button>
        </el-col>
      </el-row>
      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="time" label="时间" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="content" label="内容" />
      </el-table>
    </el-card>
  </el-card>
</template>

<script>
import { ref, onMounted } from 'vue'
export default {
  name: 'Logs',
  setup() {
    const logs = ref([])
    onMounted(() => {
      setTimeout(() => {
        logs.value = [
          { time: '2024-06-01T12:34:56Z', type: 'drop', content: '192.168.1.100 -> 8.8.8.8:80 被规则3阻断' },
          { time: '2024-06-01T12:35:56Z', type: 'pass', content: '192.168.1.101 -> 8.8.4.4:443 放行' }
        ]
      }, 500)
    })
    return { logs }
  }
}
</script>


<style scoped>
section {
  margin-bottom: 1.5em;
}
</style> 