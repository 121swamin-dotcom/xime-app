import { getAvailableSlots } from '../services/calendar.service.js';

// GET /api/calendar/slots
export async function getSlots(req, res) {
  try {
    const slots = await getAvailableSlots(2);
    return res.json(slots);
  } catch (err) {
    console.error('[Calendar] getSlots error:', err);
    return res.status(500).json({ error: 'Failed to fetch calendar slots' });
  }
}
