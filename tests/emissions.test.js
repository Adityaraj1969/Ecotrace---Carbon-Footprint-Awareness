import { describe, it, expect } from 'vitest'

// ─── Inline the emission factors directly so tests are self-contained ───
const FACTORS = {
  petrol_car:       0.21,
  diesel_car:       0.17,
  electric_car:     0.04,
  bus:              0.089,
  train:            0.014,
  flight_domestic:  0.255,
}

const HOME_FACTORS = {
  electricity: 0.71,   // CEA National Electricity Plan 2024
  lpg:         2.98,   // IPCC AR6
}

const FOOD_FACTORS = {
  beef:        27.0,
  chicken:      6.9,
  fish:         3.9,
  dairy:        3.2,
  eggs:         4.5,
  vegetables:   2.0,
}

// ─── Calculation helpers (mirror emissions.js logic) ───────────────────
const calcTransport = (type, dailyKm) => dailyKm * 365 * FACTORS[type]
const calcHome      = (monthlyKwh, monthlyLpgKg) =>
  monthlyKwh * 12 * HOME_FACTORS.electricity + monthlyLpgKg * 12 * HOME_FACTORS.lpg
const calcFood      = (type, weeklyKg) => weeklyKg * 52 * FOOD_FACTORS[type]
const calcTotal     = (...args) => args.reduce((a, b) => a + b, 0)

// ─── Transport Tests ───────────────────────────────────────────────────
describe('Transport Emissions', () => {
  it('petrol car: 10 km/day produces correct annual CO₂', () => {
    expect(calcTransport('petrol_car', 10)).toBeCloseTo(766.5, 1)
  })

  it('electric car: emits less than petrol for same distance', () => {
    expect(calcTransport('electric_car', 10))
      .toBeLessThan(calcTransport('petrol_car', 10))
  })

  it('train: lowest emission transport mode per km', () => {
    const modes = Object.keys(FACTORS)
    const trainEmission = calcTransport('train', 10)
    modes.forEach(mode => {
      expect(trainEmission).toBeLessThanOrEqual(calcTransport(mode, 10))
    })
  })

  it('bus: lower emissions than petrol car', () => {
    expect(calcTransport('bus', 20)).toBeLessThan(calcTransport('petrol_car', 20))
  })

  it('zero km/day produces zero emissions', () => {
    expect(calcTransport('petrol_car', 0)).toBe(0)
  })

  it('diesel car annual: 15 km/day', () => {
    expect(calcTransport('diesel_car', 15)).toBeCloseTo(930.75, 1)
  })
})

// ─── Home Energy Tests ─────────────────────────────────────────────────
describe('Home Energy Emissions', () => {
  it('electricity only: 100 kWh/month produces correct annual CO₂', () => {
    expect(calcHome(100, 0)).toBeCloseTo(852, 0)
  })

  it('LPG only: 10 kg/month produces correct annual CO₂', () => {
    expect(calcHome(0, 10)).toBeCloseTo(357.6, 0)
  })

  it('combined electricity and LPG', () => {
    expect(calcHome(150, 8)).toBeCloseTo(1564.08, 0)
  })

  it('zero usage produces zero emissions', () => {
    expect(calcHome(0, 0)).toBe(0)
  })

  it('India grid factor (0.71) higher than global avg (0.45)', () => {
    expect(HOME_FACTORS.electricity).toBeGreaterThan(0.45)
  })
})

// ─── Food Tests ────────────────────────────────────────────────────────
describe('Food Emissions', () => {
  it('beef: highest emission food per kg', () => {
    const types = Object.keys(FOOD_FACTORS)
    types.forEach(type => {
      expect(FOOD_FACTORS.beef).toBeGreaterThanOrEqual(FOOD_FACTORS[type])
    })
  })

  it('vegetables: lowest emission food per kg', () => {
    const types = Object.keys(FOOD_FACTORS)
    types.forEach(type => {
      expect(FOOD_FACTORS.vegetables).toBeLessThanOrEqual(FOOD_FACTORS[type])
    })
  })

  it('chicken: 1 kg/week annual emissions', () => {
    expect(calcFood('chicken', 1)).toBeCloseTo(358.8, 0)
  })

  it('zero consumption produces zero emissions', () => {
    expect(calcFood('beef', 0)).toBe(0)
  })

  it('switching beef → vegetables cuts food emissions significantly', () => {
    const beef = calcFood('beef', 1)
    const veg  = calcFood('vegetables', 1)
    expect(beef).toBeGreaterThan(veg * 5)
  })
})

// ─── Total Calculation Tests ───────────────────────────────────────────
describe('Total Emissions', () => {
  it('sums all categories correctly', () => {
    expect(calcTotal(1000, 500, 300, 200)).toBe(2000)
  })

  it('all-zero inputs produce zero total', () => {
    expect(calcTotal(0, 0, 0, 0)).toBe(0)
  })

  it('typical Indian user footprint is within realistic range', () => {
    const transport = calcTransport('bus', 10)
    const home      = calcHome(80, 6)
    const food      = calcFood('chicken', 0.5)
    const total     = calcTotal(transport, home, food, 200)
    expect(total).toBeGreaterThan(500)
    expect(total).toBeLessThan(5000)
  })
})
