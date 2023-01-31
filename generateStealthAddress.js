const keccak256 = require('js-sha3').keccak256;
const secp = require('noble-secp256k1');

function toEthAddress(PublicKey) {
  var stAA = keccak256( Buffer.from(PublicKey, 'hex').slice(1)).toString(16);
  return "0x"+stAA.slice(-40);
}

global.generateStealthInfo = function generateStealthInfo(stealthMetaAddress) {
  //USER = "st:eth:0x03312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b16603312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b166";

  const hexString = Array(64)
    .fill()
    .map(() => Math.round(Math.random() * 0xF).toString(16))
    .join('');

  const randomBigInt = BigInt(`0x${hexString}`);
  const USER = stealthMetaAddress;
  if (!USER.startsWith("st:eth:0x")){
    throw "Wrong address format; Address must start with `st:eth:0x...`";
  }
  const R_pubkey_view = secp.Point.fromHex(USER.slice(9,75));
  const R_pubkey_spend = secp.Point.fromHex(USER.slice(75,));

  const randomInt = BigInt(`0x${hexString}`);

  const ephemeralPrivatKey = randomInt.toString(16);
  console.log('ephemeralPrivatKey:', "0x" + ephemeralPrivatKey);

  const ephemeralPublicKey = secp.getPublicKey(Buffer.from(ephemeralPrivatKey, "hex"), isCompressed=true);
  console.log('ephemeralPublicKey:', Buffer.from(ephemeralPublicKey).toString('hex'));

  const sharedSecret = secp.getSharedSecret(ephemeralPrivatKey, R_pubkey_view);

  //const Qh = await secp.utils.sha256(Q);
  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret).slice(1));
  var ViewTag = hashedSharedSecret.slice(0,2);
  console.log('View tag:', ViewTag.toString('hex'));
  const hashedSharedSecretPoint = secp.getPublicKey(hashedSharedSecret.toString("utf8"));
  console.log('hashedSharedSecretPoint:', hashedSharedSecretPoint);
  const stealthPublicKey = R_pubkey_spend.add(secp.Point.fromHex(hashedSharedSecretPoint));

  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  console.log('stealth address:', stealthAddress);
  return {"stealthAddress":stealthAddress, "ephemeralPublicKey":"0x"+Buffer.from(ephemeralPublicKey).toString('hex'), "ViewTag":"0x"+ViewTag.toString('hex')};
}
//generateStealthInfo("st:eth:0x03312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b16603312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b166");
