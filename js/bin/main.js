$(document).ready(function () {
  // MOBILE MENIU (Materialize 0.97.x)
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

  // ================================
  // PERSONAŽAI – SEARCH (mobile toggle + desktop nav item)
  // Veikia tik /personazai/ puslapyje
  // ================================
  (function initPersonazaiSearch() {
    var isPersonazaiPage =
      $("body").hasClass("page-personazai") || $("#Personazai").length > 0;

    if (!isPersonazaiPage) return;

    var $panel = $("#personazaiSearchPanel");
    var $input = $("#personazaiSearch");
    var $close = $("#personazaiSearchClose");
    var $empty = $("#personazaiSearchEmpty");
    var $cards = $("#Personazai .personazai-wrapper");

    if (!$panel.length || !$input.length) return;

    function normalize(s) {
      return (s || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function filter() {
      var q = normalize($input.val());
      var shown = 0;

      $cards.each(function () {
        var $card = $(this);
        var title = $card.attr("data-personazas") || $card.text();
        title = normalize(title);

        var match = q === "" || title.indexOf(q) !== -1;
        $card.css("display", match ? "" : "none");
        if (match) shown++;
      });

      if ($empty.length) {
        if (q !== "" && shown === 0) $empty.show();
        else $empty.hide();
      }
    }

    function openPanel() {
      try { $(".button-collapse").sideNav("hide"); } catch (e) {}

      $panel.stop(true, true).slideDown(160, function () {
        $panel.addClass("is-open").attr("aria-hidden", "false");
        setTimeout(function () { $input.trigger("focus"); }, 0);
      });
    }

    function closePanel() {
      $panel.stop(true, true).slideUp(160, function () {
        $panel.removeClass("is-open").attr("aria-hidden", "true");
      });

      $input.val("");
      filter();
    }

    function togglePanel(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if ($panel.hasClass("is-open")) closePanel();
      else openPanel();
    }

    // 1) MOBILE: 🔍 mygtukas šalia burgerio (paliekam kaip buvo)
// 1) MOBILE: 🔍 mygtukas šalia burgerio – įterpiam TIK kai burgeris matomas (mobile breakpoint)
function isBurgerVisible() {
  // Materialize: desktop'e burger turi .hide-on-large-only (display:none >= 993px)
  return $(".button-collapse").is(":visible");
}

function ensureMobileSearchToggle() {
  var $burger = $(".button-collapse").first();
  if (!$burger.length) return;

  // Desktop'e nieko neįterpiam – kad nesidubliuotų su desktop menu item
  if (!isBurgerVisible()) {
    $("#personazaiSearchToggle").remove();
    return;
  }

  // Mobile'e įterpiam, jei dar nėra
  if (!$("#personazaiSearchToggle").length) {
    $('<button id="personazaiSearchToggle" type="button" class="personazai-search-toggle right" aria-label="Atidaryti paiešką">⌕</button>')
      .insertAfter($burger);
  }
}

// paleidžiam iškart + po resize
ensureMobileSearchToggle();
$(window).on("resize orientationchange", function () {
  ensureMobileSearchToggle();
});


    // Handlers (mobile button)
    $(document)
      .off("click.personazaiMobileToggle")
      .on("click.personazaiMobileToggle", "#personazaiSearchToggle", togglePanel);

    // 2) DESKTOP: navbar item (li > a)
    $(document)
      .off("click.personazaiDesktopToggle")
      .on("click.personazaiDesktopToggle", "#personazaiSearchToggleDesktop", togglePanel);

    // input / close / ESC
    $input.off("input.personazai").on("input.personazai", filter);

    $close.off("click.personazai").on("click.personazai", function (e) {
      e.preventDefault(); e.stopPropagation();
      closePanel();
    });

    $(document)
      .off("keydown.personazai")
      .on("keydown.personazai", function (e) {
        if (e.key === "Escape" && $panel.hasClass("is-open")) closePanel();
      });
  })();

  // Init Masonry
  var $grid = $(".grid").masonry({
    itemSelector: ".grid-item",
    percentPosition: true,
    columnWidth: ".grid-sizer"
  });

  function layoutMasonry() {
    $grid.masonry("reloadItems");
    $grid.masonry("layout");
  }

  // Layout after images load (TOP images load immediately)
  if ($.fn.imagesLoaded) {
    $grid.imagesLoaded().progress(function () {
      layoutMasonry();
    });
    $grid.imagesLoaded().always(function () {
      layoutMasonry();
    });
  }

  // Extra safety: after full window load (hard refresh randomness fix)
  $(window).on("load", function () {
    layoutMasonry();
    setTimeout(layoutMasonry, 150);
    setTimeout(layoutMasonry, 400);
  });

  // Also relayout on resize/orientation changes
  $(window).on("resize orientationchange", function () {
    setTimeout(layoutMasonry, 80);
  });

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

    setTimeout(function () {
      if ($.fn.imagesLoaded) {
        $grid.imagesLoaded(function () {
          layoutMasonry();
        });
      } else {
        layoutMasonry();
      }
    }, 50);
  }

  // Show more / collapse
  var expanded = false;

  $("#show-more-gallery").on("click", function () {
    var $btn = $(this);
    var $restItems = $('.grid-item[data-gallery="rest"]');

    if (!expanded) {
      $restItems.removeClass("hidden-gallery");
      expanded = true;
      $btn.text("Rodyti mažiau");
      reloadAndLayout();
    } else {
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
});
