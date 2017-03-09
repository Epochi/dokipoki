$(document).ready(function() {
    $(".button-collapse").sideNav();


$(window).scroll(function() {
    if(document.body.scrollTop == 0) {
         $("#nav").addClass("z-depth-0");
    } else {
        $("#nav").removeClass("z-depth-0");
    }
});

});


