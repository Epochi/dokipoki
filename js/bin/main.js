$(document).ready(function () {
  // =========================
  // MOBILE MENIU (ATSIDARO IŠ DEŠINĖS)
  // =========================
  $(".button-collapse").sideNav({
    edge: "right",      // meniu slankioja iš dešinės
    closeOnClick: true, // užsidaro paspaudus ant nuorodos
    draggable: true
  });

  // =========================
  // SCROLLSPY
  // =========================
  $(".scrollspy").scrollSpy();

  // =========================
  // NAVBAR SHADOW ON SCROLL
  // =========================
  $(window).scroll(function () {
    if (document.body.scrollTop === 0 && document.documentElement.scrollTop === 0) {
      $("#nav").addClass("z-depth-0");
    } else {
      $("#nav").removeClass("z-depth-0");
    }
  });

  // =========================
  // GALERIJOS MATERIALBOX CLICK FIX
  // =========================
  $(".gallery-wrapper .materialboxed").click(function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    return;
  });

  // =========================
  // MASONRY INIT (saugiai)
  // =========================
  var $grid = $(".grid");

  if ($grid.length && $.fn.masonry) {
    $grid.masonry({
      itemSelector: ".grid-item",
      percentPosition: true,
      columnWidth: ".grid-sizer"
    });
  }

  // MASONRY LAYOUT PO KIEKVIENOS FOTO UŽKROVIMO
  if ($grid.length && typeof $grid.imagesLoaded === "function") {
    $grid.imagesLoaded().progress(function () {
      if ($grid.data("masonry")) {
        $grid.masonry("layout");
      }
    });
  }

  // =========================
  // GALERIJA: RODYTI DAUGIAU / MAŽIAU
  // =========================
  var $btn = $("#show-more-gallery");

  if ($btn.length) {
    var expanded = false;
    var $items = $grid.length ? $grid.find(".grid-item") : $(".grid-item");

    // pradinė būsena – rodom tik pirmas 6
    $items.each(function (index) {
      if (index >= 6) {
        $(this).addClass("hidden-gallery");
      }
    });

    $btn.on("click", function (e) {
      e.preventDefault();

      if (!expanded) {
        // RODYTI DAUGIAU – parodyti visas
        $items.removeClass("hidden-gallery");
        expanded = true;
        $btn.text("Rodyti mažiau");
      } else {
        // RODYTI MAŽIAU – palikti tik pirmas 6
        $items.each(function (index) {
          if (index >= 6) {
            $(this).addClass("hidden-gallery");
          }
        });
        expanded = false;
        $btn.text("Rodyti daugiau");

        // Scrollinam atgal prie galerijos viršaus
        var $gal = $("#Galerija");
        if ($gal.length) {
          $("html, body").animate(
            { scrollTop: $gal.offset().top - 80 },
            400
          );
        }
      }

      // PERLAYOUTINAM MASONRY, jei jis aktyvus
      if ($grid.length && $grid.data("masonry")) {
        $grid.masonry("layout");
      }
    });
  }
});
