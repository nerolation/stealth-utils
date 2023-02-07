const keccak256 = require('js-sha3').keccak256;
const secp = require("@noble/secp256k1");

function randomPrivateKey() {
  var randPrivateKey = secp.utils.randomPrivateKey();
  return BigInt(`0x${Buffer.from(randPrivateKey, "hex").toString('hex')}`);
}

function uintArrayToHex(uintArray) {
  return secp.utils.bytesToHex(uintArray);
}

function toEthAddress(PublicKey) {
  var stAA = keccak256( Buffer.from(PublicKey, 'hex').slice(1)).toString(16);
  return "0x"+stAA.slice(-40);
}

global.generateStealthInfo = function generateStealthInfo(stealthMetaAddress) {
  //USER = "st:eth:0x03312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b16603312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b166";

  const USER = stealthMetaAddress;
  if (!USER.startsWith("st:eth:0x")){
    throw "Wrong address format; Address must start with `st:eth:0x...`";
  }


  const R_pubkey_view = secp.Point.fromHex(USER.slice(9,75));
  const R_pubkey_spend = secp.Point.fromHex(USER.slice(75,));

//  const randomInt = BigInt(`0x${hexString}`);

  const ephemeralPrivateKey = randomPrivateKey();
;
  console.log('ephemeralPrivateKey:', "0x" + ephemeralPrivateKey.toString(16));

  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, isCompressed=true);
  console.log('ephemeralPublicKey:', Buffer.from(ephemeralPublicKey).toString('hex'));

  const sharedSecret = secp.getSharedSecret(ephemeralPrivateKey, R_pubkey_view);
  console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(2)));
  console.log('hashedSharedSecret:', hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(0,2);
  console.log('View tag:', ViewTag.toString('hex'));
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(Buffer.from(hashedSharedSecret, "hex"));
  console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);
  const stealthPublicKey = R_pubkey_spend.add(hashedSharedSecretPoint);
  console.log("stealthPublicKey.toHex(): ", stealthPublicKey.toHex());
  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  console.log('stealth address:', stealthAddress);
  return {"stealthAddress":stealthAddress, "ephemeralPublicKey":"0x"+Buffer.from(ephemeralPublicKey).toString('hex'), "ViewTag":"0x"+ViewTag.toString('hex')};
}
//console.log("generateStealthInfo......................");
//var info = generateStealthInfo("st:eth:0x02e3f061681d080148202d40c203db2d411d44a954e847afc9c1ef90db08981e6b02e3f061681d080148202d40c203db2d411d44a954e847afc9c1ef90db08981e6b");


global.parseStealthAddresses = function parseStealthAddresses(
  ephemeralPublicKey_hex,
  stealthAddress_given,
  spendingPublicKey_hex,
  viewingPrivateKey
){
  console.log("ephemeralPublicKey_hex :",ephemeralPublicKey_hex);

  var ephemeralPublicKey = secp.Point.fromHex(ephemeralPublicKey_hex.slice(2));
  //console.log('ephemeralPublicKey_hex:', ephemeralPublicKey_hex);

  const spendingPublicKey = secp.Point.fromHex(spendingPublicKey_hex.slice(2));

  const sharedSecret = secp.getSharedSecret(BigInt(viewingPrivateKey), ephemeralPublicKey);
  console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(2)));
  console.log("hashedSharedSecret2 :",hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(0,2);
  //console.log('View tag:', ViewTag.toString('hex'));

  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(Buffer.from(hashedSharedSecret, "hex"));

  //console.log('hashedSharedSecretPoint:', hashedSharedSecretPoint);
  const stealthPublicKey = spendingPublicKey.add(hashedSharedSecretPoint);
  console.log("stealthPublicKey :",stealthPublicKey);

  const stealthAddress = toEthAddress(stealthPublicKey.toHex());

  if (stealthAddress === stealthAddress_given) {
    console.log(stealthAddress);
    console.log(stealthAddress_given);
    return [stealthAddress, ephemeralPublicKey_hex,  "0x" + hashedSharedSecret.toString('hex')];
  }
  return false;
}
//console.log("parseStealthAddresses......................");
//success = parseStealthAddresses(info["ephemeralPublicKey"], info["stealthAddress"], "0x02e3f061681d080148202d40c203db2d411d44a954e847afc9c1ef90db08981e6b", "0x5ae07d3818695379db1e82a684e1be374b5c4dc40dc8a754adf45cdcb9a4d784")
//console.log(success);
//console.log("-----------------------------------------------------");
//console.log("privToAddress......................");

global.privToAddress = function privToAddress(
  stealthPrivateKey
){
  var stealthPublicKey = secp.Point.fromPrivateKey(stealthPrivateKey);
  var stealthAddress = toEthAddress(stealthPublicKey.toHex());
  return  stealthPublicKey.toHex(isCompressed=true), stealthAddress;
}

global.generateRandomStealthMetaAddress = function generateRandomStealthMetaAddress() {
  const spendingPrivateKey = randomPrivateKey();
  const viewingPrivateKey = randomPrivateKey();
  const spendingPublicKey = uintArrayToHex(secp.getPublicKey(spendingPrivateKey, isCompressed=true));
  const viewingPublicKey = uintArrayToHex(secp.getPublicKey(viewingPrivateKey, isCompressed=true));
  const stealthMetaAddress = "st:eth:0x"+spendingPublicKey+viewingPublicKey;
  return ["0x"+spendingPrivateKey.toString(16), "0x"+viewingPrivateKey.toString(16), stealthMetaAddress]


}
//generateRandomStealthMetaAddress();
//var stealthPrivateKey = BigInt("0x"+success[2]) + BigInt("0x5ae07d3818695379db1e82a684e1be374b5c4dc40dc8a754adf45cdcb9a4d784");

//stealthAddress_derived = privToAddress(stealthPrivateKey);
//console.log("stealthAddress_derived: ", stealthAddress_derived);
