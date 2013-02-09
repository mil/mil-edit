var template_buttons = ''.concat(
  '<div id="buttons">',

  '<a id="undent" title="Press < or Ctrl-&larr; to Undent" onclick="mil_edit.undent()"></a>',
  '<a id="indent" title="Press > or Ctrl-&rarr; to Indent" onclick="mil_edit.indent()"></a>',
  '<span class="separator"></span>',
  '<a id="bold" title="Press Ctrl-B to **Bold** Text" onclick="mil_edit.bold()"></a>',
  '<a id="italic" title="Press Ctrl-I to _Italicize_ Text" onclick="mil_edit.italic()"></a>',

  '<a id="keys" onclick="mil_edit.keybindings()"><span>Key Controls</span></a>',
  '</div>'
);

var template_keybindings = ''.concat(
  '<div id="keybindings">',

  '<div class="basic">',

  '<h2>Styling Text</h2>',
  '**<b>Two Stars</b>** makes text <b>Bold</b><br/>',
  '_<i>Underscores</i>_ makes text <i>Italic</i><br/>',

  '<h2>Changing Indentation</h2>',
  'Indentation: <span class="key">&gt;</span> or <span class="key">Shift</span> <span class="key">&rarr;</span><br/>',
  'Undentation: <span class="key">&lt;</span> or <span class="key">Shift</span> <span class="key">&larr;</span>',

  '<h2>Moving Around</h2>',
  '<span class="key">&uarr;</span> and <span class="key">&darr;</span> move between lines<br/>',
  '<span class="key">Shift</span> <span class="key">&uarr;</span> <span class="key">&darr;</span> shifts the line',
  '</div>',
  '<a id="collapse" title="Hide this Help Pane" onclick="mil_edit.keybindings()">Collapse &rarr;</a>',

  '</div>'
);

var template_list = ''.concat(
  '<div id="area">',
  '<div id="list"></div>',
  template_keybindings,
  '</div>'
);

var editor_template = ''.concat(
  template_buttons,
  template_list
);
