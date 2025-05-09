import { baseUrl } from "/assets/js/utils.js";


$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  // Load clients into dropdown
  fetch(`${baseUrl()}/clients`, {
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${info.token}`
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    })
    .then(data => {
      data.data.forEach(client => {
        $('#clientId').append(`<option value="${client._id}">${client.name}</option>`);
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });

  // Add initial item row
  addItemRow();

  $('#addItemBtn').click(function () {
    addItemRow();
  });

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

  $(document).on('click', '.remove-item', function () {
    $(this).closest('.item-row').remove();
    calculateTotals();
  });

  $('#taxRate').on('input', calculateTotals);


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

    fetch(`${baseUrl()}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${info.token}`
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      return response.json();
      })
      .then(data => {
      toastr.success('Invoice created successfully');
      window.location.href = '/invoices';
      })
      .catch(error => {
      toastr.error('Failed to create invoice');
      console.error('Error:', error);
      });
  });
});
