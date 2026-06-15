import { useState, useEffect, useCallback } from 'react';
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

function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Num({ value, onChange, unit, step = 1, min = 0 }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <input type="number" min={min} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-24 text-right border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-eco-500 transition-colors" />
      {unit && <span className="text-xs text-gray-400 w-16">{unit}</span>}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} type="button"
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
        active ? 'border-eco-500 bg-eco-50 text-eco-700' : 'border-gray-200 text-gray-500 hover:border-eco-300'
      }`}>
      {label}
    </button>
  );
}

const VEHICLE_LABELS = { none: '🚶 No vehicle', car_petrol: 'Petrol car', car_diesel: 'Diesel car', car_ev: 'Electric car', bike: 'Two-wheeler' };
const DIET_LABELS    = { vegan: '🥦 Vegan', vegetarian: '🥗 Vegetarian', pescatarian: '🐟 Pescatarian', non_veg: '🍗 Non-veg', heavy_meat: '🥩 Heavy meat' };
const FUEL_LABELS    = { lpg: '🟠 LPG', png: '🔵 PNG', electric: '⚡ Electric', wood: '🪵 Wood' };

export default function Calculator() {
  const { currentUser } = useAuth();
  const [tab, setTab]       = useState('transport');
  const [busy, setBusy]     = useState(false);
  const [saved, setSaved]   = useState(false);
  const [co2, setCo2]       = useState({ transport: 0, home: 0, food: 0, shopping: 0, total: 0 });

  const [form, setForm] = useState({
    transport:{ vehicleType: 'none', carKmWeekly: 0, bikeKmWeekly: 0, busKmWeekly: 0, trainKmWeekly: 0, flightKmYear: 0 },
    home:     { electricityKwh: 100, cookingFuel: 'lpg', lpgCylinders: 1, cngCubicM: 0 },
    food:     { dietType: 'non_veg', chickenKg: 2, fishKg: 1, dairyKg: 3, riceKg: 4, vegKg: 5 },
    shopping: { onlineOrdersMonth: 4, clothingYear: 5, electronicsYear: 1 },
  });

  // Load existing data
  useEffect(() => {
    (async () => {
      const data = await getUserData(currentUser.uid);
      if (data?.transport) setForm({ transport: data.transport, home: data.home, food: data.food, shopping: data.shopping });
    })();
  }, [currentUser]);

  // Recalculate live
  useEffect(() => { setCo2(calculateCO2(form)); }, [form]);

  const set = (section, key, value) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [key]: value } }));

  function handleDiet(val) {
    const preset = DIET_PRESETS[val];
    setForm(p => ({ ...p, food: { ...p.food, ...preset, dietType: val } }));
  }

  async function handleSave() {
    setBusy(true); setSaved(false);
    await saveCarbon(currentUser.uid, form, co2);
    setBusy(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const activeTab = TABS.find(t => t.key === tab);

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Carbon Calculator</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your data auto-calculates in real time</p>
        </div>
        <button onClick={handleSave} disabled={busy}
          className="flex items-center gap-2 bg-eco-600 hover:bg-eco-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
          {saved ? <><CheckCircle size={16} /> Saved!</> : busy ? <><RefreshCw size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save</>}
        </button>
      </div>

      {/* Live CO₂ summary bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[...TABS, { key: 'total', label: 'Total' }].map(({ key, label }) => {
          const val = co2[key] || 0;
          const t   = TABS.find(t => t.key === key);
          return (
            <div key={key} className={`bg-white border rounded-xl p-3 text-center ${key === 'total' ? 'border-eco-300 bg-eco-50' : 'border-gray-200'}`}>
              <div className={`font-display font-bold text-lg ${key === 'total' ? 'text-eco-700' : 'text-gray-800'}`}>
                {val.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</div>
              <div className="text-[10px] text-gray-300">kg CO₂/yr</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15} className={tab === key ? color : ''} /> {label}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* Transport */}
        {tab === 'transport' && (
          <div>
            <Row label="Primary personal vehicle" hint="What do you mainly drive?">
              <div className="flex flex-wrap gap-1.5 justify-end">
                {Object.entries(VEHICLE_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.transport.vehicleType === v} onClick={() => set('transport', 'vehicleType', v)} />
                ))}
              </div>
            </Row>
            {form.transport.vehicleType !== 'none' && (
              <Row label={form.transport.vehicleType === 'bike' ? 'Two-wheeler km/week' : 'Car km per week'}>
                <Num unit="km/week" step={5}
                  value={form.transport.vehicleType === 'bike' ? form.transport.bikeKmWeekly : form.transport.carKmWeekly}
                  onChange={v => set('transport', form.transport.vehicleType === 'bike' ? 'bikeKmWeekly' : 'carKmWeekly', v)} />
              </Row>
            )}
            <Row label="Bus / auto-rickshaw km per week">
              <Num unit="km/week" step={5} value={form.transport.busKmWeekly} onChange={v => set('transport', 'busKmWeekly', v)} />
            </Row>
            <Row label="Train / Metro km per week">
              <Num unit="km/week" step={5} value={form.transport.trainKmWeekly} onChange={v => set('transport', 'trainKmWeekly', v)} />
            </Row>
            <Row label="Flight km per year (all trips)" hint="Delhi–Mumbai return ≈ 2,400 km">
              <Num unit="km/year" step={100} value={form.transport.flightKmYear} onChange={v => set('transport', 'flightKmYear', v)} />
            </Row>
          </div>
        )}

        {/* Home */}
        {tab === 'home' && (
          <div>
            <Row label="Monthly electricity usage" hint="Check your electricity bill for 'units consumed'">
              <Num unit="kWh/mo" step={10} value={form.home.electricityKwh} onChange={v => set('home', 'electricityKwh', v)} />
            </Row>
            <Row label="Cooking fuel">
              <div className="flex flex-wrap gap-1.5 justify-end">
                {Object.entries(FUEL_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.home.cookingFuel === v} onClick={() => set('home', 'cookingFuel', v)} />
                ))}
              </div>
            </Row>
            {form.home.cookingFuel === 'lpg' && (
              <Row label="LPG cylinders per month" hint="1 standard cylinder = 14.2 kg">
                <Num unit="cylinders" step={0.5} value={form.home.lpgCylinders} onChange={v => set('home', 'lpgCylinders', v)} />
              </Row>
            )}
            {(form.home.cookingFuel === 'png' || form.home.cookingFuel === 'cng') && (
              <Row label="Monthly gas consumption">
                <Num unit="m³/month" step={5} value={form.home.cngCubicM} onChange={v => set('home', 'cngCubicM', v)} />
              </Row>
            )}
          </div>
        )}

        {/* Food */}
        {tab === 'food' && (
          <div>
            <Row label="Diet type">
              <div className="flex flex-wrap gap-1.5 justify-end">
                {Object.entries(DIET_LABELS).map(([v, l]) => (
                  <Chip key={v} label={l} active={form.food.dietType === v} onClick={() => handleDiet(v)} />
                ))}
              </div>
            </Row>
            <Row label="Chicken" hint="kg consumed per month">
              <Num unit="kg/month" step={0.5} value={form.food.chickenKg} onChange={v => set('food', 'chickenKg', v)} />
            </Row>
            <Row label="Fish & Seafood" hint="kg per month">
              <Num unit="kg/month" step={0.5} value={form.food.fishKg} onChange={v => set('food', 'fishKg', v)} />
            </Row>
            <Row label="Dairy (milk, curd, paneer)" hint="kg per month">
              <Num unit="kg/month" step={0.5} value={form.food.dairyKg} onChange={v => set('food', 'dairyKg', v)} />
            </Row>
            <Row label="Rice" hint="kg per month">
              <Num unit="kg/month" step={0.5} value={form.food.riceKg} onChange={v => set('food', 'riceKg', v)} />
            </Row>
            <Row label="Vegetables & Fruits" hint="kg per month">
              <Num unit="kg/month" step={0.5} value={form.food.vegKg} onChange={v => set('food', 'vegKg', v)} />
            </Row>
          </div>
        )}

        {/* Shopping */}
        {tab === 'shopping' && (
          <div>
            <Row label="Online orders per month" hint="Amazon, Flipkart, Swiggy, Zomato, etc.">
              <Num unit="orders/mo" step={1} value={form.shopping.onlineOrdersMonth} onChange={v => set('shopping', 'onlineOrdersMonth', v)} />
            </Row>
            <Row label="New clothing items per year" hint="Including shoes and accessories">
              <Num unit="items/yr" step={1} value={form.shopping.clothingYear} onChange={v => set('shopping', 'clothingYear', v)} />
            </Row>
            <Row label="New electronics per year" hint="Phones, laptops, TVs, tablets">
              <Num unit="devices/yr" step={1} value={form.shopping.electronicsYear} onChange={v => set('shopping', 'electronicsYear', v)} />
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
