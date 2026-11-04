export const gameNames = { flap: 'Pocket Flap', mole: 'Mole Patrol', snake: 'Mint Condition', memory: 'Double Take' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function shortAddress(address) {
  return /^0x[\da-f]{40}$/i.test(address || '') ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Your wallet';
}

export function tokenAmount(value) {
  // Keep token amounts as decimal strings: converting uint256 balances to Number loses precision.
  const match = String(value ?? '').match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return '—';
  const whole = match[1].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (match[2] || '').replace(/0+$/, '');
  return whole + (fraction ? `.${fraction}` : '');
}

export function marketUrl(address, network) {
  if (!/^0x[\da-f]{40}$/i.test(address || '') || !['testnet', 'mainnet'].includes(network)) return null;
  return `https://${network === 'testnet' ? 'testnet.' : ''}nad.fun/tokens/${address}`;
}

export function explorerUrl(value, network = 'testnet', kind = 'tx') {
  if (!['testnet', 'mainnet'].includes(network)) return null;
  const valid = kind === 'address' ? /^0x[\da-f]{40}$/i : /^0x[\da-f]{64}$/i;
  return valid.test(value || '') ? `https://${network === 'testnet' ? 'testnet.' : ''}monadvision.com/${kind}/${value}` : null;
}

export function rewardStatus(round) {
  if (round.status === 'paid') return { label: 'Sent to wallet', className: 'paid', amount: `+${tokenAmount(round.tokens_amount)}` };
  if (round.status === 'recorded') return { label: 'Payout pending', className: 'pending', amount: tokenAmount(round.tokens_amount) };
  if (round.status === 'failed') return { label: 'Payout failed', className: 'failed', amount: '—' };
  return { label: 'Below reward threshold', className: 'skipped', amount: '0' };
}

export function mergeRounds(previous, incoming) {
  return [...new Map([...previous, ...incoming].map(round => [round.id, round])).values()];
}
