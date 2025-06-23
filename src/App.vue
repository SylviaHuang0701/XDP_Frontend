<script>
export default {
  name: 'App',
}
</script>

<template>
  <div>
    <nav>
      <router-link to="/status">状态监控</router-link> |
      <router-link to="/rules">规则管理</router-link> |
      <router-link to="/logs">日志记录</router-link>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
nav {
  margin-bottom: 1em;
}
nav a {
  margin: 0 0.5em;
  text-decoration: none;
  color: #42b983;
}
nav a.router-link-exact-active {
  font-weight: bold;
  color: #35495e;
}
</style>
