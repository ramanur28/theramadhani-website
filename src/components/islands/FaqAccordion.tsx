import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
  title?: string;
}

export default function FaqAccordion({ items, title = 'Frequently Asked Questions' }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="my-12">
      {title && (
        <h2 className="font-display text-xl font-bold tracking-tight text-brand-text mb-6">
          {title}
        </h2>
      )}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.question}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? 'border-brand-accent/50 bg-brand-surface shadow-sm'
                  : 'border-brand-border bg-brand-card hover:border-brand-border-hover'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-brand-text focus:outline-none"
              >
                <span className="pr-4">{item.question}</span>
                <span
                  className={`text-brand-text-dim text-sm font-mono transition-transform duration-200 ${
                    isOpen ? 'rotate-45 text-brand-accent font-bold' : ''
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-brand-border px-4 pb-4 pt-3 sm:px-5 sm:pb-5 text-xs sm:text-sm leading-relaxed text-brand-text-muted">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}