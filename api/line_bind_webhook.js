// pages/api/line_bind_webhook.js

import { google } from 'googleapis';
import { Readable } from 'stream';
import getRawBody from 'raw-body';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = '1BltLlWelE3czyYGKScBGmYytBFJLNhcG5mY8tUh5zZg';
const SHEET_NAME = '綁定資料';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let body;
  try {
    const raw = await getRawBody(req);
    body = JSON.parse(raw.toString('utf-8'));
  } catch (error) {
    console.error('❌ 無法解析 LINE 傳來的 JSON：', error);
    return res.status(400).json({ message: 'Invalid JSON' });
  }

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
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[phone, userId, time]] },
    });

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: `✅ 綁定成功：${phone}` }],
      }),
    });

    res.status(200).json({ message: '綁定成功' });
  } catch (error) {
    console.error('❌ 寫入失敗：', error);
    res.status(500).json({ message: '寫入失敗', error });
  }
}
