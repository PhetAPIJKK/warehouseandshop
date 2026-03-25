<template>
  <div class="payment-container">
    <div class="form-card">
      <h1 class="title" style="text-align: center;">💳 แจ้งชำระเงิน</h1>

      <div v-if="loading" class="loading-state">กำลังดึงข้อมูลคำสั่งซื้อ...</div>
      
      <div v-else-if="!order" class="error-state">
        <p>ไม่พบข้อมูลคำสั่งซื้อนี้ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
        <NuxtLink to="/orders" class="btn-link">กลับไปที่หน้าประวัติการสั่งซื้อ</NuxtLink>
      </div>

      <div v-else>
        <div class="order-summary">
          <div class="summary-row">
            <span>หมายเลขคำสั่งซื้อ:</span>
            <span class="font-bold">{{ order.order_no }}</span>
          </div>
          <div class="summary-row">
            <span>ยอดที่ต้องชำระ:</span>
            <span class="total-amount">฿{{ order.total_amount?.toLocaleString() }}</span>
          </div>
        </div>

        <div class="bank-details">
          <h3>ข้อมูลบัญชีสำหรับโอนเงิน</h3>
          <p>ธนาคารกสิกรไทย (KBANK)</p>
          <p class="font-bold bank-account-no">123-4-56789-0</p>
          <p>ชื่อบัญชี: บจก. โกดังสินค้าของเรา</p>
        </div>

        <div class="upload-section">
          <label class="upload-label">อัปโหลดหลักฐานการโอนเงิน (สลิป)</label>
          <input type="file" @change="handleFileChange" accept="image/*" class="input-field" />

          <div v-if="previewUrl" class="slip-preview-container">
            <img :src="previewUrl" alt="Slip Preview" class="slip-preview" />
          </div>
        </div>

        <button 
          @click="submitPayment" 
          class="btn-primary" 
          :disabled="isSubmitting || !selectedFile"
          style="width: 100%; margin-top: 2rem;"
        >
          {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการชำระเงิน' }}
        </button>
      </div>
    </div>
  </div>
</template>

<<script setup>
definePageMeta({ layout: 'default' })

const route = useRoute()
const client = useSupabaseClient()
const user = useSupabaseUser()

const order = ref(null)
const loading = ref(true)
const isSubmitting = ref(false)

const selectedFile = ref(null)
const previewUrl = ref(null)

// 1. ดึงข้อมูลออเดอร์
onMounted(async () => {
  if (!user.value) return navigateTo('/login') 

  const orderId = route.params.id
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !data) {
    console.error('Fetch order error:', error?.message)
    order.value = null
  } else {
    order.value = data
  }
  
  loading.value = false
})

// 2. พรีวิวรูปสลิป
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไปครับ (ไม่ควรเกิน 5MB)')
      return
    }
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

// 3. กดยืนยันการชำระเงิน (Logic ใหม่ไม่ต้องใช้ upsert)
const submitPayment = async () => {
  if (!selectedFile.value || !order.value) return alert('กรุณาอัปโหลดรูปสลิปก่อนครับ')

  isSubmitting.value = true
  const orderId = order.value.id

  try {
    // 3.1 อัปโหลดรูปสลิป
    const fileExt = selectedFile.value.name.split('.').pop()
    const fileName = `${user.value.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await client.storage
      .from('payment_image')
      .upload(fileName, selectedFile.value)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = client.storage
      .from('payment_image')
      .getPublicUrl(fileName)

    // ⭐️ 3.2 ใช้เทคนิค "ล้างของเก่าแล้วลงของใหม่" เพื่อเลี่ยง upsert error
    // ขั้นแรก: ลบข้อมูลการแจ้งโอนเดิมของออเดอร์นี้ (ถ้ามี)
    await client
      .from('payments')
      .delete()
      .eq('order_id', orderId)

    // ขั้นต่อมา: บันทึกข้อมูลใหม่ลงไป (ใช้ .insert แทน)
    const { error: paymentError } = await client
      .from('payments')
      .insert({
        order_id: orderId,
        payment_method: 'bank_transfer',
        payment_status: 'submitted',
        slip_image_url: publicUrl,
        slip_transfer_datetime: new Date().toISOString(),
        payment_amount: order.value.total_amount
      })

    if (paymentError) throw paymentError

    // 3.3 อัปเดตสถานะออเดอร์
    const { error: orderError } = await client
      .from('orders')
      .update({
        status: 'paid_wait_verify',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderError) throw orderError

    alert('แจ้งชำระเงินสำเร็จ! แอดมินจะรีบตรวจสอบให้นะครับ')
    navigateTo('/orders')

  } catch (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message)
    console.error('Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.payment-container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
.form-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
.order-summary { background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 1.1rem; color: #475569; }
.font-bold { font-weight: 700; }
.total-amount { font-size: 1.5rem; font-weight: 800; color: #ef4444; }
.bank-details { text-align: center; padding: 1.5rem; border: 2px dashed #cbd5e1; border-radius: 8px; margin-bottom: 2rem; background: #ffffff; }
.bank-account-no { font-size: 1.3rem; color: #1e293b; letter-spacing: 1px; margin: 0.5rem 0; }
.upload-label { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; display: block; }
.input-field { padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%; box-sizing: border-box; }
.slip-preview-container { margin-top: 1rem; text-align: center; background: #f1f5f9; padding: 1rem; border-radius: 8px; }
.slip-preview { max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 4px; }
.btn-primary { background: #0f172a; color: white; padding: 1.1rem; border-radius: 8px; font-weight: bold; font-size: 1.1rem; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { background: #1e293b; }
.btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
.loading-state, .error-state { text-align: center; padding: 3rem; color: #64748b; }
.btn-link { color: #3b82f6; text-decoration: underline; display: block; margin-top: 1rem; }
</style>