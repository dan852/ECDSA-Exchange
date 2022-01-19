const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = { };
const accounts = { };

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {signature, transaction} = req.body;
  const {sender, recipient, amount} = transaction;

  const key = ec.keyFromPublic({x: accounts[sender].publicX, y: accounts[sender].publicY }, 'hex');
  const msgHash = SHA256(transaction).toString();

  if(balances[sender] < amount) {
    res.status(403).send('Insufficient balance');
    return;
  }

  if(key.verify(msgHash, signature)) {
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[sender] });
  } else {
    res.status(401).send('Not Authenticated, check your PK!');
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  console.log(`\nAvailable Accounts\n==================`);
  for(let i = 0; i < 10; i++) {
    let key = ec.genKeyPair();
    let account = key.getPublic().encode('hex');
    account = `0x${account.slice(-40)}`;

    balances[account] = Math.floor(Math.random() * 10);
    accounts[account] = {
      privateKey: key.getPrivate().toString(16),
      publicX: key.getPublic().x.toString(16),
      publicY: key.getPublic().y.toString(16),
    }

    console.log(`(${ i })`, account, `(${ balances[account] } SHOT)`);
  }

  console.log(`\nPrivate Keys\n============`);
  let i = 0;
  for(const [key, account] of Object.entries(accounts)) {
    console.log(`(${i}) ${ account.privateKey }`);
    delete account.privateKey;
    i++;
  }
});
