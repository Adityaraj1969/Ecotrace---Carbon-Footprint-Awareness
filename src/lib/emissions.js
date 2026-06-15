// ─── India-specific emission factors (kg CO₂ per unit) ───────────────────────
export const EF = {
  transport: {
    none:       0,
    car_petrol: 0.21,   // per km
    car_diesel: 0.17,   // per km
    car_ev:     0.04,   // per km (India grid 2024)
    bike:       0.085,  // per km
  },
  bus:         0.089,   // per km per passenger
  train:       0.014,   // per km per passenger
  metro:       0.031,   // per km per passenger
  flight:      0.255,   // per km per passenger (domestic)

  home: {
    electricity: 0.71,  // per kWh (India CEA 2024 grid EF)
    lpg:         2.98,  // per kg  (1 cylinder = 14.2 kg)
    png:         2.02,  // per cubic metre
    cng:         2.02,  // per cubic metre
    wood:        1.57,  // per kg
    electric:    0,     // induction = covered by electricity
  },

  food: {
    chicken:    6.9,   // per kg consumed
    fish:       6.1,
    dairy:      3.2,
    rice:       2.7,
    vegetables: 2.0,
  },

  shopping: {
    online_order: 0.5,  // per delivery
    clothing:    25,    // per new garment
    electronics: 300,   // per device (avg)
  },
};

export const INDIA_AVG  = 2000;   // kg CO₂/year
export const GLOBAL_AVG = 4800;
export const PARIS_TARGET = 2300;

// ─── Diet type preset values (kg per month) ──────────────────────────────────
export const DIET_PRESETS = {
  vegan:      { chickenKg: 0,   fishKg: 0,   dairyKg: 0.5, riceKg: 3, vegKg: 8 },
  vegetarian: { chickenKg: 0,   fishKg: 0,   dairyKg: 3,   riceKg: 4, vegKg: 6 },
  pescatarian:{ chickenKg: 0,   fishKg: 2,   dairyKg: 2,   riceKg: 4, vegKg: 5 },
  non_veg:    { chickenKg: 2,   fishKg: 1,   dairyKg: 3,   riceKg: 4, vegKg: 5 },
  heavy_meat: { chickenKg: 4,   fishKg: 2,   dairyKg: 4,   riceKg: 3, vegKg: 3 },
};

// ─── Main calculation ─────────────────────────────────────────────────────────
export function calculateCO2(d) {
  const { transport: t, home: h, food: f, shopping: s } = d;

  const transportKg =
    (+(t.carKmWeekly  || 0)) * 52 * (EF.transport[t.vehicleType] || 0) +
    (+(t.bikeKmWeekly || 0)) * 52 * EF.transport.bike +
    (+(t.busKmWeekly  || 0)) * 52 * EF.bus +
    (+(t.trainKmWeekly|| 0)) * 52 * EF.train +
    (+(t.flightKmYear || 0))      * EF.flight;

  const lpgKgMonth = (+(h.lpgCylinders || 0)) * 14.2;
  const homeKg =
    (+(h.electricityKwh || 0)) * 12 * EF.home.electricity +
    lpgKgMonth                 * 12 * EF.home.lpg +
    (+(h.cngCubicM || 0))      * 12 * EF.home.cng;

  const foodKg =
    (+(f.chickenKg || 0)) * 12 * EF.food.chicken +
    (+(f.fishKg    || 0)) * 12 * EF.food.fish    +
    (+(f.dairyKg   || 0)) * 12 * EF.food.dairy   +
    (+(f.riceKg    || 0)) * 12 * EF.food.rice     +
    (+(f.vegKg     || 0)) * 12 * EF.food.vegetables;

  const shoppingKg =
    (+(s.onlineOrdersMonth || 0)) * 12 * EF.shopping.online_order +
    (+(s.clothingYear      || 0))      * EF.shopping.clothing     +
    (+(s.electronicsYear   || 0))      * EF.shopping.electronics;

  return {
    transport: Math.round(transportKg),
    home:      Math.round(homeKg),
    food:      Math.round(foodKg),
    shopping:  Math.round(shoppingKg),
    total:     Math.round(transportKg + homeKg + foodKg + shoppingKg),
  };
}

export function footprintLevel(kg) {
  if (kg < 2000) return { label: 'Low',       color: 'text-green-600',  bg: 'bg-green-50',  ring: '#16a34a' };
  if (kg < 4000) return { label: 'Moderate',   color: 'text-yellow-600', bg: 'bg-yellow-50', ring: '#ca8a04' };
  if (kg < 8000) return { label: 'High',       color: 'text-orange-600', bg: 'bg-orange-50', ring: '#ea580c' };
  return           { label: 'Very High',  color: 'text-red-600',    bg: 'bg-red-50',    ring: '#dc2626' };
}
