(function($) {
  "use strict";


  const {__, _x, _n, sprintf} = wp.i18n;


  class BSharpeConverter {
    constructor(dom) {
      this.APIKey = "aDKlUpKBgEEnrouPcRXi";

      this.dom = dom;
      this.baseAPIURL = "https://api.b-sharpe.com";
      this.currenciesRoute = "/api/v3/core/currency/";
      this.convertRoute = "/api/v3/bsharpe/{operation}/{currency_from}/{currency_to}/{amount}/";
      this.locale = document.documentElement.lang.toLowerCase();
      if (this.locale === "fr" || this.locale === "fr-fr") {
        this.locale = "fr-ch";
      } else if (this.locale === "en") {
        this.locale = "en-us";
      }
      this.datetimeFormatter = (datetime) => datetime.toLocaleString(this.locale);

      this.MODES = {
        sell: "sell",
        buy: "buy",
      };
      this.mode = undefined;
      this.companyMode = this.dom.data("company-mode") != null;

      this.wrapperForm = $(".wrapper-form", this.dom);
      this.wrapperComparison = $(".wrapper-comparison", this.dom);
      this.comparisonToggler = $(".comparison-toggler", this.dom);
      this.widgetSell = $(".money-widget-sell", this.dom);
      this.amountSellInput = $(".amount-sell", this.dom);
      this.currencySellSelect = $(".currency-sell", this.dom);
      this.widgetBuy = $(".money-widget-buy", this.dom);
      this.amountBuyInput = $(".amount-buy", this.dom);
      this.currencyBuySelect = $(".currency-buy", this.dom);
      this.exchangeRateSpan = $(".b-sharpe-rate", this.dom);
      this.feesSpan = $(".b-sharpe-fees", this.dom);
      this.savingsSpan = $(".b-sharpe-savings-amount", this.dom);
      this.exchangeRateTimestampSpan = $(".b-sharpe-rate-timestamp", this.dom);
      this.bsharpeISend = $(".b-sharpe-i-send");
      this.bankISend = $(".bank-i-send");
      this.bankRate = $(".bank-rate");
      this.bsharpeBeneficiaryGets = $(".b-sharpe-beneficiary-gets");
      this.bankBeneficiaryGets = $(".bank-beneficiary-gets");

      this.convertTimer = 0;

      this._initCurrenciesSelects();
      this._initRateTooltip();
      this._bindListeners();

      this.dom.on("currenciesLoaded.bsharpeConverter", () => {
        this._formatNumericInput(this.amountSellInput.get(0));
        this.sellMode();
        this.amountSellInput.focus();
        this.convert();
      });
    }

    _delay(fn, ms) {
      return (...args) => {
        clearTimeout(this.convertTimer);
        this.convertTimer = setTimeout(fn.bind(this, ...args), ms || 0);
      }
    }

    _sanitizeAmount(amount) {
      let sanitizedAmount = String(amount).replace(/[\s']/g, "");

      if (this.locale === "en-us") {
        sanitizedAmount = sanitizedAmount.replace(/,/g, "");
      } else if (this.locale === "de") {
        sanitizedAmount = sanitizedAmount.replace(/\./g, "").replace(/,/g, ".");
      } else if (this.locale === "fr-ch") {
      } else if (this.locale === "it") {
        sanitizedAmount = sanitizedAmount.replace(/\./g, "").replace(/,/g, ".");
      }

      return Number(sanitizedAmount);
    }

    _initCurrenciesSelects() {
      const defaultSoldCurrency = this.currencySellSelect.data("default");
      const defaultBoughtCurrency = this.currencyBuySelect.data("default");

      $.ajax({
          url: `${this.baseAPIURL}${this.currenciesRoute}`,
          dataType: "json",
          headers: {
            Authorization: `Bearer ${this.APIKey}`,
          },
        }).done((currencies, textStatus, jqXHR) => {
          // Fill select with currencies
          for (const currency of currencies) {
            if (!currency.company_only || (currency.company_only && this.companyMode)) {
              const $option = $(`<option value="${currency.iso_alpha}" data-img="${this.baseAPIURL}${currency.flag}">${currency.iso_alpha}</option>`);
              const $optionSell = $option.clone();
              const $optionBuy = $option.clone();
              if (currency.iso_alpha === defaultSoldCurrency) {
                $optionSell.attr("selected", true);
              }
              if (currency.iso_alpha === defaultBoughtCurrency) {
                $optionBuy.attr("selected", true);
              }
              this.currencySellSelect.append($optionSell);
              this.currencyBuySelect.append($optionBuy);
            }
          }

          // Init Select2
          const select2Template = (state) => {
            if (!state.id) {
              return state.text;
            }
            return $(`<div class="currency-option"><div class="currency-option-img"><img src="${state.element.dataset["img"]}" alt="${state.text}"></div><div class="currency-option-iso">${state.text}</div></div>`);
          };
          for (let selectInput of [this.currencySellSelect, this.currencyBuySelect]) {
            selectInput.select2({
              templateSelection: select2Template,
              templateResult: select2Template,
              dropdownParent: this.dom,
            });
          }

          this.dom.trigger("currenciesLoaded.bsharpeConverter");
        });
    }

    _initRateTooltip() {
      tippy(this.exchangeRateSpan.get(0), {
        content: this.exchangeRateSpan.data("tooltip"),
        theme: "b-sharpe",
      });
    }

    _formatNumericInput(elt) {
      const $elt = $(elt),
            formatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: "XXX", currencyDisplay: "code"}),
            sanitizedAmount = this._sanitizeAmount($elt.val()),
            formattedAmount = formatter.format(sanitizedAmount).replace("XXX", "").trim(),
            inputSelectionEnd = elt.selectionEnd;
      $elt.val(formattedAmount);
      elt.selectionEnd = inputSelectionEnd;
    }

    _bindListeners() {
      const triggerConvertOnKeyUp = (e) => {
        const triggerOnTheseKeysOnly = [
          "Digit0",
          "Digit1",
          "Digit2",
          "Digit3",
          "Digit4",
          "Digit5",
          "Digit6",
          "Digit7",
          "Digit8",
          "Digit9",
          "Numpad0",
          "Numpad1",
          "Numpad2",
          "Numpad3",
          "Numpad4",
          "Numpad5",
          "Numpad6",
          "Numpad7",
          "Numpad8",
          "Numpad9",
          "Backspace",
          "Enter",
          "NumpadEnter"
        ];

        if (triggerOnTheseKeysOnly.includes(e.originalEvent.code)) {
          this._delay(this.convert, 500)();
        }
      }

      this.amountSellInput.on("focus", () => this.sellMode())
                          .on("keyup", triggerConvertOnKeyUp)
                          .on("keyup", (e) => this._formatNumericInput(e.currentTarget));
      this.amountBuyInput.on("focus", () => this.buyMode())
                         .on("keyup", triggerConvertOnKeyUp)
                         .on("keyup", (e) => this._formatNumericInput(e.currentTarget));

      this.currencySellSelect.on("change", () => this.convert());
      this.currencyBuySelect.on("change", () => this.convert());

      this.comparisonToggler.on("click", () => this.toggleComparisonDetails());
    }

    _resetResults($resultAmount) {
      $resultAmount.val("...");
      this.feesSpan.html("...");
      this.exchangeRateSpan.html("...");
      this.exchangeRateTimestampSpan.html("");
      this.savingsSpan.html("...");
      this.bsharpeISend.html("");
      this.bsharpeBeneficiaryGets.html("");
      this.bankISend.html("");
      this.bankRate.html("");
      this.bankBeneficiaryGets.html("");
    }

    sellMode() {
      this.mode = this.MODES.sell;

      this.amountSellInput.removeClass("disabled");
      this.currencySellSelect.removeClass("disabled");
      this.amountBuyInput.addClass("disabled");
      this.currencyBuySelect.addClass("disabled");
      this.widgetSell.find(".money-input label").html(`${__("I want to change...", "b-sharpe-converter-shortcode")}`);
      this.widgetBuy.find(".money-input label").html(`${__("I will get:", "b-sharpe-converter-shortcode")}`);
    }

    buyMode() {
      this.mode = this.MODES.buy;

      this.amountBuyInput.removeClass("disabled");
      this.currencyBuySelect.removeClass("disabled");
      this.amountSellInput.addClass("disabled");
      this.currencySellSelect.addClass("disabled");
      this.widgetBuy.find(".money-input label").html(`${__("I want to get...", "b-sharpe-converter-shortcode")}`);
      this.widgetSell.find(".money-input label").html(`${__("I must send:", "b-sharpe-converter-shortcode")}`);
    }

    toggleComparisonDetails() {
      this.wrapperForm.toggle();
      this.wrapperComparison.toggle();
    }

    convert() {
      // This needs to be executed as the very first step to avoid discrepancy between both inputs,
      // even if it looks ugly and un-optimized
      let $resultAmount;
      if (this.mode === this.MODES.sell) {
        $resultAmount = this.amountBuyInput;
      } else if (this.mode === this.MODES.buy) {
        $resultAmount = this.amountSellInput;
      }
      this._resetResults($resultAmount);

      let currencyLeft, currencyRight, amount;
      const soldCurrency = this.currencySellSelect.val();
      const boughtCurrency = this.currencyBuySelect.val();

      if (this.mode === this.MODES.sell) {
        amount = this.amountSellInput.val();
        amount = this._sanitizeAmount(amount);
        if (isNaN(amount)) {
          return;
        }
        currencyLeft = soldCurrency;
        currencyRight = boughtCurrency;

      } else if (this.mode === this.MODES.buy) {
        amount = this.amountBuyInput.val();
        amount = this._sanitizeAmount(amount);
        if (isNaN(amount)) {
          return;
        }
        currencyLeft = boughtCurrency;
        currencyRight = soldCurrency;
      }

      if (currencyLeft && currencyRight && amount && currencyLeft !== currencyRight) {
        const url = `${this.baseAPIURL}${this.convertRoute}`.replace("{operation}", this.mode)
                                                            .replace("{currency_from}", currencyLeft)
                                                            .replace("{currency_to}", currencyRight)
                                                            .replace("{amount}", amount);

        $.ajax({
          url: url,
          dataType: "json",
          headers: {
            Authorization: `Bearer ${this.APIKey}`,
          },
        }).done((deal, textStatus, jqXHR) => {
          // Result amount **needs** to be formatted in "currency" mode, since it differs from regular "number" mode in
          // some locales (eg. fr-ch that uses the comma as a decimal separator for numbers but a point for money
          // amounts). The trick here is to display the currency as its code, which can then be stripped to parse only
          // the raw amount.
          const amountFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.bsharpe_trade_result.currency, currencyDisplay: "code"});
          $resultAmount.val(amountFormatter.format(deal.bsharpe_trade_result.amount).replace(deal.bsharpe_trade_result.currency, "").trim());

          const feesFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.bsharpe_fees.converted.fees_currency});
          this.feesSpan.html(feesFormatter.format(deal.bsharpe_fees.converted.all));

          const savingsFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.bsharpe_trade_result.currency});
          this.savingsSpan.html(savingsFormatter.format(Math.abs(deal.bsharpe_trade_result.savings)));

          this.exchangeRateSpan.html(deal.bsharpe_trade_result.quote);
          this.exchangeRateTimestampSpan.html(`(${this.datetimeFormatter(new Date(deal.interbank_rate.timestamp))})`);

          const bsharpeRate = deal.bsharpe_trade_result.quote;
          const bankRate = deal.standard_trade_result.quote;
          let comparisonSoldAmountFormatter,
              comparisonBoughtAmountFormatter,
              bsharpeSoldAmount,
              bankSoldAmount,
              bsharpeBoughtAmount,
              bankBoughtAmount;
          if (this.mode === this.MODES.sell) {
            comparisonSoldAmountFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.inputs.currency_from});
            comparisonBoughtAmountFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.inputs.currency_to});
            bsharpeSoldAmount = deal.inputs.amount;
            bankSoldAmount = deal.inputs.amount;
            bsharpeBoughtAmount = deal.bsharpe_trade_result.amount;
            bankBoughtAmount = deal.standard_trade_result.amount;
          } else {
            comparisonBoughtAmountFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.inputs.currency_from});
            comparisonSoldAmountFormatter = new Intl.NumberFormat(this.locale, {style: "currency", currency: deal.inputs.currency_to});
            bsharpeBoughtAmount = deal.inputs.amount;
            bankBoughtAmount = deal.inputs.amount;
            bsharpeSoldAmount = deal.bsharpe_trade_result.amount;
            bankSoldAmount = deal.standard_trade_result.amount;
          }

          this.bsharpeISend.html(comparisonSoldAmountFormatter.format(bsharpeSoldAmount));
          this.bsharpeBeneficiaryGets.html(comparisonBoughtAmountFormatter.format(bsharpeBoughtAmount));
          this.bankISend.html(comparisonSoldAmountFormatter.format(bankSoldAmount));
          this.bankRate.html(deal.standard_trade_result.quote);
          this.bankBeneficiaryGets.html(comparisonBoughtAmountFormatter.format(bankBoughtAmount));
        });
      }
    }
  }


  $.fn.initBsharpeConverter = function () {
    const instances = [];

    this.each(function () {
      instances.push(new BSharpeConverter($(this)));
    });

    return instances;
  }


  $(document).ready(() => {
    $(".b-sharpe-converter").initBsharpeConverter();
  });
})(jQuery);
