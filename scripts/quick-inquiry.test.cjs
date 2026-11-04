const {test}=require('node:test');
const assert=require('node:assert/strict');
const {accepted,contactType,channelFor}=require('../js/quick-inquiry.js');
test('Only explicit provider acceptance counts as a lead',()=>{
  for(const success of [true,'true']) assert.equal(accepted({success}),true);
  for(const result of [null,{},false,{success:false},{success:'false'},{success:1},{success:'TRUE'}]) assert.equal(accepted(result),false);
});
test('One email or phone contact is sufficient; malformed contacts are rejected',()=>{
  assert.equal(contactType(' test@example.invalid '),'email');
  assert.equal(contactType('+370 600 00000'),'phone');
  for(const value of ['','test','name@','123','1234567890123456','tel abc1234567']) assert.equal(contactType(value),null);
});
test('Channel classification respects paid clicks and avoids false organic attribution',()=>{
  const url='https://dokipoki.lt/programos/gimtadieniai/';
  assert.equal(channelFor(url,'https://www.google.lt/search?q=animatoriai'),'organic_search');
  assert.equal(channelFor(url+'?gclid=secret','https://www.google.lt/'),'paid');
  assert.equal(channelFor(url+'?utm_medium=cpc','https://www.google.com/'),'paid');
  assert.equal(channelFor(url,'https://www.google.com.evil.invalid/'),'referral');
  assert.equal(channelFor(url,'https://dokipoki.lt/personazai/'),'unknown_internal');
  assert.equal(channelFor(url,''),'direct_or_unknown');
});
