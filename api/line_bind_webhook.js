export default async function handler(req, res) {
  const fs = require('fs');
  const path = require('path');

  const body = req.body;
  const event = body.events?.[0];
  if (!event || !event.message || !event.message.text) {
    return res.status(200).send('OK');
  }

  const userId = event.source.userId;
  const messageText = event.message.text.trim();
  const match = messageText.match(/^綁定(\d{8,})$/);

  if (match) {
    const phone = match[1];
    const bindingPath = path.resolve('binding.json');
    let binding = {};

    if (fs.existsSync(bindingPath)) {
      const data = fs.readFileSync(bindingPath);
      binding = JSON.parse(data.toString());
    }

    binding[phone] = userId;

    fs.writeFileSync(bindingPath, JSON.stringify(binding, null, 2));

    const replyToken = event.replyToken;
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: `✅ 已成功綁定手機：${phone}`,
          },
        ],
      }),
    });

    return res.status(200).send('綁定成功');
  }

  res.status(200).send('OK');
}
