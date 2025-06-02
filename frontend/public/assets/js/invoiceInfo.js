// const clientSchema = new mongoose.Schema({
//   accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
//   name: { type: String, required: true },
//   email: String,
//   phone: String,
//   company: String,
//   address: String,
//   notes: String,
//   status: { type: String, enum: ['active', 'inactive'], default: 'active' },
//   createdAt: { type: Date, default: Date.now }
// });


import { baseUrl } from "/assets/js/utils.js";

$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  const invoiceId = window.location.pathname.split('/').pop();
  $('#updateInvoice').attr('href', `/invoices/create?id=${invoiceId}`);



  fetch(`${baseUrl()}/invoices/${invoiceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${info.token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch invoice');
      return res.json();
    })
    .then(({ data: invoice }) => {
      // Header
      $('#invoice-title').text(`Invoice ${invoice.invoiceNumber}`);
      $('#invoice-issued').text(`Issued on ${new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

      // Client Info
      $('#client-company').text(invoice.clientId?.company || '');
      $('#client-name').text(invoice.clientId?.name || '');
      $('#client-address').text(invoice.clientId?.address || '');
      $('#client-email').text(invoice.clientId?.email || '');

      //Account Info
      $('#account-name').text(invoice.accountId?.name || '');
      $('#account-logo').attr('src', invoice.accountId?.logo || '');

      // Invoice Meta
      $('.invoice-number').text(invoice.invoiceNumber);
      $('#invoice-date').text(new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      $('#invoice-due').text(new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      const status = invoice.status; // e.g., "paid"
      const statusMap = {
        draft: { class: 'badge-light-secondary', label: 'Draft' },
        sent: { class: 'badge-light-primary', label: 'Sent' },
        paid: { class: 'badge-light-success', label: 'Paid' },
        overdue: { class: 'badge-light-danger', label: 'Overdue' },
        invalid: { class: 'badge-light-dark', label: 'Invalid' }
      };
      const statusInfo = statusMap[status] || { class: 'badge-light-muted', label: 'Unknown' };
      $('#invoice-status')
        .removeClass()
        .addClass('badge ' + statusInfo.class)
        .text(statusInfo.label);


      // Items
      const $tbody = $('#invoice-items-body');
      $tbody.empty();
      invoice.items.forEach(item => {
        $tbody.append(`
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>GHS ${item.rate.toFixed(2)}</td>
              <td>GHS ${(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          `);
      });

      // Totals
      $('#invoice-subtotal').text(`GHS ${invoice.subtotal.toFixed(2)}`);
      $('#invoice-total').text(`GHS ${invoice.total.toFixed(2)}`);
      $('#invoice-tax').text(`GHS ${invoice.taxAmount.toFixed(2)}`);


      // Payment (if any)
      if (invoice.paidAmount) {
        $('#invoice-paid').text(`GHS ${invoice.paidAmount.toFixed(2)}`);
        $('#invoice-paid-date').text(`Paid on ${new Date(invoice.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }`);
      }

      // Notes
      $('#invoice-notes').text(invoice.notes || '');
    })
    .catch(err => {
      console.error('Error loading invoice:', err);
      alert('Could not load invoice details');
    });




  // Print functionality
  $('#print-invoice').on('click', function () {
    const invoiceHtml = document.getElementById('invoice-card').innerHTML;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <link href="/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
            <link href="/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
            <style>
              body { margin: 20px; font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            ${invoiceHtml}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function () {
                  window.close();
                };
              }
            <\/script>
          </body>
        </html>
      `);
    printWindow.document.close();
  });

  //Download PDF
      $('#download-invoice').on('click', function () {
        const element = document.getElementById('invoice-card');

        const opt = {
          margin: 0.5,
          filename: 'invoice.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
      });


  //delete invoice
  $('#deleteInvoiceBtn').click(function () {
    if (!invoiceId) {
      toastr.error("Invoice ID is missing.");
      return;
    }

    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }

    fetch(`${baseUrl()}/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.message || 'Failed to delete invoice'); });
        }
        return res.json();
      })
      .then(data => {
        toastr.success("Invoice deleted (marked as invalid)");
        setTimeout(() => {
          window.location.href = "/invoices";
        }, 1500);
      })
      .catch(err => {
        toastr.error(err.message || "Error deleting invoice");
        console.error("Delete invoice error:", err);
      });
  });

  //mark invoice as paid
  $('#markAsPaidBtn').click(function () {
    if (!invoiceId) {
      toastr.error("Invoice ID is missing.");
      return;
    }

    if (!confirm("Are you sure you want to mark this invoice as paid? This action cannot be undone.")) {
      return;
    }

    fetch(`${baseUrl()}/invoices/${invoiceId}/mark-as-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.message || 'Failed to mark invoice as paid'); });
        }
        return res.json();
      })
      .then(data => {
        toastr.success("Invoice marked as paid");
        setTimeout(() => {
          window.location.href = "/invoices";
        }, 1500);
      })
      .catch(err => {
        toastr.error(err.message || "Error marking invoice as paid");
        console.error("Mark invoice as paid error:", err);
      });
  });


  //mark invoice as paid
  $('#sendInvoiceBtn').click(function () {
    if (!invoiceId) {
      toastr.error("Invoice ID is missing.");
      return;
    }

    if (!confirm("Are you sure you want to send this invoice? This action cannot be undone.")) {
      return;
    }

    fetch(`${baseUrl()}/invoices/${invoiceId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.message || 'Failed to send invoice'); });
        }
        return res.json();
      })
      .then(data => {
        toastr.success("Invoice has been sent");
      })
      .catch(err => {
        toastr.error(err.message || "Error sending invoice");
        console.error("Sending invoice error:", err);
      });
  });

});
