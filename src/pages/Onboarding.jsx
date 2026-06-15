import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveProfile, saveCarbon } from '../lib/firestore';
import { calculateCO2, DIET_PRESETS } from '../lib/emissions';
import { Leaf, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const TOTAL = 5;

const VEHICLE_OPTIONS = [
  { value: 'none',       label: '🚶 No private vehicle' },
  { value: 'car_petrol', label: '🚗 Car – Petrol' },
  { value: 'car_diesel', label: '🚗 Car – Diesel' },
  { value: 'car_ev',     label: '⚡ Car – Electric' },
  { value: 'bike',       label: '🛵 Two-wheeler (petrol)' },
];

const FUEL_OPTIONS = [
  { value: 'lpg',      label: '🟠 LPG Cylinder' },
  { value: 'png',      label: '🔵 Piped Natural Gas (PNG)' },
  { value: 'electric', label: '⚡ Electric / Induction' },
  { value: 'wood',     label: '🪵 Wood / Biomass' },
];

const DIET_OPTIONS = [
  { value: 'vegan',       label: '🥦 Vegan' },
  { value: 'vegetarian',  label: '🥗 Vegetarian' },
  { value: 'pescatarian', label: '🐟 Pescatarian (fish only)' },
  { value: 'non_veg',     label: '🍗 Non-vegetarian' },
  { value: 'heavy_meat',  label: '🥩 High meat consumption' },
];

function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>;
}

function NumberInput({ label, value, onChange, unit, min = 0, step = 1, hint }) {
  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="flex items-center gap-2">
        <input type="number" min={min} step={step} value={value}
          onChange={e => onChange(+e.target.value)}
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-eco-500 transition-colors" />
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              value === o.value
                ? 'border-eco-500 bg-eco-50 text-eco-700'
                : 'border-gray-200 text-gray-600 hover:border-eco-300'
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [busy, setBusy]     = useState(false);

  const [data, setData] = useState({
    profile:  { name: currentUser?.displayName || '', location: '', householdSize: 1 },
    transport:{ vehicleType: 'none', carKmWeekly: 0, bikeKmWeekly: 0, busKmWeekly: 0, trainKmWeekly: 0, flightKmYear: 0 },
    home:     { electricityKwh: 100, cookingFuel: 'lpg', lpgCylinders: 1, cngCubicM: 0 },
    food:     { dietType: 'non_veg', chickenKg: 2, fishKg: 1, dairyKg: 3, riceKg: 4, vegKg: 5 },
    shopping: { onlineOrdersMonth: 4, clothingYear: 5, electronicsYear: 1 },
  });

  const set = (section, key, value) => setData(p => ({ ...p, [section]: { ...p[section], [key]: value } }));

  function handleDiet(val) {
    set('food', 'dietType', val);
    const preset = DIET_PRESETS[val];
    if (preset) setData(p => ({ ...p, food: { ...p.food, ...preset, dietType: val } }));
  }

  async function handleFinish() {
    setBusy(true);
    try {
      const co2 = calculateCO2(data);
      await saveCarbon(currentUser.uid, data, co2);
      await saveProfile(currentUser.uid, { ...data.profile, onboardingComplete: true });
      navigate('/dashboard');
    } catch (e) { console.error(e); }
    setBusy(false);
  }

  const steps = [
    { title: 'About you',       icon: '👤' },
    { title: 'Transport',       icon: '🚗' },
    { title: 'Home Energy',     icon: '🏠' },
    { title: 'Food & Diet',     icon: '🥗' },
    { title: 'Shopping',        icon: '🛍️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-eco-600 rounded-lg flex items-center justify-center">
          <Leaf size={16} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl text-gray-900">EcoTrace</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => {
            const n = i + 1;
            const done    = n < step;
            const current = n === step;
            return (
              <div key={n} className="flex flex-col items-center gap-1" style={{ width: '18%' }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done    ? 'bg-eco-500 text-white' :
                  current ? 'bg-eco-600 text-white ring-4 ring-eco-100' :
                            'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <Check size={16} /> : s.icon}
                </div>
                <span className={`text-[10px] font-medium text-center ${current ? 'text-eco-700' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-eco-500 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (TOTAL - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-lg shadow-sm animate-slide-up">
        <h2 className="font-display font-bold text-xl text-gray-900 mb-6">
          {steps[step - 1].icon} {steps[step - 1].title}
        </h2>

        {/* Step 1 – Profile */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label>Your name</Label>
              <input type="text" value={data.profile.name} placeholder="e.g. Rahul"
                onChange={e => set('profile', 'name', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eco-500 transition-colors" />
            </div>
            <div>
              <Label>City / Location</Label>
              <input type="text" value={data.profile.location} placeholder="e.g. Pune, Maharashtra"
                onChange={e => set('profile', 'location', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eco-500 transition-colors" />
            </div>
            <NumberInput label="Household size (number of people)" min={1} step={1}
              value={data.profile.householdSize} unit="people"
              onChange={v => set('profile', 'householdSize', v)} />
          </div>
        )}

        {/* Step 2 – Transport */}
        {step === 2 && (
          <div className="space-y-6">
            <Select label="Primary personal vehicle" value={data.transport.vehicleType}
              options={VEHICLE_OPTIONS} onChange={v => set('transport', 'vehicleType', v)} />
            {data.transport.vehicleType !== 'none' && (
              <NumberInput label="Car / Bike km per week" unit="km/week"
                value={data.transport.vehicleType === 'bike' ? data.transport.bikeKmWeekly : data.transport.carKmWeekly}
                onChange={v => set('transport', data.transport.vehicleType === 'bike' ? 'bikeKmWeekly' : 'carKmWeekly', v)} />
            )}
            <NumberInput label="Bus or auto-rickshaw km per week" unit="km/week"
              value={data.transport.busKmWeekly} onChange={v => set('transport', 'busKmWeekly', v)} />
            <NumberInput label="Train / Metro km per week" unit="km/week"
              value={data.transport.trainKmWeekly} onChange={v => set('transport', 'trainKmWeekly', v)} />
            <NumberInput label="Total flight km per year (all trips combined)" unit="km/year"
              hint="E.g. Delhi–Mumbai return ≈ 2,400 km"
              value={data.transport.flightKmYear} onChange={v => set('transport', 'flightKmYear', v)} />
          </div>
        )}

        {/* Step 3 – Home */}
        {step === 3 && (
          <div className="space-y-6">
            <NumberInput label="Monthly electricity consumption" unit="kWh/month"
              hint="Check your electricity bill — usually shows 'Units consumed'"
              value={data.home.electricityKwh} onChange={v => set('home', 'electricityKwh', v)} />
            <Select label="Primary cooking fuel" value={data.home.cookingFuel}
              options={FUEL_OPTIONS} onChange={v => set('home', 'cookingFuel', v)} />
            {data.home.cookingFuel === 'lpg' && (
              <NumberInput label="LPG cylinders per month" unit="cylinders/month"
                hint="1 standard cylinder = 14.2 kg of LPG"
                step={0.5} value={data.home.lpgCylinders} onChange={v => set('home', 'lpgCylinders', v)} />
            )}
            {(data.home.cookingFuel === 'png' || data.home.cookingFuel === 'cng') && (
              <NumberInput label="Monthly gas consumption" unit="cubic metres/month"
                value={data.home.cngCubicM} onChange={v => set('home', 'cngCubicM', v)} />
            )}
          </div>
        )}

        {/* Step 4 – Food */}
        {step === 4 && (
          <div className="space-y-6">
            <Select label="What best describes your diet?" value={data.food.dietType}
              options={DIET_OPTIONS} onChange={handleDiet} />
            <p className="text-xs text-gray-400 -mt-3">We've pre-filled estimates below — adjust if needed.</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Chicken" unit="kg/month" step={0.5}
                value={data.food.chickenKg} onChange={v => set('food', 'chickenKg', v)} />
              <NumberInput label="Fish / Seafood" unit="kg/month" step={0.5}
                value={data.food.fishKg} onChange={v => set('food', 'fishKg', v)} />
              <NumberInput label="Dairy (milk, curd, paneer…)" unit="kg/month" step={0.5}
                value={data.food.dairyKg} onChange={v => set('food', 'dairyKg', v)} />
              <NumberInput label="Rice" unit="kg/month" step={0.5}
                value={data.food.riceKg} onChange={v => set('food', 'riceKg', v)} />
              <NumberInput label="Vegetables & fruits" unit="kg/month" step={0.5}
                value={data.food.vegKg} onChange={v => set('food', 'vegKg', v)} />
            </div>
          </div>
        )}

        {/* Step 5 – Shopping */}
        {step === 5 && (
          <div className="space-y-6">
            <NumberInput label="Online shopping orders per month" unit="orders/month"
              hint="Include Flipkart, Amazon, Meesho, Swiggy, Zomato, etc."
              value={data.shopping.onlineOrdersMonth} onChange={v => set('shopping', 'onlineOrdersMonth', v)} />
            <NumberInput label="New clothing items per year" unit="items/year"
              hint="Include shoes, accessories, and clothes"
              value={data.shopping.clothingYear} onChange={v => set('shopping', 'clothingYear', v)} />
            <NumberInput label="New electronics per year" unit="devices/year"
              hint="Phones, laptops, tablets, TVs, etc."
              value={data.shopping.electronicsYear} onChange={v => set('shopping', 'electronicsYear', v)} />
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30">
            <ChevronLeft size={16} /> Back
          </button>
          {step < TOTAL ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 bg-eco-600 hover:bg-eco-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={busy}
              className="flex items-center gap-1.5 bg-eco-600 hover:bg-eco-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              {busy ? 'Calculating…' : '🌿 See my footprint'}
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6">Step {step} of {TOTAL} — you can update this anytime in the Calculator</p>
    </div>
  );
}
