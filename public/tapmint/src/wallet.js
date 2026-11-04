import { escapeHtml as e, shortAddress, tokenAmount, marketUrl, explorerUrl, rewardStatus, gameNames, mergeRounds } from './wallet-data.js';

const walletIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v2"/><path d="M20 10h-5v5h5M17 12.5h.01"/></svg>';
const external = (url, label, cls = '') => url ? `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true"> ↗</span></a>` : '';

export function initWallet({ pause, toast }) {
  const button = document.querySelector('#wallet-button');
  const dialog = document.querySelector('#wallet-dialog');
  const content = document.querySelector('#wallet-content');
  let wallet = null, view = 'tokens', page = null, error = '', loading = false, request = 0;
  let timeout;
  const send = data => { if (window.parent !== window) window.parent.postMessage(data, location.origin); };

  function requestHistory(cursor = null) {
    if (!wallet || loading) return;
    loading = true; error = ''; request += 1;
    send({ type: 'tapmint:wallet-request', requestId: request, cursor });
    clearTimeout(timeout);
    timeout = setTimeout(() => { loading = false; error = 'This is taking longer than expected. Please try again.'; render(); }, 20000);
    render();
  }

  function render() {
    const bodyScroll = content.scrollTop;
    if (!wallet) {
      content.innerHTML = `<div class="wallet-empty"><span class="wallet-empty-icon">${walletIcon}</span><h3>A home for your wins.</h3><p>Your Privy wallet, earned tokens, and game history will appear here when you sign in.</p><p class="wallet-notice">Wallet sign-in is not available in this preview. You can still explore the games.</p></div>`;
      return;
    }
    const tokens = page?.tokens || [];
    const rounds = page?.rounds || [];
    const earned = tokens.filter(token => /^[0-9.]+$/.test(String(token.earned)) && /[1-9]/.test(String(token.earned))).length;
    content.innerHTML = `<section class="wallet-identity"><div class="wallet-avatar">${walletIcon}</div><div><span class="wallet-overline">PRIVY WALLET</span><button class="wallet-address" id="copy-wallet" title="Copy wallet address">${e(shortAddress(wallet))}<span aria-hidden="true"> ⧉</span></button></div><span class="network-pill"><i></i>Monad testnet</span></section>
      <div class="wallet-summary"><div><strong>${page ? e(page.totalRounds) : '—'}</strong><span>Rounds played</span></div><div><strong>${page ? earned : '—'}</strong><span>Tokens collected</span></div>${external(explorerUrl(wallet, 'testnet', 'address'), 'View wallet', 'wallet-text-link')}</div>
      <div class="wallet-tabs" role="tablist" aria-label="Wallet activity"><button role="tab" id="tokens-tab" data-view="tokens" aria-controls="wallet-tab-content" aria-selected="${view === 'tokens'}" tabindex="${view === 'tokens' ? 0 : -1}">Tokens earned</button><button role="tab" id="history-tab" data-view="history" aria-controls="wallet-tab-content" aria-selected="${view === 'history'}" tabindex="${view === 'history' ? 0 : -1}">Game history</button><button class="wallet-refresh" id="refresh-wallet" aria-label="Refresh wallet history" ${loading ? 'disabled' : ''}>↻</button></div>
      <section id="wallet-tab-content" role="tabpanel" aria-labelledby="${view}-tab" tabindex="0" aria-busy="${loading}">
      ${error ? `<div class="wallet-error" role="alert">${e(error)} <button id="retry-wallet">Try again</button></div>` : ''}
      ${loading && !page ? '<div class="wallet-loading" role="status"><span></span>Loading your wins…</div>' : ''}
      ${page && view === 'tokens' ? `<p class="wallet-caption">Rewards sent to this wallet. Transfers out do not change these totals.</p>${tokens.map(token => `<article class="wallet-token"><span class="token-avatar token-${e(token.gameId)}" aria-hidden="true">${e(token.symbol.slice(0, 1))}</span><div class="token-name"><strong>${e(token.name)}</strong><span>${e(gameNames[token.gameId] || token.gameId)}</span></div><div class="token-earned"><strong>${e(tokenAmount(token.earned))} <small>${e(token.symbol)}</small></strong>${external(marketUrl(token.tokenAddress, token.network), 'nad.fun', 'wallet-text-link')}</div></article>`).join('')}${!earned ? '<p class="wallet-empty-note">Your first win is waiting. Finish a round to start collecting rewards.</p>' : ''}<p class="wallet-caption">Testnet tokens · no cash value. nad.fun opens in a new tab.</p>` : ''}
      ${page && view === 'history' ? rounds.length ? `<div class="round-history">${rounds.map(round => {
        const status = rewardStatus(round), date = new Date(round.created_at);
        return `<article class="history-round"><div class="history-top"><strong>${e(gameNames[round.game_id] || round.game_id)}</strong><span class="history-amount ${status.className}">${e(status.amount)} <small>${e(round.token_symbol)}</small></span></div><div class="history-detail"><span>${e(round.score)} score <span aria-hidden="true">·</span> <time datetime="${e(round.created_at)}">${Number.isNaN(date.valueOf()) ? 'Date unavailable' : e(date.toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }))}</time></span></div><div class="history-bottom"><span class="payout-status ${status.className}"><i></i>${status.label}</span>${external(explorerUrl(round.tx_hash, round.network), 'Transaction', 'wallet-text-link')}</div></article>`;
      }).join('')}</div>${page.nextCursor ? `<button id="more-history" class="wallet-load-more" ${loading ? 'disabled' : ''}>${loading ? 'Loading…' : 'Load earlier rounds'}</button>` : ''}` : '<div class="wallet-empty compact"><h3>Every round has a story.</h3><p>Finish your first game to see your score and reward status here.</p></div>' : ''}</section>
      <footer class="wallet-footer"><span>Powered by Privy</span><button id="wallet-logout">Sign out ↗</button></footer>`;
    content.scrollTop = bodyScroll;
    content.querySelectorAll('[data-view]').forEach(tab => {
      tab.onclick = () => { view = tab.dataset.view; render(); document.querySelector(`#${view}-tab`).focus({ preventScroll:true }); };
      tab.onkeydown = event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); view = event.key === 'Home' ? 'tokens' : event.key === 'End' ? 'history' : view === 'tokens' ? 'history' : 'tokens'; render(); document.querySelector(`#${view}-tab`).focus({ preventScroll:true }); } };
    });
    content.querySelector('#copy-wallet').onclick = async () => {
      try { await navigator.clipboard.writeText(wallet); const b=content.querySelector('#copy-wallet'); if(b)b.textContent='Address copied ✓'; }
      catch { const b=content.querySelector('#copy-wallet'); if(b)b.textContent=wallet; }
    };
    content.querySelector('#refresh-wallet').onclick = () => requestHistory();
    const retry=content.querySelector('#retry-wallet'); if(retry)retry.onclick=()=>requestHistory();
    const more=content.querySelector('#more-history'); if(more)more.onclick=()=>requestHistory(page.nextCursor);
    content.querySelector('#wallet-logout').onclick = () => { send({ type:'tapmint:logout' }); dialog.close(); };
  }

  function open() {
    pause(); render(); if(!dialog.open)dialog.showModal(); button.setAttribute('aria-expanded','true');
    if(wallet)requestHistory();
  }
  button.innerHTML = `${walletIcon}<span>Wallet</span>`;
  button.onclick = open;
  document.querySelector('#nav-history').onclick = () => { view='history'; open(); };
  document.querySelector('#wallet-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { button.setAttribute('aria-expanded','false'); button.focus({ preventScroll:true }); });
  dialog.addEventListener('click', event => { if(event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)dialog.close(); } });
  window.addEventListener('message', event => {
    if(event.origin !== location.origin || event.source !== window.parent || window.parent === window) return;
    const data=event.data;
    if(data?.type === 'tapmint:auth') {
      const next=/^0x[\da-f]{40}$/i.test(data.wallet || '') ? data.wallet : null;
      if(next !== wallet) { page=null; error=''; loading=false; request+=1; clearTimeout(timeout); }
      wallet=next;
      button.querySelector('span').textContent=wallet ? shortAddress(wallet) : 'Wallet';
      button.title=wallet || 'Your wallet and rewards';
      if(dialog.open) { render(); if(wallet)requestHistory(); }
    }
    if(data?.type === 'tapmint:wallet-data' && data.requestId === request) {
      clearTimeout(timeout); loading=false;
      if(data.error) error=data.error;
      else { error=''; page={ ...data.payload, rounds:data.append ? mergeRounds(page?.rounds || [], data.payload.rounds) : data.payload.rounds }; }
      render();
    }
    if(data?.type === 'tapmint:reward-result') {
      toast(data.message || 'Round saved.');
      if(dialog.open && wallet)requestHistory();
    }
  });
  send({ type:'tapmint:ready' });
}
