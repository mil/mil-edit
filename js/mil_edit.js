var mil_edit = (function() {
  var root = "#editor";
  var selector = root + " #list";
  var raw = false; // Raw mode enabled
  var kb = false;
  var content  = "";

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

  function keybindings() {
    if (kb) {
      $("#keys").animate({ 'width': 'auto' }, { duration: 150 }).removeClass("enabled"); 
      $(root + " #keybindings").animate({ opacity: 0 }, {
        complete : function() { $(root + " #keybindings").removeClass("visible"); }
      });
      kb = false;
    } else {
      $("#keys").animate({ 'width': '215px' }, { duration: 150 }).addClass('enabled');
      $(root + " #keybindings").addClass("visible").animate(
        { opacity: 1.0 }, { duration: 600, easing: 'ease-in' }
      );
      kb = true;
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
    focus.set($(selector + " li").last());
    insert_below();
    return true;
  }

  /* Dump */
  function dump_markdown(tabSize) {
    tabSize = (tabSize == null) ? 2 : tabSize;
    var root = $(selector).children().first();

    var ret = "";
    _.each($(selector + " li"), function (l) {
      if ($(l).attr("id") == "active") {
        $(l).html(markdown.toHTML($("#active textarea").val()));
      }
      var level = $(l).parents("ul").size() -1;
      if ($(l).children("ul").size() == 0) {
        var pre = "";
        _.times(level * tabSize, function () { pre = pre + " "; });
        pre += (level % 2 === 0) ?  "- " : "* ";
        var text = $(l).html();
        ret += pre + toMarkdown(text) + "\n";
      }
    });
    return ret;
  };

  /* ==========================
  * Focus Object (tracks focused line)
  * =========================== */
  var focus = new Object();
  focus.position_cursor =  function(position) {
    var field = $("#active textarea")[0];
    if (field.createTextRange) {
      var range = field.createTextRange();
      range.move('character', position);
      range.select();
    } else {
      field.focus();
      if (field.selectionStart != undefined) {
        field.setSelectionRange(position, position);
      }
    }
  }

  focus.position_cursor_delta = function(delta) {
    focus.position_cursor(
      $("#active textarea")[0].selectionStart + delta
    );
  }

  focus.adjust_rows = function() {
    var f = $("#active textarea");
    f.css("overflow", "hidden").height("18px");
    f.height(f[0].scrollHeight + "px");
  }

  focus.set = function(selector) {  
    if ($("#active").size() != 0) {
      var content = $("#active").children("textarea").val();
      if (content != "") { 
        $("#active").html($(markdown.toHTML(content)).html()); 
        $("#active").removeAttr("id");
      } else {
        $("#active").remove();
      }
    }
    selector.attr("id", "active"); 
    var content = toMarkdown($("#active").html())
    $("#active").html($("<textarea type='text'>"));
    $("#active textarea").attr("rows", "1");
    $("#active textarea").val(content);
    focus.browser_focus_reset();
  };

  focus.browser_focus_reset = function() {
    focus.position_cursor(10000);
    focus.adjust_rows();
    $("#active textarea")[0].focus();
  }

  focus.set_delta = function(delta) {
    if (raw) { return; }
    var nextItem = directional_find("li", $("#active"), delta);
    if (!nextItem || !nextItem.is("li")) { 
      if ($("li").size() == 1) { return; }
      if ($("#active").prev().size() == 0 || $("#active").is("div")) {
        nextItem = $(selector).children().children().last();
        if ($(nextItem).is("div")) { return; }

        while(is_editable(nextItem.children().children().last())) { 
          nextItem = nextItem.children().children().last(); 
        }
      } else {
        nextItem = $(selector).children().children("li").first();
      }
    }
    if (!$(nextItem).is("li") && !$(nextItem).is("ul")) { return; }
    focus.set(nextItem);
  };

  focus.shift = function(delta) {
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

    focus.browser_focus_reset();
  };

  focus.indent = function() {
    if (raw) { return; }
    var text = $("#active").text();
    /* Ensure not at start of list */
    if ($("#active").prev().size() == 0) { return; }
    $("#active").wrap("ul").parent().wrap("li");

    clean_tree();
    $("#active textarea")[0].focus();
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
    $("#active textarea")[0].focus();
  }

  function directional_find(tag, origin, direction) {
    var c = origin; 
    var s = (direction == 1) ? c.next().size() : c.prev().size();

    // Search up the tree until we can go next/prev
    if (s == 0) { 
      do {
        c = c.parent();
        s = direction == 1 ? c.next().size() : c.prev().size();
      } while (s == 0);
    }

    // If were at the top, give up the first li
    if (c.is("div")) { return c.children().children().first(); }
    if (!c.is("li") && !c.is("ul")) { return false; }

    // Let us
    c = direction == 1 ? c.next() : c.prev();
    while (c.children(tag).size() != 0 ) {
      c = (direction == 1) ? c.children(tag).first() : c.children(tag).last();
    }

    while (c.children().size() > 0) {
      if (is_editable(c)) { return c; }
      c = (direction == 1) ? c.children().first(tag) : c.children().last(tag);
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


  function new_brother() { $("<li>").insertAfter("#active"); }
  function delete_above() { focus.set_delta(-1); clean_tree(); }
  function insert_below() { new_brother(); focus.set($("#active").next()); }
  /* Find the next insertable node to focus
  * in previous(0)/next(1) directions 
  */

  function insert(c) { 
    var old = $("#active textarea").val();
    var cursor = $("#active textarea")[0].selectionStart;

    $("#active textarea").val(insert_at(old, cursor, c));
    focus.position_cursor_delta(c.length);
  }


  /* ===================
  * Set Mode and Clear
  * ===================== */
  function mode() {
    if (!raw) {
      var timeout = 0;
      if (kb) { timeout = 300; keybindings(); }
      setTimeout(function() {
        var markdown = dump_markdown();
        $(selector).children().first().replaceWith("<textarea id='raw'>");
        $(selector).children().first().val(markdown);
        $("#buttons").css('display', 'none');
        $("#mode").text("Editor Mode");
      }, timeout);
      raw = true;
    } else if (raw) {
      raw = false;
      $("#mode").text("Markdown Mode");
      $("#buttons").css('display', 'block');
      var mark = $(selector).children().first().val();
      load_markdown(mark);
    }
  }

  function clear() {
    if (raw) { 
      $(selector).children().first().val(""); 
    } else {
      $(selector).html($("<ul>").append("<li>"));
      focus.set($(selector + " li").first());
    }
  }

  /* ===================
  * In Text Markdown Insertion
  * ===================== */
  function surround_selection(prepend, append) {
    var field = $("#active textarea")[0];
    var emptySelection = field.selectionStart == field.selectionEnd ? true : false;

    var end = field.selectionEnd + append.length + prepend.length;
    var newText = $(field).val();
    newText = insert_at(newText, field.selectionStart, prepend);
    newText = insert_at(newText, field.selectionEnd + prepend.length, append);
    $(field).val(newText);
    focus.position_cursor(emptySelection ? end - append.length : end);
  }

  function bold() {  
    surround_selection("**", "**");
  }
  function italic() { 
    surround_selection("_", "_"); 
  }
  function link() { 
    var field = $("#active textarea")[0];
    var selected = field.selectionStart != field.selectionEnd ? true : false;
    surround_selection("[", "]()");
    if (selected) { focus.position_cursor_delta(-1); }
  }


  /* ===================
  * Event Handlers Object
  * ===================== */
  var event_handlers = new Object();

  event_handlers.backspace = function(k) {
    if (k.shiftKey) { 
      if ($("#active").children("textarea").val() == "") {
        delete_above(); return false;
      } else { return true; }
    }
    if ($("#active").children("textarea").val() == "" && $(selector).children().children().size() > 1) { 
      if ($("#active").parent().parent().is("div")) {
        delete_above(); 
      } else {
        focus.undent();
      }
      return false; 
    }

    return true; // Default backspace
  }

  event_handlers.key_down = function(k) {
    if (k.keyCode == 81 && k.ctrlKey) { mode(); return; } 
    if (raw) { return; }

    // Backspace
    if (k.keyCode == 46 || k.keyCode == 8) { 
      return event_handlers.backspace(k); 
    }

    // Shifting with ><
    if (k.shiftKey) {
      if (k.keyCode == 190) { focus.indent(); return false; }
      if (k.keyCode == 188) { focus.undent(); return false; }
    }

    // Tab
    if (k.keyCode == 9) {
      k.shiftKey ? focus.set_delta(-1) : focus.set_delta(1); return false; 
    }

    // Arrows up and down
    if (k.keyCode == 38) {
      k.shiftKey ?  focus.shift(-1) : focus.set_delta(-1); return false;
    }
    if (k.keyCode == 40) {
      k.shiftKey ?  focus.shift(1) : focus.set_delta(1); return false;
    }

    // Enter
    if (k.keyCode == 13) {
      if (k.shiftKey) { focus.indent(); } 
      if ($("#active textarea").val() == "") { focus.indent(); }
      insert_below(); 
      clean_tree();
      return false;
    }

    // Undent and Indent with arrow keys
    if (k.keyCode == 37 && k.shiftKey) { focus.undent(); }
    if (k.keyCode == 39 && k.shiftKey) { focus.indent(); }

    // VIM-Esque
    if (k.keyCode == 74 && k.shiftKey & k.ctrlKey) { focus.set_delta(1); return false; }
    if (k.keyCode == 75 && k.shiftKey & k.ctrlKey) { focus.set_delta(-1); return false;}
    if (k.keyCode == 72 && k.shiftKey & k.ctrlKey) { focus.undent(); return false;}
    if (k.keyCode == 76 && k.shiftKey & k.ctrlKey) { focus.indent(); return false;}


    console.log(k);

    // Control combos
    if (k.ctrlKey) {
      switch (k.keyCode) {
      case 73: italic(); return;
      case 66: bold(); return;
      case 89: link(); return;
      case 88: clear(); return;
      }
    }

    return true;
  };

  event_handlers.mouse_down = function(e) {
    var t = $(e.target);
    if ($(t).is("a") || $(t).is("textarea")) { return true; }

    if (t.is("strong") || t.is("em")) { 
      t = t.parent();
    }  else {
      while (t.children().size() != 0) {
        if (is_editable(t)) { break; }
        t = t.children().first();
      }
    }
    focus.set(t); clean_tree();
    return false;
  };


  /* ===================
  * It's Alive
  * ===================== */
  function load_template() {
    console.log(editor_template);
    $(root).html(editor_template);
  }
  function setup_bindings() {
    $(document).on('keydown', event_handlers.key_down);
    $(document).on('keyup', function() { clean_tree(); focus.adjust_rows()});
    $(document).on('mousedown', "li", event_handlers.mouse_down);
  }

  function initialize(r) {
    if (r != undefined) { root = r; }
    load_template();
    setup_bindings();
    $(selector).html($("<ul>").append("<li>"));
    focus.set($(selector + " li").first());
  }


  /* =====================================
  * Public Functions 
  * ====================================== */
  return {
    mode: mode,

    // md/cursor inserts
    bold : bold,
    italic : italic,
    link : link,

    // line manipulation
    indent : focus.indent,
    undent : focus.undent,
    focus  : focus.set_delta,
    shift  : focus.shift,

    keybindings : keybindings,


    dump_markdown : dump_markdown,
    load_markdown : load_markdown,

    initialize : initialize,
    clear: clear 
  }
}());
