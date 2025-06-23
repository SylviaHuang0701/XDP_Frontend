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
        <el-statistic title="Bandwidth" :value="status.bandwidth" />
      </el-col>
    </el-row>
    <el-divider />
    <el-card shadow="never" style="margin-bottom: 1em;">
      <h3>规则匹配</h3>
      <el-table :data="ruleMatches" style="width: 100%">
        <el-table-column prop="time" label="时间" />
        <el-table-column prop="rule_desc" label="规则" />
        <el-table-column prop="src_ip" label="源IP" />
        <el-table-column prop="dst_ip" label="目的IP" />
        <el-table-column prop="action" label="动作" />
      </el-table>
    </el-card>
    <el-card shadow="never" style="margin-bottom: 1em;">
      <h3>Top IP Source</h3>
      <el-table :data="topIp" style="width: 100%">
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="bytes" label="流量(Bytes)" />
        <el-table-column prop="packets" label="包数" />
      </el-table>
    </el-card>
    <el-card shadow="never">
      <h3>TCP Connections</h3>
      <el-table :data="tcpConnections" style="width: 100%">
        <el-table-column prop="src_ip" label="源地址" />
        <el-table-column prop="src_port" label="源端口" />
        <el-table-column prop="dst_ip" label="目的地址" />
        <el-table-column prop="dst_port" label="目的端口" />
        <el-table-column prop="state" label="状态" />
      </el-table>
    </el-card>
  </el-card>
</template>

<script>
import { ref, onMounted } from 'vue'
export default {
  name: 'Status',
  setup() {
    const status = ref({ pass: 0, abort: 0, drop: 0, bandwidth: 0 })
    const ruleMatches = ref([])
    const topIp = ref([])
    const tcpConnections = ref([])
    onMounted(() => {
      setTimeout(() => {
        status.value = { pass: 12345, abort: 234, drop: 56, bandwidth: 987654321 }
        ruleMatches.value = [
          { time: '2024-06-01T12:34:56Z', rule_desc: '禁止80端口', src_ip: '192.168.1.100', dst_ip: '8.8.8.8', action: 'drop' },
          { time: '2024-06-01T12:35:56Z', rule_desc: '允许本地访问', src_ip: '192.168.1.101', dst_ip: '8.8.4.4', action: 'pass' }
        ]
        topIp.value = [
          { ip: '192.168.1.100', bytes: 123456, packets: 789 },
          { ip: '192.168.1.101', bytes: 654321, packets: 456 }
        ]
        tcpConnections.value = [
          { src_ip: '192.168.1.100', src_port: 12345, dst_ip: '8.8.8.8', dst_port: 80, state: 'ESTABLISHED' },
          { src_ip: '192.168.1.101', src_port: 23456, dst_ip: '8.8.4.4', dst_port: 443, state: 'SYN_SENT' }
        ]
      }, 500)
    })
    return { status, ruleMatches, topIp, tcpConnections }
  }
}
</script>

<style scoped>
section {
  margin-bottom: 1.5em;
}
</style> 