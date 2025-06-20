import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Paper, Typography, CircularProgress, Tooltip } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { isPast } from 'date-fns';

function addRecurringEvents(chore) {
  const events = [];
  const { name, dateTime, repeat = 'none', section, doneDates = [], deletedDates = [], description } = chore;
  if (!dateTime) return events;
  let date = new Date(dateTime);
  const today = new Date();
  let count = 0;
  while (date <= new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()) && count < 500) {
    const iso = date.toISOString();
    if (!deletedDates?.includes(iso)) {
      const isDone = doneDates.includes(iso);
      events.push({
        title: name,
        date: iso,
        extendedProps: { section, isDone, dateTime: iso, description },
        color: isDone ? '#b2f2bb' : (isPast(date) && !isDone ? '#ffb3b3' : undefined)
      });
    }
    if (repeat === 'none') break;
    if (repeat === 'daily') date.setDate(date.getDate() + 1);
    else if (repeat === 'weekly') date.setDate(date.getDate() + 7);
    else if (repeat === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (repeat === 'yearly') date.setFullYear(date.getFullYear() + 1);
    else if (repeat === 'weekdays') { do { date.setDate(date.getDate() + 1); } while ([0, 6].includes(date.getDay())); }
    else break;
    count++;
  }
  return events;
}

export default function SharedCalendar() {
  const { userId } = useParams();
  const [chores, setChores] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setError('Invalid link.'); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getDoc(doc(db, 'chores', userId)),
      getDoc(doc(db, 'sections', userId))
    ]).then(([choreSnap, sectionSnap]) => {
      if (!choreSnap.exists()) {
        setError('No calendar found for this user.');
        setLoading(false);
        return;
      }
      setChores(choreSnap.data().chores || []);
      setSections(sectionSnap.exists() ? sectionSnap.data().sections || [] : []);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load calendar.');
      setLoading(false);
    });
  }, [userId]);

  const events = chores ? chores.flatMap(addRecurringEvents) : [];

  return (
    <Box sx={{bgcolor:'linear-gradient(120deg, #f5f7fa 60%, #e3f0ff 100%)', minHeight:'100vh', fontFamily:'Inter, system-ui, sans-serif', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <Paper elevation={4} sx={{maxWidth: 900, width:'100%', mx:'auto', my:6, p:{xs:2,sm:4}, borderRadius:5, boxShadow: '0 8px 32px #2563eb22'}}>
        <Typography variant="h5" sx={{mb:2, fontWeight:700, textAlign:'center', color:'#2563eb'}}>Shared Calendar</Typography>
        {loading ? (
          <Box sx={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:300}}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{textAlign:'center'}}>{error}</Typography>
        ) : (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="en"
              events={events}
              height="auto"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              nowIndicator={true}
              eventContent={renderEventContent}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              editable={false}
              selectable={false}
              eventClick={null}
              dateClick={null}
            />
          </LocalizationProvider>
        )}
      </Paper>
    </Box>
  );
}

function renderEventContent(arg) {
  const isDone = arg.event.extendedProps.isDone;
  const isOverdue = isPast(new Date(arg.event.start)) && !isDone;
  const description = arg.event.extendedProps.description;
  const maxLen = 18;
  const title = arg.event.title.length > maxLen ? arg.event.title.slice(0, maxLen) + '…' : arg.event.title;
  const tooltip = description ? `${arg.event.title}\n${description}` : arg.event.title;
  return (
    <Tooltip title={tooltip} arrow>
      <Box sx={{display:'flex', alignItems:'center', gap:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: '100%'}}>
        <span style={{textDecoration: isDone ? 'line-through' : undefined, color: isOverdue ? '#d32f2f' : undefined, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 120}}>{title}</span>
      </Box>
    </Tooltip>
  );
} 