$(function() {

    $("#buttonsContainer").removeClass("hide");

    $("#hostGame").click(function () {

        $("#buttonsContainer").addClass("hide");
        $("#qrcodeContainer").removeClass("hide");
        new QRCode(document.getElementById("qrcode"), window.location.href+"#blahblah");
        $("#gameId").text("25");
    });

    $("#joinGame").click(function () {
        $("#buttonsContainer").addClass("hide");
        $("#formContainer").removeClass("hide");
        $("#inputGameId").select();
    });

    $("#joinGameId").click(function () {
        $("#connect").addClass("hide");
        game.state.start("sync");
    });

    $(window).keypress(function (e) {
        if (e.charCode == 114) {
            window.location.reload(true);
        }
    });

    var socket = io();
});