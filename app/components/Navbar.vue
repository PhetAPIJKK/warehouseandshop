<template>
  <nav class="navbar-container">
    <div class="nav-left">
      <button v-if="user" @click="isMenuOpen = !isMenuOpen" class="hamburger-btn">
        ☰
      </button>

      <div class="brand">
        <span class="logo-icon">📦</span>
        <span class="logo-text">WAREHOUSE</span>
      </div>
    </div>

    <div class="nav-right">
      <div class="nav-links">
        <NuxtLink to="/" class="nav-link">หน้าแรก</NuxtLink>
        <NuxtLink to="/products" class="nav-link">สินค้า</NuxtLink>
      </div>

      <div class="auth-section">
        <span v-if="user" class="user-email">{{ user.email }}</span>
        <NuxtLink v-else to="/login" class="btn-login">เข้าสู่ระบบ</NuxtLink>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false">
        <div class="menu-drawer" @click.stop>
          <div class="menu-header">
            <h3>จัดการบัญชี</h3>
            <button @click="isMenuOpen = false">✕</button>
          </div>
          <div class="menu-list">
            <NuxtLink v-if="role == 'admin','staff'" to="/admin" class="menu-item admin-link" @click="isMenuOpen = false">
              📊 Dashboard คลังสินค้า
            </NuxtLink>

            <NuxtLink to="/profile" class="menu-item" @click="isMenuOpen = false">
              👤 แก้ไขโปรไฟล์
            </NuxtLink>
            

            <button @click="handleLogout" class="menu-item logout">
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
const client = useSupabaseClient()
const user = useSupabaseUser()

// เรียกใช้งาน Composable ที่เราสร้างไว้
const { role, isRoleLoading } = useUserRole()

const isMenuOpen = ref(false)

// ใช้ watchEffect เพื่อ log ค่า ID ทันทีที่มีการเปลี่ยนแปลง
watchEffect(() => {
  if (user.value) {
    console.log("ID ที่กำลังใช้หาข้อมูลคือ:", user.value.id)
  }
})

// ฟังก์ชันสำหรับล็อกเอาต์
const handleLogout = async () => {
  isMenuOpen.value = false // ปิดการแสดงผลเมนู (ถ้ามีการใช้งานตัวแปรนี้)

  // 1. สั่งออกจากระบบ Supabase
  const { error } = await client.auth.signOut()
  
  if (!error) {
    // 2. ⭐️ บังคับล้างแคชข้อมูลเก่าทั้งหมด (ลบ Role และข้อมูล Profile ออกจากหน่วยความจำ Nuxt ทันที)
    clearNuxtData()

    // 3. นำทางกลับไปที่หน้า Login
    navigateTo('/login')
  } else {
    console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error.message)
  }
}
</script>




<style scoped>
.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 5%;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4f46e5;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #4f46e5;
  font-size: 1.2rem;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

.nav-link:hover {
  color: #4f46e5;
}

.btn-login {
  background: #4f46e5;
  color: white;
  padding: 8px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.user-email {
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Sidebar/Menu Styles */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.menu-drawer {
  width: 280px;
  height: 100%;
  background: white;
  padding: 2rem 1.5rem;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px;
  text-decoration: none;
  color: #333;
  border-radius: 8px;
  background: none;
  border: none;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
}

.menu-item:hover {
  background: #f8f9fa;
  color: #4f46e5;
}

.logout {
  color: #ef4444;
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

/* Animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>