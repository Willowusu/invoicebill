import { baseUrl } from "/assets/js/utils.js";


$(() => {
  let info = JSON.parse(sessionStorage.getItem("info"));

  $(".accountName").text(info.user.accountName);
  $("#userName").text(info.user.name)
  $("#userRole").text(info.user.role)
  $("#userEmail").text(info.user.email)
  $('.accountLogo').attr('src', info.user.accountLogo);


})