import { baseUrl } from "/assets/js/utils.js";

$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  $("#accountName").val(info.user.accountName);
  $("#accountEmail").val(info.user.email);
  $("#accountAddress").val(info.user.accountAddress);
  $("#accountPhone").val(info.user.accountPhone);
  $('#accountLogoPreview').attr('src', info.user.accountLogo);

  // Update account settings
  $("#updateAccountSettings").on("click", async () => {
    const name = $('#accountName').val();
    const email = $('#accountEmail').val();
    const address = $('#accountAddress').val();
    const phone = $('#accountPhone').val();
    const logoInput = $('#accountLogoInput')[0];
    const maxSize = 512000; // 500KB
    let logoBase64 = '';

    if (logoInput.files && logoInput.files[0]) {
      const file = logoInput.files[0];

      if (file.size > maxSize) {
        toastr.error("Logo must be less than 500KB.");
        $('#accountLogoInput').val("");
        $('#accountLogoPreview').attr('src', "");
        return;
      }

      logoBase64 = await toBase64(file);
      $('#accountLogoPreview').attr('src', logoBase64);
    }



    // Send update
    fetch(`${baseUrl()}/auth/update-account-details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        "authorization": `Bearer ${info.token}`
      },
      body: JSON.stringify({
        name,
        email,
        address,
        phone,
        logo: logoBase64
      })
    })
      .then(response => {

        if (!response.ok) throw new Error('An error occurred while updating account details');
        return response.json();
      })
      .then(data => {
        toastr.success('Company information updated successfully');
      })
      .catch(error => {
        console.error(error);
        toastr.error(error.message);
      });
  });

  // Convert file to base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
});
