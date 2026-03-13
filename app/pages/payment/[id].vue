<template>
    <div class="payment-container">
        <div class="form-card">
            <h1 class="title" style="text-align: center;">💳 แจ้งชำระเงิน</h1>

            <div v-if="loading" class="loading-state">กำลังดึงข้อมูลคำสั่งซื้อ...</div>
            <div v-else-if="!order" class="error-state">ไม่พบข้อมูลคำสั่งซื้อนี้</div>

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
                    <p class="font-bold" style="font-size: 1.2rem; letter-spacing: 1px;">123-4-56789-0</p>
                    <p>ชื่อบัญชี: บจก. โกดังสินค้าของเรา</p>
                </div>

                <div class="upload-section">
                    <label class="upload-label">อัปโหลดหลักฐานการโอนเงิน (สลิป)</label>
                    <input type="file" @change="handleFileChange" accept="image/*" class="input-field" />

                    <div v-if="previewUrl" class="slip-preview-container">
                        <img :src="previewUrl" alt="Slip Preview" class="slip-preview" />
                    </div>
                </div>

                <button @click="submitPayment" class="btn-primary" :disabled="isSubmitting || !selectedFile"
                    style="width: 100%; margin-top: 2rem;">
                    {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการชำระเงิน' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const route = useRoute()
const client = useSupabaseClient()

const order = ref(null)
const loading = ref(true)
const isSubmitting = ref(false)

// ตัวแปรสำหรับรูปภาพ
const selectedFile = ref(null)
const previewUrl = ref(null)

// 1. ดึงข้อมูลออเดอร์มาแสดงตอนโหลดหน้าเว็บ
onMounted(async () => {
    const orderId = route.params.id
    const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

    if (data) order.value = data
    loading.value = false
})

// 2. ฟังก์ชันพรีวิวรูปสลิป
const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        selectedFile.value = file
        previewUrl.value = URL.createObjectURL(file)
    }
}

// 3. ฟังก์ชันกดยืนยันการชำระเงิน
const submitPayment = async () => {
    if (!selectedFile.value) return alert('กรุณาอัปโหลดรูปสลิปก่อนครับ')

    isSubmitting.value = true
    const orderId = order.value.id

    try {
        // 3.1 อัปโหลดรูปสลิปขึ้น Storage (Bucket: payment_image)
        const fileName = `${Date.now()}-${selectedFile.value.name}`
        const { error: uploadError } = await client.storage
            .from('payment_image')
            .upload(fileName, selectedFile.value, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        // ดึง URL ของรูปที่อัปโหลดเสร็จ
        const { data: { publicUrl } } = client.storage
            .from('payment_image')
            .getPublicUrl(fileName)

        // 3.2 อัปเดตตาราง payments (ใส่ลิงก์สลิป และเปลี่ยนสถานะเป็น submitted)
        const { error: paymentError } = await client
            .from('payments')
            .update({
                slip_image_url: publicUrl, // คอลัมน์ที่ ADD เข้าไป
                payment_status: 'submitted',
                slip_transfer_datetime: new Date().toISOString(), // ⭐️ ตรงกับในรูปคุณ
                // transaction_last4: '1234' // ถ้ามีช่องให้กรอกเลขท้าย 4 ตัว
            })
            .eq('order_id', orderId)

        if (paymentError) throw paymentError

        // 3.3 อัปเดตตาราง orders (เปลี่ยนสถานะเป็นรอตรวจสอบ)
        const { error: orderError } = await client
            .from('orders')
            .update({
                status: 'paid_wait_verify',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (orderError) throw orderError

        alert('แจ้งชำระเงินสำเร็จ! กรุณารอแอดมินตรวจสอบสักครู่นะครับ')
        navigateTo('/') // หรือพาไปหน้า "ติดตามสถานะออเดอร์"

    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.payment-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.form-card {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

.order-summary {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid #e2e8f0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    color: #475569;
}

.total-amount {
    font-size: 1.5rem;
    font-weight: 800;
    color: #ef4444;
}

.bank-details {
    text-align: center;
    padding: 1.5rem;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    margin-bottom: 2rem;
    background: #ffffff;
}

.bank-details h3 {
    margin-top: 0;
    color: #1e293b;
    font-size: 1.1rem;
}

.bank-details p {
    margin: 0.25rem 0;
    color: #475569;
}

.upload-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.upload-label {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.input-field {
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
}

.slip-preview-container {
    margin-top: 1rem;
    text-align: center;
    background: #f1f5f9;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.slip-preview {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 4px;
}

.btn-primary {
    background: #0f172a;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    border: none;
    transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background: #1e293b;
}

.btn-primary:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
}
</style>