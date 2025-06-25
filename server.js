const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据
let rules = [
  { id: 1, desc: '允许本地访问', src_ip: '192.168.1.0/24', dst_ip: 'any', action: 'pass', expire_at: null },
  { id: 2, desc: '禁止80端口', src_ip: 'any', dst_ip: 'any', dst_port: 80, action: 'drop', expire_at: '2024-06-02T00:00:00Z' },
  { id: 3, desc: '禁止443端口', src_ip: 'any', dst_ip: 'any', dst_port: 443, action: 'drop', expire_at: null }
];

let defaultRule = { action: 'pass', desc: '默认放行' };

// 添加流量趋势数据
let trafficHistory = [];

// 生成模拟流量数据
const generateTrafficData = () => {
  const now = new Date();
  const data = {
    time: now.toISOString(),
    bandwidth: Math.floor(Math.random() * 1000000) + 100000,
    packets: Math.floor(Math.random() * 10000) + 1000
  };
  
  trafficHistory.push(data);
  
  // 保持最近24小时的数据
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  trafficHistory = trafficHistory.filter(item => new Date(item.time) > oneDayAgo);
  
  return data;
};

// 初始化一些历史数据
for (let i = 23; i >= 0; i--) {
  const time = new Date(Date.now() - i * 60 * 60 * 1000);
  trafficHistory.push({
    time: time.toISOString(),
    bandwidth: Math.floor(Math.random() * 1000000) + 100000,
    packets: Math.floor(Math.random() * 10000) + 1000
  });
}

// /status/ 相关接口
app.get('/status', (req, res) => {
  const currentTraffic = generateTrafficData();
  
  res.json({
    pass: Math.floor(Math.random() * 10000) + 5000,
    abort: Math.floor(Math.random() * 500) + 100,
    drop: Math.floor(Math.random() * 200) + 50,
    bandwidth: currentTraffic.bandwidth,
    packets: currentTraffic.packets,
    timestamp: new Date().toISOString()
  });
});

app.get('/status/rule_match', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  
  const matches = [
    {
      time: '2024-06-01T12:34:56Z',
      rule_id: 3,
      rule_desc: '禁止80端口',
      src_ip: '192.168.1.100',
      dst_ip: '8.8.8.8',
      action: 'drop'
    },
    {
      time: '2024-06-01T12:35:56Z',
      rule_id: 1,
      rule_desc: '允许本地访问',
      src_ip: '192.168.1.101',
      dst_ip: '8.8.4.4',
      action: 'pass'
    },
    {
      time: '2024-06-01T12:36:56Z',
      rule_id: 2,
      rule_desc: '禁止443端口',
      src_ip: '192.168.1.102',
      dst_ip: '1.1.1.1',
      action: 'drop'
    }
  ];

  res.json({
    page: page,
    page_size: pageSize,
    total: matches.length,
    matches: matches
  });
});

app.get('/status/top_ip', (req, res) => {
  const col = req.query.col || 'bytes';
  
  const top = [
    { ip: '192.168.1.100', bytes: 123456, packets: 789 },
    { ip: '192.168.1.101', bytes: 654321, packets: 456 },
    { ip: '192.168.1.102', bytes: 987654, packets: 123 }
  ];

  res.json({
    col: col,
    top: top
  });
});

app.get('/status/tcp_connections', (req, res) => {
  const connections = [
    {
      src_ip: '192.168.1.100',
      src_port: 12345,
      dst_ip: '8.8.8.8',
      dst_port: 80,
      state: 'ESTABLISHED'
    },
    {
      src_ip: '192.168.1.101',
      src_port: 23456,
      dst_ip: '8.8.4.4',
      dst_port: 443,
      state: 'SYN_SENT'
    },
    {
      src_ip: '192.168.1.102',
      src_port: 34567,
      dst_ip: '1.1.1.1',
      dst_port: 53,
      state: 'ESTABLISHED'
    }
  ];

  res.json({
    connections: connections
  });
});


app.get('/status/logs', (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  
  // 模拟日志数据
  const allLogs = [
    {
      time: '2024-06-01T12:34:56Z',
      type: 'drop',
      content: '192.168.1.100 -> 8.8.8.8:80 被规则3阻断'
    },
    {
      time: '2024-06-01T12:35:56Z',
      type: 'pass',
      content: '192.168.1.101 -> 8.8.4.4:443 放行'
    },
    {
      time: '2024-06-01T12:36:56Z',
      type: 'drop',
      content: '192.168.1.102 -> 1.1.1.1:443 被规则2阻断'
    },
    {
      time: '2024-06-02T08:15:30Z',
      type: 'drop',
      content: '192.168.1.103 -> 1.1.1.1:53 被规则5阻断'
    },
    {
      time: '2024-06-03T14:22:10Z',
      type: 'pass',
      content: '192.168.1.104 -> 9.9.9.9:53 放行'
    },
    {
      time: '2024-06-04T09:45:12Z',
      type: 'drop',
      content: '192.168.1.105 -> 8.8.8.8:443 被规则2阻断'
    }
  ];

  // 根据时间范围筛选日志
  let filteredLogs = allLogs;
  
  if (from && to) {
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();
    
    filteredLogs = allLogs.filter(log => {
      const logTime = new Date(log.time).getTime();
      return logTime >= fromTime && logTime <= toTime;
    });
  }

  res.json({
    logs: filteredLogs
  });
});

// /rules/ 相关接口
app.get('/rules', (req, res) => {
  res.json({
    rules: rules
  });
});

app.put('/rules', (req, res) => {
  const newRule = req.body;
  const id = Math.max(...rules.map(r => r.id)) + 1;
  
  const rule = {
    id: id,
    desc: newRule.desc || '新规则',
    src_ip: newRule.src_ip || 'any',
    dst_ip: newRule.dst_ip || 'any',
    action: newRule.action || 'drop',
    expire_at: newRule.expire_at || null
  };
  
  rules.push(rule);
  
  res.json(rule);
});

app.delete('/rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = rules.findIndex(r => r.id === id);
  
  if (index !== -1) {
    rules.splice(index, 1);
    res.json({
      success: true,
      deleted_id: id
    });
  } else {
    res.status(404).json({
      success: false,
      message: '规则不存在'
    });
  }
});

app.put('/rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const rule = rules.find(r => r.id === id);
  
  if (rule) {
    Object.assign(rule, req.body);
    res.json(rule);
  } else {
    res.status(404).json({
      success: false,
      message: '规则不存在'
    });
  }
});

app.get('/rules/default', (req, res) => {
  res.json({
    default_rule: defaultRule
  });
});

app.put('/rules/default', (req, res) => {
  defaultRule = req.body.default_rule;
  res.json({
    default_rule: defaultRule
  });
});

// 新增接口：获取流量趋势数据
app.get('/status/traffic_trend', (req, res) => {
  const hours = parseInt(req.query.hours) || 1;
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  
  const filteredData = trafficHistory.filter(item => 
    new Date(item.time) >= startTime
  );
  
  res.json({
    hours: hours,
    data: filteredData
  });
});

// 获取连接统计
app.get('/status/connection_stats', (req, res) => {
  const connections = [
    { src_ip: '192.168.1.100', src_port: 12345, dst_ip: '8.8.8.8', dst_port: 80, state: 'ESTABLISHED' },
    { src_ip: '192.168.1.101', src_port: 23456, dst_ip: '8.8.4.4', dst_port: 443, state: 'SYN_SENT' },
    { src_ip: '192.168.1.102', src_port: 34567, dst_ip: '1.1.1.1', dst_port: 53, state: 'ESTABLISHED' },
    { src_ip: '192.168.1.103', src_port: 45678, dst_ip: '9.9.9.9', dst_port: 53, state: 'TIME_WAIT' },
    { src_ip: '192.168.1.104', src_port: 56789, dst_ip: '1.0.0.1', dst_port: 80, state: 'CLOSE_WAIT' }
  ];
  
  const stats = {
    total: connections.length,
    established: connections.filter(c => c.state === 'ESTABLISHED').length,
    synSent: connections.filter(c => c.state === 'SYN_SENT').length,
    timeWait: connections.filter(c => c.state === 'TIME_WAIT').length,
    closeWait: connections.filter(c => c.state === 'CLOSE_WAIT').length
  };
  
  res.json(stats);
});

// 获取活跃规则数量
app.get('/status/active_rules', (req, res) => {
  const activeRules = rules.filter(rule => {
    if (!rule.expire_at) return true;
    return new Date(rule.expire_at) > new Date();
  });
  
  res.json({
    total: rules.length,
    active: activeRules.length,
    expired: rules.length - activeRules.length
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 