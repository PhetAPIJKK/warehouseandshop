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
        <NuxtLink to="/cart" class="nav-cart-btn">
          🛒 ตะกร้าสินค้า
          <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
        </NuxtLink>
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
            <button @click="isMenuOpen = false" class="close-btn">✕</button>
          </div>

          <div class="menu-list">
            <NuxtLink to="/profile" class="menu-item" @click="isMenuOpen = false">
              👤 แก้ไขโปรไฟล์
            </NuxtLink>

            <NuxtLink to="/orders" class="menu-item" @click="isMenuOpen = false">
              📋 ประวัติการสั่งซื้อ
            </NuxtLink>

            <div v-if="role === 'admin'" class="admin-section">
              <div class="menu-header-sub">
                <h3>จัดการสินค้า</h3>
              </div>
              <NuxtLink to="/admin" class="menu-item admin-link" @click="isMenuOpen = false">
                📊 Dashboard คลังสินค้า
              </NuxtLink>
            </div>

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

// ⭐️ แก้ไข: ต้องมีวงเล็บ () หลัง useCart
const { cartItemCount, clearCart } = useCart()
const { role, isRoleLoading } = useUserRole()

const isMenuOpen = ref(false)

// ใช้ watchEffect เพื่อ log ค่า ID ทันทีที่มีการเปลี่ยนแปลง
watchEffect(() => {
  if (user.value) {
    console.log("ID ที่กำลังใช้หาข้อมูลคือ:", user.value.id)
  }
})

// ใน <script setup> ของ Navbar.vue

const handleLogout = async () => {
  // 1. ปิดเมนูทันที
  isMenuOpen.value = false 

  try {
    // 2. สั่ง Logout จาก Supabase Auth
    const { error } = await client.auth.signOut()
    if (error) throw error

    // 3. ⭐️ ล้างข้อมูลในตะกร้าสินค้า (ป้องกัน User คนถัดไปเห็นของในตะกร้าเรา)
    if (clearCart) clearCart()

    // 4. ⭐️ ล้างแคช useAsyncData ทั้งหมด (รวมถึง user-orders-list ที่เราเพิ่งทำไป)
    // การไม่ใส่ parameter ใน clearNuxtData() จะเป็นการล้างแคชทุกอย่างในแอป
    clearNuxtData() 

    // 5. นำทางไปหน้า Login
    await navigateTo('/login')
    
    // 6. (Optional) Reload หน้าเว็บเพื่อให้ State ทุกอย่าง Clean 100%
    // window.location.reload() 

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error.message)
    alert("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง")
  }
}
</script>

<style scoped>
/* --- ส่วนเดิมของคุณที่ปรับแต่งเล็กน้อยให้เนียนขึ้น --- */
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

.nav-left { display: flex; align-items: center; gap: 1rem; }
.hamburger-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #4f46e5; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #4f46e5; font-size: 1.2rem; text-decoration: none; }

.nav-right { display: flex; align-items: center; gap: 2rem; }
.nav-links { display: flex; gap: 1.5rem; align-items: center; }
.nav-link { text-decoration: none; color: #666; font-size: 0.95rem; font-weight: 500; }
.nav-link:hover { color: #4f46e5; }

/* ตะกร้าสินค้า */
.nav-cart-btn {
  position: relative;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cart-badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 99px;
  position: absolute;
  top: -8px;
  right: -8px;
}

.btn-login { background: #4f46e5; color: white; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.user-email { color: #4f46e5; font-weight: 600; font-size: 0.9rem; }

/* Sidebar Drawer */
.menu-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 2000; }
.menu-drawer { width: 280px; height: 100%; background: white; padding: 1.5rem; box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; }
.menu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
.menu-header h3 { font-size: 1.1rem; margin: 0; color: #1f2937; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #9ca3af; }

.menu-header-sub { margin: 1.5rem 0 0.5rem 0; padding-top: 1rem; border-top: 1px solid #f3f4f6; }
.menu-header-sub h3 { font-size: 0.9rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }

.menu-item {
  display: block;
  padding: 12px;
  text-decoration: none;
  color: #4b5563;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 4px;
}
.menu-item:hover { background: #f3f4f6; color: #4f46e5; }
.admin-link { color: #4f46e5; font-weight: 600; }

.logout { color: #ef4444; margin-top: auto; border-top: 1px solid #eee; padding-top: 1rem; border-radius: 0; }
.logout:hover { background: #fef2f2; color: #dc2626; }

/* Animation */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>