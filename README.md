# Obsidian Enhanced Marker Plugin

This plugin modifies the behavior of double underscore to underline text
instead of making the text bold.

```
This word is __underlined__ and this word is **bold**.
Example __of *italic* and **bold text** inside underlined text__.

__test underlined__

__test 4 underlined words__

__test **bold** inside underline__

__test *italic* inside underline__

*test **bold** inside italic*

*test __underline__ inside italic*

**test __underline__ inside bold**

***italic and bold***
___italic and underlined___

__*underlined italic*__
*__italic underlined__*  // doesn't work

__**underlined bold**__
**__bold underlined__**  // doesn't work
```

Note that this plugin doesn't support the following:

1. Underlining text in review mode
2. underline inside italic or bold where the underscores are not preceded by whitespace character.
3. underline inside lists
