import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportSPKI, SignJWT } from 'jose';
import { authenticatedPlayer } from '../src/lib/privy-auth';
import { parseCursor, readWalletHistory } from '../src/lib/wallet-history';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MarketRecord } from '../src/lib/markets';

test('wallet history requires a signed, current Privy session for this app', async () => {
  const oldId=process.env.NEXT_PUBLIC_PRIVY_APP_ID, oldKey=process.env.PRIVY_VERIFICATION_KEY;
  const keys=await generateKeyPair('ES256');
  process.env.NEXT_PUBLIC_PRIVY_APP_ID='tapmint-test';
  process.env.PRIVY_VERIFICATION_KEY=await exportSPKI(keys.publicKey);
  try {
    const sign=(aud:string, exp:string | number) => new SignJWT({}).setProtectedHeader({alg:'ES256'}).setSubject('did:privy:alice').setIssuer('privy.io').setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(keys.privateKey);
    const request=(token:string) => new Request('http://localhost/api/wallet/history',{headers:{Authorization:`Bearer ${token}`}});
    assert.equal(await authenticatedPlayer(request(await sign('tapmint-test','1h'))),'did:privy:alice');
    await assert.rejects(authenticatedPlayer(new Request('http://localhost')),/sign in/);
    await assert.rejects(authenticatedPlayer(request(await sign('another-app','1h'))),/session expired/);
    await assert.rejects(authenticatedPlayer(request(await sign('tapmint-test',Math.floor(Date.now()/1000)-3600))),/session expired/);
    await assert.rejects(authenticatedPlayer(request('not.a.token')),/session expired/);
  } finally {
    if(oldId===undefined)delete process.env.NEXT_PUBLIC_PRIVY_APP_ID;else process.env.NEXT_PUBLIC_PRIVY_APP_ID=oldId;
    if(oldKey===undefined)delete process.env.PRIVY_VERIFICATION_KEY;else process.env.PRIVY_VERIFICATION_KEY=oldKey;
  }
});

test('history totals include all paid pages and every query is scoped to the signed-in user', async () => {
  const wallet='0x'+'a'.repeat(40), token='0x'+'b'.repeat(40);
  const calls:{fields:string; filters:[string,unknown][]; start:number; end:number}[]=[];
  const client={from(table:string){
    assert.equal(table,'game_rounds');
    const call={fields:'',filters:[] as [string,unknown][],start:0,end:0};calls.push(call);
    const query={ select(fields:string){call.fields=fields;return query;},eq(key:string,value:unknown){call.filters.push([key,value]);return query;},order(){return query;},async range(start:number,end:number){
      call.start=start;call.end=end;
      if(call.fields.startsWith('id,'))return {data:[{id:'r1'}],count:25,error:null};
      return {data:start===0?Array.from({length:500},()=>({token_address:token,network:'testnet',tokens_amount:2})):[{token_address:token,network:'testnet',tokens_amount:3}],error:null};
    }};return query;
  }};
  const market={gameId:'flap',name:'FlapCoin',symbol:'FLAP',tokenAddress:token,network:'testnet'} as MarketRecord;
  const result=await readWalletHistory(client as unknown as SupabaseClient,'did:privy:alice',wallet.toUpperCase(),[market]);
  assert.equal(result.totalRounds,25);assert.equal(result.nextCursor,'20');assert.equal(result.tokens[0].earned,'1003');
  assert.equal(calls.length,3);
  for(const call of calls){assert.ok(call.filters.some(([k,v])=>k==='privy_user_id'&&v==='did:privy:alice'));assert.ok(call.filters.some(([k,v])=>k==='wallet'&&v===wallet));}
  for(const call of calls.slice(1))assert.ok(call.filters.some(([k,v])=>k==='status'&&v==='paid'));
  assert.equal(parseCursor(null),0);assert.equal(parseCursor('20'),20);
  for(const cursor of ['-1','1','abc','1 OR 1=1'])assert.throws(()=>parseCursor(cursor));
});
