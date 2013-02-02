var template_buttons = ''.concat(
  '<div id="buttons">',

  '<div class="left">',
  '<a id="undent" title="< or Ctrl-&larr;" onclick="mil_edit.undent()"></a>',
  '<a id="indent" title="> or Ctrl-&rarr;" onclick="mil_edit.indent()"></a>',
  '</div>',

  '<div class="right">',
  '<a id="italic" title="Ctrl-I" onclick="mil_edit.italic()"></a>',
  '<a id="bold" title="Ctrl-B" onclick="mil_edit.bold()"></a>',
  '<a id="link" title="Ctrl-Y" onclick="mil_edit.link()"></a>',
  '</div>',

  '</div>'
);

var template_keybindings = ''.concat(
  '<div id="keybindings">','</div>'
);

var template_list = '<div id="list"></div>';

var editor_template = ''.concat(
  template_buttons,
  template_keybindings,
  template_list
);
