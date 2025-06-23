<template>
  <el-card>
    <h2>规则管理</h2>
    <el-card shadow="never" style="margin-bottom: 1em;">
      <h3>规则列表</h3>
      <el-table :data="rules" style="width: 100%">
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="desc" label="规则描述" />
        <el-table-column prop="src_ip" label="源IP" />
        <el-table-column prop="dst_ip" label="目的IP" />
        <el-table-column prop="action" label="动作" />
        <el-table-column label="操作">
          <template #default>
            <el-button size="small" type="primary">编辑</el-button>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card shadow="never" style="margin-bottom: 1em;">
      <h3>添加/编辑规则</h3>
      <el-form :model="{}" label-width="80px">
        <el-form-item label="规则内容">
          <el-input />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">提交</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" style="margin-bottom: 1em;">
      <h3>默认规则</h3>
      <el-input v-model="defaultRule.desc" placeholder="默认规则" style="width: 300px; margin-right: 1em;" />
      <el-button type="primary">保存</el-button>
    </el-card>
    <el-card shadow="never">
      <h3>小黑屋</h3>
      <el-alert title="定时删除规则功能区" type="info" show-icon />
    </el-card>
  </el-card>
</template>

<script>
import { ref, onMounted } from 'vue'
export default {
  name: 'Rules',
  setup() {
    const rules = ref([])
    const defaultRule = ref({ action: '', desc: '' })
    onMounted(() => {
      setTimeout(() => {
        rules.value = [
          { id: 1, desc: '允许本地访问', src_ip: '192.168.1.0/24', dst_ip: 'any', action: 'pass' },
          { id: 2, desc: '禁止80端口', src_ip: 'any', dst_ip: 'any', action: 'drop' }
        ]
        defaultRule.value = { action: 'pass', desc: '默认放行' }
      }, 500)
    })
    return { rules, defaultRule }
  }
}
</script>


<style scoped>
section {
  margin-bottom: 1.5em;
}
</style> 