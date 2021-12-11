function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function ($) {
  var $ = jQuery = $;
  var cc = {
    sections: []
  };
  theme.Shopify = {
    formatMoney: function formatMoney(t, r) {
      function e(t, r) {
        return void 0 === t ? r : t;
      }

      function a(t, r, a, o) {
        if (r = e(r, 2), a = e(a, ","), o = e(o, "."), isNaN(t) || null == t) return 0;
        t = (t / 100).toFixed(r);
        var n = t.split(".");
        return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + a) + (n[1] ? o + n[1] : "");
      }

      "string" == typeof t && (t = t.replace(".", ""));
      var o = "",
          n = /\{\{\s*(\w+)\s*\}\}/,
          i = r || this.money_format;

      switch (i.match(n)[1]) {
        case "amount":
          o = a(t, 2);
          break;

        case "amount_no_decimals":
          o = a(t, 0);
          break;

        case "amount_with_comma_separator":
          o = a(t, 2, ".", ",");
          break;

        case "amount_with_space_separator":
          o = a(t, 2, " ", ",");
          break;

        case "amount_with_period_and_space_separator":
          o = a(t, 2, " ", ".");
          break;

        case "amount_no_decimals_with_comma_separator":
          o = a(t, 0, ".", ",");
          break;

        case "amount_no_decimals_with_space_separator":
          o = a(t, 0, " ", "");
          break;

        case "amount_with_apostrophe_separator":
          o = a(t, 2, "'", ".");
          break;

        case "amount_with_decimal_separator":
          o = a(t, 2, ".", ".");
      }

      return i.replace(n, o);
    },
    formatImage: function formatImage(originalImageUrl, format) {
      return originalImageUrl.replace(/^(.*)\.([^\.]*)$/g, '$1_' + format + '.$2');
    },
    Image: {
      imageSize: function imageSize(t) {
        var e = t.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
        return null !== e ? e[1] : null;
      },
      getSizedImageUrl: function getSizedImageUrl(t, e) {
        if (null == e) return t;
        if ("master" == e) return this.removeProtocol(t);
        var o = t.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

        if (null != o) {
          var i = t.split(o[0]),
              r = o[0];
          return this.removeProtocol(i[0] + "_" + e + r);
        }

        return null;
      },
      removeProtocol: function removeProtocol(t) {
        return t.replace(/http(s)?:/, "");
      }
    }
  };

  (function () {
    function throttle(callback, threshold) {
      var debounceTimeoutId = -1;
      var tick = false;
      return function () {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = setTimeout(callback, threshold);

        if (!tick) {
          callback.call();
          tick = true;
          setTimeout(function () {
            tick = false;
          }, threshold);
        }
      };
    }

    var scrollEvent = document.createEvent('Event');
    scrollEvent.initEvent('throttled-scroll', true, true);
    window.addEventListener("scroll", throttle(function () {
      window.dispatchEvent(scrollEvent);
    }, 200));
  })(); // requires: throttled-scroll, debouncedresize


  theme.Sections = new function () {
    var _ = this;

    _._instances = [];
    _._deferredSectionTargets = [];
    _._sections = [];
    _._deferredLoadViewportExcess = 300; // load defferred sections within this many px of viewport

    _._deferredWatcherRunning = false;

    _.init = function () {
      $(document).on('shopify:section:load', function (e) {
        // load a new section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);

        if (target) {
          _.sectionLoad(target);
        }
      }).on('shopify:section:unload', function (e) {
        // unload existing section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);

        if (target) {
          _.sectionUnload(target);
        }
      });
      $(window).on('throttled-scroll.themeSectionDeferredLoader debouncedresize.themeSectionDeferredLoader', _._processDeferredSections);
      _._deferredWatcherRunning = true;
    }; // register a type of section


    _.register = function (type, section, options) {
      _._sections.push({
        type: type,
        section: section,
        afterSectionLoadCallback: options ? options.afterLoad : null,
        afterSectionUnloadCallback: options ? options.afterUnload : null
      }); // load now


      $('[data-section-type="' + type + '"]').each(function () {
        if (Shopify.designMode || options && options.deferredLoad === false || !_._deferredWatcherRunning) {
          _.sectionLoad(this);
        } else {
          _.sectionDeferredLoad(this, options);
        }
      });
    }; // prepare a section to load later


    _.sectionDeferredLoad = function (target, options) {
      _._deferredSectionTargets.push({
        target: target,
        deferredLoadViewportExcess: options && options.deferredLoadViewportExcess ? options.deferredLoadViewportExcess : _._deferredLoadViewportExcess
      });

      _._processDeferredSections(true);
    }; // load deferred sections if in/near viewport


    _._processDeferredSections = function (firstRunCheck) {
      if (_._deferredSectionTargets.length) {
        var viewportTop = $(window).scrollTop(),
            viewportBottom = viewportTop + $(window).height(),
            loopStart = firstRunCheck === true ? _._deferredSectionTargets.length - 1 : 0;

        for (var i = loopStart; i < _._deferredSectionTargets.length; i++) {
          var target = _._deferredSectionTargets[i].target,
              viewportExcess = _._deferredSectionTargets[i].deferredLoadViewportExcess,
              sectionTop = $(target).offset().top - viewportExcess,
              doLoad = sectionTop > viewportTop && sectionTop < viewportBottom;

          if (!doLoad) {
            var sectionBottom = sectionTop + $(target).outerHeight() + viewportExcess * 2;
            doLoad = sectionBottom > viewportTop && sectionBottom < viewportBottom;
          }

          if (doLoad || sectionTop < viewportTop && sectionBottom > viewportBottom) {
            // in viewport, load
            _.sectionLoad(target); // remove from deferred queue and resume checks


            _._deferredSectionTargets.splice(i, 1);

            i--;
          }
        }
      } // remove event if no more deferred targets left, if not on first run


      if (firstRunCheck !== true && _._deferredSectionTargets.length === 0) {
        _._deferredWatcherRunning = false;
        $(window).off('.themeSectionDeferredLoader');
      }
    }; // load in a section


    _.sectionLoad = function (target) {
      var target = target,
          sectionObj = _._sectionForTarget(target),
          section = false;

      if (sectionObj.section) {
        section = sectionObj.section;
      } else {
        section = sectionObj;
      }

      if (section !== false) {
        var instance = {
          target: target,
          section: section,
          $shopifySectionContainer: $(target).closest('.shopify-section'),
          thisContext: {
            functions: section.functions
          }
        };

        _._instances.push(instance); //Initialise any components


        if ($(target).data('components')) {
          //Init each component
          var components = $(target).data('components').split(',');
          components.forEach(function (component) {
            $(document).trigger('cc:component:load', [component, target]);
          });
        }

        _._callSectionWith(section, 'onSectionLoad', target, instance.thisContext);

        _._callSectionWith(section, 'afterSectionLoadCallback', target, instance.thisContext); // attach additional UI events if defined


        if (section.onSectionSelect) {
          instance.$shopifySectionContainer.on('shopify:section:select', function (e) {
            _._callSectionWith(section, 'onSectionSelect', e.target, instance.thisContext);
          });
        }

        if (section.onSectionDeselect) {
          instance.$shopifySectionContainer.on('shopify:section:deselect', function (e) {
            _._callSectionWith(section, 'onSectionDeselect', e.target, instance.thisContext);
          });
        }

        if (section.onBlockSelect) {
          $(target).on('shopify:block:select', function (e) {
            _._callSectionWith(section, 'onBlockSelect', e.target, instance.thisContext);
          });
        }

        if (section.onBlockDeselect) {
          $(target).on('shopify:block:deselect', function (e) {
            _._callSectionWith(section, 'onBlockDeselect', e.target, instance.thisContext);
          });
        }
      }
    }; // unload a section


    _.sectionUnload = function (target) {
      var sectionObj = _._sectionForTarget(target);

      var instanceIndex = -1;

      for (var i = 0; i < _._instances.length; i++) {
        if (_._instances[i].target == target) {
          instanceIndex = i;
        }
      }

      if (instanceIndex > -1) {
        var instance = _._instances[instanceIndex]; // remove events and call unload, if loaded

        $(target).off('shopify:block:select shopify:block:deselect');
        instance.$shopifySectionContainer.off('shopify:section:select shopify:section:deselect');

        _._callSectionWith(instance.section, 'onSectionUnload', target, instance.thisContext);

        _._callSectionWith(sectionObj, 'afterSectionUnloadCallback', target, instance.thisContext);

        _._instances.splice(instanceIndex); //Destroy any components


        if ($(target).data('components')) {
          //Init each component
          var components = $(target).data('components').split(',');
          components.forEach(function (component) {
            $(document).trigger('cc:component:unload', [component, target]);
          });
        }
      } else {
        // check if it was a deferred section
        for (var i = 0; i < _._deferredSectionTargets.length; i++) {
          if (_._deferredSectionTargets[i].target == target) {
            _._deferredSectionTargets[i].splice(i, 1);

            break;
          }
        }
      }
    }; // helpers


    _._callSectionWith = function (section, method, container, thisContext) {
      if (typeof section[method] === 'function') {
        try {
          if (thisContext) {
            section[method].bind(thisContext)(container);
          } else {
            section[method](container);
          }
        } catch (ex) {
          var sectionType = container.dataset['sectionType'];
          console.log("Theme warning: '".concat(method, "' failed for section '").concat(sectionType, "'"));
          console.debug(container, ex.stack);
        }
      }
    };

    _._themeSectionTargetFromShopifySectionTarget = function (target) {
      var $target = $('[data-section-type]:first', target);

      if ($target.length > 0) {
        return $target[0];
      } else {
        return false;
      }
    };

    _._sectionForTarget = function (target) {
      var type = $(target).attr('data-section-type');

      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return _._sections[i];
        }
      }

      return false;
    };

    _._sectionAlreadyRegistered = function (type) {
      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return true;
        }
      }

      return false;
    };
  }(); // Loading third party scripts

  theme.scriptsLoaded = {};

  theme.loadScriptOnce = function (src, callback, beforeRun, sync) {
    if (typeof theme.scriptsLoaded[src] === 'undefined') {
      theme.scriptsLoaded[src] = [];
      var tag = document.createElement('script');
      tag.src = src;

      if (sync || beforeRun) {
        tag.async = false;
      }

      if (beforeRun) {
        beforeRun();
      }

      if (typeof callback === 'function') {
        theme.scriptsLoaded[src].push(callback);

        if (tag.readyState) {
          // IE, incl. IE9
          tag.onreadystatechange = function () {
            if (tag.readyState == "loaded" || tag.readyState == "complete") {
              tag.onreadystatechange = null;

              for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
                theme.scriptsLoaded[this][i]();
              }

              theme.scriptsLoaded[this] = true;
            }
          }.bind(src);
        } else {
          tag.onload = function () {
            // Other browsers
            for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
              theme.scriptsLoaded[this][i]();
            }

            theme.scriptsLoaded[this] = true;
          }.bind(src);
        }
      }

      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      return true;
    } else if (_typeof(theme.scriptsLoaded[src]) === 'object' && typeof callback === 'function') {
      theme.scriptsLoaded[src].push(callback);
    } else {
      if (typeof callback === 'function') {
        callback();
      }

      return false;
    }
  };

  theme.loadStyleOnce = function (src) {
    var srcWithoutProtocol = src.replace(/^https?:/, '');

    if (!document.querySelector('link[href="' + encodeURI(srcWithoutProtocol) + '"]')) {
      var tag = document.createElement('link');
      tag.href = srcWithoutProtocol;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      var firstTag = document.getElementsByTagName('link')[0];
      firstTag.parentNode.insertBefore(tag, firstTag);
    }
  };

  theme.Disclosure = function () {
    var selectors = {
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };
    var classes = {
      listVisible: 'disclosure-list--visible'
    };

    function Disclosure($disclosure) {
      this.$container = $disclosure;
      this.cache = {};

      this._cacheSelectors();

      this._connectOptions();

      this._connectToggle();

      this._onFocusOut();
    }

    Disclosure.prototype = $.extend({}, Disclosure.prototype, {
      _cacheSelectors: function _cacheSelectors() {
        this.cache = {
          $disclosureList: this.$container.find(selectors.disclosureList),
          $disclosureToggle: this.$container.find(selectors.disclosureToggle),
          $disclosureInput: this.$container.find(selectors.disclosureInput),
          $disclosureOptions: this.$container.find(selectors.disclosureOptions)
        };
      },
      _connectToggle: function _connectToggle() {
        this.cache.$disclosureToggle.on('click', function (evt) {
          var ariaExpanded = $(evt.currentTarget).attr('aria-expanded') === 'true';
          $(evt.currentTarget).attr('aria-expanded', !ariaExpanded);
          this.cache.$disclosureList.toggleClass(classes.listVisible);
        }.bind(this));
      },
      _connectOptions: function _connectOptions() {
        this.cache.$disclosureOptions.on('click', function (evt) {
          evt.preventDefault();

          this._submitForm($(evt.currentTarget).data('value'));
        }.bind(this));
      },
      _onFocusOut: function _onFocusOut() {
        this.cache.$disclosureToggle.on('focusout', function (evt) {
          var disclosureLostFocus = this.$container.has(evt.relatedTarget).length === 0;

          if (disclosureLostFocus) {
            this._hideList();
          }
        }.bind(this));
        this.cache.$disclosureList.on('focusout', function (evt) {
          var childInFocus = $(evt.currentTarget).has(evt.relatedTarget).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(classes.listVisible);

          if (isVisible && !childInFocus) {
            this._hideList();
          }
        }.bind(this));
        this.$container.on('keyup', function (evt) {
          if (evt.which !== 27) return; // escape

          this._hideList();

          this.cache.$disclosureToggle.focus();
        }.bind(this));

        this.bodyOnClick = function (evt) {
          var isOption = this.$container.has(evt.target).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(classes.listVisible);

          if (isVisible && !isOption) {
            this._hideList();
          }
        }.bind(this);

        $('body').on('click', this.bodyOnClick);
      },
      _submitForm: function _submitForm(value) {
        this.cache.$disclosureInput.val(value);
        this.$container.parents('form').submit();
      },
      _hideList: function _hideList() {
        this.cache.$disclosureList.removeClass(classes.listVisible);
        this.cache.$disclosureToggle.attr('aria-expanded', false);
      },
      unload: function unload() {
        $('body').off('click', this.bodyOnClick);
        this.cache.$disclosureOptions.off();
        this.cache.$disclosureToggle.off();
        this.cache.$disclosureList.off();
        this.$container.off();
      }
    });
    return Disclosure;
  }(); /// Show a short-lived text popup above an element


  theme.showQuickPopup = function (message, $origin) {
    var $popup = $('<div class="simple-popup"/>');
    var offs = $origin.offset();
    $popup.html(message).css({
      'left': offs.left,
      'top': offs.top
    }).hide();
    $('body').append($popup);
    $popup.css({
      marginTop: -$popup.outerHeight() - 10,
      marginLeft: -($popup.outerWidth() - $origin.outerWidth()) / 2
    });
    $popup.fadeIn(200).delay(3500).fadeOut(400, function () {
      $(this).remove();
    });
  }; //v1.0


  $.fn.staggerEvent = function (ev, delay) {
    var ev = ev;
    return $(this).each(function (i) {
      var $this = $(this);
      setTimeout(function () {
        $this.trigger(ev);
      }, delay * i);
    });
  }; // v1.0


  $.fn.replaceImageWithNewImgDeets = function (newImg) {
    //Avoids blank.gif breaking imagesLoaded with Firefox event bug
    var newTag = $(this).clone().wrap('<div />').parent().html();
    newTag = newTag.replace(/(srcset=")([^"]*)/gi, "$1" + $(newImg).data('srcset'));
    var $newTag = $(newTag);
    $(this).after($newTag).remove();
    return $newTag;
  }; // v1.0
  //Find out how wide scrollbars are on this browser


  $.scrollBarWidth = function () {
    var $temp = $('<div/>').css({
      width: 100,
      height: 100,
      overflow: 'scroll',
      position: 'absolute',
      top: -9999
    }).prependTo('body');
    var w = $temp[0].offsetWidth - $temp[0].clientWidth;
    $temp.remove();
    return w;
  };

  var ccPopup = /*#__PURE__*/function () {
    "use strict";

    function ccPopup($container, namespace) {
      _classCallCheck(this, ccPopup);

      this.$container = $container;
      this.namespace = namespace;
      this.cssClasses = {
        visible: 'cc-popup--visible',
        bodyNoScroll: 'cc-popup-no-scroll',
        bodyNoScrollPadRight: 'cc-popup-no-scroll-pad-right'
      };
    }
    /**
     * Open popup on timer / local storage - move focus to input ensure you can tab to submit and close
     * Add the cc-popup--visible class
     * Update aria to visible
     */


    _createClass(ccPopup, [{
      key: "open",
      value: function open(callback) {
        var _this2 = this;

        // Prevent the body from scrolling
        if (this.$container.data('freeze-scroll')) {
          $('body').addClass(this.cssClasses.bodyNoScroll); // Add any padding necessary to the body to compensate for the scrollbar that just disappeared

          var scrollDiv = document.createElement('div');
          scrollDiv.className = 'popup-scrollbar-measure';
          document.body.appendChild(scrollDiv);
          var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
          document.body.removeChild(scrollDiv);

          if (scrollbarWidth > 0) {
            $('body').css('padding-right', scrollbarWidth + 'px').addClass(this.cssClasses.bodyNoScrollPadRight);
          }
        } // Add reveal class


        this.$container.addClass(this.cssClasses.visible); // Track previously focused element

        this.previouslyActiveElement = document.activeElement; // Focus on the close button after the animation in has completed

        setTimeout(function () {
          _this2.$container.find('.cc-popup-close')[0].focus();
        }, 500); // Pressing escape closes the modal

        $(window).on('keydown' + this.namespace, function (event) {
          if (event.keyCode === 27) {
            _this2.close();
          }
        });

        if (callback) {
          callback();
        }
      }
    }, {
      key: "close",
      value:
      /**
       * Close popup on click of close button or background - where does the focus go back to?
       * Remove the cc-popup--visible class
       */
      function close(callback) {
        var _this3 = this;

        // Remove reveal class
        this.$container.removeClass(this.cssClasses.visible); // Revert focus

        if (this.previouslyActiveElement) {
          $(this.previouslyActiveElement).focus();
        } // Destroy the escape event listener


        $(window).off('keydown' + this.namespace); // Allow the body to scroll and remove any scrollbar-compensating padding

        if (this.$container.data('freeze-scroll')) {
          var transitionDuration = 500;
          var $innerModal = this.$container.find('.cc-popup-modal');

          if ($innerModal.length) {
            transitionDuration = parseFloat(getComputedStyle($innerModal[0])['transitionDuration']);

            if (transitionDuration && transitionDuration > 0) {
              transitionDuration *= 1000;
            }
          }

          setTimeout(function () {
            $('body').removeClass(_this3.cssClasses.bodyNoScroll).removeClass(_this3.cssClasses.bodyNoScrollPadRight).css('padding-right', '0');
          }, transitionDuration);
        }

        if (callback) {
          callback();
        }
      }
    }]);

    return ccPopup;
  }();

  ;

  (function ($) {
    $.fn.initAnimateOnScroll = function () {
      if (Waypoint) {
        Waypoint.refreshAll();
      }

      if ($('.cc-animate-enabled').length && $(window).outerWidth() >= 768 || $('.cc-animate-enabled-mobile').length && $(window).outerWidth() < 768) {
        var animationTimeout = 200;

        if (typeof $('.cc-animate-enabled').data('cc-animate-timeout') !== "undefined") {
          animationTimeout = $('.cc-animate-enabled').data('cc-animate-timeout');
        } //Animates all of the children in an element (staggered)


        $('[data-cc-animate-children]:not(.cc-animate-init)').each(function () {
          var animation = $(this).data('cc-animate-children') ? $(this).data('cc-animate-children') : 'cc-fade-in';
          $(this).find('> *').each(function (index) {
            $(this).attr('data-cc-animate', animation).attr('data-cc-animate-delay', (index + 1) / 10 + 's');
          });
          $(this).addClass('cc-animate-init');
        });
        $("[data-cc-animate]:not(.cc-animate-init)").each(function () {
          //Allows you to set the animation delay
          if ($(this).attr('data-cc-animate-delay')) {
            $(this).css('transition-delay', $(this).data('cc-animate-delay'));
          } //Allows you to set the animation duration


          if ($(this).attr('data-cc-animate-duration')) {
            $(this).css('transition-duration', $(this).data('cc-animate-duration'));
          } //Get the animation type if any (e.g. cc-fade-in-up)


          var animation = $(this).data('cc-animate'); //Init the waypoint

          $(this).addClass(animation).addClass('cc-animate-init').waypoint({
            handler: function handler(direction) {
              var $elem = $(this.element);

              if (!$elem.hasClass('cc-animate-complete')) {
                // console.log($elem.attr('class'));
                setTimeout(function () {
                  $elem.addClass('-in').addClass('cc-animate-complete');
                }, animationTimeout);
                setTimeout(function () {
                  //Once the animation is complete (assume 5 seconds), remove the animate attribute
                  //to remove all css
                  $elem.removeAttr("data-cc-animate").css("transition-duration", "").css("transition-delay", "");
                }, 5000);
              }
            },
            offset: $(this).data('cc-animate-offset') ? $(this).data('cc-animate-offset') : '100%'
          });
        });
      }
    };

    $.fn.initAnimateOnScroll();
    $(window).on('debouncedresizewidth', $.fn.initAnimateOnScroll);
    $(document).on('shopify:section:load shopify:section:unload', function () {
      setTimeout($.fn.initAnimateOnScroll, 100);
    });
  })(theme.jQuery); // Manage videos


  theme.VideoManager = new function () {
    var _ = this;

    _._permitPlayback = function (container) {
      return !($(container).hasClass('video-container--background') && $(window).outerWidth() < 768);
    }; // Youtube


    _.youtubeVars = {
      incrementor: 0,
      apiReady: false,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="youtube"]:not(.video--init)'
    };

    _.youtubeApiReady = function () {
      _.youtubeVars.apiReady = true;

      _._loadYoutubeVideos();
    };

    _._loadYoutubeVideos = function (container) {
      if ($(_.youtubeVars.toProcessSelector, container).length) {
        if (_.youtubeVars.apiReady) {
          // play those videos
          $(_.youtubeVars.toProcessSelector, container).each(function () {
            // Don't init background videos on mobile
            if (_._permitPlayback($(this))) {
              $(this).addClass('video--init');
              _.youtubeVars.incrementor++;
              var containerId = 'theme-yt-video-' + _.youtubeVars.incrementor;
              $(this).data('video-container-id', containerId);
              var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).appendTo($('.video-container__video', this));
              var autoplay = $(this).data('video-autoplay');
              var loop = $(this).data('video-loop');
              var player = new YT.Player(containerId, {
                height: '360',
                width: '640',
                videoId: $(this).data('video-id'),
                playerVars: {
                  iv_load_policy: 3,
                  modestbranding: 1,
                  autoplay: autoplay ? 1 : 0,
                  loop: loop ? 1 : 0,
                  playlist: $(this).data('video-id'),
                  rel: 0,
                  showinfo: 0
                },
                events: {
                  onReady: _._onYoutubePlayerReady.bind({
                    autoplay: autoplay,
                    loop: loop,
                    $container: $(this)
                  }),
                  onStateChange: _._onYoutubePlayerStateChange.bind({
                    autoplay: autoplay,
                    loop: loop,
                    $container: $(this)
                  })
                }
              });
              _.youtubeVars.videoData[containerId] = {
                id: containerId,
                container: this,
                videoElement: videoElement,
                player: player
              };
            }
          });
        } else {
          // load api
          theme.loadScriptOnce('https://www.youtube.com/iframe_api');
        }
      }
    };

    _._onYoutubePlayerReady = function (event) {
      event.target.setPlaybackQuality('hd1080');

      if (this.autoplay) {
        event.target.mute();
        event.target.playVideo();
      }

      _._initBackgroundVideo(this.$container);
    };

    _._onYoutubePlayerStateChange = function (event) {
      if (event.data == YT.PlayerState.PLAYING) {
        this.$container.addClass('video--play-started');

        if (this.autoplay) {
          event.target.mute();
        }

        if (this.loop) {
          // 4 times a second, check if we're in the final second of the video. If so, loop it for a more seamless loop
          var finalSecond = event.target.getDuration() - 1;

          if (finalSecond > 2) {
            var loopTheVideo = function loopTheVideo() {
              if (event.target.getCurrentTime() > finalSecond) {
                event.target.seekTo(0);
              }

              setTimeout(loopTheVideo, 250);
            };

            loopTheVideo();
          }
        }
      }
    };

    _._unloadYoutubeVideos = function (container) {
      for (var dataKey in _.youtubeVars.videoData) {
        var data = _.youtubeVars.videoData[dataKey];

        if ($(container).find(data.container).length) {
          data.player.destroy();
          delete _.youtubeVars.videoData[dataKey];
          return;
        }
      }
    }; // Vimeo


    _.vimeoVars = {
      incrementor: 0,
      apiReady: false,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="vimeo"]:not(.video--init)'
    };

    _.vimeoApiReady = function () {
      _.vimeoVars.apiReady = true;

      _._loadVimeoVideos();
    };

    _._loadVimeoVideos = function (container) {
      if ($(_.vimeoVars.toProcessSelector, container).length) {
        if (_.vimeoVars.apiReady) {
          // play those videos
          $(_.vimeoVars.toProcessSelector, container).each(function () {
            // Don't init background videos on mobile
            if (_._permitPlayback($(this))) {
              $(this).addClass('video--init');
              _.vimeoVars.incrementor++;
              var $this = $(this);
              var containerId = 'theme-vi-video-' + _.vimeoVars.incrementor;
              $(this).data('video-container-id', containerId);
              var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).appendTo($('.video-container__video', this));
              var autoplay = !!$(this).data('video-autoplay');
              var player = new Vimeo.Player(containerId, {
                url: $(this).data('video-url'),
                width: 640,
                loop: $(this).data('video-autoplay'),
                autoplay: autoplay
              });
              player.on('playing', function () {
                $(this).addClass('video--play-started');
              }.bind(this));
              player.ready().then(function () {
                if (autoplay) {
                  player.setVolume(0);
                  player.play();
                }

                if (player.element && player.element.width && player.element.height) {
                  var ratio = parseInt(player.element.height) / parseInt(player.element.width);
                  $this.find('.video-container__video').css('padding-bottom', ratio * 100 + '%');
                }

                _._initBackgroundVideo($this);
              });
              _.vimeoVars.videoData[containerId] = {
                id: containerId,
                container: this,
                videoElement: videoElement,
                player: player,
                autoPlay: autoplay
              };
            }
          });
        } else {
          // load api
          if (window.define) {
            // workaround for third parties using RequireJS
            theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function () {
              _.vimeoVars.apiReady = true;

              _._loadVimeoVideos();

              window.define = window.tempDefine;
            }, function () {
              window.tempDefine = window.define;
              window.define = null;
            });
          } else {
            theme.loadScriptOnce('https://player.vimeo.com/api/player.js', function () {
              _.vimeoVars.apiReady = true;

              _._loadVimeoVideos();
            });
          }
        }
      }
    };

    _._unloadVimeoVideos = function (container) {
      for (var dataKey in _.vimeoVars.videoData) {
        var data = _.vimeoVars.videoData[dataKey];

        if ($(container).find(data.container).length) {
          data.player.unload();
          delete _.vimeoVars.videoData[dataKey];
          return;
        }
      }
    }; // Init third party apis - Youtube and Vimeo


    _._loadThirdPartyApis = function (container) {
      //Don't init youtube or vimeo background videos on mobile
      if (_._permitPlayback($('.video-container', container))) {
        _._loadYoutubeVideos(container);

        _._loadVimeoVideos(container);
      }
    }; // Mp4


    _.mp4Vars = {
      incrementor: 0,
      videoData: {},
      toProcessSelector: '.video-container[data-video-type="mp4"]:not(.video--init)'
    };

    _._loadMp4Videos = function (container) {
      if ($(_.mp4Vars.toProcessSelector, container).length) {
        // play those videos
        $(_.mp4Vars.toProcessSelector, container).addClass('video--init').each(function () {
          _.mp4Vars.incrementor++;
          var $this = $(this);
          var containerId = 'theme-mp-video-' + _.mp4Vars.incrementor;
          $(this).data('video-container-id', containerId);
          var videoElement = $('<div class="video-container__video-element">').attr('id', containerId).appendTo($('.video-container__video', this));
          var $video = $('<video playsinline>');

          if ($(this).data('video-loop')) {
            $video.attr('loop', 'loop');
          }

          if ($(this).data('video-autoplay')) {
            $video.attr({
              autoplay: 'autoplay',
              muted: 'muted'
            });
            $video[0].muted = true; // required by Chrome - ignores attribute

            $video.one('loadeddata', function () {
              this.play();
            });
          }

          $video.on('playing', function () {
            $(this).addClass('video--play-started');
          }.bind(this));
          $video.attr('src', $(this).data('video-url')).appendTo(videoElement);
        });
      }
    };

    _._unloadMp4Videos = function (container) {}; // background video placement for iframes


    _._initBackgroundVideo = function ($container) {
      if ($container.hasClass('video-container--background') && $container.find('.video-container__video iframe').length) {
        var assessBackgroundVideo = function assessBackgroundVideo() {
          var $container = this,
              cw = $container.width(),
              ch = $container.height(),
              cr = cw / ch,
              $frame = $('.video-container__video iframe', this),
              vr = $frame.attr('width') / $frame.attr('height'),
              $pan = $('.video-container__video', this),
              vCrop = 75; // pushes video outside container to hide controls

          if (cr > vr) {
            var vh = cw / vr + vCrop * 2;
            $pan.css({
              marginTop: (ch - vh) / 2 - vCrop,
              marginLeft: '',
              height: vh + vCrop * 2,
              width: ''
            });
          } else {
            var vw = cw * vr + vCrop * 2 * vr;
            $pan.css({
              marginTop: -vCrop,
              marginLeft: (cw - vw) / 2,
              height: ch + vCrop * 2,
              width: vw
            });
          }
        };

        assessBackgroundVideo.bind($container)();
        $(window).on('debouncedresize.' + $container.data('video-container-id'), assessBackgroundVideo.bind($container));
      }
    }; // Compatibility with Sections


    this.onSectionLoad = function (container) {
      // url only - infer type
      $('.video-container[data-video-url]:not([data-video-type])').each(function () {
        var url = $(this).data('video-url');

        if (url.indexOf('.mp4') > -1) {
          $(this).attr('data-video-type', 'mp4');
        }

        if (url.indexOf('vimeo.com') > -1) {
          $(this).attr('data-video-type', 'vimeo');
          $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
        }

        if (url.indexOf('youtu.be') > -1 || url.indexOf('youtube.com') > -1) {
          $(this).attr('data-video-type', 'youtube');

          if (url.indexOf('v=') > -1) {
            $(this).attr('data-video-id', url.split('v=').pop().split('&')[0]);
          } else {
            $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
          }
        }
      });

      _._loadThirdPartyApis(container);

      _._loadMp4Videos(container);

      $(window).on('debouncedresize.video-manager-resize', function () {
        _._loadThirdPartyApis(container);
      }); // play button

      $('.video-container__play', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container'); // reveal

        $container.addClass('video-container--playing'); // broadcast a play event on the section container

        $(container).trigger("cc:video:play"); // play

        var id = $container.data('video-container-id');

        if (id.indexOf('theme-yt-video') === 0) {
          _.youtubeVars.videoData[id].player.playVideo();
        } else {
          _.vimeoVars.videoData[id].player.play();
        }
      }); // modal close button

      $('.video-container__stop', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container'); // hide

        $container.removeClass('video-container--playing'); // broadcast a stop event on the section container

        $(container).trigger("cc:video:stop"); // play

        var id = $container.data('video-container-id');

        if (id.indexOf('theme-yt-video') === 0) {
          _.youtubeVars.videoData[id].player.stopVideo();
        } else {
          _.vimeoVars.videoData[id].player.pause();

          _.vimeoVars.videoData[id].player.setCurrentTime(0);
        }
      });
    };

    this.onSectionUnload = function (container) {
      $('.video-container__play, .video-container__stop', container).off('click');
      $(window).off('.' + $('.video-container').data('video-container-id'));
      $(window).off('debouncedresize.video-manager-resize');

      _._unloadYoutubeVideos(container);

      _._unloadVimeoVideos(container);

      _._unloadMp4Videos(container);

      $(container).trigger("cc:video:stop");
    };
  }(); // Youtube API callback

  window.onYouTubeIframeAPIReady = function () {
    theme.VideoManager.youtubeApiReady();
  }; // Register the section


  cc.sections.push({
    name: 'video',
    section: theme.VideoManager
  });
  theme.MapSection = new function () {
    var _ = this;

    _.config = {
      zoom: 14,
      styles: {
        "default": [],
        silver: [{
          "elementType": "geometry",
          "stylers": [{
            "color": "#f5f5f5"
          }]
        }, {
          "elementType": "labels.icon",
          "stylers": [{
            "visibility": "off"
          }]
        }, {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        }, {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#f5f5f5"
          }]
        }, {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#bdbdbd"
          }]
        }, {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [{
            "color": "#eeeeee"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{
            "color": "#e5e5e5"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{
            "color": "#ffffff"
          }]
        }, {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dadada"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        }, {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        }, {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [{
            "color": "#e5e5e5"
          }]
        }, {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [{
            "color": "#eeeeee"
          }]
        }, {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{
            "color": "#c9c9c9"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        }],
        retro: [{
          "elementType": "geometry",
          "stylers": [{
            "color": "#ebe3cd"
          }]
        }, {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#523735"
          }]
        }, {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#f5f1e6"
          }]
        }, {
          "featureType": "administrative",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#c9b2a6"
          }]
        }, {
          "featureType": "administrative.land_parcel",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#dcd2be"
          }]
        }, {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#ae9e90"
          }]
        }, {
          "featureType": "landscape.natural",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dfd2ae"
          }]
        }, {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dfd2ae"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#93817c"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [{
            "color": "#a5b076"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#447530"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{
            "color": "#f5f1e6"
          }]
        }, {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [{
            "color": "#fdfcf8"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#f8c967"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#e9bc62"
          }]
        }, {
          "featureType": "road.highway.controlled_access",
          "elementType": "geometry",
          "stylers": [{
            "color": "#e98d58"
          }]
        }, {
          "featureType": "road.highway.controlled_access",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#db8555"
          }]
        }, {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#806b63"
          }]
        }, {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dfd2ae"
          }]
        }, {
          "featureType": "transit.line",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#8f7d77"
          }]
        }, {
          "featureType": "transit.line",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#ebe3cd"
          }]
        }, {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dfd2ae"
          }]
        }, {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [{
            "color": "#b9d3c2"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#92998d"
          }]
        }],
        dark: [{
          "elementType": "geometry",
          "stylers": [{
            "color": "#212121"
          }]
        }, {
          "elementType": "labels.icon",
          "stylers": [{
            "visibility": "off"
          }]
        }, {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#212121"
          }]
        }, {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "featureType": "administrative.country",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        }, {
          "featureType": "administrative.land_parcel",
          "stylers": [{
            "visibility": "off"
          }]
        }, {
          "featureType": "administrative.locality",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#bdbdbd"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{
            "color": "#181818"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#1b1b1b"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{
            "color": "#2c2c2c"
          }]
        }, {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#8a8a8a"
          }]
        }, {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [{
            "color": "#373737"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#3c3c3c"
          }]
        }, {
          "featureType": "road.highway.controlled_access",
          "elementType": "geometry",
          "stylers": [{
            "color": "#4e4e4e"
          }]
        }, {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        }, {
          "featureType": "transit",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        }, {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{
            "color": "#000000"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#3d3d3d"
          }]
        }],
        night: [{
          "elementType": "geometry",
          "stylers": [{
            "color": "#242f3e"
          }]
        }, {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#746855"
          }]
        }, {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#242f3e"
          }]
        }, {
          "featureType": "administrative.locality",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#d59563"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#d59563"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{
            "color": "#263c3f"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#6b9a76"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{
            "color": "#38414e"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#212a37"
          }]
        }, {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9ca5b3"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#746855"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#1f2835"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#f3d19c"
          }]
        }, {
          "featureType": "transit",
          "elementType": "geometry",
          "stylers": [{
            "color": "#2f3948"
          }]
        }, {
          "featureType": "transit.station",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#d59563"
          }]
        }, {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{
            "color": "#17263c"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#515c6d"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#17263c"
          }]
        }],
        aubergine: [{
          "elementType": "geometry",
          "stylers": [{
            "color": "#1d2c4d"
          }]
        }, {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#8ec3b9"
          }]
        }, {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#1a3646"
          }]
        }, {
          "featureType": "administrative.country",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#4b6878"
          }]
        }, {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#64779e"
          }]
        }, {
          "featureType": "administrative.province",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#4b6878"
          }]
        }, {
          "featureType": "landscape.man_made",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#334e87"
          }]
        }, {
          "featureType": "landscape.natural",
          "elementType": "geometry",
          "stylers": [{
            "color": "#023e58"
          }]
        }, {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [{
            "color": "#283d6a"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#6f9ba5"
          }]
        }, {
          "featureType": "poi",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#1d2c4d"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [{
            "color": "#023e58"
          }]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#3C7680"
          }]
        }, {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{
            "color": "#304a7d"
          }]
        }, {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#98a5be"
          }]
        }, {
          "featureType": "road",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#1d2c4d"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#2c6675"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [{
            "color": "#255763"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#b0d5ce"
          }]
        }, {
          "featureType": "road.highway",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#023e58"
          }]
        }, {
          "featureType": "transit",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#98a5be"
          }]
        }, {
          "featureType": "transit",
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#1d2c4d"
          }]
        }, {
          "featureType": "transit.line",
          "elementType": "geometry.fill",
          "stylers": [{
            "color": "#283d6a"
          }]
        }, {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [{
            "color": "#3a4762"
          }]
        }, {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{
            "color": "#0e1626"
          }]
        }, {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#4e6d70"
          }]
        }]
      }
    };
    _.apiStatus = null;

    this.geolocate = function ($map) {
      var deferred = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      var address = $map.data('address-setting');
      geocoder.geocode({
        address: address
      }, function (results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          deferred.reject(status);
        }

        deferred.resolve(results);
      });
      return deferred;
    };

    this.createMap = function (container) {
      var $map = $('.map-section__map-container', container);
      return _.geolocate($map).then(function (results) {
        var mapOptions = {
          zoom: _.config.zoom,
          styles: _.config.styles[$(container).data('map-style')],
          center: results[0].geometry.location,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          disableDefaultUI: true,
          zoomControl: true
        };
        _.map = new google.maps.Map($map[0], mapOptions);
        _.center = _.map.getCenter();
        var marker = new google.maps.Marker({
          map: _.map,
          position: _.center,
          clickable: false
        });
        google.maps.event.addDomListener(window, 'resize', function () {
          google.maps.event.trigger(_.map, 'resize');

          _.map.setCenter(_.center);
        });
      }.bind(this)).fail(function () {
        var errorMessage;

        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = theme.strings.addressNoResults;
            break;

          case 'OVER_QUERY_LIMIT':
            errorMessage = theme.strings.addressQueryLimit;
            break;

          default:
            errorMessage = theme.strings.addressError;
            break;
        } // Only show error in the theme editor


        if (Shopify.designMode) {
          var $mapContainer = $map.parents('.map-section');
          $mapContainer.addClass('page-width map-section--load-error');
          $mapContainer.find('.map-section__wrapper').html('<div class="errors text-center">' + errorMessage + '</div>');
        }
      });
    };

    this.onSectionLoad = function (target) {
      var $container = $(target); // Global function called by Google on auth errors

      window.gm_authFailure = function () {
        if (!Shopify.designMode) return;
        $container.addClass('page-width map-section--load-error');
        $container.find('.map-section__wrapper').html('<div class="errors text-center">' + theme.strings.authError + '</div>');
      }; // create maps


      var key = $container.data('api-key');

      if (typeof key !== 'string' || key === '') {
        return;
      } // load map


      theme.loadScriptOnce('https://maps.googleapis.com/maps/api/js?key=' + key, function () {
        _.createMap($container);
      });
    };

    this.onSectionUnload = function (target) {
      if (typeof window.google !== 'undefined' && typeof google.maps !== 'undefined') {
        google.maps.event.clearListeners(this.map, 'resize');
      }
    };
  }(); // Register the section

  cc.sections.push({
    name: 'map',
    section: theme.MapSection
  }); // A section that contains other sections, e.g. story page

  theme.NestedSectionsSection = new function () {
    this.onSectionLoad = function (container) {
      // load child sections
      $('[data-nested-section-type]', container).each(function () {
        var type = $(this).attr('data-nested-section-type');
        var section = null;

        for (var i = 0; i < theme.Sections._sections.length; i++) {
          if (theme.Sections._sections[i].type == type) {
            section = theme.Sections._sections[i].section;
          }
        }

        if (section) {
          var instance = {
            target: this,
            section: section,
            $shopifySectionContainer: $(this).closest('.shopify-section'),
            thisContext: {}
          };

          theme.Sections._instances.push(instance);

          $(this).data('themeSectionInstance', instance);
          section.onSectionLoad.bind(instance.thisContext)(this);
        }
      });
    };

    this.onSectionUnload = function (container) {
      // unload child sections
      $('[data-nested-section-type]', container).each(function () {
        if ($(this).data('themeSectionInstance')) {
          theme.Sections.sectionUnload.bind($(this).data('themeSectionInstance').thisContext)(this);
        }
      });
    };

    this.onBlockSelect = function (target) {
      // scroll to block
      $(window).scrollTop($(target).offset().top - 100);
    };
  }(); // Register the section

  cc.sections.push({
    name: 'nested-sections',
    section: theme.NestedSectionsSection
  });
  /**
  * Popup Section Script
  * ------------------------------------------------------------------------------
  *
  * @namespace Popup
  */

  theme.Popup = new function () {
    /**
     * Popup section constructor. Runs on page load as well as Theme Editor
     * `section:load` events.
     * @param {string} container - selector for the section container DOM element
     */
    var dismissedStorageKey = 'cc-theme-popup-dismissed';

    this.onSectionLoad = function (container) {
      var _this4 = this;

      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.popup = new ccPopup(this.$container, this.namespace);
      var dismissForDays = this.$container.data('dismiss-for-days'),
          delaySeconds = this.$container.data('delay-seconds'),
          showPopup = true,
          testMode = this.$container.data('test-mode'),
          lastDismissed = window.localStorage.getItem(dismissedStorageKey); // Should we show it during this page view?
      // Check when it was last dismissed

      if (lastDismissed) {
        var dismissedDaysAgo = (new Date().getTime() - lastDismissed) / (1000 * 60 * 60 * 24);

        if (dismissedDaysAgo < dismissForDays) {
          showPopup = false;
        }
      } // Check for error or success messages


      if (this.$container.find('.cc-popup-form__response').length) {
        showPopup = true;
        delaySeconds = 1; // If success, set as dismissed

        if (this.$container.find('.cc-popup-form__response--success').length) {
          this.functions.popupSetAsDismissed.call(this);
        }
      } // Prevent popup on Shopify robot challenge page


      if (document.querySelector('.shopify-challenge__container')) {
        showPopup = false;
      } // Show popup, if appropriate


      if (showPopup || testMode) {
        setTimeout(function () {
          _this4.popup.open();
        }, delaySeconds * 1000);
      } // Click on close button or modal background


      this.$container.on('click' + this.namespace, '.cc-popup-close, .cc-popup-background', function () {
        _this4.popup.close(function () {
          _this4.functions.popupSetAsDismissed.call(_this4);
        });
      });
    };

    this.onSectionSelect = function () {
      this.popup.open();
    };

    this.functions = {
      /**
       * Use localStorage to set as dismissed
       */
      popupSetAsDismissed: function popupSetAsDismissed() {
        window.localStorage.setItem(dismissedStorageKey, new Date().getTime());
      }
    };
    /**
     * Event callback for Theme Editor `section:unload` event
     */

    this.onSectionUnload = function () {
      this.$container.off(this.namespace);
    };
  }(); // Register section

  cc.sections.push({
    name: 'newsletter-popup',
    section: theme.Popup
  });
  /**
   * StoreAvailability Section Script
   * ------------------------------------------------------------------------------
   *
   * @namespace StoreAvailability
   */

  theme.StoreAvailability = function (container) {
    var loadingClass = 'store-availability-loading';
    var initClass = 'store-availability-initialized';
    var storageKey = 'cc-location';

    this.onSectionLoad = function (container) {
      var _this5 = this;

      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.productId = this.$container.data('store-availability-container');
      this.sectionUrl = this.$container.data('section-url');
      this.$modal;
      var firstRun = true; // Handle when a variant is selected

      $(window).on("cc-variant-updated".concat(this.namespace).concat(this.productId), function (e, args) {
        if (args.product.id === _this5.productId) {
          _this5.functions.updateContent.bind(_this5)(args.variant.id, args.product.title, firstRun, _this5.$container.data('has-only-default-variant'), typeof args.variant.available !== "undefined");

          firstRun = false;
        }
      }); // Handle single variant products

      if (this.$container.data('single-variant-id')) {
        this.functions.updateContent.bind(this)(this.$container.data('single-variant-id'), this.$container.data('single-variant-product-title'), firstRun, this.$container.data('has-only-default-variant'), this.$container.data('single-variant-product-available'));
        firstRun = false;
      }
    };

    this.onSectionUnload = function () {
      $(window).off("cc-variant-updated".concat(this.namespace).concat(this.productId));
      this.$container.off('click');

      if (this.$modal) {
        this.$modal.off('click');
      }
    };

    this.functions = {
      // Returns the users location data (if allowed)
      getUserLocation: function getUserLocation() {
        return new Promise(function (resolve, reject) {
          var storedCoords;

          if (sessionStorage[storageKey]) {
            storedCoords = JSON.parse(sessionStorage[storageKey]);
          }

          if (storedCoords) {
            resolve(storedCoords);
          } else {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function (position) {
                var coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }; //Set the localization api

                fetch('/localization.json', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(coords)
                }); //Write to a session storage

                sessionStorage[storageKey] = JSON.stringify(coords);
                resolve(coords);
              }, function () {
                resolve(false);
              }, {
                maximumAge: 3600000,
                // 1 hour
                timeout: 5000
              });
            } else {
              resolve(false);
            }
          }
        });
      },
      // Requests the available stores and calls the callback
      getAvailableStores: function getAvailableStores(variantId, cb) {
        return $.get(this.sectionUrl.replace('VARIANT_ID', variantId), cb);
      },
      // Haversine Distance
      // The haversine formula is an equation giving great-circle distances between
      // two points on a sphere from their longitudes and latitudes
      calculateDistance: function calculateDistance(coords1, coords2, unitSystem) {
        var dtor = Math.PI / 180;
        var radius = unitSystem === 'metric' ? 6378.14 : 3959;
        var rlat1 = coords1.latitude * dtor;
        var rlong1 = coords1.longitude * dtor;
        var rlat2 = coords2.latitude * dtor;
        var rlong2 = coords2.longitude * dtor;
        var dlon = rlong1 - rlong2;
        var dlat = rlat1 - rlat2;
        var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(dlon / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radius * c;
      },
      // Updates the existing modal pickup with locations with distances from the user
      updateLocationDistances: function updateLocationDistances(coords) {
        var unitSystem = this.$modal.find('[data-unit-system]').data('unit-system');
        var self = this;
        this.$modal.find('[data-distance="false"]').each(function () {
          var _this6 = this;

          var thisCoords = {
            latitude: parseFloat($(this).data('latitude')),
            longitude: parseFloat($(this).data('longitude'))
          };

          if (thisCoords.latitude && thisCoords.longitude) {
            var distance = self.functions.calculateDistance(coords, thisCoords, unitSystem).toFixed(1);
            $(this).html(distance); //Timeout to trigger animation

            setTimeout(function () {
              $(_this6).closest('.store-availability-list__location__distance').addClass('-in');
            }, 0);
          }

          $(this).attr('data-distance', 'true');
        });
      },
      // Requests the available stores and updates the page with info below Add to Basket, and append the modal to the page
      updateContent: function updateContent(variantId, productTitle, firstRun, isSingleDefaultVariant, isVariantAvailable) {
        var _this7 = this;

        this.$container.off('click', '[data-store-availability-modal-open]');
        this.$container.off('click' + this.namespace, '.cc-popup-close, .cc-popup-background');
        $('.store-availabilities-modal').remove();

        if (firstRun) {
          this.$container.hide();
        } else if (!isVariantAvailable) {
          //If the variant is Unavailable (not the same as Out of Stock) - hide the store pickup completely
          this.$container.addClass(loadingClass).addClass(initClass);
          this.$container.css('height', '0px');
        } else {
          this.$container.addClass(loadingClass).addClass(initClass);
          this.$container.css('height', this.$container.outerHeight() > 0 ? this.$container.outerHeight() + 'px' : 'auto');
        }

        if (isVariantAvailable) {
          this.functions.getAvailableStores.call(this, variantId, function (response) {
            if (response.trim().length > 0 && !response.includes('NO_PICKUP')) {
              _this7.$container.html(response);

              _this7.$container.html(_this7.$container.children().first().html()); // editor bug workaround


              _this7.$container.find('[data-store-availability-modal-product-title]').html(productTitle);

              if (isSingleDefaultVariant) {
                _this7.$container.find('.store-availabilities-modal__variant-title').remove();
              }

              _this7.$container.find('.cc-popup').appendTo('body');

              _this7.$modal = $('body').find('.store-availabilities-modal');
              var popup = new ccPopup(_this7.$modal, _this7.namespace);

              _this7.$container.on('click', '[data-store-availability-modal-open]', function () {
                popup.open(); //When the modal is opened, try and get the users location

                _this7.functions.getUserLocation().then(function (coords) {
                  if (coords && _this7.$modal.find('[data-distance="false"]').length) {
                    //Re-retrieve the available stores location modal contents
                    _this7.functions.getAvailableStores.call(_this7, variantId, function (response) {
                      _this7.$modal.find('.store-availabilities-list').html($(response).find('.store-availabilities-list').html());

                      _this7.functions.updateLocationDistances.bind(_this7)(coords);
                    });
                  }
                });

                return false;
              });

              _this7.$modal.on('click' + _this7.namespace, '.cc-popup-close, .cc-popup-background', function () {
                popup.close();
              });

              if (firstRun) {
                _this7.$container.slideDown(300);
              } else {
                _this7.$container.removeClass(loadingClass);

                var newHeight = _this7.$container.find('.store-availability-container').outerHeight();

                _this7.$container.css('height', newHeight > 0 ? newHeight + 'px' : 'auto');
              }
            }
          });
        }
      }
    }; // Initialise the section when it's instantiated

    this.onSectionLoad(container);
  }; // Register section


  cc.sections.push({
    name: 'store-availability',
    section: theme.StoreAvailability
  });
  theme.icons = {
    chevronLightLeft: '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M 14.51,6.51 14,6 8,12 14,18 14.51,17.49 9.03,12 Z"></path></svg>',
    chevronLightRight: '<svg fill="currentColor" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M 10,6 9.49,6.51 14.97,12 9.49,17.49 10,18 16,12 Z"></path></svg>',
    arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    close: '<svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>'
  };
  theme.viewport = {
    isXs: function isXs() {
      return $(window).outerWidth() < 768;
    },
    isSm: function isSm() {
      return $(window).outerWidth() >= 768;
    },
    isMd: function isMd() {
      return $(window).outerWidth() >= 992;
    }
  };
  theme.nav = {
    bar: {
      isInlineNavEnabled: function isInlineNavEnabled() {
        return $('#pageheader .pageheader__contents[data-nav-inline]').length > 0;
      },
      changeToInline: function changeToInline() {
        $('#pageheader .pageheader__contents').addClass('pageheader__contents--inline--visible');
      },
      changeToBurger: function changeToBurger() {
        $('#pageheader .pageheader__contents').removeClass('pageheader__contents--inline--visible');
      },
      height: function height() {
        return $('#pageheader__contents').outerHeight();
      }
    }
  }; // Lightbox

  theme.fbOpts = {
    overlayColor: '#fff',
    padding: 1,
    margin: 60,
    overlayOpacity: 0.9
  };
  theme.lightbox_min_window_width = 768;
  theme.lightbox_min_window_height = 580; // Get Shopify feature support

  try {
    theme.Shopify.features = JSON.parse(document.documentElement.querySelector('#shopify-features').textContent);
  } catch (e) {
    theme.Shopify.features = {};
  }

  theme.loadPageHeaderImage = function (target) {
    // could have been removed
    theme.checkForBannerBehindHeader();
    theme.ensureBannerCoversOverlapHeader();
  };

  theme.unloadPageHeaderImage = function (target) {};

  theme.checkBannerPadding = function () {
    if (!$('body').hasClass('no-banner') && $('#pageheader__contents').hasClass('pageheader__contents--overlap')) {
      $('.feature-page-title').css('padding-top', parseInt(theme.nav.bar.height()) + 50 + 'px');
    } else {
      $('.feature-page-title').removeAttr('style');
    }

    if ($('html').hasClass('open-menu')) {
      var $announcementBar = $('#shopify-section-announcement');
      var navBarHeight = parseInt(theme.nav.bar.height());
      var paddingTop = navBarHeight / 2 + 50;

      if ($announcementBar && !$('body').hasClass('scrolled-down')) {
        paddingTop = paddingTop + parseInt($announcementBar.outerHeight());
      }

      if (paddingTop > 120) {
        $('#main-menu .main-menu-links').css('padding-top', paddingTop + 'px');
      } else {
        $('#main-menu .main-menu-links').removeAttr('style');
      }
    }
  }; // ensure banner is tall enough to show over header


  theme.ensureBannerCoversOverlapHeader = function () {
    var $pageHeaderOverlap = $('.pageheader__contents--overlap');

    if ($pageHeaderOverlap.length) {
      $('.banner-under-header').css('min-height', $pageHeaderOverlap.outerHeight());
    } else {
      $('.banner-under-header').css('min-height', '');
    }
  };

  theme.buildGalleryViewer = function (config) {
    // create viewer
    var $allContainer = $('<div class="gallery-viewer gallery-viewer--pre-reveal">');
    var $zoomContainer = $('<div class="gallery-viewer__zoom">').appendTo($allContainer);
    var $thumbContainer = $('<div class="gallery-viewer__thumbs">').appendTo($allContainer);
    var $controlsContainer = $('<div class="gallery-viewer__controls">').appendTo($allContainer);
    var $close = $('<a class="gallery-viewer__button gallery-viewer__close" href="#">').attr('aria-label', theme.strings.close).html(config.close).appendTo($controlsContainer);
    var $right = $('<a class="gallery-viewer__button gallery-viewer__prev" href="#">').attr('aria-label', theme.strings.previous).html(config.prev).appendTo($controlsContainer);
    var $left = $('<a class="gallery-viewer__button gallery-viewer__next" href="#">').attr('aria-label', theme.strings.next).html(config.next).appendTo($controlsContainer);
    var $currentZoomImage = null; // add images

    for (var i = 0; i < config.images.length; i++) {
      var img = config.images[i];
      $('<a class="gallery-viewer__thumb" href="#">').data('zoom-url', img.zoomUrl).html(img.thumbTag).appendTo($thumbContainer);
    }

    if (config.images.length === 1) {
      $allContainer.addClass('gallery-viewer--single-image');
    } // helper function for panning an image


    var panZoomImage = function panZoomImage(inputX, inputY) {
      // do nothing if the image fits, pan if not
      var doPanX = $currentZoomImage.width() > $allContainer.width();
      var doPanY = $currentZoomImage.height() > $allContainer.height();

      if (doPanX || doPanY) {
        var midX = $allContainer.width() / 2;
        var midY = $allContainer.height() / 2;
        var offsetFromCentreX = inputX - midX,
            offsetFromCentreY = inputY - midY; // the offsetMultipler ensures it can only pan to the edge of the image, no further

        var finalOffsetX = 0;
        var finalOffsetY = 0;

        if (doPanX) {
          var offsetMultiplierX = ($currentZoomImage.width() - $allContainer.width()) / 2 / midX;
          finalOffsetX = Math.round(-offsetFromCentreX * offsetMultiplierX);
        }

        if (doPanY) {
          var offsetMultiplierY = ($currentZoomImage.height() - $allContainer.height()) / 2 / midY;
          finalOffsetY = Math.round(-offsetFromCentreY * offsetMultiplierY);
        }

        $currentZoomImage.css('transform', ['translate3d(', finalOffsetX, 'px, ', finalOffsetY, 'px, 0)'].join(''));
      }
    }; // show next image


    var showNextImage = function showNextImage(evt) {
      evt.preventDefault();
      var $next = $thumbContainer.find('.gallery-viewer__thumb--active').next();

      if ($next.length === 0) {
        $next = $thumbContainer.find('.gallery-viewer__thumb:first');
      }

      $next.trigger('select');
    }; // show previous image


    var showPrevImage = function showPrevImage(evt) {
      evt.preventDefault();
      var $prev = $thumbContainer.find('.gallery-viewer__thumb--active').prev();

      if ($prev.length === 0) {
        $prev = $thumbContainer.find('.gallery-viewer__thumb:last');
      }

      $prev.trigger('select');
    }; // close gallery viewer


    var closeGalleryViewer = function closeGalleryViewer(evt) {
      evt.preventDefault(); // destroy events

      $allContainer.off('.galleryViewer'); // begin exit transition

      $allContainer.addClass('gallery-viewer--transition-out'); // remove after transition

      var transitionDelay = $allContainer.css('transition-duration');
      transitionDelay = transitionDelay.indexOf('ms') > -1 ? parseFloat(transitionDelay) : parseFloat(transitionDelay) * 1000;
      setTimeout(function () {
        $allContainer.remove();
        $('html').removeClass('gallery-viewer-open');
      }, transitionDelay);
    }; // set up events
    // event: select thumbnail - zoom it


    $allContainer.on('click.galleryViewer select.galleryViewer', '.gallery-viewer__thumb', function (evt) {
      evt.preventDefault(); // set active

      $(this).addClass('gallery-viewer__thumb--active').siblings('.gallery-viewer__thumb--active').removeClass('gallery-viewer__thumb--active'); // replace zoom image

      $currentZoomImage = $('<img class="gallery-viewer__zoom-image" alt="" style="visibility: hidden">');
      $currentZoomImage.on('load', function () {
        $(this).off('load');

        if (config.zoom) {
          $(this).css({
            visibility: '',
            top: $allContainer.height() / 2 - $(this).height() / 2,
            left: $allContainer.width() / 2 - $(this).width() / 2
          });
          panZoomImage(evt.clientX, evt.clientY);
        } else {
          $(this).css({
            visibility: '',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'none'
          });
        }
      }).attr('src', $(this).data('zoom-url'));
      $zoomContainer.html($currentZoomImage);
    }); // event: pan

    $allContainer.on('mousemove.galleryViewer touchmove.galleryViewer', function (evt) {
      if (evt.type === 'touchmove') {
        var touch = evt.touches[0];
        panZoomImage(touch.clientX, touch.clientY);
      } else {
        panZoomImage(evt.clientX, evt.clientY);
      }
    }); // event: prevent pan while swiping thumbnails

    $allContainer.on('touchmove.galleryViewer', '.gallery-viewer__thumbs', function (evt) {
      evt.stopPropagation();
    }); // event: next image

    $allContainer.on('click.galleryViewer', '.gallery-viewer__next', showNextImage); // event: previous image

    $allContainer.on('click.galleryViewer', '.gallery-viewer__prev', showPrevImage); // event: close

    $allContainer.on('click.galleryViewer', '.gallery-viewer__close', closeGalleryViewer); // event: keypress

    $allContainer.on('keydown.galleryViewer', function (evt) {
      if (evt.which === 39) {
        // right arrow key
        showNextImage(evt);
      } else if (evt.which === 37) {
        // left arrow key
        showPrevImage(evt);
      } else if (evt.which === 27) {
        // esc key
        closeGalleryViewer(evt);
      }
    }); // initialise
    // - clear any remnants of failed previous closure

    $('html').removeClass('gallery-viewer-open');
    $('.gallery-viewer').remove(); // - insert into page

    $('html').addClass('gallery-viewer-open');
    $allContainer.attr('tabindex', -1).appendTo('body').focus(); // - select first thumbnail

    $thumbContainer.find('.gallery-viewer__thumb:eq(' + (config.current > 0 ? config.current : 0) + ')').trigger('select'); // - reveal

    setTimeout(function () {
      $allContainer.removeClass('gallery-viewer--pre-reveal');
    }, 10);
  };

  theme.ProductMediaGallery = function ($gallery) {
    $gallery.addClass('product-photos--initialized');

    var _this = this;

    var currentMedia;
    var initialisedMedia = {};
    var $viewInSpaceButton = $gallery.find('.view-in-space');
    var $thumbContainer = $gallery.find('.thumbnails');

    this.Image = function ($elem, autoplay) {
      this.show = function () {
        $elem.show();
      };

      this.destroy = function () {};

      this.pause = function () {};

      this.hide = function () {
        $elem.hide();
      }; //Init the image


      this.show();
    };

    this.Video = function ($elem, autoplay) {
      var _video = this;

      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {}
      };
      var videoElement = $elem.find('video')[0];

      this.show = function () {
        $elem.show();
      };

      this.play = function () {
        _video.show();

        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();
      };

      this.destroy = function () {
        playerObj.destroy();
        $(videoElement).off('playing', _this.pauseAllMedia);
      }; //Init the video


      theme.loadStyleOnce('https://cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.css'); // set up a controller for Plyr video

      window.Shopify.loadFeatures([{
        name: 'video-ui',
        version: '1.0',
        onLoad: function () {
          playerObj = {
            playerType: 'html5',
            element: videoElement,
            plyr: new Shopify.Plyr(videoElement, {
              controls: ['play', 'progress', 'mute', 'volume', 'play-large', 'fullscreen'],
              loop: {
                active: $elem.data('enable-video-looping')
              },
              autoplay: $(window).width() >= 768 && autoplay,
              hideControlsOnPause: true,
              iconUrl: '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
              tooltips: {
                controls: false,
                seek: true
              }
            }),
            play: function play() {
              this.plyr.play();
            },
            pause: function pause() {
              this.plyr.pause();
            },
            destroy: function destroy() {
              this.plyr.destroy();
            }
          };
          $elem.addClass('product-media--video-loaded');
          initialisedMedia[$elem.data('media-id')] = _video;
        }.bind(this)
      }]);
      $(videoElement).on('playing', function () {
        _this.pauseAllMedia($elem.data('media-id'));
      });

      _video.show();
    };

    this.ExternalVideo = function ($elem, autoplay) {
      var _video = this;

      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {}
      };
      var iframeElement = $elem.find('iframe')[0];

      this.play = function () {
        _video.show();

        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.show = function () {
        $elem.show();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();
      };

      this.destroy = function () {
        playerObj.destroy();
      }; //Init the external video


      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(iframeElement.src)) {
        var loadYoutubeVideo = function loadYoutubeVideo() {
          playerObj = {
            playerType: 'youtube',
            element: iframeElement,
            player: new YT.Player(iframeElement, {
              videoId: $elem.data('video-id'),
              events: {
                onReady: function onReady() {
                  initialisedMedia[$elem.data('media-id')] = _video;
                  $elem.addClass('product-media--video-loaded');

                  if (autoplay && $(window).width() >= 768) {
                    _video.play();
                  }
                },
                onStateChange: function onStateChange(event) {
                  if (event.data === 1) {
                    _this.pauseAllMedia($elem.data('media-id'));
                  }

                  if (event.data === 0 && $elem.data('enable-video-looping')) {
                    event.target.seekTo(0);
                  }
                }
              }
            }),
            play: function play() {
              this.player.playVideo();
            },
            pause: function pause() {
              this.player.pauseVideo();
            },
            destroy: function destroy() {
              this.player.destroy();
            }
          };
        };

        if (window.YT && window.YT.Player) {
          loadYoutubeVideo();
        } else {
          // set up a controller for YouTube video
          var temp = window.onYouTubeIframeAPIReady;

          window.onYouTubeIframeAPIReady = function () {
            temp();
            loadYoutubeVideo();
          };

          theme.loadScriptOnce('https://www.youtube.com/iframe_api');
        }
      }

      _video.show();
    };

    this.Model = function ($elem, autoplay, dontShow) {
      var _model = this;

      var playerObj = {
        play: function play() {},
        pause: function pause() {},
        destroy: function destroy() {}
      };
      var modelElement = $elem.find('model-viewer')[0];

      this.show = function () {
        $elem.show();

        if (window.ShopifyXR && $viewInSpaceButton.length) {
          //Change the view in space button to launch this model
          $viewInSpaceButton.attr('data-shopify-model3d-id', $elem.data('media-id'));
          window.ShopifyXR.setupXRElements();
        }
      };

      this.play = function () {
        _model.show();

        playerObj.play();
      };

      this.pause = function () {
        playerObj.pause();
      };

      this.hide = function () {
        playerObj.pause();
        $elem.hide();

        if (window.ShopifyXR && $viewInSpaceButton.length) {
          //Reset the view in space button to launch the first model
          $viewInSpaceButton.attr('data-shopify-model3d-id', $viewInSpaceButton.data('shopify-model3d-first-id'));
          $viewInSpaceButton.attr('data-shopify-title', $viewInSpaceButton.data('shopify-first-title'));
          window.ShopifyXR.setupXRElements();
        }
      };

      this.destroy = function () {//Nothing needed
      };

      this.initAugmentedReality = function () {
        if ($('.model-json', $gallery).length) {
          var doInit = function doInit() {
            if (!window.ShopifyXR) {
              document.addEventListener('shopify_xr_initialized', function shopifyXrEventListener(event) {
                doInit(); //Ensure this only fires once

                event.target.removeEventListener(event.type, shopifyXrEventListener);
              });
              return;
            }

            window.ShopifyXR.addModels(JSON.parse($('.model-json', $gallery).html()));
            window.ShopifyXR.setupXRElements();
          };

          window.Shopify.loadFeatures([{
            name: 'shopify-xr',
            version: '1.0',
            onLoad: doInit
          }]);
        }
      }; //Init the model


      theme.loadStyleOnce('https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css');
      window.Shopify.loadFeatures([{
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: function () {
          playerObj = new Shopify.ModelViewerUI(modelElement);
          $elem.addClass('product-media--model-loaded');

          if (autoplay && $(window).width() >= 768) {
            _model.play();
          } //Prevent the buttons from submitting the form


          $elem.find('button').attr('type', 'button');
        }.bind(this)
      }]);
      initialisedMedia[$elem.data('media-id')] = _model;

      if (!dontShow) {
        _model.show();
      }

      if (!window.ShopifyXR) {
        _model.initAugmentedReality();
      }
    };

    this.pauseAllMedia = function (ignoreKey) {
      for (var key in initialisedMedia) {
        if (initialisedMedia.hasOwnProperty(key) && (!ignoreKey || key != ignoreKey)) {
          initialisedMedia[key].pause();
        }
      }
    };

    this.showMedia = function ($mediaToShow, autoplay, preventHide) {
      //In with the new
      if ($mediaToShow.length) {
        //Out with the old
        if (currentMedia && !preventHide) {
          currentMedia.hide();
        } //Function to instantiate and return the relevant media


        var getMedia = function getMedia(MediaType) {
          var media;

          if (initialisedMedia.hasOwnProperty($mediaToShow.data('media-id'))) {
            media = initialisedMedia[$mediaToShow.data('media-id')];

            if (autoplay && $(window).width() >= 768) {
              media.show(); //Delay play so its easier for users to understand that it paused

              setTimeout(media.play, 250);
            } else {
              media.show();
            }
          } else {
            media = new MediaType($mediaToShow, autoplay);
          }

          return media;
        }; //Initialise the media


        if ($mediaToShow.data('media-type') === "image") {
          currentMedia = getMedia(_this.Image);
        } else if ($mediaToShow.data('media-type') === "video") {
          currentMedia = getMedia(_this.Video);
        } else if ($mediaToShow.data('media-type') === "external_video") {
          currentMedia = getMedia(_this.ExternalVideo);
        } else if ($mediaToShow.data('media-type') === "model") {
          currentMedia = getMedia(_this.Model);
        } else {
          console.warn('Media is unknown', $mediaToShow);
          $gallery.find('.product-media:visible').hide();
          $mediaToShow.show();
        }
      }
    };

    this.destroy = function () {
      for (var i = 0; i < initialisedMedia.length; i++) {
        initialisedMedia[i].destroy();
      }

      $gallery.off('click');
      $(window).off('debouncedresize.gallery', updateThumbArrowStates);
    };

    var $mediaToInit = $gallery.find('.product-media:first');
    var $activeThumbnail = $gallery.find('.thumb.active');

    if ($activeThumbnail.length) {
      $mediaToInit = $gallery.find('.product-media[data-media-id="' + $activeThumbnail.data('media-id') + '"]');
    } // Init the first media item


    _this.showMedia($mediaToInit, false); // On mobile, init the first model (without showing it) to init the view in your space button


    if ($mediaToInit.data('media-type') !== 'model' && $(window).width() < 768) {
      var $firstModel = $gallery.find('.product-media[data-media-type="model"]:first');

      if ($firstModel.length) {
        new _this.Model($firstModel, false, true);
      }
    } // Click a thumbnail


    $gallery.on('click', '.thumbnails .thumb', function (e) {
      e.preventDefault();

      if (!$(this).hasClass('active')) {
        $(this).addClass('active').siblings('.active').removeClass('active');
        var $mediaToShow = $gallery.find('.product-media[data-media-id="' + $(this).data('media-id') + '"]');

        _this.showMedia($mediaToShow, true);
      }
    }); // Click next/prev

    $gallery.on('click', '.thumbnails__prev,.thumbnails__next', function (e) {
      e.preventDefault();

      if ($(this).hasClass('thumbnails__prev')) {
        //Go backwards
        $thumbContainer.animate({
          scrollLeft: $thumbContainer.scrollLeft() - $thumbContainer.outerWidth() * .8
        }, 500);
      } else {
        //Go forwards
        $thumbContainer.animate({
          scrollLeft: $thumbContainer.outerWidth() * .8 + $thumbContainer.scrollLeft()
        }, 500);
      }
    });
    var $prevArrow = $gallery.find('.thumbnails__prev');
    var $nextArrow = $gallery.find('.thumbnails__next');
    var $thumbsInner = $thumbContainer.find('.thumbnails-inner');
    var $thumbsOuter = $gallery.find('.thumbnails-outer'); // Update the state of the arrows (enabled/disabled) based on the scroll position of the thumbs;

    function updateThumbArrowStates() {
      if ($thumbsInner.outerWidth() < $thumbContainer.outerWidth()) {
        //No need for arrows, remove em
        $thumbsOuter.addClass('thumbnails--no-arrows');
      } else if ($thumbContainer.scrollLeft() === 0) {
        $thumbsOuter.removeClass('thumbnails--no-arrows');
        $prevArrow.attr('disabled', 'true');
        $nextArrow.removeAttr('disabled');
      } else if ($thumbContainer.innerWidth() + $thumbContainer.scrollLeft() === $thumbsInner.outerWidth()) {
        $thumbsOuter.removeClass('thumbnails--no-arrows');
        $prevArrow.removeAttr('disabled');
        $nextArrow.attr('disabled', 'true');
      } else {
        $thumbsOuter.removeClass('thumbnails--no-arrows');
        $prevArrow.removeAttr('disabled');
        $nextArrow.removeAttr('disabled');
      }
    }

    ;
    updateThumbArrowStates(); // Detect when scroll has finished

    var thumbScrollTimer;
    $thumbContainer.scroll(function () {
      clearTimeout(thumbScrollTimer);
      thumbScrollTimer = setTimeout(updateThumbArrowStates, 100);
    }); // Update arrows on window resize

    $(window).on('debouncedresize.gallery', updateThumbArrowStates); // Expand all thumbs into large images

    $gallery.on('click', '.load-all-thumbs', function () {
      $gallery.css('height', $gallery.height() + 'px');
      $gallery.addClass('product-photos--expanded-all');
      $gallery.find('.product-media').each(function () {
        _this.showMedia($(this), false, true);
      });
      $gallery.css('height', $gallery.find('.main-wrapper').height() + 'px');
      setTimeout(function () {
        $gallery.css('height', 'auto');
      }, 1100);
      return false;
    }); // Click on main image

    $gallery.on('click', '.product-media--image a.main-img-link--lightbox', function (e) {
      e.preventDefault();
      var images = [],
          currentIndex = 0;
      var $thumbs = $(this).closest('.product-photos').find('.thumb--media-image');

      if ($thumbs.length) {
        $thumbs.each(function () {
          var $imgThumb = $(this).find('.rimage-outer-wrapper').clone();
          $imgThumb.find('.lazyloaded').removeClass('lazyloaded').addClass('lazyload').parent().addClass('lazyload--placeholder');
          images.push({
            thumbTag: $imgThumb,
            zoomUrl: $(this).attr('href')
          });
        });
        $thumbs.each(function (thisIndex) {
          if ($(this).hasClass('active')) {
            currentIndex = thisIndex;
            return false;
          }
        });
      } else {
        var $imgThumb = $(this).find('.rimage-outer-wrapper').clone();
        $imgThumb.find('.lazyloaded').removeClass('lazyloaded').addClass('lazyload').parent().addClass('lazyload--placeholder');
        images.push({
          thumbTag: $imgThumb,
          zoomUrl: $(this).attr('href')
        });
      }

      theme.buildGalleryViewer({
        images: images,
        current: currentIndex,
        zoom: $(this).data('enable-zoom'),
        prev: theme.icons.arrowLeft,
        next: theme.icons.arrowRight,
        close: theme.icons.close
      });
    });
  };

  theme.applyAjaxToProductForm = function ($form_param) {
    var shopifyAjaxAddURL = theme.routes.cart_add_url + '.js';
    var shopifyAjaxStorePageURL = theme.routes.search_url;
    $form_param.filter('[data-ajax-add-to-cart="true"]').on('submit', function (e) {
      e.preventDefault();
      var $form = $(this); // Disable add button

      $form.find('button[type="submit"]').attr('disabled', 'disabled').each(function () {
        $(this).data('previous-value', $(this).html()).html(theme.strings.addingToCart);
      }); // Add to cart

      $.post(shopifyAjaxAddURL, $form.serialize(), function (itemData) {
        // Enable add button
        $form.find('button[type="submit"]').each(function () {
          var $btn = $(this); // Set to 'DONE', alter button style, wait a few secs, revert to normal

          $btn.html(theme.strings.addedToCart);
          setTimeout(function () {
            $btn.removeAttr('disabled').html($btn.data('previous-value'));
          }, 4000);
        }); // Update header summary

        $.get(shopifyAjaxStorePageURL, function (data) {
          var $newDoc = $($.parseHTML('<div>' + data + '</div>'));
          var sels = ['.pageheader .header-items'];

          for (var i = 0; i < sels.length; i++) {
            var cartSummarySelector = sels[i];
            var $newCartObj = $newDoc.find(cartSummarySelector);
            var $currCart = $(cartSummarySelector);
            $currCart.replaceWith($newCartObj);
          }
        });
      }, 'text').fail(function (data) {
        // Enable add button
        var $firstBtn = $form.find('button[type="submit"]').removeAttr('disabled').each(function () {
          $(this).html($(this).data('previous-value'));
        }).first(); // Not added, show message

        if (typeof data != 'undefined' && typeof data.status != 'undefined') {
          var jsonRes = $.parseJSON(data.responseText);
          theme.showQuickPopup(jsonRes.description, $firstBtn);
        } else {
          // Some unknown error? Disable ajax and submit the old-fashioned way.
          $form.attr('ajax-add-to-cart', 'false').submit();
        }
      });
    });
  };

  theme.removeAjaxFromProductForm = function ($form_param) {
    $form_param.off('submit');
  }; // Manage option dropdowns


  theme.productData = {};
  theme.OptionManager = new function () {
    var _ = this;

    _._getVariantOptionElement = function (variant, $container) {
      return $container.find('select[name="id"] option[value="' + variant.id + '"]');
    };

    _.selectors = {
      container: '.product',
      gallery: '.product-photos',
      priceArea: '.product-price',
      submitButton: 'input[type=submit], button[type=submit]',
      multiOption: '.option-selectors'
    };
    _.strings = {
      priceNonExistent: theme.strings.priceNonExistent,
      priceSoldOut: '<span class="productlabel soldout"><span>' + theme.strings.buttonNoStock + '</span></span>',
      buttonDefault: theme.strings.buttonDefault,
      buttonNoStock: theme.strings.buttonNoStock,
      buttonNoVariant: theme.strings.buttonNoVariant,
      unitPriceSeparator: theme.strings.products_product_unit_price_separator
    };

    _._getString = function (key, variant) {
      var string = _.strings[key];

      if (variant) {
        string = string.replace('[PRICE]', '<span class="product-price__amount theme-money">' + theme.Shopify.formatMoney(variant.price, theme.money_format) + '</span>');
      }

      return string;
    };

    _.getProductData = function ($form) {
      var productId = $form.data('product-id');
      var data = null;

      if (!theme.productData[productId]) {
        theme.productData[productId] = JSON.parse(document.getElementById('ProductJson-' + productId).innerHTML);
      }

      data = theme.productData[productId];

      if (!data) {
        console.log('Product data missing (id: ' + $form.data('product-id') + ')');
      }

      return data;
    };

    _.getBaseUnit = function (variant) {
      return variant.unit_price_measurement.reference_value === 1 ? variant.unit_price_measurement.reference_unit : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
    }, _.addVariantUrlToHistory = function (variant) {
      if (variant) {
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({
          path: newurl
        }, '', newurl);
      }
    };

    _.updateSku = function (variant, $container) {
      $container.find('.sku .sku__value').html(variant ? variant.sku : '');
      $container.find('.sku').toggleClass('sku--no-sku', !variant || !variant.sku);
    };

    _.updateBarcode = function (variant, $container) {
      $container.find('.barcode .barcode__value').html(variant ? variant.barcode : '');
      $container.find('.barcode').toggleClass('barcode--no-barcode', !variant || !variant.barcode);
    };

    _.updateBackorder = function (variant, $container) {
      var $backorder = $container.find('.backorder');

      if ($backorder.length) {
        if (variant && variant.available) {
          if (variant.inventory_management && _._getVariantOptionElement(variant, $container).data('stock') == 'out') {
            var productData = _.getProductData($backorder.closest('form'));

            $backorder.find('.backorder__variant').html(productData.title + (variant.title.indexOf('Default') >= 0 ? '' : ' - ' + variant.title));
            $backorder.show();
          } else {
            $backorder.hide();
          }
        } else {
          $backorder.hide();
        }
      }
    };

    _.updatePrice = function (variant, $container) {
      var $priceArea = $container.find(_.selectors.priceArea);
      $priceArea.removeClass('on-sale');

      if (variant && variant.available == true) {
        var $newPriceArea = $('<div>');
        $('<span class="product-price__amount theme-money">').html(theme.Shopify.formatMoney(variant.price, theme.money_format)).appendTo($newPriceArea);

        if (variant.compare_at_price > variant.price) {
          $newPriceArea.append(' ');
          $('<span class="product-price__compare theme-money">').html(theme.Shopify.formatMoney(variant.compare_at_price, theme.money_format)).appendTo($newPriceArea);
          $priceArea.addClass('on-sale');
        }

        if (variant.unit_price_measurement) {
          var $newUnitPriceArea = $('<div class="unit-price">').appendTo($newPriceArea);
          $('<span class="unit-price__price theme-money">').html(theme.Shopify.formatMoney(variant.unit_price, theme.money_format)).appendTo($newUnitPriceArea);
          $('<span class="unit-price__separator">').html(_._getString('unitPriceSeparator')).appendTo($newUnitPriceArea);
          $('<span class="unit-price__unit">').html(_.getBaseUnit(variant)).appendTo($newUnitPriceArea);
        }

        $priceArea.html($newPriceArea.html());
      } else {
        if (variant) {
          $priceArea.html(_._getString('priceSoldOut', variant));
        } else {
          $priceArea.html(_._getString('priceNonExistent', variant));
        }
      }
    };

    _._updateButtonText = function ($button, string, variant) {
      $button.each(function () {
        var newVal;
        newVal = _._getString('button' + string, variant);

        if (newVal !== false) {
          if ($(this).is('input')) {
            $(this).val(newVal);
          } else {
            $(this).html(newVal);
          }
        }
      });
    };

    _.updateButtons = function (variant, $container) {
      var $button = $container.find(_.selectors.submitButton);

      if (variant && variant.available == true) {
        $button.removeAttr('disabled');

        _._updateButtonText($button, 'Default', variant);
      } else {
        $button.attr('disabled', 'disabled');

        if (variant) {
          _._updateButtonText($button, 'NoStock', variant);
        } else {
          _._updateButtonText($button, 'NoVariant', variant);
        }
      }
    };

    _.updateContainerStatusClasses = function (variant, $container) {
      $container.toggleClass('variant-status--unavailable', !variant.available);
      $container.toggleClass('variant-status--backorder', variant.available && variant.inventory_management && _._getVariantOptionElement(variant, $container).data('stock') == 'out');
    };

    _.initProductOptions = function (originalInput) {
      $(originalInput).not('.theme-init').addClass('theme-init').each(function () {
        var $originalInput = $(this);

        if ($originalInput.is('select')) {
          var productData = _.getProductData($originalInput.closest('form')); // change state for original dropdown


          $originalInput.on('change.themeProductOptions firstrun.themeProductOptions', function (e, variant) {
            if ($(this).is('input[type=radio]:not(:checked)')) {
              return; // handle radios - only update for checked
            }

            var variant = variant;

            if (!variant && variant !== false) {
              for (var i = 0; i < productData.variants.length; i++) {
                if (productData.variants[i].id == $(this).val()) {
                  variant = productData.variants[i];
                }
              }
            }

            var $container = $(this).closest(_.selectors.container); // update price

            _.updatePrice(variant, $container); // update buttons


            _.updateButtons(variant, $container); // emit an event to broadcast the variant update


            $(window).trigger('cc-variant-updated', {
              variant: variant,
              product: productData
            }); // variant images

            if (variant && variant.featured_media) {
              $container.find(_.selectors.gallery).trigger('variantImageSelected', variant);
            } // extra details


            _.updateBarcode(variant, $container);

            _.updateSku(variant, $container);

            _.updateBackorder(variant, $container);

            _.updateContainerStatusClasses(variant, $container); // variant urls


            var $form = $(this).closest('form');

            if ($form.data('enable-history-state') && e.type == 'change') {
              _.addVariantUrlToHistory(variant);
            } // notify quickbuy of content change


            $container.find('.quickbuy-container').trigger('changedsize');
          }); // split-options wrapper

          $originalInput.closest(_.selectors.container).find(_.selectors.multiOption).on('change.themeProductOptions', 'select', function () {
            var selectedOptions = [];
            $(this).closest(_.selectors.multiOption).find('select').each(function () {
              selectedOptions.push($(this).val());
            }); // find variant

            var variant = false;

            for (var i = 0; i < productData.variants.length; i++) {
              var v = productData.variants[i];
              var matchCount = 0;

              for (var j = 0; j < selectedOptions.length; j++) {
                if (v.options[j] == selectedOptions[j]) {
                  matchCount++;
                }
              }

              if (matchCount == selectedOptions.length) {
                variant = v;
                break;
              }
            } // trigger change


            if (variant) {
              $originalInput.val(variant.id);
            }

            $originalInput.trigger('change', variant);
          }); // first-run

          $originalInput.trigger('firstrun');
        } // ajax


        theme.applyAjaxToProductForm($originalInput.closest('form'));
      });
    };

    _.unloadProductOptions = function (originalInput) {
      $(originalInput).removeClass('theme-init').each(function () {
        $(this).trigger('unloading').off('.themeProductOptions');
        $(this).closest(_.selectors.container).find(_.selectors.multiOption).off('.themeProductOptions');
        theme.removeAjaxFromProductForm($(this).closest('form'));
      });
    };
  }(); // Orphan reduction on reasonable screens

  theme.reduceOrphans = function ($items) {
    if ($(window).width() > 500) {
      $items.each(function () {
        var html = $(this).html();
        var words = html.split(' ');

        if (words.length > 3) {
          var joinedOrphanLength = words[words.length - 2].length + words[words.length - 1].length + 1;
          var isNotLongerThanPrior = html.length > joinedOrphanLength * 2;
          var isDecentLength = joinedOrphanLength < 20;

          if (isNotLongerThanPrior && isDecentLength) {
            var idx = html.lastIndexOf(' ');
            var newHtml = html.substr(0, idx) + '&nbsp;' + html.substr(idx + 1);
            $(this).html(newHtml);
          }
        }
      });
    }
  };

  theme.SlideshowSection = new function () {
    var _ = this;

    this.assessSlideshowOverlayHeight = function () {
      // ensure image is at least as tall as the overlay text
      $('.section--slideshow .overlay').each(function () {
        var vertPad = parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom'));
        var textHeight = $(this).find('.innest').outerHeight();
        var $e = $(this).closest('.banner-image');

        if ($e.hasClass('fixed-height')) {
          $e.closest('.slide').css('min-height', textHeight + vertPad);
        } else {
          $e.find('.rimage-wrapper').css('min-height', textHeight + vertPad);
        }
      });
    };

    this.onSectionLoad = function (target) {
      theme.reduceOrphans($('.slide-heading, .slide-text', target)); // Set up the slideshow

      $('.slideshow', target).each(function () {
        var isCarousel = $(this).data('carousel');
        var autoplay = $(this).data('autoplay');
        var autoplaySpeed = $(this).data('autoplay-speed') * 1000;
        var doFade = $(this).data('transition') == 'fade';
        $(this).on('init', function (e, slideshow) {
          $('.lazyload--manual', this).removeClass('lazyload--manual').addClass('lazyload');

          if (theme.enableOverlapTransition) {
            // reveal overlays
            $('.slick-active .overlay--transition', this).removeClass('overlay--transition-out').each(function () {
              // match clones
              $(this).closest('.slideshow').find('.slick-clone .block-' + $(this).closest('.slide').data('index') + ' .overlay--transition').removeClass('overlay--transition-out');
            });
          }
        }).on('afterChange setPosition', function (e, slideshow) {
          if (theme.enableOverlapTransition) {
            // hide overlays when off screen
            $('.slick-slide:not(.slick-active):not(.slick-clone) .overlay--transition', this).addClass('overlay--transition-out').each(function () {
              // match clones
              $(this).closest('.slideshow').find('.slick-clone:not(.slick-active) .block-' + $(this).closest('.slide').data('index') + ' .overlay--transition').addClass('overlay--transition-out');
            }); // reveal overlays

            $('.slick-active .overlay--transition', this).removeClass('overlay--transition-out').each(function () {
              // match clones (a clone can be active in carousel)
              $(this).closest('.slideshow').find('.block-' + $(this).closest('.slide').data('index') + ' .overlay--transition').removeClass('overlay--transition-out');
            });
          }
        }).slick({
          autoplay: autoplay,
          fade: !isCarousel && doFade,
          infinite: true,
          slidesToShow: isCarousel ? 2 : 1,
          useTransform: true,
          arrows: true,
          dots: false,
          prevArrow: ['<button type="button" class="slick-prev" aria-label="', theme.strings.previous, '">', '<span class="desktop-only">', theme.icons.chevronLightLeft, '</span>', '<span class="mobile-only">', theme.icons.arrowLeft, '</span>', '</button>'].join(''),
          nextArrow: ['<button type="button" class="slick-next" aria-label="', theme.strings.next, '">', '<span class="desktop-only">', theme.icons.chevronLightRight, '</span>', '<span class="mobile-only">', theme.icons.arrowRight, '</span>', '</button>'].join(''),
          autoplaySpeed: autoplaySpeed,
          // milliseconds to wait between slides
          responsive: [{
            breakpoint: 900,
            settings: {
              fade: doFade,
              slidesToShow: 1
            }
          }, {
            breakpoint: 768,
            settings: {
              fade: doFade,
              arrows: true,
              dots: true,
              slidesToShow: 1
            }
          }]
        });
      });
      $(window).off('.slideshowSection').on('debouncedresize.slideshowSection', _.assessSlideshowOverlayHeight);

      _.assessSlideshowOverlayHeight();
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init afterChange setPosition');
      $(window).off('.slideshowSection');
    };

    this.onBlockSelect = function (target) {
      $(target).closest('.slick-slider').slick('slickGoTo', $(target).data('slick-index')).slick('slickPause');
    };

    this.onBlockDeselect = function (target) {
      $(target).closest('.slick-slider').slick('slickPlay');
    };
  }();
  theme.BannerIndexSection = new function () {
    this.onSectionLoad = function (target) {
      var target = target;
      theme.checkForBannerBehindHeader();
      theme.SlideshowSection.onSectionLoad(target);
    };

    this.onSectionUnload = function (target) {
      theme.SlideshowSection.onSectionUnload(target);
    };

    this.onBlockSelect = theme.SlideshowSection.onBlockSelect;
    this.onBlockDeselect = theme.SlideshowSection.onBlockDeselect;
  }();
  theme.SlideshowWithTextSection = new function () {
    this.onSectionLoad = function (target) {
      $('.slideshow', target).each(function () {
        var autoplay = $(this).data('autoplay');
        var autoplaySpeed = $(this).data('autoplay-speed') * 1000;
        $(this).on('init', function () {
          $('.lazyload--manual', this).removeClass('lazyload--manual').addClass('lazyload');
        }).slick({
          autoplay: autoplay,
          fade: $(this).data('transition') == 'fade',
          autoplaySpeed: autoplaySpeed,
          // milliseconds to wait between slides
          infinite: true,
          useTransform: true,
          arrows: true,
          prevArrow: ['<button type="button" class="slick-prev" aria-label="', theme.strings.previous, '">', '<span class="desktop-only">', theme.icons.chevronLightLeft, '</span>', '<span class="mobile-only">', theme.icons.arrowLeft, '</span>', '</button>'].join(''),
          nextArrow: ['<button type="button" class="slick-next" aria-label="', theme.strings.next, '">', '<span class="desktop-only">', theme.icons.chevronLightRight, '</span>', '<span class="mobile-only">', theme.icons.arrowRight, '</span>', '</button>'].join(''),
          dots: true
        });
      });
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init');
    };

    this.onBlockSelect = function (target) {
      $(target).closest('.slick-slider').slick('slickGoTo', $(target).data('slick-index')).slick('slickPause');
    };

    this.onBlockDeselect = function (target) {
      $(target).closest('.slick-slider').slick('slickPlay');
    };
  }();
  theme.FeaturedCollectionSection = new function () {
    this.onSectionLoad = function (target) {
      $(window).trigger('checkcaptionheights');
    };
  }();
  theme.FeaturedCollectionsSection = new function () {
    this.onSectionLoad = function (target) {
      $(window).trigger('checkcaptionheights');
    };
  }();
  theme.ProductTemplateSection = new function () {
    var galleries = [];

    this.onSectionLoad = function (target) {
      /// Init store availability if applicable
      if ($('[data-store-availability-container]', target).length) {
        this.storeAvailability = new theme.StoreAvailability($('[data-store-availability-container]', target)[0]);
      }

      $('.product-photos:not(.product-photos--initialized)', target).each(function () {
        galleries.push(new theme.ProductMediaGallery($(this)));
      });
      theme.OptionManager.initProductOptions($('[name="id"]', target));
      $(window).trigger('checkcaptionheights');
      $('.product-review-summary a', target).on('click', function (e) {
        e.preventDefault();
        $('html,body').animate({
          scrollTop: $($(this).attr('href')).offset().top - 120
        }, 1000, 'swing');
      });
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
      theme.OptionManager.unloadProductOptions($('[name="id"]', target));
      $('.product-review-summary a', target).off('click');

      if (galleries.length) {
        for (var i = 0; i < galleries.length; i++) {
          galleries[i].destroy();
        }
      }

      if (this.storeAvailability) {
        this.storeAvailability.onSectionUnload();
      }
    };
  }();
  theme.FeaturedProductSection = new function () {
    var galleries = [];

    this.onSectionLoad = function (target) {
      $('.product-photos:not(.product-photos--initialized)', target).each(function () {
        galleries.push(new theme.ProductMediaGallery($(this)));
      });
      theme.OptionManager.initProductOptions($('[name="id"]', target));
      $(window).trigger('checkcaptionheights');
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
      theme.OptionManager.unloadProductOptions($('[name="id"]', target));

      if (galleries.length) {
        for (var i = 0; i < galleries.length; i++) {
          galleries[i].destroy();
        }
      }
    };
  }();
  theme.TestimonialsSection = new function () {
    var _ = this;

    this.assessTestimonialCarouselLayout = function (target) {
      $('.testimonials__items.slick-slider', target).each(function () {
        var containerWidth = $(this).width();
        var itemsSumWidth = 0;
        $(this).find('.slick-slide').each(function () {
          itemsSumWidth += $(this).outerWidth(true) + 1; // defensive rounding
        });
        $(this).toggleClass('slick-slider--center-carousel', itemsSumWidth < containerWidth);
      });
    };

    this.onSectionLoad = function (target) {
      var $carousel = $('.testimonials__items', target); // initialise carousel

      $carousel.on('afterChange', function (e, slideshow) {
        // prepare for caption transition
        var $container = $(this).closest('.testimonials');
        clearTimeout($container.data('captionChangeTimeoutId'));
        clearTimeout($container.data('captionChangeTimeoutId2'));
        var captionToShowEl = $container.find('.testimonials__caption')[$container.find('.slick-current').data('slick-index')];
        $container.find('.testimonials__caption--active').addClass('testimonials__caption--fade-out');
        $container.data('captionChangeTimeoutId', setTimeout(function () {
          $(captionToShowEl).addClass('testimonials__caption--active testimonials__caption--fade-out').siblings('.testimonials__caption--active').removeClass('testimonials__caption--active'); // initiate fade-in after old one has faded out and new one is ready to fade in

          $container.data('captionChangeTimeoutId2', setTimeout(function () {
            $(captionToShowEl).removeClass('testimonials__caption--fade-out');
          }, 10));
        }, 400) // matches css transition
        );
      }).slick({
        autoplay: $carousel.data('autoplay'),
        autoplaySpeed: $carousel.data('autoplay-delay'),
        infinite: false,
        slidesToShow: 1,
        centerMode: true,
        variableWidth: true,
        useTransform: true,
        arrows: false,
        dots: false
      }); // focus on click

      $carousel.on('click', '.testimonials__item', function (e) {
        e.preventDefault();
        $carousel.slick('slickGoTo', $(this).data('slick-index'));
      }); // assess if we can centre the carousel or not

      $(window).off('.testimonialsSection').on('debouncedresize.testimonialsSection', function () {
        _.assessTestimonialCarouselLayout(target);

        $carousel.slick('setPosition');
      });

      _.assessTestimonialCarouselLayout(target);
    };

    this.onSectionUnload = function (target) {
      $('.slick-slider', target).slick('unslick').off('init afterChange click');
      $(window).off('.testimonialsSection');
    };

    this.onBlockSelect = function (target) {
      var $carousel = $(target).closest('.slick-slider');

      if ($carousel.data('autoplay')) {
        $carousel.slick('slickGoTo', $(target).data('slick-index')).slick('slickPause');
      }
    };

    this.onBlockDeselect = function (target) {
      var $carousel = $(target).closest('.slick-slider');

      if ($carousel.data('autoplay')) {
        $carousel.slick('slickPlay');
      }
    };
  }();
  theme.GallerySection = new function () {
    this.onSectionLoad = function (target) {
      theme.reduceOrphans($('.overlay__title, .overlay__subheading', target));
    };
  }();
  theme.CollectionTemplateSection = new function () {
    this.onSectionLoad = function (target) {
      // Sorting
      var $sortBy = $('#sort-by', target);

      if ($sortBy.length > 0) {
        queryParams = {};

        if (location.search.length) {
          for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
            aKeyValue = aCouples[i].split('=');

            if (aKeyValue.length > 1) {
              queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1].replace(/\+/g, '%20'));
            }
          }
        }

        $sortBy.val($sortBy.data('initval')).trigger('change').on('change', function () {
          queryParams.sort_by = $(this).val();
          location.search = $.param(queryParams);
        });
      } // set up mobile filter reveal link


      $('.filter-toggle-button', target).on('click', function (e) {
        e.preventDefault(); // hide btn

        var revealBtnContHeight = $(this).outerHeight(true) + 2; // plus 2 for underline style

        $(this).closest('.mobile-filter-reveal').addClass('mobile-filter-reveal--fade-out'); // prep filters

        var $filters = $(this).closest('.content-main').find('.filters');
        $filters.height(revealBtnContHeight); // show filters

        setTimeout(function () {
          $filters.addClass('filters--transition');
          setTimeout(function () {
            $filters.css({
              height: $filters.find('.filters__inner').height() + 'px',
              opacity: 1
            });
          }, 10);
        }, 250);
      });
      $('#filter-tag', target).on('change', function () {
        window.location = $(this).val();
      });
      $(window).trigger('checkcaptionheights');
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
      $('#sort-by', target).off('change');
      $('#filter-tag', target).off('change');
      $('.filter-toggle-button', target).off('click');
    };
  }();
  theme.BlogTemplateSection = new function () {
    this.onSectionLoad = function (target) {
      $('#filter-tag', target).on('change', function () {
        window.location = $(this).val();
      }); // set up mobile filter reveal link

      $('.filter-toggle-button', target).on('click', function (e) {
        e.preventDefault(); // hide btn

        var revealBtnContHeight = $(this).outerHeight(true) + 2; // plus 2 for underline style

        $(this).closest('.mobile-filter-reveal').addClass('mobile-filter-reveal--fade-out'); // prep filters

        var $filters = $(this).closest('.content-main').find('.filters');
        $filters.height(revealBtnContHeight); // show filters

        setTimeout(function () {
          $filters.addClass('filters--transition');
          setTimeout(function () {
            $filters.css({
              height: $filters.find('.filters__inner').height() + 'px',
              opacity: 1
            });
          }, 10);
        }, 250);
      });
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
      $('#filter-tag', target).off('change');
      $('.filter-toggle-button', target).off('click');
    };
  }();
  theme.ArticleTemplateSection = new function () {
    var _ = this; // load content products one at a time to avoid spamming requests


    this.loadNextContentProduct = function (target) {
      var $toLoad = $('.content-products [data-lazy-product-handle].prod-block:first', target);

      if ($toLoad.length) {
        $.get('/products/' + $toLoad.data('lazy-product-handle') + '/?section_id=product-item', function (response) {
          $toLoad.replaceWith($('<div>' + response + '</div>').find('.prod-block'));
          $(window).trigger('checkcaptionheights'); // Shopify reviews app

          if (window.SPR && SPR.initDomEls && SPR.loadBadges) {
            SPR.initDomEls();
            SPR.loadBadges();
          }
        }).fail(function () {
          $toLoad.remove();
        }).always(function () {
          _.loadNextContentProduct(target);
        });
      }
    };

    this.onSectionLoad = function (target) {
      _.loadNextContentProduct(target);
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
    };
  }();
  theme.ListCollectionsTemplateSection = new function () {
    this.onSectionLoad = function (target) {
      $(window).trigger('checkcaptionheights');
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
    };
  }();
  theme.NothingButAHeaderImageSection = new function () {
    this.onSectionUnload = theme.unloadPageHeaderImage;
  }();
  theme.announcementHeight = 0;
  theme.HeaderSection = new function () {
    this.onSectionLoad = function (target) {
      // search
      var $searchWrapper = $('.header-search__results-wrapper');
      var $searchContainer = $('.header-search__content', target);
      var $searchResultsContainer = $('.header-search__results', target);
      var currentReq = null;
      var searchThrottleDelay = 400;
      var searchThrottleTimeoutId = -1;
      var imageReplaceRegex = {
        search: /(\.[^\.]+)$/,
        replace: '_100x$1'
      };

      var removeResultsAndPrepForMore = function removeResultsAndPrepForMore() {
        var $oldResults = $searchResultsContainer.addClass('header-search__results--disband');
        setTimeout(function () {
          $oldResults.remove();
        }, 500);
        $searchResultsContainer = $('<div class="header-search__results">').insertAfter($searchResultsContainer);
      };

      $('.header-search .input-and-button-row__input', target).on('change.themeHeaderSection keyup.themeHeaderSection paste.themeHeaderSection', function (e) {
        var $input = $(this),
            $form = $(this).closest('form'),
            includeMeta = $searchWrapper.data('live-search-meta'); // has value changed?

        if ($input.val() == $input.data('previous-value')) {
          return;
        } // set content state


        $searchContainer.toggleClass('header-search__content--input-entered', $input.val().length > 0); // set loading state

        $searchContainer.addClass('header-search__content--loading'); // fetch after short timeout, to avoid multiple requests after rapid keypresses

        clearTimeout(searchThrottleTimeoutId);

        if ($input.val().length == 0) {
          removeResultsAndPrepForMore();
          $searchContainer.removeClass('header-search__content--has-results header-search__content--loading');
          return;
        }

        searchThrottleTimeoutId = setTimeout(function () {
          // avoid overlapping requests - abort and fetch latest
          if (currentReq) {
            currentReq.abort();
          } // fetch info


          $input.data('previous-value', $input.val());
          var ajaxUrl, ajaxData;

          if (theme.Shopify.features.predictiveSearch) {
            // use the API
            ajaxUrl = theme.routes.search_url + '/suggest.json';
            ajaxData = {
              "q": $form.find('input[name="q"]').val(),
              "resources": {
                "type": $form.find('input[name="type"]').val(),
                "limit": 6,
                "options": {
                  "unavailable_products": 'last',
                  "fields": includeMeta ? "title,product_type,variants.title,vendor,tag,variants.sku" : "title,product_type,variants.title,vendor"
                }
              }
            };
          } else {
            // use the theme template fallback
            ajaxUrl = $form.attr('action') + ($form.attr('action').indexOf('?') > -1 ? '&' : '?') + $form.serialize() + '&view=json';
            ;
            ajaxData = null;
          }

          currentReq = $.ajax({
            url: ajaxUrl,
            data: ajaxData,
            dataType: "json",
            success: function success(response) {
              var resultsData = response.resources.results;
              removeResultsAndPrepForMore();
              $searchContainer.toggleClass('header-search__content--has-results', resultsData.products.length > 0);

              for (var i = 0; i < resultsData.products.length; i++) {
                var p = resultsData.products[i];
                var $result = $('<a class="search-result__link">').attr('href', p.url);

                if (p.image) {
                  $('<div class="search-result__image">').append($('<img>').attr('src', p.image.replace(imageReplaceRegex.search, imageReplaceRegex.replace)).attr('alt', p.title)).appendTo($result);
                }

                var $resultRight = $('<div class="search-result__detail">').appendTo($result);
                var showVendor = $searchWrapper.data('live-search-vendor');

                if (showVendor) {
                  $('<div class="search-result__vendor">').html(p.vendor).appendTo($resultRight);
                }

                $('<div class="search-result__title">').html(p.title).appendTo($resultRight);
                var $price = $('<div class="search-result__price product-price">').appendTo($resultRight);

                if (p.price_max != p.price_min) {
                  $('<span class="product-price__from">').html(theme.strings.productsListingFrom).appendTo($price);
                  $price.append(' ');
                }

                $('<span class="product-price__amount theme-money">').html(theme.Shopify.formatMoney(p.price_min, theme.money_format)).appendTo($price);

                if (p.compare_at_price_min > p.price_min) {
                  $price.append(' ');
                  $('<span class="product-price__compare theme-money">').html(theme.Shopify.formatMoney(p.compare_at_price_min, theme.money_format)).appendTo($price);
                }

                $('<div class="search-result">').append($result).appendTo($searchResultsContainer);
              }

              if (resultsData.pages && resultsData.pages.length || resultsData.articles && resultsData.articles.length) {
                var $pageResults = $('<div class="header-search__page-results">');

                var addResults = function addResults(pageResultsData) {
                  for (var i = 0; i < pageResultsData.length; i++) {
                    var item = pageResultsData[i];
                    var $result = $('<a class="search-result__link">').attr('href', item.url).html(item.title);
                    $('<div class="search-result">').append($result).appendTo($pageResults);
                  }
                };

                $('<h3 class="header-search__small-heading meta">').html(theme.strings.searchResultsPages).appendTo($pageResults);
                if (resultsData.pages) addResults(resultsData.pages);
                if (resultsData.articles) addResults(resultsData.articles);
                $pageResults.appendTo($searchResultsContainer);
              }

              if (resultsData.products.length > 0) {
                // console.log($input.closest('form').serialize());
                $('<a class="feature-link">').attr('href', theme.routes.search_url + '?' + $input.closest('form').serialize()).html(theme.strings.searchSeeAll).appendTo($searchResultsContainer);
              }

              var $thisSearchResultsContainer = $searchResultsContainer;
              setTimeout(function () {
                $thisSearchResultsContainer.addClass('header-search__results--show');
              }, 10);
            },
            error: function error(response) {
              console.log('Error', response);
            },
            complete: function complete(response) {
              currentReq = null;
              $searchContainer.removeClass('header-search__content--loading');
            }
          });
        }, searchThrottleDelay);
      });
      $('.input-with-clear__clear', target).on('click.themeHeaderSection', function (e) {
        e.preventDefault();
        $(this).closest('.input-with-clear').find('input').val('').trigger('change');
      }); // set announcement offset for scroll checks

      var announcement = document.getElementById('announcement_bar');

      if (announcement) {
        theme.announcementHeight = announcement.clientHeight;
        $(window).on('debouncedresize.headerSection', function () {
          theme.announcementHeight = announcement.clientHeight;
        });
      } else {
        theme.announcementHeight = 0;
      } // specifically on the product page on mobile, when the title is not in the header and the breadcrumbs disappear
      // make sure the banner covers the header


      theme.ensureBannerCoversOverlapHeader();
      $(window).on('debouncedresize.headerSection', theme.ensureBannerCoversOverlapHeader); // alter classes on scroll for sticky headers

      $('body').removeClass('scrolled-down');

      if ($('.pageheader__contents--sticky', target).length) {
        var setScrolledState = function setScrolledState() {
          if (!$('body').hasClass('scrolled-down') && $(window).scrollTop() > theme.announcementHeight) {
            $('body').css('overflow-anchor', 'none');
            clearTimeout(theme.debouncedWindowScrollOverflowAnchorTimeoutId);
            theme.debouncedWindowScrollOverflowAnchorTimeoutId = setTimeout(function () {
              $('body').css('overflow-anchor', '');
            }, 255);
          }

          $('body').toggleClass('scrolled-down', $(window).scrollTop() > theme.announcementHeight);
        };

        $(window).on('scroll.headerSection', setScrolledState);
        setScrolledState();
      }

      $('.disclosure', target).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });
      var $inlineLinksContainer = $('#pageheader .site-control__inline-links > .nav-row');
      var $inlineLinks = $('#pageheader .site-control__inline-links .tier-1 > ul');

      function checkInlineNavWidth() {
        //Check when to show/hide the inline nav
        if (theme.nav.bar.isInlineNavEnabled() && $inlineLinksContainer.outerWidth() > $inlineLinks.outerWidth()) {
          theme.nav.bar.changeToInline();
        } else {
          theme.nav.bar.changeToBurger();
        }
      }

      checkInlineNavWidth();
      $(window).on('debouncedresizewidth.inlinenav', checkInlineNavWidth);
      theme.checkBannerPadding();
      $(window).on('debouncedresizewidth.bannerpadding', theme.checkBannerPadding);
    };

    this.onSectionUnload = function (target) {
      $('.header-search .input-and-button-row__input', target).off('.themeHeaderSection');
      $('.input-with-clear__clear', target).off('.themeHeaderSection');
      $('.disclosure', target).each(function () {
        $(this).data('disclosure').unload();
      });
      $(window).off('.headerSection');
      $(window).off('debouncedresizewidth.inlinenav');
      $(window).off('debouncedresizewidth.bannerpadding');
    };
  }();
  theme.FooterSection = new function () {
    this.onSectionLoad = function (target) {
      $('.disclosure', target).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });
    };

    this.onSectionUnload = function (target) {
      $('.disclosure', target).each(function () {
        $(this).data('disclosure').unload();
      });
    };
  }();
  theme.CartTemplateSection = new function () {
    this.onSectionLoad = function (target) {
      // terms and conditions checkbox
      if ($('#cartform input#terms', target).length > 0) {
        $(document).on('click.cartTemplateSection', '#cartform [name="checkout"]:submit, a[href="/checkout"]', function () {
          if ($('#cartform input#terms:checked').length == 0) {
            alert(theme.strings.cartTermsConfirmation);
            return false;
          }
        });
      }
    };

    this.onSectionUnload = function (target) {
      theme.unloadPageHeaderImage(target);
      $(document).off('.cartTemplateSection');
    };
  }(); // A section that contains other sections, e.g. story page

  theme.NestedSectionsSection = new function () {
    this.onSectionLoad = function (target) {
      // load child sections
      $('[data-nested-section-type]', target).each(function () {
        var type = $(this).attr('data-nested-section-type');
        var section = null;

        for (var i = 0; i < theme.Sections._sections.length; i++) {
          if (theme.Sections._sections[i].type == type) {
            section = theme.Sections._sections[i].section;
          }
        }

        if (section) {
          var instance = {
            target: this,
            section: section,
            $shopifySectionContainer: $(this).closest('.shopify-section'),
            thisContext: {}
          };

          theme.Sections._instances.push(instance);

          $(this).data('themeSectionInstance', instance);
          section.onSectionLoad.bind(instance.thisContext)(this);
        }
      });
    };

    this.onSectionUnload = function (target) {
      // unload child sections
      $('[data-nested-section-type]', target).each(function () {
        theme.Sections.sectionUnload.bind($(this).data('themeSectionInstance').thisContext)(this);
      });
      theme.unloadPageHeaderImage(target);
    };

    this.onBlockSelect = function (target) {
      // scroll to block
      $(window).scrollTop($(target).offset().top - 100);
    };
  }(); // Changes the tabindex value of items in the nav based on whether its open or not (to avoid tab traps)

  theme.toggleNav = function () {
    if ($('html').hasClass('open-menu')) {
      theme.checkBannerPadding();
      $('#main-menu a[tabindex]').removeAttr('tabindex');
      $('body').css('padding-right', $.scrollBarWidth());
    } else {
      $('#main-menu a').attr('tabindex', '-1');
      $('body').css('padding-right', '');
    }
  }; // Changes the tabindex value of items in the search popup based on whether its open or not (to avoid tab traps)


  theme.toggleSearchTabIndices = function () {
    if ($('body').hasClass('open-search')) {
      $('.header-search').find('a[tabindex], button[tabindex], input[tabindex]').removeAttr('tabindex');
    } else {
      $('.header-search').find('a, button, input').attr('tabindex', '-1');
    }
  };

  theme.namespaceFromSection = function (container) {
    return ['.', $(container).data('section-type'), $(container).data('section-id')].join('');
  };

  $(function ($) {
    theme.toggleNav();
    theme.toggleSearchTabIndices(); /// Persistent events for nav interaction

    $(document).on('keydown', '.main-menu-toggle:not(.main-menu-toggle--back)', function (e) {
      // return or space - toggle menu and move focus
      if (e.which == 13 || e.which == 32) {
        e.preventDefault();
        e.stopPropagation();
        $('html').toggleClass('open-menu');
        theme.toggleNav();

        if ($('html').hasClass('open-menu')) {
          $('#main-menu .main-menu-links a:first').focus();
        } else {
          $('#pageheader .main-menu-toggle').focus();
        }
      }
    });
    $(document).on('click', '.main-menu-toggle', function (e) {
      e.preventDefault(); //Only toggle nav if the button is not in 'back mode'

      if ($('html').hasClass('open-menu') && $(this).hasClass('main-menu-toggle--back')) {
        return;
      }

      $('html').toggleClass('open-menu');
      theme.toggleNav();
    });
    $(document).on('click touchstart touchend', '.open-menu .focus-tint', function (e) {
      $('.open-menu').removeClass('open-menu');
      theme.toggleNav();
      e.preventDefault();
    });
    $(document).on('click touchstart touchend', '.open-search .focus-tint', function (e) {
      $('.open-search').removeClass('open-search');
      theme.toggleSearchTabIndices();
      e.preventDefault();
    });
    var menuPanelTransitionDelay = 300;
    $(document).on('click', '.has-children > .main-menu-link', function (e) {
      e.preventDefault();
      $(this).attr('aria-expanded', 'true');
      var $disappearing = $(this).closest('.main-menu-panel').addClass('main-menu-panel--inactive-left');
      var $appearing = $('#' + $(this).attr('aria-controls'));
      $('#pageheader .main-menu-toggle').addClass('main-menu-toggle--back');
      setTimeout(function () {
        $appearing.removeClass('main-menu-panel--inactive-right');
      }, menuPanelTransitionDelay);
    });
    $(document).on('click', '.open-menu #pageheader .main-menu-toggle.main-menu-toggle--back', function (e) {
      e.preventDefault();
      $('#main-menu .main-menu-panel:not(.main-menu-panel--inactive-left):not(.main-menu-panel--inactive-right) .main-menu-breadcrumbs__link').last().trigger('click');
      return false;
    }); //Handle expanding nav

    theme.lastHoverInteractionTimestamp = -1;
    $(document).on('click', '.multi-level-nav .nav-rows  .contains-children > a', function (e) {
      $(this).parent().find('ul:first').slideToggle(300);
      return false;
    });
    $(document).on('click forceopen forceclose', '.multi-level-nav .contains-mega-menu a.has-children', function (e) {
      // skip column headings
      if ($(this).hasClass('column-title')) {
        return true;
      }

      var navAnimSpeed = 200; // check if mouse + click events occurred in same event chain

      var thisInteractionTimestamp = Date.now();

      if (e.type == 'click' && thisInteractionTimestamp - theme.lastHoverInteractionTimestamp < 500) {
        return false;
      }

      if (e.type == 'forceopen' || e.type == 'forceclose') {
        theme.lastHoverInteractionTimestamp = thisInteractionTimestamp;
      } //Set some useful vars


      var $tierEl = $(this).closest('[class^="tier-"]');
      var $tierCont = $tierEl.parent();
      var targetTierNum = parseInt($tierEl.attr('class').split('-')[1]) + 1;
      var targetTierClass = 'tier-' + targetTierNum; ///Remove nav for all tiers higher than this one (unless we're opening on same level on hover)

      if (e.type != 'forceopen') {
        $tierCont.children().each(function () {
          if (parseInt($(this).attr('class').split('-')[1]) >= targetTierNum) {
            if (e.type == 'forceclose') {
              $(this).removeClass('tier-appeared');
              var $this = $(this);
              theme.hoverRemoveTierTimeoutId = setTimeout(function () {
                $this.remove();
              }, 260);
            } else {
              $(this).slideUpAndRemove(navAnimSpeed);
            }
          }
        });
      } //Are we expanding or collapsing


      if ($(this).hasClass('expanded') && e.type != 'forceopen') {
        //Collapsing. Reset state
        $(this).removeClass('expanded').removeAttr('aria-expanded').removeAttr('aria-controls');
      } else {
        ///Show nav
        //Reset other nav items at this level
        $tierEl.find('a.expanded').removeClass('expanded').removeAttr('aria-expanded');
        clearTimeout(theme.hoverRemoveTierTimeoutId); //If next tier div doesn't exist, make it

        var $targetTierEl = $tierCont.children('.' + targetTierClass);

        if ($targetTierEl.length == 0) {
          $targetTierEl = $('<div />').addClass(targetTierClass).attr('id', 'menu-' + targetTierClass).appendTo($tierCont);

          if (navAnimSpeed > 0) {
            // new tier, start at 0 height
            $targetTierEl.css('height', '0px');
          }
        } else {
          if (navAnimSpeed > 0) {
            // tier exists, fix its height before replacing contents
            $targetTierEl.css('height', $targetTierEl.height() + 'px');
          }
        } // populate new tier


        $targetTierEl.empty().stop(true, false).append($(this).siblings('ul').clone().attr('style', ''));
        $targetTierEl.append($(this).parent().find('.nav-contact-info').clone());

        if (navAnimSpeed > 0) {
          // transition to correct height, then clear height css
          $targetTierEl.animate({
            height: $targetTierEl.children().outerHeight()
          }, navAnimSpeed, function () {
            $(this).css('height', '');
          });
        } // add class after reflow, for any transitions


        setTimeout(function () {
          $targetTierEl.addClass('tier-appeared');
        }, 10); //Mark as expanded

        $(this).addClass('expanded').attr('aria-expanded', 'true').attr('aria-controls', 'menu-' + targetTierClass);
        $('body').addClass('nav-mega-open');
      }

      return false;
    }); /// Expanding nav on hover

    theme.closeOpenMenuItem = function () {
      $('body').removeClass('nav-mega-open');
      $('.multi-level-nav.reveal-on-hover .has-children.expanded').trigger('forceclose');
    };

    $(document).on('mouseenter mouseleave', '.multi-level-nav.reveal-on-hover .tier-1 .contains-mega-menu', function (e) {
      if (theme.viewport.isSm()) {
        clearTimeout(theme.closeOpenMenuItemTimeoutId);

        if (e.type == 'mouseenter') {
          $(this).children('a').trigger('forceopen');
        } else {
          theme.closeOpenMenuItemTimeoutId = setTimeout(theme.closeOpenMenuItem, 200);
        }
      }
    });
    $(document).on('mouseleave', '.multi-level-nav.reveal-on-hover .tier-appeared', function (e) {
      if (theme.viewport.isSm()) {
        clearTimeout(theme.closeOpenMenuItemTimeoutId);
        theme.closeOpenMenuItemTimeoutId = setTimeout(theme.closeOpenMenuItem, 50);
      }
    });
    $(document).on('mouseenter', '.multi-level-nav.reveal-on-hover .tier-2, .multi-level-nav.reveal-on-hover .tier-3', function (e) {
      if (theme.viewport.isSm()) {
        clearTimeout(theme.closeOpenMenuItemTimeoutId);
      }
    }); /// Side up and remove

    $.fn.slideUpAndRemove = function () {
      var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 200;
      $(this).each(function () {
        $(this).slideUp(speed, function () {
          $(this).remove();
        });
      });
    };

    $(document).on('click', '.main-menu-breadcrumbs__link', function (e) {
      e.preventDefault();
      var $appearing = $($(this).attr('href'));
      var $disappearing = $(this).closest('.main-menu-panel').addClass('main-menu-panel--inactive-right');

      if ($(this).attr('href') == '#main-menu-panel') {
        // 3rd tier -> 1st tier, hide middle menu
        $('.main-menu-panel--child.main-menu-panel--inactive-left').addClass('main-menu-panel--inactive-right').removeClass('main-menu-panel--inactive-left');
        $('#pageheader .main-menu-toggle').removeClass('main-menu-toggle--back');
      }

      setTimeout(function () {
        $appearing.removeClass('main-menu-panel--inactive-left');
      }, menuPanelTransitionDelay);
    }); /// Toggle mini-menu search

    $(document).on('click', '.header-search-toggle', function (e) {
      e.preventDefault();

      if ($('body').toggleClass('open-search').hasClass('open-search')) {
        setTimeout(function () {
          $('.header-search input[name="q"]').focus();
        }, 500);
      }

      theme.toggleSearchTabIndices();
    }); /// Gallery
    // variant images

    $(document).on('variantImageSelected', '.product-photos', function (e, data) {
      // get image src
      var variantSrc = data.featured_media.preview_image.src.split('?')[0].replace(/http[s]?:/, ''); // locate matching thumbnail & click it

      var $thumb = $(this).find('.thumbnails:not(.hidden) a[href^="' + variantSrc + '"]:first');
      $thumb.trigger('click');
    }); /// General lightbox for all

    $('a[rel=lightbox]').colorbox({
      maxWidth: '94%'
    }); /// Galleries (only on large screens)

    if ($(window).height() >= theme.lightbox_min_window_height && $(window).width() >= theme.lightbox_min_window_width) {
      $('a[rel="gallery"]').colorbox({
        rel: 'gallery',
        maxWidth: '94%'
      });
    } ///Utility class for detecting touch devices


    function isTouchDevice() {
      var prefixes = '-webkit- -moz- -o- -ms-'.split(' ');

      var mq = function mq(query) {
        return window.matchMedia(query).matches;
      };

      if ('ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
      }

      var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
      return mq(query);
    } /// Immmediately select contents when focussing on some inputs


    $(document).on('focusin click', 'input.select-on-focus', function () {
      if (!isTouchDevice()) {
        $(this).select();
      }
    }).on('mouseup', 'input.select-on-focus', function (e) {
      e.preventDefault(); //Prevent mouseup killing select()
    }); /// Product blocks should have consistent heights, if that setting is enabled

    if (theme.productImageAlign) {
      var checkCaptionHeights = function checkCaptionHeights() {
        $('.product-list').each(function () {
          // images and captions, by row
          var $firstBlock = $('.prod-block:first', this).first();
          var productsPerRow = Math.round($firstBlock.parent().width() / $firstBlock.outerWidth(true));
          var $caps = $('.prod-caption', this);
          var $imgs = $('.rimage-outer-wrapper, .placeholder', this);
          var $imgContainers = $('.prod-image-wrap', this);

          for (var i = 0; i < Math.ceil($caps.length / productsPerRow); i++) {
            var $captionsToProcess = $caps.slice(i * productsPerRow, (i + 1) * productsPerRow);
            var tallest = 0;
            $captionsToProcess.each(function () {
              var ch = $(this).children().outerHeight();
              if (ch > tallest) tallest = ch;
            }).height(tallest);
            var $imagesToProcess = $imgs.slice(i * productsPerRow, (i + 1) * productsPerRow);
            var $imgContainersToProcess = $imgContainers.slice(i * productsPerRow, (i + 1) * productsPerRow);
            tallest = 0;
            $imagesToProcess.each(function () {
              var ch = $(this).outerHeight();
              if (ch > tallest) tallest = ch;
            });
            $imgContainersToProcess.height(tallest);
          }
        });
      };

      $(function () {
        checkCaptionHeights();
      });
      $(window).on('debouncedresize checkcaptionheights', checkCaptionHeights).trigger('checkcaptionheights');
    }

    window.SPRCallbacks = {
      onBadgeLoad: function onBadgeLoad() {
        $(window).trigger('checkcaptionheights');
      }
    }; /// Show newsletter signup response

    if ($('.newsletter-response').length > 0 && $('.cc-popup-form__response--success').length === 0) {
      $.colorbox({
        fixed: true,
        maxWidth: '94%',
        html: ['<div class="signup-modal-feedback">', $('.newsletter-response:first').html(), '</div>'].join('')
      });
    } /// Watch for tabbing


    function handleFirstTab(e) {
      if (e.keyCode === 9) {
        // 9 == tab
        $('body').addClass('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    }

    window.addEventListener('keydown', handleFirstTab); // Watch for play/stop video events

    $(document).on('cc:video:play', function () {
      if ($(window).outerWidth() < 768) {
        $('body').addClass('video-modal-open');
      }
    }).on('cc:video:stop', function () {
      if ($(window).outerWidth() < 768) {
        $('body').removeClass('video-modal-open');
      }
    }); //Check for ie11 or below

    if (/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
      $('body').addClass('browser-ie11-below');
    } //Hide the footer on the callenge page


    if (window.location.href.indexOf('/challenge') > 0 && window.location.href.indexOf('/pages') === -1) {
      document.getElementById('pagefooter').style.display = 'none';
    } /// On any section reorder


    $(document).on('shopify:section:reorder', function (e) {
      theme.checkBannerPadding();
    }); /// On any section load

    $(document).on('shopify:section:load', function (e) {
      theme.loadPageHeaderImage();
      theme.checkBannerPadding();
    }); /// Register all sections

    theme.Sections.init();
    theme.Sections.register('header', theme.HeaderSection, {
      deferredLoad: false
    });
    theme.Sections.register('footer', theme.FooterSection);
    theme.Sections.register('banner-index', theme.BannerIndexSection);
    theme.Sections.register('slideshow', theme.SlideshowSection);
    theme.Sections.register('slideshow-with-text', theme.SlideshowWithTextSection);
    theme.Sections.register('featured-collection', theme.FeaturedCollectionSection);
    theme.Sections.register('featured-collections', theme.FeaturedCollectionsSection);
    theme.Sections.register('product-template', theme.ProductTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('cart-template', theme.CartTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('collection-template', theme.CollectionTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('blog-template', theme.BlogTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('article-template', theme.ArticleTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('search-template', theme.NothingButAHeaderImageSection, {
      deferredLoad: false
    });
    theme.Sections.register('page-template', theme.NothingButAHeaderImageSection, {
      deferredLoad: false
    });
    theme.Sections.register('page-contact-template', theme.NothingButAHeaderImageSection, {
      deferredLoad: false
    });
    theme.Sections.register('page-list-collections-template', theme.ListCollectionsTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('list-collections-template', theme.ListCollectionsTemplateSection, {
      deferredLoad: false
    });
    theme.Sections.register('featured-product', theme.FeaturedProductSection);
    theme.Sections.register('testimonials', theme.TestimonialsSection);
    theme.Sections.register('gallery', theme.GallerySection);
    theme.Sections.register('background-video', theme.VideoManager);
    theme.Sections.register('nested-sections', theme.NestedSectionsSection);
  });
  $.extend($.colorbox.settings, {
    previous: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Left</title><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    next: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Right</title><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
    close: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>Close</title><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
  }); //Register dynamically pulled in sections

  $(function ($) {
    if (cc.sections.length) {
      cc.sections.forEach(function (section) {
        try {
          theme.Sections.register(section.name, section.section);
        } catch (err) {
          console.error("Unable to register section ".concat(section.name, "."), err);
        }
      });
    } else {
      console.warn('Barry: No common sections have been registered.');
    }
  });
})(theme.jQuery);  
/* Built with Barry v1.0.7 */