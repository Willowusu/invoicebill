import { baseUrl } from "/assets/js/utils.js";

$("#invoicesTable").DataTable();

$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  fetch(`${baseUrl()}/invoices`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${info.token}`
    }
  })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        //clear the invoices list
        $("#invoicesList").empty();


        response.data.forEach(invoice => {
          let row = `
            <tr>
              <td><a href="/invoices/${invoice?._id}" > ${invoice?.invoiceNumber}</a></td>
              <td>${invoice?.clientId.name}</td>
              <td>${invoice?.status}</td>
              <td>$${invoice?.total.toFixed(2)}</td>
              <td>${new Date(invoice?.dueDate).toLocaleDateString()}</td>
            </tr>
          `;
          $("#invoicesList").append(row);
        });

      } else {
        toastr.error(response.message);
        // showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });
})