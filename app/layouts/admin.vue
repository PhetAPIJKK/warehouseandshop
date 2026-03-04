<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">📦 WAREHOUSE ADMIN</div>
      <nav class="sidebar-nav">
        <NuxtLink to="/dashboard" class="nav-item">📊 ภาพรวมระบบ</NuxtLink>
        <NuxtLink to="/dashboard/products" class="nav-item">📦 จัดการสินค้า</NuxtLink>
        <NuxtLink to="/dashboard/orders" class="nav-item">📜 รายการสั่งซื้อ</NuxtLink>
        <NuxtLink to="/dashboard/users" class="nav-item">👥 จัดการสมาชิก</NuxtLink>
      </nav>
      <button @click="handleLogout" class="btn-logout">ออกจากระบบ</button>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <span>ยินดีต้อนรับ, {{ user?.email }}</span>
      </header>
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const { logout } = useAuth()
const handleLogout = async () => await logout()
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f4f7f6; }
.sidebar { width: 260px; background: #1e293b; color: white; padding: 2rem 1rem; display: flex; flex-direction: column; }
.sidebar-brand { font-size: 1.2rem; font-weight: 800; margin-bottom: 2rem; color: #38bdf8; text-align: center; }
.nav-item { display: block; padding: 12px 15px; color: #cbd5e1; text-decoration: none; border-radius: 8px; margin-bottom: 5px; }
.nav-item:hover, .router-link-active { background: #334155; color: white; }
.admin-main { flex: 1; display: flex; flex-direction: column; }
.admin-topbar { background: white; padding: 1rem 2rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
.admin-content { padding: 2rem; }
.btn-logout { margin-top: auto; padding: 10px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; }
</style>