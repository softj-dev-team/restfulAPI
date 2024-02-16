(function(global, ui){
  'use strict';

  //default.option ---> dots: true, slidesToShow: 1, slidesToScroll: 1, variableWidth: false, infinite: true, fade: false, autoplay: false, speed:600, autoplaySpeed: 3000
  slideset.case1 = {
    option : { slidesToShow: 1, slidesToScroll: 1, useTransform:false }
  };
  slideset.case2 = {
    option : { slidesToShow: 1, slidesToScroll: 1, useTransform:false, mobileFirst: true, responsive: [{breakpoint: 767, settings: 'unslick'}] }
  };
  slideset.case3 = {
    option : { slidesToShow: 1, slidesToScroll: 1, useTransform:false, mobileFirst: true, responsive: [{breakpoint: 450, settings: {slidesToShow: 2, slidesToScroll: 2}},{breakpoint: 767, settings: 'unslick'}] }
  };

  slideset.case4 = {
    option : { slidesToShow: 4, dots: true, slidesToScroll: 1, useTransform:false, autoplay: true, mobileFirst: false, responsive: [{breakpoint: 1280, settings: {slidesToShow: 3, slidesToScroll: 1}},{breakpoint: 1280, settings: {slidesToShow: 1, slidesToScroll: 1}}] }
  };

  var grid = {
    "case1" : function(_option){
      var curIdx, oldIdx, $this = $jq.$jq(this), $cont, $btn, _cssname = _option.cssname || "active", _item = _option.item || ".item", _btn = _option.btn || ".btn", _cont = _option.cont || ".cont", swipeTime;
      $cont = $this.find(_cont).each(function(iii){ this.idx = iii; });
      $btn = $this.find(_btn).each(function(iii){ this.idx = iii; this._$item = $jq.$jq(this).closest(_item); });
      curIdx = $btn.index($btn.filter("."+_cssname)) || 0;
      if(curIdx<0) curIdx = 0;
      var view = function(){
        this._$item.addClass(_cssname);
        $cont.eq(this.idx).addClass(_cssname);
        $jq.$jq(this).addClass(_cssname);
        var $swipe = this._$item.closest("[data-swipe]"), _idx = this.idx;
        clearTimeout(swipeTime);
        if($swipe.length && !$swipe.is(".swipe-off") && $swipe[0].$list) swipeTime = window.setTimeout(function(){
          swipeset[$swipe[0].option.type].moveact.call($swipe[0], 0, Math.abs($cont.eq(_idx).offset().left-$swipe[0].$list.offset().left), 0.3);
        }, 350);
      };
      var hidden = function(){
        this._$item.removeClass(_cssname);
        $cont.eq(this.idx).removeClass(_cssname);
        $jq.$jq(this).removeClass(_cssname);
      };
      $this.on("click.gridCase1", _btn, function(e){
        curIdx = this.idx;
        if(curIdx == oldIdx) return false;
        if(oldIdx!=undefined) hidden.call($btn[oldIdx]);
        view.call(this);
        oldIdx = curIdx;
        e.preventDefault();
      })
      $btn.eq(curIdx).trigger("click.gridCase1");
    }
  };

  var _page = {
    $win : null, $html : null, $body : null, wintitle : "", winH : null, scrollstate : {start:1, top:0, gnbtop:0, ishead:false, headfix:false, dir:"down", issmall:false},
    evt : {
      winclick : function(e){
        var target = e.target.nodeName==="A"||e.target.nodeName==="BUTTON" ? e.target : e.currentTarget, blindtitle, toggleclass, $target = $jq.$jq(target), $relele, uipop, type, rel;
        uipop = target.getAttribute("data-uipop");
        blindtitle = target.getAttribute("data-blind-title");
        toggleclass = target.getAttribute("data-toggleclass");
        if(target.href&&target.href.match(/^tel/)&&!uiagent.ismobile) alert("전화연결은 모바일에서만 이용가능합니다."), e.preventDefault();

        if(toggleclass) $target.toggleClass(toggleclass);
        if(blindtitle){
          var blindtitleEle = document.getElementById(blindtitle);
          if(blindtitleEle){
            blindtitleEle.innerHTML = $target.attr("title","selected").text();
            $jq('[data-blind-title="'+blindtitle+'"]').not(target).attr("title","");
          }
        }
        if($target.is("[data-anchor]")) anchorani.call(target);
        if(uipop){
          $relele = url2el(target, null);
          if(uipop==0 || uipop==1){
            if(!$relele) $relele = $target.closest('[data-uipopset]');
            if($relele.length==0) $relele = null;
            if(!$relele && !window.parent.length) self.close();
            if($relele && uipop==0) $relele.uipop("close");
            if($relele && uipop==1) $relele.uipop("open");
          }else if(uipop!="" && uipop!=undefined){
            var url = target.getAttribute("href") || target.getAttribute("data-url");
            var _data = $jq.extend([], $target.data("uipop"));
            _data.unshift(url);
            $target.uipop({winpop:_data});
          }
          e.preventDefault();
        }
      },
      winresize : function(e, first){
        $jq.publish('resize.picturefill', e);
        if(!first){
          _page.$body.find('div[data-slide]').slick('resize');
          swipeset.sizecheck();
        }
        if(_page.scrollstate.ishead){
          _page.scrollstate.gnbtop = _page.layout.$header.offset().top;
          _page.scrollstate.start = _page.scrollstate.gnbtop+(_page.$html.width()>767?44:70);
          if(_page.scrollstate.start<=0) _page.scrollstate.start = 1;
          _page.$html.data("anchoradd",_page.scrollstate.gnbtop+_page.layout.$header.height());
        }
        _page.winH = _page.$win.height();
      },
      winscroll : function(e, first){
        var cname, headfix, curscrolltop = _page.$win.scrollTop(), issmall, dir = (_page.scrollstate.top > curscrolltop) ? "up" : "down";
        var menuclass = {
          "set" : function(nm){
            _page.layout.$header.addClass(nm);
            _page.layout.menu.$lnb && $jq("div.lnb").addClass(nm);
          },
          "kill" : function(nm){
            _page.layout.$header.removeClass(nm);
            _page.layout.menu.$lnb && $jq("div.lnb").removeClass(nm);
          }
        };
        if(first || Math.abs(_page.scrollstate.top-curscrolltop)>=1){
          if(_page.scrollstate.ishead){
            cname=["fixed", "mini", "scroll-up"], headfix = (curscrolltop >= _page.scrollstate.gnbtop) ? true : null, issmall = (curscrolltop >= _page.scrollstate.start);
            if(_page.scrollstate.issmall!=issmall){
              if(issmall) menuclass.set(cname[1]);
              else menuclass.kill(cname[1]);
              _page.scrollstate.issmall = issmall;
            }
            if(_page.scrollstate.headfix!=headfix){
              if(headfix){
                menuclass.set(cname[0]);
              }else{
                menuclass.kill(cname[0]+" "+cname[2]);
                _page.scrollstate.dir = dir;
              }
              _page.scrollstate.headfix = headfix;
            }
            if(headfix && _page.scrollstate.dir!=dir){
              if(dir=="up") menuclass.set(cname[2]);
              else menuclass.kill(cname[2]);
              _page.scrollstate.dir = dir;
            }
          }
          _page.scrollstate.top = curscrolltop;
        }
        if(_page.layout.$quickfix){
          if((_page.scrollstate.top+_page.winH) > (_page.$body.get(0).scrollHeight-_page.layout.$footer.height()-100)) _page.layout.$quickfix.addClass("hide");
          else _page.layout.$quickfix.removeClass("hide");
        }
      },
      doc : function($wrap){
        var selectPlaceholder = function(){
          var $this = $jq.$jq(this);
          var isEqual = ($jq.trim($this.find("option").eq(this.selectedIndex).text()).toLowerCase()==$jq.trim(this.getAttribute("data-placeholder")).toLowerCase());
          if(isEqual) $this.addClass("placeholder");
          else $this.removeClass("placeholder");
        };
        function selectTab(v){ var _this = this, _data = $jq.$jq(this).data("selchange"); _data.conts && $jq(_data.conts).load(this.value, function(response, status, xhr){ if(status == "error"){ selectTab.call(_this); } }); }
        $wrap.find("select[data-placeholder]").each(selectPlaceholder).off("change.placeholder").on("change.placeholder", selectPlaceholder).trigger("change.placeholder");
        $wrap.find("select[data-selchange]").each(selectPlaceholder).off("change.selchange").on("change.selchange", selectTab).trigger("change.selchange");
        $wrap.find("input[data-placeholder='true'], textarea[data-placeholder='true']").off('focus.placeholder blur.placeholder change.placeholder').on('focus.placeholder', function() { $jq.$jq(this).removeClass("placeholder"); }).on('blur.placeholder', function() {
          if(this.value) $jq.$jq(this).removeClass("placeholder"); else $jq.$jq(this).addClass("placeholder");
        }).on('change.placeholder', function() { $jq.$jq(this).trigger('blur.placeholder'); }).trigger('blur.placeholder');
        $wrap.find("input[data-delete]").off('focus.delbtn blur.delbtn keydown.delbtn keyup.delbtn').on('focus.delbtn blur.delbtn keydown.delbtn keyup.delbtn', function() {
          if($jq.trim(this.value)=="") $jq.$jq(this).parent().removeClass("del-view"); else $jq.$jq(this).parent().addClass("del-view");
        }).trigger('blur.delbtn').each(function(){
          var _ = this, _$jq = $jq.$jq(_), delname = _$jq.data("delete") || ".fm-del";
          if(delname && delname!="") _$jq.parent().find(delname).off("click.delbtn").on("click.delbtn", function(){ _.value=""; _$jq.focus().trigger('change.fakefile'); return false; });
        });
        $wrap.find("input[data-fakefile='file']").off('change.fakefile').on('change.fakefile', function() {
          var _ = this, _$jq = $jq.$jq(_);
          if($jq.trim(_.value)=="") _$jq.parent().removeClass("del-view"), _.$ipt && _.$ipt.val("");
          else _$jq.parent().addClass("del-view"), _.$ipt && _.$ipt.val(_.value.replace(/.*\\/,""));
        }).trigger('change.fakefile').each(function(){ this.$ipt = $jq.$jq(this).parent().find("input[data-fakefile='text']"); });

        $jq.each($wrap.find("input[data-calendar]"), function(){
          var $this = $jq.$jq(this), _conf;
          _conf = $jq.extend({}, {animate:true, inline:false, shorthandCurrentMonth : true, disableMobile:false, dateFormat:"Y.m.d", mode : "single", static : true}, $this.data("calendar"));  //mode : "single", "multiple", or "range"
          this.pickr = new flatpickr(this, _conf);
        });
      }
    },
    docTitle : function(){
      var addtitle = _page.wintitle;
      $jq.each($jq("[data-addtitle], .board-title"), function(){
        var t = this.getAttribute("data-addtitle");
        if(!t || t=="this"||t=="") t = $jq.$jq(this).text();
        addtitle += " > "+t;
      });
      document.title = addtitle;
    },
    reInit : function($wrap){
      var _ = _page, isReInit = true;
      if(!_.$body) return;
      if(!$wrap) $wrap = _.$body, isReInit = false;

      $wrap.find('button[data-for], a[data-for]').matchfor();
      $wrap.find('[data-tab]').tab();
      $wrap.find('[data-dropdown]').dropdown();
      slideset.init($wrap.find('div[data-slide]'));
      swipeset.init($wrap.find('div[data-swipe]').not(".swipe-initialized"));
      $wrap.find('div[data-scrollbar]').each(function(){
        var $this = $jq.$jq(this);
        if($this.data("initscrollbar")) return false;
        $this.addClass("js-visible");
        var _option = $this.data("initscrollbar",true).data("scrollbar");
        if(!_option.autohide) _option.autohide = false;
        if(!_option.axis) _option.axis = "y";
        else if(_option.axis=="xy") _option.axis = "yx";
        $this.mCustomScrollbar({ scrollbarPosition:"inside", axis:_option.axis, mouseWheel:{ scrollAmount: 150 }, autoHideScrollbar:_option.autohide });
        $this.removeClass("js-visible");
      });
      $wrap.find("[data-grid]").each(function(){
        var _option = $jq.$jq(this).data("grid") || {};
        grid[_option.name||"case1"].call(this, _option);
      });

      setTimeout(function(){ $wrap.find('dl[data-accordion], table[data-accordion], div[data-accordion], ul[data-accordion]').accordion(); }, 200);
      _.evt.doc($wrap); //form event
      if(!isReInit){
        $jq.subscribe('resize.picturefill', picturefill);
        _.$body.off("click.linkHandler").off("click.linkHandler", "a, button, area").on("click.linkHandler", "a, button, area", _.evt.winclick);
        _.$win.off("resize.layoutsc orientationChange.layoutsc").on("resize.layoutsc orientationChange.layoutsc", _.evt.winresize).trigger("resize.layoutsc", true).off("scroll.layoutsc").on("scroll.layoutsc", _.evt.winscroll).trigger("scroll.layoutsc");
        setTimeout(function(){ _.$win.trigger("resize.layoutsc", true).trigger("scroll.layoutsc", true); }, 500);
      }else{
        $jq.publish('resize.picturefill');
      }
      _.docTitle();
    },
    layout : {
      $header : null, $footer : null,
      menu : {
        code : {gnb : "", lnb : ""}, $allbtn : null, $allnav : null, $allgroup : null, $gnb : null, $lnb : null, $lnbnav : null,
        gnbSet : function($clone){
          var _layout = _page.layout, _gnbAdd="", menu = this;
          _gnbAdd = $jq('<ul class="group" data-accordion=\'{"reset":"class","effect":"fade","effoverlap":true,"hover":true}\'>');
          _gnbAdd.append(
            $clone.removeAttr("data-menu").find("button[data-act='btn']").remove().end()
              .find(".mo-hide").removeClass("mo-hide").end()
              .find(".sub").attr("data-act","cont").prev().attr("data-act","btn").parent().attr("data-act","title").end().end().end()
            );
          menu.$gnb.append(_gnbAdd);
        },
        lnbSet : function($wrap){
          var menu = this, _clone =$jq("<div>");
          $wrap.find(".active").not(".sub").each(function(){
            var $this = $jq.$jq(this), _case = $this.data("menu"), nodelower = this.nodeName.toLowerCase(), _code=[];
            if(_case=="main" || (_case!="util" && nodelower=="li")){
              $this.siblings(":not([data-menu='util'])").each(function(iii){
                _code[iii] = _clone.html('').append($jq.$jq(this).children("a:first-child, button:first-child").clone().removeAttr("data-act").attr("class","dep-2-in")).html();
              });
              var _tcode = _clone.html('').append($this.children("a:first-child, button:first-child").clone().find("button,a").remove().end().attr({"class":"dep-in","data-act":_code.length>0?"title":null,"data-addtitle":"this"})).html();
              if(_code.length>0) menu.code.lnb += ("<li class='dep' data-dropdown='{\"effect\" : \"slide\"}'>"+(_tcode?_tcode:"")+"<ul class='nav-sub' data-act='cont'><li class='dep-2'>"+_code.join("</li><li>")+"</li></ul></li>");
              else menu.code.lnb += '<li class="dep">'+_tcode+'</li>';
            }else{
              _code="";
              if(nodelower.match(/^(a|button)/)) _code = _clone.html('').append($this.clone().removeAttr("data-act class").attr("class","dep-in").find("button,a").remove().end()).html();
              else _code = _clone.html('').append($this.children("a:first-child, button:first-child").clone().removeAttr("data-act").attr("class","dep-in").find("button,a").remove().end()).html();
              if(_code!="") menu.code.lnb += '<li class="dep" data-addtitle="this">'+_code+'</li>';
            }
          });
          if(menu.code.lnb!="") menu.$lnbnav.append(menu.code.lnb);
        },
        init : function(){
          var _layout = _page.layout;
          _layout.$header.addClass("close-all");
          this.$allbtn = _layout.$header.find(".gnb-all-btn");
          this.$allnav = _layout.$header.find(".gnb-all-nav");
          this.$allgroup = this.$allnav.find("> .group");
          this.$gnb = _layout.$header.find(".gnb-nav");
          if(this.$gnb.length!=0) this.gnbSet(this.$allgroup.children("[data-menu='main']").clone());
          else this.$gnb = null;
          this.$lnb = _layout.$container.find(".lnb");
          if(this.$lnb.length!=0){
            var branchname = _layout.$header.attr("class").match(/\b(cdi|ig|april|crx|cms|crk)\b/);
            if(branchname) this.$lnb.addClass(branchname[0]);
            _layout.$header.addClass("is-lnb");
            this.$lnbnav = this.$lnb.find(".nav");
            this.lnbSet(this.$allgroup);
          }else{
            this.$lnb = null;
            _layout.$header.addClass("not-lnb");
          }
          var sctop = 0;
          this.$allbtn.on("click.layout", function(e){ _layout.$header.toggleClass("opend-all close-all");
            /* .promise().done(function(){
              sctop = Math.max(sctop, document.body.scrollTop, document.documentElement.scrollTop);
              if(_layout.$header.is(".opend-all")) bodyschide.kill(sctop), loopfocus.set(_layout.menu.$allnav, _layout.menu.$allbtn);
              else bodyschide.set(sctop), loopfocus.kill(_layout.menu.$allnav, _layout.menu.$allbtn);
            }); */
            e.preventDefault();
          });
        }
      },
      edusrc : {
        btn : "button[data-edusrc], a[data-edusrc]", $btn : null, openclass : "opend-edu",
        init : function($wrap){
          if($wrap.length==0) return;
          var _ = this, _$eduwrap = $jq(".header .edu-select"), _$edubtn;
          _.$btn = $jq(_.btn);
          if(_.$btn.length==0) return _.$btn = null;
          _.$btn.each(function(){
            var el = document.getElementById(this.getAttribute("data-edusrc"));
            if(el) $jq.$jq(el).on("click.matchforradio", function(){ _.$btn.removeClass("checked").filter("[data-edusrc="+this.id+"]").last().addClass("checked"); });
          });

          var myDep = $jq('.brand-select .item button');
          var myDepBox = $jq('.brand-select-depth');
          myDep.each(function(){
            $jq(this).bind('click',function(e){
              var winw = $jq(window).width();
              if (winw > 767){
                if (!$jq(this).parent().is('.active')){              
                  var depNum = $jq(this).attr('data-dep');
                  var myLeft = $jq(this).parent().position().left + 10;
                  $jq(this).parent().siblings().removeClass('active');
                  $jq(this).parent().addClass('active');
                  _page.layout.$header.removeClass(_.openclass);
                  _.$btn.removeClass("checked");
                  _$edubtn = null;
                  myDepBox.css('left',myLeft);
                  myDepBox.fadeIn(300);
                  myDepBox.children('ul').removeAttr('style','');
                  myDepBox.find('.'+depNum+'').css('display','block');
                }
              } else {
                _.$btn.click();
              }
            });
          });

          $jq(document).mouseup(function(e){
            if (!_$eduwrap.is(e.target) && _$eduwrap.has(e.target).length === 0){
                _page.layout.$header.removeClass(_.openclass);
                _.$btn.removeClass("checked");
                _$edubtn = null;
            }

            if (!_$eduwrap.is(e.target) && _$eduwrap.has(e.target).length === 0){
              if (!myDepBox.is(e.target) && myDepBox.has(e.target).length === 0){
                $jq('.brand-select .item').removeClass('active');
                myDepBox.removeAttr('style','');
                myDepBox.children('ul').removeAttr('style','');
              }
            }
          });

          $jq(window).resize(function(e){
             _page.layout.$header.removeClass(_.openclass);
              _.$btn.removeClass("checked");
              _$edubtn = null;
              $jq('.brand-select .item').removeClass('active');
              myDepBox.removeAttr('style','');
              myDepBox.children('ul').removeAttr('style','');
          });


          _.$btn.on("click.edusearch", function(e){
            var elid = this.getAttribute("data-edusrc"), el = document.getElementById(elid);
            if(_$edubtn) loopfocus.kill(_$eduwrap, _$edubtn);
            if(el.checked && _page.layout.$header.is("."+_.openclass)){
              _page.layout.$header.removeClass(_.openclass);
              _.$btn.removeClass("checked");
              _$edubtn = null;
            }else{
              el.checked = true;
              $jq.$jq(el).trigger("click.matchforradio");
              $wrap.find("option").prop("selected", false).parent().trigger("change.matchfor").trigger("change.placeholder").end().end().find(".list button, .list a").removeClass("selected");
              _page.layout.$header.addClass(_.openclass);
               _$edubtn = $jq.$jq(this);
              loopfocus.set(_$eduwrap, $jq.$jq(this));
              var myparLeft = _$edubtn.parent().parent().parent().position().left +  _$edubtn.parent().parent().width() + 8;
              //_$eduwrap.css('left',myparLeft);
            }
            e.preventDefault();
          });

          $wrap.on("click.educlose", ".close", function(){
            document.getElementById(_.$btn.first().data("edusrc")).checked = true; _page.layout.$header.removeClass(_.openclass);
            if(_$edubtn) loopfocus.kill(_$eduwrap, _$edubtn);
            _$edubtn = null;
          });
        }
      },
      popup : {
        resize : function($wrap){
          if(!$wrap.length || window.parent.length) return false;
          var size = {
            doc : {w : $wrap.first().width(), h : $wrap.first().height()},
            max : {w : Math.min(screen.width, document.body.offsetWidth), h : Math.min(screen.height, document.body.offsetHeight)}
          };
          window.resizeBy(size.doc.w-size.max.w, size.doc.h-size.max.h);
        }
      },
      init : function(){
        var _ = _page;
        this.$header = $jq(".header");
        this.$footer = $jq(".footer");
        if(this.$footer.length==0) this.$footer = null;
        this.$quickfix = $jq(".quick-floating, .matching-institute");
        if(this.$quickfix.length==0) this.$quickfix = null;
        this.$container = $jq(".container,#container").first();
        if(this.$header.length>0){
          _page.scrollstate.ishead = true;
          this.menu.init();
          this.edusrc.init($jq(".edu-select"));
        }
        setTimeout(function(){ _.layout.popup.resize($jq("div[data-resizewrap]")); }, 200);
      }
    },
    init : function(){
      var _ = this;
      _.wintitle = document.title;
      _.layout.init();
      _.reInit();
    }
  };

  $jq(document).ready(function(){
    _page.$win = $jq(window);
    _page.$html= $jq("html");
    _page.$body = $jq("body");
    _page.init();    
  });

  //public
  ui.reInit = _page.reInit;
  ui.docTitle = _page.docTitle;
  /* 케이스별 영역로 보이거나 숨겨질때 사용. */
  ui.checkedToggle = function(_this, v){
    var $wrap = v.closest ? $jq(_this).closest(v.closest) : $jq("body"), view, hide, _temp;
    if(_this.type&&_this.type=="checkbox" && !_this.checked) _temp = v.view, v.view = v.hide, v.hide = _temp; //체크박스일 경우 체크해제이면 반대로 작동.
    if(v&&v.view){
      view = (typeof v.view === "string") ? [v.view] : v.view;
      $wrap.find('[data-chkarea="'+view.join('"], [data-chkarea="')+'"]').show();
    }
    if(v&&v.hide){
      hide = (typeof v.hide === "string") ? [v.hide] : v.hide;
      $wrap.find('[data-chkarea="'+hide.join('"], [data-chkarea="')+'"]').hide();
    }
  };
  ui.sort = function(_this, v){
    var $this = $jq.$jq(_this);
    v.cname = v.cname || "sort-desc", v.desc = v.desc || "내림차순", v.asc = v.asc || "오름차순";
    $this.toggleClass(v.cname);
    if(!$this.is(".active")) $this.addClass("active");
    if($this.is("."+v.cname)) _this.innerHTML = _this.innerHTML.replace(v.asc, v.desc);
    else _this.innerHTML = _this.innerHTML.replace(v.desc, v.asc);
  };

})(this, this.ui = this.ui || {});

$jq(function(){
  if ($jq('.vis-new-main').length > 0){
    $jqslickElement = $jq('.vis-new-main');
		$jqslickElement.slick({
			infinite: true,
			autoplay: true,
			autoplaySpeed: 7000,
			fade: true,
			slidesToShow: 1,
			speed: 300,
			pauseOnHover:false,
			pauseOnFocus:false, 
			arrows: true,
			dots: false
		});
  }
});