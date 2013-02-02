var template_buttons = ''.concat(
  '<div id="buttons">',

  '<div class="left">',
  '<a id="undent" title="< or Ctrl-&larr;" onclick="mil_edit.undent()"></a>',
  '<a id="indent" title="> or Ctrl-&rarr;" onclick="mil_edit.indent()"></a>',

  '<a id="bold" title="Ctrl-B" onclick="mil_edit.bold()"></a>',
  '<a id="italic" title="Ctrl-I" onclick="mil_edit.italic()"></a>',
  '</div>',


  '<div class="right">',
  '<a id="keys" onclick="mil_edit.keybindings()">Key Controls</a>',
  '</div>',

  '</div>'
);

var template_keybindings = ''.concat(
  '<div id="keybindings">',

  '<div class="basic">',

  '<h2>Styling Text</h2>',
  '**<b>Two Stars</b>** makes text <b>Bold</b><br/>',
  '_<i>Underscores</i>_ makes text <i>Italic</i>',

  '<h2>Changing Indentation</h2>',
  'Indentation: <span class="key">&gt;</span> or <span class="key">Shift</span> <span class="key">&rarr;</span><br/>',
  'Undentation: <span class="key">&lt;</span> or <span class="key">Shift</span> <span class="key">&larr;</span>',

  '</div>',
 
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
