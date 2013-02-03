Zepto(function($){
  var defaultMarkdown = "- What's this?\n\
  * A **Simple** Markdown List Editor\n\
- What about features?\n\
  * Button and Key Controls\n\
  * **Bold**, _Italics_, and Links\n\
  * Exports to **Markdown**\n\
- Hacker?\n\
  * Source on [Github](http://github.com/mil/mil-edit)\n\
  * VIM-Esque Keybindings\n\
  * Released [CC0](http://creativecommons.org/publicdomain/zero/1.0) - Public Domain";
  mil_edit.initialize();
  mil_edit.load_markdown(defaultMarkdown);
});
