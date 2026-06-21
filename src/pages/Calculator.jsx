import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveCarbon } from '../lib/firestore';
import { calculateCO2, DIET_PRESETS } from '../lib/emissions';
import { Car, Home, Utensils, ShoppingBag, Save, RefreshCw, CheckCircle } from 'lucide-react';

const TABS = [
  { key: 'transport', label: 'Transport',   icon: Car,         color: 'text-blue-600',   border: 'border-blue-500',  bg: 'bg-blue-50'  },
  { key: 'home',      label: 'Home Energy', icon: Home,        color: 'text-amber-600',  border: 'border-amber-500', bg: 'bg-amber-50' },
  { key: 'food',      label: 'Food & Diet', icon: Utensils,    color: 'text-green-600',  border: 'border-green-500', bg: 'bg-green-50' },
  { key: 'shopping',  label: 'Shopping',    icon: ShoppingBag, color: 'text-pink-600',   border: 'border-pink-500',  bg: 'bg-pink-50'  },
];

// ACCESSIBILITY: Row now accepts an htmlFor prop to connect label to input
function Row({ label, hint, htmlFor, children }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-4">
        {/* Use <label> when htmlFor is provided, <p> otherwise (e.g. chip rows) */}
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 cursor-pointer">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium text-gray-700">{label}</p>
        )}
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ACCESSIBILITY: Num now accepts id + aria-label for proper labelling
function Num({ id, value, onChange, unit, step = 1, min = 0, ariaLabel }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={e => onChange(+e.target.value)}
        className="w-24 text-right border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-eco-500 transition-colors"
      />
      {unit && <span className="text-xs text-gray-400 w-16" aria-hidden="true">{unit}</span>}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
        active ? 'border-eco-500 bg-eco-50 text-eco-700' : 'border-gray-200 text-gray-500 hover:border-eco-300'
      }`}
    >
      {label}
    </button>
  );
}

const VEHICLE_LABELS = { none: '🚫 No vehicle', car_petrol: 'Petrol car', car_diesel: 'Diesel car', car_ev: 'Electric car', bike: 'Two-wheeler' };
const DIET_LABELS    = { vegan: '🌱 Vegan', vegetarian: '🥗 Vegetarian', pescatarian: '🐟 Pescatarian', non_veg: '🍗 Non-veg', heavy_meat: '🥩 Heavy meat' };
const FUEL_LABELS    = { lpg: '🪔 LPG', png: '🔥 PNG', electric: '⚡ Electric', wood: '🪵 Wood' };

export default function Calculator() {
  const { currentUser } = useAuth();
  const [tab, setTab]     = useState('transport');
  const [busy, setBusy]   = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    transport: { vehicleType: 'none', carKmWeekly: 0, bikeKmWeekly: 0, busKmWeekly: 0, trainKmWeekly: 0, flightKmYear: 0 },
    home:      { electricityKwh: 100, cookingFuel: 'lpg', lpgCylinders: 1, cngCubicM: 0 },
    food:      { dietType: 'non_veg', chickenKg: 2, fishKg: 1, dairyKg: 3, riceKg: 4, vegKg: 5 },
    shopping:  { onlineOrdersMonth: 4, clothingYear: 5, electronicsYear: 1 },
  });

  // Load existing data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getUserData(currentUser.uid);
      if (!cancelled && data?.transport) {
        setForm({ transport: data.transport, home: data.home, food: data.food, shopping: data.shopping });
      }
    })();
    // EFFICIENCY: cleanup prevents setState on unmounted component
    return () => { cancelled = true; };
  }, [currentUser]);

  // EFFICIENCY: useMemo for co2 — only recalculates when form changes,
  // not on every unrelated re-render (e.g. busy/saved state toggles)
  const co2 = useMemo(() => calculateCO2(form), [form]);

  // EFFICIENCY: useCallback so set() is stable across renders
  const set = useCallback((section, key, value) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [key]: value } })),
  []);

  const handleDiet = useCallback((val) => {
    const preset = DIET_PRESETS[val];
    setForm(p => ({ ...p, food: { ...p.food, ...preset, dietType: val } }));
  }, []);

  // EFFICIENCY: useCallback on save handler
  const handleSave = useCallback(async () => {
    setBusy(true); setSaved(false);
    await saveCarbon(currentUser.uid, form, co2);
    setBusy(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [currentUser, form, co2]);

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Carbon Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your data auto-calculates in real time</p>
        </div>
        <button
          onClick={handleSave}
          disabled={busy}
          aria-label={saved ? 'Data saved' : busy ? 'Saving data' : 'Save your carbon data'}
          className="flex items-center gap-2 bg-eco-600 hover:bg-eco-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm"
        >
          {saved ? <><CheckCircle size={16} aria-hidden="true" /> Saved!</>
                 : busy  ? <><RefreshCw size={16} className="animate-spin" aria-hidden="true" /> Saving…</>
                         : <><Save size={16} aria-hidden="true" /> Save</>}
        </button>
      </div>

      {/* Live CO₂ summary bar */}
      <div className="grid grid-cols-5 gap-3 mb-6" role="region" aria-label="Live CO₂ summary">
        {[...TABS, { key: 'total', label: 'Total' }].map(({ key, label }) => {
          const val = co2[key] || 0;
          return (
            <div
              key={key}
              className={`bg-white border rounded-xl p-3 text-center ${key === 'total' ? 'border-eco-300 bg-eco-50' : 'border-gray-200'}`}
              aria-label={`${label}: ${val.toLocaleString()} kg CO₂ per year`}
            >
              <div className={`font-display font-bold text-lg ${key === 'total' ? 'text-eco-700' : 'text-gray-800'}`}>
                {val.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5" aria-hidden="true">{label}</div>
              <div className="text-[10px] text-gray-300" aria-hidden="true">kg CO₂/yr</div>
            </div>
          );
        })}
      </div>

      {/* ACCESSIBILITY: Tab list with proper ARIA roles */}
      <div
        role="tablist"
        aria-label="Calculator categories"
        className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5"
      >
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`tabpanel-${key}`}
            id={`tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} className={tab === key ? color : ''} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        {/* ACCESSIBILITY: tabpanel role with aria-labelledby */}
        {tab === 'transport' && (
          <div role="tabpanel" id="tabpanel-transport" aria-labelledby="tab-transport">
            <Row label="Primary personal vehicle" hint="What do you mainly drive?">
              <div className="flex flex-wrap gap-1.5 justify-end" role="group" aria-label="Vehicle type">
                {Object.entries(VEHICLE_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.transport.vehicleType === v} onClick={() => set('transport', 'vehicleType', v)} />
                ))}
              </div>
            </Row>
            {form.transport.vehicleType !== 'none' && (
              <Row
                label={form.transport.vehicleType === 'bike' ? 'Two-wheeler km/week' : 'Car km per week'}
                htmlFor="car-km"
              >
                <Num
                  id="car-km"
                  unit="km/week"
                  step={5}
                  ariaLabel={form.transport.vehicleType === 'bike' ? 'Two-wheeler kilometres per week' : 'Car kilometres per week'}
                  value={form.transport.vehicleType === 'bike' ? form.transport.bikeKmWeekly : form.transport.carKmWeekly}
                  onChange={v => set('transport', form.transport.vehicleType === 'bike' ? 'bikeKmWeekly' : 'carKmWeekly', v)}
                />
              </Row>
            )}
            <Row label="Bus / auto-rickshaw km per week" htmlFor="bus-km">
              <Num id="bus-km" unit="km/week" step={5} ariaLabel="Bus or auto-rickshaw kilometres per week" value={form.transport.busKmWeekly} onChange={v => set('transport', 'busKmWeekly', v)} />
            </Row>
            <Row label="Train / Metro km per week" htmlFor="train-km">
              <Num id="train-km" unit="km/week" step={5} ariaLabel="Train or Metro kilometres per week" value={form.transport.trainKmWeekly} onChange={v => set('transport', 'trainKmWeekly', v)} />
            </Row>
            <Row label="Flight km per year (all trips)" hint="Delhi–Mumbai return ≈ 2,400 km" htmlFor="flight-km">
              <Num id="flight-km" unit="km/year" step={100} ariaLabel="Total flight kilometres per year" value={form.transport.flightKmYear} onChange={v => set('transport', 'flightKmYear', v)} />
            </Row>
          </div>
        )}

        {tab === 'home' && (
          <div role="tabpanel" id="tabpanel-home" aria-labelledby="tab-home">
            <Row label="Monthly electricity usage" hint="Check your electricity bill for 'units consumed'" htmlFor="electricity-kwh">
              <Num id="electricity-kwh" unit="kWh/mo" step={10} ariaLabel="Monthly electricity usage in kilowatt-hours" value={form.home.electricityKwh} onChange={v => set('home', 'electricityKwh', v)} />
            </Row>
            <Row label="Cooking fuel">
              <div className="flex flex-wrap gap-1.5 justify-end" role="group" aria-label="Cooking fuel type">
                {Object.entries(FUEL_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.home.cookingFuel === v} onClick={() => set('home', 'cookingFuel', v)} />
                ))}
              </div>
            </Row>
            {form.home.cookingFuel === 'lpg' && (
              <Row label="LPG cylinders per month" hint="1 standard cylinder = 14.2 kg" htmlFor="lpg-cylinders">
                <Num id="lpg-cylinders" unit="cylinders" step={0.5} ariaLabel="LPG cylinders used per month" value={form.home.lpgCylinders} onChange={v => set('home', 'lpgCylinders', v)} />
              </Row>
            )}
            {(form.home.cookingFuel === 'png' || form.home.cookingFuel === 'cng') && (
              <Row label="Monthly gas consumption" htmlFor="cng-cubicm">
                <Num id="cng-cubicm" unit="m³/month" step={5} ariaLabel="Monthly gas consumption in cubic metres" value={form.home.cngCubicM} onChange={v => set('home', 'cngCubicM', v)} />
              </Row>
            )}
          </div>
        )}

        {tab === 'food' && (
          <div role="tabpanel" id="tabpanel-food" aria-labelledby="tab-food">
            <Row label="Diet type">
              <div className="flex flex-wrap gap-1.5 justify-end" role="group" aria-label="Diet type">
                {Object.entries(DIET_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.food.dietType === v} onClick={() => handleDiet(v)} />
                ))}
              </div>
            </Row>
            <Row label="Chicken" hint="kg consumed per month" htmlFor="food-chicken">
              <Num id="food-chicken" unit="kg/month" step={0.5} ariaLabel="Chicken consumed in kilograms per month" value={form.food.chickenKg} onChange={v => set('food', 'chickenKg', v)} />
            </Row>
            <Row label="Fish & Seafood" hint="kg per month" htmlFor="food-fish">
              <Num id="food-fish" unit="kg/month" step={0.5} ariaLabel="Fish and seafood consumed in kilograms per month" value={form.food.fishKg} onChange={v => set('food', 'fishKg', v)} />
            </Row>
            <Row label="Dairy (milk, curd, paneer)" hint="kg per month" htmlFor="food-dairy">
              <Num id="food-dairy" unit="kg/month" step={0.5} ariaLabel="Dairy products consumed in kilograms per month" value={form.food.dairyKg} onChange={v => set('food', 'dairyKg', v)} />
            </Row>
            <Row label="Rice" hint="kg per month" htmlFor="food-rice">
              <Num id="food-rice" unit="kg/month" step={0.5} ariaLabel="Rice consumed in kilograms per month" value={form.food.riceKg} onChange={v => set('food', 'riceKg', v)} />
            </Row>
            <Row label="Vegetables & Fruits" hint="kg per month" htmlFor="food-veg">
              <Num id="food-veg" unit="kg/month" step={0.5} ariaLabel="Vegetables and fruits consumed in kilograms per month" value={form.food.vegKg} onChange={v => set('food', 'vegKg', v)} />
            </Row>
          </div>
        )}

        {tab === 'shopping' && (
          <div role="tabpanel" id="tabpanel-shopping" aria-labelledby="tab-shopping">
            <Row label="Online orders per month" hint="Amazon, Flipkart, Swiggy, Zomato, etc." htmlFor="shopping-orders">
              <Num id="shopping-orders" unit="orders/mo" step={1} ariaLabel="Online orders placed per month" value={form.shopping.onlineOrdersMonth} onChange={v => set('shopping', 'onlineOrdersMonth', v)} />
            </Row>
            <Row label="New clothing items per year" hint="Including shoes and accessories" htmlFor="shopping-clothing">
              <Num id="shopping-clothing" unit="items/yr" step={1} ariaLabel="New clothing items purchased per year" value={form.shopping.clothingYear} onChange={v => set('shopping', 'clothingYear', v)} />
            </Row>
            <Row label="New electronics per year" hint="Phones, laptops, TVs, tablets" htmlFor="shopping-electronics">
              <Num id="shopping-electronics" unit="devices/yr" step={1} ariaLabel="New electronic devices purchased per year" value={form.shopping.electronicsYear} onChange={v => set('shopping', 'electronicsYear', v)} />
            </Row>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Emission factors sourced from CEA India 2024, IPCC AR6, and India-specific lifecycle data
      </p>
    </div>
  );
}