import { google } from 'googleapis';
import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SHEET_ID = '1BltLlWelE3czyYGKScBGmYytBFJLNhcG5mY8tUh5zZg';
const SHEET_NAME = '綁定資料';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody.toString());

    console.log('📥 Received body:', body);

    const event = body?.events?.[0];
    const userId = event?.source?.userId;
    const messageText = event?.message?.text?.trim();
    const match = messageText?.match(/^綁定(09\d{8})$/);

    if (!userId || !match) {
      return res.status(200).json({ message: '無效綁定格式或缺少 userId' });
    }

    const phone = match[1];
    const time = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    // Sheets API 授權
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[phone, userId, time]],
      },
    });

    // LINE 回覆訊息
    const reply = {
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: `✅ 綁定成功：${phone}` }],
    };

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(reply),
    });

    res.status(200).json({ message: '綁定成功' });
  } catch (error) {
    console.error('❌ 錯誤：', error);
    res.status(500).json({ message: '內部錯誤', error });
  }
}
