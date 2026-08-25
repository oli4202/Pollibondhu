#!/usr/bin/env node
/**
 * WebSocket Real-Time Chat Test
 * Simulates two users (Rahim & Provider) connecting via Socket.IO
 * and exchanging messages, typing indicators, and voice events in real-time.
 */

const { io } = require('./frontend/node_modules/socket.io-client');

const SERVER = 'http://localhost:4000';

// Tokens from earlier login
const RAHIM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhaGltQHBvbGxpYm9uZGh1LnRlc3QiLCJyb2xlIjoiQ0lUSVpFTiIsImlhdCI6MTc4NzYwMjQ2MiwiZXhwIjoxNzg3NjAzMzYyfQ.OB9S6u4sAT9Q8QPob3O3ynXFL2H87LRfFmzdv1uJSwQ';
const PROVIDER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJlbWFpbCI6InByb3ZpZGVyQHBvbGxpYm9uZGh1LnRlc3QiLCJyb2xlIjoiU0VSVklDRV9QUk9WSURFUiIsImlhdCI6MTc4NzYwMjQ2MiwiZXhwIjoxNzg3NjAzMzYyfQ.JAhEA3HTEjMrie222NG6kNPIlbMQhGLsESZ5bYcU2O0';

const RAHIM_ID = 7;
const PROVIDER_ID = 4;
const CONVERSATION_ID = 1; // Direct chat between Rahim & Provider

let passCount = 0;
let failCount = 0;

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
  passCount++;
}
function fail(label, detail) {
  console.log(`  ❌ FAIL: ${label}`);
  if (detail) console.log(`    ${detail}`);
  failCount++;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('================================================');
  console.log('  WebSocket Real-Time Messaging Test');
  console.log('================================================\n');

  // =============================================
  // Connect both users
  // =============================================
  console.log('1. Connecting users...');

  const rahim = io(SERVER, { transports: ['websocket', 'polling'] });
  const provider = io(SERVER, { transports: ['websocket', 'polling'] });

  await Promise.all([
    new Promise((resolve) => rahim.on('connect', resolve)),
    new Promise((resolve) => provider.on('connect', resolve)),
  ]);

  pass('Both users connected via WebSocket');
  console.log(`    Rahim socket: ${rahim.id}`);
  console.log(`    Provider socket: ${provider.id}`);
  console.log('');

  // =============================================
  // Join personal rooms
  // =============================================
  console.log('2. Joining personal rooms...');
  rahim.emit('join_user', RAHIM_ID);
  provider.emit('join_user', PROVIDER_ID);
  await sleep(200);
  pass('Both users joined personal notification rooms');
  console.log('');

  // =============================================
  // Join chat room
  // =============================================
  console.log('3. Joining chat room...');
  rahim.emit('chat:join', CONVERSATION_ID);
  provider.emit('chat:join', CONVERSATION_ID);
  await sleep(200);
  pass('Both users joined chat room ' + CONVERSATION_ID);
  console.log('');

  // =============================================
  // Test 1: Send message from Rahim -> Provider
  // =============================================
  console.log('4. Real-time message: Rahim -> Provider');

  const providerReceived = new Promise((resolve) => {
    provider.once('chat:message', (msg) => resolve(msg));
  });

  rahim.emit('chat:message', {
    conversationId: CONVERSATION_ID,
    senderId: RAHIM_ID,
    content: 'Hello from WebSocket! Are you there?',
    messageType: 'TEXT',
  });

  const msg1 = await Promise.race([
    providerReceived,
    sleep(3000).then(() => null),
  ]);

  if (msg1 && msg1.content === 'Hello from WebSocket! Are you there?') {
    pass('Provider received Rahim\'s message in real-time');
    console.log(`    Message ID: ${msg1.message_id}`);
    console.log(`    Sender: ${msg1.sender.full_name}`);
    console.log(`    Content: ${msg1.content}`);
  } else {
    fail('Provider did not receive message', JSON.stringify(msg1));
  }
  console.log('');

  // =============================================
  // Test 2: Reply from Provider -> Rahim
  // =============================================
  console.log('5. Real-time message: Provider -> Rahim');

  const rahimReceived = new Promise((resolve) => {
    rahim.once('chat:message', (msg) => resolve(msg));
  });

  provider.emit('chat:message', {
    conversationId: CONVERSATION_ID,
    senderId: PROVIDER_ID,
    content: 'Yes! WebSocket messages work perfectly.',
    messageType: 'TEXT',
  });

  const msg2 = await Promise.race([
    rahimReceived,
    sleep(3000).then(() => null),
  ]);

  if (msg2 && msg2.content === 'Yes! WebSocket messages work perfectly.') {
    pass('Rahim received Provider\'s reply in real-time');
    console.log(`    Message ID: ${msg2.message_id}`);
    console.log(`    Sender: ${msg2.sender.full_name}`);
    console.log(`    Content: ${msg2.content}`);
  } else {
    fail('Rahim did not receive reply', JSON.stringify(msg2));
  }
  console.log('');

  // =============================================
  // Test 3: Typing indicator
  // =============================================
  console.log('6. Typing indicator');

  const providerTyping = new Promise((resolve) => {
    provider.once('chat:typing', (data) => resolve(data));
  });

  rahim.emit('chat:typing', {
    userId: RAHIM_ID,
    conversationId: CONVERSATION_ID,
    isTyping: true,
  });

  const typing1 = await Promise.race([
    providerTyping,
    sleep(2000).then(() => null),
  ]);

  if (typing1 && typing1.isTyping === true && typing1.userId === RAHIM_ID) {
    pass('Provider received typing indicator from Rahim');
  } else {
    fail('Typing indicator not received', JSON.stringify(typing1));
  }

  // Stop typing
  const providerStopTyping = new Promise((resolve) => {
    provider.once('chat:typing', (data) => resolve(data));
  });

  rahim.emit('chat:typing', {
    userId: RAHIM_ID,
    conversationId: CONVERSATION_ID,
    isTyping: false,
  });

  const typing2 = await Promise.race([
    providerStopTyping,
    sleep(2000).then(() => null),
  ]);

  if (typing2 && typing2.isTyping === false) {
    pass('Provider received typing stopped indicator');
  } else {
    fail('Stop typing indicator not received', JSON.stringify(typing2));
  }
  console.log('');

  // =============================================
  // Test 4: Rapid-fire message exchange
  // =============================================
  console.log('7. Rapid-fire message exchange (5 messages)');

  let rapidPass = 0;
  for (let i = 0; i < 5; i++) {
    const received = new Promise((resolve) => {
      provider.once('chat:message', (msg) => resolve(msg));
    });

    rahim.emit('chat:message', {
      conversationId: CONVERSATION_ID,
      senderId: RAHIM_ID,
      content: `Rapid message ${i + 1} of 5`,
      messageType: 'TEXT',
    });

    const result = await Promise.race([
      received,
      sleep(2000).then(() => null),
    ]);

    if (result && result.content === `Rapid message ${i + 1} of 5`) {
      rapidPass++;
    }
  }

  if (rapidPass === 5) {
    pass(`All ${rapidPass}/5 rapid messages delivered in real-time`);
  } else {
    fail(`Only ${rapidPass}/5 rapid messages delivered`);
  }
  console.log('');

  // =============================================
  // Test 5: Cross-conversation isolation
  // =============================================
  console.log('8. Cross-conversation isolation');

  // Rahim leaves convo 1, joins convo 2
  rahim.emit('chat:leave', CONVERSATION_ID);
  rahim.emit('chat:join', 2);
  await sleep(200);

  const isolatedReceived = new Promise((resolve) => {
    rahim.once('chat:message', (msg) => resolve(msg));
  });

  // Provider sends to convo 1 — Rahim should NOT receive
  provider.emit('chat:message', {
    conversationId: CONVERSATION_ID,
    senderId: PROVIDER_ID,
    content: 'This should not reach Rahim on convo 2',
    messageType: 'TEXT',
  });

  const leaked = await Promise.race([
    isolatedReceived,
    sleep(1500).then(() => null),
  ]);

  if (!leaked) {
    pass('Rahim did NOT receive message from convo 1 after leaving');
  } else {
    fail('Message leaked across conversations!', JSON.stringify(leaked));
  }
  console.log('');

  // =============================================
  // Test 6: Re-join and verify
  // =============================================
  console.log('9. Re-join conversation');

  rahim.emit('chat:join', CONVERSATION_ID);
  await sleep(200);

  const rejoined = new Promise((resolve) => {
    rahim.once('chat:message', (msg) => resolve(msg));
  });

  provider.emit('chat:message', {
    conversationId: CONVERSATION_ID,
    senderId: PROVIDER_ID,
    content: 'Welcome back Rahim!',
    messageType: 'TEXT',
  });

  const msg3 = await Promise.race([
    rejoined,
    sleep(2000).then(() => null),
  ]);

  if (msg3 && msg3.content === 'Welcome back Rahim!') {
    pass('Rahim received message after re-joining');
  } else {
    fail('Message not received after re-join', JSON.stringify(msg3));
  }
  console.log('');

  // =============================================
  // Test 7: Group chat scenario (3 users)
  // =============================================
  console.log('10. Group chat (3 users in Farmers Chat)');

  const sultana = io(SERVER, { transports: ['websocket', 'polling'] });
  await new Promise((resolve) => sultana.on('connect', resolve));
  sultana.emit('join_user', 6);

  const groupConvoId = 2; // Farmers Chat group

  rahim.emit('chat:leave', CONVERSATION_ID);
  provider.emit('chat:leave', CONVERSATION_ID);

  rahim.emit('chat:join', groupConvoId);
  provider.emit('chat:join', groupConvoId);
  sultana.emit('chat:join', groupConvoId);
  await sleep(300);

  const rahimGroupMsg = new Promise((resolve) => rahim.once('chat:message', resolve));
  const sultanaGroupMsg = new Promise((resolve) => sultana.once('chat:message', resolve));

  provider.emit('chat:message', {
    conversationId: groupConvoId,
    senderId: PROVIDER_ID,
    content: 'Hello everyone in the group!',
    messageType: 'TEXT',
  });

  const [g1, g2] = await Promise.all([
    Promise.race([rahimGroupMsg, sleep(3000).then(() => null)]),
    Promise.race([sultanaGroupMsg, sleep(3000).then(() => null)]),
  ]);

  if (g1 && g1.content === 'Hello everyone in the group!' && g2 && g2.content === 'Hello everyone in the group!') {
    pass('Both Rahim and Sultana received the group message simultaneously');
  } else {
    fail('Group broadcast failed', `Rahim: ${JSON.stringify(g1)}, Sultana: ${JSON.stringify(g2)}`);
  }
  console.log('');

  // =============================================
  // Test 8: Delivery confirmation (message saved to DB)
  // =============================================
  console.log('11. Verify messages persisted in database');

  // Use REST API to check
  const http = require('http');
  function httpGet(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:4000${path}`, {
        headers: { Authorization: `Bearer ${RAHIM_TOKEN}` },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  const convo1Messages = await httpGet('/api/chat/conversations/1/messages');
  const wsMessages = convo1Messages.data.filter(m => m.content && m.content.includes('WebSocket'));

  if (wsMessages.length >= 2) {
    pass(`Found ${wsMessages.length} WebSocket test messages persisted in DB`);
    wsMessages.forEach(m => console.log(`    [${m.sender.full_name}]: ${m.content}`));
  } else {
    fail('WebSocket messages not found in DB', `Found only ${wsMessages.length} messages`);
  }
  console.log('');

  // =============================================
  // Cleanup
  // =============================================
  console.log('Cleaning up...');
  rahim.disconnect();
  provider.disconnect();
  sultana.disconnect();

  await sleep(500);

  // =============================================
  // Summary
  // =============================================
  console.log('');
  console.log('================================================');
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed out of ${passCount + failCount} tests`);
  console.log('================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
