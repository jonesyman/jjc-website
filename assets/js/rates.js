// assets/js/rates.js
// Shared rate loading and estimate math for public and admin pages.
window.JJC_RATES = {
  CorporateHourly: 300,
  CorporatePrep: 100,
  CorporateAssessment: 25,
  NonprofitHourly: 100,
  NonprofitPrep: 50,
  NonprofitAssessment: 20,
  IndividualDebrief: 100
};

window.Rates = {
  async load() {
    try {
      const rates = await window.Database.getRates();
      window.JJC_RATES = { ...window.JJC_RATES, ...normalizeRates(rates) };
      return window.JJC_RATES;
    } catch (error) {
      console.warn("Using fallback rates because Google Sheets did not load.", error);
      return window.JJC_RATES;
    }
  },

  calculate({ orgType, participants = 12, hours = 3, discounts = {} }) {
    const r = window.JJC_RATES;
    const isIndividual = orgType === "individual_debrief";

    const consultingDiscount = Number(discounts.consulting || 0);
    const prepDiscount = Number(discounts.prep || 0);
    const assessmentDiscount = Number(discounts.assessment || 0);

    if (isIndividual) {
      const gross = Number(r.IndividualDebrief || 0);
      const net = Math.max(0, gross - consultingDiscount);
      return {
        orgType,
        participants: 1,
        hours: 1,
        consultingGross: gross,
        prepGross: 0,
        assessmentGross: 0,
        consultingNet: net,
        prepNet: 0,
        assessmentNet: 0,
        discounts: gross - net,
        subtotal: gross,
        total: net,
        isIndividual: true
      };
    }

    const p = Math.max(1, Number(participants || 1));
    const h = Math.max(1, Number(hours || 1));

    const hourly = orgType === "for_profit" ? r.CorporateHourly : r.NonprofitHourly;
    const prepRate = orgType === "for_profit" ? r.CorporatePrep : r.NonprofitPrep;
    const assessmentRate = orgType === "for_profit" ? r.CorporateAssessment : r.NonprofitAssessment;

    const consultingGross = Number(hourly || 0) * h;
    const prepGross = Math.ceil(p / 12) * Number(prepRate || 0);
    const assessmentGross = p * Number(assessmentRate || 0);

    const consultingNet = Math.max(0, consultingGross - consultingDiscount);
    const prepNet = Math.max(0, prepGross - prepDiscount);
    const assessmentNet = Math.max(0, assessmentGross - assessmentDiscount);

    return {
      orgType,
      participants: p,
      hours: h,
      hourly,
      prepRate,
      assessmentRate,
      consultingGross,
      prepGross,
      assessmentGross,
      consultingNet,
      prepNet,
      assessmentNet,
      discounts: (consultingGross - consultingNet) + (prepGross - prepNet) + (assessmentGross - assessmentNet),
      subtotal: consultingGross + prepGross + assessmentGross,
      total: consultingNet + prepNet + assessmentNet,
      isIndividual: false
    };
  }
};

function normalizeRates(rates) {
  const clean = {};
  Object.keys(window.JJC_RATES).forEach(key => {
    if (rates[key] !== undefined && rates[key] !== "") clean[key] = Number(rates[key]);
  });
  return clean;
}

window.JJC_money = function money(value, decimals = 2) {
  return "$" + Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

window.JJC_wholeMoney = function wholeMoney(value) {
  return "$" + Number(value || 0).toLocaleString();
};
