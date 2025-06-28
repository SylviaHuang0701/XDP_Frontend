<template>
  <el-card>
    <h2>规则管理</h2>
    <el-card shadow="never" style="margin-bottom: 1em;">
      <!-- 规则列表 -->
      <h3>规则列表</h3>
      <div class="table-toolbar">
        <!-- 
            添加规则按钮
            触发 handleAdd 方法 
        -->
        <el-button type="primary" @click="handleAdd">添加规则</el-button>
        <!-- 
            规则搜索输入框 
            clear 触发 handleSearchClear 方法
            回车键触发 handleSearch 方法
        -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索规则"
          style="width: 300px; margin-left: 10px;"
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        > 
          <!-- 在输入框后附加搜索图标按钮 -->
          <template #append>
            <el-button @click="handleSearch">
              <el-icon>
                <component :is="Search"></component>
              </el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      <el-table :data="filteredRules" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="desc" label="规则描述" width="180" />
        <el-table-column prop="src_ip" label="源IP" width="150" />
        <el-table-column prop="dst_ip" label="目的IP" width="150" />
        <el-table-column prop="src_port" label="源端口" width="100" />
        <el-table-column prop="dst_port" label="目标端口" width="100" />
        <el-table-column prop="protocol" label="协议" width="100">
          <template #default="{ row }">
            <el-tag :type="protocolTagType(row.protocol)">
              {{ row.protocol }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="100">
          <template #default="{ row }">
            <el-tag :type="row.action === 'pass' ? 'success' : 'danger'">
              {{ row.action === 'pass' ? '允许' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 创建时间支持升、降序排列 -->
        <el-table-column prop="created_at" label="创建时间" width="180" sortable />
        <!-- 
            操作列支持：
            1. 编辑 触发 handleEdit 方法
            2. 删除 触发 handleDelete 方法
        -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <!--
        主要属性如下：
          current-page: 双向绑定当前页码
          page-size: 每页条数 (可选)
          total: 总条数
          layout: 控制分页组件的布局
            total: 显示总条数
            sizes: 每页条数选择器，涉及 handleSizeChange 方法
            prev: 上一页按钮 "<"
            pager: 页码列表
            next: 上一页按钮 ">"
            jumper: 快速跳转输入框，可直接在输入框中输入页码，快速跳转
      -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalRules"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑规则对话框 -->
    <!--
      对话框基本配置：
        dialogVisible: 控制对话框是否显示
        isEdit: 控制标题：T--编辑规则；F--添加规则
        closed按钮触发 handleDialogClose 方法
    -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规则' : '添加规则'"
      width="50%"
      @closed="handleDialogClose"
    >
      <!-- 
        表单整体架构
          ref: 单向获取实例引用 
          model: 表单数据对象
          rules: 规则
      -->
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="规则描述" prop="desc">
          <el-input v-model="ruleForm.desc" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="源IP" prop="src_ip">
          <el-input v-model="ruleForm.src_ip" 
          placeholder="例如: 192.168.1.0/24, 10.0.0.1-10.0.0.100 或 any" />
        </el-form-item>
        <el-form-item label="目的IP" prop="dst_ip">
          <el-input v-model="ruleForm.dst_ip" 
          placeholder="例如: 10.0.0.1-10.0.0.50, 192.168.1.0/24 或 any" />
        </el-form-item>
        <el-form-item label="源端口" prop="src_port">
          <el-input v-model="ruleForm.src_port" placeholder="例如: 80, 443 或 1-65535" />
        </el-form-item>
        <el-form-item label="目标端口" prop="dst_port">
          <el-input v-model="ruleForm.dst_port" placeholder="例如: 80, 443 或 1-65535" />
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="ruleForm.protocol" placeholder="请选择协议">
            <el-option label="TCP" value="tcp" />
            <el-option label="UDP" value="udp" />
            <el-option label="ICMP" value="icmp" />
            <el-option label="ANY" value="any" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作" prop="action">
          <el-radio-group v-model="ruleForm.action">
            <el-radio label="pass">允许</el-radio>
            <el-radio label="drop">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <!-- 表单操作区(取消 / 确认) -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 默认规则编辑表 -->
    <el-card shadow="never" style="margin-bottom: 1em;">
    <h3>默认规则</h3>
    <el-row :gutter="20">
      <!-- 左侧：表单 -->
      <el-col :span="12">
        <el-form :model="defaultRule" label-width="120px">
          <el-form-item label="默认动作">
            <el-radio-group v-model="defaultRule.action">
              <el-radio label="pass">允许</el-radio>
              <el-radio label="drop">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="规则描述">
            <el-input v-model="defaultRule.desc" placeholder="默认规则描述" style="width: 300px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveDefaultRule">保存默认规则</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      
      <!-- 右侧：规则说明 -->
      <el-col :span="12">
        <el-card shadow="never" style="height: 100%;">
          <h4>当前默认规则说明</h4>
          <div style="margin-top: 10px;">
            <p><strong>动作：</strong>{{ ConfirmdefaultRule.action === 'pass' ? '允许' : '拒绝' }}</p>
            <p><strong>描述：</strong>{{ ConfirmdefaultRule.desc }}</p>
            <p><strong>效果：</strong></p>
            <ul>
              <li v-if="ConfirmdefaultRule.action === 'pass'">
                所有未匹配到具体规则的流量将被<el-tag type="success">允许通过</el-tag>
              </li>
              <li v-else>
                所有未匹配到具体规则的流量将被<el-tag type="danger">拒绝拦截</el-tag>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>

    <el-card shadow="never">
      <h3>小黑屋</h3>
      <!-- 添加当前选择的提示 (用户已选择过期时间) -->
      <el-alert 
        v-if="blacklistForm.expire_days"
        :title="`当前显示: ${getExpiredDaysText(blacklistForm.expire_days)}删除的规则`" 
        type="info" 
        show-icon 
        style="margin-bottom: 20px;" 
      />
      
      <div class="blacklist-actions">
        <el-form :inline="true" :model="blacklistForm" label-width="100px">
          <el-form-item label="过期规则">
            <!-- 添加 @change 事件自动刷新数据 -->
            <el-select 
              v-model="blacklistForm.expire_days" 
              placeholder="选择过期时间"
              @change="fetchExpiredRules"
            >
              <el-option label="7天前" value="7" />
              <el-option label="30天前" value="30" />
              <el-option label="90天前" value="90" />
              <el-option label="全部" value="all" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <!-- 按钮动态显示选择范围 -->
            <el-button 
              type="danger" 
              @click="handleCleanExpired"
            >
              清理{{ getExpiredDaysText(blacklistForm.expire_days) }}的规则
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 过期规则表 -->
        <el-table :data="expiredRules" style="width: 100%" v-loading="blacklistLoading">
          <el-table-column prop="id" label="ID" width="280" align="center" />
          <el-table-column prop="desc" label="规则描述" width="320" align="center" />
          <el-table-column prop="created_at" label="创建时间" width="320" align="center" />
          <el-table-column label="操作" width="280" align="center">
            <template #default="{ row }">
              <el-button 
                size="small" 
                type="danger" 
                @click="handleForceDelete(row.id)">
                强制删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </el-card>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Search } from "@element-plus/icons-vue";

// 模拟API对象调用
const mockApi = {
  getRules: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockData = [
          { 
            id: 1, 
            desc: '允许本地访问', 
            src_ip: '192.168.1.0/24', 
            dst_ip: 'any', 
            src_port: 'any',
            dst_port: 'any',
            protocol: 'udp',
            action: 'pass', 
            created_at: '2023-01-15 10:30:00'
          },
          { 
            id: 2, 
            desc: '禁止外部访问80端口', 
            src_ip: 'any', 
            dst_ip: '192.168.1.100', 
            src_port: 'any',
            dst_port: '80',
            protocol: 'tcp',
            action: 'drop', 
            created_at: '2023-01-20 14:15:00'
          },
          { 
            id: 3, 
            desc: '允许ICMP ping', 
            src_ip: 'any', 
            dst_ip: 'any', 
            src_port: 'any',
            dst_port: 'any',
            protocol: 'icmp',
            action: 'pass', 
            created_at: '2023-02-01 09:00:00'
          }
        ]
        resolve({ data: mockData })
      }, 500)
    })
  },
  addRule: (rule) => {
    return new Promise(resolve => {
      setTimeout(() => {
        rule.id = Math.floor(Math.random() * 1000) + 10
        rule.created_at = new Date().toLocaleString()
        resolve({ data: rule })
      }, 300)
    })
  },
  updateRule: (rule) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ data: rule })
      }, 300)
    })
  },
  deleteRule: (id) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true })
      }, 300)
    })
  },
  getDefaultRule: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ data: { action: 'pass', desc: '默认放行所有流量' } })
      }, 200)
    })
  },
  saveDefaultRule: (rule) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, data: rule })
      }, 300)
    })
  },
  getExpiredRules: (days) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockData = days === 'all' ? [
          { id: 101, desc: '旧测试规则1', created_at: '2022-12-01 10:00:00' },
          { id: 102, desc: '旧测试规则2', created_at: '2022-11-15 14:30:00' }
        ] : days === '7' ? [
          { id: 103, desc: '上周测试规则', created_at: '2023-01-10 09:15:00' }
        ] : []
        resolve({ data: mockData })
      }, 400)
    })
  },
  cleanExpiredRules: (days) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, deleted: days === 'all' ? 2 : 1 })
      }, 500)
    })
  }
}

// 辅助函数：验证单个IP地址
const isValidIP = (ip) => {
  // 正则表达式初步验证
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(ip)) return false

  // 每段数字是否在正确范围内
  return ip.split('.').every(segment => {
    const num = parseInt(segment, 10)
    return num >= 0 && num <= 255
  })
}

// 添加IP验证方法
const validateIP = (rule, value) => {
  return new Promise((resolve, reject) => {
    if (value === 'any') {
      resolve()
      return
    }

    // 检查IP范围格式 (如 192.168.1.1-192.168.1.100)
    const rangePattern = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/
    if (rangePattern.test(value)) {
      const [start, end] = value.split('-')
      if (!isValidIP(start) || !isValidIP(end)) { 
        reject(new Error('IP 范围格式不正确'))
      } else {
        resolve()
      }
      return
    }

    // 检查CIDR格式 (如 192.168.1.0/24)
    const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
    if (cidrPattern.test(value)) {
      const [ip, prefix] = value.split('/')
      if (!isValidIP(ip) || prefix < 0 || prefix > 32) {
        reject(new Error('CIDR 格式不正确'))
      } else {
        resolve()
      }
      return
    }

    // 检查单个IP
    if (!isValidIP(value)) {
      reject(new Error('请输入有效的 IP 地址、IP 范围或 CIDR'))
    } else {
      resolve()
    }
  })
}

const validatePort = (rule, value) => {
  return new Promise((resolve, reject) => {
    if (!value) {
      reject(new Error('端口不能为空'))
      return
    }

    if (value === 'any') {
      resolve()
      return
    }

    // 端口范围验证
    const isValid = /^(\d{1,5}(-\d{1,5})?)(,\d{1,5}(-\d{1,5})?)*$/.test(value)
    if (!isValid) {
      reject(new Error('格式应为: 80 或 80,443 或 1-65535'))
      return
    }

    // 验证每个端口范围
    const allPorts = value.split(',')
    for (const port of allPorts) {
      if (port.includes('-')) {
        const [start, end] = port.split('-').map(Number)
        if (start > end || start < 1 || end > 65535) {
          reject(new Error(`无效范围: ${port}`))
          return
        }
      } else {
        const num = Number(port)
        if (num < 1 || num > 65535) {
          reject(new Error(`无效端口: ${port}`))
          return
        }
      }
    }

    resolve()
  })
}

export default {
  name: 'Rules',
  setup() {
    // 数据状态
    const rules = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalRules = ref(0)
    
    // 默认规则
    const defaultRule = reactive({
      action: 'pass',
      desc: '默认通过所有流量'
    })
    const ConfirmdefaultRule = reactive({
      action: 'pass',
      desc: '默认通过所有流量'
    })
    
    
    // 对话框相关
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const currentRuleId = ref(null)
    const ruleFormRef = ref(null)  // 表单引用
    const ruleForm = reactive({
      id: 0,
      type: 'ip',
      desc: 'any',
      src_ip: 'any',
      dst_ip: 'any',
      src_port: 'any',
      dst_port: 'any',
      priority: 100,
      expire_at: '2024-06-02T00:00:00Z',
      created_at: '2024-06-01T10:00:00Z',
      updated_at: '2024-06-01T10:00:00Z',
      protocol: 'tcp',
      action: 'pass'
    })
    
    // 表单验证规则
    const formRules = reactive({
      desc: [
        { required: true, message: '请输入规则描述', trigger: 'blur' },
        { min: 3, max: 50, message: '长度在3到50个字符', trigger: 'blur' }
      ],
      src_ip: [
        { required: true, message: '请输入源IP', trigger: 'blur' },
        { validator: validateIP, trigger: 'blur' }
      ],
      dst_ip: [
        { required: true, message: '请输入目的IP', trigger: 'blur' },
        { validator: validateIP, trigger: 'blur' }
      ],
      src_port: [
        { required: true, message: '请输入源端口', trigger: 'blur' },
        { validator: validatePort, trigger: 'blur'}
      ],
      dst_port: [
        { required: true, message: '请输入目标端口', trigger: 'blur' },
        { validator: validatePort, trigger: 'blur'}
      ],
      protocol: [
        { required: true, message: '请选择协议', trigger: 'change' }
      ]
    })

    
    
    // 小黑屋相关
    const blacklistForm = reactive({
      expire_days: '7'
    })
    const expiredRules = ref([])
    const blacklistLoading = ref(false)

    // 获取过期规则
    const getExpiredDaysText = (days) => {
      const map = {
        '7': '7天前',
        '30': '30天前',
        '90': '90天前',
        'all': '全部'
      }
      return map[days] || days
    }

    
    // 查找关键词（不区分大小写）
    const filteredRules = computed(() => {
      if (!searchQuery.value) {
        return rules.value
      }
      const query = searchQuery.value.toLowerCase()
      return rules.value.filter(rule =>
        rule.desc.toLowerCase().includes(query) ||
        rule.src_ip.toLowerCase().includes(query) ||
        rule.dst_ip.toLowerCase().includes(query) ||
        rule.protocol.toLowerCase().includes(query) ||
        rule.src_port.toLowerCase().includes(query) ||
        rule.dst_port.toLowerCase().includes(query) ||
        rule.action.toLowerCase().includes(query)
      )
    })
  
    
    // 方法
    // 设置协议颜色
    const protocolTagType = (protocol) => {
      const types = {
        tcp: '',
        udp: 'info',
        icmp: 'warning',
        any: 'success'
      }
      return types[protocol] || ''
    }

    // 获取规则列表数据
    const fetchRules = async () => {
      loading.value = true
      try {
        const response = await mockApi.getRules()
        rules.value = response.data
        totalRules.value = response.data.length
      } catch (error) {
        ElMessage.error('获取规则列表失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 获取默认规则列表数据
    const fetchDefaultRule = async () => {
      try {
        const response = await mockApi.getDefaultRule()
        Object.assign(defaultRule, response.data)
      } catch (error) {
        ElMessage.error('获取默认规则失败: ' + error.message)
      }
    }

    // 定义初始表单数据
    const initialFormState = {
      id: 0,
      desc: 'any',
      src_ip: 'any',
      dst_ip: 'any',
      src_port: 'any',
      dst_port: 'any',
      protocol: 'tcp',
      action: 'pass'
    }

    // 添加规则
    const handleAdd = () => {
      isEdit.value = false
      // 初始化默认值
      Object.assign(ruleForm, initialFormState)
      dialogVisible.value = true
    }

    // 编辑规则
    const handleEdit = (row) => {
      isEdit.value = true
      currentRuleId.value = row.id
      // 使用 Object.assign 更新 reactive 对象
      Object.assign(ruleForm, {
        id: row.id,
        desc: row.desc || '',
        src_ip: row.src_ip || 'any',
        dst_ip: row.dst_ip || 'any',
        src_port: row.src_port || 'any',  // 修正字段名
        dst_port: row.dst_port || 'any',  // 修正字段名
        protocol: row.protocol || 'tcp',
        action: row.action || 'pass'
      })
      dialogVisible.value = true
    }

    // 删除规则
    const handleDelete = (id) => {
      ElMessageBox.confirm('确定要删除这条规则吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await mockApi.deleteRule(id)
          ElMessage.success('删除成功')
          fetchRules()
        } catch (error) {
          ElMessage.error('删除失败: ' + error.message)
        } // 点击确定，删除规则
      }).catch(() => {}) // 点击取消，不进行任何操作
    }

    // 对话框关闭
    const handleDialogClose = () => {
      ruleFormRef.value?.resetFields()
      Object.assign(ruleForm, initialFormState) // 使用预定义的初始状态
      currentRuleId.value = null               // 也清除编辑ID
    }

    // 提交表单
    const submitForm = async () => {
      try {
        await ruleFormRef.value.validate()
        
        if (isEdit.value) {
          await mockApi.updateRule({ id: currentRuleId.value, ...ruleForm })
          ElMessage.success('更新成功')
        } else {
          await mockApi.addRule(ruleForm)
          ElMessage.success('添加成功')
        }
        
        dialogVisible.value = false
        fetchRules()
      } catch (error) {
        if (error.name !== 'ValidationError') {
          ElMessage.error('操作失败: ' + error.message)
        }
      }
    }

    // 监听动作变化，实时更新描述
    watch(
      () => defaultRule.action,
      (newAction) => {
        defaultRule.desc = newAction === 'pass' 
          ? '默认通过所有流量' 
          : '默认拒绝所有流量';
      }
    )

    // 保存默认规则
    const saveDefaultRule = async () => {
      try {
        defaultRule.desc = defaultRule.action === 'pass'
          ? '默认通过所有流量'
          : '默认拒绝所有流量';

        ConfirmdefaultRule.action = defaultRule.action
        ConfirmdefaultRule.desc = defaultRule.desc
        await mockApi.saveDefaultRule(defaultRule)
        ElMessage.success('默认规则保存成功')
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message)
      }
    }

    // 当用户触发搜索时，将当前页码重置为第一页
    const handleSearch = () => {
      currentPage.value = 1
    }

    // 清除搜索条件，回到第一页
    const handleSearchClear = () => {
      searchQuery.value = ''
      currentPage.value = 1
    }

    // 页容量设置
    const handleSizeChange = (val) => {
      pageSize.value = val
    }

    // 当前页面选择
    const handleCurrentChange = (val) => {
      currentPage.value = val
    }
    
    // 小黑屋方法
    // 获取过期的规则列表
    const fetchExpiredRules = async () => {
      blacklistLoading.value = true
      try {
        const response = await mockApi.getExpiredRules(blacklistForm.expire_days)
        expiredRules.value = response.data
      } catch (error) {
        ElMessage.error('获取过期规则失败: ' + error.message)
      } finally {
        blacklistLoading.value = false
      }
    }

    // 清除过期的规则列表
    const handleCleanExpired = async () => {
      try {
        // 弹出一确认对话框
        await ElMessageBox.confirm(
          `确定要清理${blacklistForm.expire_days === 'all' ? '所有' : blacklistForm.expire_days + '天前'}的过期规则吗?`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        // 执行清除操作
        const response = await mockApi.cleanExpiredRules(blacklistForm.expire_days)
        ElMessage.success(`成功清理${response.deleted}条过期规则`)
        fetchExpiredRules()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('清理失败: ' + error.message)
        }
      }
    }

    // 强制删除某条规则
    const handleForceDelete = async (id) => {
      try {
        await ElMessageBox.confirm('确定要强制删除这条规则吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await mockApi.deleteRule(id)
        ElMessage.success('强制删除成功')
        fetchExpiredRules()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + error.message)
        }
      }
    }
    
    // 生命周期
    onMounted(() => {
      fetchRules()
      fetchDefaultRule()
      fetchExpiredRules()
    })

    // 监听 blacklistForm.expire_days 变化
    watch(
      () => blacklistForm.expire_days,
      (newVal) => {
        fetchExpiredRules()
      }
    )
    
    return {
      // 数据
      rules,
      loading,
      searchQuery,
      currentPage,
      pageSize,
      totalRules,
      defaultRule,
      ConfirmdefaultRule,
      dialogVisible,
      isEdit,
      ruleFormRef,
      ruleForm,
      rules: formRules,
      filteredRules,
      blacklistForm,
      expiredRules,
      blacklistLoading,
      getExpiredDaysText,
      
      // 方法
      protocolTagType,
      handleAdd,
      handleEdit,
      handleDelete,
      handleDialogClose,
      submitForm,
      saveDefaultRule,
      handleSearch,
      handleSearchClear,
      handleSizeChange,
      handleCurrentChange,
      handleCleanExpired,
      handleForceDelete,
      fetchExpiredRules
    }
  }
}
</script>

<style scoped>
.el-table {
  table-layout: fixed;
}

/* 表头和内容单元格对齐 */
.el-table th.el-table__cell,
.el-table td.el-table__cell {
  padding: 12px 8px;
  text-align: center;
  vertical-align: middle;
}

.el-table .el-table__header-wrapper th {
  background-color: #f5f7fa;
}

.el-card {
  width: 100%;
  box-sizing: border-box;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.blacklist-actions {
  margin-top: 20px;
}

/* 小黑屋表格专用样式 */
.blacklist-actions .el-table {
  table-layout: fixed;
}

.blacklist-actions .el-table th.el-table__cell,
.blacklist-actions .el-table td.el-table__cell {
  padding: 12px 8px;
  text-align: center !important;
  vertical-align: middle;
}

.blacklist-actions .el-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.blacklist-actions {
  margin-top: 20px;
  width: 100%;
  overflow-x: auto;
}
</style>