import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Progress from "./components/Progress";
import { validateBySchema, onlyDigits } from "./utils/validation";

type Field = {
  id: string;
  name: string;
  label: string;
  tag: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
  maxlength?: number;
  options?: { label: string; value: string }[];
};

type Step = { title: string; fields: Field[] };
type Schema = { steps: Step[] };

const fetchPIN = async (pin: string) => {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
  const data = await res.json();
  const item = data?.[0];
  if (item?.Status !== "Success") throw new Error("Invalid PIN");
  const po = item.PostOffice?.[0];
  return { district: po?.District || "", state: po?.State || "" };
};

const App: React.FC = () => {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const steps = schema?.steps ?? [];

  useEffect(() => {
    const load = async () => {
      try {
        // Try backend first, fallback to local
        const s = await axios
          .get("/api/schema")
          .then((r) => r.data)
          .catch(async () => {
            const r = await fetch("/schema.json");
            return r.json();
          });
        setSchema(s);
        const init: Record<string, any> = {};
        s.steps.forEach((st: Step) =>
          st.fields.forEach((f) => (init[f.name] = ""))
        );
        setValues(init);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Auto-fill PIN on change in step 2
    if (!schema) return;
    const pinField = steps[1]?.fields.find((f) => f.name === "pinCode");
    if (pinField) {
      const pin = values["pinCode"] as string;
      if (pin && pin.length === 6) {
        fetchPIN(pin)
          .then(({ district, state }) => {
            setValues((v) => ({
              ...v,
              district: v["district"] || district,
              state: v["state"] || state,
            }));
          })
          .catch(() => {});
      }
    }
  }, [values["pinCode"], stepIndex, schema]);

  const currentStep = steps[stepIndex];

  const setValue = (name: string, value: any) =>
    setValues((v) => ({ ...v, [name]: value }));

  const validateAll = (): boolean => {
    if (!currentStep) return false;
    const err: Record<string, string | null> = {};
    currentStep.fields.forEach((f) => {
      const e = validateBySchema(values[f.name], f);
      if (e) err[f.name] = e;
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (!validateAll()) return;
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const submit = async () => {
    if (!validateAll()) return;
    await axios.post("/api/submit", values).catch(() => {});
    alert("Submitted");
  };

  const renderField = (f: Field) => {
    const common =
      "w-full rounded-2xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-black/30";
    const val = values[f.name] ?? "";
    const err = errors[f.name];

    if (f.tag === "select") {
      return (
        <div key={f.id} className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            {f.label}
            {f.required ? <span className="text-red-600"> *</span> : null}
          </label>
          <select
            className={common}
            value={val}
            onChange={(e) => setValue(f.name, e.target.value)}
          >
            <option value="">Select</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
      );
    }

    return (
      <div key={f.id} className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          {f.label}
          {f.required ? <span className="text-red-600"> *</span> : null}
        </label>
        <input
          className={common}
          placeholder={f.placeholder || ""}
          maxLength={f.maxlength || undefined}
          value={val}
onChange={(e) => {
  const raw = e.target.value;
  let next = raw;

  // ✅ Allow letters for name fields
  if (f.name.toLowerCase().includes('name')) {
    next = raw; // No digit filtering, no forced uppercase
  } 
  else if (
    f.type === 'tel' ||
    f.type === 'number' ||
    f.name.toLowerCase().includes('pin') ||
    f.name.toLowerCase().includes('aadhaar') ||
    f.name.toLowerCase().includes('otp')
  ) {
    next = onlyDigits(raw);
  } 
  else {
    next = raw.toUpperCase();
  }

  setValue(f.name, next);
  setErrors(prev => ({ ...prev, [f.name]: null }));
}}


        />
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    );
  };

  if (!schema)
    return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Udyam Registration – Dynamic Form
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Mobile‑first UI with validation and PIN auto‑fill.
          </p>
        </header>

        <Progress
          step={stepIndex}
          total={steps.length}
          titles={steps.map((s) => s.title)}
        />

        <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {currentStep.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentStep.fields.map(renderField)}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 mt-4">
            <button
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              Back
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-5 py-3 text-sm font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-5 py-3 text-sm font-medium"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
