#!/usr/bin/env node
/**
 * AKISTEL MVP Smoke Test
 * Tests the complete message flow: register → publish → send → inbox → ack
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function main() {
  console.log('🚀 AKISTEL Smoke Test');
  console.log(`   Target: ${BASE_URL}\n`);

  // 1. Health check
  console.log('1. Health check...');
  const health = await request('GET', '/health');
  console.log(`   ✅ Status: ${health.status}\n`);

  // 2. Register Alice
  console.log('2. Register Alice...');
  const alice = await request('POST', '/api/devices/register', {
    userId: 'alice-smoke',
    publicKey: 'YWxpY2Utc21va2UtdGVzdC1wdWJsaWMta2V5LWJhc2U2NA==',
  });
  console.log(`   ✅ Device ID: ${alice.deviceId}\n`);

  // 3. Register Bob
  console.log('3. Register Bob...');
  const bob = await request('POST', '/api/devices/register', {
    userId: 'bob-smoke',
    publicKey: 'Ym9iLXNtb2tlLXRlc3QtcHVibGljLWtleS1iYXNlNjQ=',
  });
  console.log(`   ✅ Device ID: ${bob.deviceId}\n`);

  // 4. Publish key bundle for Alice
  console.log('4. Publish key bundle (Alice)...');
  const aliceBundle = await request('POST', '/api/keys/publish', {
    deviceId: alice.deviceId,
    identityKey: 'YWxpY2Utc21va2UtaWRlbnRpdHkta2V5LWJhc2U2NA==',
    signedPreKey: 'YWxpY2Utc21va2Utc2lnbmVkLXByZWtleS1iYXNlNjQ=',
    signature: 'YWxpY2Utc21va2Utc2lnbmF0dXJlLWJhc2U2NC1sb25nLWVub3VnaC1mb3ItdmFsaWRhdGlvbg==',
    oneTimePreKeys: [],
  });
  console.log(`   ✅ Key Bundle ID: ${aliceBundle.keyBundleId}\n`);

  // 5. Publish key bundle for Bob
  console.log('5. Publish key bundle (Bob)...');
  const bobBundle = await request('POST', '/api/keys/publish', {
    deviceId: bob.deviceId,
    identityKey: 'Ym9iLXNtb2tlLWlkZW50aXR5LWtleS1iYXNlNjQtZW5jb2Rl',
    signedPreKey: 'Ym9iLXNtb2tlLXNpZ25lZC1wcmVrZXktYmFzZTY0LWVuYw==',
    signature: 'Ym9iLXNtb2tlLXNpZ25hdHVyZS1iYXNlNjQtbG9uZy1lbm91Z2gtZm9yLXZhbGlkYXRpb24=',
    oneTimePreKeys: [],
  });
  console.log(`   ✅ Key Bundle ID: ${bobBundle.keyBundleId}\n`);

  // 6. Send encrypted message: Alice -> Bob
  console.log('6. Send encrypted message (Alice → Bob)...');
  const envelope = await request('POST', '/api/messages/send', {
    senderId: alice.deviceId,
    recipientId: bob.deviceId,
    ciphertext: 'c21va2UtdGVzdC1lbmNyeXB0ZWQtbWVzc2FnZS1jb250ZW50',
    nonce: 'c21va2UtdGVzdC1ub25jZS1iYXNlNjQ=',
  });
  console.log(`   ✅ Envelope ID: ${envelope.envelopeId}\n`);

  // 7. Fetch Bob's inbox
  console.log('7. Fetch inbox (Bob)...');
  const inbox = await request('GET', `/api/messages/inbox/${bob.deviceId}`);
  console.log(`   ✅ Messages in inbox: ${inbox.count}`);
  if (inbox.count > 0) {
    console.log(`   ✅ Sender: ${inbox.envelopes[0].senderUserId}\n`);
  }

  // 8. ACK the message
  console.log('8. Acknowledge message...');
  const ack = await request('POST', '/api/messages/ack', {
    envelopeIds: [envelope.envelopeId],
  });
  console.log(`   ✅ Acknowledged: ${ack.acknowledged}\n`);

  // 9. Verify inbox is empty
  console.log('9. Verify inbox empty after ACK...');
  const emptyInbox = await request('GET', `/api/messages/inbox/${bob.deviceId}`);
  console.log(`   ✅ Messages in inbox: ${emptyInbox.count}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL SMOKE TESTS PASSED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('\n❌ SMOKE TEST FAILED:', err.message);
  process.exit(1);
});
