import { google } from 'googleapis';

const SHEET_ID = '1BltLlWelE3czyYGKScBGmYytBFJLNhcG5mY8tUh5zZg';
const SHEET_NAME = '綁定資料';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
console.log('📥 Received body:', JSON.stringify(req.body));
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
    // 1. 讀取 Vercel 環境變數中的 JSON 金鑰
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 2. 寫入 Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[phone, userId, time]]
      },
    });

    // 3. 回覆 LINE 綁定成功訊息
    const reply = {
      replyToken: event.replyToken,
      messages: [
        { type: 'text', text: `✅ 綁定成功：${phone}` }
      ]
    };

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(reply)
    });

    res.status(200).json({ message: '綁定成功' });
  } catch (error) {
    console.error('❌ 錯誤：', error);
    res.status(500).json({ message: '內部伺服器錯誤', error });
  }
}
