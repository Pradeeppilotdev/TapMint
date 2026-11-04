import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, tokenAmount, marketUrl, explorerUrl, rewardStatus, mergeRounds } from '../public/tapmint/src/wallet-data.js';

test('earned amounts retain precision and unknown balances are never displayed as zero', () => {
  assert.equal(tokenAmount('100000000000000000001.0000'),'100,000,000,000,000,000,001');
  assert.equal(tokenAmount('2.125000'),'2.125');
  assert.equal(tokenAmount(null),'—');
  assert.equal(tokenAmount('0'),'0');
});
test('external token links stay on the correct network and reject malformed addresses', () => {
  const address='0x'+'a'.repeat(40);
  assert.equal(marketUrl(address,'testnet'),`https://testnet.nad.fun/tokens/${address}`);
  assert.equal(marketUrl(address,'mainnet'),`https://nad.fun/tokens/${address}`);
  assert.equal(marketUrl(address,'unknown'),null);
  assert.equal(marketUrl('javascript:alert(1)','testnet'),null);
  assert.equal(explorerUrl('0x'+'f'.repeat(64),'testnet'),`https://testnet.monadvision.com/tx/0x${'f'.repeat(64)}`);
});
test('pending and failed payouts are not presented as tokens received', () => {
  assert.equal(rewardStatus({status:'paid',tokens_amount:'4'}).amount,'+4');
  assert.equal(rewardStatus({status:'recorded',tokens_amount:'4'}).label,'Payout pending');
  assert.equal(rewardStatus({status:'failed',tokens_amount:'4'}).amount,'—');
  assert.equal(rewardStatus({status:'skipped',tokens_amount:'0'}).amount,'0');
});
test('history pagination deduplicates overlapping rounds and escapes displayed data', () => {
  assert.deepEqual(mergeRounds([{id:'a',status:'recorded'}],[{id:'a',status:'paid'},{id:'b'}]),[{id:'a',status:'paid'},{id:'b'}]);
  assert.equal(escapeHtml('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
