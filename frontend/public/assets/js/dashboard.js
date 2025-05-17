import { baseUrl } from "/assets/js/utils.js";


$(() => {

  let info = JSON.parse(sessionStorage.getItem("info"));

  fetch(`${baseUrl()}/dashboard-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${info.token}`
    }
  })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        $("#totalInvoicesStat").text(response.data.summary.totalInvoices);
        $("#totalRevenueStat").text(response.data.summary.totalRevenue);
        $("#pendingPaymentsStat").text(response.data.summary.pendingPayments);
        $("#totalClientsStat").text(response.data.summary.totalClients);
        $("#totalDraftInvoicesStat").text(response.data.summary.draftInvoices);
        $("#totalOverdueInvoicesStat").text(response.data.summary.overdueInvoices);
        //clear the recent invoices and top clients list
        $("#recentInvoices").empty();
        $("#topClients").empty();

        //check if there are any recent invoices
        if (response.data.recentInvoices.length <= 0) {
          let row;
          row = `
            <tr>
              <td colspan="5" class="text-center">No recent invoices</td>
            </tr>
          `;
          $("#recentInvoices").append(row);
        } else {
          response.data.recentInvoices.forEach(invoice => {
            let row = `
            <tr>
              <td>${invoice?.invoiceNumber}</td>
              <td>${invoice?.clientId.name}</td>
              <td>${invoice?.status}</td>
              <td>$${invoice?.total.toFixed(2)}</td>
              <td>${new Date(invoice?.dueDate).toLocaleDateString()}</td>
            </tr>
          `;
            $("#recentInvoices").append(row);
          });
        }

        //check if there are any top clients
        if (response.data.topClients.length <= 0) {
          let row;
          row = `
            <tr>
              <td colspan="5" class="text-center">No top clients</td>
            </tr>
          `;
          $("#topClients").append(row);
        } else {
          response.data.topClients.forEach(client => {
            let row = `
            <tr>
              <td>${invoice?.name}</td>
              <td>${invoice?.email}</td>
              <td>${invoice?.phone}</td>
              <td>$${invoice?.company}</td>
              <td>${invoice?.status}</td>
            </tr>
          `;
            $("#topClients").append(row);
          });
        }



      } else {
        toastr.error(response.message);
        // showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });

})





