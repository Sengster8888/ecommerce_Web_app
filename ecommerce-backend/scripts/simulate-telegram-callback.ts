import axios from 'axios';

const LOCAL_WEBHOOK_URL = 'http://localhost:4000/api/telegram/webhook';
const SECRET_TOKEN = 'your_super_secret_webhook_handshake_token';

async function simulateCancelAction() {
  const mockPayload = {
    update_id: 987654321,
    callback_query: {
      id: 'mock_callback_id_999',
      from: { id: 111222333, is_bot: false, first_name: 'Sophea', username: 'sophea_admin' },
      message: {
        message_id: 1234, // Simulated message ID
        chat: { id: -100123456789, title: 'Store Admin Group', type: 'group' },
        text: '✅ NEW ORDER (Confirmed)\nOrder: #ORD-20260906-005\nCustomer: Lim Hongseng\nTotal: $110.00',
        date: Math.floor(Date.now() / 1000),
      },
      data: 'cancel:1', // Simulated action on Order ID 1
    },
  };

  try {
    console.log('Sending mock webhook payload...');
    const response = await axios.post(LOCAL_WEBHOOK_URL, mockPayload, {
      headers: {
        'X-Telegram-Bot-Api-Secret-Token': SECRET_TOKEN,
      },
    });
    console.log('Simulation response:', response.data);
  } catch (error: any) {
    console.error('Simulation failed:', error.response?.data || error.message);
  }
}

simulateCancelAction();
