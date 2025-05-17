import { baseUrl } from "/assets/js/utils.js";


$("#loginForm").submit((e) => {
  e.preventDefault();

  let email = $('input[name="email"]').val();
  let password = $('input[name="password"]').val();


  if (!email || !password) {
    alert("Please fill in all required fields.");
    return;
  }

  fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        sessionStorage.setItem("info", JSON.stringify(response.data));
        toastr.success(response.message);
        // showToast(response.message, 'text-bg-success');
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        toastr.error(response.message);
        // showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });

});