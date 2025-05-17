import { baseUrl } from "/assets/js/utils.js";


$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  $("#name").val(info.user.name);
  $("#email").val(info.user.email);
  $("#phone").val(info.user.phone);


  //script to update user password using update user password endpoint
  //user must be logged in and enter their current password, the new password and the confirmation before it will be changed
  $("#updatePassword").on("click", () => {
    let currentPassword = $("#currentPassword").val();
    let newPassword = $("#newPassword").val();
    let confirmNewPassword = $("#confirmNewPassword").val();

    if (newPassword !== confirmNewPassword) {
      toastr.error("New password and confirmation do not match");
      return;
    }

    fetch(`${baseUrl()}/auth/update-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": `Bearer ${info.token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.status === "success") {
          toastr.success("Password updated successfully");
          $("#currentPassword").val("");
          $("#newPassword").val("");
          $("#confirmNewPassword").val("");
        } else {
          toastr.error(response.message);
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  });

  //script to update nuser name, email and phone
  $("#updateUserProfile").on("click", () => {
    let name = $("#name").val();
    let email = $("#email").val();
    let phone = $("#phone").val();

    fetch(`${baseUrl()}/auth/update-user-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": `Bearer ${info.token}`
      },
      body: JSON.stringify({
        name,
        email,
        phone
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.status === "success") {
          toastr.success("Profile updated successfully");
          info.user.name = name;
          info.user.email = email;
          info.user.phone = phone;
          sessionStorage.setItem("info", JSON.stringify(info));
        } else {
          toastr.error(response.message);
        }
      })
      .catch(error => {
        console.error("Error:", error);
      });
  });
})