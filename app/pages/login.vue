<template>
  <div class="login-container">
    <div class="form-box">
      <h2>Warehouse System</h2>
      <p class="subtitle">กรุณาเข้าสู่ระบบเพื่อจัดการคลังสินค้า</p>
      
      <input v-model="email" type="email" placeholder="Email" class="input-field" />
      <input v-model="password" type="password" placeholder="Password" class="input-field" />
      
      <input v-if="isRegistering" v-model="phone" type="text" placeholder="เบอร์โทรศัพท์" class="input-field" />

      <div class="buttons">
        <button v-if="!isRegistering" @click="handleAction('login')" :disabled="loading" class="btn-login">
          {{ loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ' }}
        </button>
        
        <button v-if="isRegistering" @click="handleAction('register')" :disabled="loading" class="btn-register">
          {{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันการสมัคร' }}
        </button>
      </div>

      <div class="toggle-link">
        <button @click="isRegistering = !isRegistering" class="btn-link">
          {{ isRegistering ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่' }}
        </button>
      </div>
    </div>
  </div>
</template>

<<script setup>
const client = useSupabaseClient()
const email = ref('')
const password = ref('')
const phone = ref('')
const loading = ref(false)
const isRegistering = ref(false)

const handleAction = async (type) => {
  if (!email.value || !password.value) return alert('กรุณากรอกข้อมูลให้ครบ')
  
  loading.value = true
  try {
    if (type === 'login') {
      // 1. การเข้าสู่ระบบ
      const { error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      
      // ⭐️ บังคับล้างแคชข้อมูลเดิมทั้งหมดของ Nuxt ทันทีที่ล็อกอินผ่าน
      clearNuxtData() 
      
      alert('เข้าสู่ระบบสำเร็จ!')
      navigateTo('/') 
      
    } else {
      // 2. การสมัครสมาชิก
      const { data, error: authError } = await client.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: 'New Member',
            phone: phone.value
          }
        }
      })
      if (authError) throw authError

      // ⭐️ บังคับล้างแคชข้อมูลเดิมทั้งหมดของ Nuxt ทันทีที่สมัครและล็อกอินอัตโนมัติผ่าน
      clearNuxtData()

      alert('สมัครสมาชิกสำเร็จ! ข้อมูลโปรไฟล์และรหัสสมาชิกถูกสร้างแล้ว')
      navigateTo('/') 
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message)
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; background-color: #f9fafb; }
.form-box { display: flex; flex-direction: column; gap: 12px; width: 350px; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
h2 { text-align: center; color: #111827; margin-bottom: 0; }
.subtitle { text-align: center; color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem; }
.input-field { padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
.buttons { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
button { padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; border: none; transition: background 0.2s; }
.btn-login { background-color: #4f46e5; color: white; }
.btn-login:hover { background-color: #4338ca; }
.btn-register { background-color: #10b981; color: white; }
.btn-register:hover { background-color: #059669; }
.toggle-link { text-align: center; margin-top: 1rem; }
.btn-link { background: none; color: #4f46e5; font-size: 0.875rem; text-decoration: underline; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>