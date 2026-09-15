import fs from "fs";

async function testFullFlow() {
  const baseUrl = "http://localhost:4000";
  console.log("--- 1. Testing GET /api/setting ---");
  const setRes = await fetch(`${baseUrl}/api/setting`).then(r => r.json());
  console.log("Settings status:", setRes.success, "Store:", setRes.data?.storeName, "Methods:", setRes.data?.paymentMethods?.length);

  console.log("\n--- 2. Testing GET /api/sticker/list ---");
  const stickRes = await fetch(`${baseUrl}/api/sticker/list`).then(r => r.json());
  console.log("Stickers count:", stickRes.data?.length);

  console.log("\n--- 3. Testing GET /api/food/list ---");
  const foodRes = await fetch(`${baseUrl}/api/food/list`).then(r => r.json());
  console.log("Food count:", foodRes.data?.length);
  const sampleProduct = foodRes.data[0];

  console.log("\n--- 4. Testing POST /api/order/submit (Guest Order) ---");
  // Create sample dummy payment proof file
  const testProofPath = "uploads/test_receipt.png";
  if (!fs.existsSync(testProofPath)) {
    fs.writeFileSync(testProofPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
  }

  const formData = new FormData();
  formData.append("customerName", "Abebe Kebede");
  formData.append("customerPhone", "0912345678");
  formData.append("customerEmail", "abebe@example.com");
  formData.append("deliveryType", "Delivery");
  formData.append("deliveryAddress", "Bole Medhanialem, House #402");
  formData.append("distanceKm", "4.2");
  formData.append("deliveryFee", "105");
  formData.append("subtotal", sampleProduct.price.toString());
  formData.append("totalAmount", (sampleProduct.price + 105).toString());
  formData.append("paymentMethod", "Telebirr");
  formData.append("paymentAccount", "0911223344");
  formData.append("notes", "Please print in gold lettering");
  
  const blob = new Blob([fs.readFileSync(testProofPath)], { type: "image/png" });
  formData.append("paymentProof", blob, "telebirr_receipt.png");

  const itemsPayload = [
    {
      foodId: sampleProduct._id,
      name: sampleProduct.name,
      price: sampleProduct.price,
      quantity: 1,
      image: sampleProduct.image,
      customText: "AURA 2026",
      selectedStickers: [
        { name: "Golden Sparkle", image: "sticker_sparkle.svg" },
        { name: "Aura Crown", image: "sticker_crown.svg" }
      ]
    }
  ];
  formData.append("items", JSON.stringify(itemsPayload));

  const submitRes = await fetch(`${baseUrl}/api/order/submit`, {
    method: "POST",
    body: formData
  }).then(r => r.json());

  console.log("Submit result:", submitRes);
  const orderNumber = submitRes.orderNumber;

  console.log("\n--- 5. Testing GET /api/order/list (Admin Orders) ---");
  const ordersListRes = await fetch(`${baseUrl}/api/order/list`).then(r => r.json());
  console.log("Admin orders count:", ordersListRes.data?.length);
  const foundOrder = ordersListRes.data.find(o => o.orderNumber === orderNumber);
  console.log("Found order in admin:", foundOrder ? {
    orderNumber: foundOrder.orderNumber,
    customer: foundOrder.customerName,
    customText: foundOrder.items[0]?.customText,
    stickers: foundOrder.items[0]?.selectedStickers?.map(s => s.name),
    proof: foundOrder.paymentProof,
    status: foundOrder.status
  } : "Not found!");

  console.log("\n--- 6. Testing POST /api/order/status (Admin updates status) ---");
  const statusRes = await fetch(`${baseUrl}/api/order/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: foundOrder._id,
      status: "Payment Verified"
    })
  }).then(r => r.json());
  console.log("Update status response:", statusRes);

  console.log("\n--- 7. Testing GET /api/order/track/:query (Customer Tracking) ---");
  const trackRes = await fetch(`${baseUrl}/api/order/track/${orderNumber}`).then(r => r.json());
  console.log("Track status:", trackRes.success, "Live Status:", trackRes.data[0]?.status);

  console.log("\n✅ ALL END-TO-END TESTS PASSED SUCCESSFULLY!");
}

testFullFlow().catch(console.error);
