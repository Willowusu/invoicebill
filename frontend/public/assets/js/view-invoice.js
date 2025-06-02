import { baseUrl } from "/assets/js/utils.js";


document.addEventListener("DOMContentLoaded", async () => {
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    alert("Invalid or missing token.");
    return;
  }

  try {
    const response = await fetch(`${baseUrl()}/invoices/public/view?token=${token}`);
    const result = await response.json();


    if (result.code !== 200) {
      alert(result.message || "Unable to load invoice.");
      return;
    }

    const invoice = result.data;

    // Account details
    $('#account-name').text(invoice.accountId.name || '');
    $('#account-logo').attr('src', invoice.accountId.logo || '');

    // Invoice meta
    $('.invoice-number').text(invoice.invoiceNumber);
    $('#invoice-date').text(new Date(invoice.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    $('#invoice-due').text(new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    // Client details
    $('#client-name').text(invoice.clientId.name || '');
    $('#client-email').text(invoice.clientId.email || '');
    $('#client-address').text(invoice.clientId.address || '');
    $('#client-company').text(invoice.clientId.company || '');

    // Invoice status
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

    // Invoice items
    const $tbody = $('#invoice-items-body');
    let subtotal = 0;

    invoice.items.forEach(item => {
      const amount = item.quantity * item.rate;
      subtotal += amount;

      const $row = $(`
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>GHS ${item.rate.toFixed(2)}</td>
        <td>GHS ${amount.toFixed(2)}</td>
      </tr>
    `);
      $tbody.append($row);
    });

    const tax = invoice.taxAmount;
    const total = subtotal + tax;

    // Totals
    $('#invoice-subtotal').text(`GHS ${subtotal.toFixed(2)}`);
    $('#invoice-tax').text(`GHS ${tax.toFixed(2)}`);
    $('#invoice-total').text(`GHS ${total.toFixed(2)}`);

    // Payment
    if (invoice.status === 'Paid') {
      $('#invoice-paid').text('Paid');
      $('#invoice-paid-date').text(invoice.paidDate || '');
    }

    // Notes
    $('#invoice-notes').text(invoice.notes || '');
  } catch (err) {
    console.error("Error loading invoice:", err);
    alert("Error loading invoice.");
  }
});


