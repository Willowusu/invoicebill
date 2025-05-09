import { baseUrl } from "/assets/js/utils.js";

$("#clientsTable").DataTable();

$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  fetch(`${baseUrl()}/clients`, {
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
        $("#clientsList").empty();


          response.data.forEach(client => {
            let row = `
            <tr>
              <td><a href="/clients/${client?._id}">${client?.name}</a></td>
              <td>${client?.email}</td>
              <td>${client?.phone}</td>
              <td>${client?.address}</td>
              <td>${client?.status}</td>
            </tr>
          `;
            $("#clientsList").append(row);
          });

      } else {
        showToast(response.message, 'text-bg-danger');
      }
    })
    .catch(error => {
      console.error("Request failed:", error);
    });
})