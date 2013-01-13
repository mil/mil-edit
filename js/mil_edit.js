var mil_edit = (function() {
  var selector = "#editor";
  var raw = false;
  var content  = "";
  var symbol = "|";

  /* ===================
  * Helper Functions
  * ===================== */
  function remove_at(str, pos) {
    return str.slice(0, pos) + str.slice(pos +1);
  }
  function insert_at(str, pos, cha) {
    return str.slice(0, pos) + cha + str.slice(pos)
  }

  function are_brothers(a, b) {
    if (_.contains(a.parent().children(), $(b)[0])) { return true; }
    return false;
  }
  function is_editable(c) {
    var firstChild = c.children().first();
    if (firstChild.is("strong") || firstChild.is("em") || firstChild.is("a")) {
      return true;
    } else {
      return false;
    }
  }


  /* =====================================================
  * Load and Dump Markdown
  * note: custom funcs used to perserve tree
  * see HACKERS file
  * ======================================================= */
  function load_markdown(markdownString) {
    if (typeof markdownString != "string") { return false; }

    // Looks for spaces of 2 or 4
    var lines = markdownString.split("\n");
    var root = $("<ul>"); 
    var current = root, spaces = 0;

    _.each(lines, function(line, index) {
      if (line == "") { return; }
      var matches = line.match(new RegExp("( +)?[-*] (.+)"));
      if (!matches) { return; }
      var leading = matches[1] ? matches[1].length : 0;
      var content = matches[2];

      if ((leading - 2) == spaces || (leading - 4) == spaces) {
        // Indent goes up one level
        var n = $("<li>").append("<ul>");
        current.append(n); 
        current = n.children();
      } else if ((leading + 2) == spaces ||  (leading + 4) == spaces) {
        // Indent goes down one level
        current = current.parent().parent();

      } else if (leading == spaces) {
        // Same level
      } else { return; }

      current.append("<li>" + content + "</li>");
      spaces = leading;
    });
    if ($(root).children().size() == 0) {
      load_markdown("- Invalid Raw Markdown\n  * mil edit only supports a single list");
      return;
    }

    $(selector).html(root);
    text_attributes(true);
    active.set($(selector + " li").last());
    insert_below();
    return true;
  }

  /* Dump */
  function dump_markdown(tabSize) {
    tabSize = (tabSize == null) ? 2 : tabSize;
    var root = $(selector).children().first();

    var ret = "";
    _.each($(selector + " li"), function (l) {
      var level = $(l).parents("ul").size() -1;
      if ($(l).children("ul").size() == 0) {
        var pre = "";
        _.times(level * tabSize, function () { pre = pre + " "; });
        pre += (level % 2 === 0) ?  "- " : "* ";
        var text = $(l).html().replace(symbol, "");
        ret += pre + toMarkdown(text) + "\n";
      }
    });
    return ret;
  };

  /* =================================
  * Cursor Object, set by Active line 
  * ================================== */
  var cursor = new Object();
  cursor.spawn = function() {
    if ($("#active").size() != 0) {
      $("#active").append(symbol);
    }
  };
  cursor.position = function(delta) {
    if (delta == 0) { return; }
    var positive = delta > 0 ? true : false;
    var content = $("#active").html()
    var regexp = new RegExp(positive ? 
      ("[" + symbol + " ](.)") : ("(.)[" + symbol + "]"));

    _.times(Math.abs(delta), function() {
      var c = content.match(regexp)[1];
      content = content.replace(regexp, positive ? c + symbol : symbol + c);
    });

    $("#active").html(content);
  };



  /* ==========================
  * Active Object (tracks line)
  * =========================== */
  var active = new Object();
  active.set = function(selector) {  
    if ($("#active").size() != 0) {
      var content = $("#active").html();
      content = (content.length == 1) ?  "" : content.replace(symbol, "");
      $("#active").html(content);

      if (content != "") { $("#active").html($(markdown.toHTML(content)).html()); }
      $("#active").removeAttr("id");
    }
    selector.attr("id", "active"); 
    var content = $("#active").html();
    $("#active").html(toMarkdown(content));

    cursor.spawn();
  };

  active.focus = function(delta) {
    if (raw) { return; }
    var nextItem = directional_find("li", $("#active"), delta == -1 ? -1 : 1);
    if (!nextItem || !nextItem.is("li")) { 
      if ($("li").size() == 1) { return; }
      if ($("#active").prev().size() == 0 || $("#active").is("div")) {
        nextItem = $(selector).children().children().last();
        if ($(nextItem).is("div")) { return; }
        while(!is_editable(nextItem)) { nextItem = nextItem.children().children().last(); }
      } else {
        nextItem = $(selector).children().children("li").first();
      }
    }
    if (!$(nextItem).is("li") && !$(nextItem).is("ul")) { return; }
    active.set(nextItem);
  };

  active.shift = function(delta) {
    if (raw) { return; }
    var nextItem = directional_find("li", $("#active"), delta == -1 ? -1 : 1);
    if (!nextItem.is("li")) { return false; }

    var bros = are_brothers($("#active"), $(nextItem)); 
    if (delta == -1 && bros || delta == 1 && !bros) {
      $("#active").insertBefore($(nextItem));
    } else {
      $("#active").insertAfter($(nextItem));
    }

    clean_tree();
  };

  focus.indent = function() {
    if (raw) { return; }
    var text = $("#active").text();
    /* Ensure not at start of list */
    if ($("#active").prev().size() == 0) { return; }
    $("#active").wrap("ul").parent().wrap("li");
    clean_tree();
  }

  focus.undent = function() {
    if (raw) { return; }
    if ($("#active").parent().parent().is("div")) { return false; }

    var halfA = $("<ul>"); var halfB = $("<ul>");

    var index = 0;
    _.each($("#active").parent().children(), function(element) {
      if (index < $("#active").index()) {
        $(element).clone().appendTo(halfA);
      } else if (index > $("#active").index()) {
        $(element).clone().appendTo(halfB);
      }
      index++;
    });

    var oldParent = $("#active").parent().parent();
    oldParent.prev().after($("<li>").append(halfA));
    _.each($("#active").siblings(), function(el) { $(el).remove(); });
    $("#active").unwrap().unwrap();
    $("#active").after($("<li>").append(halfB));

    clean_tree();
  }

  function directional_find(tag, origin, direction) {
    var c = origin; 
    var s = direction == 1 ? c.next().size() : c.prev().size();

    if (s == 0) { while (s == 0) {
      c = c.parent();
      s = direction == 1 ? c.next().size() : c.prev().size();
    } }

    c = direction == 1 ? c.next() : c.prev();
    while (c.children(tag).size() != 0 ) {
      c = direction == 1 ? c.children(tag).first() : c.children(tag).prev();
    }

    while (c.children().size() > 0) {
      if (is_editable(c)) { return c; }
      c = (direction == -1) ? c.children().last(tag) : c.children().first(tag);
    }
    return $(c).is(tag) ? c : false;
  }



  function delete_empties() {
    /* Remove empty li's and li ul's */
    _.each(_.union($(selector + " li"), $(selector + " li ul")), function(item) {
      if ($(item).html() == "") { $(item).remove(); } 
    });
  }

  function clean_tree() {  
    delete_empties();

    /* Combine ul's un-necessarily "seperate" */
    while ($(selector + " ul").parent().next().children("ul").size() > 0) {
      _.each($(selector + " ul"), function(item) {
        if ($(item).parent().next().children("ul").size() > 0) {
          $(item).append($(item).parent().next().children("ul").children());
          $(item).parent().next().children("ul").parent().remove();
        }
      });
    }

    delete_empties();

    if ($("#active").parent().parent().siblings().size() == 0) {
      focus.undent();
    }
  }

  function text_attributes(on) {
    _.each($(selector + " li"), function(a) {
      if ($(a).children("ul").size() != 0) { return; }
      var content = $(a).html();
      if (on) {
        $(a).html($(markdown.toHTML(content)).html());
      } else if (!($(a).attr('id') == "active")) {
        $(a).html(toMarkdown(content));
      } 
    });
  }


  function new_brother() { $("<li></li>").insertAfter("#active"); }
  function delete_above() { active.focus(-1); clean_tree(); }
  function insert_below() { new_brother(); active.set($("#active").next()); }
  /* Find the next insertable node to focus
  * in previous(0)/next(1) directions 
  */

  function insert(c) { 
    var old = $("#active").html();
    $("#active").html(old.replace(symbol, c + symbol));
  }


  /* ===================
  * Set Mode and Clear
  * ===================== */
  function mode() {
    if (!raw) {
      var markdown = dump_markdown();
      $(selector).children().first().replaceWith("<textarea>");
      $(selector).children().first().val(markdown);
      $("#buttons").css('display', 'none');
      $("#functions").css('display', 'none');
      $("#mode").text("Edit Mode");
      raw = true;
    } else if (raw) {
      raw = false;
      $("#mode").text("Raw Markdown");
      $("#buttons").css('display', 'block');
      $("#functions").css('display', 'block');
      var mark = $(selector).children().first().val();
      load_markdown(mark);
    }
  }

  function clear() {
    if (raw) { 
      $(selector).children().first().val(""); 
    } else {
      $(selector).html($("<ul>").append("<li>"));
      active.set($(selector + " li").first());
    }
  }

  /* ===================
  * In Text Markdown Insertion
  * ===================== */

  function bold() { insert("****"); cursor.position(-2); }
  function italic() { insert("__"); cursor.position(-1); }
  function link() { insert("[]()"); cursor.position(-3); }


  /* ===================
  * Event Handlers Object
  * ===================== */
  var event_handlers = new Object();

  event_handlers.backspace = function(k) {
    if (k.shiftKey) { 
      if ($("#active").text() == symbol) {
        delete_above();
      } else {
        $("#active").text(symbol); 
      }
      return; 
    }
    if ($("#active").text() == symbol && $(selector).children().children().size() > 1) { 
      if ($("#active").parent().parent().is("div")) {
        delete_above(); 
      } else {
        focus.undent();
      }
    return; }

    if ($("#active").html().indexOf(symbol) != 0) {
      var orig = $("#active").html();
      var mod = remove_at(orig, orig.indexOf(symbol) -1);
      $("#active").html(mod);
    }
  }

  event_handlers.handle_special = function(k) {
    var specialMap = { 
      219 : "[", 221 : "]", 222 : "'", 186 : ";", 191 : "/", 188: ",", 190: "."
    };
    var symbolMap = {
      49: "!", 50: "@", 51: "#", 52: "$", 53: "%", 54: "^", 55: "&", 56: "*", 
      57: "(", 48: ")", 189 : "_", 219: "{", 221: "}", 186: ":", 191: "?",
      222 : '"'
    };

    if (k.shiftKey && symbolMap[k.keyCode] != undefined) {
      insert(symbolMap[k.keyCode]); return true;
    } else if (specialMap[k.keyCode] != undefined) {
      insert(specialMap[k.keyCode]); return true;
    }
    return false;
  }

  event_handlers.handle_single_key = function(k) {
    /* Convert keycode to lowercase */
    var key = k.keyCode;
    if (($.inArray(key,_.range(65,91)) != -1) && !(k.shiftKey)) {
      key += 32;
    }

    if (event_handlers.handle_special(k)) { return; }

    var throughKeys = _.union(
      _.range(65,91), // Caps Alphabet
      _.range(97,123), // Lower Alphabet
      _.range(41,58),
      [ 32, 64, 219, 221 ]
    );

    if ($.inArray(k.keyCode, throughKeys) != -1) {
      insert(String.fromCharCode(key));
    }
  };

  event_handlers.key_down = function(k) {
    if (k.keyCode == 81 && k.ctrlKey) { mode(); return; } 
    if (raw) { return; }

    clean_tree();  

    // Backspace
    if (k.keyCode == 46 || k.keyCode == 8) { event_handlers.backspace(k); return; }

    // Shifting with ><
    if (k.shiftKey) {
      if (k.keyCode == 190) { focus.indent(); return; }
      if (k.keyCode == 188) { focus.undent(); return; }
    }

    // Tab
    if (k.keyCode == 9) {
      k.shiftKey ? active.focus(-1) : active.focus(1); return false; 
    }

    // Arrows up and down
    if (k.keyCode == 38) {
      k.shiftKey ?  active.shift(-1) : active.focus(-1); return false;
    }
    if (k.keyCode == 40) {
      k.shiftKey ?  active.shift(1) : active.focus(1); return false;
    }

    // Enter
    if (k.keyCode == 13) {
      insert_below(); 
      if (k.shiftKey) { focus.indent(); } 
      if ($("#active").prev().size() > 0 && $("#active").prev().html().length == 0) {
        focus.indent();
      }
      clean_tree();

      return;
    }

    // Space
    if (k.keyCode == 32) { event_handlers.handle_single_key(k); return false; }

    // Undent
    if (k.keyCode == 37) {
      k.shiftKey ? focus.undent() : cursor.position(-1);  return;
    }

    if (k.keyCode == 39) {
      k.shiftKey ? focus.indent() : cursor.position(1);  return;
    }

    // Control combos
    if (k.ctrlKey) {
      switch (k.keyCode) {
      case 73: italic(); return;
      case 66: bold(); return;
      case 88: clear(); return;
      case 89: link(); return;
      }
    }

    event_handlers.handle_single_key(k);
  };




  /* ===================
  * It's Alive
  * ===================== */
  function setup_bindings() {
    $(document).on('keydown', event_handlers.key_down);
    $(document).on('mousedown', "li", function (e) {
      if ($(e.target).is("a")) { return true; }
      var t = $(e.target);
      if (t.is("strong") || t.is("em")) { 
        t = t.parent(); 
      } else {
        while (t.children().size() != 0) {
          if (is_editable(t)) { break; }
          t = t.children().first();
        }
      }
      active.set(t); clean_tree();
    });
  }

  function initialize() {
    setup_bindings();
    $(selector).html($("<ul>").append("<li>"));
    active.set($(selector + " li").first());
  }


  /* =====================================
  * Public Functions 
  * ====================================== */
  return {
    /* Vars */
    mode: mode,

    bold : bold,
    italic : italic,
    link : link,

    indent : focus.indent,
    undent : focus.undent,
    focus: active.focus,
    shift: active.shift,

    dump_markdown : dump_markdown,
    load_markdown : load_markdown,


    /* For Submodules */
    initialize : initialize,
    clear: clear 
  }
}());
