import { baseUrl } from "/assets/js/utils.js";

$("#radioCompany, #radioIndividual").change(() => {
  toggleCompanyDetails();
});

function toggleCompanyDetails() {
  const isCompany = document.getElementById("radioCompany").checked;
  const companyDetails = document.getElementById("companyDetails");

  companyDetails.style.display = isCompany ? "block" : "none";
}



$("#registerForm").submit((e) => {
  e.preventDefault();

  let name = $('input[name="name"]').val();
  let email = $('input[name="email"]').val();
  let phone = $('input[name="phone"]').val();
  let address = $('input[name="address"]').val();
  let password = $('input[name="password"]').val();
  let confirmPassword = $('input[name="confirmPassword"]').val();
  let accountName = $('input[name="companyName"]').val();
  let accountAddress = $('input[name="companyAddress"]').val();
  let accountPhone = $('input[name="companyPhone"]').val();
  let accountType = $('input[name="accountType"]:checked').val();

  if (!name || !email || !phone || !address || !password || !confirmPassword) {
    alert("Please fill in all required fields.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }
  if (accountType === "company") {
    if (!accountName || !accountAddress || !accountPhone) {
      alert("Please fill in all company details.");
      return;
    }
  }


  console.log({
    name,
    email,
    phone,
    address,
    password,
    confirmPassword,
    accountName,
    accountAddress,
    accountPhone,
    accountType
  })


  fetch(`${baseUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      email,
      phone,
      address,
      password,
      confirmPassword,
      accountName,
      accountAddress,
      accountPhone,
      accountType
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        showToast(response.message, 'text-bg-success');
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });

});