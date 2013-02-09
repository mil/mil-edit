mil edit
========
[A Live Demo](http://userbound.com/ui/mil-edit)

mil edit is a simple markdown list editor I've been working on. I wanted something different than the WYSIWYG & Dual-pane Markdown options. My main motive was that I only wanted to work with a *single* list.  This is the way I usually take notes and outline my ideas in Markdown.

This was developed and tested for Webkit exclusively. I think it works with Firefox too fine. Let me know if it works in your X rendering engine browser. I kind of doubt it'll work for IE.

All Keybindings
---------------
- **Navigation**
    * &larr; &uarr; &darr; &rarr;
    * Vim-Esque: [Ctrl] [Shift] J K
    * [Tab], [Shift] [Tab]
- **Indentation**
    * < >
    * [Shift] &larr; &rarr; 
    * Vim-Esque: [Ctrl] [Shift] H L
- **Shifting**
    * [Shift] &larr; &uarr; &darr; &rarr;
- **Quick Indent Insert**
    * [Enter] [Enter]
    * [Shift] [Enter]
- **Markdown Insertion Styling**
    * Bold: [Ctrl] B
    * Italic: [Ctrl] I
    * URL: [Ctrl] U
- **Clear**
    * [Ctrl] X
- **Switch Mode**
    * [Ctrl] Q

Loading A Markdown List
---------------------------------
`mil_edit.load_markdown(markdown-list-string)`

Please note, mil edit is only designed to work with markdown lists and no other features of markdown. Your `markdown-list-string` should be a new line delineated markdown list. See `start_on_load.js` for an example.

Exporting markdown
------------------
`mil_edit.dump_markdown(tab-size-num)`

tab-size-num will default to 2 if no preference is given.

Released under CC0
------------------
mil edit - a simple markdown list editor
Written in 2013 by mil - miles@userbound.com
To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

Contributing
------------
The usual fork-pull routine is encouraged. Feel free to hit me up on IRC if you wanna chat code, or philosophy. (irc.freenode.net - nick: mil).

Check out the HACKING file, if you be a hacker.

Credits
-------
mil edit was made possible due to several other projects. mil edit is CC0, but please respect the licenses of the following projects.
- [Zepto.js](http://zeptojs.com), divide by four, hence good
- [_.js](http://underscorejs.org), lettin us all be lazy
- [to-markdown](http://github.com/domchristie/to-markdown), the work was done
- [markdown-js](http://github.com/evilstreak/markdown-js), quite nutritious 
- [famfamfam](http://famfamfam.com/lab/icons/silk), damn fly
- [subtle](http://subtlepatterns.com), so ambient
