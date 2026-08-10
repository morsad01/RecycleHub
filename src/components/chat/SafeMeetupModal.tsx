import { useState } from 'react';
import { MapPin, ShieldCheck, CheckCircle2, X, Calendar, Clock } from 'lucide-react';
import { Button, Input, Modal } from '../ui';

interface SafeMeetupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (meetupDetails: string) => void;
}

export function SafeMeetupModal({ open, onClose, onConfirm }: SafeMeetupModalProps) {
  const [locationName, setLocationName] = useState('Bashundhara City Mall Food Court (Level 8)');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('15:00');
  const [checkedRules, setCheckedRules] = useState({
    daylight: true,
    public: true,
    inspect: true,
    noAdvance: true,
  });

  const handleConfirm = () => {
    const message = `📍 Proposed Safe Meetup on ResellBD:\n• Location: ${locationName}\n• Date: ${meetingDate || 'Tomorrow'}\n• Time: ${meetingTime}\n🛡️ Meetup Safety Rules: In-person hardware inspection & verified balance transfer.`;
    onConfirm(message);
    onClose();
  };

  const allRulesChecked = Object.values(checkedRules).every(Boolean);

  return (
    <Modal open={open} onClose={onClose} title="Propose Safe Public Meetup">
      <div className="space-y-4 text-xs text-neutral-600">
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <p>
            Choose a verified public zone in Bangladesh to safely inspect the item before confirming payment.
          </p>
        </div>

        <div>
          <label className="block text-neutral-700 font-semibold mb-1">Recommended Public Meetup Spot</label>
          <select
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-primary-500 focus:outline-none"
          >
            <option value="Bashundhara City Mall Food Court (Level 8)">Bashundhara City Mall Food Court (Level 8)</option>
            <option value="Jamuna Future Park Central Atrium">Jamuna Future Park Central Atrium</option>
            <option value="Dhaka Metro Rail MRT Station Concourse">Dhaka Metro Rail MRT Station Concourse</option>
            <option value="Shimanto Square Dhanmondi">Shimanto Square Dhanmondi</option>
            <option value="Police Plaza Concord Gulshan-1">Police Plaza Concord Gulshan-1</option>
            <option value="Bank Branch Lobby / ATM Zone">Bank Branch Lobby / ATM Zone</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
          <Input
            label="Time"
            type="time"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
          />
        </div>

        {/* Safety checklist */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <p className="font-bold text-neutral-800 text-2xs uppercase tracking-wide">Safety Checklist:</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedRules.daylight}
              onChange={(e) => setCheckedRules({ ...checkedRules, daylight: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600"
            />
            <span>Meeting scheduled during bright daylight hours</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedRules.noAdvance}
              onChange={(e) => setCheckedRules({ ...checkedRules, noAdvance: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600"
            />
            <span>No advance payments sent prior to in-person test</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedRules.inspect}
              onChange={(e) => setCheckedRules({ ...checkedRules, inspect: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600"
            />
            <span>I will thoroughly test IMEI, TrueTone, and hardware</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allRulesChecked}>
            Send Meetup Details
          </Button>
        </div>
      </div>
    </Modal>
  );
}
