import { baseUrl } from "/assets/js/utils.js";

$(() => {
  const info = JSON.parse(sessionStorage.getItem("info"));
  const invoiceId = getInvoiceIdFromUrl();

  $("#taxRate").val(info.user.accountTaxRate);
  $("#notes").val(info.user.accountInvoiceNotes);

  // Preselect due date based on accountPaymentTerms
  const paymentTerms = parseInt(info.user.accountPaymentTerms) || 0;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  $('#dueDate').val(dueDate.toISOString().split('T')[0]);

  // Load clients first
  fetch(`${baseUrl()}/clients`, {
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${info.token}`
    },
  })
    .then(response => response.json())
    .then(data => {
      data.data.forEach(client => {
        $('#clientId').append(`<option value="${client._id}">${client.name}</option>`);
      });

      // Load invoice if editing
      if (invoiceId) {
        loadInvoice(invoiceId);
      }
    })
    .catch(error => {
      console.error('Error loading clients:', error);
    });

  function getInvoiceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function loadInvoice(id) {
    fetch(`${baseUrl()}/invoices/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch invoice');
        return res.json();
      })
      .then(data => {
        const invoice = data.data;
        $('#clientId').val(invoice.clientId);
        $('#dueDate').val(invoice.dueDate.split('T')[0]);
        $('#taxRate').val(invoice.taxRate);
        $('#notes').val(invoice.notes);

        $('#itemsContainer').empty();

        invoice.items.forEach(item => {
          const template = $('#itemRowTemplate').html();
          const $row = $(template);
          $row.find('[name="description"]').val(item.description);
          $row.find('[name="quantity"]').val(item.quantity);
          $row.find('[name="rate"]').val(item.rate);
          $('#itemsContainer').append($row);
        });

        calculateTotals();
      })
      .catch(err => {
        console.error('Error fetching invoice:', err);
        toastr.error('Failed to load invoice for editing');
      });
  }

  function calculateTotals() {
    let subtotal = 0;
    $('#itemsContainer .item-row').each(function () {
      const quantity = parseFloat($(this).find('[name="quantity"]').val()) || 0;
      const rate = parseFloat($(this).find('[name="rate"]').val()) || 0;
      subtotal += quantity * rate;
    });

    const taxRate = parseFloat($('#taxRate').val()) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    $('#subtotalDisplay').text(`GHS${subtotal.toFixed(2)}`);
    $('#taxAmountDisplay').text(`GHS${taxAmount.toFixed(2)}`);
    $('#totalDisplay').text(`GHS${total.toFixed(2)}`);
    $('#taxRateDisplay').text(taxRate);
  }

  function addItemRow() {
    const template = $('#itemRowTemplate').html();
    const $row = $(template);
    $('#itemsContainer').append($row);
    $row.find('input').on('input', calculateTotals);
    calculateTotals();
  }

  $('#addItemBtn').click(function () {
    addItemRow();
  });

  $(document).on('click', '.remove-item', function () {
    $(this).closest('.item-row').remove();
    calculateTotals();
  });

  $('#taxRate').on('input', calculateTotals);

  // Add one row by default only if creating
  if (!invoiceId) {
    addItemRow();
  }

  $('#invoiceForm').submit(function (e) {
    e.preventDefault();

    const items = [];
    $('#itemsContainer .item-row').each(function () {
      const description = $(this).find('[name="description"]').val();
      const quantity = parseFloat($(this).find('[name="quantity"]').val());
      const rate = parseFloat($(this).find('[name="rate"]').val());
      if (description && quantity && rate) {
        items.push({ description, quantity, rate });
      }
    });

    const payload = {
      clientId: $('#clientId').val(),
      dueDate: $('#dueDate').val(),
      taxRate: parseFloat($('#taxRate').val()) || 0,
      notes: $('#notes').val(),
      items
    };

    const method = invoiceId ? 'PATCH' : 'POST';
    const url = invoiceId
      ? `${baseUrl()}/invoices/${invoiceId}`
      : `${baseUrl()}/invoices`;

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(invoiceId ? 'Failed to update invoice' : 'Failed to create invoice');
        }
        return response.json();
      })
      .then(data => {
        toastr.success(invoiceId ? 'Invoice updated successfully' : 'Invoice created successfully');
        window.location.href = '/invoices';
      })
      .catch(error => {
        toastr.error(error.message);
        console.error('Error:', error);
      });
  });
});
