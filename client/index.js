import "./index.scss";

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const pk = document.getElementById("private-key").value;

  const transaction = {
    sender: sender, 
    amount: amount, 
    recipient: recipient
  }

  const key = ec.keyFromPrivate(pk);
  const msgHash = SHA256(transaction);
  const signature = key.sign(msgHash.toString());
  
  const body = JSON.stringify({ signature: {
    r: signature.r.toString(16),
    s: signature.s.toString(16)
  }, transaction: transaction });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    if (!response.ok) {
      return response.text().then(text => {throw new Error(text)})
    }
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  }).catch(function(error) {
    console.log(error);
    alert(error);
  });
});
