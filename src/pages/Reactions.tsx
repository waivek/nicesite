import { DateTime } from 'luxon';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Nav from '../components/Nav';

interface Reaction {
  name: string;
  type: string;
  url: string;
  timeStr: string;
  date: DateTime;
}

const getNextOccurrence = (timeStr: string) => {
    const baseDate = DateTime.fromFormat(timeStr, "ccc h:mm a", { zone: "Asia/Kolkata" });
    if (!baseDate.isValid) {
        throw new Error(`Invalid date format: ${timeStr}. Expected format: "ccc h:mm a"`);
    }
    const now = DateTime.now();
    let thisWeek = baseDate.set({ year: now.year, month: now.month, day: now.day });
    let closestPreviousOccurrence = thisWeek;

    while (thisWeek.weekdayLong.slice(0, 3) !== baseDate.weekdayLong.slice(0, 3)) {
        thisWeek = thisWeek.plus({ days: 1 });
        closestPreviousOccurrence = thisWeek;
    }

    if (closestPreviousOccurrence < now && now.minus({ hours: 3 }) <= closestPreviousOccurrence) {
        return closestPreviousOccurrence;
    }

    return thisWeek < now ? thisWeek.plus({ weeks: 1 }) : thisWeek;
};

const isWithinTimeWindow = (date: DateTime) => {
  if (!date?.isValid) return false;
  
  const now = DateTime.now();
  const dateStr = date.toISODate();
  const nowStr = now.toISODate();
  const minus12Hours = now.minus({ hours: 12 }).toISODate();
  const plus12Hours = now.plus({ hours: 12 }).toISODate();

  if (!dateStr || !nowStr || !minus12Hours || !plus12Hours) return false;

  return (
    (dateStr < nowStr && minus12Hours <= dateStr) || 
    dateStr <= plus12Hours
  );
};

const Reactions = () => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showForm, setShowForm] = useState(() => {
    const stored = localStorage.getItem('reactions');
    return !stored || JSON.parse(stored).length === 0;
  });
  const [newReaction, setNewReaction] = useState({
    name: '',
    type: '',
    url: '',
    timeStr: ''
  });
  const [timeParseResult, setTimeParseResult] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('reactions');
    if (stored) {
      const parsed = JSON.parse(stored);
      setReactions(parsed.map((r: any) => ({
        ...r,
        date: getNextOccurrence(r.timeStr)
      })));
    }
  }, []);

  const handleTimeSelection = (day: string, time: string) => {
    console.log('handleTimeSelection called with:', { day, time, selectedDay, selectedTime });
    setSelectedDay(day);
    setSelectedTime(time);
    
    if (!day || !time) return;
    
    // Clean up the time string and use a simpler timezone format
    const timeStr = `${day} ${time.trim()}`;
    
    console.log('timeStr created:', timeStr);
    console.log('Format being used:', "ccc h:mm a");
    
    const testDate = DateTime.fromFormat(timeStr, "ccc h:mm a", { zone: "Asia/Kolkata" });
    console.log('testDate parse result:', {
      isValid: testDate.isValid,
      invalidReason: testDate.invalidReason,
      invalidExplanation: testDate.invalidExplanation,
      input: timeStr,
      format: "ccc h:mm a",
      parsed: testDate.toString()
    });
    
    setNewReaction({ ...newReaction, timeStr });
    setTimeParseResult(
      testDate.isValid 
        ? `✅ Will occur: ${testDate.toFormat("MMM d, ccc h:mm a ZZZ")}` 
        : `❌ Error: ${testDate.invalidReason}`
    );
  };
  const clearStorage = () => {
    if (window.confirm('Are you sure you want to clear all reactions?')) {
      localStorage.removeItem('reactions');
      setReactions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reaction = {
      ...newReaction,
      date: getNextOccurrence(newReaction.timeStr)
    };
    const updatedReactions = [...reactions, reaction];
    setReactions(updatedReactions);
    localStorage.setItem('reactions', JSON.stringify(updatedReactions));
    setNewReaction({ name: '', type: '', url: '', timeStr: '' });
    setSelectedDay('');  // Add this
    setSelectedTime(''); // Add this
    setShowForm(false);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default action
    e.stopPropagation(); // Prevent triggering the parent card's click handler
    
    if (window.confirm('Are you sure you want to delete this reaction?')) {
      const newReactions = reactions.filter((_, i) => i !== index);
      setReactions(newReactions);
      localStorage.setItem('reactions', JSON.stringify(newReactions));
    }
  };

  // Add this new function before the return statement
  const addDummyData = () => {
    const dummyReactions = [
      {
        name: "Community Call",
        type: "Community",
        url: "https://example.com/call",
        timeStr: "Wed 9:30 PM",
        date: getNextOccurrence("Wed 9:30 PM")
      },
      {
        name: "Team Sync",
        type: "Work",
        url: "https://example.com/sync",
        timeStr: "Mon 10:00 AM",
        date: getNextOccurrence("Mon 10:00 AM")
      }
    ];
    
    const updatedReactions = [...reactions, ...dummyReactions];
    setReactions(updatedReactions);
    localStorage.setItem('reactions', JSON.stringify(updatedReactions));
  };

  return (
    <>
      <Helmet>
        <title>Reactions</title>
      </Helmet>
      <div className="min-h-screen w-screen bg-slate-900 text-white font-sans">
        <Nav />
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4">
          <div className="flex flex-col justify-between items-center py-4 md:flex-row">
            <h1 className="text-4xl font-semibold mb-4 md:mb-0">Reactions</h1>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowForm(!showForm)}
                className="px-2 py-1 transition-colors border-slate-700 bg-slate-800/50 rounded-lg border-2 hover:border-white hover:bg-slate-900 shadow-lg hover:shadow-xl flex items-center gap-2 md:px-4 md:py-2"
              >
                <span className="material-icons text-base md:text-xl">
                  {showForm ? 'close' : 'add_circle'}
                </span>
                <span className="tracking-widest uppercase text-sm md:text-base">
                  {showForm ? 'Cancel' : 'Add New'}
                </span>
              </button>
              <button 
                onClick={addDummyData}
                className="px-2 py-1 transition-colors border-slate-700 bg-slate-800/50 rounded-lg border-2 hover:border-white hover:bg-slate-900 shadow-lg hover:shadow-xl flex items-center gap-2 md:px-4 md:py-2"
              >
                <span className="material-icons text-base md:text-xl">dataset</span>
                <span className="tracking-widest uppercase text-sm md:text-base">Add Dummy</span>
              </button>
              <button 
                onClick={clearStorage}
                className="px-2 py-1 transition-colors border-slate-700 bg-slate-800/50 rounded-lg border-2 hover:border-white hover:bg-slate-900 shadow-lg hover:shadow-xl flex items-center gap-2 md:px-4 md:py-2"
              >
                <span className="material-icons text-base md:text-xl">delete</span>
                <span className="tracking-widest uppercase text-sm md:text-base">Clear All</span>
              </button>
            </div>
          </div>

          <div className="text-center text-gray-400 mb-8">
            Current Time: {DateTime.now().setZone("Asia/Kolkata").toFormat("MMM d, ccc ")}
            <span className="text-white font-semibold">
              {DateTime.now().setZone("Asia/Kolkata").toFormat("h:mma")}
            </span>
            {" " + DateTime.now().setZone("Asia/Kolkata").toFormat("ZZZ")}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-700 rounded-lg">
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newReaction.name}
                  onChange={e => setNewReaction({...newReaction, name: e.target.value})}
                  className="p-2 rounded bg-gray-800 border border-slate-700"
                  required
                />
                <input
                  type="text"
                  placeholder="Type (e.g., Community, Friends)"
                  value={newReaction.type}
                  onChange={e => setNewReaction({...newReaction, type: e.target.value})}
                  className="p-2 rounded bg-gray-800 border border-slate-700"
                  required
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newReaction.url}
                  onChange={e => setNewReaction({...newReaction, url: e.target.value})}
                  className="p-2 rounded bg-gray-800 border border-slate-700"
                  required
                />
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <select
                      value={selectedDay}
                      onChange={e => handleTimeSelection(e.target.value, selectedTime)}
                      className="p-2 rounded bg-gray-800 border border-slate-700 flex-1"
                      required
                    >
                      <option value="">Select Day</option>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={selectedTime}
                      onChange={e => handleTimeSelection(selectedDay, e.target.value)}
                      className="p-2 rounded bg-gray-800 border border-slate-700 flex-1"
                      required
                    >
                      <option value="">Select Time</option>
                      {[
                        '12:00 AM', '12:30 AM', 
                        '1:00 AM', '1:30 AM', 
                        '2:00 AM', '2:30 AM',
                        '3:00 AM', '3:30 AM',
                        '4:00 AM', '4:30 AM',
                        '5:00 AM', '5:30 AM',
                        '6:00 AM', '6:30 AM',
                        '7:00 AM', '7:30 AM',
                        '8:00 AM', '8:30 AM',
                        '9:00 AM', '9:30 AM',
                        '10:00 AM', '10:30 AM',
                        '11:00 AM', '11:30 AM',
                        '12:00 PM', '12:30 PM',
                        '1:00 PM', '1:30 PM',
                        '2:00 PM', '2:30 PM',
                        '3:00 PM', '3:30 PM',
                        '4:00 PM', '4:30 PM',
                        '5:00 PM', '5:30 PM',
                        '6:00 PM', '6:30 PM',
                        '7:00 PM', '7:30 PM',
                        '8:00 PM', '8:30 PM',
                        '9:00 PM', '9:30 PM', 
                        '10:00 PM', '10:30 PM',
                        '11:00 PM', '11:30 PM'
                      ].map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  {newReaction.timeStr && (
                    <div className={timeParseResult.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                      {timeParseResult}
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  className="px-4 py-2 transition-colors border border-slate-700 bg-slate-800/50 rounded-lg hover:bg-slate-900 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
                >
                  <span className="material-icons text-xl">add_circle</span>
                  <span className="tracking-widest uppercase">Add Reaction</span>
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-4">
            {[...reactions]
              .sort((a, b) => {
                 
                // Otherwise, sort by normal time
                return a.date.toMillis() - b.date.toMillis();
              })
              .map((reaction, index) => (
              <div 
                key={index} 
                onClick={() => window.open(reaction.url, '_blank', 'noopener,noreferrer')}
                className="w-full border-2 border-slate-700 rounded-lg hover:bg-slate-900 hover:border-white overflow-clip
                transition-colors cursor-pointer shadow-lg hover:shadow-xl bg-slate-800/50"
              >
                <div className="text-xs leading-tight flex items-center gap-2 ">
                  <span className={`pl-4 pr-2 py-1 rounded-tl font-medium ${
                    reaction.date?.isValid && isWithinTimeWindow(reaction.date)
                      ? 'bg-green-900/50 text-green-400' 
                      : ''
                  }`}>
                    {reaction.date?.isValid ? reaction.date.toRelative() : ''}
                  </span>
                  <span className="text-slate-400 flex-1">
                    {reaction.date.isValid ? 
                      reaction.date.toFormat("MMM d, ccc h:mma ZZZ") : 
                      `ERROR: ${reaction.date.invalidReason} - ${reaction.date.invalidExplanation}`
                    }
                  </span>
                  <span 
                    onClick={e => handleDelete(index, e)}
                    className="transition-colors text-white rounded-tr px-2 py-1 cursor-pointer hover:bg-red-900 hover:text-red-500 tracking-widest uppercase"
                  >
                    delete
                  </span>
                </div>
                
                <div className="border-t border-inherit"></div>
                <div className="flex justify-between items-center p-4">
                  <div className="text-xl text-slate-100 flex items-center gap-2">
                    <span className="font-bold uppercase tracking-widest">{reaction.type}</span>
                    <span className="text-md text-slate-500">{reaction.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reactions;
