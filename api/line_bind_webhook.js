// line_bind_webhook.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body;

    // 假設 body.events[0].type 是 'message' 且使用者輸入電話號碼
    const event = body.events && body.events[0];

    if (!event || event.type !== "message" || !event.message?.text) {
      return res.status(200).json({ message: "Not a message event" });
    }

    const userId = event.source?.userId;
    const phone = event.message.text.trim();

    // TODO: 自行加上判斷格式是否為電話號碼，例如長度、數字等

    // 讀取舊的 JSON 紀錄（可改為儲存在其他儲存空間）
    const fs = require("fs");
    const path = require("path");
    const filePath = path.resolve("./user_db.json");

    let userData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      userData = JSON.parse(fileContent || "[]");
    }

    // 更新或新增
    const existing = userData.find(u => u.userId === userId);
    if (existing) {
      existing.phone = phone;
    } else {
      userData.push({ userId, phone });
    }

    // 寫入
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    // 回覆訊息給使用者
    return res.status(200).json({ reply: `收到電話號碼：${phone}` });

  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
