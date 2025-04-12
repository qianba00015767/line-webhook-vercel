// api/line_bind_webhook.js

import fs from 'fs';
import path from 'path';

const ACCESS_TOKEN = 'du+9/lpGYmg2gvBnwg7Ek7uo22lnd33HeVz441b2SZ/bZl7xNOn0NufyhbjbI87hLAZhu2xpv0zik4JwDNccyh9X8MiUsl7Ptur/3qAI94MN59BZr4sZryJMY475yoOrvQI+hdUlafKjxXf8sw5SjwdB04t89/1O/w1cDnyilFU=';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const event = req.body.events?.[0];
    const userId = event?.source?.userId;
    const text = event?.message?.text || '';

    // 檢查格式
    const match = text.match(/^綁定(\d{8,})$/);
    if (!match || !userId) return res.status(200).send('格式錯誤');

    const phone = match[1];
    const filepath = path.resolve('api/binding.json');

    // 讀取資料
    let data = {};
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath);
      data = JSON.parse(raw.toString());
    }

    // 更新資料
    data[phone] = userId;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    // 回覆用戶
    const reply = {
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: `✅ 綁定成功：${phone}` }]
    };

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(reply)
    });

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).send('Internal Server Error');
  }
}
