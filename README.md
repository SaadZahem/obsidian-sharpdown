# Obsidian Sharpdown Plugin

**Still under development**.
Extends and enhances the markdown syntax.

## Features

1. Underline text using double underscores.

## Examples

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
*__italic underlined__*  // doesn't work, see below

__**underlined bold**__
**__bold underlined__**
```

## Mechanism

In reading mode, the plugin lets obsidian process the markdown
then it adds `underline` css class to every `<strong>` element created by `__`.
The css class changes text decoration to underline and inherits the font weight from the parent.
For this to work, it **counts** the occurences of `**` and `__`
and decides whether each is opening or closing marks
based on whether the preceding character is a whitespace.
If the closing mark is preceded by whitespace,
the plugin overcounts and adds the `underline` css class to the next `<strong>` element.

```
__crispy __ and **fresh**
```

## Limitations

Note that this plugin doesn't support the following:

1. Underlining text in review mode
2. The syntax `*__foo__*` will create bold inside italic.
   Use triple underscores for italic underline or triple asterisks for italic bold.
3. The example `new __ crispy __ and **fresh**` will underline both words.
4. There's no dedicated hotkey for inserting double underscores yet.

## About

Developed by [Saad Zahem](https://github.com/SaadZahem).

Contributions are welcome, [GitHub repo](https://github.com/SaadZahem/obsidian-sharpdown)
