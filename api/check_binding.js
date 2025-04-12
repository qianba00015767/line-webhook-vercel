// /api/check_binding.js

const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ message: 'Missing phone parameter' });
  }

  try {
    const bindingPath = path.resolve('binding.json');
    let binding = {};

    if (fs.existsSync(bindingPath)) {
      const data = fs.readFileSync(bindingPath);
      binding = JSON.parse(data.toString());
    }

    if (binding[phone]) {
      return res.status(200).json({ bound: true, userId: binding[phone] });
    } else {
      return res.status(200).json({ bound: false });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
