function generateRandomString() {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let i = 0; i < 7; i++){
    randomString += char.charAt(Math.floor(Math.random() * char.length));
  }

  return randomString;
}

console.log(generateRandomString());
