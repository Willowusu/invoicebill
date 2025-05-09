import { baseUrl } from "/assets/js/utils.js";

let info = JSON.parse(sessionStorage.getItem("info"));

$('#createClientForm').on('submit', function (e) {
  e.preventDefault();

  let name = $('input[name="name"]').val();
  let email = $('input[name="email"]').val();
  let phone = $('input[name="phone"]').val();
  let address = $('textarea[name="address"]').val();
  let company = $('input[name="company"]').val();
  let notes = $('textarea[name="notes"]').val();


  fetch(`${baseUrl()}/clients`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${info.token}`
  },
  body: JSON.stringify({name, email, phone, address, company, notes}),
  })
  .then(response => response.json())
  .then(res => {
    if (res.status === 'success') {
    toastr.success(res.message || 'Client created');
    $('#createClientForm')[0].reset();
    } else {
    toastr.error(res.message || 'An error occurred');
    }
  })
  .catch(error => {
    const errMsg = error.message || 'Server error';
    toastr.error(errMsg);
  });
  });
