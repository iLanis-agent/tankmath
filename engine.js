/* TankMath engine - honest hot water math. Pure logic, no DOM. */
(function (root) {
  'use strict';

  var TANK_C = 60;          /* stored hot water temp */
  var SHOWER_C = 40;        /* comfortable shower temp */
  var USABLE = 0.70;        /* stratification: only ~70% of the tank is truly hot */
  var KJ_PER_KG_C = 4.186;

  var FUELS = {
    electric: { label: 'Electric (4.5 kW)', kw: 4.5 },
    gas:      { label: 'Gas (40k BTU/h)', kw: 11.7 },
    heatpump: { label: 'Heat pump (2.5 kW equiv)', kw: 2.5 }
  };

  function num(x, name, min, max) {
    var v = Number(x);
    if (!isFinite(v) || v < min || v > max) throw new Error(name + ' must be between ' + min + ' and ' + max);
    return v;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  /* fraction of shower flow that must come from the hot tank */
  function hotFraction(inletC) {
    return (SHOWER_C - inletC) / (TANK_C - inletC);
  }

  /* minutes to reheat a full tank from inlet to 60 C */
  function recoveryMin(tankL, kw, inletC) {
    var kg = tankL; /* 1 L ~ 1 kg */
    return kg * (TANK_C - inletC) * KJ_PER_KG_C / (kw * 60);
  }

  function analyze(input) {
    if (!input || typeof input !== 'object') throw new Error('No input');
    var tankL = num(input.tankL, 'Tank size', 30, 500);
    var fuelKey = String(input.fuel || 'electric');
    if (!FUELS[fuelKey]) throw new Error('Pick a fuel type');
    var inletC = input.inletC == null || input.inletC === '' ? 15 : num(input.inletC, 'Incoming water temp', 2, 30);
    var flowLpm = input.flowLpm == null || input.flowLpm === '' ? 9 : num(input.flowLpm, 'Shower flow', 4, 20);
    var showerMin = input.showerMin == null || input.showerMin === '' ? 8 : num(input.showerMin, 'Shower length', 2, 30);
    var people = input.people == null || input.people === '' ? 2 : Math.round(num(input.people, 'People', 1, 8));

    var fuel = FUELS[fuelKey];
    var hotFrac = Math.round(hotFraction(inletC) * 1000) / 1000;
    var usableL = round1(tankL * USABLE);
    var hotDrawLpm = round1(flowLpm * hotFrac);

    /* continuous shower minutes from one full tank (recovery while showering counts too) */
    var reheatLpm = fuel.kw * 60 / ((TANK_C - inletC) * KJ_PER_KG_C); /* L of hot water made per minute */
    var netDrawLpm = Math.max(0.5, flowLpm * hotFrac - reheatLpm);
    var showerMinutes = round1(usableL / netDrawLpm);

    /* morning rush: back-to-back showers until the tank gives out */
    var drawPerShower = showerMin * flowLpm * hotFrac;
    var budget = usableL;
    var served = 0;
    var rushDetail = [];
    for (var p = 1; p <= people; p++) {
      /* each shower gets the remaining budget plus what reheats during it */
      var available = budget + reheatLpm * showerMin;
      var ok = available >= drawPerShower;
      rushDetail.push({ person: p, ok: ok });
      if (ok) {
        budget = available - drawPerShower;
        served++;
      } else {
        /* cold from here on */
      }
    }

    var recFull = Math.round(recoveryMin(tankL, fuel.kw, inletC));
    var recAfterShower = Math.round(recoveryMin(tankL, fuel.kw, inletC) * (drawPerShower / (tankL * 1)) / 1);
    var recOne = Math.round(drawPerShower * (TANK_C - inletC) * KJ_PER_KG_C / (fuel.kw * 60));

    var band;
    if (served >= people) band = 'comfortable';
    else if (served === people - 1) band = 'one cold shower';
    else band = 'morning mutiny';

    var verdict = 'Your ' + tankL + ' L ' + fuel.label.toLowerCase().replace(/ \(.*$/, '') +
      ' tank holds about ' + usableL + ' L of truly hot water. ' +
      'A ' + flowLpm + ' L/min shower at ' + SHOWER_C + ' C drinks ' + hotDrawLpm + ' L/min of it, so one full tank runs a shower for ~' + showerMinutes + ' min. ' +
      'Back to back, ' + served + ' of ' + people + ' people get a full ' + showerMin + '-min shower - "' + band + '". ' +
      'After one shower the tank needs ~' + recOne + ' min to recover; a full reheat from cold takes ~' + recFull + ' min.' +
      (band !== 'comfortable' ? ' A smaller flow head or a 2-minute-shorter shower changes this verdict more than a bigger tank.' : '');

    return {
      tankL: tankL,
      fuel: fuel.label,
      inletC: inletC,
      hotFraction: hotFrac,
      usableL: usableL,
      hotDrawLpm: hotDrawLpm,
      reheatLpm: round1(reheatLpm),
      showerMinutes: showerMinutes,
      served: served,
      people: people,
      band: band,
      recOneMin: recOne,
      recFullMin: recFull,
      rushDetail: rushDetail,
      verdict: verdict
    };
  }

  var api = { analyze: analyze, hotFraction: hotFraction, recoveryMin: recoveryMin, FUELS: FUELS, TANK_C: TANK_C, SHOWER_C: SHOWER_C, USABLE: USABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TankMathEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
