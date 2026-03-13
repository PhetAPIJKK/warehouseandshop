export const useInventory = () => {
  const client = useSupabaseClient()
  // ฟังก์ชันใหม่: สำหรับอัปโหลดรูปขึ้น Supabase Storage
  const uploadImage = async (file) => {
    // สร้างชื่อไฟล์ใหม่ไม่ให้ซ้ำกันโดยใช้ timestamp
    const fileName = `${Date.now()}-${file.name}`

    // อัปโหลดไฟล์
    const { data, error } = await client.storage
      .from('image_product')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) return { error }

    // ดึง URL แบบ Public เพื่อเอาไปบันทึกลงตาราง products
    const { data: { publicUrl } } = client.storage
      .from('image_product')
      .getPublicUrl(fileName)

    return { publicUrl }
  }

  // 1. ดึงข้อมูลสินค้าทั้งหมดสำหรับหน้าตาราง (แบบปลอดภัย ไม่ Join ป้องกัน Error)
  const getInventoryData = () => {
    return useAsyncData('products-list', async () => {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase Error:', error.message)
        return []
      }
      return data || []
    })
  }

  // 2. ดึงหมวดหมู่ทั้งหมด (ไว้ทำ Dropdown ในหน้าฟอร์ม)
  const getCategories = async () => {
    return await client.from('product_categories').select('id, name')
  }

  // 3. ดึงสินค้าตัวเดียว (สำหรับตอนเปิดหน้า Edit)
  const getProductById = async (id) => {
    return await client.from('products').select('*').eq('id', id).single()
  }

  // 4. เพิ่มสินค้า พร้อมบันทึกประวัติการรับเข้าครั้งแรก (Stock Movement)
  const addProduct = async (productData) => {
    // 4.1 ตรวจสอบ User ที่ล็อกอินอยู่
    const { data: { user } } = await client.auth.getUser()
    const userId = user?.id

    // ใส่ข้อมูลคนสร้างลงไปในก้อนข้อมูลสินค้า
    const payloadToInsert = {
      ...productData,
      created_by: userId
    }

    // 4.2 จังหวะที่ 1: บันทึกข้อมูลลงตาราง products
    const { data: newProduct, error: productError } = await client
      .from('products')
      .insert(payloadToInsert)
      .select() // ต้องสั่ง .select() เพื่อขอ ID สินค้าที่เพิ่งสร้างกลับมาด้วย
      .single()

    if (productError) return { error: productError }

    // 4.3 จังหวะที่ 2: ถ้าใส่จำนวนเริ่มต้นมาด้วย ให้บันทึกประวัติลง stock_movements
    if (productData.stock_qty && productData.stock_qty > 0) {
      const { error: logError } = await client.from('stock_movements').insert({
        item_type: 'product',
        movement_type: 'initial_stock', // ประเภทยอดยกมา
        ref_table: 'products',
        ref_id: newProduct.id,
        product_id: newProduct.id,
        qty_in: productData.stock_qty, // จำนวนขาเข้า
        qty_out: 0, // ขาออกเป็น 0
        balance_after: productData.stock_qty, // ยอดคงเหลือ
        created_by: userId // รหัสแอดมินที่ทำรายการ
      })

      if (logError) {
        console.error('Failed to log movement:', logError.message)
      }
    }

    return { error: null, data: newProduct }
  }

  // 5. อัปเดตสินค้า พร้อมประทับตราคนแก้และเวลาอัตโนมัติ
  const updateProduct = async (id, productData) => {
    // 5.1 ดึงข้อมูล User ที่ล็อกอินอยู่ปัจจุบัน
    const { data: { user } } = await client.auth.getUser()

    // 5.2 นำข้อมูลเดิมมาผสมกับฟิลด์ updated_at และ updated_by
    const payloadWithAudit = {
      ...productData,
      updated_at: new Date().toISOString(), // เวลาปัจจุบัน
      updated_by: user?.id || null // ไอดีแอดมินที่กำลังกดเซฟ
    }

    // 5.3 ส่งข้อมูลชุดสมบูรณ์ไปอัปเดตที่ฐานข้อมูล
    return await client.from('products').update(payloadWithAudit).eq('id', id)
  }
  const adjustProductStock = async (productId, qty, type) => {
    const { data: { user } } = await client.auth.getUser()
    const userId = user?.id

    const { data: product, error: fetchError } = await client
      .from('products')
      .select('stock_qty')
      .eq('id', productId)
      .single()

    if (fetchError) return { error: fetchError }

    const currentStock = product.stock_qty || 0

    // ⭐️ ปรับเงื่อนไขให้เข้ากับคำใหม่
    const isOut = ['issue', 'adjust'].includes(type)
    const qtyChange = isOut ? -Math.abs(qty) : Math.abs(qty)
    const balanceAfter = currentStock + qtyChange

    if (balanceAfter < 0) {
      return { error: { message: 'สต็อกคงเหลือติดลบไม่ได้ครับ!' } }
    }

    // อัปเดตตาราง products
    const { error: updateError } = await client
      .from('products')
      .update({
        stock_qty: balanceAfter,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', productId)

    if (updateError) return { error: updateError }

    // ⭐️ บันทึกประวัติลง stock_movements ให้ตรงกับ Constraint
    const qtyIn = !isOut ? Math.abs(qty) : 0
    const qtyOut = isOut ? Math.abs(qty) : 0

    const { error: logError } = await client
      .from('stock_movements')
      .insert({
        item_type: 'product',
        movement_type: type, // จะส่ง receive, issue, หรือ adjust
        ref_table: 'manual', // ⭐️ เปลี่ยนเป็น manual ตามกฎของคุณ
        ref_id: null, // ใส่เป็น null เพราะเป็นการปรับมือ ไม่มีเอกสารอ้างอิง
        product_id: productId,
        qty_in: qtyIn,
        qty_out: qtyOut,
        balance_after: balanceAfter,
        created_by: userId
      })

    return { error: logError }

  }
  const produceProduct = async (productId, qty, note = '') => {
    const { data: { user } } = await client.auth.getUser()
    const userId = user?.id

    // จังหวะที่ 1: บันทึกข้อมูลลงตาราง production_logs
    const { data: prodLog, error: prodError } = await client
      .from('production_logs')
      .insert({
        product_id: productId,
        qty_produced: qty,
        produced_by: userId,
        note: note
      })
      .select()
      .single()

    if (prodError) return { error: prodError }

    // จังหวะที่ 2: ดึงสต็อกปัจจุบันเพื่อคำนวณยอดคงเหลือใหม่
    const { data: product } = await client.from('products').select('stock_qty').eq('id', productId).single()
    const currentStock = product?.stock_qty || 0
    const newStock = currentStock + Math.abs(qty)

    // จังหวะที่ 3: อัปเดตยอดสต็อกในตาราง products 
    await client.from('products').update({
      stock_qty: newStock,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }).eq('id', productId)

    // จังหวะที่ 4: บันทึกประวัติลง stock_movements
    const { error: moveError } = await client.from('stock_movements').insert({
      item_type: 'product',
      movement_type: 'produce_in',     // ⭐️ ตรงตาม Constraint รับของเข้าจากการผลิต
      ref_table: 'production_logs',    // ⭐️ อ้างอิงตาราง production_logs
      ref_id: prodLog.id,              // ⭐️ เชื่อมโยง ID ของบิลผลิตที่เพิ่งสร้าง
      product_id: productId,
      qty_in: Math.abs(qty),
      qty_out: 0,
      balance_after: newStock,
      created_by: userId
    })

    return { error: moveError, data: prodLog }
  }

  // ==========================================
  // ฟังก์ชันที่ 2: ขายออก (ลดสต็อก)
  // ==========================================
  const recordSale = async (productId, qty) => {
    const { data: { user } } = await client.auth.getUser()
    const userId = user?.id

    const { data: product } = await client.from('products').select('stock_qty').eq('id', productId).single()
    const currentStock = product?.stock_qty || 0
    const newStock = currentStock - Math.abs(qty)

    if (newStock < 0) {
      return { error: { message: 'สต็อกคงเหลือไม่พอขายครับ!' } }
    }

    // อัปเดตยอดสต็อกในตาราง products
    await client.from('products').update({
      stock_qty: newStock,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }).eq('id', productId)

    // บันทึกประวัติลง stock_movements
    const { error: moveError } = await client.from('stock_movements').insert({
      item_type: 'product',
      movement_type: 'sale_out', // ⭐️ ตรงตาม Constraint การขายออก
      ref_table: 'manual',       // ⭐️ ใช้ manual ไปก่อน (ถ้าอนาคตมีระบบออเดอร์ค่อยเปลี่ยนเป็น 'orders')
      ref_id: null,
      product_id: productId,
      qty_in: 0,
      qty_out: Math.abs(qty),
      balance_after: newStock,
      created_by: userId
    })

    return { error: moveError }
  }

  // ==========================================
  // ฟังก์ชันที่ 3: ดึงประวัติความเคลื่อนไหว (Statement)
  // ==========================================
  const getProductMovements = async (productId) => {
    // ดึงประวัติทั้งหมดของสินค้านั้นๆ เรียงจากใหม่ไปเก่า
    const { data, error } = await client
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  return {
    getInventoryData,
    getCategories,
    getProductById,
    addProduct,
    updateProduct,
    adjustProductStock,
    produceProduct,
    recordSale,
    getProductMovements,
    uploadImage
  }
}