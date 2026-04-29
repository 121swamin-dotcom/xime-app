import { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { counsellingService } from '../services/admin.service.js';
import { calendarService } from '../services/placements.service.js';

const STATUS_ICON = {
  PENDING:   <AlertCircle size={14} className="text-amber-500" />,
  CONFIRMED: <CheckCircle size={14} className="text-green-500" />,
  DECLINED:  <XCircle    size={14} className="text-red-500" />,
};

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CounsellingPage() {
  const { data: requests } = useFetch(counsellingService.getMy);
  const { data: slots, loading: slotsLoading, error: slotsError } = useFetch(calendarService.getSlots);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [agenda, setAgenda]             = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  // Group slots by date
  const slotsByDate = useMemo(() => {
    if (!slots) return {};
    return slots.reduce((acc, s) => {
      if (!acc[s.date]) acc[s.date] = [];
      acc[s.date].push(s);
      return acc;
    }, {});
  }, [slots]);

  const availableDates = Object.keys(slotsByDate).filter((d) =>
    slotsByDate[d].some((s) => s.available)
  );

  const timesForDate = selectedDate ? slotsByDate[selectedDate] || [] : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedDate || !selectedTime || !agenda.trim()) {
      return setError('Please select a date, time and enter your agenda.');
    }
    setSaving(true);
    try {
      await counsellingService.request({
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        agenda,
      });
      setSuccess('Request submitted. Prof Swaminathan will confirm shortly.');
      setSelectedDate(''); setSelectedTime(''); setAgenda('');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Counselling" subtitle="Book a 30-minute slot with Prof Swaminathan N." />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking form */}
        <div>
          <div className="card p-5 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#CC0000]" /> Select a Date
            </h3>

            {slotsLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Spinner /> Loading availability from calendar…
              </div>
            )}

            {slotsError && (
              <Alert type="info" message="Calendar unavailable — please select any weekday date manually below." />
            )}

            {!slotsLoading && availableDates.length === 0 && !slotsError && (
              <p className="text-sm text-slate-400 py-2">No available slots in the next 2 weeks.</p>
            )}

            {/* Date grid */}
            {!slotsLoading && availableDates.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {availableDates.slice(0, 12).map((date) => {
                  const d = new Date(date + 'T00:00:00');
                  const freeCount = slotsByDate[date].filter((s) => s.available).length;
                  const isSelected = selectedDate === date;
                  return (
                    <button key={date}
                      onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                      className={`p-2.5 rounded-xl border text-center transition-all
                        ${isSelected
                          ? 'border-[#CC0000] bg-red-50'
                          : 'border-slate-200 hover:border-[#CC0000] hover:bg-red-50'}`}>
                      <p className="text-[10px] text-slate-400 font-medium">{DAY_LABELS[d.getDay()]}</p>
                      <p className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-[#CC0000]' : 'text-slate-700'}`}>
                        {d.getDate()}
                      </p>
                      <p className="text-[10px] text-green-600 font-medium mt-0.5">{freeCount} free</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Time slots for selected date */}
            {selectedDate && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Available Times — {formatDate(selectedDate)}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {timesForDate.map((slot) => (
                    <button key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all
                        ${!slot.available
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : selectedTime === slot.time
                          ? 'border-[#CC0000] bg-[#CC0000] text-white'
                          : 'border-slate-200 text-slate-600 hover:border-[#CC0000] hover:text-[#CC0000]'}`}>
                      {slot.time}
                      {!slot.available && <span className="block text-[9px] text-slate-300">Busy</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agenda + submit */}
          <form onSubmit={handleSubmit} className="card p-5">
            <Alert type="error"   message={error} />
            <Alert type="success" message={success} />

            {selectedDate && selectedTime && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
                <Clock size={14} className="text-[#CC0000]" />
                <span className="text-sm font-medium text-[#CC0000]">
                  {formatDate(selectedDate)} at {selectedTime} IST
                </span>
              </div>
            )}

            <label className="label">Agenda</label>
            <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)}
              rows={4} className="input-field resize-none mb-4"
              placeholder="What would you like to discuss?" />

            <button type="submit" disabled={saving || !selectedDate || !selectedTime}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
              {saving ? <><Spinner /> Submitting…</> : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My requests */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">My Requests</h3>
          {!requests?.length
            ? <p className="text-sm text-slate-400">No requests yet.</p>
            : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="card p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {STATUS_ICON[r.status]}
                          <span className="font-medium text-slate-700">{r.status}</span>
                        </div>
                        <p className="text-slate-500">
                          {new Date(r.preferred_date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })} at {r.preferred_time} IST
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.agenda}</p>
                        {r.professor_comment && (
                          <p className="text-xs text-slate-500 mt-1 italic">"{r.professor_comment}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
