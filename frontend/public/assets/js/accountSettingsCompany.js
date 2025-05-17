import { baseUrl } from "/assets/js/utils.js";

$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  $("#accountName").val(info.user.accountName);
  $("#accountEmail").val(info.user.email);
  $("#accountAddress").val(info.user.accountAddress);
  $("#accountPhone").val(info.user.accountPhone);
  $('#accountLogoPreview').attr('src', info.user.accountLogo);
  $("#accountInvoicePrefix").val(info.user.accountInvoicePrefix);
  $("#accountPaymentTerms").val(info.user.accountPaymentTerms);
  $("#accountTaxRate").val(info.user.accountTaxRate);
  $("#accountInvoiceNotes").val(info.user.accountInvoiceNotes);



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


  // Update account settings
  $("#updateAccountInvoiceSettings").on("click", async () => {
    const defaultInvoicePrefix = $('#accountInvoicePrefix').val();
    const defaultPaymentTerms = $('#accountPaymentTerms').val();
    const defaultTaxRate = $('#accountTaxRate').val();
    const defaultInvoiceNotes = $('#accountInvoiceNotes').val();

    // Send update
    fetch(`${baseUrl()}/auth/update-account-invoice-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        "authorization": `Bearer ${info.token}`
      },
      body: JSON.stringify({
        defaultInvoicePrefix,
        defaultPaymentTerms,
        defaultTaxRate,
        defaultInvoiceNotes,
      })
    })
      .then(response => {

        if (!response.ok) throw new Error('An error occurred while updating account details');
        return response.json();
      })
      .then(data => {
        toastr.success('Company information updated successfully');
        info.user.accountInvoicePrefix = defaultInvoicePrefix;
        info.user.accountPaymentTerms = defaultPaymentTerms;
        info.user.accountTaxRate = defaultTaxRate;
        info.user.accountInvoiceNotes = defaultInvoiceNotes;
        sessionStorage.setItem("info", JSON.stringify(info));
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
