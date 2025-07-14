<template>
  <el-card style="width: 960px;">
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
        <el-table-column prop="domain" label="域名" width="120" />
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
        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
          <template #default="{ row }">
            {{ row.created_at }}
          </template>
        </el-table-column>
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
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="规则描述" prop="desc">
          <el-input v-model="ruleForm.desc" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-input 
            v-model="ruleForm.protocol" 
            placeholder="请输入协议名称(如TCP, UDP)或协议号(如6, 17)，留空表示any"
            @change="handleProtocolChange"
          />
        </el-form-item>
        <el-form-item label="源IP" prop="src_ip_start">
          <el-input v-model="ruleForm.src_ip_start" 
          placeholder="例如: 192.168.1.0/24, 10.0.0.1-10.0.0.100 或 any 或 0000:0000:0000:0000:0000:0000:0000:0000 - FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF" />
        </el-form-item>
        <el-form-item label="目的IP" prop="dst_ip">
          <el-input v-model="ruleForm.dst_ip" 
          placeholder="例如: 10.0.0.1-10.0.0.50, 192.168.1.0/24 或 any" />
        </el-form-item>
        <el-form-item label="源端口" prop="src_port">
          <el-input 
            v-model="ruleForm.src_port" 
            placeholder="例如: 80 或 1-65535" 
            :disabled="!isPortProtocol"
          />
        </el-form-item>
        <el-form-item label="目标端口" prop="dst_port">
          <el-input 
            v-model="ruleForm.dst_port" 
            placeholder="例如: 80 或 1-65535" 
            :disabled="!isPortProtocol"
          />
        </el-form-item>
        <el-form-item label="域名" prop="domain">
          <el-input 
            v-model="ruleForm.domain" 
            placeholder="例如: example.com 或 *.example.com 或 any" 
          />
        </el-form-item>
        <el-form-item label="动作" prop="action">
          <el-radio-group v-model="ruleForm.action">
            <el-radio label="pass">允许</el-radio>
            <el-radio label="drop">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="ruleForm.priority" :min="0" :max="1000" />
        </el-form-item> -->
        <el-form-item label="过期时间" prop="expire_at">
          <el-date-picker
            v-model="ruleForm.expire_at"
            type="datetime"
            placeholder="选择过期时间（可选）"
            format="YYYY-MM-DDTHH:mm:ss[Z]"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
          />
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
          <div style="margin-top: 10px; text-align: left;">
            <p><strong>动作：</strong>{{ ConfirmdefaultRule.action === 'pass' ? '允许' : '拒绝' }}</p>
            <p><strong>描述：</strong>{{ ConfirmdefaultRule.desc }}</p>
            <p><strong>效果：</strong>
              <span  v-if="ConfirmdefaultRule.action === 'pass'">
                所有未匹配到具体规则的流量将被<el-tag type="success">允许通过</el-tag>
              </span >
              <span  v-else>
                所有未匹配到具体规则的流量将被<el-tag type="danger">拒绝拦截</el-tag>
              </span >
            </p>
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
        :title="`当前显示: ${getExpiredDaysText(blacklistForm.expire_days)}过期的规则`" 
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
          <el-table-column prop="created_at" label="创建时间" width="320" align="center">
            <template #default="{ row }">
              {{ row.created_at }}
            </template>
          </el-table-column>
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
import { API_BASE_URL, API_ENDPOINTS, protocolNumberToName,protocolNameToNumber } from '../config.js'

const api = {
  getRules: async (page = 1, pageSize = 20) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.RULES}`, {
        params: { page, page_size: pageSize }
      });
      return response;
    } catch (error) {
      console.error('Failed to get rules:', error);
      throw error;
    }
  },
  addRule: async (rule) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.RULES}`, rule)
      return response;
    }catch (error) {
      console.error('Failed to add rule:', error);
      throw error; 
    }
  },
  updateRule: async (id, rule) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`, rule)
      return response
    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  },
  deleteRule: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`);
      return response;
    } catch (error) {
      console.error('删除规则失败:', {
        url: `${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`,
        method: 'DELETE',
        error: error.response?.data || error.message
      });
      throw error;
    }
  },
  getDefaultRule: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.RULES_DEFAULT}`)
      return response
    }catch (error) {
      console.error('Failed to get default rule:', error);
      throw error;
    }
  },
  saveDefaultRule: async (rule) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.RULES_DEFAULT}`, rule)
      return response
    }catch (error) {
      console.error('Failed to save default rule:', error);
      throw error;
    }
  },
  
  // 获取过期规则
  getExpiredRules: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.RULES}`, {
        params: { expired: true }  // 添加参数标识获取过期规则
      });
      return response;
    } catch (error) {
      console.error('获取过期规则失败:', {
        url: `${API_BASE_URL}${API_ENDPOINTS.RULES}`,
        method: 'GET',
        params: { expired: true },
        error: error.response?.data || error.message
      });
      throw error;
    }
  },
  
  // 清理过期规则
  cleanExpiredRules: async (ruleIds) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.RULES}`,
        {data: {id : ruleIds}} 
      );
      return response;
    } catch (error) {
      console.error('Failed to clean expired rules:', error);
      throw error;
    }
  }
}

// 辅助函数：验证单个IP地址
const isValidIP = (ip) => {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(ip)) return false
  return ip.split('.').every(segment => {
    const num = parseInt(segment, 10)
    return num >= 0 && num <= 255
  })
}

// 添加IP验证方法
const validateIP = (rule, value) => {
  return new Promise((resolve, reject) => {
    if (!value || value === 'any') {
      resolve()
      return
    }

    // 检查是否为IPv6
    if (value.includes(':')) {
      // IPv6验证
      const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      
      // 检查IPv6范围格式
      if (value.includes('-')) {
        const [start, end] = value.split('-').map(s => s.trim());
        if (!ipv6Pattern.test(start) || !ipv6Pattern.test(end)) {
          reject(new Error('IPv6 范围格式不正确'))
          return
        }
        resolve()
        return
      }
      
      // 检查单个IPv6
      if (!ipv6Pattern.test(value)) {
        reject(new Error('请输入有效的 IPv6 地址'))
        return
      }
      resolve()
      return
    }

    // IPv4验证
    // 检查IP范围格式 (如 192.168.1.1-192.168.1.100)
    const rangePattern = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/
    if (rangePattern.test(value)) {
      const [start, end] = value.split('-')
      if (!isValidIP(start) || !isValidIP(end)) { 
        reject(new Error('IPv4 范围格式不正确'))
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

    // 检查单个IPv4
    if (!isValidIP(value)) {
      reject(new Error('请输入有效的 IPv4 地址、IP 范围或 CIDR'))
    } else {
      resolve()
    }
  })
}

const validatePort = (rule, value) => {
  return new Promise((resolve, reject) => {
    if (!value || value === 'any') {
      resolve();
      return;
    }
    if (value.includes(',')) {
      reject(new Error('不支持逗号分隔多个端口，只能输入单个端口或范围'));
      return;
    }
    // 单个端口
    if (/^\d{1,5}$/.test(value)) {
      const num = parseInt(value, 10);
      if (num < 1 || num > 65535) {
        reject(new Error('端口范围应为 1-65535'));
        return;
      }
      resolve();
      return;
    }
    // 范围
    if (/^\d{1,5}-\d{1,5}$/.test(value)) {
      const [start, end] = value.split('-').map(Number);
      if (start < 1 || end > 65535 || start > end) {
        reject(new Error('端口范围格式不正确'));
        return;
      }
      resolve();
      return;
    }
    reject(new Error('端口格式应为: 80 或 80-443'));
  });
};

// 解析IP/端口范围
function parsePortRange(input) {
  if (!input || input === 'any') return [0, 0];
  if (input.includes('-')) {
    const [start, end] = input.split('-').map(s => parseInt(s.trim(), 10));
    return [start, end];
  }
  const port = parseInt(input, 10);
  return [port, port];
}

const isIPv6LessThan = (ip1, ip2) => {
  // 将 IPv6 地址转换为统一的 8 段格式
  const normalizeIPv6 = (ip) => {
    // 展开 IPv6 地址中的 ::
    ip = ip.replace('::', Array(8 - ip.split(':').length + 2).join(':') + ':');
    return ip.split(':').map(segment => segment.padStart(4, '0')).join('');
  };

  // 转换为 32 字符的 16 进制字符串
  const normalizedIp1 = normalizeIPv6(ip1);
  const normalizedIp2 = normalizeIPv6(ip2);

  // 比较字符串的大小
  return normalizedIp1 < normalizedIp2;
};

const isIPv4LessThan= (ip1, ip2) => {
  const ipToNumber = (ip) => {
    return ip.split('.').reduce((acc, segment) => {
      return (acc << 8) + parseInt(segment, 10);
    }, 0);
  };

  return ipToNumber(ip1) < ipToNumber(ip2);
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

    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const currentRuleId = ref(null)
    const ruleFormRef = ref(null)

    // 表单数据
    const ruleForm = reactive({
      id: 0,
      desc: '',
      src_ip_start: 'any', 
      dst_ip: 'any',
      src_port: 'any',
      dst_port: 'any',
      protocol: 'tcp',
      originalProtocol: 'tcp', // 保存原始输入
      action: 'pass',
      expire_at: null,
      created_at: null,
      updated_at: null,
      text: null,
      domain: null
    })
    
    // 默认规则
    const defaultRule = reactive({
      action: 'pass',
      protocol: 'any',
      desc: '默认通过所有流量'
    })
    const ConfirmdefaultRule = reactive({
      action: 'pass',
      protocol: 'any',
      desc: '默认通过所有流量'
    })

    // 协议输入支持 0-256 数字或 protocolNumberToName 里的字符串
    const getProtocolNumber = (input) => {
      if (!input) throw new Error('协议不能为空');
      if (typeof input === 'number' || /^\d+$/.test(input)) {
        const num = parseInt(input, 10);
        if (num >= 0 && num <= 256) return num;
        throw new Error('协议号必须在0-256之间，或使用256表示any');
      }
      const name = input.toLowerCase();
      if (protocolNameToNumber.hasOwnProperty(name)) return protocolNameToNumber[name];
      const idx = protocolNumberToName.findIndex(n => n.toLowerCase() === name);
      if (idx !== -1) return idx;
      throw new Error('不支持的协议名称或协议号');
    }

    // 只有 TCP/UDP 支持端口
    const isPortProtocol = computed(() => {
      try {
        const protoNum = getProtocolNumber(ruleForm.protocol);
        return protoNum === 6 || protoNum === 17;
      } catch { return false; }
    });

    // 协议显示
    const getProtocolName = (protocolNumber) => {
      if (typeof protocolNumber === 'string' && /^\d+$/.test(protocolNumber)) {
        protocolNumber = parseInt(protocolNumber, 10);
      }
      return protocolNumberToName[protocolNumber] || protocolNumber;
    }

    // 协议变更处理
    const handleProtocolChange = (value) => {
      const protocol = value?.toLowerCase?.() || '';
      // 保存原始输入
      ruleForm.originalProtocol = value;
      
      // 如果协议不支持端口，清空端口值
      if (!isPortProtocol.value) {
        ruleForm.src_port = 'any';
        ruleForm.dst_port = 'any';
      }
      
      // 自动转换协议格式
      if (protocol && protocol !== 'any') {
        // 如果输入的是数字且在0-256范围内，自动映射为协议名（256表示any）
        if (/^\d+$/.test(protocol)) {
          const num = parseInt(protocol, 10);
          if (num >= 0 && num <= 255) {
            ruleForm.protocol = protocolNumberToName[num].toLowerCase();
            return;
          } else if (num === 256) {
            ruleForm.protocol = 'any';
            ruleForm.originalProtocol = '256';
            return;
          }
        }
        // 如果输入的是协议名，转为标准小写名
        if (protocolNameToNumber.hasOwnProperty(protocol)) {
          ruleForm.protocol = protocol;
        }
      } else if (!protocol || protocol === 'any') {
        // 留空或输入 any，设置为 any
        ruleForm.protocol = 'any';
        ruleForm.originalProtocol = '256';
      }
    }

    // 表单协议校验
    const validateProtocol = (rule, value) => {
      return new Promise((resolve, reject) => {
        if (!value) return resolve(); // 留空表示any，不验证
        try { getProtocolNumber(value); resolve(); }
        catch (e) { reject(new Error(e.message)); }
      });
    }

    // 构建规则载荷函数
    const buildRulePayload = (form) => {
      const payload = { action: form.action, desc: form.desc };
      
      // 使用原始输入获取协议号
      let protoNum;
      if (form.originalProtocol && /^\d+$/.test(form.originalProtocol)) {
        // 如果原始输入是数字，直接使用
        protoNum = parseInt(form.originalProtocol, 10);
      } else if (form.protocol === 'any' || !form.protocol) {
        // any 协议对应协议号 256
        protoNum = 256;
      } else {
        // 否则从协议名获取协议号
        protoNum = getProtocolNumber(form.protocol);
      }
      
      payload.protocol = protoNum;
      if (protoNum === 6 || protoNum === 17) {
        const srcPortRange = parsePortRange(form.src_port);
        if (srcPortRange[0] !== 0 || srcPortRange[1] !== 0) {
          if (protoNum === 6) payload.tcp_src = srcPortRange;
          if (protoNum === 17) payload.udp_src = srcPortRange;
        }
        const dstPortRange = parsePortRange(form.dst_port);
        if (dstPortRange[0] !== 0 || dstPortRange[1] !== 0) {
          if (protoNum === 6) payload.tcp_dst = dstPortRange;
          if (protoNum === 17) payload.udp_dst = dstPortRange;
        }
      }
      if (form.domain && form.domain !== 'any') payload.domain = form.domain;
      if (form.expire_at) payload.expire_at = form.expire_at.replace(' ', 'T');
      const srcIpRange = parseIpRange(form.src_ip_start);
      if (srcIpRange.error) throw new Error(`源IP地址错误: ${srcIpRange.error}`);
      if (srcIpRange.ipv4 && srcIpRange.ipv4[0] !== 'any') payload.src = srcIpRange.ipv4;
      if (srcIpRange.ipv6 && srcIpRange.ipv6[0] !== 'any') payload.src = srcIpRange.ipv6;
      const dstIpRange = parseIpRange(form.dst_ip);
      if (dstIpRange.error) throw new Error(`目标IP地址错误: ${dstIpRange.error}`);
      if (dstIpRange.ipv4 && dstIpRange.ipv4[0] !== 'any') payload.dst = dstIpRange.ipv4;
      if (dstIpRange.ipv6 && dstIpRange.ipv6[0] !== 'any') payload.dst = dstIpRange.ipv6;
      return payload;
    }

    // 判断IP地址是否有效
    const isValidIPv4 = (ip) => {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(ip)) return false;
      return ip.split('.').every(segment => {
        const num = parseInt(segment, 10);
        return num >= 0 && num <= 255;
      });
    }

    const isValidIPv6 = (ip) => {
      // 简化的IPv6验证
      const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv6Pattern.test(ip);
    }

    // 解析IP范围并自动识别IPv4/IPv6
    const parseIpRange = (input) => {
      if (!input || input === 'any') {
        return {
          ipv4: ['any', 'any'],
          ipv6: ['any', 'any']
        };
      }

      if (input.includes('-')) {
        const [start, end] = input.split('-').map(s => s.trim());
        
        // 检测两端是否都是IPv4
        if (isValidIPv4(start) && isValidIPv4(end)) {
          if (!isIPv4LessThan(start, end)) {
            return{
              ipv4: null,
              ipv6: null,
              error: 'IPv4 范围左侧必须小于右侧'
            }
          }
          return {
            ipv4: [start, end],
            ipv6: null
          };
        }
        
        // 检测两端是否都是IPv6
        if (isValidIPv6(start) && isValidIPv6(end)) {
          if (!isIPv6LessThan(start, end)) {
            return{
              ipv4: null,
              ipv6: null,
              error: 'IPv6 范围左侧必须小于右侧'
            }
          }
          return {
            ipv4: null,
            ipv6: [start, end]
          };
        }
        
        // 如果都不是，返回错误
        return {
          ipv4: null,
          ipv6: null,
          error: 'IP范围两端必须是相同类型的IP地址（IPv4或IPv6）'
        };
      } else {
        // 单个IP
        if (isValidIPv4(input)) {
          return {
            ipv4: [input, input],
            ipv6: null
          };
        } else if (isValidIPv6(input)) {
          return {
            ipv4: null,
            ipv6: [input, input]
          };
        } else {
          return {
            ipv4: null,
            ipv6: null,
            error: '请输入有效的IPv4或IPv6地址'
          };
        }
      }
    }

    // 表单验证规则
    const formRules = reactive({
      desc: [
        { required: true, message: '请输入规则描述', trigger: 'blur' },
        { min: 3, max: 50, message: '长度在3到50个字符', trigger: 'blur' }
      ],
      protocol: [
        { message: '请输入协议名称(TCP, UDP, ICMP, any等)或协议号(0-255)，留空表示any', trigger: 'blur' },
        { validator: validateProtocol, trigger: 'blur' }
      ],
      src_ip_start: [
        { required: true, message: '请输入源IP', trigger: 'blur' },
        { validator: validateIP, trigger: 'blur' }
      ],
      dst_ip: [
        { required: true, message: '请输入目的IP', trigger: 'blur' },
        { validator: validateIP, trigger: 'blur' }
      ],
      src_port: [
        { required: isPortProtocol, message: '请输入源端口', trigger: 'blur' },
        { validator: validatePort, trigger: 'blur', when: isPortProtocol}
      ],
      dst_port: [
        { required: isPortProtocol, message: '请输入目标端口', trigger: 'blur' },
        { validator: validatePort, trigger: 'blur', when: isPortProtocol}
      ],
      action: [
        { required: true, message: '请选择动作', trigger: 'change' }
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
        rule.desc?.toLowerCase().includes(query) ||
        rule.src_ip?.toLowerCase().includes(query) ||
        rule.dst_ip?.toLowerCase().includes(query) ||
        rule.protocol?.toLowerCase().includes(query) ||
        rule.src_port?.toLowerCase().includes(query) ||
        rule.dst_port?.toLowerCase().includes(query) ||
        rule.domain?.toLowerCase().includes(query) ||
        rule.action?.toLowerCase().includes(query)
      )
    })
  
    
    // 方法
    // 设置协议颜色
    const protocolTagType = (protocol) => {
      const types = {
        tcp: 'primary',
        6: 'primary',
        udp: 'info',
        17: 'info',
        icmp: 'warning',
        1: 'warning',
        any: 'success'
      }
      return types[protocol] || 'primary'
    }


    // 获取规则列表数据
    const fetchRules = async () => {
      loading.value = true
      try {
        const response = await api.getRules(currentPage.value, pageSize.value)
        const rulesData = response.data.rules || response.data || []
        
        // 转换协议号为协议名称，并处理字段名映射
        rules.value = rulesData.map(rule => {
          // 处理IP范围字段
          const src_ip = rule.src ? (rule.src[0] === rule.src[1] ? rule.src[0] : `${rule.src[0]}-${rule.src[1]}`) : 'any'
          const dst_ip = rule.dst ? (rule.dst[0] === rule.dst[1] ? rule.dst[0] : `${rule.dst[0]}-${rule.dst[1]}`) : 'any'
          
          // 处理端口字段
          let src_port = 'any'
          let dst_port = 'any'
          
          if (rule.tcp_src) {
            src_port = rule.tcp_src[0] === rule.tcp_src[1] ? rule.tcp_src[0].toString() : `${rule.tcp_src[0]}-${rule.tcp_src[1]}`
          } else if (rule.udp_src) {
            src_port = rule.udp_src[0] === rule.udp_src[1] ? rule.udp_src[0].toString() : `${rule.udp_src[0]}-${rule.udp_src[1]}`
          }
          
          if (rule.tcp_dst) {
            dst_port = rule.tcp_dst[0] === rule.tcp_dst[1] ? rule.tcp_dst[0].toString() : `${rule.tcp_dst[0]}-${rule.tcp_dst[1]}`
          } else if (rule.udp_dst) {
            dst_port = rule.udp_dst[0] === rule.udp_dst[1] ? rule.udp_dst[0].toString() : `${rule.udp_dst[0]}-${rule.udp_dst[1]}`
          }

          if (rule.protocol=== 'any' && rule.src_ip === 'any' && rule.dst_ip === 'any' && rule.src_port === 'any' && rule.dst_port === 'any') {
            console.warn('规则不能全部为 any:', rule)
          }
          
          return {
            ...rule,
            src_ip,
            dst_ip,
            src_port,
            dst_port,
            domain: rule.domain || 'any',
            protocol: getProtocolName(rule.protocol),
          }
        })
        
        totalRules.value = response.data.total || response.data.length || 0
      } catch (error) {
        ElMessage.error('获取规则列表失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 获取默认规则列表数据
    const fetchDefaultRule = async () => {
      try {
        const response = await api.getDefaultRule()
        const defaultRuleData = response.data || { action: 'pass', protocol: 0, desc: '默认放行所有流量' }
        
        // 转换协议号为协议名称
        const processedData = {
          ...defaultRuleData,
          protocol: getProtocolName(defaultRuleData.protocol)
        }
        
        Object.assign(defaultRule, processedData)
        Object.assign(ConfirmdefaultRule, processedData)
      } catch (error) {
        ElMessage.error('获取默认规则失败: ' + error.message)
        // 设置默认值
        defaultRule.action = 'pass'
        defaultRule.protocol = 'any'
        defaultRule.desc = '默认放行所有流量'
        ConfirmdefaultRule.action = 'pass'
        ConfirmdefaultRule.protocol = 'any'
        ConfirmdefaultRule.desc = '默认放行所有流量'
      }
    }

    // 定义初始表单数据
    const initialFormState = {
      id: 0,
      desc: '',
      src_ip_start: 'any', 
      dst_ip: 'any',
      src_port: 'any',
      dst_port: 'any',
      protocol: 'tcp',
      action: 'pass',
      expire_at: null,
      created_at: null,
      updated_at: null,
      text: null,
      domain: null
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
        src_ip_start: row.src_ip || 'any',
        dst_ip: row.dst_ip || 'any',
        src_port: row.src_port || 'any',
        dst_port: row.dst_port || 'any',
        protocol: getProtocolName(row.protocol) || 'tcp',
        action: row.action || 'pass',
        domain: row.domain || 'any',
        expire_at: row.expire_at || null
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
          await api.deleteRule(id)
          ElMessage.success('删除成功')
          fetchRules()
          fetchExpiredRules()
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

        // 检查所有字段是否为any
        const isAllAny = 
          (ruleForm.protocol === 'any' || !ruleForm.protocol) &&
          (ruleForm.src_ip_start === 'any' || !ruleForm.src_ip_start) &&
          (ruleForm.dst_ip === 'any' || !ruleForm.dst_ip) &&
          (ruleForm.src_port === 'any' || !ruleForm.src_port) &&
          (ruleForm.dst_port === 'any' || !ruleForm.dst_port);
        
        if (isAllAny) {
          ElMessage.error('规则不能全部为 any，请至少指定一个条件')
          return
            }
    
        // 自动转换表单为后端结构体格式
        const payload = buildRulePayload(ruleForm)
        console.log(payload)
        if (isEdit.value) {
          await api.updateRule(currentRuleId.value, payload)
          ElMessage.success('更新成功')
        } else {
          await api.addRule(payload)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchRules()
        fetchExpiredRules()
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
        
        // 构建发送给后端的默认规则数据（协议名称转换为协议号）
        const defaultRulePayload = {
          action: defaultRule.action,
          protocol: protocolNameToNumber[defaultRule.protocol] || 0,
          desc: defaultRule.desc
        }
        
        await api.saveDefaultRule(defaultRulePayload)
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

    watch(
    [currentPage, pageSize],  // 同时监听页码和页数
    () => {
      fetchRules();  // 参数变化时自动重新加载数据
    },
    { immediate: true }  // 初始化时立即执行一次
      );

    // 页容量设置
    const handleSizeChange = (val) => {
      pageSize.value = val
    }

    // 当前页面选择
    const handleCurrentChange = (val) => {
      currentPage.value = val
    }
    
    // 小黑屋方法
    // 获取所有规则并在前端筛选过期规则
    const fetchExpiredRules = async () => {
      blacklistLoading.value = true;
      try {
        const response = await api.getExpiredRules();
        const allRules = response.data.rules || response.data || [];
        const now = new Date();
        const days = blacklistForm.expire_days;

        expiredRules.value = allRules.filter(rule => {
          if (!rule.expire_at) return false;
          const expireDate = new Date(rule.expire_at);
          const diffDays = Math.floor((now - expireDate) / (1000 * 60 * 60 * 24));
          
          if (days === 'all') return true;
          return diffDays >= Number(days);
        }).map(rule => ({
          ...rule,
          src_ip: rule.src ? (rule.src[0] === rule.src[1] ? rule.src[0] : `${rule.src[0]}-${rule.src[1]}`) : 'any',
          dst_ip: rule.dst ? (rule.dst[0] === rule.dst[1] ? rule.dst[0] : `${rule.dst[0]}-${rule.dst[1]}`) : 'any',
          protocol: getProtocolName(rule.protocol)
        }));
      } catch (error) {
        console.error('获取过期规则失败:', error);
        ElMessage.error('获取规则失败: ' + (error.response?.data?.message || error.message));
      } finally {
        blacklistLoading.value = false;
      }
    }

    // 清除过期的规则列表
    const handleCleanExpired = async () => {
      try {
        await ElMessageBox.confirm(
          `确定要清理${blacklistForm.expire_days === 'all' ? '所有' : blacklistForm.expire_days + '天前'}的过期规则吗?`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const idsToDelete = expiredRules.value.map(rule => rule.id);
        if (idsToDelete.length === 0) {
          ElMessage.warning('没有可清理的过期规则');
          return;
        }

        try {
          const response = await api.cleanExpiredRules(idsToDelete);
          if (response.status === 200) {
            ElMessage.success(`成功清理${idsToDelete.length}条过期规则`);
            await Promise.all([fetchRules(), fetchExpiredRules()]);
          }
        } catch (error) {
          console.error('清理错误详情:', error);
          ElMessage.error(`清理失败: ${error.response?.data?.message || error.message}`);
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('用户确认后错误:', error);
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
        });
        
        // 添加调试信息
        console.log('Deleting rule with ID:', id);
        
        await api.deleteRule(id);
        ElMessage.success('强制删除成功');
        
        // 同时刷新规则列表和过期规则列表
        await Promise.all([
          fetchRules(),
          fetchExpiredRules()
        ]);
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Delete error details:', {
            error: error.response?.data || error.message
          });
          ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`);
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
      formRules,
      filteredRules,
      blacklistForm,
      expiredRules,
      blacklistLoading,
      getExpiredDaysText,
      Search,
      
      // 方法
      protocolTagType,
      isPortProtocol,
      handleProtocolChange,
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