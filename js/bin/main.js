$(document).ready(function () {
  // MOBILE MENIU
  if ($.fn.sideNav) {
    $(".button-collapse").sideNav({
      edge: "right",
      closeOnClick: true,
      draggable: true
    });
  }

  // SCROLLSPY
  if ($.fn.scrollSpy) {
    $(".scrollspy").scrollSpy();
  }

  // NAVBAR SHADOW ON SCROLL
  $(window).on("scroll", function () {
    if (
      document.body.scrollTop === 0 &&
      document.documentElement.scrollTop === 0
    ) {
      $("#nav").addClass("z-depth-0");
    } else {
      $("#nav").removeClass("z-depth-0");
    }
  });

  // Prevent materialboxed click from re-triggering Masonry / other handlers
  $(".gallery-wrapper .materialboxed").on("click", function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    return;
  });

  // Init Masonry
  var $grid = $(".grid").masonry({
    itemSelector: ".grid-item",
    percentPosition: true,
    columnWidth: ".grid-sizer"
  });

  // Layout after images load
  if ($.fn.imagesLoaded) {
    $grid.imagesLoaded().progress(function () {
      $grid.masonry("layout");
    });
  }

  function initMaterialbox() {
    if ($.fn.materialbox) {
      $(".materialboxed").materialbox();
    }
  }

  function loadDeferredInVisibleItems() {
    // Load deferred JPG/PNG
    $(".grid-item:not(.hidden-gallery) img[data-src]").each(function () {
      var $img = $(this);
      var src = $img.attr("data-src");
      if (src) {
        $img.attr("src", src);
        $img.removeAttr("data-src");
      }
    });

    // Load deferred WEBP srcset
    $(".grid-item:not(.hidden-gallery) source[data-srcset]").each(function () {
      var $source = $(this);
      var srcset = $source.attr("data-srcset");
      if (srcset) {
        $source.attr("srcset", srcset);
        $source.removeAttr("data-srcset");
      }
    });
  }

  function reloadAndLayout() {
    loadDeferredInVisibleItems();

    // Wait a bit for browser to start fetching, then layout
    setTimeout(function () {
      if ($.fn.imagesLoaded) {
        $grid.imagesLoaded(function () {
          $grid.masonry("reloadItems");
          $grid.masonry("layout");
          initMaterialbox();
        });
      } else {
        $grid.masonry("reloadItems");
        $grid.masonry("layout");
        initMaterialbox();
      }
    }, 50);
  }

  // Show more / collapse
  var expanded = false;

  $("#show-more-gallery").on("click", function () {
    var $btn = $(this);
    var $restItems = $('.grid-item[data-gallery="rest"]');

    if (!expanded) {
      // Expand
      $restItems.removeClass("hidden-gallery");
      expanded = true;
      $btn.text("Rodyti mažiau");
      reloadAndLayout();
    } else {
      // Collapse
      $restItems.addClass("hidden-gallery");
      expanded = false;
      $btn.text("Rodyti daugiau");
      reloadAndLayout();

      var $gal = $("#Galerija");
      if ($gal.length) {
        $("html, body").animate({ scrollTop: $gal.offset().top - 80 }, 400);
      }
    }
  });

  // Init once
  initMaterialbox();
});
