// 后端API配置
export const API_BASE_URL = '/api'; // 使用本地代理

// API端点
export const API_ENDPOINTS = {
  // 状态相关
  STATUS: '/status',
  STATUS_RULE_MATCH: '/status/rule_match',
  STATUS_TOP_IP: '/status/top_ip',
  STATUS_TCP_CONNECTIONS: '/status/tcp_connections',
  STATUS_LOGS: '/status/logs',
  
  // 规则相关
  RULES: '/rules',
  RULES_DEFAULT: '/rules/default',
  
  // 健康检查
  HEALTH: '/health'
}; 

export const protocolNumberToName = [
  "HOPOPT",       // 0
  "ICMP",         // 1
  "IGMP",         // 2
  "GGP",          // 3
  "IPv4",         // 4
  "ST",           // 5
  "TCP",          // 6
  "CBT",          // 7
  "EGP",          // 8
  "IGP",          // 9
  "BBN-RCC-MON",  // 10
  "NVP-II",       // 11
  "PUP",          // 12
  "ARGUS",        // 13
  "EMCON",        // 14
  "XNET",         // 15
  "CHAOS",        // 16
  "UDP",          // 17
  "MUX",          // 18
  "DCN-MEAS",     // 19
  "HMP",          // 20
  "PRM",          // 21
  "XNS-IDP",      // 22
  "TRUNK-1",      // 23
  "TRUNK-2",      // 24
  "LEAF-1",       // 25
  "LEAF-2",       // 26
  "RDP",          // 27
  "IRTP",         // 28
  "ISO-TP4",      // 29
  "NETBLT",       // 30
  "MFE-NSP",      // 31
  "MERIT-INP",    // 32
  "DCCP",         // 33
  "3PC",          // 34
  "IDPR",         // 35
  "XTP",          // 36
  "DDP",          // 37
  "IDPR-CMTP",    // 38
  "TP++",         // 39
  "IL",           // 40
  "IPv6",         // 41
  "SDRP",         // 42
  "IPv6-Route",   // 43
  "IPv6-Frag",    // 44
  "IDRP",         // 45
  "RSVP",         // 46
  "GRE",          // 47
  "DSR",          // 48
  "BNA",          // 49
  "ESP",          // 50
  "AH",           // 51
  "I-NLSP",       // 52
  "SWIPE",        // 53
  "NARP",         // 54
  "MOBILE",       // 55
  "TLSP",         // 56
  "SKIP",         // 57
  "IPv6-ICMP",    // 58
  "IPv6-NoNxt",   // 59
  "IPv6-Opts",    // 60
  "any host internal protocol",             // 61 
  "CFTP",         // 62
  "any local network",             // 63 
  "SAT-EXPAK",    // 64
  "KRYPTOLAN",    // 65
  "RVD",          // 66
  "IPPC",         // 67
  "any distributed file system",             // 68 
  "SAT-MON",      // 69
  "VISA",         // 70
  "IPCV",         // 71
  "CPNX",         // 72
  "CPHB",         // 73
  "WSN",          // 74
  "PVP",          // 75
  "BR-SAT-MON",   // 76
  "SUN-ND",       // 77
  "WB-MON",       // 78
  "WB-EXPAK",     // 79
  "ISO-IP",       // 80
  "VMTP",         // 81
  "SECURE-VMTP",  // 82
  "VINES",        // 83
  "IPTM",          // 84
  "NSFNET-IGP",   // 85
  "DGP",          // 86
  "TCF",          // 87
  "EIGRP",        // 88
  "OSPFIGP",         // 89
  "Sprite-RPC",   // 90
  "LARP",         // 91
  "MTP",          // 92
  "AX.25",        // 93
  "IPIP",         // 94
  "MICP",         // 95
  "SCC-SP",       // 96
  "ETHERIP",      // 97
  "ENCAP",        // 98
  "any private encryption scheme",             // 99 
  "GMTP",         // 100
  "IFMP",         // 101
  "PNNI",         // 102
  "PIM",          // 103
  "ARIS",         // 104
  "SCPS",         // 105
  "QNX",          // 106
  "A/N",          // 107
  "IPComp",       // 108
  "SNP",          // 109
  "Compaq-Peer",  // 110
  "IPX-in-IP",    // 111
  "VRRP",         // 112
  "PGM",          // 113
  "any 0-hop protocol	",             // 114 
  "L2TP",         // 115
  "DDX",          // 116
  "IATP",         // 117
  "STP",          // 118
  "SRP",          // 119
  "UTI",          // 120
  "SMP",          // 121
  "SM",           // 122
  "PTP",          // 123
  "ISIS over IPv4",         // 124
  "FIRE",         // 125
  "CRTP",         // 126
  "CRUDP",        // 127
  "SSCOPMCE",     // 128
  "IPLT",         // 129
  "SPS",          // 130
  "PIPE",         // 131
  "SCTP",         // 132
  "FC",           // 133
  "RSVP-E2E-IGNORE", // 134
  "Mobility Header", // 135
  "UDPLite",      // 136
  "MPLS-in-IP",   // 137
  "manet",        // 138
  "HIP",          // 139
  "Shim6",        // 140
  "WESP",         // 141
  "ROHC",         // 142
  "Ethernet",     // 143
  "AGGFRAG",      // 144
  "NSH",          // 145
  "Homa",         // 146
  "BIT-EMU",      // 147
  ...Array(105).fill("Unassigned"), // 148-252
  "Experimental", // 253
  "Experimental", // 254
  "Reserved",      // 255
  "any"
];

export const protocolNameToNumber = {
  "hopopt": 0,
  "icmp": 1,
  "igmp": 2,
  "ggp": 3,
  "ipv4": 4,
  "st": 5,
  "tcp": 6,
  "cbt": 7,
  "egp": 8,
  "igp": 9,
  "bbn-rcc-mon": 10,
  "nvp-ii": 11,
  "pup": 12,
  "argus": 13,
  "emcon": 14,
  "xnet": 15,
  "chaos": 16,
  "udp": 17,
  "mux": 18,
  "dcn-meas": 19,
  "hmp": 20,
  "prm": 21,
  "xns-idp": 22,
  "trunk-1": 23,
  "trunk-2": 24,
  "leaf-1": 25,
  "leaf-2": 26,
  "rdp": 27,
  "irtp": 28,
  "iso-tp4": 29,
  "netblt": 30,
  "mfe-nsp": 31,
  "merit-inp": 32,
  "dccp": 33,
  "3pc": 34,
  "idpr": 35,
  "xtp": 36,
  "ddp": 37,
  "idpr-cmtp": 38,
  "tp++": 39,
  "il": 40,
  "ipv6": 41,
  "sdrp": 42,
  "ipv6-route": 43,
  "ipv6-frag": 44,
  "idrp": 45,
  "rsvp": 46,
  "gre": 47,
  "dsr": 48,
  "bna": 49,
  "esp": 50,
  "ah": 51,
  "i-nlsp": 52,
  "swipe": 53,
  "narp": 54,
  "mobile": 55,
  "tlsp": 56,
  "skip": 57,
  "ipv6-icmp": 58,
  "ipv6-nonxt": 59,
  "ipv6-opts": 60,
  "any host internal protocol": 61,
  "cftp": 62,
  "any local network": 63,
  "sat-expak": 64,
  "kryptolan": 65,
  "rvd": 66,
  "ippc": 67,
  "any distributed file system": 68,
  "sat-mon": 69,
  "visa": 70,
  "ipcv": 71,
  "cpnx": 72,
  "cphb": 73,
  "wsn": 74,
  "pvp": 75,
  "br-sat-mon": 76,
  "sun-nd": 77,
  "wb-mon": 78,
  "wb-expak": 79,
  "iso-ip": 80,
  "vmtp": 81,
  "secure-vmtp": 82,
  "vines": 83,
  "iptm": 84,
  "nsfnet-igp": 85,
  "dgp": 86,
  "tcf": 87,
  "eigrp": 88,
  "ospfigp": 89,
  "sprite-rpc": 90,
  "larp": 91,
  "mtp": 92,
  "ax.25": 93,
  "ipip": 94,
  "micp": 95,
  "scc-sp": 96,
  "etherip": 97,
  "encap": 98,
  "any private encryption scheme": 99,
  "gmtp": 100,
  "ifmp": 101,
  "pnni": 102,
  "pim": 103,
  "aris": 104,
  "scps": 105,
  "qnx": 106,
  "a/n": 107,
  "ipcomp": 108,
  "snp": 109,
  "compaq-peer": 110,
  "ipx-in-ip": 111,
  "vrrp": 112,
  "pgm": 113,
  "any 0-hop protocol": 114,
  "l2tp": 115,
  "ddx": 116,
  "iatp": 117,
  "stp": 118,
  "srp": 119,
  "uti": 120,
  "smp": 121,
  "sm": 122,
  "ptp": 123,
  "isis over ipv4": 124,
  "fire": 125,
  "crtp": 126,
  "crudp": 127,
  "sscopmce": 128,
  "iplt": 129,
  "sps": 130,
  "pipe": 131,
  "sctp": 132,
  "fc": 133,
  "rsvp-e2e-ignore": 134,
  "mobility header": 135,
  "udplite": 136,
  "mpls-in-ip": 137,
  "manet": 138,
  "hip": 139,
  "shim6": 140,
  "wesp": 141,
  "rohc": 142,
  "ethernet": 143,
  "aggfrag": 144,
  "nsh": 145,
  "homa": 146,
  "bit-emu": 147,
  "unassigned": 148,
  "experimental": 253,
  "reserved": 255,
  "any": 256
};
