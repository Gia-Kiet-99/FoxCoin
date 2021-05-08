function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function validateForm() {
  const email = $('#email-input').val().trim();
  if (email) {
    console.log('email: ' + email);
    return true;
  }
  return false;
}

// $('.signup-btn').on('click', () => {
//   const email = $('#email-input').val().trim();
//   if (validateForm()) {
//     let xhr = new XMLHttpRequest();
//     xhr.open("POST", "/users/auth", true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.send(JSON.stringify({
//       email: email
//     }));
//   }
// });