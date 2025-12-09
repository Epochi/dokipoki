$(document).ready(function () {
  // MOBILE MENIU
  $(".button-collapse").sideNav({
    closeOnClick: true,
    draggable: true
  });

  // SCROLLSPY
  $(".scrollspy").scrollSpy();

  // NAVBAR SHADOW ON SCROLL
  $(window).scroll(function () {
    if (document.body.scrollTop === 0 && document.documentElement.scrollTop === 0) {
      $("#nav").addClass("z-depth-0");
    } else {
      $("#nav").removeClass("z-depth-0");
    }
  });

  // GALERIJOS MATERIALBOX CLICK FIX
  $(".gallery-wrapper .materialboxed").click(function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    return;
  });

  // MASONRY INIT
  var $grid = $(".grid").masonry({
    itemSelector: ".grid-item",
    percentPosition: true,
    columnWidth: ".grid-sizer"
  });

  // MASONRY LAYOUT PO KIEKVIENOS FOTO UŽKROVIMO
  $grid.imagesLoaded().progress(function () {
    $grid.masonry("layout");
  });

  // =========================
  // GALERIJA: RODYTI DAUGIAU / MAŽIAU
  // =========================
  var $btn = $("#toggle-gallery");
  if ($btn.length) {
    var expanded = false;

    $btn.on("click", function (e) {
      e.preventDefault();

      var $items = $(".grid-item");

      if (!expanded) {
        // RODYTI DAUGIAU – parodyti visas
        $items.show().removeClass("hidden-gallery");
        expanded = true;
        $btn.text("Rodyti mažiau");
      } else {
        // RODYTI MAŽIAU – palikti tik pirmas 6
        $items.each(function (index) {
          if (index >= 6) {
            $(this).hide().addClass("hidden-gallery");
          }
        });
        expanded = false;
        $btn.text("Rodyti daugiau");

        // Scrolliname atgal prie galerijos viršaus
        var $gal = $("#Galerija");
        if ($gal.length) {
          $("html, body").animate(
            { scrollTop: $gal.offset().top - 80 },
            400
          );
        }
      }

      // PERLAYOUTINAM MASONRY
      if ($.fn.masonry) {
        $grid.masonry("reloadItems");
        $grid.masonry("layout");
      }
    });
  }
});
