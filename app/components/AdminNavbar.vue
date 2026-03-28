<template>
  <header class="nav">
    <div class="left">
      <button class="icon-btn" @click="open = !open" aria-label="Toggle menu">
        <span class="hamburger" :class="{ open }">
          <i></i><i></i><i></i>
        </span>
      </button>

      <NuxtLink to="/admin/dashboard" class="brand">
        <span class="logo-badge">WH</span>
        <div class="brand-text">
          <div class="title">Warehouse Backoffice</div>
          <div class="subtitle">ระบบคลังสินค้า (หลังบ้าน)</div>
        </div>
      </NuxtLink>
    </div>

    <div class="right">
      <div class="pill hide-sm">
        <span class="pill-label">Role</span>
        <span class="pill-value">{{role}}</span>
      </div>

      <div class="pill hide-sm">
        <span class="pill-label">User</span>
        <span v-if="user" class="pill-value mono">{{ user.email}}</span>
      </div>

      <button class="btn-logout" :disabled="loading" @click="logout">
        {{ loading ? '...' : 'Logout' }}
      </button>
    </div>

    <!-- Drawer -->
    <div v-if="open" class="overlay" @click="open = false"></div>

    <aside class="drawer" :class="{ open }">
      <div class="drawer-head">
        <div>
          <div class="drawer-title">เมนูหลังบ้าน</div>
          <div class="drawer-sub">จัดการคลัง • ออเดอร์ • การชำระเงิน</div>
        </div>
        <button class="icon-btn close" @click="open = false" aria-label="Close menu">
          ✕
        </button>
      </div>

      <nav class="menu">
        <!-- กลุ่ม: ภาพรวม -->
        <div class="group">
          <div class="group-title">ภาพรวม</div>
          <NuxtLink class="item" to="/admin/" @click="closeDrawer">
            <span class="bullet"></span> Dashboard
          </NuxtLink>
          <NuxtLink class="item" to="/" @click="closeDrawer">
            <span class="bullet"></span> Webpages
          </NuxtLink>
          <NuxtLink class="item" to="/admin/reports/daily-sales" @click="closeDrawer">
            <span class="bullet"></span> ยอดขายรายวัน
          </NuxtLink>
        </div>

        <!-- กลุ่ม: ออเดอร์ & ชำระเงิน -->
        <div class="group">
          <div class="group-title">ออเดอร์ & การชำระเงิน</div>
          <NuxtLink class="item" to="/admin/orders" @click="closeDrawer">
            <span class="bullet"></span> Orders (เว็บ/หน้าร้าน)
          </NuxtLink>
          <NuxtLink class="item" to="/admin/payments" @click="closeDrawer">
            <span class="bullet"></span> Payments (ตรวจสลิป)
          </NuxtLink>
          <NuxtLink class="item" to="/admin/shipping" @click="closeDrawer">
            <span class="bullet"></span> shipping (การจัดส่ง)
          </NuxtLink>



        </div>

        <!-- กลุ่ม: คลังวัตถุดิบ -->
        <div class="group">
          <div class="group-title">คลังวัตถุดิบ</div>
          <NuxtLink class="item" to="/admin/materials" @click="closeDrawer">
            <span class="bullet"></span> Materials
          </NuxtLink>
          <NuxtLink class="item" to="/admin/production" @click="closeDrawer">
            <span class="bullet"></span> รับเข้า (Receipts)
          </NuxtLink>
          <NuxtLink class="item" to="/admin/www" @click="closeDrawer">
            <span class="bullet"></span> เบิก/เคลื่อนไหว (Material)
          </NuxtLink>
        </div>

        <!-- กลุ่ม: คลังสินค้า (สินค้าสำเร็จรูป) -->
        <div class="group">
          <div class="group-title">คลังสินค้า (สินค้าสำเร็จรูป)</div>
          <NuxtLink class="item" to="/admin/products" @click="closeDrawer">
            <span class="bullet"></span> Products
          </NuxtLink>
          <NuxtLink class="item" to="/admin/production" @click="closeDrawer">
            <span class="bullet"></span> การผลิต (เพิ่มสต็อก)
          </NuxtLink>
          <NuxtLink class="item" to="/admin/categories" @click="closeDrawer">
            <span class="bullet"></span> การหมวดหมู่สินค้า
          </NuxtLink>
          <NuxtLink class="item" to="/admin/movements" @click="closeDrawer">
            <span class="bullet"></span> ขายออก/เคลื่อนไหว (Product)
          </NuxtLink>
        </div>

        <!-- กลุ่ม: ลูกค้า & ผู้ใช้ระบบ -->
        <div class="group">
          <div class="group-title">ลูกค้า & ผู้ใช้ระบบ</div>
          <NuxtLink class="item" to="/admin/members" @click="closeDrawer">
            <span class="bullet"></span> Members
          </NuxtLink>
          <NuxtLink class="item" to="/admin/users" @click="closeDrawer">
            <span class="bullet"></span> Users / Staff
          </NuxtLink>
        </div>
      </nav>

      <div class="drawer-foot">
        <div class="small">Signed in as</div>
        <div class="mono strong">{{ email || '-' }}</div>
        <div class="small">Role: <span class="strong">{{ roleLabel }}</span></div>
      </div>
    </aside>
  </header>
</template>

<script setup>
const client = useSupabaseClient()
const user = useSupabaseUser()
const open = ref(false)
const closeDrawer = () => {open.value = false}

// ดึง Role จาก Composable
const { role, isRoleLoading } = useUserRole()

// ⭐️ 1. เพิ่ม roleLabel แปลงค่า role เป็นข้อความภาษาไทย (แก้ Error แดง)
const roleLabel = computed(() => {
  if (role.value === 'admin') return 'ผู้ดูแลระบบ (Admin)'
  if (role.value === 'manager') return 'ผู้จัดการ (Manager)'
  if (role.value === 'staff') return 'พนักงาน (Staff)'
  return 'ไม่ทราบสถานะ'
})

// ⭐️ 2. เพิ่ม email สำหรับแสดงผลตรงด้านล่างของ Drawer
const email = computed(() => user.value?.email)

// ⭐️ 3. เพิ่มสถานะ loading สำหรับปุ่มกด
const loading = ref(false)

const isMenuOpen = ref(false)

watchEffect(() => {
  if (user.value) {
    console.log("ID ที่กำลังใช้หาข้อมูลคือ:", user.value.id)
  }
})

// ⭐️ 4. เปลี่ยนชื่อเป็น logout ให้ตรงกับ Template (@click="logout")
const logout = async () => {
  if (loading.value) return // กันกดรัว
  loading.value = true
  
  isMenuOpen.value = false 
  open.value = false // ปิดเมนู Drawer ด้วย

  try {
    // 1. สั่งออกจากระบบ Supabase
    const { error } = await client.auth.signOut()
    if (error) throw error
    
    // 2. ล้างแคชข้อมูลเก่า
    clearNuxtData()

    // 3. นำทางกลับไปที่หน้า Login
    navigateTo('/login')
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error.message)
    alert('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ===== Theme: Backoffice (Teal + Dark) ===== */
:root { color-scheme: light; }

.nav{
  position: sticky; top:0; z-index:50;
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  background: linear-gradient(90deg, #0b1220 0%, #0f1b2d 60%, #0b1220 100%);
  border-bottom:1px solid rgba(255,255,255,.08);
  color:#e5e7eb;
}

.left{ display:flex; align-items:center; gap:12px; }
.right{ display:flex; align-items:center; gap:10px; }

.brand{
  display:flex; align-items:center; gap:12px;
  text-decoration:none; color:#e5e7eb;
}
.logo-badge{
  width:40px; height:40px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  font-weight:950;
  background: linear-gradient(135deg, #14b8a6 0%, #22c55e 100%);
  color:#052019;
  box-shadow: 0 10px 18px rgba(20,184,166,.18);
}
.brand-text{ display:flex; flex-direction:column; gap:2px; }
.title{ font-weight:950; letter-spacing:.2px; }
.subtitle{ font-size:12px; color: rgba(229,231,235,.75); }

.icon-btn{
  width:42px; height:42px; border:none; background:rgba(255,255,255,.06);
  border-radius:12px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#e5e7eb;
}
.icon-btn:hover{ background:rgba(255,255,255,.10); }
.icon-btn.close{ background:rgba(0,0,0,.06); color:#111827; }
.icon-btn.close:hover{ background:rgba(0,0,0,.10); }

.hamburger{ position:relative; width:22px; height:16px; display:inline-block; }
.hamburger i{
  position:absolute; left:0; right:0; height:2px;
  background:#e5e7eb;
  border-radius:2px;
  transition:transform .2s ease, top .2s ease, opacity .2s ease;
}
.hamburger i:nth-child(1){ top:0; }
.hamburger i:nth-child(2){ top:7px; }
.hamburger i:nth-child(3){ top:14px; }
.hamburger.open i:nth-child(1){ top:7px; transform:rotate(45deg); }
.hamburger.open i:nth-child(2){ opacity:0; }
.hamburger.open i:nth-child(3){ top:7px; transform:rotate(-45deg); }

/* Pills */
.pill{
  display:flex; align-items:center; gap:8px;
  padding:8px 10px; border-radius:12px;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.08);
}
.pill-label{ font-size:11px; color: rgba(229,231,235,.7); }
.pill-value{ font-size:12px; font-weight:900; color:#e5e7eb; }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.btn-logout{
  border:none; border-radius:12px; padding:10px 12px;
  background: rgba(239,68,68,.95);
  color:#fff; font-weight:950; cursor:pointer;
}
.btn-logout:hover{ filter:brightness(1.02); }
.btn-logout:disabled{ opacity:.6; cursor:not-allowed; }

/* Overlay & Drawer */
.overlay{
  position:fixed; inset:0; z-index:55;
  background:rgba(0,0,0,.45);
}

.drawer{
  position:fixed; top:0; left:0; bottom:0; z-index:60;
  width:320px; background:#ffffff;
  border-right:1px solid #e5e7eb;
  transform:translateX(-102%);
  transition:transform .2s ease;
  display:flex; flex-direction:column;
}
.drawer.open{ transform:translateX(0); }

.drawer-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  padding:14px 14px;
  border-bottom:1px solid #e5e7eb;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
}
.drawer-title{ font-weight:950; color:#111827; }
.drawer-sub{ font-size:12px; color:#6b7280; margin-top:2px; }

/* Menu Groups */
.menu{ padding:12px; display:flex; flex-direction:column; gap:12px; }
.group{
  border:1px solid #e5e7eb;
  border-radius:14px;
  padding:10px;
  background:#ffffff;
}
.group-title{
  font-size:12px;
  font-weight:950;
  color:#0f766e;
  margin:2px 6px 8px;
  text-transform: uppercase;
  letter-spacing:.5px;
}
.item{
  display:flex; align-items:center; gap:10px;
  padding:10px 10px;
  border-radius:12px;
  text-decoration:none;
  color:#111827;
  font-weight:850;
}
.item:hover{ background:#f3f4f6; }
.bullet{
  width:10px; height:10px; border-radius:999px;
  background:#14b8a6;
  box-shadow: 0 6px 12px rgba(20,184,166,.18);
}

/* Footer */
.drawer-foot{
  margin-top:auto;
  padding:12px 14px;
  border-top:1px solid #e5e7eb;
  background:#fafafa;
}
.small{ font-size:12px; color:#6b7280; }
.strong{ font-weight:950; color:#111827; }

@media (max-width: 720px){
  .hide-sm{ display:none; }
}
</style>