=== [b-sharpe-converter] shortcode ===
Contributors: bsharpe
Tags: finance, currency, forex, exchange, money
Requires at least: 5.0
Tested up to: 5.8
Stable tag: 5.1.0
License: GPL-3.0+
License URI: http://www.gnu.org/licenses/gpl-3.0.txt

Easily insert b-sharpe's currency converter on your pages with a simple shortcode.

== Description ==

Displaying b-sharpe's currency converter is now as easy as typing `[b-sharpe-converter]`!

Our currency converter uses real-time quotes from the market to provide you with an accurate estimation of the advantage you can get by exchanging your currencies with us (instead of a traditional bank).

== Installation ==

1. Upload this plugin folder to the `/wp-content/plugins/` directory
2. Activate the plugin through "Plugins" WordPress menu.
3. Use the `[b-sharpe-converter]` shortcode to display b-sharpe's converter (see available parameters in the FAQ section).

== Frequently Asked Questions ==

= Prerequisites =

**You need WordPress 5.0 at least to use this plugin.**

= What parameters does the shortcode accept? =

* `mode`: Either `individual` or `company`, depending on your client's profile (defaults to `individual`).
* `sold_currency`: Default sold currency selected at page load (defaults to `CHF`).
* `bought_currency`: Default bought currency selected at page load (defaults to `EUR`).
* `amount`: Default sold amount at page load (defaults to `10 000`).

== Screenshots ==

1. Converter's main screen.
2. Detailed comparison to a traditional bank.

== Changelog ==

= 5.1.0 =
* Added: link to rate explanation in rate tooltip

= 5.0.10 =
* Fixed: conversion update issue on mobile devices
* Fixed: display the information icon properly on mobile devices
* Fixed: number parsing issue in DE and IT
* Fixed: number formatting issue that caused user input to behave oddly

= 5.0.7 =
* Changed: format user input for more readability
* Changed: connect to most recent API routes
* Fixed: rare issue that caused incorrect results to be displayed

= 5.0.6 =
* Changed: use new currency flags

= 5.0.5 =
* Fixed: allow displaying multiple converters on the same page

= 5.0.3 =
* Fixed: allow displaying multiple converters on the same page

= 5.0.2 =
* Initial public release!
