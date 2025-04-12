// line_bind_webhook.js

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.resolve('./api/robotic-gasket-456611-s9-f05f2427da86.json');
const SHEET_ID = '1BltLlWelE3czyYGKScBGmYytBFJLNhcG5mY8tUh5zZg';
const SHEET_NAME = '綁定資料';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const body = req.body;
  const event = body?.events?.[0];
  const userId = event?.source?.userId;
  const messageText = event?.message?.text?.trim();
  const match = messageText?.match(/^綁定(09\d{8})$/);

  if (!userId || !match) {
    return res.status(200).json({ message: '無效綁定格式或缺少 userId' });
  }

  const phone = match[1];
  const time = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[phone, userId, time]]
      },
    });

    // 回覆用戶綁定成功
    const replyToken = event.replyToken;
    const replyMessage = {
      replyToken,
      messages: [
        { type: 'text', text: `✅ 綁定成功：${phone}` }
      ]
    };

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer du+9/lpGYmg2gvBnwg7Ek7uo22lnd33HeVz441b2SZ/bZl7xNOn0NufyhbjbI87hLAZhu2xpv0zik4JwDNccyh9X8MiUsl7Ptur/3qAI94MN59BZr4sZryJMY475yoOrvQI+hdUlafKjxXf8sw5SjwdB04t89/1O/w1cDnyilFU='
      },
      body: JSON.stringify(replyMessage)
    });

    res.status(200).json({ message: '綁定成功' });
  } catch (error) {
    console.error('寫入 Sheets 發生錯誤:', error);
    res.status(500).json({ message: '寫入 Sheets 發生錯誤', error });
  }
}
