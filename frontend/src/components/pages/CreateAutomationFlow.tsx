import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Automation, AutomationGuardrail } from '../../types/commerce';

interface CreateAutomationFlowProps {
  onBack: () => void;
  onCreated: (automation: Automation) => void;
  onActivate: (id: string) => void;
  createAutomation: (description: string) => Promise<Automation>;
}

type Step = 'describe' | 'review' | 'activated';

const TEMPLATES = [
  'Recover carts above ₹500 that are abandoned for 30 minutes with a 10% discount offer.',
  'Auto-retry failed payments under ₹2,000 once after 5 minutes.',
  'Send a payment link with 15% discount for high-value carts above ₹3,000 abandoned for 1 hour.',
];

export const CreateAutomationFlow: React.FC<CreateAutomationFlowProps> = ({
  onBack,
  onCreated,
  onActivate,
  createAutomation,
}) => {
  const [step, setStep] = useState<Step>('describe');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedAutomation, setParsedAutomation] = useState<Automation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!description.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const automation = await createAutomation(description);
      setParsedAutomation(automation);
      onCreated(automation);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Failed to parse automation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = () => {
    if (parsedAutomation) {
      onActivate(parsedAutomation.id);
      setStep('activated');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-sm text-[#5F6D7E] hover:text-[#1B2733] mb-6 flex items-center gap-1"
        >
          ← Back to Automations
        </button>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-8">
          {['Describe', 'Review', 'Activate'].map((label, i) => {
            const stepIndex = step === 'describe' ? 0 : step === 'review' ? 1 : 2;
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div className={`flex-1 h-px ${isDone ? 'bg-[#528FF0]' : 'bg-gray-200'}`} />}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isDone
                        ? 'bg-[#528FF0] text-white'
                        : isActive
                        ? 'bg-[#528FF0] text-white'
                        : 'bg-gray-200 text-[#8C97A4]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive || isDone ? 'text-[#1B2733]' : 'text-[#8C97A4]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Describe */}
        {step === 'describe' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8">
            <h2 className="text-lg font-semibold text-[#1B2733] mb-1">
              What should the agent automate?
            </h2>
            <p className="text-sm text-[#5F6D7E] mb-6">
              Describe the outcome you want in plain language. The agent will convert it into a
              structured automation with triggers, actions, and guardrails.
            </p>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., If a customer abandons a ₹500+ cart, wait 30 minutes and send them a payment link with a 10% recovery offer."
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 text-[#1B2733] placeholder-[#8C97A4] focus:outline-none focus:ring-2 focus:ring-[#528FF0]/20 focus:border-[#528FF0] resize-none"
            />

            {/* Templates */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-medium text-[#8C97A4] uppercase tracking-wider">
                Templates
              </span>
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setDescription(t)}
                  className="w-full text-left text-sm text-[#5F6D7E] hover:text-[#1B2733] hover:bg-gray-50 p-3 rounded-lg border border-gray-100 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!description.trim() || isLoading}
              className={`mt-6 w-full flex items-center justify-center gap-2 bg-[#528FF0] hover:bg-[#3A6FD8] text-white rounded-lg px-5 py-3 font-medium text-sm transition-colors ${
                !description.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Agent is parsing your intent...</span>
                </>
              ) : (
                <>
                  <span>Create automation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && parsedAutomation && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8">
              <h2 className="text-lg font-semibold text-[#1B2733] mb-1">
                Review automation
              </h2>
              <p className="text-sm text-[#5F6D7E] mb-6">
                The agent converted your description into this structured workflow. Review it before
                activating.
              </p>

              {/* Trigger */}
              <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs font-semibold text-[#528FF0] uppercase tracking-wider mb-2">
                  Trigger
                </div>
                <p className="text-sm font-medium text-[#1B2733]">
                  {parsedAutomation.trigger_config?.event || parsedAutomation.trigger_type}
                </p>
                <p className="text-xs text-[#5F6D7E] mt-1">
                  {parsedAutomation.trigger_config?.condition}
                  {parsedAutomation.trigger_config?.threshold_paise &&
                    ` — Threshold: ₹${(parsedAutomation.trigger_config.threshold_paise / 100).toLocaleString()}`}
                </p>
              </div>

              {/* Wait */}
              {parsedAutomation.trigger_config?.wait_minutes && (
                <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-semibold text-[#8C97A4] uppercase tracking-wider mb-2">
                    Wait
                  </div>
                  <p className="text-sm font-medium text-[#1B2733]">
                    {parsedAutomation.trigger_config.wait_minutes} minutes
                  </p>
                </div>
              )}

              {/* Action */}
              <div className="mb-5 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="text-xs font-semibold text-[#1CA672] uppercase tracking-wider mb-2">
                  Action
                </div>
                <p className="text-sm font-medium text-[#1B2733]">
                  {parsedAutomation.action_config?.action || parsedAutomation.action_type}
                </p>
                {parsedAutomation.action_config?.discount_pct && (
                  <p className="text-xs text-[#5F6D7E] mt-1">
                    With {parsedAutomation.action_config.discount_pct}% discount
                  </p>
                )}
              </div>

              {/* Guardrails */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="text-xs font-semibold text-[#E8920D] uppercase tracking-wider mb-2">
                  Guardrails
                </div>
                <ul className="space-y-1.5">
                  {parsedAutomation.guardrails?.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1B2733]">
                      <span className="text-[#5F6D7E] mt-0.5">•</span>
                      <span>{typeof g === 'string' ? g : g.label || g.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleActivate}
                className="flex-1 flex items-center justify-center gap-2 bg-[#528FF0] hover:bg-[#3A6FD8] text-white rounded-lg px-5 py-3 font-medium text-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Activate</span>
              </button>
              <button
                onClick={() => setStep('describe')}
                className="px-5 py-3 text-sm font-medium text-[#5F6D7E] hover:text-[#1B2733] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Activated */}
        {step === 'activated' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-[#1CA672]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1B2733] mb-1">
              Automation activated
            </h2>
            <p className="text-sm text-[#5F6D7E] mb-6">
              The agent is now listening for events. Go to the Activity tab to simulate a trigger and
              watch the agent reason and execute.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 bg-[#528FF0] hover:bg-[#3A6FD8] text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors"
            >
              <span>Back to Automations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
