<template>
  <div class="verify-container">
    <header class="page-header flex-between">
      <div>
        <h1 class="title">🔍 ตรวจสอบการชำระเงิน</h1>
        <p class="subtitle" v-if="order">ออเดอร์หมายเลข: <span class="text-primary font-bold">{{ order.order_no }}</span></p>
      </div>
      <NuxtLink to="/admin/payments" class="btn-back">⬅️ กลับหน้ารายการ</NuxtLink>
    </header>

    <div v-if="pending" class="loading-state">กำลังดึงข้อมูลออเดอร์...</div>
    <div v-else-if="error" class="error-state">เกิดข้อผิดพลาด: {{ error.message }}</div>

    <div v-else-if="order" class="verify-grid">
      <div class="left-panel">
        <div class="card info-card">
          <h3>ข้อมูลลูกค้า</h3>
          <p><strong>ชื่อ:</strong> {{ order.members?.full_name || 'ไม่ระบุ' }}</p>
          <p><strong>วันที่สั่งซื้อ:</strong> {{ formatDate(order.created_at) }}</p>
          <p><strong>ช่องทาง:</strong> {{ order.order_source === 'web' ? '🌐 เว็บไซต์' : '🏪 หน้าร้าน' }}</p>
        </div>

        <div class="card items-card mt-4">
          <h3>รายการสินค้าที่สั่ง</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th class="text-center">ราคา/ชิ้น</th>
                <th class="text-center">จำนวน</th>
                <th class="text-right">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.order_items" :key="item.id">
                <td>
                  <div class="product-name">{{ item.products?.name || 'สินค้าไม่ทราบชื่อ' }}</div>
                  <div class="text-sm text-muted">SKU: {{ item.products?.sku || '-' }}</div>
                </td>
                <td class="text-center">฿{{ item.unit_price?.toLocaleString() }}</td>
                <td class="text-center font-bold text-primary">{{ item.qty }}</td>
                <td class="text-right font-bold">฿{{ (item.unit_price * item.qty).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <div class="total-summary">
            <span>ยอดรวมทั้งสิ้น:</span>
            <span class="total-price">฿{{ order.total_amount?.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="card slip-card">
          <h3>หลักฐานการชำระเงิน</h3>
          
          <div v-if="order.payments?.[0]?.slip_image_url" class="slip-wrapper">
            <img 
              :src="order.payments[0].slip_image_url" 
              class="slip-image"
              @click="window.open(order.payments[0].slip_image_url, '_blank')"
              title="คลิกเพื่อดูรูปขนาดเต็ม"
            />
            <p class="text-center text-sm text-muted mt-2">คลิกที่รูปเพื่อขยาย</p>
          </div>
          <div v-else class="no-slip">
            <p>ไม่มีการแนบรูปสลิป</p>
          </div>

          <div class="action-buttons mt-6">
            <button 
              @click="handleApprove" 
              class="btn-approve" 
              :disabled="isProcessing"
            >
              <span v-if="isProcessing">กำลังดำเนินการ...</span>
              <span v-else>✅ ยืนยันยอดเงิน & ตัดสต็อก</span>
            </button>
            <button 
              @click="handleReject" 
              class="btn-reject"
              :disabled="isProcessing"
            >
              ❌ ปฏิเสธสลิป (ให้โอนใหม่)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const client = useSupabaseClient()
const orderId = route.params.id

const isProcessing = ref(false)

// 1. ดึงข้อมูลแบบเจาะจง (Join 4 ตาราง: orders, members, order_items(พร้อมข้อมูล products), payments)
const { data: order, pending, error } = await useAsyncData(`verify-${orderId}`, async () => {
  const { data, error } = await client
    .from('orders')
    .select(`
      *,
      members(full_name),
      order_items(
        id, qty, unit_price, product_id,
        products(name, sku)
      ),
      payments(*)
    `)
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data
})

// ==========================================
// ⭐️ หัวใจสำคัญ: ฟังก์ชันอนุมัติและตัดสต็อก
// ==========================================
const handleApprove = async () => {
  const confirmMsg = `ยืนยันว่ายอดเงิน ฿${order.value.total_amount.toLocaleString()} ถูกต้อง?\n\nเมื่อกดตกลง ระบบจะทำการหักสต็อกสินค้าทันที!`
  if (!confirm(confirmMsg)) return

  isProcessing.value = true

  try {
    const items = order.value.order_items

    // 1. วนลูปตัดสต็อกและบันทึก Stock Movement
    for (const item of items) {
      // 1.1 หักสต็อกผ่าน RPC (ลดจำนวน)
      const { error: rpcError } = await client.rpc('increment_stock', {
        row_id: item.product_id,
        amount: -item.qty // ⭐️ ใส่ค่าติดลบเพื่อลดสต็อก
      })
      if (rpcError) throw new Error(`ไม่สามารถตัดสต็อก ${item.products.name} ได้: ${rpcError.message}`)

      // 1.2 บันทึกประวัติการเคลื่อนไหวสต็อก (สำคัญมากสำหรับแอดมิน!)
      await client.from('stock_movements').insert({
        product_id: item.product_id,
        type: 'out', // ขาออก
        qty: item.qty,
        reference_no: order.value.order_no,
        remark: 'ตัดสต็อกจากการขาย (ออเดอร์เว็บ)'
      })
    }

    // 2. อัปเดตสถานะออเดอร์เป็น 'verified' (ชำระเงินแล้ว/เตรียมจัดส่ง)
    await client.from('orders').update({ status: 'verified' }).eq('id', orderId)
    
    // 3. อัปเดตสถานะ Payment
    if (order.value.payments?.[0]) {
      await client.from('payments').update({ payment_status: 'completed' }).eq('id', order.value.payments[0].id)
    }

    alert('✅ ดำเนินการอนุมัติและตัดสต็อกเรียบร้อยแล้ว!')
    navigateTo('/admin/payments') // กลับหน้าตรวจสลิป

  } catch (err) {
    console.error(err)
    alert('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    isProcessing.value = false
  }
}

// ==========================================
// ฟังก์ชันปฏิเสธสลิป (ลูกค้าโอนผิด/สลิปปลอม)
// ==========================================
const handleReject = async () => {
  if (!confirm('ต้องการปฏิเสธสลิปและ "ยกเลิก" คำสั่งซื้อนี้ใช่หรือไม่?')) return
  
  isProcessing.value = true
  try {
    // 1. พยายามอัปเดตตาราง orders
    const { error: orderError } = await client
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      
    // ⭐️ ถ้าพังที่ orders ให้โยน Error ออกมาบอกเลย
    if (orderError) throw new Error(`[ตาราง Orders]: ${orderError.message}`)
    
    // 2. พยายามอัปเดตตาราง payments
    if (order.value.payments?.[0]) {
      const { error: paymentError } = await client
        .from('payments')
        .update({ payment_status: 'failed' }) // ⭐️ ลองใช้ failed แทนเผื่อตารางล็อกไว้
        .eq('id', order.value.payments[0].id)
        
      // ⭐️ ถ้าพังที่ payments ให้โยน Error ออกมา
      if (paymentError) throw new Error(`[ตาราง Payments]: ${paymentError.message}`)
    }
    
    alert('✅ บันทึกการปฏิเสธและยกเลิกออเดอร์เรียบร้อยแล้ว')
    navigateTo('/admin/payments')
    
  } catch (err) {
    console.error("🔥 พบข้อผิดพลาด:", err)
    // ⭐️ เด้ง Alert แจ้งให้คุณ (และผม) รู้ว่าพังที่จุดไหน
    alert("ไม่สามารถยกเลิกได้:\n" + err.message) 
  } finally {
    isProcessing.value = false
  }
}

const formatDate = (d) => new Date(d).toLocaleString('th-TH')
</script>

<style scoped>
.verify-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.text-primary { color: #4f46e5; }
.btn-back { background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; color: #475569; font-weight: bold; transition: 0.2s; }
.btn-back:hover { background: #e2e8f0; }

.verify-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; align-items: start; }

.card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card h3 { margin-top: 0; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }

.data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.data-table th, .data-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; text-align: left; }
.data-table th { background: #f8fafc; color: #64748b; font-size: 0.9rem; }
.text-right { text-align: right; }
.text-center { text-align: center; }

.total-summary { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 1.5rem; font-size: 1.2rem; }
.total-price { font-size: 1.5rem; font-weight: 800; color: #10b981; }

.slip-wrapper { text-align: center; }
.slip-image { max-width: 100%; max-height: 400px; border-radius: 8px; cursor: zoom-in; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.2s; }
.slip-image:hover { opacity: 0.9; transform: scale(1.02); }

.action-buttons { display: flex; flex-direction: column; gap: 1rem; }
.btn-approve { background: #10b981; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-approve:hover:not(:disabled) { background: #059669; }
.btn-reject { background: white; color: #ef4444; border: 1px solid #ef4444; padding: 1rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-reject:hover:not(:disabled) { background: #fef2f2; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>