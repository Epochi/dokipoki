$(document).ready(function () {
  // =========================
  // MOBILE MENIU (ATSIDARO IŠ DEŠINĖS)
  // =========================
  if ($.fn.sideNav) {
    $(".button-collapse").sideNav({
      edge: "right",
      closeOnClick: true,
      draggable: true
    });
  }

  // =========================
  // SCROLLSPY
  // =========================
  if ($.fn.scrollSpy) {
    $(".scrollspy").scrollSpy();
  }

  // =========================
  // NAVBAR SHADOW ON SCROLL
  // =========================
  $(window).on("scroll", function () {
    var atTop =
      document.body.scrollTop === 0 &&
      document.documentElement.scrollTop === 0;

    $("#nav").toggleClass("z-depth-0", atTop);
  });

  // =========================
  // GALERIJA: MASONRY INIT (SAUGIAI)
  // =========================
  var $grid = $(".grid");
  var hasGrid = $grid.length > 0;
  var hasMasonry = hasGrid && !!$.fn.masonry;
  var hasImagesLoaded = hasGrid && typeof $grid.imagesLoaded === "function";

  if (hasMasonry) {
    $grid.masonry({
      itemSelector: ".grid-item",
      percentPosition: true,
      columnWidth: ".grid-sizer"
    });
  }

  function layoutMasonry() {
    if (hasMasonry && $grid.data("masonry")) {
      $grid.masonry("layout");
    }
  }

  function layoutAfterImages($container) {
    if (!$container || !$container.length) return;

    if (hasImagesLoaded) {
      $container.imagesLoaded().always(function () {
        layoutMasonry();
      });
    } else {
      setTimeout(layoutMasonry, 200);
      setTimeout(layoutMasonry, 600);
      setTimeout(layoutMasonry, 1200);
    }
  }

  // =========================
  // GALERIJA: TOP + RODYTI DAUGIAU / MAŽIAU (100% be heuristikų)
  // Reikalavimas HTML'e:
  // - TOP: <div class="grid-item" data-gallery="top">
  // - REST: <div class="grid-item hidden-gallery" data-gallery="rest"> su <img data-src="...">
  // =========================
  var $btn = $("#show-more-gallery");

  if ($btn.length && hasGrid) {
    var expanded = false;

    var $topItems = $grid.find('.grid-item[data-gallery="top"]');
    var $restItems = $grid.find('.grid-item[data-gallery="rest"]');

    // Startas: top matomi, rest paslėpti (jei HTML jau taip padarė – nieko blogo)
    $topItems.removeClass("hidden-gallery");
    $restItems.addClass("hidden-gallery");

    function loadDeferredImages($scope) {
      var $root = $scope && $scope.length ? $scope : $grid;
      var $deferredImgs = $root.find("img[data-src]");
      if (!$deferredImgs.length) return;

      $deferredImgs.each(function () {
        var $img = $(this);
        var realSrc = $img.attr("data-src");
        if (!realSrc) return;

        $img.attr("src", realSrc);
        $img.removeAttr("data-src");
      });
    }

    $btn.on("click", function (e) {
      e.preventDefault();

      if (!expanded) {
        // RODYTI DAUGIAU: parodom rest + užkraunam tik dabar
        $restItems.removeClass("hidden-gallery");
        loadDeferredImages($restItems);

        expanded = true;
        $btn.text("Rodyti mažiau");

        layoutAfterImages($grid);
        layoutMasonry();
      } else {
        // RODYTI MAŽIAU: slepiam TIK rest, top paliekam
        $restItems.addClass("hidden-gallery");
        $topItems.removeClass("hidden-gallery");

        expanded = false;
        $btn.text("Rodyti daugiau");

        layoutMasonry();

        var $gal = $("#Galerija");
        if ($gal.length) {
          $("html, body").animate({ scrollTop: $gal.offset().top - 80 }, 400);
        }
      }
    });

    // Pirmas layout po pradinio įkrovimo (top nuotraukoms)
    layoutAfterImages($grid);
  }
});
