$(document).ready(function () {
  if ($.fn.sideNav) {
    $(".button-collapse").sideNav({
      edge: "right",
      closeOnClick: true,
      draggable: true
    });
  }

  if ($.fn.scrollSpy) {
    $(".scrollspy").scrollSpy();
  }

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
      try {
        $(".button-collapse").sideNav("hide");
      } catch (e) {}

      $panel.stop(true, true).slideDown(160, function () {
        $panel.addClass("is-open").attr("aria-hidden", "false");
        setTimeout(function () {
          $input.trigger("focus");
        }, 0);
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
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if ($panel.hasClass("is-open")) closePanel();
      else openPanel();
    }

    function isBurgerVisible() {
      return $(".button-collapse").is(":visible");
    }

    function ensureMobileSearchToggle() {
      var $burger = $(".button-collapse").first();
      if (!$burger.length) return;

      if (!isBurgerVisible()) {
        $("#personazaiSearchToggle").remove();
        return;
      }

      if (!$("#personazaiSearchToggle").length) {
        $('<button id="personazaiSearchToggle" type="button" class="personazai-search-toggle right" aria-label="Atidaryti paieska">&#8989;</button>')
          .insertAfter($burger);
      }
    }

    ensureMobileSearchToggle();
    $(window).on("resize orientationchange", function () {
      ensureMobileSearchToggle();
    });

    $(document)
      .off("click.personazaiMobileToggle")
      .on("click.personazaiMobileToggle", "#personazaiSearchToggle", togglePanel);

    $(document)
      .off("click.personazaiDesktopToggle")
      .on("click.personazaiDesktopToggle", "#personazaiSearchToggleDesktop", togglePanel);

    $input.off("input.personazai").on("input.personazai", filter);

    $close.off("click.personazai").on("click.personazai", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });

    $(document)
      .off("keydown.personazai")
      .on("keydown.personazai", function (e) {
        if (e.key === "Escape" && $panel.hasClass("is-open")) closePanel();
      });
  })();

  function loadDeferredInVisibleItems() {
    $(".grid-item:not(.hidden-gallery) img[data-src]").each(function () {
      var $img = $(this);
      var src = $img.attr("data-src");
      if (src) {
        $img.attr("src", src);
        $img.removeAttr("data-src");
      }
    });

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
  }

  (function initInstagramGallery() {
    var $gallery = $('#Galerija[data-gallery-source="instagram"]');
    if (!$gallery.length) return;

    var batchSize = parseInt($gallery.attr("data-batch-size"), 10) || 9;
    var $sentinel = $gallery.find("[data-instagram-sentinel]");
    var $modal = $("#InstagramPreviewModal");
    var $stage = $modal.find("[data-instagram-stage]");
    var $dots = $modal.find("[data-instagram-dots]");
    var $openLinks = $modal.find("[data-instagram-open-link]");
    var observer = null;
    var activeMedia = [];
    var activeIndex = 0;

    function remainingHiddenItems() {
      return $gallery.find(".instagram-grid-item.hidden-gallery");
    }

    function revealNextBatch() {
      var $nextItems = remainingHiddenItems().slice(0, batchSize);

      if (!$nextItems.length) {
        $sentinel.addClass("is-hidden");
        return false;
      }

      $nextItems.removeClass("hidden-gallery");
      reloadAndLayout();

      if (!remainingHiddenItems().length) {
        $sentinel.addClass("is-hidden");
      }

      return true;
    }

    function setOpenLinks(permalink) {
      var fallbackUrl = "https://www.instagram.com/dokipoki_personazai/";
      $openLinks.attr("href", permalink || fallbackUrl);
    }

    function showModal() {
      $modal.addClass("is-open").attr("aria-hidden", "false");
      $("body").addClass("instagram-modal-open");
    }

    function closeModal() {
      $stage.find("video").each(function () {
        this.pause();
        this.removeAttribute("src");
        this.load();
      });

      $stage.empty();
      $dots.empty();
      activeMedia = [];
      activeIndex = 0;
      $modal.removeClass("is-open").attr("aria-hidden", "true");
      $("body").removeClass("instagram-modal-open");
    }

    function updateNavState() {
      var isCarousel = activeMedia.length > 1;

      $modal.find("[data-instagram-nav]").prop("hidden", !isCarousel);
      $dots.toggleClass("is-hidden", !isCarousel);
    }

    function renderDots() {
      if (activeMedia.length < 2) {
        $dots.empty();
        return;
      }

      var html = "";
      for (var i = 0; i < activeMedia.length; i++) {
        html += '<button type="button" class="instagram-preview-modal__dot' +
          (i === activeIndex ? ' is-active' : '') +
          '" data-instagram-dot="' + i + '" aria-label="Rodyti ' + (i + 1) + ' nuotrauką"></button>';
      }

      $dots.html(html);
    }

    function renderSlide() {
      var item = activeMedia[activeIndex];
      if (!item) return;

      if (item.kind === "video" && item.video_url) {
        $stage.html(
          '<video class="instagram-preview-modal__video" controls playsinline preload="metadata" poster="' +
          item.thumb_path +
          '" src="' +
          item.video_url +
          '"></video>'
        );
      } else {
        $stage.html(
          '<img class="instagram-preview-modal__image" src="' +
          item.thumb_path +
          '" alt="' +
          escapeHtml(item.alt || "") +
          '">'
        );
      }

      renderDots();
      updateNavState();
    }

    function openMediaPreview(permalink, mediaItems) {
      activeMedia = Array.isArray(mediaItems) ? mediaItems : [];
      activeIndex = 0;
      setOpenLinks(permalink);
      renderSlide();
      showModal();
    }

    function moveSlide(direction) {
      if (activeMedia.length < 2) return;

      activeIndex += direction;

      if (activeIndex < 0) activeIndex = activeMedia.length - 1;
      if (activeIndex >= activeMedia.length) activeIndex = 0;

      renderSlide();
    }

    function parseMediaData(rawValue) {
      if (!rawValue) return [];

      try {
        return JSON.parse(rawValue);
      } catch (error) {
        return [];
      }
    }

    if ($sentinel.length && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        if (!entries[0] || !entries[0].isIntersecting) return;

        if (observer) observer.unobserve($sentinel.get(0));

        if (revealNextBatch() && observer) {
          setTimeout(function () {
            observer.observe($sentinel.get(0));
          }, 180);
        }
      }, {
        rootMargin: "320px 0px"
      });

      observer.observe($sentinel.get(0));
    } else if ($sentinel.length) {
      revealNextBatch();
    }

    $(document)
      .off("click.instagramGallery")
      .on("click.instagramGallery", ".js-instagram-card", function (e) {
        e.preventDefault();

        var $item = $(this).closest(".instagram-grid-item");
        var permalink = $item.attr("data-instagram-permalink");
        var mediaItems = parseMediaData($item.attr("data-instagram-media"));

        mediaItems = mediaItems.map(function (item) {
          return {
            id: item.id,
            kind: item.kind,
            alt: item.alt,
            thumb_path: item.thumb_path ? item.thumb_path : "",
            video_url: item.video_url || null
          };
        });

        openMediaPreview(permalink, mediaItems);
      });

    $(document)
      .off("click.instagramModalClose")
      .on("click.instagramModalClose", ".js-instagram-modal-close", function (e) {
        e.preventDefault();
        closeModal();
      });

    $(document)
      .off("click.instagramNav")
      .on("click.instagramNav", "[data-instagram-nav]", function (e) {
        e.preventDefault();
        moveSlide($(this).attr("data-instagram-nav") === "next" ? 1 : -1);
      });

    $(document)
      .off("click.instagramDots")
      .on("click.instagramDots", "[data-instagram-dot]", function (e) {
        e.preventDefault();
        activeIndex = parseInt($(this).attr("data-instagram-dot"), 10) || 0;
        renderSlide();
      });

    $modal
      .find(".instagram-preview-modal__backdrop")
      .off("click.instagramBackdrop")
      .on("click.instagramBackdrop", closeModal);

    $modal
      .find(".instagram-preview-modal__panel")
      .off("click.instagramPanel")
      .on("click.instagramPanel", function (e) {
        var $target = $(e.target);
        var isInteractive = $target.closest(
          ".instagram-preview-modal__image, " +
          ".instagram-preview-modal__video, " +
          ".instagram-preview-modal__nav, " +
          ".instagram-preview-modal__open, " +
          ".instagram-preview-modal__close, " +
          ".instagram-preview-modal__dots, " +
          ".mejs-controls, " +
          "video"
        ).length > 0;

        if (!isInteractive) {
          closeModal();
        }
      });

    $(document)
      .off("keydown.instagramModal")
      .on("keydown.instagramModal", function (e) {
        if (!$modal.hasClass("is-open")) return;

        if (e.key === "Escape") closeModal();
        if (e.key === "ArrowLeft") moveSlide(-1);
        if (e.key === "ArrowRight") moveSlide(1);
      });
  })();

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});
