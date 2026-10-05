import test from 'node:test'
import assert from 'node:assert/strict'
import { blankProfile, validateProfile, readProfiles } from '../src/lib/place-profile.ts'
const valid = () => ({...blankProfile('US'),name:'Oregon field trial',zone:'Open sun'})
test('Oregon is a configuration template, never a validated site',()=>{const p=valid();assert.equal(p.region,'Oregon');assert.equal(p.kind,'configured');assert.equal(validateProfile(p),null);assert.equal(p.latitude,'')})
test('Nigeria defaults are local and contain no copied Oregon region',()=>{const p=blankProfile('NG');assert.equal(p.region,'');assert.equal(p.currency,'NGN');assert.equal(p.timezone,'Africa/Lagos')})
test('invalid geography, timezone and tariffs are rejected',()=>{for(const patch of [{latitude:'91',longitude:'0'},{latitude:'10'},{timezone:'invalid-zone'},{tariff:'-1'},{currency:'N'},{name:''}])assert.ok(validateProfile({...valid(),...patch}))})
test('separate sites receive distinct identities',()=>assert.notEqual(valid().id,valid().id))
test('damaged stored profiles do not break startup',()=>{globalThis.localStorage={getItem:()=>'{broken'};assert.equal(readProfiles().length,1)})
