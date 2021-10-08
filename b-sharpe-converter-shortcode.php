<?php

/**
 * [b-sharpe-converter] shortcode
 *
 * Easily insert b-sharpe's currency converter on your pages with a simple shortcode.
 *
 * @link              https://www.b-sharpe.com
 * @since             5.0.0
 * @package           bsharpe_Converter_Shortcode
 *
 * @wordpress-plugin
 * Plugin Name:       [b-sharpe-converter] shortcode
 * Plugin URI:        https://www.b-sharpe.com
 * Description:       Easily insert b-sharpe's currency converter on your pages with a simple shortcode.
 * Version:           5.1.0
 * Requires at least: 5.0
 * Author:            b-sharpe SA
 * Text Domain:       b-sharpe-converter-shortcode
 * License:           GPL-3.0+
 * License URI:       http://www.gnu.org/licenses/gpl-3.0.txt
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

define('B_SHARPE_CONVERTER_SHORTCODE_VERSION', '5.1.0');

function bsharpe_converter_shortcode_register() {
    // Vendors
    wp_register_style('b-sharpe-converter-shortcode-select2-css', plugins_url('public/css/vendor/select2/select2.min.css', __FILE__), [], '4.0.13');
    wp_register_script('b-sharpe-converter-shortcode-cleave-js', plugins_url('public/js/vendor/cleave.js/cleave.min.js', __FILE__), [], '1.6.0');
    wp_register_script('b-sharpe-converter-shortcode-select2-js', plugins_url('public/js/vendor/select2/select2.min.js', __FILE__), ['jquery'], '4.0.13');
    wp_register_script('b-sharpe-converter-shortcode-popper-js', plugins_url('public/js/vendor/tippy/popper.min.js', __FILE__), [], '2.9.2');
    wp_register_script('b-sharpe-converter-shortcode-tippy-js', plugins_url('public/js/vendor/tippy/tippy.min.js', __FILE__), ['b-sharpe-converter-shortcode-popper-js'], '6.3.1');

    // Custom
    wp_register_style('b-sharpe-converter-shortcode-icons-css', plugins_url('public/css/icons.css', __FILE__), [], B_SHARPE_CONVERTER_SHORTCODE_VERSION);
    wp_register_style('b-sharpe-converter-shortcode-tippy-theme-css', plugins_url('public/css/tippy-theme.css', __FILE__), [], B_SHARPE_CONVERTER_SHORTCODE_VERSION);
    wp_register_style('b-sharpe-converter-shortcode-css', plugins_url('public/css/bsharpe-converter.css', __FILE__), ['b-sharpe-converter-shortcode-icons-css', 'b-sharpe-converter-shortcode-select2-css', 'b-sharpe-converter-shortcode-tippy-theme-css'], B_SHARPE_CONVERTER_SHORTCODE_VERSION);
    wp_register_script('b-sharpe-converter-shortcode-js', plugins_url('public/js/bsharpe-converter.js', __FILE__), ['wp-i18n', 'jquery', 'b-sharpe-converter-shortcode-cleave-js', 'b-sharpe-converter-shortcode-select2-js', 'b-sharpe-converter-shortcode-tippy-js'], B_SHARPE_CONVERTER_SHORTCODE_VERSION);
    wp_set_script_translations('b-sharpe-converter-shortcode-js', 'b-sharpe-converter-shortcode');
}
add_action('wp_enqueue_scripts', 'bsharpe_converter_shortcode_register');

function b_sharpe_converter_shortcode_init() {
    add_shortcode('b-sharpe-converter', 'bsharpe_converter_shortcode');
}
add_action('init', 'b_sharpe_converter_shortcode_init');

function bsharpe_converter_shortcode($atts) {
    if (is_single() || is_page()) {
        extract(shortcode_atts([
            'mode' => 'individual',
            'sold_currency' => 'CHF',
            'bought_currency' => 'EUR',
            'amount' => '10000',
        ], $atts));

        $data_company_attr = ($mode === 'company') ? 'data-company-mode' : '';
        $now = new DateTime('now');
        $unique_id = wp_unique_id();

        $markup = '<div id="b-sharpe-converter-' . esc_attr($unique_id) . '" class="b-sharpe-converter"' . esc_attr($data_company_attr) . '>
                     <div class="wrapper-form">
                       <div class="form-upper">
                         <div class="money-widget money-widget-sell">
                           <div class="money-input">
                             <label for="amount-sell-' . esc_attr($unique_id) . '" class="amount-label">' . esc_html__('I want to change...', 'b-sharpe-converter-shortcode') . '</label>
                             <input type="text" id="amount-sell-' . esc_attr($unique_id) . '" class="amount-input amount-sell" value="' . esc_attr($amount) . '">
                           </div>
                           <label for="currency-sell-' . esc_attr($unique_id) . '" class="text-assistive">' . esc_html__('Sold currency', 'b-sharpe-converter-shortcode') . '</label>
                           <select id="currency-sell-' . esc_attr($unique_id) . '" class="currency-select currency-sell" data-default="' . esc_attr($sold_currency) . '"></select>
                         </div>
                         <div class="money-widget money-widget-buy">
                           <div class="money-input">
                             <label for="amount-buy-' . esc_attr($unique_id) . '" class="amount-label">' . esc_html__('I will get:', 'b-sharpe-converter-shortcode') . '</label>
                             <input type="text" id="amount-buy-' . esc_attr($unique_id) . '" class="amount-input amount-buy">
                           </div>
                           <label for="currency-buy-' . esc_attr($unique_id) . '" class="text-assistive">' . esc_html__('Bought currency', 'b-sharpe-converter-shortcode') . '</label>
                           <select id="currency-buy-' . esc_attr($unique_id) . '" class="currency-select currency-buy" data-default="' . esc_attr($bought_currency) . '"></select>
                         </div>
                         <table class="deal-results">
                           <tbody>
                             <tr>
                               <td>' . (($mode === 'company') ? '' : '📊') . '</td>
                               <td>
                                 ' . esc_html__('b-sharpe rate:', 'b-sharpe-converter-shortcode') . '<br>
                                 <span class="b-sharpe-rate-timestamp"></span>
                               </td>
                               <td><span class="b-sharpe-rate" data-tooltip="' . esc_attr__('Exchange rate subject to variations and market conditions', 'b-sharpe-converter-shortcode') . '"></span></td>
                             </tr>
                             <tr>
                               <td>' . (($mode === 'company') ? '' : '✋') . '</td>
                               <td>' . esc_html__('Fees:', 'b-sharpe-converter-shortcode') . '</td>
                               <td class="b-sharpe-fees"></td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                       <div class="b-sharpe-savings">
                         <div>
                           ' . (($mode === 'company') ? '' : '💰') . ' ' . esc_html__('Savings:', 'b-sharpe-converter-shortcode') . '<br>
                           <button role="button" class="link comparison-toggler">' . esc_html__('compared to a bank', 'b-sharpe-converter-shortcode') . ' <i class="gg-info"></i></button>
                         </div>
                         <div class="b-sharpe-savings-amount"></div>
                       </div>
                     </div>
 
                     <div class="wrapper-comparison d-none">
                       <div class="close-comparison">
                         <a class="comparison-toggler"><span>x</span> ' . esc_html__('Close', 'b-sharpe-converter-shortcode') . '</a>
                       </div>
                       <div class="wrapper-comparison-table">
                         <table class="comparison-table">
                           <thead>
                             <tr>
                               <th><img src="' . plugins_url('public/img/logo_bsharpe_comparison.png', __FILE__) . '" alt="b-sharpe logo"></th>
                               <th>' . esc_html__('Traditional bank', 'b-sharpe-converter-shortcode') . '</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr>
                               <td>
                                 <p>' . esc_html__('I send', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="b-sharpe-i-send"></p>
                               </td>
                               <td>
                                 <p>' . esc_html__('I send', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="bank-i-send"></p>
                               </td>
                             </tr>
                             <tr>
                               <td>
                                 <p>' . esc_html__('Exchange rate', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="b-sharpe-rate"></p>
                               </td>
                               <td>
                                 <p>' . esc_html__('Exchange rate', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="bank-rate"></p>
                               </td>
                             </tr>
                             <tr>
                               <td>
                                 <p>' . esc_html__('My beneficiary gets', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="b-sharpe-beneficiary-gets"></p>
                               </td>
                               <td>
                                 <p>' . esc_html__('My beneficiary gets', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="bank-beneficiary-gets"></p>
                               </td>
                             </tr>
                             <tr>
                               <td>
                                 <p>' . esc_html__('I save', 'b-sharpe-converter-shortcode') . '</p>
                                 <p class="b-sharpe-savings-amount"></p>
                               </td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </div>';

        wp_enqueue_style('b-sharpe-converter-shortcode-css');
        wp_enqueue_script('b-sharpe-converter-shortcode-js');

        return $markup;
    }
}
