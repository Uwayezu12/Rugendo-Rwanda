import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const CONTACT_INFO = [
    { icon: '📍', label: t('contactAddress'),   value: 'KN 5 Road, Kigali, Rwanda' },
    { icon: '📧', label: t('contactEmailLabel'), value: 'support@rugendorwanda.rw' },
    { icon: '📞', label: t('contactPhone'),      value: '+250 788 000 000' },
    { icon: '🕒', label: t('contactHours'),      value: 'Mon–Sat, 7:00 AM – 8:00 PM' },
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <section className="bg-hero-gradient text-white py-20">
        <div className="container-page text-center">
          <span className="badge-accent mb-4">{t('contactBadge')}</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('contactTitle')}</h1>
          <p className="text-slate-300 text-lg max-w-lg mx-auto">{t('contactSubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="grid md:grid-cols-5 gap-10">
            <div className="md:col-span-2 space-y-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('contactReachUs')}</h2>
              {CONTACT_INFO.map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-xl shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wide">{c.label}</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5">{c.value}</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#e8e3ff] dark:border-[#2d1a5e]">
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('contactNote')}</p>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="card">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('contactSentTitle')}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">{t('contactSentDesc')}</p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                      className="btn-secondary mt-6"
                    >
                      {t('contactSendAnother')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('contactSendMsg')}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">{t('contactYourName')}</label>
                        <input name="name" value={form.name} onChange={handleChange} required placeholder="Jean-Pierre Nkurunziza" className="input" />
                      </div>
                      <div>
                        <label className="label">{t('contactEmailAddress')}</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">{t('contactSubjectLabel')}</label>
                      <select name="subject" value={form.subject} onChange={handleChange} required className="input">
                        <option value="">{t('contactSelectTopic')}</option>
                        <option value="booking">{t('contactTopicBooking')}</option>
                        <option value="payment">{t('contactTopicPayment')}</option>
                        <option value="refund">{t('contactTopicRefund')}</option>
                        <option value="schedule">{t('contactTopicSchedule')}</option>
                        <option value="other">{t('contactTopicOther')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('contactMessage')}</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder={t('contactMsgPlaceholder')}
                        className="input resize-none"
                      />
                    </div>
                    <button type="submit" className="btn-gradient w-full">{t('contactSubmitBtn')}</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
