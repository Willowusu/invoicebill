import { baseUrl } from "/assets/js/utils.js";
$("#clientInvoicesTable").DataTable();


$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  const clientId = window.location.pathname.split('/').pop();

  fetch(`${baseUrl()}/clients/${clientId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${info.token}`
    }
  })
    .then(res => res.json())
    .then(res => {

      if (res.status == "error") throw new Error('Failed to load client');

      const client = res.data;
      const summary = client.financialSummary || {};

      $('#client-name').text(client.name || '');
      $('#client-title').text(client.title || '');
      $('.client-company').text(client.company || '');
      $('#client-email').text(client.email || '');
      $('#client-phone').text(client.phone || '');
      $('#client-address').text(client.address || '');
      $('#client-notes').text(client.notes || '');

      if (client.createdAt) {
        const created = new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        $('#client-created').text(created);
      }

      $('#client-total-invoices').text(summary.totalInvoices || 0);
      $('#client-total-spent').text(`GHS ${(summary.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      $('#client-outstanding').text(`GHS ${(summary.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

      const statusBadge = $('#client-status');
      const statusText = client.status || 'Unknown';
      statusBadge.text(statusText.charAt(0).toUpperCase() + statusText.slice(1));
      statusBadge.removeClass().addClass(`badge badge-light-${statusText === 'active' ? 'success' : 'secondary'}`);
    })
    .catch(err => {
      console.error(err);
      toastr.error('Could not load client details');
    });


  fetch(`${baseUrl()}/clients/${clientId}/invoices`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${info.token}`
    }
  })
    .then(response => response.json())
    .then(response => {
      console.log(response)
      if (response.status === "success") {
        //clear the clients list
        $("#clientInvoices").empty();


        response.data.forEach(invoice => {
          // Map status to badge class
          let statusClass = '';
          switch (invoice?.status) {
            case 'draft':
              statusClass = 'badge-light-secondary';
              break;
            case 'sent':
              statusClass = 'badge-light-info';
              break;
            case 'paid':
              statusClass = 'badge-light-success';
              break;
            case 'overdue':
              statusClass = 'badge-light-danger';
              break;
            case 'invalid':
              statusClass = 'badge-light-dark';
              break;
            default:
              statusClass = 'badge-light';
          }

          let row = `
    <tr>
      <td><a href="/invoices/${invoice?._id}">${invoice?.invoiceNumber}</a></td>
      <td>${new Date(invoice?.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      <td><span class="badge ${statusClass} text-capitalize">${invoice?.status}</span></td>
      <td>$${invoice?.total.toFixed(2)}</td>
      <td>${new Date(invoice?.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
    </tr>
  `;
          $("#clientInvoices").append(row);
        });


      } else {
        toastr.error(response.message);
        // showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });
});
